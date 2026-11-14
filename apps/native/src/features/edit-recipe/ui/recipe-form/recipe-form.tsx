import * as ImagePicker from "expo-image-picker";
import type { Href } from "expo-router";
import { TextInput, View } from "react-native";
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewRef,
} from "react-native-keyboard-controller";
import { useAnimatedRef } from "react-native-reanimated";

import { useThemeColors } from "#/shared/lib";
import { GroupedSection, InlineError, KeyboardDoneButton } from "#/shared/ui";

import { useRecipeEditor } from "../../model/recipe-editor";
import { newIngredient, newStep } from "../../model/recipe-fields";
import { RecipeFormError } from "../../model/recipe-form-error";

import { DraftDetails } from "./draft-details";
import { DraftFacts } from "./draft-facts";
import { DraftIngredientRow } from "./draft-ingredient-row";
import { DraftList } from "./draft-list";
import { DraftPhoto } from "./draft-photo";
import { DraftStepRow } from "./draft-step-row";

export function RecipeForm({
  familyName,
  hrefs,
  saveError,
}: {
  familyName: string | undefined;
  hrefs: { folders: Href; tags: Href };
  saveError: Error | null;
}) {
  const { base, fields, change, changeWith } = useRecipeEditor();

  const error =
    saveError instanceof RecipeFormError
      ? saveError
      : saveError && new RecipeFormError("title", "Couldn't save the recipe. Try again.");

  const { accent, muted } = useThemeColors("accent", "muted");
  const scrollRef = useAnimatedRef<KeyboardAwareScrollViewRef>();

  async function pickPhoto() {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
    });

    const asset = picked.assets?.[0];

    if (!picked.canceled && asset) change({ photoUri: asset.uri });
  }

  return (
    <>
      <KeyboardAwareScrollView
        ref={(scrollView) => {
          scrollRef(scrollView);
        }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bottomOffset={72}
        contentContainerClassName="pb-24"
      >
        <DraftPhoto
          familyId={base.familyId}
          photoUri={fields.photoUri}
          imageKey={fields.imageKey}
          error={error?.field === "photo" ? error.message : undefined}
          onPick={() => void pickPhoto()}
          onRemove={() => change({ photoUri: null, imageKey: null })}
        />
        <GroupedSection>
          <TextInput
            value={fields.title}
            onChangeText={(title) => change({ title })}
            placeholder="Title"
            placeholderTextColor={muted}
            selectionColor={accent}
            accessibilityLabel="Title, required"
            maxLength={200}
            returnKeyType="done"
            autoCapitalize="sentences"
            className="h-13 px-4 text-field font-semibold text-foreground"
          />
        </GroupedSection>
        {error?.field === "title" && (
          <View className="items-start px-8 pt-3">
            <InlineError>{error.message}</InlineError>
          </View>
        )}
        <DraftFacts fields={fields} onChange={change} />
        <DraftList
          title="Ingredients"
          lineName="ingredient"
          lines={fields.ingredients}
          onChange={(update) =>
            changeWith((current) => ({ ingredients: update(current.ingredients) }))
          }
          newLine={newIngredient}
          scrollRef={scrollRef}
          renderLine={(ingredient, controls) => (
            <DraftIngredientRow ingredient={ingredient} {...controls} />
          )}
        />
        <DraftList
          title="Steps"
          lineName="step"
          lines={fields.steps}
          onChange={(update) => changeWith((current) => ({ steps: update(current.steps) }))}
          newLine={newStep}
          scrollRef={scrollRef}
          renderLine={(step, controls) => <DraftStepRow step={step} {...controls} />}
        />
        <GroupedSection title="Notes">
          <TextInput
            value={fields.notes}
            onChangeText={(notes) => change({ notes })}
            placeholder="Tips, swaps, what you'd change next time"
            placeholderTextColor={muted}
            selectionColor={accent}
            multiline
            maxLength={20_000}
            autoCapitalize="sentences"
            accessibilityLabel="Notes"
            className="min-h-28 px-4 py-3.75 text-title text-foreground"
          />
        </GroupedSection>
        <DraftDetails
          fields={fields}
          familyName={familyName}
          hrefs={hrefs}
          error={error?.field === "details" ? error.message : undefined}
          onChange={change}
        />
      </KeyboardAwareScrollView>
      <KeyboardDoneButton />
    </>
  );
}
