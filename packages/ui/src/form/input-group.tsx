import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

export type InputGroupProps = ComponentProps<'div'>;

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-xs font-medium text-[var(--color-muted-foreground)] select-none [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        'inline-start': 'order-first pl-2.5',
        'inline-end': 'order-last pr-2.5',
      },
    },
    defaultVariants: {
      align: 'inline-start',
    },
  },
);

export type InputGroupAddonProps = ComponentProps<'div'> &
  VariantProps<typeof inputGroupAddonVariants>;

export type InputGroupTextProps = ComponentProps<'span'>;

export type InputGroupInputProps = ComponentProps<'input'>;

const InputGroupRoot = forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        className={cn(
          'flex h-9 w-full items-center rounded-md border border-[var(--color-border)] bg-transparent transition-colors focus-within:border-[var(--color-ring)] focus-within:ring-1 focus-within:ring-[var(--color-ring)]',
          className,
        )}
        {...props}
      />
    );
  },
);
InputGroupRoot.displayName = 'InputGroup';

const InputGroupAddon = forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-align={align}
        className={cn(inputGroupAddonVariants({ align, className }))}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          e.currentTarget.parentElement?.querySelector('input')?.focus();
        }}
        {...props}
      />
    );
  },
);
InputGroupAddon.displayName = 'InputGroup.Addon';

const InputGroupText = forwardRef<HTMLSpanElement, InputGroupTextProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "flex items-center text-xs text-[var(--color-muted-foreground)] [&_svg:not([class*='size-'])]:size-4",
          className,
        )}
        {...props}
      />
    );
  },
);
InputGroupText.displayName = 'InputGroup.Text';

const InputGroupInput = forwardRef<HTMLInputElement, InputGroupInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex-1 bg-transparent px-3 py-1 text-sm outline-none placeholder:text-[var(--color-muted-foreground)] disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
InputGroupInput.displayName = 'InputGroup.Input';

export const InputGroup = Object.assign(InputGroupRoot, {
  Addon: InputGroupAddon,
  Text: InputGroupText,
  Input: InputGroupInput,
});

export { inputGroupAddonVariants };
