import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import { logger } from '../utils/logger';

// Error boundary state interface
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

// Error boundary props interface
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  flowType?: string;
}

// Styled components for error display
const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  text-align: center;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const ErrorIcon = styled.div`
  color: ${({ theme }) => theme.colors.error};
  margin-bottom: 1rem;
  
  svg {
    width: 4rem;
    height: 4rem;
  }
`;

const ErrorTitle = styled.h2`
  color: ${({ theme }) => theme.colors.error};
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  max-width: 600px;
`;

const ErrorDetails = styled.details`
  margin-bottom: 2rem;
  text-align: left;
  max-width: 800px;
  width: 100%;
  
  summary {
    cursor: pointer;
    color: ${({ theme }) => theme.colors.gray700};
    font-weight: 500;
    margin-bottom: 1rem;
    padding: 0.5rem;
    background-color: ${({ theme }) => theme.colors.gray50};
    border-radius: 0.25rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
  }
  
  pre {
    background-color: ${({ theme }) => theme.colors.gray50};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.25rem;
    padding: 1rem;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.gray800};
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const RetryButton = styled(ActionButton)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const HomeButton = styled(ActionButton)`
  background-color: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray700};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.gray200};
  }
`;

// OAuth Flow Error Boundary Component
export class OAuthFlowErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { flowType, onError } = this.props;
    const { errorId } = this.state;

    // Log the error
    logger.error(`[${flowType || 'OAuthFlow'}] Error Boundary caught error:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId
    });

    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Report error to external service (if implemented)
    this.reportError(error, errorInfo, errorId);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary if props changed and resetOnPropsChange is true
    if (hasError && resetOnPropsChange) {
      if (resetKeys && prevProps.resetKeys) {
        const hasResetKeyChanged = resetKeys.some((key, index) => 
          key !== prevProps.resetKeys?.[index]
        );
        
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    // This could be extended to report to external services like Sentry
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      flowType: this.props.flowType
    };

    // Log error report
    logger.error(`[ErrorReporting] Error report generated:`, errorReport);

    // TODO: Implement external error reporting service
    // Example: Sentry.captureException(error, { extra: errorReport });
  };

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <ErrorContainer>
          <ErrorIcon>
            <FiAlertTriangle />
          </ErrorIcon>
          
          <ErrorTitle>Something went wrong</ErrorTitle>
          
          <ErrorMessage>
            An unexpected error occurred while processing the OAuth flow. 
            This has been logged and we'll work to fix it. You can try again 
            or return to the home page.
          </ErrorMessage>

          {error && (
            <ErrorDetails>
              <summary>Error Details (ID: {errorId})</summary>
              <pre>
                {error.message}
                {error.stack && `\n\nStack Trace:\n${error.stack}`}
                {errorInfo?.componentStack && `\n\nComponent Stack:\n${errorInfo.componentStack}`}
              </pre>
            </ErrorDetails>
          )}

          <ButtonGroup>
            <RetryButton onClick={this.handleRetry}>
              <FiRefreshCw size={16} />
              Try Again
            </RetryButton>
            
            <HomeButton onClick={this.handleGoHome}>
              <FiHome size={16} />
              Go Home
            </HomeButton>
          </ButtonGroup>
        </ErrorContainer>
      );
    }

    return children;
  }
}

// Higher-order component for wrapping OAuth flows with error boundary
export const withOAuthFlowErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  flowType?: string
) => {
  const WithErrorBoundary = (props: P) => (
    <OAuthFlowErrorBoundary flowType={flowType}>
      <WrappedComponent {...props} />
    </OAuthFlowErrorBoundary>
  );

  WithErrorBoundary.displayName = `withOAuthFlowErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundary;
};

// Hook for error boundary functionality
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

export default OAuthFlowErrorBoundary;
