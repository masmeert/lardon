import { useQuery } from "@tanstack/react-query";

import { iconSize, useThemeColors } from "#/shared/lib";
import { Fan, Icon } from "#/shared/ui";

import { familyQuery } from "../family-query";

import { MemberAvatar } from "./member-avatar";

export function FamilyFaces({ familyId }: { familyId: string }) {
  const { muted } = useThemeColors("muted");
  const { data: family } = useQuery(familyQuery(familyId));

  if (!family) return <Icon name="person.2" size={iconSize.xl} color={muted} />;

  return (
    <Fan spreadPt={24}>
      {family.members.slice(0, 3).map((member) => (
        <MemberAvatar key={member.userId} member={member} sizePt={50} />
      ))}
    </Fan>
  );
}
