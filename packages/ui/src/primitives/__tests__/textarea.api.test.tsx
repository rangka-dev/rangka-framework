import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Textarea, textareaVariants } from '../textarea';

describe('Textarea API surface', () => {
  it('exports Textarea and textareaVariants', () => {
    expect(Textarea).toBeDefined();
    expect(textareaVariants).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('renders as textarea element', () => {
    const { container } = render(<Textarea />);
    expect(container.querySelector('textarea')).toBeInTheDocument();
  });

  it('passes through HTML textarea attributes', () => {
    const { container } = render(<Textarea disabled placeholder="Enter text" rows={5} />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute('placeholder', 'Enter text');
    expect(textarea).toHaveAttribute('rows', '5');
  });
});
