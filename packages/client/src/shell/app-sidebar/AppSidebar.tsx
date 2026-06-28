import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { AppSwitcher } from './ModuleSwitcher';
import { SearchMenu } from './SearchMenu';
import { NavMain } from './NavMain';
import { NavUser } from './NavUser';
import type { AppSidebarProps } from './types';

export function AppSidebar({
  apps,
  activeApp,
  onAppSwitch,
  onAllApps,
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
        <AppSwitcher
          apps={apps}
          activeApp={activeApp}
          onAppSwitch={onAppSwitch}
          onAllApps={onAllApps}
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
