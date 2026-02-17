/**
 * @file OIDCHybridFlowV8.tsx
 * @module v8/flows
 * @description OIDC Hybrid Flow V8 React Component
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Modern OIDC Hybrid Flow implementation with:
 * - V8 architecture and patterns
 * - Professional UI with styled-components
 * - Real-time flow management
 * - Multiple hybrid variants support
 * - Token display and management
 * - Error handling and validation
 *
 * @example
 * <OIDCHybridFlowV8 />
 */

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiCopy,
	FiExternalLink,
	FiInfo,
	FiKey,
	FiRefreshCw,
} from 'react-icons/fi';
import { CommonSpinner } from '@/components/common/CommonSpinner';
import { useProductionSpinner } from '@/hooks/useProductionSpinner';
import { useHybridFlowV8 } from '@/v8/hooks/useHybridFlowV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import type { HybridFlowCredentials } from '@/v8/services/hybridFlowIntegrationServiceV8';

// V8 styled components (following V8 patterns)
const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const Header = styled.div`
	text-align: center;
	margin-bottom: 2rem;
`;

const Title = styled.h1`
	font-size: 2.5rem;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
	font-size: 1.125rem;
	color: #6b7280;
	margin-bottom: 1rem;
`;

const VersionBadge = styled.span`
	background: linear-gradient(135deg, #3b82f6, #8b5cf6);
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.875rem;
	font-weight: 600;
	margin-left: 0.5rem;
`;

const MainCard = styled.div`
	background: white;
	border-radius: 1rem;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	padding: 2rem;
	margin-bottom: 2rem;
`;

const StepHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid #e5e7eb;
`;

const StepTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 600;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const StepNumber = styled.span`
	background: #3b82f6;
	color: white;
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.875rem;
	font-weight: 600;
`;

const StepIndicator = styled.div<{ active: boolean; completed: boolean }>`
	width: 100%;
	height: 4px;
	background: ${(props) => {
		if (props.completed) return '#10b981';
		if (props.active) return '#3b82f6';
		return '#e5e7eb';
	}};
	border-radius: 2px;
	margin-bottom: 1rem;
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 1rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&:disabled {
		background-color: #f3f4f6;
		color: #6b7280;
		cursor: not-allowed;
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 1rem;
	background: white;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	border: none;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;

	${(props) =>
		props.variant === 'primary'
			? `
		background: #3b82f6;
		color: white;

		&:hover:not(:disabled) {
			background: #2563eb;
		}
	`
			: `
		background: #f3f4f6;
		color: #374151;

		&:hover:not(:disabled) {
			background: #e5e7eb;
		}
	`}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ActionRow = styled.div`
	display: flex;
	gap: 1rem;
	margin-top: 1.5rem;
`;

const InfoBox = styled.div<{ variant: 'info' | 'warning' | 'success' }>`
	padding: 1rem;
	border-radius: 0.5rem;
	margin-bottom: 1.5rem;
	display: flex;
	align-items: start;
	gap: 0.75rem;

	${(props) => {
		switch (props.variant) {
			case 'info':
				return `
					background: #eff6ff;
					border: 1px solid #bfdbfe;
					color: #1e40af;
				`;
			case 'warning':
				return `
					background: #fef3c7;
					border: 1px solid #fcd34d;
					color: #92400e;
				`;
			case 'success':
				return `
					background: #d1fae5;
					border: 1px solid #a7f3d0;
					color: #065f46;
				`;
		}
	}}
`;

const TokenDisplay = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-top: 1rem;
`;

const TokenTitle = styled.h4`
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const TokenContent = styled.pre`
	background: #1f2937;
	color: #f9fafb;
	padding: 1rem;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	overflow-x: auto;
	word-break: break-all;
`;

const CopyButton = styled.button`
	background: #6b7280;
	color: white;
	border: none;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	cursor: pointer;
	margin-top: 0.5rem;
	transition: background 0.2s;

	&:hover {
		background: #4b5563;
	}
`;

const VariantSelector = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
	margin-bottom: 1.5rem;
`;

const VariantCard = styled.div<{ selected: boolean }>`
	padding: 1rem;
	border: 2px solid ${(props) => (props.selected ? '#3b82f6' : '#e5e7eb')};
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		border-color: #3b82f6;
	}

	${(props) =>
		props.selected &&
		`
		background: #eff6ff;
	`}
