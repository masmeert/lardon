import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";

import { familiesQuery } from "#/entities/family";
import { authClient } from "#/shared/auth";
import { NameSheet } from "#/shared/ui";

export function EditNameSheet() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const rename = useMutation({
    networkMode: "always",
    mutationFn: async (name: string) => {
      const { error } = await authClient.updateUser({ name });

      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: familiesQuery.queryKey });
      router.back();
    },
  });

  return (
    <NameSheet
      title="Your name"
      initialName={session?.user.name}
      placeholder="Your name"
      actionLabel="Save"
      isPending={rename.isPending}
      error={rename.error ? "Couldn't save. Check your connection." : undefined}
      onSubmit={(name) => rename.mutate(name)}
    />
  );
}
