import { NumberField } from '@base-ui/react/number-field';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';

export type NumberInputProps = {
  /** The controlled value */
  value?: number | null;
  /** The default uncontrolled value */
  defaultValue?: number;
  /** Called when the value changes */
  onValueChange?: (value: number | null) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
  children?: ReactNode;
};

export type NumberInputFieldProps = ComponentProps<'input'>;

export type NumberInputIncrementProps = ComponentProps<'button'>;

export type NumberInputDecrementProps = ComponentProps<'button'>;

const NumberInputRoot = ({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step,
  disabled,
  children,
}: NumberInputProps) => {
  return (
    <NumberField.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (val) => onValueChange(val) : undefined}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
    >
      {children}
    </NumberField.Root>
  );
};

const NumberInputField = forwardRef<HTMLInputElement, NumberInputFieldProps>(
  ({ className, ...props }, ref) => {
    return (
      <NumberField.Input
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      />
    );
  },
);
NumberInputField.displayName = 'NumberInput.Input';

const NumberInputIncrement = forwardRef<HTMLButtonElement, NumberInputIncrementProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <NumberField.Increment
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      >
        {children}
      </NumberField.Increment>
    );
  },
);
NumberInputIncrement.displayName = 'NumberInput.Increment';

const NumberInputDecrement = forwardRef<HTMLButtonElement, NumberInputDecrementProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <NumberField.Decrement
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      >
        {children}
      </NumberField.Decrement>
    );
  },
);
NumberInputDecrement.displayName = 'NumberInput.Decrement';

export const NumberInput = Object.assign(NumberInputRoot, {
  Input: NumberInputField,
  Increment: NumberInputIncrement,
  Decrement: NumberInputDecrement,
});
