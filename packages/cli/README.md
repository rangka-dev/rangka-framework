# @rangka/cli

Command-line interface for developing and running Rangka applications.

## How it works

The CLI provides the `rangka` binary. It scans a user's project directory, boots the framework via `@rangka/core`, and serves both the API and the bundled client in a single process.

## Architecture

```
src/
├── index.ts         — Entry point, registers commands via citty
├── commands/
│   ├── start.ts     — Boot framework + serve (production mode)
│   ├── build.ts     — esbuild production bundle
│   └── studio.ts    — Start studio dev environment
├── resolve-client.ts — Locates @rangka/client shell dist directory
├── ui-scanner.ts    — Scans project for custom UI components
└── __tests__/
```

## Key patterns

- Commands use `citty` for definition and argument parsing
- `ProjectScanner` from `@rangka/core` discovers the user's app modules
- `boot()` from `@rangka/core` handles the full server startup
- Client shell is served via `@fastify/static` from the pre-built dist
- Custom UI components are discovered by `ui-scanner.ts` and bundled with esbuild

## Dependencies

| Package               | Purpose                            |
| --------------------- | ---------------------------------- |
| `citty`               | CLI command framework              |
| `esbuild`             | Production bundling                |
| `@fastify/static`     | Static file serving                |
| `@rangka/core`        | Framework runtime (boot, server)   |
| `@rangka/client`      | Pre-built shell (served as static) |
| `@rangka/shared`      | Type definitions                   |
| `@rangka/studio-core` | Studio runtime                     |

## Commands

```bash
pnpm --filter @rangka/cli build   # Compile TypeScript
pnpm --filter @rangka/cli test    # Run tests
```

## Contributing

- All commands follow the citty `defineCommand` pattern. Read an existing command before adding a new one.
- Boot logic lives in `@rangka/core`. The CLI is a thin orchestration layer. Don't duplicate boot/server logic here.
- Client resolution (`resolve-client.ts`) finds the shell dist directory. Don't hardcode paths.
