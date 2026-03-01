/**
 * @file UnifiedEducationalContent.tsx
 * @description Educational content components for Unified flows
 * @author OAuth Playground Team
 * @version 1.0.0
 * @since 2026-01-25
 */

import { FiAlertTriangle, FiChevronDown, FiInfo } from '@icons';
import React from 'react';
import { useUnifiedFlowStore } from '../../services/UnifiedFlowStateManager';

// Educational section styles
const sectionStyle: React.CSSProperties = {
	border: '1px solid #e2e8f0',
	borderRadius: '0.75rem',
	marginBottom: '1.5rem',
	backgroundColor: '#ffffff',
	boxShadow: '0 10px 20px rgba(15, 23, 42, 0.05)',
};

const headerButtonStyle: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	width: '100%',
	padding: '1.5rem 1.75rem',
	background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%)',
	border: '3px solid transparent',
	borderRadius: '1rem',
	cursor: 'pointer',
	fontSize: '1.2rem',
	fontWeight: '700',
	color: '#14532d',
	transition: 'all 0.3s ease',
	position: 'relative',
};

const contentStyle: React.CSSProperties = {
	padding: '0 1.75rem 1.75rem',
};

const infoBoxStyle: React.CSSProperties = {
	display: 'flex',
	alignItems: 'flex-start',
	gap: '1rem',
	padding: '1rem',
	borderRadius: '0.5rem',
	margin: '1rem 0',
	backgroundColor: '#f0f9ff',
	border: '1px solid #bae6fd',
};

const warningBoxStyle: React.CSSProperties = {
	display: 'flex',
	alignItems: 'flex-start',
	gap: '1rem',
	padding: '1rem',
	borderRadius: '0.5rem',
	margin: '1rem 0',
	backgroundColor: '#fffbeb',
	border: '1px solid #fed7aa',
};

const iconStyle: React.CSSProperties = {
	flexShrink: 0,
	marginTop: '0.125rem',
};

const contentTextStyle: React.CSSProperties = {
	flex: 1,
};

const titleStyle: React.CSSProperties = {
	fontWeight: '600',
	marginBottom: '0.5rem',
	color: '#1e293b',
};

const textStyle: React.CSSProperties = {
	color: '#475569',
	lineHeight: '1.6',
};

interface EducationalSectionProps {
	title: string;
	children: React.ReactNode;
	sectionKey: string;
	isCollapsed?: boolean;
	onToggle?: () => void;
}

export const EducationalSection: React.FC<EducationalSectionProps> = ({
	title,
	children,
	sectionKey,
	isCollapsed = false,
	onToggle,
}) => {
	const toggleSection = useUnifiedFlowStore((state) => state.toggleSection);
	const collapsed = useUnifiedFlowStore(
		(state) => state.collapsedSections[sectionKey] ?? isCollapsed
	);

	const handleToggle = () => {
		toggleSection(sectionKey);
		onToggle?.();
	};

	return (
		<section style={sectionStyle}>
			<button type="button" style={headerButtonStyle} onClick={handleToggle}>
				<span>{title}</span>
				<FiChevronDown
					size={16}
					style={{
						transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
						transition: 'transform 0.2s ease',
					}}
				/>
			</button>
			{!collapsed && <div style={contentStyle}>{children}</div>}
		</section>
	);
};

interface InfoBoxProps {
	title: string;
	children: React.ReactNode;
	variant?: 'info' | 'warning';
}

export const InfoBox: React.FC<InfoBoxProps> = ({ title, children, variant = 'info' }) => {
	const style = variant === 'warning' ? warningBoxStyle : infoBoxStyle;
	const Icon = variant === 'warning' ? FiAlertTriangle : FiInfo;

	return (
		<div style={style}>
			<Icon size={20} style={iconStyle} />
			<div style={contentTextStyle}>
				<div style={titleStyle}>{title}</div>
				<div style={textStyle}>{children}</div>
			</div>
		</div>
	);
};

