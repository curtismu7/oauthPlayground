/**
 * @file AmericanAirlinesNavigation.PingUI.tsx
 * @module protect-portal/components
 * @description American Airlines navigation component matching AA.com style - Ping UI version
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides an American Airlines-style navigation header
 * that matches the actual AA.com website design and functionality.
 */

import React, { useState } from 'react';
import { useBrandTheme } from '../themes/theme-provider';
import BrandDropdownSelector from './BrandDropdownSelector';

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

const getNavigationContainerStyle = (brandPrimary: string) => ({
	background: brandPrimary,
	borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
	width: '100%',
	position: 'sticky' as const,
	top: 0,
	zIndex: 1000,
});

const navigationContentStyle = {
	maxWidth: '1200px',
	margin: '0 auto',
	display: 'flex',
	alignItems: 'center' as const,
	justifyContent: 'space-between',
	padding: '0 1rem',
	height: '64px',
};

const logoSectionStyle = {
	display: 'flex',
	alignItems: 'center' as const,
	gap: '1rem',
};

const navigationLinksStyle = {
	display: 'flex',
	alignItems: 'center' as const,
	gap: '2rem',
};

const linkStyle = {
	color: 'white',
	textDecoration: 'none',
	fontSize: '16px',
	fontWeight: '500',
	transition: 'opacity 0.15s ease-in-out',
	cursor: 'pointer',
};

const iconButtonStyle = {
	background: 'none',
	border: 'none',
	color: 'white',
	cursor: 'pointer',
	padding: '8px',
	borderRadius: '4px',
	transition: 'background-color 0.15s ease-in-out',
	display: 'flex',
	alignItems: 'center' as const,
	justifyContent: 'center',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AmericanAirlinesNavigation: React.FC = () => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const { activeTheme } = useBrandTheme();
	const brandPrimary = activeTheme?.colors?.primary || '#0066CC';

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
	};

	return (
		<div className="end-user-nano">
			<nav style={getNavigationContainerStyle(brandPrimary)}>
				<div style={navigationContentStyle}>
					{/* Logo Section */}
					<div style={logoSectionStyle}>
						<MDIIcon icon="airplane" size={32} aria-hidden={true} />
						<span style={{ color: 'white', fontSize: '20px', fontWeight: '600' }}>
							American Airlines
						</span>
					</div>

					{/* Desktop Navigation Links */}
					<div style={navigationLinksStyle}>
						<a href="#" style={linkStyle}>
							Book
						</a>
						<a href="#" style={linkStyle}>
							My Trips
						</a>
						<a href="#" style={linkStyle}>
							AAdvantage®
						</a>
						<a href="#" style={linkStyle}>
							Travel Info
						</a>
					</div>

					{/* Right Section */}
					<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
						{/* Search Button */}
						<button
							style={iconButtonStyle}
							aria-label="Search"
							onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
								e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
								e.currentTarget.style.backgroundColor = 'transparent';
							}}
						>
							<MDIIcon icon="magnify" size={20} aria-hidden={true} />
						</button>

						{/* User Account */}
						<button
							style={{
								...iconButtonStyle,
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
							aria-label="User account"
							onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
								e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
							}}
							onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
								e.currentTarget.style.backgroundColor = 'transparent';
							}}
						>
							<MDIIcon icon="account" size={20} aria-hidden={true} />
							<MDIIcon icon="chevron-down" size={16} aria-hidden={true} />
						</button>

						{/* Mobile Menu Toggle */}
						<button
							style={{
								...iconButtonStyle,
								display: 'none', // Hidden on desktop
							}}
							onClick={toggleMobileMenu}
							aria-label="Toggle mobile menu"
							aria-expanded={isMobileMenuOpen}
						>
							{isMobileMenuOpen ? (
								<MDIIcon icon="close" size={24} aria-hidden={true} />
							) : (
								<MDIIcon icon="menu" size={24} aria-hidden={true} />
							)}
						</button>
					</div>
				</div>

				{/* Mobile Menu */}
				{isMobileMenuOpen && (
					<div
						style={{
							background: brandPrimary,
							borderTop: '1px solid rgba(255, 255, 255, 0.1)',
							padding: '1rem',
							display: 'none', // Hidden on desktop
						}}
					>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
							<a href="#" style={{ ...linkStyle, padding: '0.5rem 0' }} onClick={closeMobileMenu}>
								Book
							</a>
							<a href="#" style={{ ...linkStyle, padding: '0.5rem 0' }} onClick={closeMobileMenu}>
								My Trips
							</a>
							<a href="#" style={{ ...linkStyle, padding: '0.5rem 0' }} onClick={closeMobileMenu}>
								AAdvantage®
							</a>
							<a href="#" style={{ ...linkStyle, padding: '0.5rem 0' }} onClick={closeMobileMenu}>
								Travel Info
							</a>
						</div>
					</div>
				)}

				{/* Brand Dropdown */}
				<div style={{ position: 'absolute', top: '8px', right: '8px' }}>
					<BrandDropdownSelector />
				</div>
			</nav>
		</div>
	);
};
