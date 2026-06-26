import { cn } from '../../lib/cn';
import type { WidgetComponentProps } from '../types';

export function ImageWidget({ props, bind }: WidgetComponentProps) {
  const src = (props.src as string) ?? (bind.value as string) ?? '';
  const alt = (props.alt as string) ?? '';
  const width = props.width as number | undefined;
  const height = props.height as number | undefined;
  const rounded = (props.rounded as string) ?? 'md';

  if (!src) return null;

  const roundedClasses: Record<string, string> = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn('object-cover', roundedClasses[rounded] ?? 'rounded-md')}
    />
  );
}

ImageWidget.displayName = 'ImageWidget';
