import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";

import { iconSize, useThemeColors } from "#/shared/lib";
import { Icon } from "#/shared/ui";

import { familyQuery } from "../family-query";

import { MemberAvatar } from "./member-avatar";

export function FamilyFaces({ familyId }: { familyId: string }) {
  const { muted } = useThemeColors("muted");
  const { data: family } = useQuery(familyQuery(familyId));

  if (!family) return <Icon name="person.2" size={iconSize.xl} color={muted} />;

  const extraCount = family.members.length - 3;

  return (
    <View className="flex-row items-center">
      {family.members.slice(0, 3).map((member, index) => (
        <View key={member.userId} style={{ marginLeft: index === 0 ? 0 : -10 }}>
          <MemberAvatar member={member} sizePt={family.members.length === 1 ? 52 : 30} />
        </View>
      ))}
      {extraCount > 0 && (
        <View className="-ml-2.5 size-7.5 items-center justify-center rounded-full border-2 border-paper bg-fill">
          <Text className="text-label font-semibold text-foreground">+{extraCount}</Text>
        </View>
      )}
    </View>
  );
}
