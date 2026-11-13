import { Option, Record, Schema } from "effect";
import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";
import { type Cell, type MergeableStore, getUniqueId } from "tinybase";

import { ingredientsOf, linkedIds, stepsOf } from "./queries";
import {
  type Collection,
  type TableId,
  type Visibility,
  collections,
  linkId,
  readRow,
  readRows,
  tables,
} from "./tables";
import type { UnitCode } from "./units";

export type DraftIngredient = {
  id: string;
  quantity: number | null;
  unit: UnitCode | null;
  name: string;
};

export type DraftStep = { id: string; text: string };

export type RecipeDraft = {
  title: string;
  servings: number | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  notes: string | null;
  imageKey: string | null;
  ingredients: readonly DraftIngredient[];
  steps: readonly DraftStep[];
  tagIds: readonly string[];
  folderIds: readonly string[];
};

const childTables = ["ingredients", "steps", "recipeTags", "recipeFolders", "meals"] as const;

type CellValue = Cell | null;

const decodeChild = Schema.decodeUnknownOption(
  Schema.Struct({
    recipeId: Schema.String,
    tagId: Schema.optionalKey(Schema.String),
    folderId: Schema.optionalKey(Schema.String),
  }),
);

function cells(values: Readonly<Record<string, CellValue>>) {
  const row: Record<string, Cell> = {};

  for (const [cellId, value] of Object.entries(values)) {
    if (value !== null) row[cellId] = value;
  }

  return row;
}

function writeCell(
  store: MergeableStore,
  tableId: TableId,
  rowId: string,
  cellId: string,
  value: CellValue,
) {
  if (value === null) store.delCell(tableId, rowId, cellId, true);
  else store.setCell(tableId, rowId, cellId, value);
}

function cleanDraft(draft: RecipeDraft): RecipeDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    notes: draft.notes?.trim() || null,
    ingredients: draft.ingredients.flatMap((ingredient) => {
      const name = ingredient.name.trim().replace(/\s+/g, " ");

      return name ? [{ ...ingredient, name }] : [];
    }),
    steps: draft.steps.flatMap((step) => {
      const text = step.text.trim();

      return text ? [{ ...step, text }] : [];
    }),
  };
}

export function emptyDraft(): RecipeDraft {
  return {
    title: "",
    servings: null,
    prepMinutes: null,
    cookMinutes: null,
    notes: null,
    imageKey: null,
    ingredients: [],
    steps: [],
    tagIds: [],
    folderIds: [],
  };
}

export function recipeDraft(store: MergeableStore, recipeId: string): RecipeDraft | undefined {
  const recipe = readRow(store, "recipes", recipeId);

  if (!recipe) return undefined;

  return {
    title: recipe.title,
    servings: recipe.servings ?? null,
    prepMinutes: recipe.prepMinutes ?? null,
    cookMinutes: recipe.cookMinutes ?? null,
    notes: recipe.notes ?? null,
    imageKey: recipe.imageKey ?? null,
    ingredients: ingredientsOf(store, recipeId).map((ingredient) => ({
      id: ingredient.id,
      quantity: ingredient.quantity ?? null,
      unit: ingredient.unit ?? null,
      name: ingredient.name,
    })),
    steps: stepsOf(store, recipeId).map((step) => ({ id: step.id, text: step.text })),
    tagIds: linkedIds(store, "tags", recipeId),
    folderIds: linkedIds(store, "folders", recipeId),
  };
}

function writeLink(
  store: MergeableStore,
  collection: Collection,
  ownerId: string,
  recipeId: string,
) {
  const { linkTable, ownerCell } = collections[collection];
  store.setRow(linkTable, linkId(ownerId, recipeId), { recipeId, [ownerCell]: ownerId });
}

