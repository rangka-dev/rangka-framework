import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { ModuleSwitcher } from './ModuleSwitcher';
import { SearchMenu } from './SearchMenu';
import { NavMain } from './NavMain';
import { NavUser } from './NavUser';
import type { AppSidebarProps } from './types';

export function AppSidebar({
  modules,
  activeModule,
  onModuleSwitch,
  onAllModules,
  onSearch,
  navigation,
  currentPath,
  onNavigate,
  user,
  onLogout,
  onPreferences,
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <ModuleSwitcher
          modules={modules}
          activeModule={activeModule}
          onModuleSwitch={onModuleSwitch}
          onAllModules={onAllModules}
        />
        {onSearch && <SearchMenu onSearch={onSearch} />}
      </SidebarHeader>
      <SidebarContent>
        {navigation.length > 0 && (
          <NavMain sections={navigation} currentPath={currentPath} onNavigate={onNavigate} />
        )}
      </SidebarContent>
      {user && (
        <SidebarFooter>
          <NavUser user={user} onLogout={onLogout} onPreferences={onPreferences} />
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
