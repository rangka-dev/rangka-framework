import { forwardRef, type ComponentProps } from 'react';
import { PanelLeft } from 'lucide-react';
import { cn } from '../lib/cn';
import { Icon } from '../primitives/icon';
import { useShell } from './shell-context';

// --- Shell.Main ---

export type ShellMainProps = ComponentProps<'main'>;

const ShellMainRoot = forwardRef<HTMLElement, ShellMainProps>(({ className, ...props }, ref) => (
  <main
    ref={ref}
    data-slot="shell-main"
    className={cn(
      'relative flex h-full w-full flex-1 flex-col overflow-hidden bg-surface',
      className,
    )}
    {...props}
  />
));
ShellMainRoot.displayName = 'Shell.Main';

// --- Shell.Main.Header ---

export type ShellMainHeaderProps = ComponentProps<'div'>;

const ShellMainHeader = forwardRef<HTMLDivElement, ShellMainHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-main-header"
      className={cn(
        'flex h-11 shrink-0 items-center gap-2 border-b border-border-subtle bg-surface px-5',
        className,
      )}
      {...props}
    />
  ),
);
ShellMainHeader.displayName = 'Shell.Main.Header';

// --- Shell.Main.Toggle ---

export type ShellMainToggleProps = ComponentProps<'button'>;

const ShellMainToggle = forwardRef<HTMLButtonElement, ShellMainToggleProps>(
  ({ className, ...props }, ref) => {
    const { sidebarOpen, toggleSidebar } = useShell();

    if (sidebarOpen) return null;

    return (
      <button
        ref={ref}
        data-slot="shell-main-toggle"
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
ShellMainToggle.displayName = 'Shell.Main.Toggle';

// --- Shell.Main.Actions ---

export type ShellMainActionsProps = ComponentProps<'div'>;

const ShellMainActions = forwardRef<HTMLDivElement, ShellMainActionsProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-main-actions"
      className={cn('ml-auto flex items-center gap-2', className)}
      {...props}
    />
  ),
);
ShellMainActions.displayName = 'Shell.Main.Actions';

// --- Shell.Main.Body ---

export type ShellMainBodyProps = ComponentProps<'div'>;

const ShellMainBody = forwardRef<HTMLDivElement, ShellMainBodyProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="shell-main-body"
      className={cn('flex-1 overflow-auto', className)}
      {...props}
    />
  ),
);
ShellMainBody.displayName = 'Shell.Main.Body';

export const ShellMain = Object.assign(ShellMainRoot, {
  Header: ShellMainHeader,
  Toggle: ShellMainToggle,
  Actions: ShellMainActions,
  Body: ShellMainBody,
});
