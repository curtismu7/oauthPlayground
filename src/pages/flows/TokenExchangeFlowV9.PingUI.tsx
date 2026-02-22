// src/pages/flows/TokenExchangeFlowV9.PingUI.tsx
// V9 OAuth 2.0 Token Exchange Flow - RFC 8693 Implementation for A2A Security
// PingOne UI Design System Implementation with View Mode Controls

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

type ViewMode = 'full' | 'compact' | 'hidden';

const MODULE_TAG = '[TokenExchangeFlowV9]';

// PingOne UI Styled Components
const getContainerStyle = (viewMode: ViewMode) => ({
	maxWidth: '1200px',
	margin: '0 auto',
	padding: viewMode === 'full' ? '2rem' : viewMode === 'compact' ? '1rem' : '0.5rem',
});

const getMainCardStyle = () => ({
	background: 'var(--pingone-surface-card)',
	borderRadius: '0.75rem',
	boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
	border: '1px solid var(--pingone-border-primary)',
	overflow: 'hidden',
});

const getHeaderStyle = (viewMode: ViewMode) => ({
	background: 'var(--pingone-surface-header)',
	padding: viewMode === 'full' ? '2rem' : viewMode === 'compact' ? '1rem' : '0.5rem',
	borderBottom: '1px solid var(--pingone-border-primary)',
});

const getTitleStyle = (viewMode: ViewMode) => ({
	fontSize: viewMode === 'full' ? '1.875rem' : viewMode === 'compact' ? '1.5rem' : '1.25rem',
	fontWeight: '600',
	color: 'var(--pingone-text-primary)',
	marginBottom: '0.5rem',
});

const getSubtitleStyle = (viewMode: ViewMode) => ({
	color: 'var(--pingone-text-secondary)',
	fontSize: viewMode === 'full' ? '1.125rem' : viewMode === 'compact' ? '1rem' : '0.875rem',
});

const getSectionStyle = (viewMode: ViewMode) => ({
	padding: viewMode === 'full' ? '2rem' : viewMode === 'compact' ? '1rem' : '0.5rem',
	borderBottom: '1px solid var(--pingone-border-secondary)',
});

const getSectionTitleStyle = (viewMode: ViewMode) => ({
	fontSize: viewMode === 'full' ? '1.25rem' : viewMode === 'compact' ? '1.125rem' : '1rem',
	fontWeight: '600',
	color: 'var(--pingone-text-primary)',
	marginBottom: viewMode === 'full' ? '1rem' : viewMode === 'compact' ? '0.75rem' : '0.5rem',
	display: 'flex',
	alignItems: 'center',
	gap: '0.5rem',
});

const getScenarioGridStyle = (viewMode: ViewMode) => ({
	display: 'grid',
	gridTemplateColumns:
		viewMode === 'full'
			? 'repeat(auto-fit, minmax(300px, 1fr))'
			: viewMode === 'compact'
				? 'repeat(auto-fit, minmax(250px, 1fr))'
				: 'repeat(auto-fit, minmax(200px, 1fr))',
	gap: viewMode === 'full' ? '1.5rem' : viewMode === 'compact' ? '1rem' : '0.5rem',
	marginBottom: viewMode === 'full' ? '2rem' : viewMode === 'compact' ? '1rem' : '0.5rem',
});

const getScenarioCardStyle = (isSelected: boolean, viewMode: ViewMode) => ({
	background: isSelected ? 'var(--pingone-brand-primary-light)' : 'var(--pingone-surface-card)',
	border: `2px solid ${isSelected ? 'var(--pingone-brand-primary)' : 'var(--pingone-border-primary)'}`,
	borderRadius: '0.5rem',
	padding: viewMode === 'full' ? '1.5rem' : viewMode === 'compact' ? '1rem' : '0.75rem',
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	textAlign: 'left' as const,
	'&:hover': {
		borderColor: 'var(--pingone-brand-primary)',
		transform: 'translateY(-2px)',
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
	},
});

const getScenarioTitleStyle = (viewMode: ViewMode) => ({
	fontSize: viewMode === 'full' ? '1.125rem' : viewMode === 'compact' ? '1rem' : '0.875rem',
	fontWeight: '600',
	color: 'var(--pingone-text-primary)',
	marginBottom: '0.5rem',
	display: 'flex',
	alignItems: 'center',
	gap: '0.5rem',
});

const getScenarioDescriptionStyle = (viewMode: ViewMode) => ({
	color: 'var(--pingone-text-secondary)',
	marginBottom: viewMode === 'full' ? '1rem' : viewMode === 'compact' ? '0.75rem' : '0.5rem',
	lineHeight: '1.5',
	fontSize: viewMode === 'full' ? '0.875rem' : viewMode === 'compact' ? '0.8rem' : '0.75rem',
});

