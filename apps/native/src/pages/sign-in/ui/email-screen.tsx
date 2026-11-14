import { type NativeStackNavigationProp, router, useNavigation } from "expo-router";
import { Schema } from "effect";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Text, TextInput, View } from "react-native";

import { authClient, Email } from "#/shared/auth";
import { Button, ButtonLabel, InlineError, KeyboardFooter, TextBox } from "#/shared/ui";

export function EmailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, undefined>>>();
  const inputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
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
      .catch(() => ({ error: { message: undefined } }));

    setIsSending(false);

    if (sendError) {
      setError(sendError.message || "Couldn't send the code. Check your connection");

      return;
    }

    router.push({ pathname: "/sign-in/code", params: { email: email.trim() } });
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 gap-5 px-6 pt-8">
        <View className="gap-1">
          <Text className="text-headline font-medium text-foreground">What's your email?</Text>
          <Text className="font-normal text-body text-muted">
            We'll send you a 6-digit code to sign in. No password to remember.
          </Text>
        </View>

        <View className="gap-2">
          <TextBox
            ref={inputRef}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(undefined);
            }}
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
          className="flex-1"
          isLoading={isSending}
        >
          <ButtonLabel>Send code</ButtonLabel>
        </Button>
      </KeyboardFooter>
    </View>
  );
}
