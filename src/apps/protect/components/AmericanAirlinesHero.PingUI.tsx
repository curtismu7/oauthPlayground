/**
 * @file AmericanAirlinesHero.PingUI.tsx
 * @module protect-portal/components
 * @description Ping UI migrated American Airlines hero section matching AA.com style
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides an American Airlines-style hero section
 * that matches the actual AA.com website design and functionality.
 * Migrated to Ping UI with MDI icons and CSS variables.
 */

import React from 'react';
// import type { LoginContext, PortalError, UserContext } from '../types/protectPortal.types';
import AmericanAirlinesNavigation from './AmericanAirlinesNavigation';

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 16, ariaLabel, ariaHidden = false, className = '', style }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<i
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			{...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
			{...(ariaHidden ? { 'aria-hidden': 'true' } : {})}
		></i>
	);
};

// MDI Icon mapping function
const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiArrowRight: 'mdi-arrow-right',
		FiCalendar: 'mdi-calendar',
		FiLock: 'mdi-lock',
		FiMapPin: 'mdi-map-marker',
		FiSearch: 'mdi-magnify',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

// ============================================================================
// INTERFACES
// ============================================================================

type AmericanAirlinesHeroPingUIProps = {};

// ============================================================================
// STYLE FUNCTIONS
// ============================================================================

const getHeroContainerStyle = () => ({
	background: 'var(--ping-surface-primary, #ffffff)',
	padding: 'var(--ping-spacing-xxl, 4rem) var(--ping-spacing-md, 2rem)',
	textAlign: 'center' as const,
	color: '#0f2d5c',
	position: 'relative' as const,
	overflow: 'hidden',
});

const getHeroContentStyle = () => ({
	maxWidth: '800px',
	margin: '0 auto',
	position: 'relative' as const,
	zIndex: 1,
});

const getAirlineLogoStyle = () => ({
	fontSize: '3rem',
	fontWeight: 700,
	color: '#0f2d5c',
	marginBottom: 'var(--ping-spacing-md, 1rem)',
	letterSpacing: '-0.02em',
});

const getHeroTitleStyle = () => ({
	fontSize: '2.5rem',
	fontWeight: 700,
	color: '#0f2d5c',
	margin: '0 0 var(--ping-spacing-md, 1rem) 0',
	lineHeight: 1.2,
});

const getHeroSubtitleStyle = () => ({
	fontSize: '1.25rem',
	color: '#0f2d5c',
	margin: '0 0 var(--ping-spacing-xl, 2rem) 0',
	lineHeight: 1.6,
	opacity: 0.9,
});

const getSearchContainerStyle = () => ({
	background: 'var(--ping-surface-primary, white)',
	border: '2px solid #e1e5e9',
	borderRadius: 'var(--ping-border-radius-lg, 12px)',
	padding: 'var(--ping-spacing-md, 1rem)',
	marginBottom: 'var(--ping-spacing-xl, 2rem)',
	boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
	transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
});

const getSearchRowStyle = (isLast: boolean = false) => ({
	display: 'flex',
	gap: 'var(--ping-spacing-md, 1rem)',
	marginBottom: isLast ? '0' : 'var(--ping-spacing-md, 1rem)',
});

const getSearchColumnStyle = () => ({
	flex: 1,
	display: 'flex',
	flexDirection: 'column' as const,
});

const getSearchLabelStyle = () => ({
	fontSize: '0.875rem',
	fontWeight: 600,
	color: '#0f2d5c',
	marginBottom: 'var(--ping-spacing-xs, 0.5rem)',
	display: 'flex',
	alignItems: 'center' as const,
	gap: 'var(--ping-spacing-xs, 0.5rem)',
});

const getSearchInputStyle = () => ({
	width: '100%',
	padding: 'var(--ping-spacing-md, 1rem)',
	border: '1px solid #e1e5e9',
	borderRadius: 'var(--ping-border-radius-md, 8px)',
	fontSize: '1rem',
	transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
});

const getSearchButtonStyle = () => ({
	background: '#0f2d5c',
	color: 'white',
	border: 'none',
	padding: 'var(--ping-spacing-md, 1rem) var(--ping-spacing-xl, 2rem)',
	borderRadius: 'var(--ping-border-radius-md, 8px)',
	fontSize: '1rem',
	fontWeight: 600,
	cursor: 'pointer',
	transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
	display: 'flex',
	alignItems: 'center' as const,
	justifyContent: 'center' as const,
	gap: 'var(--ping-spacing-sm, 0.75rem)',
});

const getFeaturesGridStyle = () => ({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
	gap: 'var(--ping-spacing-lg, 1.5rem)',
	marginTop: 'var(--ping-spacing-xxl, 3rem)',
});

const getFeatureCardStyle = () => ({
	textAlign: 'center' as const,
	padding: 'var(--ping-spacing-lg, 1.5rem)',
	background: 'var(--ping-surface-secondary, #f8fafc)',
	borderRadius: 'var(--ping-border-radius-md, 8px)',
	border: '1px solid #e1e5e9',
	transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
});

const getFeatureIconStyle = () => ({
	fontSize: '2rem',
	color: '#0f2d5c',
	marginBottom: 'var(--ping-spacing-md, 1rem)',
});

const getFeatureTitleStyle = () => ({
	fontSize: '1.125rem',
	fontWeight: 600,
	color: '#0f2d5c',
	margin: '0 0 var(--ping-spacing-sm, 0.75rem) 0',
});

