// src/components/ResponseModeIntegrationWrapper.tsx
// HOC for adding response mode integration to any OAuth/OIDC flow

import React, { ReactNode } from 'react';
import { useResponseModeIntegration, ResponseMode } from '../services/responseModeIntegrationService';
import ResponseModeSelector from './response-modes/ResponseModeSelector';

interface ResponseModeIntegrationWrapperProps {
  children: ReactNode;
  flowKey: string;
  responseType: string;
  redirectUri: string;
  clientId: string;
  scope?: string;
  state?: string;
  nonce?: string;
  credentials: any;
  setCredentials: (creds: any) => void;
  showResponseModeSelector?: boolean;
  onAuthUrlClear?: () => void;
  logPrefix?: string;
}

/**
 * Higher-order component that adds response mode integration to any flow
 * This wrapper handles:
 * - Response mode state management
 * - Automatic credential updates
 * - ResponseModeSelector rendering
 * - URL regeneration triggers
 */
export const ResponseModeIntegrationWrapper: React.FC<ResponseModeIntegrationWrapperProps> = ({
  children,
  flowKey,
  responseType,
  redirectUri,
  clientId,
  scope = 'openid',
  state = 'random_state_123',
  nonce = 'random_nonce_456',
  credentials,
  setCredentials,
  showResponseModeSelector = true,
  onAuthUrlClear,
  logPrefix,
}) => {
  const {
    responseMode,
    setResponseMode,
    responseModeChanged,
    setResponseModeChanged,
    clearAuthUrl,
  } = useResponseModeIntegration({
    flowKey,
    credentials,
    setCredentials,
    logPrefix,
  });

  // Handle response mode changes with URL clearing
  const handleResponseModeChange = (mode: ResponseMode) => {
    setResponseMode(mode);
    setResponseModeChanged(true);
    
    // Clear authorization URL if callback provided
    if (onAuthUrlClear) {
      onAuthUrlClear();
    }
    
    // Also call the service's clear function
    clearAuthUrl();
  };

  // Render children with response mode context
  return (
    <>
      {children}
      
      {showResponseModeSelector && (
        <ResponseModeSelector
          flowKey={flowKey}
          responseType={responseType}
          redirectUri={redirectUri}
          clientId={clientId}
          scope={scope}
          state={state}
          nonce={nonce}
          defaultMode={responseMode}
          readOnlyFlowContext={false}
          onModeChange={handleResponseModeChange}
        />
      )}
    </>
  );
};

export default ResponseModeIntegrationWrapper;
