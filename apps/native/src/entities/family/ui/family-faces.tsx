import { useQuery } from "@tanstack/react-query";

import { useThemeColors } from "#/shared/lib";
import { Fan, Icon } from "#/shared/ui";

import { familyQuery } from "../family-query";

import { MemberAvatar } from "./member-avatar";

export function FamilyFaces({ familyId, sizePt }: { familyId: string; sizePt: number }) {
  const { muted } = useThemeColors("muted");
  const { data: family } = useQuery(familyQuery(familyId));

  if (!family) return <Icon name="person.2" size={Math.round(sizePt * 0.24)} color={muted} />;

  return (
    <Fan spreadPt={Math.round(sizePt * 0.25)}>
      {family.members.slice(0, 3).map((member) => (
        <MemberAvatar key={member.userId} member={member} sizePt={Math.round(sizePt * 0.52)} />
      ))}
    </Fan>
  );
}
