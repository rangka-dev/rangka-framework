import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UIProvider, useWidgetComponent, useShellComponents, useUIKit } from '../../ui/UIProvider';
import type { UIKit, WidgetProps } from '@rangka/shared';

function TestWidget({ props }: WidgetProps) {
  return <span data-testid="test-widget">{props.label as string}</span>;
}

function ShellLayout({ children }: { children: React.ReactNode }) {
  return <div data-testid="shell-layout">{children}</div>;
}

function PageOutlet({ children }: { children: React.ReactNode }) {
  return <div data-testid="page-outlet">{children}</div>;
}

function Toast() {
  return <div data-testid="toast" />;
}

function ConfirmDialog() {
  return <div data-testid="confirm" />;
}

function NotFound() {
  return <div data-testid="not-found" />;
}

function ModuleSelector() {
  return <div data-testid="module-selector" />;
}

const mockKit: UIKit = {
  widgets: {
    'test-widget': TestWidget,
  },
  shell: {
    Layout: ShellLayout as unknown as UIKit['shell']['Layout'],
    PageOutlet: PageOutlet as unknown as UIKit['shell']['PageOutlet'],
    Toast: Toast as unknown as UIKit['shell']['Toast'],
    ConfirmDialog: ConfirmDialog as unknown as UIKit['shell']['ConfirmDialog'],
    NotFound,
    ModuleSelector: ModuleSelector as unknown as UIKit['shell']['ModuleSelector'],
  },
};

function WidgetComponentConsumer({ type }: { type: string }) {
  const Component = useWidgetComponent(type);
  if (!Component) return <span data-testid="not-found">not found</span>;
  return (
    <Component
      props={{ label: 'hello' }}
      bind={{ value: null }}
      on={{}}
      context={{ record: {}, model: '', mode: 'view' }}
    />
  );
}

function ShellConsumer() {
  const shell = useShellComponents();
  return <shell.NotFound />;
}

function KitConsumer() {
  const kit = useUIKit();
  return <span data-testid="kit-widgets">{Object.keys(kit.widgets).join(',')}</span>;
}

describe('UIProvider', () => {
  it('provides widget components via useWidgetComponent', () => {
    render(
      <UIProvider kit={mockKit}>
        <WidgetComponentConsumer type="test-widget" />
      </UIProvider>,
    );
    expect(screen.getByTestId('test-widget')).toHaveTextContent('hello');
  });

  it('returns undefined for unknown widget types', () => {
    render(
      <UIProvider kit={mockKit}>
        <WidgetComponentConsumer type="unknown" />
      </UIProvider>,
    );
    expect(screen.getByTestId('not-found')).toHaveTextContent('not found');
  });

  it('provides shell components via useShellComponents', () => {
    render(
      <UIProvider kit={mockKit}>
        <ShellConsumer />
      </UIProvider>,
    );
    expect(screen.getByTestId('not-found')).toBeInTheDocument();
  });

  it('provides full kit via useUIKit', () => {
    render(
      <UIProvider kit={mockKit}>
        <KitConsumer />
      </UIProvider>,
    );
    expect(screen.getByTestId('kit-widgets')).toHaveTextContent('test-widget');
  });

  it('throws when useUIKit is used outside provider', () => {
    expect(() => {
      render(<KitConsumer />);
    }).toThrow('useUIKit must be used within a UIProvider');
  });

  it('throws when useShellComponents is used outside provider', () => {
    expect(() => {
      render(<ShellConsumer />);
    }).toThrow('useShellComponents must be used within a UIProvider');
  });
});
