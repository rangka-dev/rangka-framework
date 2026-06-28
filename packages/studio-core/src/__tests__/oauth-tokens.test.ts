import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

vi.mock('node:fs');
vi.mock('node:os');

const MOCK_HOME = '/tmp/test-home';
const TOKENS_DIR = path.join(MOCK_HOME, '.rangka');
const TOKENS_FILE = path.join(TOKENS_DIR, 'tokens.json');

describe('oauth/tokens', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.mocked(os.homedir).mockReturnValue(MOCK_HOME);
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.readFileSync).mockReturnValue('{}');
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined as any);
    vi.mocked(fs.chmodSync).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadTokens', () => {
    it('returns empty object when file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const { loadTokens } = await import('../oauth/tokens.js');
      expect(loadTokens()).toEqual({});
    });

    it('parses existing token file', async () => {
      const stored = {
        anthropic: {
          accessToken: 'at-123',
          refreshToken: 'rt-456',
          expiresAt: 9999999999999,
        },
      };
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(stored));
      const { loadTokens } = await import('../oauth/tokens.js');
      expect(loadTokens()).toEqual(stored);
    });

    it('returns empty object on parse error', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('not json');
      const { loadTokens } = await import('../oauth/tokens.js');
      expect(loadTokens()).toEqual({});
    });
  });

  describe('saveTokens', () => {
    it('creates directory if not exists', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const { saveTokens } = await import('../oauth/tokens.js');
      saveTokens({ anthropic: { accessToken: 'test' } });
      expect(vi.mocked(fs.mkdirSync)).toHaveBeenCalledWith(TOKENS_DIR, { recursive: true });
    });

    it('writes tokens with 0600 permissions', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const { saveTokens } = await import('../oauth/tokens.js');
      const tokens = { openai: { accessToken: 'at-abc', refreshToken: 'rt-def' } };
      saveTokens(tokens);
      expect(vi.mocked(fs.writeFileSync)).toHaveBeenCalledWith(
        TOKENS_FILE,
        JSON.stringify(tokens, null, 2),
        'utf-8',
      );
      expect(vi.mocked(fs.chmodSync)).toHaveBeenCalledWith(TOKENS_FILE, 0o600);
    });
  });

  describe('getProviderTokens', () => {
    it('returns null for unknown provider', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{}');
      const { getProviderTokens } = await import('../oauth/tokens.js');
      expect(getProviderTokens('unknown')).toBeNull();
    });

    it('returns tokens for known provider', async () => {
      const stored = { gemini: { accessToken: 'gem-at', expiresAt: 1234567890 } };
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(stored));
      const { getProviderTokens } = await import('../oauth/tokens.js');
      expect(getProviderTokens('gemini')).toEqual(stored.gemini);
    });
  });

  describe('setProviderTokens', () => {
    it('merges new tokens into existing file', async () => {
      const existing = { anthropic: { accessToken: 'old' } };
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(existing));
      const { setProviderTokens } = await import('../oauth/tokens.js');
      setProviderTokens('openai', { accessToken: 'new-token', refreshToken: 'new-refresh' });
      const written = JSON.parse(vi.mocked(fs.writeFileSync).mock.calls[0][1] as string);
      expect(written.anthropic.accessToken).toBe('old');
      expect(written.openai.accessToken).toBe('new-token');
    });
  });

  describe('clearProviderTokens', () => {
    it('removes provider tokens from file', async () => {
      const existing = {
        anthropic: { accessToken: 'at-1' },
        openai: { accessToken: 'at-2' },
      };
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(existing));
      const { clearProviderTokens } = await import('../oauth/tokens.js');
      clearProviderTokens('anthropic');
      const written = JSON.parse(vi.mocked(fs.writeFileSync).mock.calls[0][1] as string);
      expect(written.anthropic).toBeUndefined();
      expect(written.openai.accessToken).toBe('at-2');
    });

    it('is a no-op when provider has no tokens', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{}');
      const { clearProviderTokens } = await import('../oauth/tokens.js');
      clearProviderTokens('nonexistent');
      expect(vi.mocked(fs.writeFileSync)).toHaveBeenCalled();
    });
  });
});
