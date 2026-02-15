/**
 * @file BrandDropdownSelector.tsx
 * @module protect-portal/components
 * @description Dropdown brand selector component for switching corporate themes
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This component provides a dropdown interface for switching between different
 * corporate brand themes in the Protect Portal with company logos.
 */

import React, { useEffect, useRef, useState } from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';
import styled from 'styled-components';
import { useBrandTheme } from '../themes/theme-provider';
import TextLogo from './TextLogo';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
  transition: all 0.2s ease;
  font-family: var(--brand-body-font);
  min-width: 160px;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DropdownArrow = styled(FiChevronDown)<{ $rotate: boolean }>`
  transition: transform 0.2s ease;
  transform: ${({ $rotate }) => ($rotate ? 'rotate(180deg)' : 'rotate(0deg)')};
  margin-left: auto;
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(20px);
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
  transform: translateY(${({ $isOpen }) => ($isOpen ? '0' : '-10px')});
  transition: all 0.2s ease;
  z-index: 1000;
  max-height: 250px;
  overflow-y: auto;
`;

const MenuItem = styled.button.withConfig({
	shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: ${({ isActive }) => (isActive ? 'rgba(0, 102, 204, 0.1)' : 'transparent')};
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 400;
  color: #333;
  transition: all 0.2s ease;
  font-family: var(--brand-body-font);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ isActive }) => (isActive ? 'rgba(0, 102, 204, 0.2)' : 'rgba(0, 0, 0, 0.05)')};
  }

  &:focus {
    outline: none;
    background: ${({ isActive }) => (isActive ? 'rgba(0, 102, 204, 0.2)' : 'rgba(0, 0, 0, 0.05)')};
  }
`;

const MenuItemText = styled.div`
  flex: 1;
  text-align: left;
  font-weight: 400;
  font-size: 0.8rem;
`;

const CheckIcon = styled(FiCheck)`
  color: var(--brand-primary);
  font-size: 0.875rem;
`;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface BrandDropdownSelectorProps {
	className?: string;
	disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const BrandDropdownSelector: React.FC<BrandDropdownSelectorProps> = ({
	className,
	disabled = false,
}) => {
	const { activeTheme, availableThemes, switchTheme } = useBrandTheme();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleToggle = () => {
		if (!disabled) {
			setIsOpen(!isOpen);
		}
	};

	const handleSelect = (themeName: string) => {
		switchTheme(themeName);
		setIsOpen(false);
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === 'Escape') {
			setIsOpen(false);
		}
	};

	return (
		<DropdownContainer className={className} ref={dropdownRef}>
			<DropdownButton
				onClick={handleToggle}
				onKeyDown={handleKeyDown}
				disabled={disabled}
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				aria-label="Select company theme"
			>
				<TextLogo
					text={activeTheme.logo.text || activeTheme.displayName}
					colors={activeTheme.logo.colors || {}}
					width="16px"
					height="16px"
					alt={activeTheme.logo.alt}
				/>
				<DropdownArrow $rotate={isOpen} />
			</DropdownButton>

			<DropdownMenu $isOpen={isOpen} role="listbox">
				{availableThemes.map((theme) => (
					<MenuItem
						key={theme.name}
						isActive={theme.name === activeTheme.name}
						onClick={() => handleSelect(theme.name)}
						role="option"
						aria-selected={theme.name === activeTheme.name}
					>
						<TextLogo
							text={theme.logo.text || theme.displayName}
							colors={theme.logo.colors || {}}
							width="14px"
							height="14px"
							alt={theme.logo.alt}
						/>
						<MenuItemText>
							{theme.displayName}
						</MenuItemText>
						{theme.name === activeTheme.name && <CheckIcon />}
					</MenuItem>
				))}
			</DropdownMenu>
		</DropdownContainer>
	);
};

export default BrandDropdownSelector;
