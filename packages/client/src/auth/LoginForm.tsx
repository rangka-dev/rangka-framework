import { useState } from 'react';
import { Button } from '@rangka/ui';
import { Card } from '@rangka/ui';
import { Field } from '@rangka/ui';
import { Input } from '@rangka/ui';

export interface LoginFormProps {
  onLogin: (credentials: { email: string; password: string }) => void | Promise<void>;
  error?: string;
  loading?: boolean;
}

export function LoginForm({ onLogin, error, loading }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dismissed, setDismissed] = useState(false);

  const visibleError = dismissed ? undefined : error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDismissed(false);
    onLogin({ email, password });
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Sign in</Card.Title>
      </Card.Header>
      <Card.Content>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <Field.Label htmlFor="email">Email</Field.Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setEmail(e.target.value);
                setDismissed(true);
              }}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </Field>
          <Field>
            <Field.Label htmlFor="password">Password</Field.Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setPassword(e.target.value);
                setDismissed(true);
              }}
              placeholder="Enter your password"
              required
            />
          </Field>
          <div className="min-h-5" aria-live="polite">
            {visibleError && <Field.Error>{visibleError}</Field.Error>}
          </div>
          <Button type="submit" disabled={loading} loading={loading} className="w-full">
            Sign in
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}
