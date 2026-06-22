# Spec: Definition Validation Layer

Status: Draft
Packages affected: shared (schemas + validators), core (boot enforcement)

---

## Context

Definitions (`defineModel`, `definePage`, `defineModule`, etc.) are currently identity functions that provide TypeScript type inference but no runtime validation. Invalid definitions pass through silently and cause confusing failures later in boot or at runtime.

The goal is to validate all definitions at boot time with clear error messages, and provide unit-testable schemas that guarantee the public API contract never breaks.

---

## Design Decisions

- Zod is the validation library. It lives as a runtime dependency of `@rangka/shared`.
- Pure-JSON definitions (model, module, page, fixture, roles, layout, api, extension) use Zod as source of truth with `z.infer` for types.
- Function-based definitions (hooks, services, jobs) keep authored TypeScript types. Zod validates structure only (correct keys, values are functions).
- Widget nodes use a discriminated union on `type` for built-in widgets (strict prop validation) with a generic fallback for custom widgets.
- `@rangka/core` calls validators at boot. Validation failure stops boot with actionable errors.
- `@rangka/shared` remains the single authority on "what a valid definition looks like".

---

## Architecture

```
shared/src/validation/
├── schemas/
│   ├── module.ts        — moduleSchema + validateModule
│   ├── model.ts         — modelSchema + validateModel
│   ├── page.ts          — pageSchema + validatePage
│   ├── field.ts         — fieldSchema (discriminated union per field type)
│   ├── widget.ts        — widgetNodeSchema (discriminated union per widget type)
│   ├── action.ts        — widgetActionSchema (discriminated union per action type)
│   ├── hooks.ts         — hooksSchema (structural: valid keys + functions)
│   ├── service.ts       — serviceSchema (structural: name + factory function)
│   ├── job.ts           — jobSchema (structural: config + handler function)
│   ├── fixture.ts       — fixtureSchema
│   ├── roles.ts         — rolesSchema
│   ├── api.ts           — apiSchema
│   ├── extension.ts     — extensionSchema
│   └── layout.ts        — layoutSchema
├── helpers.ts           — shared refinements, formatErrors utility
└── index.ts             — re-exports all validate functions
```

---

## Schema Design

### Pure-JSON definitions (Zod as source of truth)

```typescript
// shared/src/validation/schemas/module.ts
import { z } from 'zod';

const navigationItemSchema = z.object({
  page: z.string(),
  label: z.string(),
  icon: z.string().optional(),
});

const navigationSectionSchema = z.object({
  section: z.string(),
  items: z.array(navigationItemSchema),
});

const scopeDefinitionSchema = z.object({
  model: z.string(),
  default: z.string(),
  switchable: z.boolean().optional(),
});

export const moduleSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  order: z.number().optional(),
  type: z.enum(['internal', 'external']).optional(),
  depends: z.array(z.string()).optional(),
  scopes: z.record(scopeDefinitionSchema).optional(),
  navigation: z.array(navigationSectionSchema).optional(),
});

export type ModuleConfig = z.infer<typeof moduleSchema>;

export function validateModule(raw: unknown) {
  return moduleSchema.safeParse(raw);
}
```

### Field schema (discriminated union)

```typescript
// shared/src/validation/schemas/field.ts
const baseFieldSchema = z.object({
  required: z.boolean().optional(),
  label: z.string().optional(),
  hidden: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  searchable: z.boolean().optional(),
  default: z.unknown().optional(),
  validation: validationConfigSchema.optional(),
});

const stringFieldSchema = baseFieldSchema.extend({
  type: z.literal('string'),
  maxLength: z.number().optional(),
});

const linkFieldSchema = baseFieldSchema.extend({
  type: z.literal('link'),
  model: z.string(),
  nullable: z.boolean().optional(),
});

// ... one per field type

export const fieldSchema = z.discriminatedUnion('type', [
  stringFieldSchema,
  textFieldSchema,
  intFieldSchema,
  decimalFieldSchema,
  booleanFieldSchema,
  dateFieldSchema,
  datetimeFieldSchema,
  enumFieldSchema,
  jsonFieldSchema,
  linkFieldSchema,
  hasManyFieldSchema,
  childrenFieldSchema,
  manyToManyFieldSchema,
  dynamicLinkFieldSchema,
  moneyFieldSchema,
  codeFieldSchema,
  treeFieldSchema,
  sequenceFieldSchema,
  attachmentFieldSchema,
  attachmentsFieldSchema,
  computedFieldSchema,
]);

export type FieldConfig = z.infer<typeof fieldSchema>;
```

