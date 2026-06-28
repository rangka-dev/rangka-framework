import { describe, it, expect } from 'vitest';
import { DateTimePicker } from '../date-time-picker';
import { render } from '@testing-library/react';
import { createRef } from 'react';

describe('DateTimePicker API surface', () => {
  it('exports DateTimePicker component', () => {
    expect(DateTimePicker).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<DateTimePicker ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('accepts value and onChange props', () => {
    const { container } = render(
      <DateTimePicker value="2026-01-15T10:30:00.000Z" onChange={() => {}} />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders placeholder when no value', () => {
    const { container } = render(<DateTimePicker placeholder="Select date and time" />);
    expect(container.textContent).toContain('Select date and time');
  });
});
