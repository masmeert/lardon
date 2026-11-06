# Typography

Six roles mapped to iOS text styles. Pick a role by purpose, never by size.

## Rules

- **Six roles** (`typeRoleClassNames` in `src/typography/type-roles.ts`), size / line height in points:

  | Role       | Default | Compact | iOS style   | Weight   | Purpose                                 |
  | ---------- | ------- | ------- | ----------- | -------- | --------------------------------------- |
  | `display`  | 34/41   | 28/34   | Large Title | bold     | Page title, one per screen              |
  | `title`    | 22/28   | 20/25   | Title 2     | semibold | Section title                           |
  | `headline` | 17/22   | 15/20   | Headline    | semibold | Card and row titles, button labels      |
  | `body`     | 17/22   | 15/20   | Body        | regular  | Reading text, steps, notes              |
  | `caption`  | 13/18   | 12/16   | Footnote    | regular  | Metadata next to content                |
  | `micro`    | 11/13   | 11/13   | Caption 2   | regular  | Counters and tiny badges, one line only |

- **Every role scales with Dynamic Type.** Reading roles (`headline`, `body`, `caption`) scale without limit. `display` caps at 1.4×, `title` and `micro` at 1.6×, so headers and badges don't push content off screen. Button labels cap at 1.6×.
- **Compact drops every role one notch**, size and line height together. A dense region should read as a smaller version of the same hierarchy, not a squeezed one.
- **Three weights.** Regular for text, semibold for titles and labels, bold only for `display`.
- **Two text colors.** `default` and `muted`. Never fade text with opacity: faded text fails contrast on some surfaces and not others.
- **Accent, danger and success are signals.** `accent` text only for tappable text actions, `danger` only for errors, `success` only for confirmations.
- **No uppercase labels, no letter-spacing, no small labels above titles.** Hierarchy comes from role and weight.
- **The system font (SF Pro) for now.** It's what iOS 26 controls use, so our text and the native headers and tab bar match. A brand typeface is an open decision; if we add one, it replaces the font family here and nowhere else.
- **Never write `text-[15px]`.** Use `<Text variant="…">`. If no role fits, the design needs a role, not a one-off size.

## In code

```tsx
<Text variant="headline">Grandma's cassoulet</Text>
<Text variant="caption" tone="muted">45 min · Serves 4</Text>
```

Storybook: **Systems / Typography** (both densities) and **Text tones**.
