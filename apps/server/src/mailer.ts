import type { Email } from "@lardon/emails";
import { Context, Effect } from "effect";

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
