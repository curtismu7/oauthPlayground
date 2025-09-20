// src/pages/flows/UnifiedAuthorizationCodeFlowV3.tsx - Unified OAuth 2.0 and OIDC Authorization Code Flow

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
  createTokenValidationStep,
  createUserInfoStep,
  StepCredentials,
  PKCECodes 
} from '../../components/steps/CommonSteps';
import { FiKey, FiShield, FiUser, FiCheckCircle, FiCopy, FiRotateCcw, FiSettings } from 'react-icons/fi';
import { copyToClipboard } from '../../utils/clipboard';
import { generateCodeVerifier, generateCodeChallenge } from '../../utils/oauth';
import { credentialManager } from '../../utils/credentialManager';
import { FlowConfiguration, FlowConfig } from '../../components/FlowConfiguration';
import { getDefaultConfig } from '../../utils/flowConfigDefaults';
import { validateIdToken } from '../../utils/oauth';
import { applyClientAuthentication, getAuthMethodSecurityLevel, ClientAuthMethod, ClientAuthConfig } from '../../utils/clientAuthentication';
import PingOneConfigSection from '../../components/PingOneConfigSection';
import { getCallbackUrlForFlow } from '../../utils/callbackUrls';
import OAuthErrorHelper from '../../components/OAuthErrorHelper';
import { PingOneErrorInterpreter } from '../../utils/pingoneErrorInterpreter';
import { safeJsonParse, safeLocalStorageParse } from '../../utils/secureJson';
import { validateOIDCCompliance, generateComplianceReport, validateIdTokenCompliance } from '../../utils/oidcCompliance';
import EnhancedErrorRecovery from '../../utils/errorRecovery';
import { usePerformanceMonitor, useMemoizedComputation, useOptimizedCallback } from '../../utils/performance';
import { enhancedDebugger } from '../../utils/enhancedDebug';
import { fetchOIDCDiscovery } from '../../utils/advancedOIDC';
import { InlineDocumentation, QuickReference, TroubleshootingGuide } from '../../components/InlineDocumentation';
import styled from 'styled-components';

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  color: white;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
`;

const Description = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const FlowCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
`;

const FlowControlSection = styled.div`
  padding: 2rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const FlowControlTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.1rem;
  font-weight: 600;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 1rem;
  margin-bottom: 0.5rem;
  
  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`;

interface UnifiedFlowProps {
  flowType: 'oauth' | 'oidc';
}

