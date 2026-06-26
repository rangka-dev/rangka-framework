import { Button } from '../../primitives/button';
import type { WidgetComponentProps } from '../types';

export function ButtonWidget({ props, on }: WidgetComponentProps) {
  const label = (props.label as string) ?? 'Button';
  const variant = (props.variant as 'primary' | 'secondary' | 'ghost' | 'destructive') ?? 'primary';
  const size = (props.size as 'xs' | 'sm' | 'md' | 'lg') ?? 'sm';
  const disabled = props.disabled as boolean | undefined;

  return (
    <Button variant={variant} size={size} disabled={disabled} onClick={() => on.click?.()}>
      {label}
    </Button>
  );
}

ButtonWidget.displayName = 'ButtonWidget';
