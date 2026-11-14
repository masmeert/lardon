import { renderEmail } from "./email";
import SignInCodeEmail from "./templates/sign-in-code";

export function signInCodeEmail({ to, code }: { to: string; code: string }) {
  return renderEmail(to, `${code} is your Lardon code`, <SignInCodeEmail code={code} />);
}
