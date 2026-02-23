/**
 * @file FedExAirlinesHero.PingUI.tsx
 * @module protect-portal/components
 * @description FedEx Airlines hero section with authentic login page layout - PingUI version
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a FedEx Airlines-specific hero section that matches
 * their actual login page layout with navigation, hero content, and login integration.
 * Migrated to PingUI with MDI icons and CSS variables.
 */

import React from 'react';
import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';
import BrandDropdownSelector from './BrandDropdownSelector';

// ============================================================================
// MDI ICON COMPONENT
// ============================================================================

const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	title?: string;
}> = ({ icon, size = 24, className = '', title }) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: size }}
			title={title}
		/>
	);
};

// ============================================================================
// STYLE FUNCTIONS
// ============================================================================

const getHeroContainerStyle = () => ({
	width: '100%',
	background: 'white',
	position: 'relative' as const,
	overflow: 'hidden',
});

const getFullWidthHeaderStyle = () => ({
	width: '100%',
	background: 'white',
	borderBottom: '1px solid #E5E7EB',
});

const getHeaderContentStyle = () => ({
	maxWidth: '1200px',
	margin: '0 auto',
	padding: '0 2rem',
});

const getNavigationStyle = () => ({
	display: 'flex',
	justifyContent: 'space-between' as const,
	alignItems: 'center',
	padding: '1.5rem 0',
	width: '100%',
	background: 'white',
});

const getHeaderActionsStyle = () => ({
	display: 'flex',
	alignItems: 'center',
	gap: '0.75rem',
});

const getHeroBackgroundStyle = () => ({
	position: 'absolute' as const,
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	background: 'linear-gradient(135deg, rgba(77, 20, 140, 0.02) 0%, rgba(255, 102, 0, 0.01) 100%)',
	opacity: 1,
});

const getHeroContentStyle = () => ({
	position: 'relative' as const,
	zIndex: 2,
	maxWidth: '100%',
	margin: '0 auto',
	padding: 0,
});

const getLogoSectionStyle = () => ({
	display: 'flex',
	alignItems: 'center',
	gap: '1rem',
});

const getLogoTextStyle = () => ({
	color: '#4D148C',
	fontSize: '1.75rem',
	fontWeight: 700,
	fontFamily: "'Helvetica Neue', Arial, sans-serif",
});

const getNavLinksStyle = () => ({
	display: 'flex',
	gap: '2rem',
	alignItems: 'center',
});

const getNavLinkStyle = () => ({
	color: '#666666',
	textDecoration: 'none' as const,
	fontWeight: 500,
	fontSize: '0.875rem',
	transition: 'color 0.2s',
	fontFamily: "'Helvetica Neue', Arial, sans-serif",
});

const getMainContentStyle = () => ({
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'flex-start',
	padding: '2rem',
	minHeight: 'calc(100vh - 200px)',
});

const getLoginContainerStyle = () => ({
	width: '100%',
	maxWidth: '100%',
	background: 'white',
	borderRadius: '8px',
	boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
	padding: '2rem 2.25rem',
});

const getLoginSectionStyle = () => ({
	textAlign: 'center' as const,
	marginBottom: '2rem',
});

const getLoginTitleStyle = () => ({
	fontSize: '1.5rem',
	fontWeight: 600,
	color: '#333333',
	marginBottom: '0.5rem',
	fontFamily: "'Helvetica Neue', Arial, sans-serif",
});

const getLoginSubtitleStyle = () => ({
	color: '#666666',
	fontSize: '0.875rem',
	marginBottom: '1.5rem',
	fontFamily: "'Helvetica Neue', Arial, sans-serif",
});

const getLoginDescriptionStyle = () => ({
	color: '#666666',
	fontSize: '0.875rem',
	marginBottom: '1.5rem',
	lineHeight: 1.4,
	fontFamily: "'Helvetica Neue', Arial, sans-serif",
});

const getLoginButtonStyle = () => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: '0.5rem',
	width: '100%',
	padding: '1rem',
	background: '#4D148C',
	color: 'white',
	border: 'none',
	borderRadius: '6px',
	fontSize: '1rem',
	fontWeight: 600,
	fontFamily: "'Helvetica Neue', Arial, sans-serif",
	cursor: 'pointer',
	transition: 'all 0.2s',
});

