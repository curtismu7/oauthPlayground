/**
 * @file OAuthFlows.PingUI.tsx
 * @module pages
 * @description OAuth flows selection page with PingOne UI styling
 * @version 9.6.5
 * @since 2026-02-22
 *
 * This component provides the OAuth flows selection page with PingOne UI design system,
 * including MDI icons, CSS variables, and modern styling patterns.
 */

import { useState } from 'react';
import { useAuth } from '../contexts/NewAuthContext';
import type { OAuthFlow } from '../types/oauthFlows';

// ============================================================================
// MDI ICON COMPONENT
// ============================================================================

const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 24, className = '', style }) => {
	return <span className={`mdi mdi-${icon} ${className}`} style={{ fontSize: size, ...style }} />;
};

// ============================================================================
// STYLE FUNCTIONS
// ============================================================================

const getFlowsContainerStyle = () => ({
	maxWidth: '1200px',
	margin: '0 auto',
	padding: '1.5rem',
});

const getPageHeaderStyle = () => ({
	marginBottom: '2rem',
});

const getTitleStyle = () => ({
	fontSize: '2rem',
	fontWeight: '600',
	color: 'var(--pingone-text-primary)',
	marginBottom: '0.5rem',
	display: 'flex',
	alignItems: 'center',
	gap: '0.75rem',
});

const getSubtitleStyle = () => ({
	color: 'var(--pingone-text-secondary)',
	fontSize: '1.1rem',
	margin: 0,
});

const getFlowsGridStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
	gap: '1.5rem',
	marginTop: '2rem',
});

const getFlowCardStyle = (isActive: boolean = false) => ({
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	border: '2px solid transparent',
	background: 'var(--pingone-surface-card)',
	borderRadius: '0.75rem',
	padding: '1.5rem',
	boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
	textAlign: 'left' as const,
	...(isActive && {
		borderColor: 'var(--pingone-brand-primary)',
		background: 'var(--pingone-brand-primary-light)',
	}),
	'&:hover': {
		transform: 'translateY(-2px)',
		boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
		borderColor: 'var(--pingone-brand-primary)',
	},
});

const getFlowHeaderStyle = () => ({
	display: 'flex',
	alignItems: 'center',
	gap: '0.75rem',
	marginBottom: '1rem',
});

const getFlowTitleStyle = () => ({
	fontSize: '1.25rem',
	fontWeight: '600',
	color: 'var(--pingone-text-primary)',
	margin: 0,
});

const getFlowDescriptionStyle = () => ({
	color: 'var(--pingone-text-secondary)',
	margin: '0.5rem 0',
	lineHeight: '1.5',
});

const getFlowMetaStyle = () => ({
	display: 'flex',
	alignItems: 'center',
	gap: '1rem',
	marginTop: '1rem',
	paddingTop: '1rem',
	borderTop: '1px solid var(--pingone-border-primary)',
});

const getMetaItemStyle = () => ({
	display: 'flex',
	alignItems: 'center',
	gap: '0.5rem',
	color: 'var(--pingone-text-tertiary)',
	fontSize: '0.875rem',
});

const getBadgeStyle = (variant: 'primary' | 'secondary' = 'primary') => ({
	padding: '0.25rem 0.75rem',
	borderRadius: '1rem',
	fontSize: '0.75rem',
	fontWeight: '600',
	display: 'inline-block',
	...(variant === 'primary'
		? {
				background: 'var(--pingone-brand-primary)',
				color: 'var(--pingone-text-inverse)',
			}
		: {
				background: 'var(--pingone-surface-secondary)',
				color: 'var(--pingone-text-primary)',
				border: '1px solid var(--pingone-border-primary)',
			}),
});

// ============================================================================
// OAUTH FLOWS COMPONENT
// ============================================================================

