// src/pages/flows/JWTBearerTokenFlowV5.tsx
// V5.0.0 JWT Bearer Token Flow - Full V5 Implementation with Enhanced FlowInfoService

import React, { useCallback, useState, useEffect } from 'react';
import { FiCheckCircle, FiInfo, FiRefreshCw, FiLock } from 'react-icons/fi';
import styled, { css } from 'styled-components';
import type { DefaultTheme } from 'styled-components';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import { ResultsHeading, ResultsSection } from '../../components/ResultsPanel';
import { useJWTBearerFlowController } from '../../hooks/useJWTBearerFlowController';
import { FlowHeader } from '../../services/flowHeaderService';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { rsaKeyGenerationService } from '../../services/rsaKeyGenerationService';
import JWTTokenDisplay from '../../components/JWTTokenDisplay';
import JSONHighlighter, { JSONData } from '../../components/JSONHighlighter';
import { usePageScroll } from '../../hooks/usePageScroll';

const STEP_METADATA = [
	{
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand JWT Bearer Token Flow and configure credentials',
	},
	{
		title: 'Step 1: JWT Bearer Token Request',
		subtitle: 'Request access token using JWT Bearer assertion',
	},
	{ title: 'Step 2: Token Response', subtitle: 'Review the received access token' },
	{ title: 'Step 3: Flow Complete', subtitle: 'Review results and next steps' },
] as const;

type StepIndex = 0 | 1 | 2 | 3;

const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const ContentWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2rem;
`;

const MainCard = styled.div`
	background: white;
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	overflow: hidden;
`;

const StepHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem;
	background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
	color: white;
`;

const StepHeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const VersionBadge = styled.span`
	background: rgba(255, 255, 255, 0.2);
	padding: 0.25rem 0.75rem;
	border-radius: 12px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const StepHeaderTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 700;
	margin: 0;
`;

const StepHeaderSubtitle = styled.p`
	font-size: 1rem;
	opacity: 0.9;
	margin: 0;
`;

const StepHeaderRight = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`;

const StepNumber = styled.span`
	background: rgba(255, 255, 255, 0.2);
	padding: 0.5rem;
	border-radius: 50%;
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
`;

const StepTotal = styled.span`
	opacity: 0.8;
	font-size: 0.875rem;
`;

const StepContent = styled.div`
	padding: 2rem;
`;

type ThemeProps = { theme: DefaultTheme };

const FormSection = styled.div(
	({ theme }: ThemeProps) => css`
	background: ${theme.colors.gray100};
	border-radius: 8px;
	padding: 1.5rem;
	margin-bottom: 2rem;
`
);

const FormTitle = styled.h3(
	({ theme }: ThemeProps) => css`
	font-size: 1.25rem;
	font-weight: 600;
	color: ${theme.colors.gray800};
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`
);

const FormGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	margin-bottom: 1rem;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const FormGridWide = styled.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 1rem;
	margin-bottom: 1rem;
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const Label = styled.label`
	font-weight: 500;
	color: #374151;
	font-size: 0.875rem;
`;

const Input = styled.input(
	({ theme }: ThemeProps) => css`
	padding: 0.75rem;
	border: 1px solid ${theme.colors.gray400};
	border-radius: 6px;
	font-size: 0.875rem;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: ${theme.colors.primary};
		box-shadow: 0 0 0 3px rgba(0, 48, 135, 0.1);
	}
`
);

const TextArea = styled.textarea(
	({ theme }: ThemeProps) => css`
	padding: 0.75rem;
	border: 1px solid ${theme.colors.gray400};
	border-radius: 6px;
	font-size: 0.875rem;
	min-height: 100px;
	resize: vertical;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: ${theme.colors.primary};
		box-shadow: 0 0 0 3px rgba(0, 48, 135, 0.1);
	}
