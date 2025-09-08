import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { FiEye, FiEyeOff, FiCheckCircle, FiChevronDown, FiChevronUp, FiCheck } from 'react-icons/fi';
import CopyIcon from './CopyIcon';
import { logger } from '../utils/logger';
import { credentialManager, type AllCredentials } from '../utils/credentialManager';

interface FlowCredentialsProps {
  flowType: string;
  onCredentialsChange?: (credentials: FlowCredentialsData) => void;
  useGlobalDefaults?: boolean;
  onToggleGlobalDefaults?: (useGlobal: boolean) => void;
}

interface FlowCredentialsData {
  environmentId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  additionalScopes: string;
}

const CredentialsContainer = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
`;

const CredentialsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #3b82f6;
  color: white;
  border-radius: 0.5rem 0.5rem 0 0;
  cursor: pointer;
  user-select: none;
`;

const CredentialsTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: -0.025em;
`;

const CollapseIcon = styled.div<{ $isCollapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
  color: ${({ $isCollapsed }) => $isCollapsed ? '#6b7280' : '#dc2626'}; /* Red color for expanded state */
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: ${({ $isCollapsed }) => $isCollapsed ? '#6b7280' : '#ffffff'}; /* White on hover for expanded state */
  }
`;

const CredentialsContent = styled.div<{ $isCollapsed: boolean }>`
  padding: ${({ $isCollapsed }) => $isCollapsed ? '0' : '1rem'};
  max-height: ${({ $isCollapsed }) => $isCollapsed ? '0' : '1000px'};
  overflow: hidden;
  transition: all 0.3s ease;
`;

const GlobalToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: #f1f5f9;
  border-radius: 0.375rem;
  border: 1px solid #cbd5e1;
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  flex: 1;
`;

const ToggleInput = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: #3b82f6;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  
  .client-secret-field {
    grid-column: 1 / -1;
    max-width: 800px; /* Increased width for longer client secrets */
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  input {
    flex: 1;
    padding-right: 3rem;
  }
  
  .button-group {
    position: absolute;
    right: 0.5rem;
    display: flex;
    gap: 0.25rem;
  }
`;

const SecretInputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: flex-start;
  
  textarea {
    flex: 1;
    padding-right: 3rem;
  }
  
  .button-group {
    position: absolute;
    right: 0.5rem;
    top: 0.5rem;
    display: flex;
    gap: 0.25rem;
  }
