// src/components/WorkerTokenCredentialsInput.tsx
// Worker Token Credentials Input Component - Specialized UI for PingOne Worker Token configuration
// Provides a clean, focused interface for machine-to-machine authentication setup

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  FiKey, 
  FiGlobe, 
  FiEye, 
  FiEyeOff, 
  FiSave, 
  FiCheck, 
  FiAlertCircle, 
  FiInfo,
  FiChevronDown,
  FiChevronRight,
  FiRefreshCw
} from 'react-icons/fi';
import { 
  workerTokenCredentialsService, 
  type WorkerTokenCredentials, 
  type WorkerTokenValidationResult 
} from '../services/workerTokenCredentialsService';
import { v4ToastManager } from '../utils/v4ToastMessages';

interface WorkerTokenCredentialsInputProps {
  credentials: WorkerTokenCredentials;
  onCredentialsChange: (credentials: WorkerTokenCredentials) => void;
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
  showAdvancedOptions?: boolean;
  disabled?: boolean;
}

// Styled Components
const Container = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%);
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HeaderSubtitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.9;
`;

const ToggleIcon = styled.span<{ $collapsed: boolean }>`
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
  transition: transform 0.2s ease;
`;

const Content = styled.div<{ $collapsed: boolean }>`
  max-height: ${({ $collapsed }) => ($collapsed ? '0' : '1000px')};
  overflow: hidden;
  transition: max-height 0.3s ease;
  background: white;
`;

const FormContainer = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormLabel = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RequiredIndicator = styled.span`
  color: #ef4444;
  font-weight: 600;
`;

const InputGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #f97316;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
  }

  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }

  &[data-error="true"] {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 0.75rem;
  padding: 0.25rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition: color 0.2s ease;

  &:hover {
    color: #374151;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background-color: white;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #f97316;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
  }

  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const ScopesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ScopesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
`;

const ScopeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 0.375rem;
  font-size: 0.875rem;
`;

const ScopeCheckbox = styled.input`
  margin: 0;
