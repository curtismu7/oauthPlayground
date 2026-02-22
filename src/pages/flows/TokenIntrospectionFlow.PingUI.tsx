// src/pages/flows/TokenIntrospectionFlow.PingUI.tsx
// Token Introspection Flow - PingOne UI Version with View Mode Controls
// PingOne UI migration following pingui2.md standards

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import JSONHighlighter from '../../components/JSONHighlighter';
import {
	type TokenAuthMethod,
	type TokenIntrospectionResponse,
	TokenManagementService,
} from '../../services/tokenManagementService';
import { logger } from '../../utils/logger';

// PingOne UI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	style?: React.CSSProperties;
	title?: string;
}> = ({ icon, size = 24, className = '', style, title }) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: size, ...style }}
			title={title}
		/>
	);
};

type ViewMode = 'full' | 'compact' | 'hidden';

// PingOne UI Styled Components
const getContainerStyle = (viewMode: ViewMode) => ({
	maxWidth: '1200px',
	margin: '0 auto',
	padding: viewMode === 'full' ? '2rem' : viewMode === 'compact' ? '1rem' : '0.5rem',
});

const getFlowTitleStyle = (viewMode: ViewMode) => ({
	color: 'var(--pingone-text-primary)',
	fontSize: viewMode === 'full' ? '2rem' : viewMode === 'compact' ? '1.5rem' : '1.25rem',
	fontWeight: '700',
	marginBottom: '0.5rem',
});

const getFlowDescriptionStyle = (viewMode: ViewMode) => ({
	color: 'var(--pingone-text-secondary)',
	fontSize: viewMode === 'full' ? '1.125rem' : viewMode === 'compact' ? '1rem' : '0.875rem',
	marginBottom: viewMode === 'full' ? '2rem' : viewMode === 'compact' ? '1rem' : '0.5rem',
	lineHeight: '1.6',
});

const getFormContainerStyle = (viewMode: ViewMode) => ({
	background: 'var(--pingone-surface-secondary)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-md, 0.5rem)',
	padding: viewMode === 'full' ? '1.5rem' : viewMode === 'compact' ? '1rem' : '0.75rem',
	margin: viewMode === 'full' ? '1rem 0' : viewMode === 'compact' ? '0.75rem 0' : '0.5rem 0',
});

const getFormGroupStyle = (viewMode: ViewMode) => ({
	marginBottom: viewMode === 'full' ? '1rem' : viewMode === 'compact' ? '0.75rem' : '0.5rem',
});

const getLabelStyle = (viewMode: ViewMode) => ({
	display: 'block',
	marginBottom: viewMode === 'full' ? '0.5rem' : viewMode === 'compact' ? '0.375rem' : '0.25rem',
	fontWeight: '500',
	color: 'var(--pingone-text-primary)',
	fontSize: viewMode === 'full' ? '0.875rem' : viewMode === 'compact' ? '0.8rem' : '0.75rem',
});

const getInputStyle = (viewMode: ViewMode) => ({
	width: '100%',
	padding: viewMode === 'full' ? '0.75rem' : viewMode === 'compact' ? '0.5rem' : '0.375rem',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-sm, 0.375rem)',
	fontSize: viewMode === 'full' ? '0.875rem' : viewMode === 'compact' ? '0.8rem' : '0.75rem',
	background: 'var(--pingone-surface-primary)',
	color: 'var(--pingone-text-primary)',
	transition: 'all 0.15s ease-in-out',
	'&:focus': {
		outline: 'none',
		borderColor: 'var(--pingone-brand-primary)',
		boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
	},
});

const getSelectStyle = (viewMode: ViewMode) => ({
	width: '100%',
	padding: viewMode === 'full' ? '0.75rem' : viewMode === 'compact' ? '0.5rem' : '0.375rem',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-sm, 0.375rem)',
	fontSize: viewMode === 'full' ? '0.875rem' : viewMode === 'compact' ? '0.8rem' : '0.75rem',
	background: 'var(--pingone-surface-primary)',
	color: 'var(--pingone-text-primary)',
	transition: 'all 0.15s ease-in-out',
	'&:focus': {
		outline: 'none',
		borderColor: 'var(--pingone-brand-primary)',
		boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
	},
});

