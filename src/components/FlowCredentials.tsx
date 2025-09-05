/**
 * Flow Credentials Component
 * 
 * Provides per-flow credential configuration with:
 * - Consistent fields across all flow pages
 * - Secure secret masking with reveal toggle
 * - Validation and connectivity testing
 * - Global defaults fallback
 * - Source indication (flow override vs global default)
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from './Card';
import { 
  FiSettings, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle, 
  FiShield, FiKey, FiGlobe, FiServer, FiRefreshCw, FiInfo, FiChevronDown, FiChevronRight,
  FiMinus, FiPlus, FiCopy
} from 'react-icons/fi';
import { configStore, FlowType, FlowConfig, TokenAuthMethod, EffectiveConfig, ConfigSourceMap } from '../utils/configStore';
import { testTokenEndpointConnectivity } from '../utils/tokenExchange';

const CredentialsContainer = styled.div`
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
  justify-content: space-between;
  margin-bottom: 1rem;
  cursor: pointer;
  user-select: none;
  padding: 0.75rem;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
  transition: all 0.3s ease;
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: ${({ $color }) => $color};
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  svg {
    color: ${({ $color }) => $color};
    font-size: 1.5rem;
  }
  
  &:hover {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
    border-color: rgba(59, 130, 246, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1);
  }
`;

const CollapsibleContent = styled.div<{ $isCollapsed: boolean }>`
  max-height: ${({ $isCollapsed }) => $isCollapsed ? '0' : '2000px'};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
`;

const CollapseIcon = styled.div<{ $isCollapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 8px;
  background-color: ${({ $isCollapsed }) => $isCollapsed ? '#e5e7eb' : '#3b82f6'};
  color: ${({ $isCollapsed }) => $isCollapsed ? '#6b7280' : '#ffffff'};
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid ${({ $isCollapsed }) => $isCollapsed ? '#d1d5db' : '#2563eb'};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 3rem;
  min-height: 3rem;
  
  &:hover {
    background-color: ${({ $isCollapsed }) => $isCollapsed ? '#f3f4f6' : '#2563eb'};
    border-color: ${({ $isCollapsed }) => $isCollapsed ? '#9ca3af' : '#1d4ed8'};
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    font-size: 1.5rem;
    font-weight: bold;
    transition: all 0.3s ease;
    stroke-width: 3;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  
  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.gray700};
    cursor: pointer;
  }
  
  input[type="checkbox"] {
    margin: 0;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  /* Make Client Secret field wider */
  .client-secret-field {
    grid-column: 1 / -1;
    max-width: 100%;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  
  label {
    font-size: 0.9rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.gray700};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  input, select {
    padding: 0.5rem 0.75rem;
    border: 1px solid ${({ theme }) => theme.colors.gray300};
    border-radius: 0.375rem;
    font-size: 0.9rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
    }
    
    &:disabled {
      background-color: ${({ theme }) => theme.colors.gray100};
      color: ${({ theme }) => theme.colors.gray500};
      cursor: not-allowed;
    }
    
    &::placeholder {
      color: ${({ theme }) => theme.colors.gray400};
    }
  }
  
  .form-text {
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.gray600};
    margin-top: 0.25rem;
  }
  
  .invalid-feedback {
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.danger};
    margin-top: 0.25rem;
  }
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  input {
    flex: 1;
    padding-right: 6rem; /* Space for both eye and copy buttons */
  }
  
  .button-group {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    gap: 0.25rem;
  }
  
  button {
    background: none;
    border: none;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.gray500};
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
    
    &:hover {
      color: ${({ theme }) => theme.colors.gray700};
      background-color: ${({ theme }) => theme.colors.gray100};
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

const SecretInputContainer = styled(InputContainer)`
  input {
    padding-right: 6rem; /* Space for both eye and copy buttons */
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
`;

const TestButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.primary};
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    font-size: 1rem;
  }
`;

const SaveButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: white;
  background-color: ${({ theme }) => theme.colors.primary};
  border: 1px solid transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    font-size: 1rem;
  }
`;

