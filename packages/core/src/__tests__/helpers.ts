import Fastify, { type FastifyInstance, type FastifyError } from 'fastify';
import { AppError } from '../errors.js';

export function createTestServer(): FastifyInstance {
  const server = Fastify();
  server.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined && { details: error.details }),
        },
      });
    }
    reply.status(error.statusCode ?? 500).send({
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  });
  return server;
}
