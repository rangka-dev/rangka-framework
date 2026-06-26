import type { WidgetComponentProps } from '../types';

export function ComputedWidget({ props, bind }: WidgetComponentProps) {
  const format = (props.format as string) ?? 'text';
  const prefix = (props.prefix as string) ?? '';
  const suffix = (props.suffix as string) ?? '';

  const value = bind.value;
  if (value == null) return <span className="text-sm text-muted-foreground">—</span>;

  let formatted: string;
  switch (format) {
    case 'number':
      formatted = Number(value).toLocaleString();
      break;
    case 'currency':
      formatted = Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      break;
    case 'date':
      formatted = new Date(String(value)).toLocaleDateString();
      break;
    default:
      formatted = String(value);
  }

  return (
    <span className="text-sm text-foreground">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

ComputedWidget.displayName = 'ComputedWidget';
