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
import StandardHeader from '../components/StandardHeader';
import ViewModeControls from '../components/ViewModeControls';
import { useViewMode } from '../hooks/useViewMode';
import { type ActivityItem, getRecentActivity } from '../utils/activityTracker';
import BootstrapButton from '../components/bootstrap/BootstrapButton';
import { feedbackService } from '../services/feedback/feedbackService';
import '../styles/button-color-system.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/bootstrap/pingone-bootstrap.css';

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

const getHiddenHeaderStyle = () => ({
	padding: '0.5rem 0',
});

// ============================================================================
// DASHBOARD COMPONENT
// ============================================================================

const Dashboard: React.FC = () => {
	const initialSections = {
		pingOneApiStatus: false,
		quickAccess: false,
		oauthFlows: false,
		apiEndpoints: false,
		recentActivity: false,
	};
	
	const {
		viewMode,
		collapsedSections,
		toggleSection,
		expandAllSections,
		collapseAllSections,
	} = useViewMode(initialSections);
	
	const [serverStatus, setServerStatus] = useState({
		backend: 'checking',
		frontend: 'online',
	});
	const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [feedbackMessage, setFeedbackMessage] = useState<React.ReactElement | null>(null);

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

	// Debug: Log current state
	useEffect(() => {
		console.log('📊 Dashboard state:', { viewMode, collapsedSections });
	}, [viewMode, collapsedSections]);

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
			
			// Show success feedback
			setFeedbackMessage(
				feedbackService.showSuccessSnackbar('Dashboard refreshed successfully')
			);
		} catch (error) {
			console.error('Failed to refresh dashboard:', error);
			
			// Show error feedback
			setFeedbackMessage(
				feedbackService.showWarningSnackbar('Failed to refresh dashboard. Please try again.')
			);
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
								justifyContent: 'center',
								alignItems: 'center',
								gap: '0.5rem',
								marginBottom: '1.5rem',
							}}
						>
							<AppVersionBadge type="app" />
							<AppVersionBadge type="mfa" />
							<AppVersionBadge type="unified" />
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
							<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
								<AppVersionBadge />
								<ViewModeControls
									viewMode={viewMode}
									onExpandAll={expandAllSections}
									onCollapseAll={collapseAllSections}
									disabled={isRefreshing}
								/>
								<BootstrapButton
									onClick={refreshDashboard}
									variant="secondary"
									greyBorder={true}
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
					<StandardHeader
						title="PingOne API Configuration"
						description="Configure environment settings, feature flags, and API status monitoring"
						icon="cog"
						isCollapsible={true}
						isCollapsed={collapsedSections.pingOneApiStatus}
						onToggle={() => {
							console.log('🔧 Toggling pingOneApiStatus section');
							toggleSection('pingOneApiStatus');
						}}
						badge={{
							text: 'Active',
							variant: 'success'
						}}
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
					</StandardHeader>

					{/* Quick Access */}
					<StandardHeader
						title="Quick Access"
						description="Quick access to common OAuth flows and tools"
						icon="rocket-launch"
						isCollapsible={true}
						isCollapsed={collapsedSections.quickAccess}
						onToggle={() => {
							console.log('🚀 Toggling quickAccess section');
							toggleSection('quickAccess');
						}}
					/>
					
					{!collapsedSections.quickAccess && (
						<div style={getGridStyle(4)}>
							<a href="/flows/oauth-authorization-code-v8" style={{ textDecoration: 'none' }}>
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
										<strong>OAuth Authorization Code V8</strong>
									</div>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: '0',
											fontSize: '0.875rem',
										}}
									>
										Authorization Code with PKCE (V8)
									</p>
								</div>
							</a>

							<a href="/flows/implicit-v8" style={{ textDecoration: 'none' }}>
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
										<strong>Implicit Flow V8</strong>
									</div>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: '0',
											fontSize: '0.875rem',
										}}
									>
										Implicit Grant Flow (V8)
									</p>
								</div>
							</a>

							<a href="/flows/device-authorization-v7" style={{ textDecoration: 'none' }}>
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
										<strong>Device Authorization V7</strong>
									</div>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: '0',
											fontSize: '0.875rem',
										}}
									>
										Device Code Grant (V7)
									</p>
								</div>
							</a>

							<a href="/flows/client-credentials-v7" style={{ textDecoration: 'none' }}>
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
										<strong>Client Credentials V7</strong>
									</div>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: '0',
											fontSize: '0.875rem',
										}}
									>
										Client Credentials Grant (V7)
									</p>
								</div>
							</a>

							<a href="/flows/oidc-hybrid-v8" style={{ textDecoration: 'none' }}>
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
										<strong>OIDC Hybrid V8</strong>
									</div>
									<p
										style={{
											color: 'var(--pingone-text-secondary)',
											margin: '0',
											fontSize: '0.875rem',
										}}
									>
										OpenID Connect Hybrid (V8)
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
					<StandardHeader
						title="API Endpoints"
						description="Access OAuth and MFA flow endpoints for testing and development"
						icon="api"
						isCollapsible={true}
						isCollapsed={collapsedSections.apiEndpoints}
						onToggle={() => toggleSection('apiEndpoints')}
						badge={{
							text: 'Available',
							variant: 'primary'
						}}
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
					</StandardHeader>

					{/* Recent Activity */}
					<StandardHeader
						title="Recent Activity"
						description="Track recent OAuth flow executions, token exchanges, and API interactions"
						icon="history"
						isCollapsible={true}
						isCollapsed={collapsedSections.recentActivity}
						onToggle={() => toggleSection('recentActivity')}
						badge={{
							text: recentActivity.length > 0 ? recentActivity.length.toString() : 'None',
							variant: recentActivity.length > 0 ? 'default' : 'default'
						}}
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
					</StandardHeader>
				</div>
			</div>
			
			{/* Feedback messages */}
			{feedbackMessage && (
				<div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
					{feedbackMessage}
				</div>
			)}
		</div>
	);
};

export default Dashboard;
