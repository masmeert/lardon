import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiErrorMessage, requestApi } from "#/shared/api";

export type FollowAction =
  | "follow"
  | "unfollow"
  | "approve"
  | "removeFollower"
  | "block"
  | "unblock";

export function useFollowChange() {
  const queryClient = useQueryClient();

  const change = useMutation({
    networkMode: "always",
    mutationFn: ({ action, userId }: { action: FollowAction; userId: string }) =>
      requestApi((client) => {
        const params = { params: { userId } };

        return {
          follow: () => client.follows.follow({ payload: { userId } }),
          unfollow: () => client.follows.unfollow(params),
          approve: () => client.follows.approve(params),
          removeFollower: () => client.follows.removeFollower(params),
          block: () => client.follows.block(params),
          unblock: () => client.follows.unblock(params),
        }[action]();
      }),
    onSettled: () =>
      Promise.all(
        ["profiles", "follows", "feed"].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  });

  return {
    ...change,
    isChanging: (userId: string) => change.isPending && change.variables.userId === userId,
    errorFor: (userId: string) =>
      change.isError && change.variables.userId === userId
        ? apiErrorMessage(
            change.error,
            "Couldn't reach Lardon. Check your connection and try again.",
          )
        : undefined,
  };
}
