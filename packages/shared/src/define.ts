import type { ModelConfig } from './types/schema.js';
import type { ModuleConfig } from './types/app.js';
import type { HooksConfig } from './types/hooks.js';
import type { ExtensionConfig } from './types/extension.js';
import type { ServiceConfig } from './types/service.js';
import type { ApiConfig } from './types/api.js';
import type { PageDefinition } from './types/page.js';
import type { JobConfig } from './types/job.js';
import type { FixtureConfig } from './types/fixture.js';
import type { RolesConfig } from './types/permissions.js';
import type { WidgetDefinitionMeta } from './types/widget.js';

export interface LayoutConfig {
  form?: {
    sections: Array<{ label: string; fields: string[]; columns?: number }>;
  };
  list?: {
    columns: string[];
  };
}

/**
 * Declares a model — the data structure definition that drives database tables,
 * API endpoints, UI forms, and permissions.
 *
 * @example
 * ```ts
 * export default defineModel({
 *   name: 'invoice',
 *   label: 'Sales Invoice',
 *   naming: 'invoice_number',
 *   traits: ['timestamped'],
 *   fields: {
 *     invoice_number: field.sequence({ prefix: 'INV-', digits: 5 }),
 *     customer: field.link('sales.customer', { required: true }),
 *   },
 * });
 * ```
 */
export function defineModel<T extends ModelConfig>(config: T): T {
  return config;
}

/**
 * Declares a module — top-level organizational unit that groups models, pages,
 * services, and navigation under a namespace.
 *
 * @example
 * ```ts
 * export default defineModule({
 *   name: 'sales',
 *   label: 'Sales',
 *   icon: 'shopping-cart',
 *   navigation: [
 *     { section: 'Orders', items: [{ page: 'sales.orders', label: 'Orders' }] },
 *   ],
 * });
 * ```
 */
export function defineModule<T extends ModuleConfig>(config: T): T {
  return config;
}

/**
 * Declares lifecycle hooks for a model. Hooks run during create, update, and
 * delete operations for validation and side effects.
 *
 * @param model - Qualified model name (e.g., `'sales.invoice'`)
 * @param config - Hook handlers (validate, beforeSave, afterSave, etc.)
 *
 * @example
 * ```ts
 * export default defineHooks('sales.invoice', {
 *   validate(doc) {
 *     if (!doc.customer) throw new Error('Customer is required');
 *   },
 *   async afterSave(doc, ctx) {
 *     await ctx.enqueue('sales.sendConfirmation', { id: doc.id });
 *   },
 * });
 * ```
 */
export function defineHooks<T extends HooksConfig>(
  model: string,
  config: T,
): { model: string } & T {
  return { model, ...config };
}

/**
 * Declares an extension that adds fields and hooks to a model defined in
 * another module.
 *
 * @param target - Qualified model name to extend (e.g., `'sales.invoice'`)
 * @param config - Fields, hooks, actions, or layout to add
 *
 * @example
 * ```ts
 * export default defineExtension('sales.invoice', {
 *   fields: {
 *     tax_category: field.link('tax.category'),
 *   },
 * });
 * ```
 */
export function defineExtension<T extends ExtensionConfig>(
  target: string,
  config: T,
): { target: string } & T {
  return { target, ...config };
}

/**
 * Declares a service — a named collection of methods available via dependency
 * injection throughout the framework. Services are the home for business logic.
 *
 * @example
 * ```ts
 * export default defineService({
 *   name: 'sales.pricing',
 *   deps: ['inventory.stock'],
 *   factory(ctx) {
 *     return {
 *       async calculateTotal(orderId: string) {
 *         const order = await ctx.models.query('sales.order', { id: orderId });
 *         return order.items.reduce((sum, i) => sum + i.amount, 0);
 *       },
 *     };
 *   },
 * });
 * ```
 */
export function defineService<T extends ServiceConfig>(config: T): T {
  return config;
}

/**
 * Declares a custom API endpoint beyond the auto-generated CRUD routes.
 *
 * @example
 * ```ts
 * export default defineApi({
 *   path: '/api/sales/invoice/:id/submit',
 *   method: 'POST',
 *   handler: async (req, ctx) => {
 *     await ctx.service('sales.invoicing').submit(req.params.id);
 *     return { status: 'submitted' };
 *   },
 * });
 * ```
 */
