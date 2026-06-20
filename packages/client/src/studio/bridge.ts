import type { ClientToStudioMessage, StudioToClientMessage } from './types.js';
import { findWidgetElement, buildWidgetPath, findPageKey, extractMeta } from './walker.js';
import { createOverlay, updateOverlay, showOverlay, hideOverlay } from './overlay.js';

export function initBridge(): void {
  if (window.parent === window) return;

  createOverlay();
  let inspecting = false;

  function startInspect() {
    inspecting = true;
    document.body.style.cursor = 'crosshair';
  }

  function stopInspect() {
    inspecting = false;
    hideOverlay();
    document.body.style.cursor = '';
  }

  // Expose for console debugging
  (window as unknown as Record<string, unknown>).__rangkaStudio = {
    startInspect,
    stopInspect,
    isInspecting: () => inspecting,
  };

  window.addEventListener('message', (event) => {
    const msg = event.data as StudioToClientMessage;
    if (!msg?.type?.startsWith('rangka-studio:')) return;

    if (msg.type === 'rangka-studio:inspect-start') {
      startInspect();
    } else if (msg.type === 'rangka-studio:inspect-stop') {
      stopInspect();
    } else if (msg.type === 'rangka-studio:pong') {
      if (msg.inspecting) {
        startInspect();
      }
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (!inspecting) return;
    const target = e.target as HTMLElement;
    const widgetEl = findWidgetElement(target);
    if (widgetEl) {
      const rect = getMeasurableRect(widgetEl);
      updateOverlay(rect);
      showOverlay();
      const widgetPath = buildWidgetPath(widgetEl);
      const pageKey = findPageKey(widgetEl);
      post({
        type: 'rangka-client:hover',
        widgetPath,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        pageKey,
      });
    } else {
      hideOverlay();
      post({ type: 'rangka-client:hover-out' });
    }
  });

  document.addEventListener(
    'click',
    (e) => {
      if (!inspecting) return;
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;
      const widgetEl = findWidgetElement(target);
      if (widgetEl) {
        const widgetPath = buildWidgetPath(widgetEl);
        const meta = extractMeta(widgetEl);
        const pageKey = findPageKey(widgetEl);
        post({ type: 'rangka-client:select', widgetPath, meta, pageKey });
      }
    },
    { capture: true },
  );

  patchNavigation();

  post({ type: 'rangka-client:ready' });
  post({ type: 'rangka-client:ping' });
  post({ type: 'rangka-client:navigate', path: window.location.pathname });
}

function patchNavigation(): void {
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = function (...args) {
    originalPushState(...args);
    notifyNavigation();
  };

  history.replaceState = function (...args) {
    originalReplaceState(...args);
    notifyNavigation();
  };

  window.addEventListener('popstate', () => {
    notifyNavigation();
  });
}

function notifyNavigation(): void {
  post({ type: 'rangka-client:navigate', path: window.location.pathname });
}

function post(msg: ClientToStudioMessage): void {
  window.parent.postMessage(msg, '*');
}

function getMeasurableRect(el: HTMLElement): DOMRect {
  const rect = el.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) return rect;
  // display:contents elements have no box — measure first child instead
  const child = el.firstElementChild as HTMLElement | null;
  if (child) return child.getBoundingClientRect();
  return rect;
}
