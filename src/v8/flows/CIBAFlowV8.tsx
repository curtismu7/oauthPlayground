/**
 * @file CIBAFlowV8.tsx
 * @module v8/flows
 * @description CIBA (Client Initiated Backchannel Authentication) Flow V8
 * @version 8.0.0
 * @since 2026-02-17
 *
 * Modern CIBA flow implementation with V8 architecture:
 * - Clean component structure with V8 patterns
 * - Integration with modern V8 services
 * - Professional UI with consistent styling
 * - Real-time polling and status updates
 * - Comprehensive error handling
 *
 * @example
 * <CIBAFlowV8 />
 */

import React, { useEffect, useState } from 'react';
import { FiActivity, FiAlertTriangle, FiCheckCircle, FiClock, FiCopy, FiInfo, FiShield, FiSmartphone, FiZap, FiX } from 'react-icons/fi';
import { CibaServiceV8, type CibaCredentials } from '@/v8/services/cibaServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { useCibaFlowV8 } from '@/v8/hooks/useCibaFlowV8';
import { useProductionSpinner } from '@/hooks/useProductionSpinner';
import { CommonSpinner } from '@/components/common/CommonSpinner';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔐 CIBA-FLOW-V8]';
const FLOW_KEY = 'ciba-v8';

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
	display: inline-block;
	background: #3b82f6;
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.875rem;
	font-weight: 600;
`;

const MainCard = styled.div`
	background: white;
	border-radius: 1rem;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	padding: 2rem;
	margin-bottom: 2rem;
`;

const Section = styled.div`
	margin-bottom: 2rem;
	
	&:last-child {
		margin-bottom: 0;
	}
`;

const SectionTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const StatusCard = styled.div<{ $status: 'pending' | 'approved' | 'completed' | 'failed' | 'error' | 'denied' | 'expired' }>`
	padding: 1.5rem;
	border-radius: 0.75rem;
	border: 1px solid;
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1.5rem;
	
	${(props) => {
		switch (props.$status) {
			case 'pending':
				return `
					background: #fef3c7;
					border-color: #f59e0b;
					color: #92400e;
				`;
			case 'approved':
			case 'completed':
				return `
					background: #d1fae5;
					border-color: #10b981;
					color: #065f46;
				`;
			case 'denied':
			case 'failed':
			case 'error':
			case 'expired':
				return `
					background: #fee2e2;
					border-color: #ef4444;
					color: #991b1b;
				`;
			default:
				return `
					background: #f3f4f6;
					border-color: #d1d5db;
					color: #374151;
				`;
		}
	}}
`;

const ProgressBar = styled.div`
	width: 100%;
	height: 0.5rem;
	background: #e5e7eb;
	border-radius: 9999px;
	overflow: hidden;
	margin-bottom: 1rem;
