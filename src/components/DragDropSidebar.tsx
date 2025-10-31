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

import React, { useState, useMemo, useEffect } from 'react';
import {
	FiHome,
	FiSettings,
	FiShield,
	FiUser,
	FiKey,
	FiZap,
	FiSmartphone,
	FiLock,
	FiRefreshCw,
	FiGitBranch,
	FiMove,
	FiCheckCircle,
	FiBook,
	FiBookOpen,
	FiSearch,
	FiTool,
	FiFileText,
	FiChevronDown,
	FiCpu,
	FiCode,
	FiServer,
	FiBarChart2,
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';

const ColoredIcon = styled.div<{ $color: string }>`
	color: ${props => props.$color};
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
	isOpen: boolean;
}

interface SimpleDragDropSidebarProps {
	dragMode?: boolean;
	searchQuery?: string;
}

const SimpleDragDropSidebar: React.FC<SimpleDragDropSidebarProps> = ({ dragMode = false, searchQuery = '' }) => {
	const location = useLocation();
	const navigate = useNavigate();
	const [draggedItem, setDraggedItem] = useState<{ type: 'group' | 'item'; id: string; groupId?: string } | null>(null);
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
				if (currentQuery === '?' + pathQuery) {
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
		if (currentBasePath === basePath + '/' || basePath === currentBasePath + '/') {
			if (!pathQuery && !currentQuery) {
				return true;
			}
		}
		
		return false;
	};

	const handleNavigation = (path: string, state?: any) => {
		navigate(path, { state });
		
		// Remove automatic scrolling behavior that causes menu to jump to top
		// Keep the menu position stable - no automatic scrolling
	};

	// Helper functions for persistence
	const createSerializableGroups = (groups: MenuGroup[]) => {
		return groups.map(group => ({
			id: group.id,
			label: group.label,
			isOpen: group.isOpen,
			items: group.items.map(item => ({
				id: item.id,
				path: item.path,
				label: item.label,
			}))
		}));
	};

const restoreMenuGroups = (serializedGroups: any[], defaultGroups: MenuGroup[]) => {
    const restored = serializedGroups.map(serializedGroup => {
			const defaultGroup = defaultGroups.find(g => g.id === serializedGroup.id);
			if (!defaultGroup) return null;

        return {
				...defaultGroup,
				isOpen: serializedGroup.isOpen,
				items: serializedGroup.items.map((serializedItem: any) => {
					// Find the item in any of the default groups (since items can move between groups)
					let defaultItem = null;
					for (const group of defaultGroups) {
						defaultItem = group.items.find(i => i.id === serializedItem.id);
						if (defaultItem) break;
					}
					return defaultItem || {
						id: serializedItem.id,
						path: serializedItem.path,
						label: serializedItem.label,
						icon: <ColoredIcon $color="#6366f1"><FiSettings /></ColoredIcon>, // fallback icon
					};
				}).filter(Boolean)
        };
    }).filter(Boolean) as MenuGroup[];

    // Ensure new default items (e.g., V7.2) appear even if not in saved layout
    const presentIds = new Set<string>();
    restored.forEach(g => g.items.forEach(i => presentIds.add(i.id)));
    defaultGroups.forEach(defGroup => {
        defGroup.items.forEach(defItem => {
            if (!presentIds.has(defItem.id)) {
                const target = restored.find(g => g.id === defGroup.id);
                if (target) {
                    target.items.push(defItem);
                    presentIds.add(defItem.id);
                }
            }
        });
    });

    return restored;
	};

	const saveMenuGroups = (groups: MenuGroup[]) => {
		try {
			const serializable = createSerializableGroups(groups);
			localStorage.setItem('simpleDragDropSidebar.menuOrder', JSON.stringify(serializable));
			console.log('💾 Menu layout saved to localStorage:', serializable);
			
			// Show visual confirmation
			v4ToastManager.showSuccess('Menu layout saved!', {}, { duration: 1500 });
		} catch (error) {
			console.warn('❌ Failed to save menu layout:', error);
			v4ToastManager.showError('Failed to save menu layout');
		}
	};

	// Handle automatic save with button feedback
	const saveWithFeedback = (groups: MenuGroup[]) => {
		saveMenuGroups(groups);
		setSaveButtonState('saved');
		
		// Reset to default after 1.5 seconds
		setTimeout(() => {
			setSaveButtonState('default');
		}, 1500);
	};

	// Handle manual save with button state management
	const handleManualSave = async () => {
		setSaveButtonState('saving');
		
		try {
			saveMenuGroups(menuGroups);
			setSaveButtonState('saved');
			
			// Reset to default after 2 seconds
			setTimeout(() => {
				setSaveButtonState('default');
			}, 2000);
		} catch (error) {
			setSaveButtonState('default');
			throw error;
		}
	};

	// Initialize menu structure
	const [menuGroups, setMenuGroups] = useState<MenuGroup[]>(() => {
		// Cleaned up menu structure - V7 flows only (or V6 if no V7 exists)
		const defaultGroups: MenuGroup[] = [
			{
				id: 'main',
				label: 'Main',
				icon: <ColoredIcon $color="#6366f1"><FiHome /></ColoredIcon>,
				isOpen: true,
				items: [
					{
						id: 'dashboard',
						path: '/dashboard',
						label: 'Dashboard',
						icon: <ColoredIcon $color="#6366f1"><FiHome /></ColoredIcon>,
						badge: <MigrationBadge title="Application Dashboard and Status"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'configuration',
						path: '/configuration',
						label: 'Setup & Configuration',
						icon: <ColoredIcon $color="#6366f1"><FiSettings /></ColoredIcon>,
						badge: <MigrationBadge title="Application Configuration & Credentials"><FiCheckCircle /></MigrationBadge>,
					},
				],
			},
			{
				id: 'oauth-flows',
				label: 'OAuth 2.0 Flows',
				icon: <ColoredIcon $color="#ef4444"><FiShield /></ColoredIcon>,
				isOpen: true,
				items: [
					{
						id: 'oauth-authorization-code-v7',
						path: '/flows/oauth-authorization-code-v7',
						label: 'Authorization Code (V7)',
						icon: <ColoredIcon $color="#22d3ee"><FiKey /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Unified OAuth/OIDC authorization code experience"><FiCheckCircle /></MigrationBadge>,
					},
				{
					id: 'oauth-authorization-code-v7-2',
					path: '/flows/oauth-authorization-code-v7-2',
					label: 'Authorization Code (V7.2)',
					icon: <ColoredIcon $color="#06b6d4"><FiKey /></ColoredIcon>,
					badge: <MigrationBadge title="V7.2: Adds optional redirectless (pi.flow) with Custom Login"><FiCheckCircle /></MigrationBadge>,
				},
					{
						id: 'oauth-implicit-v7',
						path: '/flows/implicit-v7',
						label: 'Implicit Flow (V7)',
						icon: <ColoredIcon $color="#7c3aed"><FiZap /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Unified OAuth/OIDC implementation with variant selector"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'oauth-device-authorization-v7',
						path: '/flows/device-authorization-v7',
						label: 'Device Authorization (V7)',
						icon: <ColoredIcon $color="#f59e0b"><FiSmartphone /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Unified OAuth/OIDC device authorization"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'client-credentials-v7',
						path: '/flows/client-credentials-v7',
						label: 'Client Credentials (V7)',
						icon: <ColoredIcon $color="#10b981"><FiKey /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Enhanced client credentials"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'oauth-ropc-v7',
						path: '/flows/oauth-ropc-v7',
						label: 'Resource Owner Password (V7)',
						icon: <ColoredIcon $color="#8b5cf6"><FiLock /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Resource Owner Password Credentials"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'token-exchange-v7',
						path: '/flows/token-exchange-v7',
						label: 'Token Exchange (V7)',
						icon: <ColoredIcon $color="#7c3aed"><FiRefreshCw /></ColoredIcon>,
						badge: <MigrationBadge title="V7: RFC 8693 Token Exchange"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'jwt-bearer-token-v7',
						path: '/flows/jwt-bearer-token-v7',
						label: 'JWT Bearer Token (V7)',
						icon: <ColoredIcon $color="#f59e0b"><FiKey /></ColoredIcon>,
						badge: <MigrationBadge title="V7: JWT Bearer Token Assertion"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'saml-bearer-assertion-v7',
						path: '/flows/saml-bearer-assertion-v7',
						label: 'SAML Bearer Token (V7)',
						icon: <ColoredIcon $color="#8b5cf6"><FiShield /></ColoredIcon>,
						badge: <MigrationBadge title="V7: SAML Bearer Token Assertion"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'saml-sp-dynamic-acs-v1',
						path: '/flows/saml-sp-dynamic-acs-v1',
						label: 'SAML SP Dynamic ACS (V1)',
						icon: <ColoredIcon $color="#f59e0b"><FiShield /></ColoredIcon>,
						badge: <MigrationBadge title="V1: SAML SP with Dynamic ACS URL support - PingOne new feature"><FiCheckCircle /></MigrationBadge>,
					},
				],
			},
			{
				id: 'oidc-flows',
				label: 'OpenID Connect',
				icon: <ColoredIcon $color="#10b981"><FiUser /></ColoredIcon>,
				isOpen: true,
				items: [
				{
					id: 'oidc-implicit-v7',
					path: '/flows/implicit-v7?variant=oidc',
					label: 'Implicit Flow (V7)',
					icon: <ColoredIcon $color="#7c3aed"><FiZap /></ColoredIcon>,
					badge: <MigrationBadge title="V7: Unified OAuth/OIDC implementation with variant selector"><FiCheckCircle /></MigrationBadge>,
				},
					{
						id: 'oidc-device-authorization-v7',
						path: '/flows/device-authorization-v7?variant=oidc',
						label: 'Device Authorization (V7 – OIDC)',
						icon: <ColoredIcon $color="#f59e0b"><FiSmartphone /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Unified OAuth/OIDC device authorization"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'oidc-hybrid-v7',
						path: '/flows/oidc-hybrid-v7',
						label: 'Hybrid Flow (V7)',
						icon: <ColoredIcon $color="#22c55e"><FiGitBranch /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Unified OAuth/OIDC hybrid flow implementation"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'oidc-overview',
						path: '/documentation/oidc-overview',
						label: 'OIDC Overview',
						icon: <ColoredIcon $color="#3b82f6"><FiSettings /></ColoredIcon>,
						badge: <MigrationBadge title="OpenID Connect Overview and Concepts"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'ciba-v7',
						path: '/flows/ciba-v7',
						label: 'OIDC CIBA Flow (V7)',
						icon: <ColoredIcon $color="#8b5cf6"><FiShield /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Enhanced CIBA implementation"><FiCheckCircle /></MigrationBadge>,
					},
				],
			},
			{
				id: 'pingone',
				label: 'PingOne',
				icon: <ColoredIcon $color="#f97316"><FiKey /></ColoredIcon>,
				isOpen: true,
				items: [
					{
						id: 'worker-token-v7',
						path: '/flows/worker-token-v7',
						label: 'Worker Token (V7)',
						icon: <ColoredIcon $color="#fb923c"><FiKey /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Enhanced worker token flow"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'pingone-par-v7',
						path: '/flows/pingone-par-v7',
						label: 'Pushed Authorization Request (V7)',
						icon: <ColoredIcon $color="#ea580c"><FiLock /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Enhanced Pushed Authorization Request with Authorization Details"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'redirectless-v7',
						path: '/flows/redirectless-v7-real',
						label: 'Redirectless Flow (V7)',
						icon: <ColoredIcon $color="#f59e0b"><FiSmartphone /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Enhanced Redirectless Authentication Flow"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'pingone-mfa-v7',
						path: '/flows/pingone-complete-mfa-v7',
						label: 'PingOne MFA (V7)',
						icon: <ColoredIcon $color="#16a34a"><FiShield /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Enhanced PingOne Multi-Factor Authentication"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'pingone-authentication',
						path: '/pingone-authentication',
						label: 'PingOne Authentication',
						icon: <ColoredIcon $color="#16a34a"><FiShield /></ColoredIcon>,
						badge: <MigrationBadge title="PingOne Authentication Flow"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'pingone-identity-metrics',
						path: '/pingone-identity-metrics',
						label: 'PingOne Identity Metrics',
						icon: <ColoredIcon $color="#10b981"><FiBarChart2 /></ColoredIcon>,
						badge: <MigrationBadge title="PingOne Total Identities metrics explorer"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'pingone-mock-features',
						path: '/pingone-mock-features',
						label: 'Mock & Educational Features',
						icon: <ColoredIcon $color="#f59e0b"><FiBookOpen /></ColoredIcon>,
						badge: <MigrationBadge title="Educational and Mock Features"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'pingone-webhook-viewer',
						path: '/pingone-webhook-viewer',
						label: 'Webhook Viewer',
						icon: <ColoredIcon $color="#06b6d4"><FiServer /></ColoredIcon>,
						badge: <MigrationBadge title="Real-time webhook event monitoring"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'organization-licensing',
						path: '/organization-licensing',
						label: 'Organization Licensing',
						icon: <ColoredIcon $color="#22c55e"><FiShield /></ColoredIcon>,
						badge: <MigrationBadge title="View organization licensing and usage information"><FiCheckCircle /></MigrationBadge>,
					},
				],
			},
			{
				id: 'tools-utilities',
				label: 'Tools & Utilities',
				icon: <ColoredIcon $color="#8b5cf6"><FiTool /></ColoredIcon>,
				isOpen: false,
				items: [
					{
						id: 'oidc-discovery',
						path: '/auto-discover',
						label: 'OIDC Discovery',
						icon: <ColoredIcon $color="#06b6d4"><FiSearch /></ColoredIcon>,
						badge: <MigrationBadge title="OIDC Discovery and Configuration"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'token-management',
						path: '/token-management',
						label: 'Token Management',
						icon: <ColoredIcon $color="#8b5cf6"><FiKey /></ColoredIcon>,
						badge: <MigrationBadge title="Token Analysis and Management"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'advanced-config',
						path: '/advanced-configuration',
						label: 'Advanced Configuration',
						icon: <ColoredIcon $color="#8b5cf6"><FiSettings /></ColoredIcon>,
						badge: <MigrationBadge title="Advanced Configuration Options"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'oauth-2-1',
						path: '/oauth-2-1',
						label: 'OAuth 2.1',
						icon: <ColoredIcon $color="#3b82f6"><FiShield /></ColoredIcon>,
						badge: <MigrationBadge title="OAuth 2.1 Security Features"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'oidc-session-management',
						path: '/oidc-session-management',
						label: 'OIDC Session Management',
						icon: <ColoredIcon $color="#10b981"><FiUser /></ColoredIcon>,
						badge: <MigrationBadge title="OIDC Session Management"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'jwks-troubleshooting',
						path: '/jwks-troubleshooting',
						label: 'JWKS Troubleshooting',
						icon: <ColoredIcon $color="#f59e0b"><FiTool /></ColoredIcon>,
						badge: <MigrationBadge title="JWKS Troubleshooting Guide"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'url-decoder',
						path: '/url-decoder',
						label: 'URL Decoder',
						icon: <ColoredIcon $color="#8b5cf6"><FiTool /></ColoredIcon>,
						badge: <MigrationBadge title="URL Decoder Utility"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'code-examples',
						path: '/code-examples',
						label: 'Code Examples',
						icon: <ColoredIcon $color="#3b82f6"><FiCode /></ColoredIcon>,
						badge: <MigrationBadge title="Code Examples and Samples"><FiCheckCircle /></MigrationBadge>,
					},
				],
			},
			{
				id: 'documentation',
				label: 'Documentation',
				icon: <ColoredIcon $color="#3b82f6"><FiFileText /></ColoredIcon>,
				isOpen: false,
				items: [
					{
						id: 'oidc-overview',
						path: '/documentation/oidc-overview',
						label: 'OIDC Overview',
						icon: <ColoredIcon $color="#3b82f6"><FiBook /></ColoredIcon>,
						badge: <MigrationBadge title="OIDC Overview and Guide"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'oidc-specs',
						path: '/docs/oidc-specs',
						label: 'OIDC Specifications',
						icon: <ColoredIcon $color="#3b82f6"><FiBookOpen /></ColoredIcon>,
						badge: <MigrationBadge title="OIDC Technical Specifications"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'oauth2-security-best-practices',
						path: '/docs/oauth2-security-best-practices',
						label: 'OAuth 2.0 Security Best Practices',
						icon: <ColoredIcon $color="#dc2626"><FiShield /></ColoredIcon>,
						badge: <MigrationBadge title="OAuth 2.0 Security Guidelines"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'ai-identity-architectures',
						path: '/ai-identity-architectures',
						label: 'AI Identity Architectures',
						icon: <ColoredIcon $color="#8b5cf6"><FiCpu /></ColoredIcon>,
						badge: <MigrationBadge title="AI Identity Architectures and Patterns"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'oidc-specs',
						path: '/docs/oidc-specs',
						label: 'OIDC Specifications',
						icon: <ColoredIcon $color="#3b82f6"><FiFileText /></ColoredIcon>,
						badge: <MigrationBadge title="OIDC Technical Specifications"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'oidc-for-ai',
						path: '/docs/oidc-for-ai',
						label: 'OIDC for AI',
						icon: <ColoredIcon $color="#8b5cf6"><FiCpu /></ColoredIcon>,
						badge: <MigrationBadge title="OIDC for AI Applications"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'ping-view-on-ai',
						path: '/docs/ping-view-on-ai',
						label: 'PingOne AI Perspective',
						icon: <ColoredIcon $color="#16a34a"><FiShield /></ColoredIcon>,
						badge: <MigrationBadge title="PingOne's View on AI Identity"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'oauth2-security-best-practices',
						path: '/docs/oauth2-security-best-practices',
						label: 'OAuth 2.0 Security Best Practices',
						icon: <ColoredIcon $color="#dc2626"><FiShield /></ColoredIcon>,
						badge: <MigrationBadge title="OAuth 2.0 Security Guidelines"><FiCheckCircle /></MigrationBadge>,
					},
				],
			},
		];

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

	// Persist menu layout whenever it changes
	useEffect(() => {
		try {
			const serializable = createSerializableGroups(menuGroups);
			localStorage.setItem('simpleDragDropSidebar.menuOrder', JSON.stringify(serializable));
		} catch (error) {
			console.warn('❌ Failed to persist menu layout:', error);
		}
	}, [menuGroups]);

	// Filter menu groups based on search query
	const filteredMenuGroups = useMemo(() => {
		if (!searchQuery.trim()) {
			return menuGroups;
		}

		const query = searchQuery.toLowerCase();
		return menuGroups
			.map(group => {
				const filteredItems = group.items.filter(item =>
					item.label.toLowerCase().includes(query) ||
					item.path.toLowerCase().includes(query)
				);

				const groupMatches = group.label.toLowerCase().includes(query);

				return {
					...group,
					items: groupMatches ? group.items : filteredItems,
					isOpen: groupMatches || filteredItems.length > 0
				};
			})
			.filter(group =>
				group.items.length > 0 ||
				group.label.toLowerCase().includes(query)
			);
	}, [menuGroups, searchQuery]);

	// Handle drag start
	const handleDragStart = (e: React.DragEvent, type: 'group' | 'item', id: string, groupId?: string) => {
		setDraggedItem(groupId ? { type, id, groupId } : { type, id });
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', JSON.stringify({ type, id, groupId }));
		
		// Make the dragged element slightly transparent
		const target = e.currentTarget as HTMLElement;
		target.style.opacity = '0.5';
	};

	// Handle drag end (for cleanup)
	const handleDragEnd = (e: React.DragEvent) => {
		// Restore opacity
		const target = e.currentTarget as HTMLElement;
		target.style.opacity = '1';
		
		// Clear draggedItem after a short delay to ensure drop handlers can access it
		setTimeout(() => {
			setDraggedItem(null);
		}, 100);
	};

	// Handle drag over
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};

	// Handle drop on specific item (for precise positioning)
	const handleDropOnItem = (e: React.DragEvent, targetGroupId: string, targetItemIndex: number) => {
		e.preventDefault();
		e.stopPropagation();
		
		if (!draggedItem) {
			return;
		}

		if (draggedItem.type === 'item') {
			const newGroups = [...menuGroups];
			const sourceGroupIndex = newGroups.findIndex(g => g.id === draggedItem.groupId);
			const targetGroupIndex = newGroups.findIndex(g => g.id === targetGroupId);
			
			if (sourceGroupIndex !== -1 && targetGroupIndex !== -1) {
				const sourceGroup = { ...newGroups[sourceGroupIndex] };
				const targetGroup = { ...newGroups[targetGroupIndex] };
				
				const sourceItemIndex = sourceGroup.items.findIndex(i => i.id === draggedItem.id);
				if (sourceItemIndex !== -1) {
					const [movedItem] = sourceGroup.items.splice(sourceItemIndex, 1);
					
					// Calculate the correct insertion index
					let insertIndex = targetItemIndex;
					
					// If moving within the same group and the source is before target, adjust index
					if (draggedItem.groupId === targetGroupId && sourceItemIndex < targetItemIndex) {
						insertIndex = targetItemIndex - 1;
					}
					
					targetGroup.items.splice(insertIndex, 0, movedItem);
					
					newGroups[sourceGroupIndex] = sourceGroup;
					newGroups[targetGroupIndex] = targetGroup;
					
					setMenuGroups(newGroups);
					saveWithFeedback(newGroups);
					v4ToastManager.showSuccess(`Moved "${movedItem.label}" to position ${insertIndex + 1} in ${targetGroup.label}`);
				}
			}
		}
	};

	// Handle drop on group (for dropping at the end)
	const handleDropOnGroup = (e: React.DragEvent, targetGroupId: string) => {
		e.preventDefault();
		
		if (!draggedItem) return;

		if (draggedItem.type === 'item' && draggedItem.groupId !== targetGroupId) {
			// Move item to end of target group
			const newGroups = [...menuGroups];
			const sourceGroupIndex = newGroups.findIndex(g => g.id === draggedItem.groupId);
			const targetGroupIndex = newGroups.findIndex(g => g.id === targetGroupId);
			
			if (sourceGroupIndex !== -1 && targetGroupIndex !== -1) {
				const sourceGroup = { ...newGroups[sourceGroupIndex] };
				const targetGroup = { ...newGroups[targetGroupIndex] };
				
				const itemIndex = sourceGroup.items.findIndex(i => i.id === draggedItem.id);
				if (itemIndex !== -1) {
					const [movedItem] = sourceGroup.items.splice(itemIndex, 1);
					targetGroup.items.push(movedItem);
					
					newGroups[sourceGroupIndex] = sourceGroup;
					newGroups[targetGroupIndex] = targetGroup;
					
					setMenuGroups(newGroups);
					saveWithFeedback(newGroups);
					v4ToastManager.showSuccess(`Moved "${movedItem.label}" to end of ${targetGroup.label}`);
				}
			}
		}
	};

	// Handle drop for reordering groups
	const handleDropForGroupReorder = (e: React.DragEvent, targetIndex: number) => {
		e.preventDefault();
		
		if (!draggedItem || draggedItem.type !== 'group') return;

		const sourceIndex = menuGroups.findIndex(g => g.id === draggedItem.id);
		if (sourceIndex !== -1 && sourceIndex !== targetIndex) {
			const newGroups = [...menuGroups];
			const [movedGroup] = newGroups.splice(sourceIndex, 1);
			newGroups.splice(targetIndex, 0, movedGroup);
			
			setMenuGroups(newGroups);
			saveWithFeedback(newGroups);
			v4ToastManager.showSuccess(`Reordered "${movedGroup.label}" section`);
		}
	};

	const toggleMenuGroup = (groupId: string) => {
		setMenuGroups(prevGroups => {
			const newGroups = prevGroups.map(group => 
				group.id === groupId 
					? { ...group, isOpen: !group.isOpen }
					: group
			);
			saveWithFeedback(newGroups);
			return newGroups;
		});
	};

	return (
		<div style={{ padding: dragMode ? '1rem' : '0' }}>
			{/* Search Results Indicator */}
			{searchQuery.trim() && (
				<div style={{
					padding: '0.5rem 1rem',
					background: '#f0f9ff',
					borderBottom: '1px solid #e0f2fe',
					fontSize: '0.875rem',
					color: '#0369a1'
				}}>
					{filteredMenuGroups.reduce((total, group) => total + group.items.length, 0)} results for "{searchQuery}"
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
				<div style={{ 
					marginBottom: '1rem', 
					padding: '1rem', 
					backgroundColor: '#dcfce7', 
					borderRadius: '0.5rem',
					border: '2px solid #22c55e',
					boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)'
				}}>
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
										saveButtonState === 'saved' ? '#22c55e' : 
										saveButtonState === 'saving' ? '#f59e0b' : 
										'#f59e0b', // Default yellow
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
									saveButtonState === 'saved' ? 'Layout saved successfully!' :
									saveButtonState === 'saving' ? 'Saving layout...' :
									'Manually save current layout'
								}
							>
								{saveButtonState === 'saved' ? '✅ Saved!' : 
								 saveButtonState === 'saving' ? '⏳ Saving...' : 
								 '💾 Save Layout'}
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
						onDragStart={dragMode ? (e) => {
							handleDragStart(e, 'group', group.id);
							e.currentTarget.style.cursor = 'grabbing';
						} : undefined}
						onDragEnd={dragMode ? (e) => {
							handleDragEnd(e);
							e.currentTarget.style.cursor = 'grab';
						} : undefined}
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
							border: dragMode ? '2px dashed rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.2)',
							boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
							transition: 'all 0.2s ease',
							userSelect: 'none',
							WebkitUserSelect: 'none',
							MozUserSelect: 'none',
							msUserSelect: 'none',
						}}
						onMouseEnter={(e) => {
							if (!dragMode) {
								e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)';
								e.currentTarget.style.transform = 'translateY(-1px)';
								e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
							}
						}}
						onMouseLeave={(e) => {
							if (!dragMode) {
								e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
								e.currentTarget.style.transform = 'translateY(0px)';
								e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
							}
						}}
					>
						{dragMode && <FiMove size={16} style={{ color: 'white' }} />}
						<div style={{ color: 'white' }}>{group.icon}</div>
						<span style={{ fontWeight: '600', color: 'white', flex: 1, userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
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
									color: 'white'
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
							{/* Drop zone at the very top of the group */}
							{dragMode && group.items.length > 0 && (
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
										e.currentTarget.style.backgroundColor = '#dcfce7';
										e.currentTarget.style.borderColor = '#22c55e';
										e.currentTarget.style.borderStyle = 'solid';
										e.currentTarget.style.borderWidth = '2px';
										e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.3)';
									}}
									onDragLeave={(e) => {
										setDropTarget(null);
										e.currentTarget.style.backgroundColor = 'transparent';
										e.currentTarget.style.borderColor = 'transparent';
										e.currentTarget.style.borderStyle = 'dashed';
										e.currentTarget.style.borderWidth = '2px';
										e.currentTarget.style.boxShadow = 'none';
									}}
									onDrop={(e) => {
										setDropTarget(null);
										e.currentTarget.style.backgroundColor = 'transparent';
										e.currentTarget.style.borderColor = 'transparent';
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
									{/* Drop zone before item */}
									{dragMode && itemIndex > 0 && (
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
												e.currentTarget.style.backgroundColor = '#dcfce7';
												e.currentTarget.style.borderColor = '#22c55e';
												e.currentTarget.style.borderStyle = 'solid';
												e.currentTarget.style.borderWidth = '2px';
												e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.3)';
												e.currentTarget.style.height = '32px';
											}}
											onDragLeave={(e) => {
												setDropTarget(null);
												e.currentTarget.style.backgroundColor = 'transparent';
												e.currentTarget.style.borderColor = 'transparent';
												e.currentTarget.style.borderStyle = 'dashed';
												e.currentTarget.style.borderWidth = '2px';
												e.currentTarget.style.boxShadow = 'none';
												e.currentTarget.style.height = '24px';
											}}
											onDrop={(e) => {
												setDropTarget(null);
												e.currentTarget.style.backgroundColor = 'transparent';
												e.currentTarget.style.borderColor = 'transparent';
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
										onDragStart={dragMode ? (e) => {
											handleDragStart(e, 'item', item.id, group.id);
											e.currentTarget.style.cursor = 'grabbing';
										} : undefined}
										onDragEnd={dragMode ? (e) => {
											handleDragEnd(e);
											e.currentTarget.style.cursor = 'grab';
										} : undefined}
										className={item.id.includes('implicit') ? 'implicit-flow-menu-item' : ''}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											padding: '0.5rem 0.75rem',
											backgroundColor: isActive(item.path) ? '#fef3c7' : 'white',
											color: isActive(item.path) ? '#d97706' : '#64748b',
											borderRadius: '0.375rem',
											border: isActive(item.path) ? '3px solid #f59e0b' : '1px solid #e2e8f0',
											fontWeight: isActive(item.path) ? '700' : '400',
											boxShadow: isActive(item.path) ? '0 4px 8px rgba(245, 158, 11, 0.3)' : 'none',
											transform: isActive(item.path) ? 'scale(1.02)' : 'scale(1)',
											marginBottom: '0.25rem',
											cursor: dragMode ? 'grab' : 'pointer',
											userSelect: 'none',
											WebkitUserSelect: 'none',
											MozUserSelect: 'none',
											msUserSelect: 'none',
										}}
									>
										{dragMode && <FiMove size={12} />}
										<div
											onClick={!dragMode ? (e) => {
												e.stopPropagation();
												// Handle context-aware navigation for OIDC section
												if (group.id === 'oidc-flows') {
													// Pass OIDC context for unified V7 flows
													handleNavigation(item.path, { fromSection: 'oidc', protocol: 'oidc' });
												} else {
													handleNavigation(item.path);
												}
											} : undefined}
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
											<span style={{ flex: 1, userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>{item.label}</span>
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
												e.currentTarget.style.backgroundColor = '#dcfce7';
												e.currentTarget.style.borderColor = '#22c55e';
												e.currentTarget.style.borderStyle = 'solid';
												e.currentTarget.style.borderWidth = '2px';
												e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.3)';
												e.currentTarget.style.height = '32px';
											}}
											onDragLeave={(e) => {
												setDropTarget(null);
												e.currentTarget.style.backgroundColor = 'transparent';
												e.currentTarget.style.borderColor = 'transparent';
												e.currentTarget.style.borderStyle = 'dashed';
												e.currentTarget.style.borderWidth = '2px';
												e.currentTarget.style.boxShadow = 'none';
												e.currentTarget.style.height = '24px';
											}}
											onDrop={(e) => {
												setDropTarget(null);
												e.currentTarget.style.backgroundColor = 'transparent';
												e.currentTarget.style.borderColor = 'transparent';
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
							{group.items.length === 0 && (
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