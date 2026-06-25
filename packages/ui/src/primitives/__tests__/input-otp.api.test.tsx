import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { InputOTP } from '../input-otp';

describe('InputOTP API surface', () => {
  it('exports InputOTP with sub-components', () => {
    expect(InputOTP).toBeDefined();
    expect(InputOTP.Group).toBeDefined();
    expect(InputOTP.Slot).toBeDefined();
  });

  it('forwards ref on Root', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <InputOTP ref={ref} length={6}>
        <InputOTP.Group>
          <InputOTP.Slot />
          <InputOTP.Slot />
          <InputOTP.Slot />
        </InputOTP.Group>
      </InputOTP>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('renders with length prop', () => {
    const { container } = render(
      <InputOTP length={4}>
        <InputOTP.Group>
          <InputOTP.Slot />
          <InputOTP.Slot />
          <InputOTP.Slot />
          <InputOTP.Slot />
        </InputOTP.Group>
      </InputOTP>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
