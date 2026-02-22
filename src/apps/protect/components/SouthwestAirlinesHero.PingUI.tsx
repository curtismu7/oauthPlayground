/**
 * @file SouthwestAirlinesHero.PingUI.tsx
 * @module protect-portal/components
 * @description Southwest Airlines hero section with authentic login page layout - Ping UI version
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a Southwest Airlines-specific hero section that matches
 * their actual login page layout with navigation, hero content, and login integration.
 */

import React from 'react';
import { useBrandTheme } from '../themes/theme-provider';

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
// INLINE STYLES FUNCTIONS
// ============================================================================

const getHeroContainerStyle = () => ({
	width: '100%',
	background: 'white',
	position: 'relative' as const,
	overflow: 'hidden',
});

const getHeroBackgroundStyle = () => ({
	position: 'absolute' as const,
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	background: 'linear-gradient(135deg, rgba(46, 75, 177, 0.02) 0%, rgba(229, 29, 35, 0.01) 100%)',
	opacity: 1,
});

const getHeroContentStyle = () => ({
	position: 'relative' as const,
	zIndex: 2,
	maxWidth: '1200px',
	margin: '0 auto',
	padding: '2rem',
});

const getNavigationStyle = () => ({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center' as const,
	padding: '1rem 0',
	borderBottom: '1px solid #E5E7EB',
	marginBottom: '3rem',
	width: '100%',
});

const getLogoSectionStyle = () => ({
	display: 'flex',
	alignItems: 'center' as const,
	gap: '1rem',
});

const getLogoTextStyle = () => ({
	color: '#1E3A8A',
	fontSize: '1.5rem',
	fontWeight: 700,
	fontFamily: "'Benton Sans', 'Helvetica Neue', Arial, sans-serif",
});

const getNavLinksStyle = () => ({
	display: 'flex',
	gap: '2rem',
	alignItems: 'center' as const,
});

const getNavLinkStyle = () => ({
	color: '#4B5563',
	textDecoration: 'none',
	fontWeight: 500,
	fontSize: '0.875rem',
	transition: 'color 0.2s',
	fontFamily: "'Benton Sans', 'Helvetica Neue', Arial, sans-serif",

	'&:hover': {
		color: '#E51D23',
	},
});

const getMainContentStyle = () => ({
	display: 'grid',
	gridTemplateColumns: '1fr 1fr',
	gap: '4rem',
	alignItems: 'center' as const,
	marginBottom: '3rem',

	'@media (max-width: 768px)': {
		gridTemplateColumns: '1fr',
		gap: '2rem',
	},
});

const getLeftContentStyle = () => ({
	color: '#1F2937',
});

const getHeroTitleStyle = () => ({
	fontSize: '3rem',
	fontWeight: 700,
	marginBottom: '1rem',
	lineHeight: 1.2,
	color: '#1E3A8A',
	fontFamily: "'Benton Sans', 'Helvetica Neue', Arial, sans-serif",

	'@media (max-width: 768px)': {
		fontSize: '2rem',
	},
});

const getHeroSubtitleStyle = () => ({
	fontSize: '1.25rem',
	marginBottom: '2rem',
	color: '#4B5563',
	lineHeight: 1.6,
	fontFamily: "'Benton Sans', 'Helvetica Neue', Arial, sans-serif",
});

const getFeaturesStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(2, 1fr)',
	gap: '1rem',
	marginBottom: '2rem',

	'@media (max-width: 768px)': {
		gridTemplateColumns: '1fr',
	},
});

const getFeatureStyle = () => ({
	display: 'flex',
	alignItems: 'center' as const,
	gap: '0.75rem',
	fontSize: '0.875rem',
	color: '#6B7280',
});

const getFeatureIconStyle = () => ({
	color: '#E51D23',
	display: 'flex',
	alignItems: 'center' as const,
	justifyContent: 'center',
});

const getRightContentStyle = () => ({
	background: 'white',
	border: '1px solid #E5E7EB',
	borderRadius: '12px',
	padding: '2rem',
	boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
});

const getLoginSectionStyle = () => ({
	textAlign: 'center' as const,
	marginBottom: '2rem',
});

const getLoginTitleStyle = () => ({
	fontSize: '1.5rem',
	fontWeight: 600,
	color: '#1E3A8A',
	marginBottom: '0.5rem',
	fontFamily: "'Benton Sans', 'Helvetica Neue', Arial, sans-serif",
});

const getLoginSubtitleStyle = () => ({
	color: '#6B7280',
	fontSize: '0.875rem',
	marginBottom: '1.5rem',
	fontFamily: "'Benton Sans', 'Helvetica Neue', Arial, sans-serif",
});

const getLoginButtonStyle = () => ({
	display: 'flex',
	alignItems: 'center' as const,
	justifyContent: 'center',
	gap: '0.5rem',
	width: '100%',
	padding: '1rem',
	background: '#304CB2',
	color: 'white',
	border: 'none',
	borderRadius: '6px',
	fontSize: '1rem',
	fontWeight: 600,
	fontFamily: "'Benton Sans', Arial, sans-serif",
	cursor: 'pointer',
	transition: 'all 0.2s',

	'&:hover': {
		background: '#263A94',
		transform: 'translateY(-1px)',
	},

	'&:active': {
		transform: 'translateY(0)',
	},
});

const getQuickLinksStyle = () => ({
	display: 'flex',
	justifyContent: 'space-between',
	marginTop: '1.5rem',
	paddingTop: '1.5rem',
	borderTop: '1px solid #E5E7EB',
});

