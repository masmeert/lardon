# Architecture

Lardon is a local-first recipe app for families. Every device holds a full copy of its family's recipes and works offline. The server stores, authorizes and relays changes. Sharing a recipe and the followers feed are the only features that need to be online.

## Principles

- **Few moving parts.** One Worker, one D1 database, one R2 bucket, one Durable Object class, all in the EU jurisdiction. Nothing else until a feature needs it.
- **The device does the work.** Scaling, unit conversion, ingredient parsing, PDF export and image resizing run on the device. The server never computes on recipe content.
- **State, not history.** We sync the current data, merged field by field. A delete removes the content everywhere, so there is nothing to scrub later.
- **Additive schema changes only.** New cells get defaults and readers tolerate missing cells. Nothing is renamed or reused. A cell that is no longer needed is ignored, then dropped by a cleanup once no supported app version writes it.
- **One schema source.** Recipe data is described once with Effect Schema in `packages/recipes`. The TinyBase schema (through `tinybase/schematizers/schematizer-effect`), the app's validation and the server's write checks all derive from it.

## Families

Everyone has their own recipes and can be in at most one family on top. The app always shows both together as one library; nothing is ever split by family. Each is a separate store, because a store syncs in full to everyone who can open it.

- **Your own store.** Signing up creates it (in the data, a family of one that nobody can join or leave). Without a family, everything lives here. In a family, it holds what you marked "Only me".
- **The family store.** Creating or joining a family gives you its store. Creating or joining a second one is refused until you leave the first. New recipes go to the family by default, and so do new folders and tags.
- **"Only me" and "Share with family"** move a recipe between the two stores under the same id. The device writes the recipe into the target store first, copies its photo, then deletes it from the source, so an interruption leaves a duplicate, never a loss. Tags and folders come along by name.
- **Folders and tags are matched by name** across the two stores, so the family shares one set. Putting a private recipe in a family folder creates a folder of the same name in your own store, which only you see. Each store stays self-contained, and its cleanup never sees a link to another store.
- **Joining** keeps the recipes you already have private. Share them one by one.
- **Leaving** takes nothing with you: shared recipes stay with the family, and your private ones stay yours.
- **Removing a member** closes their open sync connections to that family immediately, and their device drops its copy.
- **Deleting an account** deletes your own store and leaves your family. A family whose last member leaves is deleted with its store and images. Ownership passes to the longest-standing member when the last owner leaves.

## Where data lives

| Place                                        | Holds                                                                                                         | Why there                                                                                      |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| D1                                           | Accounts and sessions (better-auth), families, members, invites, shares, profiles, follows, published recipes | Small, relational, global. Answers "who may open which family" and "what may I see in my feed" |
| `FamilyStore` Durable Object, one per family | Recipes, ingredients, steps, tags, folders, meal plan                                                         | One authoritative copy per family, next to its WebSockets                                      |
| R2                                           | `families/<familyId>/<uuid>.<ext>` photos                                                                     | Large blobs stay out of the synced data                                                        |
| Device                                       | A full copy of every family store the account belongs to, plus device preferences                             | Works offline. Device preferences never sync                                                   |

## Sync

TinyBase `MergeableStore` on both sides. Each cell carries a hybrid logical clock timestamp, and the latest write to a cell wins on every peer.

**On the device**: one `MergeableStore` per family, created with TinyBase's React hooks (`useCreateMergeableStore`, `useCreatePersister`, `useCreateSynchronizer`) in a component per family that stays mounted while the user is signed in, whichever family is on screen. Each store is saved with `createExpoSqlitePersister` in its own database file (`family-<id>.db`, as one JSON row, the only mode a `MergeableStore` supports) and synced with `createWsSynchronizer` over a `reconnecting-websocket`, which reconnects with backoff and sends a fresh session cookie each time. Screens read plain table data (TinyBase's reactive hooks, or `useRecipes`, which subscribes to several family stores at once for the library's merged list) and pass it to the shared queries, which keeps them correct under the React Compiler. The library always shows your own recipes and your family's together. The family list comes from TanStack Query, persisted on the device so the library opens offline. Signing out erases every family database; leaving a family erases its own.

**On the server**: `FamilyStore extends WsServerDurableObject`, persisted with `createDurableObjectSqlStoragePersister` in `fragmented` mode, so a change rewrites one SQL row per changed TinyBase row instead of the whole store. WebSockets hibernate, so idle families cost no duration.

**Connecting**:

