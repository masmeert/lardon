export type RecipeScope =
  | { kind: "all" }
  | { kind: "folder"; name: string }
  | { kind: "tag"; name: string }
  | { kind: "unsorted" };

export type RecipeScopeParams = { kind?: string; name?: string };

export function scopeParams(scope: RecipeScope): RecipeScopeParams {
  return scope;
}

export function scopeFromParams({ kind, name }: RecipeScopeParams): RecipeScope {
  if ((kind === "folder" || kind === "tag") && name) return { kind, name };

  if (kind === "unsorted") return { kind };

  return { kind: "all" };
}
