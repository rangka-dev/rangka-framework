import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export interface SessionExpiredProps {
  onReLogin: () => void;
}

export function SessionExpired({ onReLogin }: SessionExpiredProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Session Expired</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Your session has expired. Please sign in again to continue.
          </p>
          <Button onClick={onReLogin}>Sign in</Button>
        </CardContent>
      </Card>
    </div>
  );
}
