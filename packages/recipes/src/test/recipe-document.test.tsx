import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";

import { RecipeDocument } from "../recipe-document";

describe("RecipeDocument", () => {
  const recipe = {
    title: "Mum's <best> tart",
    servings: 6,
    prepMinutes: 20,
    cookMinutes: 40,
    notes: "Serve warm.\nWith cream.",
    ingredients: [
      { quantity: 0.5, unit: "kg" as const, name: "apples" },
      { name: "a pinch of salt" },
    ],
    steps: ["Peel the apples.", "Bake & enjoy."],
  };

  it("escapes the recipe and lays out every section", () => {
    const html = renderToStaticMarkup(
      <RecipeDocument recipe={recipe} photoUrl="https://lardon.test/r/abc/photo" />,
    );

    expect(html).toContain("<h1>Mum&#x27;s &lt;best&gt; tart</h1>");
    expect(html).toContain('<p class="facts">1 h, 6 servings</p>');
    expect(html).toContain("<li><span>apples</span><strong>½ kg</strong></li>");
    expect(html).toContain("<li><span>a pinch of salt</span><strong></strong></li>");
    expect(html).toContain("<li>Bake &amp; enjoy.</li>");
    expect(html).toContain('<p class="card notes">Serve warm.\nWith cream.</p>');
    expect(html).toContain('<img class="photo" src="https://lardon.test/r/abc/photo" alt=""/>');
    expect(html).toContain('font: 16px/1.45 -apple-system, BlinkMacSystemFont, "Inter"');
  });

  it("scales amounts and servings and converts units", () => {
    const html = renderToStaticMarkup(
      <RecipeDocument recipe={recipe} scale={2.5} unitSystem="imperial" />,
    );

    expect(html).toContain('<p class="facts">1 h, 15 servings</p>');
    expect(html).toContain("<li><span>apples</span><strong>2¾ lb</strong></li>");
  });

  it("says how much a recipe without servings was scaled", () => {
    const html = renderToStaticMarkup(
      <RecipeDocument recipe={{ ...recipe, servings: undefined }} scale={2.5} />,
    );

    expect(html).toContain('<p class="facts">1 h, 2½ times the recipe</p>');
  });

  it("leaves out empty sections", () => {
    const html = renderToStaticMarkup(
      <RecipeDocument recipe={{ title: "Toast", ingredients: [], steps: [] }} />,
    );

    expect(html).not.toContain("<h2>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain('class="facts"');
  });
});
