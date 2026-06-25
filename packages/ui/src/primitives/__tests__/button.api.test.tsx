import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Button, buttonVariants } from '../button';

describe('Button API surface', () => {
  it('exports Button component and buttonVariants', () => {
    expect(Button).toBeDefined();
    expect(buttonVariants).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Test</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('accepts variant prop', () => {
    const variants = ['primary', 'secondary', 'destructive', 'ghost', 'outline', 'link'] as const;
    for (const variant of variants) {
      const { container } = render(<Button variant={variant}>Test</Button>);
      expect(container.firstChild).toBeInTheDocument();
    }
  });

  it('accepts size prop', () => {
    const sizes = ['sm', 'md', 'lg', 'icon'] as const;
    for (const size of sizes) {
      const { container } = render(<Button size={size}>Test</Button>);
      expect(container.firstChild).toBeInTheDocument();
    }
  });

  it('renders as button element', () => {
    const { container } = render(<Button>Test</Button>);
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('passes through HTML button attributes', () => {
    const { container } = render(
      <Button disabled type="submit">
        Test
      </Button>,
    );
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('type', 'submit');
  });
});
