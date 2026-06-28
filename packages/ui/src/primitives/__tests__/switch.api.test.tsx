import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Switch } from '../switch';

describe('Switch API surface', () => {
  it('exports Switch with sub-components', () => {
    expect(Switch).toBeDefined();
    expect(Switch.Thumb).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Switch ref={ref}>
        <Switch.Thumb />
      </Switch>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('renders with checked prop', () => {
    const { container } = render(
      <Switch checked onCheckedChange={() => {}}>
        <Switch.Thumb />
      </Switch>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