const getQuickActionsStyle = () => ({
	display: 'flex',
	justifyContent: 'space-between',
	gap: '0.9rem',
	margin: '1.5rem 0',
	flexWrap: 'wrap' as const,
});

const getQuickActionStyle = () => ({
	display: 'flex',
	flexDirection: 'column' as const,
	alignItems: 'flex-start',
	gap: '0.35rem',
	padding: '0.9rem',
	background: 'rgba(77, 20, 140, 0.07)',
	borderRadius: '8px',
	border: '1px solid rgba(77, 20, 140, 0.15)',
	transition: 'all 0.2s',
	minWidth: '150px',
	flex: '1 1 170px',
});

const getActionIconStyle = () => ({
	fontSize: '1.5rem',
	marginBottom: '0.25rem',
});

const getActionLabelStyle = () => ({
	fontSize: '0.875rem',
	fontWeight: 600,
	color: '#4D148C',
	fontFamily: "'Helvetica Neue', Arial, sans-serif",
});

const getActionMetaStyle = () => ({
	fontSize: '0.78rem',
	color: '#6B7280',
	fontFamily: "'Helvetica Neue', Arial, sans-serif",
});

const getStatusStripStyle = () => ({
	display: 'flex',
	flexWrap: 'wrap' as const,
	gap: '0.55rem',
	marginBottom: '1rem',
});

const getStatusBadgeStyle = () => ({
	padding: '0.38rem 0.62rem',
	borderRadius: '999px',
	border: '1px solid rgba(77, 20, 140, 0.18)',
	background: 'rgba(77, 20, 140, 0.06)',
	color: '#4D148C',
	fontSize: '0.75rem',
	fontWeight: 600,
});

const getServiceHighlightsGridStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
	gap: '0.8rem',
	margin: '0.5rem 0 1.3rem',
});

const getHighlightCardStyle = () => ({
	background: 'linear-gradient(180deg, rgba(77, 20, 140, 0.06) 0%, rgba(255, 102, 0, 0.05) 100%)',
	border: '1px solid rgba(77, 20, 140, 0.14)',
	borderRadius: '10px',
	padding: '0.8rem 0.9rem',
});

const getHighlightTitleStyle = () => ({
	margin: '0 0 0.35rem',
	color: '#4D148C',
	fontSize: '0.92rem',
	fontWeight: 700,
});

const getHighlightTextStyle = () => ({
	margin: 0,
	fontSize: '0.8rem',
	color: '#4B5563',
	lineHeight: 1.35,
});

const getQuickLinksStyle = () => ({
	display: 'flex',
	justifyContent: 'space-between',
	marginTop: '1.5rem',
	paddingTop: '1.5rem',
	borderTop: '1px solid #E5E7EB',
});

const getQuickLinkStyle = () => ({
	color: '#4D148C',
	textDecoration: 'none' as const,
	fontSize: '0.875rem',
	fontWeight: 500,
	transition: 'color 0.2s',
	fontFamily: "'Helvetica Neue', Arial, sans-serif",
});

const getTrackingSectionStyle = () => ({
	marginTop: '2rem',
	background: 'rgba(255, 255, 255, 0.05)',
	borderRadius: '12px',
	padding: '1.5rem',
	border: '1px solid rgba(255, 255, 255, 0.1)',
});

const getTrackingTitleStyle = () => ({
	color: '#4D148C',
	fontSize: '1.25rem',
	marginBottom: '1rem',
	textAlign: 'center' as const,
});

const getTrackingFormStyle = () => ({
	display: 'flex',
	gap: '0.5rem',
	marginBottom: '1rem',
});

const getTrackingInputStyle = () => ({
	flex: 1,
	padding: '0.75rem',
	border: '2px solid #E5E7EB',
	borderRadius: '8px',
	fontSize: '1rem',
});

const getTrackButtonStyle = () => ({
	background: '#FF6600',
	color: 'white',
	border: 'none',
	padding: '0.75rem 2rem',
	borderRadius: '8px',
	fontSize: '1rem',
	fontWeight: 600,
	cursor: 'pointer',
	transition: 'all 0.2s ease',
});

