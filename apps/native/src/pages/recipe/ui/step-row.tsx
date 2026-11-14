import { stepParts } from "@lardon/recipes";
import { Text, View } from "react-native";

import { cn } from "#/shared/lib";

export function StepRow({
  number,
  text,
  ingredientNames,
}: {
  number: number;
  text: string;
  ingredientNames: readonly string[];
}) {
  return (
    <View
      style={{ borderCurve: "continuous" }}
      className="flex-row items-start gap-3 rounded-card bg-paper px-4 py-3"
    >
      <View className="mt-px size-5.5 items-center justify-center rounded-full bg-background shadow-rim">
        <Text className="text-label font-bold text-accent">{number}</Text>
      </View>
      <Text className="flex-1 text-body text-foreground">
        {stepParts(text, ingredientNames).map((part, index) =>
          part.kind === "plain" ? (
            part.text
          ) : (
            <Text
              key={index}
              className={cn(
                "font-semibold",
                part.kind === "ingredient" ? "text-accent" : "text-accent-deep",
              )}
            >
              {part.text}
            </Text>
          ),
        )}
      </Text>
    </View>
  );
}
