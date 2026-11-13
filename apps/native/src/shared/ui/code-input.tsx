import { OTPInput } from "input-otp-native";
import { Pressable, Text, View } from "react-native";

import { cn } from "#/shared/lib";

export function CodeInput({
  value,
  onChange,
  onComplete,
  isDisabled = false,
  autoFocus = false,
}: {
  value: string;
  onChange: (code: string) => void;
  onComplete?: () => void;
  isDisabled?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <OTPInput
      maxLength={6}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      pattern="^\d+$"
      editable={!isDisabled}
      autoFocus={autoFocus}
      textContentType="oneTimeCode"
      autoComplete="one-time-code"
      render={({ slots }) => (
        <View className="flex-row gap-2">
          {slots.map((slot, index) => (
            <Pressable
              key={index}
              accessibilityLabel={`Digit ${index + 1}`}
              onPress={slot.focus}
              className={cn(
                "h-14 flex-1 items-center justify-center rounded-inner border-[1.5px] border-transparent bg-paper shadow-rim",
                slot.isActive && "border-accent",
              )}
            >
              {slot.char ? (
                <Text className="text-headline font-semibold text-foreground">{slot.char}</Text>
              ) : (
                slot.hasFakeCaret && <View className="h-6 w-0.5 rounded-full bg-foreground" />
              )}
            </Pressable>
          ))}
        </View>
      )}
    />
  );
}