const OAuthFlows: React.FC = () => {
	const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
	const { user } = useAuth();

	// Define OAuth flows with proper interface
	const flows: (OAuthFlow & { path: string; difficulty: string; duration: string })[] = [
		{
			id: 'unified-v8u',
			title: 'Unified OAuth V8U',
			icon: <MDIIcon icon="rocket-launch" size={24} />,
			description:
				'Complete OAuth 2.0 and OIDC flow with device registration, MFA, and advanced features',
			path: '/v8u/unified/oauth-authz/0',
			useCases: [
				{
					title: 'Enterprise Authentication',
					description: 'Complete enterprise-grade authentication with MFA and device registration',
				},
			],
			steps: [
				{
					title: 'Configure Credentials',
					description: 'Set up your PingOne environment and OAuth application',
				},
				{
					title: 'Authorization Flow',
					description: 'Execute the complete OAuth 2.0 authorization code flow',
				},
				{
					title: 'Token Exchange',
					description: 'Exchange authorization code for access and ID tokens',
				},
			],
			recommended: true,
			security: 'high',
			complexity: 'high',
			difficulty: 'Advanced',
			duration: '5-10 min',
		},
		{
			id: 'authorization-code-v7',
			title: 'Authorization Code Flow V7',
			icon: <MDIIcon icon="key" size={24} />,
			description: 'Classic OAuth 2.0 authorization code flow with PKCE support',
			path: '/v7/authorization-code',
			useCases: [
				{
					title: 'Web Application Authentication',
					description: 'Secure authentication for web applications using authorization code',
				},
			],
			steps: [
				{
					title: 'Authorization Request',
					description: 'Redirect user to authorization server',
				},
				{
					title: 'Code Exchange',
					description: 'Exchange authorization code for tokens',
				},
			],
			recommended: false,
			security: 'high',
			complexity: 'medium',
			difficulty: 'Intermediate',
			duration: '3-5 min',
		},
		{
			id: 'implicit-flow',
			title: 'Implicit Flow',
			icon: <MDIIcon icon="eye" size={24} />,
			description: 'OAuth 2.0 implicit flow (deprecated, for educational purposes)',
			path: '/flows/implicit',
			useCases: [
				{
					title: 'Legacy Applications',
					description: 'Educational purposes for understanding OAuth evolution',
				},
			],
			steps: [
				{
					title: 'Direct Token Issuance',
					description: 'Tokens issued directly in redirect URI',
				},
			],
			recommended: false,
			security: 'low',
			complexity: 'low',
			difficulty: 'Beginner',
			duration: '2-3 min',
		},
		{
			id: 'client-credentials',
			title: 'Client Credentials Flow',
			icon: <MDIIcon icon="server" size={24} />,
			description: 'OAuth 2.0 client credentials flow for service-to-service authentication',
			path: '/flows/client-credentials',
			useCases: [
				{
					title: 'Service-to-Service',
					description: 'Machine-to-machine authentication',
				},
			],
			steps: [
				{
					title: 'Client Authentication',
					description: 'Authenticate client with client credentials',
				},
			],
			recommended: false,
			security: 'medium',
			complexity: 'medium',
			difficulty: 'Intermediate',
			duration: '2-3 min',
		},
		{
			id: 'ropc',
			title: 'Resource Owner Password Credentials',
			icon: <MDIIcon icon="lock" size={24} />,
			description: 'OAuth 2.0 ROPC flow (use with caution, not recommended for production)',
			path: '/flows/ropc',
			useCases: [
				{
					title: 'Legacy Systems',
					description: 'For systems where direct credential handling is required',
				},
			],
			steps: [
				{
					title: 'Direct Authentication',
					description: 'Exchange user credentials directly for tokens',
				},
			],
			recommended: false,
			security: 'low',
			complexity: 'low',
			difficulty: 'Beginner',
			duration: '2-3 min',
		},
		{
			id: 'device-code',
			title: 'Device Code Flow',
			icon: <MDIIcon icon="devices" size={24} />,
			description: 'OAuth 2.0 device authorization flow for input-constrained devices',
			path: '/flows/device-code',
			useCases: [
				{
					title: 'IoT Devices',
					description: 'Authentication for devices with limited input capabilities',
				},
			],
			steps: [
				{
					title: 'Device Code Request',
					description: 'Request device code from authorization server',
				},
				{
					title: 'User Authentication',
					description: 'User authenticates on separate device',
				},
			],
			recommended: false,
			security: 'high',
			complexity: 'medium',
			difficulty: 'Intermediate',
			duration: '5-8 min',
		},
	];

	const handleFlowSelect = (flow: (typeof flows)[0]) => {
		setSelectedFlow(flow.id);
		// Navigate to the flow
		window.location.href = flow.path;
	};

	return (
		<div className="end-user-nano">
			<div style={getFlowsContainerStyle()}>
				{/* Page Header */}
				<div style={getPageHeaderStyle()}>
					<h1 style={getTitleStyle()}>
						<MDIIcon icon="shield-account" size={32} />
						OAuth 2.0 & OIDC Flows
					</h1>
					<p style={getSubtitleStyle()}>
						Explore different OAuth 2.0 and OpenID Connect flows with real PingOne APIs
					</p>
				</div>

				{/* User Welcome */}
				{user && (
					<div
						style={{
							background: 'var(--pingone-surface-secondary)',
							border: '1px solid var(--pingone-border-primary)',
							borderRadius: '0.75rem',
							padding: '1rem',
							marginBottom: '2rem',
							display: 'flex',
							alignItems: 'center',
							gap: '0.75rem',
						}}
					>
						<MDIIcon icon="account-check" size={20} style={{ color: 'var(--pingone-success)' }} />
						<span style={{ color: 'var(--pingone-text-primary)' }}>
							Welcome back, {user.name || user.email}! Ready to explore OAuth flows?
						</span>
					</div>
				)}

				{/* Flows Grid */}
				<div style={getFlowsGridStyle()}>
					{flows.map((flow) => (
						<button
							key={flow.id}
							style={getFlowCardStyle(selectedFlow === flow.id)}
							onClick={() => handleFlowSelect(flow)}
							type="button"
						>
							{/* Flow Header */}
							<div style={getFlowHeaderStyle()}>
								<div style={{ color: 'var(--pingone-brand-primary)' }}>{flow.icon}</div>
								<div style={{ flex: 1 }}>
									<h3 style={getFlowTitleStyle()}>{flow.title}</h3>
									{flow.recommended && <span style={getBadgeStyle('primary')}>Recommended</span>}
								</div>
							</div>

							{/* Flow Description */}
							<p style={getFlowDescriptionStyle()}>{flow.description}</p>

							{/* Flow Meta */}
							<div style={getFlowMetaStyle()}>
								<div style={getMetaItemStyle()}>
									<MDIIcon icon="school" size={16} />
									<span>{flow.difficulty}</span>
								</div>
								<div style={getMetaItemStyle()}>
									<MDIIcon icon="clock" size={16} />
									<span>{flow.duration}</span>
								</div>
								<div style={getMetaItemStyle()}>
									<MDIIcon icon="shield" size={16} />
									<span style={{ textTransform: 'capitalize' }}>{flow.security} Security</span>
								</div>
							</div>
						</button>
					))}
				</div>

				{/* Additional Information */}
				<div
					style={{
						marginTop: '3rem',
						padding: '1.5rem',
						background: 'var(--pingone-surface-secondary)',
						borderRadius: '0.75rem',
						border: '1px solid var(--pingone-border-primary)',
					}}
				>
					<h3
						style={{
							fontSize: '1.25rem',
							fontWeight: '600',
							color: 'var(--pingone-text-primary)',
							marginBottom: '1rem',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
						}}
					>
						<MDIIcon icon="information" size={20} />
						About OAuth Flows
					</h3>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
							gap: '1rem',
						}}
					>
						<div>
							<h4
								style={{
									fontSize: '1rem',
									fontWeight: '600',
									color: 'var(--pingone-text-primary)',
									marginBottom: '0.5rem',
								}}
							>
								What is OAuth 2.0?
							</h4>
							<p
								style={{
									color: 'var(--pingone-text-secondary)',
									margin: 0,
									lineHeight: '1.5',
								}}
							>
								OAuth 2.0 is an authorization framework that enables applications to obtain limited
								access to user accounts on an HTTP service.
							</p>
						</div>
						<div>
							<h4
								style={{
									fontSize: '1rem',
									fontWeight: '600',
									color: 'var(--pingone-text-primary)',
									marginBottom: '0.5rem',
								}}
							>
								What is OpenID Connect?
							</h4>
							<p
								style={{
									color: 'var(--pingone-text-secondary)',
									margin: 0,
									lineHeight: '1.5',
								}}
							>
								OpenID Connect (OIDC) is an authentication layer built on top of OAuth 2.0 that
								provides identity verification.
							</p>
						</div>
						<div>
							<h4
								style={{
									fontSize: '1rem',
									fontWeight: '600',
									color: 'var(--pingone-text-primary)',
									marginBottom: '0.5rem',
								}}
							>
								Why PingOne?
							</h4>
							<p
								style={{
									color: 'var(--pingone-text-secondary)',
									margin: 0,
									lineHeight: '1.5',
								}}
							>
								PingOne provides enterprise-grade identity and access management with advanced
								security features and global scalability.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default OAuthFlows;
