import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
	FiBook,
	FiBookOpen,
	FiClock,
	FiCpu,
	FiDatabase,
	FiExternalLink,
	FiEye,
	FiFileText,
	FiKey,
	FiLayers,
	FiLock,
	FiPackage,
	FiRefreshCw,
	FiSearch,
	FiSettings,
	FiShield,
	FiSmartphone,
	FiUsers,
	FiX,
	FiZap,
	FiCheckCircle,
	FiCode,
	FiMove,
	FiBarChart2,
} from 'react-icons/fi';
import { Menu, MenuItem, Sidebar as ProSidebar, SubMenu } from 'react-pro-sidebar';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';
import DragDropSidebar from './DragDropSidebar';
import SidebarSearch from './SidebarSearch';

// Colored icon wrapper component for sidebar menu
const ColoredIcon = styled.span<{ $color?: string }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${props => props.$color || 'currentColor'};
	
	svg {
		color: ${props => props.$color || 'currentColor'} !important;
	}
`;

// Migration status badge for flows that have been migrated
const MigrationBadge = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-left: auto;
	padding-left: 0.5rem;
	color: #10b981;
	font-size: 0.875rem;
	
	svg {
		width: 16px;
		height: 16px;
	}
`;

// Wrapper for menu item content with badge
const MenuItemContent = styled.span`
	display: flex;
	align-items: center;
	width: 100%;
	gap: 0.5rem;
`;

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

