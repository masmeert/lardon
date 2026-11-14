import type { ReactNode } from "react";

import { formatAmount, formatDuration, formatQuantity } from "./format";
import type { RecipeSnapshot } from "./snapshot";
import type { UnitSystem } from "./units";

export function RecipeDocument({
  recipe,
  scale = 1,
  unitSystem = "original",
  photoUrl,
  head,
  footer,
}: {
  recipe: RecipeSnapshot;
  scale?: number;
  unitSystem?: UnitSystem;
  photoUrl?: string | null;
  head?: ReactNode;
  footer?: ReactNode;
}) {
  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);

  const facts = [
    totalMinutes > 0 ? formatDuration(totalMinutes) : null,
    recipe.servings === undefined
      ? scale === 1
        ? null
        : `${formatQuantity(scale)} times the recipe`
      : recipe.servings * scale === 1
        ? "1 serving"
        : `${formatQuantity(recipe.servings * scale)} servings`,
  ].filter((fact) => fact !== null);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{recipe.title}</title>
        {head}
        <style
          dangerouslySetInnerHTML={{
            __html: `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #f2f2f7;
    color: #000;
    font: 16px/1.45 -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  main { max-width: 640px; margin: 0 auto; padding: 24px 20px 48px; }
  .photo {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border: 4px solid #fff;
    border-radius: 24px;
    box-shadow: 0 0 1px rgba(34, 28, 24, 0.16), 0 1px 2px rgba(34, 28, 24, 0.08);
  }
  h1 { margin: 24px 4px 4px; font-size: 30px; line-height: 36px; font-weight: 700; }
  .facts { margin: 0 4px; color: #6e6e73; }
  h2 { margin: 32px 4px 12px; font-size: 17px; line-height: 22px; font-weight: 600; }
  section { break-inside: avoid; page-break-inside: avoid; }
  .card { margin: 0; padding: 4px 16px; background: #fff; border-radius: 18px; list-style: none; }
  .ingredients li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    break-inside: avoid;
  }
  .ingredients li + li { border-top: 1px solid #e5e5ea; }
  .ingredients strong { color: #5a6a1f; font-weight: 600; white-space: nowrap; }
  .steps { margin: 0; padding: 0; list-style: none; counter-reset: step; }
  .steps li {
    position: relative;
    margin-bottom: 8px;
    padding: 12px 16px 12px 50px;
    background: #fff;
    border-radius: 18px;
    counter-increment: step;
    break-inside: avoid;
  }
  .steps li::before {
    content: counter(step);
    position: absolute;
    left: 16px;
    top: 13px;
    width: 22px;
    height: 22px;
    border-radius: 11px;
    background: #f2f2f7;
    color: #5a6a1f;
    font-size: 13px;
    font-weight: 700;
    line-height: 22px;
    text-align: center;
  }
  .notes { padding: 12px 16px; white-space: pre-wrap; }
  footer { margin-top: 40px; color: #6e6e73; font-size: 14px; text-align: center; }
  footer a { color: #5a6a1f; font-weight: 600; text-decoration: none; }
  @page { margin: 14mm 0; }
  @media print { body { background: #fff; } main { padding-top: 0; } .card, .steps li { background: #f2f2f7; } }
`,
          }}
        />
      </head>
      <body>
        <main>
          {photoUrl && <img className="photo" src={photoUrl} alt="" />}
          <h1>{recipe.title}</h1>
          {facts.length > 0 && <p className="facts">{facts.join(", ")}</p>}
          {recipe.ingredients.length > 0 && (
            <section>
              <h2>Ingredients</h2>
              <ul className="card ingredients">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index}>
                    <span>{ingredient.name}</span>
                    <strong>{formatAmount(ingredient, scale, unitSystem)}</strong>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {recipe.steps.length > 0 && (
            <section>
              <h2>Steps</h2>
              <ol className="steps">
                {recipe.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </section>
          )}
          {recipe.notes && (
            <section>
              <h2>Notes</h2>
              <p className="card notes">{recipe.notes}</p>
            </section>
          )}
          {footer}
        </main>
      </body>
    </html>
  );
}
