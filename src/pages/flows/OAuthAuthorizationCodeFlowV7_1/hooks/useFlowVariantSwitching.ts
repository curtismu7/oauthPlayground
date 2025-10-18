// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/hooks/useFlowVariantSwitching.ts
// V7.1 Flow Variant Switching - Centralized OAuth/OIDC variant management

import { useCallback, useState, useEffect } from 'react';
import { FLOW_CONSTANTS } from '../constants/flowConstants';
import type { FlowVariant, FlowCredentials } from '../types/flowTypes';

// Mock services - these would be imported from actual services in real implementation
const FlowCredentialService = {
  loadSharedCredentials: async (key: string): Promise<Partial<FlowCredentials> | null> => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
  saveSharedCredentials: async (key: string, credentials: FlowCredentials): Promise<void> => {
    try {
      sessionStorage.setItem(key, JSON.stringify(credentials));
    } catch (error) {
      console.warn('Failed to save credentials:', error);
    }
  }
};

const v4ToastManager = {
  showSuccess: (message: string) => {
    console.log('✅ Toast:', message);
  },
  showError: (message: string) => {
    console.error('❌ Toast:', message);
  }
};

export const useFlowVariantSwitching = (
  currentCredentials: FlowCredentials,
  onCredentialsChange: (credentials: FlowCredentials) => void,
  onPkceCodesChange?: (codes: any) => void
) => {
  const [flowVariant, setFlowVariant] = useState<FlowVariant>(FLOW_CONSTANTS.DEFAULT_FLOW_VARIANT);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  // Switch flow variant
  const switchVariant = useCallback(async (newVariant: FlowVariant) => {
    if (newVariant === flowVariant) {
      return; // No change needed
    }

    setIsSwitching(true);
    setSwitchError(null);

    try {
      console.log(`🔄 Switching from ${flowVariant.toUpperCase()} to ${newVariant.toUpperCase()}`);

      // Preserve current PKCE codes if switching
      const currentPkceCodes = {
        codeVerifier: sessionStorage.getItem('oauth-authorization-code-v7-pkce-codes') || '',
        codeChallenge: sessionStorage.getItem('oauth-authorization-code-v7-pkce-codes') || '',
      };

      // Update the variant
      setFlowVariant(newVariant);

      // Load variant-specific credentials
      const credentialKey = `oauth-authorization-code-v7-${newVariant}`;
      const reloadedCredentials = await FlowCredentialService.loadSharedCredentials(credentialKey);

      if (reloadedCredentials && Object.keys(reloadedCredentials).length > 0) {
        const updatedCredentials = {
          ...currentCredentials,
          ...reloadedCredentials,
        };
        onCredentialsChange(updatedCredentials);
        console.log('📥 Loaded variant-specific credentials:', credentialKey);
      } else {
        console.log('📝 No variant-specific credentials found, using current credentials');
      }

      // Preserve PKCE codes during variant switch
      if (currentPkceCodes.codeVerifier && currentPkceCodes.codeChallenge && onPkceCodesChange) {
        onPkceCodesChange(currentPkceCodes);
        console.log('🔐 Preserved PKCE codes during variant switch');
      }

      // Update scope based on variant
      const updatedCredentials = { ...currentCredentials };
      if (newVariant === 'oidc') {
        // OIDC requires openid scope
        if (!updatedCredentials.scope.includes('openid')) {
          updatedCredentials.scope = updatedCredentials.scope 
            ? `${updatedCredentials.scope} openid`
            : 'openid';
        }
      } else if (newVariant === 'oauth') {
        // OAuth can work without openid scope, but PingOne requires it
        if (!updatedCredentials.scope.includes('openid')) {
          updatedCredentials.scope = updatedCredentials.scope 
            ? `${updatedCredentials.scope} openid`
            : 'openid';
        }
      }

      onCredentialsChange(updatedCredentials);

      // Show success message
      v4ToastManager.showSuccess(`Switched to ${newVariant.toUpperCase()} variant`);

      console.log(`✅ Successfully switched to ${newVariant.toUpperCase()} variant`);

    } catch (error) {
      const errorMessage = `Failed to switch to ${newVariant} variant: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌ Variant switch error:', errorMessage);
      setSwitchError(errorMessage);
      v4ToastManager.showError(errorMessage);
    } finally {
      setIsSwitching(false);
    }
  }, [flowVariant, currentCredentials, onCredentialsChange, onPkceCodesChange]);

  // Get variant-specific configuration
  const getVariantConfig = useCallback((variant: FlowVariant) => {
    const configs = {
      oauth: {
        name: 'OAuth 2.0',
        description: 'Access token only - API authorization',
        responseType: 'code',
        requiredScopes: ['openid'], // PingOne requires openid
        optionalScopes: ['profile', 'email'],
        icon: '🔑',
        color: '#16a34a',
      },
      oidc: {
        name: 'OpenID Connect',
        description: 'ID token + Access token - Authentication + Authorization',
        responseType: 'code id_token',
        requiredScopes: ['openid'],
        optionalScopes: ['profile', 'email'],
        icon: '🆔',
        color: '#3b82f6',
      },
    };

    return configs[variant];
  }, []);

  // Get current variant configuration
  const currentVariantConfig = useMemo(() => getVariantConfig(flowVariant), [flowVariant, getVariantConfig]);

  // Validate variant compatibility
  const validateVariantCompatibility = useCallback((variant: FlowVariant, credentials: FlowCredentials) => {
    const config = getVariantConfig(variant);
    const errors: string[] = [];

    // Check required scopes
    if (config.requiredScopes.length > 0) {
      const missingScopes = config.requiredScopes.filter(scope => 
        !credentials.scope.includes(scope)
      );
      if (missingScopes.length > 0) {
        errors.push(`Missing required scopes: ${missingScopes.join(', ')}`);
      }
    }

    // Check client configuration
    if (!credentials.clientId) {
      errors.push('Client ID is required');
    }

    if (!credentials.redirectUri) {
      errors.push('Redirect URI is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [getVariantConfig]);

  // Get variant-specific response type
  const getVariantResponseType = useCallback((variant: FlowVariant) => {
    return getVariantConfig(variant).responseType;
  }, [getVariantConfig]);

  // Get variant-specific scopes
  const getVariantScopes = useCallback((variant: FlowVariant) => {
    const config = getVariantConfig(variant);
    return {
      required: config.requiredScopes,
      optional: config.optionalScopes,
      all: [...config.requiredScopes, ...config.optionalScopes],
    };
  }, [getVariantConfig]);

  // Auto-switch variant based on credentials
  const autoSwitchVariant = useCallback((credentials: FlowCredentials) => {
    const hasOpenIdScope = credentials.scope.includes('openid');
    const hasProfileScope = credentials.scope.includes('profile');
    const hasEmailScope = credentials.scope.includes('email');

    // If only openid scope, prefer OIDC
    if (hasOpenIdScope && !hasProfileScope && !hasEmailScope) {
      if (flowVariant !== 'oidc') {
        switchVariant('oidc');
      }
    }
    // If multiple scopes, prefer OIDC for better user experience
    else if (hasOpenIdScope && (hasProfileScope || hasEmailScope)) {
      if (flowVariant !== 'oidc') {
        switchVariant('oidc');
      }
    }
    // If no openid scope, switch to OAuth (though PingOne requires openid)
    else if (!hasOpenIdScope) {
      if (flowVariant !== 'oauth') {
        switchVariant('oauth');
      }
    }
  }, [flowVariant, switchVariant]);

  // Initialize variant from stored state
  useEffect(() => {
    const storedVariant = sessionStorage.getItem('oauth-authorization-code-v7-variant') as FlowVariant;
    if (storedVariant && (storedVariant === 'oauth' || storedVariant === 'oidc')) {
      setFlowVariant(storedVariant);
    }
  }, []);

  // Save variant to storage
  useEffect(() => {
    try {
      sessionStorage.setItem('oauth-authorization-code-v7-variant', flowVariant);
    } catch (error) {
      console.warn('Failed to save variant to storage:', error);
    }
  }, [flowVariant]);

  return {
    // State
    flowVariant,
    isSwitching,
    switchError,
    currentVariantConfig,
    
    // Actions
    switchVariant,
    autoSwitchVariant,
    
    // Utilities
    getVariantConfig,
    validateVariantCompatibility,
    getVariantResponseType,
    getVariantScopes,
  };
};

export default useFlowVariantSwitching;
