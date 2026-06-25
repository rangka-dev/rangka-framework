import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

export type SwitchProps = Omit<ComponentProps<'span'>, 'onChange'> & {
  /** Whether the switch is on */
  checked?: boolean;
  /** Default checked state (uncontrolled) */
  defaultChecked?: boolean;
  /** Called when checked state changes */
  onCheckedChange?: (checked: boolean) => void;
};

export type SwitchThumbProps = ComponentProps<'span'>;

const Root = forwardRef<HTMLElement, SwitchProps>(
  ({ className, checked, defaultChecked, onCheckedChange, ...props }, ref) => (
    <BaseSwitch.Root
      ref={ref}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      className={(state) =>
        cn(
          'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2',
          state.checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-muted)]',
          state.disabled && 'cursor-not-allowed opacity-50',
          typeof className === 'string' ? className : undefined,
        )
      }
      {...props}
    />
  ),
);
Root.displayName = 'Switch';

const Thumb = forwardRef<HTMLSpanElement, SwitchThumbProps>(({ className, ...props }, ref) => (
  <BaseSwitch.Thumb
    ref={ref}
    className={(state) =>
      cn(
        'pointer-events-none block h-4 w-4 rounded-full bg-[var(--color-background)] shadow-lg ring-0 transition-transform',
        state.checked ? 'translate-x-4' : 'translate-x-0',
        typeof className === 'string' ? className : undefined,
      )
    }
    {...props}
  />
));
Thumb.displayName = 'Switch.Thumb';

export const Switch = Object.assign(Root, { Thumb });
