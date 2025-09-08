import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../components/Card';
import { FiSave, FiAlertCircle, FiCheckCircle, FiEye, FiEyeOff, FiGlobe } from 'react-icons/fi';
import DiscoveryPanel from '../components/DiscoveryPanel';
import { OpenIDConfiguration } from '../services/discoveryService';
import { credentialManager } from '../utils/credentialManager';

const ConfigurationContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.1rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.gray700};
  }
  
  input, select, textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid ${({ theme }) => theme.colors.gray300};
    border-radius: 0.375rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.primary}40`};
    }
    
    &::placeholder {
      color: ${({ theme }) => theme.colors.gray400};
    }
  }
  
  textarea {
    min-height: 120px;
    resize: vertical;
  }
  
  .form-text {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.gray600};
  }
  
  .invalid-feedback {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const SaveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background-color: ${({ theme }) => theme.colors.primary};
  border: 1px solid transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-width: 120px;
  
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
  
  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.primary};
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
  
  svg {
    margin-right: 0.5rem;
  }
`;

const Alert = styled.div<{ $variant?: 'success' | 'danger' | 'info' }>`
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  display: flex;
  align-items: flex-start;
  
  svg {
    margin-right: 0.75rem;
    margin-top: 0.2rem;
    flex-shrink: 0;
  }
  
  div {
    flex: 1;
  }
  
  h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    font-size: 0.9375rem;
  }
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'success':
        return `
          background-color: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;
          
          svg {
            color: #22c55e;
          }
        `;
      case 'danger':
        return `
          background-color: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
          
          svg {
            color: #ef4444;
          }
        `;
      case 'info':
      default:
        return `
          background-color: #eff6ff;
          border-color: #bfdbfe;
          color: #1e40af;
          
          svg {
            color: #3b82f6;
          }
        `;
    }
  }}
`;

