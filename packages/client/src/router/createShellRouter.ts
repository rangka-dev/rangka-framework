import type { PageDefinition } from '@rangka/shared';
import { createRouter, type Router } from '@tanstack/react-router';
import { buildRouteTree } from './buildRouteTree.jsx';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createShellRouter(pages: PageDefinition[]): Router<any, any, any, any> {
  const routeTree = buildRouteTree(pages);
  return createRouter({ routeTree });
}
