/**
 * @file DropdownLogin.PingUI.tsx
 * @module protect-portal/components/LoginPatterns
 * @description Dropdown login component - PingUI version
 * @version 9.11.58
 * @since 2026-02-15
 *
 * Header dropdown login form for Southwest Airlines pattern.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { CorporatePortalConfig } from '../../types/CorporatePortalConfig';

// ============================================================================
// MDI ICON COMPONENT
// ============================================================================

const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	'aria-label'?: string;
	'aria-hidden'?: boolean;
}> = ({ icon, size = 24, className = '', 'aria-label': ariaLabel, 'aria-hidden': ariaHidden }) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: size }}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
		/>
	);
};

// ============================================================================
// STYLE FUNCTIONS
// ============================================================================

const getLoginDropdownStyle = (isOpen: boolean) => ({
	position: 'absolute' as const,
	top: '100%',
	right: 0,
	width: '320px',
	background: 'white',
	border: '1px solid #e0e0e0',
	borderRadius: '8px',
	boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
	opacity: isOpen ? 1 : 0,
	visibility: isOpen ? ('visible' as const) : ('hidden' as const),
	transform: `translateY(${isOpen ? '0' : '-10px'})`,
	transition: 'all 0.2s ease',
	zIndex: 1000,
	marginTop: '0.5rem',
});

const getDropdownHeaderStyle = (brandColor: string) => ({
	background: brandColor,
	color: 'white',
	padding: '1rem',
	borderRadius: '8px 8px 0 0',
	display: 'flex',
	justifyContent: 'space-between' as const,
	alignItems: 'center',
});

const getDropdownTitleStyle = () => ({
	fontSize: '1rem',
	fontWeight: '600',
	margin: 0,
	display: 'flex',
	alignItems: 'center' as const,
	gap: '0.5rem',
});

const getCloseButtonStyle = () => ({
	background: 'none',
	border: 'none',
	color: 'white',
	fontSize: '1.2rem',
	cursor: 'pointer',
	padding: '0.25rem',
	borderRadius: '4px',
	transition: 'background 0.15s ease-in-out',
});

const getDropdownContentStyle = () => ({
	padding: '1.5rem',
});

const getLoginFormStyle = () => ({
	display: 'flex',
	flexDirection: 'column' as const,
	gap: '1rem',
});

const getInputGroupStyle = () => ({
	display: 'flex',
	flexDirection: 'column' as const,
	gap: '0.5rem',
});

const getInputLabelStyle = () => ({
	fontSize: '0.875rem',
	fontWeight: '600',
	color: '#333',
});

const getInputStyle = () => ({
	padding: '0.75rem',
	border: '2px solid #e0e0e0',
	borderRadius: '6px',
	fontSize: '0.875rem',
	transition: 'border-color 0.2s ease',
});

const getLoginButtonStyle = (accentColor: string) => ({
	background: accentColor,
	color: 'white',
	border: 'none',
	borderRadius: '6px',
	padding: '0.75rem',
	fontSize: '0.875rem',
	fontWeight: '600',
	cursor: 'pointer',
	transition: 'background 0.2s ease',
	display: 'flex',
	alignItems: 'center' as const,
	justifyContent: 'center' as const,
	gap: '0.5rem',
});

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface DropdownLoginProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (credentials: { username: string; password: string }) => void;
	config: CorporatePortalConfig;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DropdownLogin: React.FC<DropdownLoginProps> = ({ isOpen, onClose, onSubmit, config }) => {
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [formData, setFormData] = useState({
		username: '',
		password: '',
	});

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}
		return undefined;
	}, [isOpen, onClose]);

	// Handle form submission
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formData);
	};

	// Handle input changes
	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const brandColor = config.branding.colors.primary;
	const accentColor = config.branding.colors.accent;

	return (
		<div className="end-user-nano">
			<div style={getLoginDropdownStyle(isOpen)} ref={dropdownRef}>
				<div style={getDropdownHeaderStyle(brandColor)}>
					<h3 style={getDropdownTitleStyle()}>
						<MDIIcon icon="lock" aria-hidden={true} />
						{config.content.customerTerminology ? 'Customer Login' : 'Employee Login'}
					</h3>
					<button
						style={getCloseButtonStyle()}
						type="button"
						onClick={onClose}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = 'none';
						}}
					>
						<MDIIcon icon="close" size={20} aria-hidden={true} />
					</button>
				</div>

				<div style={getDropdownContentStyle()}>
					<form style={getLoginFormStyle()} onSubmit={handleSubmit}>
						<div style={getInputGroupStyle()}>
							<label style={getInputLabelStyle()} htmlFor="username">
								{config.content.customerTerminology ? 'Customer ID' : 'Employee ID'}
							</label>
							<input
								style={getInputStyle()}
								id="username"
								type="text"
								value={formData.username}
								onChange={(e) => handleInputChange('username', e.target.value)}
								placeholder={`Enter your ${config.content.customerTerminology ? 'customer' : 'employee'} ID`}
								required
								onFocus={(e) => {
									e.target.style.borderColor = brandColor;
								}}
								onBlur={(e) => {
									e.target.style.borderColor = '#e0e0e0';
								}}
							/>
						</div>

						<div style={getInputGroupStyle()}>
							<label style={getInputLabelStyle()} htmlFor="password">
								Password
							</label>
							<input
								style={getInputStyle()}
								id="password"
								type="password"
								value={formData.password}
								onChange={(e) => handleInputChange('password', e.target.value)}
								placeholder="Enter your password"
								required
								onFocus={(e) => {
									e.target.style.borderColor = brandColor;
								}}
								onBlur={(e) => {
									e.target.style.borderColor = '#e0e0e0';
								}}
							/>
						</div>

						<button
							style={getLoginButtonStyle(accentColor)}
							type="submit"
							onMouseEnter={(e) => {
								e.currentTarget.style.background = brandColor;
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = accentColor;
							}}
						>
							<MDIIcon icon="lock" size={16} aria-hidden={true} />
							Sign In
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default DropdownLogin;
