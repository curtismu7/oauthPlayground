// src/pages/flows/OAuthAuthorizationCodeFlowV3.tsx - Pure OAuth 2.0 Authorization Code Flow

import React, { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/NewAuthContext';
import { useAuthorizationFlowScroll } from '../../hooks/usePageScroll';
import CentralizedSuccessMessage, { showFlowSuccess, showFlowError } from '../../components/CentralizedSuccessMessage';
import EnhancedStepFlowV2 from '../../components/EnhancedStepFlowV2';
import { useFlowStepManager } from '../../utils/flowStepSystem';
import { 
  createCredentialsStep, 
  createPKCEStep, 
  createAuthUrlStep, 
  createUserAuthorizationStep,
  createCallbackHandlingStep,
  createTokenExchangeStep, 
  StepCredentials,
  PKCECodes 
} from '../../components/steps/CommonSteps';
import { FiKey, FiShield, FiCheckCircle, FiCopy, FiRotateCcw } from 'react-icons/fi';
import { copyToClipboard } from '../../utils/clipboard';
import { generateCodeVerifier, generateCodeChallenge } from '../../utils/oauth';
import { credentialManager } from '../../utils/credentialManager';
import { FlowConfiguration, FlowConfig } from '../../components/FlowConfiguration';
import { getDefaultConfig } from '../../utils/flowConfigDefaults';
import { applyClientAuthentication, getAuthMethodSecurityLevel } from '../../utils/clientAuthentication';
import PingOneConfigSection from '../../components/PingOneConfigSection';
import { getCallbackUrlForFlow } from '../../utils/callbackUrls';
import OAuthErrorHelper from '../../components/OAuthErrorHelper';
import { PingOneErrorInterpreter } from '../../utils/pingoneErrorInterpreter';
import { safeJsonParse, safeLocalStorageParse } from '../../utils/secureJson';
import EnhancedErrorRecovery from '../../utils/errorRecovery';
import { usePerformanceMonitor, useMemoizedComputation, useOptimizedCallback } from '../../utils/performance';
import { enhancedDebugger } from '../../utils/enhancedDebug';
import { InlineDocumentation, QuickReference, TroubleshootingGuide } from '../../components/InlineDocumentation';
import styled from 'styled-components';

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: white;
  padding: 2rem 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  color: #1f2937;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1f2937;
  text-shadow: none;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #6b7280;
  margin-bottom: 2rem;
`;

const FlowCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
`;

const TokenDisplay = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-break: break-all;
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0.5rem 0.5rem 0.5rem 0;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const FlowControlSection = styled.div`
  padding: 2rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const FlowControlTitle = styled.h3`
  margin: 0 0 1.5rem 0;
  color: #374151;
  font-size: 1.1rem;
  font-weight: 600;
`;

const FlowControlButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
`;

const FlowControlButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 140px;
  justify-content: center;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.clear {
    background: #10b981;
    color: white;
    
    &:hover {
      background: #059669;
    }
  }
  
  &.debug {
    background: #f59e0b;
    color: white;
    
    &:hover {
      background: #d97706;
    }
  }
  
  &.reset {
    background: #6b7280;
    color: white;
    
    &:hover {
      background: #4b5563;
    }
  }
`;

const OAuthAuthorizationCodeFlowV3: React.FC = () => {
  const authContext = useAuth();
  const { config } = authContext;
  
  // Performance monitoring
  const performanceMonitor = usePerformanceMonitor('OAuthAuthorizationCodeFlowV3');
  
  // Start debug session
  React.useEffect(() => {
    const sessionId = enhancedDebugger.startSession('oauth-authorization-code-v3');
    console.log('🔍 [OAuth-V3] Debug session started:', sessionId);
    
    return () => {
      const session = enhancedDebugger.endSession();
      if (session) {
        console.log('📊 [OAuth-V3] Debug session completed:', {
          duration: session.performance.totalDuration,
          steps: session.steps.length,
          errors: session.errors.length
        });
      }
    };
  }, []);
  
  // Use centralized scroll management
  const { scrollToTopAfterAction } = useAuthorizationFlowScroll('OAuth Authorization Code Flow V3');

  // Use the new step management system
  const stepManager = useFlowStepManager({
    flowType: 'oauth-authorization-code',
    persistKey: 'oauth-authz-v3',
    defaultStep: 0,
    enableAutoAdvance: true
  });

  // URL parameter handling for OAuth callback
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Log all URL parameters for debugging
    console.log('🔍 [OAuth-V3] URL parameter analysis:');
    console.log('   Current URL:', window.location.href);
    console.log('   Search params:', Object.fromEntries(urlParams.entries()));
    
    // Check for authorization code in query parameters
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    console.log('🔍 [OAuth-V3] Parameter extraction results:', {
      code: code ? `${code.substring(0, 10)}...` : null,
      state: state ? `${state.substring(0, 10)}...` : null,
      error,
      errorDescription
    });
    
    // Handle authorization errors
    if (error) {
      console.error('❌ [OAuth-V3] Authorization error:', { error, errorDescription });
      showFlowError(`Authorization failed: ${error} - ${errorDescription}`);
      return;
    }
    
    // Handle authorization success
    if (code) {
      console.log('✅ [OAuth-V3] Authorization code received from URL');
      setAuthCode(code);
      setState(state || '');
      setCanExchangeTokens(true);
      return;
    }

    // Check for stored authorization code from OAuth V3 callback
    const storedCode = sessionStorage.getItem('oauth_v3_auth_code');
    const storedState = sessionStorage.getItem('oauth_v3_state');
    
    if (storedCode && !code) {
      console.log('🔍 [OAuth-V3] Found stored authorization code from OAuth V3 callback');
      setAuthCode(storedCode);
      setState(storedState || '');
      
      // Enable token exchange button
      setCanExchangeTokens(true);
      
      // Clean up stored values
      sessionStorage.removeItem('oauth_v3_auth_code');
      sessionStorage.removeItem('oauth_v3_state');
      
      console.log('✅ [OAuth-V3] Authorization code loaded and ready for token exchange');
    }
    
    // Note: Step parameter handling is now managed by the step manager
    // The step manager will automatically handle ?step=5 parameter from OAuth V3 callback
  }, []);

  // State management
  const [credentials, setCredentials] = useState<StepCredentials>(() => {
    const stored = credentialManager.loadAuthzFlowCredentials();
    // Use saved redirect URI or default
    const redirectUri = stored?.redirectUri || getCallbackUrlForFlow('oauth-authorization-code-v3');
    
    const environmentId = stored?.environmentId || '';
    const issuerUrl = environmentId ? `https://auth.pingone.com/${environmentId}` : '';
    
    // Restore scopes from storage or use default
    const savedScopes = stored?.scopes ? 
      (Array.isArray(stored.scopes) ? stored.scopes.join(' ') : stored.scopes) : 
      'openid profile email';
    
    console.log('🔍 [OAuth-V3] Initializing credentials:', {
      hasStored: !!stored,
      redirectUri,
      storedClientId: stored?.clientId ? `${stored.clientId.substring(0, 8)}...` : null,
      storedScopes: stored?.scopes,
      finalScope: savedScopes
    });
    
    return {
      clientId: stored?.clientId || '',
      clientSecret: stored?.clientSecret || '',
      environmentId: environmentId,
      issuerUrl: issuerUrl,
      redirectUri,
      scope: savedScopes, // Now properly loads saved scopes
      responseType: 'code',
      grantType: 'authorization_code',
      clientAuthMethod: stored?.tokenAuthMethod || 'client_secret_post'
    };
  });

  const [pkceCodes, setPkceCodes] = useState<PKCECodes>({ 
    codeVerifier: '', 
    codeChallenge: '', 
    codeChallengeMethod: 'S256' 
  });
  const [authUrl, setAuthUrl] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [state, setState] = useState('');
  const [tokens, setTokens] = useState<any>(null);
  const [canExchangeTokens, setCanExchangeTokens] = useState(false);
  const [isResettingFlow, setIsResettingFlow] = useState(false);

  // Flow configuration
  const [flowConfig, setFlowConfig] = useState<FlowConfig>(() => getDefaultConfig());

  // Update issuerUrl when environmentId changes
  React.useEffect(() => {
    if (credentials.environmentId && !credentials.issuerUrl) {
      setCredentials(prev => ({
        ...prev,
        issuerUrl: `https://auth.pingone.com/${credentials.environmentId}`
      }));
    }
  }, [credentials.environmentId]);

  // Handle OAuth callback
  const handleOAuthCallback = useCallback((code: string | null, state: string | null, error: string | null, errorDescription: string | null) => {
    if (error) {
      console.error('❌ [OAuth-V3] Authorization error received:', {
        error,
        errorDescription
      });
      showFlowError(`OAuth authorization failed: ${error} - ${errorDescription}`);
      return;
    }

    if (code) {
      console.log('✅ [OAuth-V3] Authorization code received');
      setAuthCode(code);
      setState(state || '');
      setCanExchangeTokens(true);
      
      // Auto-advance to token exchange step
      stepManager.setStep(4);
      showFlowSuccess('Authorization code received! Ready for token exchange.');
    }
  }, [stepManager]);

  // Generate PKCE codes
  const generatePKCE = useCallback(async () => {
    try {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      const newPkceCodes = {
        codeVerifier,
        codeChallenge,
        codeChallengeMethod: 'S256' as const
      };
      
      setPkceCodes(newPkceCodes);
      
      // Store code verifier for token exchange
      sessionStorage.setItem('oauth_v3_code_verifier', codeVerifier);
      
      console.log('🔐 [OAuth-V3] PKCE codes generated:', {
        codeVerifier: `${codeVerifier.substring(0, 10)}...`,
        codeChallenge: `${codeChallenge.substring(0, 10)}...`,
        codeChallengeMethod: 'S256'
      });
      
      showFlowSuccess('PKCE codes generated successfully');
      return newPkceCodes;
    } catch (error) {
      console.error('❌ [OAuth-V3] PKCE generation failed:', error);
      showFlowError('Failed to generate PKCE codes');
      throw error;
    }
  }, []);

  // Generate authorization URL
  const generateAuthUrl = useCallback(async () => {
    try {
      console.log('🔍 [OAuth-V3] Validating credentials for auth URL generation:', {
        hasClientId: !!credentials.clientId,
        hasIssuerUrl: !!credentials.issuerUrl,
        hasEnvironmentId: !!credentials.environmentId,
        clientId: credentials.clientId ? `${credentials.clientId.substring(0, 8)}...` : 'MISSING',
        issuerUrl: credentials.issuerUrl || 'MISSING',
        environmentId: credentials.environmentId || 'MISSING'
      });

      if (!credentials.clientId) {
        throw new Error('Client ID is required. Please enter your PingOne application client ID in Step 1.');
      }

      if (!credentials.environmentId) {
        throw new Error('Environment ID is required. Please enter your PingOne Environment ID in Step 1.');
      }

      if (!pkceCodes.codeChallenge) {
        throw new Error('PKCE codes must be generated first');
      }

      // Construct authorization endpoint using environmentId
      const authEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
      const stateValue = btoa(Math.random().toString()).substring(0, 16);
      const nonce = btoa(Math.random().toString()).substring(0, 16);

      // Store state and nonce for validation
      sessionStorage.setItem('oauth_v3_state', stateValue);
      sessionStorage.setItem('oauth_v3_nonce', nonce);
      
      // Store redirect URI for consistency
      sessionStorage.setItem('oauth_v3_redirect_uri', credentials.redirectUri);
      
      console.log('🔍 [OAuth-V3] Storing session data:', {
        state: `${stateValue.substring(0, 8)}...`,
        nonce: `${nonce.substring(0, 8)}...`,
        redirectUri: credentials.redirectUri
      });

      const params = new URLSearchParams({
        client_id: credentials.clientId,
        response_type: credentials.responseType,
        redirect_uri: credentials.redirectUri,
        scope: credentials.scope,
        state: stateValue,
        nonce: nonce,
        code_challenge: pkceCodes.codeChallenge,
        code_challenge_method: pkceCodes.codeChallengeMethod
      });

      const fullAuthUrl = `${authEndpoint}?${params.toString()}`;
      setAuthUrl(fullAuthUrl);

      console.log('🔗 [OAuth-V3] Authorization URL generated:', {
        endpoint: authEndpoint,
        environmentId: credentials.environmentId,
        issuerUrl: credentials.issuerUrl,
        clientId: `${credentials.clientId.substring(0, 8)}...`,
        redirectUri: credentials.redirectUri,
        scope: credentials.scope,
        state: `${stateValue.substring(0, 8)}...`,
        codeChallenge: `${pkceCodes.codeChallenge.substring(0, 10)}...`,
        fullUrl: fullAuthUrl.substring(0, 100) + '...'
      });

      console.log('🚨 [OAuth-V3] IMPORTANT: Add this redirect URI to your PingOne application:');
      console.log('   Redirect URI: ' + credentials.redirectUri);
      console.log('   Environment: b9817c16-9910-4415-b67e-4ac687da74d9');
      console.log('   Path: Applications → Your App → Configuration → Redirect URIs');

      showFlowSuccess('Authorization URL generated successfully');
      return fullAuthUrl;
    } catch (error) {
      console.error('❌ [OAuth-V3] Authorization URL generation failed:', error);
      showFlowError(`Failed to generate authorization URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, [credentials, pkceCodes]);

  // Handle popup authorization
  const handlePopupAuthorization = useCallback(async () => {
    if (!authUrl) {
      showFlowError('Authorization URL must be generated first');
      return;
    }

    try {
      console.log('🔍 [OAuth-V3] Starting popup authorization');
      
      // Set flow context for callback handling
      const flowContext = {
        flow: 'oauth-authorization-code-v3',
        redirectUri: credentials.redirectUri,
        timestamp: Date.now()
      };
      sessionStorage.setItem('flowContext', JSON.stringify(flowContext));
      
      const popup = window.open(authUrl, 'oauth-popup', 'width=500,height=600,scrollbars=yes,resizable=yes');
      
      if (!popup) {
        throw new Error('Popup blocked by browser');
      }

      // Listen for popup completion
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'OAUTH_CALLBACK') {
          console.log('✅ [OAuth-V3] Popup callback received:', event.data);
          
          popup.close();
          window.removeEventListener('message', handleMessage);
          
          if (event.data.error) {
            showFlowError(`OAuth authorization failed: ${event.data.error}`);
          } else if (event.data.code) {
            handleOAuthCallback(event.data.code, event.data.state, null, null);
          }
        }
      };

      window.addEventListener('message', handleMessage);
      showFlowSuccess('Popup authorization window opened');

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          console.log('🔍 [OAuth-V3] Popup closed manually');
        }
      }, 1000);

    } catch (error) {
      console.error('❌ [OAuth-V3] Popup authorization failed:', error);
      showFlowError(`Popup authorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [authUrl, credentials.redirectUri, handleOAuthCallback]);

  // Handle full redirect authorization
  const handleFullRedirectAuthorization = useCallback(async () => {
    if (!authUrl) {
      showFlowError('Authorization URL must be generated first');
      return;
    }

    try {
      console.log('🔍 [OAuth-V3] Starting full redirect authorization');
      
      // Set flow context for callback handling
      const flowContext = {
        flow: 'oauth-authorization-code-v3',
        redirectUri: credentials.redirectUri,
        timestamp: Date.now()
      };
      sessionStorage.setItem('flowContext', JSON.stringify(flowContext));
      
      console.log('🔍 [OAuth-V3] Flow context set:', flowContext);
      
      // Redirect directly to the generated authorization URL
      console.log('🔍 [OAuth-V3] Redirecting to authorization URL:', authUrl);
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('❌ [OAuth-V3] Full redirect authorization failed:', error);
      showFlowError(`Full redirect authorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [authUrl, credentials.redirectUri, authContext]);

  // Exchange authorization code for tokens
  const exchangeTokens = useCallback(async () => {
    try {
      if (!authCode) {
        throw new Error('Authorization code is required');
      }

      const storedCodeVerifier = sessionStorage.getItem('oauth_v3_code_verifier');
      
      console.log('🔍 [OAuth-V3] Token exchange preparation:', {
        authCode: authCode ? `${authCode.substring(0, 10)}...` : 'MISSING',
        storedCodeVerifier: storedCodeVerifier ? `${storedCodeVerifier.substring(0, 10)}...` : 'MISSING',
        sessionStorageKeys: Object.keys(sessionStorage).filter(key => key.includes('oauth_v3')),
        allSessionKeys: Object.keys(sessionStorage)
      });
      
      if (!storedCodeVerifier) {
        throw new Error('Code verifier not found. Please restart the flow and generate PKCE codes first.');
      }

      const storedRedirectUri = sessionStorage.getItem('oauth_v3_redirect_uri') || credentials.redirectUri;

      console.log('🔍 [OAuth-V3] Token exchange request:', {
        code: `${authCode.substring(0, 10)}...`,
        codeVerifier: `${storedCodeVerifier.substring(0, 10)}...`,
        redirectUri: storedRedirectUri,
        clientId: `${credentials.clientId.substring(0, 8)}...`
      });

      // Use backend proxy to avoid CORS issues
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://oauth-playground.vercel.app' 
        : 'http://localhost:3001';

      // Prepare token request
      // Prepare base request body
      const baseBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: storedRedirectUri,
        code_verifier: storedCodeVerifier,
      });
      
      // Apply client authentication method
      const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
      const authConfig = {
        method: credentials.clientAuthMethod || 'client_secret_post',
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        tokenEndpoint: tokenEndpoint
      };
      
      const authenticatedRequest = await applyClientAuthentication(authConfig, baseBody);
      
      // Convert to object for backend compatibility
      const requestBody = {
        ...Object.fromEntries(authenticatedRequest.body),
        environment_id: credentials.environmentId
      };

      const response = await fetch(`${backendUrl}/api/token-exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'unknown_error' }));
        throw new Error(`Token exchange failed: ${JSON.stringify(errorData)}`);
      }

      const tokenData = await response.json();
      console.log('✅ [OAuth-V3] Token exchange successful:', {
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token
      });

      setTokens(tokenData);
      showFlowSuccess('OAuth tokens received successfully!');

      // Store tokens securely
      if (tokenData.access_token) {
        sessionStorage.setItem('oauth_v3_access_token', tokenData.access_token);
      }
      if (tokenData.refresh_token) {
        sessionStorage.setItem('oauth_v3_refresh_token', tokenData.refresh_token);
      }

      return tokenData;
    } catch (error) {
      console.error('❌ [OAuth-V3] Token exchange failed:', error);
      showFlowError(`Token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, [authCode, credentials]);

  // Clear credentials
  const clearCredentials = useCallback(() => {
    credentialManager.clearAllCredentials();
    setCredentials({
      clientId: '',
      clientSecret: '',
      issuerUrl: '',
      redirectUri: getCallbackUrlForFlow('oauth-authorization-code-v3'),
      scope: 'openid profile email',
      responseType: 'code',
      grantType: 'authorization_code'
    });
    showFlowSuccess('Credentials cleared');
  }, []);

  // Reset flow
  const resetFlow = useCallback(async () => {
    console.log('🔄 [OAuth-V3] Reset flow initiated');
    
    setIsResettingFlow(true);
    
    try {
      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔍 [OAuth-V3] Current step before reset:', stepManager.currentStepIndex);
    
    // Clear all state
    setPkceCodes({ codeVerifier: '', codeChallenge: '', codeChallengeMethod: 'S256' });
    setAuthUrl('');
    setAuthCode('');
    setState('');
    setTokens(null);
    setCanExchangeTokens(false);
    
    // Clear session storage
    sessionStorage.removeItem('oauth_v3_code_verifier');
    sessionStorage.removeItem('oauth_v3_state');
    sessionStorage.removeItem('oauth_v3_nonce');
    sessionStorage.removeItem('oauth_v3_redirect_uri');
    sessionStorage.removeItem('oauth_v3_auth_code');
    sessionStorage.removeItem('oauth_v3_access_token');
    sessionStorage.removeItem('oauth_v3_refresh_token');
    sessionStorage.removeItem('flowContext'); // Also clear flow context
    
    console.log('🔍 [OAuth-V3] Cleared session storage, resetting to step 0');
    
    // Reset to first step
    stepManager.setStep(0);
    
    console.log('🔍 [OAuth-V3] Step after reset:', stepManager.currentStepIndex);
    
    showFlowSuccess('OAuth flow reset successfully');
    
    // AGGRESSIVE SCROLL TO TOP - try all methods
    console.log('📜 [OAuth-V3] AGGRESSIVE SCROLL - position before:', window.pageYOffset);
    
    // Method 1: Immediate scroll
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Method 2: Centralized system
    scrollToTopAfterAction();
    
    // Method 3: Force scroll all containers
    const scrollAllContainers = () => {
      // Scroll main window
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Scroll all possible containers
      const containers = [
        document.documentElement,
        document.body,
        document.querySelector('main'),
        document.querySelector('[data-scrollable]'),
        document.querySelector('.app-container'),
        document.querySelector('.page-container')
      ];
      
      containers.forEach(container => {
        if (container) {
          container.scrollTop = 0;
          if (container.scrollTo) {
            container.scrollTo(0, 0);
          }
        }
      });
      
      console.log('📜 [OAuth-V3] Force scrolled all containers');
    };
    
    // Execute force scroll immediately and with delays
    scrollAllContainers();
    setTimeout(scrollAllContainers, 50);
    setTimeout(scrollAllContainers, 200);
    setTimeout(scrollAllContainers, 500);
    
    // Final verification
    setTimeout(() => {
      console.log('📜 [OAuth-V3] FINAL scroll position:', window.pageYOffset);
      if (window.pageYOffset > 0) {
        console.log('❌ [OAuth-V3] Scroll failed - still at position:', window.pageYOffset);
        // One more desperate attempt
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      } else {
        console.log('✅ [OAuth-V3] Scroll successful - at top!');
      }
      }, 1000);
      
    } catch (error) {
      console.error('❌ [OAuth-V3] Reset flow failed:', error);
      showFlowError('Failed to reset flow');
    } finally {
      setIsResettingFlow(false);
    }
  }, [stepManager, scrollToTopAfterAction]);

  // Restart flow (for final step)
  const restartFlow = useCallback(() => {
    resetFlow();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [resetFlow]);

  // Navigate to Token Management
  const navigateToTokenManagement = useCallback((tokenType: 'access' | 'refresh') => {
    const token = tokenType === 'access' ? tokens?.access_token : tokens?.refresh_token;
    if (token) {
      // Store the token for the Token Management page
      sessionStorage.setItem('token_to_analyze', token);
      sessionStorage.setItem('token_type', tokenType);
      sessionStorage.setItem('flow_source', 'oauth-v3'); // Mark as OAuth V3 flow
      
      console.log('🔍 [OAuth-V3] Navigating to Token Management with OAuth flow source');
      window.open('/token-management', '_blank');
    }
  }, [tokens]);

  // Memoized step creation
  const steps = useMemoizedComputation(() => {
    return [
      createCredentialsStep(credentials, setCredentials, async () => {
        const environmentId = credentials.environmentId || 
          (credentials.issuerUrl && credentials.issuerUrl.includes('pingone') ? 
            credentials.issuerUrl.split('/')[4] : 'custom');
        
        const scopesToSave = credentials.scope ? credentials.scope.split(' ') : ['openid', 'profile', 'email'];
        
        console.log('🔍 [OAuth-V3] Saving credentials:', {
          environmentId: environmentId,
          clientId: `${credentials.clientId.substring(0, 8)}...`,
          redirectUri: credentials.redirectUri,
          scopeString: credentials.scope,
          scopesToSave: scopesToSave
        });
        
        credentialManager.saveAuthzFlowCredentials({
          environmentId: environmentId,
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          redirectUri: credentials.redirectUri,
          scopes: scopesToSave,
          authEndpoint: environmentId !== 'custom' ? 
            `https://auth.pingone.com/${environmentId}/as/authorize` :
            credentials.issuerUrl ? `${credentials.issuerUrl.replace(/\/$/, '')}/as/authorize` : ''
        });
        showFlowSuccess('Credentials saved successfully');
      }, 'OAuth 2.0 Authorization Code Flow'),
      createPKCEStep(pkceCodes, setPkceCodes, generatePKCE),
      createAuthUrlStep(authUrl, generateAuthUrl, credentials, pkceCodes, handlePopupAuthorization, handleFullRedirectAuthorization),
      createUserAuthorizationStep(authUrl, handlePopupAuthorization, handleFullRedirectAuthorization),
      createCallbackHandlingStep(authCode, resetFlow),
      createTokenExchangeStep(authCode, tokens, exchangeTokens, credentials),
      {
        id: 'oauth-token-management',
        title: 'OAuth Token Analysis',
        description: 'Analyze and manage your OAuth tokens',
        icon: FiCheckCircle,
        status: tokens ? 'completed' : 'pending',
        canExecute: !!tokens,
        completed: !!tokens,
        isFinalStep: true,
        content: (
          <div>
            <h4>OAuth Token Analysis</h4>
            <p>Your OAuth flow is complete! Use the buttons below to analyze your tokens:</p>
            
            {tokens && (
              <div style={{ margin: '1rem 0' }}>
                <ActionButton 
                  onClick={() => navigateToTokenManagement('access')}
                  disabled={!tokens.access_token}
                >
                  <FiKey /> Analyze Access Token
                </ActionButton>
                
                {tokens.refresh_token && (
                  <ActionButton 
                    onClick={() => navigateToTokenManagement('refresh')}
                  >
                    <FiShield /> Analyze Refresh Token
                  </ActionButton>
                )}
              </div>
            )}
            
            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '6px' }}>
              <h5>OAuth Token Summary:</h5>
              {tokens ? (
                <ul>
                  <li>✅ Access Token: {tokens.access_token ? 'Received' : 'Not received'}</li>
                  <li>✅ Token Type: {tokens.token_type || 'Bearer'}</li>
                  <li>✅ Expires In: {tokens.expires_in ? `${tokens.expires_in} seconds` : 'Not specified'}</li>
                  <li>✅ Scope: {tokens.scope || 'Not specified'}</li>
                  <li>✅ Refresh Token: {tokens.refresh_token ? 'Received' : 'Not received'}</li>
                </ul>
              ) : (
                <p>No tokens received yet. Complete the previous steps first.</p>
              )}
            </div>
            
            <div style={{ marginTop: '2rem' }}>
              <ActionButton onClick={restartFlow}>
                <FiRotateCcw /> Start New OAuth Flow
              </ActionButton>
            </div>
          </div>
        )
      }
    ];
  }, [
    credentials, pkceCodes, authUrl, authCode, state, tokens, canExchangeTokens,
    generatePKCE, generateAuthUrl, handlePopupAuthorization, handleFullRedirectAuthorization,
    exchangeTokens, navigateToTokenManagement, restartFlow
  ]);

  return (
    <Container>
      <Header>
        <Title>OAuth 2.0 Authorization Code Flow V3</Title>
        <Subtitle>
          Pure OAuth 2.0 implementation with PKCE security extension
        </Subtitle>
      </Header>

      <FlowCard>
        {/* Flow Configuration */}
        <FlowConfiguration
          config={flowConfig}
          onConfigChange={setFlowConfig}
          initialExpanded={false}
          title="OAuth Flow Configuration"
          subtitle="Configure OAuth 2.0 specific settings"
        />

        {/* Main Step Flow */}
        <EnhancedStepFlowV2 
          steps={steps}
          currentStep={stepManager.currentStepIndex}
          onStepChange={stepManager.setStep}
          flowType="oauth-authorization-code"
          showStepNumbers={true}
          enableStepNavigation={true}
          showDebugInfo={false}
        />

        {/* Flow Control Actions */}
        <FlowControlSection>
          <FlowControlTitle>
            ⚙️ Flow Control Actions
          </FlowControlTitle>
          <FlowControlButtons>
            <FlowControlButton className="clear" onClick={clearCredentials}>
              🧹 Clear Credentials
            </FlowControlButton>
            <FlowControlButton 
              className="reset" 
              onClick={resetFlow}
              disabled={isResettingFlow}
              style={{
                background: isResettingFlow ? '#9ca3af' : undefined,
                cursor: isResettingFlow ? 'not-allowed' : 'pointer'
              }}
            >
              <FiRotateCcw style={{ 
                animation: isResettingFlow ? 'spin 1s linear infinite' : 'none',
                marginRight: '0.5rem'
              }} />
              {isResettingFlow ? 'Resetting...' : 'Reset Flow'}
            </FlowControlButton>
          </FlowControlButtons>
        </FlowControlSection>
      </FlowCard>

      {/* PingOne Configuration Section - Only show on step 1 */}
      <PingOneConfigSection
        callbackUrl={getCallbackUrlForFlow('oauth-authorization-code-v3')}
        flowType="OAuth Authorization Code V3"
        showOnlyOnStep={0}
        currentStep={stepManager.currentStepIndex}
      />

      {/* Error Helper - Only show when there's an actual error */}
      {/* <OAuthErrorHelper /> - Removed as it shows "Unknown Error" when no error exists */}

      {/* Centralized Success/Error Messages */}
      <CentralizedSuccessMessage />

      {/* Documentation */}
      <InlineDocumentation>
        <QuickReference 
          title="OAuth 2.0 Authorization Code Flow"
          items={[
            'Pure OAuth 2.0 implementation (no OpenID Connect)',
            'PKCE (RFC 7636) for enhanced security',
            'Access tokens for API authorization',
            'Optional refresh tokens for token renewal',
            'No ID tokens or UserInfo endpoint'
          ]}
        />
        <TroubleshootingGuide 
          issue="Common OAuth Issues"
          symptoms={[
            'Authorization fails with redirect URI mismatch',
            'PKCE validation errors',
            'Invalid client credentials',
            'Unsupported scope errors'
          ]}
          solutions={[
            {
              title: 'Fix Redirect URI Configuration',
              steps: [
                'Ensure redirect URI matches exactly in PingOne console',
                'Check for trailing slashes and protocol (http vs https)',
                'Verify case sensitivity'
              ]
            },
            {
              title: 'Verify PKCE Configuration',
              steps: [
                'Generate PKCE codes before authorization',
                'Ensure code verifier is stored properly',
                'Check code challenge method is S256'
              ]
            }
          ]}
        />
      </InlineDocumentation>
    </Container>
  );
};

export default OAuthAuthorizationCodeFlowV3;