const getQuickLinkStyle = () => ({
	color: '#2E4BB1',
	textDecoration: 'none',
	fontSize: '0.875rem',
	fontWeight: 500,
	transition: 'color 0.2s',
	fontFamily: "'Benton Sans', 'Helvetica Neue', Arial, sans-serif",

	'&:hover': {
		color: '#E51D23',
	},
});

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface SouthwestAirlinesHeroProps {
	className?: string;
	currentStep?: string;
	onLoginStart?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

const SouthwestAirlinesHero: React.FC<SouthwestAirlinesHeroProps> = ({
	className,
	currentStep = 'portal-home',
	onLoginStart,
}) => {
	const { activeTheme } = useBrandTheme();
	const isCustomer = activeTheme.content?.customerTerminology ?? true;

	return (
		<div className="end-user-nano">
			<div className={className} style={getHeroContainerStyle()}>
				<div style={getHeroBackgroundStyle()} />
				<div style={getHeroContentStyle()}>
					{currentStep === 'portal-home' ? (
						<div style={getMainContentStyle()}>
							<div style={getLeftContentStyle()}>
								<h1 style={getHeroTitleStyle()}>Transfarency. No Hidden Fees.</h1>
								<p style={getHeroSubtitleStyle()}>
									Experience Southwest's legendary customer service with no change fees, no
									cancellation fees, and bags fly free®.
								</p>

								<div style={getFeaturesStyle()}>
									<div style={getFeatureStyle()}>
										<div style={getFeatureIconStyle()}>
											<MDIIcon icon="heart" aria-hidden={true} />
										</div>
										<span>Bags Fly Free®</span>
									</div>
									<div style={getFeatureStyle()}>
										<div style={getFeatureIconStyle()}>
											<MDIIcon icon="currency-usd" aria-hidden={true} />
										</div>
										<span>No Change Fees</span>
									</div>
									<div style={getFeatureStyle()}>
										<div style={getFeatureIconStyle()}>
											<MDIIcon icon="emoticon-happy" aria-hidden={true} />
										</div>
										<span>Customer First</span>
									</div>
								</div>
							</div>

							<div style={getRightContentStyle()}>
								<div style={getLoginSectionStyle()}>
									<h2 style={getLoginTitleStyle()}>
										{isCustomer ? 'Customer Sign In' : 'Employee Sign In'}
									</h2>
									<p style={getLoginSubtitleStyle()}>
										{isCustomer
											? 'Access your Southwest Airlines customer account'
											: 'Access your Southwest Airlines employee account'}
									</p>
								</div>

								<button
									onClick={onLoginStart}
									style={getLoginButtonStyle()}
									aria-label={
										isCustomer ? 'Sign In to Customer Portal' : 'Sign In to Employee Portal'
									}
								>
									<MDIIcon icon="shield" aria-hidden={true} />
									{isCustomer ? 'Sign In to Customer Portal' : 'Sign In to Employee Portal'}
								</button>

								<div style={getQuickLinksStyle()}>
									<a href="#" style={getQuickLinkStyle()}>
										Forgot Username?
									</a>
									<a href="#" style={getQuickLinkStyle()}>
										Forgot Password?
									</a>
									<a href="#" style={getQuickLinkStyle()}>
										Need Help?
									</a>
								</div>
							</div>
						</div>
					) : (
						<>
							<nav style={getNavigationStyle()}>
								<div style={getLogoSectionStyle()}>
									<div style={getLogoTextStyle()}>SOUTHWEST</div>
								</div>
								<div style={getNavLinksStyle()}>
									<a href="#" style={getNavLinkStyle()}>
										Book
									</a>
									<a href="#" style={getNavLinkStyle()}>
										Check In
									</a>
									<a href="#" style={getNavLinkStyle()}>
										My Trips
									</a>
									<a href="#" style={getNavLinkStyle()}>
										Rapid Rewards
									</a>
								</div>
							</nav>
							<div style={getMainContentStyle()}>
								<div style={getLeftContentStyle()}>
									<h1 style={getHeroTitleStyle()}>
										{isCustomer ? 'Secure Customer Portal' : 'Secure Employee Portal'}
									</h1>
									<p style={getHeroSubtitleStyle()}>
										{isCustomer
											? 'Access your Southwest Airlines customer account with enhanced security features.'
											: 'Access your Southwest Airlines employee account with enhanced security features.'}
									</p>
									<div style={getFeaturesStyle()}>
										<div style={getFeatureStyle()}>
											<div style={getFeatureIconStyle()}>
												<MDIIcon icon="check-circle" aria-hidden={true} />
											</div>
											<span>{isCustomer ? 'Customer First' : 'Employee First'}</span>
										</div>
									</div>
								</div>

								<div style={getRightContentStyle()}>
									<div style={getLoginSectionStyle()}>
										<h2 style={getLoginTitleStyle()}>
											{isCustomer ? 'Customer Sign In' : 'Employee Sign In'}
										</h2>
										<p style={getLoginSubtitleStyle()}>
											{isCustomer
												? 'Access your Southwest Airlines customer account'
												: 'Access your Southwest Airlines employee account'}
										</p>
									</div>

									<button
										onClick={onLoginStart}
										style={getLoginButtonStyle()}
										aria-label={
											isCustomer ? 'Sign In to Customer Portal' : 'Sign In to Employee Portal'
										}
									>
										<MDIIcon icon="shield" aria-hidden={true} />
										{isCustomer ? 'Sign In to Customer Portal' : 'Sign In to Employee Portal'}
									</button>

									<div style={getQuickLinksStyle()}>
										<a href="#" style={getQuickLinkStyle()}>
											Forgot Username?
										</a>
										<a href="#" style={getQuickLinkStyle()}>
											Forgot Password?
										</a>
										<a href="#" style={getQuickLinkStyle()}>
											Need Help?
										</a>
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default SouthwestAirlinesHero;