// Quick Start Guide Component
export const QuickStartGuide: React.FC = () => (
	<EducationalSection title="Quick Start Guide" sectionKey="quickStart">
		<h4>Getting Started with OAuth 2.0</h4>
		<p>
			This interactive playground helps you understand OAuth 2.0 and OpenID Connect flows through
			hands-on experimentation.
		</p>
		<ol style={{ paddingLeft: '1.5rem', margin: '1rem 0' }}>
			<li>Configure your application credentials</li>
			<li>Generate authorization requests</li>
			<li>Handle callbacks and token exchanges</li>
			<li>Make authenticated API calls</li>
			<li>Explore token introspection</li>
		</ol>
		<InfoBox title="Learning Objectives">
			By the end of this tutorial, you'll understand how OAuth 2.0 flows work, how to implement them
			securely, and best practices for token management.
		</InfoBox>
	</EducationalSection>
);

// PKCE Tutorial Component
export const PKCETutorial: React.FC = () => (
	<EducationalSection title="PKCE (Proof Key for Code Exchange)" sectionKey="pkceOverview">
		<h4>Understanding PKCE</h4>
		<p>
			PKCE (pronounced "pixy") is an extension to the Authorization Code flow that prevents
			authorization code interception attacks.
		</p>
		<div
			style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', margin: '1rem 0' }}
		>
			<h5>How PKCE Works:</h5>
			<ol style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
				<li>
					<strong>Generate</strong> a code verifier (random string)
				</li>
				<li>
					<strong>Create</strong> a code challenge (hash of verifier)
				</li>
				<li>
					<strong>Send</strong> challenge in authorization request
				</li>
				<li>
					<strong>Prove</strong> possession of verifier in token exchange
				</li>
			</ol>
		</div>
		<InfoBox title="Security Best Practice" variant="warning">
			PKCE is now recommended for all OAuth 2.0 flows, even server-side applications, as it provides
			additional security with minimal complexity.
		</InfoBox>
	</EducationalSection>
);

// Token Security Best Practices Component
export const TokenSecurityBestPractices: React.FC = () => (
	<EducationalSection title="Token Security Best Practices" sectionKey="tokenSecurity">
		<h4>Securing Your Tokens</h4>
		<div style={{ display: 'grid', gap: '1rem', margin: '1rem 0' }}>
			<div style={{ border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '0.5rem' }}>
				<h5 style={{ margin: '0 0 0.5rem 0', color: '#059669' }}>✅ Do</h5>
				<ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
					<li>Store tokens in secure HTTP-only cookies</li>
					<li>Use short-lived access tokens</li>
					<li>Implement proper token revocation</li>
					<li>Validate tokens on each use</li>
					<li>Use HTTPS for all token requests</li>
				</ul>
			</div>
			<div style={{ border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '0.5rem' }}>
				<h5 style={{ margin: '0 0 0.5rem 0', color: '#dc2626' }}>❌ Don't</h5>
				<ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
					<li>Store tokens in localStorage</li>
					<li>Include tokens in URLs</li>
					<li>Use long-lived tokens</li>
					<li>Ignore token expiration</li>
					<li>Send tokens over HTTP</li>
				</ul>
			</div>
		</div>
		<InfoBox title="Defense in Depth">
			Combine multiple security measures: PKCE, HTTPS, secure storage, and proper token validation
			to create a robust OAuth implementation.
		</InfoBox>
	</EducationalSection>
);

// Flow-specific educational components
export const ImplicitFlowEducation: React.FC = () => (
	<EducationalSection title="Implicit Flow - Educational Purpose" sectionKey="implicitOverview">
		<h4>OAuth 2.0 / OIDC Implicit Flow</h4>
		<p>
			<strong>This flow is included for educational purposes.</strong> The Implicit Flow (RFC 6749
			Section 4.2) is
			<strong> deprecated in OAuth 2.1</strong> (draft) and should not be used for new applications.
			However, it is useful for understanding deprecated patterns.
		</p>
		<InfoBox title="When to Use Implicit Flow (Educational Purpose)" variant="warning">
			<ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
				<li>
					<strong>Legacy SPAs:</strong> Existing applications that haven't migrated yet
				</li>
				<li>
					<strong>Educational Purposes:</strong> Understanding deprecated patterns
				</li>
				<li>
					<strong>Historical Context:</strong> OAuth history and evolution
				</li>
			</ul>
		</InfoBox>
	</EducationalSection>
);

