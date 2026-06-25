import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

export type SidebarGroupProps = ComponentProps<'div'>;

export const SidebarGroup = forwardRef<HTMLDivElement, SidebarGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
      {...props}
    />
  ),
);
SidebarGroup.displayName = 'Sidebar.Group';

export type SidebarGroupLabelProps = ComponentProps<'div'> & { asChild?: boolean };

export const SidebarGroupLabel = forwardRef<HTMLDivElement, SidebarGroupLabelProps>(
  ({ className, asChild: _asChild = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="sidebar-group-label"
        data-sidebar="group-label"
        className={cn(
          'flex h-8 shrink-0 items-center rounded-none px-2 text-xs text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarGroupLabel.displayName = 'Sidebar.GroupLabel';

export type SidebarGroupActionProps = ComponentProps<'button'> & { asChild?: boolean };

export const SidebarGroupAction = forwardRef<HTMLButtonElement, SidebarGroupActionProps>(
  ({ className, asChild: _asChild = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        data-slot="sidebar-group-action"
        data-sidebar="group-action"
        className={cn(
          'absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-none p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0',
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarGroupAction.displayName = 'Sidebar.GroupAction';

export type SidebarGroupContentProps = ComponentProps<'div'>;

export const SidebarGroupContent = forwardRef<HTMLDivElement, SidebarGroupContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn('w-full text-xs', className)}
      {...props}
    />
  ),
);
SidebarGroupContent.displayName = 'Sidebar.GroupContent';
