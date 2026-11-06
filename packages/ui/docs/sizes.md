# Sizes

Three control heights. Text, icon, padding and gaps step with the height so a control shrinks as a whole.

## Rules

- **The ladder** (`controlSizes` in `src/sizes/size-steps.ts`):

  | Size      | Height | Horizontal padding | Icon | Label role         | Hit slop |
  | --------- | ------ | ------------------ | ---- | ------------------ | -------- |
  | `large`   | 52pt   | 24pt               | 19pt | headline           | 0        |
  | `default` | 44pt   | 20pt               | 17pt | headline           | 0        |
  | `compact` | 32pt   | 14pt               | 15pt | headline (compact) | 6pt      |

- **Form fields are 52pt**, the `large` step, so a field and the form's primary button line up. Fields are filled rounded rectangles (`rounded-tile`, `bg-well`), not pills: pills are for things you tap, rectangles for things you type in.
- **44pt is the floor for anything tappable.** Compact controls reach it with hit slop, never by being visually bigger.
- **`large` is for the one primary action of a flow**, at the bottom of a screen: "Save recipe", "Create family". Never two large buttons side by side.
- **Density is a region decision, not a control decision.** Wrap a region in `DensityProvider density="compact"` and every control and text role inside follows. Don't set `size="compact"` on each button in a toolbar.
- **Gaps step with density** (`regionGaps`): 12pt between controls by default, 8pt in compact regions.
- **Screen gutters are 20pt.** Sections are 32pt apart. Everything sits on a 4pt grid.
- An explicit `size` prop wins over the surrounding density.

## The failure it prevents

A compact button with default-size text, or an icon that stays 17pt in a 32pt chip, looks squeezed rather than smaller. Stepping every dimension together keeps a dense region looking like a smaller sibling of the same design.

## In code

```tsx
<DensityProvider density="compact">
  <View className={`flex-row ${regionGaps.compact}`}>
    <Button label="Share" variant="secondary" />
    <Button label="Edit" variant="secondary" />
  </View>
</DensityProvider>
```

Storybook: **Systems / Sizes**.
