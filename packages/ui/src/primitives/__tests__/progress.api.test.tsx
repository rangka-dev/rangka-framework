import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Progress } from '../progress';

describe('Progress API surface', () => {
  it('exports Progress with sub-components', () => {
    expect(Progress).toBeDefined();
    expect(Progress.Track).toBeDefined();
    expect(Progress.Indicator).toBeDefined();
  });

  it('forwards ref on root', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Progress ref={ref} value={50}>
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('accepts value and max props', () => {
    const { container } = render(
      <Progress value={75} max={100}>
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
