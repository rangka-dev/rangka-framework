import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Group, groupVariants } from '../group';

describe('Group API surface', () => {
  it('exports Group component and groupVariants', () => {
    expect(Group).toBeDefined();
    expect(groupVariants).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Group ref={ref}>content</Group>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('accepts direction, gap, align, justify, wrap, padding, paddingX, paddingY props', () => {
    const { container } = render(
      <Group direction="row" gap="sm" align="center" justify="between" wrap padding="lg" paddingX="md" paddingY="xs">
        content
      </Group>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
