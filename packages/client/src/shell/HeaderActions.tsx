import type { Action } from '@rangka/shared';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/Icon';

interface HeaderActionsProps {
  actions: Action[];
  onAction?: (action: string) => void;
}

export function HeaderActions({ actions, onAction }: HeaderActionsProps) {
  return (
    <>
      {actions.map((action, i) => {
        if (action.type === 'button') {
          return (
            <Button
              key={i}
              size="sm"
              variant={action.variant === 'primary' ? 'default' : 'secondary'}
              onClick={() => action.action && onAction?.(action.action)}
            >
              {action.icon && <Icon name={action.icon} data-icon="inline-start" />}
              {action.label}
            </Button>
          );
        }
        return null;
      })}
    </>
  );
}