const getFeatureDescriptionStyle = () => ({
	fontSize: '0.875rem',
	color: '#0f2d5c',
	opacity: 0.8,
	lineHeight: 1.5,
	margin: 0,
});

const getTrustBadgesStyle = () => ({
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	gap: 'var(--ping-spacing-lg, 1.5rem)',
	marginTop: 'var(--ping-spacing-xl, 2rem)',
	flexWrap: 'wrap',
});

const getTrustBadgeStyle = () => ({
	display: 'flex',
	alignItems: 'center' as const,
	gap: 'var(--ping-spacing-sm, 0.75rem)',
	fontSize: '0.875rem',
	color: '#0f2d5c',
	opacity: 0.7,
});

const getBadgeIconStyle = () => ({
	color: '#0f2d5c',
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AmericanAirlinesHeroPingUI: React.FC<AmericanAirlinesHeroPingUIProps> = () => {
	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		// Handle search functionality
		console.log('Search submitted');
	};

	// Handle flight booking functionality for future implementation
	// const handleBookFlight = () => {
	// 	console.log('Book flight clicked');
	// };

	return (
		<div className="end-user-nano">
			<div style={getHeroContainerStyle()}>
				<AmericanAirlinesNavigation />

				<div style={getHeroContentStyle()}>
					<div style={getAirlineLogoStyle()}>✈ AMERICAN</div>
					<h1 style={getHeroTitleStyle()}>Travel the World with Confidence</h1>
					<p style={getHeroSubtitleStyle()}>
						Book your next adventure with American Airlines. Experience exceptional service,
						comfortable flights, and destinations worldwide.
					</p>

					<div style={getSearchContainerStyle()}>
						<form onSubmit={handleSearch}>
							<div style={getSearchRowStyle()}>
								<div style={getSearchColumnStyle()}>
									<label style={getSearchLabelStyle()}>
										<MDIIcon icon="map-marker" size={16} aria-label="Location" />
										From
									</label>
									<input
										style={getSearchInputStyle()}
										type="text"
										placeholder="Departure city or airport"
										defaultValue="New York (JFK)"
									/>
								</div>
								<div style={getSearchColumnStyle()}>
									<label style={getSearchLabelStyle()}>
										<MDIIcon icon="map-marker" size={16} aria-label="Location" />
										To
									</label>
									<input
										style={getSearchInputStyle()}
										type="text"
										placeholder="Arrival city or airport"
										defaultValue="Los Angeles (LAX)"
									/>
								</div>
							</div>

							<div style={getSearchRowStyle()}>
								<div style={getSearchColumnStyle()}>
									<label style={getSearchLabelStyle()}>
										<MDIIcon icon="calendar" size={16} aria-label="Calendar" />
										Departure
									</label>
									<input style={getSearchInputStyle()} type="date" defaultValue="2024-03-15" />
								</div>
								<div style={getSearchColumnStyle()}>
									<label style={getSearchLabelStyle()}>
										<MDIIcon icon="calendar" size={16} aria-label="Calendar" />
										Return
									</label>
									<input style={getSearchInputStyle()} type="date" defaultValue="2024-03-22" />
								</div>
								<div style={getSearchColumnStyle()}>
									<button style={getSearchButtonStyle()} type="submit">
										<MDIIcon icon="magnify" size={16} aria-label="Search" />
										Search Flights
									</button>
								</div>
							</div>
						</form>
					</div>

					<div style={getFeaturesGridStyle()}>
						<div style={getFeatureCardStyle()}>
							<div style={getFeatureIconStyle()}>
								<MDIIcon icon="lock" size={32} aria-label="Security" />
							</div>
							<h3 style={getFeatureTitleStyle()}>Secure Booking</h3>
							<p style={getFeatureDescriptionStyle()}>
								Protected transactions and data security for peace of mind
							</p>
						</div>

						<div style={getFeatureCardStyle()}>
							<div style={getFeatureIconStyle()}>
								<MDIIcon icon="calendar" size={32} aria-label="Schedule" />
							</div>
							<h3 style={getFeatureTitleStyle()}>Flexible Scheduling</h3>
							<p style={getFeatureDescriptionStyle()}>
								Easy changes and cancellations with flexible options
							</p>
						</div>

						<div style={getFeatureCardStyle()}>
							<div style={getFeatureIconStyle()}>
								<MDIIcon icon="arrow-right" size={32} aria-label="Directions" />
							</div>
							<h3 style={getFeatureTitleStyle()}>Global Network</h3>
							<p style={getFeatureDescriptionStyle()}>Connect to over 350 destinations worldwide</p>
						</div>
					</div>

					<div style={getTrustBadgesStyle()}>
						<div style={getTrustBadgeStyle()}>
							<div style={getBadgeIconStyle()}>
								<MDIIcon icon="lock" size={16} aria-label="Secure" />
							</div>
							Secure Booking
						</div>
						<div style={getTrustBadgeStyle()}>
							<div style={getBadgeIconStyle()}>
								<MDIIcon icon="check" size={16} aria-label="Verified" />
							</div>
							Verified Reviews
						</div>
						<div style={getTrustBadgeStyle()}>
							<div style={getBadgeIconStyle()}>
								<MDIIcon icon="shield" size={16} aria-label="Protected" />
							</div>
							Travel Protection
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AmericanAirlinesHeroPingUI;
