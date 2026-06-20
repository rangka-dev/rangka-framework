import { createContext, useContext } from 'react';
import type { WidgetContext } from '../context/types.js';

const WidgetContextReact = createContext<WidgetContext | null>(null);

export const WidgetContextProvider = WidgetContextReact.Provider;

export function useWidgetContext(): WidgetContext {
  const ctx = useContext(WidgetContextReact);
  if (!ctx) {
    throw new Error('useWidgetContext must be used within a WidgetContextProvider');
  }
  return ctx;
}