export function defineApi<T extends ApiConfig>(config: T): T {
  return config;
}

/**
 * Declares a page — a routable screen whose content is a widget tree.
 *
 * @example
 * ```ts
 * export default definePage({
 *   key: 'sales.orders',
 *   label: 'Orders',
 *   type: 'collection',
 *   body: [
 *     { type: 'table', bind: { model: { name: 'sales.order' } }, children: [
 *       { type: 'column', props: { label: 'Number' }, bind: { field: 'order_number' } },
 *     ]},
 *   ],
 * });
 * ```
 */
export function definePage<T extends PageDefinition>(config: T): T {
  return config;
}

/**
 * Declares a background job with optional scheduling, retry, and concurrency control.
 *
 * @param name - Unique job identifier (e.g., `'sales.sendReminders'`)
 * @param config - Job configuration (handler, schedule, retries, concurrency)
 *
 * @example
 * ```ts
 * export default defineJob('sales.sendReminders', {
 *   schedule: '0 9 * * *',
 *   retries: 3,
 *   backoff: 'exponential',
 *   handler: async (data, ctx) => {
 *     const overdue = await ctx.models.query('sales.invoice', { filter: { status: 'overdue' } });
 *     for (const inv of overdue) {
 *       await ctx.email.send({ to: inv.customer_email, template: 'reminder' });
 *     }
 *   },
 * });
 * ```
 */
export function defineJob<T extends JobConfig>(name: string, config: T): { name: string } & T {
  return { name, ...config };
}

/**
 * Declares seed data loaded into the database for initial setup, demos, or testing.
 *
 * @example
 * ```ts
 * export default defineFixture({
 *   model: 'core.role',
 *   key: 'name',
 *   records: [
 *     { name: 'Administrator', permissions: { '*': { read: true, write: true } } },
 *   ],
 * });
 * ```
 */
export function defineFixture<T extends FixtureConfig>(config: T): T {
  return config;
}

/**
 * Declares default roles and permissions for a module. Roles are resolved
 * in-memory at boot and enforce access control on API routes.
 *
 * @example
 * ```ts
 * export default defineRoles({
 *   'Sales Manager': {
 *     label: 'Sales Manager',
 *     models: {
 *       'sales.order': { read: true, write: true, create: true, delete: true },
 *       'sales.invoice': { read: true, write: 'own' },
 *     },
 *     pages: ['sales.orders', 'sales.invoices', 'sales.reports'],
 *   },
 * });
 * ```
 */
export function defineRoles<T extends RolesConfig>(config: T): T {
  return config;
}

/**
 * Declares form and list layout for a model without writing a full page definition.
 *
 * @example
 * ```ts
 * export default defineLayout({
 *   form: {
 *     sections: [
 *       { label: 'General', fields: ['customer', 'posting_date'], columns: 2 },
 *       { label: 'Items', fields: ['items'] },
 *     ],
 *   },
 *   list: { columns: ['name', 'customer', 'total', 'status'] },
 * });
 * ```
 */
export function defineLayout<T extends LayoutConfig>(config: T): T {
  return config;
}

/**
 * Framework configuration for database connection and server settings.
 */
export interface RangkaConfig {
  database: {
    dialect: 'pg';
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
  };
  server?: {
    port?: number;
    host?: string;
  };
}

/**
 * Declares the framework configuration including database and server settings.
 *
 * @example
 * ```ts
 * export default defineConfig({
 *   database: { dialect: 'pg', host: 'localhost', database: 'myapp' },
 *   server: { port: 3000 },
 * });
 * ```
 */
export function defineConfig(config: RangkaConfig): RangkaConfig {
  return config;
}

/**
 * Registers a widget's metadata (name, category, props schema, binding mode, triggers).
 * Used for custom widgets compiled via `rangka build`.
 *
 * @example
 * ```ts
 * export default defineWidget({
 *   name: 'kanban',
 *   label: 'Kanban Board',
 *   category: 'data',
 *   binding: 'model',
 *   triggers: ['cardClick', 'cardMove'],
 *   container: false,
 *   schema: {
 *     columns: { type: 'string', required: true },
 *   },
 * });
 * ```
 */
export function defineWidget<T extends WidgetDefinitionMeta>(config: T): T {
  return config;
}
