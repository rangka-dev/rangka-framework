import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Grid, gridVariants } from '../grid';

describe('Grid API surface', () => {
  it('exports Grid component and gridVariants', () => {
    expect(Grid).toBeDefined();
    expect(gridVariants).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Grid ref={ref}>content</Grid>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('accepts columns, gap, rowGap, colGap, autoFlow, padding, and responsive props', () => {
    const { container } = render(
      <Grid columns={4} gap="lg" autoFlow="dense" padding="md" responsive={{ sm: 1, md: 2 }}>
        content
      </Grid>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
