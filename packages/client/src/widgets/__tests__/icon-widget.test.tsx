import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { IconWidget } from '../components/IconWidget.js';

afterEach(() => {
  cleanup();
});

describe('IconWidget', () => {
  it('renders default circle icon when no name provided', () => {
    const { container } = render(
      <IconWidget
        props={{}}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('passes custom icon name to Icon component', () => {
    const { container } = render(
      <IconWidget
        props={{ name: 'arrow-right' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with default size of 14', () => {
    const { container } = render(
      <IconWidget
        props={{}}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '14');
    expect(svg).toHaveAttribute('height', '14');
  });

  it('passes custom size prop through to SVG', () => {
    const { container } = render(
      <IconWidget
        props={{ size: 24 }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('passes color prop through to SVG', () => {
    const { container } = render(
      <IconWidget
        props={{ color: 'red' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('stroke', 'red');
  });

  it('fires on.click when clicked', () => {
    const handleClick = vi.fn();

    const { container } = render(
      <IconWidget
        props={{ name: 'circle' }}
        bind={{ value: undefined }}
        on={{ click: handleClick }}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    const span = container.firstElementChild as HTMLElement;
    fireEvent.click(span);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('adds cursor-pointer class when on.click exists', () => {
    const handleClick = vi.fn();

    const { container } = render(
      <IconWidget
        props={{ name: 'circle' }}
        bind={{ value: undefined }}
        on={{ click: handleClick }}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    const span = container.firstElementChild as HTMLElement;
    expect(span.className).toContain('cursor-pointer');
  });

  it('does not add cursor-pointer class when on.click is not provided', () => {
    const { container } = render(
      <IconWidget
        props={{ name: 'circle' }}
        bind={{ value: undefined }}
        on={{}}
        context={{ record: {}, model: '', mode: 'view' }}
      />,
    );

    const span = container.firstElementChild as HTMLElement;
    expect(span.className).not.toContain('cursor-pointer');
  });
});
