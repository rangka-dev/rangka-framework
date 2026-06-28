import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';

export type TabsProps = {
  /** The controlled value of the active tab */
  value?: string | number;
  /** The default value when uncontrolled */
  defaultValue?: string | number;
  /** Callback when the active tab changes */
  onValueChange?: (value: string | number) => void;
  children?: ReactNode;
};

export type TabsListProps = ComponentProps<'div'>;

export type TabsTriggerProps = ComponentProps<'button'> & {
  /** The value that associates the trigger with a panel */
  value: string | number;
};

export type TabsContentProps = ComponentProps<'div'> & {
  /** The value that associates the panel with a trigger */
  value: string | number;
};

const TabsRoot = ({ value, defaultValue, onValueChange, children }: TabsProps) => {
  return (
    <BaseTabs.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (v) => onValueChange(v) : undefined}
    >
      {children}
    </BaseTabs.Root>
  );
};
TabsRoot.displayName = 'Tabs';

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(({ className, ...props }, ref) => {
  return (
    <BaseTabs.List
      ref={ref}
      className={typeof className === 'string' ? className : undefined}
      {...props}
    />
  );
});
TabsList.displayName = 'Tabs.List';

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    return (
      <BaseTabs.Tab
        ref={ref}
        value={value}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      />
    );
  },
);
TabsTrigger.displayName = 'Tabs.Trigger';

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    return (
      <BaseTabs.Panel
        ref={ref}
        value={value}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      />
    );
  },
);
TabsContent.displayName = 'Tabs.Content';

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});
