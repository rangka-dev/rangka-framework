---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: 'CLI commands reference: start, build, studio'
---

# CLI

Command-line interface for building and running Rangka applications.

## Commands

### rangka start

Start the Rangka application server.

```bash
rangka start [--root <path>]
```

**Behavior:**

- Scans the project root for modules, models, and configuration
- Connects to the configured PostgreSQL database
- Syncs the database schema
- Serves the pre-built shell (from `@rangka/client`)
- Serves custom UI chunks from `.rangka/` if present (run `rangka build` first)
- SPA fallback. All non-API routes serve `index.html`
- Listens on the port configured in `rangka.config.ts` (default `3000`)
- Graceful shutdown on `SIGINT` / `SIGTERM`

**Requirements:**

- A `rangka.config.ts` with database settings in the project root

---

### rangka build

Compile custom UI components (views, fields, cards) for the shell to load at runtime.

```bash
rangka build [--root <path>]
```

**Behavior:**

- Scans modules for custom UI components (views, fields, cards)
- Bundles each component with esbuild (ESM, browser target)
- Externalizes `react`, `react-dom`, and `@rangka/client`
- Outputs bundles and a `manifest.json` to `.rangka/`
- Skips gracefully if no custom components are found

**Output structure:**

```
.rangka/
├── views/
│   └── <module>--<name>.<hash>.js
├── fields/
│   └── <module>--<name>.<hash>.js
├── cards/
│   └── <module>--<name>.<hash>.js
└── manifest.json
```

The manifest maps component keys to their served paths (e.g. `/_rangka/views/...`), which the shell uses to lazy-load custom components.

---

### rangka studio

Start the Studio development environment for agent-driven page building and model design.

```bash
rangka studio [--root <path>] [--port <number>] [--wsPort <number>] [--frameworkPort <number>]
```

**Flags:**

| Flag              | Default | Description                                |
| ----------------- | ------- | ------------------------------------------ |
| `--root`          | `.`     | Project root directory                     |
| `--port`          | `4000`  | Studio UI port                             |
| `--wsPort`        | `4001`  | WebSocket port for real-time communication |
| `--frameworkPort` | `3000`  | Framework server port                      |

**Behavior:**

- Starts a WebSocket server for real-time communication with the framework
- Serves the Studio UI for interactive page building and model design
- Connects to the running framework server on the configured port
