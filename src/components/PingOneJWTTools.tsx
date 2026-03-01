// src/components/PingOneJWTTools.tsx
/**
 * PingOne JWT Creation Tools
 *
 * Provides UI for creating PingOne-specific JWTs:
 * - Generate keypairs (RSA/ECDSA)
 * - Create login_hint_token JWT
 * - Create request property JWT
 * - Create private key JWT
 * - Transaction approval flow configuration
 */

import { FiCheckCircle, FiChevronDown, FiChevronUp, FiCopy, FiKey, FiSettings } from '@icons';
import React, { useState } from 'react';
import styled from 'styled-components';
import {
	KeyPair,
	LoginHintTokenPayload,
	PingOneJWTService,
	PrivateKeyJWTConfig,
	RequestPropertyPayload,
} from '../services/pingOneJWTService';
import { v4ToastManager } from '../utils/v4ToastMessages';

const ToolsContainer = styled.div`
	background: white;
	border-radius: 12px;
	padding: 1.5rem;
	margin: 1.5rem 0;
	border: 1px solid #e5e7eb;
`;

const SectionHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	cursor: pointer;
	padding: 1rem;
	background: #f9fafb;
	border-radius: 8px;
	margin-bottom: 1rem;
	transition: background 0.2s;
	
	&:hover {
		background: #f3f4f6;
	}
`;

const SectionTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	font-size: 1.1rem;
	color: #1f2937;
`;

const SectionContent = styled.div<{ $collapsed: boolean }>`
	display: ${(props) => (props.$collapsed ? 'none' : 'block')};
	padding: 1rem;
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	font-weight: 600;
	margin-bottom: 0.5rem;
	color: #374151;
	font-size: 0.95rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.95rem;
	transition: border-color 0.2s;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Textarea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.95rem;
	font-family: 'Monaco', 'Menlo', monospace;
	min-height: 120px;
	resize: vertical;
	transition: border-color 0.2s;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.95rem;
	background: white;
	cursor: pointer;
	transition: border-color 0.2s;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 6px;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s;
	
	${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
					background: #3b82f6;
					color: white;
					&:hover:not(:disabled) {
						background: #2563eb;
					}
				`;
			case 'danger':
				return `
					background: #ef4444;
					color: white;
					&:hover:not(:disabled) {
						background: #dc2626;
					}
				`;
			default:
				return `
					background: #6b7280;
					color: white;
					&:hover:not(:disabled) {
						background: #4b5563;
					}
				`;
		}
	}}
	
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const ButtonRow = styled.div`
	display: flex;
	gap: 0.75rem;
	flex-wrap: wrap;
	margin-top: 1rem;
`;

const ResultBox = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	padding: 1rem;
	margin-top: 1rem;
`;

const ResultLabel = styled.div`
	font-weight: 600;
	margin-bottom: 0.5rem;
	color: #374151;
	font-size: 0.9rem;
`;

const ResultValue = styled.pre`
	background: white;
	padding: 0.75rem;
	border-radius: 4px;
	border: 1px solid #e5e7eb;
	font-size: 0.85rem;
	overflow-x: auto;
	white-space: pre-wrap;
	word-break: break-all;
	margin: 0;
	color: #1f2937;
`;

const InfoText = styled.div`
	font-size: 0.85rem;
	color: #6b7280;
	margin-top: 0.5rem;
	line-height: 1.5;
`;

const SuccessMessage = styled.div`
	background: #d1fae5;
	border: 1px solid #10b981;
	border-radius: 6px;
	padding: 0.75rem;
	margin: 1rem 0;
	color: #065f46;
	font-size: 0.9rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

interface PingOneJWTToolsProps {
	config?: {
		clientId?: string;
		environmentId?: string;
		tokenEndpoint?: string;
	};
	onLoginHintTokenGenerated?: (token: string) => void;
}

