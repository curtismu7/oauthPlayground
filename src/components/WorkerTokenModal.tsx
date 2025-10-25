// src/components/WorkerTokenModal.tsx
// Modal for configuring worker token when not available

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiKey, FiExternalLink, FiX, FiInfo, FiAlertTriangle, FiEye, FiEyeOff, FiRefreshCw } from 'react-icons/fi';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { DraggableModal } from './DraggableModal';


const InfoBox = styled.div<{ $variant: 'info' | 'warning' }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background: ${({ $variant }) => 
    $variant === 'warning' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(59, 130, 246, 0.1)'
  };
  border: 1px solid ${({ $variant }) => 
    $variant === 'warning' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(59, 130, 246, 0.3)'
  };
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoTitle = styled.div`
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
`;

const InfoText = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  background: ${({ $variant }) => ($variant === 'secondary' ? '#e5e7eb' : '#2563eb')};
  color: ${({ $variant }) => ($variant === 'secondary' ? '#1f2937' : '#ffffff')};
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms ease;
  font-size: 0.875rem;
  text-decoration: none;

  &:hover {
    background: ${({ $variant }) => ($variant === 'secondary' ? '#d1d5db' : '#1e40af')};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const StepList = styled.ol`
  margin: 0;
  padding-left: 1.5rem;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.6;
`;

const StepItem = styled.li`
  margin-bottom: 0.5rem;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem 0;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormLabel = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background-color: #ffffff;
  transition: border-color 0.2s ease;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  option:disabled {
    color: #9ca3af;
  }
`;

const PasswordInput = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  
  input {
    width: 100%;
    padding-right: 3rem; /* Make room for the toggle button */
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: #374151;
  }
`;

const ToggleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #3b82f6;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  
  &:hover {
    color: #2563eb;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  flowType?: string;
  environmentId?: string;
}

export const WorkerTokenModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onContinue,
  flowType = 'flow',
  environmentId = ''
}) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Worker credentials state - load from localStorage on mount
  const [workerCredentials, setWorkerCredentials] = useState(() => {
    try {
      const saved = localStorage.getItem('worker_credentials');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('[WorkerTokenModal] Loaded saved credentials from localStorage:', parsed);
        return {
          environmentId: environmentId || parsed.environmentId || '',
          clientId: parsed.clientId || '',
          clientSecret: parsed.clientSecret || '',
          scopes: parsed.scopes || 'p1:read:environment p1:read:application p1:read:resource',
          authMethod: parsed.authMethod || 'client_secret_post'
        };
      }
    } catch (error) {
      console.error('[WorkerTokenModal] Error loading saved credentials:', error);
    }
    
    return {
      environmentId: environmentId || '',
      clientId: '',
      clientSecret: '',
      scopes: 'p1:read:environment p1:read:application p1:read:resource',
      authMethod: 'client_secret_post' as 'none' | 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt'
    };
  });

  // Update environmentId when prop changes
  useEffect(() => {
    if (environmentId) {
      setWorkerCredentials(prev => ({ ...prev, environmentId }));
    }
  }, [environmentId]);

  // Autosave credentials to localStorage whenever they change
  useEffect(() => {
    if (workerCredentials.clientId || workerCredentials.clientSecret) {
      localStorage.setItem('worker_credentials', JSON.stringify(workerCredentials));
      console.log('[WorkerTokenModal] Autosaved credentials to localStorage');
    }
  }, [workerCredentials]);

  const handleGetWorkerToken = () => {
    setIsNavigating(true);
    v4ToastManager.showInfo('Navigating to get worker token...');
    navigate('/client-generator');
  };

  const handleGenerateWorkerToken = async () => {
    if (!workerCredentials.environmentId || !workerCredentials.clientId || !workerCredentials.clientSecret) {
      v4ToastManager.showError('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    
    try {
      const tokenEndpoint = `https://auth.pingone.com/${workerCredentials.environmentId}/as/token`;
      
      // Prepare headers and body based on authentication method
      let headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      
      let bodyParams: Record<string, string> = {
        grant_type: 'client_credentials',
        scope: workerCredentials.scopes,
      };

      // Handle different authentication methods
      console.log('[WorkerTokenModal] Using auth method:', workerCredentials.authMethod);
      
      switch (workerCredentials.authMethod) {
        case 'client_secret_basic':
          // Use Basic authentication in Authorization header
          headers['Authorization'] = `Basic ${btoa(`${workerCredentials.clientId}:${workerCredentials.clientSecret}`)}`;
          console.log('[WorkerTokenModal] Using Basic auth in header');
          break;
        case 'client_secret_post':
          // Send client credentials in request body
          bodyParams.client_id = workerCredentials.clientId;
          bodyParams.client_secret = workerCredentials.clientSecret;
          console.log('[WorkerTokenModal] Using client credentials in body');
          break;
        case 'client_secret_jwt':
        case 'private_key_jwt':
          // For JWT-based authentication, we'd need to generate a JWT assertion
          // For now, fall back to client_secret_post
          bodyParams.client_id = workerCredentials.clientId;
          bodyParams.client_secret = workerCredentials.clientSecret;
          console.log('[WorkerTokenModal] JWT auth not implemented, falling back to client_secret_post');
          break;
        case 'none':
          // No authentication - just send client_id
          bodyParams.client_id = workerCredentials.clientId;
          console.log('[WorkerTokenModal] Using no authentication');
          break;
        default:
          // Default to client_secret_post
          bodyParams.client_id = workerCredentials.clientId;
          bodyParams.client_secret = workerCredentials.clientSecret;
          console.log('[WorkerTokenModal] Default to client_secret_post');
      }
      
      console.log('[WorkerTokenModal] Request details:', {
        endpoint: tokenEndpoint,
        headers,
        body: bodyParams
      });
      
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers,
        body: new URLSearchParams(bodyParams),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[WorkerTokenModal] Token request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Try to parse the error response for better error messages
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.error === 'invalid_client') {
            throw new Error(`Authentication failed: ${errorJson.error_description || 'Invalid client credentials or unsupported authentication method'}`);
          } else {
            throw new Error(`Token request failed: ${errorJson.error_description || errorData}`);
          }
        } catch (parseError) {
          throw new Error(`Token request failed: ${response.status} ${errorData}`);
        }
      }

      const tokenData = await response.json();
      
      // Calculate expiration time (default to 1 hour if not provided)
      const expiresIn = tokenData.expires_in || 3600; // seconds
      const expiresAt = Date.now() + (expiresIn * 1000); // convert to milliseconds
      
      // Store the worker token with expiration metadata
      localStorage.setItem('worker_token', tokenData.access_token);
      localStorage.setItem('worker_token_expires_at', expiresAt.toString());
      localStorage.setItem('worker_credentials', JSON.stringify(workerCredentials));
      
      console.log('[WorkerTokenModal] Token saved with expiration:', {
        expiresIn: `${expiresIn} seconds`,
        expiresAt: new Date(expiresAt).toISOString()
      });
      
      // Dispatch custom event to notify other components that worker token was updated
      window.dispatchEvent(new CustomEvent('workerTokenUpdated', { 
        detail: { 
          token: tokenData.access_token,
          expiresAt 
        } 
      }));
      
      v4ToastManager.showSuccess(`Worker token generated successfully! Expires in ${Math.floor(expiresIn / 60)} minutes.`);
      onContinue();
      
    } catch (error) {
      console.error('Worker token generation failed:', error);
      v4ToastManager.showError(`Failed to generate worker token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinueWithoutToken = () => {
    v4ToastManager.showWarning('Config Checker will be disabled without worker token');
    onContinue();
  };

  if (!isOpen) return null;

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Worker Token Required"
      headerContent={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiKey />
          <span>Worker Token Required</span>
        </div>
      }
    >

        <InfoBox $variant="warning">
          <FiAlertTriangle size={20} style={{ flexShrink: 0, color: '#f59e0b' }} />
          <InfoContent>
            <InfoTitle>Config Checker Requires Worker Token</InfoTitle>
            <InfoText>
              The Config Checker functionality requires a PingOne Management API worker token to compare 
              configurations and create applications. You can get a worker token using one of the options below.
            </InfoText>
          </InfoContent>
        </InfoBox>

        {!showForm ? (
          <>
            <InfoBox $variant="info">
              <FiInfo size={20} style={{ flexShrink: 0, color: '#3b82f6' }} />
              <InfoContent>
                <InfoTitle>How to Get a Worker Token</InfoTitle>
                <InfoText>
                  You can generate a worker token directly here or use the Client Generator. 
                  A worker token is required for the Config Checker to compare configurations and create applications.
                </InfoText>
              </InfoContent>
            </InfoBox>

            <ButtonGroup>
              <ActionButton onClick={() => setShowForm(true)}>
                <FiKey />
                Generate Worker Token Here
              </ActionButton>
              <ActionButton onClick={handleGetWorkerToken} disabled={isNavigating}>
                <FiExternalLink />
                Use Client Generator
              </ActionButton>
              <ActionButton $variant="secondary" onClick={handleContinueWithoutToken}>
                Continue Without Config Checker
              </ActionButton>
            </ButtonGroup>
          </>
        ) : (
          <>
            <InfoBox $variant="info">
              <FiInfo size={20} style={{ flexShrink: 0, color: '#3b82f6' }} />
              <InfoContent>
                <InfoTitle>Generate Worker Token</InfoTitle>
                <InfoText>
                  Enter your PingOne environment credentials to generate a worker token. 
                  This token will be used for Config Checker functionality.
                </InfoText>
              </InfoContent>
            </InfoBox>

            <FormSection>
              <FormField>
                <FormLabel>Environment ID *</FormLabel>
                <FormInput
                  type="text"
                  placeholder="e.g., b9817c16-9910-4415-b67e-4ac687da74d9"
                  value={workerCredentials.environmentId}
                  onChange={(e) => setWorkerCredentials(prev => ({ ...prev, environmentId: e.target.value }))}
                />
              </FormField>

              <FormField>
                <FormLabel>Client ID *</FormLabel>
                <FormInput
                  type="text"
                  placeholder="e.g., 5ac8ccd7-7ebc-4684-b0d9-233705e87a7c"
                  value={workerCredentials.clientId}
                  onChange={(e) => setWorkerCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                />
              </FormField>

              <FormField>
                <FormLabel>Client Secret *</FormLabel>
                <PasswordInput>
                  <FormInput
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your client secret"
                    value={workerCredentials.clientSecret}
                    onChange={(e) => setWorkerCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                  />
                  <PasswordToggle onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </PasswordToggle>
                </PasswordInput>
              </FormField>

              <FormField>
                <FormLabel>Token Endpoint Authentication Method</FormLabel>
                <FormSelect
                  value={workerCredentials.authMethod}
                  onChange={(e) => setWorkerCredentials(prev => ({ ...prev, authMethod: e.target.value as any }))}
                >
                  <option value="none" disabled>None</option>
                  <option value="client_secret_basic">Client Secret Basic</option>
                  <option value="client_secret_post">Client Secret Post</option>
                  <option value="client_secret_jwt">Client Secret JWT</option>
                  <option value="private_key_jwt">Private Key JWT</option>
                </FormSelect>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  💡 <strong>Tip:</strong> Use "Client Secret Post" for most PingOne applications. 
                  Check your application's "Token Endpoint Authentication Method" in PingOne Admin.
                </div>
              </FormField>

              <FormField>
                <FormLabel>Scopes</FormLabel>
                <FormInput
                  type="text"
                  value={workerCredentials.scopes}
                  onChange={(e) => setWorkerCredentials(prev => ({ ...prev, scopes: e.target.value }))}
                />
              </FormField>
            </FormSection>

            <ButtonGroup>
              <ActionButton 
                onClick={handleGenerateWorkerToken} 
                disabled={isGenerating || !workerCredentials.environmentId || !workerCredentials.clientId || !workerCredentials.clientSecret}
              >
                {isGenerating ? <LoadingSpinner /> : <FiRefreshCw />}
                {isGenerating ? 'Generating...' : 'Generate Worker Token'}
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </ActionButton>
            </ButtonGroup>
          </>
        )}
    </DraggableModal>
  );
};

