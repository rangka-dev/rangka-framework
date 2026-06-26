import { describe, it, expect } from 'vitest';
import { Image, imageVariants } from '../image';

describe('Image API surface', () => {
  it('exports Image component and imageVariants', () => {
    expect(Image).toBeDefined();
    expect(imageVariants).toBeDefined();
  });

  it('has display name', () => {
    expect(Image.displayName).toBe('Image');
  });
});
