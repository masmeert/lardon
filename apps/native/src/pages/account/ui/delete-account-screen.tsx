import { useMutation, useQuery } from "@tanstack/react-query";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { familiesQuery, useDeleteAccount } from "#/entities/family";
import { authClient, describeSignInCodeError } from "#/shared/auth";
import { iconSize, useThemeColors } from "#/shared/lib";
import {
  Button,
  ButtonLabel,
  CodeInput,
  Icon,
  InlineError,
  KeyboardFooter,
  RollingNumber,
} from "#/shared/ui";

const sessionFreshForMs = 23 * 60 * 60 * 1000;

export function DeleteAccountScreen() {
  const { danger } = useThemeColors("danger");
  const headerHeight = useHeaderHeight();
  const { data: session } = authClient.useSession();
  const { data: families = [] } = useQuery(familiesQuery);
  const family = families.find((candidate) => !candidate.personal);
  const deleteAccount = useDeleteAccount();
  const email = session?.user.email ?? "";
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [resendInSeconds, setResendInSeconds] = useState(0);

  const [needsCode, setNeedsCode] = useState(
    () =>
      !session || Date.now() - new Date(session.session.createdAt).getTime() > sessionFreshForMs,
  );

  useEffect(() => {
    if (resendInSeconds === 0) return;

    const timeout = setTimeout(() => setResendInSeconds((seconds) => seconds - 1), 1000);

    return () => clearTimeout(timeout);
  }, [resendInSeconds]);

  const sendCode = useMutation({
    networkMode: "always",
    mutationFn: async () => {
      const { error } = await authClient.emailOtp
        .sendVerificationOtp({ email, type: "sign-in" })
        .catch(() => ({ error: { status: 0, message: undefined } }));

      if (error) {
        throw new Error(
          (error.status >= 400 && error.message) ||
            "Couldn't send the code. Check your connection.",
        );
      }
    },
    onSuccess: () => {
      setCode("");
      setIsCodeSent(true);
      setResendInSeconds(60);
    },
  });

  const confirmIdentity = useMutation({
    networkMode: "always",
    mutationFn: async () => {
      const { error } = await authClient.signIn
        .emailOtp({ email, otp: code })
        .catch(() => ({ error: { status: 0, code: undefined, message: undefined } }));

      if (error) {
        throw new Error(
          describeSignInCodeError(error.code) ??
            ((error.status >= 400 && error.message) ||
              "Couldn't check the code. Check your connection."),
        );
      }
    },
  });

  const isBusy = confirmIdentity.isPending || deleteAccount.isPending;

  const error =
    sendCode.error?.message ??
    confirmIdentity.error?.message ??
    (deleteAccount.error &&
      (deleteAccount.error.cause === "SESSION_EXPIRED"
        ? "Confirm it's you with a code first."
        : "Couldn't delete it. Check your connection."));

  function confirmDelete() {
    Alert.alert("Delete your account?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete account",
        style: "destructive",
        onPress: () => {
          void (needsCode ? confirmIdentity.mutateAsync() : Promise.resolve()).then(
            () =>
              deleteAccount.mutate(undefined, {
                onError: (failure) => {
                  if (failure.cause === "SESSION_EXPIRED") setNeedsCode(true);
                },
              }),
            () => undefined,
          );
        },
      },
    ]);
  }

  if (isCodeSent) {
    return (
      <View style={{ paddingTop: headerHeight }} className="flex-1 bg-background">
        <View className="flex-1 gap-5 px-6 pt-4">
          <View className="gap-1">
            <Text className="text-headline font-medium text-muted">
              We've sent a 6-digit code to{"\n"}
              <Text className="font-normal text-foreground">{email}</Text>
            </Text>
            <Text className="font-normal text-body text-muted">
              Enter it to confirm it's you. It can take a minute to arrive.
            </Text>
          </View>
          <View className="gap-2">
            <View className="rounded-card bg-fill p-2">
              <CodeInput value={code} onChange={setCode} isDisabled={isBusy} autoFocus />
            </View>
            {error && <InlineError>{error}</InlineError>}
          </View>
        </View>
        <KeyboardFooter>
          <Button
            variant="secondary"
            onPress={() => sendCode.mutate()}
            isDisabled={resendInSeconds > 0 || isBusy}
            isLoading={sendCode.isPending}
            className="flex-1"
          >
            <View className="flex-row items-center">
              <ButtonLabel>{resendInSeconds > 0 ? "Resend (" : "Resend"}</ButtonLabel>
              {resendInSeconds > 0 && (
                <>
                  <RollingNumber
                    value={resendInSeconds}
                    className="text-body font-medium text-foreground"
                  />
                  <ButtonLabel>)</ButtonLabel>
                </>
              )}
            </View>
          </Button>
          <Button
            variant="danger"
            onPress={confirmDelete}
            isDisabled={code.length !== 6}
            isLoading={isBusy}
            className="flex-1"
          >
            <ButtonLabel>Delete account</ButtonLabel>
          </Button>
        </KeyboardFooter>
      </View>
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="pb-16">
      <View className="items-center gap-4 px-8 pt-4">
        <View className="size-16 items-center justify-center rounded-full bg-danger-soft">
          <Icon name="exclamationmark.triangle.fill" size={iconSize.xl} color={danger} />
        </View>
        <View className="items-center gap-2">
          <Text className="text-headline font-semibold text-foreground">Delete your account?</Text>
          <Text className="text-center text-body text-muted">
            {[
              "Your account and private recipes will be deleted for good.",
              family &&
                (family.memberCount > 1
                  ? `Shared recipes stay with ${family.name}.`
                  : `${family.name} and its recipes will be deleted too.`),
            ]
              .filter(Boolean)
              .join(" ")}
          </Text>
        </View>
      </View>
      <View className="gap-3 px-4 pt-8">
        <View className="min-h-4.5">
          {error && <InlineError variant="text">{error}</InlineError>}
        </View>
        <Button
          variant="danger"
          isLoading={sendCode.isPending || isBusy}
          onPress={needsCode ? () => sendCode.mutate() : confirmDelete}
        >
          <ButtonLabel>Delete account</ButtonLabel>
        </Button>
        {needsCode && (
          <Text className="text-center text-label text-muted">
            We'll email you a code to confirm it's you.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