const LoadingSpinner = styled.div`
  border: 2px solid rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  border-top: 2px solid #0070cc;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Configuration = () => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    environmentId: 'test-env-123',
    clientId: 'test-client-123',
    clientSecret: '',
    redirectUri: window.location.origin + '/callback',
    scopes: 'openid profile email',
    authEndpoint: 'https://auth.pingone.com/{envId}/as/authorize',
    tokenEndpoint: 'https://auth.pingone.com/{envId}/as/token',
    userInfoEndpoint: 'https://auth.pingone.com/{envId}/as/userinfo',
    enablePKCE: true,
    codeChallengeMethod: 'S256',
    responseType: 'code',
    enableOIDC: true,
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showDiscoveryPanel, setShowDiscoveryPanel] = useState(false);
  
  // Load saved configuration on component mount
  useEffect(() => {
    // Load from credential manager first
    const permanentCredentials = credentialManager.loadPermanentCredentials();
    
    if (permanentCredentials.environmentId || permanentCredentials.clientId) {
      console.log('✅ [Configuration] Loading from credential manager');
      setFormData(prev => ({
        ...prev,
        environmentId: permanentCredentials.environmentId || '',
        clientId: permanentCredentials.clientId || '',
        redirectUri: permanentCredentials.redirectUri || prev.redirectUri,
        scopes: Array.isArray(permanentCredentials.scopes) ? permanentCredentials.scopes.join(' ') : permanentCredentials.scopes || prev.scopes,
        authEndpoint: permanentCredentials.authEndpoint || prev.authEndpoint,
        tokenEndpoint: permanentCredentials.tokenEndpoint || prev.tokenEndpoint,
        userInfoEndpoint: permanentCredentials.userInfoEndpoint || prev.userInfoEndpoint,
        endSessionEndpoint: permanentCredentials.endSessionEndpoint || prev.endSessionEndpoint
      }));
    } else {
      // Fallback to legacy pingone_config
      const savedConfig = localStorage.getItem('pingone_config');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          
          // Check if the client secret is the problematic hardcoded one
          if (parsedConfig.clientSecret === '0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a') {
            console.log('🧹 [Configuration] Clearing problematic hardcoded client secret');
            parsedConfig.clientSecret = '';
            // Update localStorage with cleared secret
            localStorage.setItem('pingone_config', JSON.stringify(parsedConfig));
          }
          
          setFormData(prev => ({
            ...prev,
            ...parsedConfig
          }));
        } catch (error) {
          console.error('Failed to load saved configuration:', error);
        }
      }
    }
    
    // Show spinner for 2 seconds
    setTimeout(() => setInitialLoading(false), 2000);
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  const validateForm = () => {
    console.log('🔍 [Configuration] Validating form with data:', formData);
    const newErrors = {};
    let isValid = true;
    
    if (!formData.environmentId) {
      newErrors.environmentId = 'Environment ID is required';
      isValid = false;
    }
    
    if (!formData.clientId) {
      newErrors.clientId = 'Client ID is required';
      isValid = false;
    }
    
    if (!formData.redirectUri) {
      newErrors.redirectUri = 'Redirect URI is required';
      isValid = false;
    } else if (!/^https?:\/\//.test(formData.redirectUri)) {
      newErrors.redirectUri = 'Redirect URI must start with http:// or https://';
      isValid = false;
    }
    
    console.log('🔍 [Configuration] Validation result:', { isValid, errors: newErrors });
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔍 [Configuration] Form submitted');

    if (!validateForm()) {
      console.log('❌ [Configuration] Form validation failed');
      return;
    }

    console.log('✅ [Configuration] Form validation passed, starting save...');
    setIsLoading(true);
    setSaveStatus(null);

    try {
      // Format endpoints with environment ID
      const configToSave = {
        ...formData,
        authEndpoint: formData.authEndpoint.replace('{envId}', formData.environmentId),
        tokenEndpoint: formData.tokenEndpoint.replace('{envId}', formData.environmentId),
        userInfoEndpoint: formData.userInfoEndpoint.replace('{envId}', formData.environmentId),
      };

      console.log('💾 [Configuration] Saving config using credential manager:', configToSave);

      // Save permanent credentials (Environment ID, Client ID, etc.)
      const permanentSuccess = credentialManager.savePermanentCredentials({
        environmentId: configToSave.environmentId,
        clientId: configToSave.clientId,
        redirectUri: configToSave.redirectUri,
        scopes: configToSave.scopes ? configToSave.scopes.split(' ') : ['openid', 'profile', 'email'],
        authEndpoint: configToSave.authEndpoint,
        tokenEndpoint: configToSave.tokenEndpoint,
        userInfoEndpoint: configToSave.userInfoEndpoint,
        endSessionEndpoint: configToSave.endSessionEndpoint
      });

      // Also save to legacy pingone_config for backward compatibility
      localStorage.setItem('pingone_config', JSON.stringify(configToSave));

      // Dispatch custom event to notify other components that config has changed
      window.dispatchEvent(new CustomEvent('pingone-config-changed'));
      window.dispatchEvent(new CustomEvent('permanent-credentials-changed'));

      console.log('✅ [Configuration] Config saved successfully:', { permanentSuccess });

      setSaveStatus({
        type: 'success',
        title: 'Configuration saved',
        message: 'Your PingOne configuration has been saved successfully to localStorage.'
      });

      console.log('✅ [Configuration] Success status set');
    } catch (error) {
      console.error('❌ [Configuration] Failed to save configuration:', error);
      
      setSaveStatus({
        type: 'danger',
        title: 'Error',
        message: 'Failed to save configuration. Please try again.'
      });
    } finally {
      console.log('🔄 [Configuration] Setting isLoading to false');
      setIsLoading(false);
    }
  };

  // Clear success message after 5 seconds when saveStatus changes
  useEffect(() => {
    if (saveStatus?.type === 'success') {
      const timer = setTimeout(() => {
        console.log('⏰ [Configuration] Clearing success message after 5 seconds');
        setSaveStatus(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Debug state changes
  useEffect(() => {
    console.log('🔄 [Configuration] State changed - isLoading:', isLoading, 'saveStatus:', saveStatus);
  }, [isLoading, saveStatus]);

  // Handle discovery panel configuration
  const handleConfigurationDiscovered = (config: OpenIDConfiguration, environmentId: string) => {
    console.log('🔍 [Configuration] Configuration discovered:', config);
    
    setFormData(prev => ({
      ...prev,
      environmentId: environmentId,
      authEndpoint: config.authorization_endpoint,
      tokenEndpoint: config.token_endpoint,
      userInfoEndpoint: config.userinfo_endpoint,
      scopes: config.scopes_supported?.join(' ') || 'openid profile email'
    }));

    setSaveStatus({
      type: 'success',
      title: 'Configuration Discovered',
      message: `Successfully discovered and applied configuration for environment ${environmentId}`
    });
  };
  
  if (initialLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8f9fa' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ConfigurationContainer>
      <PageHeader>
        <h1>PingOne Configuration</h1>
        <p>Configure your PingOne environment and application settings to get started with the OAuth Playground.</p>
      </PageHeader>
      

      
      {saveStatus && (
        <Alert $variant={saveStatus.type}>
          {saveStatus.type === 'success' ? (
            <FiCheckCircle size={20} />
          ) : (
            <FiAlertCircle size={20} />
          )}
          <div>
            <h4>{saveStatus.title}</h4>
            <p>{saveStatus.message}</p>
          </div>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <h2>Environment Settings</h2>
          <p className="subtitle">Configure your PingOne environment and application details</p>
        </CardHeader>
        
        <CardBody>
          <form 
            onSubmit={(e) => {
              console.log('🔍 [Configuration] Form onSubmit triggered');
              handleSubmit(e);
            }} 
            id="configForm" 
            onKeyDown={(e) => console.log('🔍 [Configuration] Form keydown:', e.key)}
          >
            <FormGroup>
              <label htmlFor="environmentId">Environment ID</label>
              <input
                type="text"
                id="environmentId"
                name="environmentId"
                value={formData.environmentId}
                onChange={handleChange}
                placeholder="e.g., abc12345-6789-4abc-def0-1234567890ab"
                className={errors.environmentId ? 'is-invalid' : ''}
              />
              {errors.environmentId && (
                <div className="invalid-feedback">{errors.environmentId}</div>
              )}
              <div className="form-text">
                Your PingOne Environment ID. You can find this in the PingOne Admin Console.
              </div>
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="clientId">Client ID</label>
              <input
                type="text"
                id="clientId"
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                placeholder="Enter your application's Client ID"
                autoComplete="username"
                className={errors.clientId ? 'is-invalid' : ''}
              />
              {errors.clientId && (
                <div className="invalid-feedback">{errors.clientId}</div>
              )}
              <div className="form-text">
                The Client ID of your application in PingOne.
              </div>
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="clientSecret">Client Secret (Optional)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showClientSecret ? 'text' : 'password'}
                  id="clientSecret"
                  name="clientSecret"
                  autoComplete="current-password"
                  value={formData.clientSecret}
                  onChange={handleChange}
                  placeholder="Enter your application's Client Secret"
                  style={{ 
                    paddingRight: '2.5rem',
                    width: '100%',
                    maxWidth: '800px',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    fontSize: '0.875rem'
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowClientSecret(!showClientSecret)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6c757d',
                    padding: '0.25rem'
                  }}
                  aria-label={showClientSecret ? 'Hide client secret' : 'Show client secret'}
                >
                  {showClientSecret ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              <div className="form-text">
                Only required for confidential clients using flows that require client authentication.
              </div>
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="redirectUri">Redirect URI</label>
              <input
                type="url"
                id="redirectUri"
                name="redirectUri"
                value={formData.redirectUri}
                onChange={handleChange}
                className={errors.redirectUri ? 'is-invalid' : ''}
              />
              {errors.redirectUri && (
                <div className="invalid-feedback">{errors.redirectUri}</div>
              )}
              <div className="form-text">
                The redirect URI registered in your PingOne application. Must match exactly.
              </div>
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="scopes">Scopes</label>
              <input
                type="text"
                id="scopes"
                name="scopes"
                value={formData.scopes}
                onChange={handleChange}
                placeholder="openid profile email"
              />
              <div className="form-text">
                Space-separated list of scopes to request. Common scopes: openid, profile, email, offline_access
              </div>
            </FormGroup>

            <h3 style={{ margin: '2rem 0 1rem', fontSize: '1.25rem' }}>OAuth Flow Settings</h3>
            
            <FormGroup>
              <label htmlFor="responseType">Response Type</label>
              <select
                id="responseType"
                name="responseType"
                value={formData.responseType}
                onChange={handleChange}
              >
                <option value="code">code (Authorization Code Flow)</option>
                <option value="id_token">id_token (Implicit Flow)</option>
                <option value="id_token token">id_token token (Implicit Flow with Access Token)</option>
                <option value="code id_token">code id_token (Hybrid Flow)</option>
                <option value="code token">code token (Hybrid Flow)</option>
                <option value="code id_token token">code id_token token (Hybrid Flow)</option>
              </select>
              <div className="form-text">
                The OAuth response type determines which tokens are returned in the authorization response.
              </div>
            </FormGroup>

            <FormGroup>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="enablePKCE"
                  name="enablePKCE"
                  checked={formData.enablePKCE}
                  onChange={(e) => setFormData(prev => ({ ...prev, enablePKCE: e.target.checked }))}
                />
                <label htmlFor="enablePKCE" style={{ margin: 0, fontWeight: '500' }}>
                  Enable PKCE (Proof Key for Code Exchange)
                </label>
              </div>
              <div className="form-text">
                PKCE adds security by preventing authorization code interception attacks. Recommended for all flows.
              </div>
            </FormGroup>

            {formData.enablePKCE && (
              <FormGroup>
                <label htmlFor="codeChallengeMethod">Code Challenge Method</label>
                <select
                  id="codeChallengeMethod"
                  name="codeChallengeMethod"
                  value={formData.codeChallengeMethod}
                  onChange={handleChange}
                >
                  <option value="S256">S256 (SHA256 - Recommended)</option>
                  <option value="plain">plain (Plain text - Less secure)</option>
                </select>
                <div className="form-text">
                  The method used to generate the code challenge from the code verifier.
                </div>
              </FormGroup>
            )}

            <FormGroup>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="enableOIDC"
                  name="enableOIDC"
                  checked={formData.enableOIDC}
                  onChange={(e) => setFormData(prev => ({ ...prev, enableOIDC: e.target.checked }))}
                />
                <label htmlFor="enableOIDC" style={{ margin: 0, fontWeight: '500' }}>
                  Enable OpenID Connect (OIDC)
                </label>
              </div>
              <div className="form-text">
                Enable OpenID Connect features like ID tokens and user information endpoints.
              </div>
            </FormGroup>
            
            <h3 style={{ margin: '2rem 0 1rem', fontSize: '1.25rem' }}>Advanced Settings</h3>
            
            <FormGroup>
              <label htmlFor="authEndpoint">Authorization Endpoint</label>
              <input
                type="url"
                id="authEndpoint"
                name="authEndpoint"
                value={formData.authEndpoint}
                onChange={handleChange}
              />
              <div className="form-text">
                The authorization endpoint URL. Use {'{envId}'} as a placeholder for the environment ID.
              </div>
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="tokenEndpoint">Token Endpoint</label>
              <input
                type="url"
                id="tokenEndpoint"
                name="tokenEndpoint"
                value={formData.tokenEndpoint}
                onChange={handleChange}
              />
              <div className="form-text">
                The token endpoint URL. Use {'{envId}'} as a placeholder for the environment ID.
              </div>
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="userInfoEndpoint">UserInfo Endpoint</label>
              <input
                type="url"
                id="userInfoEndpoint"
                name="userInfoEndpoint"
                value={formData.userInfoEndpoint}
                onChange={handleChange}
              />
              <div className="form-text">
                The UserInfo endpoint URL. Use {'{envId}'} as a placeholder for the environment ID.
              </div>
            </FormGroup>
            
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <SaveButton 
                type="submit" 
                disabled={isLoading}
                onClick={() => console.log('🔘 [Configuration] Save button clicked')}
              >
                {isLoading ? (
                  <>
                    <div className="spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave size={18} style={{ marginRight: '8px' }} />
                    Save Configuration
                  </>
                )}
              </SaveButton>
              
              <button
                type="button"
                onClick={() => setShowDiscoveryPanel(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.625rem 1.25rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  minWidth: '120px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <FiGlobe size={18} style={{ marginRight: '8px' }} />
                Auto-Discover
              </button>
            </div>
            
            {/* Status message below the buttons */}
            {saveStatus && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '12px 16px', 
                borderRadius: '6px',
                border: '1px solid',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                ...(saveStatus.type === 'success' ? {
                  backgroundColor: '#f0fdf4',
                  borderColor: '#bbf7d0',
                  color: '#166534'
                } : saveStatus.type === 'danger' ? {
                  backgroundColor: '#fef2f2',
                  borderColor: '#fecaca',
                  color: '#991b1b'
                } : {
                  backgroundColor: '#eff6ff',
                  borderColor: '#bfdbfe',
                  color: '#1e40af'
                })
              }}>
                {saveStatus.type === 'success' ? (
                  <FiCheckCircle size={18} style={{ color: '#22c55e' }} />
                ) : (
                  <FiAlertCircle size={18} style={{ color: saveStatus.type === 'danger' ? '#ef4444' : '#3b82f6' }} />
                )}
                <div>
                  <strong>{saveStatus.title}</strong>
                  <br />
                  {saveStatus.message}
                </div>
              </div>
            )}
          </form>
        </CardBody>
      </Card>
      
      <Card style={{ marginTop: '2rem' }}>
        <CardHeader>
          <h2>Configuration Help</h2>
          <p className="subtitle">How to set up your PingOne application</p>
        </CardHeader>
        
        <CardBody>
          <div>
            <h3 style={{ marginTop: 0 }}>🔧 PingOne Configuration Required</h3>
            <p>To use this OAuth Playground, you need to configure your PingOne environment:</p>

            <div>
              <h4>1. Access PingOne Admin Console</h4>
              <ul>
                <li>Navigate to your <strong>PingOne Admin Console</strong></li>
                <li>Go to <strong>Applications</strong> → <strong>Applications</strong></li>
                <li>
                  Click <strong style={{ fontSize: '1.1rem', fontWeight: 800, color: 'rgb(0, 112, 204)' }}>+ Add Application</strong>
                </li>
                <li>Select <strong>Web Application</strong></li>
              </ul>

              <h4>2. Configure Application Details</h4>
              <ul>
                <li>
                  <strong>Application Type:</strong> OIDC Web App
                </li>
                <li>
                  <strong>Application Name:</strong>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'rgb(0, 112, 204)', marginLeft: '0.5rem' }}>
                    PingOne OAuth Playground
                  </span>
                </li>
                <li>
                  <strong>Description:</strong> Interactive OAuth 2.0 testing application
                </li>
                <li><strong>Hit Save Button</strong></li>
              </ul>

              <h4>3. Configure Authentication</h4>
              <ul>
                <li><strong>Enable Application -</strong> Grey button on top right</li>
                <li><strong>Hit Configuration tab</strong></li>
                <li>
                  <strong>Hit blue pencil</strong>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 20,
                      height: 20,
                      backgroundColor: 'rgb(0, 112, 204)',
                      borderRadius: '50%',
                      marginLeft: 8,
                      color: 'white',
                    }}
                    aria-hidden
                  >
                    ✎
                  </span>
                </li>
                <li><strong>Response Type:</strong> Code</li>
                <li><strong>Grant Type:</strong> Authorization Code</li>
                <li>
                  <strong>Redirect URIs:</strong>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'rgb(0, 112, 204)', marginLeft: '0.5rem' }}>
                    {formData.redirectUri || 'https://localhost:3000/callback'}
                  </span>
                </li>
                <li><strong>Token Endpoint Authentication Method:</strong> Client Secret Basic</li>
                <li>
                  Click <strong style={{ color: 'rgb(0, 112, 204)' }}>Save</strong> to create the application
                </li>
              </ul>

              <h4>4. Save and Get Credentials</h4>
              <ul>
                <li>See the <strong>Environment ID (Issuer)</strong></li>
                <li>See the <strong>Client ID</strong></li>
                <li>
                  See the <strong>Client Secret</strong>
                  <span style={{ marginLeft: '0.375rem', color: 'rgb(108, 117, 125)' }}>(hidden by default)</span>
                </li>
              </ul>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h4>📝 Enter Your Credentials</h4>
              <div style={{ marginBottom: '0.75rem' }}>
                <p><strong>Environment ID:</strong></p>
                <div>
                  <input
                    type="text"
                    placeholder="e.g., abc12345-6789-4abc-def0-1234567890ab"
                    value={formData.environmentId}
                    onChange={() => {}}
                    readOnly
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid rgb(222, 226, 230)', borderRadius: 4, fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', fontSize: '0.85rem', backgroundColor: 'rgb(248, 249, 250)' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <p><strong>Client ID:</strong></p>
                <div>
                  <input
                    type="text"
                    placeholder="Enter your application's Client ID"
                    value={formData.clientId}
                    onChange={() => {}}
                    readOnly
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid rgb(222, 226, 230)', borderRadius: 4, fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', fontSize: '0.85rem', backgroundColor: 'rgb(248, 249, 250)' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <p><strong>Client Secret:</strong></p>
                <div>
                  <input
                    type="password"
                    placeholder="Enter your application's Client Secret"
                    value={formData.clientSecret ? '••••••••••••' : ''}
                    autoComplete="current-password"
                    onChange={() => {}}
                    readOnly
                    style={{ 
                      width: '100%', 
                      maxWidth: '600px',
                      padding: '0.5rem', 
                      border: '1px solid rgb(222, 226, 230)', 
                      borderRadius: 4, 
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', 
                      fontSize: '0.85rem', 
                      backgroundColor: 'rgb(248, 249, 250)' 
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <p><strong>Redirect URI:</strong></p>
                <div>
                  <code>{formData.redirectUri}</code>
                </div>
              </div>
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button className="sc-bSFBcf kmoxbp" type="button" disabled style={{ width: 'auto', padding: '0.75rem 2rem', opacity: 0.6 }}>
                  Save Credentials
                </button>
                <div className="form-text" style={{ marginTop: '0.5rem' }}>
                  Use the form above on this page to save your actual configuration securely.
                </div>
              </div>
            </div>

            <p style={{ marginTop: '1rem' }}>
              <em>
                💡 <strong>Need Help?</strong> Check the PingOne documentation or contact your PingOne administrator.
              </em>
            </p>
          </div>
        </CardBody>
      </Card>
      
      {/* Discovery Panel */}
      {showDiscoveryPanel && (
        <DiscoveryPanel
          onConfigurationDiscovered={handleConfigurationDiscovered}
          onClose={() => setShowDiscoveryPanel(false)}
        />
      )}
    </ConfigurationContainer>
  );
};

export default Configuration;