const getButtonStyle = (variant: 'primary' | 'secondary' = 'primary', viewMode: ViewMode) => ({
	background:
		variant === 'primary' ? 'var(--pingone-brand-primary)' : 'var(--pingone-surface-secondary)',
	color: variant === 'primary' ? 'var(--pingone-text-inverse)' : 'var(--pingone-text-primary)',
	border: variant === 'secondary' ? '1px solid var(--pingone-border-primary)' : 'none',
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	padding:
		viewMode === 'full'
			? '0.75rem 1.5rem'
			: viewMode === 'compact'
				? '0.5rem 1rem'
				: '0.375rem 0.75rem',
	fontSize: viewMode === 'full' ? '0.875rem' : viewMode === 'compact' ? '0.8rem' : '0.75rem',
	fontWeight: '500',
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	display: 'inline-flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-xs, 0.25rem)',
	'&:hover': {
		background:
			variant === 'primary'
				? 'var(--pingone-brand-primary-dark)'
				: 'var(--pingone-surface-tertiary)',
		transform: 'translateY(-1px)',
	},
	'&:disabled': {
		opacity: '0.5',
		cursor: 'not-allowed',
		transform: 'none',
	},
});

const getResultContainerStyle = (viewMode: ViewMode) => ({
	background: 'var(--pingone-surface-card)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-md, 0.5rem)',
	padding: viewMode === 'full' ? '1.5rem' : viewMode === 'compact' ? '1rem' : '0.75rem',
	marginTop: viewMode === 'full' ? '1rem' : viewMode === 'compact' ? '0.75rem' : '0.5rem',
});

