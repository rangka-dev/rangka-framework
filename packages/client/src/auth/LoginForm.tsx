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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ email, password });
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Sign in</Card.Title>
      </Card.Header>
      <Card.Content>
        <form onSubmit={handleSubmit}>
          <Field>
            <Field.Label htmlFor="email">Email</Field.Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error && <Field.Error>{error}</Field.Error>}
          <Field>
            <Button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Field>
        </form>
      </Card.Content>
    </Card>
  );
}
