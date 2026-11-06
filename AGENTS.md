# AGENTS.md

## Code style

- No comments unless asked.
- No single-use variables/constants — inline them, Tailwind classes included (inline in `className` or `cn`).
- Check shared helpers/utils before writing a local one; don't create a helper for something that can stay inline.
- `function foo() {}`, never `const foo = () => {}` (lint).
- One component per file in apps (lint). A component that grows pieces becomes a folder named after its concept, one file per piece. Only compound families sharing context (`Dialog`/`DialogHeader`, `Sheet.Content`) stay together.

## Naming

- No single-letter names except `t`, `z`, `_` (lint). No abbreviations (lint) — prefer clear, unambiguous words.
- Don't encode types (`users`, not `userList`) or implementation details (`User`, not `IUser`).
- Include units: `timeoutMs`, `distanceKm`.
- No `Base`/`Abstract`, no generic `Utils`/`Helpers` — name for what it represents, group by concept, put behavior with its concept.
- Hard to name → question the design.

## UI

- Timely feedback for every async action (loading, saving, progress).
- Prevent errors over reporting them: constrain inputs, confirm destructive actions.
- Keep needed info and options visible — don't make users remember across screens.
- Show only what serves the user's goal.
- Error messages: plain language, the exact problem, how to fix it.
- No toasts (lint). Show errors inline, right below the control they concern (`InlineError`), and keep them until the next attempt.

## Committing

- Conventional commits, English, scoped (`feat(x): …`).
- Avoid descriptions unless necessary.

## Agent configs

- Use `agent-browser` for browser automation. Before the first use, run `agent-browser skills get core` and follow it.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Running Scripts

Run TypeScript and JavaScript files with `vpx <file>`, for example `vpx ./scripts/seed.ts --dry-run`. It handles enums, decorators, JSX, and tsconfig `paths`, so do not add `tsx` or `ts-node` to run scripts. `vpx --watch <file>` reruns the file when a file it uses changes, in place of `tsx watch`. `vp node <file>` runs plain Node.js.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
