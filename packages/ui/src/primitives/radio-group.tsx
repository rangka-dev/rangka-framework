import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

export type RadioGroupProps = Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue'> & {
  /** The controlled value of the selected radio */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Called when selected value changes */
  onValueChange?: (value: string) => void;
  /** Whether the entire group is disabled */
  disabled?: boolean;
};

export type RadioGroupItemProps = Omit<ComponentProps<'span'>, 'value'> & {
  /** The unique value for this radio item */
  value: string;
  /** Whether this item is disabled */
  disabled?: boolean;
};

export type RadioGroupIndicatorProps = ComponentProps<'span'>;

function Root({
  className,
  value,
  defaultValue,
  onValueChange,
  disabled,
  ...props
}: RadioGroupProps) {
  return (
    <BaseRadioGroup
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      className={typeof className === 'string' ? className : cn('grid gap-2')}
      {...props}
    />
  );
}
Root.displayName = 'RadioGroup';

function Item({ className, value, children, ...props }: RadioGroupItemProps) {
  return (
    <BaseRadio.Root
      value={value}
      className={(state) =>
        cn(
          'aspect-square h-4 w-4 rounded-full border border-[var(--color-border)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
          state.checked && 'border-[var(--color-primary)] text-[var(--color-primary)]',
          state.disabled && 'cursor-not-allowed opacity-50',
          typeof className === 'string' ? className : undefined,
        )
      }
      {...props}
    >
      {children}
    </BaseRadio.Root>
  );
}
Item.displayName = 'RadioGroup.Item';

const Indicator = forwardRef<HTMLSpanElement, RadioGroupIndicatorProps>(
  ({ className, ...props }, ref) => (
    <BaseRadio.Indicator
      ref={ref}
      className={(state) =>
        cn(
          'flex items-center justify-center',
          !state.checked && 'opacity-0',
          typeof className === 'string' ? className : undefined,
        )
      }
      {...props}
    >
      <span className="h-2.5 w-2.5 rounded-full bg-current" />
    </BaseRadio.Indicator>
  ),
);
Indicator.displayName = 'RadioGroup.Indicator';

export const RadioGroup = Object.assign(Root, { Item, Indicator });
