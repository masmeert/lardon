import type { AuthedContext } from "@lardon/api/context";
import { IMAGE_KEY_PATTERN } from "@lardon/api/images/storage";
import { MAX_IMAGE_BYTES, uploadRecipeImage } from "@lardon/api/images/upload";
import { exportFormats, exportRecipe, exportSections } from "@lardon/api/recipes/export/index";
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { type Context as HonoContext, Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { createContext } from "./context";
import { getImageStore } from "./services";

export const routes = new Hono();

async function requireSession(honoContext: HonoContext): Promise<AuthedContext> {
  const context = await createContext({ context: honoContext });
  if (!context.session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
  }
  return { ...context, session: context.session };
}

routes.onError((error, honoContext) => {
  if (!(error instanceof TRPCError)) throw error;
  return honoContext.json(
    { error: error.message },
    getHTTPStatusCodeFromError(error) as ContentfulStatusCode,
  );
});

routes.put("/api/recipes/:id/image", async (honoContext) => {
  if (Number(honoContext.req.header("content-length") ?? 0) > MAX_IMAGE_BYTES) {
    return honoContext.json(
      { error: "The image is larger than 5 MB. Choose a smaller picture or resize it." },
      413,
    );
  }
  const context = await requireSession(honoContext);
  const bytes = new Uint8Array(await honoContext.req.arrayBuffer());
  return honoContext.json(await uploadRecipeImage(context, honoContext.req.param("id"), bytes));
});

routes.get("/api/recipes/:id/export/:format", async (honoContext) => {
  const format = exportFormats.find((option) => option === honoContext.req.param("format"));
  if (!format) {
    return honoContext.json(
      { error: `Unknown export format. Use one of: ${exportFormats.join(", ")}.` },
      400,
    );
  }
  const requested = honoContext.req.query("include")?.split(",").filter(Boolean);
  const unknown = requested?.filter(
    (section) => !exportSections.some((known) => known === section),
  );
  if (unknown?.length) {
    return honoContext.json(
      {
        error: `Unknown export section: ${unknown.join(", ")}. Use any of: ${exportSections.join(", ")}.`,
      },
      400,
    );
  }
  const context = await requireSession(honoContext);
  const file = await exportRecipe(
    context,
    honoContext.req.param("id"),
    format,
    exportSections.filter((section) => !requested || requested.includes(section)),
  );
  return honoContext.body(file.body as string | Uint8Array<ArrayBuffer>, 200, {
    "Content-Type": file.contentType,
    "Content-Disposition": `${honoContext.req.query("download") === "0" ? "inline" : "attachment"}; filename="${file.filename}"`,
    "Cache-Control": "private, no-store",
  });
});

routes.get("/images/*", async (honoContext) => {
  const key = honoContext.req.path.slice("/images/".length);
  if (!IMAGE_KEY_PATTERN.test(key)) return honoContext.notFound();
  const image = await getImageStore().get(key);
  if (!image) return honoContext.notFound();
  return honoContext.body(image.body, 200, {
    "Content-Type": image.contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
  });
});