const StatusMessage = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  
  ${({ $type }) => {
    switch ($type) {
      case 'success':
        return `
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
      case 'error':
        return `
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        `;
      case 'info':
      default:
        return `
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        `;
    }
  }}
`;

const SourceIndicator = styled.span<{ $source: 'global' | 'flow' }>`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
  
  ${({ $source }) => {
    switch ($source) {
      case 'flow':
        return `
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fbbf24;
        `;
      case 'global':
        return `
          background-color: #e0f2fe;
          color: #0369a1;
          border: 1px solid #0ea5e9;
        `;
    }
  }}
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 2px solid currentColor;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface FlowCredentialsProps {
  flowType: FlowType;
  onConfigChange?: (config: EffectiveConfig) => void;
}

const FlowCredentials: React.FC<FlowCredentialsProps> = ({ flowType, onConfigChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [useGlobalDefaults, setUseGlobalDefaults] = useState(false);
  const [formData, setFormData] = useState<FlowConfig>({});
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [effectiveConfig, setEffectiveConfig] = useState<EffectiveConfig | null>(null);
  const [sourceMap, setSourceMap] = useState<ConfigSourceMap | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, [flowType]);

  // Load configuration from store
  const loadConfiguration = useCallback(() => {
    try {
      console.log(`🔍 [⚙️ CONFIG] Loading configuration for flow: ${flowType}`);
      
      // Get flow-specific config
      const flowConfig = configStore.getFlowConfig(flowType);
      setFormData(flowConfig || {});
      
      // Resolve effective config
      const { config, sourceMap: resolvedSourceMap } = configStore.resolveConfig(flowType);
      setEffectiveConfig(config);
      setSourceMap(resolvedSourceMap);
      
      // Notify parent of config change
      if (onConfigChange) {
        onConfigChange(config);
      }
      
      console.log(`✅ [⚙️ CONFIG] Configuration loaded for ${flowType}:`, {
        hasFlowConfig: !!flowConfig,
        effectiveConfig: {
          environmentId: config.environmentId,
          clientId: config.clientId,
          hasClientSecret: !!config.clientSecret,
          tokenAuthMethod: config.tokenAuthMethod
        }
      });
    } catch (error) {
      console.error(`❌ [⚙️ CONFIG] Error loading configuration for ${flowType}:`, error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to load configuration. Using defaults.'
      });
    }
  }, [flowType, onConfigChange]);

  // Handle form field changes
  const handleFieldChange = (field: keyof FlowConfig, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const validation = configStore.validateConfig(formData);
    if (!validation.isValid) {
      const newErrors: Record<string, string> = {};
      validation.errors.forEach(error => {
        // Map validation errors to form fields
        if (error.includes('Environment ID')) newErrors.environmentId = error;
        else if (error.includes('Client ID')) newErrors.clientId = error;
        else if (error.includes('Redirect URI')) newErrors.redirectUri = error;
        else if (error.includes('Client secret')) newErrors.clientSecret = error;
        else if (error.includes('token authentication method')) newErrors.tokenAuthMethod = error;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  // Save configuration
  const handleSave = async () => {
    if (!validateForm()) {
      setStatusMessage({
        type: 'error',
        message: 'Please fix validation errors before saving.'
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      if (useGlobalDefaults) {
        // Clear flow-specific config
        configStore.clearFlowConfig(flowType);
        setFormData({});
      } else {
        // Save flow-specific config
        const success = configStore.setFlowConfig(flowType, formData);
        if (!success) {
          throw new Error('Failed to save configuration');
        }
      }

      // Reload configuration
      loadConfiguration();

      setStatusMessage({
        type: 'success',
        message: useGlobalDefaults 
          ? 'Using global defaults for this flow'
          : 'Flow credentials saved successfully'
      });

      // Clear status message after 3 seconds
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error(`❌ [⚙️ CONFIG] Error saving configuration for ${flowType}:`, error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to save configuration. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test connectivity
  const handleTestConnectivity = async () => {
    if (!effectiveConfig) return;

    setIsTesting(true);
    setStatusMessage(null);

    try {
      console.log(`🧪 [TEST-CONNECTIVITY] Testing connectivity for ${flowType}...`);
      
      // Use the centralized connectivity test
      const result = await testTokenEndpointConnectivity(flowType);
      
      if (result.success) {
        setStatusMessage({
          type: 'success',
          message: result.message
        });
      } else {
        setStatusMessage({
          type: 'error',
          message: result.message
        });
      }
    } catch (error) {
      console.error(`❌ [TEST-CONNECTIVITY] Connectivity test failed for ${flowType}:`, error);
      setStatusMessage({
        type: 'error',
        message: `Connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsTesting(false);
      // Clear status message after 5 seconds
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Get field value (flow override or global default)
  const getFieldValue = (field: keyof FlowConfig): string => {
    if (useGlobalDefaults || !formData[field]) {
      return effectiveConfig?.[field] || '';
    }
    return formData[field] as string;
  };

  // Get field source indicator
  const getFieldSource = (field: keyof FlowConfig): 'global' | 'flow' => {
    if (useGlobalDefaults) return 'global';
    return sourceMap?.[field] || 'global';
  };

  // Copy to clipboard function
  const handleCopyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setStatusMessage({
        type: 'success',
        message: `${fieldName} copied to clipboard`
      });
      
      // Clear the copied state after 2 seconds
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to copy to clipboard'
      });
    }
  };

  if (!effectiveConfig) {
    return (
      <CredentialsContainer>
        <Card>
          <CardBody>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <LoadingSpinner />
              <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading configuration...</p>
            </div>
          </CardBody>
        </Card>
      </CredentialsContainer>
    );
  }

  return (
    <CredentialsContainer>
      <SectionContainer $color="#3B82F6">
        <SectionHeader 
          $color="#3B82F6" 
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div>
            <FiSettings />
            <h3>Flow Credentials</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280', 
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {isCollapsed ? 'Expand' : 'Collapse'}
            </span>
            <CollapseIcon $isCollapsed={isCollapsed}>
              {isCollapsed ? <FiPlus /> : <FiMinus />}
            </CollapseIcon>
          </div>
        </SectionHeader>
        
        <CollapsibleContent $isCollapsed={isCollapsed}>
        <ToggleContainer>
          <label>
            <input
              type="checkbox"
              checked={useGlobalDefaults}
              onChange={(e) => setUseGlobalDefaults(e.target.checked)}
            />
            Use Global Defaults
          </label>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            {useGlobalDefaults 
              ? 'Using global configuration from Configuration page'
              : 'Using flow-specific overrides'
            }
          </span>
        </ToggleContainer>

        <FormGrid>
          <FormGroup>
            <label>
              Environment ID
              <SourceIndicator $source={getFieldSource('environmentId')}>
                {getFieldSource('environmentId') === 'flow' ? 'Flow Override' : 'Global Default'}
              </SourceIndicator>
            </label>
            <InputContainer>
              <input
                type="text"
                value={getFieldValue('environmentId')}
                onChange={(e) => handleFieldChange('environmentId', e.target.value)}
                placeholder="e.g., abc12345-6789-4abc-def0-1234567890ab"
                disabled={useGlobalDefaults}
                className={errors.environmentId ? 'is-invalid' : ''}
              />
              <div className="button-group">
                <button
                  type="button"
                  onClick={() => handleCopyToClipboard(getFieldValue('environmentId'), 'Environment ID')}
                  disabled={useGlobalDefaults || !getFieldValue('environmentId')}
                  aria-label="Copy Environment ID"
                  title="Copy Environment ID"
                >
                  {copiedField === 'Environment ID' ? <FiCheckCircle size={16} /> : <FiCopy size={16} />}
                </button>
              </div>
            </InputContainer>
            {errors.environmentId && (
              <div className="invalid-feedback">{errors.environmentId}</div>
            )}
            <div className="form-text">
              Your PingOne Environment ID
            </div>
          </FormGroup>

          <FormGroup>
            <label>
              Client ID
              <SourceIndicator $source={getFieldSource('clientId')}>
                {getFieldSource('clientId') === 'flow' ? 'Flow Override' : 'Global Default'}
              </SourceIndicator>
            </label>
            <InputContainer>
              <input
                type="text"
                value={getFieldValue('clientId')}
                onChange={(e) => handleFieldChange('clientId', e.target.value)}
                placeholder="Enter your application's Client ID"
                disabled={useGlobalDefaults}
                className={errors.clientId ? 'is-invalid' : ''}
              />
              <div className="button-group">
                <button
                  type="button"
                  onClick={() => handleCopyToClipboard(getFieldValue('clientId'), 'Client ID')}
                  disabled={useGlobalDefaults || !getFieldValue('clientId')}
                  aria-label="Copy Client ID"
                  title="Copy Client ID"
                >
                  {copiedField === 'Client ID' ? <FiCheckCircle size={16} /> : <FiCopy size={16} />}
                </button>
              </div>
            </InputContainer>
            {errors.clientId && (
              <div className="invalid-feedback">{errors.clientId}</div>
            )}
            <div className="form-text">
              The Client ID of your application
            </div>
          </FormGroup>

          <FormGroup className="client-secret-field">
            <label>
              Client Secret
              <SourceIndicator $source={getFieldSource('clientSecret')}>
                {getFieldSource('clientSecret') === 'flow' ? 'Flow Override' : 'Global Default'}
              </SourceIndicator>
            </label>
            <SecretInputContainer>
              <input
                type={showClientSecret ? 'text' : 'password'}
                value={getFieldValue('clientSecret')}
                onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
                placeholder="Enter your application's Client Secret"
                disabled={useGlobalDefaults}
                className={errors.clientSecret ? 'is-invalid' : ''}
              />
              <div className="button-group">
                <button
                  type="button"
                  onClick={() => setShowClientSecret(!showClientSecret)}
                  disabled={useGlobalDefaults}
                  aria-label={showClientSecret ? 'Hide client secret' : 'Show client secret'}
                  title={showClientSecret ? 'Hide client secret' : 'Show client secret'}
                >
                  {showClientSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyToClipboard(getFieldValue('clientSecret'), 'Client Secret')}
                  disabled={useGlobalDefaults || !getFieldValue('clientSecret')}
                  aria-label="Copy Client Secret"
                  title="Copy Client Secret"
                >
                  {copiedField === 'Client Secret' ? <FiCheckCircle size={16} /> : <FiCopy size={16} />}
                </button>
              </div>
            </SecretInputContainer>
            {errors.clientSecret && (
              <div className="invalid-feedback">{errors.clientSecret}</div>
            )}
            <div className="form-text">
              Only required for confidential clients
            </div>
          </FormGroup>

          <FormGroup>
            <label>
              Token Endpoint Auth Method
              <SourceIndicator $source={getFieldSource('tokenAuthMethod')}>
                {getFieldSource('tokenAuthMethod') === 'flow' ? 'Flow Override' : 'Global Default'}
              </SourceIndicator>
            </label>
            <select
              value={getFieldValue('tokenAuthMethod')}
              onChange={(e) => handleFieldChange('tokenAuthMethod', e.target.value as TokenAuthMethod)}
              disabled={useGlobalDefaults}
              className={errors.tokenAuthMethod ? 'is-invalid' : ''}
            >
              <option value="none">None</option>
              <option value="client_secret_basic">Client Secret Basic</option>
              <option value="client_secret_post">Client Secret Post</option>
              <option value="private_key_jwt">Private Key JWT</option>
            </select>
            {errors.tokenAuthMethod && (
              <div className="invalid-feedback">{errors.tokenAuthMethod}</div>
            )}
            <div className="form-text">
              How to authenticate with the token endpoint
            </div>
          </FormGroup>

          <FormGroup>
            <label>
              Redirect URI
              <SourceIndicator $source={getFieldSource('redirectUri')}>
                {getFieldSource('redirectUri') === 'flow' ? 'Flow Override' : 'Global Default'}
              </SourceIndicator>
            </label>
            <InputContainer>
              <input
                type="url"
                value={getFieldValue('redirectUri')}
                onChange={(e) => handleFieldChange('redirectUri', e.target.value)}
                placeholder="https://yourapp.com/callback"
                disabled={useGlobalDefaults}
                className={errors.redirectUri ? 'is-invalid' : ''}
              />
              <div className="button-group">
                <button
                  type="button"
                  onClick={() => handleCopyToClipboard(getFieldValue('redirectUri'), 'Redirect URI')}
                  disabled={useGlobalDefaults || !getFieldValue('redirectUri')}
                  aria-label="Copy Redirect URI"
                  title="Copy Redirect URI"
                >
                  {copiedField === 'Redirect URI' ? <FiCheckCircle size={16} /> : <FiCopy size={16} />}
                </button>
              </div>
            </InputContainer>
            {errors.redirectUri && (
              <div className="invalid-feedback">{errors.redirectUri}</div>
            )}
            <div className="form-text">
              Must match exactly with PingOne configuration
            </div>
          </FormGroup>

          <FormGroup>
            <label>
              Additional Scopes
              <SourceIndicator $source={getFieldSource('scopes')}>
                {getFieldSource('scopes') === 'flow' ? 'Flow Override' : 'Global Default'}
              </SourceIndicator>
            </label>
            <InputContainer>
              <input
                type="text"
                value={getFieldValue('scopes')}
                onChange={(e) => handleFieldChange('scopes', e.target.value)}
                placeholder="openid profile email"
                disabled={useGlobalDefaults}
              />
              <div className="button-group">
                <button
                  type="button"
                  onClick={() => handleCopyToClipboard(getFieldValue('scopes'), 'Additional Scopes')}
                  disabled={useGlobalDefaults || !getFieldValue('scopes')}
                  aria-label="Copy Additional Scopes"
                  title="Copy Additional Scopes"
                >
                  {copiedField === 'Additional Scopes' ? <FiCheckCircle size={16} /> : <FiCopy size={16} />}
                </button>
              </div>
            </InputContainer>
            <div className="form-text">
              Space-separated list of scopes
            </div>
          </FormGroup>
        </FormGrid>

        <FormGroup>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={getFieldValue('pkceEnabled') === 'true' || getFieldValue('pkceEnabled') === true}
              onChange={(e) => handleFieldChange('pkceEnabled', e.target.checked)}
              disabled={useGlobalDefaults}
            />
            Enable PKCE (Proof Key for Code Exchange)
            <SourceIndicator $source={getFieldSource('pkceEnabled')}>
              {getFieldSource('pkceEnabled') === 'flow' ? 'Flow Override' : 'Global Default'}
            </SourceIndicator>
          </label>
          <div className="form-text">
            PKCE adds security for public clients (recommended for SPAs)
          </div>
        </FormGroup>

        <ActionButtons>
          <TestButton
            onClick={handleTestConnectivity}
            disabled={isTesting || !effectiveConfig.environmentId || !effectiveConfig.clientId}
          >
            {isTesting ? <LoadingSpinner /> : <FiRefreshCw />}
            {isTesting ? 'Testing...' : 'Test Connectivity'}
          </TestButton>
          
          <SaveButton
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner /> : <FiCheckCircle />}
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </SaveButton>
        </ActionButtons>

        {statusMessage && (
          <StatusMessage $type={statusMessage.type}>
            {statusMessage.type === 'success' ? <FiCheckCircle /> : 
             statusMessage.type === 'error' ? <FiAlertCircle /> : <FiInfo />}
            {statusMessage.message}
          </StatusMessage>
        )}
        </CollapsibleContent>
      </SectionContainer>
    </CredentialsContainer>
  );
};

export default FlowCredentials;
