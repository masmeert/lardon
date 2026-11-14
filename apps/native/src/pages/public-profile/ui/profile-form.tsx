import {
  BIO_MAX_LENGTH,
  type OwnProfile,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@lardon/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { useState } from "react";
import { Text, View } from "react-native";

import { ownProfileQuery } from "#/entities/profile";
import { apiErrorMessage, requestApi } from "#/shared/api";
import { Button, ButtonLabel, InlineError, TextBox } from "#/shared/ui";

export function ProfileForm({ profile }: { profile: OwnProfile | null }) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const trimmedBio = bio.trim();

  const save = useMutation({
    networkMode: "always",
    mutationFn: () =>
      requestApi((client) => client.profiles.save({ payload: { username, bio: trimmedBio } })),
    onSuccess: async (saved) => {
      queryClient.setQueryData(ownProfileQuery.queryKey, saved);
      await queryClient.invalidateQueries({ queryKey: ["profiles"] });
      await notificationAsync(NotificationFeedbackType.Success);
    },
  });

  const isChanged = username !== profile?.username || trimmedBio !== (profile?.bio ?? "");
  const canSave = username.length >= USERNAME_MIN_LENGTH && isChanged && !save.isPending;

  return (
    <View className="gap-3 px-4 pt-6">
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
