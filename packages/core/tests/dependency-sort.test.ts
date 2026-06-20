import { describe, it, expect } from 'vitest';
import { dependencySort } from '../src/boot/dependency-sort.js';
import { CircularDependencyError, MissingDependencyError } from '../src/boot/types.js';
import type { AppConfig } from '@rangka/shared';

describe('dependencySort', () => {
  it('sorts a linear chain correctly', () => {
    const apps: AppConfig[] = [
      { name: 'project', depends: ['sales'] },
      { name: 'core' },
      { name: 'sales', depends: ['core'] },
    ];

    const sorted = dependencySort(apps);
    const names = sorted.map((a) => a.name);

    expect(names).toEqual(['core', 'sales', 'project']);
  });

  it('handles diamond dependencies', () => {
    const apps: AppConfig[] = [
      { name: 'core' },
      { name: 'sales', depends: ['core'] },
      { name: 'accounting', depends: ['core'] },
      { name: 'project', depends: ['sales', 'accounting'] },
    ];

    const sorted = dependencySort(apps);
    const names = sorted.map((a) => a.name);

    expect(names[0]).toBe('core');
    expect(names[names.length - 1]).toBe('project');
    expect(names.indexOf('accounting')).toBeLessThan(names.indexOf('project'));
    expect(names.indexOf('sales')).toBeLessThan(names.indexOf('project'));
  });

  it('uses alphabetical tiebreaker for same-level apps', () => {
    const apps: AppConfig[] = [
      { name: 'core' },
      { name: 'zebra', depends: ['core'] },
      { name: 'alpha', depends: ['core'] },
      { name: 'middle', depends: ['core'] },
    ];

    const sorted = dependencySort(apps);
    const names = sorted.map((a) => a.name);

    expect(names).toEqual(['core', 'alpha', 'middle', 'zebra']);
  });

  it('always places core first', () => {
    const apps: AppConfig[] = [{ name: 'sales', depends: [] }, { name: 'core' }];

    const sorted = dependencySort(apps);
    expect(sorted[0].name).toBe('core');
  });

  it('throws CircularDependencyError for direct cycle', () => {
    const apps: AppConfig[] = [
      { name: 'core' },
      { name: 'a', depends: ['b'] },
      { name: 'b', depends: ['a'] },
    ];

    expect(() => dependencySort(apps)).toThrow(CircularDependencyError);
  });

  it('throws CircularDependencyError for indirect cycle', () => {
    const apps: AppConfig[] = [
      { name: 'core' },
      { name: 'a', depends: ['b'] },
      { name: 'b', depends: ['c'] },
      { name: 'c', depends: ['a'] },
    ];

    expect(() => dependencySort(apps)).toThrow(CircularDependencyError);
    try {
      dependencySort(apps);
    } catch (e) {
      const err = e as CircularDependencyError;
      expect(err.cycle).toContain('a');
      expect(err.cycle).toContain('b');
      expect(err.cycle).toContain('c');
    }
  });

  it('throws MissingDependencyError for unknown dependency', () => {
    const apps: AppConfig[] = [{ name: 'core' }, { name: 'project', depends: ['sales'] }];

    expect(() => dependencySort(apps)).toThrow(MissingDependencyError);
    try {
      dependencySort(apps);
    } catch (e) {
      const err = e as MissingDependencyError;
      expect(err.app).toBe('project');
      expect(err.missingDep).toBe('sales');
    }
  });
});
