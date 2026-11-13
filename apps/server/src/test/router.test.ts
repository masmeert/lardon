import { TooManyRequests } from "@lardon/api";
import { Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { TEST_RATE_LIMITS, testWebHandler } from "./environment";

function request(path: string, init: RequestInit & { ip?: string } = {}) {
  const headers = new Headers(init.headers);
  headers.set("cf-connecting-ip", init.ip ?? "203.0.113.7");

  return new Request(`http://localhost${path}`, { ...init, headers });
}

describe("router", () => {
  it("hands auth routes to better-auth and rate limits them per client", async () => {
    const { handler, dispose } = testWebHandler();

    try {
      const attempt = (ip?: string) =>
        handler(request("/api/auth/sign-in/email", { method: "POST", ip }));

      for (let index = 0; index < TEST_RATE_LIMITS.auth; index++) {
        const response = await attempt();
        expect(await response.json()).toEqual({
          handledBy: "better-auth",
          path: "/api/auth/sign-in/email",
        });
      }

      const limited = await attempt();
      expect(limited.status).toBe(429);
      expect(limited.headers.get("retry-after")).toBe("60");
      expect(Schema.decodeUnknownSync(TooManyRequests)(await limited.json())).toEqual(
        new TooManyRequests({ message: "Too many attempts. Wait a minute and try again." }),
      );

      expect((await attempt("198.51.100.1")).status).toBe(200);
      expect((await handler(request("/api/health"))).status).toBe(204);
      expect(await (await handler(request("/"))).text()).toBe("OK");
    } finally {
      await dispose();
    }
  });

  it("rate limits joining families separately from the rest of the API", async () => {
    const { handler, dispose } = testWebHandler();

    try {
      const statuses = [];

      for (let index = 0; index <= TEST_RATE_LIMITS.sensitive; index++) {
        const response = await handler(
          request("/api/families/join", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ code: "AAAA-BBBB-CCCC" }),
          }),
        );

        statuses.push(response.status);
      }

      expect(statuses).toEqual([401, 401, 401, 429]);
      expect((await handler(request("/api/families"))).status).toBe(401);
    } finally {
      await dispose();
    }
  });
});
