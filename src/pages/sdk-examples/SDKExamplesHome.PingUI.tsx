// src/pages/sdk-examples/SDKExamplesHome.PingUI.tsx
// SDK Examples Home Page - PingOne UI Version
// PingOne UI migration following pingui2.md standards

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGlobalWorkerToken } from '@/hooks/useGlobalWorkerToken';
import { ShowTokenConfigCheckboxV8 } from '@/v8/components/ShowTokenConfigCheckboxV8';
import { SilentApiConfigCheckboxV8 } from '@/v8/components/SilentApiConfigCheckboxV8';
import {
	ApiDisplayCheckbox,
	SuperSimpleApiDisplayV8,
} from '@/v8/components/SuperSimpleApiDisplayV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';

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
	padding: '2rem',
	maxWidth: '1200px',
	margin: '0 auto',
	background: 'var(--pingone-surface-background)',
	minHeight: '100vh',
});

const getHeaderStyle = () => ({
	color: 'var(--pingone-text-primary)',
	marginBottom: '2rem',
	fontSize: '2.5rem',
	fontWeight: '600',
});

const getDescriptionStyle = () => ({
	color: 'var(--pingone-text-secondary)',
	marginBottom: '3rem',
	fontSize: '1.1rem',
	lineHeight: '1.6',
});

const getExamplesGridStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
	gap: '2rem',
	marginBottom: '3rem',
});

const getExampleCardStyle = () => ({
	background: 'var(--pingone-surface-card)',
	borderRadius: '0.75rem',
	padding: '2rem',
	boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
	border: '1px solid var(--pingone-border-primary)',
	transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
	'&:hover': {
		transform: 'translateY(-2px)',
		boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
	},
});

const getExampleTitleStyle = () => ({
	color: 'var(--pingone-text-primary)',
	marginBottom: '1rem',
	fontSize: '1.5rem',
	fontWeight: '600',
});

const getExampleDescriptionStyle = () => ({
	color: 'var(--pingone-text-secondary)',
	marginBottom: '1.5rem',
	lineHeight: '1.5',
});

const getExampleLinkStyle = () => ({
	display: 'inline-flex',
	alignItems: 'center',
	gap: '0.5rem',
	background: 'var(--pingone-brand-primary)',
	color: 'var(--pingone-text-inverse)',
	padding: '0.875rem 1.75rem',
	borderRadius: '0.375rem',
	textDecoration: 'none',
	fontWeight: '500',
	fontSize: '0.95rem',
	transition: 'all 0.15s ease-in-out',
	border: 'none',
	cursor: 'pointer',
	'&:hover': {
		background: 'var(--pingone-brand-primary-dark)',
		color: 'var(--pingone-text-inverse)',
		transform: 'translateY(-1px)',
		boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
	},
	'&:active': {
		transform: 'translateY(0)',
	},
});

const getStatusBadgeStyle = (status: 'implemented' | 'planned') => ({
	display: 'inline-block',
	padding: '0.25rem 0.75rem',
	borderRadius: '12px',
	fontSize: '0.75rem',
	fontWeight: '500',
	textTransform: 'uppercase',
	marginBottom: '1rem',
	background:
		status === 'implemented' ? 'var(--pingone-surface-success)' : 'var(--pingone-surface-tertiary)',
	color: status === 'implemented' ? 'var(--pingone-text-success)' : 'var(--pingone-text-tertiary)',
});

const getDocumentationSectionStyle = () => ({
	background: 'var(--pingone-surface-card)',
	borderRadius: '0.75rem',
	padding: '2rem',
	border: '1px solid var(--pingone-border-primary)',
});

const getDocumentationTitleStyle = () => ({
	color: 'var(--pingone-text-primary)',
	fontSize: '1.25rem',
	fontWeight: '600',
	marginBottom: '1rem',
});

const getDocumentationListStyle = () => ({
	display: 'grid',
	gap: '1rem',
});

const getDocumentationItemStyle = () => ({
	padding: '1rem',
	background: 'var(--pingone-surface-secondary)',
	borderRadius: '0.375rem',
	border: '1px solid var(--pingone-border-primary)',
});

const getDocumentationLinkStyle = () => ({
	color: 'var(--pingone-brand-primary)',
	textDecoration: 'none',
	fontWeight: '500',
	'&:hover': {
		textDecoration: 'underline',
	},
});

