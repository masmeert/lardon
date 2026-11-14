import { HttpApi, OpenApi } from "effect/http-api";

import { FamiliesApi } from "./families";
import { FeedApi } from "./feed";
import { FollowsApi } from "./follows";
import { ImagesApi } from "./images";
import { ProfilesApi } from "./profiles";
import { SharesApi } from "./shares";
import { AccountApi, SystemApi } from "./system";

export class Api extends HttpApi.make("lardon")
  .add(SystemApi)
  .add(AccountApi)
  .add(FamiliesApi)
  .add(ImagesApi)
  .add(SharesApi)
  .add(ProfilesApi)
  .add(FollowsApi)
  .add(FeedApi)
  .annotateMerge(OpenApi.annotations({ title: "Lardon API" })) {}