### Model schema (with cross-field validation)

```typescript
// shared/src/validation/schemas/model.ts
export const modelSchema = z
  .object({
    name: z.string().min(1),
    label: z.string().optional(),
    naming: z.string().optional(),
    scope: z.union([z.string(), z.object({ name: z.string(), field: z.string() })]).optional(),
    auditLog: z.boolean().optional(),
    fields: z.record(fieldSchema),
    indexes: z
      .array(
        z.object({
          fields: z.array(z.string()),
          unique: z.boolean().optional(),
        }),
      )
      .optional(),
    traits: z.array(z.enum(['ledger', 'timestamped', 'soft_delete'])).optional(),
  })
  .superRefine((data, ctx) => {
    // Cross-field: index fields must reference defined fields
    if (data.indexes) {
      const fieldNames = Object.keys(data.fields);
      for (const [i, index] of data.indexes.entries()) {
        for (const field of index.fields) {
          if (!fieldNames.includes(field)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['indexes', i, 'fields'],
              message: `"${field}" is not a defined field`,
            });
          }
        }
      }
    }
  });

export type ModelConfig = z.infer<typeof modelSchema>;
```

### Widget schema (discriminated union + custom fallback)

```typescript
// shared/src/validation/schemas/widget.ts
const baseWidgetSchema = z.object({
  id: z.string().optional(),
  bind: widgetBindingSchema.optional(),
  source: widgetSourceSchema.optional(),
  visible: z.union([conditionSchema, z.array(conditionSchema)]).optional(),
  on: z.record(z.union([widgetActionSchema, z.array(widgetActionSchema)])).optional(),
  children: z.lazy(() => z.array(widgetNodeSchema)).optional(),
});

// Built-in widgets with strict props
const inputWidgetSchema = baseWidgetSchema.extend({
  type: z.literal('input'),
  props: z
    .object({
      placeholder: z.string().optional(),
      inputType: z.enum(['text', 'number', 'email', 'password']).optional(),
      disabled: z.boolean().optional(),
    })
    .optional(),
});

const tableWidgetSchema = baseWidgetSchema.extend({
  type: z.literal('table'),
  props: z
    .object({
      columns: z.array(columnSchema),
      selectable: z.boolean().optional(),
      paginated: z.boolean().optional(),
    })
    .optional(),
  // table only accepts column children
  children: z.lazy(() => z.array(columnWidgetSchema)).optional(),
});

// Custom widget fallback (loose validation)
const customWidgetSchema = baseWidgetSchema.extend({
  type: z.string(),
  props: z.record(z.unknown()).optional(),
});

// Combined schema
export const widgetNodeSchema: z.ZodType<WidgetNode> = z.union([
  z.discriminatedUnion('type', [
    inputWidgetSchema,
    tableWidgetSchema,
    rowWidgetSchema,
    columnWidgetSchema,
    // ... all built-in widget schemas
  ]),
  customWidgetSchema,
]);
```

### Function-based definitions (structural validation only)

```typescript
// shared/src/validation/schemas/hooks.ts
const VALID_HOOKS = [
  'validate',
  'beforeSave',
  'afterSave',
  'beforeCreate',
  'afterCreate',
  'beforeUpdate',
  'afterUpdate',
  'beforeDelete',
  'afterDelete',
] as const;

export const hooksSchema = z
  .object({
    model: z.string().min(1),
  })
  .catchall(z.function())
  .superRefine((data, ctx) => {
    const extra = Object.keys(data).filter((k) => k !== 'model' && !VALID_HOOKS.includes(k as any));
    for (const key of extra) {
      ctx.addIssue({
        code: z.ZodIssueCode.unrecognized_keys,
        keys: [key],
        message: `unknown hook "${key}", expected one of: ${VALID_HOOKS.join(', ')}`,
      });
    }
  });
```

