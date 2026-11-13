import { describe, expect, it } from "vite-plus/test";

import { signInCodeEmail } from "../mailer";

describe("sign-in code email", () => {
  it("puts the code in the subject and body", () => {
    const email = signInCodeEmail({ to: "alice@example.com", code: "482913" });

    expect(email.subject).toBe("482913 is your Lardon code");
    expect(email.text).toContain("482913");
    expect(email.html).toContain("482913");
    expect(email.html).toMatch(/^<!doctype html>/);
    expect(email.html).toContain('src="https://lardon.app/email/lardon-logo-ink.png"');
  });
});
