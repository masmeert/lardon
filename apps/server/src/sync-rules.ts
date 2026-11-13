import { isValidCell } from "@lardon/recipes/tables";
import type { CellOrUndefined, MergeableStore } from "tinybase";

export function allowsChange(
  store: MergeableStore,
  userId: string,
  change: { tableId: string; rowId: string; cellId: string; cell: CellOrUndefined },
) {
  if (!isValidCell(change.tableId, change.rowId, change.cellId, change.cell)) return false;

  if (change.tableId !== "recipes" || change.cell === undefined) return true;
  const createdById = store.getCell("recipes", change.rowId, "createdById");

  if (change.cellId === "createdById") {
    return change.cell === (createdById ?? userId);
  }

  if (change.cellId === "visibility") return createdById === undefined || createdById === userId;

  return true;
}
