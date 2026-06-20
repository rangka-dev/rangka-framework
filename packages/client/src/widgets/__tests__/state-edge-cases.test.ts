import { describe, test, expect } from 'vitest';
import { StateStore } from '../state/store.js';

describe('StateStore Edge Cases', () => {
  test('set with undefined value', () => {
    const store = new StateStore();
    store.set('key', undefined);
    expect(store.get('key')).toBeUndefined();
  });

  test('set distinguishes null from undefined', () => {
    const store = new StateStore();
    store.set('a', null);
    store.set('b', undefined);
    expect(store.get('a')).toBeNull();
    expect(store.get('b')).toBeUndefined();
  });

  test('multiple subscribers on same key all fire', () => {
    const store = new StateStore();
    const calls1: unknown[] = [];
    const calls2: unknown[] = [];
    store.subscribe('k', (v) => calls1.push(v));
    store.subscribe('k', (v) => calls2.push(v));
    store.set('k', 'hello');
    expect(calls1).toEqual(['hello']);
    expect(calls2).toEqual(['hello']);
  });

  test('subscriber added during notification fires on next change', () => {
    const store = new StateStore();
    const calls: unknown[] = [];
    store.subscribe('k', () => {
      store.subscribe('k', (v) => calls.push(v));
    });
    store.set('k', 1);
    calls.length = 0;
    store.set('k', 2);
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(calls).toContain(2);
  });

  test('set with same reference value does not notify', () => {
    const store = new StateStore();
    const obj = { a: 1 };
    store.set('k', obj);
    const calls: unknown[] = [];
    store.subscribe('k', (v) => calls.push(v));
    store.set('k', obj);
    expect(calls).toEqual([]);
  });

  test('set with different object reference does notify', () => {
    const store = new StateStore();
    store.set('k', { a: 1 });
    const calls: unknown[] = [];
    store.subscribe('k', (v) => calls.push(v));
    store.set('k', { a: 1 });
    expect(calls).toHaveLength(1);
  });

  test('setMany with all unchanged keys does not notify', () => {
    const store = new StateStore();
    store.set('a', 1);
    store.set('b', 2);
    const calls: unknown[] = [];
    store.subscribe('a', (v) => calls.push(v));
    store.subscribe('b', (v) => calls.push(v));
    store.setMany({ a: 1, b: 2 });
    expect(calls).toEqual([]);
  });

  test('unsubscribe same function twice is safe', () => {
    const store = new StateStore();
    const fn = () => {};
    const unsub = store.subscribe('k', fn);
    unsub();
    unsub();
    store.set('k', 1);
  });

  test('keys after clear is empty', () => {
    const store = new StateStore();
    store.set('a', 1);
    store.set('b', 2);
    store.clear();
    expect(store.keys()).toEqual([]);
  });

  test('set after clear works normally', () => {
    const store = new StateStore();
    store.set('a', 1);
    store.clear();
    store.set('a', 2);
    expect(store.get('a')).toBe(2);
  });

  test('subscribe after clear works normally', () => {
    const store = new StateStore();
    store.subscribe('k', () => {});
    store.clear();
    const calls: unknown[] = [];
    store.subscribe('k', (v) => calls.push(v));
    store.set('k', 'new');
    expect(calls).toEqual(['new']);
  });

  test('handles rapid set cycles', () => {
    const store = new StateStore();
    const calls: unknown[] = [];
    store.subscribe('counter', (v) => calls.push(v));
    for (let i = 0; i < 100; i++) {
      store.set('counter', i);
    }
    expect(calls).toHaveLength(100);
    expect(calls[99]).toBe(99);
  });
});
