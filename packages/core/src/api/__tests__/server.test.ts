import { describe, it, expect } from 'vitest';
import { createServer } from '../server.js';

describe('createServer', () => {
  it('returns a Fastify instance with defaults', async () => {
    const server = await createServer();
    expect(server).toBeDefined();
    expect(server.hasRoute).toBeDefined();
  });

  it('applies custom options', async () => {
    const server = await createServer({ port: 4000, host: '0.0.0.0', logger: false });
    expect(server).toBeDefined();
  });

  it('parses JSON bodies', async () => {
    const server = await createServer();
    server.post('/test', async (req) => req.body);

    const res = await server.inject({
      method: 'POST',
      url: '/test',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ hello: 'world' }),
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ hello: 'world' });
  });

  it('generates request IDs', async () => {
    const server = await createServer();
    server.get('/test', async (req) => ({ id: req.id }));

    const res = await server.inject({ method: 'GET', url: '/test' });
    const body = JSON.parse(res.body);
    expect(body.id).toBeDefined();
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('returns structured error response', async () => {
    const server = await createServer();
    server.get('/fail', async () => {
      const err = new Error('Something broke') as any;
      err.statusCode = 422;
      err.code = 'UNPROCESSABLE';
      throw err;
    });

    const res = await server.inject({ method: 'GET', url: '/fail' });
    expect(res.statusCode).toBe(422);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('UNPROCESSABLE');
    expect(body.error.message).toBe('Something broke');
  });

  it('defaults to 500 for unhandled errors', async () => {
    const server = await createServer();
    server.get('/crash', async () => {
      throw new Error('Unexpected');
    });

    const res = await server.inject({ method: 'GET', url: '/crash' });
    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('uses custom requestIdHeader', async () => {
    const server = await createServer({ requestIdHeader: 'x-trace-id' });
    expect(server).toBeDefined();
  });
});
