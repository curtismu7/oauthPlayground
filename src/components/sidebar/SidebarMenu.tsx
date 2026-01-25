/**
 * SidebarMenu - Optimized menu rendering component
 * Handles menu display, drag and drop, and search filtering with performance optimizations
 */

import React, { useMemo, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { useDragDrop, useDraggedItemData } from './DragDropProvider';
import { useMenuPersistence } from './MenuPersistence';
import type { MenuGroup, MenuItem } from './MenuPersistence';

// Styled components
const MenuContainer = styled.div`
	width: 100%;
`;

const MenuSection = styled.div<{ $isActive?: boolean; $isDragging?: boolean }>`
	margin-bottom: 1rem;
	opacity: ${(props) => (props.$isDragging ? 0.7 : 1)};
	transition: opacity 0.2s ease;
`;

const SectionHeader = styled.div<{ $isOpen: boolean; $isDraggable: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.75rem 1rem;
	margin: 0.25rem 0.5rem;
	border-radius: 0.5rem;
	cursor: ${(props) => (props.$isDraggable ? 'move' : 'pointer')};
	transition: all 0.2s ease;
	background: ${(props) => (props.$isOpen ? '#f3f4f6' : 'transparent')};
	color: #374151;
	user-select: none;

	&:hover {
		background: #f9fafb;
		transform: translateX(2px);
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

const SectionTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	font-size: 0.875rem;
`;

const SectionIcon = styled.span<{ $color?: string }>`
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${(props) => props.$color || 'currentColor'};
`;

const ChevronIcon = styled.span<{ $isOpen: boolean }>`
	transition: transform 0.2s ease;
	transform: rotate(${(props) => (props.$isOpen ? '180deg' : '0deg')});
`;

const MenuItemWrapper = styled.div<{ $isActive?: boolean; $isDragging?: boolean }>`
	display: flex;
	align-items: center;
	padding: 0.75rem 1rem;
	margin: 0.25rem 0.5rem;
	border-radius: 0.5rem;
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
`;

const MenuItemIcon = styled.span`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	margin-right: 0.75rem;
`;

const MenuItemLabel = styled.span`
	flex: 1;
	font-weight: 500;
	font-size: 0.875rem;
`;

const MigrationBadge = styled.span`
	background: rgba(34, 197, 94, 0.9);
	border: 1px solid #22c55e;
	color: #ffffff;
	padding: 0.125rem 0.375rem;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.25rem;
	z-index: 1;
	position: relative;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const DropZone = styled.div<{ $isVisible: boolean }`
	min-height: ${(props) => (props.$isVisible ? '60px' : '0')};
	margin: 0.25rem 0.5rem;
	border: 2px dashed ${(props) => (props.$isVisible ? '#22c55e' : 'transparent')};
	border-radius: 0.5rem;
	background: ${(props) => (props.$isVisible ? 'rgba(34, 197, 94, 0.05)' : 'transparent')};
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${(props) => (props.$isVisible ? '#166534' : 'transparent')};
	font-size: 0.875rem;
	font-weight: 500;
	transition: all 0.2s ease;
	opacity: ${(props) => (props.$isVisible ? 1 : 0)};
`;

const DragModeBanner = styled.div`
	margin-bottom: 1rem;
	padding: 1rem;
	background-color: #dcfce7;
	border-radius: 0.5rem;
	border: 2px solid #22c55e;
	box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
`;

interface SidebarMenuProps {
	dragMode: boolean;
	searchQuery: string;
	matchAnywhere: boolean;
	sidebarWidth: number;
}

// Memoized menu item component for performance
const MenuItemComponent = memo<{
	item: MenuItem;
	isActive: boolean;
	dragMode: boolean;
	onClick: () => void;
	onDragStart: (e: React.DragEvent) => void;
}>(({ item, isActive, dragMode, onClick, onDragStart }) => {
	return (
		<MenuItemWrapper
			$isActive={isActive}
			draggable={dragMode}
			onDragStart={onDragStart}
			onClick={onClick}
		>
			{item.icon && <MenuItemIcon>{item.icon}</MenuItemIcon>}
			<MenuItemLabel>{item.label}</MenuItemLabel>
			{item.badge}
		</MenuItemWrapper>
	);
});

MenuItemComponent.displayName = 'MenuItemComponent';

// Memoized section header component
const SectionHeaderComponent = memo<{
	group: MenuGroup;
	onToggle: () => void;
	onDragStart: (e: React.DragEvent) => void;
}>(({ group, onToggle, onDragStart }) => {
	return (
		<SectionHeader
			$isOpen={group.isOpen}
			$isDraggable={true}
			onClick={onToggle}
			draggable
			onDragStart={onDragStart}
		>
			<SectionTitle>
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

SectionHeaderComponent.displayName = 'SectionHeaderComponent';

const SidebarMenu: React.FC<SidebarMenuProps> = ({
	dragMode,
	searchQuery,
	matchAnywhere,
	sidebarWidth,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { draggedItem, startDrag, endDrag } = useDragDrop();
	const { saveMenuLayout, loadMenuLayout } = useMenuPersistence();

	// Default menu structure (moved from original component)
	const defaultMenuGroups: MenuGroup[] = useMemo(() => [
		{
			id: 'v8-flows-new',
			label: 'Production',
			icon: null, // Will be set in render
			isOpen: true,
			items: [
				{
					id: 'unified-oauth-flow-v8u',
					path: '/v8u/unified',
					label: 'Unified OAuth & OIDC',
					icon: null, // Will be set in render
					badge: <MigrationBadge>NEW</MigrationBadge>,
				},
				// ... other items
			],
		},
		{
			id: 'security-management',
			label: 'Security & Management',
			icon: null,
			isOpen: false,
			items: [
				{
					id: 'feature-flags-admin',
					path: '/admin/feature-flags',
					label: '⚙️ Feature Flags Admin',
					icon: null,
					badge: <MigrationBadge>NEW</MigrationBadge>,
				},
				{
					id: 'token-monitoring-dashboard',
					path: '/v8u/token-monitoring',
					label: '🔍 Token Monitoring',
					icon: null,
					badge: <MigrationBadge>NEW</MigrationBadge>,
				},
				{
					id: 'security-audit-log',
					path: '/admin/security-audit',
					label: '📋 Security Audit Log',
					icon: null,
					badge: <MigrationBadge>BETA</MigrationBadge>,
				},
			],
		},
		// ... other groups
	], []);

	// Load menu groups from persistence or use defaults
	const [menuGroups, setMenuGroups] = useMemo(() => {
		const loaded = loadMenuLayout(defaultMenuGroups);
		return loaded ? [loaded, () => {}] as const : [defaultMenuGroups, () => {}];
	}, [defaultMenuGroups, loadMenuLayout]);

	// Check if a path is active
	const isActive = useCallback((path: string) => {
		return location.pathname === path;
	}, [location.pathname]);

	// Handle menu item click
	const handleMenuItemClick = useCallback((path: string) => {
		navigate(path);
	}, [navigate]);

	// Handle section toggle
	const handleSectionToggle = useCallback((groupId: string) => {
		setMenuGroups((prevGroups) => {
			const updateGroup = (groups: MenuGroup[]): MenuGroup[] => {
				return groups.map((group) => {
					if (group.id === groupId) {
						return { ...group, isOpen: !group.isOpen };
					}
					return group;
				});
			};

			const newGroups = updateGroup(menuGroups);
			saveMenuLayout(newGroups);
			return newGroups;
		});
	}, [menuGroups, saveMenuLayout]);

	// Filter menu groups based on search query (optimized with useMemo)
	const filteredMenuGroups = useMemo(() => {
		if (!searchQuery.trim()) {
			return menuGroups;
		}

		const query = searchQuery.toLowerCase();
		const filterGroups = (groups: MenuGroup[]): MenuGroup[] => {
			return groups
				.map((group) => {
					// Filter items
					const filteredItems = group.items.filter((item) => {
						const searchText = `${item.label} ${item.path || ''}`.toLowerCase();
						
						if (matchAnywhere) {
							return searchText.includes(query);
						}

						// Word boundary matching for better precision
						const words = query.split(/\s+/).filter(word => word.length > 0);
						return words.every(word => {
							if (word.length < 3) {
								// Very short words must be whole words
								const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
								return wordRegex.test(item.label) || wordRegex.test(item.path || '');
							}
							// Longer words can be at word boundaries
							const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
							return wordRegex.test(item.label) || wordRegex.test(item.path || '');
						});
					});

					// Return group with filtered items
					const result: MenuGroup = { ...group, items: filteredItems };
					
					// Keep group open if it matches or has matching items
					const groupMatches = group.label.toLowerCase().includes(query);
					result.isOpen = groupMatches || filteredItems.length > 0;
					
					return result;
				})
				.filter((group) => {
					const hasItems = group.items.length > 0;
					const matchesLabel = group.label.toLowerCase().includes(query);
					return hasItems || matchesLabel;
				});
		};

		return filterGroups(menuGroups);
	}, [menuGroups, searchQuery, matchAnywhere]);

	// Handle drag start for menu items
	const handleMenuItemDragStart = useCallback((e: React.DragEvent, item: MenuItem) => {
		startDrag(e, 'item', item.id, 'current-group'); // groupId would be determined by context
	}, [startDrag]);

	// Handle drag start for sections
	const handleSectionDragStart = useCallback((e: React.DragEvent, group: MenuGroup) => {
		startDrag(e, 'group', group.id);
	}, [startDrag]);

	// Handle drop on section
	const handleSectionDrop = useCallback((e: React.DragEvent, targetGroupId: string) => {
		e.preventDefault();
		const itemData = useDraggedItemData(e);
		
		if (!itemData) return;

		// Handle drop logic here
		console.log('Dropped item:', itemData, 'onto group:', targetGroupId);
		endDrag();
	}, [endDrag]);

	return (
		<MenuContainer>
			{dragMode && (
				<DragModeBanner>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div>
							<strong style={{ color: '#166534' }}>🎯 Drag & Drop Mode Active:</strong>
							<div style={{ fontSize: '0.875rem', color: '#166534', marginTop: '0.25rem' }}>
								Drag items to reorder • Green zones show drop areas
							</div>
						</div>
					</div>
				</DragModeBanner>
			)}

			{filteredMenuGroups.map((group) => (
				<MenuSection
					key={group.id}
					$isDragging={draggedItem?.id === group.id}
				>
					<SectionHeaderComponent
						group={group}
						onToggle={() => handleSectionToggle(group.id)}
						onDragStart={(e) => handleSectionDragStart(e, group)}
					/>

					{group.isOpen && group.items.map((item) => (
						<MenuItemComponent
							key={item.id}
							item={item}
							isActive={isActive(item.path || '')}
							dragMode={dragMode}
							onClick={() => handleMenuItemClick(item.path || '')}
							onDragStart={(e) => handleMenuItemDragStart(e, item)}
						/>
					))}

					<DropZone
						$isVisible={dragMode && draggedItem !== null}
						onDrop={(e) => handleSectionDrop(e, group.id)}
						onDragOver={(e) => e.preventDefault()}
					>
						📥 Drop items here
					</DropZone>
				</MenuSection>
			))}
		</MenuContainer>
	);
};

export default SidebarMenu;
