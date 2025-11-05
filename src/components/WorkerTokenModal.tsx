// src/components/WorkerTokenModal.tsx
// Modal for configuring worker token when not available

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiKey, FiExternalLink, FiInfo, FiAlertTriangle, FiEye, FiEyeOff, FiRefreshCw, FiSave } from 'react-icons/fi';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { showTokenSuccessMessage } from '../services/tokenExpirationService';
import { DraggableModal } from './DraggableModal';
import { WorkerTokenRequestModal } from './WorkerTokenRequestModal';


const InfoBox = styled.div<{ $variant: 'info' | 'warning' }>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.625rem;
  border-radius: 0.375rem;
  background: ${({ $variant }) => 
    $variant === 'warning' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(59, 130, 246, 0.1)'
  };
  border: 1px solid ${({ $variant }) => 
    $variant === 'warning' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(59, 130, 246, 0.3)'
  };
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoTitle = styled.div`
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
`;

const InfoText = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.4;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  background: ${({ $variant }) => 
    $variant === 'secondary' ? '#e5e7eb' : 
    $variant === 'success' ? '#10b981' : 
    '#2563eb'};
  color: ${({ $variant }) => ($variant === 'secondary' ? '#1f2937' : '#ffffff')};
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms ease;
  font-size: 0.8125rem;
  text-decoration: none;

  &:hover {
    background: ${({ $variant }) => 
      $variant === 'secondary' ? '#d1d5db' : 
      $variant === 'success' ? '#059669' : 
      '#1e40af'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0.75rem 0;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const FormLabel = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.8125rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: #ffffff;
  transition: border-color 0.2s ease;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  option:disabled {
    color: #9ca3af;
  }
`;

const PasswordInput = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  
  input {
    width: 100%;
    padding-right: 2.5rem; /* Make room for the toggle button */
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: #374151;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const normalizeScopes = (scopes?: string) => {
	if (!scopes) return '';
	// Remove openid scope (not valid for worker tokens)
	return scopes
		.replace(/\bopenid\b/gi, '')
		.replace(/\bopneid\b/gi, '')
		.replace(/\s+/g, ' ')
		.trim();
};

const ensureRequiredScopes = (scopes?: string) => {
	const normalized = normalizeScopes(scopes);
	const parts = normalized.split(/\s+/).filter(Boolean);
	const scopeSet = new Set(parts);
	// Note: 'openid' is NOT valid for worker tokens (client_credentials grant)
	// Worker tokens only use management API scopes like p1:read:*, p1:write:*, etc.
	// Ensure at least one scope exists
	if (scopeSet.size === 0) {
		scopeSet.add('p1:read:user');
	}
	return Array.from(scopeSet).join(' ');
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  flowType?: string;
  environmentId?: string;
  skipCredentialsStep?: boolean; // If true, skip to token generation form directly
  prefillCredentials?: {
    environmentId?: string;
    clientId?: string;
    clientSecret?: string;
    region?: string;
    scopes?: string;
  }; // Pre-fill credentials when skipping step 1
  tokenStorageKey?: string; // Custom localStorage key for the token (default: 'worker_token')
  tokenExpiryKey?: string; // Custom localStorage key for token expiry (default: 'worker_token_expires_at')
}

export const WorkerTokenModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onContinue,
  flowType = 'flow',
  environmentId = '',
  skipCredentialsStep = false,
  prefillCredentials,
  tokenStorageKey = 'worker_token',
  tokenExpiryKey = 'worker_token_expires_at'
}) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const [showForm, setShowForm] = useState(skipCredentialsStep); // Start with form if skipping credentials
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [pendingRequestDetails, setPendingRequestDetails] = useState<{
    tokenEndpoint: string;
    requestParams: {
      grant_type: string;
      client_id: string;
      client_secret: string;
      scope?: string;
    };
    authMethod: string;
    region: string;
  } | null>(null);
  
  // Worker credentials state - ONLY use prefillCredentials or defaults (never localStorage)
  // Note: prefillCredentials are the current form values from the parent component
  const [workerCredentials, setWorkerCredentials] = useState(() => {
    // If prefillCredentials provided, use them (these are the CURRENT credentials)
    if (prefillCredentials) {
      console.log('[WorkerTokenModal] 🎯 Using prefillCredentials (CURRENT form values):', {
        environmentId: prefillCredentials.environmentId?.substring(0, 20) + '...',
        clientId: prefillCredentials.clientId?.substring(0, 20) + '...',
        clientSecretLength: prefillCredentials.clientSecret?.length || 0,
        clientSecretPreview: prefillCredentials.clientSecret?.substring(0, 20) || 'none',
        scopes: prefillCredentials.scopes,
      });
      
      // Clean and trim all credential fields to prevent authentication issues
      const cleanedClientId = (prefillCredentials.clientId || '').trim();
      const cleanedClientSecret = (prefillCredentials.clientSecret || '').trim();
      const cleanedEnvironmentId = (prefillCredentials.environmentId || '').trim();
      
      let finalScopes = prefillCredentials.scopes || 'p1:read:users p1:read:environments p1:read:applications p1:read:connections';
      // Strip openid from prefilled scopes
      finalScopes = finalScopes
        .split(/\s+/)
        .filter(s => s && s !== 'openid' && s !== 'opneid')
        .join(' ') || 'p1:read:users p1:read:environments p1:read:applications p1:read:connections';
      
      console.log('[WorkerTokenModal] ✅ Using cleaned prefilled credentials:', {
        clientIdLength: cleanedClientId.length,
        clientSecretLength: cleanedClientSecret.length,
        clientSecretPreview: cleanedClientSecret.substring(0, 20),
      });
      
      return {
        environmentId: environmentId || cleanedEnvironmentId || '',
        clientId: cleanedClientId || '',
        clientSecret: cleanedClientSecret || '',
        region: prefillCredentials.region || 'us',
        scopes: finalScopes,
        authMethod: 'client_secret_post' as 'none' | 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt'
      };
    }
    
    // No prefillCredentials - use defaults
    console.log('[WorkerTokenModal] ⚠️ No prefillCredentials provided, using defaults');
    return {
      environmentId: environmentId || '',
      clientId: '',
      clientSecret: '',
      region: 'us',
      scopes: 'p1:read:users p1:read:environments p1:read:applications p1:read:connections',
      authMethod: 'client_secret_post' as 'none' | 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt'
    };
  });

  // Track if we've already initialized credentials for this modal session
  const hasInitializedRef = React.useRef(false);
  
  // Reset initialization flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
    }
  }, [isOpen]);
  
  // Update credentials when prefillCredentials changes
  // ALWAYS use prefillCredentials when modal opens (they are the current credentials from the form)
  useEffect(() => {
    if (prefillCredentials && isOpen && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      console.log('[WorkerTokenModal] 🔍 Modal opened (first time), using prefillCredentials:', {
        prefillClientIdLength: prefillCredentials.clientId?.length || 0,
        prefillClientSecretLength: prefillCredentials.clientSecret?.length || 0,
        prefillClientSecretPreview: prefillCredentials.clientSecret?.substring(0, 20) || 'none',
      });
      
      // ALWAYS use prefillCredentials - they represent the current form state
      setWorkerCredentials(prev => {
        console.log('[WorkerTokenModal] ✅ Applying prefillCredentials (overriding any cached credentials):', {
          oldSecretLength: prev.clientSecret.length,
          newSecretLength: (prefillCredentials.clientSecret || prev.clientSecret).length,
          oldSecretPreview: prev.clientSecret.substring(0, 20),
          newSecretPreview: (prefillCredentials.clientSecret || prev.clientSecret).substring(0, 20),
        });
        return {
          ...prev,
          environmentId: environmentId || prefillCredentials.environmentId || prev.environmentId,
          clientId: prefillCredentials.clientId || prev.clientId,
          clientSecret: prefillCredentials.clientSecret || prev.clientSecret,
          scopes: prefillCredentials.scopes || prev.scopes,
          region: prefillCredentials.region || prev.region,
          authMethod: prev.authMethod,
        };
      });
    }
  }, [prefillCredentials, environmentId, isOpen]);

  // Update environmentId when prop changes (if not using prefillCredentials)
  useEffect(() => {
    if (environmentId && !prefillCredentials) {
      setWorkerCredentials(prev => ({ ...prev, environmentId }));
    }
  }, [environmentId, prefillCredentials]);

  // Reset showForm when modal opens/closes if skipCredentialsStep is true
  useEffect(() => {
    if (isOpen && skipCredentialsStep) {
      setShowForm(true);
    } else if (!isOpen) {
      setShowForm(false);
    }
  }, [isOpen, skipCredentialsStep]);

  // Note: Removed autosave - credentials only save when user clicks "Save Credentials" button

  const handleGetWorkerToken = () => {
    setIsNavigating(true);
    v4ToastManager.showInfo('Navigating to get worker token...');
    navigate('/client-generator');
  };

  const handleClearSavedCredentials = () => {
    // Clear all saved worker token data from localStorage
    localStorage.removeItem('worker_credentials');
    localStorage.removeItem(tokenStorageKey);
    localStorage.removeItem(tokenExpiryKey);
    
    // Reset the form to defaults
    setWorkerCredentials({
      environmentId: environmentId || '',
      clientId: '',
      clientSecret: '',
      region: 'us',
      scopes: 'p1:read:users p1:read:environments p1:read:applications p1:read:connections',
      authMethod: 'client_secret_post'
    });
    
    v4ToastManager.showSuccess('Saved credentials cleared successfully');
    console.log('[WorkerTokenModal] Cleared all saved credentials from localStorage');
  };

  const handleSaveCredentials = () => {
    // Validate required fields
    if (!workerCredentials.environmentId || !workerCredentials.clientId || !workerCredentials.clientSecret) {
      v4ToastManager.showError('Please fill in all required fields before saving');
      return;
    }

    // Clean and trim all credential fields before saving to prevent authentication issues
    const cleanedCredentials = {
      environmentId: workerCredentials.environmentId.trim(),
      clientId: workerCredentials.clientId.trim(),
      clientSecret: workerCredentials.clientSecret.trim(),
      region: workerCredentials.region,
      authMethod: workerCredentials.authMethod,
      scopes: workerCredentials.scopes
        .split(/\s+/)
        .filter((s: string) => s && s !== 'openid' && s !== 'opneid')
        .join(' ')
    };

    // Save credentials to localStorage
    localStorage.setItem('worker_credentials', JSON.stringify(cleanedCredentials));
    console.log('[WorkerTokenModal] Credentials saved to localStorage (cleaned & trimmed):', {
      environmentId: cleanedCredentials.environmentId,
      clientId: cleanedCredentials.clientId ? '***' : 'missing',
      clientIdLength: cleanedCredentials.clientId.length,
      clientSecretLength: cleanedCredentials.clientSecret.length,
      hasClientSecret: !!cleanedCredentials.clientSecret,
      scopes: cleanedCredentials.scopes,
      authMethod: cleanedCredentials.authMethod
    });
    
    v4ToastManager.showSuccess('Credentials saved successfully');
  };

  // Prepare request details and show educational modal
  const handleGenerateWorkerToken = async () => {
    if (!workerCredentials.environmentId || !workerCredentials.clientId || !workerCredentials.clientSecret) {
      v4ToastManager.showError('Please fill in all required fields');
      return;
    }

    // Note: Identity Metrics API uses ROLES, not scopes
    // Any token will work as long as the Worker App has the correct role assigned in PingOne
    if (flowType === 'pingone-identity-metrics') {
      console.log('[WorkerTokenModal] ℹ️ Note: Metrics API uses roles, not scopes. Ensure your Worker App has "Identity Data Read Only" or "Environment Admin" role assigned.');
    }

    // Build token endpoint URL based on selected region
    const regionDomains: Record<string, string> = {
      us: 'auth.pingone.com',
      eu: 'auth.pingone.eu',
      ap: 'auth.pingone.asia',
      ca: 'auth.pingone.ca',
      na: 'auth.pingone.com'
    };
    const domain = regionDomains[workerCredentials.region] || 'auth.pingone.com';
    const tokenEndpoint = `https://${domain}/${workerCredentials.environmentId}/as/token`;
    
    // Remove openid and ensure valid scopes
    let finalScopes = ensureRequiredScopes(workerCredentials.scopes);
    
    // Double check: explicitly remove openid if it somehow got through
    finalScopes = finalScopes
      .split(/\s+/)
      .filter((s: string) => s && s !== 'openid' && s !== 'opneid')
      .join(' ');
    
    console.log('[WorkerTokenModal] 🔍 SCOPES DEBUG - Token Request:', {
      original: workerCredentials.scopes,
      afterEnsure: finalScopes,
      scopesArray: finalScopes.split(/\s+/),
      hasUsers: finalScopes.includes('p1:read:users'),
      hasEnvironments: finalScopes.includes('p1:read:environments'),
      hasApplications: finalScopes.includes('p1:read:applications'),
      hasConnections: finalScopes.includes('p1:read:connections'),
      hasAudit: finalScopes.includes('p1:read:audit'),
    });
    
    // Trim credentials to prevent authentication failures from whitespace
    const trimmedClientId = workerCredentials.clientId.trim();
    const trimmedClientSecret = workerCredentials.clientSecret.trim();
    
    console.log('[WorkerTokenModal] 🔍 CREDENTIALS BEING USED FOR REQUEST:', {
      clientIdLength: trimmedClientId.length,
      clientIdPreview: trimmedClientId.substring(0, 20) + '...',
      clientSecretLength: trimmedClientSecret.length,
      clientSecretPreview: trimmedClientSecret.substring(0, 20) + '...',
      environmentId: workerCredentials.environmentId.substring(0, 20) + '...',
      authMethod: workerCredentials.authMethod,
      region: workerCredentials.region,
    });
    
    // Prepare request params for modal display
    const requestParams: {
      grant_type: string;
      client_id: string;
      client_secret: string;
      scope?: string;
    } = {
      grant_type: 'client_credentials',
      client_id: trimmedClientId,
      client_secret: trimmedClientSecret,
    };
    
    if (finalScopes) {
      requestParams.scope = finalScopes;
    }
    
    // Store request details and show educational modal
    console.log('[WorkerTokenModal] 🎯 Showing educational modal with request details:', {
      tokenEndpoint,
      clientIdLength: trimmedClientId.length,
      clientSecretLength: trimmedClientSecret.length,
      authMethod: workerCredentials.authMethod,
      region: workerCredentials.region || 'us',
    });
    
    setPendingRequestDetails({
      tokenEndpoint,
      requestParams,
      authMethod: workerCredentials.authMethod,
      region: workerCredentials.region || 'us',
    });
    setShowRequestModal(true);
    
    console.log('[WorkerTokenModal] ✅ Educational modal state set to true');
  };

  // Execute the actual token request (called from educational modal)
  const executeTokenRequest = async () => {
    if (!pendingRequestDetails) {
      v4ToastManager.showError('Request details not available');
      return;
    }

    setShowRequestModal(false);
    setIsGenerating(true);
    
    try {
      const { tokenEndpoint, requestParams, authMethod } = pendingRequestDetails;
      
      // Prepare headers and body based on authentication method
      let headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      
      let bodyParams: Record<string, string> = {
        grant_type: requestParams.grant_type,
        scope: requestParams.scope || '',
      };
      
      console.log('[WorkerTokenModal] Using auth method:', authMethod);
      console.log('[WorkerTokenModal] Credential lengths:', {
        clientId: requestParams.client_id.length,
        clientSecret: requestParams.client_secret.length,
      });
      
      switch (authMethod) {
        case 'client_secret_basic':
          // Use Basic authentication in Authorization header
          headers['Authorization'] = `Basic ${btoa(`${requestParams.client_id}:${requestParams.client_secret}`)}`;
          console.log('[WorkerTokenModal] Using Basic auth in header');
          break;
        case 'client_secret_post':
          // Send client credentials in request body
          bodyParams.client_id = requestParams.client_id;
          bodyParams.client_secret = requestParams.client_secret;
          console.log('[WorkerTokenModal] Using client credentials in body');
          break;
        case 'client_secret_jwt':
        case 'private_key_jwt':
          // For JWT-based authentication, we'd need to generate a JWT assertion
          // For now, fall back to client_secret_post
          bodyParams.client_id = requestParams.client_id;
          bodyParams.client_secret = requestParams.client_secret;
          console.log('[WorkerTokenModal] JWT auth not implemented, falling back to client_secret_post');
          break;
        case 'none':
          // No authentication - just send client_id
          bodyParams.client_id = requestParams.client_id;
          console.log('[WorkerTokenModal] Using no authentication');
          break;
        default:
          // Default to client_secret_post
          bodyParams.client_id = requestParams.client_id;
          bodyParams.client_secret = requestParams.client_secret;
          console.log('[WorkerTokenModal] Default to client_secret_post');
      }
      
      console.log('[WorkerTokenModal] ===== TOKEN REQUEST DETAILS =====');
      console.log('[WorkerTokenModal] Endpoint:', tokenEndpoint);
      console.log('[WorkerTokenModal] Region:', pendingRequestDetails.region);
      console.log('[WorkerTokenModal] Headers:', headers);
      console.log('[WorkerTokenModal] Body params:', bodyParams);
      console.log('[WorkerTokenModal] Scopes being sent:', bodyParams.scope);
      console.log('[WorkerTokenModal] ===============================');
      
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers,
        body: new URLSearchParams(bodyParams),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[WorkerTokenModal] ❌ TOKEN REQUEST FAILED:', {
          status: response.status,
          statusText: response.statusText,
          endpoint: tokenEndpoint,
          region: workerCredentials.region || 'us',
          scopesRequested: bodyParams.scope,
          error: errorData
        });
        
        // Parse error response for user-friendly messages
        let userMessage = 'Unknown error occurred';
        try {
          const errorJson = JSON.parse(errorData);
          const errorType = errorJson.error || '';
          const errorDesc = errorJson.error_description || '';
          
          if (errorType === 'invalid_client') {
            userMessage = 'Your Client ID or Client Secret is incorrect, or the authentication method is not supported by this application.';
          } else if (errorType === 'invalid_scope') {
            userMessage = 'The scopes you requested are not valid or not granted to this application. Note: "openid" scope is not valid for worker tokens.';
          } else if (errorType === 'unauthorized_client') {
            userMessage = 'This client is not authorized to use the client_credentials grant type.';
          } else if (errorDesc) {
            userMessage = errorDesc;
          } else {
            userMessage = `HTTP ${response.status}: ${errorData}`;
          }
        } catch {
          userMessage = `HTTP ${response.status}: Unable to parse error response`;
        }
        
        // Show toast error for all errors
        throw new Error(userMessage);
      }

      const tokenData = await response.json();
      
      const requestedScopesStr = requestParams.scope || '';
      
      // Try to get granted scopes from token response first, then try JWT decoding
      let grantedScopes: string[] = [];
      if (tokenData.scope) {
        // Use scopes from token response (most reliable)
        grantedScopes = tokenData.scope.split(' ').filter(Boolean);
      } else {
        // Try to decode JWT as fallback
        try {
          const tokenParts = tokenData.access_token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            grantedScopes = payload.scope ? payload.scope.split(' ').filter(Boolean) : [];
          }
        } catch (e) {
          console.debug('[WorkerTokenModal] Token is not a JWT or could not decode (this is OK for opaque tokens):', e);
        }
      }
      
      console.log('[WorkerTokenModal] ✅ TOKEN RECEIVED FROM PINGONE:', { 
        hasAccessToken: !!tokenData.access_token,
        expiresIn: tokenData.expires_in,
        tokenType: tokenData.token_type,
        scopesInResponse: tokenData.scope,
        scopesGranted: grantedScopes,
        scopesRequested: requestedScopesStr.split(/\s+/).filter(Boolean),
        tokenFormat: tokenData.access_token.split('.').length === 3 ? 'JWT' : 'Opaque',
      });
      
      // Only check scopes if we could determine what was granted
      if (grantedScopes.length > 0) {
        const requestedScopes = requestedScopesStr.split(/\s+/).filter(Boolean);
        const missingScopes = requestedScopes.filter((scope: string) => !grantedScopes.includes(scope));
        
        if (missingScopes.length > 0) {
          console.warn('[WorkerTokenModal] ⚠️ Some requested scopes may not have been granted:', {
            requested: requestedScopes,
            granted: grantedScopes,
            missing: missingScopes,
          });
          
          // For Identity Metrics, remind about role requirements (not scope requirements)
          if (flowType === 'pingone-identity-metrics') {
            console.log('[WorkerTokenModal] ℹ️ Reminder: Metrics API uses roles. If you get 403, assign "Identity Data Read Only" role to your Worker App.');
          }
        } else {
          console.log('[WorkerTokenModal] ✅ All requested scopes were granted:', grantedScopes);
        }
      } else {
        console.debug('[WorkerTokenModal] 📝 Could not verify granted scopes (token may be opaque). If you encounter 403 errors, check roles in PingOne.');
      }
      
      // Calculate expiration time (default to 1 hour if not provided)
      const expiresIn = tokenData.expires_in || 3600; // seconds
      const expiresAt = Date.now() + (expiresIn * 1000); // convert to milliseconds
      
      // Store the worker token with expiration metadata
      localStorage.setItem(tokenStorageKey, tokenData.access_token);
      localStorage.setItem(tokenExpiryKey, expiresAt.toString());
      
      console.log('[WorkerTokenModal] ✅ Token stored successfully:', {
        tokenKey: tokenStorageKey,
        tokenPreview: tokenData.access_token.substring(0, 20) + '...',
        expiresIn: `${Math.floor(expiresIn / 60)} minutes`,
        scopesGranted: tokenData.scope,
        scopesRequested: requestedScopesStr,
      });
      
      // Save credentials with clean scopes (no openid) and trim all fields
      const cleanScopes = requestedScopesStr || workerCredentials.scopes
        .split(/\s+/)
        .filter((s: string) => s && s !== 'openid' && s !== 'opneid')
        .join(' ');
      
      const credentialsToSave = {
        environmentId: workerCredentials.environmentId.trim(),
        clientId: workerCredentials.clientId.trim(),
        clientSecret: workerCredentials.clientSecret.trim(),
        region: workerCredentials.region,
        scopes: cleanScopes,
        authMethod: workerCredentials.authMethod
      };
      
      localStorage.setItem('worker_credentials', JSON.stringify(credentialsToSave));
      
      console.log('[WorkerTokenModal] Token and credentials saved successfully:', {
        expiresIn: `${expiresIn} seconds`,
        expiresAt: new Date(expiresAt).toISOString(),
        savedCredentials: {
          environmentId: credentialsToSave.environmentId,
          clientId: credentialsToSave.clientId ? '***' : 'missing',
          hasClientSecret: !!credentialsToSave.clientSecret,
          scopes: credentialsToSave.scopes,
          authMethod: credentialsToSave.authMethod
        }
      });
      
      // Dispatch custom event to notify other components that worker token was updated
      // Use custom event name based on token storage key
      let eventName = 'workerTokenUpdated';
      if (tokenStorageKey === 'worker_token_metrics') {
        eventName = 'workerTokenMetricsUpdated';
      } else if (tokenStorageKey === 'worker_token_audit') {
        eventName = 'workerTokenAuditUpdated';
      }
      window.dispatchEvent(new CustomEvent(eventName, { 
        detail: { 
          token: tokenData.access_token,
          expiresAt 
        } 
      }));
      
      showTokenSuccessMessage(expiresIn);
      onContinue();
      
    } catch (error) {
      console.error('Worker token generation failed:', error);
      v4ToastManager.showError(`Failed to generate worker token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinueWithoutToken = () => {
    v4ToastManager.showWarning('Config Checker will be disabled without worker token');
    onContinue();
  };

  if (!isOpen) {
    console.log('[WorkerTokenModal] Modal is closed (isOpen = false)');
    return null;
  }

  console.log('[WorkerTokenModal] ✅ Rendering modal (isOpen = true)', {
    skipCredentialsStep,
    showForm,
    hasCredentials: !!(workerCredentials.clientId && workerCredentials.clientSecret),
  });

  return (
    <>
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title={skipCredentialsStep ? "Get Worker Token" : "Worker Token Required"}
      maxHeight="calc(100vh - 4rem)"
      width="min(900px, calc(100vw - 2rem))"
    >
      <div style={{ margin: '-0.5rem -0.5rem 0 -0.5rem' }}>
        {!skipCredentialsStep && (
          <InfoBox $variant="warning">
            <FiAlertTriangle size={16} style={{ flexShrink: 0, color: '#f59e0b', marginTop: '0.125rem' }} />
            <InfoContent>
              <InfoTitle style={{ fontSize: '0.875rem', marginBottom: '0.125rem' }}>Config Checker Requires Worker Token</InfoTitle>
              <InfoText>
                Worker token needed for Config Checker. Generate one below or use Client Generator.
              </InfoText>
            </InfoContent>
          </InfoBox>
        )}

        {!showForm ? (
          <>
            <InfoBox $variant="info">
              <FiInfo size={16} style={{ flexShrink: 0, color: '#3b82f6', marginTop: '0.125rem' }} />
              <InfoContent>
                <InfoTitle style={{ fontSize: '0.875rem', marginBottom: '0.125rem' }}>Get Worker Token</InfoTitle>
                <InfoText>
                  Generate here or use Client Generator.
                </InfoText>
              </InfoContent>
            </InfoBox>

            <ButtonGroup>
              <ActionButton onClick={() => setShowForm(true)}>
                <FiKey />
                Generate Worker Token Here
              </ActionButton>
              <ActionButton onClick={handleGetWorkerToken} disabled={isNavigating}>
                <FiExternalLink />
                Use Client Generator
              </ActionButton>
              <ActionButton $variant="secondary" onClick={handleContinueWithoutToken}>
                Continue Without Config Checker
              </ActionButton>
            </ButtonGroup>
          </>
        ) : (
          <>
            {skipCredentialsStep && (
              <InfoBox $variant="info">
                <FiInfo size={16} style={{ flexShrink: 0, color: '#3b82f6', marginTop: '0.125rem' }} />
                <InfoContent>
                  <InfoTitle style={{ fontSize: '0.875rem', marginBottom: '0.125rem' }}>Generate Worker Token</InfoTitle>
                  <InfoText>
                    Using credentials from Step 1. Click "Generate Worker Token" to obtain your token.
                  </InfoText>
                </InfoContent>
              </InfoBox>
            )}
            {!skipCredentialsStep && (
              <InfoBox $variant="info">
                <FiInfo size={16} style={{ flexShrink: 0, color: '#3b82f6', marginTop: '0.125rem' }} />
                <InfoContent>
                  <InfoTitle style={{ fontSize: '0.875rem', marginBottom: '0.125rem' }}>Generate Worker Token</InfoTitle>
                  <InfoText>
                    Enter PingOne credentials below.
                  </InfoText>
                </InfoContent>
              </InfoBox>
            )}

            <FormSection>
              <FormField>
                <FormLabel>Environment ID *</FormLabel>
                <FormInput
                  type="text"
                  placeholder="e.g., b9817c16-9910-4415-b67e-4ac687da74d9"
                  value={workerCredentials.environmentId}
                  onChange={(e) => setWorkerCredentials(prev => ({ ...prev, environmentId: e.target.value }))}
                />
              </FormField>

              <FormField>
                <FormLabel>Region</FormLabel>
                <FormInput
                  as="select"
                  value={workerCredentials.region}
                  onChange={(e) => setWorkerCredentials(prev => ({ ...prev, region: e.target.value }))}
                >
                  <option value="us">US (auth.pingone.com)</option>
                  <option value="eu">Europe (auth.pingone.eu)</option>
                  <option value="ap">Asia Pacific (auth.pingone.asia)</option>
                  <option value="ca">Canada (auth.pingone.ca)</option>
                </FormInput>
              </FormField>

              <FormField>
                <FormLabel>Client ID *</FormLabel>
                <FormInput
                  type="text"
                  placeholder="e.g., 5ac8ccd7-7ebc-4684-b0d9-233705e87a7c"
                  value={workerCredentials.clientId}
                  onChange={(e) => setWorkerCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                />
              </FormField>

              <FormField>
                <FormLabel>Client Secret *</FormLabel>
                <PasswordInput>
                  <FormInput
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your client secret"
                    value={workerCredentials.clientSecret}
                    onChange={(e) => setWorkerCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                  />
                  <PasswordToggle onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </PasswordToggle>
                </PasswordInput>
              </FormField>

              <FormField>
                <FormLabel>Token Endpoint Authentication Method</FormLabel>
                <FormSelect
                  value={workerCredentials.authMethod}
                  onChange={(e) => setWorkerCredentials(prev => ({ ...prev, authMethod: e.target.value as 'none' | 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt' }))}
                >
                  <option value="none" disabled>None</option>
                  <option value="client_secret_basic">Client Secret Basic</option>
                  <option value="client_secret_post">Client Secret Post</option>
                  <option value="client_secret_jwt">Client Secret JWT</option>
                  <option value="private_key_jwt">Private Key JWT</option>
                </FormSelect>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem', lineHeight: '1.3' }}>
                  💡 Use "Client Secret Post" for most PingOne applications.
                </div>
              </FormField>
            </FormSection>

            <ButtonGroup>
              <ActionButton 
                onClick={handleGenerateWorkerToken} 
                disabled={isGenerating || !workerCredentials.environmentId || !workerCredentials.clientId || !workerCredentials.clientSecret}
              >
                {isGenerating ? <LoadingSpinner /> : <FiRefreshCw />}
                {isGenerating ? 'Generating...' : 'Generate Worker Token'}
              </ActionButton>
              <ActionButton 
                $variant="success" 
                onClick={handleSaveCredentials} 
                disabled={isGenerating || !workerCredentials.environmentId || !workerCredentials.clientId || !workerCredentials.clientSecret}
              >
                <FiSave />
                Save Credentials
              </ActionButton>
              <ActionButton $variant="secondary" onClick={handleClearSavedCredentials} disabled={isGenerating}>
                🗑️ Clear Saved Credentials
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </ActionButton>
            </ButtonGroup>
          </>
        )}
      </div>
    </DraggableModal>

    {/* Educational modal showing request details */}
    {pendingRequestDetails && (
      <WorkerTokenRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onProceed={executeTokenRequest}
        tokenEndpoint={pendingRequestDetails.tokenEndpoint}
        requestParams={pendingRequestDetails.requestParams}
        authMethod={pendingRequestDetails.authMethod}
        region={pendingRequestDetails.region}
      />
    )}
    </>
  );
};

