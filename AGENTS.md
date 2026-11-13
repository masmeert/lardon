# AGENTS.md

## Code

- No comments unless asked.
- Inline single-use variables, constants and class strings (in `className` or `cn`).
- Reuse shared helpers before writing one, and don't extract a helper for what can stay inline.
- A component that grows pieces becomes a folder named after its concept, one file per piece. Only compound families sharing context (`Sheet.Content`) stay together.
- Name what a thing represents: no encoded types (`users`, not `userList`), no `I`, `Base`, `Abstract`, `Utils` or `Helpers`. Include units (`timeoutMs`). Hard to name means question the design.
- Lint enforces the rest (function declarations, one component per file, no abbreviations or single letters, no toasts).

## UI

- Give feedback for every async action.
- Prevent errors rather than report them: constrain inputs, confirm destructive actions.
- Show only what serves the user's goal, and keep what they need on screen.
- Errors go inline under their control (`InlineError`), in plain language with the exact problem and the fix, and stay until the next attempt.
- Native UI uses native iOS controls (`@expo/ui/swift-ui`) and SF Symbols (`Icon`), and `#/shared/ui` with the theme tokens for the rest. No raw values when a token exists.

## Copy and commits

- Never use middle dots (`·`), anywhere. Use a comma, a line break or a separate element.
- Conventional commits in English, scoped (`feat(x): …`), with no body unless needed.

## Tools

- Browser automation uses `agent-browser`. Run `agent-browser skills get core` before the first use.

<!--VITE PLUS START-->

- Use `vp` (Vite+), never npm, pnpm or npx: `vp install` after pulling, `vp run <name>` for `package.json` scripts and `vite.config.ts` tasks (`vp <name>` is a built-in), `vpx <file>` to run a TypeScript file, `vp dlx` for one-off packages.
- Before calling work done, run `vp check` and `vp test`. If the toolchain misbehaves, run `vp env doctor`.
- Docs: `node_modules/vite-plus/docs`.

<!--VITE PLUS END-->
