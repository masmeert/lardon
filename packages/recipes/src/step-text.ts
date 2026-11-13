export type StepPart = { text: string; kind: "plain" | "ingredient" | "duration" };

const letter = /[A-Za-zÀ-ɏ0-9]/;

const duration =
  "\\d+(?:[.,]\\d+)?(?:\\s*(?:to|-|–|or)\\s*\\d+(?:[.,]\\d+)?)?\\s*(?:hours?|hrs?|h|minutes?|mins?|min|seconds?|secs?)";

function ingredientTerms(ingredientNames: readonly string[]) {
  return [
    ...new Set(
      ingredientNames.flatMap((name) => {
        const words = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
        const lastWord = words.at(-1) ?? "";

        return words.length > 1 && lastWord.length >= 4
          ? [words.join(" "), lastWord]
          : [words.join(" ")];
      }),
    ),
  ]
    .filter(Boolean)
    .sort((first, second) => second.length - first.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}

export function stepParts(text: string, ingredientNames: readonly string[]): StepPart[] {
  const terms = ingredientTerms(ingredientNames);

  const pattern = new RegExp(
    terms.length > 0 ? `(${duration})|((?:${terms.join("|")})(?:es|s)?)` : `(${duration})`,
    "gi",
  );

  const parts: StepPart[] = [];
  let plainStart = 0;

  for (const match of text.matchAll(pattern)) {
    const start = match.index;
    const end = start + match[0].length;

    if (letter.test(text[start - 1] ?? "") || letter.test(text[end] ?? "")) continue;

    if (start > plainStart) parts.push({ text: text.slice(plainStart, start), kind: "plain" });
    parts.push({ text: match[0], kind: match[1] ? "duration" : "ingredient" });
    plainStart = end;
  }

  if (plainStart < text.length) parts.push({ text: text.slice(plainStart), kind: "plain" });

  return parts;
}
