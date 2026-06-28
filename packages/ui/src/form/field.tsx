import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, useMemo, type ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { Label, type LabelProps } from '../primitives/label';
import { Separator } from '../primitives/separator';

// --- FieldSet ---

export type FieldSetProps = ComponentProps<'fieldset'>;

const FieldSet = forwardRef<HTMLFieldSetElement, FieldSetProps>(({ className, ...props }, ref) => (
  <fieldset
    ref={ref}
    data-slot="field-set"
    className={cn('flex flex-col gap-4', className)}
    {...props}
  />
));
FieldSet.displayName = 'Field.Set';

// --- FieldLegend ---

export type FieldLegendProps = ComponentProps<'legend'> & {
  /** Visual style of the legend */
  variant?: 'legend' | 'label';
};

const FieldLegend = forwardRef<HTMLLegendElement, FieldLegendProps>(
  ({ className, variant = 'legend', ...props }, ref) => (
    <legend
      ref={ref}
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        'mb-2.5 font-medium data-[variant=label]:text-xs data-[variant=legend]:text-sm',
        className,
      )}
      {...props}
    />
  ),
);
FieldLegend.displayName = 'Field.Legend';

// --- FieldGroup ---

export type FieldGroupProps = ComponentProps<'div'>;

const FieldGroup = forwardRef<HTMLDivElement, FieldGroupProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="field-group"
    className={cn('group/field-group flex w-full flex-col gap-5', className)}
    {...props}
  />
));
FieldGroup.displayName = 'Field.Group';

// --- Field (Root) ---

const fieldVariants = cva('group/field flex w-full gap-2 data-[invalid=true]:text-destructive', {
  variants: {
    orientation: {
      vertical: 'flex-col *:w-full',
      horizontal: 'flex-row items-center self-end pb-2.5',
    },
  },
  defaultVariants: { orientation: 'vertical' },
});

export type FieldProps = ComponentProps<'div'> & VariantProps<typeof fieldVariants>;

const FieldRoot = forwardRef<HTMLDivElement, FieldProps>(
  ({ className, orientation = 'vertical', ...props }, ref) => (
    <div
      ref={ref}
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  ),
);
FieldRoot.displayName = 'Field';

// --- FieldContent ---

export type FieldContentProps = ComponentProps<'div'>;

const FieldContent = forwardRef<HTMLDivElement, FieldContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="field-content"
      className={cn('group/field-content flex flex-1 flex-col gap-0.5 leading-snug', className)}
      {...props}
    />
  ),
);
FieldContent.displayName = 'Field.Content';

// --- FieldLabel ---

export type FieldLabelProps = LabelProps;

const FieldLabel = forwardRef<HTMLLabelElement, FieldLabelProps>(({ className, ...props }, ref) => (
  <Label
    ref={ref}
    data-slot="field-label"
    className={cn(
      'group/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50',
      className,
    )}
    {...props}
  />
));
FieldLabel.displayName = 'Field.Label';

// --- FieldTitle ---

export type FieldTitleProps = ComponentProps<'div'>;

const FieldTitle = forwardRef<HTMLDivElement, FieldTitleProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="field-title"
    className={cn(
      'flex w-fit items-center gap-2 text-xs/relaxed group-data-[disabled=true]/field:opacity-50',
      className,
    )}
    {...props}
  />
));
FieldTitle.displayName = 'Field.Title';

// --- FieldDescription ---

export type FieldDescriptionProps = ComponentProps<'p'>;

const FieldDescription = forwardRef<HTMLParagraphElement, FieldDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      data-slot="field-description"
      className={cn(
        'text-left text-xs/relaxed leading-normal font-normal text-muted-foreground',
        className,
      )}
      {...props}
    />
  ),
);
FieldDescription.displayName = 'Field.Description';

// --- FieldSeparator ---

export type FieldSeparatorProps = ComponentProps<'div'>;

const FieldSeparator = forwardRef<HTMLDivElement, FieldSeparatorProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="field-separator"
      data-content={!!children}
      className={cn('relative -my-2 h-5 text-xs', className)}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground">
          {children}
        </span>
      )}
    </div>
  ),
);
FieldSeparator.displayName = 'Field.Separator';

// --- FieldError ---

export type FieldErrorProps = ComponentProps<'div'> & {
  /** Array of error objects to display */
  errors?: Array<{ message?: string } | undefined>;
};

const FieldError = forwardRef<HTMLDivElement, FieldErrorProps>(
  ({ className, children, errors, ...props }, ref) => {
    const content = useMemo(() => {
      if (children) return children;
      if (!errors?.length) return null;

      const uniqueErrors = [...new Map(errors.map((e) => [e?.message, e])).values()];
      if (uniqueErrors.length === 1) return uniqueErrors[0]?.message;

      return (
        <ul className="ml-4 flex list-disc flex-col gap-1">
          {uniqueErrors.map(
            (error, index) => error?.message && <li key={index}>{error.message}</li>,
          )}
        </ul>
      );
    }, [children, errors]);

    if (!content) return null;

    return (
      <div
        ref={ref}
        role="alert"
        data-slot="field-error"
        className={cn('text-xs font-normal text-destructive', className)}
        {...props}
      >
        {content}
      </div>
    );
  },
);
FieldError.displayName = 'Field.Error';

// --- Compose ---

export const Field = Object.assign(FieldRoot, {
  Set: FieldSet,
  Legend: FieldLegend,
  Group: FieldGroup,
  Content: FieldContent,
  Label: FieldLabel,
  Title: FieldTitle,
  Description: FieldDescription,
  Separator: FieldSeparator,
  Error: FieldError,
});

export { fieldVariants };