function writeRecipe(
  store: MergeableStore,
  recipeId: string,
  draft: RecipeDraft,
  owner: { createdById: string; createdAt: number; visibility: Visibility },
) {
  const ingredientPositions = generateNKeysBetween(null, null, draft.ingredients.length);
  const stepPositions = generateNKeysBetween(null, null, draft.steps.length);

  store.setRow(
    "recipes",
    recipeId,
    cells({
      title: draft.title,
      servings: draft.servings,
      prepMinutes: draft.prepMinutes,
      cookMinutes: draft.cookMinutes,
      notes: draft.notes,
      imageKey: draft.imageKey,
      visibility: owner.visibility,
      createdById: owner.createdById,
      createdAt: owner.createdAt,
      updatedAt: Date.now(),
    }),
  );

  draft.ingredients.forEach((ingredient, index) =>
    store.setRow(
      "ingredients",
      ingredient.id,
      cells({
        recipeId,
        position: ingredientPositions[index] ?? null,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        name: ingredient.name,
      }),
    ),
  );

  draft.steps.forEach((step, index) =>
    store.setRow(
      "steps",
      step.id,
      cells({ recipeId, position: stepPositions[index] ?? null, text: step.text }),
    ),
  );

  for (const tagId of draft.tagIds) writeLink(store, "tags", tagId, recipeId);

  for (const folderId of draft.folderIds) writeLink(store, "folders", folderId, recipeId);
}

export function createRecipe(store: MergeableStore, draft: RecipeDraft, createdById: string) {
  const recipeId = getUniqueId();

  store.transaction(() =>
    writeRecipe(store, recipeId, cleanDraft(draft), {
      createdById,
      createdAt: Date.now(),
      visibility: "private",
    }),
  );

  return recipeId;
}

function longestRunInOrder(ids: readonly string[], baseIds: readonly string[]) {
  const runs = new Map<string, readonly string[]>();
  let longest: readonly string[] = [];

  for (const id of ids) {
    const rank = baseIds.indexOf(id);

    if (rank === -1) continue;
    let before: readonly string[] = [];

    for (const [earlierId, run] of runs) {
      if (baseIds.indexOf(earlierId) < rank && run.length > before.length) before = run;
    }

    const run = [...before, id];
    runs.set(id, run);

    if (run.length > longest.length) longest = run;
  }

  return new Set(longest);
}

function reconcileList<
  CellId extends string,
  Item extends { id: string } & Readonly<Record<CellId, CellValue>>,
>(
  store: MergeableStore,
  tableId: "ingredients" | "steps",
  recipeId: string,
  cellIds: readonly CellId[],
  lists: {
    base: readonly Item[];
    revision: readonly Item[];
    current: ReadonlyArray<Item & { position: string }>;
  },
) {
  const baseById = new Map(lists.base.map((item) => [item.id, item]));
  const currentById = new Map(lists.current.map((item) => [item.id, item]));
  const revisionIds = new Set(lists.revision.map((item) => item.id));
  let writes = 0;

  const removedIds = new Set(
    lists.base.flatMap((item) =>
      !revisionIds.has(item.id) && currentById.has(item.id) ? [item.id] : [],
    ),
  );

  for (const id of removedIds) {
    store.delRow(tableId, id);
    writes += 1;
  }

  for (const item of lists.revision) {
    const current = currentById.get(item.id);

    if (!current) continue;
    const base = baseById.get(item.id) ?? current;

    for (const cellId of cellIds) {
      if (item[cellId] !== base[cellId] && item[cellId] !== current[cellId]) {
        writeCell(store, tableId, item.id, cellId, item[cellId]);
        writes += 1;
      }
    }
  }

  const placeable = lists.revision.filter(
    (item) => currentById.has(item.id) || !baseById.has(item.id),
  );

  const kept = longestRunInOrder(
    placeable.map((item) => item.id),
    lists.base.map((item) => item.id),
  );

  const lineup = lists.current.filter((item) => !removedIds.has(item.id) && kept.has(item.id));

  placeable.forEach((item, index) => {
    if (kept.has(item.id)) return;

    const previousId = placeable
      .slice(0, index)
      .findLast((earlier) => lineup.some((placed) => placed.id === earlier.id))?.id;

    const lineupIndex = lineup.findIndex((placed) => placed.id === previousId) + 1;
    const lower = lineup[lineupIndex - 1]?.position;
    const upper = lineup[lineupIndex]?.position;
    const currentPosition = currentById.get(item.id)?.position;

    const isInPlace =
      currentPosition !== undefined &&
      (lower === undefined || lower < currentPosition) &&
      (upper === undefined || currentPosition < upper);

    const position = isInPlace
      ? currentPosition
      : generateKeyBetween(
          lower ?? null,
          lower !== undefined && upper !== undefined && lower >= upper ? null : (upper ?? null),
        );

    lineup.splice(lineupIndex, 0, { ...item, position });

    if (isInPlace) return;

    if (currentById.has(item.id)) {
      store.setCell(tableId, item.id, "position", position);
    } else {
      store.setRow(
        tableId,
        item.id,
        cells({
          recipeId,
          position,
          ...Object.fromEntries(cellIds.map((cellId) => [cellId, item[cellId]])),
        }),
      );
    }

    writes += 1;
  });

  return writes;
}

