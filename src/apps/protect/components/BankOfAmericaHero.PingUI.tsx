/**
 * @file BankOfAmericaHero.PingUI.tsx
 * @module protect-portal/components
 * @description Bank of America hero section with authentic banking portal styling - Ping UI version
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a Bank of America-specific hero section that matches
 * their actual online banking portal with proper branding and customer focus.
 */

import React from 'react';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';

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
	background: 'linear-gradient(135deg, #012169 0%, #003d7a 100%)',
	padding: '3rem 2rem',
	textAlign: 'center' as const,
	color: 'white',
	position: 'relative',
};

const heroContentStyle = {
	maxWidth: '1000px',
	margin: '0 auto',
	position: 'relative' as const,
	zIndex: 1,
};

const heroTitleStyle = {
	fontSize: '3rem',
	fontWeight: '700',
	marginBottom: '1rem',
	background: 'linear-gradient(45deg, #ffffff, #e6f2ff)',
	WebkitBackgroundClip: 'text' as const,
	WebkitTextFillColor: 'transparent',
	backgroundClip: 'text',
};

const heroSubtitleStyle = {
	fontSize: '1.25rem',
	marginBottom: '2rem',
	opacity: 0.9,
	maxWidth: '600px',
	margin: '0 auto 2rem',
};

const featuresContainerStyle = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
	gap: '2rem',
	marginTop: '3rem',
};

const featureCardStyle = {
	background: 'rgba(255, 255, 255, 0.1)',
	backdropFilter: 'blur(10px)',
	border: '1px solid rgba(255, 255, 255, 0.2)',
	borderRadius: '12px',
	padding: '1.5rem',
	textAlign: 'center' as const,
	transition: 'transform 0.15s ease-in-out, background-color 0.15s ease-in-out',
};

const featureTitleStyle = {
	fontSize: '1.125rem',
	fontWeight: '600',
	marginBottom: '0.5rem',
	color: 'white',
};

const featureDescriptionStyle = {
	fontSize: '0.875rem',
	opacity: 0.8,
	lineHeight: 1.5,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface BankOfAmericaHeroProps {
	loginContext?: LoginContext;
	userContext?: UserContext;
	portalError?: PortalError;
	onLogin?: () => void;
}

export const BankOfAmericaHero: React.FC<BankOfAmericaHeroProps> = ({
	userContext,
	portalError,
	onLogin,
}) => {
	const handleLogin = () => {
		onLogin?.();
	};

	return (
		<div className="end-user-nano">
			<section style={heroContainerStyle}>
				{/* Background Pattern */}
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background:
							"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E\")",
						opacity: 0.5,
					}}
				/>

				<div style={heroContentStyle}>
					<h1 style={heroTitleStyle}>Bank of America Online Banking</h1>

					<p style={heroSubtitleStyle}>
						Secure access to your accounts, 24/7 banking services, and comprehensive financial
						management tools
					</p>

					{/* Features Grid */}
					<div style={featuresContainerStyle}>
						<div
							style={featureCardStyle}
							onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(-4px)';
								e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
							}}
						>
							<MDIIcon icon="shield-check" size={32} aria-hidden={true} />
							<h3 style={featureTitleStyle}>Secure Banking</h3>
							<p style={featureDescriptionStyle}>
								Advanced security features protect your accounts with multi-layer authentication and
								fraud monitoring
							</p>
						</div>

						<div
							style={featureCardStyle}
							onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(-4px)';
								e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
							}}
						>
							<MDIIcon icon="account" size={32} aria-hidden={true} />
							<h3 style={featureTitleStyle}>Personal Banking</h3>
							<p style={featureDescriptionStyle}>
								Manage checking, savings, and investment accounts with comprehensive online banking
								tools
							</p>
						</div>

						<div
							style={featureCardStyle}
							onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(-4px)';
								e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
							}}
						>
							<MDIIcon icon="lock" size={32} aria-hidden={true} />
							<h3 style={featureTitleStyle}>Privacy Protection</h3>
							<p style={featureDescriptionStyle}>
								Your privacy is protected with industry-leading encryption and data protection
								measures
							</p>
						</div>

						<div
							style={featureCardStyle}
							onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(-4px)';
								e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
							}}
						>
							<MDIIcon icon="currency-usd" size={32} aria-hidden={true} />
							<h3 style={featureTitleStyle}>Financial Tools</h3>
							<p style={featureDescriptionStyle}>
								Access budgeting tools, bill pay, transfers, and comprehensive financial planning
								resources
							</p>
						</div>
					</div>

					{/* Login Button */}
					{!userContext?.id && (
						<button
							onClick={handleLogin}
							style={{
								background: '#ffffff',
								color: '#012169',
								border: 'none',
								borderRadius: '8px',
								padding: '12px 32px',
								fontSize: '16px',
								fontWeight: '600',
								cursor: 'pointer',
								marginTop: '2rem',
								transition: 'all 0.15s ease-in-out',
							}}
							onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
								e.currentTarget.style.transform = 'translateY(-2px)';
								e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = 'none';
							}}
						>
							Sign In to Online Banking
						</button>
					)}

					{/* Error Display */}
					{portalError && (
						<div
							style={{
								background: 'rgba(220, 38, 38, 0.2)',
								border: '1px solid rgba(220, 38, 38, 0.4)',
								borderRadius: '8px',
								padding: '1rem',
								marginTop: '1rem',
								color: '#ffffff',
							}}
						>
							{portalError.message}
						</div>
					)}
				</div>
			</section>
		</div>
	);
};
