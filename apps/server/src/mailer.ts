import type { AuthEmail } from "@lardon/auth";
import { Context, Effect } from "effect";

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

  static logOnly() {
    return Mailer.of({
      send: Effect.fn("Mailer.send")((email: Email) =>
        Effect.logInfo("Email not sent, no email binding configured", email),
      ),
    });
  }
}

const authEmailContent = {
  "verify-email": {
    subject: "Confirm your email address",
    intro: "Welcome to Lardon! Confirm your email address to finish creating your account.",
    action: "Confirm my email",
    outro: "If you didn't create a Lardon account, you can ignore this email.",
  },
  "reset-password": {
    subject: "Reset your password",
    intro: "Someone asked to reset the password of your Lardon account.",
    action: "Choose a new password",
    outro:
      "The link expires in one hour. If you didn't ask for this, you can ignore this email: your password stays the same.",
  },
} as const;

export function authEmail(email: AuthEmail): Email {
  const content = authEmailContent[email.kind];
  const escapedUrl = email.url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const escapedName = email.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return {
    to: email.to,
    subject: content.subject,
    text: `Hi ${email.name},\n\n${content.intro}\n\n${content.action}: ${email.url}\n\n${content.outro}\n`,
    html: `<p>Hi ${escapedName},</p><p>${content.intro}</p><p><a href="${escapedUrl}">${content.action}</a></p><p>${content.outro}</p>`,
  };
}
