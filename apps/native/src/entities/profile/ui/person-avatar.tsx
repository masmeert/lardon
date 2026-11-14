import { Image, Text, View } from "react-native";

export function PersonAvatar({
  person,
  sizePt,
  cornerRadiusPt = sizePt / 2,
}: {
  person: { name: string; username: string; image: string | null };
  sizePt: number;
  cornerRadiusPt?: number;
}) {
  const words = person.name.trim().split(/\s+/).filter(Boolean);

  return (
    <View
      style={{
        width: sizePt,
        height: sizePt,
        borderRadius: cornerRadiusPt,
        borderCurve: "continuous",
      }}
      className="items-center justify-center overflow-hidden border-2 border-paper bg-accent shadow-rim"
    >
      {person.image ? (
        <Image source={{ uri: person.image }} className="size-full" />
      ) : (
        <Text style={{ fontSize: sizePt * 0.38 }} className="font-semibold text-white">
          {(words.length > 0 ? words.slice(0, 2).map((word) => word[0]) : [person.username[0]])
            .join("")
            .toLocaleUpperCase()}
        </Text>
      )}
    </View>
  );
}
