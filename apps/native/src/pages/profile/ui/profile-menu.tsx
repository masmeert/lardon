import type { ProfileView } from "@lardon/api";
import { Stack } from "expo-router";

import { confirmFollowChange, type useFollowChange } from "#/features/follow-person";

export function profileMenu({
  profile,
  change,
}: {
  profile: ProfileView;
  change: ReturnType<typeof useFollowChange>;
}) {
  const userId = profile.userId;

  return (
    <Stack.Toolbar.Menu icon="ellipsis" accessibilityLabel="More">
      {profile.follower === "approved" && (
        <Stack.Toolbar.MenuAction
          icon="person.badge.minus"
          onPress={() =>
            confirmFollowChange("removeFollower", profile, () =>
              change.mutate({ action: "removeFollower", userId }),
            )
          }
        >
          Remove follower
        </Stack.Toolbar.MenuAction>
      )}
      {profile.isBlocked ? (
        <Stack.Toolbar.MenuAction
          icon="hand.raised.slash"
          onPress={() => change.mutate({ action: "unblock", userId })}
        >
          Unblock
        </Stack.Toolbar.MenuAction>
      ) : (
        <Stack.Toolbar.MenuAction
          icon="hand.raised"
          destructive
          onPress={() =>
            confirmFollowChange("block", profile, () => change.mutate({ action: "block", userId }))
          }
        >
          Block
        </Stack.Toolbar.MenuAction>
      )}
    </Stack.Toolbar.Menu>
  );
}
