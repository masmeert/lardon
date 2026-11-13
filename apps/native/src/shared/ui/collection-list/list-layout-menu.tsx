import { Stack } from "expo-router";

import { useListLayout } from "./use-list-layout";

export function ListLayoutMenu() {
  const [layout, setLayout] = useListLayout();

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Menu icon="ellipsis" accessibilityLabel="More">
        <Stack.Toolbar.MenuAction
          icon={layout === "grid" ? "list.bullet" : "square.grid.2x2"}
          onPress={() => setLayout(layout === "grid" ? "list" : "grid")}
        >
          {layout === "grid" ? "Show as list" : "Show as grid"}
        </Stack.Toolbar.MenuAction>
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );
}
