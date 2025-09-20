// src/components/steps/CommonSteps.tsx - Reusable step components for OAuth flows

import React, { useState } from 'react';
import styled from 'styled-components';
import { FiSettings, FiShield, FiGlobe, FiKey, FiUser, FiCheckCircle, FiCopy, FiRefreshCw, FiExternalLink, FiArrowLeft, FiAlertCircle, FiRotateCcw, FiInfo } from 'react-icons/fi';
import { EnhancedFlowStep } from '../EnhancedStepFlowV2';
import { copyToClipboard } from '../../utils/clipboard';
import { getCallbackUrlForFlow } from '../../utils/callbackUrls';
import AuthorizationUrlExplainer from '../AuthorizationUrlExplainer';

// Common styled components
const FormField = styled.div`
  margin-bottom: 1rem;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const InfoBox = styled.div<{ type: 'success' | 'error' | 'warning' | 'info' }>`
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
      case 'error':
        return `
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        `;
      case 'warning':
        return `
          background: #fffbeb;
          border: 1px solid #fed7aa;
          color: #92400e;
        `;
      case 'info':
        return `
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        `;
    }
  }}
`;

const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TokenDisplay = styled.div`
  background: #f0fdf4;
  border: 2px solid #16a34a;
  border-radius: 6px;
  padding: 0.75rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  word-break: break-all;
  color: #15803d;
  max-height: 120px;
  overflow-y: auto;
  box-shadow: 0 1px 3px rgba(22, 163, 74, 0.1);
  
  &:hover {
    border-color: #15803d;
    background: #ecfdf5;
    box-shadow: 0 2px 6px rgba(22, 163, 74, 0.15);
  }
