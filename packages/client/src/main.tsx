import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { createApp } from './createApp.js';
import { defaultKit } from '@rangka/ui';
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

createApp({ ui: defaultKit });

if (window.parent !== window) {
  import('./studio/index.js');
}
