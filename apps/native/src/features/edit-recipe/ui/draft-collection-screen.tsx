import { type Collection, FolderName, TagName } from "@lardon/recipes";
import { useQuery } from "@tanstack/react-query";
import { Schema } from "effect";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { familiesQuery } from "#/entities/family";
import { libraryFolders, libraryTags, useFamilyTables } from "#/entities/recipe";
import { Button, ButtonLabel, FilterPill, TextBox } from "#/shared/ui";

import { useRecipeEditor } from "../model/recipe-editor";

const names = {
  folders: { noun: "folder", schema: FolderName, maxLength: 60 },
  tags: { noun: "tag", schema: TagName, maxLength: 40 },
};

function isSame(first: string, second: string) {
  return first.toLocaleLowerCase() === second.toLocaleLowerCase();
}

export function DraftCollectionScreen({ collection }: { collection: Collection }) {
  const { noun, schema, maxLength } = names[collection];
  const { fields, change } = useRecipeEditor();
  const { data: families = [] } = useQuery(familiesQuery);
  const familyTables = useFamilyTables(families.map((family) => family.id));
  const [search, setSearch] = useState("");
  const query = search.trim();
  const chosen = collection === "folders" ? fields.folderNames : fields.tagNames;

  const saved = (
    collection === "folders" ? libraryFolders(familyTables) : libraryTags(familyTables)
  ).map((owner) => owner.name);

  const everyName = [
    ...saved,
    ...chosen.filter((name) => !saved.some((savedName) => isSame(savedName, name))),
  ];

  const shown = everyName.filter((name) =>
    name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );

  function choose(nextNames: readonly string[]) {
    change(collection === "folders" ? { folderNames: nextNames } : { tagNames: nextNames });
  }

  function toggle(name: string) {
    choose(
      chosen.some((chosenName) => isSame(chosenName, name))
        ? chosen.filter((chosenName) => !isSame(chosenName, name))
        : [...chosen, name],
    );
  }

  function add() {
    if (!Schema.is(schema)(query)) return;
    const name = everyName.find((candidate) => isSame(candidate, query)) ?? query;

    if (!chosen.some((chosenName) => isSame(chosenName, name))) choose([...chosen, name]);
    setSearch("");
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-5 px-4 pt-4 pb-16"
    >
      <View className="flex-row items-center gap-2">
        <TextBox
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={add}
          placeholder={`Find or add a ${noun}`}
          maxLength={maxLength}
          returnKeyType="done"
          submitBehavior="submit"
          autoCapitalize="sentences"
          clearButtonMode="while-editing"
          className="flex-1"
        />
        <Button isDisabled={!query} onPress={add} className="h-13">
          <ButtonLabel>Add</ButtonLabel>
        </Button>
      </View>
      {shown.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {shown.map((name) => (
            <FilterPill
              key={name}
              label={name}
              isSelected={chosen.some((chosenName) => isSame(chosenName, name))}
              onPress={() => toggle(name)}
            />
          ))}
        </View>
      ) : (
        <Text className="text-center text-caption text-muted">
          {query
            ? `Add “${query}” as a new ${noun}.`
            : `No ${noun}s yet. Add your first one above.`}
        </Text>
      )}
    </ScrollView>
  );
}
