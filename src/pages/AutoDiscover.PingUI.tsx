// src/pages/AutoDiscover.PingUI.tsx
// AutoDiscover Page - PingOne UI Version
// PingOne UI migration following pingui2.md standards

import React, { useState } from 'react';
import DiscoveryPanel from '../components/DiscoveryPanel';
import { usePageScroll } from '../hooks/usePageScroll';
import { OpenIDConfiguration } from '../services/discoveryService';
import { FlowHeader } from '../services/flowHeaderService';
import { credentialManager } from '../utils/credentialManager';
import { logger } from '../utils/logger';

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

// PingOne UI Styled Components (using inline styles with CSS variables)
const getContainerStyle = () => ({
	maxWidth: '1200px',
	margin: '0 auto',
	padding: 'var(--pingone-spacing-xl, 2rem)',
});

const getHeaderStyle = () => ({
	marginBottom: 'var(--pingone-spacing-xl, 2rem)',

	h1: {
		display: 'flex',
		alignItems: 'center',
		gap: 'var(--pingone-spacing-md, 0.75rem)',
		margin: '0 0 var(--pingone-spacing-sm, 0.5rem) 0',
		fontSize: 'var(--pingone-font-size-3xl, 2rem)',
		fontWeight: 'var(--pingone-font-weight-semibold, 600)',
		color: 'var(--pingone-text-primary, #1f2937)',
	},

	p: {
		margin: '0',
		color: 'var(--pingone-text-secondary, #6b7280)',
		fontSize: 'var(--pingone-font-size-lg, 1.1rem)',
		lineHeight: 'var(--pingone-line-height-relaxed, 1.6)',
	},
});

const getCardStyle = () => ({
	background: 'var(--pingone-surface-secondary, #f3f4f6)',
	border: '1px solid var(--pingone-border-primary, #d1d5db)',
	borderRadius: 'var(--pingone-border-radius-lg, 0.75rem)',
	padding: 'var(--pingone-spacing-xl, 1.5rem)',
	marginBottom: 'var(--pingone-spacing-xl, 2rem)',
	boxShadow: 'var(--pingone-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1))',
});

const getSectionTitleStyle = () => ({
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-sm, 0.5rem)',
	margin: '0 0 var(--pingone-spacing-md, 1rem) 0',
	fontSize: 'var(--pingone-font-size-lg, 1.1rem)',
	fontWeight: 'var(--pingone-font-weight-semibold, 600)',
	color: 'var(--pingone-text-primary, #374151)',
});

const getListStyle = () => ({
	margin: '0',
	paddingLeft: 'var(--pingone-spacing-xl, 1.5rem)',
	color: 'var(--pingone-text-secondary, #4b5563)',
	lineHeight: 'var(--pingone-line-height-relaxed, 1.6)',

	li: {
		marginBottom: 'var(--pingone-spacing-sm, 0.5rem)',
	},
});

const getButtonStyle = (variant: 'primary' | 'secondary' = 'primary') => ({
	display: 'inline-flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-sm, 0.5rem)',
	padding: 'var(--pingone-spacing-md, 0.75rem) var(--pingone-spacing-lg, 1.5rem)',
	background:
		variant === 'primary'
			? 'var(--pingone-brand-primary, #3b82f6)'
			: 'var(--pingone-surface-secondary, #f3f4f6)',
	color:
		variant === 'primary'
			? 'var(--pingone-text-inverse, white)'
			: 'var(--pingone-text-primary, #1f2937)',
	border: variant === 'secondary' ? '1px solid var(--pingone-border-primary, #d1d5db)' : 'none',
	borderRadius: 'var(--pingone-border-radius-md, 0.5rem)',
	fontSize: 'var(--pingone-font-size-base, 1rem)',
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	'&:hover': {
		background:
			variant === 'primary'
				? 'var(--pingone-brand-primary-dark, #2563eb)'
				: 'var(--pingone-surface-tertiary, #e5e7eb)',
		transform: 'translateY(-1px)',
		boxShadow: 'var(--pingone-shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1))',
	},
	'&:active': {
		transform: 'translateY(0)',
	},
});

