export type RecipeStoreOwner =
  | { kind: "user"; userId: string }
  | { kind: "family"; familyId: string };

export function personalStoreId(userId: string) {
  return `user-${userId}`;
}

export function familyStoreId(familyId: string) {
  return `family-${familyId}`;
}

export function parseStoreId(storeId: string): RecipeStoreOwner | null {
  const match = /^(user|family)-([A-Za-z0-9_-]{1,64})$/.exec(storeId);

  if (!match?.[2]) return null;

  return match[1] === "user"
    ? { kind: "user", userId: match[2] }
    : { kind: "family", familyId: match[2] };
}
