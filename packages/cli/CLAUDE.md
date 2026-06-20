# CLAUDE.md — @rangka/cli

## Package overview

The `rangka` CLI binary. Provides commands for building and running Rangka applications. This is a thin orchestration layer over `@rangka/core` — it scans the project, boots the framework, and serves the result.

## Tech stack

- Node.js >= 20, TypeScript 5
- citty (CLI command framework)
- esbuild (production bundling)
- `@rangka/core` for boot and runtime
- `@rangka/studio-core` for studio command

## Project structure

```
src/
├── index.ts           — Entry point, registers commands with citty
├── commands/
│   ├── start.ts       — Boot framework + serve client (production)
│   ├── build.ts       — esbuild production bundle
│   └── studio.ts      — Start studio development environment
├── resolve-client.ts  — Finds @rangka/client shell dist directory
├── ui-scanner.ts      — Discovers custom UI components in user's project
└── __tests__/
```

## Key patterns

### Command definition

All commands use citty's `defineCommand`:

```typescript
import { defineCommand } from 'citty';

export const myCommand = defineCommand({
  meta: { name: 'my-command', description: '...' },
  args: { root: { type: 'string', default: '.' } },
  async run({ args }) { ... },
});
```

### Boot delegation

The CLI does NOT implement boot logic. It calls `@rangka/core`:

```typescript
import { ProjectScanner, MemoryDiscoverySource, boot } from '@rangka/core';

const scanner = new ProjectScanner(root);
const { app, rangkaConfig } = await scanner.scan();
const result = await boot({ ... });
```

### Client serving

The built client shell is served as static files via `@fastify/static`. The dist path is resolved by `resolve-client.ts`.

## Commands

```bash
pnpm --filter @rangka/cli build   # Compile TypeScript
pnpm --filter @rangka/cli test    # Run tests
```

## Don'ts

- Don't duplicate boot logic — call `boot()` from `@rangka/core`
- Don't duplicate server creation — use `createServer` from `@rangka/core`
- Don't hardcode the client shell path — use `resolveShellDir()`
- Don't add commands outside the citty `defineCommand` pattern
- Don't import from `@rangka/client` source — only reference its dist directory for static serving
