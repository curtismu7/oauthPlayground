// src/pages/flows/TokenExchangeFlowV9.tsx
// V9 OAuth 2.0 Token Exchange Flow - RFC 8693 Implementation for A2A Security
// PingOne UI Design System Implementation

import React, { useCallback, useMemo, useState } from 'react';

// PingOne UI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	style?: React.CSSProperties;
	ariaLabel?: string;
}> = ({ icon, size = 24, className = '', style, ariaLabel }) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: size, ...style }}
			title={ariaLabel}
		/>
	);
};

type TokenExchangeScenario =
	| 'delegation'
	| 'impersonation'
	| 'scope-reduction'
	| 'audience-restriction';

const MODULE_TAG = '[TokenExchangeFlowV9]';

// PingOne UI Styled Components
const getContainerStyle = () => ({
	maxWidth: '1200px',
	margin: '0 auto',
	padding: '2rem',
});

const getMainCardStyle = () => ({
	background: 'var(--pingone-surface-card)',
	borderRadius: '0.75rem',
	boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
	border: '1px solid var(--pingone-border-primary)',
	overflow: 'hidden',
});

const getHeaderStyle = () => ({
	background: 'var(--pingone-surface-header)',
	padding: '2rem',
	borderBottom: '1px solid var(--pingone-border-primary)',
});

const getTitleStyle = () => ({
	fontSize: '1.875rem',
	fontWeight: '600',
	color: 'var(--pingone-text-primary)',
	marginBottom: '0.5rem',
});

const getSubtitleStyle = () => ({
	color: 'var(--pingone-text-secondary)',
	fontSize: '1.125rem',
});

const getSectionStyle = () => ({
	padding: '2rem',
	borderBottom: '1px solid var(--pingone-border-secondary)',
});

const getSectionTitleStyle = () => ({
	fontSize: '1.25rem',
	fontWeight: '600',
	color: 'var(--pingone-text-primary)',
	marginBottom: '1rem',
	display: 'flex',
	alignItems: 'center',
	gap: '0.5rem',
});

const getScenarioGridStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
	gap: '1.5rem',
	marginBottom: '2rem',
});

const getScenarioCardStyle = (isSelected: boolean) => ({
	background: isSelected ? 'var(--pingone-brand-primary-light)' : 'var(--pingone-surface-card)',
	border: `2px solid ${isSelected ? 'var(--pingone-brand-primary)' : 'var(--pingone-border-primary)'}`,
	borderRadius: '0.5rem',
	padding: '1.5rem',
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	textAlign: 'left' as const,
	'&:hover': {
		borderColor: 'var(--pingone-brand-primary)',
		transform: 'translateY(-2px)',
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
	},
});

const getScenarioTitleStyle = () => ({
	fontSize: '1.125rem',
	fontWeight: '600',
	color: 'var(--pingone-text-primary)',
	marginBottom: '0.5rem',
	display: 'flex',
	alignItems: 'center',
	gap: '0.5rem',
});

const getScenarioDescriptionStyle = () => ({
	color: 'var(--pingone-text-secondary)',
	marginBottom: '1rem',
	lineHeight: '1.5',
});

const getUseCaseStyle = () => ({
	background: 'var(--pingone-surface-secondary)',
	padding: '0.75rem',
	borderRadius: '0.375rem',
	fontSize: '0.875rem',
	color: 'var(--pingone-text-primary)',
	marginBottom: '1rem',
});

const getButtonStyle = (variant: 'primary' | 'secondary' = 'primary') => ({
	background:
		variant === 'primary' ? 'var(--pingone-brand-primary)' : 'var(--pingone-surface-secondary)',
	color: variant === 'primary' ? 'var(--pingone-text-inverse)' : 'var(--pingone-text-primary)',
	border: variant === 'secondary' ? '1px solid var(--pingone-border-primary)' : 'none',
	padding: '0.75rem 1.5rem',
	borderRadius: '0.375rem',
	fontWeight: '500',
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	display: 'inline-flex',
	alignItems: 'center',
	gap: '0.5rem',
	'&:hover': {
		background:
			variant === 'primary'
				? 'var(--pingone-brand-primary-dark)'
				: 'var(--pingone-surface-tertiary)',
	},
	'&:disabled': {
		opacity: '0.5',
		cursor: 'not-allowed',
	},
});

const getTokenDisplayStyle = () => ({
	background: 'var(--pingone-surface-secondary)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: '0.5rem',
	padding: '1.5rem',
	marginBottom: '1.5rem',
});

const getTokenTitleStyle = () => ({
	fontSize: '1rem',
	fontWeight: '600',
	color: 'var(--pingone-text-primary)',
	marginBottom: '0.5rem',
});

