import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const toggleVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[pressed]:bg-accent data-[pressed]:text-accent-foreground',
  {
    variants: {
      variant: {
        default: 'bg-transparent hover:bg-muted hover:text-muted-foreground',
        outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        sm: 'h-8 px-2',
        md: 'h-9 px-3',
        lg: 'h-10 px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export type ToggleProps = Omit<ComponentProps<'button'>, 'value'> &
  VariantProps<typeof toggleVariants> & {
    /** Whether the toggle is pressed (controlled) */
    pressed?: boolean;
    /** Whether the toggle is pressed initially (uncontrolled) */
    defaultPressed?: boolean;
    /** Callback fired when pressed state changes */
    onPressedChange?: (pressed: boolean) => void;
  };

export const Toggle = ({
  className,
  variant,
  size,
  pressed,
  defaultPressed,
  onPressedChange,
  ...props
}: ToggleProps & { ref?: React.Ref<HTMLButtonElement> }) => (
  <BaseToggle
    ref={props.ref}
    pressed={pressed}
    defaultPressed={defaultPressed}
    onPressedChange={onPressedChange}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
);

Toggle.displayName = 'Toggle';

export { toggleVariants };
