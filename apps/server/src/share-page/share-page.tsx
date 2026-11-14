import { RecipeDocument } from "@lardon/recipes/recipe-document";
import type { RecipeSnapshot } from "@lardon/recipes/snapshot";

export function SharePage({
  recipe,
  url,
  photoUrl,
  expiresAt,
}: {
  recipe: RecipeSnapshot;
  url: string;
  photoUrl: string | null;
  expiresAt: Date;
}) {
  const description = [
    recipe.ingredients.length === 1 ? "1 ingredient" : `${recipe.ingredients.length} ingredients`,
    recipe.steps.length === 1 ? "1 step" : `${recipe.steps.length} steps`,
  ].join(", ");

  return (
    <RecipeDocument
      recipe={recipe}
      photoUrl={photoUrl}
      head={
        <>
          <meta name="robots" content="noindex" />
          <meta name="description" content={description} />
          <meta property="og:type" content="article" />
          <meta property="og:site_name" content="Lardon" />
          <meta property="og:title" content={recipe.title} />
          <meta property="og:description" content={description} />
          <meta property="og:url" content={url} />
          {photoUrl && <meta property="og:image" content={photoUrl} />}
          <meta name="twitter:card" content={photoUrl ? "summary_large_image" : "summary"} />
        </>
      }
      footer={
        <footer>
          Shared from <a href="https://lardon.app">Lardon</a>. This link works until{" "}
          {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" }).format(expiresAt)}.
        </footer>
      }
    />
  );
}
