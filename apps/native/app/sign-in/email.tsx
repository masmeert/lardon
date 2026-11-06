import { type NativeStackNavigationProp, router, useNavigation } from "expo-router";
import { Schema } from "effect";
import { Button, Input, type InputRef, Spinner, useThemeColor } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Text, View } from "react-native";

import { InlineError } from "@/components/inline-error";
import { KeyboardFooter } from "@/components/sign-in/keyboard-footer";
import { authClient } from "@/lib/auth-client";
import { logRequestFailure } from "@/lib/request-failure";
import { Email } from "@/lib/credentials";

export default function EmailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, undefined>>>();
  const inputRef = useRef<InputRef>(null);
  const accentForegroundColor = useThemeColor("accent-foreground");
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>();
  const isValid = Schema.is(Email)(email.trim());

  useEffect(() => {
    const unsubscribe = navigation.addListener("transitionEnd", () => {
      inputRef.current?.focus();
      unsubscribe();
    });

    return unsubscribe;
  }, [navigation]);

  async function sendCode() {
    if (!isValid || isSending) {
      return;
    }

    Keyboard.dismiss();
    setIsSending(true);
    setError(undefined);

    const { error: sendError } = await authClient.emailOtp
      .sendVerificationOtp({ email: email.trim(), type: "sign-in" })
      .catch((error) => {
        logRequestFailure("Code request", error);

        return { error: { message: undefined } };
      });

    setIsSending(false);

    if (sendError) {
      setError(sendError.message || "Couldn't send the code. Check your connection");

      return;
    }

    router.push({ pathname: "/sign-in/code", params: { email: email.trim() } });
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 gap-5 px-6 pt-10">
        <View className="gap-1">
          <Text className="text-xl font-medium text-foreground">What's your email?</Text>
          <Text className="text-[15px] leading-5.5 text-muted">
            We'll send you a 6-digit code to sign in. No password to remember.
          </Text>
        </View>

        <View className="gap-2">
          <Input
            ref={inputRef}
            variant={isFocused ? "primary" : "secondary"}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(undefined);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            editable={!isSending}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            clearButtonMode="while-editing"
            returnKeyType="send"
            enablesReturnKeyAutomatically
            onSubmitEditing={() => void sendCode()}
          />
          {error && <InlineError>{error}</InlineError>}
        </View>
      </View>

      <KeyboardFooter>
        <Button
          onPress={() => void sendCode()}
          isDisabled={!isValid || isSending}
          className="flex-1 rounded-full"
        >
          {isSending ? (
            <Spinner size="sm" color={accentForegroundColor} />
          ) : (
            <Button.Label>Send code</Button.Label>
          )}
        </Button>
      </KeyboardFooter>
    </View>
  );
}
