# Motion

Three spring tiers, picked by the size of what moves. Nobody writes a duration by hand.

## Rules

- **Three tiers only** (`springs` in `src/motion/springs.ts`). Durations are Reanimated's perceptual durations; the spring settles at about 1.5× that.

  | Tier       | Enter               | Exit (timing, ease-in) | Use                                                                        |
  | ---------- | ------------------- | ---------------------- | -------------------------------------------------------------------------- |
  | `fast`     | 150ms, damping 1    | 100ms                  | Press feedback, fades, icon swaps, small state changes                     |
  | `moderate` | 280ms, damping 1    | 180ms                  | Chips, segmented controls, expanding rows, anything that must land exactly |
  | `slow`     | 420ms, damping 0.85 | 260ms                  | Large surfaces, card to detail, our own floating panels                    |

- **The bigger the thing, the slower the tier.** A full-screen surface on `fast` reads as a glitch; a chip on `slow` feels sluggish.
- **Exits are quicker than entrances and never bounce** (`exits`). A dismissal is a decision already made: it should feel final, not replay the entrance backwards.
- **`moderate` is critically damped.** It feels as quick as a bouncy spring but stops exactly on target, so anything that must line up with something else (a selection pill under a segment, a row height) uses it.
- **Animate `transform` and `opacity` only.** Never animate `width`, `height`, `top` or `left`: they run layout every frame and skip Reduce Motion handling. Use Reanimated layout animations when the layout itself has to change.
- **Reduce Motion means fewer and gentler, not none.** Every tier follows the system setting, so travel and scale snap. Opacity fades explain what changed, so a fade-only animation opts back in with `keepWhenMotionReduced(springs.fast)`.
- **Native transitions stay native.** Stack pushes, sheets, tab switches and context menus use the system animations. The tiers are for our own components only.

## The failure it prevents

Hand-picked durations drift: one screen uses 200ms, the next 350ms with a bounce, and the app stops feeling like one thing. With three tiers, every new animation is a choice between three known feels.

## In code

```tsx
import { exits, springs } from "@lardon/ui";

progress.value = withSpring(1, springs.moderate);
progress.value = withTiming(0, exits.moderate);
```

Storybook: **Systems / Motion** plays each tier in and out.
