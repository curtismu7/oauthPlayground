// src/v8/flows/TokenExchangeFlowV8.tsx
// V8 OAuth 2.0 Token Exchange Flow - RFC 8693 Implementation for A2A Security
// Phase 1: Same environment only, admin enablement required

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiCopy,
	FiKey,
	FiLock,
	FiRefreshCw,
	FiShield,
	FiUsers,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import { useProductionSpinner } from '../../hooks/useProductionSpinner';
import { ButtonSpinner } from '../../components/ui/ButtonSpinner';
import { CommonSpinner } from '../../components/common/CommonSpinner';
import { GlobalEnvironmentService } from '../services/globalEnvironmentService';
import { TokenExchangeConfigServiceV8 } from '../services/tokenExchangeConfigServiceV8';
import { TokenExchangeServiceV8 } from '../services/tokenExchangeServiceV8';
import type { TokenExchangeParams, TokenExchangeResponse } from '../types/tokenExchangeTypesV8';
import { TokenExchangeError, TokenExchangeErrorType } from '../types/tokenExchangeTypesV8';
import { toastV8 } from '../utils/toastNotificationsV8';

type TokenExchangeScenario =
	| 'delegation'
	| 'impersonation'
	| 'scope-reduction'
	| 'audience-restriction';

const MODULE_TAG = '[TokenExchangeFlowV8]';

// V8 Styled Components
const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const MainCard = styled.div`
	background-color: #ffffff;
	border-radius: 1rem;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
`;

const Header = styled.div`
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: #ffffff;
	padding: 2rem;
	text-align: center;
`;

const VersionBadge = styled.span`
	background: rgba(59, 130, 246, 0.2);
	border: 1px solid #60a5fa;
	color: #dbeafe;
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	margin-bottom: 1rem;
	display: inline-block;
`;

const Title = styled.h1`
	font-size: 2.5rem;
	font-weight: 700;
	margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
	font-size: 1.125rem;
	color: rgba(255, 255, 255, 0.9);
	margin: 0;
`;

const ContentSection = styled.div`
	padding: 2rem;
`;

const ScenarioSelector = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
	margin: 2rem 0;
`;

const ScenarioCard = styled.button<{ $selected: boolean }>`
	padding: 1.5rem;
	border: 2px solid ${({ $selected }) => ($selected ? '#7c3aed' : '#e2e8f0')};
	border-radius: 0.75rem;
	background: ${({ $selected }) => ($selected ? '#f3f4f6' : '#ffffff')};
	cursor: pointer;
	transition: all 0.2s ease;
	text-align: left;
	width: 100%;
	font-family: inherit;

	&:hover {
		border-color: #7c3aed;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
	}
`;

const ScenarioIcon = styled.div`
	font-size: 2rem;
	color: #7c3aed;
	margin-bottom: 1rem;
`;

const ScenarioTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	margin: 0 0 0.5rem 0;
	color: #1f2937;
`;

const ScenarioDescription = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0;
	line-height: 1.5;
