import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export type ContextMenuProps = {
  children?: ReactNode;
};

export type ContextMenuTriggerProps = ComponentProps<'div'>;

export type ContextMenuContentProps = ComponentProps<'div'>;

export type ContextMenuItemProps = ComponentProps<'div'> & {
  /** Whether this item is disabled */
  disabled?: boolean;
};

export type ContextMenuLabelProps = ComponentProps<'div'>;

export type ContextMenuSeparatorProps = ComponentProps<'div'>;

export type ContextMenuGroupProps = ComponentProps<'div'>;

const ContextMenuRoot = ({ children }: ContextMenuProps) => {
  return <BaseContextMenu.Root>{children}</BaseContextMenu.Root>;
};

const ContextMenuTrigger = forwardRef<HTMLDivElement, ContextMenuTriggerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BaseContextMenu.Trigger ref={ref} className={cn(className)} {...props}>
        {children}
      </BaseContextMenu.Trigger>
    );
  },
);
ContextMenuTrigger.displayName = 'ContextMenu.Trigger';

const ContextMenuContent = forwardRef<HTMLDivElement, ContextMenuContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BaseContextMenu.Portal>
        <BaseContextMenu.Positioner>
          <BaseContextMenu.Popup
            ref={ref}
            className={cn(
              'z-50 min-w-[8rem] rounded-md border border-[var(--color-border)] bg-[var(--color-popover)] p-1 shadow-md',
              className,
            )}
            {...props}
          >
            {children}
          </BaseContextMenu.Popup>
        </BaseContextMenu.Positioner>
      </BaseContextMenu.Portal>
    );
  },
);
ContextMenuContent.displayName = 'ContextMenu.Content';

const ContextMenuItem = forwardRef<HTMLDivElement, ContextMenuItemProps>(
  ({ className, disabled, children, ...props }, ref) => {
    return (
      <BaseContextMenu.Item
        ref={ref}
        className={cn(
          'relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-[var(--color-accent)] data-[highlighted]:text-[var(--color-accent-foreground)]',
          disabled && 'pointer-events-none opacity-50',
          className,
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </BaseContextMenu.Item>
    );
  },
);
ContextMenuItem.displayName = 'ContextMenu.Item';

const ContextMenuLabel = forwardRef<HTMLDivElement, ContextMenuLabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseContextMenu.GroupLabel
        ref={ref}
        className={cn(
          'px-2 py-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]',
          className,
        )}
        {...props}
      />
    );
  },
);
ContextMenuLabel.displayName = 'ContextMenu.Label';

const ContextMenuSeparator = forwardRef<HTMLDivElement, ContextMenuSeparatorProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseContextMenu.Separator
        ref={ref}
        className={cn('-mx-1 my-1 h-px bg-[var(--color-border)]', className)}
        {...props}
      />
    );
  },
);
ContextMenuSeparator.displayName = 'ContextMenu.Separator';

const ContextMenuGroup = forwardRef<HTMLDivElement, ContextMenuGroupProps>(
  ({ className, ...props }, ref) => {
    return <BaseContextMenu.Group ref={ref} className={cn(className)} {...props} />;
  },
);
ContextMenuGroup.displayName = 'ContextMenu.Group';

export const ContextMenu = Object.assign(ContextMenuRoot, {
  Trigger: ContextMenuTrigger,
  Content: ContextMenuContent,
  Item: ContextMenuItem,
  Label: ContextMenuLabel,
  Separator: ContextMenuSeparator,
  Group: ContextMenuGroup,
});
