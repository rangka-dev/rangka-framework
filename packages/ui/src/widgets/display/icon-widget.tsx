import { type LucideIcon } from 'lucide-react';
import { Icon } from '../../primitives/icon';
import type { WidgetComponentProps } from '../types';

export function IconWidget({ props, on }: WidgetComponentProps) {
  const icon = props.icon as LucideIcon | undefined;
  const size = (props.size as 'sm' | 'md' | 'lg') ?? 'md';
  const clickable = !!on.click;

  if (!icon) return null;

  if (clickable) {
    return (
      <button
        type="button"
        onClick={() => on.click?.()}
        className="inline-flex cursor-pointer items-center justify-center rounded-md p-1 transition-colors hover:bg-foreground/6"
      >
        <Icon icon={icon} size={size} />
      </button>
    );
  }

  return <Icon icon={icon} size={size} />;
}

IconWidget.displayName = 'IconWidget';
