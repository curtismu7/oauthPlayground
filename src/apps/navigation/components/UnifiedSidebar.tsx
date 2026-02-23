/**
 * ========================================================================
 * UNIFIED SIDEBAR COMPONENT
 * ========================================================================
 * 
 * This component combines the functionality of Sidebar.tsx and DragDropSidebar.tsx
 * into a single, maintainable component with all sidebar features.
 * 
 * Features:
 * - Resize functionality (from Sidebar.tsx)
 * - Header with search and version badge (from Sidebar.tsx)
 * - Drag mode toggle (from Sidebar.tsx)
 * - All menu items and navigation (from DragDropSidebar.tsx)
 * - Search filtering (from DragDropSidebar.tsx)
 * - Drag & drop functionality (from DragDropSidebar.tsx)
 * 
 * This eliminates the double import chain and simplifies the architecture.
 * ========================================================================
 */

import React, { useCallback, useState, useMemo } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import SidebarSearch from './SidebarSearch';
import { VersionBadge } from './VersionBadge';

// App version from package.json
const APP_VERSION = '9.25.1';

// React Icons (keeping existing for now, can be migrated to MDI later)
import {
	FiActivity,
	FiBarChart2,
	FiBook,
	FiBookOpen,
	FiCheckCircle,
	FiChevronDown,
	FiCode,
	FiDatabase,
	FiEye,
	FiFileText,
	FiKey,
	FiSettings,
	FiShield,
	FiSmartphone,
	FiTool,
	FiUser,
	FiUsers,
	FiHome,
	FiTrendingUp,
	FiZap,
	FiServer,
} from 'react-icons/fi';

// Styled Components (from Sidebar.tsx)
const SidebarContainer = styled.div<{ $width: number }>`
	position: relative;
	width: ${(props) => props.$width}px;
	min-width: 300px;
	max-width: 600px;
	height: 100vh;
	background: #ffffff;
	border-right: 1px solid #e5e7eb;
	transition: width 0.15s ease-in-out;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

const ResizeHandle = styled.div`
	position: absolute;
	top: 0;
	right: -2px;
	width: 4px;
	height: 100%;
	cursor: ew-resize;
	background: transparent;
	z-index: 10;

	&:hover {
		background: rgba(59, 130, 246, 0.3);
		transform: translateX(-1px);
	}

	&:active {
		background: rgba(59, 130, 246, 0.5);
	}
`;

const SidebarHeader = styled.div`
	padding: 1rem;
	border-bottom: 1px solid #e5e7eb;
	background: #f9fafb;
	flex-shrink: 0;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	padding: 0.25rem;
	border-radius: 0.25rem;
	cursor: pointer;
	color: #6b7280;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: #f3f4f6;
		color: #374151;
	}
`;

const DragModeToggle = styled.button<{ $isActive?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	background: ${(props) => (props.$isActive ? '#dbeafe' : 'white')};
	color: ${(props) => (props.$isActive ? '#1e40af' : '#374151')};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: ${(props) => (props.$isActive ? '#bfdbfe' : '#f9fafb')};
		border-color: #9ca3af;
	}

	&:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
`;

const SidebarContent = styled.div`
	flex: 1;
	overflow: auto;
	display: flex;
	flex-direction: column;
`;

const SidebarFooter = styled.div`
	padding: 1rem;
	border-top: 1px solid #e5e7eb;
	background: #f9fafb;
	flex-shrink: 0;
`;

// Menu Item Components (from DragDropSidebar.tsx)
const MenuItemContainer = styled.div<{ $isDragging?: boolean; $isOver?: boolean }>`
	padding: 0.5rem 1rem;
	margin: 0.25rem 0.5rem;
	border-radius: 0.375rem;
	cursor: pointer;
	transition: all 0.15s ease-in-out;
	background: ${(props) => (props.$isDragging ? '#f3f4f6' : 'transparent')};
	border: ${(props) => (props.$isOver ? '2px solid #3b82f6' : '2px solid transparent')};

	&:hover {
		background: #f9fafb;
	}

	&.active {
		background: #eff6ff;
		border-color: #3b82f6;
	}
`;

const MenuItemContent = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const MenuItemIcon = styled.div<{ $color?: string }>`
	color: ${(props) => props.$color || '#6b7280'};
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.25rem;
	height: 1.25rem;
`;

const MenuItemText = styled.span`
	flex: 1;
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
`;

