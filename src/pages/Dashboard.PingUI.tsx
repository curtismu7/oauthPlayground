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

import React, { useCallback, useEffect, useState } from 'react';
import AppVersionBadge from '../components/AppVersionBadge';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import StandardHeader from '../components/StandardHeader';
import { type ActivityItem, getRecentActivity } from '../utils/activityTracker';
import BootstrapButton from '../components/bootstrap/BootstrapButton';
import '../styles/button-color-system.css';

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
	borderWidth: '2px',
	boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
	transform: 'translateY(-2px)',
	cursor: 'pointer',
	transition: 'all 0.2s ease-in-out',
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

const getButtonStyle = (variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' = 'primary') => {
	const baseStyle = {
		padding: '0.625rem 1.25rem',
		borderRadius: '0.5rem',
		fontWeight: '500',
		fontSize: '0.875rem',
		cursor: 'pointer',
		transition: 'all 0.15s ease-in-out',
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.5rem',
	};
	
	switch (variant) {
		case 'primary':
			return {
				...baseStyle,
				className: 'btn-primary',
			};
		case 'secondary':
			return {
				...baseStyle,
				className: 'btn-secondary',
			};
		case 'success':
			return {
				...baseStyle,
				className: 'btn-success',
			};
		case 'warning':
			return {
				...baseStyle,
				className: 'btn-warning',
			};
		case 'danger':
			return {
				...baseStyle,
				className: 'btn-danger',
			};
		case 'info':
			return {
				...baseStyle,
				className: 'btn-info',
			};
		default:
			return {
				...baseStyle,
				className: 'btn-primary',
			};
	}
};

const getViewModeButtonStyle = (isActive: boolean) => {
	const baseStyle = {
		borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
		padding: '0.375rem 0.75rem',
		fontSize: 'var(--pingone-font-size-xs, 0.75rem)',
		fontWeight: 'var(--pingone-font-weight-medium, 500)',
		cursor: 'pointer',
		transition: 'all 0.15s ease-in-out',
	};
	
	if (isActive) {
		return {
			...baseStyle,
			className: 'btn-primary',
		};
	} else {
		return {
			...baseStyle,
			className: 'btn-outline-primary',
		};
	}
};

