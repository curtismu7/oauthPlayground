import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid #e5e7eb;
`;

const ModalHeader = styled.div`
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;

  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  p {
    margin: 0;
    color: #6b7280;
    font-size: 1rem;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
    font-size: 0.9rem;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    &::placeholder {
      color: #9ca3af;
    }

    &.is-invalid {
      border-color: #ef4444;
    }
  }

  .form-text {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    color: #6b7280;
  }

  .invalid-feedback {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    color: #ef4444;
  }
`;

const ModalFooter = styled.div`
  padding: 1rem 2rem 2rem;
  border-top: 1px solid #e5e7eb;
  text-align: right;
`;

const SaveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background-color: #3b82f6;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #2563eb;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Alert = styled.div<{ $variant?: 'success' | 'danger' | 'info' }>`
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid transparent;
  border-radius: 6px;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    margin-top: 0.1rem;
    flex-shrink: 0;
  }

  div {
    flex: 1;
  }

  h4 {
    margin: 0 0 0.5rem 0;
    font-weight: 600;
    font-size: 0.9rem;
  }

  p {
    margin: 0;
    font-size: 0.85rem;
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

interface CredentialSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const CredentialSetupModal: React.FC<CredentialSetupModalProps> = ({ isOpen, onComplete }) => {
  const [formData, setFormData] = useState({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    redirectUri: window.location.origin + '/callback'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'danger'; title: string; message: string } | null>(null);
  const [storedCredentials, setStoredCredentials] = useState<{
    pingone_config: any;
    login_credentials: any;
  } | null>(null);

  // Load existing credentials from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 [CredentialSetupModal] Loading existing credentials from localStorage...');
      
      try {
        const pingoneConfig = localStorage.getItem('pingone_config');
        const loginCredentials = localStorage.getItem('login_credentials');
        
        console.log('🔍 [CredentialSetupModal] localStorage contents:');
        console.log('   pingone_config:', pingoneConfig ? 'present' : 'missing');
        console.log('   login_credentials:', loginCredentials ? 'present' : 'missing');
        
        const stored = {
          pingone_config: pingoneConfig ? JSON.parse(pingoneConfig) : null,
          login_credentials: loginCredentials ? JSON.parse(loginCredentials) : null
        };
        
        setStoredCredentials(stored);
        
        // Pre-populate form with existing credentials
        if (stored.login_credentials) {
          console.log('✅ [CredentialSetupModal] Pre-populating form with login_credentials');
          setFormData(prev => ({
            ...prev,
            environmentId: stored.login_credentials.environmentId || '',
            clientId: stored.login_credentials.clientId || '',
            clientSecret: stored.login_credentials.clientSecret || ''
          }));
        } else if (stored.pingone_config) {
          console.log('✅ [CredentialSetupModal] Pre-populating form with pingone_config');
          setFormData(prev => ({
            ...prev,
            environmentId: stored.pingone_config.environmentId || '',
            clientId: stored.pingone_config.clientId || '',
            clientSecret: stored.pingone_config.clientSecret || '',
            redirectUri: stored.pingone_config.redirectUri || prev.redirectUri
          }));
        } else {
          console.log('⚠️ [CredentialSetupModal] No existing credentials found');
        }
        
        console.log('✅ [CredentialSetupModal] Form pre-populated with:', {
          environmentId: formData.environmentId,
          hasClientId: !!formData.clientId,
          hasClientSecret: !!formData.clientSecret
        });
        
      } catch (error) {
        console.error('❌ [CredentialSetupModal] Error loading existing credentials:', error);
      }
    }
  }, [isOpen]);

  // Validate UUID format
  const validateEnvironmentId = (envId: string): boolean => {
    const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    return uuidRegex.test(envId);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.environmentId) {
      newErrors.environmentId = 'Environment ID is required';
    } else if (!validateEnvironmentId(formData.environmentId)) {
      newErrors.environmentId = 'Environment ID must be a valid UUID format';
    }

    if (!formData.clientId) {
      newErrors.clientId = 'Client ID is required';
    }

    if (!formData.redirectUri) {
      newErrors.redirectUri = 'Redirect URI is required';
    } else if (!/^https?:\/\//.test(formData.redirectUri)) {
      newErrors.redirectUri = 'Redirect URI must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSaveStatus(null);

    try {
      // Format configuration for storage
      const configToSave = {
        environmentId: formData.environmentId,
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        redirectUri: formData.redirectUri,
        scopes: 'openid profile email',
        authEndpoint: `https://auth.pingone.com/${formData.environmentId}/as/authorize`,
        tokenEndpoint: `https://auth.pingone.com/${formData.environmentId}/as/token`,
        userInfoEndpoint: `https://auth.pingone.com/${formData.environmentId}/as/userinfo`
      };

      // Save to localStorage
      localStorage.setItem('pingone_config', JSON.stringify(configToSave));

      // Also save as login_credentials for backward compatibility
      const loginCredentials = {
        environmentId: formData.environmentId,
        clientId: formData.clientId,
        clientSecret: formData.clientSecret
      };
      localStorage.setItem('login_credentials', JSON.stringify(loginCredentials));

      setSaveStatus({
        type: 'success',
        title: 'Configuration saved!',
        message: 'Your PingOne credentials have been configured successfully.'
      });

      // Auto-close after success
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error) {
      console.error('Failed to save configuration:', error);
      setSaveStatus({
        type: 'danger',
        title: 'Configuration failed',
        message: 'Failed to save your configuration. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h2>
            <FiLock />
            Setup PingOne Credentials
          </h2>
          <p>Configure your PingOne environment to get started with the OAuth Playground</p>
        </ModalHeader>

        <ModalBody>
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

          {/* Current localStorage Status */}
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
            <h4 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}>
              📦 Current Stored Credentials
            </h4>
            <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
              <div style={{ marginBottom: '0.25rem' }}>
                <strong>pingone_config:</strong> {storedCredentials?.pingone_config ? 
                  <span style={{ color: '#28a745' }}>✅ Present</span> : 
                  <span style={{ color: '#dc3545' }}>❌ Missing</span>}
              </div>
              <div style={{ marginBottom: '0.25rem' }}>
                <strong>login_credentials:</strong> {storedCredentials?.login_credentials ? 
                  <span style={{ color: '#28a745' }}>✅ Present</span> : 
                  <span style={{ color: '#dc3545' }}>❌ Missing</span>}
              </div>
              {storedCredentials?.login_credentials && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                  <div><strong>Environment ID:</strong> {storedCredentials.login_credentials.environmentId || 'Not set'}</div>
                  <div><strong>Client ID:</strong> {storedCredentials.login_credentials.clientId ? `${storedCredentials.login_credentials.clientId.substring(0, 12)}...` : 'Not set'}</div>
                  <div><strong>Client Secret:</strong> {storedCredentials.login_credentials.clientSecret ? '••••••••' : 'Not set'}</div>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <FormGroup>
              <label htmlFor="environmentId">Environment ID *</label>
              <input
                type="text"
                id="environmentId"
                name="environmentId"
                value={formData.environmentId}
                onChange={handleChange}
                placeholder="e.g., abc12345-6789-4abc-def0-1234567890ab"
                className={errors.environmentId ? 'is-invalid' : ''}
                disabled={isLoading}
              />
              {errors.environmentId && (
                <div className="invalid-feedback">{errors.environmentId}</div>
              )}
              <div className="form-text">
                Your PingOne Environment ID from the Admin Console
              </div>
            </FormGroup>

            <FormGroup>
              <label htmlFor="clientId">Client ID *</label>
              <input
                type="text"
                id="clientId"
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                placeholder="Enter your application's Client ID"
                className={errors.clientId ? 'is-invalid' : ''}
                disabled={isLoading}
              />
              {errors.clientId && (
                <div className="invalid-feedback">{errors.clientId}</div>
              )}
              <div className="form-text">
                The Client ID of your PingOne application
              </div>
            </FormGroup>

            <FormGroup>
              <label htmlFor="clientSecret">Client Secret</label>
              <input
                type="password"
                id="clientSecret"
                name="clientSecret"
                value={formData.clientSecret}
                onChange={handleChange}
                placeholder="Enter your application's Client Secret (optional)"
                disabled={isLoading}
              />
              <div className="form-text">
                Only required for confidential clients
              </div>
            </FormGroup>

            <FormGroup>
              <label htmlFor="redirectUri">Redirect URI *</label>
              <input
                type="url"
                id="redirectUri"
                name="redirectUri"
                value={formData.redirectUri}
                onChange={handleChange}
                className={errors.redirectUri ? 'is-invalid' : ''}
                disabled={isLoading}
              />
              {errors.redirectUri && (
                <div className="invalid-feedback">{errors.redirectUri}</div>
              )}
              <div className="form-text">
                Must match the redirect URI configured in your PingOne application
              </div>
            </FormGroup>
          </form>
        </ModalBody>

        <ModalFooter>
          <SaveButton onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </SaveButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CredentialSetupModal;
