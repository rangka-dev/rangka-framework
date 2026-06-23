# Spec: SQLite adapter

Status: Draft
Packages affected: core (db layer, boot sequence), cli (default config)

---

## Context

The framework currently requires PostgreSQL to operate. This creates friction for new developers who want to evaluate Rangka or use Studio for app development. They must install and configure PostgreSQL before they can run anything.

Adding SQLite support removes this barrier. A developer can run `rangka studio` in a project directory and start building immediately. No database setup, no connection strings, no Docker.

SQLite is the default for development and Studio usage. PostgreSQL remains the recommended choice for production deployments and any app that needs background jobs or concurrent writes.

---

## Design decisions

- SQLite is the default when no database config is provided.
- The SQLite adapter lives in a parallel module (`core/src/db/sqlite/`). Existing PostgreSQL code is not modified or abstracted.
- Background jobs, job scheduler, and async events are disabled in SQLite mode. These features require PostgreSQL's row-level locking.
- UUID generation moves app-side (`crypto.randomUUID()`) for both dialects. This removes the dependency on `gen_random_uuid()`.
- The SQLite database file lives at `.rangka/dev.db` by default. This directory is gitignored.
- Schema auto-sync works on SQLite with the same semantics. The implementation uses SQLite PRAGMAs for introspection and table recreation for destructive alterations.
- `better-sqlite3` is the driver. It is synchronous and single-threaded. This is acceptable for dev/Studio usage and small single-user deployments.
- Minimum SQLite version: 3.35.0 (for RETURNING clause). In practice, `better-sqlite3` v11+ bundles SQLite 3.45+.

---

## Configuration

### No config (default to SQLite)

When `BootOptions.database` is undefined, the framework uses SQLite:

```typescript
// No database config — SQLite at .rangka/dev.db
export default {
  modules: ['./modules/sales'],
};
```

### Explicit SQLite config

```typescript
export default {
  database: {
    dialect: 'sqlite',
    path: '.rangka/dev.db', // Relative to project root
  },
};
```

### PostgreSQL config (existing behavior, unchanged)

```typescript
export default {
  database: {
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    name: 'myapp',
    user: 'postgres',
    password: 'secret',
  },
};
```

---

## Feature availability

| Feature                                                            | PostgreSQL | SQLite                  |
| ------------------------------------------------------------------ | ---------- | ----------------------- |
| CRUD (create, update, delete, find, get)                           | Yes        | Yes                     |
| Batch insert (createMany)                                          | Yes        | Yes                     |
| Filters (eq, gt, lt, in, contains, startsWith, etc.)               | Yes        | Yes                     |
| Search (across searchable fields)                                  | Yes        | Yes                     |
| Relations and includes                                             | Yes        | Yes                     |
| Hooks (validate, beforeSave, afterSave, beforeDelete, afterDelete) | Yes        | Yes                     |
| Transactions                                                       | Yes        | Yes                     |
| Schema auto-sync                                                   | Yes        | Yes                     |
| Sequence fields (auto-numbering)                                   | Yes        | Yes                     |
| Scopes and permissions                                             | Yes        | Yes                     |
| Audit log                                                          | Yes        | Yes                     |
| Background jobs                                                    | Yes        | No                      |
| Job scheduler                                                      | Yes        | No                      |
| Async events                                                       | Yes        | No (runs sync)          |
| Concurrent write workers                                           | Yes        | Limited (single-writer) |

When a disabled feature is called in SQLite mode, the framework throws a descriptive error:

```
BackgroundJobsUnavailable: Background jobs require PostgreSQL.
Configure a postgres database to enable this feature.
```

---

## Architecture

### New files

```
packages/core/src/db/sqlite/
  index.ts             — Exports, dialect detection helper
  introspect.ts        — Schema introspection via PRAGMA and sqlite_master
  field-mapper.ts      — Type mapping for DDL generation
  diff-engine.ts       — SQLite-specific DDL with table recreation
  desired-state.ts     — System table definitions in SQLite-compatible types
  pragmas.ts           — Connection setup (foreign_keys, WAL, busy_timeout)
```

### Modified files

