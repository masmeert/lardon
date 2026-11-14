import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { familiesQuery } from "#/entities/family";
import { RecipeEditorStack, emptyBase } from "#/features/edit-recipe";

export function NewRecipeLayout() {
  const { data: families = [] } = useQuery(familiesQuery);
  const [base] = useState(() => emptyBase(families.every((family) => family.personal)));

  return <RecipeEditorStack title="New recipe" base={base} />;
}
