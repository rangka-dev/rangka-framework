import { describe, it, expect } from 'vitest';
import { DatePicker } from '../date-picker';
import { render } from '@testing-library/react';
import { createRef } from 'react';

describe('DatePicker API surface', () => {
  it('exports DatePicker component', () => {
    expect(DatePicker).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<DatePicker ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('accepts value and onChange props', () => {
    const { container } = render(<DatePicker value="2026-01-15" onChange={() => {}} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders placeholder when no value', () => {
    const { container } = render(<DatePicker placeholder="Select date" />);
    expect(container.textContent).toContain('Select date');
  });
});
