import { describe, it, expect } from 'vitest';
import { Shell, useShell } from '../shell';

describe('Shell API surface', () => {
  it('exports Shell with all sub-components', () => {
    expect(Shell).toBeDefined();
    expect(Shell.TopBar).toBeDefined();
    expect(Shell.TopBar.Start).toBeDefined();
    expect(Shell.TopBar.Center).toBeDefined();
    expect(Shell.TopBar.End).toBeDefined();
    expect(Shell.Body).toBeDefined();
    expect(Shell.Rail).toBeDefined();
    expect(Shell.Rail.Item).toBeDefined();
    expect(Shell.Rail.Icon).toBeDefined();
    expect(Shell.Rail.Label).toBeDefined();
    expect(Shell.Rail.Separator).toBeDefined();
    expect(Shell.Rail.Group).toBeDefined();
    expect(Shell.Panel).toBeDefined();
    expect(Shell.Sidebar).toBeDefined();
    expect(Shell.Sidebar.Header).toBeDefined();
    expect(Shell.Sidebar.Title).toBeDefined();
    expect(Shell.Sidebar.TitleText).toBeDefined();
    expect(Shell.Sidebar.Toggle).toBeDefined();
    expect(Shell.Sidebar.Content).toBeDefined();
    expect(Shell.Sidebar.Footer).toBeDefined();
    expect(Shell.Sidebar.Group).toBeDefined();
    expect(Shell.Sidebar.GroupLabel).toBeDefined();
    expect(Shell.Sidebar.CollapsibleGroup).toBeDefined();
    expect(Shell.Sidebar.Menu).toBeDefined();
    expect(Shell.Sidebar.MenuItem).toBeDefined();
    expect(Shell.Sidebar.MenuButton).toBeDefined();
    expect(Shell.Sidebar.MenuLink).toBeDefined();
    expect(Shell.Sidebar.MenuBadge).toBeDefined();
    expect(Shell.Sidebar.MenuSub).toBeDefined();
    expect(Shell.Sidebar.MenuSubItem).toBeDefined();
    expect(Shell.Sidebar.MenuSubButton).toBeDefined();
    expect(Shell.Main).toBeDefined();
    expect(Shell.Main.Header).toBeDefined();
    expect(Shell.Main.Body).toBeDefined();
  });

  it('exports useShell hook', () => {
    expect(useShell).toBeDefined();
    expect(typeof useShell).toBe('function');
  });
});
