/**
 * @file BrandDropdownSelector.PingUI.tsx
 * @module protect-portal/components
 * @description Dropdown brand selector component for switching corporate themes - Ping UI version
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a dropdown interface for switching between different
 * corporate brand themes in the Protect Portal with company logos.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useBrandTheme } from '../themes/theme-provider';
import TextLogo from './TextLogo';

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

const dropdownContainerStyle: React.CSSProperties = {
	position: 'relative',
	display: 'inline-block',
	zIndex: 12000,
};

const getDropdownButtonStyle = (isOpen: boolean, brandBodyFont?: string) => ({
	display: 'flex',
	alignItems: 'center' as const,
	gap: '0.5rem',
	justifyContent: 'space-between',
	padding: '0.55rem 0.85rem',
	background: isOpen ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)',
	border: isOpen ? '1px solid rgba(255, 255, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.3)',
	borderRadius: '6px',
	cursor: 'pointer',
	fontSize: '0.85rem',
	fontWeight: '600',
	color: 'white',
	transition: 'all 0.15s ease-in-out',
	fontFamily: brandBodyFont || 'inherit',
	minWidth: '120px',
	backdropFilter: 'blur(10px)',
	transform: isOpen ? 'translateY(-1px)' : 'translateY(0)',
	boxShadow: isOpen ? '0 4px 8px rgba(0, 0, 0, 0.2)' : 'none',
});

const dropdownMenuStyle: React.CSSProperties = {
	position: 'absolute' as const,
	top: '100%',
	right: 0,
	marginTop: '0.5rem',
	background: 'white',
	border: '1px solid #e5e5e5',
	borderRadius: '8px',
	boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
	minWidth: '200px',
	maxHeight: '300px',
	overflowY: 'auto' as const,
	zIndex: 12001,
};

const menuItemStyle = {
	display: 'flex',
	alignItems: 'center' as const,
	gap: '0.75rem',
	padding: '0.75rem 1rem',
	cursor: 'pointer',
	transition: 'background-color 0.15s ease-in-out',
	border: 'none',
	background: 'none',
	width: '100%',
	textAlign: 'left' as const,
	fontSize: '14px',
};

const activeItemStyle = {
	backgroundColor: '#e3f2fd',
	color: '#1976d2',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const BrandDropdownSelector: React.FC = () => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const { activeTheme, availableThemes, switchTheme } = useBrandTheme();

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
	};

	const handleThemeSelect = (themeName: string) => {
		switchTheme(themeName);
		setIsOpen(false);
	};

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<div className="end-user-nano">
			<div ref={dropdownRef} style={dropdownContainerStyle}>
				{/* Dropdown Button */}
				<button
					style={getDropdownButtonStyle(isOpen, activeTheme?.typography?.fontFamily)}
					onClick={toggleDropdown}
					aria-label="Select brand theme"
					aria-expanded={isOpen}
					aria-haspopup="listbox"
				>
					<TextLogo
						text={activeTheme?.displayName || 'Ping Identity'}
						colors={activeTheme?.logo?.colors || {}}
						width="120px"
						height="24px"
					/>
					<MDIIcon icon="chevron-down" size={16} aria-hidden={true} />
				</button>

				{/* Dropdown Menu */}
				{isOpen && (
					<div style={dropdownMenuStyle} role="listbox">
						{availableThemes.map((theme) => (
							<button
								key={theme.name}
								style={{
									...menuItemStyle,
									...(activeTheme?.name === theme.name ? activeItemStyle : {}),
								}}
								onClick={() => handleThemeSelect(theme.name)}
								role="option"
								aria-selected={activeTheme?.name === theme.name}
								onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
									if (activeTheme?.name !== theme.name) {
										e.currentTarget.style.backgroundColor = '#f5f5f5';
									}
								}}
								onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
									if (activeTheme?.name !== theme.name) {
										e.currentTarget.style.backgroundColor = 'transparent';
									}
								}}
							>
								<TextLogo
									text={theme.displayName}
									colors={theme.logo?.colors || {}}
									width="80px"
									height="20px"
								/>
								<span style={{ fontSize: '13px', color: '#666' }}>{theme.displayName}</span>
								{activeTheme?.name === theme.name && (
									<MDIIcon icon="check" size={16} aria-hidden={true} />
								)}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
};
