/**
 * @file CompanySelector.tsx
 * @module protect-portal/components
 * @description Company selection dropdown component
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a dropdown for selecting different companies
 * to demonstrate the protect portal functionality across different brands.
 */

import React, { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import styled from 'styled-components';
import { useBrandTheme } from '../themes/theme-provider';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const SelectorContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto 2rem auto;
`;

const SelectorButton = styled.button`
  width: 100%;
  padding: 1rem 1.5rem;
  background: var(--brand-surface);
  border: 2px solid var(--brand-primary);
  border-radius: var(--brand-radius-md);
  font-size: 1rem;
  font-weight: 600;
  color: var(--brand-text);
  cursor: pointer;
  transition: var(--brand-transition);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-family: var(--brand-body-font);

  &:hover {
    background: var(--brand-primary);
    color: white;
    border-color: var(--brand-accent);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SelectorIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const DropdownIcon = styled(FiChevronDown)<{ isOpen: boolean }>`
	shouldForwardProp={(prop) => prop !== 'isOpen'}
	transition: transform 0.2s ease;
	transform: ${(props) => (props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
	shouldForwardProp={(prop) => prop !== 'isOpen'}
	position: absolute;
	top: 100%;
	left: 0;
	right: 0;
	margin-top: 0.5rem;
	background: white;
	border: 1px solid var(--brand-text-secondary);
	border-radius: var(--brand-radius-md);
	box-shadow: var(--brand-shadow-lg);
	z-index: 1000;
	max-height: 300px;
	overflow-y: auto;
	opacity: ${(props) => (props.isOpen ? 1 : 0)};
	visibility: ${(props) => (props.isOpen ? 'visible' : 'hidden')};
	transform: translateY(${(props) => (props.isOpen ? '0' : '-10px')});
	transition: all 0.2s ease;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  text-align: left;
  font-size: 1rem;
  color: var(--brand-text);
  cursor: pointer;
  transition: var(--brand-transition);
  display: flex;
  align-items: center;
  gap: 1rem;
  font-family: var(--brand-body-font);

  &:hover {
    background: var(--brand-surface);
    color: var(--brand-primary);
  }

  &:first-child {
    border-radius: var(--brand-radius-md) var(--brand-radius-md) 0 0;
  }

  &:last-child {
    border-radius: 0 0 var(--brand-radius-md) var(--brand-radius-md);
  }
`;

const CompanyLogo = styled.div<{ color: string; bgColor: string }>`
	shouldForwardProp={(prop) => prop !== 'color' && prop !== 'bgColor'}
	width: 32px;
	height: 32px;
	background: ${(props) => props.bgColor};
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: 14px;
	color: ${(props) => props.color};
	font-family: 'Arial', sans-serif;
	flex-shrink: 0;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	transition: transform 0.2s ease;

	&:hover {
		transform: scale(1.05);
	}
`;

const CompanyInfo = styled.div`
  flex: 1;
  text-align: left;
`;

const CompanyName = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const CompanyDescription = styled.div`
  font-size: 0.875rem;
  color: var(--brand-text-secondary);
`;

// ============================================================================
// COMPANY DATA
// ============================================================================

const companies = [
	{
		id: 'default',
		name: 'Default Portal',
		description: 'Standard protect portal experience',
		logo: 'P',
		logoColor: 'white',
		logoBg: '#3b82f6',
		theme: 'default',
	},
	{
		id: 'american-airlines',
		name: 'American Airlines',
		description: 'Aviation industry security demo',
		logo: 'AA',
		logoColor: 'white',
		logoBg: '#0033a0',
		theme: 'american-airlines',
	},
	{
		id: 'southwest-airlines',
		name: 'Southwest Airlines',
		description: 'Low-cost carrier security demo',
		logo: 'SW',
		logoColor: '#3157a4',
		logoBg: '#ffd700',
		theme: 'southwest-airlines',
	},
	{
		id: 'fedex',
		name: 'FedEx',
		description: 'Logistics and shipping security demo',
		logo: 'FX',
		logoColor: 'white',
		logoBg: '#ff6600',
		theme: 'fedex',
	},
	{
		id: 'united-airlines',
		name: 'United Airlines',
		description: 'Global airline security demo',
		logo: 'UA',
		logoColor: 'white',
		logoBg: '#0033a0',
		theme: 'united-airlines',
	},
];

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface CompanySelectorProps {
	onCompanyChange?: (company: (typeof companies)[0]) => void;
	selectedCompany?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CompanySelector: React.FC<CompanySelectorProps> = ({
	onCompanyChange,
	selectedCompany = 'default',
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const { switchTheme, activeTheme } = useBrandTheme();

	const currentCompany = companies.find((c) => c.id === selectedCompany) || companies[0];

	// Debug logging
	console.log('[🚀 COMPANY-SELECTOR] Component rendering:', {
		selectedCompany,
		currentCompany: currentCompany.id,
		activeTheme: activeTheme.name,
		isOpen,
		companiesCount: companies.length,
	});

	const handleSelect = (company: (typeof companies)[0]) => {
		setIsOpen(false);

		// Change theme if different
		if (company.theme !== currentCompany.theme) {
			switchTheme(company.theme);
		}

		// Notify parent
		if (onCompanyChange) {
			onCompanyChange(company);
		}
	};

	const handleToggle = () => {
		setIsOpen(!isOpen);
	};

	// Close dropdown when clicking outside
	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (isOpen && !(event.target as Element).closest('.company-selector')) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen]);

	return (
		<SelectorContainer className="company-selector">
			<SelectorButton onClick={handleToggle} aria-expanded={isOpen}>
				<SelectorIcon>
					<CompanyLogo color={currentCompany.logoColor} bgColor={currentCompany.logoBg}>
						{currentCompany.logo}
					</CompanyLogo>
					<div>
						<CompanyName>{currentCompany.name}</CompanyName>
						<CompanyDescription>{currentCompany.description}</CompanyDescription>
					</div>
				</SelectorIcon>
				<DropdownIcon isOpen={isOpen} />
			</SelectorButton>

			<DropdownMenu isOpen={isOpen}>
				{companies.map((company) => (
					<DropdownItem
						key={company.id}
						onClick={() => handleSelect(company)}
						aria-selected={company.id === selectedCompany}
					>
						<CompanyLogo color={company.logoColor} bgColor={company.logoBg}>
							{company.logo}
						</CompanyLogo>
						<CompanyInfo>
							<CompanyName>{company.name}</CompanyName>
							<CompanyDescription>{company.description}</CompanyDescription>
						</CompanyInfo>
					</DropdownItem>
				))}
			</DropdownMenu>
		</SelectorContainer>
	);
};

export default CompanySelector;
