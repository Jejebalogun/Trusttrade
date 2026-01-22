'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-8 glass-card text-center">
          <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
          <p className="text-gray-400 mb-4 text-sm">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use with hooks
interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  title?: string;
  compact?: boolean;
}

export function ErrorFallback({ error, resetError, title = 'Something went wrong', compact = false }: ErrorFallbackProps) {
  if (compact) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-400">{title}</p>
            {error && <p className="text-xs text-gray-400">{error.message}</p>}
          </div>
        </div>
        <button
          onClick={resetError}
          className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 glass-card text-center">
      <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {error && (
        <p className="text-gray-400 mb-4 text-sm">{error.message}</p>
      )}
      <button
        onClick={resetError}
        className="btn-primary inline-flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}

// Hook for error handling in functional components
import { useState, useCallback } from 'react';

export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error) => {
    console.error('Error handled:', error);
    setError(error);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const withErrorHandling = useCallback(
    <T,>(promise: Promise<T>): Promise<T | null> => {
      return promise.catch((err) => {
        handleError(err instanceof Error ? err : new Error(String(err)));
        return null;
      });
    },
    [handleError]
  );

  return { error, handleError, clearError, withErrorHandling };
}
