import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import { type ComponentProps, type Ref } from 'react';
import { cn } from '../lib/cn';

export type ToggleGroupProps = Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue'> & {
  /** The controlled value of pressed items */
  value?: string[];
  /** Default pressed items (uncontrolled) */
  defaultValue?: string[];
  /** Called when pressed items change */
  onValueChange?: (value: string[]) => void;
  /** Whether the entire group is disabled */
  disabled?: boolean;
  /** Whether multiple items can be pressed */
  multiple?: boolean;
  ref?: Ref<HTMLDivElement>;
};

export type ToggleGroupItemProps = Omit<ComponentProps<'button'>, 'value'> & {
  /** Unique value identifying this toggle item */
  value: string;
  /** Whether this item is disabled */
  disabled?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

function Root({
  className,
  value,
  defaultValue,
  onValueChange,
  disabled,
  multiple,
  ref,
  ...props
}: ToggleGroupProps) {
  return (
    <BaseToggleGroup
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      multiple={multiple}
      className={(state) =>
        cn(
          'inline-flex items-center rounded-md border border-[var(--color-border)]',
          state.disabled && 'opacity-50',
          typeof className === 'string' ? className : undefined,
        )
      }
      {...props}
    />
  );
}
Root.displayName = 'ToggleGroup';

function Item({ className, value, children, ref, ...props }: ToggleGroupItemProps) {
  return (
    <BaseToggle
      ref={ref}
      value={value}
      className={(state) =>
        cn(
          'inline-flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
          state.pressed && 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
          state.disabled && 'pointer-events-none opacity-50',
          typeof className === 'string' ? className : undefined,
        )
      }
      {...props}
    >
      {children}
    </BaseToggle>
  );
}
Item.displayName = 'ToggleGroup.Item';

export const ToggleGroup = Object.assign(Root, { Item });
