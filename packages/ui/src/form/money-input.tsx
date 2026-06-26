import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const moneyInputVariants = cva(
  'flex items-center rounded-md border border-border transition-colors',
  {
    variants: {
      size: {
        sm: 'h-8 text-xs',
        md: 'h-9 text-sm',
        lg: 'h-10 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export type MoneyInputProps = Omit<ComponentProps<'input'>, 'size' | 'value' | 'onChange'> &
  VariantProps<typeof moneyInputVariants> & {
    /** Currency symbol or code displayed as prefix */
    currency?: string;
    /** Current numeric value */
    value?: number | null;
    /** Called with the numeric value on change */
    onChange?: (value: number | null) => void;
  };

const MoneyInputRoot = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, size, currency = '$', value, onChange, disabled, ...props }, ref) => {
    const displayValue = value != null ? value.toString() : '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      if (text === '') {
        onChange?.(null);
        return;
      }
      const num = parseFloat(text);
      if (!isNaN(num)) {
        onChange?.(num);
      }
    };

    return (
      <div
        className={cn(
          moneyInputVariants({ size, className }),
          disabled && 'opacity-50 pointer-events-none',
        )}
      >
        <span className="flex items-center border-r border-border bg-muted px-2 text-muted-foreground h-full rounded-l-md">
          {currency}
        </span>
        <input
          ref={ref}
          type="number"
          step="0.01"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          className="h-full w-full bg-transparent px-3 outline-none placeholder:text-muted-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          {...props}
        />
      </div>
    );
  },
);
MoneyInputRoot.displayName = 'MoneyInput';

export const MoneyInput = MoneyInputRoot;

export { moneyInputVariants };
