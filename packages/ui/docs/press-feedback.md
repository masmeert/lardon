# Press feedback

Touch has no hover, so the press is where an interface proves it is alive. Every tappable thing reacts the same way.

## Rules

- **A press shrinks the longest side by 6pt** (`pressTravelPt`), whatever the size. The scale is `1 − 6 / longest side`, clamped between 0.94 and 0.985 (`pressedScale`). A fixed percentage would make big cards lurch and small chips barely move.
- **Presses land fast, releases settle slower.** Press in on `springs.fast`, release on `springs.moderate`, so the release feels like the element springing back rather than snapping.
- **Every tap shows the full press.** A quick tap releases before the press spring lands, so the release first finishes the press, then springs back. Without this, a normal tap barely moves anything.
- **Buttons also darken.** Filled buttons add `pressed-fill` (black 14% light / 18% dark); secondary and plain buttons add the lighter `pressed` overlay (5% ink / 8% white), which would be invisible on a dark fill. The overlay is rounded to the button's shape, never clipped with `overflow-hidden`. Cards only scale: an overlay over a photo reads as dirt.
- **Only tappable things move.** An informational card never reacts to a press: the motion promises an action that has nowhere to land.
- **44pt minimum touch area.** Compact controls are 32pt tall and get 6pt of hit slop on each side to reach 44pt.
- **No haptic on a plain press.** The animation is the feedback. See [haptics](./haptics.md) for when to play one.
- **Native controls keep their own feedback.** Tab bar items, header buttons, menus, switches and list rows from the system already respond. Don't wrap them in `Tappable`.

## The failure it prevents

Mixing `opacity: 0.7` on one button, `scale: 0.95` on a card and nothing on a row makes the app feel assembled from parts. One press behaviour, measured in points, feels like one material.

## In code

```tsx
import { Tappable } from "@lardon/ui";

<Tappable onPress={openRecipe} className="rounded-card">
  <RecipeCard recipe={recipe} />
</Tappable>;
```

`Button` already uses `Tappable` with the overlay. Storybook: **Systems / Press feedback**.