const MenuItemBadge = styled.span<{ $variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' }>`
	padding: 0.125rem 0.5rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;

	${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
					background: #dbeafe;
					color: #1d4ed8;
				`;
			case 'secondary':
				return `
					background: #f3f4f6;
					color: #6b7280;
				`;
			case 'success':
				return `
					background: #d1fae5;
					color: #065f46;
				`;
			case 'warning':
				return `
					background: #fef3c7;
					color: #92400e;
				`;
			case 'danger':
				return `
					background: #fee2e2;
					color: #991b1b;
				`;
			default:
				return `
					background: #e5e7eb;
					color: #374151;
				`;
		}
	}}
`;

const SubMenuContainer = styled.div<{ $isExpanded: boolean }>`
	max-height: ${(props) => (props.$isExpanded ? '1000px' : '0')};
	overflow: hidden;
	transition: max-height 0.15s ease-in-out;
`;

const SubMenuHeader = styled.div<{ $isExpanded: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	margin: 0.25rem 0.5rem;
	border-radius: 0.375rem;
	cursor: pointer;
	transition: all 0.15s ease-in-out;

	&:hover {
		background: #f9fafb;
	}

	svg {
		transition: transform 0.15s ease-in-out;
		transform: ${(props) => (props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)')};
	}
`;

// Menu Data Structure (from DragDropSidebar.tsx)
interface MenuItem {
	id: string;
	label: string;
	path?: string;
	icon?: React.ReactNode;
	badge?: {
		text: string;
		variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
	};
	children?: MenuItem[];
	isVisible?: boolean;
}

// Main menu structure
const menuData: MenuItem[] = [
	{
		id: 'dashboard',
		label: 'Dashboard',
		path: '/',
		icon: <FiHome />,
	},
	{
		id: 'oauth-flows',
		label: 'OAuth Flows',
		icon: <FiKey />,
		children: [
			{
				id: 'authorization-code',
				label: 'Authorization Code Flow',
				path: '/oauth/authorization-code',
				icon: <FiFileText />,
				badge: { text: 'V7', variant: 'secondary' },
			},
			{
				id: 'implicit-flow',
				label: 'Implicit Flow',
				path: '/oauth/implicit',
				icon: <FiZap />,
				badge: { text: 'V6', variant: 'secondary' },
			},
			{
				id: 'client-credentials',
				label: 'Client Credentials Flow',
				path: '/oauth/client-credentials',
				icon: <FiServer />,
			},
			{
				id: 'resource-owner',
				label: 'Resource Owner Password',
				path: '/oauth/resource-owner',
				icon: <FiUsers />,
			},
			{
				id: 'device-authorization',
				label: 'Device Authorization Flow',
				path: '/oauth/device-authorization',
				icon: <FiSmartphone />,
				badge: { text: 'V6', variant: 'primary' },
			},
		],
	},
	{
		id: 'mfa-flows',
		label: 'MFA Flows',
		icon: <FiShield />,
		children: [
			{
				id: 'mfa-one-time',
				label: 'One-Time Devices',
				path: '/mfa/one-time-devices',
				icon: <FiSmartphone />,
				badge: { text: 'V8', variant: 'primary' },
			},
			{
				id: 'mfa-device-management',
				label: 'Device Management',
				path: '/mfa/device-management',
				icon: <FiSettings />,
			},
			{
				id: 'mfa-registration',
				label: 'Device Registration',
				path: '/mfa/device-registration',
				icon: <FiUser />,
			},
		],
	},
	{
		id: 'protect-portal',
		label: 'Protect Portal',
		path: '/protect-portal',
		icon: <FiShield />,
		badge: { text: 'NEW', variant: 'success' },
	},
	{
		id: 'tools',
		label: 'Tools & Utilities',
		icon: <FiTool />,
		children: [
			{
				id: 'token-monitoring',
				label: 'Token Monitoring',
				path: '/tools/token-monitoring',
				icon: <FiEye />,
			},
			{
				id: 'flow-comparison',
				label: 'Flow Comparison',
				path: '/tools/flow-comparison',
				icon: <FiBarChart2 />,
			},
			{
				id: 'credential-management',
				label: 'Credential Management',
				path: '/tools/credential-management',
				icon: <FiDatabase />,
			},
			{
				id: 'api-testing',
				label: 'API Testing',
				path: '/tools/api-testing',
				icon: <FiCode />,
			},
		],
	},
	{
		id: 'documentation',
		label: 'Documentation',
		icon: <FiBook />,
		children: [
			{
				id: 'api-docs',
				label: 'API Documentation',
				path: '/docs/api',
				icon: <FiFileText />,
			},
			{
				id: 'flow-guides',
				label: 'Flow Guides',
				path: '/docs/flows',
				icon: <FiBookOpen />,
			},
			{
				id: 'examples',
				label: 'Code Examples',
				path: '/docs/examples',
				icon: <FiCode />,
			},
		],
	},
	{
		id: 'monitoring',
		label: 'Monitoring',
		icon: <FiActivity />,
		children: [
			{
				id: 'system-status',
				label: 'System Status',
				path: '/monitoring/status',
				icon: <FiCheckCircle />,
			},
			{
				id: 'performance',
				label: 'Performance Metrics',
				path: '/monitoring/performance',
				icon: <FiTrendingUp />,
			},
			{
				id: 'logs',
				label: 'System Logs',
				path: '/monitoring/logs',
				icon: <FiFileText />,
			},
		],
	},
];

// Helper Functions
const filterMenuItems = (items: MenuItem[], searchQuery: string, matchAnywhere: boolean): MenuItem[] => {
	if (!searchQuery) return items;

	const query = searchQuery.toLowerCase();
	
	return items.reduce((acc: MenuItem[], item) => {
		const matchesSearch = matchAnywhere 
			? item.label.toLowerCase().includes(query)
			: item.label.toLowerCase().startsWith(query);

		let filteredChildren: MenuItem[] = [];
		if (item.children) {
			filteredChildren = filterMenuItems(item.children, searchQuery, matchAnywhere);
		}

		if (matchesSearch || filteredChildren.length > 0) {
			acc.push({
				...item,
				children: filteredChildren.length > 0 ? filteredChildren : item.children,
				isVisible: matchesSearch || filteredChildren.length > 0,
			});
		}

		return acc;
	}, []);
};

// Main Component
interface UnifiedSidebarProps {
	isOpen?: boolean;
	onClose?: () => void;
	initialWidth?: number;
	dragMode?: boolean;
	searchQuery?: string;
	matchAnywhere?: boolean;
	onSearchChange?: (query: string) => void;
	onMatchAnywhereChange?: (matchAnywhere: boolean) => void;
	onDragModeToggle?: (dragMode: boolean) => void;
}

const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({
	onClose,
	initialWidth = 350,
	dragMode: initialDragMode = false,
	searchQuery: initialSearchQuery = '',
	matchAnywhere: initialMatchAnywhere = false,
	onSearchChange,
	onMatchAnywhereChange,
	onDragModeToggle,
}) => {
	const [width, setWidth] = useState(initialWidth);
	const [isDragging, setIsDragging] = useState(false);
	const [dragMode, setDragMode] = useState(initialDragMode);
	const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
	const [matchAnywhere, setMatchAnywhere] = useState(initialMatchAnywhere);
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
	const [draggedItem, setDraggedItem] = useState<MenuItem | null>(null);
	const [dragOverItem, setDragOverItem] = useState<string | null>(null);

	const location = useLocation();
	const navigate = useNavigate();

	// Resize functionality
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		setIsDragging(true);

		const handleMouseMove = (e: MouseEvent) => {
			const newWidth = e.clientX;
			if (newWidth >= 300 && newWidth <= 600) {
				setWidth(newWidth);
			}
		};

		const handleMouseUp = () => {
			setIsDragging(false);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}, []);

	// Search functionality
	const handleSearch = useCallback((query: string) => {
		setSearchQuery(query);
		onSearchChange?.(query);
	}, [onSearchChange]);

	const handleMatchAnywhereChange = useCallback((match: boolean) => {
		setMatchAnywhere(match);
		onMatchAnywhereChange?.(match);
	}, [onMatchAnywhereChange]);

	// Drag mode toggle
	const toggleDragDropMode = useCallback(() => {
		const newMode = !dragMode;
		setDragMode(newMode);
		onDragModeToggle?.(newMode);
	}, [dragMode, onDragModeToggle]);

	// Navigation
	const handleNavigate = useCallback((path: string) => {
		navigate(path);
	}, [navigate]);

	// Expand/collapse submenus
	const toggleExpanded = useCallback((itemId: string) => {
		setExpandedItems((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(itemId)) {
				newSet.delete(itemId);
			} else {
				newSet.add(itemId);
			}
			return newSet;
		});
	}, []);

	// Drag and drop handlers
	const handleDragStart = useCallback((item: MenuItem) => {
		setDraggedItem(item);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent, itemId: string) => {
		e.preventDefault();
		setDragOverItem(itemId);
	}, []);

	const handleDragLeave = useCallback(() => {
		setDragOverItem(null);
	}, []);

	const handleDrop = useCallback((e: React.DragEvent, targetItem: MenuItem) => {
		e.preventDefault();
		setDragOverItem(null);
		// TODO: Implement drag and drop reordering logic
		console.log('Dropped item:', draggedItem, 'onto:', targetItem);
		setDraggedItem(null);
	}, [draggedItem]);

	// Filter menu items based on search
	const filteredMenuData = useMemo(() => {
		return filterMenuItems(menuData, searchQuery, matchAnywhere);
	}, [searchQuery, matchAnywhere]);

	// Check if item is active
	const isItemActive = useCallback((item: MenuItem): boolean => {
		if (item.path) {
			return location.pathname === item.path;
		}
		if (item.children) {
			return item.children.some((child) => isItemActive(child));
		}
		return false;
	}, [location]);

	// Render menu item
	const renderMenuItem = useCallback((item: MenuItem, level: number = 0) => {
		const isActive = isItemActive(item);
		const isExpanded = expandedItems.has(item.id);
		const hasChildren = item.children && item.children.length > 0;

		if (hasChildren) {
			return (
				<div key={item.id}>
					<SubMenuHeader
						$isExpanded={isExpanded}
						onClick={() => toggleExpanded(item.id)}
					>
						<MenuItemIcon $color={isActive ? '#3b82f6' : '#6b7280'}>
							{item.icon}
						</MenuItemIcon>
						<MenuItemText>{item.label}</MenuItemText>
						<FiChevronDown size={14} />
						{item.badge && (
							<MenuItemBadge $variant={item.badge.variant}>
								{item.badge.text}
							</MenuItemBadge>
						)}
					</SubMenuHeader>
					<SubMenuContainer $isExpanded={isExpanded}>
						{item.children?.map((child) => renderMenuItem(child, level + 1))}
					</SubMenuContainer>
				</div>
			);
		}

		return (
			<MenuItemContainer
				key={item.id}
				className={isActive ? 'active' : ''}
				$isDragging={draggedItem?.id === item.id}
				$isOver={dragOverItem === item.id}
				onClick={() => item.path && handleNavigate(item.path)}
				draggable={dragMode}
				onDragStart={() => dragMode && handleDragStart(item)}
				onDragOver={(e) => dragMode && handleDragOver(e, item.id)}
				onDragLeave={dragMode && handleDragLeave}
				onDrop={(e) => dragMode && handleDrop(e, item)}
			>
				<MenuItemContent>
					<MenuItemIcon $color={isActive ? '#3b82f6' : '#6b7280'}>
						{item.icon}
					</MenuItemIcon>
					<MenuItemText>{item.label}</MenuItemText>
					{item.badge && (
						<MenuItemBadge $variant={item.badge.variant}>
							{item.badge.text}
						</MenuItemBadge>
					)}
				</MenuItemContent>
			</MenuItemContainer>
		);
	}, [
		isItemActive,
		expandedItems,
		draggedItem,
		dragOverItem,
		dragMode,
		handleNavigate,
		toggleExpanded,
		handleDragStart,
		handleDragOver,
		handleDragLeave,
		handleDrop,
	]);

	return (
		<SidebarContainer $width={width}>
			<ResizeHandle onMouseDown={handleMouseDown} />
			
			<SidebarHeader>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginBottom: '16px',
					}}
				>
					<h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
						PingOne MasterFlow API
					</h2>
					<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
						<VersionBadge version={APP_VERSION} variant="sidebar" />
						{onClose && (
							<CloseButton onClick={onClose}>
								<i className="mdi mdi-close" style={{ fontSize: 20 }}></i>
							</CloseButton>
						)}
					</div>
				</div>

				{/* Search */}
				<SidebarSearch
					onSearch={handleSearch}
					placeholder="Search flows and pages..."
					activeSearchQuery={searchQuery}
					matchAnywhere={matchAnywhere}
					onMatchAnywhereChange={handleMatchAnywhereChange}
				/>

				{/* Drag Mode Toggle */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '12px' }}>
					<DragModeToggle
						onClick={toggleDragDropMode}
						title={dragMode ? 'Switch to standard menu' : 'Enable drag & drop mode'}
						$isActive={dragMode}
					>
						<i className="mdi-drag-horizontal-variant" style={{ fontSize: 14 }}></i>
						{dragMode ? 'Drag Mode' : 'Enable Drag'}
					</DragModeToggle>
				</div>
			</SidebarHeader>

			{/* Main Content */}
			<SidebarContent>
				{filteredMenuData.map((item) => renderMenuItem(item))}
			</SidebarContent>

			<SidebarFooter>
				<div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
					© 2026 PingOne MasterFlow API
				</div>
			</SidebarFooter>
		</SidebarContainer>
	);
};

export default UnifiedSidebar;
