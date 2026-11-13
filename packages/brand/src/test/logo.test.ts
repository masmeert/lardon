import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vite-plus/test";

import { logo } from "../logo";
import { mark } from "../mark";
import { wordmark } from "../wordmark";

describe("logo", () => {
  it("matches assets/logo.svg", () => {
    const svg = readFileSync(join(import.meta.dirname, "../../assets/logo.svg"), "utf8");

    expect(svg).toContain(`viewBox="${logo.viewBox}"`);
    expect(svg).toContain(
      `<path transform="${logo.markTransform}" fill-rule="evenodd" d="${mark.path}"/>`,
    );
    expect(svg).toContain(`<path transform="${logo.wordmarkTransform}" d="${wordmark.path}"/>`);
  });
});
