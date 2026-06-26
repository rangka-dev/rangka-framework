import { cn } from '../../lib/cn';
import type { WidgetComponentProps } from '../types';

export function TextWidget({ props, bind }: WidgetComponentProps) {
  const variant = (props.variant as string) ?? 'body';
  const value = bind.value != null ? String(bind.value) : '';

  const variantClasses: Record<string, string> = {
    heading: 'text-lg font-semibold text-foreground',
    body: 'text-body text-foreground/80',
    caption: 'text-xs text-foreground/50',
    bold: 'text-body font-semibold text-foreground',
    muted: 'text-body text-foreground/50',
  };

  return <p className={cn(variantClasses[variant] ?? variantClasses.body)}>{value}</p>;
}

TextWidget.displayName = 'TextWidget';
