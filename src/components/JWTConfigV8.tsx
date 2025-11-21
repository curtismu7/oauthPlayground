// src/components/JWTConfigV8.tsx
// V8 JWT Configuration Component - Clean UI matching V8 style
// Supports both Client Secret JWT and Private Key JWT configuration and generation

import React, { useState } from 'react';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiCode,
	FiCopy,
	FiEye,
	FiEyeOff,
	FiKey,
} from 'react-icons/fi';
import styled from 'styled-components';
import {
	type ClientSecretJWTConfig,
	type JWTGenerationResult,
	jwtAuthServiceV8,
	type PrivateKeyJWTConfig,
} from '../services/jwtAuthServiceV8';
import { v4ToastManager } from '../utils/v4ToastMessages';

interface JWTConfigV8Props {
	type: 'client_secret_jwt' | 'private_key_jwt';
	initialConfig?: Partial<ClientSecretJWTConfig | PrivateKeyJWTConfig>;
	onJWTGenerated?: (jwt: string, result: JWTGenerationResult) => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem;

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const FieldLabel = styled.label`
  font-size: 0.75rem;
  color: #475569;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`;

const FieldInput = styled.input`
  border-radius: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: #ffffff;
  padding: 0.5rem 0.75rem;
  font-size: 0.78rem;
  color: #1e293b;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const TextArea = styled.textarea`
  border-radius: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: #ffffff;
  padding: 0.5rem 0.75rem;
  font-size: 0.78rem;
  color: #1e293b;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  min-height: 120px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const PasswordInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  input {
    padding-right: 2.5rem;
  }

  button {
    position: absolute;
    right: 0.5rem;
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    transition: color 0.2s;

    &:hover {
      color: #1e293b;
    }
  }
