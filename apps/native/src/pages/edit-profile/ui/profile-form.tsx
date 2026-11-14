import {
  BIO_MAX_LENGTH,
  type OwnProfile,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@lardon/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { useRef, useState } from "react";
import { Text, type TextInput, View } from "react-native";

import { familiesQuery } from "#/entities/family";
import { ownProfileQuery } from "#/entities/profile";
import { apiErrorMessage, requestApi } from "#/shared/api";
import { authClient } from "#/shared/auth";
import { Button, ButtonLabel, InlineError, TextBox } from "#/shared/ui";

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
    },
  });

  const canSave =
    trimmedName.length > 0 &&
    username.length >= USERNAME_MIN_LENGTH &&
    isChanged &&
    !save.isPending;

  return (
    <View className="gap-3 px-4 pt-6">
      <View className="gap-2">
        <Text accessibilityRole="header" className="pl-4 text-caption text-muted">
          Name
        </Text>
        <TextBox
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
          clearButtonMode="while-editing"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => usernameInput.current?.focus()}
        />
      </View>
      <View className="gap-2">
        <Text accessibilityRole="header" className="pl-4 text-caption text-muted">
          Username
        </Text>
        <TextBox
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
          clearButtonMode="while-editing"
          ref={usernameInput}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => bioInput.current?.focus()}
        />
        <Text className="px-4 text-caption text-muted">
          {`${USERNAME_MIN_LENGTH} to ${USERNAME_MAX_LENGTH} characters: letters, numbers, dots and underscores. People need it exactly to find you.`}
        </Text>
      </View>
      <View className="gap-2">
        <Text accessibilityRole="header" className="pl-4 text-caption text-muted">
          Bio
        </Text>
        <TextBox
          value={bio}
          onChangeText={(text) => {
            setBio(text);
            save.reset();
          }}
          placeholder="What do you like to cook?"
          maxLength={BIO_MAX_LENGTH}
          autoCapitalize="sentences"
          clearButtonMode="while-editing"
          ref={bioInput}
          returnKeyType="done"
          onSubmitEditing={() => canSave && save.mutate()}
        />
      </View>
      {save.isError && (
        <InlineError>
          {apiErrorMessage(
            save.error,
            "Couldn't save your profile. Check your connection and try again.",
          )}
        </InlineError>
      )}
      <Button isDisabled={!canSave} isLoading={save.isPending} onPress={() => save.mutate()}>
        <ButtonLabel>
          {save.isSuccess && !isChanged ? "Saved" : profile ? "Save" : "Create profile"}
        </ButtonLabel>
      </Button>
    </View>
  );
}
