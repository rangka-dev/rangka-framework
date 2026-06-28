import { Badge } from '../../primitives/badge';
import type { WidgetComponentProps } from '../types';

export function BadgeWidget({ props, bind }: WidgetComponentProps) {
  const variant =
    (props.variant as 'default' | 'secondary' | 'destructive' | 'outline') ?? 'default';
  const label = (props.label as string) ?? (bind.value != null ? String(bind.value) : '');

  if (!label) return null;

  return <Badge variant={variant}>{label}</Badge>;
}

BadgeWidget.displayName = 'BadgeWidget';
