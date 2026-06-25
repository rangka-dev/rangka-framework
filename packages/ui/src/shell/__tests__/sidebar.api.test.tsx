import { describe, it, expect } from 'vitest';
import { Sidebar, SidebarProvider, useSidebar } from '../sidebar';

describe('Sidebar API surface', () => {
  it('exports SidebarProvider and useSidebar', () => {
    expect(SidebarProvider).toBeDefined();
    expect(useSidebar).toBeDefined();
  });

  it('exports Sidebar with all sub-components', () => {
    expect(Sidebar).toBeDefined();
    expect(Sidebar.Header).toBeDefined();
    expect(Sidebar.Content).toBeDefined();
    expect(Sidebar.Footer).toBeDefined();
    expect(Sidebar.Group).toBeDefined();
    expect(Sidebar.GroupLabel).toBeDefined();
    expect(Sidebar.GroupAction).toBeDefined();
    expect(Sidebar.GroupContent).toBeDefined();
    expect(Sidebar.Menu).toBeDefined();
    expect(Sidebar.MenuItem).toBeDefined();
    expect(Sidebar.MenuButton).toBeDefined();
    expect(Sidebar.MenuAction).toBeDefined();
    expect(Sidebar.MenuBadge).toBeDefined();
    expect(Sidebar.MenuSub).toBeDefined();
    expect(Sidebar.MenuSubItem).toBeDefined();
    expect(Sidebar.MenuSubButton).toBeDefined();
    expect(Sidebar.Trigger).toBeDefined();
    expect(Sidebar.Rail).toBeDefined();
    expect(Sidebar.Separator).toBeDefined();
    expect(Sidebar.Input).toBeDefined();
    expect(Sidebar.Inset).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Sidebar.Header.displayName).toBe('Sidebar.Header');
    expect(Sidebar.Content.displayName).toBe('Sidebar.Content');
    expect(Sidebar.Footer.displayName).toBe('Sidebar.Footer');
    expect(Sidebar.Group.displayName).toBe('Sidebar.Group');
    expect(Sidebar.GroupLabel.displayName).toBe('Sidebar.GroupLabel');
    expect(Sidebar.GroupAction.displayName).toBe('Sidebar.GroupAction');
    expect(Sidebar.GroupContent.displayName).toBe('Sidebar.GroupContent');
    expect(Sidebar.Menu.displayName).toBe('Sidebar.Menu');
    expect(Sidebar.MenuItem.displayName).toBe('Sidebar.MenuItem');
    expect(Sidebar.MenuButton.displayName).toBe('Sidebar.MenuButton');
    expect(Sidebar.MenuAction.displayName).toBe('Sidebar.MenuAction');
    expect(Sidebar.MenuBadge.displayName).toBe('Sidebar.MenuBadge');
    expect(Sidebar.MenuSub.displayName).toBe('Sidebar.MenuSub');
    expect(Sidebar.MenuSubItem.displayName).toBe('Sidebar.MenuSubItem');
    expect(Sidebar.MenuSubButton.displayName).toBe('Sidebar.MenuSubButton');
    expect(Sidebar.Trigger.displayName).toBe('Sidebar.Trigger');
    expect(Sidebar.Rail.displayName).toBe('Sidebar.Rail');
    expect(Sidebar.Separator.displayName).toBe('Sidebar.Separator');
    expect(Sidebar.Input.displayName).toBe('Sidebar.Input');
    expect(Sidebar.Inset.displayName).toBe('Sidebar.Inset');
  });
});
