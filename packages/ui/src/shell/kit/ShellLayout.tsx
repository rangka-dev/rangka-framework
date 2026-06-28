import type { ShellLayoutProps } from '@rangka/shared';
import { Shell } from '../shell';
import { Breadcrumb } from '../breadcrumb';
import { CommandPalette } from '../command-palette';
import { Icon } from '../../primitives/icon';
import { DynamicIcon } from '../../primitives/dynamic-icon';
import { Button } from '../../primitives/button';
import { Avatar } from '../../primitives/avatar';
import { DropdownMenu } from '../../overlays/dropdown-menu';
import { useShell } from '../shell-context';
import { Bell, LogOut, PanelLeft, PanelLeftClose, ChevronDown } from 'lucide-react';

function AppSelector({
  navigation,
  activeApp,
  onAppSwitch,
}: Pick<ShellLayoutProps, 'navigation' | 'activeApp' | 'onAppSwitch'>) {
  const { setRailDocked } = useShell();
  const activeMod = navigation.find((n) => n.app === activeApp);

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-foreground hover:bg-foreground/6 transition-colors">
        {activeMod?.icon && <DynamicIcon name={activeMod.icon} size="sm" />}
        <span>{activeMod?.label ?? 'Select App'}</span>
        <Icon icon={ChevronDown} size="sm" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className="min-w-[var(--anchor-width)]">
        <DropdownMenu.Group>
          <DropdownMenu.Label>Apps</DropdownMenu.Label>
          {navigation.map((mod) => (
            <DropdownMenu.Item
              key={mod.app}
              onClick={() => onAppSwitch(mod.app)}
              className="flex items-center gap-2"
            >
              {mod.icon && <DynamicIcon name={mod.icon} size="sm" />}
              {mod.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onClick={() => setRailDocked(true)} className="flex items-center gap-2">
          <Icon icon={PanelLeft} size="sm" />
          Dock rail
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

export function ShellLayout({
  children,
  navigation,
  user,
  activeApp,
  breadcrumbs,
  currentPath,
  onNavigate,
  onAppSwitch,
  onAllApps: _onAllApps,
  onLogout,
  onSearch,
}: ShellLayoutProps) {
  const activeNav = activeApp ? navigation.filter((mod) => mod.app === activeApp) : [];

  const sidebarSections = activeNav.flatMap((mod) =>
    mod.sections.map((section) => ({
      title: section.section,
      items: section.items.map((item) => ({
        label: item.label,
        path: '/' + item.page.replace('.', '/'),
        icon: item.icon,
      })),
    })),
  );

  return (
    <CommandPalette>
      <Shell>
        <ShellLayoutInner
          navigation={navigation}
          user={user}
          activeApp={activeApp}
          breadcrumbs={breadcrumbs}
          currentPath={currentPath}
          sidebarSections={sidebarSections}
          onNavigate={onNavigate}
          onAppSwitch={onAppSwitch}
          onLogout={onLogout}
          onSearch={onSearch}
        >
          {children}
        </ShellLayoutInner>
      </Shell>

      <CommandPalette.Content placeholder="Search...">
        <CommandPalette.Group heading="Pages">
          {navigation.flatMap((mod) =>
            mod.sections.flatMap((section) =>
              section.items.map((item) => (
                <CommandPalette.Item
                  key={item.page}
                  onSelect={() => onNavigate('/' + item.page.replace('.', '/'))}
                >
                  {item.label}
                </CommandPalette.Item>
              )),
            ),
          )}
        </CommandPalette.Group>
      </CommandPalette.Content>
    </CommandPalette>
  );
}

function ShellLayoutInner({
  children,
  navigation,
  user,
  activeApp,
  breadcrumbs,
  currentPath,
  sidebarSections,
  onNavigate,
  onAppSwitch,
  onLogout,
  onSearch,
}: {
  children: React.ReactNode;
  navigation: ShellLayoutProps['navigation'];
  user: ShellLayoutProps['user'];
  activeApp: ShellLayoutProps['activeApp'];
  breadcrumbs: ShellLayoutProps['breadcrumbs'];
  currentPath: string;
  sidebarSections: Array<{
    title: string;
    items: Array<{ label: string; path: string; icon?: string }>;
  }>;
  onNavigate: (path: string) => void;
  onAppSwitch: (app: string) => void;
  onLogout: () => void;
  onSearch: () => void;
}) {
  const { railDocked, setRailDocked } = useShell();
  const activeMod = navigation.find((n) => n.app === activeApp);

  return (
    <>
      <Shell.TopBar>
        <Shell.TopBar.Start>
          {!railDocked ? (
            <AppSelector navigation={navigation} activeApp={activeApp} onAppSwitch={onAppSwitch} />
          ) : (
            <span className="flex items-center gap-1.5 px-2 text-sm font-medium text-foreground">
              {activeMod?.icon && <DynamicIcon name={activeMod.icon} size="sm" />}
              {activeMod?.label ?? 'Select App'}
            </span>
          )}
        </Shell.TopBar.Start>
        <Shell.TopBar.Center>
          <CommandPalette.Trigger className="w-[364px]" />
        </Shell.TopBar.Center>
        <Shell.TopBar.End>
          <Button variant="ghost" size="icon" onClick={onSearch}>
            <Icon icon={Bell} size="sm" />
          </Button>
          {user && (
            <Avatar size="sm">
              <Avatar.Fallback>{user.name.charAt(0)}</Avatar.Fallback>
            </Avatar>
          )}
        </Shell.TopBar.End>
      </Shell.TopBar>

      <Shell.Body>
        <Shell.Rail>
          <Shell.Rail.Group>
            {navigation.map((mod) => (
              <Shell.Rail.Item
                key={mod.app}
                active={mod.app === activeApp}
                onClick={() => onAppSwitch(mod.app)}
              >
                <Shell.Rail.Icon>
                  {mod.icon ? <DynamicIcon name={mod.icon} size="sm" /> : mod.label.charAt(0)}
                </Shell.Rail.Icon>
                <Shell.Rail.Label>
                  {mod.label.length > 10 ? mod.label.slice(0, 9) + '…' : mod.label}
                </Shell.Rail.Label>
              </Shell.Rail.Item>
            ))}
          </Shell.Rail.Group>
          <Shell.Rail.Group>
            <Shell.Rail.Item onClick={() => setRailDocked(false)}>
              <Shell.Rail.Icon>
                <Icon icon={PanelLeftClose} size="sm" />
              </Shell.Rail.Icon>
            </Shell.Rail.Item>
          </Shell.Rail.Group>
        </Shell.Rail>

        <Shell.Panel>
          <Shell.Sidebar>
            <Shell.Sidebar.Header>
              <Shell.Sidebar.Title>
                <Shell.Sidebar.TitleText>
                  {activeApp
                    ? (navigation.find((n) => n.app === activeApp)?.label ?? activeApp)
                    : 'Select App'}
                </Shell.Sidebar.TitleText>
                <Shell.Sidebar.Toggle />
              </Shell.Sidebar.Title>
            </Shell.Sidebar.Header>

            <Shell.Sidebar.Content>
              {sidebarSections.map((section) => (
                <Shell.Sidebar.CollapsibleGroup key={section.title} label={section.title}>
                  <Shell.Sidebar.Menu>
                    {section.items.map((item) => (
                      <Shell.Sidebar.MenuItem key={item.path}>
                        <Shell.Sidebar.MenuLink
                          active={currentPath === item.path}
                          onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            onNavigate(item.path);
                          }}
                          href={item.path}
                        >
                          {item.icon && <DynamicIcon name={item.icon} size="sm" />}
                          {item.label}
                        </Shell.Sidebar.MenuLink>
                      </Shell.Sidebar.MenuItem>
                    ))}
                  </Shell.Sidebar.Menu>
                </Shell.Sidebar.CollapsibleGroup>
              ))}
            </Shell.Sidebar.Content>

            {user && (
              <Shell.Sidebar.Footer>
                <Shell.Sidebar.Menu>
                  <Shell.Sidebar.MenuItem>
                    <Shell.Sidebar.MenuButton onClick={onLogout}>
                      <Icon icon={LogOut} size="sm" />
                      Log out
                    </Shell.Sidebar.MenuButton>
                  </Shell.Sidebar.MenuItem>
                </Shell.Sidebar.Menu>
              </Shell.Sidebar.Footer>
            )}
          </Shell.Sidebar>

          <Shell.Main>
            <Shell.Main.Header>
              <Shell.Main.Toggle />
              <Breadcrumb>
                <Breadcrumb.List>
                  {breadcrumbs.map((crumb, i) => {
                    const isLast = i === breadcrumbs.length - 1;
                    return (
                      <>
                        <Breadcrumb.Item key={crumb.path ?? crumb.label}>
                          {!isLast ? (
                            <Breadcrumb.Link
                              onClick={(e: React.MouseEvent) => {
                                e.preventDefault();
                                if (crumb.path) onNavigate(crumb.path);
                              }}
                              href={crumb.path ?? '#'}
                            >
                              {crumb.label}
                            </Breadcrumb.Link>
                          ) : (
                            <Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
                          )}
                        </Breadcrumb.Item>
                        {!isLast && <Breadcrumb.Separator />}
                      </>
                    );
                  })}
                </Breadcrumb.List>
              </Breadcrumb>
            </Shell.Main.Header>

            <Shell.Main.Body>{children}</Shell.Main.Body>
          </Shell.Main>
        </Shell.Panel>
      </Shell.Body>
    </>
  );
}

ShellLayout.displayName = 'ShellLayout';
