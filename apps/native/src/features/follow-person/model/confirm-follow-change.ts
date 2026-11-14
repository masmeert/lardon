import { Alert } from "react-native";

import type { FollowAction } from "./use-follow-change";

export function confirmFollowChange(
  action: Extract<FollowAction, "unfollow" | "removeFollower" | "block">,
  person: { name: string; username: string },
  onConfirm: () => void,
) {
  const name = person.name || `@${person.username}`;

  const { title, message, confirm } = {
    unfollow: {
      title: `Unfollow ${name}?`,
      message: "Their recipes leave your feed. To follow again, you'll need their approval.",
      confirm: "Unfollow",
    },
    removeFollower: {
      title: `Remove ${name}?`,
      message: "They stop seeing your recipes. They won't be told, and can ask to follow again.",
      confirm: "Remove",
    },
    block: {
      title: `Block ${name}?`,
      message:
        "You stop following each other, and they can't find you or ask to follow you. They won't be told.",
      confirm: "Block",
    },
  }[action];

  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: confirm, style: "destructive", onPress: onConfirm },
  ]);
}
