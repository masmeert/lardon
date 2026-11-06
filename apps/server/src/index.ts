import { Context } from "effect";
import { initLogger } from "evlog";
import { WaitUntil } from "evlog/effect";

import { webHandler } from "./layers";
import { handleRecipeSyncRequest, matchRecipeSyncRequest } from "./sync";

export { SyncBackendDO } from "./sync";

initLogger({ env: { service: "lardon-server" } });

export default {
  fetch(request: Request, _env: Env, executionContext: ExecutionContext) {
    const syncRequest = matchRecipeSyncRequest(request);
    return syncRequest
      ? handleRecipeSyncRequest(request, syncRequest, executionContext)
      : webHandler(
          request,
          Context.make(WaitUntil, executionContext.waitUntil.bind(executionContext)),
        );
  },
};
