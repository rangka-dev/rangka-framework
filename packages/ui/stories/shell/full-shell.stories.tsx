import type { Meta, StoryObj } from '@storybook/react';
import { SidebarProvider, Sidebar } from '../../src/shell/sidebar';
import { ShellContent } from '../../src/shell/shell-content';
import { PageContainer } from '../../src/shell/page-container';
import { Breadcrumb } from '../../src/shell/breadcrumb';
import { Button } from '../../src/primitives/button';
import { Badge } from '../../src/primitives/badge';
import { Avatar } from '../../src/primitives/avatar';
import { Separator } from '../../src/primitives/separator';
import { Card } from '../../src/layout/card';
import { DropdownMenu } from '../../src/overlays/dropdown-menu';
import { Collapsible } from '../../src/layout/collapsible';

const meta: Meta = {
  title: 'Shell/Full Shell',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <SidebarProvider defaultOpen={true}>
      <Sidebar side="left" collapsible="icon">
        <Sidebar.Header>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <DropdownMenu>
                <DropdownMenu.Trigger>
                  <Sidebar.MenuButton size="lg">
                    <Avatar size="sm">
                      <Avatar.Fallback>R</Avatar.Fallback>
                    </Avatar>
                    <span className="flex flex-col">
                      <span className="truncate font-semibold">Rangka ERP</span>
                      <span className="truncate text-xs opacity-60">Production</span>
                    </span>
                  </Sidebar.MenuButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Label>Workspaces</DropdownMenu.Label>
                  <DropdownMenu.Item>Rangka ERP</DropdownMenu.Item>
                  <DropdownMenu.Item>Staging</DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item>Create workspace</DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.Header>

        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Sales</Sidebar.GroupLabel>
            <Sidebar.Menu>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton isActive tooltip="Orders">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>Orders</span>
                  <Sidebar.MenuBadge>12</Sidebar.MenuBadge>
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton tooltip="Invoices">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                  <span>Invoices</span>
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
              <Sidebar.MenuItem>
                <Collapsible defaultOpen>
                  <Collapsible.Trigger asChild>
                    <Sidebar.MenuButton tooltip="Products">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m7.5 4.27 9 5.15" />
                        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                        <path d="m3.3 7 8.7 5 8.7-5" />
                        <path d="M12 22V12" />
                      </svg>
                      <span>Products</span>
                    </Sidebar.MenuButton>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <Sidebar.MenuSub>
                      <Sidebar.MenuSubItem>
                        <Sidebar.MenuSubButton>All Products</Sidebar.MenuSubButton>
                      </Sidebar.MenuSubItem>
                      <Sidebar.MenuSubItem>
                        <Sidebar.MenuSubButton isActive>Categories</Sidebar.MenuSubButton>
                      </Sidebar.MenuSubItem>
                      <Sidebar.MenuSubItem>
                        <Sidebar.MenuSubButton>Inventory</Sidebar.MenuSubButton>
                      </Sidebar.MenuSubItem>
                    </Sidebar.MenuSub>
                  </Collapsible.Content>
                </Collapsible>
              </Sidebar.MenuItem>
            </Sidebar.Menu>
          </Sidebar.Group>

          <Sidebar.Group>
            <Sidebar.GroupLabel>Settings</Sidebar.GroupLabel>
            <Sidebar.Menu>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton tooltip="General">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>General</span>
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton tooltip="Users">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  <span>Users</span>
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>

        <Sidebar.Footer>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <DropdownMenu>
                <DropdownMenu.Trigger>
                  <Sidebar.MenuButton size="lg">
                    <Avatar size="sm">
                      <Avatar.Fallback>JD</Avatar.Fallback>
                    </Avatar>
                    <span className="flex flex-col">
                      <span className="truncate font-semibold">John Doe</span>
                      <span className="truncate text-xs opacity-60">john@example.com</span>
                    </span>
                  </Sidebar.MenuButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Label>My Account</DropdownMenu.Label>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item>Profile</DropdownMenu.Item>
                  <DropdownMenu.Item>Settings</DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item>Log out</DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.Footer>
      </Sidebar>

      <Sidebar.Inset>
        <ShellContent>
          <ShellContent.Header>
            <Sidebar.Trigger />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
              <Breadcrumb.List>
                <Breadcrumb.Item>
                  <Breadcrumb.Link href="#">Sales</Breadcrumb.Link>
                </Breadcrumb.Item>
                <Breadcrumb.Separator />
                <Breadcrumb.Item>
                  <Breadcrumb.Page>Orders</Breadcrumb.Page>
                </Breadcrumb.Item>
              </Breadcrumb.List>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="primary" size="sm">
                New Order
              </Button>
            </div>
          </ShellContent.Header>
          <ShellContent.Main>
            <PageContainer layout="default">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold">Orders</h1>
                <Badge variant="secondary">12 total</Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                  <Card.Header>
                    <Card.Title>ORD-001</Card.Title>
                    <Card.Description>Acme Corp</Card.Description>
                  </Card.Header>
                  <Card.Content>
                    <p className="text-2xl font-bold">$4,250.00</p>
                  </Card.Content>
                  <Card.Footer>
                    <Badge>Confirmed</Badge>
                  </Card.Footer>
                </Card>
                <Card>
                  <Card.Header>
                    <Card.Title>ORD-002</Card.Title>
                    <Card.Description>Globex Inc</Card.Description>
                  </Card.Header>
                  <Card.Content>
                    <p className="text-2xl font-bold">$1,800.00</p>
                  </Card.Content>
                  <Card.Footer>
                    <Badge variant="outline">Draft</Badge>
                  </Card.Footer>
                </Card>
                <Card>
                  <Card.Header>
                    <Card.Title>ORD-003</Card.Title>
                    <Card.Description>Wayne Enterprises</Card.Description>
                  </Card.Header>
                  <Card.Content>
                    <p className="text-2xl font-bold">$12,500.00</p>
                  </Card.Content>
                  <Card.Footer>
                    <Badge variant="destructive">Overdue</Badge>
                  </Card.Footer>
                </Card>
              </div>
            </PageContainer>
          </ShellContent.Main>
        </ShellContent>
      </Sidebar.Inset>
    </SidebarProvider>
  ),
};

export const FullLayout: Story = {
  render: () => (
    <SidebarProvider defaultOpen={true}>
      <Sidebar side="left" collapsible="icon">
        <Sidebar.Header>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton size="lg">
                <Avatar size="sm">
                  <Avatar.Fallback>R</Avatar.Fallback>
                </Avatar>
                <span className="truncate font-semibold">Rangka ERP</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Dashboard</Sidebar.GroupLabel>
            <Sidebar.Menu>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton isActive tooltip="Overview">
                  <span>Overview</span>
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
      </Sidebar>

      <Sidebar.Inset>
        <ShellContent>
          <ShellContent.Header>
            <Sidebar.Trigger />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
              <Breadcrumb.List>
                <Breadcrumb.Item>
                  <Breadcrumb.Page>Dashboard</Breadcrumb.Page>
                </Breadcrumb.Item>
              </Breadcrumb.List>
            </Breadcrumb>
          </ShellContent.Header>
          <ShellContent.Main>
            <PageContainer layout="full">
              <div className="h-full bg-[var(--color-background)] flex items-center justify-center">
                <p className="text-[var(--color-muted-foreground)]">
                  Full bleed content — no padding
                </p>
              </div>
            </PageContainer>
          </ShellContent.Main>
        </ShellContent>
      </Sidebar.Inset>
    </SidebarProvider>
  ),
};
