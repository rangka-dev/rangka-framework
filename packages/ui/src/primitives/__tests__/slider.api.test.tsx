import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Slider } from '../slider';

describe('Slider API surface', () => {
  it('exports Slider with sub-components', () => {
    expect(Slider).toBeDefined();
    expect(Slider.Track).toBeDefined();
    expect(Slider.Indicator).toBeDefined();
    expect(Slider.Thumb).toBeDefined();
  });

  it('forwards ref on root', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Slider ref={ref} defaultValue={50}>
        <Slider.Track>
          <Slider.Indicator />
        </Slider.Track>
        <Slider.Thumb />
      </Slider>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('accepts min, max, step, and disabled props', () => {
    const { container } = render(
      <Slider min={0} max={100} step={5} disabled>
        <Slider.Track>
          <Slider.Indicator />
        </Slider.Track>
        <Slider.Thumb />
      </Slider>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
