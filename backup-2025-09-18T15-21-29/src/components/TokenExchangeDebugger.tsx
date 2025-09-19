/* eslint-disable */
import React, { useState } from 'react';
import styled from 'styled-components';
import {  FiCheckCircle, FiXCircle, FiCopy, FiRefreshCw 81 } from 'react-icons/fi';
import { credentialManager } from '../utils/credentialManager';

const DebuggerContainer = styled.div`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1rem 0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const DebuggerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const DebuggerIcon = styled.div`
  color: #d97706;
  font-size: 1.5rem;
`;

const DebuggerTitle = styled.h3`
  color: #92400e;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
`;

const DebuggerContent = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const DebugSection = styled.div`
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const CheckItem = styled.div<{ $status: 'success' | 'error' | 'warning' | 'info' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  
  ${props => {
    switch (props.$status) {
      case 'success':
        return `
          background-color: #f0fdf4;
          color: #166534;
        `;
      case 'error':
        return `
          background-color: #fef2f2;
          color: #dc2626;
        `;
      case 'warning':
        return `
          background-color: #fffbeb;
          color: #92400e;
        `;
      case 'info':
      default:
        return `
          background-color: #eff6ff;
          color: #1e40af;
        `;
    }
  }}
`;

const CodeBlock = styled.div`
  background: #1f2937;
  color: #f9fafb;
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  overflow-x: auto;
  margin: 0.5rem 0;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const TokenExchangeDebugger: React.FC = () => {
  const [debugResults, setDebugResults] = useState<unknown>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    
    try {

      const sessionCredentials = credentialManager.getSessionCredentials();
      
      const results = {
        timestamp: new Date().toISOString(),
        credentials: {
          environmentId: credentials.environmentId,
          clientId: credentials.clientId,
          hasClientSecret: !!sessionCredentials.clientSecret,
          clientSecretLength: sessionCredentials.clientSecret?.length || 0,
          tokenEndpoint: credentials.tokenEndpoint,
          redirectUri: credentials.redirectUri
        },
        checks: []
      };

      // Check 1: Environment ID
      if (credentials.environmentId) {
        results.checks.push({
          id: 'env-id',
          name: 'Environment ID',
          status: 'success',
          message: `Environment ID is set: ${credentials.environmentId}`,
          details: 'Environment ID format looks correct'
        });
      } else {
        results.checks.push({
          id: 'env-id',
          name: 'Environment ID',
          status: 'error',
          message: 'Environment ID is missing',
          details: 'This is required for all PingOne API calls'
        });
      }

      // Check 2: Client ID
      if (credentials.clientId) {
        results.checks.push({
          id: 'client-id',
          name: 'Client ID',
          status: 'success',
          message: `Client ID is set: ${credentials.clientId}`,
          details: 'Client ID format looks correct'
        });
      } else {
        results.checks.push({
          id: 'client-id',
          name: 'Client ID',
          status: 'error',
          message: 'Client ID is missing',
          details: 'This is required for OAuth token exchange'
        });
      }

      // Check 3: Client Secret
      if (sessionCredentials.clientSecret) {
        results.checks.push({
          id: 'client-secret',
          name: 'Client Secret',
          status: 'success',
          message: `Client Secret is set (${sessionCredentials.clientSecret.length} characters)`,
          details: 'Client secret is present for confidential clients'
        });
      } else {
        results.checks.push({
          id: 'client-secret',
          name: 'Client Secret',
          status: 'warning',
          message: 'Client Secret is not set',
          details: 'This may be required if your PingOne app is configured as a confidential client'
        });
      }

      // Check 4: Token Endpoint
      if (credentials.tokenEndpoint) {
        const isValidEndpoint = credentials.tokenEndpoint.includes('auth.pingone.com') && 
                               credentials.tokenEndpoint.includes('/as/token');
        results.checks.push({
          id: 'token-endpoint',
          name: 'Token Endpoint',
          status: isValidEndpoint ? 'success' : 'error',
          message: `Token Endpoint: ${credentials.tokenEndpoint}`,
          details: isValidEndpoint ? 'Token endpoint URL looks correct' : 'Token endpoint URL may be incorrect'
        });
      } else {
        results.checks.push({
          id: 'token-endpoint',
          name: 'Token Endpoint',
          status: 'error',
          message: 'Token Endpoint is missing',
          details: 'This is required for token exchange'
        });
      }

      // Check 5: Redirect URI
      if (credentials.redirectUri) {
        const isValidUri = credentials.redirectUri.startsWith('http') && 
                          (credentials.redirectUri.includes('localhost') || credentials.redirectUri.includes('https://'));
        results.checks.push({
          id: 'redirect-uri',
          name: 'Redirect URI',
          status: isValidUri ? 'success' : 'warning',
          message: `Redirect URI: ${credentials.redirectUri}`,
          details: isValidUri ? 'Redirect URI format looks correct' : 'Redirect URI should be a valid HTTP/HTTPS URL'
        });
      } else {
        results.checks.push({
          id: 'redirect-uri',
          name: 'Redirect URI',
          status: 'error',
          message: 'Redirect URI is missing',
          details: 'This is required for OAuth flows'
        });
      }

      // Check 6: Network connectivity
      try {
        const testResponse = await fetch(credentials.tokenEndpoint, {
          method: 'HEAD',
          mode: 'no-cors'
        });
        results.checks.push({
          id: 'network',
          name: 'Network Connectivity',
          status: 'success',
          message: 'Token endpoint is reachable',
          details: 'Network connection to PingOne is working'
        });
      } catch (_error) {
        results.checks.push({
          id: 'network',
          name: 'Network Connectivity',
          status: 'error',
          message: 'Cannot reach token endpoint',
          details: `Network error: ${error}`
        });
      }

      setDebugResults(results);
    } catch (_error) {
      setDebugResults({
        timestamp: new Date().toISOString(),
        error: `Diagnostic failed: ${error}`,
        checks: []
      });
    } finally {
      setIsRunning(false);
    }
  };

  const copyResults = () => {
    if (debugResults) {
      navigator.clipboard.writeText(JSON.stringify(debugResults, null, 2));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <FiCheckCircle />;
      case 'error':
        return <FiXCircle />;
      case 'warning':
        return <FiAlertTriangle />;
      default:
        return <FiAlertTriangle />;
    }
  };

  return (
    <DebuggerContainer>
      <DebuggerHeader>
        <DebuggerIcon>
          <FiAlertTriangle />
        </DebuggerIcon>
        <DebuggerTitle>Token Exchange Debugger</DebuggerTitle>
      </DebuggerHeader>
      
      <DebuggerContent>
        <p style={{ margin: '0 0 1rem 0', color: '#374151' }}>
          This tool helps diagnose 401 Unauthorized errors during token exchange. 
          It checks your configuration and provides specific guidance.
        </p>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <ActionButton onClick={runDiagnostics} disabled={isRunning}>
            <FiRefreshCw style={{ animation: isRunning ? 'spin 1s linear infinite' : 'none' }} />
            {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </ActionButton>
          
          {debugResults && (
            <ActionButton onClick={copyResults}>
              <FiCopy />
              Copy Results
            </ActionButton>
          )}
        </div>

        {debugResults && (
          <DebugSection>
            <SectionTitle>Diagnostic Results</SectionTitle>
            <CodeBlock>
              {JSON.stringify(debugResults, null, 2)}
            </CodeBlock>
          </DebugSection>
        )}

        {debugResults?.checks && (
          <DebugSection>
            <SectionTitle>Configuration Checks</SectionTitle>
            {debugResults.checks.map((check: unknown) => (
              <CheckItem key={check.id} $status={check.status}>
                {getStatusIcon(check.status)}
                <div>
                  <div style={{ fontWeight: '500' }}>{check.message}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{check.details}</div>
                </div>
              </CheckItem>
            ))}
          </DebugSection>
        )}

        <DebugSection>
          <SectionTitle>Common 401 Error Solutions</SectionTitle>
          <CheckItem $status="info">
            <FiAlertTriangle />
            <div>
              <div style={{ fontWeight: '500' }}>Check PingOne Application Settings</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                Verify your application is enabled and the client type matches your flow
              </div>
            </div>
          </CheckItem>
          <CheckItem $status="info">
            <FiAlertTriangle />
            <div>
              <div style={{ fontWeight: '500' }}>Verify Client Secret</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                If your app is confidential, ensure the client secret is correct and not expired
              </div>
            </div>
          </CheckItem>
          <CheckItem $status="info">
            <FiAlertTriangle />
            <div>
              <div style={{ fontWeight: '500' }}>Check Redirect URI</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                The redirect_uri must match exactly what's configured in PingOne
              </div>
            </div>
          </CheckItem>
        </DebugSection>
      </DebuggerContent>
    </DebuggerContainer>
  );
};

export default TokenExchangeDebugger;
