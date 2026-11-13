import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vite-plus/test";

import { mark } from "../mark";

describe("mark", () => {
  it("matches assets/mark.svg", () => {
    const svg = readFileSync(join(import.meta.dirname, "../../assets/mark.svg"), "utf8");

    expect(svg).toContain(`viewBox="${mark.viewBox}"`);
    expect(svg).toContain(` d="${mark.path}"`);
  });
});
