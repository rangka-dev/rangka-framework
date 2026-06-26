import { OTPField as BaseOTPField } from '@base-ui/react/otp-field';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

export type InputOTPProps = Omit<ComponentProps<'div'>, 'onChange'> & {
  /** The controlled OTP value */
  value?: string;
  /** Default OTP value (uncontrolled) */
  defaultValue?: string;
  /** Called when the OTP value changes */
  onValueChange?: (value: string) => void;
  /** Number of OTP input slots */
  length: number;
  /** Whether the field is disabled */
  disabled?: boolean;
};

export type InputOTPGroupProps = ComponentProps<'div'>;

export type InputOTPSlotProps = ComponentProps<'input'>;

const Root = forwardRef<HTMLDivElement, InputOTPProps>(
  ({ className, value, defaultValue, onValueChange, length, disabled, ...props }, ref) => (
    <BaseOTPField.Root
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      length={length}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2',
        typeof className === 'string' ? className : undefined,
      )}
      {...props}
    />
  ),
);
Root.displayName = 'InputOTP';

const Group = forwardRef<HTMLDivElement, InputOTPGroupProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-1', typeof className === 'string' ? className : undefined)}
    {...props}
  />
));
Group.displayName = 'InputOTP.Group';

const Slot = forwardRef<HTMLInputElement, InputOTPSlotProps>(({ className, ...props }, ref) => (
  <BaseOTPField.Input
    ref={ref}
    className={(state) =>
      cn(
        'h-10 w-10 rounded-md border border-border bg-transparent text-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        state.filled && 'border-primary',
        state.disabled && 'cursor-not-allowed opacity-50',
        typeof className === 'string' ? className : undefined,
      )
    }
    {...props}
  />
));
Slot.displayName = 'InputOTP.Slot';

export const InputOTP = Object.assign(Root, { Group, Slot });
