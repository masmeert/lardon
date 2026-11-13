import { Image, Text, View } from "react-native";

function initials(name: string, email: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  return (words.length > 0 ? words.slice(0, 2).map((word) => word[0]) : [email[0]])
    .join("")
    .toLocaleUpperCase();
}

export function MemberAvatar({
  member,
  sizePt,
}: {
  member: { name: string; email: string; image: string | null };
  sizePt: number;
}) {
  return (
    <View
      style={{ width: sizePt, height: sizePt }}
      className="items-center justify-center overflow-hidden rounded-full border-2 border-paper bg-accent shadow-rim"
    >
      {member.image ? (
        <Image source={{ uri: member.image }} className="size-full" />
      ) : (
        <Text style={{ fontSize: sizePt * 0.38 }} className="font-semibold text-white">
          {initials(member.name, member.email)}
        </Text>
      )}
    </View>
  );
}
