# Surfaces

Three levels. A surface finds its level from the one it sits on, so nesting never melts into its parent.

## Rules

- **The ladder** (`surfaceLevels` in `src/surfaces/surface-level.ts`):

  | Level        | Light                                | Dark      | Use                                  |
  | ------------ | ------------------------------------ | --------- | ------------------------------------ |
  | `background` | `#F8F5F0`                            | `#151210` | The page                             |
  | `raised`     | `#FFFFFF` + soft shadow + hairline   | `#211C19` | Cards, grouped rows                  |
  | `floating`   | `#FFFFFF` + deeper shadow + hairline | `#2B2521` | Our own popovers and floating panels |

- **Light mode: shadow carries elevation.** Raised and floating are both white; only the shadow differs. **Dark mode: each level is lighter.** Shadows barely show on dark backgrounds, so lightness does the work.
- **Surfaces are relative.** `<Surface>` reads the level it sits on and goes one up (`offset`, default 1), capped at `floating`. A card inside a floating panel stays distinguishable without anyone passing a prop.
- **Wells are translucent.** Image tiles and inset areas use `bg-well` (5% ink in light mode, 6% white in dark mode), so they read as recessed on any surface.
- **Pressed and selected states are overlays** (`bg-pressed`, `bg-selected`), not fixed colors, so they work at every level.
- **Concentric corners.** Inner radius = outer radius − inset − border (`nestedRadius`). A 24pt card (`rounded-card`) with 8pt padding holds a 16pt tile (`rounded-tile`), and sits in a 32pt sheet (`rounded-sheet`) with 8pt padding. With any other padding, compute it with `nestedRadius`; don't reuse the class.
- **Liquid Glass is only for floating controls over content**: the native tab bar, headers and toolbars, and our own floating buttons (`expo-glass-effect`). Never on content cards or lists. Glass over glass is never allowed.
- **Sheets, menus and alerts are native** and bring their own material. Don't restyle them.

## Tactile controls

Buttons are the one place the interface becomes an object: lit from above, pressed into the surface.

- **Filled buttons** (`primary`, `destructive`) stack five layers:
  1. A vertical gradient from `accent-top` to `accent-bottom` (`bg-accent-gradient`), with the flat `accent` underneath in case gradients are unavailable.
  2. A 1pt inner highlight along the top edge (white, 28% light / 35% dark).
  3. A soft inner shade along the bottom edge (black, 20% / 25%).
  4. A 1pt outer rim one step darker than the bottom stop.
  5. A drop shadow tinted with the button's own color (`accent-glow`), 8pt down with an 18pt blur pulled in by 6pt, so it pools under the button instead of haloing it.

  Layers 2 to 5 are `shadow-accent` / `shadow-danger`. Never rebuild them by hand.

- **Secondary buttons** are the same object without color: a white-to-flour gradient (`bg-control-gradient`, `#FFFFFF` to `#F2EEE8`; `#312B27` to `#231E1B` in dark mode), the top highlight, a faint bottom shade, a 12% ink rim and a small neutral shadow that pools underneath (`shadow-control`).
- **Icon-only buttons are circles** of the control height (`iconOnly`), with the icon 2pt larger than beside a label. They keep a label for VoiceOver. Stretched with `flex-1`, they become wide pills, like a row of sign-in providers.
- **Disabled filled buttons stay objects.** They swap to a muted olive-taupe gradient (`bg-disabled-gradient`, `#C4C0B2` to `#AEAA9B`; `#3D3834` to `#322D2A` in dark mode) with a plain rim and no glow, instead of fading to transparency. A faded button looks broken; a muted one looks waiting. Disabled secondary and plain buttons keep their shape and mute their label.
- **Plain buttons stay flat.** Text actions are not objects.
- **Only buttons are tactile.** Cards, chips and rows stay flat with a soft shadow. If everything is an object, nothing is.
- **Never clip a tactile control** with `overflow-hidden`: it cuts off the rim and the shadow. Round the pressed overlay instead.

## The failure it prevents

A panel that hard-codes `bg-raised` looks fine on the page and disappears when it opens on a raised card. Relative levels make the right choice automatic.

## In code

```tsx
<Surface className="rounded-card p-2">
  <Image className="aspect-square rounded-tile" source={photo} />
</Surface>
```

Storybook: **Systems / Surfaces** shows the ladder in light and dark and the corner rule.
