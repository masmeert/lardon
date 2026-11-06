# lardon

## Features

- **TypeScript** - For type safety and improved developer experience
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Effect HTTP** - The Worker serves the API, better-auth and image routes from one Effect router
- **Effect** - Typed services, errors and the schema-first `HttpApi` with a generated client
- **LiveStore** - Local-first recipe data, synced through Cloudflare Durable Objects
- **workers** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **Cloudflare D1** - Database engine
- **Authentication** - Better-Auth
- **Vite+** - Unified toolchain: task runner, Oxlint + Oxfmt, type-aware checks, tsdown packing and commit hooks

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Database Setup

This project uses Cloudflare D1 (SQLite) with Drizzle ORM.

Runtime database access uses the Cloudflare `DB` binding from `packages/infra/alchemy.run.ts`. If a local `DATABASE_URL` is present, it is only for database tooling.

Alchemy provisions the D1 database and applies migrations during `deploy`.

1. Generate migration files:

```bash
pnpm run db:generate
```

Then, run the development server:

```bash
pnpm run dev
```

From `apps/native`, run the `ios` script for iOS or the `android` script for Android to build and launch the app. See [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/) for device setup.
The API is running at [http://localhost:3000](http://localhost:3000).

## Environment Configuration

Each app owns its environment schema in `.env.schema`. Varlock generates `src/env.ts` during installation; run `pnpm run env:generate` after changing a schema. Commit schemas, and keep secrets in ignored env files or your deployment platform.

Import the generated `ENV` accessor in application code. Shared database and auth packages receive configuration or initialized clients from the application. See [Varlock's monorepo guide](https://varlock.dev/guides/monorepos/).

For Cloudflare, Alchemy loads and validates deployment inputs with `varlock/auto-load` in its Node deployment process. Worker code reads native bindings; web clients use the framework's public env API through `src/env.public.ts` where needed. Alchemy supplies resource URLs and managed database credentials. In-Worker Varlock protections are deferred until an official Alchemy integration is available; see [the non-Wrangler deployment guidance](https://varlock.dev/integrations/cloudflare/#non-wrangler-deploy-tools-alchemy-sst-pulumi).

The framework integration or server bootstrap loads Varlock. Node deployments must include Varlock and its dependencies alongside the app schema.

Run standalone Node tools that use Varlock from the owning app directory so they load that app's schema and env files. `env:generate` only generates TypeScript files; it does not initialize environment values in a subsequent command.

## Deployment

### Alchemy

- Target: server on Cloudflare + Axiom observability
- Configure provider accounts: `cd packages/infra && pnpm exec alchemy profile edit`
- Dev: pnpm run dev
- Deploy: pnpm run deploy
- Destroy: pnpm run destroy

`alchemy profile edit` stores the selected Axiom, Cloudflare, Neon, PlanetScale, and/or Prisma provider profiles under `~/.alchemy`; no provider-specific setup command is required by this scaffold.

Deploys are staged and default to a personal `dev_<username>` stage. For production, run the deploy with an explicit stage from `packages/infra`:

```bash
cd packages/infra && pnpm exec alchemy deploy --stage production
```

Alchemy creates a stage-specific Axiom dataset and a least-privilege ingest token. `dev` injects the credentials into the observed apps without writing the token to an env file.

## Git Hooks and Formatting

- Run checks: `pnpm run check`

## Project Structure

```
lardon/
├── apps/
│   ├── native/      # Mobile application (React Native, Expo)
│   └── server/      # Cloudflare Worker: Effect HttpApi handlers, LiveStore sync backend
├── packages/
│   ├── api/         # Shared HttpApi definition (endpoints, schemas, errors)
│   ├── auth/        # Authentication configuration & logic
│   ├── db/          # Database schema & queries (auth, families)
│   └── recipes/     # LiveStore recipe schema, commands, queries and export
```

## Available Scripts

- `pnpm run dev`: Start all applications in development mode
- `pnpm run build`: Build all applications
- `pnpm run dev:native`: Start the React Native/Expo development server
- `pnpm run db:generate`: Generate database client/types
- `vp check`: Format, lint and type-check the workspace (`--fix` to apply fixes)
- `vp lint`: Run lint checks
- `vp fmt`: Format the workspace
- `vp staged`: Run checks against staged files (runs on pre-commit)

## License

Lardon is source-available under the [PolyForm Strict License 1.0.0](LICENSE.md). You may read the code and use it for personal, noncommercial purposes, but you may not modify it, redistribute it, or use it commercially.
