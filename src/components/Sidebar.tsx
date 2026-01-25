import React, { useCallback, useEffect, useRef, useState } from 'react';
// import { DropResult } from 'react-beautiful-dnd';
import {
	FiAlertTriangle,
	FiBarChart2,
	FiBook,
	FiCheckCircle,
	FiCode,
	FiCpu,
	FiDatabase,
	FiEye,
	FiHome,
	FiKey,
	FiLayers,
	FiLock,
	FiLogOut,
	FiMove,
	FiPackage,
	FiRefreshCw,
	FiSettings,
	FiShield,
	FiSmartphone,
	FiTrash2,
	FiUser,
	FiUsers,
	FiX,
	FiZap,
} from 'react-icons/fi';
import { Sidebar as ProSidebar } from 'react-pro-sidebar';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';
import DragDropSidebar from './DragDropSidebar';
import SidebarSearch from './SidebarSearch';

// Colored icon wrapper component for sidebar menu
const ColoredIcon = styled.span<{ $color?: string }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${(props) => props.$color || 'currentColor'};
	
	svg {
		color: ${(props) => props.$color || 'currentColor'} !important;
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

// Wrapper for menu item content with badge (Unused, kept for reference if needed but commented out to fix lint)
// const _MenuItemContent = styled.span`
// 	display: flex;
// 	align-items: center;
// 	width: 100%;
// 	gap: 0.5rem;
// `;

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

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

const SIDEBAR_MENU_VERSION = '2026-01-22-production-updates';

const ensureSidebarStateVersion = (): void => {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return;
	}

	try {
		const storedVersion = localStorage.getItem('sidebar.version');
		if (storedVersion !== SIDEBAR_MENU_VERSION) {
			localStorage.removeItem('nav.openSections');
			localStorage.removeItem('sidebar.menuOrder');
			localStorage.setItem('sidebar.version', SIDEBAR_MENU_VERSION);
		}
	} catch (error) {
		console.warn('Failed to ensure sidebar version state:', error);
	}
};

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

