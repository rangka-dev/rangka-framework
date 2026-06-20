import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../password.js';

describe('password hashing', () => {
  it('hashes and verifies a password correctly', () => {
    const password = 'my-secure-password';
    const hashed = hashPassword(password);

    expect(hashed).toContain(':');
    expect(verifyPassword(password, hashed)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const hashed = hashPassword('correct-password');
    expect(verifyPassword('wrong-password', hashed)).toBe(false);
  });

  it('produces different hashes for the same password (random salt)', () => {
    const password = 'same-password';
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);
    expect(hash1).not.toBe(hash2);
  });

  it('returns false for malformed stored hash', () => {
    expect(verifyPassword('anything', 'nocolon')).toBe(false);
    expect(verifyPassword('anything', '')).toBe(false);
  });
});
