import { randomBytes } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { DatabaseClient } from '../db/client.js';
import { BadRequestError, UnauthorizedError } from '../errors.js';
import type { PermissionRegistry } from './permission-registry.js';
import type { AuthUser, AuthSession, RequestContext } from './types.js';

const TOKEN_BYTES = 32;
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex');
}

// Extracts Bearer token, validates the session, loads the user and their permissions,
// then attaches everything to request.authContext for downstream guards.
export function createAuthHook(db: DatabaseClient, permissionRegistry: PermissionRegistry) {
  return async function authHook(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const ctx: RequestContext = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).authContext = ctx;

    const token = extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const session = await findActiveSession(db, token);
    if (!session) {
      throw new UnauthorizedError('Invalid or expired session token');
    }

    const user = await findEnabledUser(db, session.user_id);
    if (!user) {
      throw new UnauthorizedError('User not found or disabled');
    }

    const roleNames = await getUserRoleNames(db, user.id);
    const permissions = permissionRegistry.resolvePermissionsForRoles(roleNames);

    ctx.user = user;
    ctx.session = session;
    ctx.permissions = permissions;
    ctx.roles = roleNames;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).authContext = ctx;
  };
}

export function getAuthContext(request: FastifyRequest): RequestContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (request as any).authContext ?? {};
}

// --- Session CRUD handlers ---

export interface SessionCreateBody {
  email: string;
  password: string;
}

// POST /session — authenticates with email/password, returns a session token.
export function createSessionHandler(db: DatabaseClient) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { verifyPassword } = await import('./password.js');
    const body = request.body as SessionCreateBody | undefined;

    if (!body?.email || !body?.password) {
      throw new BadRequestError('VALIDATION_ERROR', 'Email and password are required');
    }

    const user = await findEnabledUser(db, body.email, 'email');
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!verifyPassword(body.password, user.password_hash)) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const session = await insertSession(db, user.id);

    return reply.status(201).send({
      data: { token: session.token, expires_at: session.expires_at },
    });
  };
}

// DELETE /session — destroys the current session.
export function deleteSessionHandler(db: DatabaseClient) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = getAuthContext(request);
    if (!ctx.session) {
      throw new UnauthorizedError('Not authenticated');
    }

    await db.deleteFrom('core.session').where('id', '=', ctx.session.id).execute();
    return reply.status(204).send();
  };
}

// Invalidates all existing sessions for a user and creates a fresh one.
export async function regenerateSessionToken(db: DatabaseClient, userId: string): Promise<string> {
  await db.deleteFrom('core.session').where('user_id', '=', userId).execute();
  const session = await insertSession(db, userId);
  return session.token;
}

// --- Helpers ---

function extractBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  return token || null;
}

async function findActiveSession(db: DatabaseClient, token: string): Promise<AuthSession | null> {
  const session = (await db
    .selectFrom('core.session')
    .selectAll()
    .where('token', '=', token)
    .executeTakeFirst()) as AuthSession | undefined;

  if (!session) return null;

  const isExpired = new Date(session.expires_at).getTime() < Date.now();
  return isExpired ? null : session;
}

async function findEnabledUser(
  db: DatabaseClient,
  value: string,
  by: 'id' | 'email' = 'id',
): Promise<AuthUser | null> {
  const user = (await db
    .selectFrom('core.user')
    .selectAll()
    .where(by, '=', value)
    .executeTakeFirst()) as AuthUser | undefined;

  if (!user || !user.enabled) return null;
  return user;
}

async function getUserRoleNames(db: DatabaseClient, userId: string): Promise<string[]> {
  const userRoles = await db
    .selectFrom('core.user_role')
    .selectAll()
    .where('user_id', '=', userId)
    .execute();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleIds = userRoles.map((ur: any) => ur.role_id);
  if (roleIds.length === 0) return [];

  const roles = await db.selectFrom('core.role').selectAll().where('id', 'in', roleIds).execute();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return roles.map((r: any) => r.name);
}

async function insertSession(db: DatabaseClient, userId: string) {
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  return await db
    .insertInto('core.session')
    .values({
      id: crypto.randomUUID(),
      token,
      user_id: userId,
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}
