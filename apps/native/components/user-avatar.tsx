import { Avatar } from "heroui-native";
import { View } from "react-native";

import { authClient } from "@/lib/auth-client";

export function UserAvatar({ size }: { size: "sm" | "lg" }) {
  const { data: session } = authClient.useSession();

  return (
    <View className="rounded-full bg-white p-0.5 shadow-[0_0_1px_rgba(34,28,24,0.16),0_1px_2px_rgba(34,28,24,0.08)]">
      <Avatar alt={session?.user.name ?? ""} size={size} color="accent" variant="soft">
        {session?.user.image && <Avatar.Image source={{ uri: session.user.image }} />}
        <Avatar.Fallback>
          {session?.user.name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .slice(0, 2)
            .toUpperCase() || undefined}
        </Avatar.Fallback>
      </Avatar>
    </View>
  );
}
