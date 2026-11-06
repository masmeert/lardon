import { View } from "react-native";

import { RecipeCard } from "@/components/sign-in/recipe-card";

export function Hero() {
  return (
    <View className="flex-row items-center justify-center">
      {[
        {
          emoji: "🍲",
          name: "Pot-au-feu",
          cookingTime: "3 h",
          tint: "bg-rose-100",
          className: "w-36 -mr-12",
          emojiClassName: "text-5xl",
          rotationDeg: -6,
          floatDistancePt: 6,
          floatPeriodMs: 6000,
        },
        {
          emoji: "🥧",
          name: "Quiche lorraine",
          cookingTime: "45 min",
          tint: "bg-amber-100",
          className: "z-10 w-52",
          emojiClassName: "text-7xl",
          rotationDeg: 0,
          floatDistancePt: 4,
          floatPeriodMs: 4200,
        },
        {
          emoji: "🥗",
          name: "Salade niçoise",
          cookingTime: "20 min",
          tint: "bg-lime-100",
          className: "w-36 -ml-12",
          emojiClassName: "text-5xl",
          rotationDeg: 6,
          floatDistancePt: -4.5,
          floatPeriodMs: 5600,
        },
      ].map((recipe) => (
        <RecipeCard key={recipe.name} {...recipe} />
      ))}
    </View>
  );
}
