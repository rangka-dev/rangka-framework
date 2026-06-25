import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { useSidebar } from './sidebar-context';
import { Sheet } from '../overlays/sheet';

const SIDEBAR_WIDTH_MOBILE = '18rem';

export type SidebarRootProps = ComponentProps<'div'> & {
  /** Which side the sidebar appears on */
  side?: 'left' | 'right';
  /** Visual variant */
  variant?: 'sidebar' | 'floating' | 'inset';
  /** Collapse behavior */
  collapsible?: 'offcanvas' | 'icon' | 'none';
};

export const SidebarRoot = forwardRef<HTMLDivElement, SidebarRootProps>(
  (
    {
      side = 'left',
      variant = 'sidebar',
      collapsible = 'offcanvas',
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (collapsible === 'none') {
      return (
        <div
          ref={ref}
          data-slot="sidebar"
          className={cn(
            'flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      );
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <Sheet.Content
            data-sidebar="sidebar"
            data-slot="sidebar"
            data-mobile="true"
            className={cn(
              'w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden',
              className,
            )}
            style={{ '--sidebar-width': SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
            side={side}
          >
            <Sheet.Header className="sr-only">
              <Sheet.Title>Sidebar</Sheet.Title>
              <Sheet.Description>Navigation sidebar.</Sheet.Description>
            </Sheet.Header>
            <div className="flex h-full w-full flex-col">{children}</div>
          </Sheet.Content>
        </Sheet>
      );
    }

    return (
      <div
        ref={ref}
        className="group peer hidden text-sidebar-foreground md:block"
        data-state={state}
        data-collapsible={state === 'collapsed' ? collapsible : ''}
        data-variant={variant}
        data-side={side}
        data-slot="sidebar"
      >
        <div
          data-slot="sidebar-gap"
          className={cn(
            'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
            'group-data-[collapsible=offcanvas]:w-0',
            'group-data-[side=right]:rotate-180',
            variant === 'floating' || variant === 'inset'
              ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
              : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
          )}
        />
        <div
          data-slot="sidebar-container"
          data-side={side}
          className={cn(
            'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] md:flex',
            variant === 'floating' || variant === 'inset'
              ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
              : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l',
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            data-slot="sidebar-inner"
            className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-none group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
          >
            {children}
          </div>
        </div>
      </div>
    );
  },
);
SidebarRoot.displayName = 'Sidebar';
