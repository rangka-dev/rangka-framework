import { describe, it, expect } from 'vitest';
import { FileUpload } from '../file-upload';

describe('FileUpload API surface', () => {
  it('exports FileUpload with sub-components', () => {
    expect(FileUpload).toBeDefined();
    expect(FileUpload.Dropzone).toBeDefined();
    expect(FileUpload.Item).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(FileUpload.Dropzone.displayName).toBe('FileUpload.Dropzone');
    expect(FileUpload.Item.displayName).toBe('FileUpload.Item');
  });
});
