import type { WidgetComponentProps } from '../types';

export function RepeatWidget({ children }: WidgetComponentProps) {
  return (
    <div data-slot="widget-repeat" className="contents">
      {children}
    </div>
  );
}

RepeatWidget.displayName = 'RepeatWidget';