const getTokenValueStyle = () => ({
	fontFamily: 'monospace',
	fontSize: '0.875rem',
	background: 'var(--pingone-surface-card)',
	padding: '0.75rem',
	borderRadius: '0.25rem',
	border: '1px solid var(--pingone-border-primary)',
	wordBreak: 'break-word' as const,
	color: 'var(--pingone-text-primary)',
});

const getLoadingStyle = () => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: '2rem',
	color: 'var(--pingone-text-secondary)',
});

const getErrorStyle = () => ({
	background: 'var(--pingone-surface-error)',
	border: '1px solid var(--pingone-border-error)',
	borderRadius: '0.5rem',
	padding: '1rem',
	marginBottom: '1rem',
	color: 'var(--pingone-text-error)',
});

const TokenExchangeFlowV9: React.FC = () => {
	const [selectedScenario, setSelectedScenario] = useState<TokenExchangeScenario>('delegation');
	const [isLoading, setIsLoading] = useState(false);
	const [exchangedToken, setExchangedToken] = useState<string>('');
	const [error, setError] = useState<string>('');

	const scenarios = useMemo(
		() => ({
			delegation: {
				icon: 'account-group',
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
			},
			impersonation: {
				icon: 'shield-account',
				title: 'Admin Impersonation',
				description: 'Admin exchanges token to impersonate user for support purposes',
				useCase: 'Support team needs to access user account for troubleshooting',
				grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
				subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
				requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
				audience: 'https://admin-dashboard.example.com',
				scope: 'impersonate:user audit:read admin:limited reports:generate',
				color: '#dc2626',
				originalToken:
					'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbl91c2VyIiwic2NvcGUiOiJhZG1pbjpmdWxsIGltcGVyc29uYXRlOnVzZXIgYXVkaXQ6cmVhZCBhdWRpdDp3cml0ZSIsImF1ZCI6ImFkbWluLWRhc2hib2FyZCIsImlzcyI6Imh0dHBzOi8vYXV0aC5waW5nb25lLmNvbSIsImV4cCI6MTcyOTYzOTQ0N30...',
			},
			'scope-reduction': {
				icon: 'shield-lock',
				title: 'Scope Reduction',
				description: 'Reduce token scope for principle of least privilege',
				useCase: 'Limit permissions when calling specific microservices',
				grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
				subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
				requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
				audience: 'https://api.reporting.service.com',
				scope: 'read:reports',
				color: '#22c55e',
				originalToken:
					'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwb3dlcl91c2VyIiwic2NvcGUiOiJyZWFkOnJlcG9ydHMgd3JpdGU6cmVwb3J0cyBkZWxldGU6ZGF0YSBhZG1pbjphY2Nlc3MgcmVhZDpwcml2YXRlIHdyaXRlOnByaXZhdGUiLCJhdWQiOiJmdWxsLWFjY2Vzcy1hcHAiLCJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20iLCJleHAiOjE3Mjk2Mzk0NDd9...',
			},
			'audience-restriction': {
				icon: 'server',
				title: 'CBA MCP/A2A Scenario',
				description: 'Machine-to-machine communication with audience restriction',
				useCase: 'Banking app needs to access CBA MCP services with specific audience',
				grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
				subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
				requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
				audience: 'https://mcp.cba.com.au',
				scope: 'mcp:read banking:transactions',
				color: '#7c3aed',
				originalToken:
					'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYW5raW5nX2FwcCIsInNjb3BlIjoibWNwOnJlYWQgbWNwOndyaXRlIGEyYTpjb21tdW5pY2F0ZSBiYW5raW5nOmZ1bGwgcGF5bWVudHM6d3JpdGUgYWNjb3VudHM6d3JpdGUgdHJhbnNhY3Rpb25zOnJlYWQiLCJhdWQiOiJiYW5raW5nLXBsYXRmb3JtIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnBpbmdvbmUuY29tIiwiZXhwIjoxNzI5NjM5NDQ3fQ...',
			},
		}),
		[]
	);

	const handleTokenExchange = useCallback(async () => {
		setIsLoading(true);
		setError('');
		setExchangedToken('');

		try {
			// Simulate token exchange API call
			const scenario = scenarios[selectedScenario];
			console.log(MODULE_TAG, 'Initiating token exchange:', {
				scenario: selectedScenario,
				grantType: scenario.grantType,
				audience: scenario.audience,
				scope: scenario.scope,
			});

			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Mock successful token exchange response
			const mockResponse = {
				access_token: `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
					JSON.stringify({
						scenario: selectedScenario,
						audience: scenario.audience,
						scope: scenario.scope,
						exchanged_at: new Date().toISOString(),
					})
				)}.mock_signature`,
				token_type: 'Bearer',
				expires_in: 3600,
				scope: scenario.scope,
			};

			setExchangedToken(mockResponse.access_token);
			console.log(MODULE_TAG, 'Token exchange successful');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			setError(`Token exchange failed: ${errorMessage}`);
			console.error(MODULE_TAG, 'Token exchange error:', err);
		} finally {
			setIsLoading(false);
		}
	}, [selectedScenario, scenarios]);

	const copyToClipboard = useCallback(async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			console.log(MODULE_TAG, 'Token copied to clipboard');
		} catch (err) {
			console.error(MODULE_TAG, 'Failed to copy to clipboard:', err);
		}
	}, []);

	return (
		<div className="end-user-nano">
			<div style={getContainerStyle()}>
				<div style={getMainCardStyle()}>
					{/* Header */}
					<div style={getHeaderStyle()}>
						<h1 style={getTitleStyle()}>
							<MDIIcon icon="swap-horizontal" size={28} title="Token Exchange" />
							Token Exchange Flow
						</h1>
						<p style={getSubtitleStyle()}>
							RFC 8693 Implementation for A2A Security - Exchange tokens for different audiences and
							scopes
						</p>
					</div>

					{/* Scenario Selection */}
					<div style={getSectionStyle()}>
						<h2 style={getSectionTitleStyle()}>
							<MDIIcon icon="target" size={20} title="Scenario" />
							Select Exchange Scenario
						</h2>
						<div style={getScenarioGridStyle()}>
							{Object.entries(scenarios).map(([key, scenario]) => (
								<div
									key={key}
									style={getScenarioCardStyle(selectedScenario === key)}
									onClick={() => setSelectedScenario(key as TokenExchangeScenario)}
									role="button"
									tabIndex={0}
									aria-pressed={selectedScenario === key}
								>
									<div style={getScenarioTitleStyle()}>
										<MDIIcon icon={scenario.icon} size={20} title={scenario.title} />
										{scenario.title}
									</div>
									<div style={getScenarioDescriptionStyle()}>{scenario.description}</div>
									<div style={getUseCaseStyle()}>
										<strong>Use Case:</strong> {scenario.useCase}
									</div>
									<div style={{ fontSize: '0.875rem', color: 'var(--pingone-text-secondary)' }}>
										<div>
											<strong>Grant Type:</strong> {scenario.grantType}
										</div>
										<div>
											<strong>Audience:</strong> {scenario.audience}
										</div>
										<div>
											<strong>Scope:</strong> {scenario.scope}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Token Exchange Action */}
					<div style={getSectionStyle()}>
						<h2 style={getSectionTitleStyle()}>
							<MDIIcon icon="key" size={20} title="Token Exchange" />
							Execute Token Exchange
						</h2>

						{error && (
							<div style={getErrorStyle()}>
								<MDIIcon icon="alert-circle" size={20} title="Error" />
								{error}
							</div>
						)}

						{isLoading ? (
							<div style={getLoadingStyle()}>
								<MDIIcon icon="loading" size={24} title="Loading" />
								Processing token exchange...
							</div>
						) : (
							<button
								style={getButtonStyle('primary')}
								onClick={handleTokenExchange}
								disabled={isLoading}
							>
								<MDIIcon icon="swap-horizontal" size={20} title="Exchange Token" />
								Exchange Token
							</button>
						)}
					</div>

					{/* Results */}
					{exchangedToken && (
						<div style={getSectionStyle()}>
							<h2 style={getSectionTitleStyle()}>
								<MDIIcon icon="check-circle" size={20} title="Success" />
								Exchange Successful
							</h2>
							<div style={getTokenDisplayStyle()}>
								<div style={getTokenTitleStyle()}>Exchanged Access Token</div>
								<div style={getTokenValueStyle()}>{exchangedToken}</div>
								<button
									style={{ ...getButtonStyle('secondary'), marginTop: '1rem' }}
									onClick={() => copyToClipboard(exchangedToken)}
								>
									<MDIIcon icon="content-copy" size={16} title="Copy" />
									Copy Token
								</button>
							</div>
						</div>
					)}

					{/* Original Token Display */}
					<div style={getSectionStyle()}>
						<h2 style={getSectionTitleStyle()}>
							<MDIIcon icon="information" size={20} title="Information" />
							Original Subject Token
						</h2>
						<div style={getTokenDisplayStyle()}>
							<div style={getTokenTitleStyle()}>Subject Token (Original)</div>
							<div style={getTokenValueStyle()}>{scenarios[selectedScenario].originalToken}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TokenExchangeFlowV9;
