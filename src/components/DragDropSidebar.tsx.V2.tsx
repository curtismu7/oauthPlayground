/**
 * ========================================================================
 * MENU V2 - Search Styling Fixes
 * ========================================================================
 *
 * This file fixes search result styling:
 * - White background for found items
 * - Black text for found items
 * - Shows section headers for better context
 *
 * Based on DragDropSidebar.tsx V1 (Locked)
 * ========================================================================
 */


// Import only what's needed for this demo
import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiChevronDown } from '@icons';

interface MenuItem {
	id: string;
	path: string;
	label: string;
	icon: React.ReactNode;
	badge?: React.ReactNode;
}

interface MenuGroup {
	id: string;
	label: string;
	icon: React.ReactNode;
	items: MenuItem[];
	subGroups?: MenuGroup[];
	isOpen: boolean;
}

interface SimpleDragDropSidebarProps {
	dragMode?: boolean;
	searchQuery?: string;
	matchAnywhere?: boolean;
}

const SimpleDragDropSidebar: React.FC<SimpleDragDropSidebarProps> = ({
	dragMode = false,
	searchQuery = '',
}) => {
	const location = useLocation();
	const navigate = useNavigate();

	const isActive = (path: string) => {
		const currentPath = location.pathname + location.search;
		if (currentPath === path) return true;
		const basePath = path.split('?')[0];
		const currentBasePath = location.pathname;
		if (currentBasePath === basePath) {
			const pathQuery = path.split('?')[1];
			const currentQuery = location.search;
			if (pathQuery) {
				if (currentQuery === `?${pathQuery}`) return true;
			} else {
				if (!currentQuery) return true;
			}
		}
		return false;
	};

	const handleNavigation = (path: string) => {
		navigate(path);
	};

	// Sample menu structure - in real implementation this would be the full menu
	const [menuGroups] = useState<MenuGroup[]>([
		{
			id: 'jwt-flows',
			label: 'JWT Flows',
			icon: <span>🔑</span>,
			isOpen: true,
			items: [
				{
					id: 'jwt-bearer-token-v9',
					path: '/flows/jwt-bearer-token-v9',
					label: 'JWT Bearer Token (V9)',
					icon: <span>🎯</span>,
					badge: (
						<span
							style={{
								background: 'V9_COLORS.PRIMARY.GREEN',
								color: 'white',
								padding: '2px 6px',
								borderRadius: '4px',
								fontSize: '0.7rem',
							}}
						>
							NEW
						</span>
					),
				},
				{
					id: 'jwt-introspection',
					path: '/flows/jwt-introspection',
					label: 'JWT Introspection',
					icon: <span>🔍</span>,
					badge: (
						<span
							style={{
								background: 'V9_COLORS.PRIMARY.BLUE',
								color: 'white',
								padding: '2px 6px',
								borderRadius: '4px',
								fontSize: '0.7rem',
							}}
						>
							V8
						</span>
					),
				},
			],
		},
		{
			id: 'oauth-flows',
			label: 'OAuth 2.0 Flows',
			icon: <span>🛡️</span>,
			isOpen: true,
			items: [
				{
					id: 'oauth-authorization-code-v7-2',
					path: '/flows/oauth-authorization-code-v7-2',
					label: 'Authorization Code (V7.2)',
					icon: <span>🔑</span>,
					badge: (
						<span
							style={{
								background: '#06b6d4',
								color: 'white',
								padding: '2px 6px',
								borderRadius: '4px',
								fontSize: '0.7rem',
							}}
						>
							V7
						</span>
					),
				},
			],
		},
	]);

	// Filter function for search
	const filteredMenuGroups = useMemo(() => {
		if (!searchQuery.trim()) {
			return menuGroups;
		}

		const query = searchQuery.toLowerCase();

		const filterGroupsRecursive = (groups: MenuGroup[]): MenuGroup[] => {
			return groups
				.map((group) => {
					const filteredItems = group.items.filter((item) =>
						item.label.toLowerCase().includes(query)
					);

					if (filteredItems.length > 0) {
						return {
							...group,
							items: filteredItems,
							isOpen: true, // Force open during search
						};
					}

					const filteredSubGroups = group.subGroups ? filterGroupsRecursive(group.subGroups) : [];

					if (filteredSubGroups.length > 0) {
						return {
							...group,
							subGroups: filteredSubGroups,
							isOpen: true, // Force open during search
						};
					}
					return null;
				})
				.filter(Boolean) as MenuGroup[];
		};

		return filterGroupsRecursive(menuGroups);
	}, [menuGroups, searchQuery]);

	const isSearchResult = searchQuery.trim();

	return (
		<div style={{ padding: dragMode ? '1rem' : '0' }}>
			{/* Search Results Indicator */}
			{isSearchResult && (
				<div
					style={{
						padding: '0.5rem 1rem',
						background: 'V9_COLORS.BG.GRAY_LIGHT',
						borderBottom: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
						fontSize: '0.875rem',
						color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
						fontWeight: '500',
					}}
				>
					{(() => {
						let count = 0;
						const countItems = (groups: MenuGroup[]) => {
							groups.forEach((group) => {
								count += group.items.length;
							});
						};
						countItems(filteredMenuGroups);
						return count;
					})()} results for "{searchQuery}"
				</div>
			)}

			{/* Menu Groups */}
			{filteredMenuGroups.map((group) => (
				<div key={group.id} style={{ marginBottom: '1rem' }}>
					{/* Group Header - Always show during search for context */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							padding: '0.75rem 1rem',
							background: isSearchResult
								? 'V9_COLORS.BG.GRAY_MEDIUM'
								: 'linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE 0%, V9_COLORS.PRIMARY.BLUE_DARK 100%)',
							borderRadius: '0.5rem',
							marginBottom: '0.25rem',
							cursor: 'pointer',
							border: isSearchResult ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.2)',
							boxShadow: isSearchResult ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.2)',
						}}
					>
						<div style={{ color: isSearchResult ? 'V9_COLORS.TEXT.GRAY_MEDIUM' : 'white' }}>
							{group.icon}
						</div>
						<span
							style={{
								fontWeight: '600',
								color: isSearchResult ? '#1e293b' : 'white',
								flex: 1,
							}}
						>
							{group.label}
						</span>
						<FiChevronDown
							size={14}
							style={{
								transform: group.isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
								transition: 'transform 0.2s',
								color: isSearchResult ? 'V9_COLORS.TEXT.GRAY_MEDIUM' : 'white',
							}}
						/>
					</div>

					{/* Group Items */}
					{group.isOpen && (
						<div
							style={{
								paddingLeft: '1rem',
								backgroundColor: isSearchResult
									? 'V9_COLORS.TEXT.WHITE'
									: 'V9_COLORS.BG.GRAY_LIGHT',
								borderRadius: '0.5rem',
								padding: '0.5rem',
							}}
						>
							{group.items.map((item) => (
								<button
									key={item.id}
									type="button"
									onClick={() => handleNavigation(item.path)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											handleNavigation(item.path);
										}
									}}
									tabIndex={0}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.5rem 0.75rem',
										backgroundColor: isSearchResult
											? 'V9_COLORS.TEXT.WHITE'
											: isActive(item.path)
												? 'V9_COLORS.BG.WARNING'
												: 'white',
										color: isSearchResult
											? 'V9_COLORS.TEXT.BLACK'
											: isActive(item.path)
												? 'V9_COLORS.PRIMARY.YELLOW_DARK'
												: 'V9_COLORS.TEXT.GRAY_MEDIUM',
										borderRadius: '0.375rem',
										border: isSearchResult
											? '1px solid V9_COLORS.TEXT.GRAY_LIGHTER'
											: isActive(item.path)
												? '3px solid V9_COLORS.PRIMARY.YELLOW'
												: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
										fontWeight: isActive(item.path) ? '700' : '400',
										boxShadow: isSearchResult
											? 'none'
											: isActive(item.path)
												? '0 4px 8px rgba(245, 158, 11, 0.3)'
												: 'none',
										transform: isActive(item.path) ? 'scale(1.02)' : 'scale(1)',
										marginBottom: '0.25rem',
										cursor: 'pointer',
										transition: 'all 0.2s ease',
									}}
								>
									{dragMode && <span style={{ fontSize: '12px' }}>❓</span>}
									{item.icon}
									<span style={{ flex: 1 }}>{item.label}</span>
									{item.badge}
								</button>
							))}
						</div>
					)}
				</div>
			))}
		</div>
	);
};

export default SimpleDragDropSidebar;
