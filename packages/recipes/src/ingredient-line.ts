import { type UnitCode, unitCode } from "./units";

export type IngredientLine = { quantity: number | null; unit: UnitCode | null; name: string };

const vulgarFractions = new Map([
  ["⅛", 1 / 8],
  ["¼", 1 / 4],
  ["⅓", 1 / 3],
  ["⅜", 3 / 8],
  ["½", 1 / 2],
  ["⅝", 5 / 8],
  ["⅔", 2 / 3],
  ["¾", 3 / 4],
  ["⅞", 7 / 8],
]);

const quantityPattern = String.raw`(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?[⅛¼⅓⅜½⅝⅔¾⅞]?|[⅛¼⅓⅜½⅝⅔¾⅞])`;

function parseQuantity(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .reduce((total, part) => {
      const fraction = part.match(/^(\d+)\/(\d+)$/);

      if (fraction) return total + Number(fraction[1]) / Number(fraction[2]);
      const mixed = part.match(/^(\d+(?:[.,]\d+)?)?([⅛¼⅓⅜½⅝⅔¾⅞])?$/);

      return (
        total +
        Number((mixed?.[1] ?? "0").replace(",", ".")) +
        (mixed?.[2] ? (vulgarFractions.get(mixed[2]) ?? 0) : 0)
      );
    }, 0);
}

export function parseIngredientLine(line: string): IngredientLine | null {
  const text = line.trim().replace(/\s+/g, " ");

  if (!text) return null;

  const match = text.match(new RegExp(`^${quantityPattern}\\s*(.*)$`));

  if (!match) return { quantity: null, unit: null, name: text };
  const [, quantityText = "", rest = ""] = match;
  const [firstWord = "", ...otherWords] = rest.split(" ");
  const unit = otherWords.length > 0 ? unitCode(firstWord) : null;

  return {
    quantity: parseQuantity(quantityText),
    unit,
    name: (unit ? otherWords.join(" ") : rest).trim() || text,
  };
}

export function ingredientFromParts({
  amount,
  unit,
  name,
}: {
  amount: string;
  unit: UnitCode | null;
  name: string;
}): IngredientLine | null {
  if (!amount.trim() && !unit) return parseIngredientLine(name);
  const cleanName = name.trim().replace(/\s+/g, " ");

  if (!cleanName) return null;

  return { quantity: amount.trim() ? parseQuantity(amount) : null, unit, name: cleanName };
}

export function amountInput(text: string) {
  const [, whole = "", separator = "", fraction = ""] =
    /^(\d*)([.,]?)(\d*)/.exec(text.replace(/[^\d.,]/g, "")) ?? [];

  return `${whole.replace(/^0+(?=\d)/, "") || (separator ? "0" : "")}${separator}${fraction}`.slice(
    0,
    4,
  );
}
