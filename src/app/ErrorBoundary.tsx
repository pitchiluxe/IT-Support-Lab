import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * App-level error boundary. Catches render-time errors so the rest of the UI
 * is not taken down by a single broken panel (e.g. a 3D scene crash).
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console in dev; production would push to a local error sink.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div
          role="alert"
          className="m-4 rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-destructive"
        >
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm">{this.state.error.message}</p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-4 rounded-md border border-destructive/40 px-3 py-1 text-sm hover:bg-destructive/10"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
