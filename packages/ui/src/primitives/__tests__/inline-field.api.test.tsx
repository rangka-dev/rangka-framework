import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { InlineField, inlineFieldVariants } from '../inline-field';

describe('InlineField API surface', () => {
  it('exports InlineField component and inlineFieldVariants', () => {
    expect(InlineField).toBeDefined();
    expect(inlineFieldVariants).toBeDefined();
  });

  it('exports sub-components', () => {
    expect(InlineField.Value).toBeDefined();
    expect(InlineField.Empty).toBeDefined();
  });

  it('forwards ref on root', () => {
    const ref = createRef<HTMLDivElement>();
    render(<InlineField ref={ref} label="Name" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards ref on Value', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<InlineField.Value ref={ref}>Test</InlineField.Value>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('forwards ref on Empty', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<InlineField.Empty ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('accepts state variant', () => {
    const { container } = render(<InlineField label="Status" state="editing" />);
    expect(container.firstChild).toBeTruthy();
  });
});
