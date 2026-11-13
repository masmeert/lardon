import * as Cloudflare from "@alchemy.run/cloudflare";
import * as GitHub from "@alchemy.run/github";
import * as Alchemy from "alchemy";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";

const repository = { owner: "masmeert", repository: "lardon" };

export default Alchemy.Stack(
  "lardon-github",
  {
    providers: Layer.mergeAll(Cloudflare.providers(), GitHub.providers()),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const { accountId } = yield* yield* Cloudflare.CloudflareEnvironment;

    const deployToken = yield* Cloudflare.ApiToken.AccountApiToken("deploy-token", {
      name: "lardon-deploy",
      accountId,
      policies: [
        {
          effect: "allow",
          permissionGroups: [
            "Workers Scripts Write",
            "Workers Observability Write",
            "Workers R2 Storage Write",
            "D1 Write",
            "Secrets Store Write",
            "Account Settings Write",
          ],
          resources: { [`com.cloudflare.api.account.${accountId}`]: "*" },
        },
        {
          effect: "allow",
          permissionGroups: ["Zone Read", "DNS Write", "Workers Routes Write"],
          resources: {
            [`com.cloudflare.api.account.${accountId}`]: {
              "com.cloudflare.api.account.zone.*": "*",
            },
          },
        },
      ],
    });

    const production = yield* GitHub.Environment("production", {
      ...repository,
      name: "production",
      deploymentBranchPolicy: { customBranchPolicies: ["main"] },
    });

    yield* GitHub.Secret("cloudflare-api-token", {
      ...repository,
      environment: production,
      name: "CLOUDFLARE_API_TOKEN",
      value: deployToken.value,
    });

    yield* GitHub.Secret("cloudflare-account-id", {
      ...repository,
      environment: production,
      name: "CLOUDFLARE_ACCOUNT_ID",
      value: Redacted.make(accountId),
    });
  }),
);
