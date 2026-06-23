import { describe, it, expect } from 'vitest';
import { PermissionRegistry } from '../permission-registry.js';
import { createAuthHook } from '../session.js';
import { createMetaBootHandler } from '../../api/meta-handler.js';
import type { MetaBootContext } from '../../api/meta-handler.js';
import { SchemaRegistry } from '../../schema/registry.js';
import type { ResolvedModel } from '../../schema/types.js';
import type { ModuleConfig, PageDefinition } from '@rangka/shared';
import { hashPassword } from '../password.js';
import { createTestServer } from '../../__tests__/helpers.js';

const orderModel: ResolvedModel = {
  qualifiedName: 'sales.order',
  app: 'sales',
  module: 'sales',
  name: 'order',
  label: 'Sales Order',
  auditLog: false,
  traits: [],
  fields: [
    {
      name: 'id',
      config: { type: 'string', required: true } as any,
      provenance: { source: 'base' },
    },
    {
      name: 'customer',
      config: { type: 'link', model: 'sales.customer', label: 'Customer' } as any,
      provenance: { source: 'base' },
    },
    {
      name: 'total',
      config: { type: 'decimal', label: 'Total' } as any,
      provenance: { source: 'base' },
    },
    {
      name: 'status',
      config: { type: 'enum', options: ['draft', 'confirmed'], label: 'Status' } as any,
      provenance: { source: 'base' },
    },
  ],
  indexes: [],
};

const payslipModel: ResolvedModel = {
  qualifiedName: 'hr.payslip',
  app: 'hr',
  module: 'hr',
  name: 'payslip',
  label: 'Payslip',
  auditLog: false,
  traits: [],
  fields: [
    {
      name: 'id',
      config: { type: 'string', required: true } as any,
      provenance: { source: 'base' },
    },
    { name: 'amount', config: { type: 'decimal' } as any, provenance: { source: 'base' } },
  ],
  indexes: [],
};

const contactModel: ResolvedModel = {
  qualifiedName: 'contacts.contact',
  app: 'contacts',
  module: 'contacts',
  name: 'contact',
  label: 'Contact',
  auditLog: false,
  traits: [],
  fields: [
    {
      name: 'id',
      config: { type: 'string', required: true } as any,
      provenance: { source: 'base' },
    },
    {
      name: 'name',
      config: { type: 'string', label: 'Name' } as any,
      provenance: { source: 'base' },
    },
  ],
  indexes: [],
};

const pages: Array<{ module: string; page: PageDefinition }> = [
  {
    module: 'sales',
    page: {
      key: 'sales.orders',
      label: 'Orders',
      path: '/sales/orders',
      widgets: [
        { type: 'data', source: { model: 'sales.order' }, children: [] },
        { type: 'data', source: { model: 'contacts.contact' }, children: [] },
      ],
    },
  },
  {
    module: 'hr',
    page: {
      key: 'hr.payroll',
      label: 'Payroll',
      path: '/hr/payroll',
      widgets: [{ type: 'data', source: { model: 'hr.payslip' }, children: [] }],
    },
  },
  {
    module: 'admin',
    page: {
      key: 'admin.dashboard',
      label: 'Admin Dashboard',
      path: '/admin/dashboard',
      widgets: [{ type: 'text', props: { content: 'Dashboard' } }],
    },
  },
];

const modules: ModuleConfig[] = [
  {
    name: 'sales',
    label: 'Sales',
    icon: 'shopping-cart',
    order: 1,
    navigation: [
      {
        section: 'Orders',
        items: [{ page: 'sales.orders', label: 'Orders', icon: 'list' }],
      },
    ],
  },
  {
    name: 'hr',
    label: 'Human Resources',
    icon: 'users',
    order: 2,
    navigation: [
      {
        section: 'Payroll',
        items: [{ page: 'hr.payroll', label: 'Payroll', icon: 'dollar' }],
      },
    ],
  },
  {
    name: 'admin',
    label: 'Administration',
    icon: 'settings',
    order: 3,
    navigation: [
      {
        section: 'System',
        items: [{ page: 'admin.dashboard', label: 'Dashboard', icon: 'dashboard' }],
      },
    ],
  },
];

