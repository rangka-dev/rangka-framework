import type { WidgetComponentProps } from '../types';

export function TableWidget({ children }: WidgetComponentProps) {
  return (
    <div data-slot="widget-table" className="w-full overflow-auto">
      <table className="w-full text-body">{children}</table>
    </div>
  );
}

TableWidget.displayName = 'TableWidget';
