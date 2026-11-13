import { Host, Picker, Text as SwiftText } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { type Collection, FolderName, TagName, createCollection, readRows } from "@lardon/recipes";
import { useQuery } from "@tanstack/react-query";
import { Schema } from "effect";
import { Stack, router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { useTable } from "tinybase/ui-react";

import { familiesQuery, useFamilyStore } from "#/entities/family";
import { scopeParams } from "#/entities/recipe";
import { Button, ButtonLabel, InlineError, SheetContent, TextBox } from "#/shared/ui";

const names = {
  folders: { noun: "folder", schema: FolderName, maxLength: 60, placeholder: "Weeknight dinners" },
  tags: { noun: "tag", schema: TagName, maxLength: 40, placeholder: "Vegetarian" },
};

export function NewCollectionSheet({ collection }: { collection: Collection }) {
  const { noun, schema, maxLength, placeholder } = names[collection];
  const { data: families = [] } = useQuery(familiesQuery);
  const [chosenFamilyId, setChosenFamilyId] = useState<string>();

  const familyId =
    chosenFamilyId ?? families.find((family) => family.personal)?.id ?? families[0]?.id ?? "";

  const store = useFamilyStore(familyId);
  const existing = readRows({ [collection]: useTable(collection, familyId) }, collection);
  const [name, setName] = useState("");
  const trimmedName = name.trim();

  const isTaken = existing.some(
    (owner) => owner.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase(),
  );

  const canCreate = store !== undefined && Schema.is(schema)(trimmedName) && !isTaken;

  function create() {
    if (!store || !canCreate) return;

    const id = createCollection(store, collection, trimmedName);

    router.dismiss();

    if (collection === "folders") {
      router.push({
        pathname: "/collection",
        params: scopeParams({ kind: "folder", familyId, folderId: id }),
      });
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: `New ${noun}` }} />
      <SheetContent className="gap-4 px-6 pt-2 pb-8">
        <View className="gap-2">
          <TextBox
            value={name}
            onChangeText={setName}
            placeholder={placeholder}
            maxLength={maxLength}
            autoFocus
            autoCapitalize="sentences"
            clearButtonMode="while-editing"
            returnKeyType="done"
            enablesReturnKeyAutomatically
            onSubmitEditing={create}
          />
          {isTaken && (
            <InlineError>{`There's already a ${noun} called “${trimmedName}” in this family`}</InlineError>
          )}
        </View>
        {families.length > 1 && (
          <Host matchContents={{ vertical: true }}>
            <Picker
              selection={familyId}
              onSelectionChange={(selection: string) => setChosenFamilyId(selection)}
              modifiers={[pickerStyle("segmented")]}
            >
              {families.map((family) => (
                <SwiftText key={family.id} modifiers={[tag(family.id)]}>
                  {family.name}
                </SwiftText>
              ))}
            </Picker>
          </Host>
        )}
        <Button isDisabled={!canCreate} onPress={create}>
          <ButtonLabel>{`Create ${noun}`}</ButtonLabel>
        </Button>
      </SheetContent>
    </>
  );
}