```typescript
// shared/src/validation/schemas/service.ts
export const serviceSchema = z.object({
  name: z.string().min(1),
  deps: z.array(z.string()).optional(),
  factory: z.function(),
});
```

```typescript
// shared/src/validation/schemas/job.ts
export const jobSchema = z.object({
  name: z.string().min(1),
  concurrency: z.number().positive().optional(),
  retries: z.number().nonnegative().optional(),
  backoff: z.enum(['exponential', 'linear', 'fixed']).optional(),
  schedule: z.string().optional(),
  handler: z.function(),
});
```

---

## Boot Enforcement (core)

During the resolve step, core validates every loaded definition before registering it:

```typescript
// core/src/boot/resolve.ts
import { validateModel, validateModule, validatePage, ... } from '@rangka/shared/validation';

function resolveDefinitions(loaded: LoadedDefinitions): ResolvedDefinitions {
  const errors: BootValidationError[] = [];

  for (const mod of loaded.modules) {
    const result = validateModule(mod.config);
    if (!result.success) {
      errors.push({ file: mod.file, errors: result.error.issues });
    }
  }

  for (const model of loaded.models) {
    const result = validateModel(model.config);
    if (!result.success) {
      errors.push({ file: model.file, errors: result.error.issues });
    }
  }

  // ... same for pages, hooks, services, jobs, etc.

  if (errors.length > 0) {
    throw new BootValidationError(errors);
  }
}
```

Error output format:

```
Boot failed: 3 invalid definitions

  modules/sales/module.ts
    → name: required string

  modules/sales/models/invoice.ts
    → fields.amount.type: invalid enum value, expected one of: string, int, decimal, ...
    → indexes[0].fields: "totall" is not a defined field

  modules/sales/pages/invoice-list.ts
    → body[2].props.columns: required
```

---

## Type Migration

Since Zod becomes the source of truth for pure-JSON types, the current authored types in `types/*.ts` get replaced by `z.infer` exports:

```typescript
// shared/src/types/schema.ts (after migration)
export { type ModelConfig } from '../validation/schemas/model.js';
```

Or alternatively, the validation schemas export the types directly and `types/*.ts` re-exports them for backwards compatibility. Either way, existing import paths (`@rangka/shared`) continue to work.

Function-based types (`HooksConfig`, `ServiceConfig`, `JobConfig`) stay as authored TypeScript interfaces since their function signatures cannot be inferred from Zod.

---

## Unit Tests

Each schema gets a test file that validates the public API contract:

```typescript
// shared/src/validation/__tests__/model.test.ts
describe('validateModel', () => {
  it('accepts minimal valid model', () => {
    const result = validateModel({
      name: 'invoice',
      fields: { total: { type: 'decimal' } },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = validateModel({ fields: {} });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(['name']);
  });

  it('rejects invalid field type', () => {
    const result = validateModel({
      name: 'invoice',
      fields: { total: { type: 'invalid' } },
    });
    expect(result.success).toBe(false);
  });

  it('rejects index referencing non-existent field', () => {
    const result = validateModel({
      name: 'invoice',
      fields: { total: { type: 'decimal' } },
      indexes: [{ fields: ['totall'] }],
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain('not a defined field');
  });

  it('accepts all field types', () => {
    // One field per type — ensures no field type is accidentally broken
  });

  it('accepts all traits', () => {
    const result = validateModel({
      name: 'post',
      fields: { title: { type: 'string' } },
      traits: ['timestamped', 'soft_delete'],
    });
    expect(result.success).toBe(true);
  });
});
```

