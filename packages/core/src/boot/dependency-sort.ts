import type { ModuleConfig } from '@rangka/shared';
import { CircularDependencyError, MissingDependencyError } from './types.js';

// Topological sort of app modules by their declared dependencies.
// Core is always first; remaining apps are sorted so dependencies load before dependents.
export function dependencySort(apps: ModuleConfig[]): ModuleConfig[] {
  const appsByName = new Map<string, ModuleConfig>(apps.map((app) => [app.name, app]));

  const coreApp = appsByName.get('core');
  if (!coreApp) {
    throw new Error('Core app must be present in the app list');
  }

  const nonCoreApps = apps.filter((a) => a.name !== 'core');
  validateDependenciesExist(nonCoreApps, appsByName);

  const sorted = topologicalSort(nonCoreApps, appsByName);
  return [coreApp, ...sorted];
}

function validateDependenciesExist(
  apps: ModuleConfig[],
  appsByName: Map<string, ModuleConfig>,
): void {
  for (const app of apps) {
    for (const dep of app.depends ?? []) {
      if (dep !== 'core' && !appsByName.has(dep)) {
        throw new MissingDependencyError(app.name, dep);
      }
    }
  }
}

// Kahn's algorithm — processes apps with no remaining dependencies first.
function topologicalSort(
  apps: ModuleConfig[],
  appsByName: Map<string, ModuleConfig>,
): ModuleConfig[] {
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const app of apps) {
    inDegree.set(app.name, 0);
    dependents.set(app.name, []);
  }

  for (const app of apps) {
    for (const dep of app.depends ?? []) {
      if (dep === 'core') continue;
      dependents.get(dep)!.push(app.name);
      inDegree.set(app.name, inDegree.get(app.name)! + 1);
    }
  }

  const ready = apps
    .filter((app) => inDegree.get(app.name) === 0)
    .map((app) => app.name)
    .sort();

  const sorted: ModuleConfig[] = [];

  while (ready.length > 0) {
    const current = ready.shift()!;
    sorted.push(appsByName.get(current)!);

    for (const dependent of dependents.get(current) ?? []) {
      const remaining = inDegree.get(dependent)! - 1;
      inDegree.set(dependent, remaining);
      if (remaining === 0) {
        ready.push(dependent);
        ready.sort();
      }
    }
  }

  if (sorted.length < apps.length) {
    const unsorted = apps.filter((a) => !sorted.includes(a)).map((a) => a.name);
    throw new CircularDependencyError(unsorted);
  }

  return sorted;
}