`;

const FormSection = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.75rem;
	padding: 2rem;
	margin: 2rem 0;
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

const Input = styled.textarea`
	width: 100%;
	min-height: 120px;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	resize: vertical;

	&:focus {
		outline: none;
		border-color: #7c3aed;
		box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	background: white;

	&:focus {
		outline: none;
		border-color: #7c3aed;
		box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
	}
`;

const ResultSection = styled.div`
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 0.75rem;
	padding: 2rem;
	margin: 2rem 0;
`;

const ResultHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1rem;
`;

const ResultTitle = styled.h3`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: #16a34a;
`;

const ResultContent = styled.pre`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	font-family: 'Courier New', monospace;
	font-size: 0.875rem;
	overflow-x: auto;
`;

const ErrorSection = styled.div`
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 0.75rem;
	padding: 2rem;
	margin: 2rem 0;
`;

interface TokenExchangeFlowV8Props {
	environmentId?: string;
	onTokenReceived?: (token: TokenExchangeResponse) => void;
	onError?: (error: TokenExchangeError) => void;
}

export const TokenExchangeFlowV8: React.FC<TokenExchangeFlowV8Props> = ({
	environmentId,
	onTokenReceived,
	onError,
}) => {
	const [selectedScenario, setSelectedScenario] = useState<TokenExchangeScenario>('delegation');
	const [subjectToken, setSubjectToken] = useState('');
	const [subjectTokenType, setSubjectTokenType] = useState(
		'urn:ietf:params:oauth:token-type:access_token'
	);
	const [requestedTokenType, setRequestedTokenType] = useState(
		'urn:ietf:params:oauth:token-type:access_token'
	);
	const [scope, setScope] = useState('read');
	const [actorToken, setActorToken] = useState('');
	const [actorTokenType, setActorTokenType] = useState(
		'urn:ietf:params:oauth:token-type:access_token'
	);
	const [result, setResult] = useState<TokenExchangeResponse | null>(null);
	const [error, setError] = useState<TokenExchangeError | null>(null);
	const [isLoading, _setIsLoading] = useState(false);
	const [isAdminEnabled, setIsAdminEnabled] = useState(false);

	// Spinner hooks for async operations
	const tokenExchangeSpinner = useProductionSpinner('token-exchange');
	const adminCheckSpinner = useProductionSpinner('admin-check');

	// Get current environment ID
	const currentEnvironmentId =
		environmentId || GlobalEnvironmentService.getInstance().getEnvironmentId() || '';

	// Check admin enablement on mount
	useEffect(() => {
		const checkAdminEnablement = async () => {
			await adminCheckSpinner.withSpinner(async () => {
				try {
					const enabled = await TokenExchangeConfigServiceV8.isEnabled(currentEnvironmentId);
					setIsAdminEnabled(enabled);
					if (!enabled) {
						setError(
							new TokenExchangeError(
								TokenExchangeErrorType.ADMIN_DISABLED,
								'Token Exchange is not enabled for this environment. Please contact your administrator.'
							)
						);
					}
				} catch (err) {
					console.error(`${MODULE_TAG} Error checking admin enablement:`, err);
					setError(
						new TokenExchangeError(
							TokenExchangeErrorType.SERVER_ERROR,
							'Failed to check Token Exchange configuration'
						)
					);
				}
			}, 'Checking configuration...');
		};

		checkAdminEnablement();
	}, [currentEnvironmentId, adminCheckSpinner]);

	// Handle token exchange
	const handleTokenExchange = useCallback(async () => {
		if (!isAdminEnabled) {
			return;
		}

		await tokenExchangeSpinner.withSpinner(async () => {
			setError(null);
			setResult(null);

			try {
				const params: TokenExchangeParams = {
					subject_token: subjectToken.trim(),
					subject_token_type: subjectTokenType as
						| 'urn:ietf:params:oauth:token-type:access_token'
						| 'urn:ietf:params:oauth:token-type:id_token',
					requested_token_type:
						requestedTokenType as 'urn:ietf:params:oauth:token-type:access_token',
					...(scope && { scope: scope.trim() }),
					...(actorToken.trim() && {
						actor_token: actorToken.trim(),
						actor_token_type: actorTokenType as
							| 'urn:ietf:params:oauth:token-type:access_token'
							| 'urn:ietf:params:oauth:token-type:id_token',
					}),
				};

				console.log(`${MODULE_TAG} Executing token exchange with params:`, {
					...params,
					subject_token: '[REDACTED]',
					...(params.actor_token && { actor_token: '[REDACTED]' }),
				});

				const response = await TokenExchangeServiceV8.exchangeToken(params, currentEnvironmentId);

				setResult(response);
				toastV8.success('Token exchange completed successfully!');
				onTokenReceived?.(response);
			} catch (err) {
				const tokenError = err as TokenExchangeError;
				setError(tokenError);
				toastV8.error(`Token exchange failed: ${tokenError.message}`);
				onError?.(tokenError);
			}
		}, 'Exchanging tokens...');
	}, [
		subjectToken,
		subjectTokenType,
		requestedTokenType,
		scope,
		actorToken,
		actorTokenType,
		currentEnvironmentId,
		isAdminEnabled,
		onTokenReceived,
		onError,
		tokenExchangeSpinner,
	]);

	// Copy to clipboard
	const copyToClipboard = useCallback((text: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				toastV8.success('Copied to clipboard!');
			})
			.catch(() => {
				toastV8.error('Failed to copy to clipboard');
			});
	}, []);

	const scenarios = [
		{
			id: 'delegation' as TokenExchangeScenario,
			icon: FiUsers,
			title: 'Delegation',
			description: 'Delegate access from one service to another with reduced scope',
		},
		{
			id: 'impersonation' as TokenExchangeScenario,
			icon: FiUsers,
			title: 'Impersonation',
			description: 'Act on behalf of another user or service with proper authorization',
		},
		{
			id: 'scope-reduction' as TokenExchangeScenario,
			icon: FiShield,
			title: 'Scope Reduction',
			description: 'Exchange a token with broad scopes for one with limited permissions',
		},
		{
			id: 'audience-restriction' as TokenExchangeScenario,
			icon: FiLock,
			title: 'Audience Restriction',
			description: 'Restrict token access to specific resources or APIs',
		},
	];

	return (
		<Container>
			<MainCard>
				<Header>
					<VersionBadge>Phase 1 - RFC 8693</VersionBadge>
					<Title>Token Exchange</Title>
					<Subtitle>OAuth 2.0 Token Exchange Grant Type - Same Environment Only</Subtitle>
				</Header>

				<ContentSection>
					{/* Admin Enablement Status */}
					{!isAdminEnabled && (
						<ErrorSection>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
									marginBottom: '1rem',
								}}
							>
								<FiAlertCircle style={{ color: '#dc2626', fontSize: '1.5rem' }} />
								<h3 style={{ color: '#dc2626', margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
									Token Exchange Disabled
								</h3>
							</div>
							<p style={{ color: '#7f1d1d', margin: 0, lineHeight: 1.6 }}>
								Token Exchange is not enabled for this environment. Please contact your
								administrator to enable this feature.
							</p>
						</ErrorSection>
					)}

					{/* Scenario Selection */}
					<ScenarioSelector>
						{scenarios.map((scenario) => (
							<ScenarioCard
								key={scenario.id}
								$selected={selectedScenario === scenario.id}
								onClick={() => setSelectedScenario(scenario.id)}
							>
								<ScenarioIcon>
									<scenario.icon />
								</ScenarioIcon>
								<ScenarioTitle>{scenario.title}</ScenarioTitle>
								<ScenarioDescription>{scenario.description}</ScenarioDescription>
							</ScenarioCard>
						))}
					</ScenarioSelector>

					{/* Token Exchange Form */}
					<FormSection>
						<h3
							style={{
								margin: '0 0 1.5rem 0',
								color: '#1f2937',
								fontSize: '1.25rem',
								fontWeight: 600,
							}}
						>
							Token Exchange Parameters
						</h3>

						<FormGroup>
							<Label htmlFor="subject-token">Subject Token *</Label>
							<Input
								id="subject-token"
								value={subjectToken}
								onChange={(e) => setSubjectToken(e.target.value)}
								placeholder="Paste your access token or ID token here..."
							/>
						</FormGroup>

						<FormGroup>
							<Label htmlFor="subject-token-type">Subject Token Type</Label>
							<Select
								id="subject-token-type"
								value={subjectTokenType}
								onChange={(e) => setSubjectTokenType(e.target.value)}
							>
								<option value="urn:ietf:params:oauth:token-type:access_token">Access Token</option>
								<option value="urn:ietf:params:oauth:token-type:id_token">ID Token</option>
							</Select>
						</FormGroup>

						<FormGroup>
							<Label htmlFor="requested-token-type">Requested Token Type</Label>
							<Select
								id="requested-token-type"
								value={requestedTokenType}
								onChange={(e) => setRequestedTokenType(e.target.value)}
								disabled // Phase 1: only access_token supported
							>
								<option value="urn:ietf:params:oauth:token-type:access_token">
									Access Token (Phase 1 Only)
								</option>
							</Select>
						</FormGroup>

						<FormGroup>
							<Label htmlFor="scope">Scope (Optional)</Label>
							<Input
								id="scope"
								value={scope}
								onChange={(e) => setScope(e.target.value)}
								placeholder="read write admin (space-separated)"
							/>
						</FormGroup>

						<FormGroup>
							<Label htmlFor="actor-token">Actor Token (Optional)</Label>
							<Input
								id="actor-token"
								value={actorToken}
								onChange={(e) => setActorToken(e.target.value)}
								placeholder="Optional actor token for delegation scenarios..."
							/>
						</FormGroup>

						<FormGroup>
							<Label htmlFor="actor-token-type">Actor Token Type</Label>
							<Select
								id="actor-token-type"
								value={actorTokenType}
								onChange={(e) => setActorTokenType(e.target.value)}
								disabled={!actorToken.trim()}
							>
								<option value="urn:ietf:params:oauth:token-type:access_token">Access Token</option>
								<option value="urn:ietf:params:oauth:token-type:id_token">ID Token</option>
							</Select>
						</FormGroup>

						<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
							<ButtonSpinner
								loading={isLoading}
								onClick={handleTokenExchange}
								disabled={!isAdminEnabled || !subjectToken.trim()}
								spinnerSize={16}
								spinnerPosition="left"
								loadingText="Exchanging..."
								style={{
									background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
									color: 'white',
									border: 'none',
									padding: '0.75rem 1.5rem',
									borderRadius: '0.5rem',
									fontWeight: '600',
									cursor: 'pointer',
									transition: 'all 0.2s ease',
								}}
							>
								{isLoading ? '' : <FiZap />}
								{isLoading ? '' : 'Exchange Token'}
							</ButtonSpinner>

							<ButtonSpinner
								loading={false}
								onClick={() => {
									setSubjectToken('');
									setActorToken('');
									setScope('read');
									setResult(null);
									setError(null);
								}}
								spinnerSize={14}
								spinnerPosition="left"
								style={{
									background: '#f8fafc',
									color: '#475569',
									border: '1px solid #e2e8f0',
									padding: '0.75rem 1.5rem',
									borderRadius: '0.5rem',
									fontWeight: '600',
									cursor: 'pointer',
									transition: 'all 0.2s ease',
								}}
							>
								<FiRefreshCw />
								Clear Form
							</ButtonSpinner>
						</div>
					</FormSection>

					{/* Results */}
					{result && (
						<ResultSection>
							<ResultHeader>
								<FiCheckCircle style={{ color: '#16a34a', fontSize: '1.5rem' }} />
								<ResultTitle>Token Exchange Successful</ResultTitle>
							</ResultHeader>
							<ResultContent>{JSON.stringify(result, null, 2)}</ResultContent>
							<div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
								<ButtonSpinner
									loading={false}
									onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
									spinnerSize={12}
									spinnerPosition="left"
									style={{
										background: '#f8fafc',
										color: '#475569',
										border: '1px solid #e2e8f0',
										padding: '0.5rem 1rem',
										borderRadius: '0.5rem',
										fontWeight: '600',
										cursor: 'pointer',
										transition: 'all 0.2s ease',
									}}
								>
									<FiCopy />
									Copy JSON
								</ButtonSpinner>
								<ButtonSpinner
									loading={false}
									onClick={() => copyToClipboard(result.access_token)}
									spinnerSize={12}
									spinnerPosition="left"
									style={{
										background: '#f8fafc',
										color: '#475569',
										border: '1px solid #e2e8f0',
										padding: '0.5rem 1rem',
										borderRadius: '0.5rem',
										fontWeight: '600',
										cursor: 'pointer',
										transition: 'all 0.2s ease',
									}}
								>
									<FiKey />
									Copy Access Token
								</ButtonSpinner>
							</div>
						</ResultSection>
					)}

					{/* Errors */}
					{error && (
						<ErrorSection>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
									marginBottom: '1rem',
								}}
							>
								<FiAlertCircle style={{ color: '#dc2626', fontSize: '1.5rem' }} />
								<h3 style={{ color: '#dc2626', margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
									Token Exchange Failed
								</h3>
							</div>
							<div
								style={{
									background: '#ffffff',
									padding: '1rem',
									borderRadius: '0.5rem',
									marginBottom: '1rem',
								}}
							>
								<p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#374151' }}>
									Error Type: {error.type}
								</p>
								<p style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>{error.message}</p>
								{error.details && (
									<p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
										Details: {JSON.stringify(error.details, null, 2)}
									</p>
								)}
							</div>
							<ButtonSpinner
								loading={false}
								onClick={() => setError(null)}
								spinnerSize={14}
								spinnerPosition="left"
								style={{
									background: '#f8fafc',
									color: '#475569',
									border: '1px solid #e2e8f0',
									padding: '0.75rem 1.5rem',
									borderRadius: '0.5rem',
									fontWeight: '600',
									cursor: 'pointer',
									transition: 'all 0.2s ease',
								}}
							>
								<FiRefreshCw />
								Try Again
							</ButtonSpinner>
						</ErrorSection>
					)}
				</ContentSection>
			</MainCard>

			{/* Spinner Modals */}
			{tokenExchangeSpinner.isLoading && (
				<CommonSpinner
					message={tokenExchangeSpinner.spinnerState.message || 'Exchanging tokens...'}
					theme="blue"
					variant="modal"
					allowDismiss={false}
				/>
			)}
			{adminCheckSpinner.isLoading && (
				<CommonSpinner
					message={adminCheckSpinner.spinnerState.message || 'Checking configuration...'}
					theme="blue"
					variant="modal"
					allowDismiss={false}
				/>
			)}
		</Container>
	);
};

export default TokenExchangeFlowV8;
