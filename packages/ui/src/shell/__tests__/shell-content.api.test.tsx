import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { ShellContent } from '../shell-content';
import { PageContainer } from '../page-container';

describe('ShellContent API surface', () => {
  it('exports ShellContent with sub-components', () => {
    expect(ShellContent).toBeDefined();
    expect(ShellContent.Header).toBeDefined();
    expect(ShellContent.Main).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<ShellContent ref={ref}>content</ShellContent>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('PageContainer API surface', () => {
  it('exports PageContainer', () => {
    expect(PageContainer).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<PageContainer ref={ref}>content</PageContainer>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('accepts layout prop', () => {
    const { container } = render(<PageContainer layout="full">content</PageContainer>);
    expect(container.firstChild).toBeTruthy();
  });

  it('applies default layout classes', () => {
    const { container } = render(<PageContainer>content</PageContainer>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('px-6');
    expect(el.className).toContain('py-4');
  });

  it('applies full layout without padding', () => {
    const { container } = render(<PageContainer layout="full">content</PageContainer>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toContain('px-6');
  });
});
