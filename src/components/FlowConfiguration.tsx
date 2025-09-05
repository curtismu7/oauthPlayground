import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from './Card';
import { 
  FiSettings, FiEye, FiEyeOff, FiCopy, FiCheck, 
  FiShield, FiKey, FiClock, FiGlobe, FiServer 
} from 'react-icons/fi';

const ConfigContainer = styled.div`
  margin-bottom: 2rem;
`;

const SectionContainer = styled.div<{ $color: string }>`
  background: linear-gradient(135deg, ${({ $color }) => $color}15, ${({ $color }) => $color}08);
  border: 1px solid ${({ $color }) => $color}30;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${({ $color }) => $color}, ${({ $color }) => $color}80);
  }
`;

const SectionHeader = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  
  h4 {
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({ $color }) => $color};
    margin: 0;
  }
  
  svg {
    color: ${({ $color }) => $color};
    font-size: 1.25rem;
  }
`;

const SectionDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
  line-height: 1.4;
`;

const ConfigSection = styled.div`
  margin-bottom: 1.5rem;
  
  h4 {
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray800};
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const ConfigGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const ConfigField = styled.div`
  display: flex;
  flex-direction: column;
  
  label {
    font-size: 0.9rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.gray700};
    margin-bottom: 0.5rem;
  }
  
  input, select, textarea {
    padding: 0.5rem;
    border: 1px solid ${({ theme }) => theme.colors.gray300};
    border-radius: 4px;
    font-size: 0.9rem;
    transition: border-color 0.2s;
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
    }
  }
  
  textarea {
    min-height: 80px;
    resize: vertical;
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .toggle-switch {
    position: relative;
    width: 44px;
    height: 24px;
    background-color: ${({ theme }) => theme.colors.gray300};
    border-radius: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &.active {
      background-color: ${({ theme }) => theme.colors.primary};
    }
    
    .toggle-slider {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      background-color: white;
      border-radius: 50%;
      transition: transform 0.2s;
      
      &.active {
        transform: translateX(20px);
      }
    }
  }
  
  .toggle-label {
    font-size: 0.9rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.gray700};
  }
`;

const ScopeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const ScopeChip = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid ${({ theme, $selected }) => 
    $selected ? theme.colors.primary : theme.colors.gray300};
  background-color: ${({ theme, $selected }) => 
    $selected ? theme.colors.primary : 'transparent'};
  color: ${({ theme, $selected }) => 
    $selected ? 'white' : theme.colors.gray700};
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const CustomClaimContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 4px;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.gray50};
`;

const ClaimRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  
  input {
    flex: 1;
  }
  
  button {
    padding: 0.25rem 0.5rem;
    background-color: ${({ theme }) => theme.colors.danger};
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    
    &:hover {
      background-color: ${({ theme }) => theme.colors.dangerDark};
    }
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: ${({ theme }) => theme.colors.success};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.successDark};
  }
`;

const CopyButton = styled.button<{ $copied: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background-color: ${({ $copied, theme }) => 
    $copied ? theme.colors.success : theme.colors.gray200};
  color: ${({ $copied, theme }) => 
    $copied ? 'white' : theme.colors.gray700};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({ $copied, theme }) => 
      $copied ? theme.colors.successDark : theme.colors.gray300};
  }
`;

export interface FlowConfig {
  // Basic OAuth parameters
  scopes: string[];
  responseType: string;
  responseMode?: string;
  grantType: string;
  
  // Authentication method settings
  applicationType?: 'spa' | 'backend';
  authenticationMethod?: 'none' | 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt';
  
  // PKCE settings
  enablePKCE: boolean;
  codeChallengeMethod: 'S256' | 'plain';
  
  // Custom parameters
  customParams: Record<string, string>;
  
  // OIDC specific
  enableOIDC: boolean;
  nonce: string;
  state: string;
  
  // Custom claims for ID tokens
  customClaims: Record<string, any>;
  
  // Advanced settings
  audience: string;
  maxAge: number;
  prompt: string;
  loginHint: string;
  acrValues: string[];
  
  // Token settings
  accessTokenLifetime: number; // in minutes
  refreshTokenLifetime: number; // in minutes
  idTokenLifetime: number; // in minutes
  
  // CORS settings
  allowedOrigins: string[];
  
