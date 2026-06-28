import type { Meta, StoryObj } from '@storybook/react';
import { Bell, Receipt, Package, Users, Settings, Home } from 'lucide-react';
import { Shell } from '../../src/shell/shell';
import { CommandPalette } from '../../src/shell/command-palette';
import { Breadcrumb } from '../../src/shell/breadcrumb';
import { PageContainer } from '../../src/shell/page-container';
import { Badge } from '../../src/primitives/badge';
import { Button } from '../../src/primitives/button';
import { Avatar } from '../../src/primitives/avatar';
import { Icon } from '../../src/primitives/icon';
import { Card } from '../../src/layout/card';

const meta: Meta = {
  title: 'Shell/Shell',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <CommandPalette>
      <Shell>
        <Shell.TopBar>
          <Shell.TopBar.Start></Shell.TopBar.Start>
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
              <Shell.Rail.Item href="#" active>
                <Shell.Rail.Icon>
                  <Icon icon={Receipt} size="md" />
                </Shell.Rail.Icon>
                <Shell.Rail.Label>Sales</Shell.Rail.Label>
              </Shell.Rail.Item>
              <Shell.Rail.Item href="#">
                <Shell.Rail.Icon>
                  <Icon icon={Package} size="md" />
                </Shell.Rail.Icon>
                <Shell.Rail.Label>Inventory</Shell.Rail.Label>
              </Shell.Rail.Item>
              <Shell.Rail.Item href="#">
                <Shell.Rail.Icon>
                  <Icon icon={Users} size="md" />
                </Shell.Rail.Icon>
                <Shell.Rail.Label>HR</Shell.Rail.Label>
              </Shell.Rail.Item>
              <Shell.Rail.Separator />
              <Shell.Rail.Item href="#">
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
                  <Shell.Sidebar.TitleText>Sales</Shell.Sidebar.TitleText>
                  <Shell.Sidebar.Toggle />
                </Shell.Sidebar.Title>
                <button className="flex h-8 w-full items-center justify-center gap-1 rounded-md border border-border-subtle px-2 text-[14px] font-medium text-muted-foreground">
                  <span>+ New</span>
                </button>
              </Shell.Sidebar.Header>
              <Shell.Sidebar.Content>
                <Shell.Sidebar.Group>
                  <Shell.Sidebar.Menu>
                    <Shell.Sidebar.MenuItem>
                      <Shell.Sidebar.MenuButton active>
                        <Icon icon={Home} size="sm" />
                        <span>Home</span>
                      </Shell.Sidebar.MenuButton>
                    </Shell.Sidebar.MenuItem>
                    <Shell.Sidebar.MenuItem>
                      <Shell.Sidebar.MenuButton>
                        <Icon icon={Receipt} size="sm" />
                        <span>Orders</span>
                        <Shell.Sidebar.MenuBadge>12</Shell.Sidebar.MenuBadge>
                      </Shell.Sidebar.MenuButton>
                    </Shell.Sidebar.MenuItem>
                    <Shell.Sidebar.MenuItem>
                      <Shell.Sidebar.MenuButton>
                        <Icon icon={Receipt} size="sm" />
                        <span>Invoices</span>
                      </Shell.Sidebar.MenuButton>
                    </Shell.Sidebar.MenuItem>
                  </Shell.Sidebar.Menu>
                </Shell.Sidebar.Group>

                <Shell.Sidebar.CollapsibleGroup label="Products">
                  <Shell.Sidebar.Menu>
                    <Shell.Sidebar.MenuItem>
                      <Shell.Sidebar.MenuButton>
                        <Icon icon={Package} size="sm" />
                        <span>All Products</span>
                      </Shell.Sidebar.MenuButton>
                    </Shell.Sidebar.MenuItem>
                    <Shell.Sidebar.MenuItem>
                      <Shell.Sidebar.MenuButton>
                        <Icon icon={Package} size="sm" />
                        <span>Categories</span>
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
                      <Breadcrumb.Link href="#">Sales</Breadcrumb.Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Separator />
                    <Breadcrumb.Item>
                      <Breadcrumb.Page>Orders</Breadcrumb.Page>
                    </Breadcrumb.Item>
                  </Breadcrumb.List>
                </Breadcrumb>
                <Shell.Main.Actions>
                  <Button variant="primary" size="xs">
                    New Order
                  </Button>
                </Shell.Main.Actions>
              </Shell.Main.Header>
              <Shell.Main.Body>
                <PageContainer>
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
              </Shell.Main.Body>
            </Shell.Main>
          </Shell.Panel>
        </Shell.Body>
      </Shell>
      <CommandPalette.Content placeholder="Search across workspace...">
        <CommandPalette.Group heading="Pages">
          <CommandPalette.Item>
            <Icon icon={Home} size="sm" />
            <span>Home</span>
          </CommandPalette.Item>
          <CommandPalette.Item>
            <Icon icon={Receipt} size="sm" />
            <span>Orders</span>
          </CommandPalette.Item>
          <CommandPalette.Item>
            <Icon icon={Receipt} size="sm" />
            <span>Invoices</span>
          </CommandPalette.Item>
        </CommandPalette.Group>
        <CommandPalette.Separator />
        <CommandPalette.Group heading="Modules">
          <CommandPalette.Item>
            <Icon icon={Package} size="sm" />
            <span>Inventory</span>
          </CommandPalette.Item>
          <CommandPalette.Item>
            <Icon icon={Users} size="sm" />
            <span>HR</span>
          </CommandPalette.Item>
          <CommandPalette.Item>
            <Icon icon={Settings} size="sm" />
            <span>Settings</span>
          </CommandPalette.Item>
        </CommandPalette.Group>
      </CommandPalette.Content>
    </CommandPalette>
  ),
};
