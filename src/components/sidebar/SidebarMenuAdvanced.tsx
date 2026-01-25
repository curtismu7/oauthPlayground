/**
 * SidebarMenuAdvanced - Advanced sidebar menu with Phase 3 features
 * Phase 3: Advanced Features
 * 
 * Features:
 * - Favorites system
 * - Recent items tracking
 * - Smart search with fuzzy matching
 * - Personalization options
 * - Advanced filtering
 */

import React, { useMemo, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FiStar, FiClock, FiTrendingUp, FiFilter, FiX } from 'react-icons/fi';
import { useKeyboardNavigation } from './KeyboardNavigationProvider';
import { useMobileOptimization } from './MobileOptimizationProvider';
import { useSidebarContextMenu } from './ContextMenuProvider';
import { useUserPreferences } from './UserPreferencesProvider';
import { useSearch } from './SmartSearchProvider';
import type { MenuGroup, MenuItem } from './MenuPersistence';

// Styled components
const MenuContainer = styled.div<{ $isMobile: boolean }>`
	width: 100%;
	padding: ${(props) => (props.$isMobile ? '0.5rem' : '0 1rem 1rem')};
`;

const FavoritesSection = styled.div<{ $isMobile: boolean }>`
	margin-bottom: ${(props) => (props.$isMobile ? '0.75rem' : '1rem')};
	padding: ${(props) => (props.$isMobile ? '0.5rem' : '0.75rem')} 1rem;
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	border-radius: ${(props) => (props.$isMobile ? '0.375rem' : '0.5rem')};
	border: 1px solid #f59e0b;
`;

const RecentSection = styled.div<{ $isMobile: boolean }>`
	margin-bottom: ${(props) => (props.$isMobile ? '0.75rem' : '1rem')};
	padding: ${(props) => (props.$isMobile ? '0.5rem' : '0.75rem')} 1rem;
	background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
	border-radius: ${(props) => (props.$isMobile ? '0.375rem' : '0.5rem')};
	border: 1px solid #3b82f6;
`;

