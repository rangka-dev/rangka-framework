import { setToken } from './token.js';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SetupCredentials {
  name: string;
  email: string;
  password: string;
}

export async function login(credentials: LoginCredentials): Promise<Response> {
  const response = await fetch('/api/core/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (response.ok) {
    const { data } = await response.json();
    setToken(data.token);
  }

  return response;
}

export async function setup(credentials: SetupCredentials): Promise<Response> {
  const response = await fetch('/api/core/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (response.ok) {
    const { data } = await response.json();
    setToken(data.token);
  }

  return response;
}
