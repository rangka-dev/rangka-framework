import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RadioGroup } from '../radio-group';

describe('RadioGroup API surface', () => {
  it('exports RadioGroup with sub-components', () => {
    expect(RadioGroup).toBeDefined();
    expect(RadioGroup.Item).toBeDefined();
    expect(RadioGroup.Indicator).toBeDefined();
  });

  it('renders a root element', () => {
    const { container } = render(<RadioGroup />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders items with value prop', () => {
    const { container } = render(
      <RadioGroup defaultValue="a">
        <RadioGroup.Item value="a">
          <RadioGroup.Indicator />
        </RadioGroup.Item>
        <RadioGroup.Item value="b">
          <RadioGroup.Indicator />
        </RadioGroup.Item>
      </RadioGroup>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
