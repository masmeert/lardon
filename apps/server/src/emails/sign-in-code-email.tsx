import { colors } from "@lardon/brand";

import { EmailLayout } from "./email-layout";

export function SignInCodeEmail({ code }: { code: string }) {
  return (
    <EmailLayout title="Your Lardon sign-in code">
      <h1
        style={{
          margin: 0,
          color: colors.foreground,
          fontSize: 24,
          fontWeight: 500,
          lineHeight: 1.25,
          letterSpacing: "-0.025em",
        }}
      >
        Your sign-in code
      </h1>
      <p style={{ margin: "12px 0 0" }}>Enter this code in the Lardon app to sign in.</p>
      <p
        style={{
          margin: "24px 0 0",
          padding: "20px 0 20px 0.2em",
          backgroundColor: "#ffffff",
          border: `1px solid ${colors.hairline}`,
          borderRadius: 16,
          textAlign: "center",
          color: colors.foreground,
          fontSize: 36,
          fontWeight: 500,
          lineHeight: 1.2,
          letterSpacing: "0.2em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {code}
      </p>
      <p style={{ margin: "24px 0 0" }}>
        It expires in 5 minutes. If you didn't ask for it, you can ignore this email.
      </p>
    </EmailLayout>
  );
}
