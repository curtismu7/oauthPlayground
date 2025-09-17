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

  // Handle URL parameters for authorization code
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code) {
      console.log('🔑 [OIDC-V3] Authorization code detected:', code);
      setAuthCode(code);
      
      // Auto-advance to token exchange step (step 3 in our 5-step flow)
      if (stepManager.currentStepIndex < 3) {
        stepManager.setStep(3, 'authorization code detected');
      }
      
      showFlowSuccess('🎉 Authorization successful! You can now exchange your authorization code for tokens.');
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

      // Base parameters
      const params = new URLSearchParams({
        response_type: flowConfig.responseType || 'code',
        client_id: credentials.clientId,
        redirect_uri: credentials.redirectUri,
        scope: flowConfig.scopes || credentials.scopes,
        state: flowConfig.state || generateCodeVerifier().substring(0, 32),
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
            params.set(key, value);
          }
        });
      }

      const url = `${authEndpoint}?${params.toString()}`;
      setAuthUrl(url);
      showFlowSuccess('🌐 Authorization URL Generated Successfully with Advanced Parameters');
    } catch (error) {
      showFlowError('❌ Failed to generate authorization URL');
      throw error;
    }
  }, [credentials, pkceCodes, flowConfig]);

  // Exchange tokens with advanced client authentication and validation
  const exchangeTokens = useCallback(async () => {
    if (!authCode) {
      showFlowError('❌ No authorization code available');
      return;
    }

    setIsExchangingTokens(true);
    try {
      const tokenEndpoint = credentials.tokenEndpoint || 
        `https://auth.pingone.com/${credentials.environmentId}/as/token`;

      // Base token request parameters
      const tokenParams = {
        grant_type: flowConfig.grantType || 'authorization_code',
        client_id: credentials.clientId,
        code: authCode,
        redirect_uri: credentials.redirectUri,
        code_verifier: pkceCodes.codeVerifier
      };

      // Apply client authentication method (5 different methods from V2)
      const authenticatedRequest = applyClientAuthentication(
        tokenParams,
        credentials.clientSecret,
        flowConfig.clientAuthMethod || 'client_secret_post'
      );

      // Get security level information for current auth method
      const securityInfo = getAuthMethodSecurityLevel(flowConfig.clientAuthMethod || 'client_secret_post');
      
      console.log('🔄 [OIDC-V3] Exchanging tokens with advanced auth:', {
        endpoint: tokenEndpoint,
        clientId: credentials.clientId,
        grantType: flowConfig.grantType,
        authMethod: flowConfig.clientAuthMethod,
        securityLevel: `${securityInfo.level} - ${securityInfo.description}`,
        hasCode: !!authCode,
        hasVerifier: !!pkceCodes.codeVerifier
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: authenticatedRequest.headers,
        body: authenticatedRequest.body
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [OIDC-V3] Token exchange failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // Provide more specific error messages (V2 feature)
        if (errorText.includes('Invalid Grant') || errorText.includes('invalid_grant')) {
          throw new Error('Authorization code has expired or been used already. Please start a new OAuth flow to get a fresh authorization code.');
        } else if (errorText.includes('Client ID is required') || errorText.includes('invalid_client')) {
          throw new Error('OAuth credentials are missing or invalid. Please check your client ID and secret.');
        } else if (errorText.includes('invalid_request')) {
          throw new Error('Invalid token request. Please check your OAuth configuration parameters.');
        } else {
          throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
        }
      }

      const tokenData = await response.json();
      console.log('✅ [OIDC-V3] Token exchange successful:', tokenData);

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
      showFlowError(`❌ Token exchange failed: ${error.message}`);
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

  // Create steps using reusable components
  const steps = [
    createCredentialsStep(credentials, setCredentials, saveCredentials, 'OIDC Authorization Code Flow'),
    createPKCEStep(pkceCodes, setPkceCodes, generatePKCE),
    createAuthUrlStep(authUrl, generateAuthUrl, credentials, pkceCodes),
    createTokenExchangeStep(authCode, tokens, exchangeTokens, credentials, isExchangingTokens),
    createUserInfoStep(tokens, userInfo, getUserInfo, isGettingUserInfo)
  ];

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
    </>
  );
};

export default EnhancedAuthorizationCodeFlowV3;
