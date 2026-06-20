import Fastify from 'fastify';
import type { FastifyInstance, FastifyError } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import qs from 'qs';
import type { ServerConfig } from './types.js';
import { AppError } from '../errors.js';

/**
 * Create and configure the Fastify server instance with JSON parsing,
 * error handling, and optional OpenAPI docs.
 */
export async function createServer(options?: ServerConfig): Promise<FastifyInstance> {
  const server = Fastify({
    logger: options?.logger ?? { level: 'error' },
    genReqId: () => crypto.randomUUID(),
    requestIdHeader: options?.requestIdHeader ?? 'x-request-id',
    routerOptions: {
      querystringParser: (str) => qs.parse(str),
    },
  });

  const docsEnabled = options?.docs !== false;
  if (docsEnabled) {
    await registerOpenApiDocs(server, options);
  }

  registerJsonParser(server);
  registerErrorHandler(server);

  return server;
}

/** Register @fastify/swagger and swagger-ui for API documentation. */
async function registerOpenApiDocs(server: FastifyInstance, options?: ServerConfig): Promise<void> {
  await server.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Rangka API',
        version: '1.0.0',
      },
      tags: options?.tags ?? [],
    },
  });

  await server.register(fastifySwaggerUi, {
    routePrefix: '/api/docs',
  });
}

/** Override the default JSON content-type parser with explicit error handling. */
function registerJsonParser(server: FastifyInstance): void {
  server.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
      const str = (body as string).trim();
      if (!str) {
        done(null, undefined);
        return;
      }
      const parsed = JSON.parse(str);
      done(null, parsed);
    } catch (err: unknown) {
      done(err as Error, undefined);
    }
  });
}

/** Normalize all errors into a consistent { error: { code, message, details? } } shape. */
function registerErrorHandler(server: FastifyInstance): void {
  server.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    if (error instanceof AppError) {
      if (error.statusCode >= 500) {
        request.log.error(
          { err: error, url: request.url },
          'AppError %s: %s',
          error.code,
          error.message,
        );
      }
      const response: Record<string, unknown> = {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined && { details: error.details }),
        },
      };
      return reply.status(error.statusCode).send(response);
    }

    // Handle Postgres/database errors with meaningful messages

    const pgCode = (error as unknown as Record<string, unknown>).code;
    if (typeof pgCode === 'string' && pgCode.match(/^[0-9A-Z]{5}$/)) {
      const detail = mapPgError(pgCode, error.message);
      request.log.error({ err: error, url: request.url, pgCode }, 'Database error: %s', detail);
      return reply.status(500).send({
        error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred' },
      });
    }

    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      request.log.error({ err: error, url: request.url }, 'Unhandled error: %s', error.message);
    }
    const response = {
      error: {
        code: error.code ?? 'INTERNAL_ERROR',
        message: statusCode >= 500 ? 'An internal error occurred' : error.message,
        ...(error.validation && { details: error.validation }),
      },
    };
    reply.status(statusCode).send(response);
  });
}

function mapPgError(code: string, raw: string): string {
  switch (code) {
    case '42P01':
      return `Table does not exist: ${extractRelation(raw)}`;
    case '42703':
      return `Column does not exist: ${extractDetail(raw)}`;
    case '23505':
      return `Duplicate value violates unique constraint`;
    case '23503':
      return `Referenced record does not exist (foreign key violation)`;
    case '23502':
      return `Missing required field (not-null violation)`;
    case '42P02':
      return `Invalid query parameter`;
    case '08001':
    case '08006':
      return `Database connection failed`;
    default:
      return `Database error (${code})`;
  }
}

function extractRelation(msg: string): string {
  const match = msg.match(/relation "([^"]+)"/);
  return match ? match[1] : 'unknown';
}

function extractDetail(msg: string): string {
  const match = msg.match(/column "([^"]+)"/);
  return match ? match[1] : 'unknown';
}
