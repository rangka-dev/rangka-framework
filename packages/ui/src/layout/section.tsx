import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, useState, type ComponentProps } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';
import { Icon } from '../primitives/icon';
import { Collapsible } from './collapsible';

const sectionVariants = cva('flex flex-col', {
  variants: {
    padding: {
      none: '',
      xs: '[&>[data-section-content]]:p-1',
      sm: '[&>[data-section-content]]:p-2',
      md: '[&>[data-section-content]]:p-4',
      lg: '[&>[data-section-content]]:p-6',
      xl: '[&>[data-section-content]]:p-8',
      '2xl': '[&>[data-section-content]]:p-12',
    },
  },
  defaultVariants: {
    padding: 'md',
  },
});

export type SectionProps = ComponentProps<'div'> &
  VariantProps<typeof sectionVariants> & {
    /** Section heading */
    label: string;
    /** Optional icon element */
    icon?: React.ReactNode;
    /** Enable collapse toggle */
    collapsible?: boolean;
    /** Initial collapsed state (only when collapsible) */
    defaultCollapsed?: boolean;
  };

export const Section = forwardRef<HTMLDivElement, SectionProps>(
  ({ className, label, icon, collapsible, defaultCollapsed, padding, children, ...props }, ref) => {
    const [open, setOpen] = useState(!defaultCollapsed);

    const header = (
      <div className="flex items-center gap-2 border-b border-border pb-2 mb-3">
        {collapsible && (
          <Icon
            icon={ChevronRight}
            size="sm"
            className={cn(
              'text-muted-foreground transition-transform duration-150',
              open && 'rotate-90',
            )}
          />
        )}
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <h3 className="text-sm font-medium">{label}</h3>
      </div>
    );

    if (!collapsible) {
      return (
        <div ref={ref} className={cn(sectionVariants({ padding, className }))} {...props}>
          {header}
          <div data-section-content="">{children}</div>
        </div>
      );
    }

    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <div ref={ref} className={cn(sectionVariants({ padding, className }))} {...props}>
          <Collapsible.Trigger className="cursor-pointer text-left hover:opacity-80 w-full">
            {header}
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div data-section-content="">{children}</div>
          </Collapsible.Content>
        </div>
      </Collapsible>
    );
  },
);

Section.displayName = 'Section';
export { sectionVariants };
