import { Bell, Receipt, Package, Users, Settings, BarChart3, FileText, Home } from 'lucide-react';
import { Shell } from '../../src/shell/shell';
import { CommandPalette } from '../../src/shell/command-palette';
import { Breadcrumb } from '../../src/shell/breadcrumb';
import { PageContainer } from '../../src/shell/page-container';
import { Button } from '../../src/primitives/button';
import { Avatar } from '../../src/primitives/avatar';
import { Icon } from '../../src/primitives/icon';
import type { ReactNode } from 'react';

export function PageShell({
  children,
  module = 'Sales',
  page = 'Orders',
  layout = 'default',
  action,
}: {
  children: ReactNode;
  module?: string;
  page?: string;
  layout?: 'default' | 'full';
  action?: ReactNode;
}) {
  return (
    <CommandPalette>
      <Shell>
        <Shell.TopBar>
          <Shell.TopBar.Start />
          <Shell.TopBar.Center>
            <CommandPalette.Trigger className="w-[364px]" />
          </Shell.TopBar.Center>
          <Shell.TopBar.End>
            <Button variant="ghost" size="icon">
              <Icon icon={Bell} size="sm" />
            </Button>
            <Avatar size="sm">
              <Avatar.Fallback>I</Avatar.Fallback>
            </Avatar>
          </Shell.TopBar.End>
        </Shell.TopBar>

        <Shell.Body>
          <Shell.Rail>
            <Shell.Rail.Group>
              <Shell.Rail.Item href="#" active={module === 'Sales'}>
                <Shell.Rail.Icon>
                  <Icon icon={Receipt} size="md" />
                </Shell.Rail.Icon>
                <Shell.Rail.Label>Sales</Shell.Rail.Label>
              </Shell.Rail.Item>
              <Shell.Rail.Item href="#" active={module === 'Inventory'}>
                <Shell.Rail.Icon>
                  <Icon icon={Package} size="md" />
                </Shell.Rail.Icon>
                <Shell.Rail.Label>Inventory</Shell.Rail.Label>
              </Shell.Rail.Item>
              <Shell.Rail.Item href="#" active={module === 'HR'}>
                <Shell.Rail.Icon>
                  <Icon icon={Users} size="md" />
                </Shell.Rail.Icon>
                <Shell.Rail.Label>HR</Shell.Rail.Label>
              </Shell.Rail.Item>
              <Shell.Rail.Separator />
              <Shell.Rail.Item href="#" active={module === 'Settings'}>
                <Shell.Rail.Icon>
                  <Icon icon={Settings} size="md" />
                </Shell.Rail.Icon>
                <Shell.Rail.Label>Settings</Shell.Rail.Label>
              </Shell.Rail.Item>
            </Shell.Rail.Group>
          </Shell.Rail>

          <Shell.Panel>
            <Shell.Sidebar>
              <Shell.Sidebar.Header>
                <Shell.Sidebar.Title>
                  <Shell.Sidebar.TitleText>{module}</Shell.Sidebar.TitleText>
                  <Shell.Sidebar.Toggle />
                </Shell.Sidebar.Title>
              </Shell.Sidebar.Header>
              <Shell.Sidebar.Content>
                <Shell.Sidebar.Group>
                  <Shell.Sidebar.Menu>
                    <Shell.Sidebar.MenuItem>
                      <Shell.Sidebar.MenuButton active={page === 'Dashboard'}>
                        <Icon icon={BarChart3} size="sm" />
                        <span>Dashboard</span>
                      </Shell.Sidebar.MenuButton>
                    </Shell.Sidebar.MenuItem>
                    <Shell.Sidebar.MenuItem>
                      <Shell.Sidebar.MenuButton active={page === 'Orders'}>
                        <Icon icon={Receipt} size="sm" />
                        <span>Orders</span>
                      </Shell.Sidebar.MenuButton>
                    </Shell.Sidebar.MenuItem>
                    <Shell.Sidebar.MenuItem>
                      <Shell.Sidebar.MenuButton active={page === 'Invoices'}>
                        <Icon icon={FileText} size="sm" />
                        <span>Invoices</span>
                      </Shell.Sidebar.MenuButton>
                    </Shell.Sidebar.MenuItem>
                    <Shell.Sidebar.MenuItem>
                      <Shell.Sidebar.MenuButton active={page === 'Customers'}>
                        <Icon icon={Users} size="sm" />
                        <span>Customers</span>
                      </Shell.Sidebar.MenuButton>
                    </Shell.Sidebar.MenuItem>
                    <Shell.Sidebar.MenuItem>
                      <Shell.Sidebar.MenuButton active={page === 'Products'}>
                        <Icon icon={Package} size="sm" />
                        <span>Products</span>
                      </Shell.Sidebar.MenuButton>
                    </Shell.Sidebar.MenuItem>
                  </Shell.Sidebar.Menu>
                </Shell.Sidebar.Group>
                <Shell.Sidebar.CollapsibleGroup label="Reports">
                  <Shell.Sidebar.Menu>
                    <Shell.Sidebar.MenuItem>
                      <Shell.Sidebar.MenuButton>
                        <Icon icon={BarChart3} size="sm" />
                        <span>Sales Report</span>
                      </Shell.Sidebar.MenuButton>
                    </Shell.Sidebar.MenuItem>
                    <Shell.Sidebar.MenuItem>
                      <Shell.Sidebar.MenuButton>
                        <Icon icon={BarChart3} size="sm" />
                        <span>Revenue</span>
                      </Shell.Sidebar.MenuButton>
                    </Shell.Sidebar.MenuItem>
                  </Shell.Sidebar.Menu>
                </Shell.Sidebar.CollapsibleGroup>
              </Shell.Sidebar.Content>
            </Shell.Sidebar>

            <Shell.Main>
              <Shell.Main.Header>
                <Shell.Main.Toggle />
                <Breadcrumb>
                  <Breadcrumb.List>
                    <Breadcrumb.Item>
                      <Breadcrumb.Link href="#">{module}</Breadcrumb.Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Separator />
                    <Breadcrumb.Item>
                      <Breadcrumb.Page>{page}</Breadcrumb.Page>
                    </Breadcrumb.Item>
                  </Breadcrumb.List>
                </Breadcrumb>
                <Shell.Main.Actions>{action}</Shell.Main.Actions>
              </Shell.Main.Header>
              <Shell.Main.Body>
                <PageContainer layout={layout}>{children}</PageContainer>
              </Shell.Main.Body>
            </Shell.Main>
          </Shell.Panel>
        </Shell.Body>
      </Shell>
      <CommandPalette.Content placeholder="Search across workspace...">
        <CommandPalette.Group heading="Pages">
          <CommandPalette.Item>
            <Icon icon={Home} size="sm" />
            <span>Dashboard</span>
          </CommandPalette.Item>
          <CommandPalette.Item>
            <Icon icon={Receipt} size="sm" />
            <span>Orders</span>
          </CommandPalette.Item>
          <CommandPalette.Item>
            <Icon icon={FileText} size="sm" />
            <span>Invoices</span>
          </CommandPalette.Item>
        </CommandPalette.Group>
      </CommandPalette.Content>
    </CommandPalette>
  );
}
