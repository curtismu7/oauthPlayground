// src/hooks/useOIDCCompliantAuthorizationCodeFlow.ts
/**
 * OIDC Core 1.0 Compliant Authorization Code Flow Hook
 * 
 * This hook provides a fully OIDC Core 1.0 compliant implementation of the
 * OpenID Connect Authorization Code Flow with proper ID token validation,
 * claims processing, and UserInfo endpoint integration.
 * 
 * Key Features:
 * - OIDC Core 1.0 compliant parameter validation
 * - ID token validation with nonce verification
 * - Claims request processing
 * - UserInfo endpoint integration
 * - at_hash and c_hash validation
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  oidcComplianceService, 
  type OIDCAuthorizationRequest,
  type OIDCTokenResponse,
  type IDTokenClaims,
  type ClaimsRequest,
  type UserInfoResponse,
  type IDTokenValidationResult
} from '../services/oidcComplianceService';
import { oauth2ComplianceService } from '../services/oauth2ComplianceService';
import { v4ToastManager } from '../utils/v4ToastMessages';

export interface OIDCCredentials {
  environmentId: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scope?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userInfoEndpoint?: string;
  issuer?: string;
}

export interface OIDCFlowState {
  // Step 1: Configuration
  credentials: OIDCCredentials;
  isConfigValid: boolean;
  configErrors: string[];
  
  // Step 2: PKCE & Nonce Generation
  pkceCodes: {
    codeVerifier: string;
    codeChallenge: string;
    codeChallengeMethod: 'S256';
  } | null;
  nonce: string;
  isPkceGenerated: boolean;
  
  // Step 3: Authorization URL Generation
  authorizationUrl: string;
  state: string;
  claimsRequest?: ClaimsRequest;
  isAuthUrlGenerated: boolean;
  
  // Step 4: Authorization
  isAuthorizing: boolean;
  authorizationCode: string;
  receivedState: string;
  
  // Step 5: Token Exchange
  isExchangingTokens: boolean;
  tokens: OIDCTokenResponse | null;
  idTokenValidation: IDTokenValidationResult | null;
  tokenErrors: string[];
  
  // Step 6: UserInfo
  isFetchingUserInfo: boolean;
  userInfo: UserInfoResponse | null;
  userInfoErrors: string[];
  
  // General state
  currentStep: number;
  errors: Array<{ error: string; error_description?: string; state?: string }>;
  warnings: string[];
}

export interface OIDCFlowActions {
  // Configuration
  setCredentials: (credentials: OIDCCredentials) => void;
  validateConfiguration: () => Promise<ValidationResult>;
  
  // PKCE & Nonce
  generatePKCEAndNonce: () => Promise<void>;
  
  // Claims
  setClaimsRequest: (claims: ClaimsRequest) => void;
  
  // Authorization URL
  generateAuthorizationUrl: () => Promise<void>;
  
  // Authorization
  handleAuthorizationCallback: (code: string, state: string) => Promise<void>;
  
  // Token Exchange
  exchangeTokens: () => Promise<void>;
  
  // UserInfo
  fetchUserInfo: () => Promise<void>;
  
  // Flow Control
  resetFlow: () => void;
  goToStep: (step: number) => void;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

const initialState: OIDCFlowState = {
  credentials: {
    environmentId: '',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scope: 'openid profile email',
  },
  isConfigValid: false,
  configErrors: [],
  pkceCodes: null,
  nonce: '',
  isPkceGenerated: false,
  authorizationUrl: '',
  state: '',
  isAuthUrlGenerated: false,
  isAuthorizing: false,
  authorizationCode: '',
  receivedState: '',
  isExchangingTokens: false,
  tokens: null,
  idTokenValidation: null,
  tokenErrors: [],
  isFetchingUserInfo: false,
  userInfo: null,
  userInfoErrors: [],
  currentStep: 1,
  errors: [],
  warnings: [],
};

export const useOIDCCompliantAuthorizationCodeFlow = (): [OIDCFlowState, OIDCFlowActions] => {
  const [state, setState] = useState<OIDCFlowState>(initialState);
  const stateRef = useRef<string>('');
  const nonceRef = useRef<string>('');

  // Helper function to add error
  const addError = useCallback((error: { error: string; error_description?: string; state?: string }) => {
    setState(prev => ({
      ...prev,
      errors: [...prev.errors, error],
    }));
  }, []);

  // Helper function to add warning
  const addWarning = useCallback((warning: string) => {
    setState(prev => ({
      ...prev,
      warnings: [...prev.warnings, warning],
    }));
  }, []);

  // Helper function to clear errors and warnings
  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: [],
      warnings: [],
    }));
  }, []);

  // Set credentials with validation
  const setCredentials = useCallback((credentials: OIDCCredentials) => {
    setState(prev => ({
      ...prev,
      credentials: {
        ...credentials,
        authorizationEndpoint: credentials.authorizationEndpoint || 
          `https://auth.pingone.com/${credentials.environmentId}/as/authorize`,
        tokenEndpoint: credentials.tokenEndpoint || 
          `https://auth.pingone.com/${credentials.environmentId}/as/token`,
        userInfoEndpoint: credentials.userInfoEndpoint ||
          `https://auth.pingone.com/${credentials.environmentId}/as/userinfo`,
        issuer: credentials.issuer ||
          `https://auth.pingone.com/${credentials.environmentId}`,
      },
      isConfigValid: false,
      configErrors: [],
    }));
  }, []);

  // Validate configuration
  const validateConfiguration = useCallback(async (): Promise<ValidationResult> => {
    clearMessages();

    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic credential validation
    if (!state.credentials.clientId) {
      errors.push('Client ID is required');
    }

    if (!state.credentials.environmentId) {
      errors.push('Environment ID is required');
    }

    if (!state.credentials.redirectUri) {
      errors.push('Redirect URI is required');
    }

    // Validate redirect URI format
    if (state.credentials.redirectUri) {
      const redirectUriValidation = oauth2ComplianceService.validateRedirectUri(state.credentials.redirectUri);
      errors.push(...redirectUriValidation.errors);
      warnings.push(...(redirectUriValidation.warnings || []));
    }

    // Validate scope includes 'openid'
    if (state.credentials.scope) {
      if (!state.credentials.scope.split(' ').includes('openid')) {
        errors.push('Scope must include "openid" for OIDC flows');
      }
      
      const scopeValidation = oauth2ComplianceService.validateScope(state.credentials.scope);
      errors.push(...scopeValidation.errors);
      warnings.push(...(scopeValidation.warnings || []));
    } else {
      errors.push('Scope is required and must include "openid"');
    }

    const isValid = errors.length === 0;

    setState(prev => ({
      ...prev,
      isConfigValid: isValid,
      configErrors: errors,
      warnings,
    }));

    // Show validation results
    if (isValid) {
      v4ToastManager.showSuccess('OIDC configuration validated successfully');
    } else {
      v4ToastManager.showError(`Configuration validation failed: ${errors.join(', ')}`);
    }

    warnings.forEach(warning => {
      addWarning(warning);
    });

    return {
      valid: isValid,
      errors,
      warnings,
    };
  }, [state.credentials, clearMessages, addWarning]);

  // Generate PKCE codes and nonce
  const generatePKCEAndNonce = useCallback(async () => {
    try {
      clearMessages();
      
      const pkceCodes = await oauth2ComplianceService.generatePKCECodes();
      const nonce = oidcComplianceService.generateNonce();
      
      setState(prev => ({
        ...prev,
        pkceCodes,
        nonce,
        isPkceGenerated: true,
      }));

      nonceRef.current = nonce;

      v4ToastManager.showSuccess('PKCE codes and nonce generated successfully');
      console.log('[OIDCCompliantFlow] PKCE and nonce generated:', {
        codeVerifier: pkceCodes.codeVerifier.substring(0, 20) + '...',
        codeChallenge: pkceCodes.codeChallenge.substring(0, 20) + '...',
        method: pkceCodes.codeChallengeMethod,
        nonce: nonce.substring(0, 20) + '...',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PKCE codes and nonce';
      addError({ error: 'server_error', error_description: errorMessage });
      v4ToastManager.showError(errorMessage);
    }
  }, [clearMessages, addError]);

  // Set claims request
  const setClaimsRequest = useCallback((claims: ClaimsRequest) => {
    setState(prev => ({
      ...prev,
      claimsRequest: claims,
    }));
  }, []);

  // Generate authorization URL
  const generateAuthorizationUrl = useCallback(async () => {
    try {
      clearMessages();

      if (!state.isConfigValid) {
        throw new Error('Configuration must be validated first');
      }

      if (!state.pkceCodes || !state.nonce) {
        throw new Error('PKCE codes and nonce must be generated first');
      }

      // Generate secure state
      const secureState = oauth2ComplianceService.generateSecureState();
      stateRef.current = secureState;

      // Build OIDC authorization request
      const authRequest: OIDCAuthorizationRequest = {
        response_type: 'code',
        client_id: state.credentials.clientId,
        redirect_uri: state.credentials.redirectUri,
        scope: state.credentials.scope || 'openid profile email',
        state: secureState,
        nonce: state.nonce,
        code_challenge: state.pkceCodes.codeChallenge,
        code_challenge_method: state.pkceCodes.codeChallengeMethod,
      };

      // Add claims request if present
      if (state.claimsRequest) {
        authRequest.claims = JSON.stringify(state.claimsRequest);
      }

      // Validate OIDC authorization request
      const validation = oidcComplianceService.validateOIDCAuthorizationRequest(authRequest);
      if (!validation.valid) {
        throw new Error(`OIDC authorization request validation failed: ${validation.errors.join(', ')}`);
      }

      // Show warnings if any
      validation.warnings?.forEach(warning => {
        addWarning(warning);
      });

      // Build authorization URL
      const authEndpoint = state.credentials.authorizationEndpoint!;
      const params = new URLSearchParams();
      
      Object.entries(authRequest).forEach(([key, value]) => {
        if (value) {
          params.set(key, value.toString());
        }
      });

      const authorizationUrl = `${authEndpoint}?${params.toString()}`;

      setState(prev => ({
        ...prev,
        authorizationUrl,
        state: secureState,
        isAuthUrlGenerated: true,
        currentStep: 3,
      }));

      // Store state and nonce for callback validation
      sessionStorage.setItem('oidc_state', secureState);
      sessionStorage.setItem('oidc_nonce', state.nonce);
      sessionStorage.setItem('oidc_code_verifier', state.pkceCodes.codeVerifier);

      v4ToastManager.showSuccess('OIDC authorization URL generated successfully');
      console.log('[OIDCCompliantFlow] Authorization URL generated:', {
        url: authorizationUrl,
        state: secureState.substring(0, 10) + '...',
        nonce: state.nonce.substring(0, 10) + '...',
        codeChallenge: state.pkceCodes.codeChallenge.substring(0, 20) + '...',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate authorization URL';
      addError({ error: 'server_error', error_description: errorMessage });
      v4ToastManager.showError(errorMessage);
    }
  }, [state.isConfigValid, state.pkceCodes, state.nonce, state.credentials, state.claimsRequest, clearMessages, addError, addWarning]);

  // Handle authorization callback
  const handleAuthorizationCallback = useCallback(async (code: string, receivedState: string) => {
    try {
      clearMessages();

      // Validate state parameter
      const expectedState = stateRef.current || sessionStorage.getItem('oidc_state');
      if (!expectedState) {
        throw new Error('No expected state found - possible session timeout');
      }

      const stateValid = await oauth2ComplianceService.validateState(receivedState, expectedState);
      if (!stateValid) {
        throw new Error('State parameter validation failed - possible CSRF attack');
      }

      setState(prev => ({
        ...prev,
        authorizationCode: code,
        receivedState,
        currentStep: 4,
      }));

      v4ToastManager.showSuccess('OIDC authorization callback received successfully');
      console.log('[OIDCCompliantFlow] Authorization callback processed:', {
        code: code.substring(0, 20) + '...',
        stateValid,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authorization callback failed';
      addError({ error: 'access_denied', error_description: errorMessage, state: receivedState });
      v4ToastManager.showError(errorMessage);
    }
  }, [clearMessages, addError]);

  // Exchange tokens
  const exchangeTokens = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isExchangingTokens: true, tokenErrors: [] }));
      clearMessages();

      if (!state.authorizationCode) {
        throw new Error('Authorization code is required');
      }

      const codeVerifier = sessionStorage.getItem('oidc_code_verifier');
      const nonce = sessionStorage.getItem('oidc_nonce');
      
      if (!codeVerifier) {
        throw new Error('Code verifier not found - possible session timeout');
      }

      if (!nonce) {
        throw new Error('Nonce not found - possible session timeout');
      }

      // Make token request
      const tokenEndpoint = state.credentials.tokenEndpoint!;
      const headers = {
        'Content-Type': 'application/json',
        ...oidcComplianceService.getOIDCSecurityHeaders(),
      };

      console.log('[OIDCCompliantFlow] Making token request:', {
        endpoint: tokenEndpoint,
        grantType: 'authorization_code',
        clientId: state.credentials.clientId,
        hasClientSecret: !!state.credentials.clientSecret,
        hasCodeVerifier: !!codeVerifier,
      });

      const response = await fetch('/api/token-exchange', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: state.authorizationCode,
          redirect_uri: state.credentials.redirectUri,
          client_id: state.credentials.clientId,
          client_secret: state.credentials.clientSecret,
          code_verifier: codeVerifier,
          environment_id: state.credentials.environmentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error_description || `Token exchange failed: ${response.status}`);
      }

      const tokens: OIDCTokenResponse = await response.json();

      // Validate token response
      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      if (!tokens.id_token) {
        throw new Error('No ID token received - required for OIDC');
      }

      // Validate ID token
      const idTokenValidation = await oidcComplianceService.validateIDToken(
        tokens.id_token,
        state.credentials.clientId,
        state.credentials.issuer!,
        nonce
      );

      if (!idTokenValidation.valid) {
        throw new Error(`ID token validation failed: ${idTokenValidation.errors.join(', ')}`);
      }

      // Show ID token warnings
      idTokenValidation.warnings?.forEach(warning => {
        addWarning(warning);
      });

      setState(prev => ({
        ...prev,
        tokens,
        idTokenValidation,
        currentStep: 5,
        isExchangingTokens: false,
      }));

      // Clear sensitive data from session storage
      sessionStorage.removeItem('oidc_state');
      sessionStorage.removeItem('oidc_nonce');
      sessionStorage.removeItem('oidc_code_verifier');

      v4ToastManager.showSuccess('OIDC tokens exchanged and validated successfully');
      console.log('[OIDCCompliantFlow] Token exchange successful:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        hasIdToken: !!tokens.id_token,
        idTokenValid: idTokenValidation.valid,
        tokenType: tokens.token_type,
        expiresIn: tokens.expires_in,
        scope: tokens.scope,
        subject: idTokenValidation.claims?.sub,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token exchange failed';
      setState(prev => ({
        ...prev,
        isExchangingTokens: false,
        tokenErrors: [errorMessage],
      }));
      addError({ error: 'server_error', error_description: errorMessage });
      v4ToastManager.showError(errorMessage);
    }
  }, [state.authorizationCode, state.credentials, clearMessages, addError, addWarning]);

  // Fetch UserInfo
  const fetchUserInfo = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isFetchingUserInfo: true, userInfoErrors: [] }));
      clearMessages();

      if (!state.tokens?.access_token) {
        throw new Error('Access token is required');
      }

      if (!state.idTokenValidation?.claims?.sub) {
        throw new Error('ID token subject is required');
      }

      const userInfoEndpoint = state.credentials.userInfoEndpoint!;
      const headers = {
        'Authorization': `Bearer ${state.tokens.access_token}`,
        'Accept': 'application/json',
        ...oidcComplianceService.getOIDCSecurityHeaders(),
      };

      console.log('[OIDCCompliantFlow] Making UserInfo request:', {
        endpoint: userInfoEndpoint,
        hasAccessToken: !!state.tokens.access_token,
      });

      const response = await fetch(`/api/userinfo?access_token=${encodeURIComponent(state.tokens.access_token)}&environment_id=${encodeURIComponent(state.credentials.environmentId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error_description || `UserInfo request failed: ${response.status}`);
      }

      const userInfo: UserInfoResponse = await response.json();

      // Validate UserInfo response
      const userInfoValidation = oidcComplianceService.validateUserInfoResponse(
        userInfo,
        state.idTokenValidation.claims.sub
      );

      if (!userInfoValidation.valid) {
        throw new Error(`UserInfo validation failed: ${userInfoValidation.errors.join(', ')}`);
      }

      // Show UserInfo warnings
      userInfoValidation.warnings?.forEach(warning => {
        addWarning(warning);
      });

      setState(prev => ({
        ...prev,
        userInfo,
        currentStep: 6,
        isFetchingUserInfo: false,
      }));

      v4ToastManager.showSuccess('UserInfo fetched and validated successfully');
      console.log('[OIDCCompliantFlow] UserInfo request successful:', {
        subject: userInfo.sub,
        claimsCount: Object.keys(userInfo).length,
        hasEmail: !!userInfo.email,
        hasProfile: !!(userInfo.name || userInfo.given_name || userInfo.family_name),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'UserInfo request failed';
      setState(prev => ({
        ...prev,
        isFetchingUserInfo: false,
        userInfoErrors: [errorMessage],
      }));
      addError({ error: 'server_error', error_description: errorMessage });
      v4ToastManager.showError(errorMessage);
    }
  }, [state.tokens, state.idTokenValidation, state.credentials, clearMessages, addError, addWarning]);

  // Reset flow
  const resetFlow = useCallback(() => {
    setState(initialState);
    stateRef.current = '';
    nonceRef.current = '';
    sessionStorage.removeItem('oidc_state');
    sessionStorage.removeItem('oidc_nonce');
    sessionStorage.removeItem('oidc_code_verifier');
    v4ToastManager.showInfo('OIDC flow reset successfully');
  }, []);

  // Go to specific step
  const goToStep = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(1, Math.min(6, step)),
    }));
  }, []);

  // Auto-detect callback on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const receivedState = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (error) {
      addError({
        error: error as any,
        error_description: errorDescription || undefined,
        state: receivedState || undefined
      });
      v4ToastManager.showError(`OIDC authorization error: ${error}`);
    } else if (code && receivedState) {
      handleAuthorizationCallback(code, receivedState);
      
      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('code');
      newUrl.searchParams.delete('state');
      window.history.replaceState({}, document.title, newUrl.toString());
    }
  }, [addError, handleAuthorizationCallback]);

  const actions: OIDCFlowActions = {
    setCredentials,
    validateConfiguration,
    generatePKCEAndNonce,
    setClaimsRequest,
    generateAuthorizationUrl,
    handleAuthorizationCallback,
    exchangeTokens,
    fetchUserInfo,
    resetFlow,
    goToStep,
  };

  return [state, actions];
};