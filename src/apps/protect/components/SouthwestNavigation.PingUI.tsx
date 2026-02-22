/**
 * @file SouthwestNavigation.PingUI.tsx
 * @module protect-portal/components
 * @description Southwest Airlines navigation component matching southwest.com style - Ping UI version
 * @version 9.6.5
 * @since 2026-02-13
 */

import React, { useState } from 'react';
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
// STYLES (Ping UI - replacing styled-components)
// ============================================================================

const navContainerStyle: React.CSSProperties = {
	background: 'white',
	boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
	position: 'sticky' as const,
	top: 0,
	zIndex: 1000,
};

const navMainStyle = {
	background: '#304cb2',
	padding: '1rem 0',
};

const navMainContentStyle = {
	maxWidth: '1200px',
	margin: '0 auto',
	padding: '0 1rem',
	display: 'flex',
	alignItems: 'center' as const,
	justifyContent: 'space-between',
};

const logoStyle = {
	display: 'flex',
	alignItems: 'center' as const,
	gap: '0.5rem',
	fontWeight: '700',
	fontSize: '1.5rem',
	color: 'white',
};

const navLinksStyle = {
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

export const SouthwestNavigation: React.FC = () => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const {} = useBrandTheme();

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
	};

	return (
		<div className="end-user-nano">
			<nav style={navContainerStyle}>
				{/* Main Navigation */}
				<div style={navMainStyle}>
					<div style={navMainContentStyle}>
						{/* Logo Section */}
						<div style={logoStyle}>
							<MDIIcon icon="airplane" size={32} aria-hidden={true} />
							<span>Southwest</span>
						</div>

						{/* Desktop Navigation Links */}
						<div style={navLinksStyle}>
							<a
								href="#"
								style={linkStyle}
								onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.opacity = '0.8';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.opacity = '1';
								}}
							>
								Book
							</a>
							<a
								href="#"
								style={linkStyle}
								onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.opacity = '0.8';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.opacity = '1';
								}}
							>
								Flight Status
							</a>
							<a
								href="#"
								style={linkStyle}
								onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.opacity = '0.8';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.opacity = '1';
								}}
							>
								Check-In
							</a>
							<a
								href="#"
								style={linkStyle}
								onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.opacity = '0.8';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.opacity = '1';
								}}
							>
								My Account
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
				</div>

				{/* Mobile Menu */}
				{isMobileMenuOpen && (
					<div
						style={{
							background: '#304cb2',
							padding: '1rem',
							display: 'none', // Hidden on desktop
						}}
					>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
							<a
								href="#"
								style={{ ...linkStyle, padding: '0.5rem 0' }}
								onClick={closeMobileMenu}
								onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.opacity = '0.8';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.opacity = '1';
								}}
							>
								Book
							</a>
							<a
								href="#"
								style={{ ...linkStyle, padding: '0.5rem 0' }}
								onClick={closeMobileMenu}
								onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.opacity = '0.8';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.opacity = '1';
								}}
							>
								Flight Status
							</a>
							<a
								href="#"
								style={{ ...linkStyle, padding: '0.5rem 0' }}
								onClick={closeMobileMenu}
								onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.opacity = '0.8';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.opacity = '1';
								}}
							>
								Check-In
							</a>
							<a
								href="#"
								style={{ ...linkStyle, padding: '0.5rem 0' }}
								onClick={closeMobileMenu}
								onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.opacity = '0.8';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.opacity = '1';
								}}
							>
								My Account
							</a>
						</div>
					</div>
				)}
			</nav>
		</div>
	);
};
