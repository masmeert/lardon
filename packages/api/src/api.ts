import { HttpApi, OpenApi } from "effect/http-api";

import { AccountApi, SystemApi } from "./system";

export class Api extends HttpApi.make("lardon")
  .add(SystemApi)
  .add(AccountApi)
  .annotateMerge(OpenApi.annotations({ title: "Lardon API" })) {}
