import { describe, it, expect } from 'vitest';
import { ScrollArea } from '../scroll-area';

describe('ScrollArea API surface', () => {
  it('exports ScrollArea with sub-components', () => {
    expect(ScrollArea).toBeDefined();
    expect(ScrollArea.Viewport).toBeDefined();
    expect(ScrollArea.Scrollbar).toBeDefined();
    expect(ScrollArea.Thumb).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(ScrollArea.Viewport.displayName).toBe('ScrollArea.Viewport');
    expect(ScrollArea.Scrollbar.displayName).toBe('ScrollArea.Scrollbar');
    expect(ScrollArea.Thumb.displayName).toBe('ScrollArea.Thumb');
  });
});
