import { Divider as DividerLayout } from '../../layout/divider';
import type { WidgetComponentProps } from '../types';

export function DividerWidget({ props }: WidgetComponentProps) {
  const margin = (props.margin as 'none' | 'sm' | 'md' | 'lg' | 'xl') ?? 'md';
  const bleed = (props.bleed as 'none' | 'sm' | 'md' | 'lg') ?? 'none';

  return <DividerLayout margin={margin} bleed={bleed} />;
}

DividerWidget.displayName = 'DividerWidget';
