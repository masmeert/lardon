import "#/_app/styles/global.css";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { RootStack } from "#/_app/entrypoint/root-stack";
import { queryCacheMaxAgeMs, queryClient, queryPersister } from "#/shared/api";

export function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: queryCacheMaxAgeMs,
        dehydrateOptions: { shouldDehydrateQuery: (query) => query.state.data !== undefined },
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <RootStack />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}
