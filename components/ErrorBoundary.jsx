import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log to error tracking service (e.g., Sentry, LogRocket)
    if (window.console && window.console.error) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-2xl w-full bg-neutral-900 border border-red-500/50 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-400" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Something went wrong
                </h2>
                <p className="text-neutral-400 mb-4">
                  We encountered an unexpected error while loading the Civilization Metro Map.
                </p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-300 mb-2">
                      Error Details (Development Only)
                    </summary>
                    <pre className="text-xs bg-black/50 p-4 rounded overflow-auto max-h-48 text-red-300">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
                  aria-label="Reload the application"
                >
                  <RefreshCw className="w-5 h-5" aria-hidden="true" />
                  Reload Application
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

