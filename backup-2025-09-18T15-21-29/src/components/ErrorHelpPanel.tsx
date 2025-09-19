/* eslint-disable */
import React from 'react';
import styled from 'styled-components';
const ErrorHelpContainer = styled.div`
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 2px solid #fecaca;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1rem 0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const ErrorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

  font-size: 1.5rem;
`;

const ErrorTitle = styled.h3`
  color: #dc2626;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
`;

const ErrorMessage = styled.p`
  color: #7f1d1d;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const ChecklistContainer = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
`;

const ChecklistTitle = styled.h4`
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChecklistItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
`;

const CheckIcon = styled.div`
  color: #10b981;
  font-size: 0.875rem;
  margin-top: 0.125rem;
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  transition: background-color 0.2s;

  &:hover {
    background: #b91c1c;
  }
`;

interface ErrorHelpPanelProps {
  errorType?: 'configuration' | 'network' | 'oauth' | 'general';
  onRefresh?: () => void;
  onOpenSettings?: () => void;
  onDismiss?: () => void;
}

const ErrorHelpPanel: React.FC<ErrorHelpPanelProps> = ({ 
  errorType = 'general', 
  onRefresh, 
  onOpenSettings,
  onDismiss 
}) => {
  const getErrorSpecificChecks = () => {
    switch (errorType) {
      case 'configuration':
        return [
          'Environment ID is correct and matches your PingOne environment',
          'Client ID is valid and active in your PingOne application',
          'Client Secret is correct (if using confidential client)',
          'Redirect URI matches exactly what\'s configured in PingOne',
          'Authorization endpoint URL is correct for your environment'
        ];
      case 'network':
        return [
          'Internet connection is stable',
          'PingOne services are accessible from your network',
          'No firewall blocking HTTPS requests to auth.pingone.com',
          'DNS resolution is working correctly'
        ];
      case 'oauth':
        return [
          'OAuth flow parameters are correctly configured',
          'Required scopes are enabled in your PingOne application',
          'PKCE settings match between client and server',
          'Response type is appropriate for the flow being used',
          'State parameter is being generated and validated',
          'For 401 errors: Verify client credentials are correct',
          'For 401 errors: Check if client secret is required for your app type',
          'For 401 errors: Ensure redirect_uri matches exactly in PingOne',
          'For 401 errors: Verify your application is enabled in PingOne'
        ];
      default:
        return [
          'All configuration settings are properly filled out',
          'PingOne environment is active and accessible',
          'OAuth application is properly configured',
          'Network connectivity is working',
          'Browser is up to date and supports modern web standards'
        ];
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'configuration':
        return 'Configuration Error Detected';
      case 'network':
        return 'Network Connection Issue';
      case 'oauth':
        return 'OAuth Flow Error';
      default:
        return 'Application Error Detected';
    }
  };

  const getErrorMessage = () => {
    switch (errorType) {
      case 'configuration':
        return 'There seems to be an issue with your OAuth configuration. Please verify the following settings:';
      case 'network':
        return 'Unable to connect to PingOne services. Please check your network connection and verify:';
      case 'oauth':
        return 'The OAuth flow encountered an error. Please verify your OAuth settings:';
      default:
        return 'An error occurred in the application. Please check the following to resolve the issue:';
    }
  };

  return (
    <ErrorHelpContainer>
      <ErrorHeader>
        <ErrorIcon>
          <FiAlertTriangle />
        </ErrorIcon>
        <ErrorTitle>{getErrorTitle()}</ErrorTitle>
      </ErrorHeader>
      
      <ErrorMessage>
        {getErrorMessage()}
      </ErrorMessage>

      <ChecklistContainer>
        <ChecklistTitle>
          <FiSettings />
          Troubleshooting Checklist
        </ChecklistTitle>
        
        {getErrorSpecificChecks().map((check, index) => (
          <ChecklistItem key={index}>
            <CheckIcon>
              <FiCheckCircle />
            </CheckIcon>
            <span>{check}</span>
          </ChecklistItem>
        ))}
      </ChecklistContainer>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {onRefresh && (
          <ActionButton onClick={onRefresh}>
            <FiRefreshCw />
            Refresh Page
          </ActionButton>
        )}
        {onOpenSettings && (
          <ActionButton onClick={onOpenSettings}>
            <FiSettings />
            Open Settings
          </ActionButton>
        )}
        {onDismiss && (
          <ActionButton 
            onClick={onDismiss}
            style={{ background: '#6b7280', color: 'white' }}
          >
            <FiX />
            Dismiss
          </ActionButton>
        )}
      </div>
    </ErrorHelpContainer>
  );
};

export default ErrorHelpPanel;
