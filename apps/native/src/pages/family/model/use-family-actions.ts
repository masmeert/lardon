import type { FamilyRole } from "@lardon/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Share } from "react-native";

import { familiesQuery, familyQuery } from "#/entities/family";
import { requestApi } from "#/shared/api";

import { useStoreFamily } from "./use-store-family";

export function shareInvite(familyName: string, code: string) {
  return Share.share({
    message: `Join “${familyName}” on Lardon to share recipes. Open Settings, tap “Join with a code” and enter ${code}. The code works for 7 days.`,
  });
}

export function useFamilyActions(familyId: string) {
  const queryClient = useQueryClient();
  const storeFamily = useStoreFamily();

  async function refreshFamily() {
    await queryClient.invalidateQueries({ queryKey: familyQuery(familyId).queryKey });
  }

  const leave = useMutation({
    mutationFn: () => requestApi((client) => client.families.leave({ params: { familyId } })),
    onSuccess: () => {
      queryClient.setQueryData(familiesQuery.queryKey, (families) =>
        families?.filter((family) => family.id !== familyId),
      );
      queryClient.removeQueries({ queryKey: familyQuery(familyId).queryKey });
      void queryClient.invalidateQueries({ queryKey: familiesQuery.queryKey, exact: true });
    },
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) =>
      requestApi((client) => client.families.removeMember({ params: { familyId, userId } })),
    onSuccess: storeFamily,
  });

  const setRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: FamilyRole }) =>
      requestApi((client) =>
        client.families.setMemberRole({ params: { familyId, userId }, payload: { role } }),
      ),
    onSuccess: storeFamily,
  });

  const invite = useMutation({
    mutationFn: async (familyName: string) => {
      const { code } = await requestApi((client) =>
        client.families.createInvite({ params: { familyId } }),
      );

      await refreshFamily();
      await shareInvite(familyName, code);
    },
  });

  const revokeInvite = useMutation({
    mutationFn: (code: string) =>
      requestApi((client) => client.families.revokeInvite({ params: { code } })),
    onSuccess: refreshFamily,
  });

  return { leave, removeMember, setRole, invite, revokeInvite };
}
