import { Card } from '../../layout/card';
import type { WidgetComponentProps } from '../types';

export function CardWidget({ props, children }: WidgetComponentProps) {
  const title = props.title as string | undefined;
  const description = props.description as string | undefined;

  return (
    <Card>
      {(title || description) && (
        <Card.Header>
          {title && <Card.Title>{title}</Card.Title>}
          {description && <Card.Description>{description}</Card.Description>}
        </Card.Header>
      )}
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

CardWidget.displayName = 'CardWidget';