`;

const Input = styled.input`
  width: 100%;
  min-width: 400px;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  word-break: break-all;
  overflow-wrap: break-word;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
  
  &.is-invalid {
    border-color: #dc2626;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  line-height: 1.2;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  word-break: break-all;
  overflow-wrap: break-word;
  resize: vertical;
  min-height: 2.5rem;
  max-height: 4rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
  
  &.is-invalid {
    border-color: #dc2626;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  border-radius: 0.25rem;
  background: #6b7280;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #4b5563;
  }
  
  &:disabled {
    background: #d1d5db;
    color: #9ca3af;
    cursor: not-allowed;
  }
  
  svg {
    width: 0.875rem;
    height: 0.875rem;
  }
`;

const StatusMessage = styled.div<{ $success?: boolean }>`
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 0.75rem 1rem;
  background: ${({ $success }) => $success ? '#10b981' : '#6b7280'};
  color: white;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const SaveIndicator = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 20px;
  right: 20px;
  background: #10b981;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transform: ${({ $isVisible }) => $isVisible ? 'translateX(0)' : 'translateX(100%)'};
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SaveIcon = styled.span`
  font-size: 1rem;
`;

const FlowCredentials: React.FC<FlowCredentialsProps> = ({
  flowType,
  onCredentialsChange,
  useGlobalDefaults = false,
  onToggleGlobalDefaults
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<FlowCredentialsData>({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    additionalScopes: ''
  });
  const [errors, setErrors] = useState<Partial<FlowCredentialsData>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalCredentials, setOriginalCredentials] = useState<FlowCredentialsData>({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    additionalScopes: ''
  });

  // Load credentials: start with global, then override with flow-specific
  useEffect(() => {
    const loadCredentials = () => {
      try {
        logger.config('FlowCredentials', `Loading credentials for flow: ${flowType}`);
        
        // Start with global credentials as the base
        let baseCredentials: FlowCredentialsData = {
          environmentId: '',
          clientId: '',
          clientSecret: '',
          redirectUri: '',
          additionalScopes: ''
        };

        // Load global credentials first
        const globalConfig = localStorage.getItem('pingone_config');
        if (globalConfig) {
          const parsed = JSON.parse(globalConfig);
          baseCredentials = {
            environmentId: parsed.environmentId || '',
            clientId: parsed.clientId || '',
            clientSecret: parsed.clientSecret || '',
            redirectUri: parsed.redirectUri || '',
            additionalScopes: parsed.additionalScopes || ''
          };
          logger.config('FlowCredentials', 'Loaded global credentials', {
            hasEnvironmentId: !!baseCredentials.environmentId,
            hasClientId: !!baseCredentials.clientId,
            hasClientSecret: !!baseCredentials.clientSecret
          });
        }

        // Override with flow-specific credentials if they exist
        const flowStored = localStorage.getItem(`flow_credentials_${flowType}`);
        if (flowStored) {
          const flowParsed = JSON.parse(flowStored);
          logger.config('FlowCredentials', `Found flow-specific credentials for ${flowType}`, flowParsed);
          
          // Only override fields that have values in flow-specific storage
          const finalCredentials = {
            environmentId: flowParsed.environmentId || baseCredentials.environmentId,
            clientId: flowParsed.clientId || baseCredentials.clientId,
            clientSecret: flowParsed.clientSecret || baseCredentials.clientSecret,
            redirectUri: flowParsed.redirectUri || baseCredentials.redirectUri,
            additionalScopes: flowParsed.additionalScopes || baseCredentials.additionalScopes
          };
          setCredentials(finalCredentials);
          onCredentialsChange?.(finalCredentials);
          logger.success('FlowCredentials', `Credentials loaded for ${flowType}`, finalCredentials);
        } else {
          // No flow-specific credentials, use global as-is
          setCredentials(baseCredentials);
          onCredentialsChange?.(baseCredentials);
          logger.info('FlowCredentials', `Using global credentials for ${flowType}`, baseCredentials);
        }
      } catch (error) {
        logger.error('FlowCredentials', 'Failed to load credentials', error instanceof Error ? error.message : String(error), error instanceof Error ? error : undefined);
      }
    };

    loadCredentials();
  }, [flowType, onCredentialsChange]);

  // Check for changes to enable/disable save button
  const hasConfigChanges = useMemo(() => {
    const globalConfig = localStorage.getItem('pingone_config');
    let globalCredentials: FlowCredentialsData = {
      environmentId: '',
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      additionalScopes: ''
    };

    if (globalConfig) {
      try {
        const parsed = JSON.parse(globalConfig);
        globalCredentials = {
          environmentId: parsed.environmentId || '',
          clientId: parsed.clientId || '',
          clientSecret: parsed.clientSecret || '',
          redirectUri: parsed.redirectUri || '',
          additionalScopes: parsed.additionalScopes || ''
        };
      } catch (error) {
        console.error('Failed to parse global config:', error);
      }
    }

    // Check if any field is different from global
    return Object.keys(credentials).some(key => {
      const field = key as keyof FlowCredentialsData;
      return credentials[field] !== globalCredentials[field];
    });
  }, [credentials]);

  const handleFieldChange = (field: keyof FlowCredentialsData, value: string) => {
    logger.ui('FlowCredentials', `Field changed: ${field}`, { field, valueLength: value.length });
    setCredentials(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleCopyToClipboard = async (text: string, fieldName: string) => {
    if (!text) return;
    
    try {
      logger.ui('FlowCredentials', `Copying ${fieldName} to clipboard`, { fieldName, textLength: text.length });
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
      logger.success('FlowCredentials', `Successfully copied ${fieldName}`);
    } catch (error) {
      logger.error('FlowCredentials', 'Failed to copy to clipboard', error instanceof Error ? error.message : String(error), error instanceof Error ? error : undefined);
    }
  };

  const getFieldValue = (field: keyof FlowCredentialsData): string => {
    if (useGlobalDefaults) {
      // When using global defaults, always return global value
      const globalConfig = localStorage.getItem('pingone_config');
      if (globalConfig) {
        const parsed = JSON.parse(globalConfig);
        return parsed[field] || '';
      }
    }
    // Otherwise return the current credentials (which already have global as base + flow overrides)
    return credentials[field] || '';
  };

  const getFlowDisplayName = (flowType: string): string => {
    const flowNames: Record<string, string> = {
      'authorization-code': 'Authorization Code Flow',
      'implicit': 'Implicit Grant Flow',
      'pkce': 'PKCE Flow',
      'client-credentials': 'Client Credentials Flow',
      'device-code': 'Device Code Flow',
      'hybrid': 'Hybrid Flow',
      'userinfo': 'UserInfo Flow',
      'id-tokens': 'ID Tokens Flow'
    };
    return flowNames[flowType] || flowType;
  };

  const handleSaveCredentials = () => {
    try {
      logger.ui('FlowCredentials', `Saving credentials for ${flowType}`, credentials);
      
      // Save to flow-specific storage
      localStorage.setItem(`flow_credentials_${flowType}`, JSON.stringify(credentials));
      
      // Update original credentials to mark as saved
      setOriginalCredentials({ ...credentials });
      setHasChanges(false);
      
      // Show success message
      setIsSaved(true);
      setSaveMessage(`Credentials saved for ${flowType} flow`);
      
      // Notify parent component
      onCredentialsChange?.(credentials);
      
      logger.success('FlowCredentials', `Credentials saved for ${flowType}`, credentials);
      
      // Clear save message after 3 seconds
      setTimeout(() => {
        setIsSaved(false);
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      logger.error('FlowCredentials', 'Failed to save credentials', error instanceof Error ? error.message : String(error), error instanceof Error ? error : undefined);
      setSaveMessage('Failed to save credentials');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleResetCredentials = () => {
    try {
      logger.ui('FlowCredentials', `Resetting credentials for ${flowType}`);
      
      // Reset to original credentials
      setCredentials({ ...originalCredentials });
      setHasChanges(false);
      
      // Clear any save messages
      setIsSaved(false);
      setSaveMessage(null);
      
      logger.success('FlowCredentials', `Credentials reset for ${flowType}`);
    } catch (error) {
      logger.error('FlowCredentials', 'Failed to reset credentials', error instanceof Error ? error.message : String(error), error instanceof Error ? error : undefined);
    }
  };

  return (
    <>
      <SaveIndicator $isVisible={isSaved}>
        <SaveIcon>💾</SaveIcon>
        {saveMessage}
      </SaveIndicator>
      
      <CredentialsContainer>
        <CredentialsHeader onClick={() => setIsCollapsed(!isCollapsed)}>
          <CredentialsTitle>
            PingOne Credentials for {getFlowDisplayName(flowType)}
          </CredentialsTitle>
          <CollapseIcon $isCollapsed={isCollapsed}>
            {isCollapsed ? <FiChevronDown /> : <FiChevronUp />}
          </CollapseIcon>
        </CredentialsHeader>
        
        <CredentialsContent $isCollapsed={isCollapsed}>
          <GlobalToggle>
            <ToggleLabel>
              <ToggleInput
                type="checkbox"
                checked={useGlobalDefaults}
                onChange={(e) => onToggleGlobalDefaults?.(e.target.checked)}
              />
              Use global PingOne configuration
            </ToggleLabel>
          </GlobalToggle>

          <FormGrid>
            <div>
              <Label htmlFor="environmentId">Environment ID</Label>
              <InputContainer>
                <Input
                  id="environmentId"
                  type="text"
                  value={getFieldValue('environmentId')}
                  onChange={(e) => handleFieldChange('environmentId', e.target.value)}
                  placeholder="e.g., abc12345-6789-4abc-def0-1234567890ab"
                  disabled={useGlobalDefaults}
                  className={errors.environmentId ? 'is-invalid' : ''}
                />
                <div className="button-group">
                  <Button
                    type="button"
                    onClick={() => handleCopyToClipboard(getFieldValue('environmentId'), 'Environment ID')}
                    disabled={useGlobalDefaults || !getFieldValue('environmentId')}
                    aria-label="Copy Environment ID"
                    title="Copy Environment ID"
                  >
                    {copiedField === 'Environment ID' ? <FiCheck size={16} /> : <CopyIcon size={16} />}
                  </Button>
                </div>
              </InputContainer>
            </div>

            <div>
              <Label htmlFor="clientId">Client ID</Label>
              <InputContainer>
                <Input
                  id="clientId"
                  type="text"
                  value={getFieldValue('clientId')}
                  onChange={(e) => handleFieldChange('clientId', e.target.value)}
                  placeholder="e.g., 12345678-1234-1234-1234-123456789012"
                  disabled={useGlobalDefaults}
                  className={errors.clientId ? 'is-invalid' : ''}
                />
                <div className="button-group">
                  <Button
                    type="button"
                    onClick={() => handleCopyToClipboard(getFieldValue('clientId'), 'Client ID')}
                    disabled={useGlobalDefaults || !getFieldValue('clientId')}
                    aria-label="Copy Client ID"
                    title="Copy Client ID"
                  >
                    {copiedField === 'Client ID' ? <FiCheck size={16} /> : <CopyIcon size={16} />}
                  </Button>
                </div>
              </InputContainer>
            </div>

            <div className="client-secret-field">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <SecretInputContainer>
                <Input
                  id="clientSecret"
                  type={showSecret ? 'text' : 'password'}
                  value={getFieldValue('clientSecret')}
                  onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
                  placeholder="Enter your client secret"
                  disabled={useGlobalDefaults}
                  className={errors.clientSecret ? 'is-invalid' : ''}
                  style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', fontSize: '0.875rem' }}
                />
                <div className="button-group">
                  <Button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    disabled={useGlobalDefaults}
                    aria-label={showSecret ? 'Hide client secret' : 'Show client secret'}
                    title={showSecret ? 'Hide client secret' : 'Show client secret'}
                  >
                    {showSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleCopyToClipboard(getFieldValue('clientSecret'), 'Client Secret')}
                    disabled={useGlobalDefaults || !getFieldValue('clientSecret')}
                    aria-label="Copy Client Secret"
                    title="Copy Client Secret"
                  >
                    {copiedField === 'Client Secret' ? <FiCheck size={16} /> : <CopyIcon size={16} />}
                  </Button>
                </div>
              </SecretInputContainer>
            </div>

            <div>
              <Label htmlFor="redirectUri">Redirect URI</Label>
              <InputContainer>
                <Input
                  id="redirectUri"
                  type="text"
                  value={getFieldValue('redirectUri')}
                  onChange={(e) => handleFieldChange('redirectUri', e.target.value)}
                  placeholder="e.g., https://localhost:3000/callback"
                  disabled={useGlobalDefaults}
                  className={errors.redirectUri ? 'is-invalid' : ''}
                />
                <div className="button-group">
                  <Button
                    type="button"
                    onClick={() => handleCopyToClipboard(getFieldValue('redirectUri'), 'Redirect URI')}
                    disabled={useGlobalDefaults || !getFieldValue('redirectUri')}
                    aria-label="Copy Redirect URI"
                    title="Copy Redirect URI"
                  >
                    {copiedField === 'Redirect URI' ? <FiCheck size={16} /> : <CopyIcon size={16} />}
                  </Button>
                </div>
              </InputContainer>
            </div>

            <div>
              <Label htmlFor="additionalScopes">Additional Scopes</Label>
              <InputContainer>
                <Input
                  id="additionalScopes"
                  type="text"
                  value={getFieldValue('additionalScopes')}
                  onChange={(e) => handleFieldChange('additionalScopes', e.target.value)}
                  placeholder="e.g., api:read api:write"
                  disabled={useGlobalDefaults}
                  className={errors.additionalScopes ? 'is-invalid' : ''}
                />
                <div className="button-group">
                  <Button
                    type="button"
                    onClick={() => handleCopyToClipboard(getFieldValue('additionalScopes'), 'Additional Scopes')}
                    disabled={useGlobalDefaults || !getFieldValue('additionalScopes')}
                    aria-label="Copy Additional Scopes"
                    title="Copy Additional Scopes"
                  >
                    {copiedField === 'Additional Scopes' ? <FiCheck size={16} /> : <CopyIcon size={16} />}
                  </Button>
                </div>
              </InputContainer>
            </div>
          </FormGrid>
          
          {/* Save Button */}
          <div style={{ 
            padding: '1rem', 
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <button
              type="button"
              onClick={handleSaveCredentials}
              disabled={!hasConfigChanges}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 2rem',
                backgroundColor: hasConfigChanges ? '#3b82f6' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: hasConfigChanges ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                opacity: hasConfigChanges ? 1 : 0.6
              }}
            >
              <FiCheckCircle size={16} />
              {isSaved ? 'Saved!' : 'Save Credentials'}
            </button>
            
            {hasConfigChanges && (
              <button
                type="button"
                onClick={handleResetCredentials}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Reset
              </button>
            )}
          </div>
        </CredentialsContent>
      </CredentialsContainer>

      {copiedField && (
        <StatusMessage $success>
          {copiedField} copied to clipboard!
        </StatusMessage>
      )}
    </>
  );
};

export default FlowCredentials;
