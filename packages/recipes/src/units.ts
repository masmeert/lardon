import { Record } from "effect";

export type UnitSystem = "original" | "metric" | "imperial";

type Measure = {
  dimension: "mass" | "volume";
  baseAmount: number;
  system: "metric" | "imperial" | "both";
};

const measures = {
  mg: { dimension: "mass", baseAmount: 0.001, system: "metric" },
  g: { dimension: "mass", baseAmount: 1, system: "metric" },
  kg: { dimension: "mass", baseAmount: 1000, system: "metric" },
  oz: { dimension: "mass", baseAmount: 28.3495, system: "imperial" },
  lb: { dimension: "mass", baseAmount: 453.592, system: "imperial" },
  ml: { dimension: "volume", baseAmount: 1, system: "metric" },
  cl: { dimension: "volume", baseAmount: 10, system: "metric" },
  dl: { dimension: "volume", baseAmount: 100, system: "metric" },
  l: { dimension: "volume", baseAmount: 1000, system: "metric" },
  tsp: { dimension: "volume", baseAmount: 4.92892, system: "both" },
  tbsp: { dimension: "volume", baseAmount: 14.7868, system: "both" },
  "fl oz": { dimension: "volume", baseAmount: 29.5735, system: "imperial" },
  cup: { dimension: "volume", baseAmount: 236.588, system: "imperial" },
  pint: { dimension: "volume", baseAmount: 473.176, system: "imperial" },
  quart: { dimension: "volume", baseAmount: 946.353, system: "imperial" },
} as const satisfies Record<string, Measure>;

export const unitCodes = [
  ...Record.keys(measures),
  "pinch",
  "clove",
  "can",
  "slice",
  "sprig",
  "bunch",
  "handful",
] as const;

export type UnitCode = (typeof unitCodes)[number];

export type Amount = { quantity: number; unit: UnitCode | null };

function isMeasured(unit: UnitCode | null): unit is keyof typeof measures {
  return unit !== null && Object.hasOwn(measures, unit);
}

const aliases = new Map<string, UnitCode>([
  ["milligram", "mg"],
  ["gram", "g"],
  ["gr", "g"],
  ["kilogram", "kg"],
  ["kilo", "kg"],
  ["ounce", "oz"],
  ["pound", "lb"],
  ["lbs", "lb"],
  ["millilitre", "ml"],
  ["milliliter", "ml"],
  ["centilitre", "cl"],
  ["centiliter", "cl"],
  ["decilitre", "dl"],
  ["deciliter", "dl"],
  ["litre", "l"],
  ["liter", "l"],
  ["teaspoon", "tsp"],
  ["tablespoon", "tbsp"],
  ["fluid ounce", "fl oz"],
  ["c", "cup"],
  ["pinche", "pinch"],
]);

function isUnitCode(name: string): name is UnitCode {
  return unitCodes.some((code) => code === name);
}

export function unitCode(text: string): UnitCode | null {
  const key = text.trim().toLowerCase().replace(/\.$/, "");
  const singular = key.endsWith("s") && !isUnitCode(key) ? key.slice(0, -1) : key;

  return (
    [key, singular]
      .map((name) => (isUnitCode(name) ? name : aliases.get(name)))
      .find((code) => code !== undefined) ?? null
  );
}

function roundMetric(amount: number) {
  if (amount < 10) return Math.round(amount * 10) / 10;

  return amount < 100 ? Math.round(amount) : Math.round(amount / 5) * 5;
}

function roundImperial(amount: number) {
  return amount < 1 ? Math.round(amount * 8) / 8 || 0.125 : Math.round(amount * 4) / 4;
}

function inUnit(
  baseAmount: number,
  unit: keyof typeof measures,
  round: (amount: number) => number,
) {
  return { quantity: round(baseAmount / measures[unit].baseAmount), unit };
}

export function convertAmount(quantity: number, unit: UnitCode | null, system: UnitSystem): Amount {
  const known = isMeasured(unit) ? measures[unit] : null;

  if (system === "original" || !known || known.system === "both" || known.system === system) {
    return { quantity, unit };
  }

  const baseAmount = quantity * known.baseAmount;

  if (system === "metric") {
    const [small, large] =
      known.dimension === "mass" ? (["g", "kg"] as const) : (["ml", "l"] as const);

    return baseAmount >= 1000
      ? inUnit(baseAmount, large, (amount) => Math.round(amount * 100) / 100)
      : inUnit(baseAmount, small, roundMetric);
  }

  if (known.dimension === "mass") {
    return baseAmount >= 453.592
      ? inUnit(baseAmount, "lb", roundImperial)
      : inUnit(baseAmount, "oz", roundImperial);
  }

  if (baseAmount < 14.7868) return inUnit(baseAmount, "tsp", roundImperial);

  return baseAmount < 59.15
    ? inUnit(baseAmount, "tbsp", roundImperial)
    : inUnit(baseAmount, "cup", roundImperial);
}
