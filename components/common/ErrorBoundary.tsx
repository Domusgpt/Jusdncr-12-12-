import React from 'react';
import { TelemetryService } from '../../services/telemetry/TelemetryService';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorId?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const errorId = crypto.randomUUID();
    this.setState({ errorId });
    TelemetryService.trackError({
      errorId,
      message: error.message,
      stack: error.stack ?? 'no-stack',
      componentStack: info.componentStack
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex h-full w-full items-center justify-center bg-black/80 text-white">
        <div className="max-w-lg rounded-2xl border border-white/10 bg-black/60 p-6 text-center shadow-2xl">
          <p className="text-sm font-mono uppercase tracking-[0.3em] text-brand-300">System</p>
          <h2 className="mt-2 text-2xl font-black">{this.props.title ?? 'Something broke.'}</h2>
          <p className="mt-3 text-sm text-gray-300">
            {this.props.subtitle ?? 'We hit a snag loading this experience. Refresh to try again.'}
          </p>
          {this.state.errorId && (
            <p className="mt-3 text-xs text-gray-500">Error ID: {this.state.errorId}</p>
          )}
          <button
            onClick={this.handleReload}
            className="mt-5 rounded-full border border-brand-400/60 bg-brand-600 px-6 py-2 text-xs font-bold tracking-widest text-white shadow-lg"
          >
            RELOAD
          </button>
        </div>
      </div>
    );
  }
}
