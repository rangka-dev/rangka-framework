import type { WidgetComponentProps } from '../types';

export function DataWidget({ children }: WidgetComponentProps) {
  return <div data-slot="widget-data">{children}</div>;
}

DataWidget.displayName = 'DataWidget';
