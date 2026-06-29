import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

export type CheckboxProps = Omit<ComponentProps<'span'>, 'onChange'> & {
  /** Whether the checkbox is checked */
  checked?: boolean;
  /** Default checked state (uncontrolled) */
  defaultChecked?: boolean;
  /** Called when checked state changes */
  onCheckedChange?: (checked: boolean) => void;
  /** Show indeterminate state */
  indeterminate?: boolean;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
};

export type CheckboxIndicatorProps = ComponentProps<'span'>;

const Root = forwardRef<HTMLElement, CheckboxProps>(
  (
    { className, checked, defaultChecked, onCheckedChange, indeterminate, disabled, ...props },
    ref,
  ) => (
    <BaseCheckbox.Root
      ref={ref}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      indeterminate={indeterminate}
      disabled={disabled}
      className={(state) =>
        cn(
          'h-4 w-4 shrink-0 rounded-sm border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          state.checked && 'bg-primary border-primary text-primary-foreground',
          state.disabled && 'cursor-not-allowed opacity-50',
          typeof className === 'string' ? className : undefined,
        )
      }
      {...props}
    />
  ),
);
Root.displayName = 'Checkbox';

const Indicator = forwardRef<HTMLSpanElement, CheckboxIndicatorProps>(
  ({ className, children, ...props }, ref) => (
    <BaseCheckbox.Indicator
      ref={ref}
      className={(state) =>
        cn(
          'flex items-center justify-center text-current',
          !state.checked && !state.indeterminate && 'opacity-0',
          typeof className === 'string' ? className : undefined,
        )
      }
      {...props}
    >
      {children}
    </BaseCheckbox.Indicator>
  ),
);
Indicator.displayName = 'Checkbox.Indicator';

export const Checkbox = Object.assign(Root, { Indicator });
