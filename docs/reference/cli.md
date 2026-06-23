---
status: stable
since: 0.1.0
last-updated: 2026-06-21
description: 'CLI commands reference: start, build, studio'
---

# CLI

Command-line interface for building and running Rangka applications.

## Install

```bash
pnpm add @rangka/cli
```

This registers the `rangka` binary. All commands accept a `--root <path>` flag to set the project root directory (defaults to `.`).

## Commands

### rangka start

Start the Rangka application server.

```bash
rangka start [--root <path>] [--no-sync]
```

**Flags:**

| Flag        | Default | Description                         |
| ----------- | ------- | ----------------------------------- |
| `--root`    | `.`     | Project root directory              |
| `--no-sync` | `false` | Skip automatic database schema sync |

**Behavior:**

- Scans the project root for modules, models, and configuration
- Connects to the configured database (SQLite by default, PostgreSQL if configured)
- Syncs the database schema (unless `--no-sync` is passed)
- Serves the pre-built shell from `@rangka/client`
- Serves custom widget bundles from `.rangka/` if present (run `rangka build` first)
- SPA fallback. All non-API routes serve `index.html`
- Listens on the port configured in `rangka.config.ts` (default `3000`)
- Graceful shutdown on `SIGINT` / `SIGTERM`. Closes the server and database connection.

**Database defaults:**

When no database configuration is provided, SQLite is used at `.rangka/dev.db`. No setup required.

For PostgreSQL, if not fully specified in `rangka.config.ts`, these defaults apply:

| Setting    | Default     |
| ---------- | ----------- |
| `host`     | `localhost` |
| `port`     | `5432`      |
| `database` | `rangka`    |
| `user`     | `postgres`  |
| `password` | `''`        |

**Requirements:**

- A `rangka.config.ts` in the project root
- `@rangka/client` installed (provides the shell build)
- For SQLite: no additional setup
- For PostgreSQL: PostgreSQL running and accessible

---

### rangka build

Compile custom widgets for the shell to load at runtime.

```bash
rangka build [--root <path>]
```

**Flags:**

| Flag     | Default | Description            |
| -------- | ------- | ---------------------- |
| `--root` | `.`     | Project root directory |

**Widget discovery:**

The scanner looks for `.ts` and `.tsx` files in each module's `widgets/` directory:

```
modules/<module>/widgets/
```

Each file becomes a widget registered under the key `<module>.<kebab-name>`. For example, `modules/sales/widgets/PipelineBoard.tsx` registers as `sales.pipeline-board`.

**Behavior:**

- Scans all module directories for custom widgets
- Bundles each widget with esbuild (ESM, browser target `es2022`)
- Externalizes `react`, `react-dom`, and `@rangka/client`
- Outputs bundles and a `manifest.json` to `.rangka/`
- Skips gracefully if no custom widgets are found

**Output structure:**

```
.rangka/
├── widgets/
│   └── <module>--<name>.<hash>.js
└── manifest.json
```

**Manifest format:**

```json
{
  "sales.pipeline-board": "/_rangka/widgets/sales--pipeline-board.a1b2c3.js"
}
```

The manifest maps widget registry keys to their served paths. The shell uses this to lazy-load custom widgets at runtime.

---

### rangka studio

Start the Studio development environment for agent-driven page building and model design.

```bash
rangka studio [--root <path>] [--port <number>] [--frameworkPort <number>]
```

**Flags:**

| Flag              | Default | Description            |
| ----------------- | ------- | ---------------------- |
| `--root`          | `.`     | Project root directory |
| `--port`          | `4000`  | Studio WebSocket port  |
| `--frameworkPort` | `3000`  | Framework server port  |

**Behavior:**

- Starts a WebSocket server for real-time communication with the Studio UI
- Connects to the running framework server on the configured port
- Graceful shutdown on `SIGINT` / `SIGTERM`

**Requirements:**

- `@rangka/studio-core` installed as a dev dependency. If missing, the command exits with install instructions:

```bash
pnpm add -D @rangka/studio-core
```

---

### rangka --help

Print available commands. Provided automatically by the CLI framework.

### rangka --version

Print the CLI version.