`;

const VariantTitle = styled.h4`
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.25rem;
`;

const VariantDescription = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
`;

const URLDisplay = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-top: 1rem;
	word-break: break-all;
`;

/**
 * OIDC Hybrid Flow V8 Component
 */
const OIDCHybridFlowV8: React.FC = () => {
	const hybridFlow = useHybridFlowV8();
	const spinner = useProductionSpinner('hybrid-flow-v8');

	// Form state
	const [formData, setFormData] = useState<Partial<HybridFlowCredentials>>({});

	// Initialize form data when credentials change
	useEffect(() => {
		if (hybridFlow.credentials) {
			setFormData(hybridFlow.credentials);
		}
	}, [hybridFlow.credentials]);

	// Handle form field changes
	const handleFieldChange = useCallback((field: keyof HybridFlowCredentials, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	}, []);

	// Save credentials
	const saveCredentials = useCallback(() => {
		if (!formData.environmentId || !formData.clientId) {
			toastV8.error('Environment ID and Client ID are required');
			return;
		}

		const credentials: HybridFlowCredentials = {
			environmentId: formData.environmentId || '',
			clientId: formData.clientId || '',
			clientSecret: formData.clientSecret || '',
			redirectUri: formData.redirectUri || `${window.location.origin}/flows/hybrid-v8/callback`,
			scopes: formData.scopes || 'openid profile email',
			responseType: hybridFlow.variant,
			clientAuthMethod: (formData.clientAuthMethod as any) || 'client_secret_post',
		};

		hybridFlow.saveCredentials(credentials);
		toastV8.success('Credentials saved successfully');
	}, [formData, hybridFlow]);

	// Generate authorization URL
	const handleGenerateUrl = useCallback(async () => {
		if (!formData.environmentId || !formData.clientId) {
			toastV8.error('Please configure credentials first');
			return;
		}

		try {
			const credentials: HybridFlowCredentials = {
				environmentId: formData.environmentId || '',
				clientId: formData.clientId || '',
				clientSecret: formData.clientSecret || undefined,
				redirectUri: formData.redirectUri || `${window.location.origin}/flows/hybrid-v8/callback`,
				scopes: formData.scopes || 'openid profile email',
				responseType: hybridFlow.variant,
				clientAuthMethod:
					(formData.clientAuthMethod as 'client_secret_post' | 'client_secret_basic' | 'none') ||
					'client_secret_post',
			};

			await hybridFlow.generateAuthorizationUrl(credentials);
		} catch (error) {
			console.error('Failed to generate URL:', error);
		}
	}, [formData, hybridFlow]);

	// Handle variant selection
	const handleVariantSelect = useCallback(
		(variant: HybridFlowState['variant']) => {
			hybridFlow.setVariant(variant);
		},
		[hybridFlow]
	);

	// Copy to clipboard
	const copyToClipboard = useCallback((text: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				toastV8.success('Copied to clipboard');
			})
			.catch(() => {
				toastV8.error('Failed to copy');
			});
	}, []);

	// Render credentials step
	const renderCredentialsStep = () => (
		<>
			<InfoBox variant="info">
				<FiInfo size={20} />
				<div>
					<strong>Configure OIDC Hybrid Flow Credentials</strong>
					<p>Enter your PingOne application credentials to begin the hybrid flow.</p>
				</div>
			</InfoBox>

			<FormGroup>
				<Label htmlFor="environmentId">Environment ID *</Label>
				<Input
					id="environmentId"
					type="text"
					value={formData.environmentId || ''}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						handleFieldChange('environmentId', e.target.value)
					}
					placeholder="PingOne Environment ID"
					disabled={hybridFlow.isLoading}
				/>
			</FormGroup>

			<FormGroup>
				<Label htmlFor="clientId">Client ID *</Label>
				<Input
					id="clientId"
					type="text"
					value={formData.clientId || ''}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						handleFieldChange('clientId', e.target.value)
					}
					placeholder="Application Client ID"
					disabled={hybridFlow.isLoading}
				/>
			</FormGroup>

			<FormGroup>
				<Label htmlFor="clientSecret">Client Secret</Label>
				<Input
					id="clientSecret"
					type="password"
					value={formData.clientSecret || ''}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						handleFieldChange('clientSecret', e.target.value)
					}
					placeholder="Application Client Secret"
					disabled={hybridFlow.isLoading}
				/>
			</FormGroup>

			<FormGroup>
				<Label htmlFor="redirectUri">Redirect URI</Label>
				<Input
					id="redirectUri"
					type="text"
					value={formData.redirectUri || ''}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						handleFieldChange('redirectUri', e.target.value)
					}
					placeholder="Redirect URI"
					disabled={hybridFlow.isLoading}
				/>
			</FormGroup>

			<FormGroup>
				<Label htmlFor="scopes">Scopes</Label>
				<Input
					id="scopes"
					type="text"
					value={formData.scopes || ''}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						handleFieldChange('scopes', e.target.value)
					}
					placeholder="openid profile email"
					disabled={hybridFlow.isLoading}
				/>
			</FormGroup>

			<FormGroup>
				<Label htmlFor="clientAuthMethod">Client Authentication Method</Label>
				<Select
					id="clientAuthMethod"
					value={formData.clientAuthMethod || 'client_secret_post'}
					onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
						handleFieldChange('clientAuthMethod', e.target.value)
					}
					disabled={hybridFlow.isLoading}
				>
					<option value="client_secret_post">client_secret_post</option>
					<option value="client_secret_basic">client_secret_basic</option>
					<option value="none">none (public client)</option>
				</Select>
			</FormGroup>

			<ActionRow>
				<Button variant="primary" onClick={saveCredentials} disabled={hybridFlow.isLoading}>
					<FiCheckCircle /> Save Credentials
				</Button>
			</ActionRow>
		</>
	);

	// Render variant selection step
	const renderVariantStep = () => (
		<>
			<InfoBox variant="info">
				<FiKey size={20} />
				<div>
					<strong>Choose Hybrid Variant</strong>
					<p>Select the response type for your OIDC Hybrid Flow.</p>
				</div>
			</InfoBox>

			<VariantSelector>
				<VariantCard
					selected={hybridFlow.variant === 'code id_token'}
					onClick={() => handleVariantSelect('code id_token')}
				>
					<VariantTitle>Code + ID Token</VariantTitle>
					<VariantDescription>
						Authorization code + ID token returned immediately
					</VariantDescription>
				</VariantCard>

				<VariantCard
					selected={hybridFlow.variant === 'code token'}
					onClick={() => handleVariantSelect('code token')}
				>
					<VariantTitle>Code + Access Token</VariantTitle>
					<VariantDescription>
						Authorization code + access token returned immediately
					</VariantDescription>
				</VariantCard>

				<VariantCard
					selected={hybridFlow.variant === 'code token id_token'}
					onClick={() => handleVariantSelect('code token id_token')}
				>
					<VariantTitle>Code + Token + ID Token</VariantTitle>
					<VariantDescription>All tokens returned immediately (not recommended)</VariantDescription>
				</VariantCard>
			</VariantSelector>

			<ActionRow>
				<Button variant="primary" onClick={handleGenerateUrl} disabled={hybridFlow.isLoading}>
					<FiRefreshCw /> Generate Authorization URL
				</Button>
			</ActionRow>
		</>
	);

	// Render authorization step
	const renderAuthorizationStep = () => (
		<>
			<InfoBox variant="info">
				<FiExternalLink size={20} />
				<div>
					<strong>Authorization URL Generated</strong>
					<p>Click the link below to authorize the application.</p>
				</div>
			</InfoBox>

			{hybridFlow.authorizationUrl && (
				<URLDisplay>
					<TokenTitle>Authorization URL</TokenTitle>
					<TokenContent>{hybridFlow.authorizationUrl}</TokenContent>
					<CopyButton onClick={() => copyToClipboard(hybridFlow.authorizationUrl)}>
						<FiCopy /> Copy URL
					</CopyButton>
				</URLDisplay>
			)}

			<ActionRow>
				<Button variant="primary" onClick={hybridFlow.redirectToAuthorization}>
					<FiExternalLink /> Open Authorization Page
				</Button>
				<Button variant="secondary" onClick={handleGenerateUrl}>
					<FiRefreshCw /> Regenerate URL
				</Button>
			</ActionRow>
		</>
	);

	// Render tokens step
	const renderTokensStep = () => {
		const allTokens = hybridFlow.getAllTokens();
		if (!allTokens) return null;

		return (
			<>
				<InfoBox variant="success">
					<FiCheckCircle size={20} />
					<div>
						<strong>Authentication Successful!</strong>
						<p>Tokens have been received and processed.</p>
					</div>
				</InfoBox>

				<TokenDisplay>
					<TokenTitle>Received Tokens</TokenTitle>
					<TokenContent>{JSON.stringify(allTokens, null, 2)}</TokenContent>
					<CopyButton onClick={() => copyToClipboard(JSON.stringify(allTokens, null, 2))}>
						<FiCopy /> Copy Tokens
					</CopyButton>
				</TokenDisplay>

				<ActionRow>
					<Button variant="secondary" onClick={hybridFlow.reset}>
						<FiRefreshCw /> Start New Flow
					</Button>
				</ActionRow>
			</>
		);
	};

	// Render current step content
	const renderStepContent = () => {
		switch (hybridFlow.currentStep) {
			case 0:
				return renderCredentialsStep();
			case 1:
				return renderVariantStep();
			case 2:
				return renderAuthorizationStep();
			case 3:
				return renderTokensStep();
			default:
				return null;
		}
	};

	return (
		<Container>
			<Header>
				<Title>
					OIDC Hybrid Flow
					<VersionBadge>V8</VersionBadge>
				</Title>
				<Subtitle>Modern OpenID Connect Hybrid Flow with real-time token management</Subtitle>
			</Header>

			<MainCard>
				<StepHeader>
					<StepTitle>
						<StepNumber>{hybridFlow.currentStep + 1}</StepNumber>
						{hybridFlow.currentStep === 0 && 'Configure Credentials'}
						{hybridFlow.currentStep === 1 && 'Select Variant'}
						{hybridFlow.currentStep === 2 && 'Authorize'}
						{hybridFlow.currentStep === 3 && 'Tokens'}
					</StepTitle>
					{hybridFlow.error && (
						<InfoBox variant="warning" style={{ maxWidth: '400px' }}>
							<FiAlertTriangle size={16} />
							<small>{hybridFlow.error}</small>
						</InfoBox>
					)}
				</StepHeader>

				<StepIndicator
					active={hybridFlow.currentStep === 0}
					completed={hybridFlow.currentStep > 0}
				/>
				<StepIndicator
					active={hybridFlow.currentStep === 1}
					completed={hybridFlow.currentStep > 1}
				/>
				<StepIndicator
					active={hybridFlow.currentStep === 2}
					completed={hybridFlow.currentStep > 2}
				/>
				<StepIndicator
					active={hybridFlow.currentStep === 3}
					completed={hybridFlow.currentStep > 3}
				/>

				{renderStepContent()}
			</MainCard>

			{spinner.spinnerState.show && (
				<CommonSpinner
					message={spinner.spinnerState.message}
					variant={spinner.spinnerState.type}
					theme={spinner.spinnerState.theme}
					{...(spinner.spinnerState.size && { size: spinner.spinnerState.size })}
					{...(spinner.spinnerState.progress !== undefined && {
						progress: spinner.spinnerState.progress,
					})}
					{...(spinner.spinnerState.allowDismiss !== undefined && {
						allowDismiss: spinner.spinnerState.allowDismiss,
					})}
					onDismiss={() => {}}
				/>
			)}
		</Container>
	);
};

export default OIDCHybridFlowV8;
