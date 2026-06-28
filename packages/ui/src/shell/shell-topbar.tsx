import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

// --- Shell.TopBar ---

export type ShellTopBarProps = ComponentProps<'div'>;

const ShellTopBarRoot = forwardRef<HTMLDivElement, ShellTopBarProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-topbar"
      className={cn('flex h-10 shrink-0 items-center px-3.5', className)}
      {...props}
    />
  ),
);
ShellTopBarRoot.displayName = 'Shell.TopBar';

// --- Shell.TopBar.Start ---

export type ShellTopBarStartProps = ComponentProps<'div'>;

const ShellTopBarStart = forwardRef<HTMLDivElement, ShellTopBarStartProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-topbar-start"
      className={cn('flex flex-1 shrink-0 items-center gap-1.5', className)}
      {...props}
    />
  ),
);
ShellTopBarStart.displayName = 'Shell.TopBar.Start';

// --- Shell.TopBar.Center ---

export type ShellTopBarCenterProps = ComponentProps<'div'>;

const ShellTopBarCenter = forwardRef<HTMLDivElement, ShellTopBarCenterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-topbar-center"
      className={cn('shrink-0', className)}
      {...props}
    />
  ),
);
ShellTopBarCenter.displayName = 'Shell.TopBar.Center';

// --- Shell.TopBar.End ---

export type ShellTopBarEndProps = ComponentProps<'div'>;

const ShellTopBarEnd = forwardRef<HTMLDivElement, ShellTopBarEndProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-topbar-end"
      className={cn('flex flex-1 items-center justify-end gap-1', className)}
      {...props}
    />
  ),
);
ShellTopBarEnd.displayName = 'Shell.TopBar.End';

export const ShellTopBar = Object.assign(ShellTopBarRoot, {
  Start: ShellTopBarStart,
  Center: ShellTopBarCenter,
  End: ShellTopBarEnd,
});
