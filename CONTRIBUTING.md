# Contributing

Thanks for taking an interest in Kinetic. This guide covers the setup, the conventions the codebase follows, and the specific steps for the most common change: adding a study.

## Setup

```bash
pnpm install
pnpm dev
```

Uses pnpm and a current Node LTS. Before opening a PR:

```bash
pnpm typecheck && pnpm test && pnpm build
```

`pnpm build` is worth running even for small changes — it prerenders every route, so a runtime error on any study page fails the build rather than reaching production.

## Conventions

- **TypeScript, no `any`.** `pnpm typecheck` must pass.
- **Formatting is Prettier's job** — `pnpm format`. No hand-tuned whitespace.
- **Comments explain why, not what.** Most code here is self-evident; a comment earns its place when the reasoning isn't (a non-obvious constant, a browser constraint being worked around).
- **Match the surrounding style.** The codebase favours small pure functions and terse, dense modules.

## Performance

Animations run continuously, and the collection contains twenty-six studies. Two rules keep that affordable:

- **Allocate nothing per frame.** No arrays or objects built inside a draw call.
- **Respect the guards already in place.** Off-screen studies pause via `IntersectionObserver`, and everything freezes under `prefers-reduced-motion`. New rendering paths should honour both.

If you add a WebGL scene, remember each `<Canvas>` is a GL context and browsers cap how many can exist at once — which is why `Artwork3D` is opt-in per call site rather than used everywhere.

## Pull requests

Keep them focused — one study, one fix, one refactor. Describe what changed and why, and include a screenshot or capture for anything visual, since that's the part review can't infer from the diff.
