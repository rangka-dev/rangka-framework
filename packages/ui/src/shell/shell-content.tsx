import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

// --- ShellContent ---

export type ShellContentProps = ComponentProps<'div'>;

const ShellContentRoot = forwardRef<HTMLDivElement, ShellContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-content"
      className={cn('flex flex-1 flex-col overflow-hidden', className)}
      {...props}
    />
  ),
);
ShellContentRoot.displayName = 'ShellContent';

export type ShellContentHeaderProps = ComponentProps<'header'>;

const ShellContentHeader = forwardRef<HTMLElement, ShellContentHeaderProps>(
  ({ className, ...props }, ref) => (
    <header
      ref={ref}
      data-slot="shell-content-header"
      className={cn(
        'flex h-12 shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-background)] px-4',
        className,
      )}
      {...props}
    />
  ),
);
ShellContentHeader.displayName = 'ShellContent.Header';

export type ShellContentMainProps = ComponentProps<'main'>;

const ShellContentMain = forwardRef<HTMLElement, ShellContentMainProps>(
  ({ className, ...props }, ref) => (
    <main
      ref={ref}
      data-slot="shell-content-main"
      className={cn('flex-1 overflow-auto bg-[var(--color-muted)]', className)}
      {...props}
    />
  ),
);
ShellContentMain.displayName = 'ShellContent.Main';

export const ShellContent = Object.assign(ShellContentRoot, {
  Header: ShellContentHeader,
  Main: ShellContentMain,
});
