import { useMutation } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { apiErrorMessage, requestApi } from "#/shared/api";
import { Button, ButtonLabel, InlineError, SheetContent, TextBox } from "#/shared/ui";

import { useStoreFamily } from "../model/use-store-family";

export function JoinFamilySheet() {
  const storeFamily = useStoreFamily();
  const [code, setCode] = useState("");
  const characters = code.replaceAll("-", "");

  const join = useMutation({
    mutationFn: () => requestApi((client) => client.families.join({ payload: { code } })),
    onSuccess: async (family) => {
      await storeFamily(family);
      router.dismiss();
      router.push("/settings/family");
    },
  });

  function submit() {
    if (characters.length === 12 && !join.isPending) join.mutate();
  }

  return (
    <>
      <Stack.Screen options={{ title: "Join a family" }} />
      <SheetContent className="gap-4 px-6 pt-2 pb-8">
        <Text className="text-body text-muted">
          Ask someone in the family for an invite code. Recipes you already have stay private until
          you share them.
        </Text>
        <View className="gap-5">
          <View className="gap-1.5">
            <TextBox
              value={code}
              onChangeText={(text) =>
                setCode(
                  (
                    text
                      .toLocaleUpperCase()
                      .replaceAll(/[^0-9A-Z]/g, "")
                      .slice(0, 12)
                      .match(/.{1,4}/g) ?? []
                  ).join("-"),
                )
              }
              placeholder="XXXX-XXXX-XXXX"
              autoFocus
              autoCapitalize="characters"
              autoCorrect={false}
              spellCheck={false}
              returnKeyType="join"
              editable={!join.isPending}
              onSubmitEditing={submit}
              style={{ letterSpacing: 1.5 }}
            />
            <View className="min-h-4.5">
              {join.error && (
                <InlineError variant="text">
                  {apiErrorMessage(join.error, "Couldn't join. Check your connection.")}
                </InlineError>
              )}
            </View>
          </View>
          <Button isDisabled={characters.length !== 12} isLoading={join.isPending} onPress={submit}>
            <ButtonLabel>Join family</ButtonLabel>
          </Button>
        </View>
      </SheetContent>
    </>
  );
}
