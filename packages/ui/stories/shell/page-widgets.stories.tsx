import type { Meta, StoryObj } from '@storybook/react';
import { Bell, Receipt, Package, Users, Settings, Home, FileText, Plus } from 'lucide-react';
import { Shell } from '../../src/shell/shell';
import { CommandPalette } from '../../src/shell/command-palette';
import { Breadcrumb } from '../../src/shell/breadcrumb';
import { PageContainer } from '../../src/shell/page-container';
import { Button } from '../../src/primitives/button';
import { Avatar } from '../../src/primitives/avatar';
import { Badge } from '../../src/primitives/badge';
import { Icon } from '../../src/primitives/icon';
import { Card } from '../../src/layout/card';
import { Grid } from '../../src/layout/grid';
import { Stack } from '../../src/layout/stack';
import { Group } from '../../src/layout/group';
import { Field } from '../../src/form/field';
import { Input } from '../../src/primitives/input';
import { Select } from '../../src/primitives/select';
import { Checkbox } from '../../src/primitives/checkbox';
import { Separator } from '../../src/primitives/separator';

const meta: Meta = {
  title: 'Shell/Page Widgets',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

function ShellWrapper({ children }: { children: React.ReactNode }) {
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
              </Shell.Sidebar.Header>
              <Shell.Sidebar.Content>
                <Shell.Sidebar.Group>
                  <Shell.Sidebar.Menu>
                    <Shell.Sidebar.MenuItem>
                      <Shell.Sidebar.MenuButton active>
                        <Icon icon={Home} size="sm" />
                        <span>Dashboard</span>
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
                        <Icon icon={FileText} size="sm" />
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
                    <Icon icon={Plus} size="sm" />
                    <span>New Order</span>
                  </Button>
                </Shell.Main.Actions>
              </Shell.Main.Header>
              <Shell.Main.Body>{children}</Shell.Main.Body>
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
        </CommandPalette.Group>
      </CommandPalette.Content>
    </CommandPalette>
  );
}

export const FormPage: Story = {
  name: 'Form Page (Create Order)',
  render: () => (
    <ShellWrapper>
      <PageContainer>
        <Card>
          <Card.Header>
            <Card.Title>Create Order</Card.Title>
            <Card.Description>Fill in the order details below.</Card.Description>
          </Card.Header>
          <Card.Content>
            <Grid columns={2} gap="md">
              <Field>
                <Field.Label required>Customer</Field.Label>
                <Input placeholder="Select customer..." />
              </Field>
              <Field>
                <Field.Label required>Order Date</Field.Label>
                <Input type="date" />
              </Field>
              <Field>
                <Field.Label>Status</Field.Label>
                <Select>
                  <Select.Trigger placeholder="Choose status..." />
                  <Select.Content>
                    <Select.Item value="draft">Draft</Select.Item>
                    <Select.Item value="confirmed">Confirmed</Select.Item>
                    <Select.Item value="shipped">Shipped</Select.Item>
                  </Select.Content>
                </Select>
              </Field>
              <Field>
                <Field.Label required>Total</Field.Label>
                <Input type="number" placeholder="0.00" />
              </Field>
            </Grid>
          </Card.Content>
          <Card.Footer>
            <Group gap="sm">
              <Button variant="primary" size="xs">
                Save
              </Button>
              <Button variant="ghost" size="xs">
                Cancel
              </Button>
            </Group>
          </Card.Footer>
        </Card>
      </PageContainer>
    </ShellWrapper>
  ),
};

export const ListPage: Story = {
  name: 'List Page (Orders)',
  render: () => (
    <ShellWrapper>
      <PageContainer>
        <Card>
          <Card.Header>
            <Card.Title>Orders</Card.Title>
            <Card.Description>Manage your sales orders.</Card.Description>
          </Card.Header>
          <Card.Content>
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-border-subtle text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Order</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border-subtle hover:bg-foreground/4">
                  <td className="px-3 py-2 font-medium">ORD-001</td>
                  <td className="px-3 py-2">Acme Corp</td>
                  <td className="px-3 py-2">2026-06-20</td>
                  <td className="px-3 py-2">
                    <Badge>Confirmed</Badge>
                  </td>
                  <td className="px-3 py-2 text-right">$4,250.00</td>
                </tr>
                <tr className="border-b border-border-subtle hover:bg-foreground/4">
                  <td className="px-3 py-2 font-medium">ORD-002</td>
                  <td className="px-3 py-2">Globex Inc</td>
                  <td className="px-3 py-2">2026-06-21</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline">Draft</Badge>
                  </td>
                  <td className="px-3 py-2 text-right">$1,800.00</td>
                </tr>
                <tr className="border-b border-border-subtle hover:bg-foreground/4">
                  <td className="px-3 py-2 font-medium">ORD-003</td>
                  <td className="px-3 py-2">Wayne Enterprises</td>
                  <td className="px-3 py-2">2026-06-22</td>
                  <td className="px-3 py-2">
                    <Badge variant="destructive">Overdue</Badge>
                  </td>
                  <td className="px-3 py-2 text-right">$12,500.00</td>
                </tr>
                <tr className="border-b border-border-subtle hover:bg-foreground/4">
                  <td className="px-3 py-2 font-medium">ORD-004</td>
                  <td className="px-3 py-2">Stark Industries</td>
                  <td className="px-3 py-2">2026-06-23</td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary">Pending</Badge>
                  </td>
                  <td className="px-3 py-2 text-right">$8,900.00</td>
                </tr>
              </tbody>
            </table>
          </Card.Content>
        </Card>
      </PageContainer>
    </ShellWrapper>
  ),
};