const getTrackingOptionsStyle = () => ({
	display: 'flex',
	flexDirection: 'column' as const,
	gap: '0.5rem',
});

const getTrackingOptionStyle = () => ({
	display: 'flex',
	alignItems: 'center',
	gap: '0.5rem',
	color: '#4D148C',
	fontSize: '0.875rem',
	cursor: 'pointer',
});

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface FedExAirlinesHeroProps {
	currentStep?: string;
	onLoginStart?: () => void;
	_onLoginSuccess?: (userContext: UserContext, loginContext: LoginContext) => void;
	_onError?: (error: PortalError) => void;
	_environmentId?: string;
	_clientId?: string;
	_clientSecret?: string;
	_redirectUri?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const FedExAirlinesHero: React.FC<FedExAirlinesHeroProps> = ({
	currentStep = 'portal-home',
	onLoginStart,
}) => {
	return (
		<div className="end-user-nano">
			<div style={getHeroContainerStyle()}>
				<div style={getHeroBackgroundStyle()} />
				<div style={getHeroContentStyle()}>
					{currentStep === 'portal-home' ? (
						<>
							<div style={getFullWidthHeaderStyle()}>
								<div style={getHeaderContentStyle()}>
									<nav style={getNavigationStyle()}>
										<div style={getLogoSectionStyle()}>
											<div style={getLogoTextStyle()}>FedEx</div>
										</div>
										<div style={getNavLinksStyle()}>
											<a href="#ship" style={getNavLinkStyle()}>
												Ship
											</a>
											<a href="#ship" style={getNavLinkStyle()}>
												Track
											</a>
											<a href="#ship" style={getNavLinkStyle()}>
												Manage
											</a>
											<a href="#ship" style={getNavLinkStyle()}>
												Support
											</a>
										</div>
										<div style={getHeaderActionsStyle()}>
											<BrandDropdownSelector />
										</div>
									</nav>
								</div>
							</div>
							<div style={getMainContentStyle()}>
								<div style={getLoginContainerStyle()}>
									<div style={getLoginSectionStyle()}>
										<h2 style={getLoginTitleStyle()}>The World on Time</h2>
										<p style={getLoginSubtitleStyle()}>
											Ship, track, and manage your shipments with FedEx's reliable global logistics
											network
										</p>
									</div>
									<div style={getStatusStripStyle()}>
										<span style={getStatusBadgeStyle()}>On-Time Priority 97.8%</span>
										<span style={getStatusBadgeStyle()}>220+ Countries</span>
										<span style={getStatusBadgeStyle()}>Customs Tools Active</span>
										<span style={getStatusBadgeStyle()}>24/7 Shipment Visibility</span>
									</div>

									<div style={getQuickActionsStyle()}>
										<div style={getQuickActionStyle()}>
											<div style={getActionIconStyle()}>
												<MDIIcon icon="package-variant" size={24} aria-hidden={true} />
											</div>
											<span style={getActionLabelStyle()}>Ship</span>
											<span style={getActionMetaStyle()}>Create labels fast</span>
										</div>

										<div style={getQuickActionStyle()}>
											<div style={getActionIconStyle()}>
												<MDIIcon icon="magnify" size={24} aria-hidden={true} />
											</div>
											<span style={getActionLabelStyle()}>Track</span>
											<span style={getActionMetaStyle()}>Live package timelines</span>
										</div>

										<div style={getQuickActionStyle()}>
											<div style={getActionIconStyle()}>
												<MDIIcon icon="clipboard-list" size={24} aria-hidden={true} />
											</div>
											<span style={getActionLabelStyle()}>Manage</span>
											<span style={getActionMetaStyle()}>Billing and pickups</span>
										</div>

										<div style={getQuickActionStyle()}>
											<div style={getActionIconStyle()}>
												<MDIIcon icon="arrow-left" size={24} aria-hidden={true} />
											</div>
											<span style={getActionLabelStyle()}>Returns</span>
											<span style={getActionMetaStyle()}>Print return labels</span>
										</div>
									</div>

									<div style={getServiceHighlightsGridStyle()}>
										<div style={getHighlightCardStyle()}>
											<h4 style={getHighlightTitleStyle()}>Global Network Snapshot</h4>
											<p style={getHighlightTextStyle()}>
												Monitor regional lane performance and transit milestones across express and
												ground services.
											</p>
										</div>
										<div style={getHighlightCardStyle()}>
											<h4 style={getHighlightTitleStyle()}>Smart Customs Workflow</h4>
											<p style={getHighlightTextStyle()}>
												Pre-clearance and trade document readiness indicators for smoother
												international delivery.
											</p>
										</div>
										<div style={getHighlightCardStyle()}>
											<h4 style={getHighlightTitleStyle()}>Delivery Management</h4>
											<p style={getHighlightTextStyle()}>
												Route critical packages, set notifications, and coordinate destination
												instructions in one view.
											</p>
										</div>
									</div>

									<div style={getLoginSectionStyle()}>
										<p style={getLoginDescriptionStyle()}>
											Click below to begin your secure login journey. We'll evaluate your login
											attempt in real-time to provide the appropriate level of security.
										</p>
										<button
											type="button"
											style={getLoginButtonStyle()}
											onClick={onLoginStart}
											aria-label="Begin secure login"
										>
											<MDIIcon icon="lock" size={20} aria-hidden={true} />
											Begin Secure Login
											<MDIIcon icon="arrow-right" size={20} aria-hidden={true} />
										</button>
									</div>
								</div>
							</div>
						</>
					) : (
						<>
							<div style={getFullWidthHeaderStyle()}>
								<div style={getHeaderContentStyle()}>
									<nav style={getNavigationStyle()}>
										<div style={getLogoSectionStyle()}>
											<div style={getLogoTextStyle()}>FedEx</div>
										</div>
										<div style={getNavLinksStyle()}>
											<a href="#ship" style={getNavLinkStyle()}>
												Ship
											</a>
											<a href="#ship" style={getNavLinkStyle()}>
												Track
											</a>
											<a href="#ship" style={getNavLinkStyle()}>
												Manage
											</a>
											<a href="#ship" style={getNavLinkStyle()}>
												Support
											</a>
										</div>
										<div style={getHeaderActionsStyle()}>
											<BrandDropdownSelector />
										</div>
									</nav>
								</div>
							</div>
							<div style={getMainContentStyle()}>
								<div style={getLoginContainerStyle()}>
									<div style={getLoginSectionStyle()}>
										<h2 style={getLoginTitleStyle()}>Employee Sign In</h2>
										<p style={getLoginSubtitleStyle()}>
											Access your FedEx employee account with enhanced security features.
										</p>
									</div>

									<button type="button" style={getLoginButtonStyle()} onClick={onLoginStart}>
										Sign In to Employee Portal
									</button>

									{/* Package Tracking Form for Visual Authenticity */}
									<div style={getTrackingSectionStyle()}>
										<h3 style={getTrackingTitleStyle()}>Track Your Shipment</h3>
										<div style={getTrackingFormStyle()}>
											<input
												type="text"
												placeholder="Enter tracking number"
												defaultValue="123456789012"
												style={getTrackingInputStyle()}
											/>
											<button type="button" style={getTrackButtonStyle()}>
												Track
											</button>
										</div>
										<div style={getTrackingOptionsStyle()}>
											<label style={getTrackingOptionStyle()}>
												<input type="radio" name="trackType" id="track" defaultChecked />
												Track by tracking number
											</label>
											<label style={getTrackingOptionStyle()}>
												<input type="radio" name="trackType" id="reference" />
												Track by reference
											</label>
											<label style={getTrackingOptionStyle()}>
												<input type="radio" name="trackType" id="tnot" />
												Track by Transport Order / TNOT number
											</label>
										</div>
									</div>

									<div style={getQuickLinksStyle()}>
										<a href="#ship" style={getQuickLinkStyle()}>
											Forgot Username?
										</a>
										<a href="#ship" style={getQuickLinkStyle()}>
											Forgot Password?
										</a>
										<a href="#ship" style={getQuickLinkStyle()}>
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

export default FedExAirlinesHero;
