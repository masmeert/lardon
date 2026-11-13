import type { SignInCode } from "@lardon/auth";
import { Context, Effect } from "effect";
import { renderToString } from "hono/jsx/dom/server";

import { SignInCodeEmail } from "./emails/sign-in-code-email";

export type Email = { to: string; subject: string; text: string; html: string };

export class Mailer extends Context.Service<Mailer, { send(email: Email): Effect.Effect<void> }>()(
  "lardon/server/Mailer",
) {
  static fromCloudflare(binding: SendEmail, from: string) {
    return Mailer.of({
      send: Effect.fn("Mailer.send")((email: Email) =>
        Effect.promise(() => binding.send({ from, ...email })).pipe(Effect.asVoid),
      ),
    });
  }
}

export function signInCodeEmail({ to, code }: SignInCode): Email {
  return {
    to,
    subject: `${code} is your Lardon code`,
    text: `Enter this code in the Lardon app to sign in:\n\n${code}\n\nIt expires in 5 minutes. If you didn't ask for it, you can ignore this email.\n`,
    html: renderToString(<SignInCodeEmail code={code} />),
  };
}