`;

const Button = styled.button`
  border-radius: 0.5rem;
  padding: 0.625rem 1.125rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #2563eb;
  background: #3b82f6;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;

  &:hover:not(:disabled) {
    background: #2563eb;
    border-color: #1d4ed8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const ResultBox = styled.div<{ $success: boolean }>`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background: ${({ $success }) => ($success ? '#f0fdf4' : '#fef2f2')};
  border: 1px solid ${({ $success }) => ($success ? '#86efac' : '#fecaca')};
`;

const ResultHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: ${({ $success }: { $success: boolean }) => ($success ? '#166534' : '#991b1b')};
`;

const JWTDisplay = styled.div`
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.75rem;
  word-break: break-all;
  color: #1e293b;
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 0.75rem;
`;

const ClaimsDisplay = styled.details`
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 0.375rem;
  font-size: 0.75rem;

  summary {
    cursor: pointer;
    font-weight: 600;
    color: #475569;
    margin-bottom: 0.5rem;
  }

  pre {
    margin: 0;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 0.7rem;
    color: #1e293b;
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.625rem 1.125rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.5rem;
  border: 1px solid #2563eb;
  background: #3b82f6;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
    border-color: #1d4ed8;
  }
`;

export const JWTConfigV8: React.FC<JWTConfigV8Props> = ({
	type,
	initialConfig,
	onJWTGenerated,
}) => {
	const [clientId, setClientId] = useState(initialConfig?.clientId || '');
	const [tokenEndpoint, setTokenEndpoint] = useState(initialConfig?.tokenEndpoint || '');
	const [issuer, setIssuer] = useState(initialConfig?.issuer || '');
	const [subject, setSubject] = useState(initialConfig?.subject || '');
	const [expiryMinutes, setExpiryMinutes] = useState(initialConfig?.expiryMinutes || 5);

	// Client Secret JWT specific
	const [clientSecret, setClientSecret] = useState(
		(initialConfig as ClientSecretJWTConfig)?.clientSecret || ''
	);
	const [showSecret, setShowSecret] = useState(false);

	// Private Key JWT specific
	const [privateKey, setPrivateKey] = useState(
		(initialConfig as PrivateKeyJWTConfig)?.privateKey || ''
	);
	const [keyId, setKeyId] = useState((initialConfig as PrivateKeyJWTConfig)?.keyId || '');
	const [_showPrivateKey, _setShowPrivateKey] = useState(false);

	// Generation result
	const [result, setResult] = useState<JWTGenerationResult | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);

	const handleGenerate = async () => {
		setIsGenerating(true);
		setResult(null);

		try {
			let generationResult: JWTGenerationResult;

			if (type === 'client_secret_jwt') {
				if (!clientId || !tokenEndpoint || !clientSecret) {
					v4ToastManager.showError('Please fill in all required fields');
					setIsGenerating(false);
					return;
				}

				generationResult = await jwtAuthServiceV8.generateClientSecretJWT({
					clientId,
					tokenEndpoint,
					clientSecret,
					issuer: issuer || undefined,
					subject: subject || undefined,
					expiryMinutes: expiryMinutes || 5,
				});
			} else {
				if (!clientId || !tokenEndpoint || !privateKey) {
					v4ToastManager.showError('Please fill in all required fields');
					setIsGenerating(false);
					return;
				}

				if (!jwtAuthServiceV8.validatePrivateKey(privateKey)) {
					v4ToastManager.showError(
						'Invalid private key format. Please provide a valid PEM-formatted private key.'
					);
					setIsGenerating(false);
					return;
				}

				generationResult = await jwtAuthServiceV8.generatePrivateKeyJWT({
					clientId,
					tokenEndpoint,
					privateKey,
					keyId: keyId || undefined,
					issuer: issuer || undefined,
					subject: subject || undefined,
					expiryMinutes: expiryMinutes || 5,
				});
			}

			setResult(generationResult);

			if (generationResult.success && generationResult.jwt) {
				v4ToastManager.showSuccess('JWT generated successfully!');
				onJWTGenerated?.(generationResult.jwt, generationResult);
			} else {
				v4ToastManager.showError(generationResult.error || 'Failed to generate JWT');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setResult({ success: false, error: errorMessage });
			v4ToastManager.showError(`Failed to generate JWT: ${errorMessage}`);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleCopyJWT = async () => {
		if (!result?.jwt) return;

		try {
			await navigator.clipboard.writeText(result.jwt);
			v4ToastManager.showSuccess('JWT copied to clipboard');
		} catch (_error) {
			v4ToastManager.showError('Failed to copy JWT');
		}
	};

	return (
		<Container>
			<FieldRow>
				<Field>
					<FieldLabel>Client ID *</FieldLabel>
					<FieldInput
						type="text"
						value={clientId}
						onChange={(e) => setClientId(e.target.value)}
						placeholder="your-client-id"
					/>
				</Field>
				<Field>
					<FieldLabel>Token Endpoint *</FieldLabel>
					<FieldInput
						type="url"
						value={tokenEndpoint}
						onChange={(e) => setTokenEndpoint(e.target.value)}
						placeholder="https://auth.pingone.com/{envId}/as/token"
					/>
				</Field>
			</FieldRow>

			{type === 'client_secret_jwt' ? (
				<Field>
					<FieldLabel>Client Secret *</FieldLabel>
					<PasswordInputWrapper>
						<FieldInput
							type={showSecret ? 'text' : 'password'}
							value={clientSecret}
							onChange={(e) => setClientSecret(e.target.value)}
							placeholder="••••••••••••"
						/>
						<button
							type="button"
							onClick={() => setShowSecret(!showSecret)}
							aria-label={showSecret ? 'Hide secret' : 'Show secret'}
						>
							{showSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
						</button>
					</PasswordInputWrapper>
				</Field>
			) : (
				<>
					<Field>
						<FieldLabel>Private Key (PEM) *</FieldLabel>
						<PasswordInputWrapper>
							<TextArea
								value={privateKey}
								onChange={(e) => setPrivateKey(e.target.value)}
								placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
							/>
						</PasswordInputWrapper>
					</Field>
					<Field>
						<FieldLabel>Key ID (kid)</FieldLabel>
						<FieldInput
							type="text"
							value={keyId}
							onChange={(e) => setKeyId(e.target.value)}
							placeholder="default (optional)"
						/>
					</Field>
				</>
			)}

			<FieldRow>
				<Field>
					<FieldLabel>Issuer</FieldLabel>
					<FieldInput
						type="text"
						value={issuer}
						onChange={(e) => setIssuer(e.target.value)}
						placeholder={`Defaults to ${clientId || 'Client ID'}`}
					/>
				</Field>
				<Field>
					<FieldLabel>Subject</FieldLabel>
					<FieldInput
						type="text"
						value={subject}
						onChange={(e) => setSubject(e.target.value)}
						placeholder={`Defaults to ${clientId || 'Client ID'}`}
					/>
				</Field>
			</FieldRow>

			<Field>
				<FieldLabel>Expiry (minutes)</FieldLabel>
				<FieldInput
					type="number"
					value={expiryMinutes}
					onChange={(e) => setExpiryMinutes(Number(e.target.value) || 5)}
					min="1"
					max="60"
					placeholder="5"
				/>
			</Field>

			<ButtonGroup>
				<Button onClick={handleGenerate} disabled={isGenerating}>
					<FiKey size={16} />
					{isGenerating ? 'Generating...' : 'Generate JWT'}
				</Button>
			</ButtonGroup>

			{result && (
				<ResultBox $success={result.success}>
					{result.success && result.jwt ? (
						<>
							<ResultHeader $success={true}>
								<FiCheckCircle size={16} />
								JWT Generated Successfully
							</ResultHeader>
							<JWTDisplay>{result.jwt}</JWTDisplay>
							<ButtonGroup>
								<CopyButton onClick={handleCopyJWT}>
									<FiCopy size={14} />
									Copy JWT
								</CopyButton>
							</ButtonGroup>
							{result.claims && (
								<ClaimsDisplay>
									<summary>
										<FiCode size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
										View JWT Claims
									</summary>
									<pre>{JSON.stringify(result.claims, null, 2)}</pre>
								</ClaimsDisplay>
							)}
							{result.header && (
								<ClaimsDisplay>
									<summary>
										<FiCode size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
										View JWT Header
									</summary>
									<pre>{JSON.stringify(result.header, null, 2)}</pre>
								</ClaimsDisplay>
							)}
						</>
					) : (
						<ResultHeader $success={false}>
							<FiAlertCircle size={16} />
							Generation Failed
							{result.error && (
								<span style={{ fontWeight: 'normal', marginLeft: '0.5rem' }}>{result.error}</span>
							)}
						</ResultHeader>
					)}
				</ResultBox>
			)}
		</Container>
	);
};

export default JWTConfigV8;
