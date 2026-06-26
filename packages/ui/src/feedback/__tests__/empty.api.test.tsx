import { describe, it, expect } from 'vitest';
import { Empty } from '../empty';

describe('Empty API surface', () => {
  it('exports Empty with sub-components', () => {
    expect(Empty).toBeDefined();
    expect(Empty.Header).toBeDefined();
    expect(Empty.Media).toBeDefined();
    expect(Empty.Title).toBeDefined();
    expect(Empty.Description).toBeDefined();
    expect(Empty.Content).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Empty.Header.displayName).toBe('Empty.Header');
    expect(Empty.Media.displayName).toBe('Empty.Media');
    expect(Empty.Title.displayName).toBe('Empty.Title');
    expect(Empty.Description.displayName).toBe('Empty.Description');
    expect(Empty.Content.displayName).toBe('Empty.Content');
  });
});
