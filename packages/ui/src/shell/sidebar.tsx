export { useSidebar } from './sidebar-context';
export { SidebarProvider, type SidebarProviderProps } from './sidebar-provider';
export { SidebarRoot, type SidebarRootProps } from './sidebar-root';
export {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  type SidebarHeaderProps,
  type SidebarContentProps,
  type SidebarFooterProps,
  type SidebarInsetProps,
} from './sidebar-sections';
export {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  type SidebarGroupProps,
  type SidebarGroupLabelProps,
  type SidebarGroupActionProps,
  type SidebarGroupContentProps,
} from './sidebar-group';
export {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  type SidebarMenuProps,
  type SidebarMenuItemProps,
  type SidebarMenuButtonProps,
  type SidebarMenuActionProps,
  type SidebarMenuBadgeProps,
  type SidebarMenuSubProps,
  type SidebarMenuSubItemProps,
  type SidebarMenuSubButtonProps,
} from './sidebar-menu';
export {
  SidebarTrigger,
  SidebarRail,
  SidebarSeparator,
  SidebarInput,
  type SidebarTriggerProps,
  type SidebarRailProps,
  type SidebarSeparatorProps,
  type SidebarInputProps,
} from './sidebar-utils';

import { SidebarRoot } from './sidebar-root';
import { SidebarHeader, SidebarContent, SidebarFooter, SidebarInset } from './sidebar-sections';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
} from './sidebar-group';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from './sidebar-menu';
import { SidebarTrigger, SidebarRail, SidebarSeparator, SidebarInput } from './sidebar-utils';

export const Sidebar = Object.assign(SidebarRoot, {
  Header: SidebarHeader,
  Content: SidebarContent,
  Footer: SidebarFooter,
  Group: SidebarGroup,
  GroupLabel: SidebarGroupLabel,
  GroupAction: SidebarGroupAction,
  GroupContent: SidebarGroupContent,
  Menu: SidebarMenu,
  MenuItem: SidebarMenuItem,
  MenuButton: SidebarMenuButton,
  MenuAction: SidebarMenuAction,
  MenuBadge: SidebarMenuBadge,
  MenuSub: SidebarMenuSub,
  MenuSubItem: SidebarMenuSubItem,
  MenuSubButton: SidebarMenuSubButton,
  Trigger: SidebarTrigger,
  Rail: SidebarRail,
  Separator: SidebarSeparator,
  Input: SidebarInput,
  Inset: SidebarInset,
});