`
);

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>(
	({
		variant = 'primary',
		theme,
	}: {
		variant?: 'primary' | 'secondary' | 'success';
		theme: DefaultTheme;
	}) => {
		const baseStyles = css`
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border: none;

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	`;

		switch (variant) {
			case 'secondary':
				return css`
				${baseStyles};
				background: ${theme.colors.gray200};
				color: ${theme.colors.gray700};

				&:hover:not(:disabled) {
					background: ${theme.colors.gray300};
				}
			`;
			case 'success':
				return css`
				${baseStyles};
				background: #10b981;
				color: white;

				&:hover:not(:disabled) {
					background: #059669;
				}
			`;
			case 'primary':
			default:
				return css`
				${baseStyles};
				background: #3b82f6;
				color: white;

				&:hover:not(:disabled) {
					background: #2563eb;
				}
			`;
		}
	}
);

const ResultsContainer = styled.div(
	({ theme }: ThemeProps) => css`
	background: ${theme.colors.gray100};
	border-radius: 8px;
	padding: 1.5rem;
	margin-top: 1rem;
`
);

const SuccessMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #059669;
	font-weight: 500;
	margin-bottom: 1rem;
`;

const ErrorMessage = styled.div(
	({ theme }: ThemeProps) => css`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: ${theme.colors.danger};
	font-weight: 500;
	margin-bottom: 1rem;
`
);

const JWTInfo = styled.div`
	background: white;
	border-radius: 6px;
	padding: 1rem;
	margin-bottom: 1rem;
	border-left: 4px solid #10b981;
`;

const JWTInfoRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 0;
	border-bottom: 1px solid #e5e7eb;

	&:last-child {
		border-bottom: none;
	}
`;

const JWTInfoLabel = styled.span`
	font-weight: 500;
	color: #374151;
`;

const JWTInfoValue = styled.span`
	color: #1f2937;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
`;

const PingOneConfigCard = styled.div(
	({ theme }: ThemeProps) => css`
	background: ${theme.colors.gray100};
	border: 1px solid ${theme.colors.gray300};
	border-radius: 8px;
	padding: 1.5rem;
	margin: 1rem 0;
`
);

const PingOneConfigTitle = styled.h3(
	({ theme }: ThemeProps) => css`
	font-size: 1.125rem;
	font-weight: 600;
	color: ${theme.colors.gray800};
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`
);

const PingOneConfigStep = styled.div`
	margin-bottom: 0.75rem;
	padding-left: 1.5rem;
	position: relative;
	
	&::before {
		content: counter(step-counter);
		counter-increment: step-counter;
		position: absolute;
		left: 0;
		top: 0;
		background: #3b82f6;
		color: white;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
	}
`;

const PingOneConfigList = styled.div`
	counter-reset: step-counter;
`;

const PingOneConfigNote = styled.div(
	({ theme }: ThemeProps) => css`
	background: ${theme.colors.warning}20; /* 20% opacity */
	border: 1px solid ${theme.colors.warning};
	border-radius: 6px;
	padding: 0.75rem;
	margin-top: 1rem;
	font-size: 0.875rem;
	color: ${theme.colors.warning}e6; /* 90% opacity */
