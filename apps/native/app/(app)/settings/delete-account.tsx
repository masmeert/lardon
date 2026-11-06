import {
  Button,
  InputOTP,
  REGEXP_ONLY_DIGITS,
  Spinner,
  Typography,
  useThemeColor,
} from "heroui-native";
import { useState } from "react";
import { View } from "react-native";

import { InlineError } from "@/components/inline-error";
import { authClient } from "@/lib/auth-client";
import { describeSignInCodeError } from "@/lib/credentials";

export default function DeleteAccountScreen() {
  const { data: session } = authClient.useSession();
  const dangerForegroundColor = useThemeColor("danger-foreground");
  const [isCodeRequired, setIsCodeRequired] = useState(false);
  const [code, setCode] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const email = session?.user.email ?? "";

  async function deleteAccount() {
    setIsDeleting(true);
    setError(undefined);

    const { error: deleteError } = await authClient
      .deleteUser()
      .catch(() => ({ error: { code: "NETWORK" } }));

    if (!deleteError) {
      return;
    }

    if (deleteError.code !== "SESSION_EXPIRED") {
      setIsDeleting(false);
      setError("Couldn't delete your account. Check your connection and try again.");

      return;
    }

    const { error: sendError } = await authClient.emailOtp
      .sendVerificationOtp({ email, type: "sign-in" })
      .catch(() => ({ error: { message: undefined } }));

    setIsDeleting(false);

    if (sendError) {
      setError("Couldn't send you a code. Check your connection and try again.");

      return;
    }

    setCode("");
    setIsCodeRequired(true);
  }

  async function confirmWithCode() {
    if (code.length !== 6 || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setError(undefined);

    const { error: verifyError } = await authClient.signIn
      .emailOtp({ email, otp: code })
      .catch(() => ({ error: { code: "NETWORK", message: undefined } }));

    if (verifyError) {
      setIsDeleting(false);
      setError(
        describeSignInCodeError(verifyError.code) ??
          (verifyError.message || "Couldn't check the code. Check your connection"),
      );

      return;
    }

    await deleteAccount();
  }

  return (
    <View className="gap-5 px-5 pb-6 pt-8">
      <View className="gap-1">
        <Typography className="text-xl font-medium text-foreground">
          {isCodeRequired ? "Confirm it's you" : "Delete your account?"}
        </Typography>
        <Typography className="text-[15px] leading-5.5 text-muted">
          {isCodeRequired
            ? `Enter the 6-digit code we sent to ${email} to delete your account.`
            : "Your account, recipes and photos are deleted and you leave your families. This can't be undone."}
        </Typography>
      </View>

      {isCodeRequired && (
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(value) => {
            setCode(value);
            setError(undefined);
          }}
          pattern={REGEXP_ONLY_DIGITS}
          onComplete={() => void confirmWithCode()}
          isDisabled={isDeleting}
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
      )}
      {error && <InlineError>{error}</InlineError>}

      <Button
        size="lg"
        variant="danger"
        isDisabled={isDeleting || (isCodeRequired && code.length !== 6)}
        onPress={() => void (isCodeRequired ? confirmWithCode() : deleteAccount())}
        className="rounded-full"
      >
        {isDeleting ? (
          <Spinner size="sm" color={dangerForegroundColor} />
        ) : (
          <Button.Label>Delete account</Button.Label>
        )}
      </Button>
    </View>
  );
}
