import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { ToggleGroup } from '../toggle-group';

describe('ToggleGroup API surface', () => {
  it('exports ToggleGroup with sub-components', () => {
    expect(ToggleGroup).toBeDefined();
    expect(ToggleGroup.Item).toBeDefined();
  });

  it('forwards ref on Root', () => {
    const ref = createRef<HTMLDivElement>();
    render(<ToggleGroup ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('renders items with value prop', () => {
    const { container } = render(
      <ToggleGroup defaultValue={['bold']}>
        <ToggleGroup.Item value="bold">B</ToggleGroup.Item>
        <ToggleGroup.Item value="italic">I</ToggleGroup.Item>
      </ToggleGroup>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