const getViewModeContainerStyle = () => ({
	display: 'flex',
	gap: 'var(--pingone-spacing-sm, 0.5rem)',
	alignItems: 'center',
	flexWrap: 'nowrap',
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
		pingOneApiStatus: false,
		quickAccess: false,
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
						<StandardHeader
							title="Dashboard"
							description="Monitor PingOne API status, explore OAuth flows, and track recent activity"
							icon="view-dashboard"
							badge={{
								text: 'Live',
								variant: 'success'
							}}
						/>

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
								<BootstrapButton
									variant={viewMode === 'full' ? 'primary' : 'secondary'}
									greyBorder={viewMode === 'full'}
									onClick={() => setViewMode('full')}
									title="Full view - Show all sections"
								>
									<MDIIcon icon="view-fullscreen" size={14} />
									Full
								</BootstrapButton>
								<BootstrapButton
									variant={viewMode === 'compact' ? 'primary' : 'secondary'}
									greyBorder={viewMode === 'compact'}
									onClick={() => setViewMode('compact')}
									title="Compact view - Reduced spacing"
								>
									<MDIIcon icon="view-compact" size={14} />
									Compact
								</BootstrapButton>
								<BootstrapButton
									variant={viewMode === 'hidden' ? 'primary' : 'secondary'}
									greyBorder={viewMode === 'hidden'}
									onClick={() => setViewMode('hidden')}
									title="Hidden view - Minimal display"
								>
									<MDIIcon icon="eye-off" size={14} />
									Hidden
								</BootstrapButton>
							</div>

							{/* Refresh Button */}
							<BootstrapButton
								variant="secondary"
								onClick={refreshDashboard}
								disabled={isRefreshing}
								whiteBorder={true}
							>
								<MDIIcon
									icon={isRefreshing ? 'loading' : 'refresh'}
									size={16}
									className={isRefreshing ? 'mdi-spin' : ''}
								/>
								{isRefreshing ? 'Refreshing...' : 'Refresh'}
							</BootstrapButton>
						</div>
					</div>
				</div>

				{/* Migration Update Banner */}
				<div
					data-migration-banner
					style={{
						background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
						border: '1px solid #1e40af',
						borderRadius: '0.75rem',
						padding: '1rem 1.5rem',
						marginBottom: '1.5rem',
						boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
						<MDIIcon
							icon="information"
							size={24}
							style={{ color: '#ffffff', flexShrink: 0 }}
						/>
						<div style={{ flex: 1 }}>
							<h4 style={{ color: '#ffffff', margin: '0 0 0.25rem 0', fontSize: '1.125rem', fontWeight: 600 }}>
								Messaging System Migration In Progress
							</h4>
							<p style={{ color: '#f3f4f6', margin: '0', fontSize: '0.875rem', lineHeight: 1.5 }}>
								We're upgrading our notification system to provide better user feedback. Critical authentication flows are being migrated first to ensure no disruption to your OAuth testing experience.
							</p>
						</div>
						<BootstrapButton
							variant="primary"
							greyBorder={true}
							onClick={() => {
								// Dismiss banner functionality
								const banner = document.querySelector('[data-migration-banner]') as HTMLElement;
								if (banner) {
									banner.style.display = 'none';
								}
							}}
							whiteBorder={true}
							style={{
								background: 'rgba(255, 255, 255, 0.2)',
								border: '1px solid rgba(255, 255, 255, 0.3)',
							}}
						>
							Dismiss
						</BootstrapButton>
					</div>
				</div>

				{/* Main Content */}
				<div
					style={{
						...getMainContentStyle(),
					}}
				>
					<CollapsibleHeader
						title="PingOne API Configuration"
						collapsed={collapsedSections.pingOneApiStatus}
						onToggle={() => toggleSection('pingOneApiStatus')}
					>
						<div style={getCardStyle()}>
							<div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
								<MDIIcon
									icon="api"
									size={20}
									style={{ marginRight: '0.5rem', color: 'var(--pingone-brand-primary)' }}
								/>
								<strong>PingOne API Configuration</strong>
							</div>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
									gap: '1rem',
								}}
							>
								<div>
									<div
										style={{
											fontSize: '0.875rem',
											color: 'var(--pingone-text-secondary)',
											marginBottom: '0.25rem',
										}}
									>
										API Domain
									</div>
									<div style={{ fontWeight: '500' }}>api.pingdemo.com</div>
								</div>
								<div>
									<div
										style={{
											fontSize: '0.875rem',
											color: 'var(--pingone-text-secondary)',
											marginBottom: '0.25rem',
										}}
									>
										Environment ID
									</div>
									<div style={{ fontWeight: '500', fontSize: '0.75rem' }}>
										b9817c16-9910-4415-b67e-4ac687da74d9
									</div>
								</div>
								<div>
									<div
										style={{
											fontSize: '0.875rem',
											color: 'var(--pingone-text-secondary)',
											marginBottom: '0.25rem',
										}}
									>
										API Version
									</div>
									<div style={{ fontWeight: '500' }}>v1</div>
								</div>
								<div>
									<div
										style={{
											fontSize: '0.875rem',
											color: 'var(--pingone-text-secondary)',
											marginBottom: '0.25rem',
										}}
									>
										Region
									</div>
									<div style={{ fontWeight: '500' }}>North America</div>
								</div>
								<div>
									<div
										style={{
											fontSize: '0.875rem',
											color: 'var(--pingone-text-secondary)',
											marginBottom: '0.25rem',
										}}
									>
										Authentication
									</div>
									<div style={{ fontWeight: '500' }}>OAuth 2.0 & OIDC</div>
								</div>
							</div>
						</div>
					</CollapsibleHeader>

					{/* Quick Access */}
					<StandardHeader
						title="Quick Access"
						description="Quick access to common OAuth flows and tools"
						icon="rocket-launch"
						isCollapsible={true}
						isCollapsed={collapsedSections.quickAccess}
						onToggle={() => toggleSection('quickAccess')}
					/>
					
					{!collapsedSections.quickAccess && (
						<div style={getGridStyle(4)}>
							<a href="/flows/oauth-authorization-code-v9" style={{ textDecoration: 'none' }}>
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
										<strong>OAuth Authorization Code V9</strong>
									</div>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: '0',
											fontSize: '0.875rem',
										}}
									>
										Authorization Code with PKCE (V9)
									</p>
								</div>
							</a>

							<a href="/flows/implicit-v9" style={{ textDecoration: 'none' }}>
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
											icon="eye"
											size={20}
											style={{ color: 'var(--pingone-brand-primary)' }}
										/>
										<strong>Implicit Flow V9</strong>
									</div>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: '0',
											fontSize: '0.875rem',
										}}
									>
										Implicit Grant Flow (V9)
									</p>
								</div>
							</a>

							<a href="/flows/device-authorization-v9" style={{ textDecoration: 'none' }}>
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
											icon="cellphone"
											size={20}
											style={{ color: 'var(--pingone-brand-primary)' }}
										/>
										<strong>Device Authorization V9</strong>
									</div>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: '0',
											fontSize: '0.875rem',
										}}
									>
										Device Code Grant (V9)
									</p>
								</div>
							</a>

							<a href="/flows/client-credentials-v9" style={{ textDecoration: 'none' }}>
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
											icon="server"
											size={20}
											style={{ color: 'var(--pingone-brand-primary)' }}
										/>
										<strong>Client Credentials V9</strong>
									</div>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: '0',
											fontSize: '0.875rem',
										}}
									>
										Client Credentials Grant (V9)
									</p>
								</div>
							</a>

							<a href="/flows/oidc-hybrid-v9" style={{ textDecoration: 'none' }}>
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
											icon="globe"
											size={20}
											style={{ color: 'var(--pingone-brand-primary)' }}
										/>
										<strong>OIDC Hybrid V9</strong>
									</div>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: '0',
											fontSize: '0.875rem',
										}}
									>
										OpenID Connect Hybrid (V9)
									</p>
								</div>
							</a>

							<a href="/flows/token-exchange-v9" style={{ textDecoration: 'none' }}>
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
											icon="swap-horizontal"
											size={20}
											style={{ color: 'var(--pingone-brand-primary)' }}
										/>
										<strong>Token Exchange V9</strong>
									</div>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: '0',
											fontSize: '0.875rem',
										}}
									>
										OAuth Token Exchange (V9)
									</p>
								</div>
							</a>

							<a href="/application-generator" style={{ textDecoration: 'none' }}>
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
											icon="cog"
											size={20}
											style={{ color: 'var(--pingone-brand-primary)' }}
										/>
										<strong>Application Generator</strong>
									</div>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: '0',
											fontSize: '0.875rem',
										}}
									>
										Create OAuth applications with step-by-step wizard
									</p>
								</div>
							</a>
						</div>
					)}

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
