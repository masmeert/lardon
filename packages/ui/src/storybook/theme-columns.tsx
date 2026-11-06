import type { ReactNode } from "react";
import { View } from "react-native";
import { ScopedTheme } from "uniwind";

import { Text } from "../typography/text";

export function ThemeColumns({ children }: { children: (theme: "light" | "dark") => ReactNode }) {
  return (
    <View className="flex-row gap-3">
      {(["light", "dark"] as const).map((theme) => (
        <ScopedTheme key={theme} theme={theme}>
          <View className="flex-1 gap-3 rounded-card bg-background p-3 border border-hairline">
            <Text variant="caption" tone="muted">
              {theme === "light" ? "Light" : "Dark"}
            </Text>
            {children(theme)}
          </View>
        </ScopedTheme>
      ))}
    </View>
  );
}
