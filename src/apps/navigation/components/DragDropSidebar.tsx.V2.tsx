/**
 * ========================================================================
 * MENU V2 - Ping UI Migration Version
 * ========================================================================
 *
 * This is V2 of the DragDropSidebar with Ping UI migration following pingui2.md standards.
 * - Removed styled-components (ColoredIcon, MigrationBadge)
 * - Added .end-user-nano namespace wrapper
 * - Migrated to MDI CSS icons (no React Icons)
 * - Applied Ping UI CSS variables and spacing
 * - Added proper ARIA labels and accessibility
 * - Used 0.15s ease-in-out transitions
 *
 * Migration Changes:
 * - ColoredIcon → div with MDI icon and color styles
 * - MigrationBadge → span with ping-badge class
 * - React Icons → MDI CSS icons with aria-labels
 * - Added .end-user-nano wrapper for namespace scoping
 * ========================================================================
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Ping UI Helper Functions
const getColoredIconClass = (color: string): string =>
	`ping-icon ping-icon--${color.replace('#', 'color-')}`;
const getMigrationBadgeClass = (variant: string = 'default'): string =>
	`ping-badge ping-badge--${variant}`;

// MDI Icon Mapping for React Icons → MDI CSS
const getMDIIconClass = (fiIcon: string): string => {
	const iconMap: Record<string, string> = {
		FiActivity: 'mdi-activity',
		FiAlertTriangle: 'mdi-alert',
		FiBarChart2: 'mdi-chart-bar',
		FiBook: 'mdi-book',
		FiBookOpen: 'mdi-book-open',
		FiBox: 'mdi-box',
		FiCheckCircle: 'mdi-check-circle',
		FiChevronDown: 'mdi-chevron-down',
		FiCode: 'mdi-code',
		FiCpu: 'mdi-cpu',
		FiDatabase: 'mdi-database',
		FiEye: 'mdi-eye',
		FiFileText: 'mdi-file-text',
		FiGitBranch: 'mdi-git-branch',
		FiKey: 'mdi-key',
		FiLayers: 'mdi-layers',
		FiLock: 'mdi-lock',
		FiLogOut: 'mdi-logout',
		FiMove: 'mdi-drag-horizontal-variant',
		FiPackage: 'mdi-package',
		FiRefreshCw: 'mdi-refresh',
		FiSearch: 'mdi-search',
		FiServer: 'mdi-server',
		FiSettings: 'mdi-cog',
		FiShield: 'mdi-shield',
		FiShoppingCart: 'mdi-shopping',
		FiSmartphone: 'mdi-cellphone',
		FiTool: 'mdi-tools',
		FiTrash2: 'mdi-trash-can',
		FiUser: 'mdi-account',
		FiUsers: 'mdi-account-group',
		FiX: 'mdi-close',
		FiZap: 'mdi-flash',
	};
	return iconMap[fiIcon] || 'mdi-help-circle';
};

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
}> = ({ icon, size = 16, ariaLabel, ariaHidden = false, className = '' }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<i
			className={combinedClassName}
			style={{ fontSize: `${size}px` }}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
		></i>
	);
};

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
	onSave?: (menuGroups: MenuGroup[]) => void;
	onRestore?: () => void;
	onQuit?: () => void;
}

const SimpleDragDropSidebar: React.FC<SimpleDragDropSidebarProps> = ({
	dragMode = false,
	searchQuery = '',
	matchAnywhere = false,
	onSave,
	onRestore,
	onQuit,
}) => {
	const location = useLocation();
	const navigate = useNavigate();
	const [draggedItem, setDraggedItem] = useState<{
		type: 'group' | 'item';
		id: string;
		groupId?: string;
		subGroupId?: string;
	} | null>(null);

	const isActive = (path: string) => {
		const currentPath = location.pathname + location.search;

		if (currentPath === path) {
			return true;
		}

		const basePath = path.split('?')[0];
		const pathQuery = path.split('?')[1];
		const currentBasePath = location.pathname;
		const currentQuery = location.search;

		if (currentBasePath === basePath) {
			if (pathQuery) {
				if (currentQuery === `?${pathQuery}`) {
					return true;
				}
			} else {
				if (basePath === '/flows/implicit-v7') {
					const urlParams = new URLSearchParams(currentQuery);
					const urlVariant = urlParams.get('variant');
					if (!urlVariant || urlVariant === 'oauth') {
						return !currentQuery || currentQuery === '';
					}
					return false;
				}

				if (!currentQuery) {
					return true;
				}
			}
		}

		if (currentBasePath === `${basePath}/` || basePath === `${currentBasePath}/`) {
			if (!pathQuery && !currentQuery) {
				return true;
			}
		}

		return false;
	};

	const handleNavigation = (path: string, state?: unknown) => {
		navigate(path, { state });
	};

	type SerializableGroup = {
		id: string;
		label: string;
		isOpen: boolean;
		items: Array<{ id: string; path: string; label: string }>;
		subGroups?: Array<SerializableGroup>;
	};

	const createSerializableGroups = (groups: MenuGroup[]): SerializableGroup[] => {
		return groups.map((group) => {
			const result: SerializableGroup = {
				id: group.id,
				label: group.label,
				isOpen: group.isOpen,
				items: group.items.map((item) => ({
					id: item.id,
					path: item.path,
					label: item.label,
				})),
			};

			if (group.subGroups) {
				result.subGroups = createSerializableGroups(group.subGroups);
			}

			return result;
		});
	};

	type SerializedGroup = {
		id: string;
		label: string;
		isOpen: boolean;
		items: Array<{ id: string; path: string; label: string }>;
		subGroups?: Array<SerializedGroup>;
	};

	const restoreMenuGroups = (
		serializedGroups: SerializedGroup[],
		defaultGroups: MenuGroup[]
	): MenuGroup[] => {
		const restored = serializedGroups
			.map((serializedGroup) => {
				const defaultGroup = defaultGroups.find((g) => g.id === serializedGroup.id);
				if (!defaultGroup) return null;

				const seenIds = new Set<string>();
				const restoredItems = serializedGroup.items
					.map((serializedItem) => {
						if (seenIds.has(serializedItem.id)) {
							return null;
						}
						seenIds.add(serializedItem.id);

						let defaultItem = null;
						for (const group of defaultGroups) {
							defaultItem = group.items.find((i) => i.id === serializedItem.id);
							if (defaultItem) break;
							if (group.subGroups) {
								for (const subGroup of group.subGroups) {
									defaultItem = subGroup.items.find((i) => i.id === serializedItem.id);
									if (defaultItem) break;
								}
								if (defaultItem) break;
							}
						}
						return (
							defaultItem || {
								id: serializedItem.id,
								path: serializedItem.path,
								label: serializedItem.label,
								icon: (
									// PING UI MIGRATION: Replaced ColoredIcon with div + MDI icon
									<div className={getColoredIconClass('#6366f1')} style={{ color: '#6366f1' }}>
										<MDIIcon icon="FiSettings" ariaLabel="Settings icon" />
									</div>
								),
							}
						);
					})
					.filter(Boolean);

				let restoredSubGroups: MenuGroup[] | undefined;
				if (defaultGroup.subGroups && serializedGroup.subGroups) {
					restoredSubGroups = restoreMenuGroups(serializedGroup.subGroups, defaultGroup.subGroups);
				} else if (defaultGroup.subGroups) {
					restoredSubGroups = defaultGroup.subGroups;
				}

				return {
					...defaultGroup,
					isOpen: serializedGroup.isOpen,
					items: restoredItems,
					subGroups: restoredSubGroups,
				};
			})
			.filter(Boolean) as MenuGroup[];

		const presentIds = new Set<string>();
		const collectItemIds = (groups: MenuGroup[]) => {
			groups.forEach((g) => {
				g.items.forEach((i) => {
					presentIds.add(i.id);
				});
				if (g.subGroups) {
					collectItemIds(g.subGroups);
				}
			});
		};
		collectItemIds(restored);

		const addMissingItems = (savedGroups: MenuGroup[], defaultGroups: MenuGroup[]) => {
			defaultGroups.forEach((defGroup) => {
				defGroup.items.forEach((defItem) => {
					if (!presentIds.has(defItem.id)) {
						const target = savedGroups.find((g) => g.id === defGroup.id);
						if (target) {
							target.items.push(defItem);
							presentIds.add(defItem.id);
						}
					}
				});
				if (defGroup.subGroups) {
					const savedGroup = savedGroups.find((g) => g.id === defGroup.id);
					if (savedGroup?.subGroups) {
						addMissingItems(savedGroup.subGroups, defGroup.subGroups);
					}
				}
			});
		};
		addMissingItems(restored, defaultGroups);

		const restoredGroupIds = new Set(restored.map((g) => g.id));
		defaultGroups.forEach((defGroup) => {
			if (!restoredGroupIds.has(defGroup.id)) {
				restored.push(defGroup);
				restoredGroupIds.add(defGroup.id);
			}
		});

		const restoredMap = new Map(restored.map((g) => [g.id, g]));

		const orderedRestored: MenuGroup[] = [];
		const addedGroupIds = new Set<string>();

		serializedGroups.forEach((serializedGroup) => {
			const restoredGroup = restoredMap.get(serializedGroup.id);
			if (restoredGroup) {
				orderedRestored.push(restoredGroup);
				addedGroupIds.add(serializedGroup.id);
			}
		});

		defaultGroups.forEach((defGroup) => {
			if (!addedGroupIds.has(defGroup.id)) {
				const restoredGroup = restoredMap.get(defGroup.id);
				if (restoredGroup) {
					orderedRestored.push(restoredGroup);
					addedGroupIds.add(defGroup.id);
				}
			}
		});

		return orderedRestored;
	};

	const saveWithFeedback = useCallback(
		(groups: MenuGroup[]) => {
			try {
				const serializable = createSerializableGroups(groups);
				localStorage.setItem('simpleDragDropSidebar.menuOrder', JSON.stringify(serializable));
				localStorage.setItem('simpleDragDropSidebar.menuVersion', '2.2');
				console.log('💾 Menu layout saved to localStorage:', serializable);
				if (onSave) {
					onSave(groups);
				}
			} catch (error) {
				console.warn('❌ Failed to save menu layout:', error);
			}
		},
		[createSerializableGroups, onSave]
	);

	const handleSave = () => {
		saveWithFeedback(menuGroups);
	};

	const handleRestore = () => {
		try {
			localStorage.removeItem('simpleDragDropSidebar.menuOrder');
			localStorage.removeItem('simpleDragDropSidebar.menuVersion');
			// Reset to default menu structure
			window.location.reload(); // Simple way to restore defaults
			if (onRestore) {
				onRestore();
			}
		} catch (error) {
			console.warn('❌ Failed to restore menu layout:', error);
		}
	};

	const handleQuit = () => {
		if (onQuit) {
			onQuit();
		}
	};

	// Initialize menu structure with Ping UI migration
	const [menuGroups, setMenuGroups] = useState<MenuGroup[]>(() => {
		// Sample menu structure demonstrating Ping UI migration with MDI icons
		const defaultGroups: MenuGroup[] = [
			{
				id: 'dashboard',
				label: 'Dashboard',
				icon: <MDIIcon icon="FiViewDashboard" ariaLabel="Dashboard" />,
				isOpen: true,
				items: [
					{
						id: 'main-dashboard',
						path: '/dashboard',
						label: '📊 Main Dashboard',
						icon: (
							<div className={getColoredIconClass('#3b82f6')} style={{ color: '#3b82f6' }}>
								<MDIIcon icon="FiViewDashboard" ariaLabel="Dashboard" />
							</div>
						),
						badge: (
							<span
								className={getMigrationBadgeClass('primary')}
								title="Main dashboard with PingOne API status and quick access"
							>
								HOME
							</span>
						),
					},
				],
			},
			{
				id: 'v8-flows-new',
				label: 'Production',
				// PING UI MIGRATION: Replaced React Icon with MDI icon
				icon: <MDIIcon icon="FiZap" ariaLabel="Production flows" />,
				isOpen: true,
				items: [
					{
						id: 'mfa-feature-flags-admin-v8',
						path: '/v8/mfa-feature-flags',
						label: '🚦 MFA Feature Flags',
						// PING UI MIGRATION: Replaced ColoredIcon with div + MDI icon
						icon: (
							<div className={getColoredIconClass('#f59e0b')} style={{ color: '#f59e0b' }}>
								<MDIIcon icon="FiSettings" ariaLabel="Settings" />
							</div>
						),
						// PING UI MIGRATION: Replaced MigrationBadge with span + ping-badge class
						badge: (
							<span
								className={getMigrationBadgeClass('admin')}
								title="Control unified flow rollout with per-device feature flags and percentage-based gradual deployment"
							>
								ADMIN
							</span>
						),
					},
					{
						id: 'api-status-page',
						path: '/system-status',
						label: '🔍 PingOne API Status',
						// PING UI MIGRATION: Replaced ColoredIcon with div + MDI icon
						icon: (
							<div className={getColoredIconClass('#3b82f6')} style={{ color: '#3b82f6' }}>
								<MDIIcon icon="FiActivity" ariaLabel="Activity" />
							</div>
						),
						// PING UI MIGRATION: Replaced MigrationBadge with span + ping-badge class
						badge: (
							<span
								className={getMigrationBadgeClass('utility')}
								title="Real-time API health monitoring and server performance metrics"
							>
								UTILITY
							</span>
						),
					},
					{
						id: 'unified-oauth-flow-v8u',
						path: '/v8u/unified',
						label: 'Unified OAuth & OIDC',
						// PING UI MIGRATION: Replaced ColoredIcon with div + MDI icon
						icon: (
							<div className={getColoredIconClass('#10b981')} style={{ color: '#10b981' }}>
								<MDIIcon icon="FiZap" ariaLabel="Lightning bolt" />
							</div>
						),
						// PING UI MIGRATION: Replaced MigrationBadge with span + ping-badge class (with custom style)
						badge: (
							<span
								className={getMigrationBadgeClass('unified')}
								style={{ background: '#3b82f6', color: 'white' }}
								title="V8U: Single UI for all OAuth/OIDC flows with real PingOne APIs"
							>
								UNIFIED
							</span>
						),
					},
					{
						id: 'new-unified-mfa-v8',
						path: '/v8/unified-mfa',
						label: '🔥 New Unified MFA',
						// PING UI MIGRATION: Replaced ColoredIcon with div + MDI icon
						icon: (
							<div className={getColoredIconClass('#ef4444')} style={{ color: '#ef4444' }}>
								<MDIIcon icon="FiLayers" ariaLabel="Layers" />
							</div>
						),
						// PING UI MIGRATION: Replaced MigrationBadge with span + ping-badge class (with custom style)
						badge: (
							<span
								className={getMigrationBadgeClass('unified')}
								style={{ background: '#ef4444', color: 'white' }}
								title="New Unified MFA flow with all fixes and improvements"
							>
								UNIFIED
							</span>
						),
					},
				],
			},
			{
				id: 'v8-flows-legacy',
				label: 'Production (Legacy)',
				// PING UI MIGRATION: Replaced React Icon with MDI icon
				icon: <MDIIcon icon="FiZap" ariaLabel="Legacy production flows" />,
				isOpen: false,
				items: [
					{
						id: 'oauth-authorization-code-v8',
						path: '/flows/oauth-authorization-code-v8',
						label: 'Authorization Code (V8)',
						// PING UI MIGRATION: Replaced ColoredIcon with div + MDI icon
						icon: (
							<div className={getColoredIconClass('#06b6d4')} style={{ color: '#06b6d4' }}>
								<MDIIcon icon="FiKey" ariaLabel="Key" />
							</div>
						),
						// PING UI MIGRATION: Replaced MigrationBadge with span + ping-badge class
						badge: (
							<span
								className={getMigrationBadgeClass('v8')}
								title="V8: Simplified UI with educational content in modals"
							>
								<MDIIcon icon="FiCheckCircle" ariaLabel="Check circle" />
							</span>
						),
					},
				],
			},
			{
				id: 'educational-pages',
				label: 'Educational Pages',
				icon: <MDIIcon icon="FiBook" ariaLabel="Educational pages" />,
				isOpen: true,
				items: [
					{
						id: 'user-search-page',
						path: '/user-search',
						label: '👥 User Search API',
						icon: (
							<div className={getColoredIconClass('#10b981')} style={{ color: '#10b981' }}>
								<MDIIcon icon="FiUsers" ariaLabel="Users" />
							</div>
						),
						badge: (
							<span
								className={getMigrationBadgeClass('education')}
								style={{ background: '#10b981', color: 'white' }}
								title="Learn PingOne User Management API with interactive examples"
							>
								EDU
							</span>
						),
					},
					{
						id: 'login-patterns-page',
						path: '/login-patterns',
						label: '🔐 Login Patterns',
						icon: (
							<div className={getColoredIconClass('#3b82f6')} style={{ color: '#3b82f6' }}>
								<MDIIcon icon="FiLock" ariaLabel="Lock" />
							</div>
						),
						badge: (
							<span
								className={getMigrationBadgeClass('education')}
								style={{ background: '#3b82f6', color: 'white' }}
								title="Explore different login patterns and authentication methods"
							>
								EDU
							</span>
						),
					},
					{
						id: 'token-api-documentation-page',
						path: '/token-api-documentation',
						label: '📚 Token API Documentation',
						icon: (
							<div className={getColoredIconClass('#8b5cf6')} style={{ color: '#8b5cf6' }}>
								<MDIIcon icon="FiFileText" ariaLabel="Documentation" />
							</div>
						),
						badge: (
							<span
								className={getMigrationBadgeClass('education')}
								style={{ background: '#8b5cf6', color: 'white' }}
								title="Comprehensive OAuth 2.0 token API reference and examples"
							>
								EDU
							</span>
						),
					},
					{
						id: 'spiffe-spire-token-display-page',
						path: '/spiffe-spire-token-display',
						label: '🔐 SPIFFE-Spire Tokens',
						icon: (
							<div className={getColoredIconClass('#f59e0b')} style={{ color: '#f59e0b' }}>
								<MDIIcon icon="FiShield" ariaLabel="Shield" />
							</div>
						),
						badge: (
							<span
								className={getMigrationBadgeClass('education')}
								style={{ background: '#f59e0b', color: 'white' }}
								title="SPIFFE and SPIRE identity management with token display"
							>
								EDU
							</span>
						),
					},
					{
						id: 'token-refresh-page',
						path: '/token-refresh',
						label: '🔄 Token Refresh',
						icon: (
							<div className={getColoredIconClass('#059669')} style={{ color: '#059669' }}>
								<MDIIcon icon="FiRefreshCw" ariaLabel="Refresh" />
							</div>
						),
						badge: (
							<span
								className={getMigrationBadgeClass('education')}
								style={{ background: '#059669', color: 'white' }}
								title="OAuth 2.0 token refresh mechanisms and automatic renewal"
							>
								EDU
							</span>
						),
					},
					{
						id: 'token-status-page',
						path: '/token-status',
						label: '📊 Token Status',
						icon: (
							<div className={getColoredIconClass('#3b82f6')} style={{ color: '#3b82f6' }}>
								<MDIIcon icon="FiActivity" ariaLabel="Activity" />
							</div>
						),
						badge: (
							<span
								className={getMigrationBadgeClass('education')}
								style={{ background: '#3b82f6', color: 'white' }}
								title="Real-time token status monitoring and management dashboard"
							>
								EDU
							</span>
						),
					},
					{
						id: 'debug-logs-page',
						path: '/debug-logs',
						label: '🐛 Debug Logs',
						icon: (
							<div className={getColoredIconClass('#ef4444')} style={{ color: '#ef4444' }}>
								<MDIIcon icon="FiTerminal" ariaLabel="Terminal" />
							</div>
						),
						badge: (
							<span
								className={getMigrationBadgeClass('education')}
								style={{ background: '#ef4444', color: 'white' }}
								title="Real-time debug logs and troubleshooting tools"
							>
								EDU
							</span>
						),
					},
					{
						id: 'oauth-code-generator-hub',
						path: '/oauth-code-generator-hub',
						label: '� OAuth Code Generator Hub',
						icon: (
							<div className={getColoredIconClass('#3b82f6')} style={{ color: '#3b82f6' }}>
								<MDIIcon icon="FiCode" ariaLabel="Code" />
							</div>
						),
						badge: (
							<span
								className={getMigrationBadgeClass('education')}
								style={{ background: '#3b82f6', color: 'white' }}
								title="Comprehensive OAuth code generator with educational features"
							>
								OAUTH
							</span>
						),
					},
					{
						id: 'mfa-flow-code-generator',
						path: '/mfa-flow-code-generator',
						label: '🔐 MFA Flow Code Generator',
						icon: (
							<div className={getColoredIconClass('#10b981')} style={{ color: '#10b981' }}>
								<MDIIcon icon="FiShield" ariaLabel="Shield" />
							</div>
						),
						badge: (
							<span
								className={getMigrationBadgeClass('education')}
								style={{ background: '#10b981', color: 'white' }}
								title="Interactive MFA flow code generator with real-time editing"
							>
								MFA
							</span>
						),
					},
					{
						id: 'security-guides-page',
						path: '/security-guides',
						label: '🔒 Security Guides',
						icon: (
							<div className={getColoredIconClass('#10b981')} style={{ color: '#10b981' }}>
								<MDIIcon icon="FiShield" ariaLabel="Shield" />
							</div>
						),
						badge: (
							<span
								className={getMigrationBadgeClass('education')}
								style={{ background: '#10b981', color: 'white' }}
								title="Security best practices and implementation guides"
							>
								EDU
							</span>
						),
					},
				],
			},
		];

		try {
			const savedOrder = localStorage.getItem('simpleDragDropSidebar.menuOrder');
			const savedVersion = localStorage.getItem('simpleDragDropSidebar.menuVersion');

			if (savedOrder && savedVersion === '2.2') {
				const parsedOrder = JSON.parse(savedOrder) as SerializedGroup[];
				return restoreMenuGroups(parsedOrder, defaultGroups);
			}
		} catch (error) {
			console.warn('Failed to restore menu order from localStorage:', error);
		}

		return defaultGroups;
	});

	useEffect(() => {
		if (menuGroups.length > 0) {
			saveWithFeedback(menuGroups);
		}
	}, [menuGroups, saveWithFeedback]);

	const filteredMenuGroups = useMemo(() => {
		if (!searchQuery) return menuGroups;

		const normalizeText = (text: string) => text.toLowerCase().trim();

		const normalizedQuery = normalizeText(searchQuery);
		const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);

		return menuGroups
			.map((group) => {
				const filteredItems = group.items.filter((item) => {
					const normalizedLabel = normalizeText(item.label);
					const normalizedPath = normalizeText(item.path);

					if (matchAnywhere) {
						return queryWords.every(
							(word) => normalizedLabel.includes(word) || normalizedPath.includes(word)
						);
					} else {
						return queryWords.every((word) => {
							const labelWords = normalizedLabel.split(/\s+/);
							const pathWords = normalizedPath.split(/\s+/);
							return (
								labelWords.some((labelWord) => labelWord.startsWith(word)) ||
								pathWords.some((pathWord) => pathWord.startsWith(word))
							);
						});
					}
				});

				let filteredSubGroups: MenuGroup[] | undefined;
				if (group.subGroups) {
					filteredSubGroups = group.subGroups
						.map((subGroup) => ({
							...subGroup,
							items: subGroup.items.filter((item) => {
								const normalizedLabel = normalizeText(item.label);
								const normalizedPath = normalizeText(item.path);

								if (matchAnywhere) {
									return queryWords.every(
										(word) => normalizedLabel.includes(word) || normalizedPath.includes(word)
									);
								} else {
									return queryWords.every((word) => {
										const labelWords = normalizedLabel.split(/\s+/);
										const pathWords = normalizedPath.split(/\s+/);
										return (
											labelWords.some((labelWord) => labelWord.startsWith(word)) ||
											pathWords.some((pathWord) => pathWord.startsWith(word))
										);
									});
								}
							}),
						}))
						.filter((subGroup) => subGroup.items.length > 0);
				}

				if (filteredItems.length > 0 || (filteredSubGroups && filteredSubGroups.length > 0)) {
					return {
						...group,
						items: filteredItems,
						subGroups: filteredSubGroups,
					};
				}

				return null;
			})
			.filter(Boolean) as MenuGroup[];
	}, [menuGroups, searchQuery, matchAnywhere]);

	const handleDragStart = (e: React.DragEvent, item: typeof draggedItem) => {
		console.log('🚀 Drag started:', item);
		setDraggedItem(item);
		e.dataTransfer.effectAllowed = 'move';
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};

	const handleDrop = (e: React.DragEvent, targetGroupId: string, targetIndex: number) => {
		e.preventDefault();
		console.log('🎯 Drop triggered:', { targetGroupId, targetIndex, draggedItem });

		if (!draggedItem) {
			console.warn('❌ No dragged item found');
			return;
		}

		const newMenuGroups = [...menuGroups];
		let draggedItemData: MenuItem | null = null;

		if (draggedItem.type === 'item') {
			for (const group of newMenuGroups) {
				if (group.id === draggedItem.groupId) {
					const itemIndex = group.items.findIndex((item) => item.id === draggedItem.id);
					if (itemIndex !== -1) {
						draggedItemData = group.items[itemIndex];
						group.items.splice(itemIndex, 1);
						console.log('📤 Removed item from source:', draggedItemData);
						break;
					}
				}
			}
		}

		if (draggedItemData) {
			const targetGroup = newMenuGroups.find((g) => g.id === targetGroupId);
			if (targetGroup) {
				targetGroup.items.splice(targetIndex, 0, draggedItemData);
				console.log('📥 Added item to target:', { targetGroupId, targetIndex, item: draggedItemData });
				setMenuGroups(newMenuGroups);
				// Auto-save after successful drop
				saveWithFeedback(newMenuGroups);
			} else {
				console.warn('❌ Target group not found:', targetGroupId);
			}
		} else {
			console.warn('❌ No dragged item data found');
		}

		setDraggedItem(null);
	};

	const toggleGroup = (groupId: string) => {
		setMenuGroups((groups) =>
			groups.map((group) => (group.id === groupId ? { ...group, isOpen: !group.isOpen } : group))
		);
	};

	const renderMenuItem = (item: MenuItem, groupId: string, index: number) => {
		const isItemActive = isActive(item.path);
		const isDragging = draggedItem?.id === item.id;
		const isDragTarget = draggedItem && draggedItem.type === 'item' && draggedItem.id !== item.id;

		return (
			<div
				key={item.id}
				className={`menu-item ${isItemActive ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${isDragTarget ? 'drop-target' : ''}`}
				draggable={dragMode}
				onDragStart={(e) => handleDragStart(e, { type: 'item', id: item.id, groupId })}
				onDragOver={handleDragOver}
				onDrop={(e) => handleDrop(e, groupId, index)}
				onClick={() => handleNavigation(item.path)}
				style={{
					transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
					opacity: isDragging ? 0.5 : 1,
					border: isDragTarget && dragMode ? '2px dashed var(--ping-primary-color, #0066cc)' : 'none',
					backgroundColor: isDragTarget && dragMode ? 'var(--ping-hover-color, #f1f3f4)' : 'transparent',
					cursor: dragMode ? 'grab' : 'pointer',
					...(dragMode && {
						padding: 'var(--pingone-spacing-sm, 0.5rem)',
						margin: 'var(--pingone-spacing-xs, 0.25rem) 0',
						borderRadius: 'var(--pingone-border-radius, 0.25rem)',
					}),
				}}
			>
				<div className="menu-item-icon">{item.icon}</div>
				<span className="menu-item-label">{item.label}</span>
				{item.badge && <div className="menu-item-badge">{item.badge}</div>}
			</div>
		);
	};

	const renderMenuGroup = (group: MenuGroup) => (
		<div key={group.id} className="menu-group">
			<div
				className="menu-group-header"
				onClick={() => toggleGroup(group.id)}
				style={{
					transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
				}}
			>
				<div className="menu-group-icon">{group.icon}</div>
				<span className="menu-group-label">{group.label}</span>
				<div className={`menu-group-chevron ${group.isOpen ? 'open' : ''}`}>
					<MDIIcon
						icon="FiChevronDown"
						ariaLabel={`${group.isOpen ? 'Collapse' : 'Expand'} ${group.label}`}
					/>
				</div>
			</div>
			{group.isOpen && (
				<div className="menu-group-items">
					{group.items.map((item, index) => renderMenuItem(item, group.id, index))}
				</div>
			)}
			{group.subGroups?.map((subGroup) => (
				<div key={subGroup.id} className="menu-subgroup">
					<div
						className="menu-subgroup-header"
						onClick={() => toggleGroup(subGroup.id)}
						style={{
							transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
						}}
					>
						<div className="menu-subgroup-icon">{subGroup.icon}</div>
						<span className="menu-subgroup-label">{subGroup.label}</span>
						<div className={`menu-subgroup-chevron ${subGroup.isOpen ? 'open' : ''}`}>
							<MDIIcon
								icon="FiChevronDown"
								ariaLabel={`${subGroup.isOpen ? 'Collapse' : 'Expand'} ${subGroup.label}`}
							/>
						</div>
					</div>
					{subGroup.isOpen && (
						<div className="menu-subgroup-items">
							{subGroup.items.map((item, index) => renderMenuItem(item, subGroup.id, index))}
						</div>
					)}
				</div>
			))}
		</div>
	);

	// PING UI MIGRATION: Added .end-user-nano wrapper as required by pingui2.md
	return (
		<div className="end-user-nano">
			<div className="ping-sidebar">
				<div className="ping-sidebar__content">
					<div className="ping-sidebar__header">
						<h2 className="ping-sidebar__title">Navigation Menu (V2)</h2>
						<div className="ping-sidebar__subtitle">Ping UI Migration Version</div>
					</div>

					{searchQuery && (
						<div className="ping-sidebar__search-results">
							<span className="ping-sidebar__search-count">
								{filteredMenuGroups.reduce(
									(count, group) =>
										count +
										group.items.length +
										(group.subGroups?.reduce(
											(subCount, subGroup) => subCount + subGroup.items.length,
											0
										) || 0),
									0
								)}{' '}
								results for "{searchQuery}"
							</span>
						</div>
					)}

					<div className="ping-sidebar__menu">{filteredMenuGroups.map(renderMenuGroup)}</div>

					{dragMode && (
						<div className="ping-sidebar__drag-controls">
							<div className="ping-sidebar__drag-instructions">
								<p>Drag and drop menu items to reorder</p>
							</div>
							<div className="ping-sidebar__drag-buttons" style={{ 
								display: 'flex', 
								gap: 'var(--pingone-spacing-xs, 0.25rem)', 
								marginTop: 'var(--pingone-spacing-sm, 0.5rem)',
								flexDirection: 'column'
							}}>
								<button
									type="button"
									onClick={handleSave}
									style={{
										padding: 'var(--pingone-spacing-xs, 0.25rem) var(--pingone-spacing-sm, 0.5rem)',
										background: 'var(--ping-success-color, #28a745)',
										color: 'white',
										border: '1px solid var(--ping-success-color, #28a745)',
										borderRadius: 'var(--pingone-border-radius, 0.25rem)',
										fontSize: '0.75rem',
										cursor: 'pointer',
										transition: 'var(--ping-transition-fast, 0.15s ease-in-out)'
									}}
								>
									<span className="mdi mdi-content-save" style={{ marginRight: '0.25rem' }}></span>
									Save Config
								</button>
								<button
									type="button"
									onClick={handleRestore}
									style={{
										padding: 'var(--pingone-spacing-xs, 0.25rem) var(--pingone-spacing-sm, 0.5rem)',
										background: 'var(--ping-warning-color, #ffc107)',
										color: '#000',
										border: '1px solid var(--ping-warning-color, #ffc107)',
										borderRadius: 'var(--pingone-border-radius, 0.25rem)',
										fontSize: '0.75rem',
										cursor: 'pointer',
										transition: 'var(--ping-transition-fast, 0.15s ease-in-out)'
									}}
								>
									<span className="mdi mdi-restore" style={{ marginRight: '0.25rem' }}></span>
									Restore Default
								</button>
								<button
									type="button"
									onClick={handleQuit}
									style={{
										padding: 'var(--pingone-spacing-xs, 0.25rem) var(--pingone-spacing-sm, 0.5rem)',
										background: 'var(--ping-error-color, #dc3545)',
										color: 'white',
										border: '1px solid var(--ping-error-color, #dc3545)',
										borderRadius: 'var(--pingone-border-radius, 0.25rem)',
										fontSize: '0.75rem',
										cursor: 'pointer',
										transition: 'var(--ping-transition-fast, 0.15s ease-in-out)'
									}}
								>
									<span className="mdi mdi-close" style={{ marginRight: '0.25rem' }}></span>
									Quit Drag Mode
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SimpleDragDropSidebar;
