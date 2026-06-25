import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { CircleIcon } from 'lucide-react';
import { Icon, iconVariants } from '../icon';

describe('Icon API surface', () => {
  it('exports Icon and iconVariants', () => {
    expect(Icon).toBeDefined();
    expect(iconVariants).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<SVGSVGElement>();
    render(<Icon icon={CircleIcon} ref={ref} />);
    expect(ref.current).toBeInstanceOf(SVGSVGElement);
  });

  it('renders the passed icon component', () => {
    const { container } = render(<Icon icon={CircleIcon} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('accepts size prop', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    for (const size of sizes) {
      const { container } = render(<Icon icon={CircleIcon} size={size} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    }
  });
});
