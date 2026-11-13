import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDatabaseAsync } from "expo-sqlite";

import { authClient } from "#/shared/auth";

import { familiesQuery } from "./families-query";
import { familyDatabaseName } from "./family-database";

export const signOutMutationKey = ["sign-out"];

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: signOutMutationKey,
    mutationFn: async () => {
      const { error } = await authClient.signOut();

      if (error) throw new Error(error.message ?? "Signing out failed");

      const families = queryClient.getQueryData(familiesQuery.queryKey) ?? [];

      queryClient.clear();
      await Promise.all(
        families.map((family) => deleteDatabaseAsync(familyDatabaseName(family.id))),
      );
    },
  });
}
