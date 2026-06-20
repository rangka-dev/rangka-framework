# Documentation

VitePress-powered documentation site for the Rangka framework.

## Structure

```
docs/
├── concepts/       — Framework concepts (models, hooks, scopes, traits, etc.)
├── guides/         — Step-by-step guides for app developers
├── reference/      — API reference (widget types, actions, field types, etc.)
├── spec/           — Internal specs for planned/in-progress features
├── contributing/   — Contributor documentation
├── index.md        — Landing page
└── introduction.md — Getting started
```

## Content placement

- `concepts/` — explains what a feature is and why it exists. Written after implementation.
- `reference/` — exhaustive API surface. Tables of fields, types, actions. Written after implementation.
- `spec/` — design specs for features in progress. Written before or during implementation. Remove "Planned" banner when done.
- `guides/` — task-oriented walkthroughs for app developers. Written after implementation.

## Commands

```bash
pnpm docs:dev       # Start dev server with hot reload
pnpm docs:build     # Build static site → docs/.vitepress/dist/
pnpm docs:preview   # Preview built site locally
```

## Rules

### Keep docs in sync with code

- Every documented feature must match the current implementation
- If the code does not do it yet, mark the section with `> **Planned** — not yet implemented.`
- When you implement a feature that has a spec in `docs/spec/`, update or remove the "Planned" banner
- Reference docs describe behavior from the app developer's perspective, not internal file paths

### Writing style

- Write in short clear sentences. Avoid long compound sentences.
- Do not use em dashes. Use periods or restructure the sentence instead.
- Minimize commas. If a sentence has more than two commas break it up.
- Use active voice. Say "the framework stamps created_by" not "created_by is stamped by the framework".
- Lead with what the user needs to know. Put the important thing first.

## Tone

- Direct and factual. No filler words like "simply" or "just".
- Assume the reader is a working developer. No need to over-explain basic concepts.
- Be specific. Say "returns 403" not "returns an error". Say "adds a WHERE clause" not "filters the data".

## Structure

- Use tables for structured comparisons (action/behavior, field/type/description).
- Use code blocks for any configuration or API example.
- Keep code examples minimal. Show the relevant part not the entire file.
- One concept per section. If a section covers two ideas split it.

## Formatting

- Use `**bold**` sparingly. Reserve it for key terms on first mention or critical warnings.
- Do not use emoji.
- Headings use sentence case ("Owner-based permissions" not "Owner-Based Permissions").
- Reference docs use tables for parameters. Concept docs use prose with inline code.

## Content rules

- Every documented feature must match the current implementation. If the code does not do it yet mark the section with `> **Planned** — not yet implemented.`
- When documenting behavior that depends on another feature (like a trait) state the dependency explicitly.
- Do not document internal implementation details (function names or file paths) in user-facing docs. Describe behavior from the API consumer's perspective.
