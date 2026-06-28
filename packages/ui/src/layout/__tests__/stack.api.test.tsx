import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Stack, stackVariants } from '../stack';

describe('Stack API surface', () => {
  it('exports Stack component and stackVariants', () => {
    expect(Stack).toBeDefined();
    expect(stackVariants).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Stack ref={ref}>content</Stack>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('accepts gap, padding, align, and height props', () => {
    const { container } = render(
      <Stack gap="lg" padding="sm" align="center" height="100%">
        content
      </Stack>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