const SidebarContainer = styled.div<{ $isOpen: boolean; $width: number }>`
	position: fixed;
	top: 0;
	left: 0;
	height: 100vh;
	z-index: 1000;
	width: ${({ $width }) => $width}px;
	transform: ${({ $isOpen }) => ($isOpen ? 'translateX(0)' : 'translateX(-100%)')};
	transition: transform 0.3s ease;
	background: #ffffff;
	overflow: hidden;

	@media (min-width: 768px) {
		position: fixed;
		transform: none;
	}

	.ps-sidebar-container {
		background: #ffffff;
		height: 100vh;
		border-right: 1px solid #e5e7eb;
		overflow-y: auto;
		scroll-behavior: smooth;
		padding-bottom: 2rem; /* Add padding at bottom for better UX */
		position: relative;
		z-index: 1;
	}

	.ps-menu-button {
		padding: 10px 16px;
		transition: all 0.2s;
	}


		border-bottom: 1px solid #e5e7eb;
		font-size: 0.875rem;

		&:hover {
			background: #f3f4f6;
		}
	}

	/* Dark green background for V6 flows - maximum specificity - Updated Oct 10 2025 10:30 AM - FORCE REFRESH */
	.ps-sidebar .ps-menu-button.v6-flow,
	.ps-sidebar .ps-menu-button.v6-flow[style],
	.ps-sidebar .ps-menu-button.v6-flow[style*="background"] {
		background: #047857 !important;
		border-left: 4px solid #059669 !important;
		color: #ffffff !important;
		position: relative !important;
		font-weight: 600 !important;
	}

	.ps-sidebar .ps-menu-button.v6-flow:hover,
	.ps-sidebar .ps-menu-button.v6-flow:hover[style] {
		background: #dcfce7 !important;
		color: #15803d !important;
		transform: translateX(2px) !important;
		box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4) !important;
	}

	.ps-sidebar .ps-menu-button.v6-flow.ps-active,
	.ps-sidebar .ps-menu-button.v6-flow.ps-active[style],
	.ps-sidebar .ps-menu-button.v6-flow.ps-active[style*="background"],
	.ps-sidebar .ps-menu-button.ps-active.v6-flow,
	.ps-sidebar .ps-menu-button.ps-active.v6-flow[style],
	.ps-sidebar .ps-menu-button.ps-active.v6-flow[style*="background"] {
		background: #064e3b !important;
		color: #ffffff !important;
		border-right: 4px solid #10b981 !important;
		border-left: 4px solid #10b981 !important;
		font-weight: 700 !important;
		transform: translateX(4px) !important;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5) !important;
	}

	/* Override any inline styles for V6 flows */
	.ps-sidebar .ps-menu-button.v6-flow[style*="background"] {
		background: #047857 !important;
	}

	.ps-sidebar .ps-menu-button.v6-flow.ps-active[style*="background"] {
		background: #064e3b !important;
	}

	.ps-menu-button.ps-active {
		background: #fef2f2 !important;
		color: #dc2626 !important;
		border-right: 3px solid #dc2626 !important;
		font-weight: 700 !important;
		transform: translateX(4px) !important;
		box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3) !important;
		position: relative !important;
	}

	.ps-menu-button:hover {
		transform: translateX(2px) !important;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
	}

	/* ULTRA-HIGH SPECIFICITY V6 FLOW OVERRIDES - MUST BE AFTER GENERAL RULES - Updated Oct 10 2025 10:30 AM - FORCE REFRESH */
	.ps-sidebar .ps-menu-button.v6-flow.ps-active,
	.ps-sidebar .ps-menu-button.v6-flow.ps-active[style],
	.ps-sidebar .ps-menu-button.v6-flow.ps-active[style*="background"],
	.ps-sidebar .ps-menu-button.ps-active.v6-flow,
	.ps-sidebar .ps-menu-button.ps-active.v6-flow[style],
	.ps-sidebar .ps-menu-button.ps-active.v6-flow[style*="background"],
	.ps-sidebar .ps-menu-button.v6-flow.ps-active:hover,
	.ps-sidebar .ps-menu-button.v6-flow.ps-active:hover[style] {
		background: #064e3b !important;
		color: #ffffff !important;
		border-right: 4px solid #10b981 !important;
		border-left: 4px solid #10b981 !important;
		font-weight: 700 !important;
		transform: translateX(4px) !important;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5) !important;
		position: relative !important;
	}

	/* NUCLEAR OPTION - HIGHEST SPECIFICITY POSSIBLE - Updated Oct 10 2025 10:30 AM */
	body .ps-sidebar .ps-menu-button.v6-flow,
	body .ps-sidebar .ps-menu-button.v6-flow[style],
	body .ps-sidebar .ps-menu-button.v6-flow[style*="background"] {
		background: #047857 !important;
		border-left: 4px solid #059669 !important;
		color: #ffffff !important;
		position: relative !important;
		font-weight: 600 !important;
	}

	body .ps-sidebar .ps-menu-button.v6-flow:hover,
	body .ps-sidebar .ps-menu-button.v6-flow:hover[style] {
		background: #dcfce7 !important;
		color: #15803d !important;
		transform: translateX(2px) !important;
		box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4) !important;
	}

	body .ps-sidebar .ps-menu-button.v6-flow.ps-active,
	body .ps-sidebar .ps-menu-button.v6-flow.ps-active[style],
	body .ps-sidebar .ps-menu-button.ps-active.v6-flow,
	body .ps-sidebar .ps-menu-button.ps-active.v6-flow[style] {
		background: #064e3b !important;
		color: #ffffff !important;
		border-right: 4px solid #10b981 !important;
		border-left: 4px solid #10b981 !important;
		font-weight: 700 !important;
		transform: translateX(4px) !important;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5) !important;
		position: relative !important;
	}

	.ps-submenu-content {
		background: #f9fafb !important;
		border-left: 2px solid #e5e7eb;
		margin-left: 10px;
	}

	.ps-open > .ps-submenu-content {
		background: #f3f4f6 !important;
	}

	/* Style submenu headers with light blue background */
	.ps-submenu-root > .ps-menu-button {
		background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
		color: #1e40af;
		font-weight: 600;
		border-bottom: 1px solid #93c5fd;

		&:hover {
			background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%);
		}

		svg {
			color: #1e40af !important;
		}
	}

	/* Chevron icon styling - dark blue arrows */
	.ps-submenu-expand-icon {
		color: #1e40af !important;
		transition: transform 0.2s ease;
	}

	.ps-open > .ps-menu-button .ps-submenu-expand-icon {
		transform: rotate(180deg);
	}
`;

const CloseButton = styled.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	background: none;
	border: none;
	cursor: pointer;
	color: #6b7280;
	padding: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 0.375rem;
	transition: all 0.2s;

	&:hover {
		background: #f3f4f6;
		color: #111827;
	}

	@media (min-width: 768px) {
		display: none;
	}
`;

const SidebarHeader = styled.div`
	padding: 1.25rem 1rem;
	border-bottom: 1px solid #e5e7eb;
	font-size: 1.125rem;
	font-weight: 600;
	color: #111827;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const DragHandle = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0.25rem;
	margin-right: 0.5rem;
	cursor: grab;
	color: #9ca3af;
	transition: color 0.2s;
	
	&:hover {
		color: #4b5563;
	}
	
	&:active {
		cursor: grabbing;
	}
