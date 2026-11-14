import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";

import { apiErrorMessage, requestApi } from "#/shared/api";
import { NameSheet } from "#/shared/ui";

import { useStoreFamily } from "../model/use-store-family";

export function NewFamilySheet() {
  const storeFamily = useStoreFamily();

  const create = useMutation({
    mutationFn: (name: string) =>
      requestApi((client) => client.families.create({ payload: { name } })),
    onSuccess: async (family) => {
      await storeFamily(family);
      router.dismiss();
      router.push("/settings/family");
    },
  });

  return (
    <NameSheet
      title="New family"
      placeholder="The Smiths"
      actionLabel="Create family"
      isPending={create.isPending}
      error={
        create.error
          ? apiErrorMessage(create.error, "Couldn't create it. Check your connection.")
          : undefined
      }
      onSubmit={(name) => create.mutate(name)}
    />
  );
}
