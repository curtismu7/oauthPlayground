// src/components/steps/CommonSteps.tsx - Reusable step components for OAuth flows

import React from 'react';
import styled from 'styled-components';
import { FiSettings, FiShield, FiGlobe, FiKey, FiUser, FiCheckCircle, FiCopy, FiRefreshCw } from 'react-icons/fi';
import { EnhancedFlowStep } from '../EnhancedStepFlowV2';

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
  canExecute: Boolean(
    credentials.environmentId &&
    credentials.clientId &&
    credentials.clientSecret &&
    credentials.redirectUri
  )
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
          <h4>Generated PKCE Codes:</h4>
          <FormField>
            <FormLabel>Code Verifier</FormLabel>
            <FormInput type="text" value={pkceCodes.codeVerifier} readOnly />
          </FormField>
          <FormField>
            <FormLabel>Code Challenge</FormLabel>
            <FormInput type="text" value={pkceCodes.codeChallenge} readOnly />
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
  pkceCodes?: PKCECodes
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
      
      {authUrl && (
        <div>
          <h4>Generated Authorization URL:</h4>
          <FormField>
            <textarea
              value={authUrl}
              readOnly
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontFamily: 'monospace'
              }}
            />
          </FormField>
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
            Access token, refresh token received.
          </div>
        </InfoBox>
      )}
      
      {authCode && (
        <div>
          <h4>Authorization Code:</h4>
          <FormField>
            <FormInput type="text" value={authCode} readOnly />
          </FormField>
        </div>
      )}
    </div>
  ),
  execute: async () => {
    await exchangeTokens();
    return { success: true };
  },
  canExecute: Boolean(authCode && credentials.environmentId && credentials.clientId)
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
