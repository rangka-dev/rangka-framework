import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useSidebar } from './sidebar-context';
import { Tooltip } from '../primitives/tooltip';

export type SidebarMenuProps = ComponentProps<'ul'>;

export const SidebarMenu = forwardRef<HTMLUListElement, SidebarMenuProps>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn('flex w-full min-w-0 flex-col gap-0', className)}
      {...props}
    />
  ),
);
SidebarMenu.displayName = 'Sidebar.Menu';

export type SidebarMenuItemProps = ComponentProps<'li'>;

export const SidebarMenuItem = forwardRef<HTMLLIElement, SidebarMenuItemProps>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn('group/menu-item relative', className)}
      {...props}
    />
  ),
);
SidebarMenuItem.displayName = 'Sidebar.MenuItem';

export type SidebarMenuButtonProps = ComponentProps<'button'> & {
  /** Whether the button represents the active item */
  isActive?: boolean;
  /** Tooltip shown when sidebar is collapsed */
  tooltip?: string | ComponentProps<typeof Tooltip.Content>;
  /** Render as child element */
  asChild?: boolean;
  /** Size variant */
  size?: 'default' | 'sm' | 'lg';
  /** Style variant */
  variant?: 'default' | 'outline';
};

export const SidebarMenuButton = forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  (
    {
      className,
      asChild: _asChild = false,
      isActive = false,
      variant = 'default',
      size = 'default',
      tooltip,
      ...props
    },
    ref,
  ) => {
    const { isMobile, state } = useSidebar();

    const button = (
      <button
        ref={ref}
        data-slot="sidebar-menu-button"
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(
          'peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-none p-2 text-left text-xs ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate',
          variant === 'outline' &&
            'bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:shadow-[0_0_0_1px_var(--sidebar-accent)]',
          size === 'sm' && 'h-7 text-xs',
          size === 'lg' && 'h-12 text-xs group-data-[collapsible=icon]:p-0!',
          size === 'default' && 'h-8 text-xs',
          className,
        )}
        {...props}
      />
    );

    if (!tooltip) return button;

    const tooltipContent = typeof tooltip === 'string' ? tooltip : undefined;

    if (state !== 'collapsed' || isMobile) return button;

    return (
      <Tooltip content={tooltipContent}>
        <Tooltip.Trigger>{button}</Tooltip.Trigger>
        {typeof tooltip !== 'string' && (
          <Tooltip.Content>{(tooltip as { children: ReactNode }).children}</Tooltip.Content>
        )}
      </Tooltip>
    );
  },
);
SidebarMenuButton.displayName = 'Sidebar.MenuButton';

export type SidebarMenuActionProps = ComponentProps<'button'> & {
  asChild?: boolean;
  /** Only show on hover */
  showOnHover?: boolean;
};

export const SidebarMenuAction = forwardRef<HTMLButtonElement, SidebarMenuActionProps>(
  ({ className, asChild: _asChild = false, showOnHover = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        data-slot="sidebar-menu-action"
        data-sidebar="menu-action"
        className={cn(
          'absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-none p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0',
          showOnHover &&
            'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 aria-expanded:opacity-100 md:opacity-0',
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarMenuAction.displayName = 'Sidebar.MenuAction';

export type SidebarMenuBadgeProps = ComponentProps<'div'>;

export const SidebarMenuBadge = forwardRef<HTMLDivElement, SidebarMenuBadgeProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        'pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-none px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  ),
);
SidebarMenuBadge.displayName = 'Sidebar.MenuBadge';

export type SidebarMenuSubProps = ComponentProps<'ul'>;

export const SidebarMenuSub = forwardRef<HTMLUListElement, SidebarMenuSubProps>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        'mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  ),
);
SidebarMenuSub.displayName = 'Sidebar.MenuSub';

export type SidebarMenuSubItemProps = ComponentProps<'li'>;

export const SidebarMenuSubItem = forwardRef<HTMLLIElement, SidebarMenuSubItemProps>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn('group/menu-sub-item relative', className)}
      {...props}
    />
  ),
);
SidebarMenuSubItem.displayName = 'Sidebar.MenuSubItem';

export type SidebarMenuSubButtonProps = ComponentProps<'a'> & {
  asChild?: boolean;
  size?: 'sm' | 'md';
  isActive?: boolean;
};

export const SidebarMenuSubButton = forwardRef<HTMLAnchorElement, SidebarMenuSubButtonProps>(
  ({ className, asChild: _asChild = false, size = 'md', isActive = false, ...props }, ref) => {
    return (
      <a
        ref={ref}
        data-slot="sidebar-menu-sub-button"
        data-sidebar="menu-sub-button"
        data-size={size}
        data-active={isActive}
        className={cn(
          'flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-none px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-xs data-[size=sm]:text-xs data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarMenuSubButton.displayName = 'Sidebar.MenuSubButton';
