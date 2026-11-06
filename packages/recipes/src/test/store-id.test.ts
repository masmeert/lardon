import { describe, expect, it } from "vite-plus/test";

import { familyStoreId, parseStoreId, personalStoreId } from "../store-id";

describe("store ids", () => {
  it("round-trips personal and family store ids", () => {
    expect(parseStoreId(personalStoreId("abc123"))).toEqual({ kind: "user", userId: "abc123" });
    expect(parseStoreId(familyStoreId("4f2c-9a"))).toEqual({ kind: "family", familyId: "4f2c-9a" });
  });

  it("rejects anything else", () => {
    expect(["", "user-", "team-abc", "user-abc/def", "family-a b"].map(parseStoreId)).toEqual([
      null,
      null,
      null,
      null,
      null,
    ]);
  });
});
