import { Section as SectionLayout } from '../../layout/section';
import type { WidgetComponentProps } from '../types';

export function SectionWidget({ props, children }: WidgetComponentProps) {
  const label = (props.label as string) ?? '';
  const collapsible = props.collapsible as boolean | undefined;
  const defaultCollapsed = props.defaultCollapsed as boolean | undefined;
  const padding = props.padding as 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined;

  return (
    <SectionLayout
      label={label}
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
      padding={padding}
    >
      {children}
    </SectionLayout>
  );
}

SectionWidget.displayName = 'SectionWidget';
