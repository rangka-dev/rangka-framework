import { Split } from '../../layout/split';
import type { WidgetComponentProps } from '../types';

export function SplitWidget({ props, children }: WidgetComponentProps) {
  const direction = (props.direction as 'horizontal' | 'vertical') ?? 'horizontal';

  return <Split direction={direction}>{children}</Split>;
}

SplitWidget.displayName = 'SplitWidget';
