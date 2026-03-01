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

import { FiCheck, FiChevronDown } from '@icons';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useBrandTheme } from '../themes/theme-provider';
import TextLogo from './TextLogo';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
  z-index: 12000;
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: space-between;
  padding: 0.55rem 0.85rem;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
  transition: all 0.2s ease;
  font-family: var(--brand-body-font);
  min-width: 120px;
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

const CurrentBrandText = styled.span`
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const BrandIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  flex: 1;
`;

const LogoWrapper = styled.div<{ $width: string }>`
  flex-shrink: 0;
  width: ${({ $width }) => $width};
`;

const DropdownArrow = styled(FiChevronDown)<{ $rotate: boolean }>`
  transition: transform 0.2s ease;
  transform: ${({ $rotate }) => ($rotate ? 'rotate(180deg)' : 'rotate(0deg)')};
  flex-shrink: 0;
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
  z-index: 12001;
  min-width: 360px;
  max-height: 250px;
  overflow-y: auto;
`;

const MenuItem = styled.button.withConfig({
	shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
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
  flex: 1 1 auto;
  text-align: left;
  font-weight: 600;
  font-size: 0.85rem;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

interface LogoSize {
	width: string;
	height: string;
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

	const getBrandLogoSize = (themeName: string, context: 'closed' | 'menu'): LogoSize => {
		switch (themeName) {
			case 'southwest-airlines':
				return context === 'closed'
					? { width: '74px', height: '22px' }
					: { width: '78px', height: '24px' };
			case 'american-airlines':
				return context === 'closed'
					? { width: '70px', height: '22px' }
					: { width: '74px', height: '24px' };
			case 'bank-of-america':
				return context === 'closed'
					? { width: '76px', height: '22px' }
					: { width: '82px', height: '24px' };
			case 'pingidentity':
				return context === 'closed'
					? { width: '74px', height: '22px' }
					: { width: '80px', height: '24px' };
			case 'fedex':
				return context === 'closed'
					? { width: '66px', height: '22px' }
					: { width: '70px', height: '24px' };
			default:
				return context === 'closed'
					? { width: '68px', height: '22px' }
					: { width: '72px', height: '24px' };
		}
	};

	const orderedThemes = [...availableThemes].sort((a, b) => {
		if (a.name === 'pingidentity') return -1;
		if (b.name === 'pingidentity') return 1;
		return 0;
	});

	const activeLogoSize = getBrandLogoSize(activeTheme.name, 'closed');

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
				<BrandIdentity>
					<LogoWrapper $width={activeLogoSize.width}>
						<TextLogo
							text={activeTheme.logo?.text || activeTheme.displayName}
							colors={activeTheme.logo?.colors || {}}
							width={activeLogoSize.width}
							height={activeLogoSize.height}
							alt={activeTheme.logo?.alt || `${activeTheme.displayName} Logo`}
						/>
					</LogoWrapper>
					<CurrentBrandText style={{ display: 'none' }}>{activeTheme.displayName}</CurrentBrandText>
				</BrandIdentity>
				<DropdownArrow $rotate={isOpen} />
			</DropdownButton>

			<DropdownMenu $isOpen={isOpen} role="listbox">
				{orderedThemes.map((theme) => {
					const menuLogoSize = getBrandLogoSize(theme.name, 'menu');

					return (
						<MenuItem
							key={theme.name}
							isActive={theme.name === activeTheme.name}
							onClick={() => handleSelect(theme.name)}
							role="option"
							aria-selected={theme.name === activeTheme.name}
						>
							<BrandIdentity>
								<LogoWrapper $width={menuLogoSize.width}>
									<TextLogo
										text={theme.logo?.text || theme.displayName}
										colors={theme.logo?.colors || {}}
										width={menuLogoSize.width}
										height={menuLogoSize.height}
										alt={theme.logo?.alt || `${theme.displayName} Logo`}
									/>
								</LogoWrapper>
								<MenuItemText>
									{theme.name === 'pingidentity'
										? `${theme.displayName} (Default)`
										: theme.displayName}
								</MenuItemText>
							</BrandIdentity>
							{theme.name === activeTheme.name && <CheckIcon />}
						</MenuItem>
					);
				})}
			</DropdownMenu>
		</DropdownContainer>
	);
};

export default BrandDropdownSelector;
