import { type ReactNode, createContext, use, useState } from "react";

import type { EditorBase, RecipeFields } from "./recipe-fields";

const RecipeEditorContext = createContext<{
  base: EditorBase;
  fields: RecipeFields;
  change: (changes: Partial<RecipeFields>) => void;
  changeWith: (update: (fields: RecipeFields) => Partial<RecipeFields>) => void;
} | null>(null);

export function RecipeEditorProvider({
  base,
  children,
}: {
  base: EditorBase;
  children: ReactNode;
}) {
  const [fields, setFields] = useState(base.fields);

  return (
    <RecipeEditorContext
      value={{
        base,
        fields,
        change: (changes) => setFields((current) => ({ ...current, ...changes })),
        changeWith: (update) => setFields((current) => ({ ...current, ...update(current) })),
      }}
    >
      {children}
    </RecipeEditorContext>
  );
}

export function useRecipeEditor() {
  const editor = use(RecipeEditorContext);

  if (!editor) throw new Error("useRecipeEditor needs a RecipeEditorProvider above it");

  return editor;
}