Same pattern for module, page, widget tree, actions, hooks, services, jobs. These tests serve as the contract guarantee. If a future change breaks validation for a previously valid definition, the test catches it.

---

## Custom Widget Typo Detection

Built-in types are known at compile time. When a widget type falls through to the custom fallback, a warning layer checks for likely typos:

```typescript
// shared/src/validation/helpers.ts
export function detectWidgetTypos(tree: WidgetNode[], builtInTypes: string[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  function walk(nodes: WidgetNode[], path: string) {
    for (const [i, node] of nodes.entries()) {
      if (!builtInTypes.includes(node.type)) {
        const closest = findClosest(node.type, builtInTypes);
        if (closest && levenshtein(node.type, closest) <= 2) {
          warnings.push({
            path: `${path}[${i}].type`,
            message: `unknown widget "${node.type}", did you mean "${closest}"?`,
          });
        }
      }
      if (node.children) walk(node.children, `${path}[${i}].children`);
    }
  }

  walk(tree, 'body');
  return warnings;
}
```

Warnings don't fail boot. They are logged to console during development.

---

## Reserved Names and Namespace Enforcement

### Reserved module names

The module schema rejects names that are reserved for framework use:

```typescript
const RESERVED_MODULE_NAMES = ['core'] as const;

export const moduleSchema = z.object({
  name: z
    .string()
    .min(1)
    .refine(
      (name) => !RESERVED_MODULE_NAMES.includes(name as any),
      (name) => ({ message: `"${name}" is a reserved module name` }),
    ),
  // ...
});
```

The `core` module is owned by the framework (auth models: user, role, user_role, session). App developers cannot create a module with this name.

Future reserved names can be added to the list without breaking existing apps (since no valid app uses them).

### Reserved table prefixes

App module names are validated to ensure they cannot produce tables that collide with framework tables:

| Prefix    | Owner                   | Purpose                                                              |
| --------- | ----------------------- | -------------------------------------------------------------------- |
| `rangka_` | Framework system tables | Jobs queue, dead letters, scheduled jobs, naming sequence, audit log |
| `core__`  | Framework `core` module | User, role, user_role, session                                       |

Validation rules:

- Module name cannot be `core` (prevents `core__*` collisions)
- Module name cannot start with `rangka` (prevents `rangka_*` collisions via `rangka__*` table names)

### Namespace consistency fix

Rename `naming_sequence` table to `rangka_naming_sequence` to align with the `rangka_` prefix convention. All framework system tables must use this prefix.

Final state of framework-owned tables:

```
rangka_jobs
rangka_dead_letters
rangka_scheduled_jobs
rangka_naming_sequence
rangka_audit_log
core__user
core__role
core__user_role
core__session
```

---

## Dependency Impact

- `@rangka/shared` gains `zod` as a runtime dependency (~13kb minified).
- `shared` is no longer zero-dep. This is the primary tradeoff.
- Zod is tree-shakeable. Consumers that only import types pay zero runtime cost.
- All existing import paths remain stable. No breaking change for app developers.

---

## Implementation Order

1. Add `zod` to `@rangka/shared` dependencies
2. Create `shared/src/validation/` directory structure
3. Implement field schema (foundation for model + widget)
4. Implement model schema with cross-field validation
5. Implement module, page, action, widget schemas
6. Implement hooks, service, job schemas (structural)
7. Add typo detection helper
8. Migrate type exports (re-export `z.infer` types from existing paths)
9. Add `validate*` calls to core boot resolve step
10. Write unit tests for all schemas (contract tests)
11. Add error formatting utility for boot output

---

## Verification

1. `pnpm build` passes (shared + all downstream packages compile)
2. All existing tests pass (no type breakage from migration)
3. Unit tests cover valid and invalid cases for every definition type
4. Boot with a valid fixture app succeeds
5. Boot with an intentionally broken definition fails with clear path-based errors
6. Custom widgets in page definitions pass validation (fallback works)
7. Typo detection warns on `inptu` but not on `my-custom-chart`
