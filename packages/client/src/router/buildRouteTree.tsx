import type { PageDefinition } from '@rangka/shared';
import { createRootRoute, createRoute, Outlet, type AnyRoute } from '@tanstack/react-router';
import { PageOutlet } from '../shell/PageOutlet.js';
import { ShellLayout } from '../shell/ShellLayout.js';
import { ModuleSelectorPage } from '../shell/ModuleSelectorPage.js';

function RootLayout() {
  return (
    <ShellLayout>
      <Outlet />
    </ShellLayout>
  );
}

function pageKeyToPath(key: string): string {
  return '/' + key.replace(/\./g, '/');
}

export function buildRouteTree(pages: PageDefinition[]) {
  const rootRoute = createRootRoute({
    component: RootLayout,
  });

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: ModuleSelectorPage,
  });

  const childRoutes: AnyRoute[] = [indexRoute];

  childRoutes.push(
    ...pages.map((page) => {
      const path = page.path ?? pageKeyToPath(page.key);
      const pageKey = page.key;
      return createRoute({
        getParentRoute: () => rootRoute,
        path,
        component: () => PageOutlet({ pageKey }),
      });
    }),
  );

  const notFoundRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '*',
    component: NotFound,
  });

  childRoutes.push(notFoundRoute);
  rootRoute.addChildren(childRoutes);

  return rootRoute;
}

function NotFound() {
  return (
    <div role="alert">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
}
