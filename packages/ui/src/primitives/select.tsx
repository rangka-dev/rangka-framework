import { Select as BaseSelect } from '@base-ui/react/select';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';

export type SelectProps = {
  /** The controlled value */
  value?: string;
  /** The default uncontrolled value */
  defaultValue?: string;
  /** Called when the value changes */
  onValueChange?: (value: string | null) => void;
  /** Whether the popup is open (controlled) */
  open?: boolean;
  /** Default open state */
  defaultOpen?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Whether the select is disabled */
  disabled?: boolean;
  children?: ReactNode;
};

export type SelectTriggerProps = ComponentProps<'button'>;

export type SelectValueProps = ComponentProps<'span'> & {
  /** Text shown when no value is selected */
  placeholder?: string;
};

export type SelectContentProps = ComponentProps<'div'>;

export type SelectItemProps = ComponentProps<'div'> & {
  /** Unique value identifying this item */
  value: string;
  /** Whether this item is disabled */
  disabled?: boolean;
};

export type SelectGroupProps = ComponentProps<'div'> & {
  /** Accessible label for the group */
  label?: string;
};

const SelectRoot = ({
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
  children,
}: SelectProps) => {
  return (
    <BaseSelect.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (val) => onValueChange(val) : undefined}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}
      disabled={disabled}
    >
      {children}
    </BaseSelect.Root>
  );
};

const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BaseSelect.Trigger
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      >
        {children}
      </BaseSelect.Trigger>
    );
  },
);
SelectTrigger.displayName = 'Select.Trigger';

const SelectValue = forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ className, placeholder, ...props }, ref) => {
    return (
      <BaseSelect.Value
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        placeholder={placeholder}
        {...props}
      />
    );
  },
);
SelectValue.displayName = 'Select.Value';

const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BaseSelect.Portal>
        <BaseSelect.Positioner>
          <BaseSelect.Popup
            ref={ref}
            className={typeof className === 'string' ? className : undefined}
            {...props}
          >
            {children}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    );
  },
);
SelectContent.displayName = 'Select.Content';

const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value, disabled, children, ...props }, ref) => {
    return (
      <BaseSelect.Item
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        value={value}
        disabled={disabled}
        {...props}
      >
        <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
      </BaseSelect.Item>
    );
  },
);
SelectItem.displayName = 'Select.Item';

const SelectGroup = forwardRef<HTMLDivElement, SelectGroupProps>(
  ({ className, label, children, ...props }, ref) => {
    return (
      <BaseSelect.Group
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      >
        {label && <BaseSelect.GroupLabel>{label}</BaseSelect.GroupLabel>}
        {children}
      </BaseSelect.Group>
    );
  },
);
SelectGroup.displayName = 'Select.Group';

export const Select = Object.assign(SelectRoot, {
  Trigger: SelectTrigger,
  Value: SelectValue,
  Content: SelectContent,
  Item: SelectItem,
  Group: SelectGroup,
});
