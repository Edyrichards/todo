import React from 'react';
import { ErrorBoundary } from './ui/error-boundary';
import { AlertTriangle, Calendar, BarChart3, Kanban, RotateCcw, List } from 'lucide-react';

// View-specific error boundaries with tailored fallbacks

export const TaskViewErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="feature"
    context="task view"
    fallback={
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-96">
        <div className="relative mb-6">
          <List className="h-16 w-16 text-muted-foreground/30" />
          <AlertTriangle className="absolute -top-2 -right-2 h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Task View Error</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          We're having trouble loading your tasks. This might be due to a synchronization issue or corrupted data.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reload Tasks
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('todo-store');
              window.location.reload();
            }}
            className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
          >
            Reset Local Data
          </button>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const CalendarViewErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="feature"
    context="calendar view"
    fallback={
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-96">
        <div className="relative mb-6">
          <Calendar className="h-16 w-16 text-muted-foreground/30" />
          <AlertTriangle className="absolute -top-2 -right-2 h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Calendar View Error</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Unable to display the calendar view. This could be due to date parsing issues or calendar library problems.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reload Calendar
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const KanbanViewErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="feature"
    context="kanban view"
    fallback={
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-96">
        <div className="relative mb-6">
          <Kanban className="h-16 w-16 text-muted-foreground/30" />
          <AlertTriangle className="absolute -top-2 -right-2 h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Kanban Board Error</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          The Kanban board encountered an error. This might be related to drag-and-drop functionality or board layout.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reload Board
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const AnalyticsViewErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="feature"
    context="analytics view"
    fallback={
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-96">
        <div className="relative mb-6">
          <BarChart3 className="h-16 w-16 text-muted-foreground/30" />
          <AlertTriangle className="absolute -top-2 -right-2 h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Analytics Error</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Unable to generate analytics. This could be due to insufficient data or chart rendering issues.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reload Analytics
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
          >
            Go Back
          </button>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Tip: Try creating more tasks to generate meaningful analytics
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

// Root app error boundary for catastrophic failures
export const AppErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="page"
    context="application"
    onError={(error, errorInfo) => {
      // Log critical app errors
      console.error('Critical App Error:', error, errorInfo);
      
      // In production, send to error monitoring
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry.captureException(error, { level: 'fatal' });
      }
    }}
    fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="space-y-4">
            <div className="relative inline-block">
              <div className="h-24 w-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Oops! Something went wrong
              </h1>
              <p className="text-muted-foreground">
                The application encountered an unexpected error and needs to restart.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <RotateCcw className="h-5 w-5" />
              Restart Application
            </button>
            
            <button
              onClick={() => {
                // Clear all local storage and reload
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              className="w-full px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Reset All Data & Restart
            </button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>If the problem persists:</p>
            <ul className="space-y-1">
              <li>• Try refreshing your browser</li>
              <li>• Check your internet connection</li>
              <li>• Clear browser cache and cookies</li>
            </ul>
          </div>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

// Specialized boundary for data operations
export const DataOperationErrorBoundary: React.FC<{ 
  children: React.ReactNode;
  operation?: string;
}> = ({ children, operation = "operation" }) => (
  <ErrorBoundary
    level="component"
    context={`data ${operation}`}
    resetOnPropsChange={true}
    fallback={
      <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground">
              {operation.charAt(0).toUpperCase() + operation.slice(1)} Failed
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              This operation couldn't be completed. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-xs px-2 py-1 bg-background border border-border rounded hover:bg-accent transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

// HOC for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: {
    level?: 'page' | 'component' | 'feature';
    context?: string;
    fallback?: React.ReactNode;
  }
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}