const getUseCaseStyle = (viewMode: ViewMode) => ({
	background: 'var(--pingone-surface-secondary)',
	padding: viewMode === 'full' ? '0.75rem' : viewMode === 'compact' ? '0.5rem' : '0.375rem',
	borderRadius: '0.375rem',
	fontSize: viewMode === 'full' ? '0.875rem' : viewMode === 'compact' ? '0.8rem' : '0.75rem',
	color: 'var(--pingone-text-primary)',
	marginBottom: viewMode === 'full' ? '1rem' : viewMode === 'compact' ? '0.75rem' : '0.5rem',
});

const getButtonStyle = (variant: 'primary' | 'secondary' = 'primary', viewMode: ViewMode) => ({
	background:
		variant === 'primary' ? 'var(--pingone-brand-primary)' : 'var(--pingone-surface-secondary)',
	color: variant === 'primary' ? 'var(--pingone-text-inverse)' : 'var(--pingone-text-primary)',
	border: variant === 'secondary' ? '1px solid var(--pingone-border-primary)' : 'none',
	padding:
		viewMode === 'full'
			? '0.75rem 1.5rem'
			: viewMode === 'compact'
				? '0.5rem 1rem'
				: '0.375rem 0.75rem',
	borderRadius: '0.375rem',
	fontWeight: '500',
	fontSize: viewMode === 'full' ? '0.875rem' : viewMode === 'compact' ? '0.8rem' : '0.75rem',
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
	borderRadius: '0.375rem',
	padding: '1rem',
	fontFamily: 'monospace',
	fontSize: '0.875rem',
	wordBreak: 'break-all' as const,
	marginBottom: '1rem',
});

const getViewModeButtonStyle = (isActive: boolean) => ({
	background: isActive ? 'var(--pingone-brand-primary)' : 'var(--pingone-surface-secondary)',
	color: isActive ? 'var(--pingone-text-inverse)' : 'var(--pingone-text-primary)',
	border: isActive ? 'none' : '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	padding: '0.375rem 0.75rem',
	fontSize: 'var(--pingone-font-size-xs, 0.75rem)',
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	display: 'inline-flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-xs, 0.25rem)',
	'&:hover': {
		background: isActive ? 'var(--pingone-brand-primary-dark)' : 'var(--pingone-surface-tertiary)',
		transform: 'translateY(-1px)',
	},
});

const getViewModeContainerStyle = () => ({
	display: 'flex',
	gap: 'var(--pingone-spacing-xs, 0.25rem)',
	alignItems: 'center',
});

