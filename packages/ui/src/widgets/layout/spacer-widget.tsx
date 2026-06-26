import { Spacer as SpacerLayout } from '../../layout/spacer';
import type { WidgetComponentProps } from '../types';

export function SpacerWidget({ props }: WidgetComponentProps) {
  const size = (props.size as 'xs' | 'sm' | 'md' | 'lg' | 'xl') ?? 'md';

  return <SpacerLayout size={size} />;
}

SpacerWidget.displayName = 'SpacerWidget';
