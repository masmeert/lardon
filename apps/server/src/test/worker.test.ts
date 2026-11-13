import { createRecipe, emptyDraft, recipeDetail, saveRecipe, setVisibility } from "@lardon/recipes";
import { recipeDraft } from "@lardon/recipes/commands";
import { createRecipeStore, readRows } from "@lardon/recipes/tables";
import { createWsSynchronizer } from "tinybase/synchronizers/synchronizer-ws-client";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import type { WebSocket } from "ws";

import { startWorker, waitFor } from "./worker";

const TINY_PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  ),
  (character) => character.charCodeAt(0),
);

const DAY_MS = 24 * 60 * 60 * 1000;

let worker: Awaited<ReturnType<typeof startWorker>>;

beforeAll(async () => {
  worker = await startWorker();
}, 60_000);

afterAll(() => worker.dispose());

async function json<Body>(response: Response) {
  expect(response.ok).toBe(true);

  // SAFETY: each call names the success schema of the endpoint it requested, and the response is ok.
  return (await response.json()) as Body;
}

async function device(cookie: string, familyId: string) {
  const socket = worker.syncSocket(cookie, familyId);
  const closed = new Promise<number>((resolve) => socket.on("close", (code) => resolve(code)));
  await new Promise((resolve, reject) => {
    socket.on("open", resolve);
    socket.on("error", reject);
  });
  const store = createRecipeStore();
  const synchronizer = await createWsSynchronizer<WebSocket>(store, socket, 5);
  await synchronizer.startSync();

  return { store, closed };
}

async function familyOf(names: string[]) {
  const accounts = await Promise.all(
    names.map((name) => worker.signIn(`${name}-${crypto.randomUUID()}@example.com`)),
  );

  const [owner, ...others] = accounts;

  const family = await json<{ id: string }>(
    await worker.request(owner!.cookie, "/api/families", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Meerts" }),
    }),
  );

  const invite = await json<{ code: string }>(
    await worker.request(owner!.cookie, `/api/families/${family.id}/invites`, { method: "POST" }),
  );

  for (const account of others) {
    await json(
      await worker.request(account.cookie, "/api/families/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: invite.code }),
      }),
    );
  }

  return { accounts, familyId: family.id };
}

describe("the worker in workerd", () => {
  it("creates a personal family when someone signs in for the first time", async () => {
    const alice = await worker.signIn("first-sign-in@example.com");

    const families = await json<Array<{ personal: boolean }>>(
      await worker.request(alice.cookie, "/api/families"),
    );

    expect(families.map((family) => family.personal)).toEqual([true]);
  });

  it("lets only signed-in members of a family sync it", async () => {
    const { familyId } = await familyOf(["alice"]);
    const outsider = await worker.signIn(`outsider-${crypto.randomUUID()}@example.com`);

    expect((await fetch(`${worker.origin}/sync/${familyId}`)).status).toBe(401);
    expect((await worker.request(outsider.cookie, `/sync/${familyId}`)).status).toBe(404);
  });

  it("syncs recipes live and enforces who may change what", async () => {
    const {
      accounts: [alice, bob],
      familyId,
    } = await familyOf(["alice", "bob"]);

    const aliceDevice = await device(alice!.cookie, familyId);
    const bobDevice = await device(bob!.cookie, familyId);

    const recipeId = createRecipe(
      aliceDevice.store,
      {
        ...emptyDraft(),
        title: "Soup",
        ingredients: [{ id: "onion", quantity: 1, unit: null, name: "onion" }],
      },
      alice!.id,
    );

    const received = await waitFor(() => recipeDetail(bobDevice.store, recipeId));
    expect(received.ingredients.map((ingredient) => ingredient.name)).toEqual(["onion"]);

    const base = recipeDraft(bobDevice.store, recipeId)!;
    saveRecipe(bobDevice.store, recipeId, base, { ...base, servings: 4 });
    await waitFor(() => recipeDetail(aliceDevice.store, recipeId)?.servings);

    setVisibility(bobDevice.store, recipeId, "followers");
    const spoofedId = createRecipe(bobDevice.store, { ...emptyDraft(), title: "Fake" }, alice!.id);
    await waitFor(() => aliceDevice.store.getCell("recipes", spoofedId, "title"));
    await waitFor(() =>
      recipeDetail(bobDevice.store, recipeId)?.visibility === "private" ? true : undefined,
    );

    expect(recipeDetail(aliceDevice.store, recipeId)?.visibility).toBe("private");
    expect(aliceDevice.store.getCell("recipes", spoofedId, "createdById")).toBeUndefined();
    expect(readRows(aliceDevice.store, "recipes").map((recipe) => recipe.id)).toEqual([recipeId]);

    await worker.cleanUp(familyId, Date.now());
    await waitFor(() => (aliceDevice.store.hasRow("recipes", spoofedId) ? undefined : true));
  });

  it("keeps pictures for members and cleans up the ones no recipe uses", async () => {
    const {
      accounts: [alice],
      familyId,
    } = await familyOf(["alice"]);

    const outsider = await worker.signIn(`outsider-${crypto.randomUUID()}@example.com`);
    const aliceDevice = await device(alice!.cookie, familyId);

    const upload = async () =>
      (
        await json<{ imageKey: string }>(
          await worker.request(alice!.cookie, `/api/families/${familyId}/images`, {
            method: "PUT",
            headers: { "content-type": "application/octet-stream" },
            body: TINY_PNG,
          }),
        )
      ).imageKey;

    const used = await upload();
    const unused = await upload();
    createRecipe(aliceDevice.store, { ...emptyDraft(), title: "Soup", imageKey: used }, alice!.id);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const downloaded = await worker.request(
      alice!.cookie,
      `/api/families/${familyId}/images/${used}`,
    );

    expect(new Uint8Array(await downloaded.arrayBuffer())).toEqual(TINY_PNG);
    expect(
      (await worker.request(outsider.cookie, `/api/families/${familyId}/images/${used}`)).status,
    ).toBe(404);

    const stored = async () =>
      (await (await worker.images()).list({ prefix: `families/${familyId}/` })).objects
        .map((object) => object.key.slice(`families/${familyId}/`.length))
        .sort((first, second) => first.localeCompare(second));

    await worker.cleanUp(familyId, Date.now());
    expect(await stored()).toEqual(
      [used, unused].sort((first, second) => first.localeCompare(second)),
    );

    await worker.cleanUp(familyId, Date.now() + 2 * DAY_MS);
    expect(await stored()).toEqual([used]);
  });

  it("disconnects removed members and deletes the family's data with it", async () => {
    const {
      accounts: [alice, bob],
      familyId,
    } = await familyOf(["alice", "bob"]);

    const aliceDevice = await device(alice!.cookie, familyId);
    const bobDevice = await device(bob!.cookie, familyId);
    await worker.request(alice!.cookie, `/api/families/${familyId}/images`, {
      method: "PUT",
      body: TINY_PNG,
    });

    await worker.request(alice!.cookie, `/api/families/${familyId}/members/${bob!.id}`, {
      method: "DELETE",
    });
    expect(await bobDevice.closed).toBe(4403);

    await worker.request(alice!.cookie, `/api/families/${familyId}`, { method: "DELETE" });
    expect(await aliceDevice.closed).toBe(4404);
    expect((await worker.request(alice!.cookie, `/sync/${familyId}`)).status).toBe(404);

    const left = await (await worker.images()).list({ prefix: `families/${familyId}/` });
    expect(left.objects).toEqual([]);
  });
});
