import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { type PropsWithChildren, useCallback } from "react";
import { Keyboard, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function KeyboardFooter({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      const subscription = Keyboard.addListener("keyboardWillShow", () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      });

      return () => subscription.remove();
    }, []),
  );

  return (
    <KeyboardStickyView offset={{ opened: insets.bottom - 4 }}>
      <View className="flex-row gap-3 px-6 pt-3" style={{ paddingBottom: insets.bottom + 8 }}>
        {children}
      </View>
    </KeyboardStickyView>
  );
}
