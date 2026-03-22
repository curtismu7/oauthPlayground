// src/pages/flows/v9/TokenExchangeFlowV9.tsx
// OAuth 2.0 Token Exchange Flow - RFC 8693 Implementation for A2A Security - V9
// lint-file-disable: token-value-in-jsx

import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getButtonStyles } from '../../../services/v9/V9ColorStandards';
import { V9CredentialStorageService } from '../../../services/v9/V9CredentialStorageService';
import { V9FlowRestartButton } from '../../../services/v9/V9FlowRestartButton';
import { V9ModernMessagingService } from '../../../services/v9/V9ModernMessagingService';
import V9FlowHeader from '../../../services/v9/v9FlowHeaderService';
import type { DiscoveredApp } from '../../../v8/components/AppPickerV8';
import { CompactAppPickerV8U } from '../../../v8u/components/CompactAppPickerV8U';
import { TokenMonitoringService } from '../../../v8u/services/tokenMonitoringService';

// Types
type TokenExchangeScenario =
	| 'delegation'
	| 'impersonation'
	| 'scope-reduction'
	| 'audience-restriction';

interface TokenExchangeParams {
	grantType: string;
	subjectTokenType: string;
	requestedTokenType: string;
	clientAuthMethod: string;
	audience: string;
	claims: string;
	authorizationDetails: string;
	includeRefreshToken: boolean;
	// Credential fields — persisted via V9CredentialStorageService
	environmentId: string;
	clientId: string;
	clientSecret: string;
}

interface ScopeOption {
	name: string;
	description: string;
	category: string;
}

interface Scenario {
	icon: string;
	title: string;
	description: string;
	useCase: string;
	grantType: string;
	subjectTokenType: string;
	requestedTokenType: string;
	audience: string;
	scope: string;
	color: string;
	originalToken: string;
	availableScopes: ScopeOption[];
	defaultClaims: string;
	defaultAuthDetails: string;
}

// Step metadata for wizard flow
const STEP_METADATA = [
	{
		title: 'Scenario Selection',
		subtitle: 'Choose your token exchange use case',
	},
	{
		title: 'Configuration',
		subtitle: 'Configure exchange parameters',
	},
	{
		title: 'Subject Token',
		subtitle: 'Provide the token to exchange',
	},
	{
		title: 'Token Exchange',
		subtitle: 'Execute the token exchange',
	},
	{
		title: 'Results',
		subtitle: 'View and validate exchanged token',
	},
];