  // JSON Web Key Set settings
  jwksMethod: 'jwks_url' | 'jwks';
  jwksUrl: string;
  jwks: string;
  
  // Pushed Authorization Request settings
  requirePar: boolean;
  parTimeout: number; // in seconds
}

interface FlowConfigurationProps {
  config: FlowConfig;
  onConfigChange: (config: FlowConfig) => void;
  flowType: 'authorization-code' | 'pkce' | 'implicit' | 'client-credentials' | 'device-code' | 'refresh-token' | 'password-grant';
}

const defaultScopes = ['openid', 'profile', 'email'];
const availableScopes = [
  'openid', 'profile', 'email', 'address', 'phone', 'offline_access',
  'api:read', 'api:write', 'admin:read', 'admin:write'
];

const defaultAcrValues = ['urn:pingone:loa:1', 'urn:pingone:loa:2', 'urn:pingone:loa:3'];

export const FlowConfiguration: React.FC<FlowConfigurationProps> = ({
  config,
  onConfigChange,
  flowType
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const updateConfig = (updates: Partial<FlowConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const toggleScope = (scope: string) => {
    const newScopes = config.scopes.includes(scope)
      ? config.scopes.filter(s => s !== scope)
      : [...config.scopes, scope];
    updateConfig({ scopes: newScopes });
  };

  const addCustomParam = () => {
    const newParams = { ...config.customParams, '': '' };
    updateConfig({ customParams: newParams });
  };

  const updateCustomParam = (oldKey: string, newKey: string, value: string) => {
    const newParams = { ...config.customParams };
    if (oldKey !== newKey) {
      delete newParams[oldKey];
    }
    if (newKey && value) {
      newParams[newKey] = value;
    } else if (newKey) {
      newParams[newKey] = value;
    }
    updateConfig({ customParams: newParams });
  };

  const removeCustomParam = (key: string) => {
    const newParams = { ...config.customParams };
    delete newParams[key];
    updateConfig({ customParams: newParams });
  };

  const addCustomClaim = () => {
    const newClaims = { ...config.customClaims, '': '' };
    updateConfig({ customClaims: newClaims });
  };

  const updateCustomClaim = (oldKey: string, newKey: string, value: string) => {
    const newClaims = { ...config.customClaims };
    if (oldKey !== newKey) {
      delete newClaims[oldKey];
    }
    if (newKey && value) {
      newClaims[newKey] = value;
    } else if (newKey) {
      newClaims[newKey] = value;
    }
    updateConfig({ customClaims: newClaims });
  };

  const updateCustomClaimKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    
    const newClaims = { ...config.customClaims };
    const value = newClaims[oldKey];
    
    if (value !== undefined) {
      delete newClaims[oldKey];
      if (newKey.trim()) {
        newClaims[newKey.trim()] = value;
      }
      updateConfig({ customClaims: newClaims });
    }
  };

  const removeCustomClaim = (key: string) => {
    const newClaims = { ...config.customClaims };
    delete newClaims[key];
    updateConfig({ customClaims: newClaims });
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const generateRandomString = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateNonce = () => {
    updateConfig({ nonce: generateRandomString(32) });
  };

  const generateState = () => {
    updateConfig({ state: generateRandomString(32) });
  };

  return (
    <ConfigContainer>
      <Card>
        <CardHeader>
          <h3>Flow Configuration</h3>
          <p>Customize OAuth parameters to see how they affect the flow</p>
        </CardHeader>
        <CardBody>
          {/* Basic OAuth Parameters */}
          <SectionContainer $color="#3B82F6">
            <SectionHeader $color="#3B82F6">
              <FiSettings />
              <h4>Basic OAuth Parameters</h4>
            </SectionHeader>
            <SectionDescription>
              Configure basic OAuth 2.0 parameters for your application.
            </SectionDescription>
            <ConfigGrid>
              <ConfigField>
                <label>Response Type</label>
                <select
                  value={config.responseType}
                  onChange={(e) => updateConfig({ responseType: e.target.value })}
                >
                  <option value="code">code (Authorization Code)</option>
                  <option value="token">token (Implicit)</option>
                  <option value="id_token">id_token (OIDC)</option>
                  <option value="code token">code token (Hybrid)</option>
                  <option value="code id_token">code id_token (Hybrid)</option>
                </select>
              </ConfigField>
              
              <ConfigField>
                <label>Grant Type</label>
                <select
                  value={config.grantType}
                  onChange={(e) => updateConfig({ grantType: e.target.value })}
                >
                  <option value="authorization_code">authorization_code</option>
                  <option value="implicit">implicit</option>
                  <option value="client_credentials">client_credentials</option>
                  <option value="password">password</option>
                  <option value="refresh_token">refresh_token</option>
                  <option value="urn:ietf:params:oauth:grant-type:device_code">device_code</option>
                </select>
              </ConfigField>
            </ConfigGrid>
          </SectionContainer>

          {/* Scopes */}
          <SectionContainer $color="#3B82F6">
            <SectionHeader $color="#3B82F6">
              <FiSettings />
              <h4>OAuth Scopes</h4>
            </SectionHeader>
            <SectionDescription>
              Select the OAuth scopes to request from the authorization server.
            </SectionDescription>
            <ScopeContainer>
              {availableScopes.map(scope => (
                <ScopeChip
                  key={scope}
                  $selected={config.scopes.includes(scope)}
                  onClick={() => toggleScope(scope)}
                >
                  {scope}
                </ScopeChip>
              ))}
            </ScopeContainer>
          </SectionContainer>

          {/* Authentication Method */}
          <SectionContainer $color="#10B981">
            <SectionHeader $color="#10B981">
              <FiShield />
              <h4>Authentication Method</h4>
            </SectionHeader>
            <SectionDescription>
              Configure how your application authenticates with the OAuth 2.0 token endpoint.
            </SectionDescription>
            
            <ConfigGrid>
              <ConfigField>
                <label>Application Type</label>
                <select
                  value={config.applicationType || 'spa'}
                  onChange={(e) => {
                    const newApplicationType = e.target.value as 'spa' | 'backend';
                    const updates: Partial<FlowConfig> = { applicationType: newApplicationType };
                    
                    // Auto-sync authentication method based on application type
                    if (newApplicationType === 'spa') {
                      // For SPAs, we use "none" authentication method (PKCE is handled separately)
                      updates.authenticationMethod = 'none';
                      updates.enablePKCE = true;
                    } else if (newApplicationType === 'backend') {
                      // Keep current auth method if it's already a backend method, otherwise default to client_secret_basic
                      const currentAuthMethod = config.authenticationMethod || 'client_secret_basic';
                      if (['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'].includes(currentAuthMethod)) {
                        updates.authenticationMethod = currentAuthMethod;
                      } else {
                        updates.authenticationMethod = 'client_secret_basic';
                      }
                      updates.enablePKCE = false;
                    }
                    
                    updateConfig(updates);
                  }}
                >
                  <option value="spa">Single Page Application (SPA)</option>
                  <option value="backend">Backend Application</option>
                </select>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Choose based on your PingOne application configuration. SPA uses PKCE, Backend uses Client Secret Basic.
                </div>
              </ConfigField>
              
              <ConfigField>
                <label>Authentication Method</label>
                <select
                  value={config.authenticationMethod || 'none'}
                  onChange={(e) => {
                    const newAuthMethod = e.target.value as 'none' | 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt';
                    const updates: Partial<FlowConfig> = { authenticationMethod: newAuthMethod };
                    
                    // Auto-sync application type based on authentication method
                    if (newAuthMethod === 'none') {
                      updates.applicationType = 'spa';
                      updates.enablePKCE = true;
                    } else {
                      // All other methods are for backend applications
                      updates.applicationType = 'backend';
                      updates.enablePKCE = false;
                    }
                    
                    updateConfig(updates);
                  }}
                >
                  <option value="none">None</option>
                  <option value="client_secret_basic">Client Secret Basic</option>
                  <option value="client_secret_post">Client Secret Post</option>
                  <option value="client_secret_jwt">Client Secret JWT</option>
                  <option value="private_key_jwt">Private Key JWT</option>
                </select>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Token endpoint authentication methods for backend applications. PKCE is configured separately above.
                </div>
              </ConfigField>
            </ConfigGrid>
          </SectionContainer>

          {/* PKCE Settings */}
          {(flowType === 'authorization-code' || flowType === 'pkce') && (
            <SectionContainer $color="#3B82F6">
              <SectionHeader $color="#3B82F6">
                <FiShield />
                <h4>PKCE (Proof Key for Code Exchange)</h4>
              </SectionHeader>
              <SectionDescription>
                Configure PKCE for enhanced security in public client flows.
              </SectionDescription>
              <ConfigGrid>
                <ToggleContainer>
                  <div
                    className={`toggle-switch ${config.enablePKCE ? 'active' : ''}`}
                    onClick={() => updateConfig({ enablePKCE: !config.enablePKCE })}
                  >
                    <div className={`toggle-slider ${config.enablePKCE ? 'active' : ''}`} />
                  </div>
                  <span className="toggle-label">Enable PKCE</span>
                </ToggleContainer>
                
                {config.enablePKCE && (
                  <ConfigField>
                    <label>Code Challenge Method</label>
                    <select
                      value={config.codeChallengeMethod}
                      onChange={(e) => updateConfig({ 
                        codeChallengeMethod: e.target.value as 'S256' | 'plain' 
                      })}
                    >
                      <option value="S256">S256 (SHA256 - Recommended)</option>
                      <option value="plain">plain (Plain text - Less secure)</option>
                    </select>
                  </ConfigField>
                )}
              </ConfigGrid>
            </SectionContainer>
          )}

          {/* OIDC Settings */}
          {config.enableOIDC && (
            <SectionContainer $color="#8B5CF6">
              <SectionHeader $color="#8B5CF6">
                <FiKey />
                <h4>OpenID Connect Settings</h4>
              </SectionHeader>
              <SectionDescription>
                Configure OpenID Connect specific parameters for enhanced security.
              </SectionDescription>
              <ConfigGrid>
                <ConfigField>
                  <label>Nonce</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={config.nonce}
                      onChange={(e) => updateConfig({ nonce: e.target.value })}
                      placeholder="Random string for replay protection"
                    />
                    <button onClick={generateNonce}>Generate</button>
                  </div>
                </ConfigField>
                
                <ConfigField>
                  <label>State</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={config.state}
                      onChange={(e) => updateConfig({ state: e.target.value })}
                      placeholder="Random string for CSRF protection"
                    />
                    <button onClick={generateState}>Generate</button>
                  </div>
                </ConfigField>
                
                <ConfigField>
                  <label>Max Age (seconds)</label>
                  <input
                    type="number"
                    value={config.maxAge}
                    onChange={(e) => updateConfig({ maxAge: parseInt(e.target.value) || 0 })}
                    placeholder="0 = no limit"
                  />
                </ConfigField>
                
                <ConfigField>
                  <label>Prompt</label>
                  <select
                    value={config.prompt}
                    onChange={(e) => updateConfig({ prompt: e.target.value })}
                  >
                    <option value="">None (default)</option>
                    <option value="login">login (force re-authentication)</option>
                    <option value="consent">consent (force consent)</option>
                    <option value="select_account">select_account (account selection)</option>
                  </select>
                </ConfigField>
                
                <ConfigField>
                  <label>Login Hint</label>
                  <input
                    type="text"
                    value={config.loginHint}
                    onChange={(e) => updateConfig({ loginHint: e.target.value })}
                    placeholder="username@domain.com"
                  />
                </ConfigField>
                
                <ConfigField>
                  <label>ACR Values</label>
                  <select
                    multiple
                    value={config.acrValues}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      updateConfig({ acrValues: selected });
                    }}
                  >
                    {defaultAcrValues.map(acr => (
                      <option key={acr} value={acr}>{acr}</option>
                    ))}
                  </select>
                </ConfigField>
              </ConfigGrid>
            </SectionContainer>
          )}

          {/* Token Settings */}
          <SectionContainer $color="#EF4444">
            <SectionHeader $color="#EF4444">
              <FiClock />
              <h4>Token Settings</h4>
            </SectionHeader>
            <SectionDescription>
              Configure token lifetimes and expiration settings.
            </SectionDescription>
            <ConfigGrid>
              <ConfigField>
                <label>Access Token Lifetime (minutes)</label>
                <input
                  type="number"
                  value={config.accessTokenLifetime || 60}
                  onChange={(e) => updateConfig({ accessTokenLifetime: parseInt(e.target.value) || 60 })}
                  min="1"
                  max="1440"
                />
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  How long access tokens remain valid (1-1440 minutes)
                </div>
                {(config.accessTokenLifetime || 60) <= 10 && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#dc2626', 
                    marginTop: '0.25rem',
                    background: '#fef2f2',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #fecaca'
                  }}>
                    ⚠️ <strong>Short-lived tokens:</strong> Tokens with very short lifetimes (≤10 minutes) 
                    require frequent refresh and may impact application performance.
                  </div>
                )}
              </ConfigField>
              
              <ConfigField>
                <label>Refresh Token Lifetime (minutes)</label>
                <input
                  type="number"
                  value={config.refreshTokenLifetime || 10080}
                  onChange={(e) => updateConfig({ refreshTokenLifetime: parseInt(e.target.value) || 10080 })}
                  min="1"
                  max="525600"
                />
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  How long refresh tokens remain valid (1-525600 minutes)
                </div>
              </ConfigField>
              
              <ConfigField>
                <label>ID Token Lifetime (minutes)</label>
                <input
                  type="number"
                  value={config.idTokenLifetime || 60}
                  onChange={(e) => updateConfig({ idTokenLifetime: parseInt(e.target.value) || 60 })}
                  min="1"
                  max="1440"
                />
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  How long ID tokens remain valid (1-1440 minutes)
                </div>
              </ConfigField>
            </ConfigGrid>
          </SectionContainer>

          {/* CORS Settings */}
          <SectionContainer $color="#06B6D4">
            <SectionHeader $color="#06B6D4">
              <FiGlobe />
              <h4>CORS Settings</h4>
            </SectionHeader>
            <SectionDescription>
              Configure Cross-Origin Resource Sharing (CORS) allowed origins.
            </SectionDescription>
            
            <ConfigField>
              <label>Allowed Origins</label>
              <textarea
                value={(config.allowedOrigins || []).join('\n')}
                onChange={(e) => updateConfig({ allowedOrigins: e.target.value.split('\n').filter(origin => origin.trim()) })}
                placeholder="https://localhost:3000&#10;https://your-app.com"
                rows={3}
              />
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                One origin per line. These origins will be allowed to make CORS requests.
              </div>
            </ConfigField>
          </SectionContainer>

          {/* JSON Web Key Set Method */}
          <SectionContainer $color="#8B5CF6">
            <SectionHeader $color="#8B5CF6">
              <FiKey />
              <h4>JSON Web Key Set (JWKS)</h4>
            </SectionHeader>
            <SectionDescription>
              Configure how to provide JSON Web Key Set for JWT token validation.
            </SectionDescription>
            <ConfigGrid>
              <ConfigField>
                <label>JWKS Method</label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="radio"
                      name="jwksMethod"
                      value="jwks_url"
                      checked={config.jwksMethod === 'jwks_url'}
                      onChange={(e) => updateConfig({ jwksMethod: e.target.value as 'jwks_url' | 'jwks' })}
                    />
                    JWKS URL
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="radio"
                      name="jwksMethod"
                      value="jwks"
                      checked={config.jwksMethod === 'jwks'}
                      onChange={(e) => updateConfig({ jwksMethod: e.target.value as 'jwks_url' | 'jwks' })}
                    />
                    JWKS
                  </label>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Choose how to provide JSON Web Key Set for token validation
                </div>
              </ConfigField>
              
              {config.jwksMethod === 'jwks_url' ? (
                <ConfigField>
                  <label>JWKS URL</label>
                  <input
                    type="url"
                    value={config.jwksUrl || ''}
                    onChange={(e) => updateConfig({ jwksUrl: e.target.value })}
                    placeholder="https://your-domain.com/.well-known/jwks.json"
                  />
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    URL to fetch the JSON Web Key Set
                  </div>
                </ConfigField>
              ) : (
                <ConfigField>
                  <label>JWKS</label>
                  <textarea
                    value={config.jwks || ''}
                    onChange={(e) => updateConfig({ jwks: e.target.value })}
                    placeholder='{"keys": [...]}'
                    rows={4}
                  />
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    JSON Web Key Set content
                  </div>
                </ConfigField>
              )}
            </ConfigGrid>
          </SectionContainer>

          {/* Pushed Authorization Request */}
          <SectionContainer $color="#F59E0B">
            <SectionHeader $color="#F59E0B">
              <FiServer />
              <h4>Pushed Authorization Request (PAR)</h4>
            </SectionHeader>
            <SectionDescription>
              Configure Pushed Authorization Request (RFC 9126) for enhanced security.
            </SectionDescription>
            <ConfigGrid>
              <ConfigField>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={config.requirePar || false}
                    onChange={(e) => updateConfig({ requirePar: e.target.checked })}
                  />
                  Require Pushed Authorization Request
                </label>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Enable PAR (RFC 9126) for enhanced security
                </div>
              </ConfigField>
              
              <ConfigField>
                <label>Pushed Authorization Request Reference Timeout (seconds)</label>
                <input
                  type="number"
                  value={config.parTimeout || 60}
                  onChange={(e) => updateConfig({ parTimeout: parseInt(e.target.value) || 60 })}
                  min="1"
                  max="3600"
                />
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  How long PAR references remain valid (1-3600 seconds)
                </div>
              </ConfigField>
            </ConfigGrid>
          </SectionContainer>

          {/* Custom Parameters */}
          <SectionContainer $color="#6B7280">
            <SectionHeader $color="#6B7280">
              <FiSettings />
              <h4>Custom Parameters</h4>
            </SectionHeader>
            <SectionDescription>
              Add custom parameters to include in authorization requests.
            </SectionDescription>
            <CustomClaimContainer>
              {Object.entries(config.customParams).map(([key, value], index) => (
                <ClaimRow key={`param-${index}`}>
                  <input
                    type="text"
                    placeholder="Parameter name"
                    value={key}
                    onChange={(e) => updateCustomParam(key, e.target.value, value)}
                  />
                  <input
                    type="text"
                    placeholder="Parameter value"
                    value={value}
                    onChange={(e) => updateCustomParam(key, key, e.target.value)}
                  />
                  <button onClick={() => removeCustomParam(key)}>Remove</button>
                </ClaimRow>
              ))}
              <AddButton onClick={addCustomParam}>
                + Add Custom Parameter
              </AddButton>
            </CustomClaimContainer>
          </SectionContainer>

          {/* Custom Claims for ID Tokens */}
          {config.enableOIDC && (
            <SectionContainer $color="#8B5CF6">
              <SectionHeader $color="#8B5CF6">
                <FiKey />
                <h4>Custom Claims for ID Token</h4>
              </SectionHeader>
              <SectionDescription>
                Configure custom claims to include in ID tokens.
              </SectionDescription>
              <CustomClaimContainer>
                {Object.entries(config.customClaims).map(([key, value], index) => (
                  <ClaimRow key={`claim-${index}`}>
                    <input
                      type="text"
                      placeholder="Claim name"
                      value={key}
                      onChange={(e) => updateCustomClaimKey(key, e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Claim value"
                      value={String(value)}
                      onChange={(e) => updateCustomClaim(key, key, e.target.value)}
                    />
                    <button onClick={() => removeCustomClaim(key)}>Remove</button>
                  </ClaimRow>
                ))}
                <AddButton onClick={addCustomClaim}>
                  + Add Custom Claim
                </AddButton>
              </CustomClaimContainer>
            </SectionContainer>
          )}

          {/* Configuration Summary */}
          <SectionContainer $color="#10B981">
            <SectionHeader $color="#10B981">
              <FiSettings />
              <h4>Configuration Summary</h4>
            </SectionHeader>
            <SectionDescription>
              Review your current configuration settings.
            </SectionDescription>
            <div style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px', 
              padding: '1.5rem',
              fontSize: '0.9rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              position: 'relative'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Scopes:</strong> {config.scopes.join(' ')}
                <CopyButton
                  $copied={copiedField === 'scopes'}
                  onClick={() => copyToClipboard(config.scopes.join(' '), 'scopes')}
                >
                  {copiedField === 'scopes' ? <FiCheck /> : <FiCopy />}
                  {copiedField === 'scopes' ? 'Copied!' : 'Copy'}
                </CopyButton>
              </div>
              
              {config.enablePKCE && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>PKCE:</strong> Enabled ({config.codeChallengeMethod})
                </div>
              )}
              
              {config.enableOIDC && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>OIDC:</strong> Nonce: {config.nonce}, State: {config.state}
                </div>
              )}
              
              {Object.keys(config.customParams).length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Custom Params:</strong> {Object.entries(config.customParams).map(([k, v]) => `${k}=${v}`).join(', ')}
                </div>
              )}
            </div>
          </SectionContainer>
        </CardBody>
      </Card>
    </ConfigContainer>
  );
};
