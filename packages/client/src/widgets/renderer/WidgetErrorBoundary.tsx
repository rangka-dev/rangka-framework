import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface WidgetErrorBoundaryProps {
  name: string;
  children: ReactNode;
}

interface WidgetErrorBoundaryState {
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  state: WidgetErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[rangka] Widget "${this.props.name}" crashed:\n`,
      error,
      '\n\nComponent stack:',
      info.componentStack,
    );
  }

  render() {
    if (this.state.error) {
      return (
        <div
          data-widget-error={`Runtime error in: ${this.props.name}`}
          className="rounded border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <p className="font-medium">Widget error: {this.props.name}</p>
          <p className="mt-1 text-xs opacity-75">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
