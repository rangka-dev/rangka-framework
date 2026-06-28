import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { UIKit } from '@rangka/shared';
import { UIProvider } from './ui/UIProvider.js';
import { App } from './App.js';

export interface CreateAppOptions {
  ui: UIKit;
  el?: HTMLElement;
}

export function createApp(options: CreateAppOptions): void {
  const root = createRoot(options.el ?? document.getElementById('root')!);
  root.render(
    <StrictMode>
      <UIProvider kit={options.ui}>
        <App />
      </UIProvider>
    </StrictMode>,
  );
}
