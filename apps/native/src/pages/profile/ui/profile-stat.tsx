import { Pressable, Text } from "react-native";

export function ProfileStat({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={`${value} ${label}`}
      disabled={!onPress}
      onPress={onPress}
      className="flex-row items-baseline gap-1 active:opacity-60"
    >
      <Text className="text-title font-semibold text-foreground">{String(value)}</Text>
      <Text className="text-caption text-muted">{label}</Text>
    </Pressable>
  );
}
