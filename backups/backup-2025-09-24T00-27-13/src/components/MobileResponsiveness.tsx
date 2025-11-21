import React, { useEffect, useState } from 'react';
import { FiChevronDown, FiChevronUp, FiMenu, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import { useAccessibility } from '../hooks/useAccessibility';

// Styled components
const MobileContainer = styled.div<{ $isMobile: boolean }>`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  
  ${({ $isMobile }) =>
		$isMobile &&
		`
    padding-top: 80px; /* Account for fixed navbar */
  `}
`;

const MobileHeader = styled.div<{ $isMobile: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  position: ${({ $isMobile }) => ($isMobile ? 'fixed' : 'relative')};
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  
  ${({ $isMobile }) =>
		$isMobile &&
		`
    height: 80px;
  `}
`;

const MobileTitle = styled.h1`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};
`;

const MobileMenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.gray700};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray100};
  }
  
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const MobileSidebar = styled.div<{ $isOpen: boolean; $isMobile: boolean }>`
  position: ${({ $isMobile }) => ($isMobile ? 'fixed' : 'relative')};
  top: ${({ $isMobile }) => ($isMobile ? '80px' : '0')};
  left: 0;
  width: ${({ $isMobile }) => ($isMobile ? '280px' : '100%')};
  height: ${({ $isMobile }) => ($isMobile ? 'calc(100vh - 80px)' : 'auto')};
  background: ${({ theme }) => theme.colors.white};
  border-right: 1px solid ${({ theme }) => theme.colors.gray200};
  transform: ${({ $isOpen, $isMobile }) =>
		$isMobile ? ($isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none'};
  transition: transform 0.3s ease;
  z-index: 999;
  overflow-y: auto;
  
  ${({ $isMobile }) =>
		$isMobile &&
		`
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  `}
`;

const MobileOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
  transition: all 0.3s ease;
`;

const MobileContent = styled.div<{ $isMobile: boolean }>`
  flex: 1;
  padding: ${({ $isMobile }) => ($isMobile ? '1rem' : '2rem')};
  overflow-x: auto;
  
  ${({ $isMobile }) =>
		$isMobile &&
		`
    max-width: 100%;
  `}
`;

const MobileCard = styled.div<{ $isMobile: boolean }>`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  padding: ${({ $isMobile }) => ($isMobile ? '1rem' : '1.5rem')};
  margin-bottom: 1rem;
  
  ${({ $isMobile }) =>
		$isMobile &&
		`
    margin: 0 0 1rem 0;
  `}
`;

const MobileGrid = styled.div<{ $isMobile: boolean; $columns?: number }>`
  display: grid;
  grid-template-columns: ${({ $isMobile, $columns = 2 }) =>
		$isMobile ? '1fr' : `repeat(${$columns}, 1fr)`};
  gap: ${({ $isMobile }) => ($isMobile ? '1rem' : '1.5rem')};
`;

const MobileButton = styled.button<{
	$variant?: 'primary' | 'secondary' | 'danger';
	$isMobile: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: ${({ $isMobile }) => ($isMobile ? '0.75rem 1rem' : '0.875rem 1.5rem')};
  border-radius: 8px;
  border: 1px solid ${({ $variant, theme }) => {
		switch ($variant) {
			case 'primary':
				return theme.colors.primary;
			case 'danger':
				return theme.colors.danger;
			default:
				return theme.colors.gray300;
		}
	}};
  background: ${({ $variant, theme }) => {
		switch ($variant) {
			case 'primary':
				return theme.colors.primary;
			case 'danger':
				return theme.colors.danger;
			default:
				return 'white';
		}
	}};
  color: ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
			case 'danger':
				return 'white';
			default:
				return '#374151';
		}
	}};
  font-weight: 600;
  font-size: ${({ $isMobile }) => ($isMobile ? '0.875rem' : '1rem')};
  cursor: pointer;
  transition: all 0.2s ease;
  width: ${({ $isMobile }) => ($isMobile ? '100%' : 'auto')};
  
  &:hover:not(:disabled) {
    background: ${({ $variant, theme }) => {
			switch ($variant) {
				case 'primary':
					return theme.colors.primaryDark;
				case 'danger':
					return '#dc2626';
				default:
					return theme.colors.gray100;
			}
		}};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const MobileInput = styled.input<{ $isMobile: boolean }>`
  width: 100%;
  padding: ${({ $isMobile }) => ($isMobile ? '0.75rem' : '0.875rem')};
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 8px;
  font-size: ${({ $isMobile }) => ($isMobile ? '1rem' : '0.875rem')};
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const MobileSelect = styled.select<{ $isMobile: boolean }>`
  width: 100%;
  padding: ${({ $isMobile }) => ($isMobile ? '0.75rem' : '0.875rem')};
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 8px;
  font-size: ${({ $isMobile }) => ($isMobile ? '1rem' : '0.875rem')};
  background: white;
  cursor: pointer;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const MobileTextarea = styled.textarea<{ $isMobile: boolean }>`
  width: 100%;
  padding: ${({ $isMobile }) => ($isMobile ? '0.75rem' : '0.875rem')};
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 8px;
  font-size: ${({ $isMobile }) => ($isMobile ? '1rem' : '0.875rem')};
  font-family: inherit;
  resize: vertical;
  min-height: ${({ $isMobile }) => ($isMobile ? '120px' : '100px')};
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const MobileCollapsible = styled.div<{ $isOpen: boolean }>`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
`;

const MobileCollapsibleHeader = styled.button<{ $isOpen: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.gray50};
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray100};
  }
  
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: -2px;
  }
`;

const MobileCollapsibleContent = styled.div<{ $isOpen: boolean }>`
  max-height: ${({ $isOpen }) => ($isOpen ? '1000px' : '0')};
  overflow: hidden;
  transition: max-height 0.3s ease;
  
  > div {
    padding: 1rem;
  }
`;

const MobileTabs = styled.div<{ $isMobile: boolean }>`
  display: flex;
  flex-direction: ${({ $isMobile }) => ($isMobile ? 'column' : 'row')};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  margin-bottom: 1rem;
`;

const MobileTab = styled.button<{ $isActive: boolean; $isMobile: boolean }>`
  padding: ${({ $isMobile }) => ($isMobile ? '1rem' : '0.75rem 1rem')};
  border: none;
  background: ${({ $isActive, theme }) => ($isActive ? theme.colors.primary : 'transparent')};
  color: ${({ $isActive, theme }) => ($isActive ? 'white' : theme.colors.gray700)};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: ${({ $isMobile }) => ($isMobile ? '8px 8px 0 0' : '8px 8px 0 0')};
  margin-bottom: ${({ $isMobile }) => ($isMobile ? '0.5rem' : '0')};
  
  &:hover {
    background: ${({ $isActive, theme }) =>
			$isActive ? theme.colors.primaryDark : theme.colors.gray100};
  }
  
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

// Hook for mobile detection and responsive behavior
export const useMobileDetection = () => {
	const [isMobile, setIsMobile] = useState(false);
	const [isTablet, setIsTablet] = useState(false);

	useEffect(() => {
		const checkDevice = () => {
			const width = window.innerWidth;
			setIsMobile(width < 768);
			setIsTablet(width >= 768 && width < 1024);
		};

		checkDevice();
		window.addEventListener('resize', checkDevice);
		return () => window.removeEventListener('resize', checkDevice);
	}, []);

	return { isMobile, isTablet, isDesktop: !isMobile && !isTablet };
};

// Hook for mobile menu state
export const useMobileMenu = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { announceToScreenReader } = useAccessibility();

	const toggleMenu = () => {
		setIsOpen((prev) => !prev);
		announceToScreenReader(`Menu ${isOpen ? 'closed' : 'opened'}`);
	};

	const closeMenu = () => {
		setIsOpen(false);
		announceToScreenReader('Menu closed');
	};

	const openMenu = () => {
		setIsOpen(true);
		announceToScreenReader('Menu opened');
	};

	return {
		isOpen,
		toggleMenu,
		closeMenu,
		openMenu,
	};
};

// Mobile-responsive components
export const MobileResponsiveContainer: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = ({ children, className }) => {
	const { isMobile } = useMobileDetection();

	return (
		<MobileContainer $isMobile={isMobile} className={className}>
			{children}
		</MobileContainer>
	);
};

export const MobileResponsiveCard: React.FC<{
	children: React.ReactNode;
	className?: string;
}> = ({ children, className }) => {
	const { isMobile } = useMobileDetection();

	return (
		<MobileCard $isMobile={isMobile} className={className}>
			{children}
		</MobileCard>
	);
};

export const MobileResponsiveGrid: React.FC<{
	children: React.ReactNode;
	columns?: number;
	className?: string;
}> = ({ children, columns = 2, className }) => {
	const { isMobile } = useMobileDetection();

	return (
		<MobileGrid $isMobile={isMobile} $columns={columns} className={className}>
			{children}
		</MobileGrid>
	);
};

export const MobileResponsiveButton: React.FC<{
	children: React.ReactNode;
	variant?: 'primary' | 'secondary' | 'danger';
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
	type?: 'button' | 'submit' | 'reset';
}> = ({ children, variant = 'secondary', onClick, disabled, className, type = 'button' }) => {
	const { isMobile } = useMobileDetection();

	return (
		<MobileButton
			$isMobile={isMobile}
			$variant={variant}
			onClick={onClick}
			disabled={disabled}
			className={className}
			type={type}
		>
			{children}
		</MobileButton>
	);
};

export const MobileResponsiveInput: React.FC<{
	type?: string;
	placeholder?: string;
	value?: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	className?: string;
	id?: string;
	name?: string;
	required?: boolean;
}> = ({ type = 'text', placeholder, value, onChange, className, id, name, required }) => {
	const { isMobile } = useMobileDetection();

	return (
		<MobileInput
			$isMobile={isMobile}
			type={type}
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			className={className}
			id={id}
			name={name}
			required={required}
		/>
	);
};

export const MobileResponsiveSelect: React.FC<{
	children: React.ReactNode;
	value?: string;
	onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
	className?: string;
	id?: string;
	name?: string;
	required?: boolean;
}> = ({ children, value, onChange, className, id, name, required }) => {
	const { isMobile } = useMobileDetection();

	return (
		<MobileSelect
			$isMobile={isMobile}
			value={value}
			onChange={onChange}
			className={className}
			id={id}
			name={name}
			required={required}
		>
			{children}
		</MobileSelect>
	);
};

export const MobileResponsiveTextarea: React.FC<{
	placeholder?: string;
	value?: string;
	onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	className?: string;
	id?: string;
	name?: string;
	required?: boolean;
	rows?: number;
}> = ({ placeholder, value, onChange, className, id, name, required, rows }) => {
	const { isMobile } = useMobileDetection();

	return (
		<MobileTextarea
			$isMobile={isMobile}
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			className={className}
			id={id}
			name={name}
			required={required}
			rows={rows}
		/>
	);
};

export const MobileCollapsibleSection: React.FC<{
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
	className?: string;
}> = ({ title, children, defaultOpen = false, className }) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const { announceToScreenReader } = useAccessibility();

	const toggle = () => {
		setIsOpen((prev) => !prev);
		announceToScreenReader(`${title} section ${isOpen ? 'collapsed' : 'expanded'}`);
	};

	return (
		<MobileCollapsible $isOpen={isOpen} className={className}>
			<MobileCollapsibleHeader $isOpen={isOpen} onClick={toggle}>
				<span>{title}</span>
				{isOpen ? <FiChevronUp /> : <FiChevronDown />}
			</MobileCollapsibleHeader>
			<MobileCollapsibleContent $isOpen={isOpen}>
				<div>{children}</div>
			</MobileCollapsibleContent>
		</MobileCollapsible>
	);
};

export const MobileTabsComponent: React.FC<{
	tabs: Array<{ id: string; label: string; content: React.ReactNode }>;
	activeTab?: string;
	onTabChange?: (tabId: string) => void;
	className?: string;
}> = ({ tabs, activeTab, onTabChange, className }) => {
	const [currentTab, setCurrentTab] = useState(activeTab || tabs[0]?.id);
	const { isMobile } = useMobileDetection();
	const { announceToScreenReader } = useAccessibility();

	const handleTabChange = (tabId: string) => {
		setCurrentTab(tabId);
		onTabChange?.(tabId);
		const tab = tabs.find((t) => t.id === tabId);
		if (tab) {
			announceToScreenReader(`Switched to ${tab.label} tab`);
		}
	};

	const activeTabContent = tabs.find((tab) => tab.id === currentTab)?.content;

	return (
		<div className={className}>
			<MobileTabs $isMobile={isMobile}>
				{tabs.map((tab) => (
					<MobileTab
						key={tab.id}
						$isActive={tab.id === currentTab}
						$isMobile={isMobile}
						onClick={() => handleTabChange(tab.id)}
					>
						{tab.label}
					</MobileTab>
				))}
			</MobileTabs>
			{activeTabContent}
		</div>
	);
};

export default {
	MobileResponsiveContainer,
	MobileResponsiveCard,
	MobileResponsiveGrid,
	MobileResponsiveButton,
	MobileResponsiveInput,
	MobileResponsiveSelect,
	MobileResponsiveTextarea,
	MobileCollapsibleSection,
	MobileTabsComponent,
	useMobileDetection,
	useMobileMenu,
};
