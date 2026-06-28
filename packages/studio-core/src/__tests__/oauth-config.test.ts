import { describe, it, expect } from 'vitest';
import { OAUTH_PROVIDERS } from '../oauth/config.js';
import { KNOWN_PROVIDERS } from '../providers.js';

describe('oauth/config', () => {
  const EXPECTED_PROVIDERS = ['anthropic', 'openai', 'codex', 'gemini', 'cursor', 'qwen'];

  it('exports configs for all 6 OAuth providers', () => {
    expect(Object.keys(OAUTH_PROVIDERS)).toHaveLength(6);
    for (const id of EXPECTED_PROVIDERS) {
      expect(OAUTH_PROVIDERS[id]).toBeDefined();
    }
  });

  it('each config has required fields', () => {
    for (const [id, config] of Object.entries(OAUTH_PROVIDERS)) {
      expect(config.clientId, `${id} missing clientId`).toBeTruthy();
      expect(config.authorizationUrl, `${id} missing authorizationUrl`).toBeTruthy();
      expect(config.tokenUrl, `${id} missing tokenUrl`).toBeTruthy();
      expect(config.scopes.length, `${id} has no scopes`).toBeGreaterThan(0);
    }
  });

  it('authorization URLs are valid HTTPS URLs', () => {
    for (const [id, config] of Object.entries(OAUTH_PROVIDERS)) {
      const url = new URL(config.authorizationUrl);
      expect(url.protocol, `${id} authorizationUrl not HTTPS`).toBe('https:');
    }
  });

  it('token URLs are valid HTTPS URLs', () => {
    for (const [id, config] of Object.entries(OAUTH_PROVIDERS)) {
      const url = new URL(config.tokenUrl);
      expect(url.protocol, `${id} tokenUrl not HTTPS`).toBe('https:');
    }
  });

  it('KNOWN_PROVIDERS marks OAuth-capable providers with supportsOAuth', () => {
    for (const id of EXPECTED_PROVIDERS) {
      const known = KNOWN_PROVIDERS.find((p) => p.id === id);
      expect(known?.supportsOAuth, `${id} missing supportsOAuth`).toBe(true);
    }
  });

  it('non-OAuth providers do not have supportsOAuth set', () => {
    const nonOAuth = KNOWN_PROVIDERS.filter((p) => !EXPECTED_PROVIDERS.includes(p.id));
    for (const p of nonOAuth) {
      expect(p.supportsOAuth, `${p.id} should not have supportsOAuth`).toBeFalsy();
    }
  });
});
