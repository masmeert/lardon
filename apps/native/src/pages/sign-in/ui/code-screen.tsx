import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { authClient, describeSignInCodeError } from "#/shared/auth";
import {
  Button,
  ButtonLabel,
  CodeInput,
  InlineError,
  KeyboardFooter,
  RollingNumber,
} from "#/shared/ui";

export function CodeScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [hasResent, setHasResent] = useState(false);
  const [resendInSeconds, setResendInSeconds] = useState(60);
  const [error, setError] = useState<string>();
  const reduceMotion = useReducedMotion();
  const trayOffsetX = useSharedValue(0);
  const trayStyle = useAnimatedStyle(() => ({ transform: [{ translateX: trayOffsetX.value }] }));

  useEffect(() => {
    if (resendInSeconds === 0) {
      return;
    }

    const timeout = setTimeout(() => setResendInSeconds((seconds) => seconds - 1), 1000);

    return () => clearTimeout(timeout);
  }, [resendInSeconds]);

  async function verify() {
    if (code.length !== 6 || isVerifying) {
      return;
    }

    setIsVerifying(true);

    const { error: verifyError } = await authClient.signIn
      .emailOtp({ email, otp: code })
      .catch(() => ({ error: { code: "NETWORK", message: undefined } }));

    if (!verifyError) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      return;
    }

    setIsVerifying(false);

    if (verifyError.code !== "NETWORK" && !reduceMotion) {
      trayOffsetX.value = withSequence(
        withTiming(-8, { duration: 40 }),
        withRepeat(withTiming(8, { duration: 70 }), 3, true),
        withTiming(0, { duration: 40 }),
      );
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setError(
      describeSignInCodeError(verifyError.code) ??
        (verifyError.message || "Couldn't check the code. Check your connection"),
    );
  }

  async function resend() {
    setIsResending(true);

    const { error: sendError } = await authClient.emailOtp
      .sendVerificationOtp({ email, type: "sign-in" })
      .catch(() => ({ error: { message: undefined } }));

    setIsResending(false);

    if (sendError) {
      setError(sendError.message || "Couldn't send a new code. Check your connection");

      return;
    }

    setCode("");
    setError(undefined);
    setHasResent(true);
    setResendInSeconds(60);
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 gap-5 px-6 pt-8">
        <View className="gap-1">
          <Text className="text-headline font-medium text-muted">
            {hasResent ? "We've sent a new code to" : "We've sent a 6-digit code to"}
            {"\n"}
            <Text className="font-normal text-foreground">{email}</Text>
          </Text>
          <Text className="font-normal text-body text-muted">
            It can take a minute to arrive. Check your spam folder if you can't find it.
          </Text>
        </View>

        <View className="gap-2">
          <Animated.View style={trayStyle} className="rounded-card bg-fill p-2">
            <CodeInput
              value={code}
              onChange={setCode}
              onComplete={() => void Haptics.selectionAsync()}
              autoFocus
            />
          </Animated.View>
          {error && <InlineError>{error}</InlineError>}
        </View>
      </View>

      <KeyboardFooter>
        <Button
          variant="secondary"
          onPress={() => void resend()}
          isDisabled={resendInSeconds > 0 || isResending || isVerifying}
          className="flex-1"
          isLoading={isResending}
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
          onPress={() => void verify()}
          isDisabled={code.length !== 6 || isVerifying}
          className="flex-1"
          isLoading={isVerifying}
        >
          <ButtonLabel>Sign in</ButtonLabel>
        </Button>
      </KeyboardFooter>
    </View>
  );
}