| File                            | Change                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `core/src/db/client.ts`         | Accept `dialect` in config. Instantiate `SqliteDialect` or `PostgresDialect`. |
| `core/src/boot/index.ts`        | Default to SQLite when no database config. Skip job worker startup if SQLite. |
| `core/src/db/auto-sync.ts`      | Route to `sqlite/introspect` or existing `introspect` based on dialect.       |
| `core/src/db/model-ops.ts`      | Generate UUID app-side with `crypto.randomUUID()`.                            |
| `core/src/events/bus.ts`        | Force sync dispatch when dialect is SQLite.                                   |
| `core/src/db/filter-applier.ts` | Use `LIKE` instead of `ILIKE` when dialect is SQLite.                         |

### Not modified

- `query-builder.ts`, `filter-translator.ts`, `include-resolver.ts`
- Hook executor, auth, scope enforcer, services
- All of `packages/shared/`, `packages/client/`, `packages/cli/`
- Existing PostgreSQL `introspect.ts`, `diff-engine.ts`, `field-mapper.ts`

---

## SQLite introspection

Replace `information_schema` and `pg_indexes` queries with SQLite equivalents:

| PostgreSQL                                  | SQLite equivalent                                               |
| ------------------------------------------- | --------------------------------------------------------------- |
| `information_schema.tables`                 | `SELECT name FROM sqlite_master WHERE type='table'`             |
| `information_schema.columns`                | `PRAGMA table_info(tablename)`                                  |
| `information_schema.table_constraints` (FK) | `PRAGMA foreign_key_list(tablename)`                            |
| `pg_indexes`                                | `PRAGMA index_list(tablename)` + `PRAGMA index_info(indexname)` |
| `information_schema.check_constraints`      | Parse `CREATE TABLE` SQL from `sqlite_master`                   |

The introspection output normalizes to the same internal schema format (`IntrospectedTable`) used by the existing DiffEngine. This means the comparison logic stays shared.

---

## SQLite type mapping

| Framework type | PostgreSQL type  | SQLite type        |
| -------------- | ---------------- | ------------------ |
| string         | VARCHAR(n)       | TEXT               |
| text           | TEXT             | TEXT               |
| integer        | INTEGER          | INTEGER            |
| float          | DOUBLE PRECISION | REAL               |
| boolean        | BOOLEAN          | INTEGER (0/1)      |
| date           | DATE             | TEXT (ISO 8601)    |
| datetime       | TIMESTAMPTZ      | TEXT (ISO 8601)    |
| json           | JSONB            | TEXT (JSON string) |
| uuid (pk)      | UUID             | TEXT               |
| decimal/money  | DECIMAL(p,s)     | REAL               |
| enum           | VARCHAR + CHECK  | TEXT + CHECK       |

---

## SQLite DDL handling

SQLite has limited `ALTER TABLE` support. The diff engine handles this:

| Operation                         | Strategy                                  |
| --------------------------------- | ----------------------------------------- |
| Create table                      | `CREATE TABLE`                            |
| Add column (constant default)     | `ALTER TABLE ADD COLUMN`                  |
| Add column (non-constant default) | Add as nullable, backfill, recreate table |
| Change column type                | Recreate table                            |
| Drop column                       | `ALTER TABLE DROP COLUMN` (SQLite 3.35+)  |
| Add foreign key                   | Recreate table                            |
| Add index                         | `CREATE INDEX`                            |
| Add unique index                  | `CREATE UNIQUE INDEX`                     |
| Add check constraint              | Recreate table                            |

Table recreation follows the SQLite recommended pattern:

1. `CREATE TABLE _new_tablename (...)` with desired schema
2. `INSERT INTO _new_tablename SELECT ... FROM tablename`
3. `DROP TABLE tablename`
4. `ALTER TABLE _new_tablename RENAME TO tablename`
5. Recreate indexes and triggers

This runs inside a transaction for atomicity.

---

## SQLite connection setup

On first connection, the adapter runs these PRAGMAs:

```sql
PRAGMA foreign_keys = ON;       -- Required. Off by default in SQLite.
PRAGMA journal_mode = WAL;      -- Write-ahead log. Allows concurrent reads during writes.
PRAGMA busy_timeout = 5000;     -- Wait 5s for locks instead of failing immediately.
PRAGMA synchronous = NORMAL;    -- Good balance of safety and speed for dev usage.
```

---

## UUID generation

UUID generation moves app-side for both dialects:

```typescript
import { randomUUID } from 'node:crypto';

// In model-ops, during create:
const id = data.id ?? randomUUID();
```

