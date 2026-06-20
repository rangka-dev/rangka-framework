import { createContext, useContext } from 'react';

type SurfaceType = 'page' | 'card';

const SurfaceContext = createContext<SurfaceType>('page');

export const SurfaceProvider = SurfaceContext.Provider;

export function useSurfaceContext(): SurfaceType {
  return useContext(SurfaceContext);
}
