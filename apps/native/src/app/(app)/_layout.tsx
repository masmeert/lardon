import { Stack } from "expo-router";
import { useEffect } from "react";

import { startLibrary, stopLibrary } from "#/shared/library";
import { useThemeColors } from "#/shared/lib";

export default function AppLayout() {
  const { background } = useThemeColors("background");

  useEffect(() => {
    startLibrary();

    return () => void stopLibrary({ isErasing: false });
  }, []);

  return <Stack screenOptions={{ contentStyle: { backgroundColor: background } }} />;
}
