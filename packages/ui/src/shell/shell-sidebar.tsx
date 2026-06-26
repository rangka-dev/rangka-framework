import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { ChevronDown, PanelLeft } from 'lucide-react';
import { cn } from '../lib/cn';
import { Icon } from '../primitives/icon';
import { useShell } from './shell-context';
import { Collapsible } from '../layout/collapsible';

// --- Shell.Sidebar ---

export type ShellSidebarProps = ComponentProps<'aside'>;

const ShellSidebarRoot = forwardRef<HTMLElement, ShellSidebarProps>(
  ({ className, children, ...props }, ref) => {
    const { sidebarWidth, sidebarOpen } = useShell();

    if (!sidebarOpen) return null;

    return (
      <aside
        ref={ref}
        data-slot="shell-sidebar"
        role="complementary"
        aria-label="Main sidebar"
        style={{ width: `${sidebarWidth}px` } as React.CSSProperties}
        className={cn(
          'relative flex h-full shrink-0 flex-col overflow-hidden border-r border-border-subtle bg-surface pt-4 transition-[width] duration-200',
          className,
        )}
        {...props}
      >
        {children}
        <ShellResizeHandle />
      </aside>
    );
  },
);
ShellSidebarRoot.displayName = 'Shell.Sidebar';

// --- Resize Handle ---

function ShellResizeHandle() {
  const { setSidebarWidth, sidebarWidth } = useShell();
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startXRef.current = e.clientX;
      startWidthRef.current = sidebarWidth;

      const handlePointerMove = (ev: PointerEvent) => {
        const delta = ev.clientX - startXRef.current;
        setSidebarWidth(startWidthRef.current + delta);
      };

      const handlePointerUp = () => {
        setIsDragging(false);
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    },
    [sidebarWidth, setSidebarWidth],
  );

  return (
    <div
      data-slot="shell-resize-handle"
      data-dragging={isDragging}
      onPointerDown={handlePointerDown}
      className={cn(
        'absolute right-0 top-0 z-10 h-full w-1 cursor-ew-resize select-none transition-colors',
        'hover:bg-border-strong',
        'data-[dragging=true]:bg-primary',
      )}
    />
  );
}

// --- Shell.Sidebar.Header ---

export type ShellSidebarHeaderProps = ComponentProps<'div'>;

const ShellSidebarHeader = forwardRef<HTMLDivElement, ShellSidebarHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-sidebar-header"
      className={cn('flex shrink-0 flex-col gap-3 px-3', className)}
      {...props}
    />
  ),
);
ShellSidebarHeader.displayName = 'Shell.Sidebar.Header';

// --- Shell.Sidebar.Title ---

export type ShellSidebarTitleProps = ComponentProps<'div'>;

const ShellSidebarTitle = forwardRef<HTMLDivElement, ShellSidebarTitleProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-sidebar-title"
      className={cn('flex h-7 items-center justify-between gap-2 px-2', className)}
      {...props}
    >
      {props.children}
    </div>
  ),
);
ShellSidebarTitle.displayName = 'Shell.Sidebar.Title';

// --- Shell.Sidebar.TitleText ---

export type ShellSidebarTitleTextProps = ComponentProps<'span'>;

const ShellSidebarTitleText = forwardRef<HTMLSpanElement, ShellSidebarTitleTextProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="shell-sidebar-title-text"
      className={cn('text-base font-medium text-foreground', className)}
      {...props}
    />
  ),
);
ShellSidebarTitleText.displayName = 'Shell.Sidebar.TitleText';

// --- Shell.Sidebar.Toggle ---

export type ShellSidebarToggleProps = ComponentProps<'button'>;

const ShellSidebarToggle = forwardRef<HTMLButtonElement, ShellSidebarToggleProps>(
  ({ className, ...props }, ref) => {
    const { toggleSidebar } = useShell();

    return (
      <button
        ref={ref}
        data-slot="shell-sidebar-toggle"
        type="button"
        onClick={toggleSidebar}
        className={cn(
          'inline-flex size-6 items-center justify-center rounded-md transition-colors',
          'text-foreground/65 hover:bg-foreground/6 hover:text-foreground active:bg-foreground/10',
          className,
        )}
        {...props}
      >
        <Icon icon={PanelLeft} size="sm" />
      </button>
    );
  },
);
ShellSidebarToggle.displayName = 'Shell.Sidebar.Toggle';

// --- Shell.Sidebar.Content ---

export type ShellSidebarContentProps = ComponentProps<'div'>;

const ShellSidebarContent = forwardRef<HTMLDivElement, ShellSidebarContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-sidebar-content"
      className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto', className)}
      {...props}
    />
  ),
);
ShellSidebarContent.displayName = 'Shell.Sidebar.Content';