export const PingOneJWTTools: React.FC<PingOneJWTToolsProps> = ({
	config = {},
	onLoginHintTokenGenerated,
}) => {
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
		keypair: true,
		loginHint: true,
		requestProperty: true,
		privateKey: true,
		transaction: true,
	});

	const [keypair, setKeypair] = useState<KeyPair | null>(null);
	const [keypairType, setKeypairType] = useState<'RSA' | 'ECDSA'>('RSA');
	const [keySize, setKeySize] = useState<2048 | 3072 | 4096>(2048);
	const [ecdsaCurve, setEcdsaCurve] = useState<'P-256' | 'P-384' | 'P-521'>('P-256');
	const [generatingKeypair, setGeneratingKeypair] = useState(false);

	const [loginHintToken, setLoginHintToken] = useState('');
	const [loginHintUsername, setLoginHintUsername] = useState('');
	const [loginHintEmail, setLoginHintEmail] = useState('');
	const [loginHintPhone, setLoginHintPhone] = useState('');
	const [loginHintSub, setLoginHintSub] = useState('');
	const [loginHintAlgorithm, setLoginHintAlgorithm] = useState<'RS256' | 'ES256'>('RS256');

	const [requestPropertyToken, setRequestPropertyToken] = useState('');
	const [requestPropertyClientId, setRequestPropertyClientId] = useState(config.clientId || '');
	const [requestPropertyRedirectUri, setRequestPropertyRedirectUri] = useState('');
	const [requestPropertyResponseType, setRequestPropertyResponseType] = useState('code');
	const [requestPropertyScope, setRequestPropertyScope] = useState('openid profile email');
	const [requestPropertyState, setRequestPropertyState] = useState('');
	const [requestPropertyNonce, setRequestPropertyNonce] = useState('');
	const [requestPropertyAlgorithm, setRequestPropertyAlgorithm] = useState<'RS256' | 'ES256'>(
		'RS256'
	);

	const [privateKeyJWT, setPrivateKeyJWT] = useState('');
	const [privateKeyJWTClientId, setPrivateKeyJWTClientId] = useState(config.clientId || '');
	const [privateKeyJWTAudience, setPrivateKeyJWTAudience] = useState(config.tokenEndpoint || '');
	const [privateKeyJWTPrivateKey, setPrivateKeyJWTPrivateKey] = useState('');
	const [privateKeyJWTKeyId, setPrivateKeyJWTKeyId] = useState('');

	const toggleSection = (section: string) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	};

	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			v4ToastManager.showSuccess(`${label} copied to clipboard`);
		} catch (_error) {
			v4ToastManager.showError(`Failed to copy ${label}`);
		}
	};

	const handleGenerateKeypair = async () => {
		setGeneratingKeypair(true);
		try {
			let newKeypair: KeyPair;
			if (keypairType === 'RSA') {
				newKeypair = await PingOneJWTService.generateRSAKeyPair(keySize);
			} else {
				newKeypair = await PingOneJWTService.generateECDSAKeyPair(ecdsaCurve);
			}
			setKeypair(newKeypair);
			// Auto-populate private key fields
			setPrivateKeyJWTPrivateKey(newKeypair.privateKey);
			setPrivateKeyJWTKeyId(newKeypair.keyId || '');
			v4ToastManager.showSuccess('Keypair generated successfully');
		} catch (error) {
			v4ToastManager.showError(
				`Failed to generate keypair: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setGeneratingKeypair(false);
		}
	};

	const handleCreateLoginHintToken = async () => {
		if (!keypair) {
			v4ToastManager.showError('Please generate a keypair first');
			return;
		}

		try {
			const payload: LoginHintTokenPayload = {};
			if (loginHintUsername) payload.username = loginHintUsername;
			if (loginHintEmail) payload.email = loginHintEmail;
			if (loginHintPhone) payload.phone = loginHintPhone;
			if (loginHintSub) payload.sub = loginHintSub;

			const token = await PingOneJWTService.createLoginHintToken(
				payload,
				JSON.parse(keypair.privateKey),
				loginHintAlgorithm,
				keypair.keyId
			);
			setLoginHintToken(token);
			// Notify parent component if callback provided
			if (onLoginHintTokenGenerated) {
				onLoginHintTokenGenerated(token);
			}
			v4ToastManager.showSuccess('Login hint token created successfully');
		} catch (error) {
			v4ToastManager.showError(
				`Failed to create login hint token: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	};

	const handleCreateRequestPropertyJWT = async () => {
		if (!keypair) {
			v4ToastManager.showError('Please generate a keypair first');
			return;
		}

		if (!requestPropertyClientId) {
			v4ToastManager.showError('Client ID is required');
			return;
		}

		try {
			const payload: RequestPropertyPayload = {
				client_id: requestPropertyClientId,
				response_type: requestPropertyResponseType,
			};
			if (requestPropertyRedirectUri) payload.redirect_uri = requestPropertyRedirectUri;
			if (requestPropertyScope) payload.scope = requestPropertyScope;
			if (requestPropertyState) payload.state = requestPropertyState;
			if (requestPropertyNonce) payload.nonce = requestPropertyNonce;

			const token = await PingOneJWTService.createRequestPropertyJWT(
				payload,
				JSON.parse(keypair.privateKey),
				requestPropertyAlgorithm,
				keypair.keyId
			);
			setRequestPropertyToken(token);
			v4ToastManager.showSuccess('Request property JWT created successfully');
		} catch (error) {
			v4ToastManager.showError(
				`Failed to create request property JWT: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	};

	const handleCreatePrivateKeyJWT = async () => {
		if (!privateKeyJWTPrivateKey) {
			v4ToastManager.showError('Private key is required');
			return;
		}
		if (!privateKeyJWTClientId) {
			v4ToastManager.showError('Client ID is required');
			return;
		}
		if (!privateKeyJWTAudience) {
			v4ToastManager.showError('Audience (token endpoint) is required');
			return;
		}

		try {
			const jwtConfig: PrivateKeyJWTConfig = {
				clientId: privateKeyJWTClientId,
				audience: privateKeyJWTAudience,
				privateKey: privateKeyJWTPrivateKey,
				keyId: privateKeyJWTKeyId || undefined,
			};

			const token = await PingOneJWTService.createPrivateKeyJWT(jwtConfig);
			setPrivateKeyJWT(token);
			v4ToastManager.showSuccess('Private key JWT created successfully');
		} catch (error) {
			v4ToastManager.showError(
				`Failed to create private key JWT: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	};

	return (
		<ToolsContainer>
			<h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
				<FiKey /> PingOne JWT Creation Tools
			</h2>

			{/* Keypair Generation */}
			<SectionHeader onClick={() => toggleSection('keypair')}>
				<SectionTitle>
					<FiKey /> Generate Keypair
				</SectionTitle>
				{collapsedSections.keypair ? <FiChevronDown /> : <FiChevronUp />}
			</SectionHeader>
			<SectionContent $collapsed={collapsedSections.keypair}>
				<FormGroup>
					<Label>Key Type</Label>
					<Select
						value={keypairType}
						onChange={(e) => setKeypairType(e.target.value as 'RSA' | 'ECDSA')}
					>
						<option value="RSA">RSA</option>
						<option value="ECDSA">ECDSA</option>
					</Select>
				</FormGroup>
				{keypairType === 'RSA' && (
					<FormGroup>
						<Label>Key Size</Label>
						<Select
							value={keySize}
							onChange={(e) => setKeySize(Number(e.target.value) as 2048 | 3072 | 4096)}
						>
							<option value="2048">2048 bits</option>
							<option value="3072">3072 bits</option>
							<option value="4096">4096 bits</option>
						</Select>
					</FormGroup>
				)}
				{keypairType === 'ECDSA' && (
					<FormGroup>
						<Label>Curve</Label>
						<Select
							value={ecdsaCurve}
							onChange={(e) => setEcdsaCurve(e.target.value as 'P-256' | 'P-384' | 'P-521')}
						>
							<option value="P-256">P-256</option>
							<option value="P-384">P-384</option>
							<option value="P-521">P-521</option>
						</Select>
					</FormGroup>
				)}
				<ButtonRow>
					<Button $variant="primary" onClick={handleGenerateKeypair} disabled={generatingKeypair}>
						<FiKey /> {generatingKeypair ? 'Generating...' : 'Generate Keypair'}
					</Button>
				</ButtonRow>
				{keypair && (
					<>
						<SuccessMessage>
							<FiCheckCircle /> Keypair generated successfully! Key ID: {keypair.keyId}
						</SuccessMessage>
						<ResultBox>
							<ResultLabel>Private Key (JWK)</ResultLabel>
							<ResultValue>{JSON.stringify(keypair.jwk.private, null, 2)}</ResultValue>
							<ButtonRow>
								<Button
									$variant="secondary"
									onClick={() =>
										copyToClipboard(JSON.stringify(keypair.jwk.private, null, 2), 'Private Key')
									}
								>
									<FiCopy /> Copy Private Key
								</Button>
							</ButtonRow>
						</ResultBox>
						<ResultBox style={{ marginTop: '1rem' }}>
							<ResultLabel>Public Key (JWK)</ResultLabel>
							<ResultValue>{JSON.stringify(keypair.jwk.public, null, 2)}</ResultValue>
							<ButtonRow>
								<Button
									$variant="secondary"
									onClick={() =>
										copyToClipboard(JSON.stringify(keypair.jwk.public, null, 2), 'Public Key')
									}
								>
									<FiCopy /> Copy Public Key
								</Button>
							</ButtonRow>
						</ResultBox>
					</>
				)}
			</SectionContent>

			{/* Login Hint Token */}
			<SectionHeader onClick={() => toggleSection('loginHint')}>
				<SectionTitle>
					<FiSettings /> Create Login Hint Token
				</SectionTitle>
				{collapsedSections.loginHint ? <FiChevronDown /> : <FiChevronUp />}
			</SectionHeader>
			<SectionContent $collapsed={collapsedSections.loginHint}>
				<InfoText>
					Create a JWT that contains user identification hints to pre-populate login forms.
				</InfoText>
				<FormGroup>
					<Label>Username (optional)</Label>
					<Input
						type="text"
						value={loginHintUsername}
						onChange={(e) => setLoginHintUsername(e.target.value)}
						placeholder="username"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Email (optional)</Label>
					<Input
						type="email"
						value={loginHintEmail}
						onChange={(e) => setLoginHintEmail(e.target.value)}
						placeholder="user@example.com"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Phone (optional)</Label>
					<Input
						type="text"
						value={loginHintPhone}
						onChange={(e) => setLoginHintPhone(e.target.value)}
						placeholder="+1234567890"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Subject Identifier (optional)</Label>
					<Input
						type="text"
						value={loginHintSub}
						onChange={(e) => setLoginHintSub(e.target.value)}
						placeholder="user-subject-id"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Signing Algorithm</Label>
					<Select
						value={loginHintAlgorithm}
						onChange={(e) => setLoginHintAlgorithm(e.target.value as 'RS256' | 'ES256')}
					>
						<option value="RS256">RS256</option>
						<option value="ES256">ES256</option>
					</Select>
				</FormGroup>
				<ButtonRow>
					<Button $variant="primary" onClick={handleCreateLoginHintToken} disabled={!keypair}>
						<FiKey /> Create Login Hint Token
					</Button>
				</ButtonRow>
				{loginHintToken && (
					<ResultBox>
						<ResultLabel>Login Hint Token</ResultLabel>
						<ResultValue>{loginHintToken}</ResultValue>
						<ButtonRow>
							<Button
								$variant="secondary"
								onClick={() => copyToClipboard(loginHintToken, 'Login Hint Token')}
							>
								<FiCopy /> Copy Token
							</Button>
							{onLoginHintTokenGenerated && (
								<Button
									$variant="primary"
									onClick={() => onLoginHintTokenGenerated(loginHintToken)}
								>
									<FiCheckCircle /> Use This Token
								</Button>
							)}
						</ButtonRow>
					</ResultBox>
				)}
			</SectionContent>

			{/* Request Property JWT */}
			<SectionHeader onClick={() => toggleSection('requestProperty')}>
				<SectionTitle>
					<FiSettings /> Create Request Property JWT
				</SectionTitle>
				{collapsedSections.requestProperty ? <FiChevronDown /> : <FiChevronUp />}
			</SectionHeader>
			<SectionContent $collapsed={collapsedSections.requestProperty}>
				<InfoText>
					Create a JWT containing authorization request parameters for use with Pushed Authorization
					Request (PAR) or request_uri.
				</InfoText>
				<FormGroup>
					<Label>Client ID *</Label>
					<Input
						type="text"
						value={requestPropertyClientId}
						onChange={(e) => setRequestPropertyClientId(e.target.value)}
						placeholder="your-client-id"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Response Type *</Label>
					<Select
						value={requestPropertyResponseType}
						onChange={(e) => setRequestPropertyResponseType(e.target.value)}
					>
						<option value="code">code</option>
						<option value="token">token</option>
						<option value="id_token">id_token</option>
						<option value="token id_token">token id_token</option>
						<option value="code id_token">code id_token</option>
					</Select>
				</FormGroup>
				<FormGroup>
					<Label>Redirect URI (optional)</Label>
					<Input
						type="text"
						value={requestPropertyRedirectUri}
						onChange={(e) => setRequestPropertyRedirectUri(e.target.value)}
						placeholder="https://example.com/callback"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Scope (optional)</Label>
					<Input
						type="text"
						value={requestPropertyScope}
						onChange={(e) => setRequestPropertyScope(e.target.value)}
						placeholder="openid profile email"
					/>
				</FormGroup>
				<FormGroup>
					<Label>State (optional)</Label>
					<Input
						type="text"
						value={requestPropertyState}
						onChange={(e) => setRequestPropertyState(e.target.value)}
						placeholder="state-value"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Nonce (optional)</Label>
					<Input
						type="text"
						value={requestPropertyNonce}
						onChange={(e) => setRequestPropertyNonce(e.target.value)}
						placeholder="nonce-value"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Signing Algorithm</Label>
					<Select
						value={requestPropertyAlgorithm}
						onChange={(e) => setRequestPropertyAlgorithm(e.target.value as 'RS256' | 'ES256')}
					>
						<option value="RS256">RS256</option>
						<option value="ES256">ES256</option>
					</Select>
				</FormGroup>
				<ButtonRow>
					<Button
						$variant="primary"
						onClick={handleCreateRequestPropertyJWT}
						disabled={!keypair || !requestPropertyClientId}
					>
						<FiKey /> Create Request Property JWT
					</Button>
				</ButtonRow>
				{requestPropertyToken && (
					<ResultBox>
						<ResultLabel>Request Property JWT</ResultLabel>
						<ResultValue>{requestPropertyToken}</ResultValue>
						<ButtonRow>
							<Button
								$variant="secondary"
								onClick={() => copyToClipboard(requestPropertyToken, 'Request Property JWT')}
							>
								<FiCopy /> Copy Token
							</Button>
						</ButtonRow>
					</ResultBox>
				)}
			</SectionContent>

			{/* Private Key JWT */}
			<SectionHeader onClick={() => toggleSection('privateKey')}>
				<SectionTitle>
					<FiKey /> Create Private Key JWT (Client Authentication)
				</SectionTitle>
				{collapsedSections.privateKey ? <FiChevronDown /> : <FiChevronUp />}
			</SectionHeader>
			<SectionContent $collapsed={collapsedSections.privateKey}>
				<InfoText>
					Create a JWT for client authentication at the token endpoint using PRIVATE_KEY_JWT method.
				</InfoText>
				<FormGroup>
					<Label>Client ID *</Label>
					<Input
						type="text"
						value={privateKeyJWTClientId}
						onChange={(e) => setPrivateKeyJWTClientId(e.target.value)}
						placeholder="your-client-id"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Audience (Token Endpoint URL) *</Label>
					<Input
						type="text"
						value={privateKeyJWTAudience}
						onChange={(e) => setPrivateKeyJWTAudience(e.target.value)}
						placeholder="https://auth.pingone.com/{envId}/as/token"
					/>
				</FormGroup>
				<FormGroup>
					<Label>Private Key (JWK JSON) *</Label>
					<Textarea
						value={privateKeyJWTPrivateKey}
						onChange={(e) => setPrivateKeyJWTPrivateKey(e.target.value)}
						placeholder='{"kty":"RSA","n":"...","e":"AQAB",...}'
					/>
					<InfoText>Paste the private key in JWK format (from keypair generation above)</InfoText>
				</FormGroup>
				<FormGroup>
					<Label>Key ID (optional)</Label>
					<Input
						type="text"
						value={privateKeyJWTKeyId}
						onChange={(e) => setPrivateKeyJWTKeyId(e.target.value)}
						placeholder="key-id"
					/>
				</FormGroup>
				<ButtonRow>
					<Button
						$variant="primary"
						onClick={handleCreatePrivateKeyJWT}
						disabled={!privateKeyJWTPrivateKey || !privateKeyJWTClientId || !privateKeyJWTAudience}
					>
						<FiKey /> Create Private Key JWT
					</Button>
				</ButtonRow>
				{privateKeyJWT && (
					<ResultBox>
						<ResultLabel>Private Key JWT</ResultLabel>
						<ResultValue>{privateKeyJWT}</ResultValue>
						<ButtonRow>
							<Button
								$variant="secondary"
								onClick={() => copyToClipboard(privateKeyJWT, 'Private Key JWT')}
							>
								<FiCopy /> Copy Token
							</Button>
						</ButtonRow>
					</ResultBox>
				)}
			</SectionContent>

			{/* Transaction Approval Flow */}
			<SectionHeader onClick={() => toggleSection('transaction')}>
				<SectionTitle>
					<FiSettings /> Transaction Approval Flow Configuration
				</SectionTitle>
				{collapsedSections.transaction ? <FiChevronDown /> : <FiChevronUp />}
			</SectionHeader>
			<SectionContent $collapsed={collapsedSections.transaction}>
				<InfoText>
					Transaction approval flows require additional request property JWT claims. Configure
					transaction-specific parameters here.
				</InfoText>
				<ResultBox>
					<ResultLabel>Transaction Approval Requirements</ResultLabel>
					<ResultValue>{`{
  "transaction_approval": true,
  "transaction_id": "unique-transaction-id",
  "transaction_amount": 0.00,
  "transaction_description": "Transaction description",
  "user_consent_required": true
}`}</ResultValue>
					<InfoText style={{ marginTop: '0.5rem' }}>
						These claims should be included in the request property JWT when initiating a
						transaction approval flow. Use the "Create Request Property JWT" section above and add
						these as additional claims.
					</InfoText>
				</ResultBox>
			</SectionContent>
		</ToolsContainer>
	);
};
