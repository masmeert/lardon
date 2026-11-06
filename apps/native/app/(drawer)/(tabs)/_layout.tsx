import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useColor } from "@lardon/ui";

export default function TabLayout() {
  const themeColorForeground = useColor("foreground");
  const themeColorBackground = useColor("background");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: themeColorBackground,
        },
        headerTintColor: themeColorForeground,
        headerTitleStyle: {
          color: themeColorForeground,
          fontWeight: "600",
        },
        tabBarStyle: {
          backgroundColor: themeColorBackground,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} style={{ color: color ?? themeColorForeground }} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size} style={{ color: color ?? themeColorForeground }} />
          ),
        }}
      />
    </Tabs>
  );
}
