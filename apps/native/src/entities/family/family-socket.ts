import ReconnectingWebSocket from "reconnecting-websocket";

import { authClient } from "#/shared/auth";
import { ENV } from "#/shared/config";

const removedFromFamilyCodes = new Set([4403, 4404]);

// SAFETY: React Native's WebSocket takes a third argument with headers, which the DOM typings Expo loads leave out.
const ReactNativeWebSocket = WebSocket as new (
  url: string,
  protocols: string | string[] | undefined,
  options: { headers: Record<string, string> },
) => WebSocket;

export function familySocket(familyId: string, onRemoved: () => void) {
  let cookie = "";

  class SessionWebSocket extends ReactNativeWebSocket {
    constructor(url: string, protocols?: string | string[]) {
      super(url, protocols, { headers: { cookie } });
    }
  }

  const socket = new ReconnectingWebSocket(
    async () => {
      cookie = await authClient.getCookie();

      return `${ENV.EXPO_PUBLIC_SERVER_URL.replace(/^http/, "ws")}/sync/${familyId}`;
    },
    undefined,
    { WebSocket: SessionWebSocket, maxReconnectionDelay: 30_000 },
  );

  socket.addEventListener("close", (event) => {
    if (!removedFromFamilyCodes.has(event.code)) return;

    socket.close();
    onRemoved();
  });

  return socket;
}
