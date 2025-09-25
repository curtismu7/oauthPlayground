// src/components/JwksKeySourceSelector.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { FiCopy, FiEye, FiEyeOff, FiKey } from 'react-icons/fi';
import { buildJWKSUri } from '../utils/jwks';
import { isPrivateKey } from '../utils/jwksConverter';

export type JwksKeySource = 'jwks-endpoint' | 'private-key';

interface JwksKeySourceSelectorProps {
  /** Currently selected key source */
  value: JwksKeySource;
  /** Callback when the key source changes */
  onChange: (next: JwksKeySource) => void;
  /** Explicit JWKS endpoint URL. If not provided we derive it from the issuer/environment */
  jwksUrl?: string;
  /** PingOne environment identifier (UUID) used to derive default JWKS URL */
  environmentId?: string;
  /** Optional issuer URL if already known */
  issuer?: string;
  /** Fired after JWKS URL copy succeeds */
  onCopyJwksUrlSuccess?: (url: string) => void;
  /** Fired after JWKS URL copy fails */
  onCopyJwksUrlError?: (error: unknown) => void;
  /** Current PEM private key string */
  privateKey: string;
  /** Callback when private key textarea changes */
  onPrivateKeyChange: (pem: string) => void;
  /** Generate key button handler */
  onGenerateKey: () => void;
  /** Spinner state for generate button */
  isGeneratingKey?: boolean;
  /** Whether private key textarea content is currently masked */
  showPrivateKey: boolean;
  /** Toggle private key visibility */
  onTogglePrivateKey: () => void;
  /** Optional handler to copy private key value */
  onCopyPrivateKey?: () => void;
  /** Called when JWKS endpoint radio selected */
  onSelectJwksEndpoint?: () => void;
  /** Called when private key radio selected */
  onSelectPrivateKey?: () => void;
  /** Called when validation state changes */
  onValidationChange?: (isValid: boolean) => void;
  /** Optional helper shown below private key textarea */
  privateKeyHelper?: React.ReactNode;
  /** Optional instructions shown when JWKS endpoint mode is active */
  jwksInstructions?: React.ReactNode;
  /** Optional warning banner when configuration is mismatched */
  configurationWarning?: React.ReactNode;
  /** Whether to render the configuration warning */
  showConfigurationWarning?: boolean;
  /** Optional label overrides */
  copyButtonLabel?: string;
  generateKeyLabel?: string;
  jwksOptionLabel?: string;
  privateKeyOptionLabel?: string;
  privateKeyLabel?: string;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const RadioRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
`;

const Instructions = styled.div`
  margin-left: 1.5rem;
  margin-bottom: 1rem;
`;

const JwksUrlBox = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 6px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const UrlCode = styled.code`
  color: #047857;
  font-size: 0.875rem;
  font-weight: 500;
  word-break: break-all;
  flex: 1;
  margin-right: 0.5rem;
`;

const CopyButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;

  &:hover {
    background: #2563eb;
  }
`;

const Warning = styled.div`
  margin-left: 1.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 6px;
`;

const PrivateKeyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PrivateKeyHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const GenerateButton = styled.button<{ disabled?: boolean }>`
  background: ${(props) => (props.disabled ? '#9ca3af' : '#10b981')};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);

  &:hover {
    background: ${(props) => (props.disabled ? '#9ca3af' : '#059669')};
  }
`;

const PrivateKeyArea = styled.textarea`
  width: 100%;
  height: 120px;
  padding: 1rem;
  border: 2px solid #10b981;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  resize: vertical;
  background-color: white;
  font-weight: 500;
  color: #065f46;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
  transition: all 0.2s ease;

  &:focus {
    border-color: #059669;
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
  }
`;

const ToggleSecretButton = styled.button`
  position: absolute;
  right: 1rem;
  top: 1rem;
  background: #10b981;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background: #059669;
    transform: scale(1.05);
  }
`;

const PrivateKeyWrapper = styled.div`
  position: relative;
`;

const CopyPrivateKeyButton = styled.button`
  position: absolute;
  right: 3.5rem;
  top: 1rem;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background: #2563eb;
    transform: scale(1.05);
  }
`;

const Helper = styled.div`
  font-size: 0.875rem;
  color: #047857;
  background: rgba(16, 185, 129, 0.1);
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(16, 185, 129, 0.2);
`;

const ErrorText = styled.div`
  font-size: 0.85rem;
  color: #b91c1c;
  margin-top: -0.5rem;
`;

const Label = styled.label`
  color: #065f46;
  font-weight: 600;
`;

const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const DEFAULT_COPY_LABEL = 'Copy';
const DEFAULT_GENERATE_LABEL = 'Generate Key';
const DEFAULT_JWKS_OPTION_LABEL = 'Use JWKS Endpoint (Recommended)';
const DEFAULT_PRIVATE_KEY_OPTION_LABEL = 'Upload Private Key';
const DEFAULT_PRIVATE_KEY_LABEL = 'Private Key (PEM Format) *';

const deriveIssuer = (issuer?: string, environmentId?: string): string | undefined => {
  if (issuer) {
    return issuer;
  }
  if (environmentId) {
    return `https://auth.pingone.com/${environmentId}/as`;
  }
  return undefined;
};

const resolveJwksUrl = (explicit?: string, issuer?: string, environmentId?: string) => {
  if (explicit) {
    return explicit;
  }
  const derivedIssuer = deriveIssuer(issuer, environmentId);
  if (!derivedIssuer) {
    return '';
  }
  return buildJWKSUri(derivedIssuer);
};

const JwksKeySourceSelector: React.FC<JwksKeySourceSelectorProps> = ({
  value,
  onChange,
  jwksUrl,
  environmentId,
  issuer,
  onCopyJwksUrlSuccess,
  onCopyJwksUrlError,
  privateKey,
  onPrivateKeyChange,
  onGenerateKey,
  isGeneratingKey,
  showPrivateKey,
  onTogglePrivateKey,
  privateKeyHelper,
  jwksInstructions,
  configurationWarning,
  showConfigurationWarning,
  copyButtonLabel = DEFAULT_COPY_LABEL,
  generateKeyLabel = DEFAULT_GENERATE_LABEL,
  jwksOptionLabel = DEFAULT_JWKS_OPTION_LABEL,
  privateKeyOptionLabel = DEFAULT_PRIVATE_KEY_OPTION_LABEL,
  privateKeyLabel = DEFAULT_PRIVATE_KEY_LABEL,
  onCopyPrivateKey,
  onSelectJwksEndpoint,
  onSelectPrivateKey,
  onValidationChange,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const resolvedJwksUrl = resolveJwksUrl(jwksUrl, issuer, environmentId);

  const handleCopyJwksUrl = async () => {
    if (!resolvedJwksUrl) {
      onCopyJwksUrlError?.(new Error('No JWKS URL available to copy.'));
      return;
    }
    try {
      await navigator.clipboard.writeText(resolvedJwksUrl);
      onCopyJwksUrlSuccess?.(resolvedJwksUrl);
    } catch (error) {
      onCopyJwksUrlError?.(error);
    }
  };

  const handleRadioChange = (next: JwksKeySource) => {
    if (next === 'jwks-endpoint') {
      setValidationError(null);
      onSelectJwksEndpoint?.();
    } else {
      if (!privateKey.trim()) {
        const message = 'Private key required when using Upload Private Key.';
        setValidationError(message);
        onValidationChange?.(false);
      } else if (!isPrivateKey(privateKey.trim())) {
        const message = 'Private key must be valid PEM format.';
        setValidationError(message);
        onValidationChange?.(false);
      } else {
        setValidationError(null);
        onValidationChange?.(true);
      }
      onSelectPrivateKey?.();
    }
    onChange(next);
  };

  const handlePrivateKeyChange = (pem: string) => {
    onPrivateKeyChange(pem);
    if (!pem.trim()) {
      setValidationError('Private key required when using Upload Private Key.');
      onValidationChange?.(false);
    } else if (!isPrivateKey(pem.trim())) {
      setValidationError('Private key must be valid PEM format.');
      onValidationChange?.(false);
    } else {
      setValidationError(null);
      onValidationChange?.(true);
    }
  };

  return (
    <Container>
      <div>
        <RadioRow>
          <input
            type="radio"
            name="jwks-key-source"
            value="jwks-endpoint"
            checked={value === 'jwks-endpoint'}
            onChange={() => handleRadioChange('jwks-endpoint')}
            style={{ margin: 0, cursor: 'pointer' }}
          />
          <span style={{ color: '#065f46', fontWeight: 600 }}>{jwksOptionLabel}</span>
        </RadioRow>
        <p style={{ margin: '0.5rem 0 0 1.5rem', color: '#047857', fontSize: '0.875rem' }}>
          PingOne will fetch the public key from your JWKS endpoint. No private key upload needed.
          <br />
          <br />
          <strong>🌐 Public URL Required:</strong> PingOne needs to access your JWKS endpoint from their servers, so it must be publicly accessible (not localhost).
        </p>

        {value === 'jwks-endpoint' && (
          <Instructions>
            <Label style={{ marginBottom: '0.5rem', display: 'block' }}>Your JWKS Endpoint URL:</Label>
            <JwksUrlBox>
              <UrlCode>{resolvedJwksUrl || 'Provide environment details to compute JWKS URL'}</UrlCode>
              <CopyButton type="button" onClick={handleCopyJwksUrl} title="Copy JWKS Endpoint URL">
                <FiCopy size={14} />
                {copyButtonLabel}
              </CopyButton>
            </JwksUrlBox>
            {jwksInstructions}
          </Instructions>
        )}

        {showConfigurationWarning && configurationWarning && <Warning>{configurationWarning}</Warning>}
      </div>

      <div>
        <RadioRow>
          <input
            type="radio"
            name="jwks-key-source"
            value="private-key"
            checked={value === 'private-key'}
            onChange={() => handleRadioChange('private-key')}
            style={{ margin: 0, cursor: 'pointer' }}
          />
          <span style={{ color: '#065f46', fontWeight: 600 }}>{privateKeyOptionLabel}</span>
        </RadioRow>
        <p style={{ margin: '0.5rem 0 0 1.5rem', color: '#047857', fontSize: '0.875rem' }}>
          Upload the private key directly to PingOne. Copy the key from below.
        </p>
      </div>

      {value === 'private-key' && (
        <PrivateKeyContainer>
          <PrivateKeyHeader>
            <Label>{privateKeyLabel}</Label>
            <GenerateButton type="button" onClick={onGenerateKey} disabled={isGeneratingKey}>
              {isGeneratingKey ? (
                <>
                  <Spinner />
                  Generating...
                </>
              ) : (
                <>
                  <FiKey size={14} />
                  {generateKeyLabel}
                </>
              )}
            </GenerateButton>
          </PrivateKeyHeader>
          <PrivateKeyWrapper>
            <PrivateKeyArea
              value={privateKey}
              onChange={(event) => handlePrivateKeyChange(event.target.value)}
              placeholder={'-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...'}
              style={{ paddingRight: showPrivateKey ? '6rem' : '4rem' }}
            />
            <ToggleSecretButton type="button" onClick={onTogglePrivateKey} title={showPrivateKey ? 'Hide private key' : 'Show private key'}>
              {showPrivateKey ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </ToggleSecretButton>
            {onCopyPrivateKey && privateKey && (
              <CopyPrivateKeyButton type="button" onClick={onCopyPrivateKey} title="Copy Private Key">
                <FiCopy size={16} />
              </CopyPrivateKeyButton>
            )}
          </PrivateKeyWrapper>
          {validationError && <ErrorText>{validationError}</ErrorText>}
          {privateKeyHelper && <Helper>{privateKeyHelper}</Helper>}
        </PrivateKeyContainer>
      )}
    </Container>
  );
};

// TODO: Validate pasted JWKS/private key using jwks utilities before export
export default JwksKeySourceSelector;

