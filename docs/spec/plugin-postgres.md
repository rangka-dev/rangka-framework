# Spec: Internal PostgreSQL Adapter Plugin

Status: Draft
Packages affected: core (plugin implementation)

---

## Context

The framework uses PostgreSQL (via Kysely) for internal models. When app developers need to connect to external PostgreSQL databases (legacy systems, data warehouses, shared services), they currently have no built-in adapter.

Since Kysely is already a core dependency, a PostgreSQL adapter is the natural first external model adapter. It ships as an internal plugin, requiring no extra npm install. It serves as the reference adapter implementation with full capability support.

---

## Design Decisions

- The plugin lives in `packages/core/src/plugins/postgres/` alongside future internal plugins.
- One plugin instance = one database connection. Multiple databases = multiple plugin instances with different names.
- Uses Kysely internally for query building, filter translation, and parameterization.
- Supports ALL adapter capabilities (read, list, filter, sort, create, update, delete, aggregate, bulk, transaction).
- External model definitions use an explicit `table` field to specify the target table.
- The `DataAdapter` interface is extended with an `AdapterContext` parameter that carries model metadata (table name, fields, primary key). Existing adapters can ignore it.
- The adapter runs the same abstract contract test suite as internal models, proving behavioral equivalence.

---

## Plugin Definition

```typescript
// packages/core/src/plugins/postgres/index.ts
definePlugin({
  name: 'postgres',
  version: '1.0.0',

  config: {
    host: { type: 'string', required: true },
    port: { type: 'number', default: 5432 },
    database: { type: 'string', required: true },
    user: { type: 'string', required: true },
    password: { type: 'string', required: true },
    ssl: { type: 'boolean', default: false },
    pool: {
      type: 'object',
      default: { min: 2, max: 10 },
    },
  },

  provides: {
    adapters: [
      {
        name: 'postgres',
        capabilities: ['read', 'list', 'filter', 'sort', 'create', 'update', 'delete'],
      },
    ],
  },

  boot(ctx) {
    const pool = new pg.Pool({
      host: ctx.config.host,
      port: ctx.config.port,
      database: ctx.config.database,
      user: ctx.config.user,
      password: ctx.config.password,
      ssl: ctx.config.ssl,
      min: ctx.config.pool?.min ?? 2,
      max: ctx.config.pool?.max ?? 10,
    });
    const db = new Kysely({ dialect: new PostgresDialect({ pool }) });

    ctx.adapters.postgres.implement(createPostgresAdapter(db));

    ctx.on('beforeShutdown', async () => {
      await db.destroy();
    });
  },
});
```

---

## App Developer Usage

### Configuration

```typescript
// rangka.config.ts
defineConfig({
  plugins: {
    warehouse: {
      package: '@rangka/plugin-postgres',
      config: {
        host: process.env.WAREHOUSE_HOST,
        database: 'warehouse',
        user: process.env.WAREHOUSE_USER,
        password: process.env.WAREHOUSE_PASSWORD,
      },
    },
    legacy_erp: {
      package: '@rangka/plugin-postgres',
      config: {
        host: process.env.ERP_HOST,
        database: 'erp_prod',
        user: process.env.ERP_USER,
        password: process.env.ERP_PASSWORD,
      },
    },
  },
});
```

The adapter name is the plugin instance name (`warehouse`, `legacy_erp`). Each instance creates its own connection pool to its own database.

### External Model Definition

```typescript
// modules/legacy/models/customer.ts
defineExternalModel({
  name: 'Customer',
  source: 'warehouse',
  table: 'public.customers',

  fields: {
    id: field.string(),
    email: field.string(),
    company_name: field.string({ from: 'company' }),
    credit_limit: field.decimal({ from: 'credit_lmt' }),
    active: field.boolean(),
    created_at: field.datetime(),
  },
});
```

- `source` points to the adapter registered by the plugin instance name.
- `table` is the actual table name in the external database. Supports schema-qualified names (`public.customers`, `erp.invoices`).
- `from` on fields maps framework field names to actual column names. Omit if they match.

---

## DataAdapter Interface Extension

The `AdapterContext` parameter passes model metadata to each adapter method:

