import "#/_app/styles/global.css";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { RootStack } from "#/_app/nav/root-stack";
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
      <KeyboardProvider>
        <RootStack />
      </KeyboardProvider>
    </PersistQueryClientProvider>
  );
}