`
);

const PingOneConfigCode = styled.code(
	({ theme }: ThemeProps) => css`
	background: ${theme.colors.gray200};
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	color: ${theme.colors.gray800};
`
);

const PingOneConfigurationSection: React.FC = () => {
	const [pingOneConfig, setPingOneConfig] = useState<{
		privateKeyPEM: string;
		publicKeyPEM: string;
		keyId: string;
		algorithm: string;
		keySize: number;
	} | null>(null);

	useEffect(() => {
		// Load PingOne configuration from session storage
		const stored = sessionStorage.getItem('jwt-bearer-pingone-config');
		if (stored) {
			try {
				setPingOneConfig(JSON.parse(stored));
			} catch (error) {
				console.warn('Failed to parse PingOne config:', error);
			}
		}
	}, []);

	const instructions = rsaKeyGenerationService.getPingOneConfigurationInstructions();

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			v4ToastManager.showSuccess('Public key copied to clipboard!');
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
			v4ToastManager.showError('Failed to copy to clipboard');
		}
	};

	return (
		<PingOneConfigCard>
			<PingOneConfigTitle>🔧 {instructions.title}</PingOneConfigTitle>

			<div style={{ marginBottom: '1rem' }}>
				<strong>Requirements:</strong>
				<ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
					{instructions.requirements.map((req, index) => (
						<li key={index} style={{ marginBottom: '0.25rem' }}>
							{req}
						</li>
					))}
				</ul>
			</div>

			<div style={{ marginBottom: '1rem' }}>
				<strong>Configuration Steps:</strong>
				<PingOneConfigList>
					{instructions.steps.map((step, index) => (
						<PingOneConfigStep key={index}>{step}</PingOneConfigStep>
					))}
				</PingOneConfigList>
			</div>

			{pingOneConfig ? (
				<div style={{ marginBottom: '1rem' }}>
					<strong>Generated Key Information:</strong>
					<div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
						<div>
							<strong>Key ID:</strong> <PingOneConfigCode>{pingOneConfig.keyId}</PingOneConfigCode>
						</div>
						<div>
							<strong>Algorithm:</strong>{' '}
							<PingOneConfigCode>{pingOneConfig.algorithm}</PingOneConfigCode>
						</div>
						<div>
							<strong>Key Size:</strong>{' '}
							<PingOneConfigCode>{pingOneConfig.keySize} bits</PingOneConfigCode>
						</div>
					</div>

					<div style={{ marginTop: '1rem' }}>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: '0.5rem',
							}}
						>
							<strong>Public Key (for PingOne upload):</strong>
							<Button
								variant="secondary"
								onClick={() => copyToClipboard(pingOneConfig.publicKeyPEM)}
								style={{
									padding: '0.5rem 1rem',
									fontSize: '0.75rem',
									height: 'auto',
								}}
							>
								📋 Copy Key
							</Button>
						</div>
						<pre
							style={{
								background: 'white',
								padding: '0.75rem',
								borderRadius: '4px',
								fontSize: '0.75rem',
								overflow: 'auto',
								marginTop: '0.5rem',
								border: '1px solid #e0e0e0',
								maxHeight: '200px',
							}}
						>
							{pingOneConfig.publicKeyPEM}
						</pre>
						<div
							style={{
								marginTop: '0.5rem',
								fontSize: '0.75rem',
								color: '#28a745',
								fontWeight: '500',
							}}
						>
							✅ Ready to copy and paste into PingOne Admin Console
						</div>
					</div>
				</div>
			) : (
				<div style={{ marginBottom: '1rem' }}>
					<div
						style={{
							background: '#ffc10720',
							border: '1px solid #ffc107',
							borderRadius: '6px',
							padding: '1rem',
							textAlign: 'center',
						}}
					>
						<div style={{ fontSize: '0.875rem', color: '#856404', marginBottom: '0.5rem' }}>
							🔑 Generate an RSA key pair to get your public key for PingOne
						</div>
						<div style={{ fontSize: '0.75rem', color: '#856404' }}>
							Click the "Generate Key" button in the form above to create your RSA key pair
						</div>
					</div>
				</div>
			)}

			<PingOneConfigNote>
				<strong>Important Notes:</strong>
				<ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
					{instructions.notes.map((note, index) => (
						<li key={index} style={{ marginBottom: '0.25rem' }}>
							{note}
						</li>
					))}
				</ul>
			</PingOneConfigNote>
		</PingOneConfigCard>
	);
};

const JWTBearerTokenFlowV5: React.FC = () => {
	// Ensure page starts at top
	usePageScroll({ pageName: 'JWTBearerTokenFlowV5', force: true });

	const [currentStep, setCurrentStep] = useState<StepIndex>(0);
	const [isRequesting, setIsRequesting] = useState(false);
	const [isGeneratingKey, setIsGeneratingKey] = useState(false);
	const [tokenResult, setTokenResult] = useState<unknown>(null);
	const [error, setError] = useState<string | null>(null);

	const { credentials, tokens, requestToken, clearResults, updateCredentials } =
		useJWTBearerFlowController();

	const handleGeneratePrivateKey = useCallback(async () => {
		setIsGeneratingKey(true);
		setError(null);

		try {
			const { privateKeyPEM, keyId, pingOneConfig } =
				await rsaKeyGenerationService.generatePrivateKeyForJWT({
					keySize: 2048,
				});

			updateCredentials({
				privateKey: privateKeyPEM,
				keyId: keyId,
			});

			// Store PingOne configuration for display
			sessionStorage.setItem('jwt-bearer-pingone-config', JSON.stringify(pingOneConfig));

			v4ToastManager.showSuccess('RSA private key has been generated and added to the form.');
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to generate private key';
			setError(errorMessage);
			v4ToastManager.showError(errorMessage);
		} finally {
			setIsGeneratingKey(false);
		}
	}, [updateCredentials]);

	const handleNext = useCallback(() => {
		if (currentStep < 3) {
			setCurrentStep((prev) => (prev + 1) as StepIndex);
		}
	}, [currentStep]);

	const handlePrevious = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep((prev) => (prev - 1) as StepIndex);
		}
	}, [currentStep]);

	const handleReset = useCallback(() => {
		setCurrentStep(0);
		setTokenResult(null);
		setError(null);
		clearResults();

		// Clear all form credentials
		updateCredentials({
			environmentId: '',
			clientId: '',
			clientSecret: '',
			privateKey: '',
			keyId: '',
			audience: '',
			subject: '',
			tokenEndpoint: '',
		});
	}, [clearResults, updateCredentials]);

	const handleRequestToken = useCallback(async () => {
		if (!credentials.clientId || !credentials.privateKey || !credentials.environmentId) {
			setError('Please provide environment ID, client ID, and private key');
			return;
		}

		setIsRequesting(true);
		setError(null);

		try {
			const result = await requestToken();
			setTokenResult(result);
			v4ToastManager.showSuccess('JWT Bearer token requested successfully!');
			handleNext();
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to request JWT Bearer token';
			setError(errorMessage);
			v4ToastManager.showError(errorMessage);
		} finally {
			setIsRequesting(false);
		}
	}, [credentials, requestToken, handleNext]);

	const canNavigateNext = Boolean(
		(currentStep === 0 && credentials.environmentId && credentials.clientId) ||
			(currentStep === 1 && !!tokenResult)
	);

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<>
						<ExplanationSection>
							<ExplanationHeading>JWT Bearer Token Flow (Mock Implementation)</ExplanationHeading>
							<p>
								The JWT Bearer Token Flow allows clients to authenticate using a JWT assertion
								instead of traditional client credentials. This provides enhanced security and
								enables more sophisticated authentication scenarios.
							</p>
							<div
								style={{
									background: '#fef3c7',
									border: '1px solid #f59e0b',
									borderRadius: '6px',
									padding: '0.75rem',
									margin: '1rem 0',
									fontSize: '0.875rem',
									color: '#92400e',
								}}
							>
								<strong>🔧 Mock Implementation:</strong> This flow simulates JWT Bearer Token
								authentication. No actual requests are made to PingOne. Tokens are generated for
								demonstration purposes.
							</div>
						</ExplanationSection>

						<EnhancedFlowWalkthrough flowId="oauth-jwt-bearer" />
						<FlowSequenceDisplay flowType="jwt-bearer" />

						{/* Basic Credentials Configuration - Step 0 */}
						<FormSection>
							<FormTitle>
								<FiLock /> Basic Configuration
							</FormTitle>

							<FormGrid>
								<FormGroup>
									<Label>Environment ID</Label>
									<Input
										placeholder="e.g., abc12345-6789-4abc-def0-1234567890ab"
										value={credentials.environmentId || ''}
										onChange={(e) => updateCredentials({ environmentId: e.target.value })}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Client ID</Label>
									<Input
										placeholder="e.g., 5acc8cd7-7ebc-4684-bd9-233705e87a7c"
										value={credentials.clientId || ''}
										onChange={(e) => updateCredentials({ clientId: e.target.value })}
									/>
								</FormGroup>
							</FormGrid>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'auto 1fr',
									gap: '0.75rem 1rem',
									marginTop: '1rem',
								}}
							>
								<div style={{ fontWeight: '600', color: '#374151' }}>Environment ID:</div>
								<div
									style={{
										fontFamily: 'monospace',
										background: '#f1f5f9',
										padding: '0.25rem 0.5rem',
										borderRadius: '4px',
										fontSize: '0.875rem',
										wordBreak: 'break-all',
									}}
								>
									{credentials.environmentId || 'Not configured'}
								</div>

								<div style={{ fontWeight: '600', color: '#374151' }}>Client ID:</div>
								<div
									style={{
										fontFamily: 'monospace',
										background: '#f1f5f9',
										padding: '0.25rem 0.5rem',
										borderRadius: '4px',
										fontSize: '0.875rem',
										wordBreak: 'break-all',
									}}
								>
									{credentials.clientId || 'Not configured'}
								</div>
							</div>
						</FormSection>
					</>
				);

			case 1:
				return (
					<>
						{/* Configuration Summary */}
						<div
							style={{
								background: 'white',
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								padding: '1.5rem',
								marginBottom: '2rem',
							}}
						>
							<h3
								style={{
									margin: '0 0 1rem 0',
									color: '#1f2937',
									fontSize: '1.25rem',
									fontWeight: '600',
								}}
							>
								JWT Bearer Token Configuration
							</h3>
							<div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
								Configure JWT-specific settings for the token request.
							</div>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'auto 1fr',
									gap: '0.75rem 1rem',
									marginBottom: '1rem',
								}}
							>
								<div style={{ fontWeight: '600', color: '#374151' }}>Environment ID:</div>
								<div
									style={{
										fontFamily: 'monospace',
										background: '#f1f5f9',
										padding: '0.25rem 0.5rem',
										borderRadius: '4px',
										fontSize: '0.875rem',
										wordBreak: 'break-all',
									}}
								>
									{credentials.environmentId || 'Not configured'}
								</div>

								<div style={{ fontWeight: '600', color: '#374151' }}>Client ID:</div>
								<div
									style={{
										fontFamily: 'monospace',
										background: '#f1f5f9',
										padding: '0.25rem 0.5rem',
										borderRadius: '4px',
										fontSize: '0.875rem',
										wordBreak: 'break-all',
									}}
								>
									{credentials.clientId || 'Not configured'}
								</div>
							</div>
						</div>

						<FormSection>
							<FormTitle>
								<FiLock /> JWT Bearer Token Configuration
							</FormTitle>

							{/* JWT Bearer Token Specific Fields */}
							<FormGrid>
								<FormGroup>
									<Label>Environment ID</Label>
									<Input
										placeholder="Enter environment ID..."
										value={credentials.environmentId || ''}
										onChange={(e) => updateCredentials({ environmentId: e.target.value })}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Client ID</Label>
									<Input
										placeholder="Enter client ID..."
										value={credentials.clientId || ''}
										onChange={(e) => updateCredentials({ clientId: e.target.value })}
									/>
								</FormGroup>
							</FormGrid>

							<FormGridWide>
								<FormGroup>
									<Label>Private Key (PEM format)</Label>
									<TextArea
										placeholder="Enter private key in PEM format..."
										value={credentials.privateKey || ''}
										onChange={(e) => updateCredentials({ privateKey: e.target.value })}
									/>
									<div
										style={{
											marginTop: '0.75rem',
											display: 'flex',
											alignItems: 'center',
											gap: '0.75rem',
										}}
									>
										<Button
											variant="primary"
											onClick={handleGeneratePrivateKey}
											disabled={isGeneratingKey}
											style={{
												padding: '0.75rem 1.5rem',
												fontSize: '0.875rem',
												height: 'auto',
												minWidth: '120px',
											}}
										>
											{isGeneratingKey ? <FiRefreshCw className="animate-spin" /> : 'Generate Key'}
										</Button>
										<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
											Click to create a new RSA private key for JWT signing
										</div>
									</div>
								</FormGroup>
							</FormGridWide>

							<FormGrid>
								<FormGroup>
									<Label>Key ID (optional)</Label>
									<Input
										placeholder="Enter key ID..."
										value={credentials.keyId || ''}
										onChange={(e) => updateCredentials({ keyId: e.target.value })}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Audience (optional)</Label>
									<Input
										placeholder="e.g., https://api.pingone.com or your-api-audience"
										value={credentials.audience || ''}
										onChange={(e) => updateCredentials({ audience: e.target.value })}
									/>
								</FormGroup>
							</FormGrid>

							<FormGridWide>
								<FormGroup>
									<Label>Subject (optional)</Label>
									<Input
										placeholder="e.g., your-client-id or user@domain.com"
										value={credentials.subject || ''}
										onChange={(e) => updateCredentials({ subject: e.target.value })}
									/>
								</FormGroup>
							</FormGridWide>

							<Button
								variant="success"
								onClick={handleRequestToken}
								disabled={
									isRequesting ||
									!credentials.clientId ||
									!credentials.privateKey ||
									!credentials.environmentId
								}
							>
								{isRequesting ? <FiRefreshCw className="animate-spin" /> : <FiLock />}
								{isRequesting ? 'Simulating...' : 'Request JWT Bearer Token (Mock)'}
							</Button>
						</FormSection>

						{/* PingOne Configuration Instructions */}
						<PingOneConfigurationSection />

						{error && (
							<ErrorMessage>
								<FiInfo />
								{error}
							</ErrorMessage>
						)}

						{tokenResult && (
							<ResultsContainer>
								<SuccessMessage>
									<FiCheckCircle />
									JWT Bearer Token simulation completed successfully!
								</SuccessMessage>

								<JWTInfo>
									<JWTInfoRow>
										<JWTInfoLabel>Access Token:</JWTInfoLabel>
										<JWTInfoValue>
											{tokens?.access_token
												? tokens.access_token.substring(0, 50) + '...'
												: 'Not available'}
										</JWTInfoValue>
									</JWTInfoRow>
									{tokens?.token_type && (
										<JWTInfoRow>
											<JWTInfoLabel>Token Type:</JWTInfoLabel>
											<JWTInfoValue>{tokens.token_type}</JWTInfoValue>
										</JWTInfoRow>
									)}
									{tokens?.expires_in && (
										<JWTInfoRow>
											<JWTInfoLabel>Expires In:</JWTInfoLabel>
											<JWTInfoValue>{tokens.expires_in} seconds</JWTInfoValue>
										</JWTInfoRow>
									)}
									{tokens?.scope && (
										<JWTInfoRow>
											<JWTInfoLabel>Scope:</JWTInfoLabel>
											<JWTInfoValue>{tokens.scope}</JWTInfoValue>
										</JWTInfoRow>
									)}
								</JWTInfo>

								<ResultsSection>
									<ResultsHeading>Mock Token Response</ResultsHeading>
									<div
										style={{
											background: '#f0f9ff',
											border: '1px solid #0ea5e9',
											borderRadius: '6px',
											padding: '0.75rem',
											marginBottom: '1rem',
											fontSize: '0.875rem',
											color: '#0c4a6e',
										}}
									>
										<strong>ℹ️ Mock Implementation:</strong> These are simulated tokens for
										demonstration purposes only.
									</div>
									<pre
										style={{
											background: 'white',
											padding: '1rem',
											borderRadius: '6px',
											overflow: 'auto',
											border: '1px solid #e0e0e0',
										}}
									>
										{JSON.stringify(tokenResult, null, 2)}
									</pre>
								</ResultsSection>
							</ResultsContainer>
						)}
					</>
				);

			case 2:
				return (
					<>
						<ResultsSection>
							<ResultsHeading>Mock Token Request Complete</ResultsHeading>
							<p>
								The JWT Bearer Token flow simulation has completed successfully. You now have mock
								tokens that demonstrate the structure and format of real JWT Bearer Token responses.
							</p>
							<div
								style={{
									background: '#f0f9ff',
									border: '1px solid #0ea5e9',
									borderRadius: '6px',
									padding: '0.75rem',
									margin: '1rem 0',
									fontSize: '0.875rem',
									color: '#0c4a6e',
								}}
							>
								<strong>ℹ️ Educational Purpose:</strong> These tokens are generated for learning JWT
								Bearer Token concepts and cannot be used for actual API authentication.
							</div>
						</ResultsSection>

						<ResultsSection>
							<ResultsHeading>Key Information</ResultsHeading>
							<ul style={{ paddingLeft: '1.5rem' }}>
								<li>
									<strong>Access Token:</strong>{' '}
									{tokens?.access_token ? 'Received' : 'Not available'}
								</li>
								<li>
									<strong>Token Type:</strong> {tokens?.token_type || 'Not specified'}
								</li>
								<li>
									<strong>Expires In:</strong>{' '}
									{tokens?.expires_in ? `${tokens.expires_in} seconds` : 'Not specified'}
								</li>
								<li>
									<strong>Scope:</strong> {tokens?.scope || 'Not specified'}
								</li>
							</ul>
						</ResultsSection>

						<ResultsSection>
							<ResultsHeading>Next Steps</ResultsHeading>
							<ul style={{ paddingLeft: '1.5rem' }}>
								<li>Use the access token for API authentication</li>
								<li>Implement proper token storage and management</li>
								<li>Handle token expiration and refresh scenarios</li>
								<li>Consider implementing token introspection for validation</li>
							</ul>
						</ResultsSection>
					</>
				);

			case 3:
				return (
					<>
						<ResultsSection>
							<ResultsHeading>Mock Flow Complete</ResultsHeading>
							<p>
								You have successfully completed the JWT Bearer Token Flow simulation. This mock
								implementation demonstrates the complete JWT Bearer Token authentication process
								without requiring external services.
							</p>
						</ResultsSection>

						<ResultsSection>
							<ResultsHeading>What You Learned</ResultsHeading>
							<ul style={{ paddingLeft: '1.5rem' }}>
								<li>How JWT Bearer Token Flow works conceptually</li>
								<li>JWT assertion structure and components</li>
								<li>Mock implementation patterns for educational flows</li>
								<li>Understanding JWT Bearer Token authentication without external dependencies</li>
							</ul>
							<div
								style={{
									background: '#f0f9ff',
									border: '1px solid #0ea5e9',
									borderRadius: '6px',
									padding: '0.75rem',
									margin: '1rem 0',
									fontSize: '0.875rem',
									color: '#0c4a6e',
								}}
							>
								<strong>🎓 Educational Value:</strong> This mock implementation helps you understand
								JWT Bearer Token concepts without requiring actual PingOne integration.
							</div>
						</ResultsSection>
					</>
				);

			default:
				return null;
		}
	};

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="jwt-bearer-token-v5" />

				<EnhancedFlowInfoCard
					flowType="jwt-bearer-token"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>

				<FlowConfigurationRequirements flowType="jwt-bearer" variant="pingone" />

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>JWT Bearer Token Flow · V5</VersionBadge>
							<StepHeaderTitle>{STEP_METADATA[currentStep].title}</StepHeaderTitle>
							<StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{currentStep + 1}</StepNumber>
							<StepTotal>of {STEP_METADATA.length}</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					<StepContent>{renderStepContent()}</StepContent>
				</MainCard>
			</ContentWrapper>

			<StepNavigationButtons
				currentStep={currentStep}
				totalSteps={STEP_METADATA.length}
				onPrevious={handlePrevious}
				onReset={handleReset}
				onNext={handleNext}
				canNavigateNext={canNavigateNext}
				isFirstStep={currentStep === 0}
				nextButtonText={
					currentStep === 0
						? credentials.environmentId && credentials.clientId
							? 'Next: Configure JWT'
							: 'Enter Environment ID and Client ID'
						: canNavigateNext
							? 'Next'
							: 'Complete JWT configuration'
				}
				disabledMessage={
					currentStep === 0
						? 'Please enter Environment ID and Client ID to continue'
						: 'Please complete JWT configuration to continue'
				}
			/>
		</Container>
	);
};

export default JWTBearerTokenFlowV5;
