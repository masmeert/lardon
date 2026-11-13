import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query";
import { addNetworkStateListener } from "expo-network";
import Storage from "expo-sqlite/kv-store";
import { AppState } from "react-native";

export const queryCacheMaxAgeMs = 30 * 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: { queries: { gcTime: queryCacheMaxAgeMs } },
});

export const queryPersister = createAsyncStoragePersister({ storage: Storage });

focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener("change", (state) =>
    setFocused(state === "active"),
  );

  return () => subscription.remove();
});

onlineManager.setEventListener((setOnline) => {
  const subscription = addNetworkStateListener((state) => setOnline(state.isConnected === true));

  return () => subscription.remove();
});
