import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Skeleton, skeletonVariants } from '../skeleton';

describe('Skeleton API surface', () => {
  it('exports Skeleton and skeletonVariants', () => {
    expect(Skeleton).toBeDefined();
    expect(skeletonVariants).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Skeleton ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('renders as div element', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('accepts width and height props', () => {
    const { container } = render(<Skeleton width={200} height={20} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('200px');
    expect(div.style.height).toBe('20px');
  });

  it('accepts string width and height', () => {
    const { container } = render(<Skeleton width="100%" height="1rem" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('100%');
    expect(div.style.height).toBe('1rem');
  });
});
