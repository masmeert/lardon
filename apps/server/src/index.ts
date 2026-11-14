import { Context } from "effect";
import { initLogger } from "evlog";
import { WaitUntil } from "evlog/effect";

import { serverRuntime, webHandler } from "./layers";
import { Shares } from "./shares";
import { syncFamilyId, syncResponse } from "./sync";

export { FamilyStore } from "./family-store";

initLogger({ env: { service: "lardon-server" } });

export default {
  fetch(request: Request, _env: Env, executionContext: ExecutionContext) {
    const familyId = syncFamilyId(request);

    return familyId
      ? serverRuntime.runPromise(syncResponse(request, familyId))
      : webHandler(
          request,
          Context.make(WaitUntil, executionContext.waitUntil.bind(executionContext)),
        );
  },
  scheduled(_controller: ScheduledController, _env: Env, executionContext: ExecutionContext) {
    executionContext.waitUntil(
      serverRuntime.runPromise(Shares.use((shares) => shares.deleteExpired())),
    );
  },
};