// --- Shell.Sidebar.Footer ---

export type ShellSidebarFooterProps = ComponentProps<'div'>;

const ShellSidebarFooter = forwardRef<HTMLDivElement, ShellSidebarFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-sidebar-footer"
      className={cn('flex shrink-0 flex-col px-3 py-2', className)}
      {...props}
    />
  ),
);
ShellSidebarFooter.displayName = 'Shell.Sidebar.Footer';

// --- Shell.Sidebar.Group ---

export type ShellSidebarGroupProps = ComponentProps<'div'>;

const ShellSidebarGroup = forwardRef<HTMLDivElement, ShellSidebarGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-sidebar-group"
      className={cn('flex w-full flex-col px-3 py-1.5', className)}
      {...props}
    />
  ),
);
ShellSidebarGroup.displayName = 'Shell.Sidebar.Group';

// --- Shell.Sidebar.GroupLabel ---

export type ShellSidebarGroupLabelProps = ComponentProps<'div'>;

const ShellSidebarGroupLabel = forwardRef<HTMLDivElement, ShellSidebarGroupLabelProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-sidebar-group-label"
      className={cn('flex h-5 items-center text-2xs font-semibold text-foreground/50', className)}
      {...props}
    />
  ),
);
ShellSidebarGroupLabel.displayName = 'Shell.Sidebar.GroupLabel';

// --- Shell.Sidebar.CollapsibleGroup ---

export type ShellSidebarCollapsibleGroupProps = ComponentProps<'div'> & {
  /** Whether the group is open (controlled) */
  open?: boolean;
  /** Whether the group is initially open (uncontrolled) */
  defaultOpen?: boolean;
  /** Callback when the open state changes */
  onOpenChange?: (open: boolean) => void;
  /** The section label text */
  label: ReactNode;
};

const ShellSidebarCollapsibleGroup = forwardRef<HTMLDivElement, ShellSidebarCollapsibleGroupProps>(
  ({ className, open, defaultOpen = true, onOpenChange, label, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-sidebar-collapsible-group"
      className={cn('flex w-full flex-col px-3 py-1.5', className)}
      {...props}
    >
      <Collapsible open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <Collapsible.Trigger className="flex h-7 w-full cursor-pointer items-center justify-between rounded-sm px-1.5 py-1 text-2xs font-semibold text-foreground/50 transition-colors hover:bg-foreground/6 hover:text-foreground">
          <span>{label}</span>
          <div className="flex size-5 items-center justify-center">
            <Icon icon={ChevronDown} size="sm" />
          </div>
        </Collapsible.Trigger>
        <Collapsible.Content>{children}</Collapsible.Content>
      </Collapsible>
    </div>
  ),
);
ShellSidebarCollapsibleGroup.displayName = 'Shell.Sidebar.CollapsibleGroup';

// --- Shell.Sidebar.Menu ---

export type ShellSidebarMenuProps = ComponentProps<'ul'>;

const ShellSidebarMenu = forwardRef<HTMLUListElement, ShellSidebarMenuProps>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-slot="shell-sidebar-menu"
      className={cn('flex w-full flex-col gap-0.5', className)}
      {...props}
    />
  ),
);
ShellSidebarMenu.displayName = 'Shell.Sidebar.Menu';

// --- Shell.Sidebar.MenuItem ---

export type ShellSidebarMenuItemProps = ComponentProps<'li'>;

const ShellSidebarMenuItem = forwardRef<HTMLLIElement, ShellSidebarMenuItemProps>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-slot="shell-sidebar-menu-item"
      className={cn('relative', className)}
      {...props}
    />
  ),
);
ShellSidebarMenuItem.displayName = 'Shell.Sidebar.MenuItem';

// --- Shell.Sidebar.MenuButton ---

export type ShellSidebarMenuButtonProps = ComponentProps<'button'> & {
  /** Whether the button represents the active item */
  active?: boolean;
};

const ShellSidebarMenuButton = forwardRef<HTMLButtonElement, ShellSidebarMenuButtonProps>(
  ({ className, active = false, ...props }, ref) => (
    <button
      ref={ref}
      data-slot="shell-sidebar-menu-button"
      data-active={active}
      className={cn(
        'flex h-[30px] w-full items-center gap-1.5 rounded-md px-2 text-sm font-normal text-foreground/80 transition-colors',
        'hover:bg-foreground/6 hover:text-foreground',
        'data-[active=true]:bg-foreground/6 data-[active=true]:text-foreground',
        '[&>svg]:size-4 [&>svg]:shrink-0',
        '[&>img]:size-4 [&>img]:shrink-0',
        className,
      )}
      {...props}
    />
  ),
);
ShellSidebarMenuButton.displayName = 'Shell.Sidebar.MenuButton';

