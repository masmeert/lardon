# Lardon

Recipes for the whole family. Every device keeps a full copy of its families' recipes, tags, folders and meal plan, works offline, and syncs through Cloudflare when it's online.

How it fits together is in [ARCHITECTURE.md](ARCHITECTURE.md). How to write code here is in [AGENTS.md](AGENTS.md).

## Repository

| Path               | Holds                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| `apps/native`      | The Expo app                                                                                        |
| `apps/server`      | The Cloudflare Worker: the Effect `HttpApi`, better-auth, sync and the `FamilyStore` Durable Object |
| `apps/web`         | The static Astro website on lardon.app                                                              |
| `packages/recipes` | The TinyBase data model, commands and queries, shared by the app and the server                     |
| `packages/api`     | The `HttpApi` definition and its errors, shared by the server and its clients                       |
| `packages/auth`    | The better-auth setup                                                                               |
| `packages/db`      | The Drizzle schema and migrations for D1                                                            |
| `packages/brand`   | Colours, logo and operator details shared by the website and emails                                 |
| `packages/infra`   | The Alchemy stack                                                                                   |

## Getting started

```bash
vp install
```

Secrets come from Infisical through varlock. The machine identity that reads them goes in the gitignored `apps/server/.env.local` as `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET`.

```bash
vp run dev          # the Worker on :3000 and the website, through alchemy dev
vp run dev:native   # Metro for the app
```

Locally, sign-in codes are printed in the server log instead of being emailed.

## Checks

```bash
vp check            # format, lint and types
vp run -r test      # every package's tests, including the Worker running in workerd
```

CI runs both, plus `vp run -r build`, on every push to `main` and every pull request.

## Database changes

Edit `packages/db/src/schema`, then generate a migration:

```bash
vp run db:generate
```

Alchemy applies migrations on deploy.

## Deploying

Work happens on `develop`. Every push to `main` that passes CI deploys to production through `.github/workflows/deploy.yml`; other branches never deploy. Release by fast-forwarding `main` to a `develop` commit that passed CI: `main` only accepts commits whose CI check already passed, and neither branch accepts force pushes or deletion. The job plans first and stops if the plan deletes or replaces anything, since Alchemy deletes every resource that is no longer declared. Deploy those by hand after reading the plan:

```bash
cd packages/infra
APP_ENV=production vp exec alchemy plan --stage prod
APP_ENV=production vp exec alchemy deploy --stage prod
```

CI signs in to Infisical as a machine identity through GitHub's OIDC token, so no Infisical secret is stored in GitHub. Its Cloudflare token and account ID come from `packages/infra/stacks/github.ts`, which creates a deploy token limited to this account and writes both into the `production` environment. Run it again to rotate the token, with a Cloudflare credential that can create API tokens:

```bash
cd packages/infra
vp exec alchemy deploy --config stacks/github.ts --stage prod --profile admin
```
