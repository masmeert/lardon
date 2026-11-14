import { isValidCell } from "@lardon/recipes/tables";
import type { CellOrUndefined, MergeableStore } from "tinybase";

function lostItsCreator(store: MergeableStore, rowId: string) {
  return store.getMergeableContent()[0][0].recipes?.[0][rowId]?.[0].createdById !== undefined;
}

export function allowsChange(
  store: MergeableStore,
  userId: string,
  change: { tableId: string; rowId: string; cellId: string; cell: CellOrUndefined },
) {
  if (!isValidCell(change.tableId, change.rowId, change.cellId, change.cell)) return false;

  if (change.tableId !== "recipes" || change.cell === undefined) return true;
  const createdById = store.getCell("recipes", change.rowId, "createdById");

  if (change.cellId !== "createdById" && change.cellId !== "visibility") return true;

  if (createdById !== undefined) {
    return change.cellId === "createdById" ? change.cell === createdById : createdById === userId;
  }

  if (lostItsCreator(store, change.rowId)) return false;

  return change.cellId === "visibility" || change.cell === userId;
}
