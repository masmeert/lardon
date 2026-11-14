import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDatabaseAsync } from "expo-sqlite";

import { authClient } from "#/shared/auth";

import { familiesQuery } from "./families-query";
import { familyDatabaseName } from "./family-database";

export const endSessionMutationKey = ["end-session"];

async function eraseLocalData(queryClient: QueryClient) {
  const families = queryClient.getQueryData(familiesQuery.queryKey) ?? [];

  queryClient.clear();
  await Promise.all(families.map((family) => deleteDatabaseAsync(familyDatabaseName(family.id))));
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...endSessionMutationKey, "sign-out"],
    mutationFn: async () => {
      const { error } = await authClient.signOut();

      if (error) throw new Error(error.message ?? "Signing out failed");

      await eraseLocalData(queryClient);
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...endSessionMutationKey, "delete-account"],
    networkMode: "always",
    mutationFn: async () => {
      const { error } = await authClient.deleteUser({});

      if (error)
        throw new Error(error.message ?? "Deleting the account failed", { cause: error.code });

      await eraseLocalData(queryClient);
    },
  });
}
