// src/components/JWTConfigV8.tsx
// V8 JWT Configuration Component - Clean UI matching V8 style
// Supports both Client Secret JWT and Private Key JWT configuration and generation


import React, { useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import {
	type ClientSecretJWTConfig,
	type JWTGenerationResult,
	jwtAuthServiceV8,
	type PrivateKeyJWTConfig,
} from '../services/jwtAuthServiceV8';
import {
	assessSecurityStrength,
	type GeneratedKeyPair,
	type GeneratedSecret,
	generateClientSecret,
	generateRSAKeyPair,
} from '../utils/keyGeneration';
import { createModuleLogger } from '../utils/consoleMigrationHelper';

const MODULE_TAG = '[🔐 JWT-CONFIG-V8]';

interface JWTConfigV8Props {
	type: 'client_secret_jwt' | 'private_key_jwt';
	initialConfig?: Partial<ClientSecretJWTConfig | PrivateKeyJWTConfig>;
	onJWTGenerated?: (jwt: string, result: JWTGenerationResult) => void;
	onPrivateKeyGenerated?: (privateKey: string, keyId?: string) => void;
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
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`;

const FieldInput = styled.input`
  border-radius: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: V9_COLORS.TEXT.WHITE;
  padding: 0.5rem 0.75rem;
  font-size: 0.78rem;
  color: #1e293b;

  &:focus {
    outline: none;
    border-color: V9_COLORS.PRIMARY.BLUE_DARK;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const TextArea = styled.textarea`
  border-radius: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: V9_COLORS.TEXT.WHITE;
  padding: 0.5rem 0.75rem;
  font-size: 0.78rem;
  color: #1e293b;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  min-height: 120px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: V9_COLORS.PRIMARY.BLUE_DARK;
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
    color: V9_COLORS.TEXT.GRAY_MEDIUM;
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
  border: 1px solid V9_COLORS.PRIMARY.BLUE_DARK;
  background: V9_COLORS.PRIMARY.BLUE;
  color: V9_COLORS.TEXT.WHITE;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;

  &:hover:not(:disabled) {
    background: V9_COLORS.PRIMARY.BLUE_DARK;
    border-color: V9_COLORS.PRIMARY.BLUE_DARK;
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

const JWTDisplay = styled.div`
  background: V9_COLORS.TEXT.WHITE;
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
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 0.375rem;
  font-size: 0.75rem;

  summary {
    cursor: pointer;
    font-weight: 600;
    color: V9_COLORS.TEXT.GRAY_MEDIUM;
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
  border: 1px solid V9_COLORS.PRIMARY.BLUE_DARK;
  background: V9_COLORS.PRIMARY.BLUE;
  color: V9_COLORS.TEXT.WHITE;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: V9_COLORS.PRIMARY.BLUE_DARK;
    border-color: V9_COLORS.PRIMARY.BLUE_DARK;
  }
`;

export const JWTConfigV8: React.FC<JWTConfigV8Props> = ({
	type,
	initialConfig,
	onJWTGenerated,
	onPrivateKeyGenerated,
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

	// Generation result
	const [result, setResult] = useState<JWTGenerationResult | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isGeneratingKey, setIsGeneratingKey] = useState(false);

	// Handle client secret generation
	const handleGenerateSecret = async () => {
		setIsGeneratingKey(true);
		try {
			const generatedSecret: GeneratedSecret = generateClientSecret(32, 'hex');
			setClientSecret(generatedSecret.secret);

			const strength = assessSecurityStrength.clientSecret(generatedSecret.secret);
			modernMessaging.showFooterMessage({
				type: 'status',
				message: `Client secret generated! Strength: ${strength.strength.toUpperCase()} (${strength.score}/6)`,
				duration: 4000,
			});

			if (strength.recommendations.length > 0) {
				console.log(`${MODULE_TAG} Security recommendations:`, strength.recommendations);
			}
		} catch (error) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to generate client secret',
				dismissible: true,
			});
			log.error('JWTConfigV8', 'Secret generation error:', undefined, error as Error);
		} finally {
			setIsGeneratingKey(false);
		}
	};

	// Handle RSA key pair generation
	const handleGenerateKeyPair = async () => {
		setIsGeneratingKey(true);
		try {
			const generatedKeyPair: GeneratedKeyPair = await generateRSAKeyPair(2048);
			setPrivateKey(generatedKeyPair.privateKey);
			setKeyId(generatedKeyPair.keyId);

			const strength = assessSecurityStrength.keyPair(2048);
			modernMessaging.showFooterMessage({
				type: 'status',
				message: `RSA key pair generated! Key ID: ${generatedKeyPair.keyId}`,
				duration: 4000,
			});
			modernMessaging.showFooterMessage({
				type: 'info',
				message: strength.recommendation,
				duration: 4000,
			});

			// Notify parent component if callback is provided
			if (onPrivateKeyGenerated) {
				onPrivateKeyGenerated(generatedKeyPair.privateKey, generatedKeyPair.keyId);
			}
		} catch (error) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to generate RSA key pair',
				dismissible: true,
			});
			log.error('JWTConfigV8', 'Key generation error:', undefined, error as Error);
		} finally {
			setIsGeneratingKey(false);
		}
	};

	const handleGenerate = async () => {
		setIsGenerating(true);
		setResult(null);

		try {
			let generationResult: JWTGenerationResult;

			if (type === 'client_secret_jwt') {
				if (!clientId || !tokenEndpoint || !clientSecret) {
					modernMessaging.showBanner({
						type: 'error',
						title: 'Error',
						message: 'Please fill in all required fields',
						dismissible: true,
					});
					setIsGenerating(false);
					return;
				}

				const clientSecretConfig: ClientSecretJWTConfig = {
					clientId,
					tokenEndpoint,
					clientSecret,
					expiryMinutes: expiryMinutes || 5,
				};

				if (issuer) clientSecretConfig.issuer = issuer;
				if (subject) clientSecretConfig.subject = subject;

				generationResult = await jwtAuthServiceV8.generateClientSecretJWT(clientSecretConfig);
			} else {
				if (!clientId || !tokenEndpoint || !privateKey) {
					modernMessaging.showBanner({
						type: 'error',
						title: 'Error',
						message: 'Please fill in all required fields',
						dismissible: true,
					});
					setIsGenerating(false);
					return;
				}

				if (!jwtAuthServiceV8.validatePrivateKey(privateKey)) {
					modernMessaging.showBanner({
						type: 'error',
						title: 'Error',
						message:
							'Invalid private key format. Please provide a valid PEM-formatted private key.',
						dismissible: true,
					});
					setIsGenerating(false);
					return;
				}

				const privateKeyConfig: PrivateKeyJWTConfig = {
					clientId,
					tokenEndpoint,
					privateKey,
					expiryMinutes: expiryMinutes || 5,
				};

				if (keyId) privateKeyConfig.keyId = keyId;
				if (issuer) privateKeyConfig.issuer = issuer;
				if (subject) privateKeyConfig.subject = subject;

				generationResult = await jwtAuthServiceV8.generatePrivateKeyJWT(privateKeyConfig);
			}

			setResult(generationResult);

			if (generationResult.success && generationResult.jwt) {
				modernMessaging.showFooterMessage({
					type: 'status',
					message: 'JWT generated successfully!',
					duration: 4000,
				});
				onJWTGenerated?.(generationResult.jwt, generationResult);
			} else {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: generationResult.error || 'Failed to generate JWT',
					dismissible: true,
				});
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setResult({ success: false, error: errorMessage });
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: `Failed to generate JWT: ${errorMessage}`,
				dismissible: true,
			});
		} finally {
			setIsGenerating(false);
		}
	};

	const handleCopyJWT = async () => {
		if (!result?.jwt) return;

		try {
			await navigator.clipboard.writeText(result.jwt);
			modernMessaging.showFooterMessage({
				type: 'status',
				message: 'JWT copied to clipboard',
				duration: 4000,
			});
		} catch {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to copy JWT',
				dismissible: true,
			});
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
							{showSecret ? <span style={{ fontSize: '16px' }}>🙈</span> : <span style={{ fontSize: '16px' }}>👁️</span>}
						</button>
					</PasswordInputWrapper>
					<ButtonGroup>
						<Button
							onClick={handleGenerateSecret}
							disabled={isGeneratingKey}
							style={{
								background: 'V9_COLORS.PRIMARY.GREEN',
								borderColor: 'V9_COLORS.PRIMARY.GREEN_DARK',
								fontSize: '0.75rem',
								padding: '0.5rem 0.75rem',
							}}
						>
							<span style={{ fontSize: '14px' }}>🔄</span>
							{isGeneratingKey ? 'Generating...' : 'Generate Secret'}
						</Button>
					</ButtonGroup>
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
						<ButtonGroup>
							<Button
								onClick={handleGenerateKeyPair}
								disabled={isGeneratingKey}
								style={{
									background: 'V9_COLORS.PRIMARY.GREEN',
									borderColor: 'V9_COLORS.PRIMARY.GREEN_DARK',
									fontSize: '0.75rem',
									padding: '0.5rem 0.75rem',
								}}
							>
								<span style={{ fontSize: '14px' }}>🔄</span>
								{isGeneratingKey ? 'Generating...' : 'Generate Key Pair'}
							</Button>
						</ButtonGroup>
					</Field>
					<Field>
						<FieldLabel>Key ID (kid)</FieldLabel>
						<FieldInput
							type="text"
							value={keyId}
							onChange={(e) => setKeyId(e.target.value)}
							placeholder="Generated automatically when creating key pair"
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
					<span style={{ fontSize: '16px' }}>🔑</span>
					{isGenerating ? 'Generating...' : 'Generate JWT'}
				</Button>
			</ButtonGroup>

			{result && (
				<div
					style={{
						marginTop: '1rem',
						padding: '1rem',
						borderRadius: '0.5rem',
						background: result.success ? '#f0fdf4' : 'V9_COLORS.BG.ERROR',
						border: `1px solid ${result.success ? '#86efac' : 'V9_COLORS.BG.ERROR_BORDER'}`,
					}}
				>
					{result.success && result.jwt ? (
						<>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '0.75rem',
									fontWeight: '600',
									fontSize: '0.875rem',
									color: 'V9_COLORS.PRIMARY.GREEN',
								}}
							>
								<span style={{ fontSize: '16px' }}>✅</span>
								JWT Generated Successfully
							</div>
							<JWTDisplay>{result.jwt}</JWTDisplay>
							<ButtonGroup>
								<CopyButton onClick={handleCopyJWT}>
									<span style={{ fontSize: '14px' }}>📋</span>
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
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								marginBottom: '0.75rem',
								fontWeight: '600',
								fontSize: '0.875rem',
								color: 'V9_COLORS.PRIMARY.RED_DARK',
							}}
						>
							<span style={{ fontSize: '16px' }}>⚠️</span>
							Generation Failed
							{result.error && (
								<span style={{ fontWeight: 'normal', marginLeft: '0.5rem' }}>{result.error}</span>
							)}
						</div>
					)}
				</div>
			)}
		</Container>
	);
};

export default JWTConfigV8;
