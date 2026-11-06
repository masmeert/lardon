import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button, Spinner, Typography, useThemeColor } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InlineError } from "@/components/inline-error";
import { Hero } from "@/components/sign-in/hero";
import { authClient } from "@/lib/auth-client";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const accentForegroundColor = useThemeColor("accent-foreground");
  const foregroundColor = useThemeColor("foreground");
  const [pendingProvider, setPendingProvider] = useState<"apple" | "google">();
  const [error, setError] = useState<string>();

  async function signInWith(provider: "apple" | "google", providerName: string) {
    setPendingProvider(provider);
    setError(undefined);

    const failed = await authClient.signIn.social({ provider, callbackURL: "/" }).then(
      ({ error }) => error !== null,
      () => true,
    );

    setPendingProvider(undefined);

    if (failed) {
      setError(`Couldn't sign in with ${providerName}. Try email instead`);
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
          <View className="items-center">
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
          {(
            [
              { provider: "apple", name: "Apple", icon: "logo-apple" },
              { provider: "google", name: "Google", icon: "logo-google" },
            ] as const
          ).map(({ provider, name, icon }) => (
            <Button
              key={provider}
              variant="secondary"
              accessibilityLabel={`Continue with ${name}`}
              isDisabled={pendingProvider !== undefined}
              onPress={() => void signInWith(provider, name)}
              className="flex-1 rounded-full"
            >
              {pendingProvider === provider ? (
                <Spinner size="sm" color={foregroundColor} />
              ) : (
                <Ionicons name={icon} size={22} color={foregroundColor} />
              )}
            </Button>
          ))}
        </View>
      </View>
    </View>
  );
}
