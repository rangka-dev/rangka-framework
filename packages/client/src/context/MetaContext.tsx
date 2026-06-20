import { createContext, useContext, type ReactNode } from 'react';
import type { NavigationTree, PageDefinition, ModelMeta } from '@rangka/shared';

export interface MetaData {
  navigation: NavigationTree[];
  pages: PageDefinition[];
  models: Record<string, ModelMeta>;
}

const MetaContext = createContext<MetaData | null>(null);

export function MetaProvider({ meta, children }: { meta: MetaData; children: ReactNode }) {
  return <MetaContext.Provider value={meta}>{children}</MetaContext.Provider>;
}

export function useMeta(): MetaData {
  const ctx = useContext(MetaContext);
  if (!ctx) {
    throw new Error('useMeta must be used within a MetaProvider');
  }
  return ctx;
}
