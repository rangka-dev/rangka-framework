import { describe, it, expect } from 'vitest';
import { getCoreModels, getCoreApp } from '../core-module.js';
import { coreSchemas } from '../core-models.js';

describe('core module', () => {
  describe('coreSchemas', () => {
    it('defines 4 schemas: user, role, user_role, session', () => {
      expect(coreSchemas).toHaveLength(4);
      const names = coreSchemas.map((s) => s.name);
      expect(names).toEqual(['user', 'role', 'user_role', 'session']);
    });

    it('user schema has expected fields', () => {
      const user = coreSchemas.find((s) => s.name === 'user')!;
      expect(Object.keys(user.fields)).toEqual(['email', 'password_hash', 'full_name', 'enabled']);
    });

    it('session schema has token and expiry fields', () => {
      const session = coreSchemas.find((s) => s.name === 'session')!;
      expect(Object.keys(session.fields)).toContain('token');
      expect(Object.keys(session.fields)).toContain('expires_at');
      expect(Object.keys(session.fields)).toContain('user_id');
    });
  });

  describe('getCoreModels', () => {
    it('returns resolved models with core qualifiedName prefix', () => {
      const models = getCoreModels();
      expect(models).toHaveLength(4);
      for (const m of models) {
        expect(m.qualifiedName).toMatch(/^core\./);
        expect(m.app).toBe('core');
        expect(m.app).toBe('core');
      }
    });

    it('each model has an id field', () => {
      const models = getCoreModels();
      for (const m of models) {
        const idField = m.fields.find((f) => f.name === 'id');
        expect(idField).toBeDefined();
      }
    });
  });

  describe('getCoreApp', () => {
    it('returns a valid DiscoveredApp structure', () => {
      const app = getCoreApp();
      expect(app.config.name).toBe('core');
      expect(app.schemas).toHaveLength(4);
      expect(app.extensions).toEqual([]);
    });
  });
});
