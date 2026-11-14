import { describe, expect, it } from "vite-plus/test";

import { signInCodeEmail } from "../sign-in-code-email";

describe("sign-in code email", () => {
  it("puts the code in the subject, the HTML and the plain text", async () => {
    const email = await signInCodeEmail({ to: "alice@example.com", code: "482913" });

    expect(email.subject).toBe("482913 is your Lardon code");
    expect(email.text).toContain("482913");
    expect(email.text).toContain("It expires in 5 minutes.");
    expect(email.html).toContain("482913");
    expect(email.html).toMatch(/^<!DOCTYPE html/i);
    expect(email.html).toContain('src="https://lardon.app/email/lardon-logo-ink.png"');
  });
});
