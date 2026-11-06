import { useAtomSet } from "@effect/atom-react";
import { ImageKey } from "@lardon/api";
import { personalStoreId } from "@lardon/recipes/store-id";
import { Exit, Schema } from "effect";
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Button, Input, Spinner, Typography, useThemeColor } from "heroui-native";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { InlineError } from "@/components/inline-error";
import { UserAvatar } from "@/components/user-avatar";
import { authClient } from "@/lib/auth-client";
import { ENV } from "@/src/env";
import { deleteImageAtom, uploadImageAtom } from "@/utils/api";

export default function ProfileScreen() {
  const { data: session } = authClient.useSession();
  const accentForegroundColor = useThemeColor("accent-foreground");
  const uploadImage = useAtomSet(uploadImageAtom, { mode: "promiseExit" });
  const deleteImage = useAtomSet(deleteImageAtom, { mode: "promiseExit" });
  const [name, setName] = useState(session?.user.name ?? "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string>();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string>();
  const canSaveName = name.trim() !== "" && name.trim() !== session?.user.name && !isSavingName;

  async function changePhoto() {
    setPhotoError(undefined);

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
    });

    const asset = picked.assets?.[0];

    if (picked.canceled || !asset || !session) {
      return;
    }

    setIsUploadingPhoto(true);

    const hasFailed = await ImageManipulator.manipulate(asset.uri)
      .resize({ width: 512 })
      .renderAsync()
      .then((image) => image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 }))
      .then((photo) => new File(photo.uri).bytes())
      .then((bytes) =>
        uploadImage({ params: { storeId: personalStoreId(session.user.id) }, payload: bytes }),
      )
      .then(
        async (exit) =>
          Exit.isFailure(exit) ||
          Boolean(
            (
              await authClient.updateUser({
                image: `${ENV.EXPO_PUBLIC_SERVER_URL}/images/${exit.value.imageKey}`,
              })
            ).error,
          ),
      )
      .catch(() => true);

    setIsUploadingPhoto(false);

    if (hasFailed) {
      setPhotoError("Couldn't update your photo. Check your connection and try again.");

      return;
    }

    const previousImageKey = session.user.image?.replace(
      `${ENV.EXPO_PUBLIC_SERVER_URL}/images/`,
      "",
    );

    if (Schema.is(ImageKey)(previousImageKey)) {
      // SAFETY: ImageKey only matches "<storeId>/<fileName>", so splitting yields exactly two parts.
      const [storeId, fileName] = previousImageKey.split("/") as [string, string];
      void deleteImage({ params: { storeId, fileName } });
    }
  }

  async function saveName() {
    if (!canSaveName) {
      return;
    }

    setIsSavingName(true);
    setNameError(undefined);

    const { error } = await authClient
      .updateUser({ name: name.trim() })
      .catch(() => ({ error: { message: undefined } }));

    setIsSavingName(false);

    if (error) {
      setNameError("Couldn't save your name. Check your connection and try again.");
    }
  }

  return (
    <View className="gap-6 px-5 pb-6 pt-8">
      <View className="items-center gap-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change photo"
          disabled={isUploadingPhoto}
          onPress={() => void changePhoto()}
        >
          <UserAvatar size="lg" />
          {isUploadingPhoto && (
            <View className="absolute inset-0.5 items-center justify-center rounded-full bg-black/40">
              <Spinner size="sm" color="white" />
            </View>
          )}
        </Pressable>
        <Button
          variant="ghost"
          size="sm"
          isDisabled={isUploadingPhoto}
          onPress={() => void changePhoto()}
        >
          <Button.Label>{isUploadingPhoto ? "Uploading…" : "Change photo"}</Button.Label>
        </Button>
        {photoError && <InlineError>{photoError}</InlineError>}
      </View>

      <View className="gap-2">
        <Typography className="text-[15px] font-medium text-muted">Name</Typography>
        <View className="flex-row gap-2">
          <Input
            variant="primary"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setNameError(undefined);
            }}
            editable={!isSavingName}
            placeholder="Your name"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="done"
            onSubmitEditing={() => void saveName()}
            className="flex-1"
          />
          {name.trim() !== (session?.user.name ?? "") && (
            <Button
              onPress={() => void saveName()}
              isDisabled={!canSaveName}
              className="rounded-full"
            >
              {isSavingName ? (
                <Spinner size="sm" color={accentForegroundColor} />
              ) : (
                <Button.Label>Save</Button.Label>
              )}
            </Button>
          )}
        </View>
        {nameError && <InlineError>{nameError}</InlineError>}
      </View>

      <View className="gap-1">
        <Typography className="text-[15px] font-medium text-muted">Email</Typography>
        <Typography className="text-base text-foreground">{session?.user.email}</Typography>
      </View>

      <Button
        variant="danger-soft"
        onPress={() => router.push("/settings/delete-account")}
        className="rounded-full"
      >
        <Button.Label>Delete account</Button.Label>
      </Button>
    </View>
  );
}