function reconcileLinks(
  store: MergeableStore,
  collection: Collection,
  recipeId: string,
  lists: { base: readonly string[]; revision: readonly string[]; current: readonly string[] },
) {
  const added = lists.revision.filter(
    (ownerId) => !lists.base.includes(ownerId) && !lists.current.includes(ownerId),
  );

  const removed = lists.base.filter(
    (ownerId) => !lists.revision.includes(ownerId) && lists.current.includes(ownerId),
  );

  for (const ownerId of added) writeLink(store, collection, ownerId, recipeId);

  for (const ownerId of removed) {
    store.delRow(collections[collection].linkTable, linkId(ownerId, recipeId));
  }

  return added.length + removed.length;
}

export function saveRecipe(
  store: MergeableStore,
  recipeId: string,
  base: RecipeDraft,
  revision: RecipeDraft,
) {
  const current = recipeDraft(store, recipeId);

  if (!current) return false;
  const cleanBase = cleanDraft(base);
  const cleanRevision = cleanDraft(revision);

  store.transaction(() => {
    let writes = 0;

    for (const cellId of [
      "title",
      "servings",
      "prepMinutes",
      "cookMinutes",
      "notes",
      "imageKey",
    ] as const) {
      if (
        cleanRevision[cellId] !== cleanBase[cellId] &&
        cleanRevision[cellId] !== current[cellId]
      ) {
        writeCell(store, "recipes", recipeId, cellId, cleanRevision[cellId]);
        writes += 1;
      }
    }

    writes += reconcileList(store, "ingredients", recipeId, ["quantity", "unit", "name"], {
      base: cleanBase.ingredients,
      revision: cleanRevision.ingredients,
      current: ingredientsOf(store, recipeId).map((ingredient) => ({
        id: ingredient.id,
        position: ingredient.position,
        quantity: ingredient.quantity ?? null,
        unit: ingredient.unit ?? null,
        name: ingredient.name,
      })),
    });

    writes += reconcileList(store, "steps", recipeId, ["text"], {
      base: cleanBase.steps,
      revision: cleanRevision.steps,
      current: stepsOf(store, recipeId),
    });

    writes += reconcileLinks(store, "tags", recipeId, {
      base: cleanBase.tagIds,
      revision: cleanRevision.tagIds,
      current: current.tagIds,
    });

    writes += reconcileLinks(store, "folders", recipeId, {
      base: cleanBase.folderIds,
      revision: cleanRevision.folderIds,
      current: current.folderIds,
    });

    if (writes > 0) store.setCell("recipes", recipeId, "updatedAt", Date.now());
  });

  return true;
}

export function setVisibility(store: MergeableStore, recipeId: string, visibility: Visibility) {
  if (store.hasRow("recipes", recipeId))
    store.setCell("recipes", recipeId, "visibility", visibility);
}

function deleteChildren(store: MergeableStore, recipeIds: ReadonlySet<string>) {
  for (const tableId of childTables) {
    for (const rowId of store.getRowIds(tableId)) {
      const child = decodeChild(store.getRow(tableId, rowId));

      if (Option.exists(child, ({ recipeId }) => recipeIds.has(recipeId))) {
        store.delRow(tableId, rowId);
      }
    }
  }
}

export function deleteRecipes(store: MergeableStore, recipeIds: readonly string[]) {
  store.transaction(() => {
    deleteChildren(store, new Set(recipeIds));

    for (const recipeId of recipeIds) store.delRow("recipes", recipeId);
  });
}