// const _DragHandle = styled.div`
// 	display: inline-flex;
// 	align-items: center;
// 	justify-content: center;
// 	padding: 0.25rem;
// 	margin-right: 0.5rem;
// 	cursor: grab;
// 	color: #9ca3af;
// 	transition: color 0.2s;
//
// 	&:hover {
// 		color: #4b5563;
// 	}
//
// 	&:active {
// 		cursor: grabbing;
// 	}
// `;

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
	background: ${(props) => (props.$isActive ? '#22c55e' : '#6b7280')};
	color: ${(props) => (props.$isActive ? 'white' : 'white')};
	border-color: ${(props) => (props.$isActive ? '#16a34a' : '#4b5563')};
	
	&:hover {
		background: ${(props) => (props.$isActive ? '#16a34a' : '#4b5563')};
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
	ensureSidebarStateVersion();

	const _location = useLocation();
	// const _navigate = useNavigate(); // Unused - keeping for potential future use
	const [sidebarWidth, setSidebarWidth] = useState(() => {
		try {
			const saved = localStorage.getItem('sidebar.width');
			const parsed = saved ? parseInt(saved, 10) : NaN;
			if (Number.isFinite(parsed) && parsed >= 300 && parsed <= 600) return parsed;
		} catch {}
		return 450; // Default width
	}); // Increased to fit widest menu items with mock badges
	const isResizing = useRef(false);

	// Search functionality
	const [searchQuery, setSearchQuery] = useState('');
	const [matchAnywhere, setMatchAnywhere] = useState(false);

	// Stable timestamp for ProSidebar key (use useRef to prevent remounts on every render)
	const renderTimestampRef = useRef(Date.now());
	const renderTimestamp = renderTimestampRef.current;

	// Helper function to get V6 flow styles - currently unused but kept for reference
	// const _getV6FlowStyles = (isActive: boolean) => ({
	// 	background: '#dcfce7', // Light green for all V6 flows
	// 	color: '#166534', // Dark green text
	// 	borderLeft: '3px solid #22c55e',
	// 	borderRight: isActive ? '3px solid #22c55e' : undefined, // Green border for active
	// 	fontWeight: isActive ? '700' : '600',
	// 	transition: 'all 0.2s ease',
	// 	cursor: 'pointer',
	// });

	// Helper function to get V6 flow hover styles
	// const _getV6FlowHoverStyles = () => ({
	// 	background: '#bbf7d0', // Light green hover
	// 	color: '#15803d', // Dark green text
	// 	transform: 'translateX(2px)',
	// 	boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)', // Green shadow
	// });

	// Helper function to get V7 flow styles
	// const _getV7FlowStyles = (isActive: boolean) => ({
	// 	background: '#dcfce7', // Light green for all V7 flows
	// 	color: '#166534', // Dark green text
	// 	borderLeft: '3px solid #22c55e',
	// 	borderRight: isActive ? '3px solid #22c55e' : undefined, // Green border for active
	// 	fontWeight: isActive ? '700' : '600',
	// 	transition: 'all 0.2s ease',
	// 	cursor: 'pointer',
	// });

	// Helper function to get V7 flow hover styles
	// const _getV7FlowHoverStyles = () => ({
	// 	background: '#bbf7d0', // Light green hover
	// 	color: '#15803d', // Dark green text
	// 	transform: 'translateX(2px)',
	// 	boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)', // Green shadow
	// });

	// Helper function to create V6 menu item props
	// const _createV6MenuItemProps = (path: string, additionalPaths: string[] = []) => {
	// 	const isActiveState = isActive(path) || additionalPaths.some((p) => isActive(p));
	// 	return {
	// 		className: 'v6-flow',
	// 		style: getV6FlowStyles(isActiveState),
	// 	};
	// };

	// Load persisted menu state from localStorage (must be before _menuGroups since it's referenced in the initializer)
	const [_openMenus, _setOpenMenus] = useState<Record<string, boolean>>(() => {
		try {
			const saved = localStorage.getItem('nav.openSections');
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.warn('Failed to load navigation state from localStorage:', error);
		}
		// Default state - only Core Overview and Production open by default
		return {
			'Core Overview': true,
			'Production': true,
			'Production (Legacy)': false,
			'OAuth 2.0 Flows': false,
			'OpenID Connect': true,
			PingOne: false,
			'V7RM Mock Flows (Not Supported by PingOne)': false,
			'Artificial Intelligence': false,
			'Security & Management': false,
			'Tools & Utilities': false,
			Documentation: false,
			Developers: false,
		};
	});

	// Initialize menu structure with drag and drop support
	const [_menuGroups, _setMenuGroups] = useState<MenuGroup[]>(() => {
		// TEMPORARY: Clear saved menu order to force new Core Overview group to appear at top
		localStorage.removeItem('sidebar.menuOrder');
		
		const savedOrder = localStorage.getItem('sidebar.menuOrder');
		if (savedOrder) {
			try {
				return JSON.parse(savedOrder);
			} catch (error) {
				console.warn('Failed to parse saved menu order:', error);
			}
		}

		// Read openMenus state from localStorage for use in initializer
		let openMenusState: Record<string, boolean> = {
			'Core Overview': true,
			'Production': true,
			'Production (Legacy)': false,
			'OAuth 2.0 Flows': false,
			'OpenID Connect': true,
			PingOne: false,
			'V7RM Mock Flows (Not Supported by PingOne)': false,
			'Artificial Intelligence': false,
			'Security & Management': false,
			'Tools & Utilities': false,
			Documentation: false,
			Developers: false,
			'Developer Tools': true,
		};
		try {
			const saved = localStorage.getItem('nav.openSections');
			if (saved) {
				openMenusState = { ...openMenusState, ...JSON.parse(saved) };
			}
		} catch (error) {
			console.warn('Failed to load navigation state from localStorage:', error);
		}

		// Default menu structure
		return [
			{
				id: 'core-overview',
				label: 'Core Overview',
				icon: (
					<ColoredIcon $color="#3b82f6">
						<FiHome />
					</ColoredIcon>
				),
				isOpen: openMenusState['Core Overview'] || true,
				items: [
					{
						id: 'dashboard',
						path: '/',
						label: '🏠 Dashboard',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiHome />
							</ColoredIcon>
						),
					},
					{
						id: 'getting-started',
						path: '/getting-started',
						label: '📖 Getting Started',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiBook />
							</ColoredIcon>
						),
					},
				],
			},
			{
				id: 'v8-flows-new',
				label: 'Production',
				icon: (
					<ColoredIcon $color="#3b82f6">
						<FiZap />
					</ColoredIcon>
				),
				isOpen: true, // Default to open, will be synced with openMenus state
				items: [
					{
						id: 'unified-oauth-flow-v8u',
						path: '/v8u/unified',
						label: '🎯 Unified OAuth & OIDC',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiZap />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V8U: Single UI for all OAuth/OIDC flows with real PingOne APIs">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'spiffe-spire-flow-v8u',
						path: '/v8u/spiffe-spire',
						label: '🔐 SPIFFE/SPIRE Mock',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiShield />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Mock flow demonstrating SPIFFE/SPIRE workload identity to PingOne token exchange">
								MOCK
							</MigrationBadge>
						),
					},
					{
						id: 'mfa-playground-v8',
						path: '/v8/mfa',
						label: 'PingOne MFA',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiSmartphone />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V8: PingOne MFA Playground with SMS, Email, TOTP, and FIDO2">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'delete-all-devices-utility-v8',
						path: '/v8/delete-all-devices',
						label: '🗑️ Delete All Devices',
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
						id: 'mfa-one-time-devices-v8',
						path: '/v8/mfa-one-time-devices',
						label: 'MFA One-Time Devices',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiZap />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Phase 2: One-time MFA where app controls device info">
								EXPERIMENTAL
							</MigrationBadge>
						),
					},
					{
						id: 'email-mfa-signon-v8',
						path: '/v8/email-mfa-signon',
						label: 'Email MFA Sign-On',
						icon: (
							<ColoredIcon $color="#0ea5e9">
								<FiUser />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V8: Email-based MFA sign-on experience">NEW</MigrationBadge>
						),
					},
					{
						id: 'production-api-tests-v8u',
						path: '/production/api-tests',
						label: '🧪 Production API Tests',
						icon: (
							<ColoredIcon $color="#3b82f6">
								<FiCode />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Comprehensive API testing for MFA and Unified flows with real PingOne APIs">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'api-tests-all-flows',
						path: '/test/all-flows-api-test',
						label: '🧪 All Flows API Tests',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiZap />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Comprehensive API testing for all OAuth flows with worker token support">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'api-tests-mfa-flows',
						path: '/test/mfa-flows-api-test',
						label: '🔐 MFA Flows API Tests',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiShield />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="MFA testing: OTP, TOTP, FIDO2 registration and Admin Authentication">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'mfa-device-auth-details-v8',
						path: '/v8/mfa/device-authentication-details',
						label: 'MFA Device Auth Details',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiDatabase />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V8: Inspect recent MFA device authentications and details">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'resources-api-v8',
						path: '/v8/resources-api',
						label: 'Resources API Tutorial',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiBook />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V8: Learn PingOne Resources API - OAuth 2.0 resources, scopes, and custom claims">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'pingone-authentication',
						path: '/pingone-authentication',
						label: 'PingOne Authentication',
						icon: (
							<ColoredIcon $color="#2563eb">
								<FiKey />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Enhanced PingOne authentication with token endpoint auth help">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'postman-collection-generator',
						path: '/postman-collection-generator',
						label: '📦 Postman Collection Generator',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiPackage />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Generate custom Postman collections for Unified OAuth/OIDC and MFA flows">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'p1mfa-sdk-samples',
						path: '/samples/p1mfa',
						label: '📦 P1MFA SDK Samples',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiCode />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="P1MFA SDK sample applications for FIDO2 and SMS MFA">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'p1mfa-sdk-fido2',
						path: '/samples/p1mfa/fido2',
						label: '🔐 P1MFA SDK - FIDO2',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiShield />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="FIDO2/WebAuthn MFA sample application">
								FIDO2
							</MigrationBadge>
						),
					},
					{
						id: 'p1mfa-sdk-sms',
						path: '/samples/p1mfa/sms',
						label: '📱 P1MFA SDK - SMS',
						icon: (
							<ColoredIcon $color="#0ea5e9">
								<FiSmartphone />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="SMS OTP MFA sample application">
								SMS
							</MigrationBadge>
						),
					},
				],
			},
			{
				id: 'v8-flows',
				label: 'Production (Legacy)',
				icon: (
					<ColoredIcon $color="#10b981">
						<FiZap />
					</ColoredIcon>
				),
				isOpen: openMenusState['Production (Legacy)'] || true,
				items: [
					{
						id: 'mfa-v8',
						path: '/flows/mfa-v8',
						label: 'MFA Flow (V8)',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiSmartphone />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V8: PingOne MFA with SMS device registration and OTP validation">
								NEW
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
						id: 'unified-credentials-mockup-v8',
						path: '/v8/unified-credentials-mockup',
						label: 'Unified Credentials UI (Mockup)',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiSettings />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V8: Spec-aware unified credentials form demo">
								<FiCode />
							</MigrationBadge>
						),
					},
					{
						id: 'enhanced-state-management',
						path: '/v8u/enhanced-state-management',
						label: '🔧 Enhanced State Management',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiDatabase />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Advanced state management with undo/redo, offline capabilities, and persistence">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'token-monitoring-dashboard',
						path: '/v8u/token-monitoring',
						label: '🔍 Token Monitoring Dashboard',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiEye />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Real-time token monitoring with countdowns, introspection, and management">
								NEW
							</MigrationBadge>
						),
					},
					{
						id: 'flow-comparison-tool',
						path: '/v8u/flow-comparison',
						label: '📊 Flow Comparison Tool',
						icon: (
							<ColoredIcon $color="#3b82f6">
								<FiBarChart2 />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="Compare OAuth flows with detailed metrics and recommendations">
								NEW
							</MigrationBadge>
						),
					},
				],
			},
			{
				id: 'v7m-mock-flows',
				label: 'Mock OAuth and OIDC flows',
				icon: (
					<ColoredIcon $color="#0ea5e9">
						<FiPackage />
					</ColoredIcon>
				),
				isOpen: openMenusState['Mock OAuth and OIDC flows'] || true,
				items: [
					{
						id: 'v7m-oauth-authorization-code',
						path: '/v7m/oauth/authorization-code',
						label: 'V7M OAuth Authorization Code',
						icon: (
							<ColoredIcon $color="#06b6d4">
								<FiKey />
							</ColoredIcon>
						),
					},
					{
						id: 'v7m-oidc-authorization-code',
						path: '/v7m/oidc/authorization-code',
						label: 'V7M OIDC Authorization Code',
						icon: (
							<ColoredIcon $color="#22c55e">
								<FiShield />
							</ColoredIcon>
						),
					},
					{
						id: 'v7m-oauth-device-authorization',
						path: '/v7m/oauth/device-authorization',
						label: 'V7M Device Authorization',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiSmartphone />
							</ColoredIcon>
						),
					},
					{
						id: 'v7m-oauth-client-credentials',
						path: '/v7m/oauth/client-credentials',
						label: 'V7M Client Credentials',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiKey />
							</ColoredIcon>
						),
					},
					{
						id: 'v7m-oauth-implicit',
						path: '/v7m/oauth/implicit',
						label: 'V7M OAuth Implicit Flow',
						icon: (
							<ColoredIcon $color="#ef4444">
								<FiAlertTriangle />
							</ColoredIcon>
						),
					},
					{
						id: 'v7m-oidc-implicit',
						path: '/v7m/oidc/implicit',
						label: 'V7M OIDC Implicit Flow',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiAlertTriangle />
							</ColoredIcon>
						),
					},
					{
						id: 'v7m-oauth-ropc',
						path: '/v7m/oauth/ropc',
						label: 'V7M Resource Owner Password',
						icon: (
							<ColoredIcon $color="#dc2626">
								<FiUser />
							</ColoredIcon>
						),
					},
					{
						id: 'v7m-oidc-ropc',
						path: '/v7m/oidc/ropc',
						label: 'V7M OIDC Resource Owner Password',
						icon: (
							<ColoredIcon $color="#ef4444">
								<FiUser />
							</ColoredIcon>
						),
					},
					{
						id: 'v7m-settings',
						path: '/v7m/settings',
						label: 'V7M Settings',
						icon: (
							<ColoredIcon $color="#0ea5e9">
								<FiSettings />
							</ColoredIcon>
						),
					},
				],
			},
			{
				id: 'main',
				label: 'OAuth 2.0 Flows',
				icon: (
					<ColoredIcon $color="#ef4444">
						<FiShield />
					</ColoredIcon>
				),
				isOpen: openMenusState['OAuth 2.0 Flows'] || false,
				items: [
					{
						id: 'oauth-authorization-code-v7',
						path: '/flows/oauth-authorization-code-v7',
						label: 'Authorization Code (V7)',
						icon: (
							<ColoredIcon $color="#22d3ee">
								<FiKey />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7: Unified OAuth/OIDC authorization code experience">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'implicit-v7',
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
						id: 'device-authorization-v7',
						path: '/flows/device-authorization-v7',
						label: 'Device Authorization (V7)',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiSmartphone />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7: Unified OAuth/OIDC device authorization for TVs, IoT devices, and CLI tools">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'client-credentials-v7',
						path: '/flows/client-credentials-v7',
						label: 'OAuth Client Credentials (V7)',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiKey />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7: Enhanced client credentials with comprehensive auth methods">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
					{
						id: 'oauth-ropc-v7',
						path: '/flows/oauth-ropc-v7',
						label: 'OAuth Resource Owner Password (V7)',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiLock />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V7: Resource Owner Password Credentials with enhanced security">
								<FiCheckCircle />
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
							<MigrationBadge title="V8M: RFC 8693 Token Exchange for A2A scenarios">
								<FiCheckCircle />
							</MigrationBadge>
						),
					},
				],
			},
			{
				id: 'token-management',
				label: 'Token Management',
				icon: (
					<ColoredIcon $color="#8b5cf6">
						<FiDatabase />
					</ColoredIcon>
				),
				isOpen: openMenusState['Token Management'] || false,
				items: [
					{
						id: 'token-introspection',
						path: '/flows/token-introspection',
						label: 'Token Introspection',
						icon: (
							<ColoredIcon $color="#3b82f6">
								<FiEye />
							</ColoredIcon>
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
					},
					{
						id: 'postman-collection-generator',
						path: '/postman-collection-generator',
						label: 'Postman Collection Generator',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiPackage />
							</ColoredIcon>
						),
					},
					{
						id: 'p1mfa-sdk-samples',
						path: '/samples/p1mfa',
						label: '📦 P1MFA SDK Samples',
						icon: (
							<ColoredIcon $color="#8b5cf6">
								<FiCode />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="P1MFA SDK sample applications for FIDO2 and SMS MFA">
								NEW
							</MigrationBadge>
						),
					},
				],
			},
			{
				id: 'mock-flows',
				label: 'V7RM Mock Flows (Not Supported by PingOne)',
				icon: (
					<ColoredIcon $color="#f59e0b">
						<FiCpu />
					</ColoredIcon>
				),
				isOpen: openMenusState['V7RM Mock Flows (Not Supported by PingOne)'] || false,
				items: [
					{
						id: 'v7rm-oidc-ropc',
						path: '/flows/v7rm-oidc-ropc',
						label: 'V7RM OIDC ROPC',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiLock />
							</ColoredIcon>
						),
					},
					{
						id: 'saml-bearer-assertion-v7',
						path: '/flows/saml-bearer-assertion-v7',
						label: 'SAML Bearer (Mock)',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiShield />
							</ColoredIcon>
						),
					},
					{
						id: 'v7rm-oauth-authz-code-condensed',
						path: '/flows/oauth-authorization-code-v7-condensed-mock',
						label: 'V7RM Auth Code Condensed',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiKey />
							</ColoredIcon>
						),
					},
					{
						id: 'v7rm-condensed-mock',
						path: '/flows/v7rm-condensed-mock',
						label: 'V7RM Condensed Mock',
						icon: (
							<ColoredIcon $color="#f59e0b">
								<FiLayers />
							</ColoredIcon>
						),
					},
				],
			},
			{
				id: 'pingone',
				label: 'PingOne',
				icon: (
					<ColoredIcon $color="#0ea5e9">
						<FiShield />
					</ColoredIcon>
				),
				isOpen: openMenusState['PingOne'] || false,
				items: [
					{
						id: 'pingone-identity-metrics',
						path: '/pingone-identity-metrics',
						label: 'PingOne Identity Metrics',
						icon: (
							<ColoredIcon $color="#10b981">
								<FiBarChart2 />
							</ColoredIcon>
						),
					},
					{
						id: 'pingone-mock-features',
						path: '/pingone-mock-features',
						label: 'PingOne Mock Features',
						icon: (
							<ColoredIcon $color="#7c3aed">
								<FiCpu />
							</ColoredIcon>
						),
					},
					{
						id: 'pingone-protect-v8',
						path: '/v8/protect',
						label: 'PingOne Protect (V8)',
						icon: (
							<ColoredIcon $color="#ef4444">
								<FiAlertTriangle />
							</ColoredIcon>
						),
						badge: (
							<MigrationBadge title="V8: PingOne Protect risk evaluation and fraud detection">
								NEW
							</MigrationBadge>
						),
					},
				],
			},
		];
	});

	// Handle drag and drop
	// const _handleDragEnd = (result: DropResult) => {
	// 	const { destination, source, type } = result;
	//
	// 	// If dropped outside a valid drop zone
	// 	if (!destination) {
	// 		return;
	// 	}
	//
	// 	// If dropped in the same position
	// 	if (destination.droppableId === source.droppableId && destination.index === source.index) {
	// 		return;
	// 	}
	//
	// 	if (type === 'group') {
	// 		// Reordering groups
	// 		const newGroups = Array.from(menuGroups);
	// 		const [reorderedGroup] = newGroups.splice(source.index, 1);
	// 		newGroups.splice(destination.index, 0, reorderedGroup);
	//
	// 		setMenuGroups(newGroups);
	// 		localStorage.setItem('sidebar.menuOrder', JSON.stringify(newGroups));
	//
	// 		v4ToastManager.showSuccess('Menu section reordered successfully!');
	// 	} else {
	// 		// Moving items between groups
	// 		const sourceGroupIndex = menuGroups.findIndex((group) => group.id === source.droppableId);
	// 		const destGroupIndex = menuGroups.findIndex((group) => group.id === destination.droppableId);
	//
	// 		if (sourceGroupIndex === -1 || destGroupIndex === -1) {
	// 			return;
	// 		}
	//
	// 		const newGroups = Array.from(menuGroups);
	// 		const sourceGroup = { ...newGroups[sourceGroupIndex] };
	// 		const destGroup = { ...newGroups[destGroupIndex] };
	//
	// 		// Remove item from source group
	// 		const [movedItem] = sourceGroup.items.splice(source.index, 1);
	//
	// 		// Add item to destination group
	// 		destGroup.items.splice(destination.index, 0, movedItem);
	//
	// 		// Update the groups
	// 		newGroups[sourceGroupIndex] = sourceGroup;
	// 		newGroups[destGroupIndex] = destGroup;
	//
	// 		setMenuGroups(newGroups);
	// 		localStorage.setItem('sidebar.menuOrder', JSON.stringify(newGroups));
	//
	// 		v4ToastManager.showSuccess(
	// 			`Moved "${movedItem.label}" to ${destGroup.label}`,
	// 			{},
	// 			{ duration: 3000 }
	// 		);
	// 	}
	// };

	// Update group open state
	// const _toggleMenuGroup = (groupId: string) => {
	// 	setMenuGroups((prevGroups) => {
	// 		const newGroups = prevGroups.map((group) =>
	// 			group.id === groupId ? { ...group, isOpen: !group.isOpen } : group
	// 		);
	//
	// 		// Update the openMenus state for persistence
	// 		const newOpenState = newGroups.reduce(
	// 			(acc, group) => {
	// 				acc[group.label] = group.isOpen;
	// 				return acc;
	// 			},
	// 			{} as Record<string, boolean>
	// 		);
	//
	// 		setOpenMenus(newOpenState);
	// 		localStorage.setItem('nav.openSections', JSON.stringify(newOpenState));
	//
	// 		return newGroups;
	// 	});
	// };
	// 	if (!destination) {
	// 		return;
	// 	}
	//
	// 	// If dropped in the same position
	// 	if (destination.droppableId === source.droppableId && destination.index === source.index) {
	// 		return;
	// 	}
	//
	// 	if (type === 'group') {
	// 		// Reordering groups
	// 		const newGroups = Array.from(menuGroups);
	// 		const [reorderedGroup] = newGroups.splice(source.index, 1);
	// 		newGroups.splice(destination.index, 0, reorderedGroup);
	//
	// 		setMenuGroups(newGroups);
	// 		localStorage.setItem('sidebar.menuOrder', JSON.stringify(newGroups));
	//
	// 		v4ToastManager.showSuccess('Menu section reordered successfully!');
	// 	} else {
	// 		// Moving items between groups
	// 		const sourceGroupIndex = menuGroups.findIndex((group) => group.id === source.droppableId);
	// 		const destGroupIndex = menuGroups.findIndex((group) => group.id === destination.droppableId);
	//
	// 		if (sourceGroupIndex === -1 || destGroupIndex === -1) {
	// 			return;
	// 		}
	//
	// 		const newGroups = Array.from(menuGroups);
	// 		const sourceGroup = { ...newGroups[sourceGroupIndex] };
	// 		const destGroup = { ...newGroups[destGroupIndex] };
	//
	// 		// Remove item from source group
	// 		const [movedItem] = sourceGroup.items.splice(source.index, 1);
	//
	// 		// Add item to destination group
	// 		destGroup.items.splice(destination.index, 0, movedItem);
	//
	// 		// Update the groups
	// 		newGroups[sourceGroupIndex] = sourceGroup;
	// 		newGroups[destGroupIndex] = destGroup;
	//
	// 		setMenuGroups(newGroups);
	// 		localStorage.setItem('sidebar.menuOrder', JSON.stringify(newGroups));
	//
	// 		v4ToastManager.showSuccess(
	// 			`Moved "${movedItem.label}" to ${destGroup.label}`,
	// 			{},
	// 			{ duration: 3000 }
	// 		);
	// 	}
	// };

	// Update group open state
	// const _toggleMenuGroup = (groupId: string) => {
	// 	setMenuGroups((prevGroups) => {
	// 		const newGroups = prevGroups.map((group) =>
	// 			group.id === groupId ? { ...group, isOpen: !group.isOpen } : group
	// 		);
	//
	// 		// Update the openMenus state for persistence
	// 		const newOpenState = newGroups.reduce(
	// 			(acc, group) => {
	// 				acc[group.label] = group.isOpen;
	// 				return acc;
	// 			},
	// 			{} as Record<string, boolean>
	// 		);
	//
	// 		setOpenMenus(newOpenState);
	// 		localStorage.setItem('nav.openSections', JSON.stringify(newOpenState));
	//
	// 		return newGroups;
	// 	});
	// };

	// Drag and drop mode toggle
	const [isDragDropMode, setIsDragDropMode] = useState(() => {
		const saved = localStorage.getItem('sidebar.dragDropMode');
		return saved === 'true';
	});

	// Function to reset drag mode (for debugging)
	// const _resetDragMode = () => {
	// 	console.log('🔄 Resetting drag mode');
	// 	localStorage.removeItem('sidebar.dragDropMode');
	// 	setIsDragDropMode(false);
	// };

	const toggleDragDropMode = () => {
		const newMode = !isDragDropMode;
		console.log('🔄 Toggling drag mode from', isDragDropMode, 'to', newMode);
		setIsDragDropMode(newMode);
		localStorage.setItem('sidebar.dragDropMode', newMode.toString());

		if (newMode) {
			v4ToastManager.showSuccess(
				'Drag & Drop Mode Enabled',
				{
					description: 'You can now drag menu items between sections and reorder sections!',
				},
				{ duration: 3000 }
			);
		} else {
			v4ToastManager.showSuccess(
				'Standard View Mode',
				{
					description: 'Your customizations are preserved but drag handles are hidden.',
				},
				{ duration: 3000 }
			);
		}
	};

	// Show drag instructions
	// const _showDragInstructions = () => {
	// 	v4ToastManager.showSuccess(
	// 		'Drag & Drop Menu Items',
	// 		{
	// 			description:
	// 				'Drag menu items between sections or reorder sections by dragging the section headers. Your layout will be saved automatically!',
	// 		},
	// 		{ duration: 4000 }
	// 	);
	// };

	// Handle search
	const handleSearch = useCallback((query: string) => {
		setSearchQuery(query);
		// The DragDropSidebar will handle the actual search filtering
	}, []);

	const handleMouseDown = (e: React.MouseEvent) => {
		isResizing.current = true;
		e.preventDefault();
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
			try {
				localStorage.setItem('sidebar.width', String(sidebarWidth));
			} catch {}
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [sidebarWidth]);

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
							title={isDragDropMode ? 'Switch to standard menu' : 'Enable drag & drop mode'}
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
					activeSearchQuery={searchQuery}
					matchAnywhere={matchAnywhere}
					onMatchAnywhereChange={setMatchAnywhere}
				/>

				<DragDropSidebar
					dragMode={isDragDropMode}
					searchQuery={searchQuery}
					matchAnywhere={matchAnywhere}
				/>
			</ProSidebar>
		</SidebarContainer>
	);
};

export default Sidebar;