// --- Shell.Sidebar.MenuLink ---

export type ShellSidebarMenuLinkProps = ComponentProps<'a'> & {
  /** Whether the link represents the active item */
  active?: boolean;
};

const ShellSidebarMenuLink = forwardRef<HTMLAnchorElement, ShellSidebarMenuLinkProps>(
  ({ className, active = false, ...props }, ref) => (
    <a
      ref={ref}
      data-slot="shell-sidebar-menu-link"
      data-active={active}
      className={cn(
        'flex h-[30px] w-full items-center gap-1.5 rounded-md px-2 text-sm font-normal text-foreground/80 transition-colors',
        'hover:bg-foreground/6 hover:text-foreground',
        'data-[active=true]:bg-foreground/6 data-[active=true]:text-foreground',
        '[&>svg]:size-4 [&>svg]:shrink-0',
        '[&>img]:size-4 [&>img]:shrink-0',
        className,
      )}
      {...props}
    />
  ),
);
ShellSidebarMenuLink.displayName = 'Shell.Sidebar.MenuLink';

// --- Shell.Sidebar.MenuBadge ---

export type ShellSidebarMenuBadgeProps = ComponentProps<'span'>;

const ShellSidebarMenuBadge = forwardRef<HTMLSpanElement, ShellSidebarMenuBadgeProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="shell-sidebar-menu-badge"
      className={cn(
        'ml-auto flex h-5 min-w-5 items-center justify-center rounded px-1 text-[11px] font-medium tabular-nums text-muted-foreground',
        className,
      )}
      {...props}
    />
  ),
);
ShellSidebarMenuBadge.displayName = 'Shell.Sidebar.MenuBadge';

// --- Shell.Sidebar.MenuSub ---

export type ShellSidebarMenuSubProps = ComponentProps<'ul'>;

const ShellSidebarMenuSub = forwardRef<HTMLUListElement, ShellSidebarMenuSubProps>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-slot="shell-sidebar-menu-sub"
      className={cn(
        'ml-5 flex flex-col gap-0.5 border-l border-border-subtle pl-2 py-0.5',
        className,
      )}
      {...props}
    />
  ),
);
ShellSidebarMenuSub.displayName = 'Shell.Sidebar.MenuSub';

// --- Shell.Sidebar.MenuSubItem ---

export type ShellSidebarMenuSubItemProps = ComponentProps<'li'>;

const ShellSidebarMenuSubItem = forwardRef<HTMLLIElement, ShellSidebarMenuSubItemProps>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-slot="shell-sidebar-menu-sub-item"
      className={cn('relative', className)}
      {...props}
    />
  ),
);
ShellSidebarMenuSubItem.displayName = 'Shell.Sidebar.MenuSubItem';

// --- Shell.Sidebar.MenuSubButton ---

export type ShellSidebarMenuSubButtonProps = ComponentProps<'button'> & {
  active?: boolean;
};

const ShellSidebarMenuSubButton = forwardRef<HTMLButtonElement, ShellSidebarMenuSubButtonProps>(
  ({ className, active = false, ...props }, ref) => (
    <button
      ref={ref}
      data-slot="shell-sidebar-menu-sub-button"
      data-active={active}
      className={cn(
        'flex h-7 w-full items-center gap-1.5 rounded-md px-2 text-2xs font-normal text-foreground/80 transition-colors',
        'hover:bg-foreground/6 hover:text-foreground',
        'data-[active=true]:bg-foreground/6 data-[active=true]:font-medium data-[active=true]:text-foreground',
        className,
      )}
      {...props}
    />
  ),
);
ShellSidebarMenuSubButton.displayName = 'Shell.Sidebar.MenuSubButton';

export const ShellSidebar = Object.assign(ShellSidebarRoot, {
  Header: ShellSidebarHeader,
  Title: ShellSidebarTitle,
  TitleText: ShellSidebarTitleText,
  Toggle: ShellSidebarToggle,
  Content: ShellSidebarContent,
  Footer: ShellSidebarFooter,
  Group: ShellSidebarGroup,
  GroupLabel: ShellSidebarGroupLabel,
  CollapsibleGroup: ShellSidebarCollapsibleGroup,
  Menu: ShellSidebarMenu,
  MenuItem: ShellSidebarMenuItem,
  MenuButton: ShellSidebarMenuButton,
  MenuLink: ShellSidebarMenuLink,
  MenuBadge: ShellSidebarMenuBadge,
  MenuSub: ShellSidebarMenuSub,
  MenuSubItem: ShellSidebarMenuSubItem,
  MenuSubButton: ShellSidebarMenuSubButton,
});
