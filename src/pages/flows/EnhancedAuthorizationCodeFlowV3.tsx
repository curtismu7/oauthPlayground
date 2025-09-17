// src/pages/flows/EnhancedAuthorizationCodeFlowV3.tsx - Clean reusable implementation

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
  createTokenExchangeStep, 
  createUserInfoStep,
  StepCredentials,
  PKCECodes 
} from '../../components/steps/CommonSteps';
import { generateCodeVerifier, generateCodeChallenge } from '../../utils/oauth';
import { credentialManager } from '../../utils/credentialManager';
import { FlowConfiguration, FlowConfig } from '../../components/FlowConfiguration';
import { getDefaultConfig } from '../../utils/flowConfigDefaults';
import { validateIdToken } from '../../utils/oauth';
import { applyClientAuthentication, getAuthMethodSecurityLevel } from '../../utils/clientAuthentication';
import CallbackUrlDisplay from '../../components/CallbackUrlDisplay';
import { getCallbackUrlForFlow } from '../../utils/callbackUrls';
import OAuthErrorHelper from '../../components/OAuthErrorHelper';
import { PingOneErrorInterpreter } from '../../utils/pingoneErrorInterpreter';

const EnhancedAuthorizationCodeFlowV3: React.FC = () => {
  const authContext = useAuth();
  const { config } = authContext;
  
  // Use centralized scroll management
  useAuthorizationFlowScroll('Enhanced Authorization Code Flow V3');

  // Use the new step management system
  const stepManager = useFlowStepManager({
    flowType: 'oidc-authorization-code',
    persistKey: 'enhanced-authz-v3',
    defaultStep: 0,
    enableAutoAdvance: true
  });

  // Comprehensive URL parameter debugging and handling (V2 feature)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    // Log all URL parameters for debugging
    console.log('🔍 [OIDC-V3] Comprehensive URL parameter analysis:');
    console.log('   Current URL:', window.location.href);
    console.log('   Search params:', Object.fromEntries(urlParams.entries()));
    console.log('   Hash params:', Object.fromEntries(hashParams.entries()));
    
    // Check for authorization code in query parameters
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    // Check for tokens in hash parameters (for implicit flow compatibility)
    const accessToken = hashParams.get('access_token');
    const idToken = hashParams.get('id_token');
    const tokenType = hashParams.get('token_type');
    
    console.log('🔍 [OIDC-V3] Parameter extraction results:', {
      code: code ? `${code.substring(0, 10)}...` : null,
      state: state ? `${state.substring(0, 10)}...` : null,
      error: error,
      errorDescription: errorDescription,
      accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : null,
      idToken: idToken ? `${idToken.substring(0, 20)}...` : null,
      tokenType: tokenType
    });
    
    // Handle authorization errors with enhanced error interpretation
    if (error) {
      console.error('❌ [OIDC-V3] Authorization error received:', {
        error,
        errorDescription,
        fullUrl: window.location.href
      });
      
      // Use enhanced error handling with PingOneErrorInterpreter
      // handleOAuthError({
      //   error: error,
      //   error_description: errorDescription,
      //   details: {
      //     fullUrl: window.location.href,
      //     searchParams: Object.fromEntries(urlParams.entries()),
      //     hashParams: Object.fromEntries(hashParams.entries())
      //   }
      // }, 'authorization'); // Temporarily commented to fix syntax
      showFlowError(`❌ Authorization failed: ${errorDescription || error}`);
      return;
    }
    
    // Handle authorization code (standard flow)
    if (code) {
      console.log('✅ [OIDC-V3] Authorization code detected:', code);
      
      // Validate state parameter for CSRF protection
      const storedState = sessionStorage.getItem('oauth_state');
      if (state && storedState && state !== storedState) {
        console.error('❌ [OIDC-V3] State parameter mismatch - possible CSRF attack:', {
          received: state,
          expected: storedState
        });
        
        // Use enhanced error handling for CSRF protection
        // handleOAuthError({
        //   error: 'invalid_state',
        //   error_description: 'State parameter mismatch - possible CSRF attack detected',
        //   details: {
        //     receivedState: state,
        //     expectedState: storedState,
        //     securityIssue: 'CSRF_PROTECTION'
        //   }
        // }, 'authorization'); // Temporarily commented to fix syntax
        showFlowError('❌ State parameter mismatch. Possible CSRF attack detected.');
        return;
      }
      
      setAuthCode(code);
      console.log('🔄 [OIDC-V3] Auto-advancing to token exchange step');
      
      // Auto-advance to token exchange step (step 3 in our 5-step flow)
      if (stepManager.currentStepIndex < 3) {
        stepManager.setStep(3, 'authorization code detected');
      }
      
      // Clean up URL parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      console.log('🧹 [OIDC-V3] Cleaned URL parameters from address bar');
      
      showFlowSuccess('🎉 Authorization successful! You can now exchange your authorization code for tokens.');
    }
    
    // Handle implicit flow tokens (if present)
    if (accessToken) {
      console.log('🔑 [OIDC-V3] Implicit flow tokens detected');
      const implicitTokens = {
        access_token: accessToken,
        id_token: idToken,
        token_type: tokenType || 'Bearer',
        expires_in: hashParams.get('expires_in'),
        scope: hashParams.get('scope')
      };
      
      setTokens(implicitTokens);
      console.log('🔄 [OIDC-V3] Auto-advancing to user info step for implicit flow');
      stepManager.setStep(4, 'implicit flow tokens received');
    }
  }, [stepManager]);

  // Flow state
  const [credentials, setCredentials] = useState<StepCredentials>({
    clientId: '',
    clientSecret: '',
    environmentId: '',
    redirectUri: window.location.origin + '/authz-callback',
    scopes: 'openid profile email',
    authorizationEndpoint: '',
    tokenEndpoint: '',
    userInfoEndpoint: ''
  });

  const [pkceCodes, setPkceCodes] = useState<PKCECodes>({
    codeVerifier: '',
    codeChallenge: ''
  });

  const [authUrl, setAuthUrl] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [tokens, setTokens] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isExchangingTokens, setIsExchangingTokens] = useState(false);
  const [isGettingUserInfo, setIsGettingUserInfo] = useState(false);
  
  // Authorization handling state (V2 features)
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [showAuthSuccessModal, setShowAuthSuccessModal] = useState(false);

  // Step completion tracking and result persistence (V2 features)
  const [stepResults, setStepResults] = useState<Record<string, any>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  
  // Reset functionality with confirmation modals (V2 features)
  const [showResetModal, setShowResetModal] = useState(false);
  const [showClearCredentialsModal, setShowClearCredentialsModal] = useState(false);
  
  // Error handling state (V2 features)
  const [currentError, setCurrentError] = useState<any>(null);
  const [showErrorHelper, setShowErrorHelper] = useState(false);

  // Flow Configuration state - V2 feature integration
  const [flowConfig, setFlowConfig] = useState<FlowConfig>(() => getDefaultConfig('oidc-authorization-code'));

  // Load credentials on mount
  React.useEffect(() => {
    const loadCredentials = () => {
      const saved = credentialManager.loadAuthzFlowCredentials();
      if (saved) {
        setCredentials({
          clientId: saved.clientId || '',
          clientSecret: saved.clientSecret || '',
          environmentId: saved.environmentId || '',
          redirectUri: saved.redirectUri || window.location.origin + '/authz-callback',
          scopes: Array.isArray(saved.scopes) ? saved.scopes.join(' ') : (saved.scopes || 'openid profile email'),
          authorizationEndpoint: saved.authEndpoint || '',
          tokenEndpoint: saved.tokenEndpoint || '',
          userInfoEndpoint: saved.userInfoEndpoint || ''
        });
      }
    };
    loadCredentials();
  }, []);

  // Save credentials function
  const saveCredentials = useCallback(async () => {
    try {
      const success = credentialManager.saveAuthzFlowCredentials({
        environmentId: credentials.environmentId,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        redirectUri: credentials.redirectUri,
        scopes: credentials.scopes.split(' '),
        authEndpoint: credentials.authorizationEndpoint,
        tokenEndpoint: credentials.tokenEndpoint,
        userInfoEndpoint: credentials.userInfoEndpoint
      });

      if (success) {
        showFlowSuccess('✅ Credentials Saved Successfully');
      } else {
        throw new Error('Failed to save credentials');
      }
    } catch (error) {
      showFlowError('❌ Failed to save credentials');
      throw error;
    }
  }, [credentials]);

  // Generate PKCE codes
  const generatePKCE = useCallback(async () => {
    try {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier, 'S256');
      
      setPkceCodes({
        codeVerifier: verifier,
        codeChallenge: challenge
      });

      showFlowSuccess('🛡️ PKCE Codes Generated Successfully');
    } catch (error) {
      showFlowError('❌ Failed to generate PKCE codes');
      throw error;
    }
  }, []);

  // Generate authorization URL with advanced parameters from FlowConfig
  const generateAuthUrl = useCallback(() => {
    try {
      const authEndpoint = credentials.authorizationEndpoint || 
        `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;

      // Generate nonce for OIDC compliance
      const generatedNonce = generateCodeVerifier().substring(0, 32);
      sessionStorage.setItem('oauth_nonce', generatedNonce);

      // Use dynamic callback URL for the flow (V2 feature)
      const redirectUri = getCallbackUrlForFlow('authorization-code');
      console.log('🔧 [OIDC-V3] Using dynamic callback URL:', redirectUri);

      // Handle scopes properly - V2 compatibility fix
      const scopes = flowConfig.scopes && flowConfig.scopes.length > 0 
        ? flowConfig.scopes.join(' ') 
        : (credentials.scopes || 'openid profile email');
      
      console.log('🔧 [OIDC-V3] Using scopes:', scopes);
      
      // Validate required parameters BEFORE building URL (V2 feature)
      if (!credentials.clientId) {
        throw new Error('Client ID is required. Please configure your credentials first.');
      }
      if (!credentials.environmentId) {
        throw new Error('Environment ID is required. Please configure your credentials first.');
      }
      if (!redirectUri) {
        throw new Error('Redirect URI is required');
      }
      if (!scopes || scopes.trim() === '') {
        throw new Error('At least one scope must be specified');
      }

      // Generate state for CSRF protection
      const generatedState = flowConfig.state || generateCodeVerifier().substring(0, 32);
      sessionStorage.setItem('oauth_state', generatedState);

      // Base parameters
      const params = new URLSearchParams({
        response_type: flowConfig.responseType || 'code',
        client_id: credentials.clientId,
        redirect_uri: redirectUri,
        scope: scopes,
        state: generatedState,
        code_challenge: pkceCodes.codeChallenge,
        code_challenge_method: 'S256'
      });

      // Advanced OIDC parameters from FlowConfig
      if (flowConfig.nonce || generatedNonce) {
        params.set('nonce', flowConfig.nonce || generatedNonce);
      }

      if (flowConfig.maxAge && flowConfig.maxAge > 0) {
        params.set('max_age', flowConfig.maxAge.toString());
      }

      if (flowConfig.prompt) {
        params.set('prompt', flowConfig.prompt);
      }

      if (flowConfig.loginHint) {
        params.set('login_hint', flowConfig.loginHint);
      }

      if (flowConfig.acrValues && flowConfig.acrValues.length > 0) {
        params.set('acr_values', flowConfig.acrValues.join(' '));
      }

      // Custom parameters support
      if (flowConfig.customParams) {
        Object.entries(flowConfig.customParams).forEach(([key, value]) => {
          if (value) {
            params.set(key, String(value));
          }
        });
      }

      const url = authEndpoint + '?' + params.toString();
      
      console.log('✅ [OIDC-V3] Generated authorization URL with advanced parameters:', url);
      console.log('🔧 [OIDC-V3] URL parameters breakdown:', {
        response_type: params.get('response_type'),
        client_id: params.get('client_id'),
        redirect_uri: params.get('redirect_uri'),
        scope: params.get('scope'),
        state: params.get('state'),
        code_challenge: params.get('code_challenge'),
        code_challenge_method: params.get('code_challenge_method'),
        nonce: params.get('nonce')
      });
      
      setAuthUrl(url);
      showFlowSuccess('🌐 Authorization URL Generated Successfully with Advanced Parameters');
    } catch (error) {
      showFlowError('❌ Failed to generate authorization URL');
      throw error;
    }
  }, [credentials, pkceCodes, flowConfig]);

  // Exchange tokens using V2's proven backend API approach
  const exchangeTokens = useCallback(async () => {
    if (!authCode) {
      showFlowError('❌ No authorization code available');
      return;
    }

    setIsExchangingTokens(true);
    try {
      // Use dynamic callback URL for token exchange (V2 feature)
      const redirectUri = getCallbackUrlForFlow('authorization-code');
      
      // Use V2's backend API approach - EXACT SAME LOGIC
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://oauth-playground.vercel.app' 
        : 'http://localhost:3001';

      // Build request body exactly like V2
      const baseBody = new URLSearchParams({
        grant_type: flowConfig.grantType || 'authorization_code',
        code: authCode,
        code_verifier: pkceCodes.codeVerifier,
        environment_id: credentials.environmentId,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret || '',
        redirectUri: redirectUri
      });

      // Convert URLSearchParams to object for backend compatibility (V2 approach)
      const requestBody = {
        grant_type: baseBody.get('grant_type'),
        code: baseBody.get('code'),
        code_verifier: baseBody.get('code_verifier'),
        environment_id: baseBody.get('environment_id'),
        client_id: baseBody.get('client_id'),
        client_secret: baseBody.get('client_secret'),
        redirectUri: baseBody.get('redirectUri')
      };

      // Apply client authentication using V2's method
      const authConfig = {
        method: flowConfig.clientAuthMethod || 'client_secret_post',
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        tokenEndpoint: credentials.tokenEndpoint || `https://auth.pingone.com/${credentials.environmentId}/as/token`
      };
      
      const authenticatedRequest = await applyClientAuthentication(authConfig, baseBody);

      console.log('🔄 [OIDC-V3] Using V2s backend API approach:', {
        backendUrl: backendUrl + '/api/token-exchange',
        grantType: requestBody.grant_type,
        clientId: requestBody.client_id ? requestBody.client_id.substring(0, 8) + '...' : 'none',
        hasCode: !!requestBody.code,
        hasVerifier: !!requestBody.code_verifier,
        authMethod: flowConfig.clientAuthMethod
      });

      // Use V2's exact backend API call
      const response = await fetch(backendUrl + '/api/token-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authenticatedRequest.headers  // Include authentication headers
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [OIDC-V3] Token exchange failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Use enhanced error handling
        handleOAuthError(errorData, 'token-exchange');
        throw new Error(`Token exchange failed: ${response.status} ${errorData.message || response.statusText}`);
      }

      const tokenData = await response.json();
      console.log('✅ [OIDC-V3] Token exchange successful using V2 backend API:', tokenData);

      // Enhanced OIDC ID Token validation (V2 feature)
      if (tokenData.id_token) {
        try {
          const nonce = sessionStorage.getItem('oauth_nonce');
          const validatedPayload = await validateIdToken(
            tokenData.id_token,
            credentials.clientId,
            `https://auth.pingone.com/${credentials.environmentId}`,
            nonce || undefined,
            flowConfig.maxAge || undefined
          );
          
          // Log detailed validation results (V2 feature)
          console.log('✅ [OIDC-V3] ID token validation successful with details:', {
            issuer: validatedPayload.iss,
            subject: validatedPayload.sub,
            audience: validatedPayload.aud,
            nonce: validatedPayload.nonce ? '✅ Validated' : 'Not present',
            authTime: validatedPayload.auth_time ? '✅ Present' : 'Not present',
            expiry: new Date(validatedPayload.exp * 1000).toISOString()
          });
          
          // Clear the nonce after successful validation (prevent reuse)
          if (nonce) {
            sessionStorage.removeItem('oauth_nonce');
            console.log('🔐 [OIDC-V3] Nonce cleared after successful validation');
          }
          
        } catch (validationError) {
          console.error('❌ [OIDC-V3] ID token validation failed:', validationError);
          showFlowError(`❌ OIDC Compliance Error: ${validationError.message}`);
          // Don't throw here - let the flow continue with a warning
        }
      }
      
      setTokens(tokenData);
      
      // Store tokens for other pages
      localStorage.setItem('oauth_tokens', JSON.stringify(tokenData));
      
      // Enhanced success message with token details (V2 feature)
      const tokenSummary = [
        `✅ Access Token: ${tokenData.access_token ? 'Received' : 'Missing'}`,
        `✅ Refresh Token: ${tokenData.refresh_token ? 'Received' : 'Missing'}`,
        `✅ ID Token: ${tokenData.id_token ? 'Received' : 'Missing'}`,
        `⏱️ Expires In: ${tokenData.expires_in ? `${tokenData.expires_in} seconds` : 'Unknown'}`,
        `🔐 Token Type: ${tokenData.token_type || 'Bearer'}`,
        `🎯 Scope: ${tokenData.scope || 'Not specified'}`
      ].join('\n');
      
      showFlowSuccess(`🔑 Tokens Exchanged Successfully with Advanced Validation\n\n${tokenSummary}`);
    } catch (error) {
      console.error('❌ [OIDC-V3] Token exchange failed:', error);
      
      // Use enhanced error handling with context
      // handleOAuthError(error, 'token-exchange'); // Temporarily commented to fix syntax
      throw error;
    } finally {
      setIsExchangingTokens(false);
    }
  }, [authCode, credentials, pkceCodes, flowConfig]);

  // Get user info with proper access token
  const getUserInfo = useCallback(async () => {
    if (!tokens?.access_token) {
      showFlowError('❌ No access token available for UserInfo request');
      return;
    }

    setIsGettingUserInfo(true);
    try {
      const userInfoEndpoint = credentials.userInfoEndpoint || 
        `https://auth.pingone.com/${credentials.environmentId}/as/userinfo`;

      console.log('🔄 [OIDC-V3] Calling UserInfo endpoint:', userInfoEndpoint);

      const response = await fetch(userInfoEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`UserInfo request failed: ${response.status} ${errorText}`);
      }

      const userData = await response.json();
      console.log('✅ [OIDC-V3] UserInfo retrieved:', userData);
      
      setUserInfo(userData);
      showFlowSuccess('👤 User Information Retrieved Successfully');
    } catch (error) {
      console.error('❌ [OIDC-V3] UserInfo request failed:', error);
      showFlowError(`❌ Failed to get user information: ${error.message}`);
      throw error;
    } finally {
      setIsGettingUserInfo(false);
    }
  }, [tokens, credentials]);

  // Step result management functions (V2 features)
  const saveStepResult = useCallback((stepId: string, result: any) => {
    console.log('💾 [OIDC-V3] Saving step result:', { stepId, result });
    setStepResults(prev => ({ ...prev, [stepId]: result }));
    setCompletedSteps(prev => new Set([...prev, stepId]));
    
    // Persist to localStorage for session recovery
    const persistKey = `oidc-v3-step-results`;
    const persistData = { ...stepResults, [stepId]: result };
    localStorage.setItem(persistKey, JSON.stringify(persistData));
  }, [stepResults]);

  const getStepResult = useCallback((stepId: string) => {
    return stepResults[stepId];
  }, [stepResults]);

  const hasStepResult = useCallback((stepId: string) => {
    return stepId in stepResults && completedSteps.has(stepId);
  }, [stepResults, completedSteps]);

  const clearStepResults = useCallback(() => {
    console.log('🧹 [OIDC-V3] Clearing all step results');
    setStepResults({});
    setCompletedSteps(new Set());
    localStorage.removeItem('oidc-v3-step-results');
  }, []);

  // Load persisted step results on mount
  React.useEffect(() => {
    const persistKey = `oidc-v3-step-results`;
    const persistedResults = localStorage.getItem(persistKey);
    if (persistedResults) {
      try {
        const results = JSON.parse(persistedResults);
        setStepResults(results);
        setCompletedSteps(new Set(Object.keys(results)));
        console.log('📂 [OIDC-V3] Loaded persisted step results:', results);
      } catch (error) {
        console.error('❌ [OIDC-V3] Failed to load persisted step results:', error);
      }
    }
  }, []);

  // Reset functionality (V2 features)
  const handleReset = useCallback(() => {
    console.log('🔄 [OIDC-V3] Resetting entire flow');
    
    // Reset all state
    setAuthCode('');
    setTokens(null);
    setUserInfo(null);
    setAuthUrl('');
    setPkceCodes({ codeVerifier: '', codeChallenge: '' });
    setIsExchangingTokens(false);
    setIsGettingUserInfo(false);
    setIsAuthorizing(false);
    
    // Clear step results
    clearStepResults();
    
    // Reset step manager
    stepManager.setStep(0, 'flow reset');
    
    // Clear session storage
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_nonce');
    sessionStorage.removeItem('oidc-v3-flow-state');
    
    // Close modal
    setShowResetModal(false);
    
    showFlowSuccess('🔄 Flow reset successfully');
  }, [clearStepResults, stepManager, setPkceCodes]);

  const handleClearCredentials = useCallback(() => {
    console.log('🧹 [OIDC-V3] Clearing credentials');
    
    // Clear credentials
    setCredentials({
      clientId: '',
      clientSecret: '',
      environmentId: '',
      redirectUri: '',
      scopes: ''
    });
    
    // Clear from storage
    credentialManager.clearAllCredentials();
    
    // Close modal
    setShowClearCredentialsModal(false);
    
    showFlowSuccess('🧹 Credentials cleared successfully');
  }, [setCredentials]);

  // Enhanced error handling with PingOneErrorInterpreter (V2 features)
  const handleOAuthError = useCallback((error: any, context?: string) => {
    console.error('❌ [OIDC-V3] OAuth error occurred:', { error, context });
    
    // Interpret the error using PingOneErrorInterpreter
    let interpretedError;
    try {
      interpretedError = PingOneErrorInterpreter.interpret(error);
      console.log('🔍 [OIDC-V3] Error interpreted:', interpretedError);
    } catch (interpreterError) {
      console.error('❌ [OIDC-V3] Error interpreter failed:', interpreterError);
      // Fallback error interpretation
      interpretedError = {
        title: 'OAuth Error',
        message: error?.error_description || error?.message || String(error),
        suggestion: 'Please check your configuration and try again.',
        technicalDetails: JSON.stringify(error, null, 2),
        severity: 'error' as const,
        category: 'authentication' as const
      };
    }
    
    // Only show detailed error recovery if enabled in settings
    if (flowConfig.enableErrorRecovery) {
      // Set error state for OAuthErrorHelper display
      setCurrentError({
        ...interpretedError,
        originalError: error,
        context: context
      });
      setShowErrorHelper(true);
    }
    
    // Always show basic error in centralized message system
    showFlowError(`${interpretedError.title}: ${interpretedError.message}`);
  }, []);

  const dismissError = useCallback(() => {
    setCurrentError(null);
    setShowErrorHelper(false);
  }, []);

  const retryAfterError = useCallback(() => {
    dismissError();
    // Reset to appropriate step based on error context
    if (currentError?.context === 'token-exchange') {
      stepManager.setStep(3, 'retry after error');
    } else if (currentError?.context === 'authorization') {
      stepManager.setStep(2, 'retry after error');
    } else {
      stepManager.setStep(0, 'retry after error');
    }
  }, [currentError, stepManager, dismissError]);

  // Popup authorization handler (V2 feature)
  const handlePopupAuthorization = useCallback(() => {
    if (!authUrl) {
      showFlowError('❌ Please generate authorization URL first');
      return;
    }

    setIsAuthorizing(true);
    console.log('🔧 [OIDC-V3] Opening popup with URL:', authUrl);
    
    const popup = window.open(authUrl, 'oauth-popup', 'width=600,height=700');
    if (popup) {
      console.log('✅ [OIDC-V3] Popup opened successfully');
      
      // Listen for messages from the popup
      const messageHandler = (event: MessageEvent) => {
        console.log('📨 [OIDC-V3] Message received from popup:', {
          origin: event.origin,
          expectedOrigin: window.location.origin,
          data: event.data
        });
        
        if (event.origin !== window.location.origin) {
          console.log('❌ [OIDC-V3] Message origin mismatch, ignoring');
          return;
        }
        
        if (event.data.type === 'oauth-callback') {
          const { code: callbackCode, state: callbackState, error, error_description } = event.data;
          
          if (error) {
            console.error('❌ [OIDC-V3] Authorization error received:', error);
            showFlowError(`❌ Authorization failed: ${error_description || error}`);
            setIsAuthorizing(false);
          } else if (callbackCode && callbackState) {
            setAuthCode(callbackCode);
            console.log('✅ [OIDC-V3] Authorization code received via popup:', callbackCode.substring(0, 10) + '...');
            
            // Authorization completed - close popup and cleanup
            popup.close();
            window.removeEventListener('message', messageHandler);
            setIsAuthorizing(false);
            setShowAuthSuccessModal(true);
            
            // Show centralized success message
            showFlowSuccess('🎉 Authorization Successful! You have been authenticated with PingOne and can now exchange tokens.');
            
            // Auto-advance to token exchange step
            stepManager.setStep(3, 'authorization completed');
          }
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Check if popup was closed without completing auth
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          setIsAuthorizing(false);
          
          if (!authCode) {
            console.warn('⚠️ [OIDC-V3] Popup closed without authorization code');
            showFlowError('⚠️ Popup closed without authorization code');
          }
        }
      }, 1000);
    } else {
      console.error('❌ [OIDC-V3] Failed to open popup window');
      showFlowError('❌ Failed to open popup window. Please check your browser settings.');
      setIsAuthorizing(false);
    }
  }, [authUrl, stepManager]);

  // Full redirect authorization handler (V2 feature)
  const handleFullRedirectAuthorization = useCallback(() => {
    if (!authUrl) {
      showFlowError('❌ Please generate authorization URL first');
      return;
    }

    console.log('🔧 [OIDC-V3] Redirecting to authorization URL:', authUrl);
    
    // Store current flow state before redirect
    sessionStorage.setItem('oidc-v3-flow-state', JSON.stringify({
      credentials,
      pkceCodes,
      flowConfig,
      step: 3, // Return to token exchange step
      timestamp: Date.now()
    }));
    
    // Redirect to authorization server
    window.location.href = authUrl;
  }, [authUrl, credentials, pkceCodes, flowConfig]);

  // Create steps using reusable components with dynamic canExecute and step tracking
  const steps = React.useMemo(() => [
    {
      ...createCredentialsStep(credentials, setCredentials, async () => {
        await saveCredentials();
        saveStepResult('setup-credentials', { credentials, timestamp: Date.now() });
      }, 'OIDC Authorization Code Flow'),
      canExecute: Boolean(
        credentials.environmentId &&
        credentials.clientId &&
        credentials.clientSecret &&
        credentials.redirectUri
      ),
      completed: hasStepResult('setup-credentials')
    },
    {
      ...createPKCEStep(pkceCodes, setPkceCodes, async () => {
        await generatePKCE();
        saveStepResult('generate-pkce', { pkceCodes, timestamp: Date.now() });
      }),
      canExecute: Boolean(credentials.environmentId && credentials.clientId),
      completed: hasStepResult('generate-pkce')
    },
    {
      ...createAuthUrlStep(authUrl, generateAuthUrl, credentials, pkceCodes, handlePopupAuthorization, handleFullRedirectAuthorization, isAuthorizing),
      canExecute: Boolean(
        credentials.environmentId &&
        credentials.clientId &&
        credentials.redirectUri &&
        pkceCodes.codeVerifier &&
        pkceCodes.codeChallenge
      ),
      completed: hasStepResult('build-auth-url')
    },
    {
      ...createTokenExchangeStep(authCode, tokens, async () => {
        await exchangeTokens();
        saveStepResult('exchange-tokens', { tokens, authCode, timestamp: Date.now() });
      }, credentials, isExchangingTokens),
      canExecute: Boolean(authCode && credentials.environmentId && credentials.clientId),
      completed: hasStepResult('exchange-tokens')
    },
    {
      ...createUserInfoStep(tokens, userInfo, async () => {
        await getUserInfo();
        saveStepResult('get-user-info', { userInfo, timestamp: Date.now() });
      }, isGettingUserInfo),
      canExecute: Boolean(tokens?.access_token),
      completed: hasStepResult('get-user-info')
    }
  ], [
    credentials, 
    pkceCodes, 
    authUrl, 
    authCode, 
    tokens, 
    userInfo, 
    isExchangingTokens, 
    isGettingUserInfo, 
    isAuthorizing,
    handlePopupAuthorization,
    handleFullRedirectAuthorization,
    saveCredentials,
    generatePKCE,
    generateAuthUrl,
    exchangeTokens,
    getUserInfo,
    saveStepResult,
    hasStepResult
  ]);

  return (
    <>
      <CentralizedSuccessMessage position="top" />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Flow Configuration Panel - V2 Feature Integration */}
        <div style={{ marginBottom: '2rem' }}>
          <FlowConfiguration
            config={flowConfig}
            onConfigChange={setFlowConfig}
            flowType="oidc-authorization-code"
            title="🔧 Advanced Flow Configuration"
            subtitle="Configure advanced OIDC parameters, client authentication, and custom options"
          />
        </div>

        {/* Security Warning Panel - V2 Feature */}
        {flowConfig.clientAuthMethod && (() => {
          const securityInfo = getAuthMethodSecurityLevel(flowConfig.clientAuthMethod);
          const isLowSecurity = securityInfo.level === 'Low' || securityInfo.level === 'Medium';
          
          return (
            <div style={{ 
              marginBottom: '2rem',
              padding: '1rem',
              borderRadius: '8px',
              border: `2px solid ${isLowSecurity ? '#f59e0b' : '#10b981'}`,
              backgroundColor: isLowSecurity ? '#fef3c7' : '#d1fae5'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: isLowSecurity ? '#92400e' : '#065f46'
              }}>
                <span style={{ fontSize: '1.2em' }}>{securityInfo.icon}</span>
                Security Level: {securityInfo.level}
              </div>
              <div style={{ 
                color: isLowSecurity ? '#92400e' : '#065f46',
                fontSize: '0.9em'
              }}>
                {securityInfo.description}
              </div>
              {isLowSecurity && (
                <div style={{ 
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: '#fed7aa',
                  borderRadius: '4px',
                  fontSize: '0.85em',
                  color: '#9a3412'
                }}>
                  ⚠️ <strong>Security Recommendation:</strong> Consider using 'client_secret_jwt' or 'private_key_jwt' for production environments.
                </div>
              )}
            </div>
          );
        })()}

        {/* Callback URL Display - V2 Feature */}
        <div style={{ marginBottom: '2rem' }}>
          <CallbackUrlDisplay 
            flowType="authorization-code"
            baseUrl={window.location.origin}
            defaultExpanded={false}
          />
        </div>

        {/* Reset and Clear Functionality - V2 Features */}
        <div style={{ 
          marginBottom: '2rem', 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'flex-end',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setShowClearCredentialsModal(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            🧹 Clear Credentials
          </button>
          <button
            onClick={() => setShowResetModal(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            🔄 Reset Flow
          </button>
        </div>

        <EnhancedStepFlowV2
          key={`oidc-authz-${stepManager.currentStepIndex}-${authCode ? 'with-code' : 'no-code'}`}
          steps={steps}
          title="🔑 OIDC Authorization Code Flow (V3 - Clean)"
          persistKey="oidc-authz-v3"
          autoAdvance={false}
          showDebugInfo={true}
          allowStepJumping={true}
          initialStepIndex={stepManager.currentStepIndex}
          onStepChange={(stepIndex) => {
            console.log('🔔 [OIDC-V3] Step changed to:', stepIndex);
            stepManager.setStep(stepIndex, 'user navigation');
          }}
          onStepComplete={(stepId, result) => {
            console.log('✅ [OIDC-V3] Step completed:', stepId, result);
          }}
        />
      </div>
      
      <CentralizedSuccessMessage position="bottom" />

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginTop: 0, color: '#ef4444' }}>🔄 Reset Flow</h3>
            <p>Are you sure you want to reset the entire flow? This will:</p>
            <ul>
              <li>Clear all step progress and results</li>
              <li>Remove authorization codes and tokens</li>
              <li>Reset to step 1</li>
              <li>Keep your saved credentials</li>
            </ul>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                onClick={() => setShowResetModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Reset Flow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Credentials Confirmation Modal */}
      {showClearCredentialsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginTop: 0, color: '#f59e0b' }}>🧹 Clear Credentials</h3>
            <p>Are you sure you want to clear all saved credentials? This will:</p>
            <ul>
              <li>Remove Environment ID, Client ID, and Client Secret</li>
              <li>Clear redirect URI and scopes</li>
              <li>Require re-entering credentials for future use</li>
            </ul>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                onClick={() => setShowClearCredentialsModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearCredentials}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Clear Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OAuthErrorHelper - V2 Feature */}
      {showErrorHelper && currentError && flowConfig.enableErrorRecovery && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <OAuthErrorHelper
              error={currentError.originalError?.error || 'oauth_error'}
              errorDescription={currentError.message}
              correlationId={currentError.originalError?.correlation_id}
              onRetry={retryAfterError}
              onGoToConfig={() => {
                dismissError();
                window.location.href = '/configuration';
              }}
              onDismiss={dismissError}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedAuthorizationCodeFlowV3;
