/**
 * SidebarMenuEnhanced - Enhanced menu component with Phase 2 UX improvements
 * Phase 2: User Experience Enhancement
 * 
 * Features:
 * - Keyboard navigation
 * - Mobile touch gestures
 * - Context menus
 * - Accessibility improvements
 * - Visual feedback
 */

import React, { useMemo, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { useKeyboardNavigation } from './KeyboardNavigationProvider';
import { useMobileOptimization } from './MobileOptimizationProvider';
import { useSidebarContextMenu } from './ContextMenuProvider';
import type { MenuGroup, MenuItem } from './MenuPersistence';

// Styled components with enhanced styling
const MenuContainer = styled.div<{ $isMobile: boolean }>`
	width: 100%;
	padding: ${(props) => (props.$isMobile ? '0.5rem' : '0 1rem 1rem')};
`;

const MenuSection = styled.div<{ $isActive?: boolean; $isDragging?: boolean; $isMobile: boolean }>`
	margin-bottom: ${(props) => (props.$isMobile ? '0.5rem' : '1rem')};
	opacity: ${(props) => (props.$isDragging ? 0.7 : 1)};
	transition: all 0.2s ease;
	border-radius: ${(props) => (props.$isMobile ? '0.375rem' : '0.5rem')};
`;

const SectionHeader = styled.div<{ 
	$isOpen: boolean; 
	$isDraggable: boolean; 
	$isFocused: boolean;
	$isMobile: boolean;
}>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: ${(props) => (props.$isMobile ? '0.75rem' : '1rem')};
	margin: ${(props) => (props.$isMobile ? '0.125rem' : '0.25rem')} 0;
	border-radius: ${(props) => (props.$isMobile ? '0.375rem' : '0.5rem')};
	cursor: ${(props) => (props.$isDraggable ? 'move' : 'pointer')};
	transition: all 0.2s ease;
	background: ${(props) => (props.$isOpen ? '#f3f4f6' : 'transparent')};
	color: #374151;
	user-select: none;
	border: ${(props) => (props.$isFocused ? '2px solid #3b82f6' : 'none')};
	outline: none;

	&:hover {
		background: #f9fafb;
		transform: translateX(2px);
	}

	&:focus-visible {
		border: 2px solid #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}

	${(props) =>
		props.$isDraggable &&
		`
		&:hover {
			background: #dcfce7;
			border: 1px solid #22c55e;
		}
	`}
`;

const SectionTitle = styled.div<{ $isMobile: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	font-size: ${(props) => (props.$isMobile ? '0.8rem' : '0.875rem')};
`;

const SectionIcon = styled.span<{ $color?: string }>`
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${(props) => props.$color || 'currentColor'};
	font-size: ${(props) => (props.$isMobile ? '16px' : '18px')};
`;

const ChevronIcon = styled.span<{ $isOpen: boolean }>`
	transition: transform 0.2s ease;
	transform: rotate(${(props) => (props.$isOpen ? '180deg' : '0deg')});
`;

const MenuItemWrapper = styled.div<{ 
	$isActive?: boolean; 
	$isDragging?: boolean; 
	$isFocused: boolean;
	$isMobile: boolean;
	$touchTargetSize: number;
}>`
	display: flex;
	align-items: center;
	padding: ${(props) => (props.$isMobile ? '0.625rem' : '0.75rem')} 1rem;
	margin: ${(props) => (props.$isMobile ? '0.125rem' : '0.25rem')} 0.5rem;
	border-radius: ${(props) => (props.$isMobile ? '0.375rem' : '0.5rem')};
	cursor: pointer;
	transition: all 0.2s ease;
	background: ${(props) =>
		props.$isActive
			? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
			: props.$isDragging
			? '#f3f4f6'
			: 'transparent'};
	border-left: ${(props) => (props.$isActive ? '3px solid #3b82f6' : 'none')};
	color: ${(props) => (props.$isActive ? '#ffffff' : '#374151')};
	border: ${(props) => (props.$isFocused ? '2px solid #3b82f6' : 'none')};
	outline: none;
	min-height: ${(props) => props.$touchTargetSize}px;

	&:hover {
		background: ${(props) =>
			props.$isActive
				? 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
				: '#f9fafb'};
		transform: translateX(2px);
	}

	&:active {
		transform: translateX(1px);
	}

	&:focus-visible {
		border: 2px solid #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}

	// Touch feedback for mobile
	@media (hover: none) {
		&:active {
			background: ${(props) =>
				props.$isActive
					? 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)'
					: '#e5e7eb'};
		}
	}
`;

const MenuItemIcon = styled.span<{ $isMobile: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: ${(props) => (props.$isMobile ? '16px' : '20px')};
	height: ${(props) => (props.$isMobile ? '16px' : '20px')};
	margin-right: ${(props) => (props.$isMobile ? '0.5rem' : '0.75rem')};
`;

const MenuItemLabel = styled.span<{ $isMobile: boolean }>`
	flex: 1;
	font-weight: 500;
	font-size: ${(props) => (props.$isMobile ? '0.8rem' : '0.875rem')};
`;

const MigrationBadge = styled.span<{ $isMobile: boolean }>`
	background: rgba(34, 197, 94, 0.9);
	border: 1px solid #22c55e;
	color: #ffffff;
	padding: ${(props) => (props.$isMobile ? '0.0625rem 0.25rem' : '0.125rem 0.375rem')};
	border-radius: ${(props) => (props.$isMobile ? '0.25rem' : '0.375rem')};
	font-size: ${(props) => (props.$isMobile ? '0.625rem' : '0.75rem')};
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.25rem;
	z-index: 1;
	position: relative;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const DropZone = styled.div<{ $isVisible: boolean; $isMobile: boolean }>`
	min-height: ${(props) => (props.$isVisible ? (props.$isMobile ? '40px' : '60px') : '0')};
	margin: ${(props) => (props.$isMobile ? '0.125rem' : '0.25rem')} 0.5rem;
	border: 2px dashed ${(props) => (props.$isVisible ? '#22c55e' : 'transparent')};
	border-radius: ${(props) => (props.$isMobile ? '0.25rem' : '0.5rem')};
	background: ${(props) => (props.$isVisible ? 'rgba(34, 197, 94, 0.05)' : 'transparent')};
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${(props) => (props.$isVisible ? '#166534' : 'transparent')};
	font-size: ${(props) => (props.$isMobile ? '0.75rem' : '0.875rem')};
	font-weight: 500;
	transition: all 0.2s ease;
	opacity: ${(props) => (props.$isVisible ? 1 : 0)};
`;

// Enhanced menu item component
const MenuItemEnhanced = memo<{
	item: MenuItem;
	isActive: boolean;
	dragMode: boolean;
	isFocused: boolean;
	onClick: () => void;
	onContextMenu: (e: React.MouseEvent) => void;
	onKeyDown: (e: React.KeyboardEvent) => void;
	isMobile: boolean;
	touchTargetSize: number;
}>(({ item, isActive, dragMode, isFocused, onClick, onContextMenu, onKeyDown, isMobile, touchTargetSize }) => {
	return (
		<MenuItemWrapper
			$isActive={isActive}
			$isDragging={dragMode}
			$isFocused={isFocused}
			$isMobile={isMobile}
			$touchTargetSize={touchTargetSize}
			onClick={onClick}
			onContextMenu={onContextMenu}
			onKeyDown={onKeyDown}
			tabIndex={0}
			role="menuitem"
			aria-label={item.label}
			aria-selected={isActive}
		>
			{item.icon && <MenuItemIcon $isMobile={isMobile}>{item.icon}</MenuItemIcon>}
			<MenuItemLabel $isMobile={isMobile}>{item.label}</MenuItemLabel>
			{item.badge}
		</MenuItemWrapper>
	);
});

MenuItemEnhanced.displayName = 'MenuItemEnhanced';

// Enhanced section header component
const SectionHeaderEnhanced = memo<{
	group: MenuGroup;
	isFocused: boolean;
	onToggle: () => void;
	onContextMenu: (e: React.MouseEvent) => void;
	onKeyDown: (e: React.KeyboardEvent) => void;
	isMobile: boolean;
}>(({ group, isFocused, onToggle, onContextMenu, onKeyDown, isMobile }) => {
	return (
		<SectionHeader
			$isOpen={group.isOpen}
			$isDraggable={true}
			$isFocused={isFocused}
			$isMobile={isMobile}
			onClick={onToggle}
			onContextMenu={onContextMenu}
			onKeyDown={onKeyDown}
			tabIndex={0}
			role="button"
			aria-label={`${group.label} section, ${group.isOpen ? 'expanded' : 'collapsed'}`}
			aria-expanded={group.isOpen}
		>
			<SectionTitle $isMobile={isMobile}>
				{group.icon && <SectionIcon>{group.icon}</SectionIcon>}
				{group.label}
			</SectionTitle>
			<ChevronIcon $isOpen={group.isOpen}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
					<path d="M6 9l6 6 6-6" />
				</svg>
			</ChevronIcon>
		</SectionHeader>
	);
});

SectionHeaderEnhanced.displayName = 'SectionHeaderEnhanced';

interface SidebarMenuEnhancedProps {
	dragMode: boolean;
	searchQuery: string;
	matchAnywhere: boolean;
	menuGroups: MenuGroup[];
	onToggleSection: (groupId: string) => void;
	onActivateItem: (groupId: string, itemIndex: number) => void;
}

const SidebarMenuEnhanced: React.FC<SidebarMenuEnhancedProps> = ({
	dragMode,
	searchQuery,
	matchAnywhere,
	menuGroups,
	onToggleSection,
	onActivateItem,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	
	// Phase 2 hooks
	const { focusedIndex, focusedGroupId, handleKeyDown, isKeyboardMode } = useKeyboardNavigation();
	const { isMobile, triggerHapticFeedback, getTouchTargetSize } = useMobileOptimization();
	const { showItemContextMenu, showSectionContextMenu } = useSidebarContextMenu();

	const touchTargetSize = getTouchTargetSize();

	// Check if a path is active
	const isActive = useCallback((path: string) => {
		return location.pathname === path;
	}, [location.pathname]);

	// Handle menu item click
	const handleMenuItemClick = useCallback((path: string) => {
		navigate(path);
		if (isMobile) {
			triggerHapticFeedback('light');
		}
	}, [navigate, isMobile, triggerHapticFeedback]);

	// Handle section toggle
	const handleSectionToggle = useCallback((groupId: string) => {
		onToggleSection(groupId);
		if (isMobile) {
			triggerHapticFeedback('light');
		}
	}, [onToggleSection, isMobile, triggerHapticFeedback]);

	// Handle context menu for items
	const handleItemContextMenu = useCallback((
		e: React.MouseEvent,
		item: MenuItem,
		groupId: string,
		itemIndex: number
	) => {
		showItemContextMenu(e, item.id, item.label, item.path || '', 
			(id) => console.log('Favorite:', id),
			(path) => navigator.clipboard.writeText(window.location.origin + path),
			(path) => window.open(path, '_blank')
		);
	}, [showItemContextMenu]);

	// Handle context menu for sections
	const handleSectionContextMenu = useCallback((
		e: React.MouseEvent,
		group: MenuGroup
	) => {
		showSectionContextMenu(e, group.id, group.label,
			(id) => onToggleSection(id),
			(id) => onToggleSection(id),
			() => console.log('Collapse all'),
			() => console.log('Expand all')
		);
	}, [showSectionContextMenu, onToggleSection]);

	// Filter menu groups based on search query (optimized)
	const filteredMenuGroups = useMemo(() => {
		if (!searchQuery.trim()) {
			return menuGroups;
		}

		const query = searchQuery.toLowerCase();
		return menuGroups
			.map((group) => {
				const filteredItems = group.items.filter((item) => {
					const searchText = `${item.label} ${item.path || ''}`.toLowerCase();
					
					if (matchAnywhere) {
						return searchText.includes(query);
					}

					// Word boundary matching for better precision
					const words = query.split(/\s+/).filter(word => word.length > 0);
					return words.every(word => {
						if (word.length < 3) {
							const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
							return wordRegex.test(item.label) || wordRegex.test(item.path || '');
						}
						const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
						return wordRegex.test(item.label) || wordRegex.test(item.path || '');
					});
				});

				const result: MenuGroup = { ...group, items: filteredItems };
				const groupMatches = group.label.toLowerCase().includes(query);
				result.isOpen = groupMatches || filteredItems.length > 0;
				
				return result;
			})
			.filter((group) => {
				const hasItems = group.items.length > 0;
				const matchesLabel = group.label.toLowerCase().includes(query);
				return hasItems || matchesLabel;
			});
	}, [menuGroups, searchQuery, matchAnywhere]);

	return (
		<MenuContainer $isMobile={isMobile}>
			{filteredMenuGroups.map((group, groupIndex) => (
				<MenuSection
					key={group.id}
					$isDragging={dragMode && focusedGroupId === group.id}
					$isMobile={isMobile}
					role="menu"
				>
					<SectionHeaderEnhanced
						group={group}
						isFocused={isKeyboardMode && focusedGroupId === group.id && focusedIndex === -1}
						onToggle={() => handleSectionToggle(group.id)}
						onContextMenu={(e) => handleSectionContextMenu(e, group)}
						onKeyDown={(e) => handleKeyDown(e, group.id, group.items.length)}
						isMobile={isMobile}
					/>

					{group.isOpen && group.items.map((item, itemIndex) => (
						<MenuItemEnhanced
							key={item.id}
							item={item}
							isActive={isActive(item.path || '')}
							dragMode={dragMode}
							isFocused={isKeyboardMode && focusedGroupId === group.id && focusedIndex === itemIndex}
							onClick={() => handleMenuItemClick(item.path || '')}
							onContextMenu={(e) => handleItemContextMenu(e, item, group.id, itemIndex)}
							onKeyDown={(e) => handleKeyDown(e, group.id, group.items.length)}
							isMobile={isMobile}
							touchTargetSize={touchTargetSize}
						/>
					))}

					<DropZone
						$isVisible={dragMode}
						$isMobile={isMobile}
						onDrop={(e) => {
							e.preventDefault();
							console.log('Dropped on section:', group.id);
						}}
						onDragOver={(e) => e.preventDefault()}
					>
						📥 Drop items here
					</DropZone>
				</MenuSection>
			))}
		</MenuContainer>
	);
};

export default SidebarMenuEnhanced;
