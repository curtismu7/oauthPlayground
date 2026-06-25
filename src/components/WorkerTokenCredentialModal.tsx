import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { DraggableModal } from './DraggableModal';
import { RegionSelect } from './RegionSelect';
import { ButtonSpinner } from './ui/ButtonSpinner';
import { StandardMessage } from './StandardMessage';
import { acquireWorkerToken } from '../services/workerTokenAcquisitionService';

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const FormSection = styled.div`
  border: 1px solid var(--oauth-authz-border-color, #e5e7eb);
  border-radius: 6px;
  padding: 16px;
  background: var(--oauth-authz-bg-secondary, #ffffff);
`;

const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--oauth-authz-text-primary, #1d2e3f);
  margin-bottom: 12px;
  opacity: 0.75;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: var(--oauth-authz-text-primary, #1d2e3f);
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid var(--oauth-authz-border-color, #e5e7eb);
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  background: var(--oauth-authz-bg-secondary, #ffffff);
  color: var(--oauth-authz-text-primary, #1d2e3f);
  transition: border-color 200ms ease;

  &:focus {
    outline: none;
    border-color: var(--oauth-authz-accent, #1d4ed8);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  padding: 8px 12px;
  border: 1px solid var(--oauth-authz-border-color, #e5e7eb);
  border-radius: 4px;
  font-size: 13px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  background: var(--oauth-authz-bg-secondary, #ffffff);
  color: var(--oauth-authz-text-primary, #1d2e3f);
  resize: vertical;
  min-height: 60px;
  transition: border-color 200ms ease;

  &:focus {
    outline: none;
    border-color: var(--oauth-authz-accent, #1d4ed8);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const HintText = styled.div`
  font-size: 12px;
  color: var(--oauth-authz-text-primary, #1d2e3f);
  opacity: 0.6;
`;

const AdvancedToggle = styled.button`
  background: none;
  border: none;
  padding: 8px 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--oauth-authz-accent, #1d4ed8);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: opacity 200ms ease;

  &:hover {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AdvancedArrow = styled.span<{ open: boolean }>`
  display: inline-block;
  transform: rotate(${props => props.open ? 90 : 0}deg);
  transition: transform 200ms ease;
`;

const AdvancedSection = styled.div<{ open: boolean }>`
  display: ${props => props.open ? 'block' : 'none'};
  margin-top: 12px;
`;

const AuthMethodGroup = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;

  input {
    cursor: pointer;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
`;

const CancelButton = styled.button`
  padding: 10px 16px;
  border: 1px solid var(--oauth-authz-border-color, #e5e7eb);
  border-radius: 4px;
  background: var(--oauth-authz-bg-secondary, #ffffff);
  color: var(--oauth-authz-text-primary, #1d2e3f);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease;

  &:hover:not(:disabled) {
    background: var(--oauth-authz-bg-primary, #f5f3ff);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled(ButtonSpinner)`
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  background: var(--oauth-authz-accent, #1d4ed8);
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 200ms ease;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ArrowIcon = styled.span`
  font-size: 14px;
`;

const SuccessFlash = styled.div`
  animation: successFlash 0.4s ease;

  @keyframes successFlash {
    0% {
      background: #dcfce7;
    }
    100% {
      background: transparent;
    }
  }
`;

interface WorkerTokenCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenAcquired?: () => void;
}

interface FormState {
  environmentId: string;
  clientId: string;
  clientSecret: string;
  region: 'us' | 'eu' | 'ap' | 'ca';
  scopes: string;
  authMethod: 'client_secret_post' | 'client_secret_basic';
  customDomain: string;
}

interface EnvConfig {
  environmentId: string;
  clientId: string;
  hasClientSecret: boolean;
  preConfigured: boolean;
}

export function WorkerTokenCredentialModal({
  isOpen,
  onClose,
  onTokenAcquired,
}: WorkerTokenCredentialModalProps) {
  const [form, setForm] = useState<FormState>({
    environmentId: '',
    clientId: '',
    clientSecret: '',
    region: 'us',
    scopes: 'p1:read:user p1:create:user',
    authMethod: 'client_secret_post',
    customDomain: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [envConfig, setEnvConfig] = useState<EnvConfig | null>(null);

  // Fetch env config on mount
  useEffect(() => {
    if (!isOpen) return;

    const fetchEnvConfig = async () => {
      try {
        const res = await fetch('/api/env-config');
        if (res.ok) {
          const data = await res.json();
          setEnvConfig(data);
          setForm(prev => ({
            ...prev,
            environmentId: data.environmentId || prev.environmentId,
            clientId: data.clientId || prev.clientId,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch env config:', err);
      }
    };

    fetchEnvConfig();
  }, [isOpen]);

  const handleInputChange = (
    field: keyof FormState,
    value: string | boolean
  ) => {
    setError(null);
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!form.environmentId.trim()) {
      setError('Environment ID is required');
      return false;
    }
    if (!form.clientId.trim()) {
      setError('Client ID is required');
      return false;
    }
    if (!form.clientSecret.trim()) {
      setError('Client Secret is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const scopes = form.scopes
        .split(/\s+/)
        .filter(s => s.trim())
        .map(s => s.trim());

      await acquireWorkerToken({
        environmentId: form.environmentId.trim(),
        clientId: form.clientId.trim(),
        clientSecret: form.clientSecret.trim(),
        region: form.region,
        scopes: scopes.length > 0 ? scopes : ['p1:read:user'],
        authMethod: form.authMethod,
        customDomain: form.customDomain.trim() || undefined,
      });

      setShowSuccess(true);
      setTimeout(() => {
        onTokenAcquired?.();
        window.dispatchEvent(new CustomEvent('worker-token-acquired'));
        onClose();
      }, 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get worker token';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Worker Token"
      width={520}
    >
      <ModalContent>
        {error && (
          <StandardMessage type="error" message={error} onDismiss={() => setError(null)} />
        )}

        {showSuccess && (
          <SuccessFlash>
            <StandardMessage
              type="success"
              message="Worker token acquired successfully"
              onDismiss={() => setShowSuccess(false)}
            />
          </SuccessFlash>
        )}

        <form onSubmit={handleSubmit}>
          {/* Environment Section */}
          <FormSection>
            <SectionTitle>Environment</SectionTitle>

            <FormGroup>
              <Label htmlFor="env-id">Environment ID</Label>
              <Input
                id="env-id"
                type="text"
                value={form.environmentId}
                onChange={e => handleInputChange('environmentId', e.target.value)}
                placeholder="UUID of your PingOne environment"
                disabled={loading}
              />
              {envConfig?.preConfigured && (
                <HintText>Pre-configured from environment variables</HintText>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="region">Region</Label>
              <RegionSelect
                value={form.region}
                onChange={region => handleInputChange('region', region)}
                disabled={loading}
              />
              <HintText>
                Token endpoint: https://auth.pingone.{form.region === 'eu' ? 'eu' : form.region === 'ap' ? 'asia' : form.region === 'ca' ? 'ca' : 'com'}/{form.environmentId}/as/token
              </HintText>
            </FormGroup>
          </FormSection>

          {/* Worker Application Section */}
          <FormSection>
            <SectionTitle>Worker Application</SectionTitle>

            <FormGroup>
              <Label htmlFor="client-id">Client ID</Label>
              <Input
                id="client-id"
                type="text"
                value={form.clientId}
                onChange={e => handleInputChange('clientId', e.target.value)}
                placeholder="Worker application client ID"
                disabled={loading}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="client-secret">Client Secret</Label>
              <Input
                id="client-secret"
                type="password"
                value={form.clientSecret}
                onChange={e => handleInputChange('clientSecret', e.target.value)}
                placeholder="Never shared or logged"
                disabled={loading}
              />
              <HintText>
                {envConfig?.hasClientSecret
                  ? 'Server has a pre-configured secret (will use that if blank)'
                  : 'Must be entered; never pre-filled for security'}
              </HintText>
            </FormGroup>
          </FormSection>

          {/* Advanced Options */}
          <div>
            <AdvancedToggle
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              disabled={loading}
            >
              <AdvancedArrow open={showAdvanced}>▸</AdvancedArrow>
              Advanced Options
            </AdvancedToggle>

            <AdvancedSection open={showAdvanced}>
              <FormSection style={{ marginTop: 12 }}>
                <FormGroup>
                  <Label htmlFor="scopes">Scopes (space-separated)</Label>
                  <Textarea
                    id="scopes"
                    value={form.scopes}
                    onChange={e => handleInputChange('scopes', e.target.value)}
                    placeholder="p1:read:user p1:create:user"
                    disabled={loading}
                  />
                  <HintText>Optional; defaults to p1:read:user p1:create:user</HintText>
                </FormGroup>

                <FormGroup>
                  <Label>Client Authentication Method</Label>
                  <AuthMethodGroup>
                    <RadioLabel>
                      <input
                        type="radio"
                        name="authMethod"
                        value="client_secret_post"
                        checked={form.authMethod === 'client_secret_post'}
                        onChange={() => handleInputChange('authMethod', 'client_secret_post')}
                        disabled={loading}
                      />
                      POST (credentials in body)
                    </RadioLabel>
                    <RadioLabel>
                      <input
                        type="radio"
                        name="authMethod"
                        value="client_secret_basic"
                        checked={form.authMethod === 'client_secret_basic'}
                        onChange={() => handleInputChange('authMethod', 'client_secret_basic')}
                        disabled={loading}
                      />
                      Basic (Authorization header)
                    </RadioLabel>
                  </AuthMethodGroup>
                  <HintText>How to authenticate with the token endpoint</HintText>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="custom-domain">Custom Domain (optional)</Label>
                  <Input
                    id="custom-domain"
                    type="text"
                    value={form.customDomain}
                    onChange={e => handleInputChange('customDomain', e.target.value)}
                    placeholder="e.g., auth.custom.com (leave blank for region-based domain)"
                    disabled={loading}
                  />
                  <HintText>For non-standard deployments; overrides region-based domain</HintText>
                </FormGroup>
              </FormSection>
            </AdvancedSection>
          </div>

          {/* Buttons */}
          <ButtonGroup>
            <CancelButton
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </CancelButton>
            <SubmitButton
              type="submit"
              loading={loading}
              loadingText="Getting Token..."
            >
              Get Worker Token
              <ArrowIcon>→</ArrowIcon>
            </SubmitButton>
          </ButtonGroup>
        </form>
      </ModalContent>
    </DraggableModal>
  );
}
