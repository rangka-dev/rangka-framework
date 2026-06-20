import { describe, test, expect } from 'vitest';
import { StateStore } from '../state/store.js';

describe('StateStore', () => {
  test('get returns undefined for unset key', () => {
    const store = new StateStore();
    expect(store.get('missing')).toBeUndefined();
  });

  test('set and get a value', () => {
    const store = new StateStore();
    store.set('step', 1);
    expect(store.get('step')).toBe(1);
  });

  test('set overwrites existing value', () => {
    const store = new StateStore();
    store.set('step', 1);
    store.set('step', 2);
    expect(store.get('step')).toBe(2);
  });

  test('subscribe is called on change', () => {
    const store = new StateStore();
    const calls: unknown[] = [];
    store.subscribe('step', (v) => calls.push(v));
    store.set('step', 1);
    store.set('step', 2);
    expect(calls).toEqual([1, 2]);
  });

  test('subscribe is not called when value unchanged', () => {
    const store = new StateStore();
    store.set('step', 1);
    const calls: unknown[] = [];
    store.subscribe('step', (v) => calls.push(v));
    store.set('step', 1);
    expect(calls).toEqual([]);
  });

  test('unsubscribe stops notifications', () => {
    const store = new StateStore();
    const calls: unknown[] = [];
    const unsub = store.subscribe('step', (v) => calls.push(v));
    store.set('step', 1);
    unsub();
    store.set('step', 2);
    expect(calls).toEqual([1]);
  });

  test('setMany updates multiple keys', () => {
    const store = new StateStore();
    store.setMany({ step: 1, loading: true });
    expect(store.get('step')).toBe(1);
    expect(store.get('loading')).toBe(true);
  });

  test('setMany notifies subscribers for each changed key', () => {
    const store = new StateStore();
    const stepCalls: unknown[] = [];
    const loadingCalls: unknown[] = [];
    store.subscribe('step', (v) => stepCalls.push(v));
    store.subscribe('loading', (v) => loadingCalls.push(v));
    store.setMany({ step: 1, loading: true });
    expect(stepCalls).toEqual([1]);
    expect(loadingCalls).toEqual([true]);
  });

  test('setMany skips unchanged keys', () => {
    const store = new StateStore();
    store.set('step', 1);
    const calls: unknown[] = [];
    store.subscribe('step', (v) => calls.push(v));
    store.setMany({ step: 1, loading: true });
    expect(calls).toEqual([]);
  });

  test('writing one key does not affect others', () => {
    const store = new StateStore();
    store.set('a', 1);
    store.set('b', 2);
    const calls: unknown[] = [];
    store.subscribe('b', (v) => calls.push(v));
    store.set('a', 10);
    expect(calls).toEqual([]);
    expect(store.get('b')).toBe(2);
  });

  test('clear removes all state and subscribers', () => {
    const store = new StateStore();
    store.set('a', 1);
    const calls: unknown[] = [];
    store.subscribe('a', (v) => calls.push(v));
    store.clear();
    expect(store.get('a')).toBeUndefined();
    store.set('a', 2);
    expect(calls).toEqual([]);
  });

  test('keys returns all set keys', () => {
    const store = new StateStore();
    store.set('a', 1);
    store.set('b', 2);
    expect(store.keys().sort()).toEqual(['a', 'b']);
  });
});
