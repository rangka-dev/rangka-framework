import { useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useShellComponents } from '../ui/UIProvider.js';
import { useMeta } from '../context/MetaContext.js';
import { useApp } from '../context/ModuleContext.js';
import { useBootContext } from '../boot/BootProvider.js';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { useBreadcrumbs } from './useBreadcrumbs.js';
import type { NavigationTree, WidgetAction } from '@rangka/shared';

export function ShellLayout({ children }: { children: ReactNode }) {
  const { Layout } = useShellComponents();
  const router = useRouter();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const { navigation, pages } = useMeta();
  const { activeApp, setActiveApp, clearActiveApp } = useApp();
  const { state } = useBootContext();
  const crumbs = useBreadcrumbs(currentPath, navigation, pages);

  const currentPage = useMemo(() => {
    return pages.find((p) => {
      const pagePath = p.path ?? '/' + p.key.replace(/\./g, '/');
      if (pagePath.includes(':')) {
        const regex = new RegExp('^' + pagePath.replace(/:[^/]+/g, '[^/]+') + '$');
        return regex.test(currentPath);
      }
      return pagePath === currentPath;
    });
  }, [pages, currentPath]);

  useEffect(() => {
    const pathApp = currentPath.split('/').filter(Boolean)[0];
    if (pathApp && navigation.some((n: NavigationTree) => n.app === pathApp)) {
      setActiveApp(pathApp);
    } else if (currentPath === '/') {
      clearActiveApp();
    }
  }, [currentPath, navigation, setActiveApp, clearActiveApp]);

  const handleNavigate = useCallback(
    (path: string) => {
      router.navigate({ to: path });
    },
    [router],
  );

  const handleAppSwitch = useCallback(
    (appName: string) => {
      setActiveApp(appName);
      const mod = navigation.find((n: NavigationTree) => n.app === appName);
      const firstItem = mod?.sections[0]?.items[0];
      if (firstItem) {
        router.navigate({ to: firstItem.path });
      }
    },
    [navigation, router, setActiveApp],
  );

  const handleAllApps = useCallback(() => {
    clearActiveApp();
    router.navigate({ to: '/' });
  }, [clearActiveApp, router]);

  const handleLogout = useCallback(() => {
    document.dispatchEvent(new CustomEvent('rangka:logout'));
  }, []);

  const handleSearch = useCallback(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  }, []);

  const handleAction = useCallback(
    (action: WidgetAction) => {
      if (action.type === 'navigate') {
        router.navigate({ to: (action as { path: string }).path });
      }
    },
    [router],
  );

  const user =
    state.status === 'ready'
      ? { id: state.data.user.id, name: state.data.user.name, email: state.data.user.email }
      : undefined;

  return (
    <Layout
      navigation={navigation}
      user={user}
      activeApp={activeApp ?? null}
      breadcrumbs={crumbs}
      currentPath={currentPath}
      pageActions={currentPage?.actions}
      onAction={handleAction}
      onNavigate={handleNavigate}
      onAppSwitch={handleAppSwitch}
      onAllApps={handleAllApps}
      onLogout={handleLogout}
      onSearch={handleSearch}
    >
      {children}
    </Layout>
  );
}
