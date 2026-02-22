/**
 * @file CompanySelector.PingUI.tsx
 * @module protect-portal/components
 * @description Company selection dropdown component - Ping UI version
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a dropdown for selecting different companies
 * to demonstrate the protect portal functionality across different brands.
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

const selectorContainerStyle: React.CSSProperties = {
	position: 'relative',
	width: '100%',
	maxWidth: '400px',
	margin: '0 auto 2rem auto',
};

const getSelectorButtonStyle = (isOpen: boolean, brandPrimary?: string) => ({
	width: '100%',
	padding: '1rem 1.5rem',
	background: isOpen ? brandPrimary || '#0066cc' : 'var(--brand-surface, #f8f9fa)',
	border: `2px solid ${brandPrimary || '#0066cc'}`,
	borderRadius: 'var(--brand-radius-md, 8px)',
	fontSize: '1rem',
	fontWeight: '600',
	color: isOpen ? 'white' : 'var(--brand-text, #1a1a1a)',
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	display: 'flex',
	alignItems: 'center' as const,
	justifyContent: 'space-between',
	gap: '1rem',
	fontFamily: 'var(--brand-body-font, inherit)',
});

const dropdownMenuStyle = {
	position: 'absolute' as const,
	top: '100%',
	left: 0,
	right: 0,
	marginTop: '0.5rem',
	background: 'white',
	border: '1px solid #e5e5e5',
	borderRadius: '8px',
	boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
	maxHeight: '300px',
	overflowY: 'auto' as const,
	zIndex: 1000,
};

const menuItemStyle = {
	padding: '1rem 1.5rem',
	cursor: 'pointer',
	transition: 'background-color 0.15s ease-in-out',
	border: 'none',
	background: 'none',
	width: '100%',
	textAlign: 'left' as const,
	fontSize: '16px',
	color: '#1a1a1a',
};

const activeItemStyle = {
	backgroundColor: '#e3f2fd',
	color: '#0066cc',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CompanySelector: React.FC = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedCompany, setSelectedCompany] = useState('pingidentity');
	const { activeTheme } = useBrandTheme();

	const companies: Array<{ key: string; name: string; description: string; logo?: string }> = [];
	// const companies = CompanyConfigService.getAvailableCompanies();

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
	};

	const handleCompanySelect = (companyKey: string) => {
		setSelectedCompany(companyKey);
		setIsOpen(false);
		// Handle company selection logic
		console.log('Selected company:', companyKey);
	};

	// Close dropdown when clicking outside
	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Element;
			if (!target.closest('.company-selector')) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}
		return undefined;
	}, [isOpen]);

	const currentCompany = companies.find(
		(c: { key: string; name: string; description: string; logo?: string }) =>
			c.key === selectedCompany
	) || { key: 'default', name: 'Select Company', description: 'Choose a company from the list' };

	return (
		<div className="end-user-nano">
			<div className="company-selector" style={selectorContainerStyle}>
				{/* Selector Button */}
				<button
					style={getSelectorButtonStyle(isOpen, activeTheme?.colors?.primary)}
					onClick={toggleDropdown}
					aria-label="Select company"
					aria-expanded={isOpen}
					aria-haspopup="listbox"
				>
					<span>{currentCompany?.name || 'Select Company'}</span>
					<MDIIcon icon="chevron-down" size={20} aria-hidden={true} />
				</button>

				{/* Dropdown Menu */}
				{isOpen && (
					<div style={dropdownMenuStyle} role="listbox">
						{companies.map(
							(company: { key: string; name: string; description: string; logo?: string }) => (
								<button
									key={company.key}
									style={{
										...menuItemStyle,
										...(selectedCompany === company.key ? activeItemStyle : {}),
									}}
									onClick={() => handleCompanySelect(company.key)}
									role="option"
									aria-selected={selectedCompany === company.key}
									onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => {
										if (selectedCompany !== company.key) {
											e.currentTarget.style.backgroundColor = '#f8f9fa';
										}
									}}
									onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => {
										if (selectedCompany !== company.key) {
											e.currentTarget.style.backgroundColor = 'transparent';
										}
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
										{company.logo && (
											<img
												src={company.logo}
												alt={company.name}
												style={{ width: '24px', height: '24px', objectFit: 'contain' }}
											/>
										)}
										<div>
											<div style={{ fontWeight: '600', marginBottom: '2px' }}>{company.name}</div>
											<div style={{ fontSize: '14px', color: '#666' }}>{company.description}</div>
										</div>
									</div>
								</button>
							)
						)}
					</div>
				)}
			</div>
		</div>
	);
};