const getSuccessStyle = () => ({
	background: 'var(--pingone-surface-success, #f0fdf4)',
	border: '1px solid var(--pingone-border-success, #bbf7d0)',
	color: 'var(--pingone-text-success, #166534)',
	padding: 'var(--pingone-spacing-md, 1rem)',
	borderRadius: 'var(--pingone-border-radius-md, 0.5rem)',
	marginTop: 'var(--pingone-spacing-md, 1rem)',
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-sm, 0.5rem)',
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
	boxShadow: 'var(--pingone-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1))',
});

const AutoDiscoverPingUI: React.FC = () => {
	// Centralized scroll management - ALL pages start at top
	usePageScroll({ pageName: 'OIDC Discovery', force: true });

	const [showDiscoveryPanel, setShowDiscoveryPanel] = useState(false);
	const [lastDiscovered, setLastDiscovered] = useState<{
		environmentId: string;
		timestamp: Date;
	} | null>(null);

	const handleConfigurationDiscovered = (config: OpenIDConfiguration, environmentId: string) => {
		try {
			// Save the discovered configuration to config credentials
			const success = credentialManager.saveConfigCredentials({
				environmentId: environmentId,
				clientId: '', // Will be filled in by user
				redirectUri: `${window.location.origin}/authz-callback`,
				scopes: ['openid', 'profile', 'email'],
				authEndpoint: config.authorization_endpoint,
				tokenEndpoint: config.token_endpoint,
				userInfoEndpoint: config.userinfo_endpoint,
				endSessionEndpoint: config.end_session_endpoint,
			});

			if (success) {
				setLastDiscovered({
					environmentId,
					timestamp: new Date(),
				});

				logger.success('AutoDiscover', 'Configuration saved successfully', {
					environmentId,
					authEndpoint: config.authorization_endpoint,
					tokenEndpoint: config.token_endpoint,
				});
			} else {
				logger.error('AutoDiscover', 'Failed to save discovered configuration');
			}
		} catch (error) {
			logger.error('AutoDiscover', 'Error saving configuration', error as Error);
		}
	};

	return (
		<div className="end-user-nano">
			<div style={getContainerStyle()}>
				<FlowHeader flowType="auto-discover" />

				{/* Header */}
				<div style={getHeaderStyle()}>
					<h1 style={getHeaderStyle().h1}>
						<MDIIcon icon="rocket-launch" size={32} title="Auto Discover" />
						Auto Discover
					</h1>
					<p style={getHeaderStyle().p}>
						Automatically discover and configure PingOne OpenID Connect endpoints using your
						Environment ID
					</p>
				</div>

				{/* How it works card */}
				<div style={getCardStyle()}>
					<h3 style={getSectionTitleStyle()}>
						<MDIIcon icon="information" size={20} title="Information" />
						How it works
					</h3>
					<ul style={getListStyle()}>
						<li>Enter your PingOne Environment ID</li>
						<li>Select your region (US, EU, CA, or AP)</li>
						<li>Click "Discover" to fetch the OpenID configuration</li>
						<li>The discovered endpoints will be automatically saved to your configuration</li>
						<li>You can then use these endpoints for OAuth flows</li>
					</ul>
				</div>

				{/* Action button */}
				<button
					type="button"
					onClick={() => setShowDiscoveryPanel(true)}
					style={getButtonStyle('primary')}
				>
					<MDIIcon icon="earth" size={20} />
					Start OIDC Discovery
				</button>

				{/* Success message */}
				{lastDiscovered && (
					<div style={getSuccessStyle()}>
						<MDIIcon icon="check-circle" size={20} title="Success" />
						Configuration discovered and saved for environment {lastDiscovered.environmentId}
						at {lastDiscovered.timestamp.toLocaleString()}
					</div>
				)}

				{/* Discovery panel modal */}
				{showDiscoveryPanel && (
					<DiscoveryPanel
						onConfigurationDiscovered={handleConfigurationDiscovered}
						onClose={() => setShowDiscoveryPanel(false)}
					/>
				)}
			</div>
		</div>
	);
};

export default AutoDiscoverPingUI;
