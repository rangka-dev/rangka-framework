import type { WidgetComponentProps } from '../types';

export function ColumnWidget({ children }: WidgetComponentProps) {
  return <>{children}</>;
}

ColumnWidget.displayName = 'ColumnWidget';
