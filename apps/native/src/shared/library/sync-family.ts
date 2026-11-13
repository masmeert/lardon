import { AppState } from "react-native";
import type { MergeableStore } from "tinybase";
import {
  type WsSynchronizer,
  createWsSynchronizer,
} from "tinybase/synchronizers/synchronizer-ws-client";

import { authClient } from "#/shared/auth";
import { ENV } from "#/shared/config";

const removedFromFamilyCodes = new Set([4403, 4404]);

export function syncFamily(store: MergeableStore, familyId: string, onRemoved: () => void) {
  let isStopped = false;
  let retryDelayMs = 1000;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let socket: WebSocket | undefined;
  let synchronizer: WsSynchronizer<WebSocket> | undefined;

  async function connect() {
    retryTimer = undefined;
    const cookie = await authClient.getCookie();

    if (isStopped) return;

    const connection: WebSocket = Reflect.construct(WebSocket, [
      `${ENV.EXPO_PUBLIC_SERVER_URL.replace(/^http/, "ws")}/sync/${familyId}`,
      undefined,
      { headers: { cookie } },
    ]);

    socket = connection;
    connection.addEventListener("open", () => {
      retryDelayMs = 1000;
    });
    connection.addEventListener("close", (event) => {
      void synchronizer?.destroy();
      synchronizer = undefined;
      socket = undefined;

      if (isStopped) return;

      if (removedFromFamilyCodes.has(event.code)) {
        onRemoved();

        return;
      }

      retryTimer = setTimeout(() => void connect(), retryDelayMs);
      retryDelayMs = Math.min(retryDelayMs * 2, 30_000);
    });

    try {
      synchronizer = await createWsSynchronizer<WebSocket>(store, connection, 5);
      await synchronizer.startSync();
    } catch {
      connection.close();
    }
  }

  const appState = AppState.addEventListener("change", (state) => {
    if (state !== "active" || socket || retryTimer === undefined) return;

    clearTimeout(retryTimer);
    retryDelayMs = 1000;
    void connect();
  });

  void connect();

  return function stop() {
    isStopped = true;
    appState.remove();
    clearTimeout(retryTimer);
    socket?.close();
  };
}
