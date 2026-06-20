import { RouterProvider as TanstackRouterProvider } from '@tanstack/react-router';
import type { Router } from '@tanstack/react-router';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RouterProvider({ router }: { router: Router<any, any, any, any> }) {
  return <TanstackRouterProvider router={router} />;
}
