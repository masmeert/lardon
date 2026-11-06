import { View } from "react-native";

import { RecipeCard } from "@/components/sign-in/recipe-card";

const sampleRecipes = {
  potAuFeu: {
    emoji: "🍲",
    title: "Pot-au-feu",
    ingredients: ["1 kg beef", "4 carrots", "2 leeks", "1 onion"],
  },
  quicheLorraine: {
    emoji: "🥧",
    title: "Quiche lorraine",
    ingredients: ["200 g lardons", "3 eggs", "200 ml cream", "1 pie crust"],
  },
  nicoise: {
    emoji: "🥗",
    title: "Niçoise",
    ingredients: ["tuna", "olives", "2 eggs", "tomatoes"],
  },
};

export function Hero() {
  return (
    <View className="flex-row items-center justify-center">
      <RecipeCard
        recipe={sampleRecipes.potAuFeu}
        ruledLineCount={6}
        isFeatured={false}
        className="w-32 -mr-3"
        rotationDeg={-6}
        floatDistancePt={6}
        floatPeriodMs={6000}
      />
      <RecipeCard
        recipe={sampleRecipes.quicheLorraine}
        ruledLineCount={7}
        isFeatured
        className="z-10 w-48"
        rotationDeg={0}
        floatDistancePt={4}
        floatPeriodMs={4200}
      />
      <RecipeCard
        recipe={sampleRecipes.nicoise}
        ruledLineCount={6}
        isFeatured={false}
        className="w-32 -ml-3"
        rotationDeg={6}
        floatDistancePt={-4.5}
        floatPeriodMs={5600}
      />
    </View>
  );
}
