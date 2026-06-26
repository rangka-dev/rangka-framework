import type { WidgetComponentProps } from '../types';

export function DatagridWidget({ children }: WidgetComponentProps) {
  return (
    <div data-slot="widget-datagrid" className="w-full overflow-auto">
      {children}
    </div>
  );
}

DatagridWidget.displayName = 'DatagridWidget';
