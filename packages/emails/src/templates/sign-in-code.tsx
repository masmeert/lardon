import { colors } from "@lardon/brand";
import { Heading, Text } from "react-email";

import { EmailLayout } from "../components/email-layout";

export default function SignInCodeEmail({ code }: { code: string }) {
  return (
    <EmailLayout
      title="Your Lardon sign-in code"
      preview={`${code} is your code. It expires in 5 minutes.`}
    >
      <Heading
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
      </Heading>
      <Text style={{ margin: "12px 0 0", fontSize: 15 }}>
        Enter this code in the Lardon app to sign in.
      </Text>
      <Text
        style={{
          margin: "24px 0 0",
          padding: "20px 0 20px 0.2em",
          backgroundColor: colors.paper,
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
      </Text>
      <Text style={{ margin: "24px 0 0", fontSize: 15 }}>
        It expires in 5 minutes. If you didn't ask for it, you can ignore this email.
      </Text>
    </EmailLayout>
  );
}

SignInCodeEmail.PreviewProps = { code: "482913" };