const SDKExamplesHomePingUI: React.FC = () => {
	const [showApiDisplay, setShowApiDisplay] = useState(true);
	const [showTokenConfig, setShowTokenConfig] = useState(false);
	const [showSilentApiConfig, setShowSilentApiConfig] = useState(false);

	const globalTokenStatus = useGlobalWorkerToken();

	// Check if worker token is available
	const hasWorkerToken = globalTokenStatus?.isValid || false;

	return (
		<div className="end-user-nano">
			<div style={getContainerStyle()}>
				{/* Header */}
				<h1 style={getHeaderStyle()}>
					<MDIIcon icon="code" size={40} style={{ marginRight: '1rem' }} />
					PingOne SDK Examples
				</h1>

				{/* Description */}
				<p style={getDescriptionStyle()}>
					Explore comprehensive SDK examples demonstrating PingOne integration patterns,
					authentication flows, and best practices for building secure identity solutions.
				</p>

				{/* Configuration Options */}
				<div style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
					<ApiDisplayCheckbox
						checked={showApiDisplay}
						onChange={setShowApiDisplay}
						label="Show API Display"
					/>
					<ShowTokenConfigCheckboxV8 checked={showTokenConfig} onChange={setShowTokenConfig} />
					<SilentApiConfigCheckboxV8
						checked={showSilentApiConfig}
						onChange={setShowSilentApiConfig}
					/>
				</div>

				{/* Examples Grid */}
				<div style={getExamplesGridStyle()}>
					{/* DaVinci Todo App */}
					<div style={getExampleCardStyle()}>
						<span style={getStatusBadgeStyle('implemented')}>Implemented</span>
						<h3 style={getExampleTitleStyle()}>DaVinci Todo App</h3>
						<p style={getExampleDescriptionStyle()}>
							Complete full-stack application demonstrating user authentication, token management,
							and secure API integration with a modern React frontend and Node.js backend.
						</p>
						<Link to="/sdk-examples/davinci-todo-app" style={getExampleLinkStyle()}>
							<MDIIcon icon="application" size={20} />
							Explore Todo App
						</Link>
					</div>

					{/* JWT Authentication */}
					<div style={getExampleCardStyle()}>
						<span style={getStatusBadgeStyle('implemented')}>Implemented</span>
						<h3 style={getExampleTitleStyle()}>JWT Authentication</h3>
						<p style={getExampleDescriptionStyle()}>
							Complete JWT implementation with private key and client secret JWT generation, token
							validation, and secure key management using the jose library.
						</p>
						<Link to="/sdk-examples/jwt-authentication" style={getExampleLinkStyle()}>
							<MDIIcon icon="key" size={20} />
							Explore JWT Examples
						</Link>
					</div>

					{/* OIDC Centralized Login */}
					<div style={getExampleCardStyle()}>
						<span style={getStatusBadgeStyle('implemented')}>Implemented</span>
						<h3 style={getExampleTitleStyle()}>OIDC Centralized Login</h3>
						<p style={getExampleDescriptionStyle()}>
							Demonstrate server-side UI authentication using the PingOne OIDC SDK with redirect
							flows, background token renewal, and secure session management.
						</p>
						<Link to="/sdk-examples/oidc-centralized-login" style={getExampleLinkStyle()}>
							<MDIIcon icon="login" size={20} />
							Explore OIDC Examples
						</Link>
					</div>

					{/* SDK Documentation */}
					<div style={getExampleCardStyle()}>
						<span style={getStatusBadgeStyle('implemented')}>Implemented</span>
						<h3 style={getExampleTitleStyle()}>SDK Documentation</h3>
						<p style={getExampleDescriptionStyle()}>
							Comprehensive documentation, usage guides, and best practices for implementing PingOne
							SDKs in your applications.
						</p>
						<Link to="/sdk-examples/documentation" style={getExampleLinkStyle()}>
							<MDIIcon icon="book" size={20} />
							View Documentation
						</Link>
					</div>
				</div>

				{/* API Display - Using the unified service */}
				{showApiDisplay && <SuperSimpleApiDisplayV8 flowFilter="all" reserveSpace={true} />}

				{/* Documentation Section */}
				<div style={getDocumentationSectionStyle()}>
					<h3 style={getDocumentationTitleStyle()}>
						<MDIIcon icon="book-open" size={24} style={{ marginRight: '0.5rem' }} />
						SDK Documentation
					</h3>
					<div style={getDocumentationListStyle()}>
						<div style={getDocumentationItemStyle()}>
							<a
								href="https://docs.pingidentity.com/sdks/latest/"
								target="_blank"
								rel="noopener noreferrer"
								style={getDocumentationLinkStyle()}
							>
								<MDIIcon icon="external-link" size={16} style={{ marginRight: '0.5rem' }} />
								PingOne SDK Documentation - Official PingOne SDK documentation
							</a>
						</div>
						<div style={getDocumentationItemStyle()}>
							<a
								href="https://github.com/pingidentity/pingone-nodejs-sdk"
								target="_blank"
								rel="noopener noreferrer"
								style={getDocumentationLinkStyle()}
							>
								<MDIIcon icon="github" size={16} style={{ marginRight: '0.5rem' }} />
								PingOne Node.js SDK - GitHub repository with examples and API reference
							</a>
						</div>
						<div style={getDocumentationItemStyle()}>
							<a
								href="https://apidocs.pingidentity.com/pingone/platform/v1/api/"
								target="_blank"
								rel="noopener noreferrer"
								style={getDocumentationLinkStyle()}
							>
								<MDIIcon icon="api" size={16} style={{ marginRight: '0.5rem' }} />
								PingOne Platform API - Complete API documentation and interactive explorer
							</a>
						</div>
					</div>
				</div>

				{/* Worker Token Modal */}
				{!hasWorkerToken && <WorkerTokenModalV8 />}
			</div>
		</div>
	);
};

export default SDKExamplesHomePingUI;
