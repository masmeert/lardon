import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from "@lardon/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Predicate } from "effect";
import { Stack, router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { PersonRow, profileQuery } from "#/entities/profile";
import { apiErrorMessage } from "#/shared/api";
import { Button, ButtonLabel, InlineError, SheetContent, TextBox } from "#/shared/ui";

export function PeopleSearchSheet() {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");

  const search = useMutation({
    networkMode: "always",
    mutationFn: (exact: string) => queryClient.fetchQuery(profileQuery(exact)),
  });

  const canSearch = username.length >= USERNAME_MIN_LENGTH && !search.isPending;

  function submit() {
    if (canSearch) search.mutate(username);
  }

  return (
    <>
      <Stack.Screen options={{ title: "Find people" }} />
      <SheetContent className="gap-4 px-6 pt-2 pb-8">
        <View className="gap-2">
          <TextBox
            value={username}
            onChangeText={(text) => {
              setUsername(
                text
                  .toLowerCase()
                  .replace(/^@/, "")
                  .replace(/[^a-z0-9_.]/g, ""),
              );
              search.reset();
            }}
            placeholder="Their exact username"
            maxLength={USERNAME_MAX_LENGTH}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            keyboardType="ascii-capable"
            clearButtonMode="while-editing"
            returnKeyType="search"
            enablesReturnKeyAutomatically
            onSubmitEditing={submit}
          />
          {search.isError && (
            <InlineError>
              {Predicate.isTagged(search.error, "NotFound")
                ? `No one has the username @${search.variables}. Check the spelling with them.`
                : apiErrorMessage(
                    search.error,
                    "Couldn't search. Check your connection and try again.",
                  )}
            </InlineError>
          )}
        </View>
        {search.data && (
          <View
            style={{ borderCurve: "continuous" }}
            className="overflow-hidden rounded-card bg-paper"
          >
            <PersonRow
              person={search.data}
              detail={
                search.data.isSelf
                  ? "That's you"
                  : {
                      none: `@${search.data.username}`,
                      pending: "Requested",
                      approved: "Following",
                    }[search.data.following]
              }
              isFirst
              onPress={() => {
                const found = search.data.username;

                router.dismiss();
                router.push({ pathname: "/u/[username]", params: { username: found } });
              }}
            />
          </View>
        )}
        {!search.data && (
          <Button isDisabled={!canSearch} isLoading={search.isPending} onPress={submit}>
            <ButtonLabel>Search</ButtonLabel>
          </Button>
        )}
      </SheetContent>
    </>
  );
}
