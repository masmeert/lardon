import type { FamilySummary } from "@lardon/api/families";
import type { MergeableStore } from "tinybase";

import { authClient } from "#/shared/auth";

import { clearCachedFamilies, readCachedFamilies, writeCachedFamilies } from "./family-cache";
import { fetchFamilies } from "./fetch-families";
import { type FamilyStore, openFamilyStore } from "./open-family-store";

export type LibraryFamily = FamilySummary & { store: MergeableStore };

export type Library = {
  families: readonly LibraryFamily[];
  status: "loading" | "ready" | "unreachable";
};

const openStores = new Map<string, FamilyStore>();
const listeners = new Set<() => void>();
let library: Library = { families: [], status: "loading" };

function publish(next: Library) {
  library = next;

  for (const listener of listeners) listener();
}

function openFamilies(summaries: readonly FamilySummary[]) {
  const familyIds = new Set(summaries.map((summary) => summary.id));

  for (const [familyId, familyStore] of openStores) {
    if (familyIds.has(familyId)) continue;

    openStores.delete(familyId);
    void familyStore.close({ isErasing: true });
  }

  return summaries.map((summary) => {
    const familyStore = openStores.get(summary.id) ?? openFamily(summary.id);

    return { ...summary, store: familyStore.store };
  });
}

function openFamily(familyId: string) {
  const familyStore = openFamilyStore(familyId, () => void refreshLibrary());

  familyStore.store.addDidFinishTransactionListener(() =>
    publish({
      ...library,
      families: library.families.map((family) => (family.id === familyId ? { ...family } : family)),
    }),
  );
  openStores.set(familyId, familyStore);

  return familyStore;
}

export function subscribeToLibrary(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function currentLibrary() {
  return library;
}

export async function refreshLibrary() {
  try {
    const summaries = await fetchFamilies();

    writeCachedFamilies(summaries);
    publish({ families: openFamilies(summaries), status: "ready" });
  } catch {
    publish({ ...library, status: library.families.length > 0 ? "ready" : "unreachable" });
  }
}

export function startLibrary() {
  const summaries = readCachedFamilies();

  publish({
    families: openFamilies(summaries),
    status: summaries.length > 0 ? "ready" : "loading",
  });
  void refreshLibrary();
}

export async function stopLibrary({ isErasing }: { isErasing: boolean }) {
  const closing = Array.from(openStores.values(), (familyStore) =>
    familyStore.close({ isErasing }),
  );

  openStores.clear();

  if (isErasing) clearCachedFamilies();

  publish({ families: [], status: "loading" });
  await Promise.all(closing);
}

export async function signOut() {
  const { error } = await authClient.signOut();

  if (error) throw new Error(error.message ?? "Signing out failed");

  await stopLibrary({ isErasing: true });
}
