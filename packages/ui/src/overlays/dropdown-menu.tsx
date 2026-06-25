import { Menu as BaseMenu } from '@base-ui/react/menu';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export type DropdownMenuProps = {
  /** Whether the menu is open (controlled) */
  open?: boolean;
  /** Whether the menu is initially open */
  defaultOpen?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};

export type DropdownMenuTriggerProps = ComponentProps<'button'>;

export type DropdownMenuContentProps = ComponentProps<'div'>;

export type DropdownMenuItemProps = ComponentProps<'div'> & {
  /** Whether this item is disabled */
  disabled?: boolean;
};

export type DropdownMenuLabelProps = ComponentProps<'div'>;

export type DropdownMenuSeparatorProps = ComponentProps<'div'>;

export type DropdownMenuGroupProps = ComponentProps<'div'>;

const DropdownMenuRoot = ({ open, defaultOpen, onOpenChange, children }: DropdownMenuProps) => {
  return (
    <BaseMenu.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}
    >
      {children}
    </BaseMenu.Root>
  );
};

const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BaseMenu.Trigger
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      >
        {children}
      </BaseMenu.Trigger>
    );
  },
);
DropdownMenuTrigger.displayName = 'DropdownMenu.Trigger';

const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BaseMenu.Portal>
        <BaseMenu.Positioner>
          <BaseMenu.Popup
            ref={ref}
            className={cn(
              'z-50 min-w-[8rem] rounded-md border border-[var(--color-border)] bg-[var(--color-popover)] p-1 shadow-md',
              className,
            )}
            {...props}
          >
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    );
  },
);
DropdownMenuContent.displayName = 'DropdownMenu.Content';

const DropdownMenuItem = forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, disabled, children, ...props }, ref) => {
    return (
      <BaseMenu.Item
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
      </BaseMenu.Item>
    );
  },
);
DropdownMenuItem.displayName = 'DropdownMenu.Item';

const DropdownMenuLabel = forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseMenu.GroupLabel
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
DropdownMenuLabel.displayName = 'DropdownMenu.Label';

const DropdownMenuSeparator = forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseMenu.Separator
        ref={ref}
        className={cn('-mx-1 my-1 h-px bg-[var(--color-border)]', className)}
        {...props}
      />
    );
  },
);
DropdownMenuSeparator.displayName = 'DropdownMenu.Separator';

const DropdownMenuGroup = forwardRef<HTMLDivElement, DropdownMenuGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseMenu.Group
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      />
    );
  },
);
DropdownMenuGroup.displayName = 'DropdownMenu.Group';

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Item: DropdownMenuItem,
  Label: DropdownMenuLabel,
  Separator: DropdownMenuSeparator,
  Group: DropdownMenuGroup,
});