```typescript
interface AdapterContext {
  table: string;
  fields: Record<string, ExternalFieldConfig>;
  primaryKey?: string; // defaults to 'id'
}

interface DataAdapter {
  // Required
  get(model: string, id: string, context: AdapterContext): Promise<Record<string, unknown> | null>;

  // Optional — declared in capabilities
  list?(model: string, query: ListQuery, context: AdapterContext): Promise<ListResult>;
  filter?(model: string, filters: FilterExpression[], context: AdapterContext): Promise<ListResult>;
  create?(
    model: string,
    data: Record<string, unknown>,
    context: AdapterContext,
  ): Promise<Record<string, unknown>>;
  update?(
    model: string,
    id: string,
    data: Record<string, unknown>,
    context: AdapterContext,
  ): Promise<Record<string, unknown>>;
  delete?(model: string, id: string, context: AdapterContext): Promise<void>;
  batchGet?(
    model: string,
    ids: string[],
    context: AdapterContext,
  ): Promise<Record<string, unknown>[]>;

  // Extended — bulk and aggregate (from model API spec RAN-21)
  createMany?(
    model: string,
    data: Record<string, unknown>[],
    context: AdapterContext,
  ): Promise<Record<string, unknown>[]>;
  updateAll?(
    model: string,
    filters: FilterExpression[],
    data: Record<string, unknown>,
    context: AdapterContext,
  ): Promise<{ count: number }>;
  deleteAll?(
    model: string,
    filters: FilterExpression[],
    context: AdapterContext,
  ): Promise<{ count: number }>;
  aggregate?(
    model: string,
    query: AggregateQuery,
    context: AdapterContext,
  ): Promise<AggregateResult | GroupedAggregateResult>;
  transaction?(fn: (adapter: DataAdapter) => Promise<void>): Promise<void>;
}
```

Existing adapters that don't need `context` can ignore the parameter. The framework populates `AdapterContext` from the model definition when dispatching through `ExternalModelOps`.

---

## Adapter Implementation

```typescript
// packages/core/src/plugins/postgres/adapter.ts
function createPostgresAdapter(db: Kysely<any>): DataAdapter {
  return {
    async get(model, id, context) {
      const pk = context.primaryKey ?? 'id';
      return db.selectFrom(context.table).selectAll().where(pk, '=', id).executeTakeFirst() ?? null;
    },

    async list(model, query, context) {
      let qb = db.selectFrom(context.table).selectAll();

      if (query.sort) {
        qb = qb.orderBy(query.sort.field, query.sort.direction);
      }
      if (query.pageSize) {
        qb = qb.limit(query.pageSize);
        if (query.page) qb = qb.offset((query.page - 1) * query.pageSize);
      }

      const data = await qb.execute();
      const total = await db
        .selectFrom(context.table)
        .select(db.fn.countAll().as('count'))
        .executeTakeFirst();

      return { data, total: Number(total?.count ?? 0) };
    },

    async filter(model, filters, context) {
      let qb = db.selectFrom(context.table).selectAll();
      qb = applyFilters(qb, filters);
      const data = await qb.execute();
      return { data };
    },

    async create(model, data, context) {
      return db.insertInto(context.table).values(data).returningAll().executeTakeFirstOrThrow();
    },

    async update(model, id, data, context) {
      const pk = context.primaryKey ?? 'id';
      return db
        .updateTable(context.table)
        .set(data)
        .where(pk, '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();
    },

    async delete(model, id, context) {
      const pk = context.primaryKey ?? 'id';
      await db.deleteFrom(context.table).where(pk, '=', id).execute();
    },

    async batchGet(model, ids, context) {
      const pk = context.primaryKey ?? 'id';
      return db.selectFrom(context.table).selectAll().where(pk, 'in', ids).execute();
    },

    async createMany(model, data, context) {
      return db.insertInto(context.table).values(data).returningAll().execute();
    },

    async updateAll(model, filters, data, context) {
      let qb = db.updateTable(context.table).set(data);
      qb = applyFilters(qb, filters);
      const result = await qb.execute();
      return { count: Number(result[0]?.numUpdatedRows ?? 0) };
    },

    async deleteAll(model, filters, context) {
      let qb = db.deleteFrom(context.table);
      qb = applyFilters(qb, filters);
      const result = await qb.execute();
      return { count: Number(result[0]?.numDeletedRows ?? 0) };
    },

    async aggregate(model, query, context) {
      // Translates AggregateSpec to SELECT with SUM/AVG/MIN/MAX/COUNT + GROUP BY
      return executeAggregate(db, context.table, query);
    },

    async transaction(fn) {
      await db.transaction().execute(async (trx) => {
        const txAdapter = createPostgresAdapter(trx);
        await fn(txAdapter);
      });
    },
  };
}
```

---

## Filter Translation

The postgres adapter reuses the same filter-to-Kysely translation logic used by internal models. A shared `applyFilters()` utility handles:

| Filter operator             | SQL                        |
| --------------------------- | -------------------------- |
| `eq`                        | `= value`                  |
| `neq`                       | `!= value`                 |
| `gt` / `gte` / `lt` / `lte` | `>`, `>=`, `<`, `<=`       |
| `in` / `notIn`              | `IN (...)`, `NOT IN (...)` |
| `contains`                  | `ILIKE '%value%'`          |
| `startsWith`                | `ILIKE 'value%'`           |
| `endsWith`                  | `ILIKE '%value'`           |
| `is null`                   | `IS NULL`                  |
| `is 'not_null'`             | `IS NOT NULL`              |
| `between`                   | `BETWEEN a AND b`          |
| `$or`                       | `(group1) OR (group2)`     |

