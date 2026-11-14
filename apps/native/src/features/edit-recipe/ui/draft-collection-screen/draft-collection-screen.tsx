import { type Collection, FolderName, TagName } from "@lardon/recipes";
import { useQuery } from "@tanstack/react-query";
import { Schema } from "effect";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { familiesQuery } from "#/entities/family";
import { libraryFolders, libraryTags, useFamilyTables } from "#/entities/recipe";
import { Button, ButtonLabel, FilterPill, TextBox } from "#/shared/ui";

import { useRecipeEditor } from "../../model/recipe-editor";

import { FolderChoices } from "./folder-choices";

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

  const saved =
    collection === "folders"
      ? libraryFolders(familyTables).map((folder) => ({
          name: folder.name,
          recipeCount: folder.recipes.length,
        }))
      : libraryTags(familyTables);

  const everyOwner = [
    ...saved,
    ...chosen.flatMap((name) =>
      saved.some((owner) => isSame(owner.name, name)) ? [] : [{ name, recipeCount: undefined }],
    ),
  ];

  const shown = everyOwner.filter((owner) =>
    owner.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );

  function isChosen(name: string) {
    return chosen.some((chosenName) => isSame(chosenName, name));
  }

  function choose(nextNames: readonly string[]) {
    change(collection === "folders" ? { folderNames: nextNames } : { tagNames: nextNames });
  }

  function toggle(name: string) {
    choose(
      isChosen(name) ? chosen.filter((chosenName) => !isSame(chosenName, name)) : [...chosen, name],
    );
  }

  function add() {
    if (!Schema.is(schema)(query)) return;
    const name = everyOwner.find((owner) => isSame(owner.name, query))?.name ?? query;

    if (!isChosen(name)) choose([...chosen, name]);
    setSearch("");
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="pt-4 pb-16"
    >
      <View className="flex-row items-center gap-2 px-4">
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
      {shown.length === 0 ? (
        <Text className="px-4 pt-5 text-center text-caption text-muted">
          {query
            ? `Add “${query}” as a new ${noun}.`
            : `No ${noun}s yet. Add your first one above.`}
        </Text>
      ) : collection === "folders" ? (
        <FolderChoices folders={shown} isChosen={isChosen} onToggle={toggle} />
      ) : (
        <View className="flex-row flex-wrap gap-2 px-4 pt-5">
          {shown.map(({ name }) => (
            <FilterPill
              key={name}
              label={name}
              isSelected={isChosen(name)}
              onPress={() => toggle(name)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
