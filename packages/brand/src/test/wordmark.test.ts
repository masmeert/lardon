import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vite-plus/test";

import { wordmark } from "../wordmark";

describe("wordmark", () => {
  it("matches assets/wordmark.svg", () => {
    const svg = readFileSync(join(import.meta.dirname, "../../assets/wordmark.svg"), "utf8");

    expect(svg).toContain(`viewBox="${wordmark.viewBox}"`);
    expect(svg).toContain(` d="${wordmark.path}"`);
  });
});