This utility is extracted from the existing `KyselyModelOps` filter logic and shared between internal models and the postgres adapter.

---

## Architecture

```
packages/core/src/plugins/postgres/
├── index.ts          — plugin definition (definePlugin, config, boot)
├── adapter.ts        — createPostgresAdapter() factory
├── filters.ts        — applyFilters() — FilterExpression to Kysely WHERE
├── aggregate.ts      — executeAggregate() — AggregateSpec to SQL
└── __tests__/
    └── adapter.test.ts — runs contract suite + adapter-specific tests
```

Shared filter translation is extracted to a common location:

```
packages/core/src/model-api/
├── filter-translator.ts  — shared applyFilters() used by both KyselyModelOps and postgres adapter
```

---

## Testing

### Contract suite

The postgres adapter runs the same abstract test suite from the model API spec:

```typescript
import { defineModelAccessContract } from '@rangka/shared/model-api';

defineModelAccessContract(() => ({
  models: createModelAccessWithPostgresAdapter(testDbConnection),
  seed: seedExternalTestTables,
  teardown: dropExternalTestTables,
}));
```

If it passes the contract suite, the adapter is behaviorally equivalent to internal models from the app developer's perspective.

### Adapter-specific tests

- Schema-qualified table names (`public.customers`, `erp.invoices`)
- Field mapping with `from` (column name differs from field name)
- Custom primary key (non-`id` primary keys)
- Connection pool lifecycle (creation, shutdown, reconnection)
- Multiple adapter instances (two different external databases in same app)
- Transaction isolation (changes not visible outside transaction until commit)
- Error handling (connection refused, table not found, column not found)

---

## ExternalModelConfig Extension

The `table` field is added to `ExternalModelConfig`:

```typescript
interface ExternalModelConfig {
  name: string;
  source: string;
  table: string; // NEW — required for postgres adapter
  module?: string;
  label?: string;
  primaryKey?: string; // NEW — defaults to 'id'
  fields: Record<string, ExternalFieldConfig>;
}
```

`table` is optional at the interface level (not all adapters need it — Stripe doesn't have tables). But the postgres adapter validates at boot that every model using it has a `table` defined.

`primaryKey` allows external tables that don't use `id` as their primary key column.

---

## Boot-Time Validation

The postgres adapter validates at boot:

- Connection is reachable (attempt connect, fail fast with clear error)
- Every external model using this adapter has a `table` field defined
- Table exists in the external database (optional check, can be disabled via config flag `validateTables: false` for performance)

---

## Dependency Impact

- No new dependencies. Kysely and pg are already in core.
- The plugin is internal to `@rangka/core`. App developers don't install anything extra.
- The `DataAdapter` interface in shared gains an optional `AdapterContext` parameter (non-breaking for existing adapters).

---

## Relationship to Other Work

| Issue                                 | Relationship                                                                |
| ------------------------------------- | --------------------------------------------------------------------------- |
| RAN-21 (Stable Model API)             | Prerequisite — defines the full interface the adapter must support          |
| RAN-9 (defineExternalModel in shared) | Prerequisite — `table` and `primaryKey` fields added to ExternalModelConfig |
| RAN-11 (External model runtime)       | Prerequisite — adapter dispatch, route generation must work first           |
| RAN-10 (Plugin loading from config)   | Prerequisite — plugins must be loadable from rangka.config.ts               |
| RAN-20 (Definition validation)        | Related — validates `table` is present for postgres-sourced models          |

---

## Implementation Order

1. Extract shared filter translation from `KyselyModelOps` to `filter-translator.ts`
2. Add `AdapterContext` parameter to `DataAdapter` interface
3. Add `table` and `primaryKey` fields to `ExternalModelConfig`
4. Implement `createPostgresAdapter()` factory
5. Implement plugin definition (config, boot, shutdown)
6. Add boot-time validation (connection check, table field required)
7. Extract aggregate translation to shared utility
8. Run contract test suite against adapter
9. Add adapter-specific integration tests
10. Document in `docs/reference/plugin-postgres.md`

---

## Verification

1. `pnpm build` passes
2. Contract test suite passes against postgres adapter
3. Adapter-specific tests pass (field mapping, schema-qualified tables, custom PK)
4. Multiple adapter instances connect to different databases simultaneously
5. Transactions commit and rollback correctly on external database
6. Connection pool shuts down cleanly on `beforeShutdown`
7. Boot fails with clear error when external DB is unreachable
8. Boot fails with clear error when model using postgres adapter lacks `table` field
