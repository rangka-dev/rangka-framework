import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { useShell } from './shell-context';

// --- Shell.Body ---

export type ShellBodyProps = ComponentProps<'div'>;

const ShellBody = forwardRef<HTMLDivElement, ShellBodyProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="shell-body"
    className={cn('flex flex-1 flex-row overflow-hidden', className)}
    {...props}
  />
));
ShellBody.displayName = 'Shell.Body';

// --- Shell.Panel ---

export type ShellPanelProps = ComponentProps<'div'>;

const ShellPanel = forwardRef<HTMLDivElement, ShellPanelProps>(
  ({ className, children, ...props }, ref) => {
    const { railDocked } = useShell();
    return (
      <div
        ref={ref}
        data-slot="shell-panel"
        className={cn(
          'relative flex flex-1 flex-col overflow-hidden pb-2 pr-2',
          !railDocked && 'pl-2',
          className,
        )}
        {...props}
      >
        <div className="flex h-full w-full flex-row overflow-hidden rounded-lg border border-border-subtle">
          {children}
        </div>
      </div>
    );
  },
);
ShellPanel.displayName = 'Shell.Panel';

export { ShellBody, ShellPanel };