export const AuthorizationCodeEducation: React.FC = () => (
	<EducationalSection title="Authorization Code Flow" sectionKey="authzCodeOverview">
		<h4>OAuth 2.0 Authorization Code Flow</h4>
		<p>
			The Authorization Code flow is the most secure and widely used OAuth 2.0 flow. It provides the
			highest level of security by using temporary authorization codes and requiring client
			authentication for token exchange.
		</p>
		<InfoBox title="Security Benefits">
			<ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
				<li>
					<strong>Authorization Code:</strong> Temporary code, not direct token exposure
				</li>
				<li>
					<strong>PKCE Support:</strong> Additional protection for public clients
				</li>
				<li>
					<strong>Client Authentication:</strong> Confidential clients authenticate themselves
				</li>
				<li>
					<strong>Refresh Tokens:</strong> Long-lived tokens for session management
				</li>
			</ul>
		</InfoBox>
	</EducationalSection>
);

export const ClientCredentialsEducation: React.FC = () => (
	<EducationalSection title="Client Credentials Flow" sectionKey="clientCredentialsOverview">
		<h4>OAuth 2.0 Client Credentials Flow</h4>
		<p>
			The Client Credentials flow is used for machine-to-machine communication where there's no user
			interaction. The client authenticates directly with the authorization server using its client
			credentials.
		</p>
		<InfoBox title="Use Cases">
			<ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
				<li>
					<strong>Backend Services:</strong> Service-to-service communication
				</li>
				<li>
					<strong>API Access:</strong> Programmatic access without user context
				</li>
				<li>
					<strong>Batch Processing:</strong> Automated data processing
				</li>
				<li>
					<strong>System Integration:</strong> Connecting different systems
				</li>
			</ul>
		</InfoBox>
	</EducationalSection>
);

export const DeviceCodeEducation: React.FC = () => (
	<EducationalSection title="Device Authorization Flow" sectionKey="deviceCodeOverview">
		<h4>OAuth 2.0 Device Authorization Flow (RFC 8628)</h4>
		<p>
			The Device Authorization flow enables OAuth 2.0 on devices with limited input capabilities or
			without a web browser. Users authorize the device on a separate device (like a phone) and the
			device polls for the token.
		</p>
		<InfoBox title="Device Types">
			<ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
				<li>
					<strong>Smart TVs:</strong> Streaming apps on television
				</li>
				<li>
					<strong>IoT Devices:</strong> Internet of Things devices
				</li>
				<li>
					<strong>Consoles:</strong> Gaming systems
				</li>
				<li>
					<strong>Printers:</strong> Network printers
				</li>
			</ul>
		</InfoBox>
	</EducationalSection>
);

export const HybridFlowEducation: React.FC = () => (
	<EducationalSection title="Hybrid Flow" sectionKey="hybridOverview">
		<h4>OpenID Connect Hybrid Flow</h4>
		<p>
			The Hybrid flow combines features of Authorization Code and Implicit flows. It returns an
			authorization code and some tokens in the same response, providing immediate access to user
			information while maintaining the security of the authorization code exchange.
		</p>
		<InfoBox title="Hybrid Flow Benefits">
			<ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
				<li>
					<strong>Immediate Access:</strong> ID Token available immediately
				</li>
				<li>
					<strong>Security:</strong> Access token still requires code exchange
				</li>
				<li>
					<strong>Flexibility:</strong> Best of both flows
				</li>
				<li>
					<strong>Performance:</strong> Reduced round trips for user info
				</li>
			</ul>
		</InfoBox>
	</EducationalSection>
);

// Main educational content container
export const UnifiedEducationalContent: React.FC = () => {
	const flowType = useUnifiedFlowStore((state) => state.flowType);

	return (
		<>
			<QuickStartGuide />
			<PKCETutorial />
			<TokenSecurityBestPractices />

			{/* Flow-specific educational content */}
			{flowType === 'implicit' && <ImplicitFlowEducation />}
			{flowType === 'oauth-authz' && <AuthorizationCodeEducation />}
			{flowType === 'client-credentials' && <ClientCredentialsEducation />}
			{flowType === 'device-code' && <DeviceCodeEducation />}
			{flowType === 'hybrid' && <HybridFlowEducation />}
		</>
	);
};
