import type { ReactNode } from 'react';
import type { BootResponse } from '@rangka/shared';
import { TooltipProvider } from '@/components/ui/tooltip';
import { UserProvider } from './UserContext.js';
import { PermissionsProvider } from './PermissionsContext.js';
import { MetaProvider } from './MetaContext.js';
import { AppProvider } from './ModuleContext.js';
import { ToastProvider } from '../shell/ToastProvider.js';
import { ConfirmProvider } from '../shell/ConfirmProvider.js';

export function ShellProviders({ data, children }: { data: BootResponse; children: ReactNode }) {
  return (
    <TooltipProvider>
      <UserProvider user={data.user}>
        <PermissionsProvider permissions={data.permissions}>
          <MetaProvider
            meta={{
              navigation: data.navigation,
              pages: data.pages,
              models: data.models,
            }}
          >
            <AppProvider navigation={data.navigation}>
              <ToastProvider>
                <ConfirmProvider>{children}</ConfirmProvider>
              </ToastProvider>
            </AppProvider>
          </MetaProvider>
        </PermissionsProvider>
      </UserProvider>
    </TooltipProvider>
  );
}
