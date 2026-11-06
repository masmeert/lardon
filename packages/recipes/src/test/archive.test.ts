import { Result } from "effect";
import { describe, expect, it } from "vite-plus/test";

import {
  createRecipeArchive,
  decodeRecipeArchive,
  encodeRecipeArchive,
  importRecipeArchive,
} from "../archive";
import { copyRecipe, createRecipe } from "../commands";
import { readRecipeDocument, recipe$, recipes$ } from "../queries";
import { createTestStore } from "./store";

const picture = { contentType: "image/png" as const, data: Uint8Array.from([137, 80, 78, 71]) };

describe("recipe archives", () => {
  it("round-trips recipes and pictures through a JSON file", async () => {
    const source = await createTestStore();
    const target = await createTestStore();

    const pieId = createRecipe(source, {
      title: "Pie",
      createdById: "alice",
      imageKey: "user-alice/pie.png",
      tags: ["dessert"],
      ingredients: [
        { title: "Crust", ingredients: [{ quantity: 250, unit: "g", name: "flour", note: null }] },
      ],
      steps: [{ title: null, steps: [{ text: "Bake." }] }],
    });

    createRecipe(source, { title: "Soup", createdById: "alice" });

    const json = encodeRecipeArchive(
      createRecipeArchive(source, new Map([["user-alice/pie.png", picture]])),
    );

    const decoded = decodeRecipeArchive(json);
    expect(Result.isSuccess(decoded)).toBe(true);
    const archive = Result.getOrThrow(decoded);
    expect(archive.recipes.map((recipe) => recipe.title).sort()).toEqual(["Pie", "Soup"]);
    const archivedPie = archive.recipes.find((recipe) => recipe.title === "Pie")!;
    expect(archivedPie.picture?.data).toEqual(picture.data);
    expect("imageKey" in archivedPie).toBe(false);

    const imported = importRecipeArchive(
      target,
      archive,
      "bob",
      archive.recipes.map((recipe) => (recipe.picture ? "user-bob/pie.png" : null)),
    );

    expect(imported).toHaveLength(2);
    expect(target.query(recipes$).map((recipe) => recipe.createdById)).toEqual(["bob", "bob"]);
    const importedPie = target.query(recipes$).find((recipe) => recipe.title === "Pie")!;
    expect(importedPie.imageKey).toBe("user-bob/pie.png");
    const { imageKey: _sourceKey, ...sourcePie } = readRecipeDocument(source, pieId)!;
    const { imageKey: _targetKey, ...targetPie } = readRecipeDocument(target, importedPie.id)!;
    expect(targetPie).toEqual(sourcePie);
  });

  it("rejects files that aren't valid exports", () => {
    expect(Result.isFailure(decodeRecipeArchive("not json"))).toBe(true);
    expect(Result.isFailure(decodeRecipeArchive(JSON.stringify({ format: "other" })))).toBe(true);

    const tampered = JSON.stringify({
      format: "lardon.recipes",
      version: 1,
      exportedAt: new Date().toISOString(),
      recipes: [
        {
          title: "",
          servings: null,
          servingsUnit: null,
          prepTimeMinutes: null,
          cookTimeMinutes: null,
          notes: null,
          sourceUrl: "javascript:alert(1)",
          nutrition: null,
          tags: [],
          ingredients: [],
          steps: [],
          picture: null,
        },
      ],
    });

    expect(Result.isFailure(decodeRecipeArchive(tampered))).toBe(true);
  });

  it("lets a copy point at a picture copied into the target store", async () => {
    const personal = await createTestStore();
    const family = await createTestStore();

    const recipeId = createRecipe(personal, {
      title: "Stew",
      createdById: "alice",
      imageKey: "user-alice/stew.jpg",
    });

    const copyId = copyRecipe(personal, family, recipeId, "alice", {
      imageKey: "family-meerts/stew-copy.jpg",
    });

    expect(family.query(recipe$(copyId!))?.imageKey).toBe("family-meerts/stew-copy.jpg");
  });
});
