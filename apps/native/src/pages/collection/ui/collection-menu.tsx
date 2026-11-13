import { Stack } from "expo-router";

import {
  type RecipeFilters,
  type SortDirection,
  type SortField,
  noFilters,
  servingsOptions,
  sortOptions,
  timeOptions,
} from "#/entities/recipe";
import { listLayoutMenu } from "#/shared/ui";

export function collectionMenu({
  filters,
  onFiltersChange,
  tagNames,
  sortField,
  sortDirection,
  onSortChange,
  layout,
  onLayoutChange,
  canSelect,
  onSelect,
  filteredTint,
}: {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
  tagNames: readonly string[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  layout: "list" | "grid";
  onLayoutChange: (layout: "list" | "grid") => void;
  canSelect: boolean;
  onSelect: () => void;
  filteredTint: string;
}) {
  const isFiltered =
    filters.tag !== null ||
    filters.maxMinutes !== null ||
    filters.servings !== null ||
    filters.withPhoto;

  return (
    <Stack.Toolbar.Menu
      icon="ellipsis"
      tintColor={isFiltered ? filteredTint : undefined}
      accessibilityLabel={isFiltered ? "More, filters on" : "More"}
    >
      <Stack.Toolbar.MenuAction icon="checkmark.circle" disabled={!canSelect} onPress={onSelect}>
        Select recipes
      </Stack.Toolbar.MenuAction>
      <Stack.Toolbar.Menu inline>
        <Stack.Toolbar.Menu title="Sort by" icon="arrow.up.arrow.down">
          {sortOptions.map((option) => (
            <Stack.Toolbar.MenuAction
              key={option.field}
              isOn={option.field === sortField}
              subtitle={option.field === sortField ? option.directions[sortDirection] : undefined}
              onPress={() =>
                onSortChange(
                  option.field,
                  option.field === sortField
                    ? sortDirection === "ascending"
                      ? "descending"
                      : "ascending"
                    : option.field === "title"
                      ? "ascending"
                      : "descending",
                )
              }
            >
              {option.label}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
        {listLayoutMenu({ layout, onChange: onLayoutChange })}
      </Stack.Toolbar.Menu>
      <Stack.Toolbar.Menu inline title="Filter">
        <Stack.Toolbar.Menu title="Time" icon="clock">
          <Stack.Toolbar.MenuAction
            isOn={filters.maxMinutes === null}
            onPress={() => onFiltersChange({ ...filters, maxMinutes: null })}
          >
            Any time
          </Stack.Toolbar.MenuAction>
          {timeOptions.map((option) => (
            <Stack.Toolbar.MenuAction
              key={option.maxMinutes}
              isOn={filters.maxMinutes === option.maxMinutes}
              onPress={() => onFiltersChange({ ...filters, maxMinutes: option.maxMinutes })}
            >
              {option.label}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
        <Stack.Toolbar.Menu title="Servings" icon="person.2">
          <Stack.Toolbar.MenuAction
            isOn={filters.servings === null}
            onPress={() => onFiltersChange({ ...filters, servings: null })}
          >
            Any number
          </Stack.Toolbar.MenuAction>
          {servingsOptions.map((option) => (
            <Stack.Toolbar.MenuAction
              key={option.servings}
              isOn={filters.servings === option.servings}
              onPress={() => onFiltersChange({ ...filters, servings: option.servings })}
            >
              {option.label}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
        {tagNames.length > 0 && (
          <Stack.Toolbar.Menu title="Tag" icon="tag">
            <Stack.Toolbar.MenuAction
              isOn={filters.tag === null}
              onPress={() => onFiltersChange({ ...filters, tag: null })}
            >
              Any tag
            </Stack.Toolbar.MenuAction>
            {tagNames.map((name) => (
              <Stack.Toolbar.MenuAction
                key={name}
                isOn={filters.tag === name}
                onPress={() => onFiltersChange({ ...filters, tag: name })}
              >
                {name}
              </Stack.Toolbar.MenuAction>
            ))}
          </Stack.Toolbar.Menu>
        )}
        <Stack.Toolbar.MenuAction
          icon="photo"
          isOn={filters.withPhoto}
          onPress={() => onFiltersChange({ ...filters, withPhoto: !filters.withPhoto })}
        >
          With a photo
        </Stack.Toolbar.MenuAction>
        {isFiltered && (
          <Stack.Toolbar.MenuAction icon="xmark.circle" onPress={() => onFiltersChange(noFilters)}>
            Clear filters
          </Stack.Toolbar.MenuAction>
        )}
      </Stack.Toolbar.Menu>
    </Stack.Toolbar.Menu>
  );
}
