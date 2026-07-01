import { Tabs } from '../../primitives/tabs';
import type { WidgetComponentProps } from '../types';

interface TabDefinition {
  label: string;
  icon?: string;
  badge?: string;
}

export function TabsWidget({ props, children }: WidgetComponentProps) {
  const tabs = (props.tabs as TabDefinition[]) ?? [];
  const defaultTab = (props.defaultTab as number | undefined) ?? 0;
  const size = props.size as 'sm' | 'md' | undefined;

  const childArray = Array.isArray(children) ? children : children ? [children] : [];

  return (
    <Tabs defaultValue={defaultTab}>
      <Tabs.List size={size}>
        {tabs.map((tab, i) => (
          <Tabs.Trigger key={i} value={i} size={size}>
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {childArray.map((child, i) => (
        <Tabs.Content key={i} value={i}>
          {child}
        </Tabs.Content>
      ))}
    </Tabs>
  );
}

TabsWidget.displayName = 'TabsWidget';
