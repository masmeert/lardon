import { HttpApi, OpenApi } from "effect/http-api";

import { FamiliesApi } from "./families";
import { AccountApi, SystemApi } from "./system";

export class Api extends HttpApi.make("lardon")
  .add(SystemApi)
  .add(AccountApi)
  .add(FamiliesApi)
  .annotateMerge(OpenApi.annotations({ title: "Lardon API" })) {}
