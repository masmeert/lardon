import { describe, expect, it } from "vite-plus/test";

import { stepParts } from "../step-text";

describe("stepParts", () => {
  it("marks ingredient names, ignoring case and plurals", () => {
    expect(
      stepParts("Boil the chestnuts in milk until soft.", ["Chestnut", "Milk", "Sugar"]),
    ).toEqual([
      { text: "Boil the ", kind: "plain" },
      { text: "chestnuts", kind: "ingredient" },
      { text: " in ", kind: "plain" },
      { text: "milk", kind: "ingredient" },
      { text: " until soft.", kind: "plain" },
    ]);
  });

  it("matches the last word of a longer name, but never inside another word", () => {
    expect(stepParts("Whip the cream, then add the creamer.", ["Heavy cream"])).toEqual([
      { text: "Whip the ", kind: "plain" },
      { text: "cream", kind: "ingredient" },
      { text: ", then add the creamer.", kind: "plain" },
    ]);
  });

  it("marks durations, including ranges", () => {
    expect(stepParts("Chill for 10 to 30min. Bake 1 h.", [])).toEqual([
      { text: "Chill for ", kind: "plain" },
      { text: "10 to 30min", kind: "duration" },
      { text: ". Bake ", kind: "plain" },
      { text: "1 h", kind: "duration" },
      { text: ".", kind: "plain" },
    ]);
  });

  it("returns the whole text when nothing matches", () => {
    expect(stepParts("Serve.", ["Rice"])).toEqual([{ text: "Serve.", kind: "plain" }]);
  });
});
