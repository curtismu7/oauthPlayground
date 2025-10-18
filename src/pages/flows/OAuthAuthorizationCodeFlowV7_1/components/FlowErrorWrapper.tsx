// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/components/FlowErrorWrapper.tsx
// V7.1 Flow Error Wrapper - Wrapper component for error boundary integration

import React from 'react';
import { FlowErrorBoundary } from './FlowErrorBoundary';
import { FLOW_CONSTANTS } from '../constants/flowConstants';

interface FlowErrorWrapperProps {
  children: React.ReactNode;
  flowName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRetry?: () => void;
  onReset?: () => void;
}

export const FlowErrorWrapper: React.FC<FlowErrorWrapperProps> = ({
  children,
  flowName = 'OAuth Authorization Code Flow V7.1',
  onError,
  onRetry,
  onReset,
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Flow Error Wrapper caught error:', error, errorInfo);
    
    // Call the provided error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Log to console for debugging
    console.error('Error in flow:', {
      flowName,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRetry = () => {
    console.log('Flow Error Wrapper: Retrying flow...');
    
    // Call the provided retry handler
    if (onRetry) {
      onRetry();
    }

    // Clear any stored error state
    try {
      sessionStorage.removeItem(FLOW_CONSTANTS.STORAGE_KEYS.CURRENT_STEP);
      sessionStorage.removeItem(FLOW_CONSTANTS.STORAGE_KEYS.AUTH_CODE);
    } catch (e) {
      console.warn('Failed to clear session storage:', e);
    }
  };

  const handleReset = () => {
    console.log('Flow Error Wrapper: Resetting flow...');
    
    // Call the provided reset handler
    if (onReset) {
      onReset();
    }

    // Clear all flow-related storage
    try {
      sessionStorage.removeItem(FLOW_CONSTANTS.STORAGE_KEYS.CURRENT_STEP);
      sessionStorage.removeItem(FLOW_CONSTANTS.STORAGE_KEYS.APP_CONFIG);
      sessionStorage.removeItem(FLOW_CONSTANTS.STORAGE_KEYS.PKCE_CODES);
      sessionStorage.removeItem(FLOW_CONSTANTS.STORAGE_KEYS.AUTH_CODE);
      localStorage.removeItem(FLOW_CONSTANTS.STORAGE_KEYS.FLOW_SOURCE);
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
  };

  return (
    <FlowErrorBoundary
      flowName={flowName}
      onError={handleError}
      onRetry={handleRetry}
      onReset={handleReset}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      {children}
    </FlowErrorBoundary>
  );
};

export default FlowErrorWrapper;
