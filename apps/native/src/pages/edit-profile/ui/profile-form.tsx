import {
  BIO_MAX_LENGTH,
  type OwnProfile,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@lardon/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { Stack, router } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, type TextInput, View } from "react-native";

import { familiesQuery } from "#/entities/family";
import { ownProfileQuery } from "#/entities/profile";
import { apiErrorMessage, requestApi } from "#/shared/api";
import { authClient } from "#/shared/auth";
import { GroupedSection, InlineError } from "#/shared/ui";

import { FieldRow } from "./field-row";

export function ProfileForm({ profile }: { profile: OwnProfile | null }) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const savedName = session?.user.name ?? "";
  const [name, setName] = useState(savedName);
  const usernameInput = useRef<TextInput>(null);
  const bioInput = useRef<TextInput>(null);
  const trimmedName = name.trim();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const trimmedBio = bio.trim();

  const isProfileChanged = username !== profile?.username || trimmedBio !== (profile?.bio ?? "");

  const isChanged = isProfileChanged || trimmedName !== savedName;

  const save = useMutation({
    networkMode: "always",
    mutationFn: async () => {
      if (trimmedName !== savedName) {
        const { error } = await authClient.updateUser({ name: trimmedName });

        if (error) throw new Error(error.message);
      }

      if (isProfileChanged) {
        queryClient.setQueryData(
          ownProfileQuery.queryKey,
          await requestApi((client) =>
            client.profiles.save({ payload: { username, bio: trimmedBio } }),
          ),
        );
      }
    },
    onSuccess: async () => {
      await Promise.all(
        [ownProfileQuery.queryKey, ["profiles"], familiesQuery.queryKey].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
      await notificationAsync(NotificationFeedbackType.Success);
      router.back();
    },
  });

  const canSave =
    trimmedName.length > 0 &&
    username.length >= USERNAME_MIN_LENGTH &&
    isChanged &&
    !save.isPending;

  return (
    <>
      <Stack.Toolbar placement="right">
        {save.isPending ? (
          <Stack.Toolbar.View>
            <ActivityIndicator />
          </Stack.Toolbar.View>
        ) : (
          <Stack.Toolbar.Button variant="done" disabled={!canSave} onPress={() => save.mutate()}>
            {profile ? "Save" : "Create"}
          </Stack.Toolbar.Button>
        )}
      </Stack.Toolbar>
      <GroupedSection
        footer={
          username.length > 0 && username.length < USERNAME_MIN_LENGTH
            ? `Usernames have at least ${USERNAME_MIN_LENGTH} characters.`
            : "People find you only by your exact username."
        }
      >
        <FieldRow
          label="Name"
          isFirst
          value={name}
          onChangeText={(text) => {
            setName(text);
            save.reset();
          }}
          placeholder="Your name"
          maxLength={80}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => usernameInput.current?.focus()}
        />
        <FieldRow
          ref={usernameInput}
          label="Username"
          prefix="@"
          value={username}
          onChangeText={(text) => {
            setUsername(
              text
                .toLowerCase()
                .replace(/^@/, "")
                .replace(/[^a-z0-9_.]/g, ""),
            );
            save.reset();
          }}
          placeholder="yourname"
          maxLength={USERNAME_MAX_LENGTH}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username-new"
          keyboardType="ascii-capable"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => bioInput.current?.focus()}
        />
        <FieldRow
          ref={bioInput}
          label="Bio"
          value={bio}
          onChangeText={(text) => {
            setBio(text);
            save.reset();
          }}
          placeholder="What you like to cook"
          maxLength={BIO_MAX_LENGTH}
          autoCapitalize="sentences"
          returnKeyType="done"
          onSubmitEditing={() => canSave && save.mutate()}
        />
      </GroupedSection>
      {save.isError && (
        <View className="items-start px-8 pt-3">
          <InlineError>
            {apiErrorMessage(
              save.error,
              "Couldn't save your profile. Check your connection and try again.",
            )}
          </InlineError>
        </View>
      )}
    </>
  );
}
