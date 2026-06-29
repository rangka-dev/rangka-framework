import { Button } from '@rangka/ui';
import { Card } from '@rangka/ui';

export interface SessionExpiredProps {
  onReLogin: () => void;
}

export function SessionExpired({ onReLogin }: SessionExpiredProps) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Session Expired</Card.Title>
      </Card.Header>
      <Card.Content>
        <p>Your session has expired. Please sign in again to continue.</p>
        <Button onClick={onReLogin}>Sign in</Button>
      </Card.Content>
    </Card>
  );
}
