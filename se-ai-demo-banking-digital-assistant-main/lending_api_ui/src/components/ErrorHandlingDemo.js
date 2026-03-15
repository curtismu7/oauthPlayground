import React, { useState } from 'react';
import { useNotifications } from './NotificationSystem';
import { useApiErrorHandling } from '../hooks/useErrorHandling';
import { LoadingButton } from './LoadingComponents';
import { FallbackRouter } from './FallbackComponents';

/**
 * Demo component to test error handling functionality
 */
const ErrorHandlingDemo = () => {
  const [demoError, setDemoError] = useState(null);
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();
  const { error, executeWithErrorHandling, clearError } = useApiErrorHandling();

  const simulateSuccess = () => {
    showSuccess('Operation completed successfully!');
  };

  const simulateError = () => {
    showError('This is a test error message', {
      title: 'Test Error',
      details: 'This is just a demonstration of error notifications'
    });
  };

  const simulateWarning = () => {
    showWarning('This is a warning message', {
      title: 'Warning',
      duration: 7000
    });
  };

  const simulateInfo = () => {
    showInfo('This is an informational message');
  };

  const simulateApiError = async () => {
    await executeWithErrorHandling(async () => {
      // Simulate API call that fails
      throw new Error('Simulated API failure');
    }, {
      customMessage: 'Failed to perform demo operation'
    });
  };

  const simulateNetworkError = () => {
    const networkError = new Error('Network connection failed');
    networkError.code = 'NETWORK_ERROR';
    setDemoError(networkError);
  };

  const simulate404Error = () => {
    const notFoundError = new Error('Resource not found');
    notFoundError.response = { status: 404 };
    setDemoError(notFoundError);
  };

  const simulate403Error = () => {
    const forbiddenError = new Error('Access denied');
    forbiddenError.response = { 
      status: 403,
      data: {
        error: 'insufficient_scope',
        required_scopes: ['admin:read', 'users:write']
      }
    };
    forbiddenError.details = {
      requiredScopes: ['admin:read', 'users:write']
    };
    setDemoError(forbiddenError);
  };

  const clearDemoError = () => {
    setDemoError(null);
    clearError();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Error Handling Demo</h2>
        <button className="btn btn-secondary" onClick={clearDemoError}>
          Clear Errors
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Notification Tests</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button className="btn btn-success" onClick={simulateSuccess}>
            Show Success
          </button>
          <button className="btn btn-danger" onClick={simulateError}>
            Show Error
          </button>
          <button className="btn" style={{ backgroundColor: '#f59e0b', color: 'white' }} onClick={simulateWarning}>
            Show Warning
          </button>
          <button className="btn" style={{ backgroundColor: '#3b82f6', color: 'white' }} onClick={simulateInfo}>
            Show Info
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>API Error Tests</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <LoadingButton 
            className="btn btn-primary" 
            onClick={simulateApiError}
          >
            Simulate API Error
          </LoadingButton>
          <button className="btn btn-secondary" onClick={simulateNetworkError}>
            Network Error
          </button>
          <button className="btn btn-secondary" onClick={simulate404Error}>
            404 Error
          </button>
          <button className="btn btn-secondary" onClick={simulate403Error}>
            403 Error
          </button>
        </div>
      </div>

      {(demoError || error) && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Error Display</h3>
          <FallbackRouter 
            error={demoError || error}
            onRetry={() => {
              console.log('Retry clicked');
              clearDemoError();
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ErrorHandlingDemo;