export const DashboardPage: Story = {
  name: 'Dashboard Page',
  render: () => (
    <ShellWrapper>
      <PageContainer>
        <Grid columns={3} gap="md">
          <Card>
            <Card.Header>
              <Card.Description>Total Orders</Card.Description>
              <Card.Title>142</Card.Title>
            </Card.Header>
            <Card.Content>
              <span className="text-[12px] text-muted-foreground">+12% from last month</span>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header>
              <Card.Description>Revenue</Card.Description>
              <Card.Title>$48,250</Card.Title>
            </Card.Header>
            <Card.Content>
              <span className="text-[12px] text-muted-foreground">+8% from last month</span>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header>
              <Card.Description>Pending</Card.Description>
              <Card.Title>7</Card.Title>
            </Card.Header>
            <Card.Content>
              <span className="text-[12px] text-muted-foreground">3 overdue</span>
            </Card.Content>
          </Card>
        </Grid>
        <Separator className="my-4" />
        <Card>
          <Card.Header>
            <Card.Title>Recent Orders</Card.Title>
          </Card.Header>
          <Card.Content>
            <Stack gap="sm">
              <Group
                gap="sm"
                className="items-center justify-between rounded-md px-3 py-2 hover:bg-foreground/4"
              >
                <Group gap="sm" className="items-center">
                  <span className="text-body font-medium">ORD-001</span>
                  <span className="text-body text-muted-foreground">Acme Corp</span>
                </Group>
                <Badge>Confirmed</Badge>
              </Group>
              <Group
                gap="sm"
                className="items-center justify-between rounded-md px-3 py-2 hover:bg-foreground/4"
              >
                <Group gap="sm" className="items-center">
                  <span className="text-body font-medium">ORD-002</span>
                  <span className="text-body text-muted-foreground">Globex Inc</span>
                </Group>
                <Badge variant="outline">Draft</Badge>
              </Group>
              <Group
                gap="sm"
                className="items-center justify-between rounded-md px-3 py-2 hover:bg-foreground/4"
              >
                <Group gap="sm" className="items-center">
                  <span className="text-body font-medium">ORD-003</span>
                  <span className="text-body text-muted-foreground">Wayne Enterprises</span>
                </Group>
                <Badge variant="destructive">Overdue</Badge>
              </Group>
            </Stack>
          </Card.Content>
        </Card>
      </PageContainer>
    </ShellWrapper>
  ),
};

export const DetailPage: Story = {
  name: 'Detail Page (Order View)',
  render: () => (
    <ShellWrapper>
      <PageContainer>
        <Group gap="md" className="items-start justify-between">
          <Stack gap="xs">
            <h1 className="text-lg font-semibold">ORD-001</h1>
            <span className="text-body text-muted-foreground">Acme Corp · June 20, 2026</span>
          </Stack>
          <Group gap="sm">
            <Badge>Confirmed</Badge>
          </Group>
        </Group>
        <Separator className="my-4" />
        <Grid columns={2} gap="lg">
          <Card>
            <Card.Header>
              <Card.Title>Order Details</Card.Title>
            </Card.Header>
            <Card.Content>
              <Grid columns={2} gap="md">
                <Field>
                  <Field.Label>Customer</Field.Label>
                  <Input value="Acme Corp" readOnly />
                </Field>
                <Field>
                  <Field.Label>Date</Field.Label>
                  <Input value="2026-06-20" readOnly />
                </Field>
                <Field>
                  <Field.Label>Status</Field.Label>
                  <Input value="Confirmed" readOnly />
                </Field>
                <Field>
                  <Field.Label>Total</Field.Label>
                  <Input value="$4,250.00" readOnly />
                </Field>
              </Grid>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header>
              <Card.Title>Settings</Card.Title>
            </Card.Header>
            <Card.Content>
              <Stack gap="md">
                <Field>
                  <Field.Content>
                    <Checkbox />
                    <Field.Label>Auto-invoice</Field.Label>
                  </Field.Content>
                </Field>
                <Field>
                  <Field.Content>
                    <Checkbox defaultChecked />
                    <Field.Label>Send notification</Field.Label>
                  </Field.Content>
                </Field>
                <Field>
                  <Field.Content>
                    <Checkbox />
                    <Field.Label>Archive on complete</Field.Label>
                  </Field.Content>
                </Field>
              </Stack>
            </Card.Content>
          </Card>
        </Grid>
      </PageContainer>
    </ShellWrapper>
  ),
};
