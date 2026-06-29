import type { ReactNode } from 'react';
import type { BootResponse } from '@rangka/shared';
import { UserProvider } from './UserContext.js';
import { PermissionsProvider } from './PermissionsContext.js';
import { MetaProvider } from './MetaContext.js';
import { AppProvider } from './ModuleContext.js';

export function ShellProviders({ data, children }: { data: BootResponse; children: ReactNode }) {
  return (
    <UserProvider user={data.user}>
      <PermissionsProvider permissions={data.permissions}>
        <MetaProvider
          meta={{
            navigation: data.navigation,
            pages: data.pages,
            models: data.models,
          }}
        >
          <AppProvider navigation={data.navigation}>{children}</AppProvider>
        </MetaProvider>
      </PermissionsProvider>
    </UserProvider>
  );
}
