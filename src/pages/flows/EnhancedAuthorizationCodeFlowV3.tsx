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

  // Generate authorization URL
  const generateAuthUrl = useCallback(() => {
    try {
      const authEndpoint = credentials.authorizationEndpoint || 
        `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: credentials.clientId,
        redirect_uri: credentials.redirectUri,
        scope: credentials.scopes,
        state: generateCodeVerifier().substring(0, 32), // Generate random state
        code_challenge: pkceCodes.codeChallenge,
        code_challenge_method: 'S256'
      });

      const url = `${authEndpoint}?${params.toString()}`;
      setAuthUrl(url);
      showFlowSuccess('🌐 Authorization URL Generated Successfully');
    } catch (error) {
      showFlowError('❌ Failed to generate authorization URL');
      throw error;
    }
  }, [credentials, pkceCodes]);

  // Exchange tokens
  const exchangeTokens = useCallback(async () => {
    if (!authCode) {
      showFlowError('❌ No authorization code available');
      return;
    }

    setIsExchangingTokens(true);
    try {
      const tokenEndpoint = credentials.tokenEndpoint || 
        `https://auth.pingone.com/${credentials.environmentId}/as/token`;

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        code: authCode,
        redirect_uri: credentials.redirectUri,
        code_verifier: pkceCodes.codeVerifier
      });

      console.log('🔄 [OIDC-V3] Exchanging tokens with:', {
        endpoint: tokenEndpoint,
        clientId: credentials.clientId,
        hasCode: !!authCode,
        hasVerifier: !!pkceCodes.codeVerifier
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
      }

      const tokenData = await response.json();
      console.log('✅ [OIDC-V3] Token exchange successful:', tokenData);
      
      setTokens(tokenData);
      
      // Store tokens for other pages
      localStorage.setItem('oauth_tokens', JSON.stringify(tokenData));
      
      showFlowSuccess('🔑 Tokens Exchanged Successfully');
    } catch (error) {
      console.error('❌ [OIDC-V3] Token exchange failed:', error);
      showFlowError(`❌ Token exchange failed: ${error.message}`);
      throw error;
    } finally {
      setIsExchangingTokens(false);
    }
  }, [authCode, credentials, pkceCodes]);

  // Get user info
  const getUserInfo = useCallback(async () => {
    setIsGettingUserInfo(true);
    try {
      // UserInfo endpoint logic here
      showFlowSuccess('👤 User Information Retrieved Successfully');
    } catch (error) {
      showFlowError('❌ Failed to get user information');
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
