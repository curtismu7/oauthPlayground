/* eslint-disable */
// src/components/steps/CommonSteps.tsx - Reusable step components for OAuth flows

import React from 'react';
import styled from 'styled-components';
import { EnhancedFlowStep } from '../EnhancedStepFlowV2';
import { copyToClipboard } from '../../utils/clipboard';
import { getCallbackUrlForFlow } from '../../utils/callbackUrls';

// Common styled components
const FormField = styled.div`
  margin-bottom: 1 + "r"em;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.5 + "r"em;
  font-weight: 500;
  color: #374151;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.75 + "r"em;
  border: 1 + "p"x solid #d1 + "d"5 + "d"b;
  border-radius: 0.375 + "r"em;
  font-size: 0.875 + "r"em;
  
  &:focus {
    outline: none;
    border-color: #3 + "b"82 + "f"6;
    box-shadow: 0 0 0 3 + "p"x rgba(59, 130, 246, 0.1);
  }
`;

const InfoBox = styled.div<{ type: 'success' | 'error' | 'warning' | 'info' }>`
  padding: 1 + "r"em;
  border-radius: 0.5 + "r"em;
  margin: 1 + "r"em 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75 + "r"em;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background: #f0 + "f"df4;
          border: 1 + "p"x solid #bbf7 + "d"0;
          color: #166534;
        `;
      case 'error':
        return `
          background: #fef2 + "f"2;
          border: 1 + "p"x solid #fecaca;
          color: #991 + "b"1 + "b";
        `;
      case 'warning':
        return `
          background: #fffbeb;
          border: 1 + "p"x solid #fed7 + "a"a;
          color: #92400 + "e";
        `;
      case 'info':
        return `
          background: #eff6 + "f"f;
          border: 1 + "p"x solid #bfdbfe;
          color: #1 + "e"40 + "a"f;
        `;
    }
  }}
`;

const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25 + "r"em;
  padding: 0.25 + "r"em 0.5 + "r"em;
  background: #3 + "b"82 + "f"6;
  color: white;
  border: none;
  border-radius: 4 + "p"x;
  font-size: 0.75 + "r"em;
  cursor: pointer;
  transition: all 0.2 + "s";
  
  &:hover {
    background: #2563 + "e"b;
    transform: translateY(-1 + "p"x);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

  border: 2 + "p"x solid #16 + "a"34 + "a";
  border-radius: 6 + "p"x;
  padding: 0.75 + "r"em;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75 + "r"em;
  line-height: 1.4;
  word-break: break-all;
  color: #15803 + "d";
  max-height: 120 + "p"x;
  overflow-y: auto;
  box-shadow: 0 1 + "p"x 3 + "p"x rgba(22, 163, 74, 0.1);
  
  &:hover {
    border-color: #15803 + "d";
    background: #ecfdf5;
    box-shadow: 0 2 + "p"x 6 + "p"x rgba(22, 163, 74, 0.15);
  }
`;

const AuthButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5 + "r"em;
  padding: 0.75 + "r"em 1 + "r"em;
  background: #3 + "b"82 + "f"6;
  color: white;
  border: none;
  border-radius: 6 + "p"x;
  font-size: 0.875 + "r"em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2 + "s";
  
  &:hover:not(:disabled) {
    background: #2563 + "e"b;
    transform: translateY(-1 + "p"x);
    box-shadow: 0 4 + "p"x 12 + "p"x rgba(59, 130, 246, 0.4);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Common step creation functions
export interface StepCredentials {
  clientId: string;
  clientSecret: string;
  environmentId: string;
  redirectUri: string;
  scopes: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userInfoEndpoint?: string;
}

export interface PKCECodes {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * Create credentials setup step - reusable across all OAuth flows
 */
export const createCredentialsStep = (
  credentials: StepCredentials,
  setCredentials: (creds: StepCredentials) => void,
  saveCredentials: () => Promise<void>,
  flowType: string
): EnhancedFlowStep => ({
  id: 'setup-credentials',
  title: 'Setup OAuth Credentials',
  description: `Configure your PingOne OAuth application credentials for ${flowType}. These will be saved securely for future sessions.`,
  icon: <FiSettings />,
  category: 'setup',
  content: (
    <div>
      <FormField>
        <FormLabel>Environment ID</FormLabel>
        <FormInput
          type="text"
          value={credentials.environmentId}
          onChange={(e) => setCredentials({ ...credentials, environmentId: e.target.value })}
          placeholder="e.g., 12345678-1234-1234-1234-123456789012"
        />
      </FormField>
      
      <FormField>
        <FormLabel>Client ID</FormLabel>
        <FormInput
          type="text"
          value={credentials.clientId}
          onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
          placeholder="e.g., 87654321-4321-4321-4321-210987654321"
        />
      </FormField>
      
      <FormField>
        <FormLabel>Client Secret</FormLabel>
        <FormInput
          type="password"
          value={credentials.clientSecret}
          onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
          placeholder="Your client secret"
        />
      </FormField>
      
      <FormField>
        <FormLabel>Redirect URI</FormLabel>
        <FormInput
          type="url"
          value={credentials.redirectUri}
          onChange={(e) => setCredentials({ ...credentials, redirectUri: e.target.value })}
          placeholder="https://localhost:3000/callback"
        />
      </FormField>
      
      <FormField>
        <FormLabel>Scopes</FormLabel>
        <FormInput
          type="text"
          value={credentials.scopes}
          onChange={(e) => setCredentials({ ...credentials, scopes: e.target.value })}
          placeholder="profile email"
        />
      </FormField>
    </div>
  ),
  execute: async () => {
    await saveCredentials();
    return { success: true };
  },
  canExecute: (() => {
    const canExec = Boolean(
      credentials.environmentId &&
      credentials.clientId &&
      credentials.clientSecret &&
      credentials.redirectUri
    );
    console.log('🔍 [CommonSteps] Credentials canExecute check:', {
      environmentId: !!credentials.environmentId,
      clientId: !!credentials.clientId,
      clientSecret: !!credentials.clientSecret,
      redirectUri: !!credentials.redirectUri,
      canExecute: canExec
    });
    return canExec;
  })()
});

/**
 * Create PKCE generation step - reusable for flows that support PKCE
 */
export const createPKCEStep = (
  pkceCodes: PKCECodes,
  setPkceCodes: (codes: PKCECodes) => void,
  generatePKCE: () => Promise<void>
): EnhancedFlowStep => ({
  id: 'generate-pkce',
  title: 'Generate PKCE Codes',
  description: 'Generate Proof Key for Code Exchange (PKCE) codes for enhanced security.',
  icon: <FiShield />,
  category: 'security',
  content: (
    <div>
      <InfoBox type="info">
        <FiShield />
        <div>
          <strong>PKCE (Proof Key for Code Exchange)</strong>
          <br />
          PKCE provides additional security by generating a code verifier and challenge pair.
        </div>
      </InfoBox>
      
      {pkceCodes.codeVerifier && (
        <div>
          <h4 style={{ marginBottom: '1 + "r"em' }}>Generated PKCE Codes:</h4>
          
          <FormField>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5 + "r"em', marginBottom: '0.5 + "r"em' }}>
              <FormLabel style={{ margin: 0, fontWeight: 'bold' }}>Code Verifier:</FormLabel>
              <CopyButton onClick={() => copyToClipboard(pkceCodes.codeVerifier, 'Code Verifier')}>
                <FiCopy /> Copy
              </CopyButton>
            </div>
            <TokenDisplay>{pkceCodes.codeVerifier}</TokenDisplay>
          </FormField>
          
          <FormField>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5 + "r"em', marginBottom: '0.5 + "r"em' }}>
              <FormLabel style={{ margin: 0, fontWeight: 'bold' }}>Code Challenge:</FormLabel>
              <CopyButton onClick={() => copyToClipboard(pkceCodes.codeChallenge, 'Code Challenge')}>
                <FiCopy /> Copy
              </CopyButton>
            </div>
            <TokenDisplay>{pkceCodes.codeChallenge}</TokenDisplay>
          </FormField>
        </div>
      )}
    </div>
  ),
  execute: async () => {
    await generatePKCE();
    return { success: true };
  },
  canExecute: true
});

/**
 * Create authorization URL building step - reusable for flows that build auth URLs
 */
export const createAuthUrlStep = (
  authUrl: string,
  generateAuthUrl: () => void,
  credentials: StepCredentials,
  pkceCodes?: PKCECodes,
  onPopupAuth?: () => void,
  onRedirectAuth?: () => void,
  isAuthorizing?: boolean
): EnhancedFlowStep => ({
  id: 'build-auth-url',
  title: 'Build Authorization URL',
  description: 'Construct the complete authorization URL with all required OAuth parameters.',
  icon: <FiGlobe />,
  category: 'authorization',
  content: (
    <div>
      <InfoBox type="info">
        <FiGlobe />
        <div>
          <strong>Authorization URL Construction</strong>
          <br />
          Building the complete authorization URL with all required parameters.
        </div>
      </InfoBox>
      
      {isAuthorizing && (
        <InfoBox type="info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5 + "r"em' }}>
            <div className="spinner" />
            <strong>Opening authorization popup...</strong>
          </div>
        </InfoBox>
      )}
      
      {authUrl && (
        <FormField>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5 + "r"em', marginBottom: '0.5 + "r"em' }}>
            <FormLabel style={{ margin: 0, fontWeight: 'bold' }}>Generated Authorization URL:</FormLabel>
            <CopyButton onClick={() => copyToClipboard(authUrl, 'Authorization URL')}>
              <FiCopy /> Copy
            </CopyButton>
          </div>
          <TokenDisplay>{authUrl}</TokenDisplay>
        </FormField>
      )}
      
      {authUrl && (onPopupAuth || onRedirectAuth) && (
        <div style={{ marginTop: '1 + "r"em' }}>
          <h4 style={{ marginBottom: '1 + "r"em' }}>🔐 Authorization Methods:</h4>
          <div style={{ display: 'flex', gap: '1 + "r"em', flexWrap: 'wrap' }}>
            {onPopupAuth && (
              <AuthButton 
                onClick={onPopupAuth}
                disabled={isAuthorizing}
                style={{ backgroundColor: '#3 + "b"82 + "f"6' }}
              >
                <FiGlobe /> Popup Authorization
              </AuthButton>
            )}
            {onRedirectAuth && (
              <AuthButton 
                onClick={onRedirectAuth}
                disabled={isAuthorizing}
                style={{ backgroundColor: '#10 + "b"981' }}
              >
                <FiRefreshCw /> Full Redirect
              </AuthButton>
            )}
          </div>
          <div style={{ marginTop: '0.5 + "r"em', fontSize: '0.85 + "e"m', color: '#6 + "b"7280' }}>
            <strong>Popup:</strong> Opens in new window, returns to this page automatically.<br/>
            <strong>Redirect:</strong> Navigates away from this page, returns after authorization.
          </div>
        </div>
      )}
    </div>
  ),
  execute: async () => {
    generateAuthUrl();
    return { success: true };
  },
  canExecute: Boolean(
    credentials.environmentId &&
    credentials.clientId &&
    credentials.redirectUri &&
    (!pkceCodes || (pkceCodes.codeVerifier && pkceCodes.codeChallenge))
  )
});

/**
 * Create token exchange step - reusable for flows that exchange codes for tokens
 */
export const createTokenExchangeStep = (
  authCode: string,
  tokens: unknown,
  exchangeTokens: () => Promise<void>,
  credentials: StepCredentials,
  isExchanging: boolean = false
): EnhancedFlowStep => ({
  id: 'exchange-tokens',
  title: 'Exchange Code for Tokens',
  description: 'Make a secure POST request to exchange the authorization code for access and refresh tokens.',
  icon: <FiKey />,
  category: 'token-exchange',
  content: (
    <div>
      <InfoBox type="info">
        <FiKey />
        <div>
          <strong>Token Exchange</strong>
          <br />
          Exchange your authorization code for access tokens.
        </div>
      </InfoBox>
      
      {isExchanging && (
        <InfoBox type="info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5 + "r"em' }}>
            <div className="spinner" />
            <strong>Exchanging authorization code for tokens...</strong>
          </div>
        </InfoBox>
      )}
      
      {tokens && (
        <InfoBox type="success">
          <FiCheckCircle />
          <div>
            <strong>✅ Tokens Received Successfully!</strong>
            <br />
            <div style={{ marginTop: '1 + "r"em', display: 'grid', gap: '0.5 + "r"em', fontSize: '0.9 + "e"m' }}>
              <div>✅ Access Token: <strong style={{ color: '#1 + "e"40 + "a"f' }}>{tokens.access_token ? 'Received' : 'Missing'}</strong></div>
              <div>✅ Refresh Token: <strong style={{ color: '#1 + "e"40 + "a"f' }}>{tokens.refresh_token ? 'Received' : 'Missing'}</strong></div>
              <div>✅ ID Token: <strong style={{ color: '#1 + "e"40 + "a"f' }}>{tokens.id_token ? 'Received' : 'Missing'}</strong></div>
              <div>⏱️ Expires In: <strong style={{ color: '#1 + "e"40 + "a"f' }}>{tokens.expires_in ? `${tokens.expires_in} seconds` : 'Unknown'}</strong></div>
              <div>🔐 Token Type: <strong style={{ color: '#1 + "e"40 + "a"f' }}>{tokens.token_type || 'Bearer'}</strong></div>
              <div>🎯 Scope: <strong style={{ color: '#1 + "e"40 + "a"f' }}>{tokens.scope || 'Not specified'}</strong></div>
            </div>
          </div>
        </InfoBox>
      )}
      
      {tokens && (
        <div style={{ marginTop: '1 + "r"em' }}>
          <h4 style={{ marginBottom: '1 + "r"em' }}>Token Details:</h4>
          
          {tokens.access_token && (
            <FormField>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5 + "r"em', marginBottom: '0.5 + "r"em' }}>
                <FormLabel style={{ margin: 0, fontWeight: 'bold' }}>Access Token:</FormLabel>
                <CopyButton onClick={() => copyToClipboard(tokens.access_token, 'Access Token')}>
                  <FiCopy /> Copy
                </CopyButton>
              </div>
              <TokenDisplay>{tokens.access_token}</TokenDisplay>
            </FormField>
          )}
          
          {tokens.refresh_token && (
            <FormField>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5 + "r"em', marginBottom: '0.5 + "r"em' }}>
                <FormLabel style={{ margin: 0, fontWeight: 'bold' }}>Refresh Token:</FormLabel>
                <CopyButton onClick={() => copyToClipboard(tokens.refresh_token, 'Refresh Token')}>
                  <FiCopy /> Copy
                </CopyButton>
              </div>
              <TokenDisplay>{tokens.refresh_token}</TokenDisplay>
            </FormField>
          )}
          
          {tokens.id_token && (
            <FormField>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5 + "r"em', marginBottom: '0.5 + "r"em' }}>
                <FormLabel style={{ margin: 0, fontWeight: 'bold' }}>ID Token:</FormLabel>
                <CopyButton onClick={() => copyToClipboard(tokens.id_token, 'ID Token')}>
                  <FiCopy /> Copy
                </CopyButton>
              </div>
              <TokenDisplay>{tokens.id_token}</TokenDisplay>
            </FormField>
          )}
        </div>
      )}
      
      {authCode && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5 + "r"em', marginBottom: '0.5 + "r"em' }}>
            <h4 style={{ margin: 0 }}>Authorization Code:</h4>
            <CopyButton onClick={() => copyToClipboard(authCode, 'Authorization Code')}>
              <FiCopy /> Copy
            </CopyButton>
          </div>
          <FormField>
            <TokenDisplay>{authCode}</TokenDisplay>
          </FormField>
        </div>
      )}
    </div>
  ),
  execute: async () => {
    await exchangeTokens();
    return { success: true };
  },
  canExecute: (() => {
    const canExec = Boolean(authCode && credentials.environmentId && credentials.clientId);
    console.log('🔍 [CommonSteps] Token exchange canExecute check:', {
      authCode: !!authCode,
      authCodeValue: authCode?.substring(0, 10) + '...',
      environmentId: !!credentials.environmentId,
      clientId: !!credentials.clientId,
      canExecute: canExec
    });
    return canExec;
  })()
});

/**
 * Create user info step - only for OIDC flows
 */
export const createUserInfoStep = (
  tokens: unknown,
  userInfo: unknown,
  getUserInfo: () => Promise<void>,
  isGettingUserInfo: boolean = false
): EnhancedFlowStep => ({
  id: 'validate-tokens',
  title: 'Validate Tokens & Retrieve User Information',
  description: 'Use the access token to call the UserInfo endpoint and retrieve the authenticated user\'s profile.',
  icon: <FiUser />,
  category: 'validation',
  content: (
    <div>
      <InfoBox type="info">
        <FiUser />
        <div>
          <strong>UserInfo Endpoint</strong>
          <br />
          Validate your access token by calling the UserInfo endpoint.
        </div>
      </InfoBox>
      
      {isGettingUserInfo && (
        <InfoBox type="info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5 + "r"em' }}>
            <div className="spinner" />
            <strong>Calling UserInfo endpoint...</strong>
          </div>
        </InfoBox>
      )}
      
      {userInfo && (
        <InfoBox type="success">
          <FiCheckCircle />
          <div>
            <strong>✅ User Information Retrieved!</strong>
            <br />
            User profile data received from UserInfo endpoint.
          </div>
        </InfoBox>
      )}
    </div>
  ),
  execute: async () => {
    await getUserInfo();
    return { success: true };
  },
  canExecute: Boolean(tokens?.access_token)
});