`;

const ProgressFill = styled.div<{ $progress: number }>`
	height: 100%;
	background: #3b82f6;
	transition: width 0.3s ease;
	width: ${(props) => props.$progress}%;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	border: none;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	
	${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
					background: #3b82f6;
					color: white;
					&:hover {
						background: #2563eb;
					}
				`;
			case 'secondary':
				return `
					background: #f3f4f6;
					color: #374151;
					border: 1px solid #d1d5db;
					&:hover {
						background: #e5e7eb;
					}
				`;
			case 'danger':
				return `
					background: #ef4444;
					color: white;
					&:hover {
						background: #dc2626;
					}
				`;
			default:
				return `
					background: #3b82f6;
					color: white;
					&:hover {
						background: #2563eb;
					}
				`;
		}
	}}
	
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 1rem;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Label = styled.label`
	display: block;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 1rem;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const TextArea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 1rem;
	resize: vertical;
	min-height: 100px;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const InfoBox = styled.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1rem;
`;

const InfoTitle = styled.div`
	font-weight: 600;
	color: #1e40af;
	margin-bottom: 0.5rem;
`;

const InfoText = styled.div`
	color: #1e40af;
	font-size: 0.875rem;
`;

const TokenDisplay = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1rem;
	font-family: 'Courier New', monospace;
	font-size: 0.875rem;
	word-break: break-all;
`;

const CopyButton = styled.button`
	background: #64748b;
	color: white;
	border: none;
	padding: 0.5rem 1rem;
	border-radius: 0.375rem;
	cursor: pointer;
	font-size: 0.875rem;
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	
	&:hover {
		background: #475569;
	}
`;

// Import styled-components
import styled from 'styled-components';

/**
 * CIBA Flow V8 Component
 * Modern implementation with V8 architecture and patterns
 */
const CIBAFlowV8: React.FC = () => {
	// V8 hooks and services
	const cibaFlow = useCibaFlowV8();
	const spinner = useProductionSpinner('ciba-flow');

	// Form state
	const [credentials, setCredentials] = useState<CibaCredentials>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		scope: CibaServiceV8.getDefaultScope(),
		loginHint: '',
		bindingMessage: '',
		requestContext: JSON.stringify({
			device: 'Smart TV',
			location: 'Living Room',
			ip: '192.168.1.1',
		}, null, 2),
		clientAuthMethod: 'client_secret_post',
	});

	// Load saved credentials on mount
	useEffect(() => {
		const loadSavedCredentials = async () => {
			try {
				const savedCredentials = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
					flowKey: FLOW_KEY,
					flowType: 'oauth',
					includeClientSecret: true,
					includeRedirectUri: false,
					includeLogoutUri: false,
					includeScopes: true,
				});
				if (savedCredentials) {
					setCredentials(prev => ({
						...prev,
						...savedCredentials,
						// Preserve defaults for missing fields
						scope: savedCredentials.scope || CibaServiceV8.getDefaultScope(),
						bindingMessage: savedCredentials.bindingMessage || '',
						requestContext: savedCredentials.requestContext || JSON.stringify({
							device: 'Smart TV',
							location: 'Living Room',
							ip: '192.168.1.1',
						}, null, 2),
						clientAuthMethod: savedCredentials.clientAuthMethod as 'client_secret_post' | 'client_secret_basic',
					}));
				}
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to load saved credentials:`, error);
			}
		};

		loadSavedCredentials();
	}, []);

	// Handle form field changes
	const handleFieldChange = (field: keyof CibaCredentials, value: string) => {
		setCredentials(prev => ({ ...prev, [field]: value }));
	};

	// Save credentials
	const saveCredentials = async () => {
		try {
			await CredentialsServiceV8.saveCredentials(FLOW_KEY, credentials);
			toastV8.success('Credentials saved successfully!');
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save credentials:`, error);
			toastV8.error('Failed to save credentials');
		}
	};

	// Handle CIBA initiation
	const handleInitiateAuthentication = async () => {
		const authRequest = await cibaFlow.initiateAuthentication(credentials);
		if (authRequest) {
			// Start automatic polling
			cibaFlow.startPolling(authRequest.auth_req_id, credentials);
			// Save credentials
			await saveCredentials();
		}
	};

	// Handle manual polling
	const handlePollForTokens = async () => {
		if (cibaFlow.state.authRequest) {
			await cibaFlow.pollForTokens(cibaFlow.state.authRequest.auth_req_id, credentials);
		}
	};

	// Copy to clipboard
	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toastV8.success('Copied to clipboard!');
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
			toastV8.error('Failed to copy to clipboard');
		}
	};

	// Get status icon
	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'pending':
				return <FiClock />;
			case 'approved':
			case 'completed':
				return <FiCheckCircle />;
			case 'denied':
			case 'failed':
			case 'error':
			case 'expired':
				return <FiAlertTriangle />;
			default:
				return <FiInfo />;
		}
	};

	return (
		<Container>
			<Header>
				<Title>CIBA Authentication Flow</Title>
				<Subtitle>Client Initiated Backchannel Authentication (RFC 9436)</Subtitle>
				<VersionBadge>V8.0.0</VersionBadge>
			</Header>

			{/* Status Card */}
			{cibaFlow.state.authRequest && (
				<StatusCard $status={cibaFlow.state.status}>
					{getStatusIcon(cibaFlow.state.status)}
					<div>
						<div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
							{cibaFlow.statusMessage}
						</div>
						<div style={{ fontSize: '0.875rem' }}>
							{cibaFlow.state.status === 'pending' && (
								<>
									Waiting for user approval... ({cibaFlow.getRemainingTime()}s remaining)
								</>
							)}
							{cibaFlow.state.status === 'approved' && (
								<>Authentication completed successfully!</>
							)}
							{cibaFlow.state.error && (
								<>Error: {cibaFlow.state.error}</>
							)}
						</div>
					</div>
				</StatusCard>
			)}

			{/* Progress Bar */}
			{cibaFlow.state.isPolling && (
				<div>
					<ProgressBar>
						<ProgressFill $progress={cibaFlow.getPollingProgress()} />
					</ProgressBar>
					<div style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
						Polling attempt {cibaFlow.state.pollingCount} of {cibaFlow.state.maxPollingAttempts}
					</div>
				</div>
			)}

			<MainCard>
				{/* Configuration Section */}
				<Section>
					<SectionTitle>
						<FiShield />
						CIBA Configuration
					</SectionTitle>

					<InfoBox>
						<InfoTitle>About CIBA</InfoTitle>
						<InfoText>
							CIBA allows authentication on a secondary device while the initiating client waits for the result.
							The user will receive a notification on their device to approve or deny the authentication request.
						</InfoText>
					</InfoBox>

					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
						<FormGroup>
							<Label htmlFor="environmentId">Environment ID *</Label>
							<Input
								id="environmentId"
								type="text"
								value={credentials.environmentId}
								onChange={(e) => handleFieldChange('environmentId', e.target.value)}
								placeholder="PingOne Environment ID"
								disabled={cibaFlow.isActive}
							/>
						</FormGroup>

						<FormGroup>
							<Label htmlFor="clientId">Client ID *</Label>
							<Input
								id="clientId"
								type="text"
								value={credentials.clientId}
								onChange={(e) => handleFieldChange('clientId', e.target.value)}
								placeholder="Application Client ID"
								disabled={cibaFlow.isActive}
							/>
						</FormGroup>

						<FormGroup>
							<Label htmlFor="clientSecret">Client Secret *</Label>
							<Input
								id="clientSecret"
								type="password"
								value={credentials.clientSecret}
								onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
								placeholder="Application Client Secret"
								disabled={cibaFlow.isActive}
							/>
						</FormGroup>

						<FormGroup>
							<Label htmlFor="loginHint">Login Hint *</Label>
							<Input
								id="loginHint"
								type="text"
								value={credentials.loginHint}
								onChange={(e) => handleFieldChange('loginHint', e.target.value)}
								placeholder="user@example.com or +1234567890"
								disabled={cibaFlow.isActive}
							/>
						</FormGroup>

						<FormGroup>
							<Label htmlFor="scope">Scope</Label>
							<Input
								id="scope"
								type="text"
								value={credentials.scope}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('scope', e.target.value)}
								placeholder="openid profile email"
								disabled={cibaFlow.isActive}
							/>
						</FormGroup>

						<FormGroup>
							<Label htmlFor="clientAuthMethod">Client Auth Method</Label>
							<Select
								id="clientAuthMethod"
								value={credentials.clientAuthMethod}
								onChange={(e) => handleFieldChange('clientAuthMethod', e.target.value as any)}
								disabled={cibaFlow.isActive}
							>
								<option value="client_secret_post">Client Secret Post</option>
								<option value="client_secret_basic">Client Secret Basic</option>
							</Select>
						</FormGroup>
					</div>

					<FormGroup>
						<Label htmlFor="bindingMessage">Binding Message (Optional)</Label>
						<Input
							id="bindingMessage"
							type="text"
							value={credentials.bindingMessage}
							onChange={(e) => handleFieldChange('bindingMessage', e.target.value)}
							placeholder="Custom message shown to user"
							disabled={cibaFlow.isActive}
						/>
					</FormGroup>

					<FormGroup>
						<Label htmlFor="requestContext">Request Context (Optional)</Label>
						<TextArea
							id="requestContext"
							value={credentials.requestContext}
							onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('requestContext', e.target.value)}
							placeholder="JSON context for the authentication request"
							disabled={cibaFlow.isActive}
						/>
					</FormGroup>
				</Section>

				{/* Action Buttons */}
				<Section>
					<SectionTitle>
						<FiZap />
						Actions
					</SectionTitle>

					<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
						{!cibaFlow.state.authRequest ? (
							<Button
								$variant="primary"
								onClick={handleInitiateAuthentication}
								disabled={cibaFlow.state.isInitiating || !credentials.environmentId || !credentials.clientId || !credentials.clientSecret || !credentials.loginHint}
							>
								<FiSmartphone />
								{cibaFlow.state.isInitiating ? 'Initiating...' : 'Initiate CIBA Authentication'}
							</Button>
						) : (
							<>
								{cibaFlow.canPoll && (
									<Button
										$variant="primary"
										onClick={handlePollForTokens}
										disabled={cibaFlow.state.isPolling}
									>
										<FiActivity />
										Check Status
									</Button>
								)}
								<Button
									$variant="secondary"
									onClick={() => cibaFlow.startPolling(cibaFlow.state.authRequest!.auth_req_id, credentials)}
									disabled={cibaFlow.state.isPolling}
								>
									<FiClock />
									Start Polling
								</Button>
								<Button
									$variant="danger"
									onClick={cibaFlow.stopPolling}
									disabled={!cibaFlow.state.isPolling}
								>
									<FiX />
									Stop Polling
								</Button>
								<Button
									$variant="secondary"
									onClick={cibaFlow.reset}
								>
									<FiX />
									Reset Flow
								</Button>
							</>
						)}
					</div>
				</Section>

				{/* Authentication Request Details */}
				{cibaFlow.state.authRequest && (
					<Section>
						<SectionTitle>
							<FiInfo />
							Authentication Request Details
						</SectionTitle>

						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
							<div>
								<strong>Request ID:</strong>
								<div style={{ fontFamily: 'monospace', fontSize: '0.875rem', wordBreak: 'break-all' }}>
									{cibaFlow.state.authRequest.auth_req_id}
									<CopyButton onClick={() => copyToClipboard(cibaFlow.state.authRequest!.auth_req_id)}>
										<FiCopy /> Copy
									</CopyButton>
								</div>
							</div>
							<div>
								<strong>Expires In:</strong> {cibaFlow.state.authRequest.expires_in}s
							</div>
							<div>
								<strong>Polling Interval:</strong> {cibaFlow.state.authRequest.interval}s
							</div>
							{cibaFlow.state.authRequest.binding_message && (
								<div>
									<strong>Binding Message:</strong> {cibaFlow.state.authRequest.binding_message}
								</div>
							)}
							{cibaFlow.state.authRequest.user_code && (
								<div>
									<strong>User Code:</strong> {cibaFlow.state.authRequest.user_code}
								</div>
							)}
						</div>
					</Section>
				)}

				{/* Tokens Display */}
				{cibaFlow.state.tokens && (
					<Section>
						<SectionTitle>
							<FiCheckCircle />
							Authentication Tokens
						</SectionTitle>

						<TokenDisplay>
							<strong>Access Token:</strong>
							<div style={{ marginTop: '0.5rem', wordBreak: 'break-all' }}>
								{cibaFlow.state.tokens.access_token}
								<CopyButton onClick={() => copyToClipboard(cibaFlow.state.tokens!.access_token)}>
									<FiCopy /> Copy
								</CopyButton>
							</div>
						</TokenDisplay>

						{cibaFlow.state.tokens.refresh_token && (
							<TokenDisplay>
								<strong>Refresh Token:</strong>
								<div style={{ marginTop: '0.5rem', wordBreak: 'break-all' }}>
									{cibaFlow.state.tokens.refresh_token}
									<CopyButton onClick={() => copyToClipboard(cibaFlow.state.tokens!.refresh_token!)}>
										<FiCopy /> Copy
									</CopyButton>
								</div>
							</TokenDisplay>
						)}

						{cibaFlow.state.tokens.id_token && (
							<TokenDisplay>
								<strong>ID Token:</strong>
								<div style={{ marginTop: '0.5rem', wordBreak: 'break-all' }}>
									{cibaFlow.state.tokens.id_token}
									<CopyButton onClick={() => copyToClipboard(cibaFlow.state.tokens!.id_token!)}>
										<FiCopy /> Copy
									</CopyButton>
								</div>
							</TokenDisplay>
						)}

						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
							<div><strong>Token Type:</strong> {cibaFlow.state.tokens.token_type}</div>
							<div><strong>Expires In:</strong> {cibaFlow.state.tokens.expires_in}s</div>
							<div><strong>Scope:</strong> {cibaFlow.state.tokens.scope}</div>
							{cibaFlow.state.tokens.sub && <div><strong>Subject:</strong> {cibaFlow.state.tokens.sub}</div>}
						</div>
					</Section>
				)}
			</MainCard>

				{/* Spinner Modals */}
		{spinner.spinnerState.show && (
			<CommonSpinner
				message={spinner.spinnerState.message}
				variant={spinner.spinnerState.type}
				theme={spinner.spinnerState.theme}
				{...(spinner.spinnerState.size && { size: spinner.spinnerState.size })}
				{...(spinner.spinnerState.progress !== undefined && { progress: spinner.spinnerState.progress })}
				{...(spinner.spinnerState.allowDismiss !== undefined && { allowDismiss: spinner.spinnerState.allowDismiss })}
				onDismiss={() => {}}
			/>
		)}
		</Container>
	);
};

export default CIBAFlowV8;
