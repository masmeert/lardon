import { familiesRouter } from "../families/router";
import { protectedProcedure, publicProcedure, router } from "../index";
import { recipesRouter } from "../recipes/router";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  me: protectedProcedure.query(({ ctx }) => ctx.session.user),
  recipes: recipesRouter,
  families: familiesRouter,
});
export type AppRouter = typeof appRouter;
