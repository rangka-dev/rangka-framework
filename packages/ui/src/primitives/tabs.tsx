import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { cn } from '../lib/cn';

const tabsListVariants = cva('inline-flex items-center gap-1', {
  variants: {
    size: {
      sm: 'gap-0.5',
      md: 'gap-1',
    },
  },
  defaultVariants: { size: 'md' },
});

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center rounded text-muted-foreground transition-all cursor-pointer hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-foreground/6 data-[active]:text-foreground data-[active]:font-medium',
  {
    variants: {
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export type TabsProps = ComponentProps<'div'> & {
  /** The value of the currently active tab (controlled) */
  value?: string | number;
  /** The default active tab value (uncontrolled) */
  defaultValue?: string | number;
  /** Callback when active tab changes */
  onValueChange?: (value: string | number) => void;
};

export type TabsListProps = ComponentProps<'div'> & VariantProps<typeof tabsListVariants>;

export type TabsTriggerProps = ComponentProps<'button'> &
  VariantProps<typeof tabsTriggerVariants> & {
    /** Value that identifies this tab */
    value: string | number;
  };

export type TabsContentProps = ComponentProps<'div'> & {
  /** Value that identifies which tab this panel belongs to */
  value: string | number;
};

const TabsRoot = forwardRef<HTMLDivElement, TabsProps>(
  ({ className, value, defaultValue, onValueChange, children, ...props }, ref) => {
    return (
      <BaseTabs.Root
        ref={ref}
        className={cn('flex flex-col', className)}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        {...props}
      >
        {children}
      </BaseTabs.Root>
    );
  },
);
TabsRoot.displayName = 'Tabs';

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, size, children, ...props }, ref) => {
    return (
      <BaseTabs.List ref={ref} className={cn(tabsListVariants({ size, className }))} {...props}>
        {children}
      </BaseTabs.List>
    );
  },
);
TabsList.displayName = 'Tabs.List';

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, size, value, children, ...props }, ref) => {
    return (
      <BaseTabs.Tab
        ref={ref}
        value={value}
        className={cn(tabsTriggerVariants({ size, className }))}
        {...props}
      >
        {children}
      </BaseTabs.Tab>
    );
  },
);
TabsTrigger.displayName = 'Tabs.Trigger';

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    return (
      <BaseTabs.Panel ref={ref} value={value} className={cn('pt-4', className)} {...props}>
        {children}
      </BaseTabs.Panel>
    );
  },
);
TabsContent.displayName = 'Tabs.Content';

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});

export { tabsListVariants, tabsTriggerVariants };
