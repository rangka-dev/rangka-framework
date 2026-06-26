import { Grid as GridLayout } from '../../layout/grid';
import type { WidgetComponentProps } from '../types';

export function GridWidget({ props, children }: WidgetComponentProps) {
  const columns = (props.columns as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12) ?? 2;
  const gap = (props.gap as 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl') ?? 'md';
  const padding = props.padding as 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined;

  return (
    <GridLayout columns={columns} gap={gap} padding={padding}>
      {children}
    </GridLayout>
  );
}

GridWidget.displayName = 'GridWidget';
