# Color

Warm neutrals carry the interface. One accent marks the main action. Signal colors are rare and always paired with an icon or words.

## Rules

- **Tokens are semantic** (`src/theme.css`). Components use `bg-raised`, `text-muted`, `bg-accent`, never a raw hex. Raw values live in one place, per theme.
- **Neutrals** are warm, not grey: flour `#F8F5F0` page and ink `#221C18` text in light mode; `#151210` and `#F4EFE9` in dark mode.
- **One accent.** It fills the main action and colors tappable text, and nothing else: no accent headings, no accent borders, no decorative accent. Pressed and selected states stay neutral overlays.
- **On-accent text flips with the theme.** White on the light-mode accent, ink on the lighter dark-mode accent. Both pass 4.5:1.
- **Signals.** `danger` for errors and destructive actions, `success` for confirmations. Never color alone: always an icon or words too, for color blindness and for glanceability.
- **Contrast.** Body text and muted text pass 4.5:1 on every surface level in both themes. Accent and danger pass 4.5:1 as text on the background and behind their on-color.
- **Dark mode is designed, not inverted.** Each value is picked for dark, with lighter accents and lighter elevated surfaces.

## The accent: olive

| Token           | Light     | Dark      |
| --------------- | --------- | --------- |
| `accent`        | `#5A6A1F` | `#A5B45A` |
| `accent-top`    | `#6F8230` | `#B9C86E` |
| `accent-bottom` | `#3E4A12` | `#87963D` |
| `on-accent`     | `#FFFFFF` | `#151210` |

Olive is calm and leaves red entirely to `danger`, so an error never looks like a main action. The top and bottom stops exist only for the gradient on filled buttons (see [surfaces](./surfaces.md#tactile-controls)); flat uses take `accent`.
