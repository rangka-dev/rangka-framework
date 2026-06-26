import { Group, Panel, Separator, type GroupImperativeHandle } from 'react-resizable-panels';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export type SplitProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Panel children (use Split.Panel) */
  children?: ReactNode;
};

export type SplitPanelProps = {
  /** Default size as percentage (0-100) */
  defaultSize?: number;
  /** Minimum size as percentage */
  minSize?: number;
  /** Maximum size as percentage */
  maxSize?: number;
  /** Whether the panel is collapsible */
  collapsible?: boolean;
  children?: ReactNode;
  className?: string;
};

export type SplitHandleProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** Show a visible drag handle indicator */
  withHandle?: boolean;
};

const SplitRoot = forwardRef<HTMLDivElement, SplitProps>(
  ({ className, direction = 'horizontal', children, ...props }, ref) => {
    return (
      <Group
        groupRef={ref as React.RefObject<GroupImperativeHandle | null>}
        orientation={direction}
        className={cn('flex h-full w-full', className)}
        {...props}
      >
        {children}
      </Group>
    );
  },
);
SplitRoot.displayName = 'Split';

const SplitPanel = ({
  defaultSize,
  minSize = 10,
  maxSize,
  collapsible,
  children,
  className,
}: SplitPanelProps) => {
  return (
    <Panel
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      collapsible={collapsible}
      className={className}
    >
      {children}
    </Panel>
  );
};
SplitPanel.displayName = 'Split.Panel';

const SplitHandle = forwardRef<HTMLDivElement, SplitHandleProps>(
  ({ className, withHandle, ...props }, ref) => {
    return (
      <Separator
        elementRef={ref as React.RefObject<HTMLDivElement | null>}
        className={cn(
          'relative flex w-px items-center justify-center bg-[var(--color-border)] after:absolute after:inset-y-0 after:-left-1 after:-right-1 after:content-[""] data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full data-[orientation=vertical]:after:inset-x-0 data-[orientation=vertical]:after:-top-1 data-[orientation=vertical]:after:-bottom-1',
          className,
        )}
        {...props}
      >
        {withHandle && (
          <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border border-[var(--color-border)] bg-[var(--color-border)]">
            <svg
              width="6"
              height="10"
              viewBox="0 0 6 10"
              fill="none"
              className="text-[var(--color-muted-foreground)]"
            >
              <circle cx="1" cy="1" r="0.75" fill="currentColor" />
              <circle cx="1" cy="5" r="0.75" fill="currentColor" />
              <circle cx="1" cy="9" r="0.75" fill="currentColor" />
              <circle cx="5" cy="1" r="0.75" fill="currentColor" />
              <circle cx="5" cy="5" r="0.75" fill="currentColor" />
              <circle cx="5" cy="9" r="0.75" fill="currentColor" />
            </svg>
          </div>
        )}
      </Separator>
    );
  },
);
SplitHandle.displayName = 'Split.Handle';

export const Split = Object.assign(SplitRoot, {
  Panel: SplitPanel,
  Handle: SplitHandle,
});
