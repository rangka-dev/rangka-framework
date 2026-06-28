import { useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useShellComponents } from '../ui/UIProvider.js';
import { useMeta } from '../context/MetaContext.js';
import { useApp } from '../context/ModuleContext.js';
import { useBootContext } from '../boot/BootProvider.js';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { useBreadcrumbs } from './useBreadcrumbs.js';
import type { NavigationTree } from '@rangka/shared';

export function ShellLayout({ children }: { children: ReactNode }) {
  const { Layout } = useShellComponents();
  const router = useRouter();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const { navigation, pages } = useMeta();
  const { activeApp, setActiveApp, clearActiveApp } = useApp();
  const { state } = useBootContext();
  const crumbs = useBreadcrumbs(currentPath, navigation, pages);

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
      const firstPage = mod?.sections[0]?.items[0]?.page;
      if (firstPage) {
        router.navigate({ to: '/' + firstPage.replace('.', '/') });
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