This removes the dependency on `gen_random_uuid()` as a column default. PostgreSQL tables still define the column as `UUID` type but without a server-side default. SQLite tables define it as `TEXT`.

The auto-sync DDL for primary keys changes from:

```sql
-- Before (PostgreSQL only)
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- After (PostgreSQL)
id UUID PRIMARY KEY

-- After (SQLite)
id TEXT PRIMARY KEY
```

---

## Disabled features in SQLite mode

### Background jobs

The job worker uses `SELECT ... FOR UPDATE SKIP LOCKED` for safe concurrent job claiming. SQLite has no row-level locking. The job system is skipped during boot.

Attempting to call `ctx.enqueue()` throws `BackgroundJobsUnavailable`.

### Job scheduler

Depends on the job system. Skipped during boot.

### Async events

`ctx.events.emit()` normally enqueues a job for async processing. In SQLite mode, all events dispatch synchronously within the current request. This means event handlers run inline and any error in a handler propagates to the caller.

---

## Sequence fields on SQLite

The existing `naming_sequence` table approach works on SQLite with one adjustment. The current PostgreSQL upsert:

```sql
INSERT INTO naming_sequence (model, field, next_val)
VALUES ('sales.invoice', 'number', 1)
ON CONFLICT (model, field)
DO UPDATE SET next_val = naming_sequence.next_val + 1
RETURNING next_val
```

SQLite supports `ON CONFLICT` (since 3.24) and `RETURNING` (since 3.35). The syntax is compatible. The only change is the table reference in the `DO UPDATE` clause must use `excluded` or the bare column name:

```sql
INSERT INTO naming_sequence (model, field, next_val)
VALUES ('sales.invoice', 'number', 1)
ON CONFLICT (model, field)
DO UPDATE SET next_val = next_val + 1
RETURNING next_val
```

This works on both dialects.

---

## Search and case-insensitive filtering

PostgreSQL uses `ILIKE` for case-insensitive pattern matching. SQLite's `LIKE` is case-insensitive by default for ASCII characters.

The filter applier checks the dialect:

- PostgreSQL: `column ILIKE '%pattern%'`
- SQLite: `column LIKE '%pattern%'`

For Unicode case-insensitivity on SQLite, the framework applies `COLLATE NOCASE` on text columns during table creation.

---

## Dependencies

Add to `packages/core/package.json`:

```json
{
  "optionalDependencies": {
    "better-sqlite3": "^11.0.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0"
  }
}
```

The `better-sqlite3` package is optional. If not installed and the user configures SQLite, the framework throws a clear error at boot:

```
MissingDependency: SQLite support requires "better-sqlite3".
Run: pnpm add better-sqlite3
```

---

## Testing strategy

### Unit tests

The existing unit tests in `packages/core/src/**/*.test.ts` do not touch a real database. They continue to pass without changes.

### Integration tests

Integration tests require PostgreSQL and test the PostgreSQL code path. They remain unchanged.

A new integration test suite for SQLite runs the same CRUD and schema-sync scenarios against an in-memory SQLite database (`:memory:`). This verifies the parallel modules without needing PostgreSQL.

```
tests/integration/sqlite/
  crud.test.ts           — Basic CRUD operations
  schema-sync.test.ts    — Table creation, column addition, type changes
  filters.test.ts        — Filter operators including search
  includes.test.ts       — Relation loading
  sequences.test.ts      — Sequence field generation
  audit.test.ts          — Audit log recording
  disabled-features.test.ts — Verify jobs/scheduler throw correct errors
```

These tests use `:memory:` databases so they run fast and need no external services.

### Contract tests

The existing `ModelAccess` contract tests in `packages/shared/` run against the in-memory reference implementation. They are unaffected.

---

## Migration path for app developers

No migration needed. Existing apps with PostgreSQL config continue to work identically.

New apps or Studio usage without config automatically use SQLite. When an app is ready for production:

1. Install PostgreSQL
2. Add database config to `rangka.config.ts`
3. Run the app. Schema auto-sync creates all tables in PostgreSQL.
4. No code changes required. The same models, hooks, and services work on both.

---

## Open questions

None. The scope is intentionally narrow: parallel SQLite modules with feature gating. No abstraction layers. No changes to the PostgreSQL path.
