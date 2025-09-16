import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from './Card';
import { FiSettings, FiCopy, FiCheck, FiSave, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import StandardMessage from './StandardMessage';
import { useAccessibility } from '../hooks/useAccessibility';

const ConfigContainer = styled.div`
  margin-bottom: 2rem;
`;

const SaveButton = styled.button`
  background: #059669;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  margin-top: 1.5rem;
  width: auto;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  
  &:hover {
    background: #047857;
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  .spinner {
    margin-right: 8px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 2px solid white;
    width: 16px;
    height: 16px;
    animation: spin 1s linear infinite;
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }
`;


const CollapsibleHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
  
  h2 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .collapse-icon {
    transition: transform 0.2s ease;
    opacity: 0.7;
    
    &:hover {
      opacity: 1;
    }
  }
`;

const CollapsibleContent = styled.div<{ $isExpanded: boolean }>`
  max-height: ${({ $isExpanded }) => $isExpanded ? '2000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
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
  grantType: string;
  
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
  customClaims: Record<string, unknown>;
  
  // Advanced settings
  audience: string;
  maxAge: number;
  prompt: string;
  loginHint: string;
  acrValues: string[];
  
  // Client Authentication (OIDC Section 9)
  clientAuthMethod: 'client_secret_post' | 'client_secret_basic' | 'client_secret_jwt' | 'private_key_jwt' | 'none';
  
  // UI settings
  showSuccessModal: boolean;
  showAuthCodeInModal: boolean;
  showCredentialsModal: boolean;
}

interface FlowConfigurationProps {
  config: FlowConfig;
  onConfigChange: (config: FlowConfig) => void;
  flowType: 'authorization-code' | 'pkce' | 'implicit' | 'client-credentials' | 'device-code' | 'refresh-token' | 'password-grant';
  isConfigured?: boolean; // Whether credentials are already saved
}

const availableScopes = [
  'openid', 'profile', 'email', 'address', 'phone', 'offline_access',
  'api:read', 'api:write', 'admin:read', 'admin:write'
];

const defaultAcrValues = [
  'urn:mace:incommon:iap:silver',
  'urn:mace:incommon:iap:bronze', 
  'urn:mace:incommon:iap:gold',
  'urn:pingone:loa:1',
  'urn:pingone:loa:2', 
  'urn:pingone:loa:3',
  '1',
  '2',
  '3'
];

export const FlowConfiguration: React.FC<FlowConfigurationProps> = ({
  config,
  onConfigChange,
  flowType,
  isConfigured = false
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const { announce } = useAccessibility();

  const updateConfig = (updates: Partial<FlowConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const toggleScope = (scope: string) => {
    const newScopes = config.scopes.includes(scope)
      ? config.scopes.filter(s => s !== scope)
      : [...config.scopes, scope];
    updateConfig({ scopes: newScopes });
    announce(`${scope} scope ${config.scopes.includes(scope) ? 'removed' : 'added'}`);
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
      announce(`${field} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      announce('Failed to copy to clipboard');
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate save operation (in a real app, this would save to backend/localStorage)
      // Add minimum delay to ensure spinner is visible
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      setShowSuccessMessage(true);
      announce('Configuration saved successfully');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      announce('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ConfigContainer>
      <Card>
        <CardHeader>
          <CollapsibleHeader onClick={() => setIsExpanded(!isExpanded)}>
            <h3>
              <FiSettings />
              Flow Config
            </h3>
            {isExpanded ? <FiChevronDown className="collapse-icon" /> : <FiChevronRight className="collapse-icon" />}
          </CollapsibleHeader>
          <p>Customize OAuth parameters to see how they affect the flow</p>
        </CardHeader>
        <CardBody>
          <CollapsibleContent $isExpanded={isExpanded}>
            {/* Basic OAuth Parameters */}
          <ConfigSection>
            <h4>
              <FiSettings />
              Basic OAuth Parameters
            </h4>
            <ConfigGrid>
              <ConfigField>
                <label htmlFor="response-type-select">Response Type</label>
                <select
                  id="response-type-select"
                  value={config.responseType}
                  onChange={(e) => updateConfig({ responseType: e.target.value })}
                  aria-describedby="response-type-help"
                >
                  <option value="code">code (Authorization Code)</option>
                  <option value="token">token (Implicit)</option>
                  <option value="id_token">id_token (OIDC)</option>
                  <option value="code token">code token (Hybrid)</option>
                  <option value="code id_token">code id_token (Hybrid)</option>
                </select>
                <div id="response-type-help" className="sr-only">
                  Select the OAuth response type for this flow
                </div>
              </ConfigField>
              
              <ConfigField>
                <label htmlFor="grant-type-select">Grant Type</label>
                <select
                  id="grant-type-select"
                  value={config.grantType}
                  onChange={(e) => updateConfig({ grantType: e.target.value })}
                  aria-describedby="grant-type-help"
                >
                  <option value="authorization_code">authorization_code</option>
                  <option value="implicit">implicit</option>
                  <option value="client_credentials">client_credentials</option>
                  <option value="password">password</option>
                  <option value="refresh_token">refresh_token</option>
                  <option value="urn:ietf:params:oauth:grant-type:device_code">device_code</option>
                </select>
                <div id="grant-type-help" className="sr-only">
                  Select the OAuth grant type for this flow
                </div>
              </ConfigField>
            </ConfigGrid>
          </ConfigSection>

          {/* Scopes */}
          <ConfigSection>
            <h4>OAuth Scopes</h4>
            <ScopeContainer 
              role="group" 
              aria-label="OAuth scopes selection"
              aria-describedby="scopes-help"
            >
              {availableScopes.map(scope => (
                <ScopeChip
                  key={scope}
                  $selected={config.scopes.includes(scope)}
                  onClick={() => toggleScope(scope)}
                  role="checkbox"
                  aria-checked={config.scopes.includes(scope)}
                  aria-label={`${scope} scope`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleScope(scope);
                    }
                  }}
                >
                  {scope}
                </ScopeChip>
              ))}
            </ScopeContainer>
            <div id="scopes-help" className="sr-only">
              Select the OAuth scopes for this flow. Use Enter or Space to toggle selection.
            </div>
          </ConfigSection>

          {/* PKCE Settings */}
          {(flowType === 'authorization-code' || flowType === 'pkce') && (
            <ConfigSection>
              <h4>PKCE (Proof Key for Code Exchange)</h4>
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
            </ConfigSection>
          )}

          {/* OIDC Settings */}
          {config.enableOIDC && (
            <ConfigSection>
              <h4>OpenID Connect Settings</h4>
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
            </ConfigSection>
          )}

          {/* Client Authentication Methods (OIDC Section 9) */}
          <ConfigSection>
            <h4>Client Authentication Method</h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0 1rem 0' }}>
              Choose how the client authenticates with the authorization server during token exchange.
            </p>
            <ConfigField>
              <label>Authentication Method</label>
              <select
                value={config.clientAuthMethod}
                onChange={(e) => updateConfig({ clientAuthMethod: e.target.value as FlowConfig['clientAuthMethod'] })}
              >
                <option value="client_secret_post">client_secret_post (Secret in POST body) - Current</option>
                <option value="client_secret_basic">client_secret_basic (HTTP Basic Auth) - Secure</option>
                <option value="client_secret_jwt">client_secret_jwt (JWT with shared secret) - More Secure</option>
                <option value="private_key_jwt">private_key_jwt (JWT with private key) - Most Secure</option>
                <option value="none">none (Public client, PKCE required) - For SPAs/Mobile</option>
              </select>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                {config.clientAuthMethod === 'client_secret_post' && '📤 Client secret sent in request body (current implementation)'}
                {config.clientAuthMethod === 'client_secret_basic' && '🔐 Client secret sent via HTTP Basic Authentication header'}
                {config.clientAuthMethod === 'client_secret_jwt' && '🏆 Client creates JWT signed with client secret (HS256)'}
                {config.clientAuthMethod === 'private_key_jwt' && '🔒 Client creates JWT signed with private key (RS256) - Enterprise grade'}
                {config.clientAuthMethod === 'none' && '⚠️ No client authentication - PKCE required for security'}
              </div>
            </ConfigField>
          </ConfigSection>

          {/* Custom Parameters */}
          <ConfigSection>
            <h4>Custom Parameters</h4>
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
          </ConfigSection>

          {/* Custom Claims for ID Tokens */}
          {config.enableOIDC && (
            <ConfigSection>
              <h4>Custom Claims for ID Token</h4>
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
            </ConfigSection>
          )}

          {/* UI Settings */}
          <ConfigSection>
            <h4>UI Settings</h4>
            <ConfigField>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.showCredentialsModal}
                  onChange={(e) => updateConfig({ showCredentialsModal: e.target.checked })}
                  aria-describedby="credentials-modal-help"
                />
                Show Credentials Modal at Startup
              </label>
              <div id="credentials-modal-help" style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Display the credentials setup modal when the application starts
              </div>
            </ConfigField>
            
            <ConfigField>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.showSuccessModal}
                  onChange={(e) => updateConfig({ showSuccessModal: e.target.checked })}
                  aria-describedby="success-modal-help"
                />
                Show Success Modal
              </label>
              <div id="success-modal-help" style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Display a modal with authorization success details when returning from PingOne
              </div>
            </ConfigField>
            
            <ConfigField>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.showAuthCodeInModal}
                  onChange={(e) => updateConfig({ showAuthCodeInModal: e.target.checked })}
                  aria-describedby="auth-code-display-help"
                />
                Show Authorization Code in Modal
              </label>
              <div id="auth-code-display-help" style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Display the raw authorization code in the success modal (disable for production security)
              </div>
            </ConfigField>
          </ConfigSection>

          {/* Configuration Summary */}
          <ConfigSection>
            <h4>Configuration Summary</h4>
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
                  <strong>OIDC:</strong> Nonce: {config.nonce}, <strong>State:</strong> {config.state}
                </div>
              )}
              
              {Object.keys(config.customParams).length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Custom Params:</strong> {Object.entries(config.customParams).map(([k, v]) => `${k}=${v}`).join(', ')}
                </div>
              )}
            </div>
          </ConfigSection>
          </CollapsibleContent>

          {/* Save Button */}
          <SaveButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="spinner" />
                Saving...
              </>
            ) : (
              <>
                <FiSave />
                {isConfigured ? 'Complete' : 'Save Configuration'}
              </>
            )}
          </SaveButton>

          {/* Success Message */}
          {showSuccessMessage && (
            <StandardMessage
              type="success"
              message="Configuration saved successfully!"
            />
          )}
        </CardBody>
      </Card>
    </ConfigContainer>
  );
};