`;

const AuthButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
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
  environmentId?: string;  // Optional for OAuth flows
  issuerUrl?: string;      // Used by OAuth flows instead of environmentId
  redirectUri: string;
  scopes?: string;         // Should be optional
  scope?: string;          // Alternative scope format
  responseType?: string;   // OAuth response type
  grantType?: string;      // OAuth grant type
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
  flowType: string,
  onClose?: () => void
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
          value={credentials.scope || credentials.scopes || ''}
          onChange={(e) => setCredentials({ ...credentials, scope: e.target.value, scopes: e.target.value })}
          placeholder="openid profile email"
        />
      </FormField>
      
      {onClose && (
        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
          >
            Close
          </button>
        </div>
      )}
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
  description: 'PKCE (Proof Key for Code Exchange) adds security by preventing authorization code interception attacks. This step is optional but recommended for enhanced security.',
  icon: <FiShield />,
  category: 'security',
  content: (
    <div>
      {/* PKCE Security Information */}
      <InfoBox type="info" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h4 style={{ margin: '0 0 1rem 0', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiShield />
            What is PKCE and Why Use It?
          </h4>
          
          <div style={{ marginBottom: '1rem' }}>
            <strong>PKCE (Proof Key for Code Exchange)</strong> is a security extension to OAuth 2.0 that prevents authorization code interception attacks. It's especially important for:
          </div>
          
          <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
            <li><strong>Public clients</strong> (mobile apps, SPAs) that can't securely store secrets</li>
            <li><strong>Native applications</strong> where redirect URIs can be compromised</li>
            <li><strong>Enhanced security</strong> for any OAuth flow, even with confidential clients</li>
          </ul>

          <div style={{ marginBottom: '1rem' }}>
            <strong>How PKCE Works:</strong>
          </div>
          
          <ol style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
            <li><strong>Code Verifier:</strong> A cryptographically random string (43-128 characters) generated by your application</li>
            <li><strong>Code Challenge:</strong> SHA256 hash of the code verifier, sent with the authorization request</li>
            <li><strong>Verification:</strong> During token exchange, the original code verifier is sent to prove you initiated the flow</li>
          </ol>

          <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', border: '1px solid #f59e0b' }}>
            <strong>🔒 Security Benefits:</strong>
            <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
              <li><strong>Prevents code interception:</strong> Even if an attacker intercepts the authorization code, they can't exchange it for tokens without the code verifier</li>
              <li><strong>No client secret required:</strong> Eliminates the need to store sensitive client secrets in public clients</li>
              <li><strong>Dynamic security:</strong> Each flow uses unique, randomly generated values</li>
              <li><strong>RFC 7636 compliant:</strong> Industry standard security extension</li>
            </ul>
          </div>
        </div>
      </InfoBox>
      
      {pkceCodes.codeVerifier && (
        <div>
          <h4 style={{ marginBottom: '1rem' }}>Generated PKCE Codes:</h4>
          
          <FormField>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <FormLabel style={{ margin: 0, fontWeight: 'bold' }}>Code Verifier:</FormLabel>
              <CopyButton onClick={() => copyToClipboard(pkceCodes.codeVerifier, 'Code Verifier')}>
                <FiCopy /> Copy
              </CopyButton>
            </div>
            <TokenDisplay>{pkceCodes.codeVerifier}</TokenDisplay>
          </FormField>
          
          <FormField>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
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
  isAuthorizing?: boolean,
  showExplainer?: boolean,
  setShowExplainer?: (show: boolean) => void
): EnhancedFlowStep => {
  return {
    id: 'build-auth-url',
    title: 'Build Authorization URL',
    description: 'Construct the complete authorization URL with all required OAuth parameters.',
    icon: <FiGlobe />,
    category: 'authorization',
    content: (
      <div>
        {/* Authorization URL Description */}
        <InfoBox type="info" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h4 style={{ margin: '0 0 1rem 0', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiGlobe />
              What is the Authorization URL?
            </h4>
            
            <div style={{ marginBottom: '1rem' }}>
              The <strong>Authorization URL</strong> is the complete URL that redirects users to PingOne for authentication and authorization. This URL contains all the necessary OAuth 2.0 and OpenID Connect parameters.
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>What this step does:</strong>
            </div>
            
            <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
              <li><strong>Constructs the complete URL</strong> with all OAuth parameters (client_id, redirect_uri, scope, state, etc.)</li>
              <li><strong>Includes PKCE parameters</strong> (code_challenge) for enhanced security</li>
              <li><strong>Adds OIDC parameters</strong> (nonce, prompt, max_age) when using OpenID Connect</li>
              <li><strong>Validates all required parameters</strong> before building the URL</li>
            </ul>

            <div style={{ marginBottom: '1rem' }}>
              <strong>How it works:</strong>
            </div>
            
            <ol style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
              <li><strong>Parameter Assembly:</strong> Combines your credentials, scopes, and security parameters</li>
              <li><strong>URL Construction:</strong> Builds the complete authorization endpoint URL</li>
              <li><strong>Security Addition:</strong> Includes PKCE challenge and state for CSRF protection</li>
              <li><strong>Validation:</strong> Ensures all required parameters are present and valid</li>
            </ol>

            <div style={{ padding: '1rem', backgroundColor: '#e0f2fe', borderRadius: '0.5rem', border: '1px solid #0284c7' }}>
              <strong>🔗 URL Components:</strong>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                <li><strong>Base URL:</strong> PingOne authorization endpoint</li>
                <li><strong>Query Parameters:</strong> All OAuth/OIDC parameters (client_id, redirect_uri, scope, state, nonce, etc.)</li>
                <li><strong>Security Parameters:</strong> PKCE code_challenge and state for protection</li>
                <li><strong>Custom Parameters:</strong> Any additional parameters you've configured</li>
              </ul>
            </div>
          </div>
        </InfoBox>
        
        {isAuthorizing && (
          <InfoBox type="info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="spinner" />
              <strong>Opening authorization popup...</strong>
            </div>
          </InfoBox>
        )}
        
        {authUrl && (
          <FormField>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <FormLabel style={{ margin: 0, fontWeight: 'bold' }}>Generated Authorization URL:</FormLabel>
              <CopyButton onClick={() => copyToClipboard(authUrl, 'Authorization URL')}>
                <FiCopy /> Copy
              </CopyButton>
              <CopyButton 
                onClick={() => setShowExplainer?.(true)}
                style={{ 
                  background: '#8b5cf6',
                  marginLeft: '0.5rem'
                }}
              >
                <FiInfo /> Explain URL
              </CopyButton>
            </div>
            <TokenDisplay>{authUrl}</TokenDisplay>
          </FormField>
        )}
        
        <AuthorizationUrlExplainer 
          authUrl={authUrl}
          isOpen={showExplainer || false}
          onClose={() => setShowExplainer?.(false)}
        />
        
        {authUrl && (onPopupAuth || onRedirectAuth) && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>🔐 Authorization Methods:</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {onPopupAuth && (
              <AuthButton 
                onClick={onPopupAuth}
                disabled={isAuthorizing}
                style={{ backgroundColor: '#3b82f6' }}
              >
                <FiGlobe /> Popup Authorization
              </AuthButton>
            )}
            {onRedirectAuth && (
              <AuthButton 
                onClick={onRedirectAuth}
                disabled={isAuthorizing}
                style={{ backgroundColor: '#10b981' }}
              >
                <FiRefreshCw /> Full Redirect
              </AuthButton>
            )}
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85em', color: '#6b7280' }}>
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
    credentials &&
    (credentials.environmentId || credentials.issuerUrl) &&
    credentials.clientId &&
    credentials.redirectUri &&
    (!pkceCodes || (pkceCodes.codeVerifier && pkceCodes.codeChallenge))
  )
};
};

/**
 * Create token exchange step - reusable for flows that exchange codes for tokens
 */
export const createTokenExchangeStep = (
  authCode: string,
  tokens: any,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            <div style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem', fontSize: '0.9em' }}>
              <div>✅ Access Token: <strong style={{ color: '#1e40af' }}>{tokens.access_token ? 'Received' : 'Missing'}</strong></div>
              <div>✅ Refresh Token: <strong style={{ color: '#1e40af' }}>{tokens.refresh_token ? 'Received' : 'Missing'}</strong></div>
              <div>✅ ID Token: <strong style={{ color: '#1e40af' }}>{tokens.id_token ? 'Received' : 'Missing'}</strong></div>
              <div>⏱️ Expires In: <strong style={{ color: '#1e40af' }}>{tokens.expires_in ? `${tokens.expires_in} seconds` : 'Unknown'}</strong></div>
              <div>🔐 Token Type: <strong style={{ color: '#1e40af' }}>{tokens.token_type || 'Bearer'}</strong></div>
              <div>🎯 Scope: <strong style={{ color: '#1e40af' }}>{tokens.scope || 'Not specified'}</strong></div>
            </div>
          </div>
        </InfoBox>
      )}
      
      {tokens && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Token Details:</h4>
          
          {tokens.access_token && (
            <FormField>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
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
  tokens: any,
  userInfo: any,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

/**
 * Create user authorization step - handles redirecting user to authorization server
 */
export const createUserAuthorizationStep = (
  authUrl: string,
  onPopupAuth?: () => void,
  onRedirectAuth?: () => void,
  isAuthorizing: boolean = false,
  authCode?: string
): EnhancedFlowStep => ({
  id: 'user-authorization',
  title: 'Redirect User to Authorization Server',
  description: 'Redirect the user to PingOne authorization server to authenticate and authorize your application.',
  icon: <FiGlobe />,
  category: 'authorization',
  content: (
    <div>
      <InfoBox type="info">
        <FiGlobe />
        <div>
          <strong>User Authorization</strong>
          <br />
          The user will be redirected to PingOne to authenticate and authorize your application.
        </div>
      </InfoBox>
      
      {isAuthorizing && (
        <InfoBox type="info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="spinner" />
            <strong>Authorization in progress...</strong>
          </div>
        </InfoBox>
      )}
      
      {authCode && (
        <InfoBox type="success">
          <FiCheckCircle />
          <div>
            <strong>✅ Authorization Successful!</strong>
            <br />
            User has been authenticated and authorization code received.
          </div>
        </InfoBox>
      )}
      
      {authUrl && (onPopupAuth || onRedirectAuth) && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginBottom: '1rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#374151'
          }}>
            🔒 Authorization Methods:
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {onPopupAuth && (
              <ActionButton 
                onClick={onPopupAuth}
                disabled={!authUrl || isAuthorizing}
                style={{
                  backgroundColor: '#3b82f6',
                  opacity: (!authUrl || isAuthorizing) ? 0.5 : 1,
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}
              >
                🌐 Popup Authorization
              </ActionButton>
            )}
            {onRedirectAuth && (
              <ActionButton 
                onClick={onRedirectAuth}
                disabled={!authUrl || isAuthorizing}
                style={{
                  backgroundColor: '#10b981',
                  opacity: (!authUrl || isAuthorizing) ? 0.5 : 1,
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}
              >
                🔄 Full Redirect
              </ActionButton>
            )}
          </div>
          
          <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Popup:</strong> Opens in new window, returns to this page automatically.
            </div>
            <div>
              <strong>Redirect:</strong> Navigates away from this page, returns after authorization.
            </div>
          </div>
        </div>
      )}
    </div>
  ),
  execute: async () => {
    // This step is executed by the popup/redirect buttons
    return { success: true };
  },
  canExecute: Boolean(authUrl)
});

/**
 * Create callback handling step - processes authorization callback
 */
export const createCallbackHandlingStep = (
  authCode: string,
  onReset?: () => void
): EnhancedFlowStep => ({
  id: 'handle-callback',
  title: 'Handle Authorization Callback',
  description: 'Process the authorization server callback and extract the authorization code.',
  icon: <FiArrowLeft />,
  category: 'callback',
  content: (
    <div>
      <InfoBox type="info">
        <FiArrowLeft />
        <div>
          <strong>Authorization Callback</strong>
          <br />
          Processing the callback from PingOne authorization server.
        </div>
      </InfoBox>
      
      {authCode ? (
        <InfoBox type="success">
          <FiCheckCircle />
          <div>
            <strong>✅ Authorization Code Received!</strong>
            <br />
            Successfully extracted authorization code from callback.
          </div>
        </InfoBox>
      ) : (
        <InfoBox type="warning">
          <FiAlertCircle />
          <div>
            <strong>⏳ Waiting for Authorization...</strong>
            <br />
            Complete the authorization step to receive the authorization code.
          </div>
        </InfoBox>
      )}
      
      {authCode && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
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
      
      {onReset && (
        <div style={{ marginTop: '1rem' }}>
          <ActionButton 
            onClick={onReset}
            style={{ backgroundColor: '#6b7280' }}
          >
            <FiRotateCcw /> Reset Flow
          </ActionButton>
        </div>
      )}
    </div>
  ),
  execute: async () => {
    // This step just validates the callback was processed
    return { success: true };
  },
  canExecute: Boolean(authCode)
});

/**
 * Create token validation step - validates and inspects received tokens
 */
export const createTokenValidationStep = (
  tokens: any,
  userInfo: any,
  onValidateTokens?: () => Promise<void>,
  isValidating: boolean = false
): EnhancedFlowStep => ({
  id: 'validate-tokens',
  title: 'Validate Tokens & Get User Info',
  description: 'Validate the received tokens and call the UserInfo endpoint to retrieve user profile information.',
  icon: <FiShield />,
  category: 'validation',
  content: (
    <div>
      <InfoBox type="info">
        <FiShield />
        <div>
          <strong>Token Validation</strong>
          <br />
          Validate tokens and retrieve user information from UserInfo endpoint.
        </div>
      </InfoBox>
      
      {isValidating && (
        <InfoBox type="info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="spinner" />
            <strong>Validating tokens and calling UserInfo...</strong>
          </div>
        </InfoBox>
      )}
      
      {tokens && (
        <InfoBox type="success">
          <FiCheckCircle />
          <div>
            <strong>✅ Tokens Validated!</strong>
            <br />
            Access token, ID token, and refresh token are valid.
          </div>
        </InfoBox>
      )}
      
      {userInfo && (
        <InfoBox type="success">
          <FiUser />
          <div>
            <strong>✅ User Information Retrieved!</strong>
            <br />
            Successfully retrieved user profile from UserInfo endpoint.
          </div>
        </InfoBox>
      )}
      
      {tokens && (
        <div>
          <h4>Token Summary:</h4>
          <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.25rem' }}>
              <span><strong>Access Token:</strong></span>
              <span>{tokens.access_token ? '✅ Present' : '❌ Missing'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.25rem' }}>
              <span><strong>ID Token:</strong></span>
              <span>{tokens.id_token ? '✅ Present' : '❌ Missing'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.25rem' }}>
              <span><strong>Refresh Token:</strong></span>
              <span>{tokens.refresh_token ? '✅ Present' : '❌ Missing'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.25rem' }}>
              <span><strong>Expires In:</strong></span>
              <span>{tokens.expires_in ? `${tokens.expires_in}s` : 'N/A'}</span>
            </div>
          </div>
        </div>
      )}
      
      {userInfo && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0 }}>User Information:</h4>
            <CopyButton onClick={() => copyToClipboard(JSON.stringify(userInfo, null, 2), 'User Info')}>
              <FiCopy /> Copy
            </CopyButton>
          </div>
          <FormField>
            <TokenDisplay>{JSON.stringify(userInfo, null, 2)}</TokenDisplay>
          </FormField>
        </div>
      )}
      
      {tokens && onValidateTokens && (
        <div style={{ marginTop: '1rem' }}>
          <ActionButton 
            onClick={onValidateTokens}
            disabled={isValidating}
            style={{
              backgroundColor: '#10b981',
              opacity: isValidating ? 0.5 : 1
            }}
          >
            <FiUser /> Get User Info
          </ActionButton>
        </div>
      )}
    </div>
  ),
  execute: async () => {
    if (onValidateTokens) {
      await onValidateTokens();
    }
    return { success: true };
  },
  canExecute: Boolean(tokens?.access_token)
});