function createMockDb(opts?: { noSession?: boolean; expiredSession?: boolean }) {
  const users = [
    {
      id: 'u1',
      email: 'sales@test.com',
      full_name: 'Sales User',
      enabled: true,
      password_hash: hashPassword('pass'),
    },
  ];
  const roles = [{ id: 'r1', name: 'SalesRep' }];
  const userRoles = [{ user_id: 'u1', role_id: 'r1' }];
  const sessions = opts?.noSession
    ? []
    : [
        {
          id: 's1',
          token: 'test-token',
          user_id: 'u1',
          expires_at: opts?.expiredSession
            ? new Date(Date.now() - 60000).toISOString()
            : new Date(Date.now() + 60000).toISOString(),
        },
      ];

  return {
    selectFrom(table: string) {
      const store =
        table === 'core.user'
          ? users
          : table === 'core.role'
            ? roles
            : table === 'core.user_role'
              ? userRoles
              : table === 'core.session'
                ? sessions
                : [];

      return {
        selectAll() {
          return this;
        },
        where(field: string, op: string, value: any) {
          const filtered = (store as any[]).filter((r) => {
            if (op === '=') return r[field] === value;
            if (op === 'in') return value.includes(r[field]);
            return false;
          });
          return {
            executeTakeFirst: async () => filtered[0],
            execute: async () => filtered,
            where(f2: string, o2: string, v2: any) {
              const f = filtered.filter((r: any) => {
                if (o2 === '=') return r[f2] === v2;
                if (o2 === 'in') return v2.includes(r[f2]);
                return false;
              });
              return { executeTakeFirst: async () => f[0], execute: async () => f };
            },
          };
        },
        executeTakeFirst: async () => undefined,
        execute: async () => [],
      };
    },
  } as any;
}

function buildServer(
  permissionRegistry: PermissionRegistry,
  db: any,
  schemaRegistry: SchemaRegistry,
) {
  const server = createTestServer();
  const metaCtx: MetaBootContext = {
    schemaRegistry,
    pages,
    modules,
  };

  server.get('/api/meta/boot', {
    onRequest: createAuthHook(db, permissionRegistry),
    handler: createMetaBootHandler(metaCtx),
  });

  return server;
}

