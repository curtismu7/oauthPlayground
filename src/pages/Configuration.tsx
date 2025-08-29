import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../components/Card';
import { FiSave, FiAlertCircle, FiCheckCircle, FiCheck, FiCopy, FiEdit, FiEye } from 'react-icons/fi';

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
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
  
  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

type AlertVariant = 'success' | 'danger' | 'info';
interface AlertProps { variant?: AlertVariant }

const Alert = styled.div<AlertProps>`
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
  
  ${({ variant }) => {
    switch (variant) {
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

const SetupSteps = styled.div`
  margin-bottom: 1.5rem;

  h4 {
    color: #343a40;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  ul {
    margin: 0 0 0.5rem 0;
    padding-left: 1.2rem;
  }

  li {
    margin-bottom: 0.25rem;
    color: #495057;
    line-height: 1.3;
    font-size: 0.85rem;

    strong {
      color: #212529;
    }

    code {
      background-color: #e9ecef;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.75em;
      color: #495057;
    }
  }
`;

const CredentialsBox = styled.div`
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 0.5rem;

  h4 {
    color: #343a40;
    margin-top: 0;
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  p {
    margin-bottom: 0.5rem;
    color: #495057;
    font-size: 0.8rem;

    strong {
      color: #212529;
      font-weight: 600;
    }

    code {
      background-color: #f8f9fa;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.9rem;
      font-weight: 700;
      color: #0070CC;
      letter-spacing: 0.5px;
      word-break: break-all;
      display: inline-block;
      margin-top: 0.25rem;
      border: 1px solid #e9ecef;
    }
  }
`;

const CredentialRow = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 0.5rem;

  p {
    margin: 0;
    min-width: 120px;
    font-weight: 600;
    color: #495057;
  }
`;

const CredentialWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;

  code {
    flex: 1;
    margin: 0;
  }
`;

const DescriptionSection = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;

  p {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #0070CC;
    letter-spacing: -0.3px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;

    span {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
`;

const DescCopyButton = styled.button`
  background: none;
  border: 1px solid #0070CC;
  color: #0070CC;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;

  &:hover {
    background-color: #0070CC;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 112, 204, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    font-size: 0.875rem;
  }
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background-color: #f8f9fa;
    color: #0070CC;
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    transition: all 0.2s;
  }
`;

const PingOneSetupSection = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: left;
  height: fit-content;

  h3 {
    color: #495057;
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
  }

  p {
    color: #6c757d;
    margin-bottom: 1rem;
    line-height: 1.4;
    font-size: 0.9rem;
  }

  em {
    font-style: italic;
    color: #6c757d;
    font-size: 0.85rem;
  }
`;

type ConfigFormData = {
  environmentId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
  authEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
};

type SaveStatus = { type: 'success' | 'danger'; title: string; message: string } | null;

const Configuration = () => {
  const [formData, setFormData] = useState<ConfigFormData>({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    redirectUri: window.location.origin + '/callback',
    scopes: 'openid profile email',
    authEndpoint: 'https://auth.pingone.com/{envId}/as/authorize',
    tokenEndpoint: 'https://auth.pingone.com/{envId}/as/token',
    userInfoEndpoint: 'https://auth.pingone.com/{envId}/as/userinfo',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof ConfigFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Load saved configuration on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('pingone_config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setFormData(prev => ({
          ...prev,
          ...parsedConfig
        }));
      } catch (error) {
        console.error('Failed to load saved configuration:', error);
      }
    }
  }, []);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name as keyof ConfigFormData]) {
      setErrors(prev => ({
        ...prev,
        [name as keyof ConfigFormData]: undefined
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Partial<Record<keyof ConfigFormData, string>> = {};
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
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setSaveStatus(null);
    
    // Simulate API call
    setTimeout(() => {
      try {
        // Format endpoints with environment ID
        const configToSave = {
          ...formData,
          authEndpoint: formData.authEndpoint.replace('{envId}', formData.environmentId),
          tokenEndpoint: formData.tokenEndpoint.replace('{envId}', formData.environmentId),
          userInfoEndpoint: formData.userInfoEndpoint.replace('{envId}', formData.environmentId),
        };
        
        // Save to localStorage
        localStorage.setItem('pingone_config', JSON.stringify(configToSave));
        
        setSaveStatus({
          type: 'success',
          title: 'Configuration saved',
          message: 'Your PingOne configuration has been saved successfully.'
        });
        // Clear success message after 5 seconds
        setTimeout(() => setSaveStatus(null), 5000);
      } catch (error) {
        console.error('Failed to save configuration:', error);
        setSaveStatus({
          type: 'danger',
          title: 'Error',
          message: 'Failed to save configuration. Please try again.'
        });
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };
  
  return (
    <ConfigurationContainer>
      <PageHeader>
        <h1>PingOne Configuration</h1>
        <p>Configure your PingOne environment and application settings to get started with the OAuth Playground.</p>
      </PageHeader>
      
      {saveStatus && (
        <Alert variant={saveStatus.type}>
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
          <form onSubmit={handleSubmit}>
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
              <input
                type="password"
                id="clientSecret"
                name="clientSecret"
                value={formData.clientSecret}
                onChange={handleChange}
                placeholder="Enter your application's Client Secret"
              />
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
            
            <div style={{ marginTop: '2rem' }}>
              <SaveButton type="submit" disabled={isLoading}>
                <FiSave />
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </SaveButton>
            </div>
          </form>
        </CardBody>
      </Card>
      
      <div style={{ marginTop: '2rem' }}>
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0 }}>Configuration Help</h2>
              <p className="subtitle" style={{ margin: 0 }}>How to set up your PingOne application</p>
            </div>
            <a
              href="https://apidocs.pingidentity.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                border: '1px solid #0070CC',
                color: '#0070CC',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                fontWeight: 600
              }}
            >
              Documentation
            </a>
          </div>
        </CardHeader>
        
        <CardBody>
          <DescriptionSection>
            <p>
              <span>
                📝 Interactive OAuth 2.0 testing application
                <DescCopyButton
                  onClick={() => copyToClipboard('Interactive OAuth 2.0 testing application', 'app-description')}
                  title="Copy Description"
                >
                  {copiedId === 'app-description' ? <FiCheck size={12} /> : <FiCopy size={12} />}
                  {copiedId === 'app-description' ? 'Copied!' : 'Copy'}
                </DescCopyButton>
              </span>
            </p>
          </DescriptionSection>

          <PingOneSetupSection>
            <h3>🔧 PingOne Configuration Required</h3>
            <p>To use this OAuth Playground, you need to configure your PingOne environment:</p>

            <SetupSteps>
              <h4>1. Access PingOne Admin Console</h4>
              <ul>
                <li>Navigate to your <strong>PingOne Admin Console</strong></li>
                <li>Go to <strong>Applications</strong> → <strong>Applications</strong></li>
                <li>Click <strong style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0070CC' }}>+ Add Application</strong></li>
                <li>Select <strong>Web Application</strong></li>
              </ul>

              <h4>2. Configure Application Details</h4>
              <ul>
                <li><strong>Application Type:</strong> OIDC Web App</li>
                <li>
                  <strong>Application Name:</strong>
                  <span style={{ fontWeight: '800', fontSize: '1rem', color: '#0070CC', marginLeft: '0.5rem' }}>
                    PingOne OAuth Playground
                    <button
                      onClick={() => copyToClipboard('PingOne OAuth Playground', 'setup-app-name')}
                      style={{
                        background: 'none',
                        border: '1px solid #0070CC',
                        color: '#0070CC',
                        cursor: 'pointer',
                        padding: '0.125rem 0.25rem',
                        borderRadius: '3px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        marginLeft: '0.5rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.125rem',
                        transition: 'all 0.2s'
                      }}
                      title="Copy Application Name"
                    >
                      {copiedId === 'setup-app-name' ? <FiCheck size={10} /> : <FiCopy size={10} />}
                    </button>
                  </span>
                </li>
                <li><strong>Description:</strong> Interactive OAuth 2.0 testing application</li>
                <li><strong>Hit Save Button</strong></li>
              </ul>

              <h4>3. Configure Authentication</h4>
              <ul>
                <li><strong>Enable Application - Grey button on top Right</strong></li>
                <li><strong>Hit Configuration tab</strong></li>
                <li>
                  <strong>Hit blue pencil</strong>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#0070CC',
                    borderRadius: '50%',
                    marginLeft: '8px',
                    color: 'white'
                  }}>
                    <FiEdit size={12} />
                  </span>
                </li>
                <li><strong>Response Type:</strong> Code</li>
                <li><strong>Grant Type:</strong> Authorization Code</li>
                <li>
                  <strong>Redirect URIs:</strong>
                  <span style={{ fontWeight: '800', fontSize: '1rem', color: '#0070CC', marginLeft: '0.5rem' }}>
                    https://localhost:3000/callback
                    <button
                      onClick={() => copyToClipboard('https://localhost:3000/callback', 'setup-redirect-uri')}
                      style={{
                        background: 'none',
                        border: '1px solid #0070CC',
                        color: '#0070CC',
                        cursor: 'pointer',
                        padding: '0.125rem 0.25rem',
                        borderRadius: '3px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        marginLeft: '0.5rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.125rem',
                        transition: 'all 0.2s'
                      }}
                      title="Copy Redirect URI"
                    >
                      {copiedId === 'setup-redirect-uri' ? <FiCheck size={10} /> : <FiCopy size={10} />}
                    </button>
                  </span>
                </li>
                <li><strong>Token Endpoint Authentication Method:</strong> Client Secret Basic</li>
                <li>Click <strong style={{ color: '#0070CC' }}>Save</strong> to create the application</li>
              </ul>

              <h4>4. Save and Get Credentials</h4>
              <ul>
                <li>See the <strong>Environment ID (Issuer)</strong></li>
                <li>See the <strong>Client ID</strong></li>
                <li>
                  See the <strong>Client Secret</strong>
                  <span style={{ marginLeft: '0.375rem', color: '#6c757d', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    (<FiEye size={12} /> show/hide)
                  </span>
                </li>
              </ul>
            </SetupSteps>

          </PingOneSetupSection>

          <CredentialsBox>
            <h4>📋 Current Configuration</h4>
            <CredentialRow>
              <p><strong>Environment ID:</strong></p>
              <CredentialWrapper>
                <code>b9817c16-9910-4415-b67e-4ac687da74d9</code>
                <CopyButton
                  onClick={() => copyToClipboard('b9817c16-9910-4415-b67e-4ac687da74d9', 'env-id')}
                  title="Copy Environment ID"
                >
                  {copiedId === 'env-id' ? <FiCheck size={16} /> : <FiCopy size={16} />}
                </CopyButton>
              </CredentialWrapper>
            </CredentialRow>

            <CredentialRow>
              <p><strong>Client ID:</strong></p>
              <CredentialWrapper>
                <code>a4f963ea-0736-456a-be72-b1fa4f63f81f</code>
                <CopyButton
                  onClick={() => copyToClipboard('a4f963ea-0736-456a-be72-b1fa4f63f81f', 'client-id')}
                  title="Copy Client ID"
                >
                  {copiedId === 'client-id' ? <FiCheck size={16} /> : <FiCopy size={16} />}
                </CopyButton>
              </CredentialWrapper>
            </CredentialRow>

            <CredentialRow>
              <p><strong>Client Secret:</strong></p>
              <CredentialWrapper>
                <code>0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a</code>
                <CopyButton
                  onClick={() => copyToClipboard('0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a', 'client-secret')}
                  title="Copy Client Secret"
                >
                  {copiedId === 'client-secret' ? <FiCheck size={16} /> : <FiCopy size={16} />}
                </CopyButton>
              </CredentialWrapper>
            </CredentialRow>

            <CredentialRow>
              <p><strong>Redirect URI:</strong></p>
              <CredentialWrapper>
                <code>https://localhost:3000/callback</code>
                <CopyButton
                  onClick={() => copyToClipboard('https://localhost:3000/callback', 'redirect-uri')}
                  title="Copy Redirect URI"
                >
                  {copiedId === 'redirect-uri' ? <FiCheck size={16} /> : <FiCopy size={16} />}
                </CopyButton>
              </CredentialWrapper>
            </CredentialRow>
          </CredentialsBox>

          <p><em>💡 <strong>Need Help?</strong> Check the PingOne documentation or contact your PingOne administrator.</em></p>
        </CardBody>
      </Card>
      </div>
    </ConfigurationContainer>
  );
};

export default Configuration;
