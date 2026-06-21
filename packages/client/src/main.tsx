import React from 'react';
import ReactDOM from 'react-dom';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App.js';
import { registerBuiltInWidgets } from './widgets/components/register.js';
import { usePageState } from './widgets/hooks/usePageState.js';
import { useWidgetContext } from './widgets/hooks/useWidgetContext.js';
import { useShell } from './shell/ShellContext.js';
import { useModelRecord } from './widgets/data/useModelRecord.js';
import { useModelQuery } from './widgets/data/useModelQuery.js';

// Expose React globals for custom widgets loaded via dynamic import()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__rangka_React = React;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__rangka_ReactDOM = ReactDOM;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__rangka_client = {
  usePageState,
  useWidgetContext,
  useShell,
  useModelRecord,
  useModelQuery,
};

registerBuiltInWidgets();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (window.parent !== window) {
  import('./studio/index.js');
}
