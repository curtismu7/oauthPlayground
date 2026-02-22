/**
 * @file PingIdentityHero.PingUI.tsx
 * @module protect-portal/components
 * @description PingIdentity hero section for identity and access management - Ping UI version
 * @version 9.6.5
 * @since 2026-02-16
 *
 * This component provides a PingIdentity-style hero section that showcases
 * identity and access management capabilities with enterprise security features.
 */

import React from 'react';

// MDI Icon component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	'aria-label'?: string;
	'aria-hidden'?: boolean;
}> = ({ icon, size = 24, className = '', 'aria-label': ariaLabel, 'aria-hidden': ariaHidden }) => {
	const style: React.CSSProperties = {
		width: size,
		height: size,
		fontSize: size,
		lineHeight: 1,
	};

	return (
		<span
			role="img"
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
			className={`mdi mdi-${icon} ${className}`}
			style={style}
		/>
	);
};

// ============================================================================
// STYLES (Ping UI - replacing styled-components)
// ============================================================================

const heroContainerStyle: React.CSSProperties = {
	background: '#ffffff',
	padding: '4rem 2rem',
	textAlign: 'center' as const,
	color: '#1e293b',
	position: 'relative',
	overflow: 'hidden',
};

const heroBackgroundStyle = {
	position: 'absolute' as const,
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	background: 'linear-gradient(180deg, rgba(0, 102, 204, 0.05) 0%, rgba(0, 102, 204, 0.01) 100%)',
	opacity: 1,
};

const heroContentStyle = {
	position: 'relative' as const,
	zIndex: 1,
	maxWidth: '1200px',
	margin: '0 auto',
};

const heroTitleStyle = {
	fontSize: '3rem',
	fontWeight: '700',
	marginBottom: '1rem',
	color: '#0066cc',
	lineHeight: 1.2,
};

const heroSubtitleStyle = {
	fontSize: '1.25rem',
	marginBottom: '2rem',
	color: '#64748b',
	maxWidth: '600px',
	margin: '0 auto 2rem',
	lineHeight: 1.6,
};

const featuresGridStyle = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
	gap: '2rem',
	marginTop: '3rem',
};

const featureCardStyle = {
	background: 'white',
	border: '1px solid #e5e5e5',
	borderRadius: '12px',
	padding: '2rem',
	textAlign: 'center' as const,
	transition: 'all 0.15s ease-in-out',
	boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
};

const featureTitleStyle = {
	fontSize: '1.25rem',
	fontWeight: '600',
	marginBottom: '0.5rem',
	color: '#1e293b',
};

const featureDescriptionStyle = {
	fontSize: '1rem',
	color: '#64748b',
	lineHeight: 1.6,
};

const ctaButtonStyle = {
	background: '#0066cc',
	color: 'white',
	border: 'none',
	borderRadius: '8px',
	padding: '12px 32px',
	fontSize: '16px',
	fontWeight: '600',
	cursor: 'pointer',
	marginTop: '2rem',
	transition: 'all 0.15s ease-in-out',
	display: 'inline-flex',
	alignItems: 'center' as const,
	gap: '8px',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PingIdentityHero: React.FC = () => {
	const handleGetStarted = () => {
		// Handle get started action
		console.log('Get Started clicked');
	};

	return (
		<div className="end-user-nano">
			<section style={heroContainerStyle}>
				{/* Background Gradient */}
				<div style={heroBackgroundStyle} />

				<div style={heroContentStyle}>
					<h1 style={heroTitleStyle}>Enterprise Identity & Access Management</h1>

					<p style={heroSubtitleStyle}>
						Secure, scalable, and comprehensive identity solutions for modern enterprises. Protect
						your digital assets with advanced authentication and authorization.
					</p>

					{/* Features Grid */}
					<div style={featuresGridStyle}>
						<div
							style={featureCardStyle}
							onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(-4px)';
								e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
							}}
						>
							<MDIIcon icon="shield-check" size={48} aria-hidden={true} />
							<h3 style={featureTitleStyle}>Advanced Security</h3>
							<p style={featureDescriptionStyle}>
								Multi-factor authentication, single sign-on, and adaptive security policies to
								protect against modern threats.
							</p>
						</div>

						<div
							style={featureCardStyle}
							onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(-4px)';
								e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
							}}
						>
							<MDIIcon icon="account-group" size={48} aria-hidden={true} />
							<h3 style={featureTitleStyle}>User Management</h3>
							<p style={featureDescriptionStyle}>
								Comprehensive user lifecycle management with automated provisioning, deprovisioning,
								and access governance.
							</p>
						</div>

						<div
							style={featureCardStyle}
							onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(-4px)';
								e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
							}}
						>
							<MDIIcon icon="key" size={48} aria-hidden={true} />
							<h3 style={featureTitleStyle}>Credential Management</h3>
							<p style={featureDescriptionStyle}>
								Secure credential storage, password management, and certificate-based authentication
								for enterprise environments.
							</p>
						</div>

						<div
							style={featureCardStyle}
							onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(-4px)';
								e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
							}}
						>
							<MDIIcon icon="database" size={48} aria-hidden={true} />
							<h3 style={featureTitleStyle}>Directory Integration</h3>
							<p style={featureDescriptionStyle}>
								Seamless integration with existing directories and identity stores, supporting LDAP,
								Active Directory, and cloud directories.
							</p>
						</div>

						<div
							style={featureCardStyle}
							onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(-4px)';
								e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
							}}
						>
							<MDIIcon icon="cog" size={48} aria-hidden={true} />
							<h3 style={featureTitleStyle}>Policy Management</h3>
							<p style={featureDescriptionStyle}>
								Flexible policy engine for access control, compliance, and risk-based authentication
								across all applications.
							</p>
						</div>

						<div
							style={featureCardStyle}
							onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(-4px)';
								e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
							}}
						>
							<MDIIcon icon="lock" size={48} aria-hidden={true} />
							<h3 style={featureTitleStyle}>Zero Trust Security</h3>
							<p style={featureDescriptionStyle}>
								Implement zero trust architecture with continuous authentication, device trust, and
								contextual access policies.
							</p>
						</div>
					</div>

					{/* Call to Action Button */}
					<button
						style={ctaButtonStyle}
						onClick={handleGetStarted}
						onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
							e.currentTarget.style.backgroundColor = '#0052a3';
							e.currentTarget.style.transform = 'translateY(-2px)';
						}}
						onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
							e.currentTarget.style.backgroundColor = '#0066cc';
							e.currentTarget.style.transform = 'translateY(0)';
						}}
					>
						Get Started
						<MDIIcon icon="arrow-right" size={20} aria-hidden={true} />
					</button>
				</div>
			</section>
		</div>
	);
};
