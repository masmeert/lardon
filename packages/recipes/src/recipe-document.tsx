import { colors } from "@lardon/brand";
import type { CSSProperties, ReactNode } from "react";

import { formatAmount, formatDuration, formatQuantity } from "./format";
import type { RecipeSnapshot } from "./snapshot";
import type { UnitSystem } from "./units";

const heading: CSSProperties = {
  margin: "32px 4px 12px",
  fontSize: 17,
  lineHeight: "22px",
  fontWeight: 600,
};

const card: CSSProperties = {
  margin: 0,
  padding: "4px 16px",
  background: colors.paper,
  borderRadius: 18,
  listStyle: "none",
};

const section: CSSProperties = { breakInside: "avoid" };

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
        <meta name="color-scheme" content="light" />
        <title>{recipe.title}</title>
        {head}
      </head>
      <body
        style={{
          margin: 0,
          background: colors.background,
          color: colors.foreground,
          font: '16px/1.45 -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 48px" }}>
          {photoUrl && (
            <img
              src={photoUrl}
              alt=""
              style={{
                display: "block",
                width: "100%",
                aspectRatio: "4 / 3",
                objectFit: "cover",
                boxSizing: "border-box",
                border: `4px solid ${colors.paper}`,
                borderRadius: 24,
                boxShadow: "0 0 1px rgba(34, 28, 24, 0.16), 0 1px 2px rgba(34, 28, 24, 0.08)",
              }}
            />
          )}
          <h1 style={{ margin: "24px 4px 4px", fontSize: 30, lineHeight: "36px", fontWeight: 700 }}>
            {recipe.title}
          </h1>
          {facts.length > 0 && (
            <p style={{ margin: "0 4px", color: colors.muted }}>{facts.join(", ")}</p>
          )}
          {recipe.ingredients.length > 0 && (
            <section style={section}>
              <h2 style={heading}>Ingredients</h2>
              <ul style={card}>
                {recipe.ingredients.map((ingredient, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "10px 0",
                      borderTop: index === 0 ? undefined : `1px solid ${colors.hairline}`,
                      breakInside: "avoid",
                    }}
                  >
                    <span>{ingredient.name}</span>
                    <strong style={{ color: colors.accent, fontWeight: 600, whiteSpace: "nowrap" }}>
                      {formatAmount(ingredient, scale, unitSystem)}
                    </strong>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {recipe.steps.length > 0 && (
            <section style={section}>
              <h2 style={heading}>Steps</h2>
              <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {recipe.steps.map((step, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      gap: 12,
                      marginBottom: 8,
                      padding: "12px 16px",
                      background: colors.paper,
                      borderRadius: 18,
                      breakInside: "avoid",
                    }}
                  >
                    <span
                      style={{
                        flex: "none",
                        width: 22,
                        height: 22,
                        marginTop: 1,
                        borderRadius: 11,
                        background: colors.background,
                        color: colors.accent,
                        fontSize: 13,
                        fontWeight: 700,
                        lineHeight: "22px",
                        textAlign: "center",
                      }}
                    >
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {recipe.notes && (
            <section style={section}>
              <h2 style={heading}>Notes</h2>
              <p style={{ ...card, padding: "12px 16px", whiteSpace: "pre-wrap" }}>
                {recipe.notes}
              </p>
            </section>
          )}
          {footer}
        </main>
      </body>
    </html>
  );
}
