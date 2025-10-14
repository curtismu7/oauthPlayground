// src/hooks/useOAuth2CompliantImplicitFlow.ts
/**
 * RFC 6749 Compliant OAuth 2.0 Implicit Flow Hook
 * 
 * This hook provides a fully RFC 6749 Section 4.2 compliant implementation of the
 * OAuth 2.0 Implicit Flow with proper fragment-based token handling, security
 * validations, and CSRF protection.
 * 
 * Key Features:
 * - RFC 6749 Section 4.2 compliant parameter validation
 * - Fragment-based token response handling
 * - Cryptographically secure state generation
 * - Proper token validation and lifetime checking
 * - Security warnings and recommendations
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  implicitFlowComplianceService, 
  type ImplicitFlowAuthorizationRequest,
  type ImplicitFlowTokenResponse,
  type ImplicitTokenValidationResult
} from '../services/implicitFlowComplianceService';
import { v4ToastManager } from '../utils/v4ToastMessages';

export interface ImplicitFlowCredentials {
  environmentId: string;
  clientId: string;
  redirectUri: string;
  scope?: string;
  authorizationEndpoint?: string;
}

export interface ImplicitFlowState {
  // Step 1: Configuration
  credentials: ImplicitFlowCredentials;
  isConfigValid: boolean;
  configErrors: string[];
  
  // Step 2: Authorization URL Generation
  authorizationUrl: string;
  state: string;
  isAuthUrlGenerated: boolean;
  
  // Step 3: Authorization & Token Response
  isAuthorizing: boolean;
  tokens: ImplicitFlowTokenResponse | null;
  tokenValidation: ImplicitTokenValidationResult | null;
  
  // General state
  currentStep: number;
  errors: Array<{ error: string; error_description?: string; state?: string }>;
  warnings: string[];
}

export interface ImplicitFlowActions {
  // Configuration
  setCredentials: (credentials: ImplicitFlowCredentials) => void;
  validateConfiguration: () => Promise<{ valid: boolean; errors: string[]; warnings?: string[] }>;
  
  // Authorization URL
  generateAuthorizationUrl: () => Promise<void>;
  
  // Token handling
  handleTokenResponse: () => Promise<void>;
  
  // Flow Control
  resetFlow: () => void;
  goToStep: (step: number) => void;
}

const initialState: ImplicitFlowState = {
  credentials: {
    environmentId: '',
    clientId: '',
    redirectUri: '',
    scope: 'openid profile email',
  },
  isConfigValid: false,
  configErrors: [],
  authorizationUrl: '',
  state: '',
  isAuthUrlGenerated: false,
  isAuthorizing: false,
  tokens: null,
  tokenValidation: null,
  currentStep: 1,
  errors: [],
  warnings: [],
};

export const useOAuth2CompliantImplicitFlow = (): [ImplicitFlowState, ImplicitFlowActions] => {
  const [state, setState] = useState<ImplicitFlowState>(initialState);
  const stateRef = useRef<string>('');

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
  const setCredentials = useCallback((credentials: ImplicitFlowCredentials) => {
    setState(prev => ({
      ...prev,
      credentials: {
        ...credentials,
        authorizationEndpoint: credentials.authorizationEndpoint || 
          `https://auth.pingone.com/${credentials.environmentId}/as/authorize`,
      },
      isConfigValid: false,
      configErrors: [],
    }));
  }, []);

  // Validate configuration
  const validateConfiguration = useCallback(async (): Promise<{ valid: boolean; errors: string[]; warnings?: string[] }> => {
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
      const redirectUriValidation = implicitFlowComplianceService.validateImplicitAuthorizationRequest({
        response_type: 'token',
        client_id: state.credentials.clientId,
        redirect_uri: state.credentials.redirectUri,
        scope: state.credentials.scope,
      });
      
      const redirectErrors = redirectUriValidation.errors.filter(error => 
        error.includes('redirect_uri')
      );
      errors.push(...redirectErrors);
      
      const redirectWarnings = redirectUriValidation.warnings?.filter(warning => 
        warning.includes('redirect_uri')
      ) || [];
      warnings.push(...redirectWarnings);
    }

    // Add implicit flow security warnings
    warnings.push('Implicit flow exposes tokens in URL fragment - consider authorization code flow for enhanced security');
    warnings.push('Implicit flow tokens cannot be refreshed - consider authorization code flow for long-lived access');

    const isValid = errors.length === 0;

    setState(prev => ({
      ...prev,
      isConfigValid: isValid,
      configErrors: errors,
      warnings,
    }));

    // Show validation results
    if (isValid) {
      v4ToastManager.showSuccess('Implicit flow configuration validated successfully');
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

  // Generate authorization URL
  const generateAuthorizationUrl = useCallback(async () => {
    try {
      clearMessages();

      if (!state.isConfigValid) {
        throw new Error('Configuration must be validated first');
      }

      // Generate secure state
      const secureState = implicitFlowComplianceService.generateSecureState();
      stateRef.current = secureState;

      // Build implicit flow authorization request
      const authRequest: ImplicitFlowAuthorizationRequest = {
        response_type: 'token',
        client_id: state.credentials.clientId,
        redirect_uri: state.credentials.redirectUri,
        scope: state.credentials.scope || 'openid profile email',
        state: secureState,
      };

      // Generate authorization URL
      const authorizationUrl = implicitFlowComplianceService.generateImplicitAuthorizationUrl(
        state.credentials.authorizationEndpoint!,
        authRequest
      );

      setState(prev => ({
        ...prev,
        authorizationUrl,
        state: secureState,
        isAuthUrlGenerated: true,
        currentStep: 2,
      }));

      // Store state for callback validation
      sessionStorage.setItem('implicit_state', secureState);

      v4ToastManager.showSuccess('Implicit flow authorization URL generated successfully');
      console.log('[ImplicitCompliantFlow] Authorization URL generated:', {
        url: authorizationUrl,
        state: secureState.substring(0, 10) + '...',
        responseType: authRequest.response_type,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate authorization URL';
      addError({ error: 'server_error', error_description: errorMessage });
      v4ToastManager.showError(errorMessage);
    }
  }, [state.isConfigValid, state.credentials, clearMessages, addError]);

  // Handle token response from fragment
  const handleTokenResponse = useCallback(async () => {
    try {
      clearMessages();

      // Get fragment from current URL
      const fragment = window.location.hash;
      if (!fragment) {
        throw new Error('No fragment found in URL - implicit flow requires fragment-based response');
      }

      // Parse fragment response
      const parseResult = implicitFlowComplianceService.parseFragmentResponse(fragment);
      if (!parseResult.valid) {
        throw new Error(`Fragment parsing failed: ${parseResult.errors.join(', ')}`);
      }

      const tokens = parseResult.tokens!;

      // Validate token response
      const expectedState = stateRef.current || sessionStorage.getItem('implicit_state');
      const tokenValidation = implicitFlowComplianceService.validateImplicitTokenResponse(
        tokens,
        expectedState || undefined,
        state.credentials.scope
      );

      // Show warnings
      parseResult.warnings?.forEach(warning => addWarning(warning));
      tokenValidation.warnings?.forEach(warning => addWarning(warning));

      if (!tokenValidation.valid) {
        throw new Error(`Token validation failed: ${tokenValidation.errors.join(', ')}`);
      }

      setState(prev => ({
        ...prev,
        tokens,
        tokenValidation,
        currentStep: 3,
      }));

      // Clear sensitive data from session storage
      sessionStorage.removeItem('implicit_state');

      // Clean up URL fragment
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);

      v4ToastManager.showSuccess('Implicit flow tokens received and validated successfully');
      console.log('[ImplicitCompliantFlow] Token response processed:', {
        hasAccessToken: !!tokens.access_token,
        hasIdToken: !!tokens.id_token,
        tokenType: tokens.token_type,
        expiresIn: tokens.expires_in,
        scope: tokens.scope,
        validationPassed: tokenValidation.valid,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token response processing failed';
      addError({ error: 'server_error', error_description: errorMessage });
      v4ToastManager.showError(errorMessage);
    }
  }, [state.credentials, clearMessages, addError, addWarning]);

  // Reset flow
  const resetFlow = useCallback(() => {
    setState(initialState);
    stateRef.current = '';
    sessionStorage.removeItem('implicit_state');
    
    // Clean up URL fragment
    if (window.location.hash) {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
    
    v4ToastManager.showInfo('Implicit flow reset successfully');
  }, []);

  // Go to specific step
  const goToStep = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(1, Math.min(3, step)),
    }));
  }, []);

  // Auto-detect token response on mount
  useEffect(() => {
    const fragment = window.location.hash;
    if (fragment) {
      // Check if this is an error response
      const params = new URLSearchParams(fragment.substring(1));
      const error = params.get('error');
      const errorDescription = params.get('error_description');
      const receivedState = params.get('state');

      if (error) {
        addError({
          error: error as any,
          error_description: errorDescription || undefined,
          state: receivedState || undefined
        });
        v4ToastManager.showError(`Authorization error: ${error}`);
      } else if (params.get('access_token') || params.get('id_token')) {
        // Auto-process token response
        handleTokenResponse();
      }
    }
  }, [addError, handleTokenResponse]);

  const actions: ImplicitFlowActions = {
    setCredentials,
    validateConfiguration,
    generateAuthorizationUrl,
    handleTokenResponse,
    resetFlow,
    goToStep,
  };

  return [state, actions];
};