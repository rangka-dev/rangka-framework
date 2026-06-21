import React, { useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { XIcon } from 'lucide-react';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  Sidebar,
  SidebarHeader,
  SidebarContent,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/Icon';
import { AppSidebar } from './app-sidebar/index.js';
import type { AppSidebarNavSection, AppSidebarModule } from './app-sidebar/types.js';
import { CommandPalette } from './CommandPalette.js';
import { HeaderActions } from './HeaderActions.js';
import { ShellDevTools } from './ShellDevTools.js';
import { DrawerProvider, useDrawer } from './DrawerContext.js';
import { ShellAPIProvider } from './ShellContext.js';
import { useMeta } from '../context/MetaContext.js';
import { useModule } from '../context/ModuleContext.js';
import { useBootContext } from '../boot/BootProvider.js';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { useBreadcrumbs } from './useBreadcrumbs.js';
import type { NavigationTree, WidgetAction } from '@rangka/shared';

function ShellLayoutInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const { navigation, pages } = useMeta();
  const { activeModule, setActiveModule, clearActiveModule } = useModule();
  const { state } = useBootContext();
  const { state: drawerState, closeDrawer } = useDrawer();

  useEffect(() => {
    const pathModule = currentPath.split('/').filter(Boolean)[0];
    if (pathModule && navigation.some((n: NavigationTree) => n.module === pathModule)) {
      setActiveModule(pathModule);
    } else if (currentPath === '/') {
      clearActiveModule();
    }
  }, [currentPath, navigation, setActiveModule, clearActiveModule]);

  const handleNavigate = useCallback(
    (path: string) => {
      router.navigate({ to: path });
    },
    [router],
  );

  const currentPage = useMemo(() => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const pageKey = `${parts[0]}.${parts[1]}`;
      return pages.find((p) => p.key === pageKey);
    }
    return undefined;
  }, [currentPath, pages]);

  const crumbs = useBreadcrumbs(currentPath, navigation, pages);

  const handleAction = useCallback(
    (action: WidgetAction) => {
      switch (action.type) {
        case 'navigate':
          handleNavigate(action.path);
          break;
      }
    },
    [handleNavigate],
  );

  const headerActions = currentPage?.actions?.length ? (
    <HeaderActions actions={currentPage.actions} onAction={handleAction} />
  ) : undefined;

  const modules: AppSidebarModule[] = navigation.map((mod: NavigationTree) => ({
    name: mod.module,
    label: mod.label,
    icon: mod.icon ? <Icon name={mod.icon} size={14} /> : undefined,
  }));

  const sidebarNavigation: AppSidebarNavSection[] = useMemo(() => {
    const activeNav = activeModule
      ? navigation.filter((mod: NavigationTree) => mod.module === activeModule)
      : [];
    return activeNav.flatMap((mod: NavigationTree) =>
      mod.sections.map((section) => ({
        title: section.section,
        icon: section.items[0]?.icon ? <Icon name={section.items[0].icon} /> : undefined,
        items: section.items.map((item) => ({
          title: item.label,
          url: '/' + item.page.replace('.', '/'),
        })),
      })),
    );
  }, [activeModule, navigation]);

  const handleModuleSwitch = useCallback(
    (moduleName: string) => {
      setActiveModule(moduleName);
      const mod = navigation.find((n: NavigationTree) => n.module === moduleName);
      const firstPage = mod?.sections[0]?.items[0]?.page;
      if (firstPage) {
        router.navigate({ to: '/' + firstPage.replace('.', '/') });
      }
    },
    [navigation, router, setActiveModule],
  );

  const handleAllModules = useCallback(() => {
    clearActiveModule();
    router.navigate({ to: '/' });
  }, [clearActiveModule, router]);

  const handleLogout = useCallback(() => {
    document.dispatchEvent(new CustomEvent('rangka:logout'));
  }, []);

  const handlePreferences = useCallback(() => {
    router.navigate({ to: '/preferences' });
  }, [router]);

  const user =
    state.status === 'ready'
      ? { name: state.data.user.name, email: state.data.user.email }
      : undefined;

  const handleSearch = useCallback(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  }, []);

  const isModuleSelectorPage = !activeModule;

  return (
    <SidebarProvider className="h-svh !min-h-0">
      <AppSidebar
        modules={modules}
        activeModule={activeModule ?? undefined}
        onModuleSwitch={handleModuleSwitch}
        onAllModules={handleAllModules}
        onSearch={handleSearch}
        navigation={sidebarNavigation}
        currentPath={currentPath}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
        onPreferences={handlePreferences}
      />
      <SidebarInset className="overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          {isModuleSelectorPage ? (
            <>
              <Separator orientation="vertical" className="mr-2" />
              <span className="text-sm font-medium">Select Module</span>
            </>
          ) : (
            <>
              <Separator orientation="vertical" className="mr-2" />
              <Breadcrumb>
                <BreadcrumbList>
                  {crumbs.map((crumb, i) => {
                    const isLast = i === crumbs.length - 1;
                    return (
                      <React.Fragment key={crumb.path ?? crumb.label}>
                        <BreadcrumbItem>
                          {!isLast ? (
                            <BreadcrumbLink
                              asChild
                              onClick={(e: React.MouseEvent) => {
                                e.preventDefault();
                                if (crumb.path) handleNavigate(crumb.path);
                              }}
                            >
                              <a href={crumb.path ?? '#'}>{crumb.label}</a>
                            </BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                          )}
                        </BreadcrumbItem>
                        {!isLast && <BreadcrumbSeparator />}
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
              {headerActions && (
                <div className="ml-auto flex items-center gap-2">{headerActions}</div>
              )}
            </>
          )}
        </header>
        <main className="flex-1 overflow-auto bg-muted">{children}</main>
      </SidebarInset>

      {drawerState.open && (
        <Sidebar side="right" collapsible="none" className="w-80 border-l">
          <SidebarHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
            <div>
              {drawerState.title && <h3 className="text-sm font-medium">{drawerState.title}</h3>}
              {drawerState.description && (
                <p className="text-xs text-muted-foreground">{drawerState.description}</p>
              )}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={closeDrawer} aria-label="Close panel">
              <XIcon />
            </Button>
          </SidebarHeader>
          <SidebarContent className="p-4">{drawerState.content}</SidebarContent>
        </Sidebar>
      )}

      <CommandPalette />
      <ShellDevTools />
    </SidebarProvider>
  );
}

export function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <DrawerProvider>
      <ShellAPIProvider>
        <ShellLayoutInner>{children}</ShellLayoutInner>
      </ShellAPIProvider>
    </DrawerProvider>
  );
}
