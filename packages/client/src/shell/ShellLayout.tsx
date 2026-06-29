import { useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useShellComponents } from '../ui/UIProvider.js';
import { useMeta } from '../context/MetaContext.js';
import { useApp } from '../context/ModuleContext.js';
import { useBootContext } from '../boot/BootProvider.js';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { useBreadcrumbs } from './useBreadcrumbs.js';
import { usePageState, useStateVersion } from '../widgets/hooks/usePageState.js';
import { useActionHandlers } from '../widgets/shell/useActionHandlers.js';
import { dispatch as dispatchAction } from '../widgets/action/dispatcher.js';
import { evaluateConditions } from '../widgets/condition/index.js';
import { getFiltersForModel } from '../widgets/reactivity/variables.js';
import { extractFilterFields } from './extractFilterFields.js';
import { ShellFilterBar } from './ShellFilterBar.js';
import type { NavigationTree, WidgetAction, Action } from '@rangka/shared';

export function ShellLayout({ children }: { children: ReactNode }) {
  const { Layout } = useShellComponents();
  const router = useRouter();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const { navigation, pages, models } = useMeta();
  const { activeApp, setActiveApp, clearActiveApp } = useApp();
  const { state } = useBootContext();
  const crumbs = useBreadcrumbs(currentPath, navigation, pages);
  const pageState = usePageState();
  const stateVersion = useStateVersion();
  const handlers = useActionHandlers();

  const currentPage = useMemo(() => {
    return pages.find((p) => {
      const pagePath = p.path ?? '/' + p.key.replace(/\./g, '/');
      if (pagePath.includes('$') || pagePath.includes(':')) {
        const regex = new RegExp('^' + pagePath.replace(/[:$][^/]+/g, '[^/]+') + '$');
        return regex.test(currentPath);
      }
      return pagePath === currentPath;
    });
  }, [pages, currentPath]);

  const visibleActions = useMemo(() => {
    if (!currentPage?.actions) return undefined;
    const stateSnapshot: Record<string, unknown> = {
      $state: Object.fromEntries(pageState.keys().map((k) => [k, pageState.get(k)])),
    };
    return currentPage.actions.filter((act: Action) => {
      if (!act.visible) return true;
      return evaluateConditions(act.visible, stateSnapshot);
    });
  }, [currentPage?.actions, pageState, stateVersion]);

  const filterFields = useMemo(() => {
    if (!currentPage || currentPage.layout !== 'full') return [];
    return extractFilterFields(currentPage.widgets, models);
  }, [currentPage, models]);

  const filterOpen = useMemo(() => {
    return Boolean(pageState.get('filterOpen'));
  }, [pageState, stateVersion]);

  const activeFilters = useMemo(() => {
    if (!filterFields.length) return [];
    const stateMap = new Map<string, unknown>();
    for (const key of pageState.keys()) {
      stateMap.set(key, pageState.get(key));
    }
    const model = filterFields[0]?.model ?? '';
    return getFiltersForModel(stateMap, model);
  }, [filterFields, pageState, stateVersion]);

  const handleSetFilter = useCallback(
    (field: string, operator: string, value: unknown) => {
      const model = filterFields[0]?.model ?? '';
      const key =
        operator === 'eq' ? `$filter.${model}.${field}` : `$filter.${model}.${field}__${operator}`;
      pageState.set(key, value);
      pageState.set(`$page.${model}`, 1);
    },
    [filterFields, pageState],
  );

  const handleRemoveFilter = useCallback(
    (field: string, operator: string) => {
      const model = filterFields[0]?.model ?? '';
      const key =
        operator === 'eq' ? `$filter.${model}.${field}` : `$filter.${model}.${field}__${operator}`;
      pageState.set(key, null);
      pageState.set(`$page.${model}`, 1);
    },
    [filterFields, pageState],
  );

  const filterBar =
    filterFields.length > 0 && filterOpen ? (
      <ShellFilterBar
        fields={filterFields}
        activeFilters={activeFilters}
        onSetFilter={handleSetFilter}
        onRemoveFilter={handleRemoveFilter}
      />
    ) : null;

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
      if (action.type === 'form.submit') {
        document.dispatchEvent(new CustomEvent('rangka:form.submit'));
        return;
      }
      if (action.type === 'form.reset') {
        document.dispatchEvent(new CustomEvent('rangka:form.reset'));
        return;
      }
      const actionCtx = {
        widgetContext: { record: {}, model: '', mode: 'view' as const },
        state: pageState,
      };
      dispatchAction(action, actionCtx, handlers);
    },
    [pageState, handlers],
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
      pageActions={visibleActions}
      filterBar={filterBar}
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
