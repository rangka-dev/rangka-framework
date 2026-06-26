import { Badge } from '../../primitives/badge';
import type { WidgetComponentProps } from '../types';

export function SequenceWidget({ bind }: WidgetComponentProps) {
  const value = bind.value != null ? String(bind.value) : '';

  if (!value) return <span className="text-sm text-muted-foreground">—</span>;

  return <Badge variant="secondary">{value}</Badge>;
}

SequenceWidget.displayName = 'SequenceWidget';
