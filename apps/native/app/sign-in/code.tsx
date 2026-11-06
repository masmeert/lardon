import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { Button, InputOTP, REGEXP_ONLY_DIGITS, Spinner, useThemeColor } from "heroui-native";
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

import { InlineError } from "@/components/inline-error";
import { RollingNumber } from "@/components/rolling-number/rolling-number";
import { KeyboardFooter } from "@/components/sign-in/keyboard-footer";
import { authClient } from "@/lib/auth-client";
import { logRequestFailure } from "@/lib/request-failure";

export default function CodeScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const accentForegroundColor = useThemeColor("accent-foreground");
  const foregroundColor = useThemeColor("foreground");
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
      .catch((error) => {
        logRequestFailure("Code check", error);

        return { error: { code: "NETWORK", message: undefined } };
      });

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
      {
        INVALID_OTP: "That code isn't right. Check it and try again",
        OTP_EXPIRED: "That code has expired. Request a new one",
        TOO_MANY_ATTEMPTS: "Too many wrong codes. Request a new one",
      }[verifyError.code ?? ""] ??
        (verifyError.message || "Couldn't check the code. Check your connection"),
    );
  }

  async function resend() {
    setIsResending(true);

    const { error: sendError } = await authClient.emailOtp
      .sendVerificationOtp({ email, type: "sign-in" })
      .catch((error) => {
        logRequestFailure("Code resend", error);

        return { error: { message: undefined } };
      });

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
      <View className="flex-1 gap-5 px-6 pt-10">
        <View className="gap-1">
          <Text className="text-xl font-medium text-muted">
            {hasResent ? "We've sent a new code to" : "We've sent a 6-digit code to"}
            {"\n"}
            <Text className="text-foreground">{email}</Text>
          </Text>
          <Text className="text-[15px] leading-5.5 text-muted">
            It can take a minute to arrive. Check your spam folder if you can't find it.
          </Text>
        </View>

        <View className="gap-2">
          <Animated.View style={trayStyle} className="rounded-[20px] bg-surface-secondary p-2">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              pattern={REGEXP_ONLY_DIGITS}
              onComplete={() => void Haptics.selectionAsync()}
              textInputProps={{ autoFocus: true }}
            >
              <InputOTP.Group className="flex-1">
                {({ slots }) =>
                  slots.map((slot) => (
                    <InputOTP.Slot key={slot.index} index={slot.index} className="h-14 flex-1" />
                  ))
                }
              </InputOTP.Group>
            </InputOTP>
          </Animated.View>
          {error && <InlineError>{error}</InlineError>}
        </View>
      </View>

      <KeyboardFooter>
        <Button
          variant="secondary"
          onPress={() => void resend()}
          isDisabled={resendInSeconds > 0 || isResending || isVerifying}
          className="flex-1 rounded-full"
        >
          {isResending ? (
            <Spinner size="sm" color={foregroundColor} />
          ) : (
            <View className="flex-row items-center">
              <Button.Label>{resendInSeconds > 0 ? "Resend (" : "Resend"}</Button.Label>
              {resendInSeconds > 0 && (
                <>
                  <RollingNumber
                    value={resendInSeconds}
                    className="text-base font-medium text-foreground"
                  />
                  <Button.Label>)</Button.Label>
                </>
              )}
            </View>
          )}
        </Button>
        <Button
          onPress={() => void verify()}
          isDisabled={code.length !== 6 || isVerifying}
          className="flex-1 rounded-full"
        >
          {isVerifying ? (
            <Spinner size="sm" color={accentForegroundColor} />
          ) : (
            <Button.Label>Sign in</Button.Label>
          )}
        </Button>
      </KeyboardFooter>
    </View>
  );
}
