import { Button, Host } from "@expo/ui/swift-ui";
import { buttonStyle, controlSize } from "@expo/ui/swift-ui/modifiers";
import { View } from "react-native";
import {
  KeyboardController,
  KeyboardStickyView,
  useKeyboardState,
} from "react-native-keyboard-controller";

export function KeyboardDoneButton() {
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);

  return (
    <KeyboardStickyView
      offset={{ opened: -12 }}
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 items-center"
    >
      <View
        pointerEvents={isKeyboardVisible ? "auto" : "none"}
        accessibilityElementsHidden={!isKeyboardVisible}
        className={isKeyboardVisible ? "opacity-100" : "opacity-0"}
      >
        <Host ignoreSafeArea="all" matchContents>
          <Button
            label="Done"
            onPress={() => void KeyboardController.dismiss()}
            modifiers={[buttonStyle("glass"), controlSize("large")]}
          />
        </Host>
      </View>
    </KeyboardStickyView>
  );
}
