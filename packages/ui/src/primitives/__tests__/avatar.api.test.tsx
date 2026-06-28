import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Avatar } from '../avatar';

describe('Avatar API surface', () => {
  it('exports Avatar with sub-components', () => {
    expect(Avatar).toBeDefined();
    expect(Avatar.Image).toBeDefined();
    expect(Avatar.Fallback).toBeDefined();
  });

  it('forwards ref on Root', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Avatar ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('renders with size variant', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    for (const size of sizes) {
      const { container } = render(
        <Avatar size={size}>
          <Avatar.Fallback>AB</Avatar.Fallback>
        </Avatar>,
      );
      expect(container.firstChild).toBeTruthy();
    }
  });

  it('renders fallback when no image', () => {
    const { getByText } = render(
      <Avatar>
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>,
    );
    expect(getByText('JD')).toBeInTheDocument();
  });
});