const getResultTitleStyle = (viewMode: ViewMode) => ({
	fontSize: viewMode === 'full' ? '1.125rem' : viewMode === 'compact' ? '1rem' : '0.875rem',
	fontWeight: '600',
	color: 'var(--pingone-text-primary)',
	marginBottom: viewMode === 'full' ? '1rem' : viewMode === 'compact' ? '0.75rem' : '0.5rem',
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-sm, 0.5rem)',
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

const TokenIntrospectionFlowPingUI: React.FC = () => {
	const [token, setToken] = useState('');
	const [authMethod, setAuthMethod] = useState<TokenAuthMethod>('client_credentials');
	const [introspectionResult, setIntrospectionResult] = useState<TokenIntrospectionResponse | null>(
		null
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [viewMode, setViewMode] = useState<ViewMode>('full');

	// Load stored token on mount
	useEffect(() => {
		const storedToken = localStorage.getItem('introspection_token');
		if (storedToken) {
			setToken(storedToken);
		}
	}, []);

	// Save token to localStorage when it changes
	useEffect(() => {
		if (token) {
			localStorage.setItem('introspection_token', token);
		}
	}, [token]);

	const handleIntrospect = useCallback(async () => {
		if (!token.trim()) {
			setError('Please enter a token to introspect');
			return;
		}

		setIsLoading(true);
		setError('');
		setIntrospectionResult(null);

		try {
			const result = await TokenManagementService.introspectToken(token, authMethod);
			setIntrospectionResult(result);
			logger.info('Token introspection successful', {
				tokenType: result.token_type,
				active: result.active,
			});
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			setError(`Introspection failed: ${errorMessage}`);
			logger.error('Token introspection error', err);
		} finally {
			setIsLoading(false);
		}
	}, [token, authMethod]);

	const handleClear = useCallback(() => {
		setToken('');
		setIntrospectionResult(null);
		setError('');
		localStorage.removeItem('introspection_token');
	}, []);

	const copyToClipboard = useCallback(async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			logger.info('Token copied to clipboard');
		} catch (err) {
			logger.error('Failed to copy to clipboard', err);
		}
	}, []);

	return (
		<div className="end-user-nano">
			<div style={getContainerStyle(viewMode)}>
				{/* Header */}
				<div>
					<h1 style={getFlowTitleStyle(viewMode)}>
						<MDIIcon
							icon="search-web"
							size={viewMode === 'full' ? 32 : viewMode === 'compact' ? 24 : 20}
							title="Token Introspection"
						/>
						Token Introspection
					</h1>
					<p style={getFlowDescriptionStyle(viewMode)}>
						Analyze and validate OAuth 2.0 tokens using RFC 7662 Token Introspection standard
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

				{/* Token Input Section */}
				{viewMode !== 'hidden' && (
					<div style={getFormContainerStyle(viewMode)}>
						<h2 style={getResultTitleStyle(viewMode)}>
							<MDIIcon
								icon="key"
								size={viewMode === 'full' ? 20 : viewMode === 'compact' ? 18 : 16}
								title="Token Input"
							/>
							Token Configuration
						</h2>

						<div style={getFormGroupStyle(viewMode)}>
							<label htmlFor="token" style={getLabelStyle(viewMode)}>
								Access Token
							</label>
							<input
								id="token"
								type="text"
								style={getInputStyle(viewMode)}
								value={token}
								onChange={(e) => setToken(e.target.value)}
								placeholder="Enter access token to introspect"
							/>
						</div>

						<div style={getFormGroupStyle(viewMode)}>
							<label htmlFor="authMethod" style={getLabelStyle(viewMode)}>
								Authentication Method
							</label>
							<select
								id="authMethod"
								style={getSelectStyle(viewMode)}
								value={authMethod}
								onChange={(e) => setAuthMethod(e.target.value as TokenAuthMethod)}
							>
								<option value="client_credentials">Client Credentials</option>
								<option value="bearer">Bearer Token</option>
								<option value="basic">Basic Auth</option>
							</select>
						</div>

						<div
							style={{
								display: 'flex',
								gap: 'var(--pingone-spacing-md, 1rem)',
								marginTop:
									viewMode === 'full' ? '1rem' : viewMode === 'compact' ? '0.75rem' : '0.5rem',
							}}
						>
							<button
								type="button"
								onClick={handleIntrospect}
								disabled={isLoading || !token.trim()}
								style={getButtonStyle('primary', viewMode)}
							>
								<MDIIcon
									icon={isLoading ? 'loading' : 'search-web'}
									size={viewMode === 'full' ? 16 : 14}
									className={isLoading ? 'mdi-spin' : ''}
								/>
								{isLoading ? 'Introspecting...' : 'Introspect Token'}
							</button>

							<button
								type="button"
								onClick={handleClear}
								style={getButtonStyle('secondary', viewMode)}
							>
								<MDIIcon icon="delete" size={viewMode === 'full' ? 16 : 14} />
								Clear
							</button>
						</div>

						{error && (
							<div
								style={{
									background: 'var(--pingone-surface-error)',
									border: '1px solid var(--pingone-border-error)',
									borderRadius: 'var(--pingone-border-radius-sm, 0.375rem)',
									padding: '1rem',
									color: 'var(--pingone-text-error)',
									marginTop: '1rem',
								}}
							>
								<strong>Error:</strong> {error}
							</div>
						)}
					</div>
				)}

				{/* Results Section */}
				{introspectionResult && (
					<div style={getResultContainerStyle(viewMode)}>
						<h2 style={getResultTitleStyle(viewMode)}>
							<MDIIcon
								icon="check-circle"
								size={viewMode === 'full' ? 20 : viewMode === 'compact' ? 18 : 16}
								title="Results"
							/>
							Introspection Results
						</h2>

						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 'var(--pingone-spacing-sm, 0.5rem)',
								marginBottom:
									viewMode === 'full' ? '1rem' : viewMode === 'compact' ? '0.75rem' : '0.5rem',
							}}
						>
							<div
								style={{
									background: introspectionResult.active
										? 'var(--pingone-surface-success)'
										: 'var(--pingone-surface-error)',
									color: introspectionResult.active
										? 'var(--pingone-text-success)'
										: 'var(--pingone-text-error)',
									padding: '0.25rem 0.75rem',
									borderRadius: 'var(--pingone-border-radius-full, 9999px)',
									fontSize:
										viewMode === 'full'
											? '0.875rem'
											: viewMode === 'compact'
												? '0.8rem'
												: '0.75rem',
									fontWeight: '500',
								}}
							>
								{introspectionResult.active ? '✓ Active' : '✗ Inactive'}
							</div>

							{introspectionResult.token_type && (
								<span
									style={{
										color: 'var(--pingone-text-secondary)',
										fontSize:
											viewMode === 'full'
												? '0.875rem'
												: viewMode === 'compact'
													? '0.8rem'
													: '0.75rem',
									}}
								>
									Type: {introspectionResult.token_type}
								</span>
							)}
						</div>

						{viewMode !== 'hidden' && (
							<div
								style={{
									marginBottom:
										viewMode === 'full' ? '1rem' : viewMode === 'compact' ? '0.75rem' : '0.5rem',
								}}
							>
								<button
									type="button"
									onClick={() => copyToClipboard(JSON.stringify(introspectionResult, null, 2))}
									style={getButtonStyle('secondary', viewMode)}
								>
									<MDIIcon icon="content-copy" size={viewMode === 'full' ? 16 : 14} />
									Copy Results
								</button>
							</div>
						)}

						<JSONHighlighter data={introspectionResult} />
					</div>
				)}

				{/* Information Section */}
				{viewMode !== 'hidden' && (
					<div style={getResultContainerStyle(viewMode)}>
						<h2 style={getResultTitleStyle(viewMode)}>
							<MDIIcon
								icon="information"
								size={viewMode === 'full' ? 20 : viewMode === 'compact' ? 18 : 16}
								title="Information"
							/>
							About Token Introspection
						</h2>

						<div style={{ color: 'var(--pingone-text-secondary)', lineHeight: '1.6' }}>
							<p
								style={{
									marginBottom:
										viewMode === 'full' ? '1rem' : viewMode === 'compact' ? '0.75rem' : '0.5rem',
								}}
							>
								<strong>Token Introspection (RFC 7662)</strong> is a standard OAuth 2.0 endpoint
								that allows resource servers to validate access tokens and obtain metadata about
								them without parsing the tokens themselves.
							</p>

							<div
								style={{
									background: 'var(--pingone-surface-tertiary)',
									border: '1px solid var(--pingone-border-secondary)',
									borderRadius: 'var(--pingone-border-radius-sm, 0.375rem)',
									padding:
										viewMode === 'full' ? '1rem' : viewMode === 'compact' ? '0.75rem' : '0.5rem',
									marginTop:
										viewMode === 'full' ? '1rem' : viewMode === 'compact' ? '0.75rem' : '0.5rem',
								}}
							>
								<h3
									style={{
										fontSize:
											viewMode === 'full'
												? '1rem'
												: viewMode === 'compact'
													? '0.875rem'
													: '0.75rem',
										fontWeight: '600',
										marginBottom: '0.5rem',
									}}
								>
									Key Response Fields:
								</h3>
								<ul
									style={{
										margin: 0,
										paddingLeft: '1.5rem',
										fontSize:
											viewMode === 'full'
												? '0.875rem'
												: viewMode === 'compact'
													? '0.8rem'
													: '0.75rem',
									}}
								>
									<li style={{ marginBottom: '0.25rem' }}>
										<strong>active:</strong> Whether the token is currently valid
									</li>
									<li style={{ marginBottom: '0.25rem' }}>
										<strong>client_id:</strong> The client that issued the token
									</li>
									<li style={{ marginBottom: '0.25rem' }}>
										<strong>token_type:</strong> The type of the token
									</li>
									<li style={{ marginBottom: '0.25rem' }}>
										<strong>exp:</strong> Token expiration time
									</li>
									<li style={{ marginBottom: '0.25rem' }}>
										<strong>scope:</strong> Granted scopes/permissions
									</li>
								</ul>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default TokenIntrospectionFlowPingUI;
