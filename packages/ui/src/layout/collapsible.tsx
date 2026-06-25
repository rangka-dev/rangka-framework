import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';

export type CollapsibleProps = {
  /** Whether the collapsible is open (controlled) */
  open?: boolean;
  /** Whether the collapsible is initially open (uncontrolled) */
  defaultOpen?: boolean;
  /** Callback when the open state changes */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};

export type CollapsibleTriggerProps = ComponentProps<'button'>;

export type CollapsibleContentProps = ComponentProps<'div'>;

const CollapsibleRoot = ({ open, defaultOpen, onOpenChange, children }: CollapsibleProps) => {
  return (
    <BaseCollapsible.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}
    >
      {children}
    </BaseCollapsible.Root>
  );
};
CollapsibleRoot.displayName = 'Collapsible';

const CollapsibleTrigger = forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseCollapsible.Trigger
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      />
    );
  },
);
CollapsibleTrigger.displayName = 'Collapsible.Trigger';

const CollapsibleContent = forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseCollapsible.Panel
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      />
    );
  },
);
CollapsibleContent.displayName = 'Collapsible.Content';

export const Collapsible = Object.assign(CollapsibleRoot, {
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent,
});