const TokenExchangeFlowV9: React.FC = () => {
	// Step navigation state
	const [currentStep, setCurrentStep] = useState(0);

	// State management
	const [selectedScenario, setSelectedScenario] =
		useState<TokenExchangeScenario>('audience-restriction');
	const [subjectToken, setSubjectToken] = useState('');
	const [subjectTokenSource, setSubjectTokenSource] = useState<'manual' | 'storage'>('manual');
	const [storedTokens, setStoredTokens] = useState<
		{ id: string; type: string; value: string; scope?: string }[]
	>([]);
	const [exchangedToken, setExchangedToken] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
	const [actorToken, setActorToken] = useState('');

	const [exchangeParams, setExchangeParams] = useState<TokenExchangeParams>({
		grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
		subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
		clientAuthMethod: 'private_key_jwt',
		audience: '',
		claims: '',
		authorizationDetails: '',
		includeRefreshToken: false,
		environmentId: '',
		clientId: '',
		clientSecret: '',
	});

	// ── Credential storage ───────────────────────────────────────────────────
	// Load persisted credentials on mount (sync first, then full 4-layer load)
	useEffect(() => {
		const synced = V9CredentialStorageService.loadSync('v9:token-exchange');
		if (synced) {
			setExchangeParams((prev) => ({
				...prev,
				...(synced.clientId && { clientId: synced.clientId }),
				...(synced.clientSecret && { clientSecret: synced.clientSecret }),
				...(synced.redirectUri && { audience: synced.redirectUri }),
			}));
			if (synced.environmentId) {
				setExchangeParams((prev) => ({ ...prev, environmentId: synced.environmentId ?? '' }));
			}
		}
		V9CredentialStorageService.load('v9:token-exchange').then((creds) => {
			if (creds) {
				setExchangeParams((prev) => ({
					...prev,
					...(creds.clientId && { clientId: creds.clientId }),
					...(creds.clientSecret && { clientSecret: creds.clientSecret }),
					...(creds.environmentId && { environmentId: creds.environmentId }),
				}));
			}
		});
	}, []);

	// Save credential fields whenever they change
	const saveCredentials = useCallback((params: TokenExchangeParams) => {
		V9CredentialStorageService.save(
			'v9:token-exchange',
			{
				clientId: params.clientId,
				clientSecret: params.clientSecret,
				environmentId: params.environmentId,
			},
			{ ...(params.environmentId ? { environmentId: params.environmentId } : {}) }
		);
	}, []);

	// Load tokens from storage for subject token picker
	useEffect(() => {
		const refresh = () => {
			const service = TokenMonitoringService.getInstance();
			const tokens = service
				.getTokensByType('access_token')
				.concat(service.getTokensByType('worker_token'))
				.filter((t) => t.value && t.value.length > 20);
			setStoredTokens(
				tokens.map((t) => ({
					id: t.id,
					type: t.type,
					value: t.value,
					scope: t.scope?.join?.(' ') || '',
				}))
			);
		};
		refresh();
		const unsub = TokenMonitoringService.getInstance().subscribe(() => refresh());
		return unsub;
	}, []);

	// Auto-fill from app picker
	const handleAppSelected = useCallback(
		(app: DiscoveredApp) => {
			setExchangeParams((prev) => {
				const updated = {
					...prev,
					clientId: app.id,
					...(app.redirectUris?.[0] && { audience: app.redirectUris[0] }),
				};
				saveCredentials(updated);
				return updated;
			});
		},
		[saveCredentials]
	);

	// Scenarios configuration
	const scenarios = useMemo<Record<TokenExchangeScenario, Scenario>>(
		() => ({
			delegation: {
				icon: '👥',
				title: 'User Delegation',
				description: 'Exchange user token for service-specific token with reduced scope',
				useCase: 'User authorizes app to call downstream service on their behalf',
				grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
				subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
				requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
				audience: 'https://api.salesforce.com',
				scope: 'read:profile read:contacts',
				color: '#3b82f6',
				originalToken:
					'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgcmVhZDpjb250YWN0cyByZWFkOmNhbGVuZGFyIHdyaXRlOmRhdGEiLCJhdWQiOiJteS13ZWItYXBwIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnBpbmdvbmUuY29tIiwiZXhwIjoxNzI5NjM5NDQ3fQ...',
				availableScopes: [
					{ name: 'read:profile', description: 'Read user profile information', category: 'user' },
					{ name: 'read:contacts', description: 'Read user contacts from CRM', category: 'user' },
					{
						name: 'write:contacts',
						description: 'Create/update contacts in CRM',
						category: 'user',
					},
					{ name: 'read:calendar', description: 'Read user calendar events', category: 'user' },
					{
						name: 'read:opportunities',
						description: 'Read sales opportunities',
						category: 'business',
					},
					{
						name: 'offline_access',
						description: 'Access data when user is offline',
						category: 'system',
					},
				],
				defaultClaims: '{"id_token":{"email":{"essential":true},"name":{"essential":true}}}',
				defaultAuthDetails:
					'[{"type":"crm_access","actions":["read"],"resources":["contacts","opportunities"]}]',
			},
			impersonation: {
				icon: '🛡️',
				title: 'Service Impersonation',
				description: 'Service acts on behalf of user with limited permissions',
				useCase: 'Backend service needs to call API as if it were the user',
				grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
				subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
				requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
				audience: 'https://api.internal.company.com',
				scope: 'impersonate:user audit:read',
				color: '#f59e0b',
				originalToken:
					'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbl91c2VyIiwic2NvcGUiOiJhZG1pbjpmdWxsIGltcGVyc29uYXRlOnVzZXIgYXVkaXQ6cmVhZCBhdWRpdDp3cml0ZSIsImF1ZCI6ImFkbWluLWRhc2hib2FyZCIsImlzcyI6Imh0dHBzOi8vYXV0aC5waW5nb25lLmNvbSIsImV4cCI6MTcyOTYzOTQ0N30...',
				availableScopes: [
					{
						name: 'impersonate:user',
						description: 'Act on behalf of the user',
						category: 'delegation',
					},
					{
						name: 'audit:read',
						description: 'Read audit logs and compliance data',
						category: 'compliance',
					},
					{ name: 'admin:read', description: 'Read administrative data', category: 'admin' },
					{ name: 'system:monitor', description: 'Monitor system health', category: 'system' },
				],
				defaultClaims: '{"acr":{"essential":true},"roles":{"essential":true}}',
				defaultAuthDetails:
					'[{"type":"admin_access","actions":["read","monitor"],"resources":["system","audit"]}]',
			},
			'scope-reduction': {
				icon: '🔒',
				title: 'Scope Reduction',
				description: 'Exchange token with broad scope for token with limited scope',
				useCase: 'Minimize token privileges following principle of least privilege',
				grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
				subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
				requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
				audience: 'https://api.payment-processor.com',
				scope: 'payment:read payment:webhook',
				color: '#10b981',
				originalToken:
					'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtZXJjaGFudF9hcHAiLCJzY29wZSI6InBheW1lbnQ6Y3JlYXRlIHBheW1lbnQ6cmVhZCBwYXltZW50OndyaXRlIHBheW1lbnQ6cmVmdW5kIGN1c3RvbWVyOnJlYWQgY3VzdG9tZXI6d3JpdGUgcmVwb3J0czpyZWFkIGF1ZGl0OnJlYWQiLCJhdWQiOiJtZXJjaGFudC1kYXNoYm9hcmQiLCJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20iLCJleHAiOjE3Mjk2Mzk0NDd9...',
				availableScopes: [
					{ name: 'payment:read', description: 'Read payment transactions', category: 'payments' },
					{ name: 'payment:webhook', description: 'Manage payment webhooks', category: 'payments' },
					{ name: 'customer:read', description: 'Read customer information', category: 'user' },
					{ name: 'refund:read', description: 'Read refund information', category: 'banking' },
				],
				defaultClaims: '{"merchant_id":{"essential":true},"permissions":{"essential":true}}',
				defaultAuthDetails:
					'[{"type":"payment_access","actions":["read"],"resources":["transactions","customers"]}]',
			},
			'audience-restriction': {
				icon: '🎯',
				title: 'Audience Restriction',
				description: 'Exchange token for specific audience/service',
				useCase: 'Limit token usage to specific API or service',
				grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
				subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
				requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
				audience: 'https://api.hr-system.com',
				scope: 'employee:read employee:profile',
				color: '#7c3aed',
				originalToken:
					'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJocl9hZG1pbiIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgdXNlcjpyZWFkIHVzZXI6d3JpdGUgZW1wbG95ZWU6cmVhZCBlbXBsb3llZTpyZWFkIGVtcGxveWVlOndyaXRlIHBheXJvbGw6cmVhZCBhdWRpdDpyZWFkIiwiYXVkIjoibXktZW50ZXJwcmlzZS1hcHAiLCJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20iLCJleHAiOjE3Mjk2Mzk0NDd9...',
				availableScopes: [
					{ name: 'employee:read', description: 'Read employee data', category: 'admin' },
					{ name: 'employee:profile', description: 'Read employee profiles', category: 'user' },
					{ name: 'payroll:read', description: 'Read payroll information', category: 'business' },
					{ name: 'benefits:read', description: 'Read benefits information', category: 'business' },
				],
				defaultClaims: '{"department":{"essential":true},"role":{"essential":true}}',
				defaultAuthDetails:
					'[{"type":"hr_access","actions":["read"],"resources":["employees","profiles"]}]',
			},
		}),
		[]
	);

	// Step validation
	const validateCurrentStep = useCallback(() => {
		switch (currentStep) {
			case 0: // Scenario Selection
				return selectedScenario !== null;
			case 1: // Configuration
				return exchangeParams.audience !== '';
			case 2: // Subject Token
				return subjectToken !== '';
			case 3: // Token Exchange
				return subjectToken !== '' && exchangeParams.audience !== '';
			case 4: // Results
				return exchangedToken !== '';
			default:
				return false;
		}
	}, [currentStep, selectedScenario, exchangeParams.audience, subjectToken, exchangedToken]);

	// Restart functionality
	const restartFlow = useCallback(() => {
		// Reset all state to initial values
		setCurrentStep(0);
		setSelectedScenario('audience-restriction');
		setSubjectToken('');
		setActorToken('');
		setExchangedToken('');
		setIsLoading(false);
		setSelectedScopes([]);
		setSubjectTokenSource('manual');
		setExchangeParams((prev) => ({
			...prev,
			grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
			subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
			requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
			clientAuthMethod: 'client_secret_post',
			audience: '',
			claims: '',
			authorizationDetails: '',
			includeRefreshToken: false,
		}));

		// Show notification
		const modernMessaging = V9ModernMessagingService.getInstance();
		modernMessaging.showBanner({
			type: 'info',
			title: 'Flow Restarted',
			message: 'All progress has been reset. You can start again from step 1.',
			dismissible: true,
		});
	}, []);

	// Step navigation functions
	const goToNextStep = useCallback(() => {
		if (currentStep < STEP_METADATA.length - 1) {
			setCurrentStep((prev) => prev + 1);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}, [currentStep]);

	const goToPreviousStep = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}, [currentStep]);

	const goToStep = useCallback((step: number) => {
		if (step >= 0 && step < STEP_METADATA.length) {
			setCurrentStep(step);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}, []);

	// Real PingOne token exchange via /api/token-exchange (RFC 8693)
	const performTokenExchange = useCallback(async () => {
		const tokenToExchange = subjectToken.trim();
		if (!tokenToExchange) return;

		setIsLoading(true);
		const modernMessaging = V9ModernMessagingService.getInstance();

		try {
			modernMessaging.showWaitScreen({
				message: 'Performing OAuth 2.0 Token Exchange via PingOne...',
			});

			const scopeParam = selectedScopes.length > 0 ? selectedScopes.join(' ') : undefined;

			const response = await fetch('/api/token-exchange', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
					client_id: exchangeParams.clientId,
					client_secret: exchangeParams.clientSecret || undefined,
					subject_token: tokenToExchange,
					subject_token_type: exchangeParams.subjectTokenType,
					requested_token_type: exchangeParams.requestedTokenType,
					audience: exchangeParams.audience || undefined,
					scope: scopeParam,
					environment_id: exchangeParams.environmentId,
					client_auth_method: 'client_secret_post',
					// RFC 8693 delegation: include actor_token when present
					...(actorToken.trim() ? { actor_token: actorToken.trim() } : {}),
				}),
			});

			const data = await response.json().catch(() => ({}));

			if (!response.ok) {
				throw new Error(
					data.error_description || data.error || `Token exchange failed (${response.status})`
				);
			}

			setExchangedToken(JSON.stringify(data, null, 2));

			modernMessaging.showBanner({
				type: 'success',
				title: 'Token Exchange Successful',
				message: 'PingOne returned exchanged token. View results below.',
				dismissible: true,
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Token exchange failed';
			modernMessaging.showBanner({
				type: 'error',
				title: 'Token Exchange Failed',
				message: msg,
				dismissible: true,
			});
		} finally {
			setIsLoading(false);
			modernMessaging.hideWaitScreen();
		}
	}, [
		subjectToken,
		actorToken,
		exchangeParams.clientId,
		exchangeParams.clientSecret,
		exchangeParams.subjectTokenType,
		exchangeParams.requestedTokenType,
		exchangeParams.audience,
		exchangeParams.environmentId,
		selectedScopes,
	]);

	// Handle scenario selection
	const handleScenarioSelect = useCallback(
		(scenario: TokenExchangeScenario) => {
			setSelectedScenario(scenario);
			const scenarioConfig = scenarios[scenario];
			setExchangeParams((prev) => ({
				...prev,
				audience: scenarioConfig.audience,
				claims: scenarioConfig.defaultClaims,
				authorizationDetails: scenarioConfig.defaultAuthDetails,
			}));
			setSubjectToken(scenarioConfig.originalToken);
			setSelectedScopes(scenarioConfig.scope.split(' '));
		},
		[scenarios]
	);

	// Render step content
	const renderStepContent = () => {
		switch (currentStep) {
			case 0: // Scenario Selection
				return (
					<div>
						<h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>
							Select Token Exchange Scenario
						</h3>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
								gap: '1rem',
								marginBottom: '2rem',
							}}
						>
							{Object.entries(scenarios).map(([key, scenario]) => (
								<button
									key={key}
									onClick={() => handleScenarioSelect(key as TokenExchangeScenario)}
									type="button"
									style={{
										padding: '1.5rem',
										border: `2px solid ${selectedScenario === key ? scenario.color : '#e5e7eb'}`,
										borderRadius: '0.75rem',
										background: selectedScenario === key ? '#f8fafc' : '#ffffff',
										cursor: 'pointer',
										transition: 'all 0.2s ease',
										textAlign: 'left',
									}}
									onMouseEnter={(e) => {
										if (selectedScenario !== key) {
											e.currentTarget.style.borderColor = scenario.color;
											e.currentTarget.style.transform = 'translateY(-2px)';
											e.currentTarget.style.boxShadow = `0 4px 12px ${scenario.color}20`;
										}
									}}
									onMouseLeave={(e) => {
										if (selectedScenario !== key) {
											e.currentTarget.style.borderColor = '#e5e7eb';
											e.currentTarget.style.transform = 'translateY(0)';
											e.currentTarget.style.boxShadow = 'none';
										}
									}}
								>
									<div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{scenario.icon}</div>
									<h4
										style={{
											margin: '0 0 0.5rem 0',
											color: '#1f2937',
											fontSize: '1.125rem',
											fontWeight: 600,
										}}
									>
										{scenario.title}
									</h4>
									<p
										style={{
											margin: '0 0 1rem 0',
											color: '#6b7280',
											fontSize: '0.875rem',
											lineHeight: '1.5',
										}}
									>
										{scenario.description}
									</p>
									<div
										style={{
											padding: '0.75rem',
											backgroundColor: '#f8fafc',
											borderRadius: '0.5rem',
											fontSize: '0.75rem',
										}}
									>
										<strong>Use Case:</strong> {scenario.useCase}
									</div>
								</button>
							))}
						</div>
					</div>
				);

			case 1: // Configuration
				return (
					<div>
						<h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>
							Configure Exchange Parameters
						</h3>
						{/* ── Connection Settings (persisted via V9CredentialStorageService) ── */}
						<div
							style={{
								marginBottom: '1.5rem',
								padding: '1.25rem',
								border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
								borderRadius: '0.75rem',
								background: '#f8fafc',
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									marginBottom: '1rem',
								}}
							>
								<h4 style={{ margin: 0, color: '#1f2937', fontSize: '0.9375rem' }}>
									🔒 Connection Settings
								</h4>
								<CompactAppPickerV8U
									environmentId={exchangeParams.environmentId}
									onAppSelected={handleAppSelected}
								/>
							</div>
							<div style={{ display: 'grid', gap: '0.75rem' }}>
								<div>
									<label
										htmlFor="env-id-input"
										style={{
											display: 'block',
											marginBottom: '0.375rem',
											fontWeight: 600,
											color: '#1f2937',
											fontSize: '0.875rem',
										}}
									>
										Environment ID
									</label>
									<input
										id="env-id-input"
										type="text"
										value={exchangeParams.environmentId}
										onChange={(e) => {
											const updated = { ...exchangeParams, environmentId: e.target.value };
											setExchangeParams(updated);
											saveCredentials(updated);
										}}
										placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
										style={{
											width: '100%',
											padding: '0.625rem',
											border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
											borderRadius: '0.375rem',
											fontSize: '0.875rem',
											background: '#ffffff',
										}}
									/>
								</div>
								<div>
									<label
										htmlFor="client-id-input"
										style={{
											display: 'block',
											marginBottom: '0.375rem',
											fontWeight: 600,
											color: '#1f2937',
											fontSize: '0.875rem',
										}}
									>
										Client ID
									</label>
									<input
										id="client-id-input"
										type="text"
										value={exchangeParams.clientId}
										onChange={(e) => {
											const updated = { ...exchangeParams, clientId: e.target.value };
											setExchangeParams(updated);
											saveCredentials(updated);
										}}
										placeholder="Enter client ID (auto-filled by app picker)"
										style={{
											width: '100%',
											padding: '0.625rem',
											border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
											borderRadius: '0.375rem',
											fontSize: '0.875rem',
											background: '#ffffff',
										}}
									/>
								</div>
								<div>
									<label
										htmlFor="client-secret-input"
										style={{
											display: 'block',
											marginBottom: '0.375rem',
											fontWeight: 600,
											color: '#1f2937',
											fontSize: '0.875rem',
										}}
									>
										Client Secret
									</label>
									<input
										id="client-secret-input"
										type="password"
										value={exchangeParams.clientSecret}
										onChange={(e) => {
											const updated = { ...exchangeParams, clientSecret: e.target.value };
											setExchangeParams(updated);
											saveCredentials(updated);
										}}
										placeholder="Enter client secret"
										style={{
											width: '100%',
											padding: '0.625rem',
											border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
											borderRadius: '0.375rem',
											fontSize: '0.875rem',
											background: '#ffffff',
										}}
									/>
								</div>
							</div>
						</div>
						{/* ── Exchange Parameters ── */}
						<div style={{ display: 'grid', gap: '1rem' }}>
							<div>
								<label
									htmlFor="audience-input"
									style={{
										display: 'block',
										marginBottom: '0.5rem',
										fontWeight: 600,
										color: '#1f2937',
									}}
								>
									Audience
								</label>
								<input
									id="audience-input"
									type="text"
									value={exchangeParams.audience}
									onChange={(e) =>
										setExchangeParams((prev) => ({ ...prev, audience: e.target.value }))
									}
									placeholder="https://api.example.com"
									style={{
										width: '100%',
										padding: '0.75rem',
										border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
										borderRadius: '0.375rem',
										fontSize: '0.875rem',
									}}
								/>
							</div>
							<div>
								<label
									htmlFor="subject-token-type-select"
									style={{
										display: 'block',
										marginBottom: '0.5rem',
										fontWeight: 600,
										color: '#1f2937',
									}}
								>
									Subject Token Type
								</label>
								<select
									id="subject-token-type-select"
									value={exchangeParams.subjectTokenType}
									onChange={(e) =>
										setExchangeParams((prev) => ({ ...prev, subjectTokenType: e.target.value }))
									}
									style={{
										width: '100%',
										padding: '0.75rem',
										border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
										borderRadius: '0.375rem',
										fontSize: '0.875rem',
									}}
								>
									<option value="urn:ietf:params:oauth:token-type:access_token">
										Access Token
									</option>
									<option value="urn:ietf:params:oauth:token-type:jwt">JWT</option>
									<option value="urn:ietf:params:oauth:token-type:saml2">SAML 2.0</option>
								</select>
							</div>
							<div>
								<label
									htmlFor="requested-token-type-select"
									style={{
										display: 'block',
										marginBottom: '0.5rem',
										fontWeight: 600,
										color: '#1f2937',
									}}
								>
									Requested Token Type
								</label>
								<select
									id="requested-token-type-select"
									value={exchangeParams.requestedTokenType}
									onChange={(e) =>
										setExchangeParams((prev) => ({ ...prev, requestedTokenType: e.target.value }))
									}
									style={{
										width: '100%',
										padding: '0.75rem',
										border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
										borderRadius: '0.375rem',
										fontSize: '0.875rem',
									}}
								>
									<option value="urn:ietf:params:oauth:token-type:access_token">
										Access Token
									</option>
									<option value="urn:ietf:params:oauth:token-type:jwt">JWT</option>
								</select>
							</div>
						</div>
					</div>
				);

			case 2: // Subject Token
				return (
					<div>
						<h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Subject Token</h3>
						<p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
							Provide the token to exchange—either enter/paste one or pick from tokens in storage.
						</p>
						<div
							style={{
								display: 'flex',
								gap: '1rem',
								marginBottom: '1rem',
							}}
						>
							<label
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									cursor: 'pointer',
									fontSize: '0.875rem',
									fontWeight: 500,
								}}
							>
								<input
									type="radio"
									name="subjectTokenSource"
									checked={subjectTokenSource === 'manual'}
									onChange={() => {
										setSubjectTokenSource('manual');
										setSubjectToken('');
									}}
								/>
								Enter or paste token
							</label>
							<label
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									cursor: 'pointer',
									fontSize: '0.875rem',
									fontWeight: 500,
								}}
							>
								<input
									type="radio"
									name="subjectTokenSource"
									checked={subjectTokenSource === 'storage'}
									onChange={() => setSubjectTokenSource('storage')}
								/>
								Select from storage
							</label>
						</div>
						{subjectTokenSource === 'storage' ? (
							<div>
								<label
									htmlFor="stored-token-select"
									style={{
										display: 'block',
										marginBottom: '0.5rem',
										fontWeight: 600,
										color: '#1f2937',
									}}
								>
									Stored tokens
								</label>
								<select
									id="stored-token-select"
									value={storedTokens.find((t) => t.value === subjectToken)?.id || ''}
									onChange={(e) => {
										const id = e.target.value;
										const tok = storedTokens.find((t) => t.id === id);
										if (tok) setSubjectToken(tok.value);
									}}
									style={{
										width: '100%',
										padding: '0.75rem',
										border: '1px solid #d1d5db',
										borderRadius: '0.375rem',
										fontSize: '0.875rem',
										background: '#ffffff',
									}}
								>
									<option value="">— Select a token —</option>
									{storedTokens.map((t) => (
										<option key={t.id} value={t.id}>
											{t.type}
											{t.scope ? ` (${t.scope.split(' ').slice(0, 2).join(' ')})` : ''} —
											{t.value.substring(0, 24)}...
										</option>
									))}
								</select>
								{storedTokens.length === 0 && (
									<p
										style={{
											margin: '0.75rem 0 0',
											color: '#6b7280',
											fontSize: '0.875rem',
										}}
									>
										No tokens in storage. Generate one by getting a worker token or running an OAuth
										flow (e.g. Authorization Code), then return here.
									</p>
								)}
							</div>
						) : (
							<div>
								<label
									htmlFor="subject-token-textarea"
									style={{
										display: 'block',
										marginBottom: '0.5rem',
										fontWeight: 600,
										color: '#1f2937',
									}}
								>
									Token to exchange
								</label>
								<textarea
									id="subject-token-textarea"
									value={subjectToken}
									onChange={(e) => setSubjectToken(e.target.value)}
									placeholder="Paste access token or JWT here..."
									rows={6}
									style={{
										width: '100%',
										padding: '0.75rem',
										border: '1px solid #d1d5db',
										borderRadius: '0.375rem',
										fontSize: '0.875rem',
										fontFamily: 'monospace',
										resize: 'vertical',
									}}
								/>
							</div>
						)}
						<div
							style={{
								marginTop: '1rem',
								padding: '1rem',
								backgroundColor: '#f8fafc',
								borderRadius: '0.5rem',
								fontSize: '0.875rem',
								color: '#6b7280',
							}}
						>
							<strong>Current scenario:</strong> {scenarios[selectedScenario].title}
						</div>
						{/* Actor token — required for delegation scenarios (RFC 8693 §2.1)  */}
						{selectedScenario === 'delegation' && (
							<div
								style={{
									marginTop: '1.25rem',
									padding: '1rem',
									border: '1px solid #3b82f6',
									borderRadius: '0.5rem',
									background: '#eff6ff',
								}}
							>
								<label
									htmlFor="actor-token-textarea"
									style={{
										display: 'block',
										marginBottom: '0.375rem',
										fontWeight: 600,
										color: '#1e40af',
										fontSize: '0.875rem',
									}}
								>
									Actor Token (optional — required for delegation)
								</label>
								<p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8125rem', color: '#3b82f6' }}>
									The subject token must contain a{' '}
									<code style={{ fontFamily: 'monospace', background: '#dbeafe', padding: '0 2px' }}>
										may_act
									</code>{' '}
									claim that matches this actor&apos;s identity. All present fields (
									<code style={{ fontFamily: 'monospace' }}>client_id</code>,{' '}
									<code style={{ fontFamily: 'monospace' }}>sub</code>,{' '}
									<code style={{ fontFamily: 'monospace' }}>iss</code>) must match (AND semantics).
								</p>
								<textarea
									id="actor-token-textarea"
									value={actorToken}
									onChange={(e) => setActorToken(e.target.value)}
									placeholder="Paste actor JWT / access token here..."
									rows={4}
									style={{
										width: '100%',
										padding: '0.75rem',
										border: '1px solid #93c5fd',
										borderRadius: '0.375rem',
										fontSize: '0.875rem',
										fontFamily: 'monospace',
										resize: 'vertical',
										background: '#ffffff',
									}}
								/>
							</div>
						)}
					</div>
				);

			case 3: // Token Exchange
				return (
					<div>
						<h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Execute Token Exchange</h3>
						<div style={{ marginBottom: '2rem' }}>
							<h4 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Exchange Request Summary</h4>
							<div
								style={{
									backgroundColor: '#f8fafc',
									padding: '1rem',
									borderRadius: '0.5rem',
									fontSize: '0.875rem',
								}}
							>
								<div>
									<strong>Grant Type:</strong> {exchangeParams.grantType}
								</div>
								<div>
									<strong>Subject Token Type:</strong> {exchangeParams.subjectTokenType}
								</div>
								<div>
									<strong>Requested Token Type:</strong> {exchangeParams.requestedTokenType}
								</div>
								<div>
									<strong>Audience:</strong> {exchangeParams.audience}
								</div>
								<div>
									<strong>Selected Scopes:</strong> {selectedScopes.join(', ') || 'None'}
								</div>
							</div>
						</div>
						<button
							onClick={performTokenExchange}
							disabled={isLoading || !validateCurrentStep()}
							type="button"
							style={{
								padding: '0.75rem 1.5rem',
								...getButtonStyles('primary', isLoading || !validateCurrentStep()),
								fontWeight: 600,
							}}
						>
							{isLoading ? 'Exchanging...' : 'Exchange Token'}
						</button>
					</div>
				);

			case 4: // Results
				return (
					<div>
						<h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Token Exchange Results</h3>
						{exchangedToken ? (
							<div>
								<div style={{ marginBottom: '2rem' }}>
									<h4 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Exchanged Token</h4>
									<div
										style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem' }}
									>
										<pre
											style={{
												margin: 0,
												fontSize: '0.75rem',
												overflowX: 'auto',
												whiteSpace: 'pre-wrap',
											}}
										>
											{exchangedToken}
										</pre>
									</div>
								</div>
								<div style={{ display: 'flex', gap: '1rem' }}>
									<button
										onClick={() => navigator.clipboard.writeText(exchangedToken)}
										type="button"
										style={{
											padding: '0.5rem 1rem',
											...getButtonStyles('secondary'),
											fontSize: '0.875rem',
										}}
									>
										Copy Token
									</button>
									<button
										onClick={() => window.open('https://jwt.io', '_blank')}
										type="button"
										style={{
											padding: '0.5rem 1rem',
											...getButtonStyles('secondary'),
											fontSize: '0.875rem',
										}}
									>
										Decode in JWT.io
									</button>
								</div>
							</div>
						) : (
							<div
								style={{
									padding: '2rem',
									textAlign: 'center',
									backgroundColor: '#f8fafc',
									borderRadius: '0.5rem',
								}}
							>
								<p style={{ margin: 0, color: '#6b7280' }}>
									No token exchanged yet. Complete the previous steps to exchange your token.
								</p>
							</div>
						)}
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div>
			<V9FlowHeader
				flowId="token-exchange"
				customConfig={{
					title: 'OAuth 2.0 Token Exchange Flow',
					subtitle: 'RFC 8693 Token Exchange Implementation',
				}}
			/>

			<div style={{ maxWidth: '90rem', margin: '0 auto', padding: '2rem' }}>
				{/* Restart Button */}
				<div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
					<V9FlowRestartButton
						onRestart={restartFlow}
						currentStep={currentStep}
						totalSteps={STEP_METADATA.length}
						position="header"
					/>
				</div>

				{/* Step Progress Indicator */}
				<div style={{ marginBottom: '2rem' }}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '1rem',
						}}
					>
						{STEP_METADATA.map((_step, index) => (
							<div key={index} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
								<div
									style={{
										width: '32px',
										height: '32px',
										borderRadius: '50%',
										background: index <= currentStep ? '#10b981' : '#e5e7eb',
										color: index <= currentStep ? 'white' : '#6b7280',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '0.875rem',
										fontWeight: 600,
									}}
								>
									{index + 1}
								</div>
								{index < STEP_METADATA.length - 1 && (
									<div
										style={{
											flex: 1,
											height: '2px',
											background: index < currentStep ? '#10b981' : '#e5e7eb',
											margin: '0 1rem',
										}}
									/>
								)}
							</div>
						))}
					</div>
					<div>
						<h3 style={{ margin: 0, color: '#1f2937' }}>{STEP_METADATA[currentStep].title}</h3>
						<p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
							{STEP_METADATA[currentStep].subtitle}
						</p>
					</div>
				</div>

				{/* Step Content */}
				<div style={{ marginTop: '2rem' }}>{renderStepContent()}</div>

				{/* Navigation Buttons */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginTop: '2rem',
						paddingTop: '2rem',
						borderTop: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
					}}
				>
					<button
						onClick={goToPreviousStep}
						disabled={currentStep === 0}
						type="button"
						style={{
							padding: '0.75rem 1.5rem',
							background: currentStep === 0 ? '#e5e7eb' : '#6b7280',
							color: 'white',
							border: 'none',
							borderRadius: '0.375rem',
							cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
							fontWeight: 600,
						}}
					>
						← Previous
					</button>
					<div style={{ display: 'flex', gap: '0.5rem' }}>
						{STEP_METADATA.map((_step, index) => (
							<button
								key={index}
								onClick={() => goToStep(index)}
								type="button"
								style={{
									padding: '0.5rem 1rem',
									background: index === currentStep ? '#10b981' : '#e5e7eb',
									color: index === currentStep ? 'white' : '#6b7280',
									border: 'none',
									borderRadius: '0.375rem',
									cursor: 'pointer',
									fontSize: '0.75rem',
									fontWeight: 500,
								}}
							>
								{index + 1}
							</button>
						))}
					</div>
					<button
						onClick={goToNextStep}
						disabled={currentStep === STEP_METADATA.length - 1 || !validateCurrentStep()}
						type="button"
						style={{
							padding: '0.75rem 1.5rem',
							background:
								currentStep === STEP_METADATA.length - 1 || !validateCurrentStep()
									? '#e5e7eb'
									: '#10b981',
							color: 'white',
							border: 'none',
							borderRadius: '0.375rem',
							cursor:
								currentStep === STEP_METADATA.length - 1 || !validateCurrentStep()
									? 'not-allowed'
									: 'pointer',
							fontWeight: 600,
						}}
					>
						{currentStep === STEP_METADATA.length - 1 ? 'Complete' : 'Next →'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default TokenExchangeFlowV9;
