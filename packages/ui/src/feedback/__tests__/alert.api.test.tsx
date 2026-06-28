import { describe, it, expect } from 'vitest';
import { Alert, alertVariants } from '../alert';
import { render } from '@testing-library/react';
import { createRef } from 'react';

describe('Alert API surface', () => {
  it('exports Alert component and alertVariants', () => {
    expect(Alert).toBeDefined();
    expect(alertVariants).toBeDefined();
  });

  it('has sub-components', () => {
    expect(Alert.Icon).toBeDefined();
    expect(Alert.Title).toBeDefined();
    expect(Alert.Description).toBeDefined();
    expect(Alert.Dismiss).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Alert ref={ref}>Test</Alert>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('accepts variant prop', () => {
    const { container } = render(<Alert variant="error">Error</Alert>);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with role="alert"', () => {
    const { container } = render(<Alert>Test</Alert>);
    expect(container.querySelector('[role="alert"]')).toBeTruthy();
  });
});
