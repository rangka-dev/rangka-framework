import { describe, it, expect } from 'vitest';
import { InputGroup } from '../input-group';

describe('InputGroup API surface', () => {
  it('exports InputGroup with sub-components', () => {
    expect(InputGroup).toBeDefined();
    expect(InputGroup.Addon).toBeDefined();
    expect(InputGroup.Text).toBeDefined();
    expect(InputGroup.Input).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(InputGroup.Addon.displayName).toBe('InputGroup.Addon');
    expect(InputGroup.Text.displayName).toBe('InputGroup.Text');
    expect(InputGroup.Input.displayName).toBe('InputGroup.Input');
  });
});
