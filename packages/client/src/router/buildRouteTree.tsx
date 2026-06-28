import type { PageDefinition } from '@rangka/shared';
import { createRootRoute, createRoute, Outlet, type AnyRoute } from '@tanstack/react-router';
import { ShellLayout } from '../shell/ShellLayout.js';
import { ModuleSelectorPage } from '../shell/ModuleSelectorPage.js';
import { useShellComponents } from '../ui/UIProvider.js';
import { WidgetSlotRenderer } from '../widgets/shell/WidgetSlotRenderer.js';
import { useMeta } from '../context/MetaContext.js';

function RootLayout() {
  return (
    <ShellLayout>
      <Outlet />
    </ShellLayout>
  );
}

function PageRoute({ pageKey }: { pageKey: string }) {
  const { PageOutlet, NotFound } = useShellComponents();
  const { pages } = useMeta();
  const page = pages.find((p) => p.key === pageKey);

  if (!page) return <NotFound />;

  return (
    <PageOutlet pageKey={pageKey} layout={page.layout} actions={page.actions}>
      <WidgetSlotRenderer nodes={page.widgets} model="" />
    </PageOutlet>
  );
}

function NotFoundRoute() {
  const { NotFound } = useShellComponents();
  return <NotFound />;
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
        component: () => <PageRoute pageKey={pageKey} />,
      });
    }),
  );

  const notFoundRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '*',
    component: NotFoundRoute,
  });

  childRoutes.push(notFoundRoute);
  rootRoute.addChildren(childRoutes);

  return rootRoute;
}