`;

const ScopeLabel = styled.label`
  margin: 0;
  cursor: pointer;
  flex: 1;
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const SaveButton = styled.button<{ $isSaving?: boolean; $hasChanges?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: ${({ $hasChanges }) => ($hasChanges ? '#10b981' : '#6b7280')};
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: ${({ $isSaving, $hasChanges }) => ($isSaving || !$hasChanges ? 'not-allowed' : 'pointer')};
  opacity: ${({ $isSaving, $hasChanges }) => ($isSaving || !$hasChanges ? 0.6 : 1)};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${({ $hasChanges }) => ($hasChanges ? '#059669' : '#6b7280')};
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const ValidationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ValidationItem = styled.div<{ $type: 'error' | 'warning' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: ${({ $type }) => ($type === 'error' ? '#fef2f2' : '#fffbeb')};
  color: ${({ $type }) => ($type === 'error' ? '#dc2626' : '#d97706')};
  border: 1px solid ${({ $type }) => ($type === 'error' ? '#fecaca' : '#fed7aa')};
`;

const InfoBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  color: #1e40af;
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
`;

const InfoText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
`;

export const WorkerTokenCredentialsInput: React.FC<WorkerTokenCredentialsInputProps> = ({
  credentials,
  onCredentialsChange,
  onSave,
  hasUnsavedChanges = false,
  isSaving = false,
  showAdvancedOptions = false,
  disabled = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [validation, setValidation] = useState<WorkerTokenValidationResult | null>(null);

  // Validate credentials whenever they change
  useEffect(() => {
    const result = workerTokenCredentialsService.validateCredentials(credentials);
    setValidation(result);
  }, [credentials]);

  const handleFieldChange = useCallback((field: keyof WorkerTokenCredentials, value: string | string[]) => {
    onCredentialsChange({
      ...credentials,
      [field]: value
    });
  }, [credentials, onCredentialsChange]);

  const handleSave = useCallback(async () => {
    if (!validation?.isValid || isSaving) return;

    try {
      const success = workerTokenCredentialsService.saveCredentials(credentials);
      if (success) {
        v4ToastManager.showSuccess('Worker Token credentials saved successfully');
        onSave?.();
      } else {
        v4ToastManager.showError('Failed to save credentials');
      }
    } catch (error) {
      console.error('[WorkerTokenCredentialsInput] Save failed:', error);
      v4ToastManager.showError('Failed to save credentials');
    }
  }, [credentials, validation, isSaving, onSave]);

  const availableRegions = workerTokenCredentialsService.getAvailableRegions();
  const availableScopes = workerTokenCredentialsService.getAvailableScopes();
  const defaultScopes = workerTokenCredentialsService.getDefaultScopes();

  return (
    <Container>
      <Header onClick={() => setIsCollapsed(!isCollapsed)}>
        <HeaderLeft>
          <div>
            <HeaderTitle>
              <FiKey size={20} />
              🔑 Worker Token Configuration
            </HeaderTitle>
            <HeaderSubtitle>
              Client Credentials Grant • Machine-to-Machine Authentication • No Redirect URI Required
            </HeaderSubtitle>
          </div>
        </HeaderLeft>
        <ToggleIcon $collapsed={isCollapsed}>
          <FiChevronDown size={20} />
        </ToggleIcon>
      </Header>

      <Content $collapsed={isCollapsed}>
        <FormContainer>
          <InfoBox>
            <FiInfo size={20} style={{ flexShrink: 0 }} />
            <InfoContent>
              <InfoTitle>🔑 Worker Token (Client Credentials)</InfoTitle>
              <InfoText>
                Configure your PingOne application for machine-to-machine authentication. 
                This uses the OAuth 2.0 Client Credentials grant type to obtain access tokens 
                for API operations without user interaction.
              </InfoText>
            </InfoContent>
          </InfoBox>

          <FormGrid>
            <FormField>
              <FormLabel>
                <FiGlobe size={16} />
                Environment ID <RequiredIndicator>*</RequiredIndicator>
              </FormLabel>
              <Input
                type="text"
                value={credentials.environmentId}
                onChange={(e) => handleFieldChange('environmentId', e.target.value)}
                placeholder="Enter your PingOne Environment ID"
                disabled={disabled}
                data-error={validation?.errors.some(e => e.includes('Environment ID'))}
              />
            </FormField>

            <FormField>
              <FormLabel>
                <FiKey size={16} />
                Region
              </FormLabel>
              <Select
                value={credentials.region || 'us'}
                onChange={(e) => handleFieldChange('region', e.target.value as 'us' | 'eu' | 'ap' | 'ca')}
                disabled={disabled}
              >
                {availableRegions.map(region => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField>
              <FormLabel>
                <FiKey size={16} />
                Client ID <RequiredIndicator>*</RequiredIndicator>
              </FormLabel>
              <Input
                type="text"
                value={credentials.clientId}
                onChange={(e) => handleFieldChange('clientId', e.target.value)}
                placeholder="Enter your PingOne Client ID"
                disabled={disabled}
                data-error={validation?.errors.some(e => e.includes('Client ID'))}
              />
            </FormField>

            <FormField>
              <FormLabel>
                <FiKey size={16} />
                Client Secret <RequiredIndicator>*</RequiredIndicator>
              </FormLabel>
              <InputGroup>
                <Input
                  type={showClientSecret ? 'text' : 'password'}
                  value={credentials.clientSecret}
                  onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
                  placeholder="Enter your PingOne Client Secret"
                  disabled={disabled}
                  data-error={validation?.errors.some(e => e.includes('Client Secret'))}
                />
                <PasswordToggle
                  type="button"
                  onClick={() => setShowClientSecret(!showClientSecret)}
                  disabled={disabled}
                >
                  {showClientSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </PasswordToggle>
              </InputGroup>
            </FormField>
          </FormGrid>

          {showAdvancedOptions && (
            <FormField>
              <FormLabel>Scopes</FormLabel>
              <ScopesContainer>
                <ScopesGrid>
                  {availableScopes.map(scope => (
                    <ScopeItem key={scope}>
                      <ScopeCheckbox
                        type="checkbox"
                        id={`scope-${scope}`}
                        checked={credentials.scopes?.includes(scope) || false}
                        onChange={(e) => {
                          const currentScopes = credentials.scopes || [];
                          const newScopes = e.target.checked
                            ? [...currentScopes, scope]
                            : currentScopes.filter(s => s !== scope);
                          handleFieldChange('scopes', newScopes);
                        }}
                        disabled={disabled}
                      />
                      <ScopeLabel htmlFor={`scope-${scope}`}>
                        {scope}
                      </ScopeLabel>
                    </ScopeItem>
                  ))}
                </ScopesGrid>
              </ScopesContainer>
            </FormField>
          )}

          {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
            <ValidationContainer>
              {validation.errors.map((error, index) => (
                <ValidationItem key={index} $type="error">
                  <FiAlertCircle size={16} />
                  {error}
                </ValidationItem>
              ))}
              {validation.warnings.map((warning, index) => (
                <ValidationItem key={index} $type="warning">
                  <FiInfo size={16} />
                  {warning}
                </ValidationItem>
              ))}
            </ValidationContainer>
          )}

          <ActionsContainer>
            <div>
              {hasUnsavedChanges && (
                <span style={{ color: '#f59e0b', fontSize: '0.875rem' }}>
                  You have unsaved changes
                </span>
              )}
            </div>
            <SaveButton
              onClick={handleSave}
              disabled={!validation?.isValid || isSaving || !hasUnsavedChanges}
              $isSaving={isSaving}
              $hasChanges={hasUnsavedChanges}
            >
              {isSaving ? (
                <>
                  <FiRefreshCw className="animate-spin" size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave size={16} />
                  Save Credentials
                </>
              )}
            </SaveButton>
          </ActionsContainer>
        </FormContainer>
      </Content>
    </Container>
  );
};

export default WorkerTokenCredentialsInput;
