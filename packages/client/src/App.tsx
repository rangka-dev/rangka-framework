import { useMemo } from 'react';
import { BootProvider, useBootContext } from './boot/BootProvider.js';
import { BootGate } from './boot/BootGate.js';
import { ShellProviders } from './context/ShellProviders.js';
import { QueryProvider } from './data/QueryProvider.js';
import { createQueryClient } from './data/queryClient.js';
import { RouterProvider } from './router/RouterProvider.js';
import { createShellRouter } from './router/createShellRouter.js';

function AppInner() {
  const { state, handleSessionExpired } = useBootContext();

  const queryClient = useMemo(
    () => createQueryClient(handleSessionExpired),
    [handleSessionExpired],
  );

  const router = useMemo(() => {
    if (state.status === 'ready') {
      return createShellRouter(state.data.pages);
    }
    return null;
  }, [state]);

  return (
    <BootGate>
      {state.status === 'ready' && router && (
        <ShellProviders data={state.data}>
          <QueryProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryProvider>
        </ShellProviders>
      )}
    </BootGate>
  );
}

export function App() {
  return (
    <BootProvider>
      <AppInner />
    </BootProvider>
  );
}
