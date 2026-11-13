export type RecipeScope =
  | { kind: "all" }
  | { kind: "family"; familyId: string }
  | { kind: "folder"; familyId: string; folderId: string }
  | { kind: "tag"; name: string }
  | { kind: "unsorted" };

export type RecipeScopeParams = {
  kind?: string;
  familyId?: string;
  folderId?: string;
  tag?: string;
};

export function scopeParams(scope: RecipeScope): RecipeScopeParams {
  return scope.kind === "tag" ? { kind: scope.kind, tag: scope.name } : scope;
}

export function scopeFromParams({ kind, familyId, folderId, tag }: RecipeScopeParams): RecipeScope {
  if (kind === "family" && familyId) return { kind, familyId };

  if (kind === "folder" && familyId && folderId) return { kind, familyId, folderId };

  if (kind === "tag" && tag) return { kind, name: tag };

  if (kind === "unsorted") return { kind };

  return { kind: "all" };
}

export function isInScope(scope: RecipeScope, familyId: string) {
  return scope.kind === "family" || scope.kind === "folder" ? scope.familyId === familyId : true;
}
