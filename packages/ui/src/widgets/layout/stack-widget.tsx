import { Stack as StackLayout } from '../../layout/stack';
import type { WidgetComponentProps } from '../types';

export function StackWidget({ props, children }: WidgetComponentProps) {
  const gap = (props.gap as 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl') ?? 'md';
  const padding = props.padding as 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined;
  const align = props.align as 'start' | 'center' | 'end' | 'stretch' | undefined;

  return (
    <StackLayout gap={gap} padding={padding} align={align}>
      {children}
    </StackLayout>
  );
}

StackWidget.displayName = 'StackWidget';
