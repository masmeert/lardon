import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vite-plus/test";

import { colors } from "../colors";

describe("theme.css", () => {
  it("declares every brand color with the same value", () => {
    const theme = readFileSync(join(import.meta.dirname, "../theme.css"), "utf8");

    const declared = Object.fromEntries(
      Array.from(theme.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6});/g), ([, name = "", hex]) => [
        name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()),
        hex,
      ]),
    );

    expect(declared).toEqual(colors);
  });
});
