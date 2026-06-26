import { Divider as DividerLayout } from '../../layout/divider';
import type { WidgetComponentProps } from '../types';

export function DividerWidget({ props }: WidgetComponentProps) {
  const margin = (props.margin as 'none' | 'sm' | 'md' | 'lg' | 'xl') ?? 'md';

  return <DividerLayout margin={margin} />;
}

DividerWidget.displayName = 'DividerWidget';
