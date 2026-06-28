import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Toggle, toggleVariants } from '../toggle';

describe('Toggle API surface', () => {
  it('exports Toggle component and toggleVariants', () => {
    expect(Toggle).toBeDefined();
    expect(toggleVariants).toBeDefined();
  });

  it('accepts variant and size props', () => {
    const { container } = render(
      <Toggle variant="outline" size="sm">
        Bold
      </Toggle>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('accepts pressed and onPressedChange props', () => {
    const { container } = render(
      <Toggle pressed={true} onPressedChange={() => {}}>
        Bold
      </Toggle>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
