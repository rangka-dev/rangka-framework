import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar, SidebarProvider } from '../../src/shell/sidebar';

const meta: Meta = {
  title: 'Shell/Sidebar',
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <SidebarProvider>
      <Sidebar>
        <Sidebar.Header>
          <div className="flex items-center gap-2 px-2">
            <span className="font-semibold text-sm">Acme Inc</span>
          </div>
        </Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton isActive>
                    <span>Dashboard</span>
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton>
                    <span>Orders</span>
                  </Sidebar.MenuButton>
                  <Sidebar.MenuBadge>12</Sidebar.MenuBadge>
                </Sidebar.MenuItem>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton>
                    <span>Products</span>
                  </Sidebar.MenuButton>
                  <Sidebar.MenuSub>
                    <Sidebar.MenuSubItem>
                      <Sidebar.MenuSubButton isActive>
                        <span>All Products</span>
                      </Sidebar.MenuSubButton>
                    </Sidebar.MenuSubItem>
                    <Sidebar.MenuSubItem>
                      <Sidebar.MenuSubButton>
                        <span>Categories</span>
                      </Sidebar.MenuSubButton>
                    </Sidebar.MenuSubItem>
                  </Sidebar.MenuSub>
                </Sidebar.MenuItem>
              </Sidebar.Menu>
            </Sidebar.GroupContent>
          </Sidebar.Group>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Settings</Sidebar.GroupLabel>
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton>
                    <span>General</span>
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton>
                    <span>Team</span>
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
              </Sidebar.Menu>
            </Sidebar.GroupContent>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton>
                <span>John Doe</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.Footer>
      </Sidebar>
      <Sidebar.Inset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <Sidebar.Trigger />
          <span className="text-sm font-medium">Dashboard</span>
        </header>
        <main className="p-4">
          <p className="text-sm text-muted-foreground">Main content area</p>
        </main>
      </Sidebar.Inset>
    </SidebarProvider>
  ),
};
