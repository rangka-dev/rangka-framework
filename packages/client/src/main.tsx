import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App.js';
import { registerBuiltInWidgets } from './widgets/components/register.js';

registerBuiltInWidgets();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (window.parent !== window) {
  import('./studio/index.js');
}
