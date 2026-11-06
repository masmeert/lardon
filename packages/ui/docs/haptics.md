# Haptics

Haptics mark a change of state, not a tap. Used sparingly, each one means something.

## Rules

- **Five feedbacks, named for what happened** (`haptics` in `src/haptics.ts`):

  | Feedback           | Plays when                                                          |
  | ------------------ | ------------------------------------------------------------------- |
  | `selectionChanged` | A picker, segmented control or custom toggle lands on a new value   |
  | `snapped`          | A drag snaps into place, a list item is reordered                   |
  | `succeeded`        | Something the person waited for finished: recipe saved, invite sent |
  | `warned`           | A destructive confirmation appears                                  |
  | `failed`           | An action failed and the screen shows why                           |

- **A plain button press is silent.** The press animation is the feedback. A haptic on every tap turns into noise and teaches people to ignore the meaningful ones.
- **Never double up with the system.** Native switches, menus, sheets, pull to refresh and the tab bar already play their own haptics.
- **Play it when the state changes, not when the gesture starts.** `succeeded` fires when the save completes, not when the button is pressed.
- **`failed` always comes with a visible message** that says what went wrong and how to fix it. A buzz alone is not an error message.

## In code

```tsx
import { haptics } from "@lardon/ui";

await saveRecipe(recipe);
haptics.succeeded();
```

Storybook: **Systems / Haptics** lets you feel each one on the device.