const TokenExchangeFlowV9PingUI: React.FC = () => {
	const [selectedScenario, setSelectedScenario] = useState<TokenExchangeScenario>('delegation');
	const [exchangedToken, setExchangedToken] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [viewMode, setViewMode] = useState<ViewMode>('full');

	const scenarios = useMemo(
		() => ({
			delegation: {
				icon: 'account-key',
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
			<div style={getContainerStyle(viewMode)}>
				<div style={getMainCardStyle()}>
					{/* Header */}
					<div style={getHeaderStyle(viewMode)}>
						<h1 style={getTitleStyle(viewMode)}>
							<MDIIcon
								icon="swap-horizontal"
								size={viewMode === 'full' ? 28 : viewMode === 'compact' ? 24 : 20}
								title="Token Exchange"
							/>
							Token Exchange Flow
						</h1>
						<p style={getSubtitleStyle(viewMode)}>
							RFC 8693 Implementation for A2A Security - Exchange tokens for different audiences and
							scopes
						</p>

						{/* View Mode Controls */}
						{viewMode !== 'hidden' && (
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginTop:
										viewMode === 'full' ? '1.5rem' : viewMode === 'compact' ? '1rem' : '0.5rem',
								}}
							>
								<div style={getViewModeContainerStyle()}>
									<button
										type="button"
										onClick={() => setViewMode('full')}
										style={getViewModeButtonStyle(viewMode === 'full')}
										title="Full view - Show all sections"
									>
										<MDIIcon icon="view-fullscreen" size={14} />
										Full
									</button>
									<button
										type="button"
										onClick={() => setViewMode('compact')}
										style={getViewModeButtonStyle(viewMode === 'compact')}
										title="Compact view - Reduced spacing"
									>
										<MDIIcon icon="view-compact" size={14} />
										Compact
									</button>
									<button
										type="button"
										onClick={() => setViewMode('hidden')}
										style={getViewModeButtonStyle(viewMode === 'hidden')}
										title="Hidden view - Minimal display"
									>
										<MDIIcon icon="eye-off" size={14} />
										Hidden
									</button>
								</div>
							</div>
						)}
					</div>

					{/* Scenario Selection */}
					<div style={getSectionStyle(viewMode)}>
						<h2 style={getSectionTitleStyle(viewMode)}>
							<MDIIcon
								icon="target"
								size={viewMode === 'full' ? 20 : viewMode === 'compact' ? 18 : 16}
								title="Scenario"
							/>
							Select Exchange Scenario
						</h2>
						<div style={getScenarioGridStyle(viewMode)}>
							{Object.entries(scenarios).map(([key, scenario]) => (
								<button
									key={key}
									type="button"
									style={getScenarioCardStyle(selectedScenario === key, viewMode)}
									onClick={() => setSelectedScenario(key as TokenExchangeScenario)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											setSelectedScenario(key as TokenExchangeScenario);
										}
									}}
									aria-pressed={selectedScenario === key}
								>
									<div style={getScenarioTitleStyle(viewMode)}>
										<MDIIcon
											icon={scenario.icon}
											size={viewMode === 'full' ? 20 : viewMode === 'compact' ? 18 : 16}
											title={scenario.title}
										/>
										{scenario.title}
									</div>
									<div style={getScenarioDescriptionStyle(viewMode)}>{scenario.description}</div>
									<div style={getUseCaseStyle(viewMode)}>
										<strong>Use Case:</strong> {scenario.useCase}
									</div>
									{viewMode !== 'hidden' && (
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
									)}
								</button>
							))}
						</div>
					</div>

					{/* Token Exchange Action */}
					<div style={getSectionStyle(viewMode)}>
						<h2 style={getSectionTitleStyle(viewMode)}>
							<MDIIcon
								icon="swap-horizontal"
								size={viewMode === 'full' ? 20 : viewMode === 'compact' ? 18 : 16}
								title="Exchange"
							/>
							Exchange Token
						</h2>

						<div
							style={{
								marginBottom:
									viewMode === 'full' ? '1.5rem' : viewMode === 'compact' ? '1rem' : '0.5rem',
							}}
						>
							<p
								style={{
									color: 'var(--pingone-text-secondary)',
									marginBottom:
										viewMode === 'full' ? '1rem' : viewMode === 'compact' ? '0.75rem' : '0.5rem',
								}}
							>
								Click below to exchange the original token for a new token with the specified
								audience and scope.
							</p>

							<button
								type="button"
								onClick={handleTokenExchange}
								disabled={isLoading}
								style={getButtonStyle('primary', viewMode)}
							>
								<MDIIcon
									icon={isLoading ? 'loading' : 'swap-horizontal'}
									size={viewMode === 'full' ? 16 : 14}
									className={isLoading ? 'mdi-spin' : ''}
								/>
								{isLoading ? 'Exchanging...' : 'Exchange Token'}
							</button>
						</div>

						{error && (
							<div
								style={{
									background: 'var(--pingone-surface-error)',
									border: '1px solid var(--pingone-border-error)',
									borderRadius: '0.375rem',
									padding: '1rem',
									color: 'var(--pingone-text-error)',
									marginBottom: '1rem',
								}}
							>
								<strong>Error:</strong> {error}
							</div>
						)}

						{exchangedToken && (
							<div>
								<h3
									style={{
										fontSize:
											viewMode === 'full'
												? '1.125rem'
												: viewMode === 'compact'
													? '1rem'
													: '0.875rem',
										fontWeight: '600',
										marginBottom: '0.5rem',
									}}
								>
									Exchanged Token
								</h3>
								<div style={getTokenDisplayStyle()}>{exchangedToken}</div>
								<button
									type="button"
									onClick={() => copyToClipboard(exchangedToken)}
									style={getButtonStyle('secondary', viewMode)}
								>
									<MDIIcon icon="content-copy" size={viewMode === 'full' ? 16 : 14} />
									Copy Token
								</button>
							</div>
						)}
					</div>

					{/* Original Token Info */}
					{viewMode !== 'hidden' && (
						<div style={getSectionStyle(viewMode)}>
							<h2 style={getSectionTitleStyle(viewMode)}>
								<MDIIcon
									icon="key"
									size={viewMode === 'full' ? 20 : viewMode === 'compact' ? 18 : 16}
									title="Original Token"
								/>
								Original Token
							</h2>
							<div style={getTokenDisplayStyle()}>{scenarios[selectedScenario].originalToken}</div>
							<button
								type="button"
								onClick={() => copyToClipboard(scenarios[selectedScenario].originalToken)}
								style={getButtonStyle('secondary', viewMode)}
							>
								<MDIIcon icon="content-copy" size={viewMode === 'full' ? 16 : 14} />
								Copy Original Token
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default TokenExchangeFlowV9PingUI;
