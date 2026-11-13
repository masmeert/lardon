import { Stack } from "expo-router";

export function listLayoutAction({
  layout,
  onChange,
}: {
  layout: "list" | "grid";
  onChange: (layout: "list" | "grid") => void;
}) {
  return (
    <Stack.Toolbar.MenuAction
      icon={layout === "grid" ? "list.bullet" : "square.grid.2x2"}
      onPress={() => onChange(layout === "grid" ? "list" : "grid")}
    >
      {layout === "grid" ? "Show as list" : "Show as grid"}
    </Stack.Toolbar.MenuAction>
  );
}
