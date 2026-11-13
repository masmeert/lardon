import { Schema } from "effect";
import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { authClient } from "#/shared/auth";
import { Button, ButtonLabel, Icon, InlineError, LardonLogo } from "#/shared/ui";
import { iconSize, useThemeColor } from "#/shared/lib";

import { Hero } from "./hero";
import { LegalFooter } from "./legal-footer";

export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const whiteColor = useThemeColor("white");
  const foregroundColor = useThemeColor("foreground");
  const [pendingProvider, setPendingProvider] = useState<"apple" | "google">();
  const [error, setError] = useState<string>();
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  useEffect(() => {
    void AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable);
  }, []);

  async function signInWithApple() {
    setPendingProvider("apple");
    setError(undefined);

    const errorCode = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    })
      .then(
        async (credential) => {
          if (!credential.identityToken) {
            return "MISSING_TOKEN";
          }

          const { error: signInError } = await authClient.signIn.social({
            provider: "apple",
            idToken: {
              token: credential.identityToken,
              user: {
                name: {
                  firstName: credential.fullName?.givenName ?? undefined,
                  lastName: credential.fullName?.familyName ?? undefined,
                },
                email: credential.email ?? undefined,
              },
            },
          });

          return signInError ? (signInError.code ?? "UNKNOWN") : undefined;
        },
        (appleError) =>
          Schema.is(Schema.Struct({ code: Schema.Literal("ERR_REQUEST_CANCELED") }))(appleError)
            ? undefined
            : "UNKNOWN",
      )
      .catch(() => "NETWORK");

    setPendingProvider(undefined);

    if (errorCode) {
      setError(signInErrorMessage("Apple", errorCode));
    }
  }

  async function signInWithGoogle() {
    setPendingProvider("google");
    setError(undefined);

    const errorCode = await authClient.signIn.social({ provider: "google", callbackURL: "/" }).then(
      ({ error: signInError }) => (signInError ? (signInError.code ?? "UNKNOWN") : undefined),
      () => "NETWORK",
    );

    setPendingProvider(undefined);

    if (errorCode) {
      setError(signInErrorMessage("Google", errorCode));
    }
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 justify-center gap-8">
        <Hero />

        <View className="items-center gap-4 px-8">
          <LardonLogo height={40} color={foregroundColor} />
          <Text className="text-center font-normal text-body text-muted">
            Keep your family's recipes in one place and cook them together.
          </Text>
        </View>
      </View>

      <View className="gap-3 px-6 pb-4 pt-6">
        {error && (
          <View className="absolute inset-x-6 -top-4.5">
            <InlineError>{error}</InlineError>
          </View>
        )}

        <Button
          accessibilityLabel="Continue with email"
          onPress={() => router.push("/sign-in/email")}
        >
          <Icon name="at" size={iconSize.md} color={whiteColor} />
          <ButtonLabel>Continue with email</ButtonLabel>
        </Button>

        <View className="flex-row gap-3">
          {isAppleAvailable && (
            <Button
              variant="secondary"
              accessibilityLabel="Continue with Apple"
              isDisabled={pendingProvider !== undefined}
              onPress={() => void signInWithApple()}
              className="flex-1"
              isLoading={pendingProvider === "apple"}
            >
              <Icon name="apple.logo" size={iconSize.md} color={foregroundColor} />
            </Button>
          )}
          <Button
            variant="secondary"
            accessibilityLabel="Continue with Google"
            isDisabled={pendingProvider !== undefined}
            onPress={() => void signInWithGoogle()}
            className="flex-1"
            isLoading={pendingProvider === "google"}
          >
            <Icon name="g.circle.fill" size={iconSize.md} color={foregroundColor} />
          </Button>
        </View>
      </View>

      <LegalFooter />
    </View>
  );
}

function signInErrorMessage(providerName: string, errorCode: string) {
  return (
    {
      PROVIDER_NOT_FOUND: `${providerName} sign-in isn't set up yet. Use email for now`,
      NETWORK: "Couldn't reach Lardon. Check your connection",
    }[errorCode] ?? `${providerName} sign-in didn't work. Try again or use email`
  );
}
