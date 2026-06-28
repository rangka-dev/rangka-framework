import { Group as GroupLayout } from '../../layout/group';
import type { WidgetComponentProps } from '../types';

export function GroupWidget({ props, children }: WidgetComponentProps) {
  const direction = (props.direction as 'row' | 'column') ?? 'row';
  const gap = (props.gap as 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl') ?? 'md';
  const align = (props.align as 'start' | 'center' | 'end') ?? undefined;
  const justify = (props.justify as 'start' | 'center' | 'end' | 'between' | 'around') ?? undefined;
  const wrap = props.wrap as boolean | undefined;
  const padding = props.padding as 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined;

  return (
    <GroupLayout
      direction={direction}
      gap={gap}
      align={align}
      justify={justify}
      wrap={wrap}
      padding={padding}
    >
      {children}
    </GroupLayout>
  );
}

GroupWidget.displayName = 'GroupWidget';
