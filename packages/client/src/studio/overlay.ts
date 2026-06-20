let overlay: HTMLElement | null = null;

export function createOverlay(): HTMLElement {
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'rangka-studio-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '99999',
    border: '2px solid hsl(221 83% 53%)',
    background: 'hsl(221 83% 53% / 0.08)',
    borderRadius: '4px',
    display: 'none',
  });
  document.body.appendChild(overlay);
  return overlay;
}

export function updateOverlay(rect: {
  top: number;
  left: number;
  width: number;
  height: number;
}): void {
  if (!overlay) return;
  overlay.style.top = `${rect.top}px`;
  overlay.style.left = `${rect.left}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
}

export function showOverlay(): void {
  if (overlay) overlay.style.display = 'block';
}

export function hideOverlay(): void {
  if (overlay) overlay.style.display = 'none';
}

export function destroyOverlay(): void {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
}
