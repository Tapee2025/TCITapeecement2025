import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { clearCache } from '../../hooks/useCache';
import { clearSupabaseCache } from '../../lib/supabase';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    const now = Date.now();
    const timeSinceLastError = now - this.state.lastErrorTime;
    
    // If errors are happening rapidly, increment counter
    const newErrorCount = timeSinceLastError < 60000 ? this.state.errorCount + 1 : 1;
    
    this.setState({
      error,
      errorInfo,
      errorCount: newErrorCount,
      lastErrorTime: now
    });
    
    // If we've had multiple errors in a short time, try to recover automatically
    if (newErrorCount >= 3) {
      this.handleRecovery();
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };
  
  handleRecovery = () => {
    // Clear all caches
    clearCache();
    clearSupabaseCache();
    
    // Reset error state
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0
    });
    
    // If errors persist, reload the page
    if (this.state.errorCount >= 5) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-error-600" />
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full btn btn-primary flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </button>
              
              <button
                onClick={this.handleReset}
                className="w-full btn btn-outline"
              >
                Try Again
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;