describe('GET /api/meta/boot', () => {
  it('returns correct boot response for authenticated user with filtered pages/nav/models', async () => {
    const permissionRegistry = new PermissionRegistry();
    permissionRegistry.registerRoles(
      {
        SalesRep: {
          label: 'Sales Rep',
          models: { 'sales.order': { read: true, create: true } },
          pages: ['admin.dashboard'],
        },
      },
      'sales',
    );

    const schemaRegistry = new SchemaRegistry([orderModel, payslipModel, contactModel]);
    const db = createMockDb();
    const server = buildServer(permissionRegistry, db, schemaRegistry);

    const res = await server.inject({
      method: 'GET',
      url: '/api/meta/boot',
      headers: { authorization: 'Bearer test-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    // User
    expect(body.user).toEqual({
      id: 'u1',
      name: 'Sales User',
      email: 'sales@test.com',
      roles: ['SalesRep'],
    });

    // Permissions
    expect(body.permissions.models['sales.order']).toEqual({ read: true, create: true });
    expect(body.permissions.pages).toContain('admin.dashboard');

    // Pages: sales.orders (model access), admin.dashboard (explicit pages), NOT hr.payroll
    const pageKeys = body.pages.map((p: any) => p.key);
    expect(pageKeys).toContain('sales.orders');
    expect(pageKeys).toContain('admin.dashboard');
    expect(pageKeys).not.toContain('hr.payroll');

    // Navigation: sales and admin modules, NOT hr
    const navModules = body.navigation.map((n: any) => n.module);
    expect(navModules).toContain('sales');
    expect(navModules).toContain('admin');
    expect(navModules).not.toContain('hr');

    // Models: sales.order and contacts.contact (from overlay), NOT hr.payslip
    expect(body.models['sales.order']).toBeDefined();
    expect(body.models['contacts.contact']).toBeDefined();
    expect(body.models['hr.payslip']).toBeUndefined();

    // Model metadata shape
    expect(body.models['sales.order'].qualifiedName).toBe('sales.order');
    expect(body.models['sales.order'].fields.length).toBe(4);
    const statusField = body.models['sales.order'].fields.find((f: any) => f.name === 'status');
    expect(statusField.type).toBe('enum');
    expect(statusField.options).toEqual(['draft', 'confirmed']);
    const customerField = body.models['sales.order'].fields.find((f: any) => f.name === 'customer');
    expect(customerField.relationship).toEqual({ type: 'link', model: 'sales.customer' });
  });

  it('returns 401 for unauthenticated request', async () => {
    const permissionRegistry = new PermissionRegistry();
    permissionRegistry.registerRoles({ SalesRep: { label: 'Sales Rep', models: {} } }, 'sales');

    const schemaRegistry = new SchemaRegistry([orderModel]);
    const db = createMockDb();
    const server = buildServer(permissionRegistry, db, schemaRegistry);

    const res = await server.inject({
      method: 'GET',
      url: '/api/meta/boot',
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHORIZED');
  });

  it('user with limited permissions only sees accessible pages and referenced models', async () => {
    const permissionRegistry = new PermissionRegistry();
    permissionRegistry.registerRoles(
      {
        SalesRep: {
          label: 'Sales Rep',
          models: { 'hr.payslip': { read: true } },
        },
      },
      'app',
    );

    const schemaRegistry = new SchemaRegistry([orderModel, payslipModel, contactModel]);
    const db = createMockDb();
    const server = buildServer(permissionRegistry, db, schemaRegistry);

    const res = await server.inject({
      method: 'GET',
      url: '/api/meta/boot',
      headers: { authorization: 'Bearer test-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    const pageKeys = body.pages.map((p: any) => p.key);
    expect(pageKeys).toContain('hr.payroll');
    expect(pageKeys).toContain('admin.dashboard');
    expect(pageKeys).not.toContain('sales.orders');

    expect(body.models['hr.payslip']).toBeDefined();
    expect(body.models['sales.order']).toBeUndefined();
  });

  it('non-model page accessible via explicit pages permission', async () => {
    const permissionRegistry = new PermissionRegistry();
    permissionRegistry.registerRoles(
      {
        SalesRep: {
          label: 'Sales Rep',
          models: {},
          pages: ['admin.dashboard'],
        },
      },
      'app',
    );

    const schemaRegistry = new SchemaRegistry([orderModel, payslipModel, contactModel]);
    const db = createMockDb();
    const server = buildServer(permissionRegistry, db, schemaRegistry);

    const res = await server.inject({
      method: 'GET',
      url: '/api/meta/boot',
      headers: { authorization: 'Bearer test-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    const pageKeys = body.pages.map((p: any) => p.key);
    expect(pageKeys).toContain('admin.dashboard');
    expect(pageKeys).not.toContain('sales.orders');
    expect(pageKeys).not.toContain('hr.payroll');

    // No models referenced since admin.dashboard has no model sources
    expect(Object.keys(body.models)).toHaveLength(0);
  });

  it('empty modules/sections are omitted from navigation', async () => {
    const permissionRegistry = new PermissionRegistry();
    permissionRegistry.registerRoles(
      {
        SalesRep: {
          label: 'Sales Rep',
          models: { 'sales.order': { read: true } },
        },
      },
      'app',
    );

    const schemaRegistry = new SchemaRegistry([orderModel, payslipModel, contactModel]);
    const db = createMockDb();
    const server = buildServer(permissionRegistry, db, schemaRegistry);

    const res = await server.inject({
      method: 'GET',
      url: '/api/meta/boot',
      headers: { authorization: 'Bearer test-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    const navModules = body.navigation.map((n: any) => n.module);
    expect(navModules).toContain('sales');
    expect(navModules).toContain('admin');
    expect(navModules).not.toContain('hr');

    // Navigation is sorted by order
    expect(body.navigation[0].module).toBe('sales');
  });

  it('includes widget and view metadata in boot response', async () => {
    const permissionRegistry = new PermissionRegistry();
    permissionRegistry.registerRoles(
      {
        SalesRep: {
          label: 'Sales Rep',
          models: { 'sales.order': { read: true } },
        },
      },
      'sales',
    );

    const schemaRegistry = new SchemaRegistry([orderModel]);
    const db = createMockDb();
    const server = createTestServer();

    const widgetDefs: import('@rangka/shared').WidgetDefinitionMeta[] = [
      {
        name: 'button',
        label: 'Button',
        category: 'action',
        schema: { label: { type: 'string', required: true } },
        binding: 'none',
        triggers: ['click'],
        container: false,
      },
      {
        name: 'input',
        label: 'Input',
        category: 'input',
        schema: {},
        binding: 'field',
        triggers: ['change'],
        container: false,
      },
    ];

    const metaCtx: MetaBootContext = {
      schemaRegistry,
      pages,
      modules,
      widgets: widgetDefs,
    };

    server.get('/api/meta/boot', {
      onRequest: createAuthHook(db, permissionRegistry),
      handler: createMetaBootHandler(metaCtx),
    });

    const res = await server.inject({
      method: 'GET',
      url: '/api/meta/boot',
      headers: { authorization: 'Bearer test-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.widgets).toHaveLength(2);
    expect(body.widgets[0].name).toBe('button');
    expect(body.widgets[1].name).toBe('input');
  });

  it('returns empty arrays when no widgets are registered', async () => {
    const permissionRegistry = new PermissionRegistry();
    permissionRegistry.registerRoles(
      {
        SalesRep: {
          label: 'Sales Rep',
          models: { 'sales.order': { read: true } },
        },
      },
      'sales',
    );

    const schemaRegistry = new SchemaRegistry([orderModel]);
    const db = createMockDb();
    const server = createTestServer();

    const metaCtx: MetaBootContext = {
      schemaRegistry,
      pages,
      modules,
      widgets: [],
    };

    server.get('/api/meta/boot', {
      onRequest: createAuthHook(db, permissionRegistry),
      handler: createMetaBootHandler(metaCtx),
    });

    const res = await server.inject({
      method: 'GET',
      url: '/api/meta/boot',
      headers: { authorization: 'Bearer test-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.widgets).toEqual([]);
  });
});
