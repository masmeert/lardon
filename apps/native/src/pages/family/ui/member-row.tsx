import { ActivityIndicator, Pressable } from "react-native";

import { MemberAvatar } from "#/entities/family";
import { cn } from "#/shared/lib";
import { GroupedRow } from "#/shared/ui";

export function MemberRow({
  member,
  isMe,
  isFirst,
  isPending,
  onPress,
}: {
  member: { name: string; email: string; image: string | null; role: "owner" | "member" };
  isMe: boolean;
  isFirst: boolean;
  isPending: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityHint={onPress ? "Change their role or remove them" : undefined}
      disabled={!onPress || isPending}
      onPress={onPress}
      className={cn(onPress && "active:bg-fill")}
    >
      <GroupedRow
        label={member.name || member.email}
        detail={
          member.role === "owner" ? (isMe ? "You, owner" : "Owner") : isMe ? "You" : undefined
        }
        isFirst={isFirst}
        leading={<MemberAvatar member={member} sizePt={40} />}
      >
        {isPending && <ActivityIndicator />}
      </GroupedRow>
    </Pressable>
  );
}
