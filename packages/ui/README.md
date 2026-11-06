# @lardon/ui

Lardon's design system for the native app: tokens, systems and components. Screens live in `apps/native`; how things look, move and respond lives here.

## Direction

- **iOS-native first.** Tab bar, headers, sheets, menus, alerts and switches are the system's own (Expo Router native tabs and stacks, true-sheet). This package covers what the system doesn't.
- **Warm and tactile.** Warm neutrals, images on neutral tiles, generous corners, one accent.
- **Systems before components.** Each system is a short set of rules with exact values and the reason behind them. Components are built from systems, never from one-off values.

## Systems

| System                                     | In code                                     |
| ------------------------------------------ | ------------------------------------------- |
| [Color](./docs/color.md)                   | `theme.css`                                 |
| [Typography](./docs/typography.md)         | `Text`, `typeRoleClassNames`                |
| [Sizes](./docs/sizes.md)                   | `controlSizes`, `DensityProvider`           |
| [Surfaces](./docs/surfaces.md)             | `Surface`, `nestedRadius`                   |
| [Motion](./docs/motion.md)                 | `springs`, `exits`, `keepWhenMotionReduced` |
| [Press feedback](./docs/press-feedback.md) | `Tappable`                                  |
| [Haptics](./docs/haptics.md)               | `haptics`                                   |

Still to write: scrolling (edge fades, carousels, collapsing titles), reveal (first-load fades and skeleton hand-off) and imagery (photo tiles, aspect ratios, outlines).

## Components

`Text`, `Icon` (SF Symbols), `Tappable`, `Button`, `Surface`, `TextField`.

## Storybook

Stories sit next to their component (`*.stories.tsx`) and run on the device, because glass, SF Symbols and haptics don't exist on the web.

```sh
cd apps/native
vp run storybook
```

Then open the Expo dev menu and choose **Open Storybook**, or open `lardon://storybook`. Storybook is left out of the bundle unless `EXPO_PUBLIC_STORYBOOK_ENABLED=true`. After adding a story file, restart the script or run `vp run storybook:generate`.

## Adding to the system

- New values go into a system first, with a reason, then into components.
- A value that doesn't fit any system is a design question, not a one-off.
