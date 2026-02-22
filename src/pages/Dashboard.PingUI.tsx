/**
 * @file Dashboard.PingUI.tsx
 * @module pages
 * @description Dashboard page with PingOne UI styling
 * @version 9.6.5
 * @since 2026-02-22
 *
 * This component provides the main dashboard with PingOne UI design system,
 * including MDI icons, CSS variables, and modern styling patterns.
 */

import { useCallback, useEffect, useState } from 'react';
import AppVersionBadge from '../components/AppVersionBadge';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { type ActivityItem, getRecentActivity } from '../utils/activityTracker';

// ============================================================================
// MDI ICON COMPONENT
// ============================================================================

const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	'aria-label'?: string;
	'aria-hidden'?: boolean;
	style?: React.CSSProperties;
}> = ({
	icon,
	size = 24,
	className = '',
	'aria-label': ariaLabel,
	'aria-hidden': ariaHidden,
	style,
}) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: size, ...style }}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
		/>
	);
};

// ============================================================================
// STYLE FUNCTIONS
// ============================================================================

const getDashboardContainerStyle = () => ({
	width: '100%',
	minHeight: '100vh',
	background: 'var(--pingone-surface-primary)',
	color: 'var(--pingone-text-primary)',
});

const getHeaderStyle = () => ({
	background: 'var(--pingone-surface-header)',
	borderBottom: '1px solid var(--pingone-border-primary)',
	padding: '2rem 0',
	position: 'relative' as const,
	overflow: 'hidden',
});

const getHeaderBackgroundStyle = () => ({
	position: 'absolute' as const,
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	background:
		'linear-gradient(135deg, var(--pingone-brand-primary-light) 0%, var(--pingone-brand-secondary-light) 100%)',
	opacity: 0.1,
});

const getHeaderContentStyle = () => ({
	maxWidth: '1200px',
	margin: '0 auto',
	padding: '0 2rem',
	position: 'relative' as const,
	zIndex: 2,
});

const getTitleStyle = () => ({
	fontSize: '2rem',
	fontWeight: '600',
	color: 'var(--pingone-text-primary)',
	margin: '0 0 0.5rem 0',
	display: 'flex',
	alignItems: 'center',
	gap: '0.75rem',
});

const getSubtitleStyle = () => ({
	fontSize: '1rem',
	color: 'var(--pingone-text-secondary)',
	margin: '0 0 1.5rem 0',
});

const getMainContentStyle = () => ({
	maxWidth: '1200px',
	margin: '0 auto',
	padding: '2rem',
});

const getCardStyle = () => ({
	background: 'var(--pingone-surface-card)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: '0.75rem',
	padding: '1.5rem',
	boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
	transition: 'all 0.15s ease-in-out',
});

const getCardHoverStyle = () => ({
	...getCardStyle(),
	borderColor: 'var(--pingone-brand-primary)',
	boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
	transform: 'translateY(-2px)',
});

const getGridStyle = (columns: number = 2) => ({
	display: 'grid',
	gridTemplateColumns: `repeat(${columns}, 1fr)`,
	gap: '1.5rem',
});

const getStatusIndicatorStyle = (status: 'online' | 'offline' | 'checking') => ({
	width: '8px',
	height: '8px',
	borderRadius: '50%',
	background:
		status === 'online'
			? 'var(--pingone-success)'
			: status === 'offline'
				? 'var(--pingone-error)'
				: 'var(--pingone-warning)',
	display: 'inline-block',
	marginRight: '0.5rem',
});

