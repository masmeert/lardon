import type { ReactElement } from "react";
import { render } from "react-email";

export type Email = { to: string; subject: string; text: string; html: string };

export async function renderEmail(to: string, subject: string, body: ReactElement): Promise<Email> {
  return {
    to,
    subject,
    html: await render(body),
    text: await render(body, { plainText: true }),
  };
}