`;

const DragModeToggle = styled.button<{ $isActive?: boolean }>`
	border: 1px solid #e5e7eb;
	border-radius: 0.375rem;
	padding: 0.375rem 0.75rem;
	font-size: 0.75rem;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	gap: 0.375rem;
	
	/* Dynamic styling based on active state */
	background: ${props => props.$isActive ? '#22c55e' : '#6b7280'};
	color: ${props => props.$isActive ? 'white' : 'white'};
	border-color: ${props => props.$isActive ? '#16a34a' : '#4b5563'};
	
	&:hover {
		background: ${props => props.$isActive ? '#16a34a' : '#4b5563'};
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
`;

const ResizeHandle = styled.div`
	position: absolute;
	top: 0;
	right: 0;
	width: 4px;
	height: 100%;
	background: transparent;
	cursor: col-resize;
	z-index: 1001;
	transition: background 0.2s;

	&:hover {
		background: #3b82f6;
	}

	&:active {
		background: #2563eb;
	}
`;

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
	const location = useLocation();
	const navigate = useNavigate();
	const [sidebarWidth, setSidebarWidth] = useState(450); // Increased to fit widest menu items with mock badges
	const isResizing = useRef(false);
	
	// Search functionality
	const [searchQuery, setSearchQuery] = useState('');
	
	// Force re-render timestamp for CSS updates
	const renderTimestamp = Date.now();
	
	// Helper function to get V6 flow styles
	const getV6FlowStyles = (isActive: boolean) => ({
		background: '#dcfce7', // Light green for all V6 flows
		color: '#166534', // Dark green text
		borderLeft: '3px solid #22c55e',
		borderRight: isActive ? '3px solid #22c55e' : undefined, // Green border for active
		fontWeight: isActive ? '700' : '600',
		transition: 'all 0.2s ease',
		cursor: 'pointer'
	});

	// Helper function to get V6 flow hover styles
	const getV6FlowHoverStyles = () => ({
		background: '#bbf7d0', // Light green hover
		color: '#15803d', // Dark green text
		transform: 'translateX(2px)',
		boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)' // Green shadow
	});

	// Helper function to get V7 flow styles
	const getV7FlowStyles = (isActive: boolean) => ({
		background: '#dcfce7', // Light green for all V7 flows
		color: '#166534', // Dark green text
		borderLeft: '3px solid #22c55e',
		borderRight: isActive ? '3px solid #22c55e' : undefined, // Green border for active
		fontWeight: isActive ? '700' : '600',
		transition: 'all 0.2s ease',
		cursor: 'pointer'
	});

	// Helper function to get V7 flow hover styles
	const getV7FlowHoverStyles = () => ({
		background: '#bbf7d0', // Light green hover
		color: '#15803d', // Dark green text
		transform: 'translateX(2px)',
		boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)' // Green shadow
	});

	// Helper function to create V6 menu item props
	const createV6MenuItemProps = (path: string, additionalPaths: string[] = []) => {
		const isActiveState = isActive(path) || additionalPaths.some(p => isActive(p));
		return {
			className: 'v6-flow',
			style: getV6FlowStyles(isActiveState)
		};
	};

	// Load persisted menu state from localStorage
	const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
		try {
			const saved = localStorage.getItem('nav.openSections');
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.warn('Failed to load navigation state from localStorage:', error);
		}
		// Default state - only Core Overview and OAuth 2.0 Flows open by default
		return {
			'Core Overview': true,
			'OAuth 2.0 Flows': true,
			'OpenID Connect': true,
			PingOne: false,
			'Mock & Demo Flows': false,
			'Artificial Intelligence': false,
			'Security & Management': false,
			'Tools & Utilities': false,
			Documentation: false,
			'Developers': false,
		};
	});

	const isActive = (path: string) => location.pathname === path;

	// Get friendly flow name from path for toast notification
	const getFlowName = (path: string): string | undefined => {
		const flowNames: Record<string, string> = {
			'/dashboard': 'Dashboard',
			'/configuration': 'Configuration',
			'/flows/oauth-authorization-code-v6': 'OAuth Authorization Code',
			'/flows/oauth-authorization-code-v7': 'Authorization Code V7',
			'/flows/oauth2-compliant-authorization-code': 'RFC 6749 Compliant OAuth 2.0',
			'/flows/oidc-compliant-authorization-code': 'OIDC Core 1.0 Compliant',
			'/flows/oauth-implicit-v6': 'OAuth Implicit Flow',
			'/flows/oidc-authorization-code-v6': 'OIDC Authorization Code',
			'/flows/oidc-implicit-v6': 'OIDC Implicit Flow',
			'/flows/oidc-hybrid-v6': 'OIDC Hybrid Flow',
			'/flows/oidc-hybrid-v7': 'Hybrid Flow V7',
			'/flows/implicit-v7': 'Implicit Flow V7',
			'/flows/token-exchange-v7': 'Token Exchange V7',
			'/flows/device-authorization-v7': 'Device Authorization V7',
			'/documentation/oidc-overview': 'OIDC Overview',
			'/auto-discover': 'OIDC Discovery',
			'/flows/ciba-v7': 'OIDC CIBA Flow V7',
			'/flows/ciba-v6': 'OIDC CIBA Flow V6',
			'/flows/client-credentials-v6': 'Client Credentials',
			'/flows/client-credentials-v7': 'OAuth Client Credentials (V7)',
			'/flows/oauth-ropc-v7': 'OAuth Resource Owner Password (V7)',
			'/flows/device-authorization-v6': 'Device Authorization',
			'/flows/oidc-device-authorization-v6': 'OIDC Device Authorization',
			'/flows/worker-token-v6': 'Worker Token (V6)',
			'/flows/worker-token-v7': 'Worker Token (V7)',
			'/flows/jwt-bearer-token-v6': 'JWT Bearer Token',
			'/flows/jwt-bearer-token-v7': 'JWT Bearer Token V7',
			'/flows/saml-bearer-assertion-v7': 'SAML Bearer Assertion V7',
			'/flows/advanced-oauth-params-demo': 'Advanced OAuth Parameters Demo',
			'/flows/pingone-par-v6': 'PingOne PAR',
			'/flows/redirectless-v6-real': 'Redirectless Flow V6',
			'/flows/pingone-mfa-v6': 'PingOne MFA V6',
			'/flows/rar-v6': 'Rich Authorization Request',
			'/flows/rar-v7': 'RAR Flow V7',
			'/flows/resource-owner-password-v6': 'Resource Owner Password',
			'/flows/pingone-complete-mfa-v7': 'PingOne Complete MFA Flow V7',
			'/flows/pingone-mfa-v7': 'PingOne MFA V7',
			'/pingone-authentication': 'PingOne Authentication',
			'/pingone-mock-features': 'PingOne Mock Features',
			'/pingone-identity-metrics': 'PingOne Identity Metrics',
		};
		return flowNames[path];
	};

	const handleNavigation = (path: string, state?: any) => {
		console.log('Navigating to:', path, 'with state:', state);
		
		// Don't show toast if navigating to same page
		if (location.pathname !== path) {
			const flowName = getFlowName(path);
			console.log('Flow name:', flowName);
			if (!flowName && path.startsWith('/flows/')) {
				v4ToastManager.showError('Unable to locate that flow. Please verify the menu configuration.');
				return;
			}
			if (flowName) {
				// Show brief toast notification using showSuccess (no showInfo method exists)
				v4ToastManager.showSuccess(`Switched to ${flowName}`, {}, { duration: 1500 });
			}
		}
		
		// Navigate immediately without scrolling the menu
		navigate(path, { state });
		// Close sidebar after navigation
		setTimeout(() => {
			onClose();
		}, 150);
	};

	// Handle search
	const handleSearch = useCallback((query: string) => {
		setSearchQuery(query);
		// The DragDropSidebar will handle the actual search filtering
	}, []);


	const handleMouseDown = (e: React.MouseEvent) => {
		isResizing.current = true;
		e.preventDefault();
	};

	// Toggle menu section and persist to localStorage
	const toggleMenu = (menuLabel: string) => {
		setOpenMenus((prev: Record<string, boolean>) => {
			const newState = {
				...prev,
				[menuLabel]: !prev[menuLabel],
			};

			try {
				localStorage.setItem('nav.openSections', JSON.stringify(newState));
			} catch (error) {
				console.warn('Failed to save navigation state to localStorage:', error);
			}

			return newState;
		});
	};
	
	// Define menu item structure for drag and drop
	interface MenuItem {
		id: string;
		path: string;
		label: string;
		icon: React.ReactNode;
		className?: string;
		badge?: React.ReactNode;
	}

	interface MenuGroup {
		id: string;
		label: string;
		icon: React.ReactNode;
		items: MenuItem[];
		isOpen: boolean;
	}

	// Initialize menu structure with drag and drop support
	const [menuGroups, setMenuGroups] = useState<MenuGroup[]>(() => {
		const savedOrder = localStorage.getItem('sidebar.menuOrder');
		if (savedOrder) {
			try {
				return JSON.parse(savedOrder);
			} catch (error) {
				console.warn('Failed to parse saved menu order:', error);
			}
		}

		// Default menu structure
 		return [
			{
				id: 'main',
				label: 'OAuth 2.0 Flows',
				icon: <ColoredIcon $color="#ef4444"><FiShield /></ColoredIcon>,
				isOpen: openMenus['OAuth 2.0 Flows'] || false,
				items: [
					{
						id: 'oauth-authorization-code-v7',
						path: '/flows/oauth-authorization-code-v7',
						label: 'Authorization Code (V7)',
						icon: <ColoredIcon $color="#22d3ee"><FiKey /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Unified OAuth/OIDC authorization code experience"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'implicit-v7',
						path: '/flows/implicit-v7',
						label: 'Implicit Flow (V7)',
						icon: <ColoredIcon $color="#7c3aed"><FiZap /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Unified OAuth/OIDC implementation with variant selector"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'device-authorization-v7',
						path: '/flows/device-authorization-v7',
						label: 'Device Authorization (V7)',
						icon: <ColoredIcon $color="#f59e0b"><FiSmartphone /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Unified OAuth/OIDC device authorization for TVs, IoT devices, and CLI tools"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'client-credentials-v7',
						path: '/flows/client-credentials-v7',
						label: 'OAuth Client Credentials (V7)',
						icon: <ColoredIcon $color="#10b981"><FiKey /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Enhanced client credentials with comprehensive auth methods"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'oauth-ropc-v7',
						path: '/flows/oauth-ropc-v7',
						label: 'OAuth Resource Owner Password (V7)',
						icon: <ColoredIcon $color="#8b5cf6"><FiLock /></ColoredIcon>,
						badge: <MigrationBadge title="V7: Resource Owner Password Credentials with enhanced security"><FiCheckCircle /></MigrationBadge>,
					},
					{
						id: 'token-exchange-v7',
						path: '/flows/token-exchange-v7',
						label: 'Token Exchange (V7)',
						icon: <ColoredIcon $color="#7c3aed"><FiRefreshCw /></ColoredIcon>,
						badge: <MigrationBadge title="V7: RFC 8693 Token Exchange for A2A scenarios"><FiCheckCircle /></MigrationBadge>,
					},
				],
			},
			{
				id: 'pingone',
				label: 'PingOne',
				icon: <ColoredIcon $color="#0ea5e9"><FiShield /></ColoredIcon>,
				isOpen: openMenus['PingOne'] || false,
				items: [
					{
						id: 'pingone-authentication',
						path: '/pingone-authentication',
						label: 'PingOne Authentication',
						icon: <ColoredIcon $color="#2563eb"><FiKey /></ColoredIcon>,
					},
					{
						id: 'pingone-identity-metrics',
						path: '/pingone-identity-metrics',
						label: 'PingOne Identity Metrics',
						icon: <ColoredIcon $color="#10b981"><FiBarChart2 /></ColoredIcon>,
					},
					{
						id: 'pingone-mock-features',
						path: '/pingone-mock-features',
						label: 'PingOne Mock Features',
						icon: <ColoredIcon $color="#7c3aed"><FiCpu /></ColoredIcon>,
					},
				],
			},
		];
	});

	// Handle drag and drop
	const handleDragEnd = (result: DropResult) => {
		const { destination, source, type } = result;

		// If dropped outside a valid drop zone
		if (!destination) {
			return;
		}

		// If dropped in the same position
		if (destination.droppableId === source.droppableId && destination.index === source.index) {
			return;
		}

		if (type === 'group') {
			// Reordering groups
			const newGroups = Array.from(menuGroups);
			const [reorderedGroup] = newGroups.splice(source.index, 1);
			newGroups.splice(destination.index, 0, reorderedGroup);

			setMenuGroups(newGroups);
			localStorage.setItem('sidebar.menuOrder', JSON.stringify(newGroups));
			
			v4ToastManager.showSuccess('Menu section reordered successfully!');
		} else {
			// Moving items between groups
			const sourceGroupIndex = menuGroups.findIndex(group => group.id === source.droppableId);
			const destGroupIndex = menuGroups.findIndex(group => group.id === destination.droppableId);

			if (sourceGroupIndex === -1 || destGroupIndex === -1) {
				return;
			}

			const newGroups = Array.from(menuGroups);
			const sourceGroup = { ...newGroups[sourceGroupIndex] };
			const destGroup = { ...newGroups[destGroupIndex] };

			// Remove item from source group
			const [movedItem] = sourceGroup.items.splice(source.index, 1);

			// Add item to destination group
			destGroup.items.splice(destination.index, 0, movedItem);

			// Update the groups
			newGroups[sourceGroupIndex] = sourceGroup;
			newGroups[destGroupIndex] = destGroup;

			setMenuGroups(newGroups);
			localStorage.setItem('sidebar.menuOrder', JSON.stringify(newGroups));

			v4ToastManager.showSuccess(
				`Moved "${movedItem.label}" to ${destGroup.label}`,
				{},
				{ duration: 3000 }
			);
		}
	};

	// Update group open state
	const toggleMenuGroup = (groupId: string) => {
		setMenuGroups(prevGroups => {
			const newGroups = prevGroups.map(group => 
				group.id === groupId 
					? { ...group, isOpen: !group.isOpen }
					: group
			);

			// Update the openMenus state for persistence
			const newOpenState = newGroups.reduce((acc, group) => {
				acc[group.label] = group.isOpen;
				return acc;
			}, {} as Record<string, boolean>);

			setOpenMenus(newOpenState);
			localStorage.setItem('nav.openSections', JSON.stringify(newOpenState));

			return newGroups;
		});
	};

	// Drag and drop mode toggle
	const [isDragDropMode, setIsDragDropMode] = useState(() => {
		const saved = localStorage.getItem('sidebar.dragDropMode');
		return saved === 'true';
	});

	// Debug log for drag mode state
	React.useEffect(() => {
		console.log('🎯 Sidebar isDragDropMode state:', isDragDropMode);
		console.log('🔍 localStorage value:', localStorage.getItem('sidebar.dragDropMode'));
	}, [isDragDropMode]);

	// Function to reset drag mode (for debugging)
	const resetDragMode = () => {
		console.log('🔄 Resetting drag mode');
		localStorage.removeItem('sidebar.dragDropMode');
		setIsDragDropMode(false);
	};

	const toggleDragDropMode = () => {
		const newMode = !isDragDropMode;
		console.log('🔄 Toggling drag mode from', isDragDropMode, 'to', newMode);
		setIsDragDropMode(newMode);
		localStorage.setItem('sidebar.dragDropMode', newMode.toString());
		
		if (newMode) {
			v4ToastManager.showSuccess(
				'Drag & Drop Mode Enabled',
				{
					description: 'You can now drag menu items between sections and reorder sections!'
				},
				{ duration: 3000 }
			);
		} else {
			v4ToastManager.showSuccess(
				'Standard View Mode',
				{
					description: 'Your customizations are preserved but drag handles are hidden.'
				},
				{ duration: 3000 }
			);
		}
	};

	// Show drag instructions
	const showDragInstructions = () => {
		v4ToastManager.showSuccess(
			'Drag & Drop Menu Items',
			{
				description: 'Drag menu items between sections or reorder sections by dragging the section headers. Your layout will be saved automatically!'
			},
			{ duration: 4000 }
		);
	};

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isResizing.current) return;

			const newWidth = e.clientX;
			if (newWidth >= 300 && newWidth <= 600) {
				setSidebarWidth(newWidth);
			}
		};

		const handleMouseUp = () => {
			isResizing.current = false;
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, []);

	return (
		<SidebarContainer $isOpen={isOpen} $width={sidebarWidth}>
			<ResizeHandle onMouseDown={handleMouseDown} />
			<ProSidebar key={`sidebar-${renderTimestamp}`} width={`${sidebarWidth}px`}>
				<SidebarHeader>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						PingOne OAuth Playground
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<DragModeToggle 
							onClick={toggleDragDropMode}
							title={isDragDropMode ? "Switch to standard menu" : "Enable drag & drop mode"}
							$isActive={isDragDropMode}
						>
							<FiMove size={14} />
							{isDragDropMode ? 'Drag Mode' : 'Enable Drag'}
						</DragModeToggle>
						<CloseButton onClick={onClose}>
							<FiX size={20} />
						</CloseButton>
					</div>
				</SidebarHeader>

				<SidebarSearch 
					onSearch={handleSearch}
					placeholder="Search flows and pages..."
				/>

				<DragDropSidebar 
					dragMode={isDragDropMode} 
					searchQuery={searchQuery}
				/>
			</ProSidebar>
		</SidebarContainer>
	);
};

export default Sidebar;