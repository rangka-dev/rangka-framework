import { describe, it, expect } from 'vitest';
import { ScheduleManager } from '../scheduler.js';
import { JobRegistry } from '../registry.js';

describe('ScheduleManager', () => {
  const registry = new JobRegistry();
  const mockDb = {} as any;
  const manager = new ScheduleManager(mockDb, registry, 5000);

  describe('computeNextRun', () => {
    it('parses simple cron: every hour at minute 0', () => {
      const from = new Date('2026-01-15T10:00:00Z');
      const next = manager.computeNextRun('0 * * * *', from);
      expect(next.getMinutes()).toBe(0);
      expect(next.getTime()).toBeGreaterThan(from.getTime());
    });

    it('parses cron: daily at 2 AM', () => {
      const from = new Date('2026-01-15T03:00:00Z');
      const next = manager.computeNextRun('0 2 * * *', from);
      expect(next.getHours()).toBe(2);
      expect(next.getMinutes()).toBe(0);
      expect(next.getDate()).toBe(16); // next day since 2AM already passed
    });

    it('parses cron: every 5 minutes', () => {
      const from = new Date('2026-01-15T10:02:00Z');
      const next = manager.computeNextRun('*/5 * * * *', from);
      expect(next.getMinutes() % 5).toBe(0);
      expect(next.getTime()).toBeGreaterThan(from.getTime());
    });

    it('parses cron: specific day of week (Monday = 1)', () => {
      const from = new Date('2026-01-15T00:00:00Z'); // Wednesday
      const next = manager.computeNextRun('0 9 * * 1', from);
      expect(next.getDay()).toBe(1); // Monday
      expect(next.getHours()).toBe(9);
    });

    it('parses cron: specific day of month', () => {
      const from = new Date('2026-01-15T00:00:00Z');
      const next = manager.computeNextRun('30 8 20 * *', from);
      expect(next.getDate()).toBe(20);
      expect(next.getHours()).toBe(8);
      expect(next.getMinutes()).toBe(30);
    });

    it('parses cron with ranges', () => {
      const from = new Date('2026-01-15T10:00:00Z');
      const next = manager.computeNextRun('0 9-17 * * *', from);
      expect(next.getHours()).toBeGreaterThanOrEqual(9);
      expect(next.getHours()).toBeLessThanOrEqual(17);
    });

    it('parses cron with comma-separated values', () => {
      const from = new Date('2026-01-15T10:00:00Z');
      const next = manager.computeNextRun('0,30 * * * *', from);
      expect([0, 30]).toContain(next.getMinutes());
    });

    it('throws on invalid cron expression', () => {
      expect(() => manager.computeNextRun('* * *')).toThrow('Invalid cron expression');
    });

    it('next run is always in the future', () => {
      const from = new Date('2026-01-15T10:30:00Z');
      const next = manager.computeNextRun('30 10 * * *', from);
      expect(next.getTime()).toBeGreaterThan(from.getTime());
    });
  });

  describe('lifecycle', () => {
    it('starts and stops', async () => {
      const mgr = new ScheduleManager(mockDb, registry, 60000);
      expect(mgr.isRunning()).toBe(false);

      mgr.start();
      expect(mgr.isRunning()).toBe(true);

      await mgr.stop();
      expect(mgr.isRunning()).toBe(false);
    });

    it('does not double-start', async () => {
      const mgr = new ScheduleManager(mockDb, registry, 60000);
      mgr.start();
      mgr.start();
      expect(mgr.isRunning()).toBe(true);
      await mgr.stop();
    });
  });
});
