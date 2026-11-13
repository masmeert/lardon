import { HttpApi, OpenApi } from "effect/http-api";

import { FamiliesApi } from "./families";
import { ImagesApi } from "./images";
import { AccountApi, SystemApi } from "./system";

export class Api extends HttpApi.make("lardon")
  .add(SystemApi)
  .add(AccountApi)
  .add(FamiliesApi)
  .add(ImagesApi)
  .annotateMerge(OpenApi.annotations({ title: "Lardon API" })) {}
