import type { ReactNode } from 'react';
import { useBootContext } from './BootProvider.js';
import { LoginForm } from '../auth/LoginForm.js';
import { SessionExpired } from '../auth/SessionExpired.js';
import { SetupForm } from '../auth/SetupForm.js';

export function BootGate({ children }: { children: ReactNode }) {
  const { state, handleLogin, handleSetup, handleSessionExpired, retry } = useBootContext();

  switch (state.status) {
    case 'checking':
    case 'loading':
      return (
        <div role="status" aria-label="Loading">
          Loading…
        </div>
      );
    case 'setup':
      return <SetupForm onSetup={handleSetup} />;
    case 'login':
      if (state.sessionExpired) {
        return <SessionExpired onReLogin={handleSessionExpired} />;
      }
      return <LoginForm onLogin={handleLogin} />;
    case 'error':
      return (
        <div role="alert">
          <p>Something went wrong. Unable to load the application.</p>
          <button onClick={retry}>Retry</button>
        </div>
      );
    case 'ready':
      return <>{children}</>;
  }
}
