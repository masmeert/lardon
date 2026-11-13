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

export function filterMenu({
  filters,
  onFiltersChange,
  tagNames,
  sortField,
  sortDirection,
  onSortChange,
}: {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
  tagNames: readonly string[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}) {
  const isFiltered =
    filters.tag !== null ||
    filters.maxMinutes !== null ||
    filters.servings !== null ||
    filters.withPhoto;

  const sort = sortOptions.find((option) => option.field === sortField) ?? sortOptions[0];
  const otherDirection = sortDirection === "ascending" ? "descending" : "ascending";

  return (
    <Stack.Toolbar.Menu
      icon={
        isFiltered ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle"
      }
      accessibilityLabel={isFiltered ? "Sort and filter, filters on" : "Sort and filter"}
    >
      <Stack.Toolbar.Menu inline title="Sort by">
        {sortOptions.map((option) => (
          <Stack.Toolbar.MenuAction
            key={option.field}
            isOn={option.field === sortField}
            onPress={() =>
              onSortChange(option.field, option.field === "title" ? "ascending" : "descending")
            }
          >
            {option.label}
          </Stack.Toolbar.MenuAction>
        ))}
        <Stack.Toolbar.MenuAction
          icon="arrow.up.arrow.down"
          onPress={() => onSortChange(sortField, otherDirection)}
        >
          {sort.directions[otherDirection]}
        </Stack.Toolbar.MenuAction>
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
      </Stack.Toolbar.Menu>
      {isFiltered && (
        <Stack.Toolbar.MenuAction icon="xmark.circle" onPress={() => onFiltersChange(noFilters)}>
          Clear filters
        </Stack.Toolbar.MenuAction>
      )}
    </Stack.Toolbar.Menu>
  );
}