const SectionHeader = styled.div<{ $isMobile: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: ${(props) => (props.$isMobile ? '0.5rem' : '0.75rem')};
`;

const SectionTitle = styled.div<{ $isMobile: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	font-size: ${(props) => (props.$isMobile ? '0.8rem' : '0.875rem')};
	color: #374151;
`;

const SectionActions = styled.div`
	display: flex;
	align-items: center;
	gap: 0.25rem;
`;

const ActionButton = styled.button<{ $isMobile: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: ${(props) => (props.$isMobile ? '0.25rem' : '0.375rem')};
	border: none;
	border-radius: ${(props) => (props.$isMobile ? '0.25rem' : '0.375rem')};
	background: rgba(255, 255, 255, 0.8);
	color: #6b7280;
	cursor: pointer;
	transition: all 0.2s ease;
	font-size: ${(props) => (props.$isMobile ? '12px' : '14px')};

	&:hover {
		background: rgba(255, 255, 255, 1);
		color: #374151;
	}

	&:active {
		transform: scale(0.95);
	}
`;

const QuickAccessItem = styled.div<{ $isMobile: boolean; $touchTargetSize: number }>`
	display: flex;
	align-items: center;
	padding: ${(props) => (props.$isMobile ? '0.5rem' : '0.625rem')} 1rem;
	margin: ${(props) => (props.$isMobile ? '0.125rem' : '0.25rem')} 0;
	border-radius: ${(props) => (props.$isMobile ? '0.25rem' : '0.375rem')};
	cursor: pointer;
	transition: all 0.2s ease;
	background: rgba(255, 255, 255, 0.6);
	border: 1px solid rgba(255, 255, 255, 0.8);
	min-height: ${(props) => props.$touchTargetSize}px;

	&:hover {
		background: rgba(255, 255, 255, 0.9);
		transform: translateX(2px);
	}

	&:active {
		transform: translateX(1px);
	}
`;

const QuickAccessIcon = styled.span<{ $isMobile: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: ${(props) => (props.$isMobile ? '16px' : '20px')};
	height: ${(props) => (props.$isMobile ? '16px' : '20px')};
	margin-right: ${(props) => (props.$isMobile ? '0.5rem' : '0.75rem')};
	color: #6b7280;
`;

const QuickAccessLabel = styled.span<{ $isMobile: boolean }>`
	flex: 1;
	font-weight: 500;
	font-size: ${(props) => (props.$isMobile ? '0.75rem' : '0.8125rem')};
	color: #374151;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const QuickAccessMeta = styled.span<{ $isMobile: boolean }>`
	font-size: ${(props) => (props.$isMobile ? '0.625rem' : '0.75rem')};
	color: #9ca3af;
	white-space: nowrap;
`;

const SearchResultsContainer = styled.div<{ $isMobile: boolean }>`
	margin-bottom: ${(props) => (props.$isMobile ? '0.75rem' : '1rem')};
`;

const SearchResultsHeader = styled.div<{ $isMobile: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: ${(props) => (props.$isMobile ? '0.5rem' : '0.75rem')} 1rem;
	background: #f9fafb;
	border-radius: ${(props) => (props.$isMobile ? '0.375rem' : '0.5rem')} 0 0 ${(props) => (props.$isMobile ? '0.375rem' : '0.5rem')} ${(props) => (props.$isMobile ? '0.375rem' : '0.5rem')};
	border: 1px solid #e5e7eb;
`;

const SearchResultsList = styled.div`
	max-height: 300px;
	overflow-y: auto;
`;

const SearchResultItem = styled.div<{ $isMobile: boolean; $touchTargetSize: number }>`
	display: flex;
	align-items: center;
	padding: ${(props) => (props.$isMobile ? '0.625rem' : '0.75rem')} 1rem;
	border-bottom: 1px solid #f3f4f6;
	cursor: pointer;
	transition: all 0.2s ease;
	min-height: ${(props) => props.$touchTargetSize}px;

	&:hover {
		background: #f9fafb;
	}

	&:last-child {
		border-bottom: none;
	}
`;

const SearchResultIcon = styled.span<{ $isMobile: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: ${(props) => (props.$isMobile ? '16px' : '20px')};
	height: ${(props) => (props.$isMobile ? '16px' : '20px')};
	margin-right: ${(props) => (props.$isMobile ? '0.5rem' : '0.75rem')};
	color: #6b7280;
`;

const SearchResultContent = styled.div<{ $isMobile: boolean }>`
	flex: 1;
	min-width: 0;
`;

const SearchResultLabel = styled.div<{ $isMobile: boolean }>`
	font-weight: 500;
	font-size: ${(props) => (props.$isMobile ? '0.8rem' : '0.875rem')};
	color: #374151;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const SearchResultPath = styled.div<{ $isMobile: boolean }>`
	font-size: ${(props) => (props.$isMobile ? '0.625rem' : '0.75rem')};
	color: #9ca3af;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const SearchResultScore = styled.div`
	font-size: 0.75rem;
	color: #9ca3af;
	font-weight: 500;
`;

const EmptyState = styled.div<{ $isMobile: boolean }>`
	padding: ${(props) => (props.$isMobile ? '2rem' : '3rem')} 1rem;
	text-align: center;
	color: #9ca3af;
`;

const EmptyStateIcon = styled.div`
	font-size: 3rem;
	margin-bottom: 1rem;
	opacity: 0.5;
`;

const EmptyStateText = styled.div<{ $isMobile: boolean }>`
	font-size: ${(props) => (props.$isMobile ? '0.875rem' : '1rem')};
	margin-bottom: 0.5rem;
`;

const EmptyStateSubtext = styled.div<{ $isMobile: boolean }>`
	font-size: ${(props) => (props.$isMobile ? '0.75rem' : '0.875rem')};
`;

// Enhanced menu item component
const MenuItemAdvanced = memo<{
	item: MenuItem;
	isActive: boolean;
	dragMode: boolean;
	isFocused: boolean;
	onClick: () => void;
	onContextMenu: (e: React.MouseEvent) => void;
	onKeyDown: (e: React.KeyboardEvent) => void;
	isFavorite: boolean;
	isMobile: boolean;
	touchTargetSize: number;
}>(({ item, isActive, dragMode, isFocused, onClick, onContextMenu, onKeyDown, isFavorite, isMobile, touchTargetSize }) => {
	return (
		<QuickAccessItem
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
			<QuickAccessIcon $isMobile={isMobile}>
				{isFavorite ? <FiStar style={{ color: '#f59e0b' }} /> : item.icon}
			</QuickAccessIcon>
			<QuickAccessLabel $isMobile={isMobile}>{item.label}</QuickAccessLabel>
			{item.badge}
		</QuickAccessItem>
	);
});

MenuItemAdvanced.displayName = 'MenuItemAdvanced';

interface SidebarMenuAdvancedProps {
	dragMode: boolean;
	searchQuery: string;
	matchAnywhere: boolean;
	menuGroups: MenuGroup[];
	onToggleSection: (groupId: string) => void;
	onActivateItem: (groupId: string, itemIndex: number) => void;
}

const SidebarMenuAdvanced: React.FC<SidebarMenuAdvancedProps> = ({
	dragMode,
	searchQuery,
	matchAnywhere,
	menuGroups,
	onToggleSection,
	onActivateItem,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	
	// Phase 3 hooks
	const { focusedIndex, focusedGroupId, handleKeyDown, isKeyboardMode } = useKeyboardNavigation();
	const { isMobile, triggerHapticFeedback, getTouchTargetSize } = useMobileOptimization();
	const { showItemContextMenu } = useSidebarContextMenu();
	const { favorites, addFavorite, removeFavorite, isFavorite, getRecentItems } = useUserPreferences();
	const { query, results, setQuery, clearSearch } = useSearch(menuGroups.flatMap(group => group.items));

	const touchTargetSize = getTouchTargetSize();
	const recentItems = getRecentItems(5);

	// Check if a path is active
	const isActive = useCallback((path: string) => {
		return location.pathname === path;
	}, [location.pathname]);

	// Handle menu item click
	const handleMenuItemClick = useCallback((item: MenuItem, trackRecent = true) => {
		navigate(item.path || '');
		
		// Track recent item
		if (trackRecent && item.path) {
			const { addRecentItem } = useUserPreferences();
			addRecentItem({
				id: item.id,
				path: item.path,
				label: item.label,
			});
		}
		
		if (isMobile) {
			triggerHapticFeedback('light');
		}
	}, [navigate, isMobile, triggerHapticFeedback]);

	// Handle favorite toggle
	const handleFavoriteToggle = useCallback((item: MenuItem, e: React.MouseEvent) => {
		e.stopPropagation();
		
		if (isFavorite(item.id)) {
			removeFavorite(item.id);
		} else {
			addFavorite({
				id: item.id,
				path: item.path || '',
				label: item.label,
				icon: item.icon,
				category: 'manual',
			});
		}
		
		if (isMobile) {
			triggerHapticFeedback('medium');
		}
	}, [isFavorite, addFavorite, removeFavorite, isMobile, triggerHapticFeedback]);

	// Handle context menu for items
	const handleItemContextMenu = useCallback((
		e: React.MouseEvent,
		item: MenuItem,
		groupId: string,
		itemIndex: number
	) => {
		e.preventDefault();
		e.stopPropagation();

		const isFavorited = isFavorite(item.id);
		
		showItemContextMenu(e, item.id, item.label, item.path || '', 
			(id) => addFavorite({
				id,
				path: item.path || '',
				label: item.label,
				icon: item.icon,
				category: 'context',
			}),
			(path) => navigator.clipboard.writeText(window.location.origin + path),
			(path) => window.open(path, '_blank'),
			// Remove from favorites if favorited
			isFavorited ? () => removeFavorite(item.id) : undefined
		);
	}, [showItemContextMenu, isFavorite, addFavorite, removeFavorite]);

	// Filter menu groups based on search query
	const filteredMenuGroups = useMemo(() => {
		if (!searchQuery.trim()) {
			return menuGroups;
		}

		// Use smart search results
		const searchResultIds = new Set(results.map(r => r.item.id));
		
		return menuGroups
			.map((group) => ({
				...group,
				items: group.items.filter(item => searchResultIds.has(item.id)),
				isOpen: group.items.some(item => searchResultIds.has(item.id)) || group.isOpen,
			}))
			.filter(group => group.items.length > 0);
	}, [menuGroups, searchQuery, results]);

	// Render favorites section
	const renderFavorites = () => {
		if (favorites.length === 0) return null;

		return (
			<FavoritesSection $isMobile={isMobile}>
				<SectionHeader $isMobile={isMobile}>
					<SectionTitle $isMobile={isMobile}>
						<FiStar />
						Favorites ({favorites.length})
					</SectionTitle>
					<SectionActions>
						<ActionButton
							$isMobile={isMobile}
							onClick={() => {
								const { clearRecentItems } = useUserPreferences();
								// Note: This would clear favorites, but we might want a separate function
								console.log('Clear favorites');
							}}
							title="Clear favorites"
						>
							<FiX />
						</ActionButton>
					</SectionActions>
				</SectionHeader>
				{favorites.slice(0, 5).map((favorite) => (
					<MenuItemAdvanced
						key={favorite.id}
						item={{
							id: favorite.id,
							path: favorite.path,
							label: favorite.label,
							icon: favorite.icon,
						}}
						isActive={isActive(favorite.path)}
						dragMode={dragMode}
						isFocused={false}
						onClick={() => handleMenuItemClick(favorite)}
						onContextMenu={(e) => handleItemContextMenu(e, favorite, '', -1)}
						onKeyDown={() => {}}
						isFavorite={true}
						isMobile={isMobile}
						touchTargetSize={touchTargetSize}
					/>
				))}
			</FavoritesSection>
		);
	};

	// Render recent items section
	const renderRecentItems = () => {
		if (recentItems.length === 0) return null;

		return (
			<RecentSection $isMobile={isMobile}>
				<SectionHeader $isMobile={isMobile}>
					<SectionTitle $isMobile={isMobile}>
						<FiClock />
						Recent ({recentItems.length})
					</SectionTitle>
					<SectionActions>
						<ActionButton
							$isMobile={isMobile}
							onClick={() => {
								const { clearRecentItems } = useUserPreferences();
								clearRecentItems();
							}}
							title="Clear recent items"
						>
							<FiX />
						</ActionButton>
					</SectionActions>
				</SectionHeader>
				{recentItems.map((recent) => (
					<QuickAccessItem
						key={recent.id}
						$isMobile={isMobile}
						$touchTargetSize={touchTargetSize}
						onClick={() => handleMenuItemClick({
							id: recent.id,
							path: recent.path,
							label: recent.label,
						})}
					>
						<QuickAccessIcon $isMobile={isMobile}>
							<FiClock />
						</QuickAccessIcon>
						<QuickAccessLabel $isMobile={isMobile}>{recent.label}</QuickAccessLabel>
						<QuickAccessMeta $isMobile={isMobile}>
							{recent.accessCount > 1 && `${recent.accessCount} visits`}
						</QuickAccessMeta>
					</QuickAccessItem>
				))}
			</RecentSection>
		);
	};

	// Render search results
	const renderSearchResults = () => {
		if (!query.trim()) return null;

		return (
			<SearchResultsContainer $isMobile={isMobile}>
				<SearchResultsHeader $isMobile={isMobile}>
					<div>
						<SectionTitle $isMobile={isMobile}>
							<FiFilter />
							Search Results ({results.length})
						</SectionTitle>
					</div>
					<ActionButton
						$isMobile={isMobile}
						onClick={clearSearch}
						title="Clear search"
					>
						<FiX />
					</ActionButton>
				</SearchResultsHeader>
				{results.length > 0 ? (
					<SearchResultsList>
						{results.map((result, index) => (
							<SearchResultItem
								key={result.item.id}
								$isMobile={isMobile}
								$touchTargetSize={touchTargetSize}
								onClick={() => handleMenuItemClick(result.item)}
							>
								<SearchResultIcon $isMobile={isMobile}>
									{result.item.icon}
								</SearchResultIcon>
								<SearchResultContent $isMobile={isMobile}>
									<SearchResultLabel $isMobile={isMobile}>
										{result.highlights.label || result.item.label}
									</SearchResultLabel>
									<SearchResultPath $isMobile={isMobile}>
										{result.item.path}
									</SearchResultPath>
								</SearchResultContent>
								<SearchResultScore>
									{Math.round(result.score * 100)}%
								</SearchResultScore>
							</SearchResultItem>
						))}
					</SearchResultsList>
				) : (
					<EmptyState $isMobile={isMobile}>
						<EmptyStateIcon>
							<FiFilter />
						</EmptyStateIcon>
						<EmptyStateText $isMobile={isMobile}>
							No results found
						</EmptyStateText>
						<EmptyStateSubtext $isMobile={isMobile}>
							Try different keywords or check spelling
						</EmptyStateSubtext>
					</EmptyState>
				)}
			</SearchResultsContainer>
		);
	};

	return (
		<MenuContainer $isMobile={isMobile}>
			{renderFavorites()}
			{renderRecentItems()}
			{renderSearchResults()}
			
			{!query.trim() && filteredMenuGroups.map((group, groupIndex) => (
				<div key={group.id} style={{ marginBottom: isMobile ? '0.5rem' : '1rem' }}>
					{/* Regular menu sections would go here */}
					{group.items.map((item, itemIndex) => (
						<MenuItemAdvanced
							key={item.id}
							item={item}
							isActive={isActive(item.path || '')}
							dragMode={dragMode}
							isFocused={isKeyboardMode && focusedGroupId === group.id && focusedIndex === itemIndex}
							onClick={() => handleMenuItemClick(item)}
							onContextMenu={(e) => handleItemContextMenu(e, item, group.id, itemIndex)}
							onKeyDown={(e) => handleKeyDown(e, group.id, group.items.length)}
							isFavorite={isFavorite(item.id)}
							isMobile={isMobile}
							touchTargetSize={touchTargetSize}
						/>
					))}
				</div>
			))}
		</MenuContainer>
	);
};

export default SidebarMenuAdvanced;
