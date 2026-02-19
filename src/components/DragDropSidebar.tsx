/**
 * ========================================================================
 * MENU LOCKED - DO NOT MODIFY THIS FILE
 * ========================================================================
 *
 * This file contains the application menu structure and is LOCKED.
 * Any menu changes must be implemented in a NEW VERSION of this file.
 *
 * Current Version: V1 (Locked as of latest commit)
 *
 * To modify the menu, create:
 * - DragDropSidebar.tsx.V2.tsx (Next version)
 * - Or create a new menu component in a different file
 *
 * This ensures menu stability and prevents breaking changes.
 * ========================================================================
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiActivity,
	FiAlertTriangle,
	FiBarChart2,
	FiBook,
	FiBookOpen,
	FiBox,
	FiCheckCircle,
	FiChevronDown,
	FiCode,
	FiCpu,
	FiDatabase,
	FiEye,
	FiFileText,
	FiGitBranch,
	FiKey,
	FiLayers,
	FiLock,
	FiLogOut,
	FiMove,
	FiPackage,
	FiRefreshCw,
	FiSearch,
	FiServer,
	FiSettings,
	FiShield,
	FiShoppingCart,
	FiSmartphone,
	FiTool,
	FiTrash2,
	FiUser,
	FiUsers,
	FiX,
	FiZap,
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';

const ColoredIcon = styled.div<{ $color: string }>`
	color: ${(props) => props.$color};
	display: flex;
	align-items: center;
	justify-content: center;
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
	subGroups?: MenuGroup[]; // Optional nested submenus
	isOpen: boolean;
}

interface SimpleDragDropSidebarProps {
	dragMode?: boolean;
	searchQuery?: string;
	matchAnywhere?: boolean; // If true, allows substring matching anywhere; if false, uses strict word boundary matching
}

const SimpleDragDropSidebar: React.FC<SimpleDragDropSidebarProps> = ({
	dragMode = false,
	searchQuery = '',
	matchAnywhere = false,
}) => {
	const location = useLocation();
	const navigate = useNavigate();
	const [draggedItem, setDraggedItem] = useState<{
		type: 'group' | 'item';
		id: string;
		groupId?: string;
		subGroupId?: string;
	} | null>(null);
	const [dropTarget, setDropTarget] = useState<{ groupId: string; index: number } | null>(null);
	const [saveButtonState, setSaveButtonState] = useState<'default' | 'saving' | 'saved'>('default');

	const isActive = (path: string) => {
		const currentPath = location.pathname + location.search; // Include query parameters

		// Exact match including query parameters
		if (currentPath === path) {
			return true;
		}

		// Extract base path and query parameters
		const basePath = path.split('?')[0];
		const pathQuery = path.split('?')[1];
		const currentBasePath = location.pathname;
		const currentQuery = location.search;

		// Match base path and check query parameters
		if (currentBasePath === basePath) {
			// If the menu item has query parameters, they must match
			if (pathQuery) {
				if (currentQuery === `?${pathQuery}`) {
					return true;
				}
			} else {
				// Special handling for implicit-v7: only match if variant matches or no variant in URL
				if (basePath === '/flows/implicit-v7') {
					const urlParams = new URLSearchParams(currentQuery);
					const urlVariant = urlParams.get('variant');
					// For implicit flow without query param, only the OAuth version should highlight by default
					// For implicit flow with variant, only that specific variant should highlight
					if (!urlVariant || urlVariant === 'oauth') {
						// Only highlight if no variant specified in URL
						return !currentQuery || currentQuery === '';
					}
					// If variant is specified in URL, don't highlight anything (will be handled by query matching)
					return false;
				}

				// If the menu item has no query parameters, current path should also have none
				if (!currentQuery) {
					return true;
				}
			}
		}

		// Handle trailing slashes
		if (currentBasePath === `${basePath}/` || basePath === `${currentBasePath}/`) {
			if (!pathQuery && !currentQuery) {
				return true;
			}
		}

		return false;
	};

	const handleNavigation = (path: string, state?: unknown) => {
		navigate(path, { state });

		// Remove automatic scrolling behavior that causes menu to jump to top
		// Keep the menu position stable - no automatic scrolling
	};

	// Helper functions for persistence
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
			if (group.subGroups && group.subGroups.length > 0) {
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

				// Restore items and deduplicate by ID (keep first occurrence)
				const seenIds = new Set<string>();
				const restoredItems = serializedGroup.items
					.map((serializedItem) => {
						// Skip duplicates
						if (seenIds.has(serializedItem.id)) {
							return null;
						}
						seenIds.add(serializedItem.id);

						// Find the item in any of the default groups (since items can move between groups)
						let defaultItem = null;
						for (const group of defaultGroups) {
							defaultItem = group.items.find((i) => i.id === serializedItem.id);
							if (defaultItem) break;
							// Also check subGroups if they exist
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
									<ColoredIcon $color="#6366f1">
										<FiSettings />
									</ColoredIcon>
								), // fallback icon
							}
						);
					})
					.filter(Boolean);

				// Restore subGroups if they exist
				let restoredSubGroups: MenuGroup[] | undefined;
				if (defaultGroup.subGroups && serializedGroup.subGroups) {
					restoredSubGroups = restoreMenuGroups(serializedGroup.subGroups, defaultGroup.subGroups);
				} else if (defaultGroup.subGroups) {
					// If default has subGroups but saved doesn't, use default
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

		// Ensure new default items (e.g., V7.2) appear even if not in saved layout
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
				// Handle subGroups recursively
				if (defGroup.subGroups) {
					const savedGroup = savedGroups.find((g) => g.id === defGroup.id);
					if (savedGroup?.subGroups) {
						addMissingItems(savedGroup.subGroups, defGroup.subGroups);
					}
				}
			});
		};
		addMissingItems(restored, defaultGroups);

		// Add any new default groups that don't exist in the saved layout
		const restoredGroupIds = new Set(restored.map((g) => g.id));
		defaultGroups.forEach((defGroup) => {
			if (!restoredGroupIds.has(defGroup.id)) {
				restored.push(defGroup);
				restoredGroupIds.add(defGroup.id);
			}
		});

		// Preserve the user's saved group order, but ensure new groups are added at the end
		// First, build a map of restored groups for quick lookup
		const restoredMap = new Map(restored.map((g) => [g.id, g]));

		// Create ordered list: first use saved order, then add any new groups in default order
		const orderedRestored: MenuGroup[] = [];
		const addedGroupIds = new Set<string>();

		// First, add groups in the order they were saved (preserving user's custom order)
		serializedGroups.forEach((serializedGroup) => {
			const restoredGroup = restoredMap.get(serializedGroup.id);
			if (restoredGroup) {
				orderedRestored.push(restoredGroup);
				addedGroupIds.add(serializedGroup.id);
			}
		});

		// Then, add any new groups that weren't in the saved layout (in default order)
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

	// Handle automatic save with button feedback
	const saveWithFeedback = useCallback(
		(groups: MenuGroup[]) => {
			// Save to localStorage without triggering toast during render
			try {
				const serializable = createSerializableGroups(groups);
				localStorage.setItem('simpleDragDropSidebar.menuOrder', JSON.stringify(serializable));
				localStorage.setItem('simpleDragDropSidebar.menuVersion', '2.2');
				console.log('💾 Menu layout saved to localStorage:', serializable);

				// Update save button state
				setSaveButtonState('saved');

				// Reset to default after 1.5 seconds
				setTimeout(() => {
					setSaveButtonState('default');
				}, 1500);

				// Removed toast to prevent setState during render
			} catch (error) {
				console.warn('❌ Failed to save menu layout:', error);
				// Removed toast to prevent setState during render
			}
		},
		[createSerializableGroups]
	);

	// Initialize menu structure
	const [menuGroups, setMenuGroups] = useState<MenuGroup[]>(() => {
		// Cleaned up menu structure - V8 flows at top, then V7 flows
		const defaultGroups: MenuGroup[] = [
			{
				id: 'v8-flows-new',
				label: 'Production',
				icon: <FiZap />,
				isOpen: true,
				items: [
					// ADMIN Entries
					{
						id: 'mfa-feature-flags-admin-v8',
						path: '/v8/mfa-feature-flags',
						label: '🚦 MFA Feature Flags',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiSettings />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Control unified flow rollout with per-device feature flags and percentage-based gradual deployment">
								ADMIN
							</MigrationBadge>
						),
					},
					{
						id: 'api-status-page',
						path: '/api-status',
						label: '🔍 API Status',
						icon: (
							<ColoredIcon $color="#3b82f6">
								<FiActivity />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Real-time API health monitoring and server performance metrics">
								UTILITY
							</MigrationBadge>
						),
					},
					// EDUCATION Entries (sorted alphabetically)
					{
						id: 'flow-comparison-tool',
						path: '/v8u/flow-comparison',
						label: 'Flow Comparison Tool',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiBarChart2 />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Compare OAuth flows with detailed metrics and recommendations">
								EDUCATION
							</MigrationBadge>
						),
					},
					{
						id: 'resources-api-v8',
						path: '/v8/resources-api',
						label: 'Resources API Tutorial',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiBook />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V8: Learn PingOne Resources API - OAuth 2.0 resources, scopes, and custom claims">
								EDUCATION
							</MigrationBadge>
						),
					},
					{
						id: 'spiffe-spire-flow-v8u',
						path: '/v8u/spiffe-spire',
						label: 'SPIFFE/SPIRE Mock',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiShield />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Mock flow demonstrating SPIFFE/SPIRE workload identity to PingOne token exchange">
								EDUCATIONAL
							</MigrationBadge>
						),
					},
					// ORIGINAL Entries
					// UNIFIED Entries (sorted alphabetically)
					{
						id: 'postman-collection-generator',
						path: '/postman-collection-generator',
						label: 'Postman Collection Generator',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiPackage />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge
								title="Generate custom Postman collections for Unified OAuth/OIDC and MFA flows"
								style={{ background: '#3b82f6', color: 'white' }}
							>
								UNIFIED
							</MigrationBadge>
						),
					},
					{
						id: 'new-unified-mfa-v8',
						path: '/v8/unified-mfa',
						label: '🔥 New Unified MFA',
						icon: (
							<ColoredIcon $color="#ef4444">
								<FiLayers />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge
								title="New Unified MFA flow with all fixes and improvements"
								style={{ background: '#ef4444', color: 'white' }}
							>
								UNIFIED
							</MigrationBadge>
						),
					},
					{
						id: 'unified-oauth-flow-v8u',
						path: '/v8u/unified',
						label: 'Unified OAuth & OIDC',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiZap />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge
								title="V8U: Single UI for all OAuth/OIDC flows with real PingOne APIs"
								style={{ background: '#3b82f6', color: 'white' }}
							>
								UNIFIED
							</MigrationBadge>
						),
					},
					// UTILITY Entries (sorted alphabetically)
					{
						id: 'delete-all-devices-utility-v8',
						path: '/v8/delete-all-devices',
						label: 'Delete All Devices',
						icon: (
							<ColoredIcon $color="#ef4444">
								<FiTrash2 />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Utility to delete all MFA devices for a user with device type filtering">
								UTILITY
							</MigrationBadge>
						),
					},
					{
						id: 'enhanced-state-management',
						path: '/v8u/enhanced-state-management',
						label: 'Enhanced State Management (V2)',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiDatabase />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Advanced state management with undo/redo, offline capabilities, and persistence">
								UTILITY
							</MigrationBadge>
						),
					},
					{
						id: 'token-monitoring-dashboard',
						path: '/v8u/token-monitoring',
						label: 'Token Monitoring Dashboard',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiEye />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Real-time token monitoring dashboard">UTILITY</MigrationBadge>
						),
					},
					{
						id: 'protect-portal-app',
						path: '/protect-portal',
						label: 'Protect Portal App',
						icon: (
							<ColoredIcon $color="#dc2626">
								<FiShield />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge
								title="Complete risk-based authentication portal with MFA integration"
								style={{ background: '#dc2626', color: 'white' }}
							>
								PROTECT
							</MigrationBadge>
						),
					},
					{
						id: 'environment-management',
						path: '/environments',
						label: 'Environment Management',
						icon: (
							<ColoredIcon $color="#3b82f6">
								<FiServer />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Manage PingOne environments, create, delete, and promote to production">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'create-company',
						path: '/admin/create-company',
						label: '🏢 Create Company',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiSettings />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Create new company themes and configurations for Protect Portal">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'sdk-examples',
						path: '/sdk-examples',
						label: 'SDK Examples',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiCode />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Comprehensive SDK examples for JWT, OIDC, and DaVinci">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'debug-log-viewer',
						path: '/v8/debug-logs',
						label: 'Debug Log Viewer',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiCode />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="View persistent debug logs that survive redirects">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'token-exchange-v7',
						path: '/flows/token-exchange-v7',
						label: 'Token Exchange (V8M)',
						icon: (
							<ColoredIcon $color="#7c3aed">
								<FiRefreshCw />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="PingOne Token Exchange (RFC 8693) - New Feature Implementation">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
				],
			},
			{
				id: 'v8-flows',
				label: 'Production (Legacy)',
				icon: <FiZap />,
				isOpen: true,
				items: [
					{
						id: 'unified-mfa-v8',
						path: '/v8/unified-mfa',
						label: '🔥 New Unified MFA',
						icon: (
							<ColoredIcon $color="#ef4444">
								<FiLayers />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge style={{ background: '#ef4444', color: 'white' }}>
								UNIFIED
							</MigrationBadge>
						),
					},
					{
						id: 'dpop-authorization-code-v8',
						path: '/flows/dpop-authorization-code-v8',
						label: 'DPoP Authorization Code (V8)',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiShield />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V8: Demonstrating Proof of Possession (RFC 9449) with mock server">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'oauth-authorization-code-v8',
						path: '/flows/oauth-authorization-code-v8',
						label: 'Authorization Code (V8)',
						icon: (
							<ColoredIcon $color="#06b6d4">
								<FiKey />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V8: Simplified UI with educational content in modals">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'implicit-v8',
						path: '/flows/implicit-v8',
						label: 'Implicit Flow (V8)',
						icon: (
							<ColoredIcon $color="#7c3aed">
								<FiZap />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V8: Simplified UI with educational content in modals">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'all-flows-api-test',
						path: '/test/all-flows-api-test',
						label: 'All Flows API Test Suite',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiTool />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Test ALL OAuth/OIDC flow types: Auth Code, Implicit, Hybrid, Device Code, Client Credentials">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'par-test',
						path: '/test/par-test',
						label: 'PAR Flow Test',
						icon: (
							<ColoredIcon $color="#ea580c">
								<FiLock />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Test RFC 9126 Pushed Authorization Request (PAR) flow">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'ciba-v9',
						path: '/flows/ciba-v9',
						label: 'CIBA Flow (V9)',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiShield />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge
								title="V9: OpenID Connect Core 1.0 Compliant CIBA with Enhanced Features"
								style={{ background: '#10b981', color: 'white' }}
							>
								NEW
							</MigrationBadge>
						),
					},
				],
			},
			{
				id: 'reference-materials',
				label: 'Reference Materials',
				icon: (
					<ColoredIcon $color="#6366f1">
						<FiBook />
					</ColoredIcon>
				),
				isOpen: true,
				items: [
					{
						id: 'ping-ai-resources',
						path: '/ping-ai-resources',
						label: 'Ping AI Resources',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiCpu />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Ping Identity AI Resources & Documentation">
								REFERENCE
							</MigrationBadge>
						),
					},
				],
			},
			{
				id: 'oauth-flows',
				label: 'OAuth 2.0 Flows',
				icon: (
					<ColoredIcon $color="#ef4444">
						<FiShield />
					</ColoredIcon>
				),
				isOpen: true,
				items: [
					{
						id: 'oauth-authorization-code-v7-2',
						path: '/flows/oauth-authorization-code-v7-2',
						label: 'Authorization Code (V7.2)',
						icon: (
							<ColoredIcon $color="#06b6d4">
								<FiKey />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7.2: Adds optional redirectless (pi.flow) with Custom Login">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'oauth-implicit-v7',
						path: '/flows/implicit-v7',
						label: 'Implicit Flow (V7)',
						icon: (
							<ColoredIcon $color="#7c3aed">
								<FiZap />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7: Unified OAuth/OIDC implementation with variant selector">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'oauth-device-authorization-v7',
						path: '/flows/device-authorization-v7',
						label: 'Device Authorization (V7)',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiSmartphone />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7: Unified OAuth/OIDC device authorization">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'client-credentials-v7',
						path: '/flows/client-credentials-v7',
						label: 'Client Credentials (V7)',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiKey />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7: Enhanced client credentials">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
				],
			},
			{
				id: 'oidc-flows',
				label: 'OpenID Connect',
				icon: (
					<ColoredIcon $color="#10b981">
						<FiUser />
					</ColoredIcon>
				),
				isOpen: true,
				items: [
					{
						id: 'oidc-authorization-code-v7-2',
						path: '/flows/oauth-authorization-code-v7-2',
						label: 'Authorization Code (V7.2)',
						icon: (
							<ColoredIcon $color="#06b6d4">
								<FiKey />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7.2: Adds optional redirectless (pi.flow) with Custom Login">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'oidc-implicit-v7',
						path: '/flows/implicit-v7?variant=oidc',
						label: 'Implicit Flow (V7)',
						icon: (
							<ColoredIcon $color="#7c3aed">
								<FiZap />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7: Unified OAuth/OIDC implementation with variant selector">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'oidc-device-authorization-v7',
						path: '/flows/device-authorization-v7?variant=oidc',
						label: 'Device Authorization (V7 – OIDC)',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiSmartphone />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7: Unified OAuth/OIDC device authorization">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'oidc-hybrid-v7',
						path: '/flows/oidc-hybrid-v7',
						label: 'Hybrid Flow (V7)',
						icon: (
							<ColoredIcon $color="#22c55e">
								<FiGitBranch />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7: Unified OAuth/OIDC hybrid flow implementation">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
				],
			},
			{
				id: 'pingone',
				label: 'PingOne Flows',
				icon: (
					<ColoredIcon $color="#f97316">
						<FiKey />
					</ColoredIcon>
				),
				isOpen: true,
				items: [
					{
						id: 'pingone-par-v7',
						path: '/flows/pingone-par-v7',
						label: 'Pushed Authorization Request (V7)',
						icon: (
							<ColoredIcon $color="#ea580c">
								<FiLock />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7: Enhanced Pushed Authorization Request with Authorization Details">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'pingone-mfa-v7',
						path: '/flows/pingone-complete-mfa-v7',
						label: 'PingOne MFA (V7)',
						icon: (
							<ColoredIcon $color="#16a34a">
								<FiShield />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7: Enhanced PingOne Multi-Factor Authentication">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'pingone-mfa-workflow-library-v7',
						path: '/flows/pingone-mfa-workflow-library-v7',
						label: 'PingOne MFA Workflow Library (V7)',
						icon: (
							<ColoredIcon $color="#059669">
								<FiShield />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7: PingOne Workflow Library Steps 11-20 - Authorization Code with MFA">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'kroger-grocery-store-mfa',
						path: '/flows/kroger-grocery-store-mfa',
						label: 'Kroger Grocery Store MFA',
						icon: (
							<ColoredIcon $color="#e4002b">
								<FiShoppingCart />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Real-world MFA experience - Kroger Grocery Store mockup">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'pingone-authentication',
						path: '/pingone-authentication',
						label: 'PingOne Authentication',
						icon: (
							<ColoredIcon $color="#16a34a">
								<FiShield />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="PingOne Authentication Flow">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'redirectless-v7-real',
						path: '/flows/redirectless-v7-real',
						label: 'Redirectless Flow (V7)',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiZap />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7: PingOne Redirectless Flow (pi.flow)">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'par-flow',
						path: '/flows/par',
						label: 'PAR Flow',
						icon: (
							<ColoredIcon $color="#3b82f6">
								<FiLock />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Pushed Authorization Request Flow">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
				],
			},
			{
				id: 'token-apps',
				label: 'Token Apps',
				icon: (
					<ColoredIcon $color="#8b5cf6">
						<FiKey />
					</ColoredIcon>
				),
				isOpen: true,
				items: [
					{
						id: 'worker-token-v7',
						path: '/flows/worker-token-v7',
						label: 'Worker Token (V7)',
						icon: (
							<ColoredIcon $color="#fb923c">
								<FiKey />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7: Enhanced worker token flow">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'worker-token-tester',
						path: '/worker-token-tester',
						label: 'Worker Token Check',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiKey />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Validate and test PingOne worker tokens">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'token-management',
						path: '/token-management',
						label: 'Token Management',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiKey />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Token Analysis and Management">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'token-introspection',
						path: '/flows/token-introspection',
						label: 'Token Introspection',
						icon: (
							<ColoredIcon $color="#3b82f6">
								<FiEye />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Token Introspection - Inspect and validate OAuth tokens">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'token-revocation',
						path: '/flows/token-revocation',
						label: 'Token Revocation',
						icon: (
							<ColoredIcon $color="#ef4444">
								<FiX />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Token Revocation - Revoke access and refresh tokens">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'userinfo-flow',
						path: '/flows/userinfo',
						label: 'UserInfo Flow',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiUsers />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="UserInfo Flow - Retrieve user profile information">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'pingone-logout-flow',
						path: '/flows/pingone-logout',
						label: 'PingOne Logout',
						icon: (
							<ColoredIcon $color="#ef4444">
								<FiLogOut />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="PingOne Logout - RP-initiated logout with PingOne SSO">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
				],
			},
			{
				id: 'mock-educational-flows',
				label: 'Mock & Educational Flows',
				icon: (
					<ColoredIcon $color="#f59e0b">
						<FiAlertTriangle />
					</ColoredIcon>
				),
				isOpen: false,
				items: [],
				subGroups: [
					{
						id: 'oauth-mock-flows',
						label: 'OAuth Mock Flows',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiAlertTriangle />
							</ColoredIcon>
						),
						isOpen: false,
						items: [
							{
								id: 'jwt-bearer-token-v7',
								path: '/flows/jwt-bearer-token-v7',
								label: 'JWT Bearer Token (V7)',
								icon: (
									<ColoredIcon $color="#f59e0b">
										<FiKey />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Educational/Mock: JWT Bearer Token Assertion (RFC 7523)">
										<FiAlertTriangle />
									</MigrationBadge>
								),
							},
							{
								id: 'saml-bearer-assertion-v7',
								path: '/flows/saml-bearer-assertion-v7',
								label: 'SAML Bearer Assertion (V7)',
								icon: (
									<ColoredIcon $color="#8b5cf6">
										<FiShield />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Educational/Mock: SAML Bearer Token Assertion (RFC 7522)">
										<FiAlertTriangle />
									</MigrationBadge>
								),
							},
							{
								id: 'oauth-ropc-v7',
								path: '/flows/oauth-ropc-v7',
								label: 'Resource Owner Password (V7)',
								icon: (
									<ColoredIcon $color="#8b5cf6">
										<FiLock />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Educational/Mock: Resource Owner Password Credentials (RFC 6749 - deprecated)">
										<FiAlertTriangle />
									</MigrationBadge>
								),
							},
							{
								id: 'oauth2-resource-owner-password',
								path: '/flows/oauth2-resource-owner-password',
								label: 'OAuth2 ROPC (Legacy)',
								icon: (
									<ColoredIcon $color="#f59e0b">
										<FiLock />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Educational: OAuth 2.0 Resource Owner Password Credentials">
										<FiAlertTriangle />
									</MigrationBadge>
								),
							},
							{
								id: 'advanced-oauth-params-demo',
								path: '/flows/advanced-oauth-params-demo',
								label: 'Advanced OAuth Parameters Demo',
								icon: (
									<ColoredIcon $color="#f59e0b">
										<FiSettings />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Mock flow that builds auth URLs and tokens with advanced OAuth/OIDC parameters (audience, resource, acr_values, display, claims, etc.) to visualize unsupported features">
										<FiAlertTriangle />
									</MigrationBadge>
								),
							},
							{
								id: 'mock-oidc-ropc',
								path: '/flows/mock-oidc-ropc',
								label: 'Mock OIDC ROPC',
								icon: (
									<ColoredIcon $color="#f59e0b">
										<FiLock />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Educational/Mock: OIDC Resource Owner Password Credentials">
										<FiAlertTriangle />
									</MigrationBadge>
								),
							},
							{
								id: 'oauth-authz-code-condensed-mock',
								path: '/flows/oauth-authorization-code-v7-condensed-mock',
								label: 'Auth Code Condensed (Mock)',
								icon: (
									<ColoredIcon $color="#f59e0b">
										<FiKey />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Educational/Mock: Condensed Authorization Code Flow">
										<FiAlertTriangle />
									</MigrationBadge>
								),
							},
							{
								id: 'v7-condensed-mock',
								path: '/flows/v7-condensed-mock',
								label: 'V7 Condensed (Prototype)',
								icon: (
									<ColoredIcon $color="#f59e0b">
										<FiLayers />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Educational/Mock: V7 Flow Condensation Prototype">
										<FiAlertTriangle />
									</MigrationBadge>
								),
							},
						],
					},
					{
						id: 'advanced-mock-flows',
						label: 'Advanced Mock Flows',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiAlertTriangle />
							</ColoredIcon>
						),
						isOpen: false,
						items: [
							{
								id: 'dpop-flow',
								path: '/flows/dpop',
								label: 'DPoP (Educational/Mock)',
								icon: (
									<ColoredIcon $color="#16a34a">
										<FiShield />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Educational: DPoP (RFC 9449) Demonstration of Proof-of-Possession">
										<FiAlertTriangle />
									</MigrationBadge>
								),
							},
							{
								id: 'rar-flow-v7',
								path: '/flows/rar-v7',
								label: 'RAR Flow (V7)',
								icon: (
									<ColoredIcon $color="#8b5cf6">
										<FiFileText />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Educational/Mock: RAR (RFC 9396) Rich Authorization Requests">
										<FiAlertTriangle />
									</MigrationBadge>
								),
							},
							{
								id: 'saml-sp-dynamic-acs-v1',
								path: '/flows/saml-sp-dynamic-acs-v1',
								label: 'SAML Service Provider (V1)',
								icon: (
									<ColoredIcon $color="#8b5cf6">
										<FiShield />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Educational: SAML Service Provider with Dynamic ACS">
										<FiAlertTriangle />
									</MigrationBadge>
								),
							},
						],
					},
				],
			},
			{
				id: 'pingone-tools',
				label: 'PingOne Tools',
				icon: (
					<ColoredIcon $color="#3b82f6">
						<FiTool />
					</ColoredIcon>
				),
				isOpen: false,
				items: [],
				subGroups: [
					{
						id: 'pingone-user-identity',
						label: 'PingOne User & Identity',
						icon: (
							<ColoredIcon $color="#06b6d4">
								<FiUser />
							</ColoredIcon>
						),
						isOpen: true,
						items: [
							{
								id: 'pingone-user-profile',
								path: '/pingone-user-profile',
								label: 'User Profile',
								icon: (
									<ColoredIcon $color="#06b6d4">
										<FiUser />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="PingOne User Profile & Information">
										<FiCheckCircle />
									</MigrationBadge>
								),
							},
							{
								id: 'pingone-identity-metrics',
								path: '/pingone-identity-metrics',
								label: 'Identity Metrics',
								icon: (
									<ColoredIcon $color="#10b981">
										<FiBarChart2 />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="PingOne Total Identities metrics explorer">
										<FiCheckCircle />
									</MigrationBadge>
								),
							},
							{
								id: 'password-reset',
								path: '/security/password-reset',
								label: 'Password Reset',
								icon: (
									<ColoredIcon $color="#dc2626">
										<FiLock />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="PingOne Password Reset Operations">
										<FiCheckCircle />
									</MigrationBadge>
								),
							},
						],
					},
					{
						id: 'pingone-monitoring',
						label: 'PingOne Monitoring',
						icon: (
							<ColoredIcon $color="#3b82f6">
								<FiBarChart2 />
							</ColoredIcon>
						),
						isOpen: false,
						items: [
							{
								id: 'pingone-audit-activities',
								path: '/pingone-audit-activities',
								label: 'Audit Activities',
								icon: (
									<ColoredIcon $color="#667eea">
										<FiActivity />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Query and analyze PingOne audit events">
										<FiCheckCircle />
									</MigrationBadge>
								),
							},
							{
								id: 'pingone-webhook-viewer',
								path: '/pingone-webhook-viewer',
								label: 'Webhook Viewer',
								icon: (
									<ColoredIcon $color="#06b6d4">
										<FiServer />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Real-time webhook event monitoring">
										<FiCheckCircle />
									</MigrationBadge>
								),
							},
							{
								id: 'organization-licensing',
								path: '/organization-licensing',
								label: 'Organization Licensing',
								icon: (
									<ColoredIcon $color="#22c55e">
										<FiShield />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="View organization licensing and usage information">
										<FiCheckCircle />
									</MigrationBadge>
								),
							},
						],
					},
				],
			},
			{
				id: 'developer-tools',
				label: 'Developer Tools',
				icon: (
					<ColoredIcon $color="#8b5cf6">
						<FiTool />
					</ColoredIcon>
				),
				isOpen: false,
				items: [],
				subGroups: [
					{
						id: 'core-tools',
						label: 'Core Developer Tools',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiTool />
							</ColoredIcon>
						),
						isOpen: false,
						items: [
							{
								id: 'oidc-discovery',
								path: '/auto-discover',
								label: 'OIDC Discovery',
								icon: (
									<ColoredIcon $color="#06b6d4">
										<FiSearch />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="OIDC Discovery and Configuration">
										<FiCheckCircle />
									</MigrationBadge>
								),
							},
							{
								id: 'advanced-config',
								path: '/advanced-configuration',
								label: 'Advanced Configuration',
								icon: (
									<ColoredIcon $color="#8b5cf6">
										<FiSettings />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Advanced Configuration Options">
										<FiCheckCircle />
									</MigrationBadge>
								),
							},
						],
					},
					{
						id: 'developer-utilities',
						label: 'Developer Utilities',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiTool />
							</ColoredIcon>
						),
						isOpen: false,
						items: [
							{
								id: 'jwks-troubleshooting',
								path: '/jwks-troubleshooting',
								label: 'JWKS Troubleshooting',
								icon: (
									<ColoredIcon $color="#f59e0b">
										<FiTool />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="JWKS Troubleshooting Guide">
										<FiCheckCircle />
									</MigrationBadge>
								),
							},
							{
								id: 'url-decoder',
								path: '/url-decoder',
								label: 'URL Decoder',
								icon: (
									<ColoredIcon $color="#8b5cf6">
										<FiTool />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="URL Decoder Utility">
										<FiCheckCircle />
									</MigrationBadge>
								),
							},
							{
								id: 'oauth-code-generator-hub',
								path: '/oauth-code-generator-hub',
								label: 'OAuth Code Generator Hub',
								icon: (
									<ColoredIcon $color="#10b981">
										<FiCode />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Production-ready OAuth code in multiple languages">
										<FiCheckCircle />
									</MigrationBadge>
								),
							},
							{
								id: 'application-generator',
								path: '/application-generator',
								label: 'Application Generator',
								icon: (
									<ColoredIcon $color="#3b82f6">
										<FiSettings />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Create PingOne applications">
										<FiCheckCircle />
									</MigrationBadge>
								),
							},
							{
								id: 'client-generator',
								path: '/client-generator',
								label: 'Client Generator',
								icon: (
									<ColoredIcon $color="#6366f1">
										<FiKey />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Generate OAuth client credentials">
										<FiCheckCircle />
									</MigrationBadge>
								),
							},
							{
								id: 'service-test-runner',
								path: '/service-test-runner',
								label: 'Service Test Runner',
								icon: (
									<ColoredIcon $color="#ec4899">
										<FiTool />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Test comprehensive flow data service">
										<FiCheckCircle />
									</MigrationBadge>
								),
							},
							{
								id: 'postman-generator',
								path: '/tools/postman-generator',
								label: 'Postman Collection Generator',
								icon: (
									<ColoredIcon $color="#f97316">
										<FiBox />
									</ColoredIcon>
								),
								badge: (
									<MigrationBadge title="Generate PingOne-ready Postman collection & environment files">
										<FiCheckCircle />
									</MigrationBadge>
								),
							},
						],
					},
				],
			},
			{
				id: 'security-guides',
				label: 'Security Guides',
				icon: (
					<ColoredIcon $color="#3b82f6">
						<FiShield />
					</ColoredIcon>
				),
				isOpen: false,
				items: [
					{
						id: 'oauth-2-1',
						path: '/oauth-2-1',
						label: 'OAuth 2.1',
						icon: (
							<ColoredIcon $color="#3b82f6">
								<FiShield />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="OAuth 2.1 Security Features">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'oidc-session-management',
						path: '/oidc-session-management',
						label: 'OIDC Session Management',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiUser />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="OIDC Session Management">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'pingone-sessions-api',
						path: '/pingone-sessions-api',
						label: 'PingOne Sessions API',
						icon: (
							<ColoredIcon $color="#3b82f6">
								<FiDatabase />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="PingOne Sessions API">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
				],
			},
			{
				id: 'reference-materials-docs',
				label: 'Reference Materials',
				icon: (
					<ColoredIcon $color="#16a34a">
						<FiBook />
					</ColoredIcon>
				),
				isOpen: false,
				items: [
					{
						id: 'par-vs-rar',
						path: '/par-vs-rar',
						label: 'RAR vs PAR and DPoP Guide',
						icon: (
							<ColoredIcon $color="#16a34a">
								<FiBook />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="RAR vs PAR and DPoP Comparison and Examples">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'ciba-vs-device-authz',
						path: '/ciba-vs-device-authz',
						label: 'CIBA vs Device Authorization Guide',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiBook />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="CIBA vs Device Authorization Comparison and Examples">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'pingone-mock-features',
						path: '/pingone-mock-features',
						label: 'Mock & Educational Features',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiBookOpen />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Educational and Mock Features">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'pingone-scopes-reference',
						path: '/pingone-scopes-reference',
						label: 'OAuth Scopes Reference',
						icon: (
							<ColoredIcon $color="#6366f1">
								<FiBook />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Educational guide to PingOne OAuth 2.0 and OIDC scopes">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'ping-ai-resources',
						path: '/ping-ai-resources',
						label: 'Ping AI Resources',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiCpu />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Ping Identity AI Resources & Documentation">
								REFERENCE
							</MigrationBadge>
						),
					},
				],
			},
			{
				id: 'oauth-oidc-docs',
				label: 'OAuth/OIDC Documentation',
				icon: (
					<ColoredIcon $color="#3b82f6">
						<FiFileText />
					</ColoredIcon>
				),
				isOpen: false,
				items: [
					{
						id: 'oidc-overview',
						path: '/documentation/oidc-overview',
						label: 'OIDC Overview',
						icon: (
							<ColoredIcon $color="#3b82f6">
								<FiBook />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="OIDC Overview and Guide">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'oidc-specs',
						path: '/docs/oidc-specs',
						label: 'OIDC Specifications',
						icon: (
							<ColoredIcon $color="#3b82f6">
								<FiBookOpen />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="OIDC Technical Specifications">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'oauth2-security-best-practices',
						path: '/docs/oauth2-security-best-practices',
						label: 'OAuth 2.0 Security Best Practices',
						icon: (
							<ColoredIcon $color="#dc2626">
								<FiShield />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="OAuth 2.0 Security Guidelines">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'spiffe-spire-pingone',
						path: '/docs/spiffe-spire-pingone',
						label: 'SPIFFE/SPIRE with PingOne',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiShield />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Workload Identity & SSO">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
				],
			},
			{
				id: 'ai-documentation',
				label: 'AI Documentation',
				icon: (
					<ColoredIcon $color="#8b5cf6">
						<FiCpu />
					</ColoredIcon>
				),
				isOpen: false,
				items: [
					{
						id: 'ai-identity-architectures',
						path: '/ai-identity-architectures',
						label: 'AI Identity Architectures',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiCpu />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="AI Identity Architectures and Patterns">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'oidc-for-ai',
						path: '/docs/oidc-for-ai',
						label: 'OIDC for AI',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiCpu />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="OIDC for AI Applications">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'oauth-for-ai',
						path: '/docs/oauth-for-ai',
						label: 'OAuth for AI',
						icon: (
							<ColoredIcon $color="#f97316">
								<FiCpu />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="OAuth specifications and PingOne compatibility matrix for AI systems">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'ping-view-on-ai',
						path: '/docs/ping-view-on-ai',
						label: 'PingOne AI Perspective',
						icon: (
							<ColoredIcon $color="#16a34a">
								<FiShield />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="PingOne's View on AI Identity">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
				],
			},
			{
				id: 'tools-utilities',
				label: 'Tools & Utilities',
				icon: <FiSettings />,
				isOpen: true,
				items: [
					{
						id: 'davinci-todo',
						path: '/davinci-todo',
						label: 'DaVinci Todo App',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiCheckCircle />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Production-ready DaVinci SDK integration with real PingOne APIs">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'sdk-sample-app',
						path: '/sdk-sample-app',
						label: 'SDK Sample App',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiCode />
							</ColoredIcon>
						),
					},
					{
						id: 'ultimate-token-display-demo',
						path: '/ultimate-token-display-demo',
						label: 'Ultimate Token Display',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiDatabase />
							</ColoredIcon>
						),
					},
				],
			},
		];

		// Menu structure version - increment when menu structure changes significantly
		const MENU_VERSION = '2.8'; // Added CIBA V9 - OpenID Connect Core 1.0 Compliant
		const savedVersion = localStorage.getItem('simpleDragDropSidebar.menuVersion');

		// If version changed, clear old menu layout and use new structure
		if (savedVersion !== MENU_VERSION) {
			localStorage.removeItem('simpleDragDropSidebar.menuOrder');
			localStorage.setItem('simpleDragDropSidebar.menuVersion', MENU_VERSION);
			return defaultGroups;
		}

		// Try to restore from localStorage
		const savedOrder = localStorage.getItem('simpleDragDropSidebar.menuOrder');
		if (savedOrder) {
			try {
				const serializedGroups = JSON.parse(savedOrder);
				console.log('🔄 Restoring menu layout from localStorage');
				return restoreMenuGroups(serializedGroups, defaultGroups);
			} catch (error) {
				console.warn('Failed to parse saved menu order:', error);
			}
		}

		return defaultGroups;
	});

	// Handle manual save with button state management
	const handleManualSave = useCallback(async () => {
		setSaveButtonState('saving');

		try {
			// Save to localStorage directly
			const serializable = createSerializableGroups(menuGroups);
			localStorage.setItem('simpleDragDropSidebar.menuOrder', JSON.stringify(serializable));
			localStorage.setItem('simpleDragDropSidebar.menuVersion', '2.2');
			console.log('💾 Menu layout saved to localStorage:', serializable);

			setSaveButtonState('saved');

			// Reset to default after 2 seconds
			setTimeout(() => {
				setSaveButtonState('default');
			}, 2000);

			// Removed toast to prevent setState during render
		} catch (error) {
			console.warn('❌ Failed to save menu layout:', error);
			setSaveButtonState('default');
			// Removed toast to prevent setState during render
		}
	}, [menuGroups, createSerializableGroups]);

	// Persist menu layout whenever it changes
	useEffect(() => {
		try {
			// Deduplicate menuGroups before saving (remove any duplicates by ID, including subGroups)
			const deduplicateGroups = (groups: MenuGroup[]): MenuGroup[] => {
				return groups.map((group) => {
					const seenIds = new Set<string>();
					const uniqueItems = group.items.filter((item) => {
						if (seenIds.has(item.id)) {
							console.warn(`[DragDropSidebar] Removing duplicate menu item: ${item.id}`);
							return false;
						}
						seenIds.add(item.id);
						return true;
					});
					const result: MenuGroup = { ...group, items: uniqueItems };
					if (group.subGroups && group.subGroups.length > 0) {
						const deduplicatedSubGroups = deduplicateGroups(group.subGroups);
						if (deduplicatedSubGroups.length > 0) {
							result.subGroups = deduplicatedSubGroups;
						}
					}
					return result;
				});
			};
			const deduplicatedGroups = deduplicateGroups(menuGroups);

			const serializable = createSerializableGroups(deduplicatedGroups);
			localStorage.setItem('simpleDragDropSidebar.menuOrder', JSON.stringify(serializable));
			// Ensure menu version is also saved when menu is modified
			localStorage.setItem('simpleDragDropSidebar.menuVersion', '2.2');
		} catch (error) {
			console.warn('❌ Failed to persist menu layout:', error);
		}
	}, [menuGroups, createSerializableGroups]);

	// Filter menu groups based on search query (recursive for subGroups)
	const filterGroupsRecursive = (groups: MenuGroup[], query: string): MenuGroup[] => {
		return groups
			.map((group) => {
				// Filter items in this group - match whole words when possible for better precision
				const queryWords = query.split(/\s+/).filter(Boolean);
				const filteredItems = group.items.filter((item) => {
					const labelLower = item.label.toLowerCase();
					const pathLower = item.path.toLowerCase();

					// If query is a single word, try to match as whole word first, then substring
					if (queryWords.length === 1) {
						const singleQuery = queryWords[0];

						// Normalize plural/singular variations for better matching
						const normalizedQuery = singleQuery.replace(/s$/, '');
						const normalizedLabel = labelLower.replace(/s$/, '');
						const normalizedPath = pathLower.replace(/s$/, '');

						// Check for whole word match (word boundary) - try both original and normalized
						const escapedQuery = singleQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
						const escapedNormalized = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

						const wholeWordRegex = new RegExp(`\\b${escapedQuery}\\b`, 'i');
						const normalizedWholeWordRegex = new RegExp(`\\b${escapedNormalized}\\b`, 'i');

						if (wholeWordRegex.test(item.label) || wholeWordRegex.test(item.path)) {
							return true;
						}
						if (
							normalizedWholeWordRegex.test(item.label) ||
							normalizedWholeWordRegex.test(item.path)
						) {
							return true;
						}

						// Exact match
						const exactMatch = labelLower === singleQuery || pathLower === singleQuery;
						if (exactMatch) return true;

						// Check normalized exact match
						const normalizedExactMatch =
							normalizedLabel === normalizedQuery || normalizedPath === normalizedQuery;
						if (normalizedExactMatch) return true;

						// If matchAnywhere is enabled, allow simple substring matching
						if (matchAnywhere) {
							if (
								normalizedLabel.includes(normalizedQuery) ||
								normalizedPath.includes(normalizedQuery)
							) {
								return true;
							}
							return labelLower.includes(singleQuery) || pathLower.includes(singleQuery);
						}

						// For substring matching, require the query to appear at a word boundary
						// This prevents "webhook" from matching items that only contain "hook"
						// Only allow substring matching for queries 4+ characters
						if (singleQuery.length >= 4) {
							// Check if query appears at word boundary (start of word) - this is the primary match
							const startsWithRegex = new RegExp(`\\b${escapedQuery}`, 'i');
							const normalizedStartsWithRegex = new RegExp(`\\b${escapedNormalized}`, 'i');

							if (startsWithRegex.test(item.label) || startsWithRegex.test(item.path)) {
								return true;
							}
							if (
								normalizedStartsWithRegex.test(item.label) ||
								normalizedStartsWithRegex.test(item.path)
							) {
								return true;
							}

							// For queries 6+ chars, also check for compound words (with hyphens/underscores)
							// This helps "webhook" match "pingone-webhook-viewer" but not random substrings
							if (singleQuery.length >= 6) {
								// Match if query appears with hyphens/underscores around it (compound words)
								const compoundWordRegex = new RegExp(`[\\-_]${escapedQuery}[\\-_]`, 'i');
								const normalizedCompoundRegex = new RegExp(`[\\-_]${escapedNormalized}[\\-_]`, 'i');

								if (compoundWordRegex.test(item.label) || compoundWordRegex.test(item.path)) {
									return true;
								}
								if (
									normalizedCompoundRegex.test(item.label) ||
									normalizedCompoundRegex.test(item.path)
								) {
									return true;
								}

								// Also check if query appears at end of word (before hyphen/underscore/end)
								const endsWithRegex = new RegExp(`${escapedQuery}[\\-_]|${escapedQuery}$`, 'i');
								const normalizedEndsWithRegex = new RegExp(
									`${escapedNormalized}[\\-_]|${escapedNormalized}$`,
									'i'
								);

								if (endsWithRegex.test(item.label) || endsWithRegex.test(item.path)) {
									return true;
								}
								if (
									normalizedEndsWithRegex.test(item.label) ||
									normalizedEndsWithRegex.test(item.path)
								) {
									return true;
								}
							}
						}

						// Don't allow arbitrary substring matching - only word boundaries
						return false;
					}

					// For multi-word queries, all words must be present as whole words or at word boundaries
					return queryWords.every((word) => {
						if (matchAnywhere) {
							// Simple substring matching when matchAnywhere is enabled
							return labelLower.includes(word) || pathLower.includes(word);
						}

						if (word.length < 3) {
							// Very short words must be whole words
							const wordRegex = new RegExp(
								`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
								'i'
							);
							return wordRegex.test(item.label) || wordRegex.test(item.path);
						}
						// Longer words can be at word boundaries
						const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
						return (
							wordRegex.test(item.label) ||
							wordRegex.test(item.path) ||
							labelLower.includes(word) ||
							pathLower.includes(word)
						);
					});
				});

				// Filter subGroups recursively if they exist
				const result: MenuGroup = { ...group, items: filteredItems };
				if (group.subGroups && group.subGroups.length > 0) {
					const filtered = filterGroupsRecursive(group.subGroups, query);
					if (filtered.length > 0) {
						result.subGroups = filtered;
					}
				}

				const groupMatches = group.label.toLowerCase().includes(query);
				const hasMatchingSubGroups = result.subGroups && result.subGroups.length > 0;

				// When searching, only show items that actually match the query
				// This prevents showing all items in a group just because the group label matches
				return {
					...result,
					items: filteredItems, // Always show only matching items
					isOpen: groupMatches || filteredItems.length > 0 || hasMatchingSubGroups || false,
				};
			})
			.filter((group) => {
				const hasItems = group.items.length > 0;
				const hasSubGroups = group.subGroups && group.subGroups.length > 0;
				const matchesLabel = group.label.toLowerCase().includes(query);
				return hasItems || hasSubGroups || matchesLabel;
			});
	};

	const filteredMenuGroups = useMemo(() => {
		if (!searchQuery.trim()) {
			return menuGroups;
		}

		const query = searchQuery.toLowerCase();
		return filterGroupsRecursive(menuGroups, query);
	}, [menuGroups, searchQuery, filterGroupsRecursive]);

	// Handle drag start
	const handleDragStart = (
		e: React.DragEvent,
		type: 'group' | 'item',
		id: string,
		groupId?: string,
		subGroupId?: string
	) => {
		const dragData: { type: 'group' | 'item'; id: string; groupId?: string; subGroupId?: string } =
			groupId ? { type, id, groupId, ...(subGroupId ? { subGroupId } : {}) } : { type, id };
		setDraggedItem(dragData);
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
		e.dataTransfer.setData('application/json', JSON.stringify(dragData));

		// Make the dragged element slightly transparent
		const target = e.currentTarget as HTMLElement;
		target.style.opacity = '0.5';
	};

	// Handle drag end (for cleanup)
	const handleDragEnd = (e: React.DragEvent) => {
		// Restore opacity
		const target = e.currentTarget as HTMLElement;
		target.style.opacity = '1';

		// Don't clear draggedItem here - let the drop handler clear it
		// This ensures drop handlers can always access the dragged item data
		// If drop doesn't happen, we'll clear it on next drag start or component unmount
	};

	// Handle drag over
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};

	// Helper function to get dragged item data (from state or dataTransfer)
	const getDraggedItemData = (
		e: React.DragEvent
	): { type: 'group' | 'item'; id: string; groupId?: string; subGroupId?: string } | null => {
		// First try to get from state
		if (draggedItem) {
			return draggedItem;
		}

		// Fallback to dataTransfer if state is cleared
		try {
			const dataStr =
				e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
			if (dataStr) {
				const data = JSON.parse(dataStr);
				return data;
			}
		} catch (err) {
			console.warn('Failed to parse drag data from dataTransfer:', err);
		}

		return null;
	};

	// Handle drop on specific item (for precise positioning)
	const handleDropOnItem = (
		e: React.DragEvent,
		targetGroupId: string,
		targetItemIndex: number,
		targetSubGroupId?: string
	) => {
		e.preventDefault();
		e.stopPropagation();
		setDropTarget(null);

		const itemData = getDraggedItemData(e);
		if (!itemData) {
			return;
		}

		// Clear draggedItem after successful drop
		setDraggedItem(null);

		if (itemData.type === 'item') {
			const newGroups = [...menuGroups];
			const sourceGroupIndex = newGroups.findIndex((g) => g.id === itemData.groupId);

			if (sourceGroupIndex === -1) return;

			const sourceGroup = newGroups[sourceGroupIndex];

			// Find the source item - it could be in the main group items or in a subGroup
			let sourceItem = null;
			let sourceItemIndex = -1;
			let sourceSubGroupIndex = -1;

			// First check main group items
			sourceItemIndex = sourceGroup.items.findIndex((i) => i.id === itemData.id);
			if (sourceItemIndex !== -1) {
				sourceItem = sourceGroup.items[sourceItemIndex];
			} else if (itemData.subGroupId && sourceGroup.subGroups) {
				// Check subGroups
				sourceSubGroupIndex = sourceGroup.subGroups.findIndex(
					(sg) => sg.id === itemData.subGroupId
				);
				if (sourceSubGroupIndex !== -1) {
					sourceItemIndex = sourceGroup.subGroups[sourceSubGroupIndex].items.findIndex(
						(i) => i.id === itemData.id
					);
					if (sourceItemIndex !== -1) {
						sourceItem = sourceGroup.subGroups[sourceSubGroupIndex].items[sourceItemIndex];
					}
				}
			}

			if (!sourceItem || sourceItemIndex === -1) return;

			// Find the target group
			const targetGroupIndex = newGroups.findIndex((g) => g.id === targetGroupId);
			if (targetGroupIndex === -1) return;

			const targetGroup = newGroups[targetGroupIndex];

			// Remove item from source location
			if (sourceSubGroupIndex !== -1) {
				// Remove from subGroup
				sourceGroup.subGroups![sourceSubGroupIndex].items.splice(sourceItemIndex, 1);
			} else {
				// Remove from main group items
				sourceGroup.items.splice(sourceItemIndex, 1);
			}

			// Add item to target location
			if (targetSubGroupId && targetGroup.subGroups) {
				// Add to target subGroup
				const targetSubGroupIndex = targetGroup.subGroups.findIndex(
					(sg) => sg.id === targetSubGroupId
				);
				if (targetSubGroupIndex !== -1) {
					const targetSubGroup = targetGroup.subGroups[targetSubGroupIndex];

					// Calculate correct insertion index
					let insertIndex = targetItemIndex;
					if (
						itemData.groupId === targetGroupId &&
						itemData.subGroupId === targetSubGroupId &&
						sourceItemIndex < targetItemIndex
					) {
						insertIndex = targetItemIndex - 1;
					}

					targetSubGroup.items.splice(Math.max(0, insertIndex), 0, sourceItem);
				}
			} else {
				// Add to main group items
				let insertIndex = targetItemIndex;

				// Adjust index if moving within same location
				if (
					itemData.groupId === targetGroupId &&
					!itemData.subGroupId &&
					!targetSubGroupId &&
					sourceItemIndex < targetItemIndex
				) {
					insertIndex = targetItemIndex - 1;
				}

				targetGroup.items.splice(Math.max(0, insertIndex), 0, sourceItem);
			}

			setMenuGroups(newGroups);
			saveWithFeedback(newGroups);

			// Determine target location description for toast
			let targetLocation = targetGroup.label;
			if (targetSubGroupId && targetGroup.subGroups) {
				const subGroup = targetGroup.subGroups.find((sg) => sg.id === targetSubGroupId);
				if (subGroup) {
					targetLocation = `${subGroup.label} (${targetGroup.label})`;
				}
			}

			v4ToastManager.showSuccess(`Moved "${sourceItem.label}" to ${targetLocation}`);
		}
	};

	// Handle drop on group (for dropping at the end)
	const handleDropOnGroup = (e: React.DragEvent, targetGroupId: string) => {
		e.preventDefault();

		const itemData = getDraggedItemData(e);
		if (!itemData) return;

		if (itemData.type === 'item') {
			const newGroups = [...menuGroups];
			const sourceGroupIndex = newGroups.findIndex((g) => g.id === itemData.groupId);
			const targetGroupIndex = newGroups.findIndex((g) => g.id === targetGroupId);

			if (sourceGroupIndex !== -1 && targetGroupIndex !== -1) {
				const sourceGroup = { ...newGroups[sourceGroupIndex] };
				const targetGroup = { ...newGroups[targetGroupIndex] };

				// Find and remove the item from source location
				let movedItem = null;
				let sourceItemIndex = sourceGroup.items.findIndex((i) => i.id === itemData.id);

				if (sourceItemIndex !== -1) {
					[movedItem] = sourceGroup.items.splice(sourceItemIndex, 1);
				} else if (itemData.subGroupId && sourceGroup.subGroups) {
					// Check subGroups
					const sourceSubGroupIndex = sourceGroup.subGroups.findIndex(
						(sg) => sg.id === itemData.subGroupId
					);
					if (sourceSubGroupIndex !== -1) {
						sourceItemIndex = sourceGroup.subGroups[sourceSubGroupIndex].items.findIndex(
							(i) => i.id === itemData.id
						);
						if (sourceItemIndex !== -1) {
							[movedItem] = sourceGroup.subGroups[sourceSubGroupIndex].items.splice(
								sourceItemIndex,
								1
							);
						}
					}
				}

				if (movedItem) {
					// Add to end of target group main items (not subGroups)
					targetGroup.items.push(movedItem);

					newGroups[sourceGroupIndex] = sourceGroup;
					newGroups[targetGroupIndex] = targetGroup;

					setMenuGroups(newGroups);
					saveWithFeedback(newGroups);
					v4ToastManager.showSuccess(`Moved "${movedItem.label}" to end of ${targetGroup.label}`);

					// Clear draggedItem after successful drop
					setDraggedItem(null);
				}
			}
		}
	};

	// Handle drop for reordering groups
	const handleDropForGroupReorder = (e: React.DragEvent, targetIndex: number) => {
		e.preventDefault();

		const itemData = getDraggedItemData(e);
		if (!itemData || itemData.type !== 'group') return;

		const sourceIndex = menuGroups.findIndex((g) => g.id === itemData.id);
		if (sourceIndex !== -1 && sourceIndex !== targetIndex) {
			const newGroups = [...menuGroups];
			const [movedGroup] = newGroups.splice(sourceIndex, 1);
			newGroups.splice(targetIndex, 0, movedGroup);

			setMenuGroups(newGroups);
			saveWithFeedback(newGroups);
			v4ToastManager.showSuccess(`Reordered "${movedGroup.label}" section`);

			// Clear draggedItem after successful drop
			setDraggedItem(null);
		}
	};

	const toggleMenuGroup = (groupId: string) => {
		setMenuGroups((prevGroups) => {
			const updateGroup = (groups: MenuGroup[]): MenuGroup[] => {
				return groups.map((group) => {
					if (group.id === groupId) {
						return { ...group, isOpen: !group.isOpen };
					}
					if (group.subGroups) {
						return {
							...group,
							subGroups: updateGroup(group.subGroups),
						};
					}
					return group;
				});
			};
			const newGroups = updateGroup(prevGroups);
			saveWithFeedback(newGroups);
			return newGroups;
		});
	};

	return (
		<div style={{ padding: dragMode ? '1rem' : '0' }}>
			{/* Search Results Indicator */}
			{searchQuery.trim() && (
				<div
					style={{
						padding: '0.5rem 1rem',
						background: '#f0f9ff',
						borderBottom: '1px solid #e0f2fe',
						fontSize: '0.875rem',
						color: '#0369a1',
					}}
				>
					{(() => {
						const countItems = (groups: MenuGroup[]): number => {
							return groups.reduce((total, group) => {
								let count = group.items.length;
								if (group.subGroups && group.subGroups.length > 0) {
									count += countItems(group.subGroups);
								}
								return total + count;
							}, 0);
						};
						return countItems(filteredMenuGroups);
					})()} results for "{searchQuery}"
				</div>
			)}

			{/* CSS Animation for drop zones */}
			<style>{`
				@keyframes pulse {
					0%, 100% { 
						opacity: 0.3; 
						border-color: rgba(34, 197, 94, 0.4);
						background-color: rgba(34, 197, 94, 0.08);
					}
					50% { 
						opacity: 0.7; 
						border-color: rgba(34, 197, 94, 0.7);
						background-color: rgba(34, 197, 94, 0.15);
					}
				}
				
				/* Smooth transitions for menu navigation */
				html {
					scroll-behavior: smooth;
				}
				
				/* Prevent layout shifts during navigation */
				body {
					overflow-anchor: none;
				}
				
				/* Smooth transitions for menu items */
				.menu-item {
					transition: all 0.2s ease;
				}
			`}</style>
			{dragMode && (
				<div
					style={{
						marginBottom: '1rem',
						padding: '1rem',
						backgroundColor: '#dcfce7',
						borderRadius: '0.5rem',
						border: '2px solid #22c55e',
						boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div>
							<strong style={{ color: '#166534' }}>🎯 Drag & Drop Mode Active:</strong>
							<div style={{ fontSize: '0.875rem', color: '#166534', marginTop: '0.25rem' }}>
								Drag items to reorder • Green zones show drop areas
							</div>
							{localStorage.getItem('simpleDragDropSidebar.menuOrder') && (
								<div style={{ fontSize: '0.875rem', color: '#059669', marginTop: '0.25rem' }}>
									✅ Custom layout loaded from storage
								</div>
							)}
						</div>
						<div style={{ display: 'flex', gap: '0.5rem' }}>
							<button
								onClick={handleManualSave}
								disabled={saveButtonState === 'saving'}
								style={{
									padding: '0.5rem 1rem',
									backgroundColor:
										saveButtonState === 'saved'
											? '#22c55e'
											: saveButtonState === 'saving'
												? '#f59e0b'
												: '#f59e0b', // Default yellow
									color: 'white',
									border: 'none',
									borderRadius: '0.375rem',
									cursor: saveButtonState === 'saving' ? 'not-allowed' : 'pointer',
									fontSize: '0.875rem',
									transition: 'all 0.3s ease',
									opacity: saveButtonState === 'saving' ? 0.7 : 1,
									transform: saveButtonState === 'saved' ? 'scale(1.05)' : 'scale(1)',
								}}
								title={
									saveButtonState === 'saved'
										? 'Layout saved successfully!'
										: saveButtonState === 'saving'
											? 'Saving layout...'
											: 'Manually save current layout'
								}
							>
								{saveButtonState === 'saved'
									? '✅ Saved!'
									: saveButtonState === 'saving'
										? '⏳ Saving...'
										: '💾 Save Layout'}
							</button>
							<button
								onClick={() => {
									localStorage.removeItem('simpleDragDropSidebar.menuOrder');
									window.location.reload();
								}}
								style={{
									padding: '0.5rem 1rem',
									backgroundColor: '#ef4444',
									color: 'white',
									border: 'none',
									borderRadius: '0.375rem',
									cursor: 'pointer',
									fontSize: '0.875rem',
								}}
								title="Reset menu to default layout"
							>
								🔄 Reset Layout
							</button>
						</div>
					</div>
				</div>
			)}

			{filteredMenuGroups.map((group, groupIndex) => (
				<div
					key={group.id}
					style={{ marginBottom: '1rem' }}
					onDragOver={handleDragOver}
					onDrop={(e) => handleDropForGroupReorder(e, groupIndex)}
				>
					{/* Section Header */}
					<div
						draggable={dragMode}
						onDragStart={
							dragMode
								? (e) => {
										handleDragStart(e, 'group', group.id);
										e.currentTarget.style.cursor = 'grabbing';
									}
								: undefined
						}
						onDragEnd={
							dragMode
								? (e) => {
										handleDragEnd(e);
										e.currentTarget.style.cursor = 'grab';
									}
								: undefined
						}
						onClick={() => toggleMenuGroup(group.id)}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							padding: '0.75rem 1rem',
							background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
							borderRadius: '0.5rem',
							marginBottom: '0.25rem',
							cursor: dragMode ? 'grab' : 'pointer',
							border: dragMode
								? '2px dashed rgba(255,255,255,0.3)'
								: '1px solid rgba(255,255,255,0.2)',
							boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
							transition: 'all 0.2s ease',
							userSelect: 'none',
							WebkitUserSelect: 'none',
							MozUserSelect: 'none',
							msUserSelect: 'none',
						}}
						onMouseEnter={(e) => {
							if (!dragMode) {
								e.currentTarget.style.background =
									'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)';
								e.currentTarget.style.transform = 'translateY(-1px)';
								e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
							}
						}}
						onMouseLeave={(e) => {
							if (!dragMode) {
								e.currentTarget.style.background =
									'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
								e.currentTarget.style.transform = 'translateY(0px)';
								e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
							}
						}}
					>
						{dragMode && <FiMove size={16} style={{ color: 'white' }} />}
						<div style={{ color: 'white' }}>{group.icon}</div>
						<span
							style={{
								fontWeight: '600',
								color: 'white',
								flex: 1,
								userSelect: 'none',
								WebkitUserSelect: 'none',
								MozUserSelect: 'none',
								msUserSelect: 'none',
							}}
						>
							{group.label}
						</span>
						<button
							onClick={(e) => {
								e.stopPropagation();
								// No need to call toggleMenuGroup here since the parent div handles it
							}}
							style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								padding: '0.5rem',
								borderRadius: '0.25rem',
								display: 'flex',
								alignItems: 'center',
								color: 'white',
								transition: 'background-color 0.2s',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = 'transparent';
							}}
						>
							<FiChevronDown
								size={16}
								style={{
									transform: group.isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
									transition: 'transform 0.2s',
									color: 'white',
								}}
							/>
						</button>
					</div>

					{/* Items Container */}
					{group.isOpen && (
						<div
							style={{
								paddingLeft: '1rem',
								backgroundColor: '#f8fafc',
								borderRadius: '0.5rem',
								padding: '0.5rem',
								minHeight: '2rem',
							}}
							onDragOver={dragMode ? handleDragOver : undefined}
							onDrop={dragMode ? (e) => handleDropOnGroup(e, group.id) : undefined}
						>
							{/* Render subGroups if they exist - show them first */}
							{group.subGroups &&
								group.subGroups.length > 0 &&
								group.subGroups.map((subGroup) => (
									<div key={subGroup.id} style={{ marginBottom: '0.75rem' }}>
										{/* SubGroup Header */}
										<div
											onClick={() => toggleMenuGroup(subGroup.id)}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												padding: '0.5rem 0.75rem',
												background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
												borderRadius: '0.375rem',
												marginBottom: '0.25rem',
												cursor: 'pointer',
												border: '1px solid rgba(255,255,255,0.2)',
												boxShadow: '0 1px 3px rgba(59, 130, 246, 0.2)',
												transition: 'all 0.2s ease',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background =
													'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
												e.currentTarget.style.transform = 'translateY(-1px)';
												e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background =
													'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)';
												e.currentTarget.style.transform = 'translateY(0px)';
												e.currentTarget.style.boxShadow = '0 1px 3px rgba(59, 130, 246, 0.2)';
											}}
										>
											<div style={{ color: 'white' }}>{subGroup.icon}</div>
											<span style={{ fontWeight: '600', color: 'white', flex: 1 }}>
												{subGroup.label}
											</span>
											<FiChevronDown
												size={14}
												style={{
													transform: subGroup.isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
													transition: 'transform 0.2s',
													color: 'white',
												}}
											/>
										</div>
										{/* SubGroup Items */}
										{subGroup.isOpen && (
											<div
												style={{
													paddingLeft: '0.75rem',
													backgroundColor: '#f1f5f9',
													borderRadius: '0.375rem',
													padding: '0.5rem',
												}}
											>
												{subGroup.items.map((item, itemIndex) => (
													<div key={item.id}>
														{/* Drop zone before subGroup item */}
														{dragMode && draggedItem && draggedItem.type === 'item' && (
															<div
																style={{
																	height: '20px',
																	backgroundColor: 'rgba(34, 197, 94, 0.08)',
																	borderRadius: '6px',
																	marginBottom: '4px',
																	border: '2px dashed rgba(34, 197, 94, 0.3)',
																	transition: 'all 0.2s',
																	position: 'relative',
																	animation: draggedItem ? 'pulse 2s infinite' : 'none',
																}}
																onDragOver={(e) => {
																	e.preventDefault();
																	e.stopPropagation();
																	setDropTarget({ groupId: group.id, index: itemIndex });
																	e.currentTarget.style.backgroundColor = '#fef2f2';
																	e.currentTarget.style.borderColor = '#ef4444';
																	e.currentTarget.style.borderStyle = 'solid';
																	e.currentTarget.style.borderWidth = '2px';
																	e.currentTarget.style.boxShadow =
																		'0 0 0 2px rgba(239, 68, 68, 0.2)';
																	e.currentTarget.style.height = '28px';
																}}
																onDragLeave={(e) => {
																	const rect = e.currentTarget.getBoundingClientRect();
																	const x = e.clientX;
																	const y = e.clientY;
																	if (
																		x < rect.left ||
																		x > rect.right ||
																		y < rect.top ||
																		y > rect.bottom
																	) {
																		setDropTarget((prev) => {
																			if (
																				prev &&
																				prev.groupId === group.id &&
																				prev.index === itemIndex
																			) {
																				return null;
																			}
																			return prev;
																		});
																		e.currentTarget.style.backgroundColor =
																			'rgba(34, 197, 94, 0.08)';
																		e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
																		e.currentTarget.style.borderStyle = 'dashed';
																		e.currentTarget.style.borderWidth = '2px';
																		e.currentTarget.style.boxShadow = 'none';
																		e.currentTarget.style.height = '20px';
																	}
																}}
																onDrop={(e) => {
																	setDropTarget(null);
																	e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.08)';
																	e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
																	e.currentTarget.style.borderStyle = 'dashed';
																	e.currentTarget.style.borderWidth = '2px';
																	e.currentTarget.style.boxShadow = 'none';
																	e.currentTarget.style.height = '20px';
																	handleDropOnItem(e, group.id, itemIndex, subGroup.id);
																}}
															/>
														)}

														{/* SubGroup Item */}
														<div
															draggable={dragMode}
															onDragStart={
																dragMode
																	? (e) => {
																			handleDragStart(e, 'item', item.id, group.id, subGroup.id);
																			e.currentTarget.style.cursor = 'grabbing';
																		}
																	: undefined
															}
															onDragEnd={
																dragMode
																	? (e) => {
																			handleDragEnd(e);
																			setDropTarget(null);
																			e.currentTarget.style.cursor = 'grab';
																		}
																	: undefined
															}
															onDragOver={
																dragMode
																	? (e) => {
																			e.preventDefault();
																			e.stopPropagation();
																			// Set drop target to after this item
																			setDropTarget({ groupId: group.id, index: itemIndex + 1 });
																		}
																	: undefined
															}
															onClick={() => handleNavigation(item.path)}
															className={
																item.id.includes('implicit') ? 'implicit-flow-menu-item' : ''
															}
															style={{
																display: 'flex',
																alignItems: 'center',
																gap: '0.5rem',
																padding: '0.5rem 0.75rem',
																backgroundColor: isActive(item.path) ? '#fef3c7' : 'white',
																color: isActive(item.path) ? '#d97706' : '#64748b',
																borderRadius: '0.375rem',
																border:
																	dropTarget &&
																	dropTarget.groupId === group.id &&
																	dropTarget.index === itemIndex + 1
																		? '3px solid #ef4444'
																		: isActive(item.path)
																			? '3px solid #f59e0b'
																			: '1px solid #e2e8f0',
																fontWeight: isActive(item.path) ? '700' : '400',
																boxShadow:
																	dropTarget &&
																	dropTarget.groupId === group.id &&
																	dropTarget.index === itemIndex + 1
																		? '0 0 0 3px rgba(239, 68, 68, 0.2)'
																		: isActive(item.path)
																			? '0 4px 8px rgba(245, 158, 11, 0.3)'
																			: 'none',
																transform: isActive(item.path) ? 'scale(1.02)' : 'scale(1)',
																marginBottom: '0.25rem',
																cursor: dragMode ? 'grab' : 'pointer',
																transition: 'all 0.2s ease',
															}}
														>
															{dragMode && <FiMove size={10} />}
															{item.icon}
															<span style={{ flex: 1 }}>{item.label}</span>
															{item.badge}
														</div>

														{/* Drop zone after last subGroup item */}
														{dragMode && itemIndex === subGroup.items.length - 1 && (
															<div
																style={{
																	height: '20px',
																	backgroundColor: 'rgba(34, 197, 94, 0.08)',
																	borderRadius: '6px',
																	marginTop: '4px',
																	border: '2px dashed rgba(34, 197, 94, 0.3)',
																	animation: draggedItem ? 'pulse 2s infinite' : 'none',
																	transition: 'all 0.2s',
																}}
																onDragOver={(e) => {
																	e.preventDefault();
																	e.stopPropagation();
																	setDropTarget({
																		groupId: group.id,
																		index: subGroup.items.length,
																	});
																	e.currentTarget.style.backgroundColor = '#fef2f2';
																	e.currentTarget.style.borderColor = '#ef4444';
																	e.currentTarget.style.borderStyle = 'solid';
																	e.currentTarget.style.borderWidth = '2px';
																	e.currentTarget.style.boxShadow =
																		'0 0 0 2px rgba(239, 68, 68, 0.2)';
																	e.currentTarget.style.height = '28px';
																}}
																onDragLeave={(e) => {
																	const rect = e.currentTarget.getBoundingClientRect();
																	const x = e.clientX;
																	const y = e.clientY;
																	if (
																		x < rect.left ||
																		x > rect.right ||
																		y < rect.top ||
																		y > rect.bottom
																	) {
																		setDropTarget((prev) => {
																			if (
																				prev &&
																				prev.groupId === group.id &&
																				prev.index === subGroup.items.length
																			) {
																				return null;
																			}
																			return prev;
																		});
																		e.currentTarget.style.backgroundColor =
																			'rgba(34, 197, 94, 0.08)';
																		e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
																		e.currentTarget.style.borderStyle = 'dashed';
																		e.currentTarget.style.borderWidth = '2px';
																		e.currentTarget.style.boxShadow = 'none';
																		e.currentTarget.style.height = '20px';
																	}
																}}
																onDrop={(e) => {
																	setDropTarget(null);
																	e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.08)';
																	e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
																	e.currentTarget.style.borderStyle = 'dashed';
																	e.currentTarget.style.borderWidth = '2px';
																	e.currentTarget.style.boxShadow = 'none';
																	e.currentTarget.style.height = '20px';
																	handleDropOnItem(e, group.id, subGroup.items.length, subGroup.id);
																}}
															/>
														)}
													</div>
												))}
											</div>
										)}
									</div>
								))}

							{/* Drop zone at the very top of the group - only show if group has direct items */}
							{dragMode &&
								group.items.length > 0 &&
								(!group.subGroups || group.subGroups.length === 0) && (
									<div
										style={{
											height: '24px',
											backgroundColor: 'rgba(34, 197, 94, 0.12)',
											borderRadius: '8px',
											marginBottom: '8px',
											border: '2px dashed rgba(34, 197, 94, 0.4)',
											transition: 'all 0.2s',
											position: 'relative',
											animation: draggedItem ? 'pulse 2s infinite' : 'none',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: '0.75rem',
											color: 'rgba(34, 197, 94, 0.6)',
											fontWeight: '500',
										}}
										onDragOver={(e) => {
											e.preventDefault();
											e.stopPropagation();
											setDropTarget({ groupId: group.id, index: 0 });
											e.currentTarget.style.backgroundColor = '#fef2f2';
											e.currentTarget.style.borderColor = '#ef4444';
											e.currentTarget.style.borderStyle = 'solid';
											e.currentTarget.style.borderWidth = '3px';
											e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.3)';
										}}
										onDragLeave={(e) => {
											const rect = e.currentTarget.getBoundingClientRect();
											const x = e.clientX;
											const y = e.clientY;
											if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
												setDropTarget((prev) => {
													if (prev && prev.groupId === group.id && prev.index === 0) {
														return null;
													}
													return prev;
												});
												e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.12)';
												e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)';
												e.currentTarget.style.borderStyle = 'dashed';
												e.currentTarget.style.borderWidth = '2px';
												e.currentTarget.style.boxShadow = 'none';
											}
										}}
										onDrop={(e) => {
											setDropTarget(null);
											e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.12)';
											e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)';
											e.currentTarget.style.borderStyle = 'dashed';
											e.currentTarget.style.borderWidth = '2px';
											e.currentTarget.style.boxShadow = 'none';
											handleDropOnItem(e, group.id, 0);
										}}
									>
										{draggedItem && '↓ Drop here ↓'}
									</div>
								)}

							{group.items.map((item, itemIndex) => (
								<div key={item.id}>
									{/* Drop zone before item - show for all items when dragging */}
									{dragMode && draggedItem && draggedItem.type === 'item' && (
										<div
											style={{
												height: '24px',
												backgroundColor: 'rgba(34, 197, 94, 0.12)',
												borderRadius: '8px',
												marginBottom: '8px',
												border: '2px dashed rgba(34, 197, 94, 0.4)',
												transition: 'all 0.2s',
												position: 'relative',
												animation: draggedItem ? 'pulse 2s infinite' : 'none',
											}}
											onDragOver={(e) => {
												e.preventDefault();
												e.stopPropagation();
												setDropTarget({ groupId: group.id, index: itemIndex });
												e.currentTarget.style.backgroundColor = '#fef2f2';
												e.currentTarget.style.borderColor = '#ef4444';
												e.currentTarget.style.borderStyle = 'solid';
												e.currentTarget.style.borderWidth = '3px';
												e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.3)';
												e.currentTarget.style.height = '36px';
											}}
											onDragLeave={(e) => {
												const rect = e.currentTarget.getBoundingClientRect();
												const x = e.clientX;
												const y = e.clientY;
												if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
													setDropTarget((prev) => {
														if (prev && prev.groupId === group.id && prev.index === itemIndex) {
															return null;
														}
														return prev;
													});
													e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.12)';
													e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)';
													e.currentTarget.style.borderStyle = 'dashed';
													e.currentTarget.style.borderWidth = '2px';
													e.currentTarget.style.boxShadow = 'none';
													e.currentTarget.style.height = '24px';
												}
											}}
											onDrop={(e) => {
												setDropTarget(null);
												e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.12)';
												e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)';
												e.currentTarget.style.borderStyle = 'dashed';
												e.currentTarget.style.borderWidth = '2px';
												e.currentTarget.style.boxShadow = 'none';
												e.currentTarget.style.height = '24px';
												handleDropOnItem(e, group.id, itemIndex);
											}}
										/>
									)}

									{/* Item */}
									<div
										draggable={dragMode}
										onDragStart={
											dragMode
												? (e) => {
														handleDragStart(e, 'item', item.id, group.id);
														e.currentTarget.style.cursor = 'grabbing';
													}
												: undefined
										}
										onDragEnd={
											dragMode
												? (e) => {
														handleDragEnd(e);
														setDropTarget(null);
														e.currentTarget.style.cursor = 'grab';
													}
												: undefined
										}
										onDragOver={
											dragMode
												? (e) => {
														e.preventDefault();
														e.stopPropagation();
														// Set drop target to after this item
														setDropTarget({ groupId: group.id, index: itemIndex + 1 });
													}
												: undefined
										}
										className={item.id.includes('implicit') ? 'implicit-flow-menu-item' : ''}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											padding: '0.5rem 0.75rem',
											backgroundColor: isActive(item.path) ? '#fef3c7' : 'white',
											color: isActive(item.path) ? '#d97706' : '#64748b',
											borderRadius: '0.375rem',
											border:
												dropTarget &&
												dropTarget.groupId === group.id &&
												dropTarget.index === itemIndex + 1
													? '3px solid #ef4444'
													: isActive(item.path)
														? '3px solid #f59e0b'
														: '1px solid #e2e8f0',
											fontWeight: isActive(item.path) ? '700' : '400',
											boxShadow:
												dropTarget &&
												dropTarget.groupId === group.id &&
												dropTarget.index === itemIndex + 1
													? '0 0 0 3px rgba(239, 68, 68, 0.2)'
													: isActive(item.path)
														? '0 4px 8px rgba(245, 158, 11, 0.3)'
														: 'none',
											transform: isActive(item.path) ? 'scale(1.02)' : 'scale(1)',
											marginBottom: '0.25rem',
											cursor: dragMode ? 'grab' : 'pointer',
											transition: 'all 0.2s ease',
											userSelect: 'none',
											WebkitUserSelect: 'none',
											MozUserSelect: 'none',
											msUserSelect: 'none',
										}}
									>
										{dragMode && <FiMove size={12} />}
										<div
											onClick={
												!dragMode
													? (e) => {
															e.stopPropagation();
															// Handle context-aware navigation for OIDC section
															if (group.id === 'oidc-flows') {
																// Pass OIDC context for unified V7 flows
																handleNavigation(item.path, {
																	fromSection: 'oidc',
																	protocol: 'oidc',
																});
															} else {
																handleNavigation(item.path);
															}
														}
													: undefined
											}
											className="menu-item"
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												flex: 1,
												cursor: dragMode ? 'grab' : 'pointer',
												pointerEvents: dragMode ? 'none' : 'auto',
												userSelect: 'none',
												WebkitUserSelect: 'none',
												MozUserSelect: 'none',
												msUserSelect: 'none',
											}}
										>
											{item.icon}
											<span
												style={{
													flex: 1,
													userSelect: 'none',
													WebkitUserSelect: 'none',
													MozUserSelect: 'none',
													msUserSelect: 'none',
												}}
											>
												{item.label}
											</span>
											{item.badge}
										</div>
									</div>

									{/* Drop zone after last item */}
									{dragMode && itemIndex === group.items.length - 1 && (
										<div
											style={{
												height: '24px',
												backgroundColor: 'rgba(34, 197, 94, 0.12)',
												borderRadius: '8px',
												marginTop: '8px',
												border: '2px dashed rgba(34, 197, 94, 0.4)',
												animation: draggedItem ? 'pulse 2s infinite' : 'none',
												transition: 'all 0.2s',
											}}
											onDragOver={(e) => {
												e.preventDefault();
												e.stopPropagation();
												setDropTarget({ groupId: group.id, index: group.items.length });
												e.currentTarget.style.backgroundColor = '#fef2f2';
												e.currentTarget.style.borderColor = '#ef4444';
												e.currentTarget.style.borderStyle = 'solid';
												e.currentTarget.style.borderWidth = '3px';
												e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.3)';
												e.currentTarget.style.height = '36px';
											}}
											onDragLeave={(e) => {
												const rect = e.currentTarget.getBoundingClientRect();
												const x = e.clientX;
												const y = e.clientY;
												if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
													setDropTarget((prev) => {
														if (
															prev &&
															prev.groupId === group.id &&
															prev.index === group.items.length
														) {
															return null;
														}
														return prev;
													});
													e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.12)';
													e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)';
													e.currentTarget.style.borderStyle = 'dashed';
													e.currentTarget.style.borderWidth = '2px';
													e.currentTarget.style.boxShadow = 'none';
													e.currentTarget.style.height = '24px';
												}
											}}
											onDrop={(e) => {
												setDropTarget(null);
												e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.12)';
												e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)';
												e.currentTarget.style.borderStyle = 'dashed';
												e.currentTarget.style.borderWidth = '2px';
												e.currentTarget.style.boxShadow = 'none';
												e.currentTarget.style.height = '24px';
												handleDropOnItem(e, group.id, group.items.length);
											}}
										/>
									)}
								</div>
							))}
							{/* Show empty message only if no items AND no subGroups */}
							{group.items.length === 0 && (!group.subGroups || group.subGroups.length === 0) && (
								<div
									style={{
										padding: '2rem 1rem',
										textAlign: 'center',
										color: '#9ca3af',
										fontStyle: 'italic',
										border: '3px dashed rgba(34, 197, 94, 0.4)',
										borderRadius: '12px',
										backgroundColor: 'rgba(34, 197, 94, 0.05)',
										fontSize: '1rem',
										fontWeight: '500',
									}}
									onDragOver={(e) => {
										e.preventDefault();
										e.currentTarget.style.borderColor = '#22c55e';
										e.currentTarget.style.backgroundColor = '#dcfce7';
										e.currentTarget.style.borderStyle = 'solid';
										e.currentTarget.style.borderWidth = '2px';
										e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.3)';
										e.currentTarget.style.transform = 'scale(1.02)';
									}}
									onDragLeave={(e) => {
										e.currentTarget.style.borderColor = '#d1d5db';
										e.currentTarget.style.backgroundColor = 'transparent';
										e.currentTarget.style.borderStyle = 'dashed';
										e.currentTarget.style.borderWidth = '2px';
										e.currentTarget.style.boxShadow = 'none';
										e.currentTarget.style.transform = 'scale(1)';
									}}
									onDrop={(e) => {
										e.currentTarget.style.borderColor = '#d1d5db';
										e.currentTarget.style.backgroundColor = 'transparent';
										e.currentTarget.style.borderStyle = 'dashed';
										e.currentTarget.style.borderWidth = '2px';
										e.currentTarget.style.boxShadow = 'none';
										e.currentTarget.style.transform = 'scale(1)';
										handleDropOnGroup(e, group.id);
									}}
								>
									📥 Drop items here
								</div>
							)}
						</div>
					)}
				</div>
			))}
		</div>
	);
};

export default SimpleDragDropSidebar;
