import { Host, Picker, Text as SwiftText } from "@expo/ui/swift-ui";
import { pickerStyle, tag, tint } from "@expo/ui/swift-ui/modifiers";
import { type Href, router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { iconSize, useThemeColors } from "#/shared/lib";
import { GroupedRow, GroupedSection, Icon, InlineError } from "#/shared/ui";

import type { RecipeFields } from "../../model/recipe-fields";

export function DraftDetails({
  fields,
  familyName,
  hrefs,
  error,
  onChange,
}: {
  fields: RecipeFields;
  familyName: string | undefined;
  hrefs: { folders: Href; tags: Href };
  error: string | undefined;
  onChange: (changes: Partial<RecipeFields>) => void;
}) {
  const { accent, muted } = useThemeColors("accent", "muted");

  const links = [
    { label: "Folders", names: fields.folderNames, href: hrefs.folders },
    { label: "Tags", names: fields.tagNames, href: hrefs.tags },
  ];

  return (
    <>
      <GroupedSection title="Details">
        {links.map(({ label, names, href }, index) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={`${label}, ${names.join(", ") || "none"}`}
            onPress={() => router.push(href)}
            className="active:opacity-70"
          >
            <GroupedRow label={label} isFirst={index === 0}>
              <Text numberOfLines={1} className="max-w-[60%] text-right text-title text-muted">
                {names.join(", ") || "None"}
              </Text>
              <Icon name="chevron.right" size={iconSize.md} color={muted} />
            </GroupedRow>
          </Pressable>
        ))}
        {familyName !== undefined && (
          <GroupedRow label="Who can see it">
            <Host ignoreSafeArea="all" matchContents>
              <Picker
                selection={fields.isPrivate ? "private" : "family"}
                onSelectionChange={(selection: string) =>
                  onChange({ isPrivate: selection === "private" })
                }
                modifiers={[pickerStyle("menu"), tint(accent)]}
              >
                <SwiftText modifiers={[tag("family")]}>{familyName}</SwiftText>
                <SwiftText modifiers={[tag("private")]}>Only me</SwiftText>
              </Picker>
            </Host>
          </GroupedRow>
        )}
      </GroupedSection>
      {error && (
        <View className="items-start px-8 pt-3">
          <InlineError>{error}</InlineError>
        </View>
      )}
    </>
  );
}