export function copyRecipe(
  source: MergeableStore,
  target: MergeableStore,
  recipeId: string,
  copy: { createdById: string; imageKey: string | null },
) {
  const draft = recipeDraft(source, recipeId);

  if (!draft) return undefined;

  return createRecipe(
    target,
    {
      ...draft,
      title: source === target ? `${draft.title} (copy)` : draft.title,
      imageKey: copy.imageKey,
      ingredients: draft.ingredients.map((ingredient) => ({ ...ingredient, id: getUniqueId() })),
      steps: draft.steps.map((step) => ({ ...step, id: getUniqueId() })),
      tagIds: source === target ? draft.tagIds : [],
      folderIds: source === target ? draft.folderIds : [],
    },
    copy.createdById,
  );
}

export function moveRecipe(
  source: MergeableStore,
  target: MergeableStore,
  recipeId: string,
  imageKey: string | null,
) {
  const recipe = readRow(source, "recipes", recipeId);
  const draft = recipeDraft(source, recipeId);

  if (!recipe || !draft || source === target) return false;

  target.transaction(() =>
    writeRecipe(target, recipeId, { ...draft, imageKey, tagIds: [], folderIds: [] }, recipe),
  );
  deleteRecipes(source, [recipeId]);

  return true;
}

export function createCollection(store: MergeableStore, collection: Collection, name: string) {
  const existing = readRows(store, collection).find(
    (owner) => owner.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase(),
  );

  if (existing) return existing.id;
  const id = getUniqueId();
  store.setRow(collection, id, { name: name.trim() });

  return id;
}

export function renameCollection(
  store: MergeableStore,
  collection: Collection,
  id: string,
  name: string,
) {
  if (store.hasRow(collection, id)) store.setCell(collection, id, "name", name.trim());
}

export function deleteCollection(store: MergeableStore, collection: Collection, id: string) {
  const { linkTable, ownerCell } = collections[collection];

  store.transaction(() => {
    for (const rowId of store.getRowIds(linkTable)) {
      if (store.getCell(linkTable, rowId, ownerCell) === id) store.delRow(linkTable, rowId);
    }

    store.delRow(collection, id);
  });
}

export function addToCollection(
  store: MergeableStore,
  collection: Collection,
  id: string,
  recipeIds: readonly string[],
) {
  store.transaction(() => {
    for (const recipeId of recipeIds) {
      if (store.hasRow("recipes", recipeId)) writeLink(store, collection, id, recipeId);
    }
  });
}

export function removeFromCollection(
  store: MergeableStore,
  collection: Collection,
  id: string,
  recipeIds: readonly string[],
) {
  store.transaction(() => {
    for (const recipeId of recipeIds) {
      store.delRow(collections[collection].linkTable, linkId(id, recipeId));
    }
  });
}

export function planMeal(
  store: MergeableStore,
  date: string,
  meal: { recipeId: string; servings: number | null },
) {
  store.setRow("meals", date, { recipeId: meal.recipeId, servings: meal.servings });
}

export function clearMeal(store: MergeableStore, date: string) {
  store.delRow("meals", date);
}

export function cleanUp(store: MergeableStore) {
  let removed = 0;

  store.transaction(() => {
    for (const tableId of Record.keys(tables)) {
      for (const rowId of store.getRowIds(tableId)) {
        if (!readRow(store, tableId, rowId)) {
          store.delRow(tableId, rowId);
          removed += 1;
        }
      }
    }

    for (const tableId of childTables) {
      for (const rowId of store.getRowIds(tableId)) {
        const isOrphan = Option.match(decodeChild(store.getRow(tableId, rowId)), {
          onNone: () => true,
          onSome: (child) =>
            !store.hasRow("recipes", child.recipeId) ||
            Record.keys(collections).some((collection) => {
              const ownerId = child[collections[collection].ownerCell];

              return ownerId !== undefined && !store.hasRow(collection, ownerId);
            }),
        });

        if (isOrphan) {
          store.delRow(tableId, rowId);
          removed += 1;
        }
      }
    }
  });

  return removed;
}
