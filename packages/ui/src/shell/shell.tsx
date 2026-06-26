import { ShellProvider } from './shell-provider';
import { ShellTopBar } from './shell-topbar';
import { ShellRail } from './shell-rail';
import { ShellSidebar } from './shell-sidebar';
import { ShellMain } from './shell-main';
import { ShellBody, ShellPanel } from './shell-layout';

export const Shell = Object.assign(ShellProvider, {
  TopBar: ShellTopBar,
  Body: ShellBody,
  Rail: ShellRail,
  Panel: ShellPanel,
  Sidebar: ShellSidebar,
  Main: ShellMain,
});

export { useShell } from './shell-context';
export type { ShellContextValue } from './shell-context';
export type { ShellProviderProps } from './shell-provider';
export type {
  ShellTopBarProps,
  ShellTopBarStartProps,
  ShellTopBarCenterProps,
  ShellTopBarEndProps,
} from './shell-topbar';
export type {
  ShellRailProps,
  ShellRailItemProps,
  ShellRailIconProps,
  ShellRailLabelProps,
  ShellRailSeparatorProps,
  ShellRailGroupProps,
} from './shell-rail';
export type {
  ShellSidebarProps,
  ShellSidebarHeaderProps,
  ShellSidebarContentProps,
  ShellSidebarFooterProps,
  ShellSidebarGroupProps,
  ShellSidebarGroupLabelProps,
  ShellSidebarCollapsibleGroupProps,
  ShellSidebarMenuProps,
  ShellSidebarMenuItemProps,
  ShellSidebarMenuButtonProps,
  ShellSidebarMenuLinkProps,
  ShellSidebarMenuBadgeProps,
  ShellSidebarMenuSubProps,
  ShellSidebarMenuSubItemProps,
  ShellSidebarMenuSubButtonProps,
  ShellSidebarTitleProps,
  ShellSidebarTitleTextProps,
  ShellSidebarToggleProps,
} from './shell-sidebar';
export type {
  ShellMainProps,
  ShellMainHeaderProps,
  ShellMainBodyProps,
  ShellMainToggleProps,
  ShellMainActionsProps,
} from './shell-main';
export type { ShellBodyProps, ShellPanelProps } from './shell-layout';
