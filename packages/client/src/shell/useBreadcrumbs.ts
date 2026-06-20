import { useMemo } from 'react';
import type { BreadcrumbItem } from './types.js';
import type { NavigationTree, PageDefinition } from '@rangka/shared';

export function useBreadcrumbs(
  currentPath: string,
  navigation: NavigationTree[],
  pages: PageDefinition[],
): BreadcrumbItem[] {
  return useMemo((): BreadcrumbItem[] => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length === 0) return [];

    const result: BreadcrumbItem[] = [];

    const moduleName = parts[0];
    const mod = navigation.find((n) => n.module === moduleName);
    if (mod) {
      result.push({
        label: mod.label,
        path: '/' + moduleName,
      });
    } else {
      result.push({ label: moduleName, path: '/' + moduleName });
    }

    if (parts.length >= 2) {
      const pageKey = `${parts[0]}.${parts[1]}`;
      const page = pages.find((p) => p.key === pageKey);
      result.push({
        label: page?.label ?? parts[1],
        path: '/' + parts.slice(0, 2).join('/'),
      });
    }

    if (parts.length >= 3) {
      result.push({ label: parts[2], path: currentPath });
    }

    return result;
  }, [currentPath, navigation, pages]);
}