const UnifiedAuthorizationCodeFlowV3: React.FC<UnifiedFlowProps> = ({ flowType }) => {
  const authContext = useAuth();
  const { config } = authContext;
  
  // Performance monitoring
  const performanceMonitor = usePerformanceMonitor(`UnifiedAuthorizationCodeFlowV3-${flowType}`);
  
  // Start debug session
  React.useEffect(() => {
    const sessionId = enhancedDebugger.startSession(`${flowType}-authorization-code-v3`);
    console.log(`🔍 [${flowType.toUpperCase()}-V3] Debug session started:`, sessionId);
    
    return () => {
      enhancedDebugger.endSession(sessionId);
    };
  }, [flowType]);
  
  // Use centralized scroll management
  useAuthorizationFlowScroll(`${flowType.toUpperCase()} Authorization Code Flow V3`);

  // Use the new step management system
  const stepManager = useFlowStepManager({
    flowType: `${flowType}-authorization-code`,
    persistKey: `${flowType}-authz-v3`,
    defaultStep: 0,
    enableAutoAdvance: true
  });

  // State management
  const [credentials, setCredentials] = useState<StepCredentials>(() => {
    // Check for URL parameters first (from Flow Comparison tool OR OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const urlEnv = urlParams.get('env');
    const urlClient = urlParams.get('client');
    const urlScope = urlParams.get('scope');
    const urlRedirect = urlParams.get('redirect');
    
    // Check for OAuth callback parameters
    const authCode = urlParams.get('code');
    const authState = urlParams.get('state');
    const authError = urlParams.get('error');
    
    console.log(`🔍 [${flowType.toUpperCase()}-V3] URL parameter analysis:`, {
      isCallback: !!(authCode || authError),
      authCode: authCode ? `${authCode.substring(0, 10)}...` : null,
      authState: authState ? `${authState.substring(0, 10)}...` : null,
      authError,
      urlParams: Object.fromEntries(urlParams.entries())
    });
    
    // Load stored credentials as fallback
    const stored = credentialManager.loadAuthzFlowCredentials();
    const redirectUri = urlRedirect || stored?.redirectUri || `${window.location.origin}/authz-callback`;
    
    const environmentId = urlEnv || stored?.environmentId || '';
    const issuerUrl = environmentId ? `https://auth.pingone.com/${environmentId}` : '';
    
    // Choose default scopes based on flow type
    const defaultScopes = flowType === 'oauth' 
      ? 'read write'  // OAuth 2.0 scopes
      : 'openid profile email';  // OIDC scopes
    
    const savedScopes = urlScope || (stored?.scopes ? 
      (Array.isArray(stored.scopes) ? stored.scopes.join(' ') : stored.scopes) : 
      defaultScopes);
    
    console.log(`🔍 [${flowType.toUpperCase()}-V3] Initializing credentials:`, {
      hasUrlParams: !!(urlEnv || urlClient || urlScope),
      hasStored: !!stored,
      redirectUri,
      urlClient: urlClient ? `${urlClient.substring(0, 8)}...` : null,
      storedClientId: stored?.clientId ? `${stored.clientId.substring(0, 8)}...` : null,
      urlScope,
      storedScopes: stored?.scopes,
      finalScope: savedScopes,
      flowType
    });
    
    const initialCredentials = {
      environmentId: environmentId,
      clientId: urlClient || stored?.clientId || '',
      clientSecret: stored?.clientSecret || '',
      redirectUri: redirectUri,
      scope: savedScopes,
      scopes: savedScopes.split(' ').filter(Boolean),
      responseType: 'code',
      grantType: 'authorization_code',
      issuerUrl: issuerUrl
    };

    // If we got credentials from URL parameters, save them for future use
    if (urlEnv || urlClient || urlScope) {
      console.log(`🔧 [${flowType.toUpperCase()}-V3] Saving URL credentials to storage`);
      credentialManager.saveAuthzFlowCredentials({
        environmentId: initialCredentials.environmentId,
        clientId: initialCredentials.clientId,
        redirectUri: initialCredentials.redirectUri,
        scopes: initialCredentials.scopes
      });
    }

    return initialCredentials;
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
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isExchangingTokens, setIsExchangingTokens] = useState(false);
  const [canExchangeTokens, setCanExchangeTokens] = useState(false);
  const [flowConfig, setFlowConfig] = useState<FlowConfig>(() => {
    // Try to load saved flow configuration
    try {
      const savedConfig = localStorage.getItem(`${flowType}_v3_flow_config`);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        console.log(`🔧 [${flowType.toUpperCase()}-V3] Loaded saved flow configuration:`, parsed);
        return { ...getDefaultConfig(flowType === 'oidc' ? 'oidc-authorization-code' : 'oauth-authorization-code'), ...parsed };
      }
    } catch (error) {
      console.warn(`⚠️ [${flowType.toUpperCase()}-V3] Failed to load saved flow configuration:`, error);
    }
    
    // Return default configuration
    const defaultConfig = getDefaultConfig(flowType === 'oidc' ? 'oidc-authorization-code' : 'oauth-authorization-code');
    console.log(`🔧 [${flowType.toUpperCase()}-V3] Using default flow configuration:`, defaultConfig);
    return defaultConfig;
  });
  const [showExplainer, setShowExplainer] = useState(false);

  // Save flow configuration when it changes
  const handleFlowConfigChange = useCallback((newConfig: FlowConfig) => {
    setFlowConfig(newConfig);
    
    // Persist the configuration
    try {
      localStorage.setItem(`${flowType}_v3_flow_config`, JSON.stringify(newConfig));
      console.log(`💾 [${flowType.toUpperCase()}-V3] Saved flow configuration:`, {
        scopes: newConfig.scopes,
        nonce: newConfig.nonce ? `${newConfig.nonce.substring(0, 10)}...` : 'none',
        state: newConfig.state ? `${newConfig.state.substring(0, 10)}...` : 'none',
        maxAge: newConfig.maxAge,
        prompt: newConfig.prompt,
        loginHint: newConfig.loginHint,
        acrValues: newConfig.acrValues,
        clientAuthMethod: newConfig.clientAuthMethod,
        enablePKCE: newConfig.enablePKCE,
        enableOIDC: newConfig.enableOIDC
      });
    } catch (error) {
      console.error(`❌ [${flowType.toUpperCase()}-V3] Failed to save flow configuration:`, error);
    }
  }, [flowType]);

  // Step result management
  const [stepResults, setStepResults] = useState<{[key: string]: any}>(() => {
    try {
      const stored = sessionStorage.getItem(`${flowType}_v3_step_results`);
      return stored ? safeJsonParse(stored) || {} : {};
    } catch {
      return {};
    }
  });

  const saveStepResult = useCallback((stepId: string, result: any) => {
    const newResults = { ...stepResults, [stepId]: result };
    setStepResults(newResults);
    sessionStorage.setItem(`${flowType}_v3_step_results`, JSON.stringify(newResults));
  }, [stepResults, flowType]);

  const hasStepResult = useCallback((stepId: string) => {
    return Boolean(stepResults[stepId]);
  }, [stepResults]);

  // Handle stored authorization code from callback (after step manager initialization)
  React.useEffect(() => {
    // Only process stored codes after step manager is initialized
    if (!stepManager.isInitialized) return;
    
    const storedCode = sessionStorage.getItem(`${flowType}_v3_auth_code`);
    const storedState = sessionStorage.getItem(`${flowType}_v3_state`);
    
    if (storedCode) {
      console.log(`🔍 [${flowType.toUpperCase()}-V3] Found stored authorization code from callback`);
      setAuthCode(storedCode);
      setState(storedState || '');
      
      // Enable token exchange button
      setCanExchangeTokens(true);
      
      // Clean up stored values
      sessionStorage.removeItem(`${flowType}_v3_auth_code`);
      sessionStorage.removeItem(`${flowType}_v3_state`);
      
      console.log(`✅ [${flowType.toUpperCase()}-V3] Authorization code loaded and ready for token exchange`);
    }
  }, [stepManager.isInitialized, flowType]);

  // Handle OAuth callback from PingOne redirect (URL parameters)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    const authState = urlParams.get('state');
    const authError = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    // Only process if we have OAuth callback parameters
    if (authCode || authError) {
      console.log(`🔍 [${flowType.toUpperCase()}-V3] Processing OAuth callback from URL:`, {
        hasCode: !!authCode,
        hasError: !!authError,
        authError,
        errorDescription
      });
      
      if (authError) {
        console.error(`❌ [${flowType.toUpperCase()}-V3] Authorization error:`, authError, errorDescription);
        showFlowError(`❌ Authorization failed: ${errorDescription || authError}`);
        
        // Clear URL parameters
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }
      
      if (authCode) {
        console.log(`✅ [${flowType.toUpperCase()}-V3] Authorization code received from PingOne redirect!`);
        
        // Set the authorization code and state
        setAuthCode(authCode);
        setState(authState || '');
        
        // Store in session storage for persistence
        sessionStorage.setItem(`${flowType}_v3_auth_code`, authCode);
        if (authState) {
          sessionStorage.setItem(`${flowType}_v3_state`, authState);
        }
        
        // Mark callback handling as completed
        saveStepResult('handle-callback', true);
        
        // Show success message to user
        showFlowSuccess(`🎉 Successfully authenticated with PingOne! Authorization code received. You can now exchange it for tokens.`);
        
        // Auto-advance to token exchange step (step 4 in V3 flows)
        if (stepManager.isInitialized) {
          stepManager.setStep(4, 'callback completed');
        }
        
        // Clear URL parameters to clean up the URL
        window.history.replaceState({}, '', window.location.pathname);
        
        console.log(`✅ [${flowType.toUpperCase()}-V3] Callback processing completed, advanced to token exchange step`);
      }
    }
  }, [flowType, stepManager, saveStepResult]);

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
      sessionStorage.setItem(`${flowType}_v3_code_verifier`, codeVerifier);
      
      console.log(`🔍 [${flowType.toUpperCase()}-V3] Generated PKCE codes`);
      showFlowSuccess('PKCE codes generated successfully');
    } catch (error) {
      console.error(`❌ [${flowType.toUpperCase()}-V3] PKCE generation failed:`, error);
      showFlowError('Failed to generate PKCE codes');
    }
  }, [flowType]);

  // Generate authorization URL
  const generateAuthUrl = useCallback(() => {
    try {
      if (!credentials.environmentId || !credentials.clientId) {
        throw new Error('Environment ID and Client ID are required');
      }

      const stateValue = generateCodeVerifier().substring(0, 16);
      const nonce = generateCodeVerifier().substring(0, 16);
      
      setState(stateValue);
      
      // Store values for later use
      sessionStorage.setItem(`${flowType}_v3_state`, stateValue);
      sessionStorage.setItem(`${flowType}_v3_nonce`, nonce);
      sessionStorage.setItem(`${flowType}_v3_redirect_uri`, credentials.redirectUri);
      
      // Store flow context for callback handling
      sessionStorage.setItem('flowContext', JSON.stringify({
        flow: `${flowType}-authorization-code-v3`,
        redirectUri: credentials.redirectUri
      }));

      const authEndpoint = credentials.environmentId !== 'custom' 
        ? `https://auth.pingone.com/${credentials.environmentId}/as/authorize`
        : credentials.issuerUrl ? `${credentials.issuerUrl.replace(/\/$/, '')}/as/authorize` : '';

      const params = new URLSearchParams({
        client_id: credentials.clientId,
        response_type: credentials.responseType || 'code',
        redirect_uri: credentials.redirectUri,
        scope: credentials.scope || (flowType === 'oauth' ? 'read write' : 'openid profile email'),
        state: stateValue,
        code_challenge: pkceCodes.codeChallenge,
        code_challenge_method: pkceCodes.codeChallengeMethod
      });

      // Add OIDC-specific parameters for OIDC flows
      if (flowType === 'oidc') {
        params.append('nonce', nonce);
      }

      const url = `${authEndpoint}?${params.toString()}`;
      setAuthUrl(url);
      
      console.log(`🔍 [${flowType.toUpperCase()}-V3] Generated authorization URL:`, {
        endpoint: authEndpoint,
        clientId: `${credentials.clientId.substring(0, 8)}...`,
        redirectUri: credentials.redirectUri,
        scope: credentials.scope,
        state: `${stateValue.substring(0, 8)}...`,
        nonce: flowType === 'oidc' ? `${nonce.substring(0, 8)}...` : 'N/A'
      });

      showFlowSuccess('Authorization URL generated successfully');
    } catch (error) {
      console.error(`❌ [${flowType.toUpperCase()}-V3] Authorization URL generation failed:`, error);
      showFlowError(`Authorization URL generation failed: ${error.message}`);
    }
  }, [credentials, pkceCodes, flowType]);

  // Handle popup authorization
  const handlePopupAuthorization = useCallback(() => {
    if (!authUrl) return;
    
    setIsAuthorizing(true);
    
    // Store flow context for popup callback handling
    sessionStorage.setItem('flowContext', JSON.stringify({
      flow: `${flowType}-authorization-code-v3`,
      redirectUri: credentials.redirectUri
    }));

    const popup = window.open(
      authUrl,
      'oauth_popup',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      setIsAuthorizing(false);
      showFlowError('Popup blocked. Please allow popups and try again.');
      return;
    }

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setIsAuthorizing(false);
        console.log(`🔍 [${flowType.toUpperCase()}-V3] Popup closed`);
      }
    }, 1000);

    // Listen for messages from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === `${flowType.toUpperCase()}_CALLBACK`) {
        const { code, state: receivedState } = event.data;
        
        if (code) {
          setAuthCode(code);
          setState(receivedState || '');
          setCanExchangeTokens(true);
          setIsAuthorizing(false);
          
          popup.close();
          clearInterval(checkClosed);
          
          console.log(`✅ [${flowType.toUpperCase()}-V3] Authorization successful via popup`);
          showFlowSuccess('Authorization successful! Ready for token exchange.');
          
          // Auto-advance to token exchange step
          stepManager.setStep(5);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Cleanup
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      clearInterval(checkClosed);
    }, 300000); // 5 minutes timeout
  }, [authUrl, credentials.redirectUri, stepManager, flowType]);

  // Handle full redirect authorization
  const handleFullRedirectAuthorization = useCallback(() => {
    if (!authUrl) return;
    
    // Store flow context for redirect callback handling
    sessionStorage.setItem('flowContext', JSON.stringify({
      flow: `${flowType}-authorization-code-v3`,
      redirectUri: credentials.redirectUri
    }));
    
    console.log(`🔍 [${flowType.toUpperCase()}-V3] Redirecting to authorization URL`);
    window.location.href = authUrl;
  }, [authUrl, credentials.redirectUri, flowType]);

  // Exchange tokens
  const exchangeTokens = useCallback(async () => {
    console.log(`🔍 [${flowType.toUpperCase()}-V3] Starting token exchange validation:`, {
      hasAuthCode: Boolean(authCode),
      authCodeLength: authCode?.length || 0,
      hasEnvironmentId: Boolean(credentials.environmentId),
      environmentId: credentials.environmentId,
      hasClientId: Boolean(credentials.clientId),
      clientId: credentials.clientId,
      hasClientSecret: Boolean(credentials.clientSecret),
      clientSecretLength: credentials.clientSecret?.length || 0,
      hasRedirectUri: Boolean(credentials.redirectUri),
      redirectUri: credentials.redirectUri
    });

    if (!authCode || !credentials.environmentId || !credentials.clientId) {
      throw new Error('Authorization code, environment ID, and client ID are required');
    }

    setIsExchangingTokens(true);
    
    try {
      const codeVerifier = sessionStorage.getItem(`${flowType}_v3_code_verifier`);
      
      if (!codeVerifier) {
        throw new Error('Code verifier not found. Please restart the flow.');
      }

      const tokenEndpoint = credentials.environmentId !== 'custom'
        ? `https://auth.pingone.com/${credentials.environmentId}/as/token`
        : credentials.issuerUrl ? `${credentials.issuerUrl.replace(/\/$/, '')}/as/token` : '';

      const requestBody = {
        grant_type: 'authorization_code',
        code: authCode,
        code_verifier: codeVerifier,
        client_id: credentials.clientId,
        redirect_uri: credentials.redirectUri
      };

      console.log(`🔍 [${flowType.toUpperCase()}-V3] Original request body:`, {
        requestBody,
        authCode,
        codeVerifier,
        clientId: credentials.clientId,
        redirectUri: credentials.redirectUri
      });

      // Apply client authentication
      const authMethod: ClientAuthMethod = credentials.clientSecret ? 'client_secret_post' : 'none';
      const authMethodInfo = getAuthMethodSecurityLevel(authMethod);
      
      // Create the auth config object
      const authConfig: ClientAuthConfig = {
        method: authMethod,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        tokenEndpoint: tokenEndpoint
      };
      
      const authenticatedRequest = await applyClientAuthentication(authConfig, new URLSearchParams(requestBody));

      console.log(`🔍 [${flowType.toUpperCase()}-V3] Authenticated request:`, {
        headers: authenticatedRequest.headers,
        bodyEntries: Array.from(authenticatedRequest.body.entries()),
        authConfig,
        originalRequestBody: requestBody
      });

      console.log(`🔍 [${flowType.toUpperCase()}-V3] Exchanging tokens:`, {
        tokenEndpoint,
        clientId: `${credentials.clientId.substring(0, 8)}...`,
        hasCodeVerifier: Boolean(codeVerifier),
        authMethod: authMethodInfo.level
      });

      // Convert URLSearchParams to object for JSON transmission
      const requestParams: Record<string, string> = {};
      authenticatedRequest.body.forEach((value, key) => {
        requestParams[key] = value;
      });

      const finalRequestBody = {
        ...requestParams,
        environment_id: credentials.environmentId,
        token_endpoint: tokenEndpoint
      };

      console.log(`🔍 [${flowType.toUpperCase()}-V3] Final request body:`, {
        requestParams,
        environment_id: credentials.environmentId,
        token_endpoint: tokenEndpoint,
        finalRequestBody
      });

      const response = await fetch('/api/token-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authenticatedRequest.headers
        },
        body: JSON.stringify(finalRequestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const tokenData = await response.json();
      
      console.log(`✅ [${flowType.toUpperCase()}-V3] Token exchange successful:`, {
        hasAccessToken: Boolean(tokenData.access_token),
        hasRefreshToken: Boolean(tokenData.refresh_token),
        hasIdToken: Boolean(tokenData.id_token),
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope
      });

      setTokens(tokenData);
      
      // Store tokens
      sessionStorage.setItem(`${flowType}_v3_access_token`, tokenData.access_token || '');
      sessionStorage.setItem(`${flowType}_v3_refresh_token`, tokenData.refresh_token || '');
      sessionStorage.setItem(`${flowType}_v3_id_token`, tokenData.id_token || '');

      // For OIDC flows, fetch user info if available
      if (flowType === 'oidc' && tokenData.access_token) {
        try {
          const userInfoResponse = await fetch('/api/userinfo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: tokenData.access_token,
              environment_id: credentials.environmentId
            })
          });

          if (userInfoResponse.ok) {
            const userInfoData = await userInfoResponse.json();
            setUserInfo(userInfoData);
            console.log(`✅ [${flowType.toUpperCase()}-V3] User info fetched successfully`);
          }
        } catch (userInfoError) {
          console.warn(`⚠️ [${flowType.toUpperCase()}-V3] User info fetch failed:`, userInfoError);
        }
      }

      showFlowSuccess('Token exchange successful!');
      stepManager.setStep(6); // Move to token validation step
      
    } catch (error) {
      console.error(`❌ [${flowType.toUpperCase()}-V3] Token exchange failed:`, error);
      showFlowError(`Token exchange failed: ${error.message}`);
    } finally {
      setIsExchangingTokens(false);
    }
  }, [authCode, credentials, stepManager, flowType]);

  // Save credentials
  const saveCredentials = useCallback(async () => {
    try {
      const environmentId = credentials.environmentId || 
        (credentials.issuerUrl && credentials.issuerUrl.includes('pingone') ? 
          credentials.issuerUrl.split('/')[4] : 'custom');
      
      const scopesToSave = credentials.scope ? credentials.scope.split(' ') : 
        (flowType === 'oauth' ? ['read', 'write'] : ['openid', 'profile', 'email']);
      
      console.log(`🔍 [${flowType.toUpperCase()}-V3] Saving credentials:`, {
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
    } catch (error) {
      console.error(`❌ [${flowType.toUpperCase()}-V3] Save credentials failed:`, error);
      showFlowError('Failed to save credentials');
    }
  }, [credentials, flowType]);

  // Clear credentials
  const clearCredentials = useCallback(() => {
    credentialManager.clearAllCredentials();
    setCredentials({
      environmentId: '',
      clientId: '',
      clientSecret: '',
      redirectUri: `${window.location.origin}/authz-callback`,
      scope: flowType === 'oauth' ? 'read write' : 'openid profile email',
      scopes: flowType === 'oauth' ? ['read', 'write'] : ['openid', 'profile', 'email'],
      responseType: 'code',
      grantType: 'authorization_code',
      issuerUrl: ''
    });
    showFlowSuccess('Credentials cleared successfully');
  }, [flowType]);

  // Reset flow
  const resetFlow = useCallback(() => {
    console.log(`🔄 [${flowType.toUpperCase()}-V3] Reset flow initiated`);
    console.log(`🔍 [${flowType.toUpperCase()}-V3] Current step before reset:`, stepManager.currentStepIndex);
    
    // Clear all state
    setPkceCodes({ codeVerifier: '', codeChallenge: '', codeChallengeMethod: 'S256' });
    setAuthUrl('');
    setAuthCode('');
    setState('');
    setTokens(null);
    setUserInfo(null);
    setCanExchangeTokens(false);
    
    // Clear session storage
    sessionStorage.removeItem(`${flowType}_v3_code_verifier`);
    sessionStorage.removeItem(`${flowType}_v3_state`);
    sessionStorage.removeItem(`${flowType}_v3_nonce`);
    sessionStorage.removeItem(`${flowType}_v3_redirect_uri`);
    sessionStorage.removeItem(`${flowType}_v3_auth_code`);
    sessionStorage.removeItem(`${flowType}_v3_access_token`);
    sessionStorage.removeItem(`${flowType}_v3_refresh_token`);
    sessionStorage.removeItem(`${flowType}_v3_id_token`);
    sessionStorage.removeItem(`${flowType}_v3_step_results`);
    sessionStorage.removeItem('flowContext');
    
    console.log(`🔍 [${flowType.toUpperCase()}-V3] Cleared session storage, resetting to step 0`);
    
    // Reset to first step
    stepManager.setStep(0);
    
    console.log(`🔍 [${flowType.toUpperCase()}-V3] Step after reset:`, stepManager.currentStepIndex);
    
    showFlowSuccess(`${flowType.toUpperCase()} flow reset successfully`);
    
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stepManager, flowType]);

  // Navigate to Token Management
  const navigateToTokenManagement = useCallback((tokenType: 'access' | 'refresh' | 'id') => {
    const token = tokenType === 'access' ? tokens?.access_token : 
                  tokenType === 'refresh' ? tokens?.refresh_token : 
                  tokens?.id_token;
    
    if (token) {
      // Store the token for the Token Management page
      sessionStorage.setItem('token_to_analyze', token);
      sessionStorage.setItem('token_type', tokenType);
      window.location.href = '/token-management';
    }
  }, [tokens]);

  // Copy UserInfo to clipboard
  const copyUserInfo = useCallback(async () => {
    if (userInfo) {
      try {
        await copyToClipboard(JSON.stringify(userInfo, null, 2));
        showFlowSuccess('UserInfo copied to clipboard');
      } catch (error) {
        showFlowError('Failed to copy UserInfo');
      }
    }
  }, [userInfo]);

  // Create steps based on flow type
  const steps = React.useMemo(() => {
    const baseSteps = [
      {
        ...createCredentialsStep(credentials, setCredentials, saveCredentials, `${flowType.toUpperCase()} Authorization Code Flow`),
        canExecute: Boolean(
          credentials.environmentId &&
          credentials.clientId &&
          credentials.clientSecret &&
          credentials.redirectUri
        ),
        completed: hasStepResult('setup-credentials')
      },
      {
        ...createPKCEStep(pkceCodes, setPkceCodes, generatePKCE),
        canExecute: Boolean(credentials.environmentId && credentials.clientId),
        completed: hasStepResult('generate-pkce')
      },
      {
        ...createAuthUrlStep(authUrl, generateAuthUrl, credentials, pkceCodes, handlePopupAuthorization, handleFullRedirectAuthorization, isAuthorizing, showExplainer, setShowExplainer),
        canExecute: Boolean(
          credentials.environmentId &&
          credentials.clientId &&
          credentials.redirectUri &&
          pkceCodes.codeVerifier &&
          pkceCodes.codeChallenge &&
          !authCode // Disable after successful authentication
        ),
        completed: hasStepResult('build-auth-url')
      },
      {
        ...createUserAuthorizationStep(authUrl, handlePopupAuthorization, handleFullRedirectAuthorization, isAuthorizing, authCode),
        canExecute: Boolean(authUrl && !authCode), // Disable after successful authentication
        completed: hasStepResult('user-authorization') || Boolean(authCode)
      },
      {
        ...createCallbackHandlingStep(authCode, resetFlow),
        canExecute: Boolean(authCode),
        completed: hasStepResult('handle-callback') || Boolean(authCode)
      },
      {
        ...createTokenExchangeStep(authCode, tokens, exchangeTokens, credentials, isExchangingTokens),
        canExecute: Boolean(authCode && credentials.environmentId && credentials.clientId && !tokens?.access_token),
        completed: hasStepResult('exchange-tokens') || Boolean(tokens?.access_token)
      }
    ];

    // Add flow-specific final steps
    if (flowType === 'oidc') {
      // OIDC flow includes token validation and user info
      baseSteps.push(
        {
          id: 'validate-tokens',
          title: 'Validate Tokens & Token Management',
          description: 'Validate the received tokens and use them with the Token Management page for detailed inspection.',
          icon: <FiShield />,
          category: 'validation',
          content: (
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                padding: '1rem', 
                background: '#eff6ff', 
                border: '1px solid #bfdbfe', 
                color: '#1e40af', 
                borderRadius: '6px', 
                marginBottom: '1rem' 
              }}>
                <FiShield />
                <div>
                  <strong>Token Validation & Management</strong>
                  <br />
                  Your tokens are ready! Use the Token Management page to decode and inspect them.
                </div>
              </div>
              
              {tokens && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '1rem', 
                  background: '#f0fdf4', 
                  border: '1px solid #bbf7d0', 
                  color: '#15803d', 
                  borderRadius: '6px', 
                  marginBottom: '1rem' 
                }}>
                  <FiCheckCircle />
                  <div>
                    <strong>✅ Tokens Received Successfully!</strong>
                    <br />
                    Access token, ID token, and refresh token are ready for use.
                  </div>
                </div>
              )}
              
              {userInfo && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '1rem', 
                  background: '#fef3c7', 
                  border: '1px solid #fcd34d', 
                  color: '#92400e', 
                  borderRadius: '6px', 
                  marginBottom: '1rem' 
                }}>
                  <FiUser />
                  <div>
                    <strong>👤 User Info Retrieved</strong>
                    <br />
                    User profile information has been fetched successfully.
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <ActionButton onClick={() => navigateToTokenManagement('access')}>
                  🔍 Decode Access Token
                </ActionButton>
                <ActionButton onClick={() => navigateToTokenManagement('id')}>
                  🔍 Decode ID Token
                </ActionButton>
                <ActionButton onClick={() => navigateToTokenManagement('refresh')}>
                  🔍 Decode Refresh Token
                </ActionButton>
              </div>
              
              {userInfo && (
                <div style={{ marginTop: '1rem' }}>
                  <h4>User Info</h4>
                  <div style={{ 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    padding: '1rem',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    maxHeight: '300px',
                    overflow: 'auto'
                  }}>
                    <pre>{JSON.stringify(userInfo, null, 2)}</pre>
                  </div>
                  <button 
                    onClick={copyUserInfo}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    📋 Copy UserInfo
                  </button>
                </div>
              )}
            </div>
          ),
          canExecute: Boolean(tokens?.access_token),
          completed: Boolean(tokens?.access_token),
          isFinalStep: true
        }
      );
    } else {
      // OAuth flow has simpler final step
      baseSteps.push(
        {
          id: 'oauth-token-management',
          title: 'OAuth Token Analysis',
          description: 'Analyze and manage your OAuth tokens',
          icon: <FiCheckCircle />,
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
                  <ActionButton onClick={() => navigateToTokenManagement('access')}>
                    🔍 Decode Access Token
                  </ActionButton>
                  <ActionButton onClick={() => navigateToTokenManagement('refresh')}>
                    🔍 Decode Refresh Token
                  </ActionButton>
                </div>
              )}
              
              <div style={{ marginTop: '2rem' }}>
                <ActionButton onClick={resetFlow}>
                  <FiRotateCcw /> Restart OAuth Flow
                </ActionButton>
              </div>
            </div>
          )
        }
      );
    }

    return baseSteps;
  }, [credentials, pkceCodes, authUrl, authCode, tokens, userInfo, isAuthorizing, isExchangingTokens, flowType, stepManager.currentStepIndex, hasStepResult, saveCredentials, generatePKCE, generateAuthUrl, handlePopupAuthorization, handleFullRedirectAuthorization, exchangeTokens, resetFlow, navigateToTokenManagement, copyUserInfo]);

  const flowTitle = flowType === 'oauth' 
    ? '🔐 OAuth 2.0 Authorization Code Flow (V3)' 
    : '🚀 OIDC Authorization Code Flow (V3)';
    
  const flowDescription = flowType === 'oauth'
    ? 'A pure OAuth 2.0 Authorization Code Flow for resource access. This flow focuses solely on obtaining an Access Token for API access.'
    : 'A comprehensive OpenID Connect Authorization Code Flow. This flow provides authentication, authorization, and user profile information.';

  return (
    <Container>
      <Header>
        <Title>{flowTitle}</Title>
        <Description>{flowDescription}</Description>
      </Header>

      <FlowCard>
        {/* Flow Configuration */}
        <FlowConfiguration
          config={flowConfig}
          onConfigChange={handleFlowConfigChange}
          flowType={flowType === 'oidc' ? 'oidc-authorization-code' : 'oauth-authorization-code'}
          initialExpanded={false}
          title="Flow Configuration"
          subtitle="Configure OAuth 2.0 and OpenID Connect specific settings"
        />

        {/* Main Step Flow */}
        <EnhancedStepFlowV2 
          steps={steps}
          title={flowTitle}
          persistKey={`${flowType}-authz-v3`}
          initialStepIndex={stepManager.currentStepIndex}
          onStepChange={stepManager.setStep}
          autoAdvance={false}
          showDebugInfo={true}
          allowStepJumping={true}
          onStepComplete={(stepId, result) => {
            console.log(`✅ [${flowType.toUpperCase()}-V3] Step completed:`, stepId, result);
          }}
        />

        {/* Flow Control Actions */}
        <FlowControlSection>
          <FlowControlTitle>
            ⚙️ Flow Control Actions
          </FlowControlTitle>
          <ActionButton onClick={clearCredentials}>
            🧹 Clear Credentials
          </ActionButton>
          <ActionButton onClick={resetFlow}>
            <FiRotateCcw /> Reset Flow
          </ActionButton>
        </FlowControlSection>
      </FlowCard>

      {/* PingOne Configuration Section - Only show on step 1 */}
      <PingOneConfigSection
        callbackUrl={`${window.location.origin}/authz-callback`}
        flowType={flowTitle}
        showOnlyOnStep={0}
        currentStep={stepManager.currentStepIndex}
      />

      {/* Centralized Success/Error Messages */}
      <CentralizedSuccessMessage />

      {/* Documentation */}
      <InlineDocumentation>
        <QuickReference 
          title={`${flowType.toUpperCase()} 2.0 Authorization Code Flow`}
          items={flowType === 'oauth' ? [
            'Pure OAuth 2.0 implementation for resource access',
            'PKCE (RFC 7636) for enhanced security',
            'Authorization code exchange for access tokens',
            'No user identity information included',
            'Ideal for API access and resource authorization'
          ] : [
            'Complete OpenID Connect implementation',
            'Authentication and authorization in one flow',
            'PKCE (RFC 7636) for enhanced security',
            'Access token, ID token, and refresh token',
            'User profile information via UserInfo endpoint',
            'OIDC compliance and best practices'
          ]}
        />
        <TroubleshootingGuide 
          title="Common Issues"
          symptoms={[
            'Redirect URI mismatch error',
            'Invalid client credentials',
            'Authorization code expired',
            'Token exchange failed'
          ]}
          solutions={[
            'Verify redirect URI matches exactly in PingOne console',
            'Check client ID and secret are correct',
            'Ensure authorization code is fresh (use within 10 minutes)',
            'Verify PKCE code verifier matches challenge'
          ]}
        />
      </InlineDocumentation>
    </Container>
  );
};

export default UnifiedAuthorizationCodeFlowV3;
