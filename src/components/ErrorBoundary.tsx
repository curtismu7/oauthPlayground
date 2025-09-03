import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  padding: 2rem;
  margin: 1rem;
  border: 2px solid #dc3545;
  border-radius: 0.5rem;
  background-color: #f8d7da;
  color: #721c24;
`;

const ErrorTitle = styled.h2`
  margin: 0 0 1rem 0;
  color: #721c24;
  font-size: 1.5rem;
`;

const ErrorMessage = styled.pre`
  background-color: #f1f3f4;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  margin: 1rem 0;
  border: 1px solid #dee2e6;
`;

const ErrorStack = styled.pre`
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  margin: 1rem 0;
  border: 1px solid #dee2e6;
  max-height: 300px;
  overflow-y: auto;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $variant }) => {
    if ($variant === 'primary') {
      return `
        background-color: #007bff;
        color: white;
        
        &:hover {
          background-color: #0056b3;
        }
      `;
    } else {
      return `
        background-color: #6c757d;
        color: white;
        
        &:hover {
          background-color: #545b62;
        }
      `;
    }
  }}
`;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [ErrorBoundary] Error caught:', error);
    console.error('🚨 [ErrorBoundary] Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement error reporting service
      console.error('🚨 [ErrorBoundary] Production error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state when props change (useful for route changes)
    if (this.props.resetOnPropsChange && prevProps.children !== this.props.children) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorContainer>
          <ErrorTitle>🚨 Something went wrong</ErrorTitle>
          
          <p>
            An unexpected error occurred. This has been logged and our team has been notified.
          </p>

          {this.state.error && (
            <div>
              <strong>Error:</strong>
              <ErrorMessage>{this.state.error.message}</ErrorMessage>
            </div>
          )}

          {this.state.errorInfo && this.state.errorInfo.componentStack && (
            <div>
              <strong>Component Stack:</strong>
              <ErrorStack>{this.state.errorInfo.componentStack}</ErrorStack>
            </div>
          )}

          <ActionButtons>
            <Button $variant="primary" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button $variant="secondary" onClick={this.handleReload}>
              Reload Page
            </Button>
          </ActionButtons>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// HOC for functional components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Flow-specific error boundary
export const FlowErrorBoundary: React.FC<{ children: ReactNode; flowName: string }> = ({ children, flowName }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      console.error(`🚨 [${flowName}] Flow error:`, error);
      console.error(`🚨 [${flowName}] Error info:`, errorInfo);
    }}
    fallback={
      <ErrorContainer>
        <ErrorTitle>🚨 {flowName} Flow Error</ErrorTitle>
        <p>
          An error occurred while executing the {flowName} flow. Please try again or contact support if the problem persists.
        </p>
        <ActionButtons>
          <Button $variant="primary" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </ActionButtons>
      </ErrorContainer>
    }
  >
    {children}
  </ErrorBoundary>
);
