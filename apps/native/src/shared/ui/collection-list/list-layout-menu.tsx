import { Stack } from "expo-router";

export function listLayoutMenu({
  layout,
  onChange,
}: {
  layout: "list" | "grid";
  onChange: (layout: "list" | "grid") => void;
}) {
  return (
    <Stack.Toolbar.Menu inline palette title="Layout">
      <Stack.Toolbar.MenuAction
        icon="list.bullet"
        isOn={layout === "list"}
        onPress={() => onChange("list")}
      >
        List
      </Stack.Toolbar.MenuAction>
      <Stack.Toolbar.MenuAction
        icon="square.grid.2x2"
        isOn={layout === "grid"}
        onPress={() => onChange("grid")}
      >
        Grid
      </Stack.Toolbar.MenuAction>
    </Stack.Toolbar.Menu>
  );
}
