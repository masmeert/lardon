import "#/_app/styles/global.css";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { RootStack } from "#/_app/nav/root-stack";

export function RootLayout() {
  return (
    <KeyboardProvider>
      <RootStack />
    </KeyboardProvider>
  );
}
