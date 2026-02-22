/**
 * @file FedExNavigation.PingUI.tsx
 * @module protect-portal/components
 * @description FedEx navigation component matching fedex.com style - Ping UI version
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

const navTopStyle = {
	background: '#4d148c',
	color: 'white',
	padding: '0.5rem 0',
	fontSize: '0.875rem',
};

const navTopContentStyle = {
	maxWidth: '1200px',
	margin: '0 auto',
	padding: '0 1rem',
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
};

const navMainStyle = {
	background: 'white',
	padding: '1rem 0',
};

const navMainContentStyle = {
	maxWidth: '1200px',
	margin: '0 auto',
	padding: '0 1rem',
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
};

const logoSectionStyle = {
	display: 'flex',
	alignItems: 'center' as const,
	gap: '0.5rem',
};

const navLinksStyle = {
	display: 'flex',
	alignItems: 'center' as const,
	gap: '2rem',
};

const linkStyle = {
	color: '#666666',
	textDecoration: 'none',
	fontSize: '16px',
	fontWeight: '500',
	transition: 'color 0.15s ease-in-out',
	cursor: 'pointer',
};

const iconButtonStyle = {
	background: 'none',
	border: 'none',
	color: '#666666',
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

export const FedExNavigation: React.FC = () => {
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
				{/* Top Navigation Bar */}
				<div style={navTopStyle}>
					<div style={navTopContentStyle}>
						<span>Track, Ship & More</span>
						<span>Customer Support: 1-800-FEDEX</span>
					</div>
				</div>

				{/* Main Navigation */}
				<div style={navMainStyle}>
					<div style={navMainContentStyle}>
						{/* Logo Section */}
						<div style={logoSectionStyle}>
							<MDIIcon icon="package" size={32} aria-hidden={true} />
							<span style={{ color: '#4d148c', fontSize: '20px', fontWeight: '700' }}>FedEx</span>
						</div>

						{/* Desktop Navigation Links */}
						<div style={navLinksStyle}>
							<a
								href="#"
								style={linkStyle}
								onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.color = '#4d148c';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.color = '#666666';
								}}
							>
								Ship
							</a>
							<a
								href="#"
								style={linkStyle}
								onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.color = '#4d148c';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.color = '#666666';
								}}
							>
								Track
							</a>
							<a
								href="#"
								style={linkStyle}
								onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.color = '#4d148c';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.color = '#666666';
								}}
							>
								Manage
							</a>
							<a
								href="#"
								style={linkStyle}
								onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.color = '#4d148c';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.color = '#666666';
								}}
							>
								Support
							</a>
						</div>

						{/* Right Section */}
						<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
							{/* Search Button */}
							<button
								style={iconButtonStyle}
								aria-label="Search"
								onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
									e.currentTarget.style.backgroundColor = 'rgba(77, 20, 140, 0.1)';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
									e.currentTarget.style.backgroundColor = 'transparent';
								}}
							>
								<MDIIcon icon="magnify" size={20} aria-hidden={true} />
							</button>

							{/* Track Button */}
							<button
								style={{
									...iconButtonStyle,
									background: '#4d148c',
									color: 'white',
									padding: '8px 16px',
									borderRadius: '4px',
								}}
								aria-label="Track package"
								onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
									e.currentTarget.style.backgroundColor = '#6b1fa8';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
									e.currentTarget.style.backgroundColor = '#4d148c';
								}}
							>
								<MDIIcon icon="package-variant-closed" size={16} aria-hidden={true} />
								Track
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
							background: 'white',
							borderTop: '1px solid #e5e5e5',
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
									e.currentTarget.style.color = '#4d148c';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.color = '#666666';
								}}
							>
								Ship
							</a>
							<a
								href="#"
								style={{ ...linkStyle, padding: '0.5rem 0' }}
								onClick={closeMobileMenu}
								onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.color = '#4d148c';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.color = '#666666';
								}}
							>
								Track
							</a>
							<a
								href="#"
								style={{ ...linkStyle, padding: '0.5rem 0' }}
								onClick={closeMobileMenu}
								onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.color = '#4d148c';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.color = '#666666';
								}}
							>
								Manage
							</a>
							<a
								href="#"
								style={{ ...linkStyle, padding: '0.5rem 0' }}
								onClick={closeMobileMenu}
								onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.color = '#4d148c';
								}}
								onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => {
									e.currentTarget.style.color = '#666666';
								}}
							>
								Support
							</a>
						</div>
					</div>
				)}
			</nav>
		</div>
	);
};
