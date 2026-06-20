import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDb, resetDatabase } from '../helpers/db.js';
import { bootErpApp } from '../helpers/boot.js';
import { ApiClient } from '../helpers/api-client.js';
import type { BootResult } from '@rangka/core';
import { hashPassword } from '@rangka/core';

let bootResult: BootResult;
let adminApi: ApiClient;
let salesUserApi: ApiClient;
let hrUserApi: ApiClient;
let salesUser2Api: ApiClient;

let salesUserId: string;
let salesUser2Id: string;
let hrUserId: string;

describe('permissions: owner-based access control', () => {
  beforeAll(async () => {
    const db = createTestDb();
    await resetDatabase(db);
    await db.destroy();
    bootResult = await bootErpApp({ server: true });
    await bootResult.server!.listen({ port: 0 });

    adminApi = new ApiClient(bootResult);
    await adminApi.login();

    // Insert role records into DB (only Administrator is seeded by default)
    const salesUserRoleId = crypto.randomUUID();
    const salesManagerRoleId = crypto.randomUUID();
    const hrUserRoleId = crypto.randomUUID();

    await bootResult.db
      .insertInto('core.role')
      .values([
        { id: salesUserRoleId, name: 'Sales User', inherits: '[]', permissions: '{}' },
        { id: salesManagerRoleId, name: 'Sales Manager', inherits: '[]', permissions: '{}' },
        { id: hrUserRoleId, name: 'HR User', inherits: '[]', permissions: '{}' },
      ])
      .execute();

    // Create test users
    const user1 = await bootResult.db
      .insertInto('core.user')
      .values({
        id: crypto.randomUUID(),
        email: 'sales1@test.com',
        password_hash: hashPassword('pass123'),
        full_name: 'Sales User 1',
        enabled: true,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    salesUserId = (user1 as any).id;

    const user2 = await bootResult.db
      .insertInto('core.user')
      .values({
        id: crypto.randomUUID(),
        email: 'sales2@test.com',
        password_hash: hashPassword('pass123'),
        full_name: 'Sales User 2',
        enabled: true,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    salesUser2Id = (user2 as any).id;

    const user3 = await bootResult.db
      .insertInto('core.user')
      .values({
        id: crypto.randomUUID(),
        email: 'hr1@test.com',
        password_hash: hashPassword('pass123'),
        full_name: 'HR User 1',
        enabled: true,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    hrUserId = (user3 as any).id;

    // Assign roles
    await bootResult.db
      .insertInto('core.user_role')
      .values({ id: crypto.randomUUID(), user_id: salesUserId, role_id: salesUserRoleId })
      .execute();

    await bootResult.db
      .insertInto('core.user_role')
      .values({ id: crypto.randomUUID(), user_id: salesUser2Id, role_id: salesUserRoleId })
      .execute();

    await bootResult.db
      .insertInto('core.user_role')
      .values({ id: crypto.randomUUID(), user_id: hrUserId, role_id: hrUserRoleId })
      .execute();

    // Login as each user
    salesUserApi = new ApiClient(bootResult);
    await salesUserApi.login('sales1@test.com', 'pass123');

    salesUser2Api = new ApiClient(bootResult);
    await salesUser2Api.login('sales2@test.com', 'pass123');

    hrUserApi = new ApiClient(bootResult);
    await hrUserApi.login('hr1@test.com', 'pass123');
  });

  afterAll(async () => {
    if (bootResult.server) await bootResult.server.close();
    if (bootResult.db) await bootResult.db.destroy();
  });

  describe('write: own', () => {
    let ownCustomerId: string;
    let otherCustomerId: string;

    beforeAll(async () => {
      // Sales User 1 creates a customer
      const res1 = await salesUserApi.post('/api/sales/customer', {
        name: 'My Customer',
        email: 'mine@test.com',
      });
      expect(res1.status).toBe(201);
      ownCustomerId = res1.data.id;

      // Sales User 2 creates another customer
      const res2 = await salesUser2Api.post('/api/sales/customer', {
        name: 'Other Customer',
        email: 'other@test.com',
      });
      expect(res2.status).toBe(201);
      otherCustomerId = res2.data.id;
    });

    it('user can update their own record', async () => {
      const res = await salesUserApi.put(`/api/sales/customer/${ownCustomerId}`, {
        name: 'My Customer Updated',
        email: 'mine@test.com',
      });
      expect(res.status).toBe(200);
      expect(res.data.name).toBe('My Customer Updated');
    });

    it('user gets 403 updating another users record', async () => {
      const res = await salesUserApi.put(`/api/sales/customer/${otherCustomerId}`, {
        name: 'Hacked Name',
        email: 'other@test.com',
      });
      expect(res.status).toBe(403);
      expect(res.error.code).toBe('FORBIDDEN');
      expect(res.error.message).toContain('records you created');
    });

    it('user2 can update their own record', async () => {
      const res = await salesUser2Api.put(`/api/sales/customer/${otherCustomerId}`, {
        name: 'Other Customer Updated',
        email: 'other@test.com',
      });
      expect(res.status).toBe(200);
      expect(res.data.name).toBe('Other Customer Updated');
    });

    it('user2 gets 403 updating user1 record', async () => {
      const res = await salesUser2Api.put(`/api/sales/customer/${ownCustomerId}`, {
        name: 'Stolen',
        email: 'mine@test.com',
      });
      expect(res.status).toBe(403);
    });
  });

  describe('write: true overrides own', () => {
    let salesUserCustomerId: string;

    beforeAll(async () => {
      const res = await salesUserApi.post('/api/sales/customer', {
        name: 'Admin Override Test',
        email: 'adminoverride@test.com',
      });
      expect(res.status).toBe(201);
      salesUserCustomerId = res.data.id;
    });

    it('admin (write: true) can update any record regardless of owner', async () => {
      const res = await adminApi.put(`/api/sales/customer/${salesUserCustomerId}`, {
        name: 'Admin Updated This',
        email: 'adminoverride@test.com',
      });
      expect(res.status).toBe(200);
      expect(res.data.name).toBe('Admin Updated This');
    });

    it('admin can delete any record', async () => {
      const toDelete = await salesUserApi.post('/api/sales/customer', {
        name: 'Delete Me',
        email: 'deleteme@test.com',
      });
      const res = await adminApi.delete(`/api/sales/customer/${toDelete.data.id}`);
      expect(res.status).toBe(204);
    });
  });

  describe('read: own', () => {
    let hrUserLeaveId: string;
    let adminLeaveId: string;
    let employeeId: string;

    beforeAll(async () => {
      // Create an employee to link leave requests to
      const dept = await adminApi.post('/api/hr/department', { name: 'Test Dept' });
      const emp = await adminApi.post('/api/hr/employee', {
        first_name: 'Test',
        last_name: 'Employee',
        email: 'emp-leave@test.com',
        department: dept.data.id,
        hire_date: '2024-01-01',
      });
      employeeId = emp.data.id;

      // HR User creates a leave request (they have read: 'own' on hr.leave_request)
      const res1 = await hrUserApi.post('/api/hr/leave_request', {
        leave_type: 'Annual',
        start_date: '2026-07-01',
        end_date: '2026-07-05',
        reason: 'Vacation',
        employee: employeeId,
      });
      expect(res1.status).toBe(201);
      hrUserLeaveId = res1.data.id;

      // Admin creates a leave request (different owner)
      const res2 = await adminApi.post('/api/hr/leave_request', {
        leave_type: 'Sick',
        start_date: '2026-08-01',
        end_date: '2026-08-02',
        reason: 'Flu',
        employee: employeeId,
      });
      expect(res2.status).toBe(201);
      adminLeaveId = res2.data.id;
    });

    it('user with read: own only sees their own records in list', async () => {
      const res = await hrUserApi.get('/api/hr/leave_request');
      expect(res.status).toBe(200);
      expect(res.data.length).toBe(1);
      expect(res.data[0].id).toBe(hrUserLeaveId);
    });

    it('user with read: own can get their own record by id', async () => {
      const res = await hrUserApi.get(`/api/hr/leave_request/${hrUserLeaveId}`);
      expect(res.status).toBe(200);
      expect(res.data.id).toBe(hrUserLeaveId);
    });

    it('user with read: own gets 404 on another users record', async () => {
      const res = await hrUserApi.get(`/api/hr/leave_request/${adminLeaveId}`);
      expect(res.status).toBe(404);
    });

    it('admin with read: true sees all records', async () => {
      const res = await adminApi.get('/api/hr/leave_request');
      expect(res.status).toBe(200);
      expect(res.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('delete: own (via Sales User on invoices)', () => {
    it('Sales User cannot delete any invoice (delete: false)', async () => {
      // Need a customer for the invoice
      const cust = await salesUserApi.post('/api/sales/customer', {
        name: 'Invoice Cust',
        email: 'inv-cust-del@test.com',
      });
      const invoice = await salesUserApi.post('/api/sales/invoice', {
        customer: cust.data.id,
        posting_date: '2026-06-01',
      });
      expect(invoice.status).toBe(201);

      const res = await salesUserApi.delete(`/api/sales/invoice/${invoice.data.id}`);
      expect(res.status).toBe(403);
    });
  });

  describe('write: own on invoices', () => {
    let user1InvoiceId: string;
    let user2InvoiceId: string;

    beforeAll(async () => {
      const cust1 = await salesUserApi.post('/api/sales/customer', {
        name: 'Inv Cust U1',
        email: 'inv-cust-u1@test.com',
      });
      const res1 = await salesUserApi.post('/api/sales/invoice', {
        customer: cust1.data.id,
        posting_date: '2026-06-10',
      });
      expect(res1.status).toBe(201);
      user1InvoiceId = res1.data.id;

      const cust2 = await salesUser2Api.post('/api/sales/customer', {
        name: 'Inv Cust U2',
        email: 'inv-cust-u2@test.com',
      });
      const res2 = await salesUser2Api.post('/api/sales/invoice', {
        customer: cust2.data.id,
        posting_date: '2026-06-11',
      });
      expect(res2.status).toBe(201);
      user2InvoiceId = res2.data.id;
    });

    it('user can update own invoice', async () => {
      const cust = await salesUserApi.post('/api/sales/customer', {
        name: 'Inv Update Cust',
        email: 'inv-update@test.com',
      });
      const res = await salesUserApi.put(`/api/sales/invoice/${user1InvoiceId}`, {
        customer: cust.data.id,
        status: 'Submitted',
      });
      expect(res.status).toBe(200);
      expect(res.data.status).toBe('Submitted');
    });

    it('user gets 403 updating another users invoice', async () => {
      const res = await salesUserApi.put(`/api/sales/invoice/${user2InvoiceId}`, {
        status: 'Cancelled',
      });
      expect(res.status).toBe(403);
    });
  });

  describe('stress: concurrent ownership checks', () => {
    const BATCH_SIZE = 20;
    let user1Records: string[] = [];
    let user2Records: string[] = [];

    beforeAll(async () => {
      // Create many records from both users concurrently
      const user1Promises = Array.from({ length: BATCH_SIZE }, (_, i) =>
        salesUserApi.post('/api/sales/customer', {
          name: `Stress U1 ${i}`,
          email: `stress-u1-${i}@test.com`,
        }),
      );
      const user2Promises = Array.from({ length: BATCH_SIZE }, (_, i) =>
        salesUser2Api.post('/api/sales/customer', {
          name: `Stress U2 ${i}`,
          email: `stress-u2-${i}@test.com`,
        }),
      );

      const [u1Results, u2Results] = await Promise.all([
        Promise.all(user1Promises),
        Promise.all(user2Promises),
      ]);

      user1Records = u1Results.map((r) => r.data.id);
      user2Records = u2Results.map((r) => r.data.id);
    });

    it('user1 can update all their own records concurrently', async () => {
      const updates = user1Records.map((id, i) =>
        salesUserApi.put(`/api/sales/customer/${id}`, {
          name: `Stress U1 ${i} updated`,
          email: `stress-u1-${i}@test.com`,
        }),
      );
      const results = await Promise.all(updates);
      for (const res of results) {
        expect(res.status).toBe(200);
      }
    });

    it('user1 cannot update any of user2 records', async () => {
      const updates = user2Records.map((id, i) =>
        salesUserApi.put(`/api/sales/customer/${id}`, {
          name: `hacked ${i}`,
          email: `stress-u2-${i}@test.com`,
        }),
      );
      const results = await Promise.all(updates);
      for (const res of results) {
        expect(res.status).toBe(403);
      }
    });

    it('user2 cannot update any of user1 records', async () => {
      const updates = user1Records.map((id, i) =>
        salesUser2Api.put(`/api/sales/customer/${id}`, {
          name: `hacked ${i}`,
          email: `stress-u1-${i}@test.com`,
        }),
      );
      const results = await Promise.all(updates);
      for (const res of results) {
        expect(res.status).toBe(403);
      }
    });

    it('admin can update all records from both users', async () => {
      const allIds = [...user1Records.slice(0, 5), ...user2Records.slice(0, 5)];
      const updates = allIds.map((id, i) =>
        adminApi.put(`/api/sales/customer/${id}`, {
          name: `admin override ${i}`,
          email: `admin-override-${i}@test.com`,
        }),
      );
      const results = await Promise.all(updates);
      for (const res of results) {
        expect(res.status).toBe(200);
      }
    });
  });

  describe('stress: read own with pagination', () => {
    beforeAll(async () => {
      // Need an employee for leave requests
      const dept = await adminApi.post('/api/hr/department', { name: 'Pagination Dept' });
      const emp = await adminApi.post('/api/hr/employee', {
        first_name: 'Pagination',
        last_name: 'Emp',
        email: 'pag-emp@test.com',
        department: dept.data.id,
        hire_date: '2024-01-01',
      });
      const empId = emp.data.id;

      // Create additional leave requests for the HR user
      for (let i = 0; i < 15; i++) {
        await hrUserApi.post('/api/hr/leave_request', {
          leave_type: i % 2 === 0 ? 'Annual' : 'Sick',
          start_date: `2026-09-${String(i + 1).padStart(2, '0')}`,
          end_date: `2026-09-${String(i + 2).padStart(2, '0')}`,
          reason: `Leave ${i}`,
          employee: empId,
        });
      }
      // Admin creates some too (should be invisible to HR user)
      for (let i = 0; i < 10; i++) {
        await adminApi.post('/api/hr/leave_request', {
          leave_type: 'Annual',
          start_date: `2026-10-${String(i + 1).padStart(2, '0')}`,
          end_date: `2026-10-${String(i + 2).padStart(2, '0')}`,
          reason: `Admin Leave ${i}`,
          employee: empId,
        });
      }
    });

    it('read own respects pagination and total count reflects only owned records', async () => {
      const res = await hrUserApi.get('/api/hr/leave_request', { limit: '5', page: '1' });
      expect(res.status).toBe(200);
      expect(res.data.length).toBe(5);
      // Total should only count HR user's own records (1 from earlier + 15 new = 16)
      expect(res.meta.total).toBe(16);
      expect(res.meta.totalPages).toBe(4);
    });

    it('admin sees all records including both users', async () => {
      const res = await adminApi.get('/api/hr/leave_request', { limit: '100' });
      expect(res.status).toBe(200);
      // Admin should see HR user's 16 + admin's 11 (1 from earlier + 10 new) = 27
      expect(res.data.length).toBeGreaterThanOrEqual(27);
    });

    it('read own page 2 returns correct slice', async () => {
      const page1 = await hrUserApi.get('/api/hr/leave_request', { limit: '5', page: '1' });
      const page2 = await hrUserApi.get('/api/hr/leave_request', { limit: '5', page: '2' });
      expect(page2.status).toBe(200);
      expect(page2.data.length).toBe(5);
      // No overlap between pages
      const page1Ids = new Set(page1.data.map((r: any) => r.id));
      for (const record of page2.data) {
        expect(page1Ids.has(record.id)).toBe(false);
      }
    });
  });

  describe('edge case: nonexistent record', () => {
    it('returns 404 for nonexistent record on update with own permission', async () => {
      const res = await salesUserApi.put(
        '/api/sales/customer/00000000-0000-0000-0000-000000000000',
        {
          name: 'Ghost',
          email: 'ghost@test.com',
        },
      );
      expect(res.status).toBe(404);
    });

    it('returns 404 for nonexistent record on delete with own permission', async () => {
      const res = await adminApi.delete('/api/sales/customer/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });
});
