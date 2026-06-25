import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';

export type ComboboxProps = {
  /** The controlled selected value */
  value?: string;
  /** The default uncontrolled value */
  defaultValue?: string;
  /** Called when the selected value changes */
  onValueChange?: (value: string | null) => void;
  /** Whether the popup is open (controlled) */
  open?: boolean;
  /** Default open state */
  defaultOpen?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};

export type ComboboxInputProps = ComponentProps<'input'> & {
  /** Placeholder text */
  placeholder?: string;
};

export type ComboboxContentProps = ComponentProps<'div'>;

export type ComboboxItemProps = ComponentProps<'div'> & {
  /** Unique value identifying this item */
  value: string;
  /** Whether this item is disabled */
  disabled?: boolean;
};

export type ComboboxGroupProps = ComponentProps<'div'> & {
  /** Accessible label for the group */
  label?: string;
};

const ComboboxRoot = ({
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  children,
}: ComboboxProps) => {
  return (
    <BaseCombobox.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (val) => onValueChange(val) : undefined}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}
    >
      {children}
    </BaseCombobox.Root>
  );
};

const ComboboxInput = forwardRef<HTMLInputElement, ComboboxInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseCombobox.Input
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      />
    );
  },
);
ComboboxInput.displayName = 'Combobox.Input';

const ComboboxContent = forwardRef<HTMLDivElement, ComboboxContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner>
          <BaseCombobox.Popup
            ref={ref}
            className={typeof className === 'string' ? className : undefined}
            {...props}
          >
            {children}
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    );
  },
);
ComboboxContent.displayName = 'Combobox.Content';

const ComboboxItem = forwardRef<HTMLDivElement, ComboboxItemProps>(
  ({ className, value, disabled, children, ...props }, ref) => {
    return (
      <BaseCombobox.Item
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        value={value}
        disabled={disabled}
        {...props}
      >
        {children}
      </BaseCombobox.Item>
    );
  },
);
ComboboxItem.displayName = 'Combobox.Item';

const ComboboxGroup = forwardRef<HTMLDivElement, ComboboxGroupProps>(
  ({ className, label, children, ...props }, ref) => {
    return (
      <BaseCombobox.Group
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      >
        {label && <BaseCombobox.GroupLabel>{label}</BaseCombobox.GroupLabel>}
        {children}
      </BaseCombobox.Group>
    );
  },
);
ComboboxGroup.displayName = 'Combobox.Group';

export const Combobox = Object.assign(ComboboxRoot, {
  Input: ComboboxInput,
  Content: ComboboxContent,
  Item: ComboboxItem,
  Group: ComboboxGroup,
});
