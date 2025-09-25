// Worker Token Flow V3 - Machine-to-machine authentication using client credentials

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { FiSettings, FiKey, FiShield, FiRefreshCw, FiCheckCircle, FiEye, FiEyeOff, FiCopy, FiDownload } from 'react-icons/fi';
import { useAuth } from '../../contexts/NewAuthContext';
import { logger } from '../../utils/logger';
import { showFlowSuccess, showFlowError, showDetailedError } from '../../components/CentralizedSuccessMessage';
import { credentialManager } from '../../utils/credentialManager';
import { EnhancedStepFlowV2 } from '../../components/EnhancedStepFlowV2';
import { useFlowStepManager } from '../../utils/flowStepSystem';
import { createCredentialsStep, StepCredentials, FormField, FormLabel, FormInput } from '../../components/steps/CommonSteps';
import CollapsibleSection from '../../components/CollapsibleSection';
import { TokenSurface } from '../../components/TokenSurface';
import { applyClientAuthentication, getAuthMethodSecurityLevel } from '../../utils/clientAuthentication';
import { keyStorageService } from '../../services/keyStorageService';

// Worker Token specific authentication method type (excludes 'none')
type WorkerTokenAuthMethod = 'client_secret_post' | 'client_secret_basic' | 'client_secret_jwt' | 'private_key_jwt';
import ConfirmationModal from '../../components/ConfirmationModal';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 1.125rem;
  opacity: 0.9;
`;

const InfoBox = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  text-align: left;
  
  p {
    margin: 0.5rem 0;
    font-size: 1rem;
  }
  
  strong {
    font-weight: 600;
  }
`;

const TokenDisplay = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const TokenInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const TokenItem = styled.div`
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
`;

const TokenLabel = styled.div`
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
`;

const TokenValue = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #495057;
  word-break: break-all;
`;


const FlowControlSection = styled.div`
  padding: 2rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  margin-top: 2rem;
  border-radius: 0 0 12px 12px;
`;

const FlowControlTitle = styled.h3`
  margin: 0 0 1.5rem 0;
  color: #374151;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FlowControlButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