1. The app opens `wss://api.lardon.app/sync/<familyId>` for each of its families, with its session in the `Authorization` header. React Native's WebSocket sends custom headers. The app reads the session again on every reconnect, so a renewed session never leaves sync stuck on a stale one.
2. The Worker validates the session with better-auth, checks in D1 that the user is a member of that family, and forwards the upgrade to the family's Durable Object under a path it builds itself. A non-member gets `404`, the same as a family that doesn't exist.
3. `FamilyStore.authorize` reads the user ID the Worker added and keeps it as the connection's context. It survives hibernation.
4. `FamilyStore.canWriteCell` checks every incoming cell against the schema. A rejected cell is neither stored nor relayed, and the sender is brought back in line with the server.

**Rows are checked cell by cell, not as a whole.** A row can arrive with one cell rejected and the others accepted. Queries therefore decode every row with its Effect schema and skip the ones that don't decode yet, and commands write a whole row in one transaction. Locally, the store's schema rejects a write with a bad value; from other devices, it drops just the bad cells.

**Cells merge independently**, so a row whose cells only make sense together writes all of them every time, with `null` for "none".

**Deleting a recipe** deletes its ingredients, steps, tag links, folder links and planned meals in the same transaction. A row left behind by a concurrent edit on another device (an orphaned line, or a deleted recipe's `updatedAt` written after the delete) is hidden by queries and removed by the next cleanup.

**Ordering** uses fractional index strings (`position`), so moving a line writes one cell.

## Data model

### Family store

Synced, one per family. Row IDs are random unless noted. Cells stay flat (no JSON cells), so two people editing different fields of the same recipe never overwrite each other. Every reference points inside the same store: the meal plan lives in the family store, so only family recipes can be planned, and without a family it lives in your own store. Making a recipe "Only me" drops its planned days.

| Table           | Cells                                                                                                                                        | Notes                                                                                                                                                                                                                                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `recipes`       | `title`, `servings`, `prepMinutes`, `cookMinutes`, `notes`, `imageKey`, `visibility`, `savedFromId`, `createdById`, `createdAt`, `updatedAt` | `servings` is what scaling starts from. `imageKey` is a file name (`<uuid>.jpg`), since the store already implies the family. `visibility` is `private` (default) or `followers`. `savedFromId` is set on a recipe saved from the feed: the published recipe it was copied from, so the feed shows it as saved and can remove that copy |
| `ingredients`   | `recipeId`, `position`, `quantity`, `unit`, `name`                                                                                           | `quantity` is a single number. `unit` is a code from a fixed list (weights and volumes such as `g`, `ml`, `tbsp`, `cup`, plus `pinch`, `clove`, `can`, `slice`, `sprig`, `bunch`, `handful`), or empty for a count like "2 eggs". The app shows units in the user's language and converts between systems                               |
| `steps`         | `recipeId`, `position`, `text`                                                                                                               |                                                                                                                                                                                                                                                                                                                                         |
| `tags`          | `name`                                                                                                                                       | No emoji: the old app's tag emoji were rejected as clutter                                                                                                                                                                                                                                                                              |
| `recipeTags`    | `recipeId`, `tagId`                                                                                                                          | Row ID `<tagId>:<recipeId>`, so two devices adding the same tag make one row                                                                                                                                                                                                                                                            |
| `folders`       | `name`                                                                                                                                       |                                                                                                                                                                                                                                                                                                                                         |
| `recipeFolders` | `recipeId`, `folderId`                                                                                                                       | Row ID `<folderId>:<recipeId>`                                                                                                                                                                                                                                                                                                          |
| `meals`         | `recipeId`                                                                                                                                   | Row ID is the date (`YYYY-MM-DD`): one meal per day. Two members planning the same day resolve to the later choice                                                                                                                                                                                                                      |

Recipes are plain lists: no sections. Not stored, on purpose: source URL, nutrition, servings unit, ingredient notes and quantity ranges. Each can come back as a plain addition when a feature needs it.

### D1

| Table                             | Columns                                                                                                | Notes                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `user`, `session`, `verification` | Managed by better-auth                                                                                 | `session` keeps IP and user agent for a "your devices" list; the privacy policy says so                                          |
| `account`                         | Managed by better-auth                                                                                 | Google and Apple tokens aren't kept: we never call their APIs                                                                    |
| `family`                          | `id`, `name`, `personalForUserId`, `createdAt`, `updatedAt`                                            | `personalForUserId` is unique and set only on a personal family, so each account has exactly one, and it can't be shared or left |
| `family_member`                   | `familyId`, `userId`, `role` (`owner` or `member`), `joinedAt`                                         |                                                                                                                                  |
| `family_invite`                   | `code`, `familyId`, `createdById`, `expiresAt`                                                         | Reusable until it expires, 7 days after creation                                                                                 |
| `share`                           | `token`, `recipeId`, `createdById`, `snapshot`, `imageKey`, `sourceImageKey`, `expiresAt`, `createdAt` | Expires 7 days after creation                                                                                                    |
| `profile`                         | `userId`, `username`, `bio`                                                                            | Name and photo come from `user`                                                                                                  |
| `follow`                          | `followerId`, `followeeId`, `status` (`pending` or `approved`), `createdAt`                            |                                                                                                                                  |
| `block`                           | `blockerId`, `blockedId`, `createdAt`                                                                  |                                                                                                                                  |
| `published_recipe`                | `recipeId`, `familyId`, `authorId`, `snapshot`, `imageKey`, `publishedAt`, `updatedAt`                 | Written only by the family's Durable Object                                                                                      |
| `report`                          | `reporterId`, the reported user or recipe, `reason`, `createdAt`                                       | Added with the report button                                                                                                     |

### R2

| Key                          | Holds                                                                              | Removed                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `families/<familyId>/<file>` | Recipe photos                                                                      | By the family's daily cleanup once unreferenced, or with the family |
| `shares/<token>.<ext>`       | A share's own copy of the photo, so deleting the recipe doesn't break a valid link | With the share, when it expires                                     |
| `users/<userId>/<file>`      | Uploaded profile photos                                                            | When replaced, or with the account                                  |

### Device only

Never synced: library layout and sort order, and the unit system (original, metric or imperial).

## Images

1. The device resizes and compresses a photo before upload.
2. `PUT /api/families/:familyId/images` checks membership, the type by its bytes and the size, then stores it in R2 under that family and returns its key.
3. The recipe's `imageKey` cell holds its file name.
4. Reading goes through `GET /api/families/:familyId/images/:imageKey` with the session. Removed members lose access, and the device caches the files.
5. Moving a recipe copies its photo with `POST /api/families/:familyId/images/copy`, which checks membership of both families. The source copy is left to the cleanup below.
6. A daily alarm in each `FamilyStore` first deletes rows that still don't decode and lines whose recipe, tag or folder is gone, then deletes R2 objects in the family's prefix that no recipe references and that are older than a day. The grace period covers uploads whose `imageKey` hasn't synced yet. If the store has no recipes at all, it skips the photos, so a store that failed to load can never wipe them.

## Sharing

**Share link**: "Share link" in the app's Share menu sends the recipe as it is now to `POST /api/shares`. It's disabled while offline.

- The server checks membership of the recipe's family, then stores a snapshot in D1 with a random token that expires after 7 days. The duration is ours to set, not the user's.
- Sharing the same recipe again hands back your existing link when nothing changed (same snapshot, same photo) and restarts its 7 days. An edit or a new photo gets a new link, and each person gets their own.
- The page `lardon.app/r/<token>` is rendered by the Worker, with Open Graph tags so the link preview shows the title and photo. Its photo is the share's own copy, made when the link is created, and served through the share token.
- After expiry, the page and its photo return a plain "This link has expired" page.
- A daily cron trigger deletes expired shares and their photos.

Viewing a page doesn't use it up, so link previews are harmless.

**PDF**: "Share PDF" renders the same `RecipeDocument` component as the share page (`react-dom/server.edge`, the build that runs on Hermes) and prints it to an A4 file with `expo-print`, then hands it to the share sheet. It downloads the photo to embed it, and offline it leaves the photo out rather than failing.

## Followers feed

People follow each other, and the home screen shows a feed of new recipes from the people you follow. Nothing in Lardon is public: a recipe is either private or visible to your approved followers.

**Profiles and follows** live in D1:

| Table     | Columns                                                                     |
| --------- | --------------------------------------------------------------------------- |
| `profile` | `userId`, `username` (unique), `bio`                                        |
| `follow`  | `followerId`, `followeeId`, `status` (`pending` or `approved`), `createdAt` |
| `block`   | `blockerId`, `blockedId`, `createdAt`                                       |

- You find someone by their exact username. A profile shows only a name, a photo and a bio until you're an approved follower. You need a username of your own to follow someone, so they can see who's asking.
- Every follow is a request the other person approves. They can remove a follower at any time.
- Blocking removes the follow both ways and stops new requests. To the blocked person, the blocker's username no longer exists.
- Username lookups and follow requests use the `sensitive` rate limit, so usernames can't be enumerated.

**Visibility** is the `visibility` cell on a recipe, `private` by default. Only the recipe's creator can change it: `canWriteCell` compares the sender with the row's `createdById` in the Durable Object's own store. The app shows it as "Followers" in the recipe's "Shared with" menu, to its creator only.

**Publishing** is done by the family's Durable Object, never by the device. It already holds the store in memory and sees every change, whichever member makes it:

- A change to recipes, ingredients or steps schedules a publish 5 seconds later. It then makes D1's `published_recipe` (`recipeId`, `familyId`, `authorId`, snapshot, `imageKey`, `publishedAt`, `updatedAt`) match the store: every `followers` recipe whose creator is still a member gets a row, written only when its snapshot or photo changed, and the family's other rows are deleted. The daily clean-up runs the same pass.
- A Durable Object has one alarm, so it keeps both jobs' due times and sets the alarm to the earlier one. A publish never delays the clean-up.
- Turning the recipe private, deleting it, or its creator leaving the family deletes that row.
- A recipe keeps its ID when it moves to another family, so its row is updated in place and keeps its `publishedAt`. A source family only deletes a row that still names it as the family, so a move can't unpublish the copy it just made. A row is only ever updated for the same author, so another family can't take over a published recipe by reusing its ID.
- An edit keeps `publishedAt`, so it doesn't bring a recipe back to the top of the feed.

**The feed** is a query when you open it: approved follows joined with `published_recipe`, newest `publishedAt` first, paged by cursor, using an index on `(authorId, publishedAt)`. Nothing is copied into followers' feeds ahead of time, so removing a follower or blocking someone takes effect on their next request.

- The app caches the pages it loaded, so the feed still shows offline.
- Feed photos go through `GET /api/feed/:recipeId/images/:imageKey`, which checks the follow, not family membership, and serves the family's own copy. The key is in the path, so a new photo gets a new URL and the device can cache each one for good.
- "Save to my recipes" copies the photo with `POST /api/feed/:recipeId/image-copy`, then the device creates a private recipe of your own from the snapshot, in your family or in "Only me", with `savedFromId` set to the published recipe. Tapping the bookmark again deletes that copy.

**Deleting an account** deletes its profile, follows, blocks and published recipes, through foreign keys to `user`.

With no public content, there's no moderation queue to run. A way to report a follower or a recipe is still worth having.

## Server layout

One Worker (`apps/server`):

| Route             | Handler                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `/api/auth/*`     | better-auth                                                                  |
| `/api/*`          | Effect `HttpApi`: families, invites, shares, images, profiles, follows, feed |
| `/sync/:familyId` | WebSocket upgrade, authorized, forwarded to the family's `FamilyStore`       |
| `lardon.app/r/*`  | Share pages                                                                  |

The marketing site stays a static Astro build.

## Packages

| Package            | Holds                                                                                                                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/recipes` | Effect schemas, the derived TinyBase schema, commands (functions over a store), queries, units, ingredient parsing, and the `RecipeDocument` used by share pages and PDFs. Shared by the app and the server |
| `packages/emails`  | React Email templates, each with its subject and generated plain text. `vp run dev` there opens the preview on port 3030                                                                                    |
| `packages/api`     | The `HttpApi` definition and its errors, shared by the server and the generated client                                                                                                                      |
| `packages/auth`    | better-auth setup                                                                                                                                                                                           |
| `packages/db`      | Drizzle schema and migrations for D1                                                                                                                                                                        |
| `packages/infra`   | Alchemy stack                                                                                                                                                                                               |

## Safety nets

- D1 Time Travel and Durable Object point-in-time recovery cover accidental writes. Their retention on the free plan still needs checking.
- Rate limits stay on auth, sensitive routes and the API.
- Logs go to Cloudflare Workers Logs: evlog writes one structured JSON event per request.

## Limits to keep in mind

- **Free plan**: about 100,000 Durable Object requests a day, where each incoming WebSocket message counts, and 1 GB per Durable Object. A single cell edit costs about one message.
- **Memory**: every family store the account belongs to is fully in memory on the device, and each one in its Durable Object. 2,000 recipes with 20,000 ingredients take about 6 MB with merge metadata. A typical family library is a tenth of that.
- **D1 on the free plan**: 5 million rows read and 100,000 rows written a day. The feed reads one page of rows per load, and publishing writes one row per change.
- **Connections**: one WebSocket per family. TinyBase's Durable Object server can't share a socket between paths, which is fine for a handful of families.

## Verified in a spike

Run against TinyBase 10.1.0 on local workerd, with a Worker that authorizes and forwards to a `FamilyStore`:

- No session gets `401`, and a non-member gets `404`.
- Changes reach other devices. Offline edits to different fields of the same recipe both survive, and the later edit wins on the same field.
- A blank title is rejected, and the sender is reverted. A `createdById` that isn't the sender is rejected. The rest of that row still lands, which is why queries check required cells.
- After a delete, the server keeps only row and cell IDs with timestamps, not the content.
- 2,000 recipes and 20,000 ingredients reach a second device in about 3.4 s. A new device pulls everything in about 0.8 s, in 5 messages. The server database is 7.5 MB.
- Data survives a server restart.

Still to verify on a device: the Expo SQLite persister at that size, cold start offline, and hibernation.
