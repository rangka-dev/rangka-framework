import { useCallback, useEffect, useReducer } from 'react';
import type { BootResponse } from '@rangka/shared';
import { fetchBoot } from '../api/boot.js';
import { login, setup, type LoginCredentials, type SetupCredentials } from '../api/auth.js';
import { getToken, clearToken } from '../api/token.js';
import type { BootState } from './types.js';

type BootAction =
  | { type: 'SETUP_REQUIRED' }
  | { type: 'AUTH_REQUIRED'; sessionExpired?: boolean }
  | { type: 'LOGIN_LOADING' }
  | { type: 'LOGIN_ERROR'; error: string }
  | { type: 'LOADING' }
  | { type: 'READY'; data: BootResponse }
  | { type: 'ERROR'; error: unknown }
  | { type: 'RESET' };

function bootReducer(_state: BootState, action: BootAction): BootState {
  switch (action.type) {
    case 'SETUP_REQUIRED':
      return { status: 'setup' };
    case 'AUTH_REQUIRED':
      return { status: 'login', sessionExpired: action.sessionExpired };
    case 'LOGIN_LOADING':
      return { status: 'login', loading: true };
    case 'LOGIN_ERROR':
      return { status: 'login', error: action.error };
    case 'LOADING':
      return { status: 'loading' };
    case 'READY':
      return { status: 'ready', data: action.data };
    case 'ERROR':
      return { status: 'error', error: action.error };
    case 'RESET':
      return { status: 'login' };
  }
}

export interface UseBootResult {
  state: BootState;
  handleLogin: (credentials: LoginCredentials) => Promise<void>;
  handleSetup: (credentials: SetupCredentials) => Promise<void>;
  handleSessionExpired: () => void;
  handleLogout: () => void;
  retry: () => void;
}

export function useBoot(): UseBootResult {
  const [state, dispatch] = useReducer(bootReducer, { status: 'checking' });

  const performBoot = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    try {
      const data = await fetchBoot();
      dispatch({ type: 'READY', data });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 503) {
        dispatch({ type: 'SETUP_REQUIRED' });
      } else if (status === 401 || !getToken()) {
        dispatch({ type: 'AUTH_REQUIRED' });
      } else {
        dispatch({ type: 'ERROR', error: err });
      }
    }
  }, []);

  useEffect(() => {
    performBoot();
  }, [performBoot]);

  useEffect(() => {
    const onSessionExpired = () => {
      dispatch({ type: 'AUTH_REQUIRED', sessionExpired: true });
    };
    const onLogout = () => {
      clearToken();
      dispatch({ type: 'RESET' });
    };
    window.addEventListener('rangka:session-expired', onSessionExpired);
    document.addEventListener('rangka:logout', onLogout);
    return () => {
      window.removeEventListener('rangka:session-expired', onSessionExpired);
      document.removeEventListener('rangka:logout', onLogout);
    };
  }, []);

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      dispatch({ type: 'LOGIN_LOADING' });
      const response = await login(credentials);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message = body.message ?? 'Invalid email or password';
        dispatch({ type: 'LOGIN_ERROR', error: message });
        document.dispatchEvent(
          new CustomEvent('rangka:toast', { detail: { message, type: 'error' } }),
        );
        return;
      }
      await performBoot();
    },
    [performBoot],
  );

  const handleSetup = useCallback(
    async (credentials: SetupCredentials) => {
      const response = await setup(credentials);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Setup failed');
      }
      await performBoot();
    },
    [performBoot],
  );

  const handleSessionExpired = useCallback(() => {
    dispatch({ type: 'AUTH_REQUIRED', sessionExpired: true });
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    dispatch({ type: 'RESET' });
  }, []);

  const retry = useCallback(() => {
    performBoot();
  }, [performBoot]);

  return { state, handleLogin, handleSetup, handleSessionExpired, handleLogout, retry };
}
