import { Context } from "effect";
import { initLogger } from "evlog";
import { WaitUntil } from "evlog/effect";

import { webHandler } from "./layers";

initLogger({ env: { service: "lardon-server" } });

export default {
  fetch(request: Request, _env: Env, executionContext: ExecutionContext) {
    return webHandler(
      request,
      Context.make(WaitUntil, executionContext.waitUntil.bind(executionContext)),
    );
  },
};
