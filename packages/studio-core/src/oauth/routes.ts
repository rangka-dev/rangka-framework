import type { FastifyInstance } from 'fastify';
import type { OAuthFlowState } from './flow.js';
import { exchangeCode } from './flow.js';
import { setProviderTokens } from './tokens.js';

export interface OAuthRouteOptions {
  pendingFlows: Map<string, OAuthFlowState>;
  onComplete: (providerId: string) => void;
  onError: (providerId: string, message: string) => void;
}

const SUCCESS_HTML = `<!DOCTYPE html>
<html>
<head><title>Authorization Complete</title></head>
<body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0a0a0a; color: #fafafa;">
  <div style="text-align: center;">
    <h1 style="font-size: 1.25rem; font-weight: 500;">Authorization complete</h1>
    <p style="color: #a1a1aa;">You can close this tab and return to Rangka Studio.</p>
  </div>
  <script>setTimeout(() => window.close(), 1500);</script>
</body>
</html>`;

const ERROR_HTML = (message: string) => `<!DOCTYPE html>
<html>
<head><title>Authorization Error</title></head>
<body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0a0a0a; color: #fafafa;">
  <div style="text-align: center;">
    <h1 style="font-size: 1.25rem; font-weight: 500; color: #ef4444;">Authorization failed</h1>
    <p style="color: #a1a1aa;">${message}</p>
  </div>
</body>
</html>`;

export function registerOAuthRoutes(app: FastifyInstance, options: OAuthRouteOptions): void {
  app.get('/oauth/callback', async (request, reply) => {
    const { code, state, error, error_description } = request.query as {
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
    };

    if (error) {
      const message = error_description ?? error;
      if (state) {
        const flow = options.pendingFlows.get(state);
        if (flow) {
          options.pendingFlows.delete(state);
          options.onError(flow.providerId, message);
        }
      }
      return reply.type('text/html').send(ERROR_HTML(message));
    }

    if (!state || !code) {
      return reply.type('text/html').send(ERROR_HTML('Missing code or state parameter'));
    }

    const flow = options.pendingFlows.get(state);
    if (!flow) {
      return reply.type('text/html').send(ERROR_HTML('Invalid or expired authorization state'));
    }

    options.pendingFlows.delete(state);

    try {
      const tokens = await exchangeCode(flow.providerId, code, flow);
      setProviderTokens(flow.providerId, tokens);
      options.onComplete(flow.providerId);
      return reply.type('text/html').send(SUCCESS_HTML);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      options.onError(flow.providerId, message);
      return reply.type('text/html').send(ERROR_HTML(message));
    }
  });
}
