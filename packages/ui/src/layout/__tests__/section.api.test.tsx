import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { Section, sectionVariants } from '../section';

describe('Section API surface', () => {
  it('exports Section component and sectionVariants', () => {
    expect(Section).toBeDefined();
    expect(sectionVariants).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Section ref={ref} label="Test">content</Section>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('accepts label, icon, collapsible, defaultCollapsed, and padding props', () => {
    const { container } = render(
      <Section label="Details" collapsible defaultCollapsed padding="lg">
        content
      </Section>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
