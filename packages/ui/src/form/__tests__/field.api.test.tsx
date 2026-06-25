import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Field } from '../field';

describe('Field API surface', () => {
  it('exports Field with sub-components', () => {
    expect(Field).toBeDefined();
    expect(Field.Set).toBeDefined();
    expect(Field.Legend).toBeDefined();
    expect(Field.Group).toBeDefined();
    expect(Field.Content).toBeDefined();
    expect(Field.Label).toBeDefined();
    expect(Field.Title).toBeDefined();
    expect(Field.Description).toBeDefined();
    expect(Field.Separator).toBeDefined();
    expect(Field.Error).toBeDefined();
  });

  it('forwards ref on root', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Field ref={ref}>content</Field>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('accepts orientation prop', () => {
    const { container } = render(<Field orientation="horizontal">content</Field>);
    expect(container.firstChild).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('renders errors from array', () => {
    const { container } = render(<Field.Error errors={[{ message: 'Required' }]} />);
    expect(container.textContent).toBe('Required');
  });

  it('renders nothing when no errors', () => {
    const { container } = render(<Field.Error errors={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
