import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ListGroup, Spinner, useThemeColor } from "heroui-native";
import { useState } from "react";
import { Linking, Platform, ScrollView, View } from "react-native";

import { InlineError } from "@/components/inline-error";
import { UserAvatar } from "@/components/user-avatar";
import { authClient } from "@/lib/auth-client";
import { ENV } from "@/src/env";

export default function SettingsScreen() {
  const { data: session } = authClient.useSession();
  const foregroundColor = useThemeColor("foreground");
  const dangerColor = useThemeColor("danger");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string>();
  const [supportError, setSupportError] = useState<string>();

  async function signOut() {
    setIsSigningOut(true);
    setError(undefined);

    const { error: signOutError } = await authClient.signOut();

    if (signOutError) {
      setIsSigningOut(false);
      setError("Couldn't sign out. Check your connection and try again.");
    }
  }

  async function contactSupport() {
    setSupportError(undefined);

    await Linking.openURL(
      `mailto:${ENV.EXPO_PUBLIC_SUPPORT_EMAIL}?subject=${encodeURIComponent("Lardon support")}&body=${encodeURIComponent(`\n\n—\nLardon ${Constants.expoConfig?.version ?? ""} on ${Platform.OS} ${Platform.Version}`)}`,
    ).catch(() =>
      setSupportError(
        `Couldn't open your email app. Write to ${ENV.EXPO_PUBLIC_SUPPORT_EMAIL} instead.`,
      ),
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" className="flex-1">
      <ListGroup.Item
        accessibilityRole="button"
        accessibilityHint="Opens your profile"
        onPress={() => router.push("/settings/profile")}
        className="gap-4 px-5 py-5 active:bg-default"
      >
        <UserAvatar size="sm" />
        <ListGroup.ItemContent className="gap-0.5">
          {session?.user.name && (
            <ListGroup.ItemTitle className="text-[17px] leading-6">
              {session.user.name}
            </ListGroup.ItemTitle>
          )}
          <ListGroup.ItemDescription className="text-[15px] leading-5">
            {session?.user.email}
          </ListGroup.ItemDescription>
        </ListGroup.ItemContent>
        <Feather name="chevron-right" size={16} color={foregroundColor} />
      </ListGroup.Item>

      <View className="border-t border-default py-2">
        <ListGroup.Item
          accessibilityRole="link"
          onPress={() => void contactSupport()}
          className="px-5 py-2 active:bg-default"
        >
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle className="leading-5.5">Contact support</ListGroup.ItemTitle>
          </ListGroup.ItemContent>
          <Feather name="mail" size={16} color={foregroundColor} />
        </ListGroup.Item>
        {supportError && (
          <View className="px-5 pb-2">
            <InlineError>{supportError}</InlineError>
          </View>
        )}
        {[
          { title: "Privacy policy", url: `${ENV.EXPO_PUBLIC_WEBSITE_URL}/privacy` },
          { title: "Terms of use", url: `${ENV.EXPO_PUBLIC_WEBSITE_URL}/terms` },
        ].map(({ title, url }) => (
          <ListGroup.Item
            key={url}
            accessibilityRole="link"
            onPress={() => void WebBrowser.openBrowserAsync(url)}
            className="px-5 py-2 active:bg-default"
          >
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle className="leading-5.5">{title}</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <Feather name="arrow-up-right" size={16} color={foregroundColor} />
          </ListGroup.Item>
        ))}
      </View>

      <View className="gap-2 border-t border-default py-2">
        <ListGroup.Item
          accessibilityRole="button"
          disabled={isSigningOut}
          onPress={() => void signOut()}
          className="px-5 py-2 active:bg-default"
        >
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle className="leading-5.5 text-danger">Sign out</ListGroup.ItemTitle>
          </ListGroup.ItemContent>
          {isSigningOut && <Spinner size="sm" color={dangerColor} />}
        </ListGroup.Item>
        {error && (
          <View className="px-5">
            <InlineError>{error}</InlineError>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
