import { Button, Host, Menu } from "@expo/ui/swift-ui";
import { buttonStyle, controlSize, tint } from "@expo/ui/swift-ui/modifiers";
import { Image } from "expo-image";
import { View } from "react-native";

import { RecipeCover } from "#/entities/recipe";
import { useThemeColors } from "#/shared/lib";
import { InlineError, LardonMark, PhotoFrame } from "#/shared/ui";

export function DraftPhoto({
  familyId,
  photoUri,
  imageKey,
  error,
  onPick,
  onRemove,
}: {
  familyId: string | null;
  photoUri: string | null;
  imageKey: string | null;
  error: string | undefined;
  onPick: () => void;
  onRemove: () => void;
}) {
  const { accent, white } = useThemeColors("accent", "white");

  return (
    <View className="gap-3 px-4 pt-2">
      <PhotoFrame className="aspect-4/3 w-full rounded-[24px] p-1">
        <View
          style={{ borderCurve: "continuous" }}
          className="flex-1 items-center justify-center overflow-hidden rounded-[20px] bg-placeholder"
        >
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              contentFit="cover"
              style={{ width: "100%", height: "100%" }}
            />
          ) : imageKey && familyId ? (
            <RecipeCover recipe={{ familyId, imageKey }} />
          ) : (
            <LardonMark width={120} color={white} />
          )}
          <View className="absolute inset-x-0 bottom-3.5 items-center">
            <Host ignoreSafeArea="all" matchContents>
              {photoUri || imageKey ? (
                <Menu
                  label="Edit photo"
                  systemImage="photo"
                  modifiers={[buttonStyle("glass"), controlSize("large"), tint(accent)]}
                >
                  <Button
                    label="Choose another photo"
                    systemImage="photo.on.rectangle"
                    onPress={onPick}
                  />
                  <Button
                    label="Remove photo"
                    systemImage="trash"
                    role="destructive"
                    onPress={onRemove}
                  />
                </Menu>
              ) : (
                <Button
                  label="Add photo"
                  systemImage="photo.badge.plus"
                  onPress={onPick}
                  modifiers={[buttonStyle("glass"), controlSize("large"), tint(accent)]}
                />
              )}
            </Host>
          </View>
        </View>
      </PhotoFrame>
      {error && (
        <View className="items-center">
          <InlineError>{error}</InlineError>
        </View>
      )}
    </View>
  );
}
