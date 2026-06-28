import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

// --- Shell.Rail ---

export type ShellRailProps = ComponentProps<'nav'>;

const ShellRailRoot = forwardRef<HTMLElement, ShellRailProps>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    data-slot="shell-rail"
    className={cn('flex h-full w-15 shrink-0 flex-col justify-between px-2 py-3', className)}
    {...props}
  />
));
ShellRailRoot.displayName = 'Shell.Rail';

// --- Shell.RailItem ---

export type ShellRailItemProps = ComponentProps<'a'> & {
  /** Whether this rail item is the active module */
  active?: boolean;
};

const ShellRailItem = forwardRef<HTMLAnchorElement, ShellRailItemProps>(
  ({ className, active = false, children, ...props }, ref) => (
    <a
      ref={ref}
      data-slot="shell-rail-item"
      data-active={active}
      className={cn(
        'group flex flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors',
        'hover:text-foreground',
        'data-[active=true]:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  ),
);
ShellRailItem.displayName = 'Shell.RailItem';

// --- Shell.RailIcon ---

export type ShellRailIconProps = ComponentProps<'div'>;

const ShellRailIcon = forwardRef<HTMLDivElement, ShellRailIconProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-rail-icon"
      className={cn(
        'flex size-8 items-center justify-center rounded-md',
        'group-data-[active=true]:bg-foreground/8',
        '[&>svg]:size-5 [&>svg]:shrink-0',
        '[&>img]:size-5 [&>img]:shrink-0',
        className,
      )}
      {...props}
    />
  ),
);
ShellRailIcon.displayName = 'Shell.RailIcon';

// --- Shell.RailLabel ---

export type ShellRailLabelProps = ComponentProps<'span'>;

const ShellRailLabel = forwardRef<HTMLSpanElement, ShellRailLabelProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="shell-rail-label"
      className={cn('text-[11px] font-medium leading-tight', className)}
      {...props}
    />
  ),
);
ShellRailLabel.displayName = 'Shell.RailLabel';

// --- Shell.RailSeparator ---

export type ShellRailSeparatorProps = ComponentProps<'div'>;

const ShellRailSeparator = forwardRef<HTMLDivElement, ShellRailSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-rail-separator"
      className={cn('mx-2 border-t border-border-strong', className)}
      {...props}
    />
  ),
);
ShellRailSeparator.displayName = 'Shell.RailSeparator';

// --- Shell.RailGroup ---

export type ShellRailGroupProps = ComponentProps<'div'>;

const ShellRailGroup = forwardRef<HTMLDivElement, ShellRailGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-rail-group"
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  ),
);
ShellRailGroup.displayName = 'Shell.RailGroup';

export const ShellRail = Object.assign(ShellRailRoot, {
  Item: ShellRailItem,
  Icon: ShellRailIcon,
  Label: ShellRailLabel,
  Separator: ShellRailSeparator,
  Group: ShellRailGroup,
});
