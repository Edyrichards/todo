import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  level?: 'page' | 'component' | 'feature';
  context?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Report to error tracking service
    this.reportError(error, errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, index) => key !== prevProps.resetKeys?.[index])) {
        this.resetErrorBoundary();
      }
    }

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, send to error tracking service like Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context,
      level: this.props.level,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // Log for development
    console.error('Error Report:', errorReport);

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorReport });
    }
  };

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: ''
    });
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
  };

  private handleAutoRetry = () => {
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary();
    }, 5000);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private copyErrorDetails = () => {
    const errorDetails = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString()
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        alert('Error details copied to clipboard');
      })
      .catch(() => {
        console.error('Failed to copy error details');
      });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI based on level
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="error-boundary-container p-6 text-center"
        >
          {this.renderErrorUI()}
        </motion.div>
      );
    }

    return this.props.children;
  }

  private renderErrorUI() {
    const { level = 'component', context } = this.props;
    const { error, errorId } = this.state;

    if (level === 'page') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Page Error
              </h1>
              <p className="text-muted-foreground mb-6">
                Something went wrong while loading this page.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <RefreshCcw className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                <Home className="h-4 w-4" />
                Go Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.renderErrorDetails()}
          </div>
        </div>
      );
    }

    if (level === 'feature') {
      return (
        <div className="border border-destructive/20 rounded-lg p-6 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                Feature Unavailable
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {context ? `The ${context} feature` : 'This feature'} is temporarily unavailable.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                >
                  <RefreshCcw className="h-3 w-3" />
                  Retry
                </button>
                <button
                  onClick={this.handleAutoRetry}
                  className="px-3 py-1.5 text-sm border border-border rounded hover:bg-accent transition-colors"
                >
                  Auto-retry in 5s
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Component level (default)
    return (
      <div className="border border-destructive/20 rounded-md p-4 bg-destructive/5">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="font-medium">Component Error</span>
          <button
            onClick={this.handleRetry}
            className="ml-auto flex items-center gap-1 px-2 py-1 text-xs bg-background border border-border rounded hover:bg-accent transition-colors"
          >
            <RefreshCcw className="h-3 w-3" />
            Retry
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-2">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              Error Details
            </summary>
            <div className="mt-2 text-xs font-mono bg-background p-2 rounded border overflow-auto max-h-32">
              {error?.message}
            </div>
          </details>
        )}
      </div>
    );
  }

  private renderErrorDetails() {
    const { error, errorInfo, errorId } = this.state;

    return (
      <details className="text-left">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <Bug className="h-4 w-4" />
          Technical Details
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Error ID:</div>
            <div className="text-xs font-mono bg-muted p-2 rounded">{errorId}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Message:</div>
            <div className="text-xs font-mono bg-muted p-2 rounded">{error?.message}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Stack:</div>
            <div className="text-xs font-mono bg-muted p-2 rounded max-h-32 overflow-auto">
              {error?.stack}
            </div>
          </div>
          <button
            onClick={this.copyErrorDetails}
            className="w-full px-3 py-2 text-xs border border-border rounded hover:bg-accent transition-colors"
          >
            Copy Error Details
          </button>
        </div>
      </details>
    );
  }
}

// Specialized error boundaries for common use cases

export const TaskListErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="feature"
    context="task list"
    fallback={
      <div className="border border-destructive/20 rounded-lg p-8 text-center bg-destructive/5">
        <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-3" />
        <h3 className="font-semibold mb-2">Task List Error</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Unable to load tasks. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const ChartErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="component"
    context="chart"
    fallback={
      <div className="border border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
        <div className="text-4xl mb-2 opacity-50">📊</div>
        <p className="text-sm text-muted-foreground">
          Chart unavailable
        </p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const DialogErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="component"
    context="dialog"
    fallback={
      <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span>Dialog Error - Please close and try again</span>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);