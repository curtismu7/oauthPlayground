// OIDC Device Code Flow implementation following V3 patterns

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiSettings, FiRefreshCw, FiServer, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/NewAuthContext';
import { showFlowSuccess, showFlowError } from '../../components/CentralizedSuccessMessage';
import { logger } from '../../utils/logger';
import { requestDeviceAuthorization, validateDeviceAuthorizationResponse, DeviceAuthorizationResponse } from '../../utils/deviceCode';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import { EnhancedStepFlowV2 } from '../../components/EnhancedStepFlowV2';
import { useFlowStepManager } from '../../utils/flowStepSystem';
import DeviceVerification from '../../components/device/DeviceVerification';
import DevicePolling from '../../components/device/DevicePolling';
import { DeviceCodeFlowState, DeviceCodeTokens, DeviceCodeStep } from '../../types/deviceCode';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  opacity: 0.9;
  margin: 0;
  line-height: 1.6;
`;

const CredentialsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormLabel = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`;

const FormInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const InfoBox = styled.div`
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  color: #1e40af;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const StatusSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const DeviceCodeFlowOIDC: React.FC = () => {
  const authContext = useAuth();
  const { config } = authContext;
  
  // Use the new step management system
  const stepManager = useFlowStepManager({
    flowType: 'device-code',
    persistKey: 'device_code_flow_step_manager',
    defaultStep: 0,
    enableAutoAdvance: true
  });

  // Flow state
  const [flowState, setFlowState] = useState<DeviceCodeFlowState>({
    config: {
      deviceAuthorizationEndpoint: config?.deviceAuthorizationEndpoint || '',
      tokenEndpoint: config?.tokenEndpoint || '',
      clientId: config?.clientId || '',
      scope: ['openid', 'profile', 'email'],
      environmentId: config?.environmentId || ''
    },
    status: 'idle',
    pollingAttempts: 0,
    pollingDuration: 0
  });

  const [isRequestingAuthorization, setIsRequestingAuthorization] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Auto-populate endpoints when environment ID changes
  useEffect(() => {
    if (flowState.config.environmentId && !flowState.config.environmentId.includes('{')) {
      const deviceEndpoint = `https://auth.pingone.com/${flowState.config.environmentId}/as/device`;
      const tokenEndpoint = `https://auth.pingone.com/${flowState.config.environmentId}/as/token`;
      
      setFlowState(prev => ({
        ...prev,
        config: {
          ...prev.config,
          deviceAuthorizationEndpoint: deviceEndpoint,
          tokenEndpoint: tokenEndpoint
        }
      }));
    }
  }, [flowState.config.environmentId]);

  // Request device authorization
  const requestDeviceAuth = useCallback(async () => {
    logger.info('DeviceCodeFlow', 'Starting device authorization request', {
      endpoint: flowState.config.deviceAuthorizationEndpoint,
      clientId: flowState.config.clientId.substring(0, 8) + '...',
      scopes: flowState.config.scope
    });

    setIsRequestingAuthorization(true);
    showFlowSuccess('🎯 Requesting Device Authorization', 'Sending device authorization request to PingOne...');

    try {
      // Validate required fields
      if (!flowState.config.deviceAuthorizationEndpoint || !flowState.config.clientId) {
        throw new Error('Device authorization endpoint and Client ID are required');
      }

      const response = await requestDeviceAuthorization(
        flowState.config.deviceAuthorizationEndpoint,
        flowState.config.clientId,
        flowState.config.scope
      );

      if (!validateDeviceAuthorizationResponse(response)) {
        throw new Error('Invalid device authorization response received');
      }

      setFlowState(prev => ({
        ...prev,
        deviceCode: response.device_code,
        userCode: response.user_code,
        verificationUri: response.verification_uri,
        verificationUriComplete: response.verification_uri_complete,
        expiresIn: response.expires_in,
        interval: response.interval || 5,
        startTime: Date.now(),
        status: 'verifying',
        error: undefined
      }));

      showFlowSuccess('📱 Device Authorization Received', 'User code and verification URL generated successfully. Please complete verification on your device.');
      
      logger.success('DeviceCodeFlow', 'Device authorization successful', {
        userCode: response.user_code,
        expiresIn: response.expires_in,
        hasCompleteUri: !!response.verification_uri_complete
      });

      return { success: true };
    } catch (error) {
      logger.error('DeviceCodeFlow', 'Device authorization failed', error);
      showFlowError(`Failed to request device authorization: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsRequestingAuthorization(false);
    }
  }, [flowState.config]);

  // Handle successful token polling
  const handlePollingSuccess = useCallback(async (tokens: DeviceCodeTokens) => {
    logger.success('DeviceCodeFlow', 'Token polling successful', {
      hasAccessToken: !!tokens.access_token,
      hasIdToken: !!tokens.id_token,
      hasRefreshToken: !!tokens.refresh_token
    });

    setFlowState(prev => ({
      ...prev,
      tokens,
      status: 'success'
    }));

    // Store tokens
    await storeOAuthTokens(tokens, 'device-code');
    
    showFlowSuccess('✅ Device Authorization Complete', 'Access token received successfully! Your device is now authorized.');
  }, []);

  // Handle polling error
  const handlePollingError = useCallback((error: Error) => {
    logger.error('DeviceCodeFlow', 'Token polling failed', error);
    setFlowState(prev => ({
      ...prev,
      status: 'error',
      error: error.message
    }));
    showFlowError(`Device authorization failed: ${error.message}`);
  }, []);

  // Handle polling progress
  const handlePollingProgress = useCallback((attempt: number, status: string) => {
    setFlowState(prev => ({
      ...prev,
      pollingAttempts: attempt
    }));
    logger.info('DeviceCodeFlow', 'Polling progress', { attempt, status });
  }, []);

  // Start polling
  const startPolling = useCallback(() => {
    if (!flowState.deviceCode || !flowState.config.clientId || !flowState.config.tokenEndpoint) {
      showFlowError('Missing required data for polling');
      return;
    }

    setIsPolling(true);
    setFlowState(prev => ({ ...prev, status: 'polling' }));
    
    logger.info('DeviceCodeFlow', 'Starting token polling', {
      deviceCode: flowState.deviceCode.substring(0, 8) + '...',
      interval: flowState.interval
    });
  }, [flowState.deviceCode, flowState.config.clientId, flowState.config.tokenEndpoint, flowState.interval]);

  // Copy user code
  const handleCopyUserCode = useCallback(() => {
    logger.info('DeviceCodeFlow', 'User code copied');
  }, []);

  // Copy verification URI
  const handleCopyVerificationUri = useCallback(() => {
    logger.info('DeviceCodeFlow', 'Verification URI copied');
  }, []);

  // Reset flow
  const resetFlow = useCallback(() => {
    setFlowState({
      config: {
        deviceAuthorizationEndpoint: config?.deviceAuthorizationEndpoint || '',
        tokenEndpoint: config?.tokenEndpoint || '',
        clientId: config?.clientId || '',
        scope: ['openid', 'profile', 'email'],
        environmentId: config?.environmentId || ''
      },
      status: 'idle',
      pollingAttempts: 0,
      pollingDuration: 0
    });
    setIsPolling(false);
    logger.info('DeviceCodeFlow', 'Flow reset');
  }, [config]);

  // Define flow steps
  const steps: DeviceCodeStep[] = [
    {
      id: 'configure',
      title: 'Configure Device Code Flow',
      description: 'Set up your PingOne application credentials for device code flow',
      status: 'pending',
      canExecute: Boolean(flowState.config.deviceAuthorizationEndpoint && flowState.config.clientId),
      completed: Boolean(flowState.config.deviceAuthorizationEndpoint && flowState.config.clientId)
    },
    {
      id: 'request-authorization',
      title: 'Request Device Authorization',
      description: 'Get user code and verification URL from PingOne',
      status: 'pending',
      canExecute: Boolean(flowState.config.deviceAuthorizationEndpoint && flowState.config.clientId && !isRequestingAuthorization),
      completed: Boolean(flowState.deviceCode && flowState.userCode)
    },
    {
      id: 'verify-device',
      title: 'Verify Device',
      description: 'Complete device verification using QR code or manual entry',
      status: 'pending',
      canExecute: Boolean(flowState.deviceCode && flowState.userCode),
      completed: Boolean(flowState.status === 'success')
    }
  ];

  // Auto-start polling when verification step is active
  useEffect(() => {
    if (flowState.status === 'verifying' && !isPolling) {
      startPolling();
    }
  }, [flowState.status, isPolling, startPolling]);

  return (
    <Container>
      <Header>
        <Title>
          <FiServer />
          OIDC Device Code Flow
        </Title>
        <Subtitle>
          Authorize input-constrained devices using QR codes and user codes. Perfect for smart TVs, IoT devices, and CLI tools.
        </Subtitle>
      </Header>

      <EnhancedStepFlowV2
        steps={steps.map(step => ({
          id: step.id,
          title: step.title,
          description: step.description,
          icon: step.id === 'configure' ? <FiSettings /> : 
                step.id === 'request-authorization' ? <FiRefreshCw /> : 
                <FiCheckCircle />,
          category: step.id === 'configure' ? 'preparation' as const : 
                   step.id === 'request-authorization' ? 'token-exchange' as const : 
                   'cleanup' as const,
          content: (
            <div>
              {step.id === 'configure' && (
                <CredentialsSection>
                  <InfoBox>
                    <strong>Device Code Flow:</strong> This flow is designed for devices with limited input capabilities. 
                    Users will scan a QR code or enter a code manually to authorize the device.
                  </InfoBox>

                  <FormField>
                    <FormLabel>Environment ID *</FormLabel>
                    <FormInput
                      type="text"
                      value={flowState.config.environmentId}
                      onChange={(e) => setFlowState(prev => ({
                        ...prev,
                        config: { ...prev.config, environmentId: e.target.value }
                      }))}
                      placeholder="e.g., 12345678-1234-1234-1234-123456789012"
                      required
                    />
                  </FormField>

                  <FormField>
                    <FormLabel>Device Authorization Endpoint *</FormLabel>
                    <FormInput
                      type="url"
                      value={flowState.config.deviceAuthorizationEndpoint}
                      onChange={(e) => setFlowState(prev => ({
                        ...prev,
                        config: { ...prev.config, deviceAuthorizationEndpoint: e.target.value }
                      }))}
                      placeholder="https://auth.pingone.com/{env-id}/as/device"
                      required
                    />
                  </FormField>

                  <FormField>
                    <FormLabel>Token Endpoint *</FormLabel>
                    <FormInput
                      type="url"
                      value={flowState.config.tokenEndpoint}
                      onChange={(e) => setFlowState(prev => ({
                        ...prev,
                        config: { ...prev.config, tokenEndpoint: e.target.value }
                      }))}
                      placeholder="https://auth.pingone.com/{env-id}/as/token"
                      required
                    />
                  </FormField>

                  <FormField>
                    <FormLabel>Client ID *</FormLabel>
                    <FormInput
                      type="text"
                      value={flowState.config.clientId}
                      onChange={(e) => setFlowState(prev => ({
                        ...prev,
                        config: { ...prev.config, clientId: e.target.value }
                      }))}
                      placeholder="Enter your application Client ID"
                      required
                    />
                  </FormField>

                  <FormField>
                    <FormLabel>Scopes</FormLabel>
                    <FormInput
                      type="text"
                      value={flowState.config.scope.join(' ')}
                      onChange={(e) => setFlowState(prev => ({
                        ...prev,
                        config: { ...prev.config, scope: e.target.value.split(' ').filter(s => s.trim()) }
                      }))}
                      placeholder="openid profile email"
                    />
                  </FormField>
                </CredentialsSection>
              )}

              {step.id === 'request-authorization' && (
                <StatusSection>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <FiClock size={24} color="#6b7280" />
                    <div>
                      <h3 style={{ margin: 0, color: '#1f2937' }}>Ready to Request Authorization</h3>
                      <p style={{ margin: 0, color: '#6b7280' }}>
                        Click the button below to request a user code and verification URL from PingOne.
                      </p>
                    </div>
                  </div>
                </StatusSection>
              )}

              {step.id === 'verify-device' && flowState.userCode && (
                <div>
                  <DeviceVerification
                    userCode={flowState.userCode}
                    verificationUri={flowState.verificationUri!}
                    verificationUriComplete={flowState.verificationUriComplete}
                    expiresIn={flowState.expiresIn!}
                    startTime={flowState.startTime!}
                    onCopyUserCode={handleCopyUserCode}
                    onCopyVerificationUri={handleCopyVerificationUri}
                  />

                  {isPolling && (
                    <DevicePolling
                      deviceCode={flowState.deviceCode!}
                      clientId={flowState.config.clientId}
                      tokenEndpoint={flowState.config.tokenEndpoint}
                      interval={(flowState.interval || 5) * 1000}
                      onSuccess={handlePollingSuccess}
                      onError={handlePollingError}
                      onProgress={handlePollingProgress}
                    />
                  )}
                </div>
              )}
            </div>
          ),
          execute: step.id === 'configure' ? () => Promise.resolve({ success: true }) :
                   step.id === 'request-authorization' ? requestDeviceAuth :
                   () => Promise.resolve({ success: true }),
          canExecute: step.canExecute,
          completed: step.completed
        }))}
        stepManager={stepManager}
        onStepComplete={() => {}}
      />
    </Container>
  );
};

export default DeviceCodeFlowOIDC;
