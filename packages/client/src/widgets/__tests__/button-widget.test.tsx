import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ButtonWidget } from '../components/ButtonWidget.js';

afterEach(() => {
  cleanup();
});

function renderButton(
  overrides: {
    props?: Record<string, unknown>;
    on?: Record<string, (...args: unknown[]) => void>;
  } = {},
) {
  const defaultProps = {
    props: { label: 'Click me', ...overrides.props },
    bind: { value: undefined },
    on: { click: vi.fn(), ...overrides.on },
    context: { record: {}, model: '', mode: 'view' as const },
  };

  return { ...render(<ButtonWidget {...defaultProps} />), on: defaultProps.on };
}

describe('ButtonWidget', () => {
  describe('rendering', () => {
    it('renders with label text', () => {
      renderButton({ props: { label: 'Save' } });
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('renders default button without crashing', () => {
      renderButton();
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('renders primary variant (maps to default)', () => {
      renderButton({ props: { variant: 'primary' } });
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-primary');
    });

    it('renders secondary variant', () => {
      renderButton({ props: { variant: 'secondary' } });
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-secondary');
    });

    it('renders ghost variant', () => {
      renderButton({ props: { variant: 'ghost' } });
      const button = screen.getByRole('button');
      expect(button.className).not.toContain('bg-primary');
      expect(button.className).not.toContain('bg-destructive');
    });

    it('renders destructive variant', () => {
      renderButton({ props: { variant: 'destructive' } });
      const button = screen.getByRole('button');
      expect(button.className).toContain('destructive');
    });
  });

  describe('sizes', () => {
    it('renders sm size', () => {
      renderButton({ props: { size: 'sm' } });
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-7');
    });

    it('renders default size', () => {
      renderButton({ props: { size: 'md' } });
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-8');
    });

    it('renders lg size', () => {
      renderButton({ props: { size: 'lg' } });
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-9');
    });
  });

  describe('disabled', () => {
    it('disables the button when disabled prop is true', () => {
      renderButton({ props: { disabled: true } });
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('button is not disabled by default', () => {
      renderButton();
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('click trigger', () => {
    it('fires on.click handler when clicked', () => {
      const { on } = renderButton();
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(on.click).toHaveBeenCalledTimes(1);
    });

    it('does not fire on.click when disabled', () => {
      const { on } = renderButton({ props: { disabled: true } });
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(on.click).not.toHaveBeenCalled();
    });
  });

  describe('widgetMeta', () => {
    it('has correct meta name', () => {
      expect(ButtonWidget.widgetMeta.name).toBe('button');
    });

    it('has correct category', () => {
      expect(ButtonWidget.widgetMeta.category).toBe('action');
    });

    it('declares click trigger', () => {
      expect(ButtonWidget.widgetMeta.triggers).toContain('click');
    });

    it('is not a container', () => {
      expect(ButtonWidget.widgetMeta.container).toBe(false);
    });

    it('has binding type none', () => {
      expect(ButtonWidget.widgetMeta.binding).toBe('none');
    });

    it('requires label in schema', () => {
      expect(ButtonWidget.widgetMeta.schema.label.required).toBe(true);
    });
  });
});
