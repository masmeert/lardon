import { Ionicons } from "@expo/vector-icons";
import { NativeTabs } from "expo-router/native-tabs";
import { useThemeColor } from "heroui-native";

export default function AppLayout() {
  const accentColor = useThemeColor("accent");

  return (
    <NativeTabs tintColor={accentColor}>
      <NativeTabs.Trigger name="(discover)">
        <NativeTabs.Trigger.Label>Discover</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "safari", selected: "safari.fill" }}
          src={{
            default: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="compass-outline" />,
            selected: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="compass" />,
          }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="meal-plan">
        <NativeTabs.Trigger.Label>Meal plan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="calendar"
          src={{
            default: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="calendar-outline" />,
            selected: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="calendar" />,
          }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="recipes">
        <NativeTabs.Trigger.Label>Recipes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "book", selected: "book.fill" }}
          src={{
            default: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="book-outline" />,
            selected: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="book" />,
          }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          src={{
            default: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="settings-outline" />,
            selected: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="settings" />,
          }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
