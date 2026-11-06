import { Ionicons } from "@expo/vector-icons";
import { Schema } from "effect";
import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import { Button, Spinner, Typography, useThemeColor } from "heroui-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InlineError } from "@/components/inline-error";
import { Hero } from "@/components/sign-in/hero";
import { authClient } from "@/lib/auth-client";
import { logRequestFailure } from "@/lib/request-failure";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const accentForegroundColor = useThemeColor("accent-foreground");
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
      .catch((error) => {
        logRequestFailure("Apple sign-in", error);

        return "NETWORK";
      });

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
      (error) => {
        logRequestFailure("Google sign-in", error);

        return "NETWORK";
      },
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

        <View className="items-center gap-3 px-8">
          <Typography className="text-center text-3xl font-semibold text-foreground">
            Your family cookbook
          </Typography>
          <Typography className="text-center text-base leading-6 text-muted">
            Keep your family's recipes in one place and cook them together.
          </Typography>
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
          className="rounded-full"
        >
          <Ionicons name="at" size={20} color={accentForegroundColor} />
          <Button.Label>Continue with email</Button.Label>
        </Button>

        <View className="flex-row gap-3">
          {isAppleAvailable && (
            <Button
              variant="secondary"
              accessibilityLabel="Continue with Apple"
              isDisabled={pendingProvider !== undefined}
              onPress={() => void signInWithApple()}
              className="flex-1 rounded-full"
            >
              {pendingProvider === "apple" ? (
                <Spinner size="sm" color={foregroundColor} />
              ) : (
                <Ionicons name="logo-apple" size={22} color={foregroundColor} />
              )}
            </Button>
          )}
          <Button
            variant="secondary"
            accessibilityLabel="Continue with Google"
            isDisabled={pendingProvider !== undefined}
            onPress={() => void signInWithGoogle()}
            className="flex-1 rounded-full"
          >
            {pendingProvider === "google" ? (
              <Spinner size="sm" color={foregroundColor} />
            ) : (
              <Ionicons name="logo-google" size={22} color={foregroundColor} />
            )}
          </Button>
        </View>
      </View>
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