`;

const FlowControlButton = styled.button<{ className?: string }>`
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  background: white;
  color: #374151;

  &:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  &.clear {
    background: #fef3c7;
    border-color: #f59e0b;
    color: #92400e;
    
    &:hover:not(:disabled) {
      background: #fde68a;
      border-color: #d97706;
    }
  }

  &.reset {
    background: #fef2f2;
    border-color: #fecaca;
    color: #dc2626;
    
    &:hover:not(:disabled) {
      background: #fee2e2;
      border-color: #fca5a5;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const WorkerTokenFlowV3: React.FC = () => {
  const authContext = useAuth();
  const { config } = authContext;
  
  const stepManager = useFlowStepManager({
    flowType: 'worker-token-v3',
    persistKey: 'worker_token_v3_step_manager',
    defaultStep: 0,
    enableAutoAdvance: true
  });

  const [credentials, setCredentials] = useState<StepCredentials>({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    redirectUri: '', // Worker tokens don't need redirect URI
    scopes: 'openid' // Default to openid scope
  });

  const [clientAuthMethod, setClientAuthMethod] = useState<WorkerTokenAuthMethod>('client_secret_post');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [showSecret, setShowSecret] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [jwksUrl, setJwksUrl] = useState<string>('https://oauth-playground.vercel.app/jwks');
  const [useJwksEndpoint, setUseJwksEndpoint] = useState<boolean>(true);
  
  // Track JWKS endpoint state changes
  useEffect(() => {
    // State change tracking can be added here if needed
  }, [useJwksEndpoint]);
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<any>(null);
  const [introspection, setIntrospection] = useState<any>(null);
  const [showClearCredentialsModal, setShowClearCredentialsModal] = useState(false);
  const [isClearingCredentials, setIsClearingCredentials] = useState(false);
  const [showAuthUrlModal, setShowAuthUrlModal] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [showIntrospectUrlModal, setShowIntrospectUrlModal] = useState(false);
  const [introspectUrl, setIntrospectUrl] = useState('');
  const [, setResetKey] = useState(0); // Key to force re-render after reset
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  // Generate RSA private key for Private Key JWT authentication
  const generatePrivateKey = useCallback(async () => {
    try {
      setIsGeneratingKey(true);
      console.log('🔑 [WorkerTokenV3] Generating RSA private key...');
      
      // Generate RSA key pair using Web Crypto API
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true, // extractable
        ['sign', 'verify']
      );
      
      // Export private key in PKCS#8 format
      const privateKeyPkcs8 = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(privateKeyPkcs8))).match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;
      
      // Export public key in SPKI format
      const publicKeySpki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(publicKeySpki))).match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
      
      // Store both keys with the key storage service
      const kid = await keyStorageService.storeKeyPairWithPublicKey(privateKeyPem, publicKeyPem);
      
      setPrivateKey(privateKeyPem);
      // Switch to upload mode since we generated a private key
      setUseJwksEndpoint(false);
      showFlowSuccess(`🔑 RSA Private Key generated and stored with ID: ${kid}`);
      
      console.log('🔑 [WorkerTokenV3] Private key generated, stored, and set - switched to upload mode');
    } catch (error) {
      console.error('❌ [WorkerTokenV3] Failed to generate private key:', error);
      showFlowError(`Failed to generate private key: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGeneratingKey(false);
    }
  }, []);

  // Load credentials when step changes to ensure we have the latest stored values
  const handleStepChange = useCallback((stepIndex: number) => {
    console.log('🔄 [WorkerTokenV3] Step changed to:', stepIndex);
    
    // Reload credentials when moving to step 2 (token request)
    if (stepIndex === 1) {
      const workerCredentials = credentialManager.loadFlowCredentials('worker-token-v3');
      if ((workerCredentials as any).clientAuthMethod) {
        console.log('🔄 [WorkerTokenV3] Reloading stored auth method:', (workerCredentials as any).clientAuthMethod);
        setClientAuthMethod((workerCredentials as any).clientAuthMethod as WorkerTokenAuthMethod);
        setPrivateKey((workerCredentials as any).privateKey || '');
        
        // Update credentials state with stored values
        setCredentials(prev => ({
          ...prev,
          clientSecret: workerCredentials.clientSecret || prev.clientSecret
        }));
      }
    }
  }, []);

  // Load initial credentials following proper priority: flow-specific > global > defaults
  useEffect(() => {
    const loadInitialCredentials = async () => {
      try {
        // 1. Try worker flow-specific credentials first
        const workerCredentials = credentialManager.loadFlowCredentials('worker-token-v3');
        
        let initialCredentials: StepCredentials;
        
        if (workerCredentials.environmentId || workerCredentials.clientId) {
          // Use flow-specific credentials
          initialCredentials = {
            environmentId: workerCredentials.environmentId || '',
            clientId: workerCredentials.clientId || '',
            clientSecret: workerCredentials.clientSecret || '',
            redirectUri: '', // Worker tokens don't need redirect URI
            scopes: Array.isArray(workerCredentials.scopes) ? workerCredentials.scopes.join(' ') : (workerCredentials.scopes || 'openid')
          };
          
          // Load authentication method and private key
          setClientAuthMethod(((workerCredentials as any).clientAuthMethod as WorkerTokenAuthMethod) || 'client_secret_post');
          setPrivateKey((workerCredentials as any).privateKey || '');
          
          console.log('✅ [Worker-V3] Loaded flow-specific credentials:', workerCredentials);
        } else {
          // 2. Fall back to global config credentials
          const configCredentials = credentialManager.loadConfigCredentials();
          
          if (configCredentials.environmentId || configCredentials.clientId) {
            initialCredentials = {
              environmentId: configCredentials.environmentId || '',
              clientId: configCredentials.clientId || '',
              clientSecret: configCredentials.clientSecret || '',
              redirectUri: '', // Worker tokens don't need redirect URI
              scopes: Array.isArray(configCredentials.scopes) ? configCredentials.scopes.join(' ') : (configCredentials.scopes || 'openid')
            };
            console.log('✅ [Worker-V3] Loaded global config credentials:', configCredentials);
          } else {
            // 3. Use environment variables as final fallback
            const envCredentials = {
              environmentId: config?.environmentId || '',
              clientId: config?.clientId || '',
              clientSecret: config?.clientSecret || '',
              redirectUri: '', // Worker tokens don't need redirect URI
              scopes: 'openid'
            };
            initialCredentials = envCredentials;
            console.log('✅ [Worker-V3] Loaded environment credentials:', envCredentials);
          }
        }
        
        setCredentials(initialCredentials);
      } catch (error) {
        console.error('❌ [Worker-V3] Failed to load credentials:', error);
        setError('Failed to load credentials');
      }
    };

    loadInitialCredentials();
  }, [config]);

  // Save credentials function
  const saveCredentials = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate required fields
      if (!credentials.environmentId || !credentials.clientId) {
        throw new Error('Please fill in all required fields: Environment ID and Client ID');
      }
      
      // Note: We allow saving the authentication method selection even if method-specific fields aren't filled yet
      // This allows users to save their authentication method choice and fill in the specific fields later

      // Save to flow-specific storage
      credentialManager.saveFlowCredentials('worker-token-v3', {
        environmentId: credentials.environmentId,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        redirectUri: '', // Worker tokens don't need redirect URI
        scopes: credentials.scopes,
        clientAuthMethod: clientAuthMethod,
        privateKey: privateKey
      });

      showFlowSuccess('✅ Credentials Saved', `Worker token credentials saved successfully. Authentication method: ${clientAuthMethod}`);
      logger.auth('WorkerTokenFlowV3', 'Credentials saved successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save credentials';
      setError(errorMessage);
      showFlowError('❌ Save Failed', errorMessage);
      logger.error('WorkerTokenFlowV3', 'Failed to save credentials', { error });
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  // Show introspection URL
  const showIntrospectionUrl = useCallback(() => {
    if (!tokens?.access_token || !credentials.environmentId) {
      showFlowError('No access token available for introspection');
      return;
    }

    const introspectionEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/introspect`;
    setIntrospectUrl(introspectionEndpoint);
    setShowIntrospectUrlModal(true);
    
    console.log('🔍 [WorkerTokenV3] Showing introspection URL:', introspectionEndpoint);
  }, [tokens, credentials]);

  // Request access token
  const requestAccessToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
      
      // Ensure we have a valid scope - fallback to openid if empty
      const scopeValue = credentials.scopes?.trim() || 'openid';
      
      // Prepare base request body
      const baseBody = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: scopeValue
      });
      
      // Validate authentication method configuration
      if (clientAuthMethod === 'private_key_jwt' && useJwksEndpoint && !privateKey) {
        throw new Error('Configuration mismatch: You have selected "Private Key JWT" authentication method with "Use JWKS Endpoint" mode, but no private key is available. Either:\n\n1. Switch to "Upload Private Key" mode and generate/upload a private key, OR\n2. Change the authentication method to "Client Secret Post" or "Client Secret Basic" for JWKS endpoint mode');
      }
      
      // Apply client authentication method
      const authConfig = {
        method: clientAuthMethod,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        privateKey: privateKey,
        tokenEndpoint: tokenEndpoint
      };
      
      console.log('🔐 [WorkerTokenV3] Using client authentication method:', clientAuthMethod);
      console.log('🔐 [WorkerTokenV3] Auth config details:', {
        method: authConfig.method,
        clientId: authConfig.clientId,
        hasClientSecret: !!authConfig.clientSecret,
        hasPrivateKey: !!authConfig.privateKey,
        tokenEndpoint: authConfig.tokenEndpoint
      });
      
      const authenticatedRequest = await applyClientAuthentication(authConfig, baseBody);
      
      console.log('🔐 [WorkerTokenV3] Authentication result:', {
        headers: Object.keys(authenticatedRequest.headers),
        bodyKeys: Array.from(authenticatedRequest.body.keys()),
        hasClientAssertion: authenticatedRequest.body.has('client_assertion'),
        hasClientSecret: authenticatedRequest.body.has('client_secret')
      });
      
      const requestPayload = {
        environment_id: credentials.environmentId,
        auth_method: clientAuthMethod,
        headers: authenticatedRequest.headers,
        body: Object.fromEntries(authenticatedRequest.body.entries())
      };

      console.log('🔧 [WorkerTokenV3] Sending request to /api/client-credentials:', {
        authMethod: clientAuthMethod,
        securityLevel: getAuthMethodSecurityLevel(clientAuthMethod),
        tokenEndpoint,
        scopeValue: credentials.scopes,
        hasCustomHeaders: Object.keys(authenticatedRequest.headers).length > 1
      });
      
      const response = await fetch('/api/client-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      console.log('🔧 [WorkerTokenV3] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [WorkerTokenV3] Backend error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        // Provide helpful error message for scope issues
        let errorMessage = errorData.error_description || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        if (errorMessage.includes('scope') || errorMessage.includes('granted')) {
          errorMessage += '\n\n💡 Solution: Configure scopes in your PingOne Worker Application:\n' +
                         '1. Go to PingOne Admin Console\n' +
                         '2. Navigate to Applications → Your Worker Application\n' +
                         '3. Go to the "Scopes" tab\n' +
                         '4. Add required scopes:\n' +
                         '   • api:read - For reading PingOne Management API data\n' +
                         '   • api:write - For writing PingOne Management API data\n' +
                         '   • openid - For OpenID Connect (if needed)\n' +
                         '5. Save the configuration and try again\n\n' +
                         'Note: Worker Applications need PingOne Management API scopes, not user scopes.';
        }
        
        throw new Error(errorMessage);
      }

      const tokenData = await response.json();
      setTokens(tokenData);
      
      showFlowSuccess('🎉 Token Obtained', 'Worker token has been successfully obtained');
      logger.auth('WorkerTokenFlowV3', 'Worker token obtained successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to obtain token';
      setError(errorMessage);
      
      // Provide more detailed error messages based on the error type
              if (errorMessage.includes('Unsupported authentication method')) {
                showDetailedError(
                  '❌ Authentication Method Not Supported',
                  `The selected authentication method (${clientAuthMethod}) is not supported by this client.\n\nPossible solutions:\n• Check PingOne Admin Console → Applications → Your App → Configuration → Token Endpoint Authentication Method\n• Ensure the client is configured to support "${clientAuthMethod}"\n• Try using "Client Secret Post" (default) or "None" authentication method\n• Verify the client credentials are correct\n• For Client Secret JWT: Ensure client supports JWT-based authentication\n• For Private Key JWT: Ensure client has RSA key configured`,
                  30000 // 30 seconds for this detailed error
                );
      } else if (errorMessage.includes('invalid_client')) {
        showDetailedError(
          '❌ Invalid Client Credentials',
          `The client credentials are invalid or the client doesn't exist.\n\nPlease check:\n• Client ID is correct\n• Client Secret is correct (if using client_secret_post)\n• Environment ID is correct\n• Client exists in PingOne`,
          25000
        );
              } else if (errorMessage.includes('invalid_scope')) {
                showDetailedError(
                  '❌ Invalid Scope',
                  `The requested scope is not granted to this client.\n\nAvailable scopes for Worker Token:\n• openid (required)\n• profile\n• email\n• address\n• phone\n• offline_access\n\nPlease check:\n• Scope is valid for Worker Token applications\n• Client has the requested scope granted in PingOne\n• Start with 'openid' scope only`,
                  20000
                );
      } else {
        showDetailedError('❌ Token Request Failed', errorMessage, 20000);
      }
      
      logger.error('WorkerTokenFlowV3', 'Failed to obtain worker token', { error });
    } finally {
      setIsLoading(false);
    }
  }, [credentials, clientAuthMethod, privateKey]);

  // Reset flow
  const resetFlow = useCallback(async () => {
    console.log('🔄 [WorkerTokenV3] Reset flow initiated');
    
    setIsLoading(true);
    
    try {
      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear tokens and error state
      setTokens(null);
      setError(null);
      setIntrospection(null);
      
      // Reset form fields to default values
      setCredentials({
        environmentId: '',
        clientId: '',
        clientSecret: '',
        redirectUri: '',
        scopes: 'openid'
      });
      setClientAuthMethod('client_secret_post');
      setPrivateKey('');
      setUseJwksEndpoint(true);
      setJwksUrl('https://oauth-playground.vercel.app/jwks');
      setShowSecret(false);
      setShowPrivateKey(false);
      setShowAuthUrlModal(false);
      setAuthUrl('');
      setShowIntrospectUrlModal(false);
      setIntrospectUrl('');
      
      // Force clear any URL parameters that might interfere
      if (window.location.search) {
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, '', url.toString());
      }
      
      // Force complete component re-render by changing the key
      // This will unmount and remount the EnhancedStepFlowV2 component
      setResetKey(prev => prev + 1);
      
      // Log the reset completion
      console.log('🔄 [WorkerTokenV3] Flow reset completed - component will re-render');
      
      showFlowSuccess('🔄 Flow Reset', 'Worker token flow has been reset successfully');
      logger.auth('WorkerTokenFlowV3', 'Flow reset successfully');
      
    } catch (error) {
      console.error('❌ [WorkerTokenV3] Reset flow failed:', error);
      showFlowError('Failed to reset flow');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear credentials function
  const clearCredentials = useCallback(async () => {
    console.log('🧹 [WorkerTokenV3] Clear credentials initiated');
    
    setIsClearingCredentials(true);
    
    try {
      // Clear flow-specific credentials
      await credentialManager.clearWorkerFlowCredentials();
      
      // Reset form state
      setCredentials({
        environmentId: '',
        clientId: '',
        clientSecret: '',
        redirectUri: '',
        scopes: 'openid'
      });
      setClientAuthMethod('client_secret_post');
      setPrivateKey('');
      setShowSecret(false);
      setShowPrivateKey(false);
      
      // Clear tokens and error state
      setTokens(null);
      setError(null);
      setIntrospection(null);
      
      // Reset to first step
      stepManager.resetFlow();
      
      showFlowSuccess('🧹 Credentials Cleared', 'All saved credentials have been cleared successfully');
      logger.auth('WorkerTokenFlowV3', 'Credentials cleared successfully');
      
    } catch (error) {
      console.error('❌ [WorkerTokenV3] Clear credentials failed:', error);
      showFlowError('Failed to clear credentials');
    } finally {
      setIsClearingCredentials(false);
      setShowClearCredentialsModal(false);
    }
  }, [stepManager]);

  // Introspect token
  const introspectToken = useCallback(async () => {
    if (!tokens?.access_token) {
      setError('No access token available for introspection');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const introspectionEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/introspect`;
      
      const response = await fetch('/api/introspect-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: tokens.access_token,
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          introspection_endpoint: introspectionEndpoint
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const introspectionData = await response.json();
      setIntrospection(introspectionData);
      
      showFlowSuccess('🔍 Token Introspected', 'Token has been successfully introspected');
      logger.auth('WorkerTokenFlowV3', 'Token introspected successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to introspect token';
      setError(errorMessage);
      showFlowError('❌ Introspection Failed', errorMessage);
      logger.error('WorkerTokenFlowV3', 'Failed to introspect token', { error });
    } finally {
      setIsLoading(false);
    }
  }, [tokens, credentials]);

  // Copy to clipboard function
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showFlowSuccess('📋 Copied', `${label} copied to clipboard`);
    } catch (error) {
      showFlowError('❌ Copy Failed', `Failed to copy ${label.toLowerCase()}`);
    }
  }, []);

  // Copy token function for the new token display
  const handleCopyToken = useCallback(async (token: string, tokenType: string) => {
    try {
      await navigator.clipboard.writeText(token);
      showFlowSuccess(`📋 ${tokenType} copied to clipboard!`);
    } catch (error) {
      showFlowError(`Failed to copy ${tokenType} to clipboard`);
    }
  }, []);

  // Navigate to Token Management with token
  const navigateToTokenManagement = useCallback(() => {
    console.log('🔍 [WorkerTokenV3] Navigate to token management:', {
      hasTokens: !!tokens,
      hasAccessToken: !!tokens?.access_token,
      tokens
    });
    
    if (tokens?.access_token) {
      console.log('✅ [WorkerTokenV3] Access token found, storing for analysis:', {
        tokenLength: tokens.access_token.length,
        tokenPreview: tokens.access_token.substring(0, 20) + '...'
      });
      
      // Store the token for the Token Management page
      sessionStorage.setItem('token_to_analyze', tokens.access_token);
      sessionStorage.setItem('token_type', 'access');
      sessionStorage.setItem('flow_source', 'worker-token-v3');
      
      console.log('🔍 [WorkerTokenV3] Navigating to token management page...');
      window.location.href = '/token-management';
    } else {
      console.error('❌ [WorkerTokenV3] No access token available for analysis');
      showFlowError('No access token available for analysis');
    }
  }, [tokens]);

  // Generate authorization URL for Worker Token flow
  const generateAuthorizationUrl = useCallback(async () => {
    if (!credentials.environmentId || !credentials.clientId) {
      showFlowError('Environment ID and Client ID are required to generate authorization URL');
      return;
    }

    const baseUrl = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: credentials.clientId,
      redirect_uri: credentials.redirectUri || `${window.location.origin}/authz-callback`,
      scope: credentials.scopes || 'openid',
      state: 'worker-token-flow'
    });

    const url = `${baseUrl}?${params.toString()}`;
    setAuthUrl(url);
    setShowAuthUrlModal(true);
    
    console.log('🔗 [WorkerTokenV3] Generated authorization URL:', url);
  }, [credentials]);

  // Define steps
  const steps = useMemo(() => [
    {
      id: 'setup-credentials',
      title: 'Setup Worker Credentials',
      description: 'Configure your PingOne Worker Token for authentication using the OAuth 2.0 Client Credentials Grant flow.',
      category: 'preparation' as const,
      icon: <FiSettings />,
      content: (
        <div>
          {/* Worker Token Flow Overview */}
          <CollapsibleSection 
            title="🔧 OAuth 2.0 Client Credentials Grant Flow"
            defaultExpanded={false}
          >
            <div style={{ 
              background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
              border: '1px solid #0ea5e9',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
            
            {/* What are Worker Tokens? */}
            <div style={{ marginBottom: '1rem' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#0369a1', fontSize: '0.95rem', fontWeight: '600' }}>
                What are Worker Tokens?
              </h5>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#0369a1', lineHeight: '1.5' }}>
                Worker Tokens are access tokens obtained using the OAuth 2.0 Client Credentials Grant flow, designed for machine-to-machine (M2M) communication with no user interaction required.
              </p>
              
              <h6 style={{ margin: '0 0 0.5rem 0', color: '#0369a1', fontSize: '0.9rem', fontWeight: '600' }}>
Perfect for:
              </h6>
              <ul style={{ margin: '0 0 0.75rem 0', paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#0369a1', lineHeight: '1.5' }}>
                <li>Background services and automation</li>
                <li>Server-to-server APIs</li>
                <li>Data synchronization and ETL processes</li>
                <li>Monitoring and alerting systems</li>
                <li>Integration workflows</li>
                <li>Microservices communication</li>
              </ul>
            </div>

            {/* How it works */}
            <div style={{ marginBottom: '1rem' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#0369a1', fontSize: '0.95rem', fontWeight: '600' }}>
                How it works:
              </h5>
              <ol style={{ margin: '0 0 0.75rem 0', paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#0369a1', lineHeight: '1.5' }}>
                <li>Your application sends client credentials (client_id + client_secret) to PingOne's token endpoint</li>
                <li>PingOne validates the credentials and returns an access token</li>
                <li>Your application uses the access token to call PingOne Management API endpoints</li>
                <li>The token has a limited lifetime and can be refreshed as needed</li>
              </ol>
            </div>

            {/* Authentication Methods */}
            <div style={{ marginBottom: '1rem' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#0369a1', fontSize: '0.95rem', fontWeight: '600' }}>
                Authentication Methods Supported:
              </h5>
              <ul style={{ margin: '0 0 0.75rem 0', paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#0369a1', lineHeight: '1.5' }}>
                <li><strong>Client Secret Post</strong> - Secret sent in request body (default)</li>
                <li><strong>Client Secret Basic</strong> - HTTP Basic Authentication header</li>
                <li><strong>Client Secret JWT</strong> - JWT signed with client secret (HS256)</li>
                <li><strong>Private Key JWT</strong> - JWT signed with private key (RS256)</li>
              </ul>
            </div>

            {/* Security Considerations */}
            <div style={{ marginBottom: '1rem' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#0369a1', fontSize: '0.95rem', fontWeight: '600' }}>
                Security Considerations:
              </h5>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#0369a1', lineHeight: '1.5' }}>
                Worker Tokens have broad permissions - use only for trusted applications and store secrets securely.
              </p>
            </div>

            {/* Documentation Link */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.8)', 
              border: '1px solid rgba(3, 105, 161, 0.3)', 
              borderRadius: '6px', 
              padding: '0.75rem',
              textAlign: 'center'
            }}>
              <a 
                href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#authentication" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: '#0369a1', 
                  textDecoration: 'none', 
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                📚 PingOne API Documentation
              </a>
            </div>
            </div>
          </CollapsibleSection>

          <FormField>
            <FormLabel>Environment ID *</FormLabel>
            <FormInput
              type="text"
              value={credentials.environmentId}
              onChange={(e) => setCredentials({ ...credentials, environmentId: e.target.value })}
              placeholder="e.g., 12345678-1234-1234-1234-123456789012"
              required
            />
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Found in PingOne Admin Console URL or Environment settings
            </div>
          </FormField>
          
          <FormField>
            <FormLabel>Client ID *</FormLabel>
            <FormInput
              type="text"
              value={credentials.clientId}
              onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
              placeholder="e.g., 87654321-4321-4321-4321-210987654321"
              required
            />
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Unique identifier for your Worker Application in PingOne
            </div>
          </FormField>
          
          <FormField>
            <FormLabel>Client Secret *</FormLabel>
            <div style={{ position: 'relative' }}>
              <FormInput
                type={showSecret ? "text" : "password"}
                value={credentials.clientSecret}
                onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
                placeholder="Your client secret"
                style={{ paddingRight: showSecret ? '2.5rem' : undefined }}
                required
              />
                <button
                  id="worker-token-show-secret-button"
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Generated in PingOne Worker Application Configuration tab
            </div>
          </FormField>

          <FormField>
            <FormLabel>Scopes</FormLabel>
            <FormInput
              type="text"
              value={credentials.scopes}
              onChange={(e) => setCredentials({ ...credentials, scopes: e.target.value })}
              placeholder="openid (default if empty)"
            />
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem', lineHeight: '1.4' }}>
              Space-separated list of scopes. Default: openid<br/>
              <strong>Available scopes for Worker Token:</strong><br/>
              • <code style={{ background: '#f3f4f6', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.8rem' }}>openid</code> - OpenID Connect (required)<br/>
              • <code style={{ background: '#f3f4f6', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.8rem' }}>profile</code> - Access user profile information<br/>
              • <code style={{ background: '#f3f4f6', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.8rem' }}>email</code> - Access user email address<br/>
              • <code style={{ background: '#f3f4f6', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.8rem' }}>address</code> - Access user address information<br/>
              • <code style={{ background: '#f3f4f6', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.8rem' }}>phone</code> - Access user phone number<br/>
              • <code style={{ background: '#f3f4f6', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.8rem' }}>offline_access</code> - Request refresh tokens
            </div>
          </FormField>

          {/* Enhanced Authentication Method Section */}
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '1.5rem',
            marginTop: '1rem',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                background: '#f59e0b',
                borderRadius: '50%',
                width: '2.5rem',
                height: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
              }}>
                <FiShield size={18} color="white" />
              </div>
              <div>
                <h3 style={{
                  margin: '0',
                  color: '#92400e',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  textShadow: '0 1px 2px rgba(146, 64, 14, 0.1)'
                }}>
                  🔐 Token Endpoint Authentication Method
                </h3>
                <p style={{
                  margin: '0.25rem 0 0 0',
                  color: '#a16207',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  Choose how your client authenticates with PingOne
                </p>
              </div>
            </div>

            <FormField>
              <select
                value={clientAuthMethod}
                onChange={(e) => setClientAuthMethod(e.target.value as WorkerTokenAuthMethod)}
              style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #f59e0b',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  backgroundColor: 'white',
                  fontWeight: '600',
                  color: '#92400e',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#d97706';
                  e.target.style.boxShadow = '0 4px 12px rgba(217, 119, 6, 0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#f59e0b';
                  e.target.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.15)';
                }}
              >
              <option value="client_secret_post">Client Secret Post</option>
              <option value="client_secret_basic">Client Secret Basic</option>
              <option value="client_secret_jwt">Client Secret JWT</option>
              <option value="private_key_jwt">Private Key JWT</option>
            </select>
              <div style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  {(() => {
                    const securityInfo = getAuthMethodSecurityLevel(clientAuthMethod);
                    return (
                      <>
                        <span style={{ fontSize: '1.2rem' }}>{securityInfo.icon}</span>
                        <span style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: '#92400e'
                        }}>
                          {securityInfo.description}
                        </span>
                      </>
                    );
                  })()}
                </div>
                
                <CollapsibleSection 
                  title="Available Methods"
                  defaultExpanded={false}
                >
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#a16207', 
                      marginTop: '0.25rem',
                      background: 'rgba(255, 255, 255, 0.5)',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}>
                      <strong>⚠️ Important:</strong> The selected method must match your PingOne application's "Token Endpoint Authentication Method" setting in Admin Console → Applications → Configuration.
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <div style={{
                    background: clientAuthMethod === 'client_secret_post' ? '#fef3c7' : '#f9fafb',
                    border: clientAuthMethod === 'client_secret_post' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1rem' }}>📤</span>
                    <div>
                      <code style={{
                        background: clientAuthMethod === 'client_secret_post' ? '#f59e0b' : '#f3f4f6',
                        color: clientAuthMethod === 'client_secret_post' ? 'white' : '#374151',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>Client Secret Post</code>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                        Secret in request body (default)
                      </span>
                    </div>
                  </div>
                  
                  <div style={{
                    background: clientAuthMethod === 'client_secret_basic' ? '#fef3c7' : '#f9fafb',
                    border: clientAuthMethod === 'client_secret_basic' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1rem' }}>🔐</span>
                    <div>
                      <code style={{
                        background: clientAuthMethod === 'client_secret_basic' ? '#f59e0b' : '#f3f4f6',
                        color: clientAuthMethod === 'client_secret_basic' ? 'white' : '#374151',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>Client Secret Basic</code>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                        HTTP Basic Auth header
                      </span>
                    </div>
                  </div>
                  
                  <div style={{
                    background: clientAuthMethod === 'client_secret_jwt' ? '#fef3c7' : '#f9fafb',
                    border: clientAuthMethod === 'client_secret_jwt' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1rem' }}>🏆</span>
                    <div>
                      <code style={{
                        background: clientAuthMethod === 'client_secret_jwt' ? '#f59e0b' : '#f3f4f6',
                        color: clientAuthMethod === 'client_secret_jwt' ? 'white' : '#374151',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>Client Secret JWT</code>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                        JWT signed with secret (HS256)
                      </span>
                    </div>
                  </div>
                  
                  <div style={{
                    background: clientAuthMethod === 'private_key_jwt' ? '#fef3c7' : '#f9fafb',
                    border: clientAuthMethod === 'private_key_jwt' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1rem' }}>🔒</span>
                    <div>
                      <code style={{
                        background: clientAuthMethod === 'private_key_jwt' ? '#f59e0b' : '#f3f4f6',
                        color: clientAuthMethod === 'private_key_jwt' ? 'white' : '#374151',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>Private Key JWT</code>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                        JWT signed with private key (RS256)
                      </span>
                    </div>
                  </div>
                  
                  <div style={{
                    background: clientAuthMethod === 'none' ? '#fef3c7' : '#f9fafb',
                    border: clientAuthMethod === 'none' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1rem' }}>⚠️</span>
                    <div>
                      <code style={{
                        background: clientAuthMethod === 'none' ? '#f59e0b' : '#f3f4f6',
                        color: clientAuthMethod === 'none' ? 'white' : '#374151',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>None</code>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                        No client authentication
                      </span>
                    </div>
                  </div>
                  </div>
                </CollapsibleSection>
              </div>
            </FormField>
          </div>

          {clientAuthMethod === 'private_key_jwt' && (
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              border: '2px solid #10b981',
              borderRadius: '12px',
              padding: '1.5rem',
              marginTop: '1rem',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  background: '#10b981',
                  borderRadius: '50%',
                  width: '2.5rem',
                  height: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                }}>
                  <FiKey size={18} color="white" />
                </div>
                <div>
                  <h3 style={{
                    margin: '0',
                    color: '#065f46',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    textShadow: '0 1px 2px rgba(6, 95, 70, 0.1)'
                  }}>
                    🔑 Private Key Configuration
                  </h3>
                  <p style={{
                    margin: '0.25rem 0 0 0',
                    color: '#047857',
                fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    Required for Private Key JWT authentication
                  </p>
                </div>
              </div>

              {/* Authentication Method Selection */}
              <FormField>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#065f46', fontSize: '1rem' }}>Authentication Method</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* JWKS Endpoint Option */}
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.75rem', 
                      cursor: 'pointer',
                      padding: '1rem',
                      border: useJwksEndpoint ? '2px solid #059669' : '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      backgroundColor: useJwksEndpoint ? '#f0fdf4' : 'white',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="radio"
                        name="authMethod"
                        value="jwks"
                        checked={useJwksEndpoint}
                        onChange={() => setUseJwksEndpoint(true)}
                        style={{ margin: 0, cursor: 'pointer', marginTop: '0.125rem' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#065f46', fontWeight: '600', marginBottom: '0.5rem' }}>
                          Use JWKS Endpoint (Recommended)
                        </div>
                        <div style={{ color: '#047857', fontSize: '0.875rem', lineHeight: '1.4' }}>
                          PingOne will fetch the public key from your JWKS endpoint. No private key upload needed.
                          <br/><br/>
                          <strong>🌐 Public URL Required:</strong> PingOne needs to access your JWKS endpoint from their servers, so it must be publicly accessible (not localhost).
                        </div>
                      </div>
                    </label>
                
                {useJwksEndpoint && (
                  <div style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                    {/* JWKS Endpoint URL Display */}
                    <div style={{ marginBottom: '1rem' }}>
                      <FormLabel style={{ color: '#065f46', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                        Your JWKS Endpoint URL:
                      </FormLabel>
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.9)', 
                        border: '1px solid rgba(16, 185, 129, 0.3)', 
                        borderRadius: '6px', 
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}>
                        <code style={{ 
                          color: '#047857', 
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          wordBreak: 'break-all',
                          flex: 1,
                          marginRight: '0.5rem'
                        }}>
                          https://oauth-playground.vercel.app/jwks
                        </code>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText('https://oauth-playground.vercel.app/jwks');
                              showFlowSuccess('📋 JWKS Endpoint URL copied to clipboard!');
                            } catch (error) {
                              console.error('Failed to copy JWKS URL:', error);
                              showFlowError('Failed to copy JWKS URL to clipboard');
                            }
                          }}
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexShrink: 0
                          }}
                          title="Copy JWKS Endpoint URL"
                        >
                          <FiCopy size={14} />
                          Copy
                        </button>
                      </div>
                    </div>

                    {/* PingOne Configuration Instructions */}
                    <div style={{ 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      border: '1px solid rgba(16, 185, 129, 0.3)', 
                      borderRadius: '6px', 
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      color: '#047857'
                    }}>
                      <strong>💡 PingOne Configuration Steps:</strong><br/>
                      1. Set "Token Endpoint Authentication Method" to "Private Key JWT"<br/>
                      2. Set "JWKS URL" to: <code style={{ background: 'rgba(255,255,255,0.8)', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>https://oauth-playground.vercel.app/jwks</code><br/>
                      3. Leave "Private Key" field empty in PingOne<br/>
                      4. Save your PingOne application configuration<br/><br/>
                      <strong>🔧 Need to convert a private key to JWKS format?</strong><br/>
                      Use the <strong>JWT Generator → JWKS</strong> tab to convert your private key to the correct JWKS format for PingOne.
                    </div>
                  </div>
                )}
                
                {/* Configuration Warning */}
                {useJwksEndpoint && clientAuthMethod === 'private_key_jwt' && !privateKey && (
                  <div style={{ 
                    marginLeft: '1.5rem', 
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '6px'
                  }}>
                    <div style={{ 
                      color: '#92400e', 
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      ⚠️ Configuration Mismatch
                    </div>
                    <div style={{ 
                      color: '#a16207', 
                      fontSize: '0.8rem',
                      lineHeight: '1.4'
                    }}>
                      You have selected "Private Key JWT" authentication method with "Use JWKS Endpoint" mode, but no private key is available for signing the JWT assertion.
                      <br/><br/>
                      <strong>To fix this:</strong><br/>
                      • Switch to "Upload Private Key" mode and generate a private key, OR<br/>
                      • Change authentication method to "Client Secret Post" or "Client Secret Basic"
                    </div>
                  </div>
                )}
              </FormField>

                    {/* Private Key Upload Option */}
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.75rem', 
                      cursor: 'pointer',
                      padding: '1rem',
                      border: !useJwksEndpoint ? '2px solid #059669' : '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      backgroundColor: !useJwksEndpoint ? '#f0fdf4' : 'white',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="radio"
                        name="authMethod"
                        value="privateKey"
                        checked={!useJwksEndpoint}
                        onChange={() => setUseJwksEndpoint(false)}
                        style={{ margin: 0, cursor: 'pointer', marginTop: '0.125rem' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#065f46', fontWeight: '600', marginBottom: '0.5rem' }}>
                          Upload Private Key
                        </div>
                        <div style={{ color: '#047857', fontSize: '0.875rem', lineHeight: '1.4' }}>
                          Upload the private key directly to PingOne. Copy the key from below.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </FormField>

              {!useJwksEndpoint && (
              <FormField>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <FormLabel style={{ color: '#065f46', fontWeight: '600' }}>Private Key (PEM Format) *</FormLabel>
                  <button
                    type="button"
                    onClick={generatePrivateKey}
                    disabled={isGeneratingKey}
                    style={{
                      background: isGeneratingKey ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: isGeneratingKey ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                    }}
                onMouseEnter={(e) => {
                  if (!isGeneratingKey) {
                    (e.target as HTMLButtonElement).style.background = '#059669';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    (e.target as HTMLButtonElement).style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isGeneratingKey) {
                    (e.target as HTMLButtonElement).style.background = '#10b981';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.target as HTMLButtonElement).style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
                  }
                }}
                  >
                    {isGeneratingKey ? (
                      <>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        Generating...
                </>
              ) : (
                <>
                        <FiKey size={14} />
                        Generate Key
                </>
              )}
            </button>
          </div>
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC..."
                    style={{
                      width: '100%',
                      height: '120px',
                      padding: '1rem',
                      border: '2px solid #10b981',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
                      resize: 'vertical',
                      backgroundColor: 'white',
                fontWeight: '500',
                      color: '#065f46',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
                      transition: 'all 0.2s ease',
                      paddingRight: showPrivateKey ? '6rem' : '4rem'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#059669';
                      e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.25)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#10b981';
                      e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.15)';
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '1rem',
                      background: '#10b981',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: 'white',
                display: 'flex',
                alignItems: 'center',
                      justifyContent: 'center',
                      width: '2rem',
                      height: '2rem',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#059669';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#10b981';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {showPrivateKey ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                  
                  {/* Copy Private Key Button */}
                  {privateKey && (
                    <button
                      type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(privateKey);
                            showFlowSuccess('🔑 Private Key copied! Paste this into PingOne\'s "Private Key" field.');
                          } catch (error) {
                            console.error('Failed to copy private key:', error);
                            showFlowError('Failed to copy private key to clipboard');
                          }
                        }}
                      style={{
                        position: 'absolute',
                        right: '3.5rem',
                        top: '1rem',
                        background: '#3b82f6',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2rem',
                        height: '2rem',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#2563eb';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#3b82f6';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Copy Private Key"
                    >
                      <FiCopy size={16} />
                    </button>
                  )}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#047857',
                  marginTop: '0.75rem',
                  fontWeight: '500',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <strong>💡 PEM Format Requirements:</strong><br/>
                  • Must include <code style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>-----BEGIN PRIVATE KEY-----</code> header<br/>
                  • Must include <code style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>-----END PRIVATE KEY-----</code> footer<br/>
                  • Used for RS256 JWT signing
                </div>
              </FormField>
              )}
            </div>
          )}

        </div>
      ),
      canExecute: Boolean(
        credentials.environmentId &&
        credentials.clientId &&
        (clientAuthMethod === 'private_key_jwt' && 
         (useJwksEndpoint ? jwksUrl.trim() : privateKey.trim()) ||
         clientAuthMethod !== 'private_key_jwt' && credentials.clientSecret)
      ),
      completed: Boolean(
        credentials.environmentId &&
        credentials.clientId &&
        (clientAuthMethod === 'private_key_jwt' && 
         (useJwksEndpoint ? jwksUrl.trim() : privateKey.trim()) ||
         clientAuthMethod !== 'private_key_jwt' && credentials.clientSecret)
      ),
      execute: generateAuthorizationUrl,
      hideDefaultButton: true, // Hide Sign On button for Worker Tokens (no user interaction needed)
      customButtons: [
        {
          id: 'save-credentials',
          label: 'Save Credentials',
          onClick: saveCredentials,
          disabled: isLoading || !credentials.environmentId || !credentials.clientId,
          loading: isLoading,
          icon: <FiSettings />,
          variant: 'primary' as const
        }
      ]
    },
    {
      id: 'request-token',
      title: 'Request Worker Token',
      description: 'Obtain access token using client credentials grant',
      category: 'token-exchange' as const,
      canExecute: !!credentials.environmentId && !!credentials.clientId && 
        (clientAuthMethod === 'private_key_jwt' && (useJwksEndpoint || !!privateKey) ||
         clientAuthMethod !== 'private_key_jwt' && !!credentials.clientSecret),
      completed: !!tokens?.access_token,
      execute: requestAccessToken,
      content: (
        <div>
          {/* API Call Information */}
          <div style={{ 
            background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
            border: '1px solid #0ea5e9',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#0369a1', fontSize: '1.1rem', fontWeight: '600' }}>
              🔧 API Call Details
            </h4>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {/* Token Endpoint */}
              <div>
                <strong style={{ color: '#0369a1', fontSize: '0.9rem' }}>Token Endpoint:</strong>
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.8)', 
                  border: '1px solid rgba(3, 105, 161, 0.2)', 
                  borderRadius: '4px', 
                  padding: '0.5rem',
                  marginTop: '0.25rem',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  color: '#0369a1',
                  wordBreak: 'break-all'
                }}>
                  https://auth.pingone.com/{credentials.environmentId || '[Environment ID]'}/as/token
                </div>
              </div>

              {/* Authentication Method */}
              <div>
                <strong style={{ color: '#0369a1', fontSize: '0.9rem' }}>Authentication Method:</strong>
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.8)', 
                  border: '1px solid rgba(3, 105, 161, 0.2)', 
                  borderRadius: '4px', 
                  padding: '0.5rem',
                  marginTop: '0.25rem',
                  fontSize: '0.85rem',
                  color: '#0369a1'
                }}>
                  {clientAuthMethod === 'client_secret_post' && '📤 Client Secret Post (Secret in request body)'}
                  {clientAuthMethod === 'client_secret_basic' && '🔐 Client Secret Basic (HTTP Basic Auth header)'}
                  {clientAuthMethod === 'client_secret_jwt' && '🏆 Client Secret JWT (JWT signed with secret HS256)'}
                  {clientAuthMethod === 'private_key_jwt' && '🔒 Private Key JWT (JWT signed with private key RS256)'}
                </div>
              </div>

              {/* Request Parameters */}
              <div>
                <strong style={{ color: '#0369a1', fontSize: '0.9rem' }}>Request Parameters:</strong>
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.8)', 
                  border: '1px solid rgba(3, 105, 161, 0.2)', 
                  borderRadius: '4px', 
                  padding: '0.75rem',
                  marginTop: '0.25rem',
                  fontSize: '0.85rem',
                  color: '#0369a1'
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>grant_type:</strong> client_credentials
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>client_id:</strong> {credentials.clientId || '[Client ID]'}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>scope:</strong> {credentials.scopes || 'openid'}
                  </div>
                  {clientAuthMethod === 'client_secret_post' && (
                    <div>
                      <strong>client_secret:</strong> {credentials.clientSecret ? '••••••••' : '[Client Secret]'}
                    </div>
                  )}
                  {clientAuthMethod === 'client_secret_jwt' && (
                    <div>
                      <strong>client_assertion_type:</strong> urn:ietf:params:oauth:client-assertion-type:jwt-bearer<br/>
                      <strong>client_assertion:</strong> [JWT signed with client secret]
                    </div>
                  )}
                  {clientAuthMethod === 'private_key_jwt' && (
                    <div>
                      <strong>client_assertion_type:</strong> urn:ietf:params:oauth:client-assertion-type:jwt-bearer<br/>
                      <strong>client_assertion:</strong> [JWT signed with private key]
                    </div>
                  )}
                </div>
              </div>

              {/* HTTP Method */}
              <div>
                <strong style={{ color: '#0369a1', fontSize: '0.9rem' }}>HTTP Method:</strong>
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.8)', 
                  border: '1px solid rgba(3, 105, 161, 0.2)', 
                  borderRadius: '4px', 
                  padding: '0.5rem',
                  marginTop: '0.25rem',
                  fontSize: '0.85rem',
                  color: '#0369a1'
                }}>
                  POST
                </div>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid rgba(16, 185, 129, 0.3)', 
            borderRadius: '8px', 
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <h5 style={{ margin: '0 0 0.75rem 0', color: '#047857', fontSize: '1rem', fontWeight: '600' }}>
              🚀 What Happens When You Click "Request Token"
            </h5>
            <ol style={{ margin: '0', paddingLeft: '1.25rem', color: '#047857', fontSize: '0.875rem', lineHeight: '1.6' }}>
              <li>Your credentials are validated and formatted according to the selected authentication method</li>
              <li>A POST request is sent to PingOne's token endpoint</li>
              <li>PingOne validates your client credentials and authentication method</li>
              <li>If successful, PingOne returns an access token with the requested scopes</li>
              <li>The token is displayed and can be used to call PingOne Management API endpoints</li>
            </ol>
          </div>

          {/* Token Results (if available) */}
          {tokens && (
        <div style={{ marginTop: '1rem' }}>
          {/* Success Header */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
          }}>
            <FiCheckCircle size={24} />
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
                Tokens Received Successfully!
              </h3>
              <p style={{ margin: '0', opacity: '0.9', fontSize: '0.95rem' }}>
                Worker token is ready for use with PingOne Management API
              </p>
            </div>
          </div>

          {/* Token Display Section */}
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              color: '#495057',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              <FiKey size={16} />
              Received Tokens
            </div>

            {/* Access Token Card */}
            <div style={{
              background: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '0.375rem',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}>
                <h4 style={{ margin: '0', fontSize: '1rem', fontWeight: '600', color: '#495057' }}>
                  Access Token:
                </h4>
                <button
                  onClick={() => handleCopyToken(tokens.access_token, 'Access Token')}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <FiCopy size={14} />
                  Copy
                </button>
              </div>
              <TokenSurface
                hasToken={true}
                scrollable
                aria-label="Access Token"
              >
                <div style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap'
                }}>
                  {tokens.access_token}
                </div>
              </TokenSurface>
            </div>

            {/* Token Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '1rem'
            }}>
              <div style={{
                background: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '0.375rem',
                padding: '0.75rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6c757d', marginBottom: '0.25rem' }}>
                  Token Type
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#495057' }}>
                  {tokens.token_type || 'Bearer'}
                </div>
              </div>
              <div style={{
                background: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '0.375rem',
                padding: '0.75rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6c757d', marginBottom: '0.25rem' }}>
                  Expires In
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#495057' }}>
                  {tokens.expires_in ? `${tokens.expires_in} seconds` : 'N/A'}
                </div>
              </div>
              <div style={{
                background: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '0.375rem',
                padding: '0.75rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6c757d', marginBottom: '0.25rem' }}>
                  Scope
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#495057' }}>
                  {tokens.scope || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            marginTop: '1.5rem'
          }}>
            <button
              onClick={() => handleCopyToken(tokens.access_token, 'Access Token')}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <FiCopy size={16} />
              Copy Access Token
            </button>
            <button
              onClick={navigateToTokenManagement}
              disabled={!tokens?.access_token}
              style={{
                background: tokens?.access_token 
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                  : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: tokens?.access_token ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: tokens?.access_token 
                  ? '0 4px 15px rgba(139, 92, 246, 0.3)'
                  : '0 2px 4px rgba(156, 163, 175, 0.3)',
                opacity: tokens?.access_token ? 1 : 0.7
              }}
              onMouseOver={(e) => {
                if (tokens?.access_token) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <FiDownload size={16} />
              Decode Token
            </button>
          </div>
        </div>
          )}
        </div>
      )
    },
    {
      id: 'introspect-token',
      title: 'Introspect Token',
      description: 'Validate and introspect the worker token',
      category: 'validation' as const,
      canExecute: !!tokens?.access_token,
      completed: !!introspection?.active,
      execute: showIntrospectionUrl,
      buttonText: 'Introspect Token',
      content: (
        <div>
          {!introspection ? (
            <div style={{ 
              background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
              border: '1px solid #0ea5e9',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#0369a1', fontSize: '1.1rem', fontWeight: '600' }}>
                🔍 Token Introspection
              </h4>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <h5 style={{ margin: '0 0 0.75rem 0', color: '#0369a1', fontSize: '1rem', fontWeight: '600' }}>
                  What is Token Introspection?
                </h5>
                <p style={{ margin: '0 0 0.75rem 0', color: '#0369a1', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Token introspection is an OAuth 2.0 mechanism (RFC 7662) that allows resource servers to query the authorization server 
                  to determine the active state and metadata of an access token. This is crucial for security and validation.
                </p>
                
                <div style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(3, 105, 161, 0.2)',
                  borderRadius: '6px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  color: '#0369a1'
                }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Key Benefits:</strong>
                  <ul style={{ margin: '0', paddingLeft: '1.25rem' }}>
                    <li><strong>Security Validation:</strong> Verify the token is still active and hasn't been revoked</li>
                    <li><strong>Scope Verification:</strong> Confirm what permissions the token actually has</li>
                    <li><strong>Token Metadata:</strong> Get detailed information about when it was issued, expires, and who it belongs to</li>
                    <li><strong>Audit Trail:</strong> Track token usage and validate client identity</li>
                  </ul>
                </div>
              </div>
              
              <p style={{ margin: '0 0 1rem 0', color: '#0369a1', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Click "Introspect Token" to validate your worker token and see its complete contents and metadata.
              </p>
              <div style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(3, 105, 161, 0.3)',
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.875rem',
                color: '#0369a1'
              }}>
                <strong>What this will reveal:</strong>
                <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: '0' }}>
                  <li><strong>JWT Claims:</strong> iss (issuer), sub (subject), aud (audience), exp (expiration), iat (issued at)</li>
                  <li><strong>Token Metadata:</strong> Client ID, scope, token type, JWT ID (jti)</li>
                  <li><strong>Timing Info:</strong> When issued, expires, and becomes valid (nbf)</li>
                  <li><strong>User Claims:</strong> Username, email, name (if applicable)</li>
                  <li><strong>Complete Response:</strong> Full JSON introspection data</li>
                </ul>
              </div>
            </div>
          ) : (
        <TokenDisplay>
          <h4>🔍 Token Introspection Results</h4>
          <TokenInfo>
            <TokenItem>
              <TokenLabel>Active</TokenLabel>
              <TokenValue>{introspection.active ? '✅ Yes' : '❌ No'}</TokenValue>
            </TokenItem>
            <TokenItem>
              <TokenLabel>Token Type</TokenLabel>
              <TokenValue>{introspection.token_type || 'N/A'}</TokenValue>
            </TokenItem>
            <TokenItem>
              <TokenLabel>Client ID</TokenLabel>
              <TokenValue>{introspection.client_id || introspection.sub || 'N/A'}</TokenValue>
            </TokenItem>
            <TokenItem>
              <TokenLabel>Subject (sub)</TokenLabel>
              <TokenValue>{introspection.sub || 'N/A'}</TokenValue>
            </TokenItem>
            <TokenItem>
              <TokenLabel>Scope</TokenLabel>
              <TokenValue>{introspection.scope || 'N/A'}</TokenValue>
            </TokenItem>
            <TokenItem>
              <TokenLabel>Issuer (iss)</TokenLabel>
              <TokenValue>{introspection.iss || 'N/A'}</TokenValue>
            </TokenItem>
            <TokenItem>
              <TokenLabel>Audience (aud)</TokenLabel>
              <TokenValue>{introspection.aud || 'N/A'}</TokenValue>
            </TokenItem>
            <TokenItem>
              <TokenLabel>Issued At (iat)</TokenLabel>
              <TokenValue>{introspection.iat ? new Date(introspection.iat * 1000).toLocaleString() : 'N/A'}</TokenValue>
            </TokenItem>
            <TokenItem>
              <TokenLabel>Expires At (exp)</TokenLabel>
              <TokenValue>{introspection.exp ? new Date(introspection.exp * 1000).toLocaleString() : 'N/A'}</TokenValue>
            </TokenItem>
            <TokenItem>
              <TokenLabel>Not Before (nbf)</TokenLabel>
              <TokenValue>{introspection.nbf ? new Date(introspection.nbf * 1000).toLocaleString() : 'N/A'}</TokenValue>
            </TokenItem>
            <TokenItem>
              <TokenLabel>JWT ID (jti)</TokenLabel>
              <TokenValue>{introspection.jti || 'N/A'}</TokenValue>
            </TokenItem>
          </TokenInfo>
          
          {/* Additional Claims Section */}
          {introspection.username && (
            <div style={{ marginTop: '1rem' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '600' }}>Additional Claims</h5>
              <TokenInfo>
                <TokenItem>
                  <TokenLabel>Username</TokenLabel>
                  <TokenValue>{introspection.username}</TokenValue>
                </TokenItem>
                {introspection.given_name && (
                  <TokenItem>
                    <TokenLabel>Given Name</TokenLabel>
                    <TokenValue>{introspection.given_name}</TokenValue>
                  </TokenItem>
                )}
                {introspection.family_name && (
                  <TokenItem>
                    <TokenLabel>Family Name</TokenLabel>
                    <TokenValue>{introspection.family_name}</TokenValue>
                  </TokenItem>
                )}
                {introspection.email && (
                  <TokenItem>
                    <TokenLabel>Email</TokenLabel>
                    <TokenValue>{introspection.email}</TokenValue>
                  </TokenItem>
                )}
              </TokenInfo>
            </div>
          )}
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: '600' }}>View Full Response</summary>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '4px', 
              overflow: 'auto',
              fontSize: '0.875rem',
              marginTop: '0.5rem'
            }}>
              {JSON.stringify(introspection, null, 2)}
            </pre>
          </details>
        </TokenDisplay>
          )}
        </div>
      )
    }
  ], [credentials, clientAuthMethod, privateKey, showSecret, showPrivateKey, tokens, introspection, saveCredentials, requestAccessToken, introspectToken, copyToClipboard]);

  return (
    <Container>
      <Header>
        <Title>🚀 PingOne Worker Token V3</Title>
        <Subtitle>Machine-to-machine authentication using client credentials</Subtitle>
        <InfoBox>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.2rem' }}>🤖 What is a Worker Token?</h3>
            <p style={{ margin: '0 0 1rem 0', lineHeight: '1.5' }}>
              A Worker Token is an OAuth 2.0 Client Credentials flow that allows your application to authenticate 
              directly with PingOne APIs without any user interaction. It's perfect for server-to-server communication, 
              background services, and automated processes.
            </p>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.2rem' }}>🎯 When to Use Worker Tokens</h3>
            <ul style={{ margin: '0', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
              <li><strong>Background Services:</strong> Automated data synchronization, ETL processes</li>
              <li><strong>API Integration:</strong> Server-to-server communication between applications</li>
              <li><strong>Monitoring & Alerting:</strong> Health checks, system monitoring, automated reports</li>
              <li><strong>Workflow Automation:</strong> CI/CD pipelines, deployment automation</li>
              <li><strong>Data Management:</strong> Bulk user operations, directory synchronization</li>
            </ul>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.2rem' }}>⚠️ Security Considerations</h3>
            <ul style={{ margin: '0', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
              <li><strong>Broad Permissions:</strong> Worker Tokens can access all PingOne Management API endpoints</li>
              <li><strong>Secret Storage:</strong> Client secrets must be stored securely (environment variables, key vaults)</li>
              <li><strong>Limited Scope:</strong> Use only for trusted applications and services</li>
              <li><strong>Rotation:</strong> Regularly rotate client secrets for enhanced security</li>
            </ul>
          </div>

          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.2rem' }}>📚 Documentation</h3>
            <p style={{ margin: '0', lineHeight: '1.5' }}>
              <a href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#authentication" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style={{ color: '#fff', textDecoration: 'underline' }}>
                PingOne Management API Documentation
              </a> | 
              <a href="https://docs.pingidentity.com/bundle/pingone-sso/page/authentication/client-credentials-flow.html" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style={{ color: '#fff', textDecoration: 'underline' }}>
                Client Credentials Flow Guide
              </a>
            </p>
          </div>
        </InfoBox>
      </Header>

      <CollapsibleSection title="⚙️ Worker Token Flow Details & Setup Guide">
        <div style={{ padding: '0.75rem 0' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Technical Overview */}
            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: '8px', 
              padding: '1rem'
            }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#495057', fontSize: '0.95rem' }}>🔧 Technical Overview</h4>
              <div style={{ fontSize: '0.875rem', color: '#495057', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}>
                  <strong>OAuth 2.0 Grant Type:</strong> <code style={{ background: '#e9ecef', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>client_credentials</code>
                </p>
                <p style={{ margin: '0 0 0.5rem 0' }}>
                  <strong>Token Endpoint:</strong> <code style={{ background: '#e9ecef', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>https://auth.pingone.com/{`{environmentId}`}/as/token</code>
                </p>
                <p style={{ margin: '0' }}>
                  <strong>Use Case:</strong> Server-to-server authentication with no user interaction required
                </p>
              </div>
            </div>

            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: '8px', 
              padding: '1rem'
            }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#495057', fontSize: '0.95rem' }}>Step 1: Create Worker Application</h4>
              <ol style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.5', fontSize: '0.875rem' }}>
                <li>Log in to <strong>PingOne Admin Console</strong></li>
                <li>Navigate to <strong>Applications</strong> → <strong>Applications</strong></li>
                <li>Click <strong>"Add Application"</strong></li>
                <li>Select <strong>"Worker Application"</strong></li>
                <li>Enter name: <code style={{ background: '#e9ecef', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>OAuth Playground Worker</code></li>
                <li>Click <strong>"Save"</strong></li>
              </ol>
            </div>

            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: '8px', 
              padding: '1rem'
            }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#495057', fontSize: '0.95rem' }}>Step 2: Configure Client Credentials</h4>
              <ol style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.5', fontSize: '0.875rem' }}>
                <li>Go to <strong>"Configuration"</strong> tab in your Worker Application</li>
                <li>Copy the <strong>Client ID</strong> (UUID format)</li>
                <li>Generate <strong>Client Secret</strong>:
                  <ul style={{ margin: '0.25rem 0', paddingLeft: '1rem' }}>
                    <li>Click <strong>"Generate Secret"</strong></li>
                    <li>Copy immediately (won't be shown again)</li>
                    <li>Store securely</li>
                  </ul>
                </li>
                <li>Note <strong>Environment ID</strong> from URL or settings</li>
              </ol>
            </div>

            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: '8px', 
                    padding: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', color: '#495057', fontSize: '0.95rem' }}>Step 3: Configure Scopes</h4>
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                      <p style={{ margin: '0 0 0.5rem 0' }}>In <strong>"Scopes"</strong> tab, add required scopes:</p>
                      <ul style={{ margin: '0.25rem 0 0.75rem 0', paddingLeft: '1.25rem' }}>
                        <li><code style={{ background: '#e9ecef', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>openid</code> - OpenID Connect (required)</li>
                        <li><code style={{ background: '#e9ecef', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>profile</code> - User profile access</li>
                        <li><code style={{ background: '#e9ecef', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>email</code> - User email access</li>
                        <li><code style={{ background: '#e9ecef', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>address</code> - User address access</li>
                        <li><code style={{ background: '#e9ecef', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>phone</code> - User phone access</li>
                        <li><code style={{ background: '#e9ecef', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>offline_access</code> - Refresh token access</li>
                </ul>
                      <p style={{ margin: '0', fontSize: '0.8rem', color: '#6c757d' }}>
                        <strong>Note:</strong> <code style={{ background: '#e9ecef', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>openid</code> is required for all Worker Token applications
                      </p>
            </div>
          </div>

          <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: '8px', 
              padding: '1rem'
            }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: '#495057', fontSize: '0.95rem' }}>Step 4: Choose Authentication Method</h4>
              <p style={{ margin: '0 0 0.75rem 0', lineHeight: '1.5', fontSize: '0.875rem' }}>
                Select Token Endpoint Authentication Method matching your PingOne configuration:
              </p>
              <ul style={{ margin: '0 0 0.75rem 0', paddingLeft: '1.25rem', lineHeight: '1.5', fontSize: '0.875rem' }}>
                <li><strong>Client Secret Post</strong> 📤 - Secret in POST body (default)</li>
                <li><strong>Client Secret Basic</strong> 🔐 - HTTP Basic Auth header</li>
                <li><strong>Client Secret JWT</strong> 🏆 - JWT signed with secret (HS256)</li>
                <li><strong>Private Key JWT</strong> 🔒 - JWT signed with private key (RS256)</li>
              </ul>
              <p style={{ margin: '0', fontSize: '0.8rem', color: '#6c757d' }}>
                <strong>Important:</strong> Must match your PingOne application's "Token Endpoint Authentication Method" setting.
              </p>
            </div>
          </div>

          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: '#fef3c7', 
            border: '1px solid #f59e0b', 
            borderRadius: '8px' 
          }}>
            <strong style={{ color: '#92400e', display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem' }}>🔒 Security Best Practices:</strong>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#92400e', lineHeight: '1.5', fontSize: '0.875rem' }}>
              <li>Store client secrets securely (never in source code)</li>
              <li>Use environment variables for production deployments</li>
              <li>Rotate client secrets regularly</li>
              <li>Monitor worker application usage</li>
              <li>Limit scopes to only what's needed</li>
              <li>Use HTTPS for all API communications</li>
              <li>Implement proper error handling and logging</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      <EnhancedStepFlowV2
        steps={steps}
        title="🚀 Worker Token Flow (V3)"
        persistKey="worker-token-v3"
        autoAdvance={false}
        showDebugInfo={false}
        allowStepJumping={true}
        initialStepIndex={stepManager.currentStepIndex}
        onStepChange={handleStepChange}
        onStepComplete={(stepId, result) => {
          logger.auth('WorkerTokenFlowV3', 'Step completed', { stepId, result });
        }}
      />

      {/* Flow Control Actions */}
      <FlowControlSection>
        <FlowControlTitle>
          ⚙️ Flow Control Actions
        </FlowControlTitle>
        <FlowControlButtons>
          <FlowControlButton 
            className="clear"
            onClick={() => setShowClearCredentialsModal(true)}
          >
            🧹 Clear Credentials
          </FlowControlButton>
          <FlowControlButton 
            className="reset"
            onClick={resetFlow}
            disabled={isLoading}
            style={{
              background: isLoading ? '#9ca3af' : undefined,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            <FiRefreshCw style={{ 
                animation: isLoading ? 'spin 1s linear infinite' : 'none',
                marginRight: '0.5rem'
            }} />
            {isLoading ? 'Resetting...' : 'Reset Flow'}
          </FlowControlButton>
        </FlowControlButtons>
      </FlowControlSection>

      {/* Clear Credentials Modal */}
      <ConfirmationModal
        isOpen={showClearCredentialsModal}
        onClose={() => setShowClearCredentialsModal(false)}
        onConfirm={clearCredentials}
        title="Clear Worker Token Credentials"
        message="Are you sure you want to clear all saved credentials? This will remove your Environment ID, Client ID, Client Secret, and other configuration data."
        confirmText="Clear Credentials"
        cancelText="Cancel"
        variant="danger"
        isLoading={isClearingCredentials}
      />

      {/* Authorization URL Modal */}
      {showAuthUrlModal && (
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
            background: 'white',
            borderRadius: '12px',
        padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                margin: 0,
                color: '#1f2937',
                fontSize: '1.5rem',
                fontWeight: '700'
              }}>
                🔗 Authorization URL
              </h2>
              <button
                onClick={() => setShowAuthUrlModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{
                margin: '0 0 1rem 0',
          color: '#374151',
                fontSize: '0.95rem',
                lineHeight: '1.5'
              }}>
                This is the authorization URL that would be used for user authentication. 
                <strong>Note:</strong> Worker Token flow uses client credentials directly and doesn't require user authorization.
              </p>
            </div>

            <div style={{
        background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
        <div style={{
          display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Authorization URL:
                </label>
          <button
                  onClick={() => {
                    navigator.clipboard.writeText(authUrl);
                    showFlowSuccess('📋 URL copied to clipboard!');
                  }}
            style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
              fontSize: '0.875rem',
                    cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FiCopy size={14} />
                  Copy
                </button>
              </div>
              <div style={{
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
          color: '#374151',
                wordBreak: 'break-all',
                maxHeight: '200px',
                overflow: 'auto'
        }}>
                {authUrl}
              </div>
            </div>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
              justifyContent: 'flex-end'
        }}>
          <button
                onClick={() => setShowAuthUrlModal(false)}
            style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowAuthUrlModal(false);
                  // Proceed to token request step
                  stepManager.setStep(1, 'authorization-url-generated');
                }}
              style={{ 
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Continue to Token Request
          </button>
        </div>
      </div>
        </div>
      )}

      {/* Introspection URL Modal */}
      {showIntrospectUrlModal && (
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
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                margin: 0,
                color: '#1f2937',
                fontSize: '1.5rem',
                fontWeight: '700'
              }}>
                🔍 Token Introspection URL
              </h2>
              <button
                onClick={() => setShowIntrospectUrlModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{
                margin: '0 0 1rem 0',
              color: '#374151',
                fontSize: '0.95rem',
                lineHeight: '1.5'
              }}>
                This is the introspection endpoint that will be called to validate and analyze your worker token.
              </p>
            </div>

            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Introspection Endpoint:
                </label>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(introspectUrl);
                    showFlowSuccess('📋 URL copied to clipboard!');
                  }}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FiCopy size={14} />
                  Copy
                </button>
              </div>
              <div style={{
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
                color: '#374151',
                wordBreak: 'break-all',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {introspectUrl}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowIntrospectUrlModal(false)}
              style={{ 
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowIntrospectUrlModal(false);
                  // Execute the introspection
                  introspectToken();
                }}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Execute Introspection
          </button>
        </div>
      </div>
        </div>
      )}
    </Container>
  );
};

export default WorkerTokenFlowV3;