import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";

import { familiesQuery } from "#/entities/family";
import { apiErrorMessage, requestApi } from "#/shared/api";
import { NameSheet } from "#/shared/ui";

import { useStoreFamily } from "../model/use-store-family";

export function RenameFamilySheet() {
  const storeFamily = useStoreFamily();
  const { data: families = [] } = useQuery(familiesQuery);
  const family = families.find((candidate) => !candidate.personal);

  const rename = useMutation({
    mutationFn: ({ familyId, name }: { familyId: string; name: string }) =>
      requestApi((client) => client.families.rename({ params: { familyId }, payload: { name } })),
    onSuccess: async (renamed) => {
      await storeFamily(renamed);
      router.back();
    },
  });

  return (
    <NameSheet
      title="Rename family"
      initialName={family?.name}
      placeholder="Family name"
      actionLabel="Save"
      isPending={rename.isPending}
      error={
        rename.error
          ? apiErrorMessage(rename.error, "Couldn't rename it. Check your connection.")
          : undefined
      }
      onSubmit={(name) => family && rename.mutate({ familyId: family.id, name })}
    />
  );
}
