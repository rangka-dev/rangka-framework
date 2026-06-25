import type { DatabaseClient } from '../db/client.js';
import { hashPassword } from './password.js';

export async function seedCoreData(db: DatabaseClient): Promise<void> {
  const existing = await db
    .selectFrom('core.user')
    .select('id')
    .where('email', '=', 'system@rangka.local')
    .executeTakeFirst();

  if (existing) return;

  const adminRole = await db
    .insertInto('core.role')
    .values({
      id: crypto.randomUUID(),
      name: 'Administrator',
      inherits: JSON.stringify([]),
      permissions: JSON.stringify({}),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  const systemUser = await db
    .insertInto('core.user')
    .values({
      id: crypto.randomUUID(),
      email: 'system@rangka.local',
      password_hash: hashPassword('admin'),
      full_name: 'System Administrator',
      enabled: db.dialect === 'sqlite' ? 1 : true,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  await db
    .insertInto('core.user_role')
    .values({
      id: crypto.randomUUID(),
      user_id: systemUser.id,
      role_id: adminRole.id,
    })
    .execute();
}
