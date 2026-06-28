import { describe, it, expect } from 'vitest';
import { Toast, toastVariants, toastContainerVariants } from '../toast';
import { render } from '@testing-library/react';
import { createRef } from 'react';

describe('Toast API surface', () => {
  it('exports Toast component and variants', () => {
    expect(Toast).toBeDefined();
    expect(toastVariants).toBeDefined();
    expect(toastContainerVariants).toBeDefined();
  });

  it('has sub-components', () => {
    expect(Toast.Icon).toBeDefined();
    expect(Toast.Message).toBeDefined();
    expect(Toast.Dismiss).toBeDefined();
    expect(Toast.Container).toBeDefined();
  });

  it('forwards ref on Toast', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Toast ref={ref}>Test</Toast>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards ref on Toast.Container', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Toast.Container ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('accepts variant prop', () => {
    const { container } = render(<Toast variant="success">Done</Toast>);
    expect(container.firstChild).toBeTruthy();
  });

  it('accepts position prop on Container', () => {
    const { container } = render(<Toast.Container position="top-center" />);
    expect(container.firstChild).toBeTruthy();
  });
});