const getButtonStyle = (variant: 'primary' | 'secondary' = 'primary') => ({
	background:
		variant === 'primary' ? 'var(--pingone-brand-primary)' : 'var(--pingone-surface-secondary)',
	color: variant === 'primary' ? 'var(--pingone-text-inverse)' : 'var(--pingone-text-primary)',
	border: variant === 'secondary' ? '1px solid var(--pingone-border-primary)' : 'none',
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	padding: '0.5rem 1rem',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
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
		boxShadow: 'var(--pingone-shadow-sm, 0 2px 4px rgba(0, 0, 0, 0.1))',
	},
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

const getCompactHeaderStyle = () => ({
	padding: '1rem 0',
});

const getHiddenHeaderStyle = () => ({
	padding: '0.5rem 0',
});

const getCompactContentStyle = () => ({
	padding: '1rem',
});

const getHiddenContentStyle = () => ({
	padding: '0.5rem',
});

// ============================================================================
// DASHBOARD COMPONENT
// ============================================================================

const Dashboard: React.FC = () => {
	const [collapsedSections, setCollapsedSections] = useState({
		systemStatus: false,
		oauthFlows: false,
		apiEndpoints: false,
		recentActivity: false,
	});
	const [serverStatus, setServerStatus] = useState({
		backend: 'checking',
		frontend: 'online',
	});
	const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [viewMode, setViewMode] = useState<'full' | 'compact' | 'hidden'>('full');

	const toggleSection = useCallback((section: keyof typeof collapsedSections) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	// Check server status
	const checkServerStatus = useCallback(async () => {
		try {
			const backendResponse = await fetch('/api/health', {
				method: 'GET',
				mode: 'cors',
				signal: AbortSignal.timeout(3000),
			});

			setServerStatus((prev) => ({
				...prev,
				backend: backendResponse.ok ? 'online' : 'offline',
				frontend: 'online',
			}));
		} catch (_error) {
			setServerStatus((prev) => ({
				...prev,
				backend: 'offline',
				frontend: 'online',
			}));
		}
	}, []);

	// Check server status on mount
	useEffect(() => {
		checkServerStatus();
	}, [checkServerStatus]);

	// Load initial dashboard data
	useEffect(() => {
		const loadDashboardData = async () => {
			try {
				let activity = getRecentActivity();

				if (activity.length === 0) {
					const sampleActivities = [
						{
							id: 'sample_1',
							action: 'Completed Authorization Code Flow',
							flowType: 'authorization-code',
							timestamp: Date.now() - 300000,
							success: true,
							details: 'Successfully obtained access token',
						},
						{
							id: 'sample_2',
							action: 'Updated PingOne Credentials',
							flowType: 'configuration',
							timestamp: Date.now() - 600000,
							success: true,
							details: 'Environment ID configured',
						},
					];

					localStorage.setItem(
						'pingone_playground_recent_activity',
						JSON.stringify(sampleActivities)
					);
					activity = sampleActivities;
				}

				setRecentActivity(activity);
			} catch (_error) {
				// Handle error silently
			}
		};

		loadDashboardData();
	}, []);

	// Refresh dashboard data
	const refreshDashboard = async () => {
		setIsRefreshing(true);
		try {
			const activity = getRecentActivity();
			setRecentActivity(activity);
			await checkServerStatus();
			console.log('Dashboard refreshed successfully');
		} catch (error) {
			console.error('Failed to refresh dashboard:', error);
		} finally {
			setIsRefreshing(false);
		}
	};

	// API endpoints for testing
	const apiEndpoints = [
		{ method: 'GET', path: '/api/health', desc: 'Health check endpoint' },
		{ method: 'GET', path: '/api/config', desc: 'Configuration status' },
		{ method: 'POST', path: '/api/token', desc: 'Token endpoint' },
		{ method: 'GET', path: '/api/userinfo', desc: 'User information' },
		{ method: 'POST', path: '/api/device-authorization', desc: 'Device authorization flow' },
		{ method: 'POST', path: '/api/par', desc: 'Pushed Authorization Request' },
		{ method: 'GET', path: '/api/jwks', desc: 'Fetch PingOne JWKS' },
		{ method: 'POST', path: '/api/user-jwks', desc: 'Generate JWKS from user key' },
	];

	const formatActivityAction = (action?: string) => {
		if (!action) {
			return 'Activity';
		}
		return action.replace(
			/Successfully\s+Implcit\s+Flow\s+Token/gi,
			'Successfully Obtained Implicit Flow Token'
		);
	};

	return (
		<div className="end-user-nano">
			<div style={getDashboardContainerStyle()}>
				{/* Header */}
				<div
					style={{
						...getHeaderStyle(),
						...(viewMode === 'compact' && getCompactHeaderStyle()),
						...(viewMode === 'hidden' && getHiddenHeaderStyle()),
					}}
				>
					<div style={getHeaderBackgroundStyle()} />
					<div style={getHeaderContentStyle()}>
						<h1 style={getTitleStyle()}>
							<MDIIcon icon="view-dashboard" size={32} />
							Dashboard
						</h1>
						<p style={getSubtitleStyle()}>
							Monitor system status, explore OAuth flows, and track recent activity
						</p>

						{/* Version Badges */}
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '0.5rem',
								marginBottom: '1.5rem',
							}}
						>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
								<AppVersionBadge type="app" />
								<AppVersionBadge type="mfa" />
							</div>
							<div style={{ display: 'flex', justifyContent: 'center' }}>
								<AppVersionBadge type="unified" />
							</div>
						</div>

						{/* View Mode Controls */}
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: '1.5rem',
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

							{/* Refresh Button */}
							<button
								onClick={refreshDashboard}
								disabled={isRefreshing}
								type="button"
								style={{
									...getButtonStyle('secondary'),
									opacity: isRefreshing ? 0.7 : 1,
									cursor: isRefreshing ? 'not-allowed' : 'pointer',
								}}
							>
								<MDIIcon
									icon={isRefreshing ? 'loading' : 'refresh'}
									size={16}
									className={isRefreshing ? 'mdi-spin' : ''}
								/>
								{isRefreshing ? 'Refreshing...' : 'Refresh'}
							</button>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div
					style={{
						...getMainContentStyle(),
						...(viewMode === 'compact' && getCompactContentStyle()),
						...(viewMode === 'hidden' && getHiddenContentStyle()),
					}}
				>
					{/* System Status */}
					<CollapsibleHeader
						title="System Status"
						collapsed={collapsedSections.systemStatus}
						onToggle={() => toggleSection('systemStatus')}
						icon={<MDIIcon icon="server" size={20} />}
					>
						<div style={getGridStyle(2)}>
							<div style={getCardStyle()}>
								<div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
									<span style={getStatusIndicatorStyle(serverStatus.frontend)} />
									<strong>Frontend</strong>
								</div>
								<p style={{ color: 'var(--pingone-text-secondary)', margin: '0' }}>
									{serverStatus.frontend === 'online'
										? 'Running'
										: serverStatus.frontend === 'offline'
											? 'Offline'
											: 'Checking...'}
								</p>
							</div>
							<div style={getCardStyle()}>
								<div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
									<span style={getStatusIndicatorStyle(serverStatus.backend)} />
									<strong>Backend</strong>
								</div>
								<p style={{ color: 'var(--pingone-text-secondary)', margin: '0' }}>
									{serverStatus.backend === 'online'
										? 'Running'
										: serverStatus.backend === 'offline'
											? 'Offline'
											: 'Checking...'}
								</p>
							</div>
						</div>
					</CollapsibleHeader>

					{/* Quick Access */}
					<CollapsibleHeader
						title="Quick Access"
						collapsed={collapsedSections.quickAccess}
						onToggle={() => toggleSection('quickAccess')}
						icon={<MDIIcon icon="rocket-launch" size={20} />}
					>
						<div style={getGridStyle(3)}>
							<a href="/v8u/unified/oauth-authz/0" style={{ textDecoration: 'none' }}>
								<div style={getCardHoverStyle()}>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											marginBottom: '0.5rem',
										}}
									>
										<MDIIcon
											icon="key"
											size={20}
											style={{ color: 'var(--pingone-brand-primary)' }}
										/>
										<strong>Unified OAuth V8U</strong>
									</div>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: '0',
											fontSize: '0.875rem',
										}}
									>
										Complete OAuth flow with device registration
									</p>
								</div>
							</a>

							<a href="/v8/mfa/authentication" style={{ textDecoration: 'none' }}>
								<div style={getCardHoverStyle()}>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											marginBottom: '0.5rem',
										}}
									>
										<MDIIcon
											icon="shield-account"
											size={20}
											style={{ color: 'var(--pingone-brand-primary)' }}
										/>
										<strong>MFA Authentication</strong>
									</div>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: '0',
											fontSize: '0.875rem',
										}}
									>
										Multi-factor authentication flows
									</p>
								</div>
							</a>

							<a href="/v7/authorization-code" style={{ textDecoration: 'none' }}>
								<div style={getCardHoverStyle()}>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											marginBottom: '0.5rem',
										}}
									>
										<MDIIcon
											icon="code-braces"
											size={20}
											style={{ color: 'var(--pingone-brand-primary)' }}
										/>
										<strong>OAuth V7</strong>
									</div>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: '0',
											fontSize: '0.875rem',
										}}
									>
										Classic OAuth 2.0 flows
									</p>
								</div>
							</a>
						</div>
					</CollapsibleHeader>

					{/* API Endpoints */}
					<CollapsibleHeader
						title="API Endpoints"
						collapsed={collapsedSections.apiEndpoints}
						onToggle={() => toggleSection('apiEndpoints')}
						icon={<MDIIcon icon="api" size={20} />}
					>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
							{apiEndpoints.map((endpoint, index) => (
								<div key={index} style={getCardStyle()}>
									<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												background:
													endpoint.method === 'GET'
														? 'var(--pingone-info-light)'
														: 'var(--pingone-success-light)',
												color:
													endpoint.method === 'GET'
														? 'var(--pingone-info)'
														: 'var(--pingone-success)',
												borderRadius: '0.25rem',
												fontSize: '0.75rem',
												fontWeight: '600',
											}}
										>
											{endpoint.method}
										</span>
										<div style={{ flex: 1 }}>
											<code style={{ color: 'var(--pingone-text-primary)' }}>{endpoint.path}</code>
										</div>
									</div>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: '0.5rem 0 0 0',
											fontSize: '0.875rem',
										}}
									>
										{endpoint.desc}
									</p>
								</div>
							))}
						</div>
					</CollapsibleHeader>

					{/* Recent Activity */}
					<CollapsibleHeader
						title="Recent Activity"
						collapsed={collapsedSections.recentActivity}
						onToggle={() => toggleSection('recentActivity')}
						icon={<MDIIcon icon="history" size={20} />}
					>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
							{recentActivity.length === 0 ? (
								<div style={getCardStyle()}>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: 0,
											textAlign: 'center',
										}}
									>
										No recent activity
									</p>
								</div>
							) : (
								recentActivity.slice(0, 10).map((activity) => (
									<div key={activity.id} style={getCardStyle()}>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												marginBottom: '0.5rem',
											}}
										>
											<MDIIcon
												icon={activity.success ? 'check-circle' : 'alert-circle'}
												size={16}
												style={{
													color: activity.success
														? 'var(--pingone-success)'
														: 'var(--pingone-error)',
												}}
											/>
											<strong>{formatActivityAction(activity.action)}</strong>
										</div>
										<p
											style={{
												color: 'var(--pingone-text-secondary)',
												margin: '0',
												fontSize: '0.875rem',
											}}
										>
											{activity.details}
										</p>
										<p
											style={{
												color: 'var(--pingone-text-tertiary)',
												margin: '0.25rem 0 0 0',
												fontSize: '0.75rem',
											}}
										>
											{new Date(activity.timestamp).toLocaleString()}
										</p>
									</div>
								))
							)}
						</div>
					</CollapsibleHeader>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
