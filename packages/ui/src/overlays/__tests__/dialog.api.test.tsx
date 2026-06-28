import { describe, it, expect } from 'vitest';
import { Dialog } from '../dialog';

describe('Dialog API surface', () => {
  it('exports Dialog with sub-components', () => {
    expect(Dialog).toBeDefined();
    expect(Dialog.Trigger).toBeDefined();
    expect(Dialog.Content).toBeDefined();
    expect(Dialog.Header).toBeDefined();
    expect(Dialog.Title).toBeDefined();
    expect(Dialog.Description).toBeDefined();
    expect(Dialog.Body).toBeDefined();
    expect(Dialog.Footer).toBeDefined();
    expect(Dialog.Close).toBeDefined();
    expect(Dialog.Overlay).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Dialog.Trigger.displayName).toBe('Dialog.Trigger');
    expect(Dialog.Content.displayName).toBe('Dialog.Content');
    expect(Dialog.Header.displayName).toBe('Dialog.Header');
    expect(Dialog.Title.displayName).toBe('Dialog.Title');
    expect(Dialog.Description.displayName).toBe('Dialog.Description');
    expect(Dialog.Body.displayName).toBe('Dialog.Body');
    expect(Dialog.Footer.displayName).toBe('Dialog.Footer');
    expect(Dialog.Close.displayName).toBe('Dialog.Close');
    expect(Dialog.Overlay.displayName).toBe('Dialog.Overlay');
  });
});
