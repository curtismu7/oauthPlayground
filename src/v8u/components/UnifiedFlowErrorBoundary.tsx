import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorBoundary from '../../components/ErrorBoundary';

interface UnifiedFlowErrorBoundaryProps {
  children: ReactNode;
  flowType?: string;
  specVersion?: string;
}

/**
 * Specialized ErrorBoundary for Unified OAuth Flow
 * Provides flow-specific error handling and recovery options
 */
export class UnifiedFlowErrorBoundary extends Component<UnifiedFlowErrorBoundaryProps> {
  private getFlowContext = (): string => {
    const { flowType, specVersion } = this.props;
    const parts = [];
    if (specVersion) parts.push(specVersion);
    if (flowType) parts.push(flowType);
    return parts.length > 0 ? parts.join(' - ') : 'Unified Flow';
  };

  private handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Log flow-specific errors
    console.error(`Unified Flow Error [${this.getFlowContext()}]:`, error, errorInfo);

    // Try to preserve user's current state before reload
    try {
      const currentState = {
        flowType: this.props.flowType,
        specVersion: this.props.specVersion,
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
        },
      };

      sessionStorage.setItem('unifiedFlowErrorRecovery', JSON.stringify(currentState));
    } catch (e) {
      console.warn('Could not save error recovery state:', e);
    }
  };

  private getRecoveryOptions = () => {
    const { flowType, specVersion } = this.props;
    
    return [
      {
        id: 'retry',
        label: 'Try Again',
        primary: true,
        action: () => window.location.reload(),
      },
      {
        id: 'reset-flow',
        label: 'Reset Flow',
        primary: false,
        action: () => {
          const basePath = '/v8u/unified';
          if (flowType) {
            window.location.href = `${basePath}/${flowType}/0`;
          } else {
            window.location.href = basePath;
          }
        },
      },
      {
        id: 'change-spec',
        label: 'Change Spec Version',
        primary: false,
        action: () => {
          if (flowType) {
            window.location.href = `/v8u/unified/${flowType}/0`;
          } else {
            window.location.href = '/v8u/unified';
          }
        },
      },
      {
        id: 'go-home',
        label: 'Go to Dashboard',
        primary: false,
        action: () => {
          window.location.href = '/';
        },
      },
    ];
  };

  render() {
    return (
      <ErrorBoundary
        onError={this.handleError}
        fallback={
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: '2rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            margin: '1rem',
          }}>
            <h2 style={{ color: '#dc2626', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
              🚨 Unified Flow Error
            </h2>
            
            <p style={{ color: '#7f1d1d', fontSize: '0.875rem', textAlign: 'center', maxWidth: '600px', marginBottom: '1.5rem' }}>
              An error occurred in the <strong>{this.getFlowContext()}</strong>. 
              Your work has been preserved and you can recover using the options below.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {this.getRecoveryOptions().map((option) => (
                <button
                  key={option.id}
                  onClick={option.action}
                  type="button"
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    border: '1px solid',
                    background: option.primary ? '#dc2626' : 'white',
                    color: option.primary ? 'white' : '#dc2626',
                    borderColor: '#dc2626',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    if (option.primary) {
                      e.currentTarget.style.background = '#b91c1c';
                    } else {
                      e.currentTarget.style.background = '#fef2f2';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = option.primary ? '#dc2626' : 'white';
                  }}
                  onFocus={(e) => {
                    if (option.primary) {
                      e.currentTarget.style.background = '#b91c1c';
                    } else {
                      e.currentTarget.style.background = '#fef2f2';
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = option.primary ? '#dc2626' : 'white';
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <small style={{ color: '#9ca3af' }}>
                💡 Tip: Your credentials and flow settings are automatically saved. 
                Try refreshing the page or selecting a different recovery option.
              </small>
            </div>
          </div>
        }
      >
        {this.props.children}
      </ErrorBoundary>
    );
  }
}

export default UnifiedFlowErrorBoundary;
