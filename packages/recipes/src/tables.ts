import { Option, Record, Schema } from "effect";
import { type Cell, type Tables, createMergeableStore } from "tinybase";
import { createEffectSchematizer } from "tinybase/schematizers/schematizer-effect";

import { unitCodes } from "./units";

function text(maxLength: number) {
  return Schema.String.check(
    Schema.isTrimmed(),
    Schema.isMinLength(1),
    Schema.isMaxLength(maxLength),
  );
}

const idPattern = /^[A-Za-z0-9_-]{1,64}$/;
const Id = Schema.String.check(Schema.isPattern(idPattern));
const Position = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(200));
const Millis = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));

const Minutes = Schema.Int.check(
  Schema.isGreaterThanOrEqualTo(0),
  Schema.isLessThanOrEqualTo(100_000),
);

const Servings = Schema.Finite.check(Schema.isGreaterThan(0), Schema.isLessThanOrEqualTo(10_000));

const Quantity = Schema.Finite.check(
  Schema.isGreaterThan(0),
  Schema.isLessThanOrEqualTo(1_000_000),
);

export const ImageKey = Schema.String.check(Schema.isPattern(/^[0-9a-f-]{36}\.(?:jpg|png|webp)$/));

export const Visibility = Schema.Literals(["private", "followers"]);

export type Visibility = typeof Visibility.Type;

export const TagName = text(40);

export const FolderName = text(60);

export const tables = {
  recipes: Schema.Struct({
    title: text(200),
    servings: Schema.optionalKey(Servings),
    prepMinutes: Schema.optionalKey(Minutes),
    cookMinutes: Schema.optionalKey(Minutes),
    notes: Schema.optionalKey(text(20_000)),
    imageKey: Schema.optionalKey(ImageKey),
    visibility: Visibility,
    createdById: Id,
    createdAt: Millis,
    updatedAt: Millis,
  }),
  ingredients: Schema.Struct({
    recipeId: Id,
    position: Position,
    quantity: Schema.optionalKey(Quantity),
    unit: Schema.optionalKey(Schema.Literals(unitCodes)),
    name: text(200),
  }),
  steps: Schema.Struct({ recipeId: Id, position: Position, text: text(5000) }),
  tags: Schema.Struct({ name: TagName }),
  recipeTags: Schema.Struct({ recipeId: Id, tagId: Id }),
  folders: Schema.Struct({ name: FolderName }),
  recipeFolders: Schema.Struct({ recipeId: Id, folderId: Id }),
  plannedMeals: Schema.Struct({
    date: Schema.String.check(
      Schema.makeFilter(
        (date: string) =>
          /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/.test(date) &&
          new Date(`${date}T00:00:00Z`).toISOString().startsWith(date),
      ),
    ),
    position: Position,
    recipeId: Id,
  }),
};

export type TableId = keyof typeof tables;

export type Stored<Table extends TableId> = (typeof tables)[Table]["Type"] & { id: string };

export const collections = {
  tags: { linkTable: "recipeTags", ownerCell: "tagId" },
  folders: { linkTable: "recipeFolders", ownerCell: "folderId" },
} as const;

export type Collection = keyof typeof collections;

const linkTables = new Set<string>(Object.values(collections).map(({ linkTable }) => linkTable));

export function createRecipeStore() {
  return createMergeableStore().setTablesSchema(createEffectSchematizer().toTablesSchema(tables));
}

export function linkId(ownerId: string, recipeId: string) {
  return `${ownerId}:${recipeId}`;
}

export function isValidRowId(tableId: string, rowId: string) {
  if (linkTables.has(tableId)) {
    const [ownerId = "", recipeId = "", ...rest] = rowId.split(":");

    return rest.length === 0 && idPattern.test(ownerId) && idPattern.test(recipeId);
  }

  return Object.hasOwn(tables, tableId) && idPattern.test(rowId);
}

const cellDecoders: Record.ReadonlyRecord<
  string,
  Record.ReadonlyRecord<string, (cell: { cell: Cell }) => Option.Option<object>>
> = Record.map(tables, (table) => {
  const fields: Record.ReadonlyRecord<string, Schema.Codec<unknown, unknown>> = table.fields;

  return Record.map(fields, (field) => Schema.decodeUnknownOption(Schema.Struct({ cell: field })));
});

export function isValidCell(
  tableId: string,
  rowId: string,
  cellId: string,
  cell: Cell | undefined,
) {
  const decode = cellDecoders[tableId]?.[cellId];

  if (!decode || !isValidRowId(tableId, rowId)) return false;

  if (cell === undefined) return true;

  if (linkTables.has(tableId)) {
    const [ownerId, recipeId] = rowId.split(":");
    const expected = cellId === "recipeId" ? recipeId : ownerId;

    if (cell !== expected) return false;
  }

  return Option.isSome(decode({ cell }));
}

export function readRow<Table extends TableId>(
  content: Tables,
  tableId: Table,
  rowId: string,
): Stored<Table> | undefined {
  return Option.getOrUndefined(
    Option.map(Schema.decodeUnknownOption(tables[tableId])(content[tableId]?.[rowId]), (row) => ({
      ...row,
      id: rowId,
    })),
  );
}

export function readRows<Table extends TableId>(content: Tables, tableId: Table) {
  return Object.keys(content[tableId] ?? {}).flatMap((rowId) => {
    const row = readRow(content, tableId, rowId);

    return row ? [row] : [];
  });
}
