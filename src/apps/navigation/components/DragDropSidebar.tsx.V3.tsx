/**
 * ========================================================================
 * MENU V3 - Enhanced Drag & Drop with Visual Improvements
 * ========================================================================
 *
 * This is V3 of the DragDropSidebar with enhanced UX features:
 * - Clear drag & drop indicators with visual feedback
 * - Light shading for menu hierarchy (menus vs submenus vs components)
 * - Enhanced search box with clear button and search button
 * - Resizable sidebar (drag left/right to resize)
 * - Improved visual hierarchy and accessibility
 *
 * New Features:
 * - Drag preview with drop zone highlighting
 * - Visual hierarchy with background shading
 * - Search with clear and dedicated search button
 * - Resize handle for width adjustment
 * - Smooth transitions and micro-interactions
 * ========================================================================
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

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
		FiMove: 'mdi-drag',
		FiPackage: 'mdi-package',
		FiRefreshCw: 'mdi-refresh',
		FiSearch: 'mdi-magnify',
		FiServer: 'mdi-server',
		FiSettings: 'mdi-cog',
		FiShield: 'mdi-shield',
		FiShoppingCart: 'mdi-shopping',
		FiSmartphone: 'mdi-cellphone',
		FiTool: 'mdi-tools',
		FiTrash2: 'mdi-delete',
		FiUser: 'mdi-account',
		FiZap: 'mdi-flash',
	};
	return iconMap[fiIcon] || 'mdi-help-circle';
};

// MDI Icon Component
const MDIIcon: React.FC<{ icon: string; size?: number; ariaLabel?: string }> = ({
	icon,
	size = 16,
	ariaLabel,
}) => {
	const iconClass = getMDIIconClass(icon);
	return (
		<i className={`mdi ${iconClass}`} style={{ fontSize: `${size}px` }} aria-label={ariaLabel}></i>
	);
};

// Types
interface MenuItem {
	id: string;
	label: string;
	icon: string;
	path?: string;
	children?: MenuItem[];
	type: 'menu' | 'submenu' | 'component';
	priority?: 'high' | 'medium' | 'low';
}

interface DragItem {
	id: string;
	type: string;
	index: number;
}

// New Menu Structure from newmenu.md
const MENU_DATA: MenuItem[] = [
	{
		id: 'core-config',
		label: 'Core & Configuration',
		icon: 'FiCpu',
		type: 'menu',
		priority: 'high',
		children: [
			{
				id: 'dashboard',
				label: 'Dashboard',
				icon: 'FiActivity',
				path: '/dashboard',
				type: 'submenu',
			},
			{
				id: 'configuration',
				label: 'Configuration',
				icon: 'FiSettings',
				path: '/configuration',
				type: 'submenu',
			},
			{
				id: 'environment-management',
				label: 'Environment Management',
				icon: 'FiServer',
				path: '/environment',
				type: 'submenu',
			},
			{
				id: 'feature-flags',
				label: 'Feature Flags',
				icon: 'FiShield',
				path: '/feature-flags',
				type: 'submenu',
			},
			{
				id: 'api-status',
				label: 'API Status',
				icon: 'FiCheckCircle',
				path: '/api-status',
				type: 'submenu',
			},
		],
	},
	{
		id: 'auth-security',
		label: 'Authentication & Security',
		icon: 'FiLock',
		type: 'menu',
		priority: 'high',
		children: [
			{
				id: 'oauth-flows',
				label: 'OAuth Flows',
				icon: 'FiKey',
				path: '/oauth/flows',
				type: 'submenu',
			},
			{
				id: 'mfa-flows',
				label: 'MFA Flows',
				icon: 'FiShield',
				path: '/mfa/flows',
				type: 'submenu',
			},
			{
				id: 'token-management',
				label: 'Token Management',
				icon: 'FiPackage',
				path: '/tokens',
				type: 'submenu',
			},
			{
				id: 'user-authentication',
				label: 'User Authentication',
				icon: 'FiUser',
				path: '/auth/users',
				type: 'submenu',
			},
		],
	},
	{
		id: 'pingone-protect',
		label: 'PingOne Protect',
		icon: 'FiShield',
		type: 'menu',
		priority: 'high',
		children: [
			{
				id: 'pingone-protect-flow',
				label: 'PingOne Protect Flow',
				icon: 'FiShield',
				path: '/pingone-protect',
				type: 'submenu',
			},
		],
	},
	{
		id: 'user-device-management',
		label: 'User & Device Management',
		icon: 'FiUsers',
		type: 'menu',
		priority: 'medium',
		children: [
			{
				id: 'user-management',
				label: 'User Management',
				icon: 'FiUser',
				path: '/users',
				type: 'submenu',
			},
			{
				id: 'device-management',
				label: 'Device Management',
				icon: 'FiSmartphone',
				path: '/devices',
				type: 'submenu',
			},
			{
				id: 'device-utilities',
				label: 'Device Utilities',
				icon: 'FiTool',
				path: '/device-utilities',
				type: 'submenu',
			},
		],
	},
	{
		id: 'tools-utilities',
		label: 'Tools & Utilities',
		icon: 'FiTool',
		type: 'menu',
		priority: 'medium',
		children: [
			{
				id: 'sdk-examples',
				label: 'SDK Examples',
				icon: 'FiCode',
				path: '/sdk-examples',
				type: 'submenu',
			},
			{
				id: 'flow-tools',
				label: 'Flow Tools',
				icon: 'FiGitBranch',
				path: '/flow-tools',
				type: 'submenu',
			},
			{
				id: 'debug-tools',
				label: 'Debug Tools',
				icon: 'FiEye',
				path: '/debug-tools',
				type: 'submenu',
			},
			{
				id: 'utilities',
				label: 'Utilities',
				icon: 'FiTool',
				path: '/utilities',
				type: 'submenu',
			},
		],
	},
	{
		id: 'documentation-learning',
		label: 'Documentation & Learning',
		icon: 'FiBook',
		type: 'menu',
		priority: 'low',
		children: [
			{
				id: 'api-documentation',
				label: 'API Documentation',
				icon: 'FiFileText',
				path: '/docs/api',
				type: 'submenu',
			},
			{
				id: 'flow-guides',
				label: 'Flow Guides',
				icon: 'FiBookOpen',
				path: '/docs/flows',
				type: 'submenu',
			},
			{
				id: 'reference-materials',
				label: 'Reference Materials',
				icon: 'FiDatabase',
				path: '/docs/reference',
				type: 'submenu',
			},
			{
				id: 'ai-resources',
				label: 'AI Resources',
				icon: 'FiZap',
				path: '/docs/ai',
				type: 'submenu',
			},
		],
	},
];

const DragDropSidebarV3: React.FC = () => {
	const [menuData] = useState<MenuItem[]>(MENU_DATA);
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
	const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
	const [dragOverItem, setDragOverItem] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [sidebarWidth, setSidebarWidth] = useState(280);
	const [isResizing, setIsResizing] = useState(false);
	const [dropZone, setDropZone] = useState<string | null>(null);

	const location = useLocation();
	const sidebarRef = useRef<HTMLDivElement>(null);
	const resizeHandleRef = useRef<HTMLDivElement>(null);

	// Handle sidebar resizing
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		setIsResizing(true);
	}, []);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isResizing || !sidebarRef.current) return;

			const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
			if (newWidth >= 200 && newWidth <= 600) {
				setSidebarWidth(newWidth);
			}
		},
		[isResizing]
	);

	const handleMouseUp = useCallback(() => {
		setIsResizing(false);
	}, []);

	useEffect(() => {
		if (isResizing) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [isResizing, handleMouseMove, handleMouseUp]);

	// Filter menu items based on search
	const filteredMenuData = useMemo(() => {
		if (!searchTerm) return menuData;

		const filterItems = (items: MenuItem[]): MenuItem[] => {
			return items
				.filter((item) => item.label.toLowerCase().includes(searchTerm.toLowerCase()))
				.map((item) => ({
					...item,
					children: item.children ? filterItems(item.children) : undefined,
				}));
		};

		return filterItems(menuData);
	}, [menuData, searchTerm]);

	// Toggle expanded items
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
	const handleDragStart = useCallback(
		(e: React.DragEvent, item: MenuItem, index: number, parentType?: string) => {
			setDraggedItem({
				id: item.id,
				type: parentType || 'root',
				index,
			});
			e.dataTransfer.effectAllowed = 'move';
		},
		[]
	);

	const handleDragOver = useCallback((e: React.DragEvent, targetId: string, targetType: string) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		setDragOverItem(targetId);
		setDropZone(targetType);
	}, []);

	const handleDragLeave = useCallback(() => {
		setDragOverItem(null);
		setDropZone(null);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent, targetId: string, targetType: string) => {
			e.preventDefault();
			setDragOverItem(null);
			setDropZone(null);

			if (!draggedItem) return;

			// Handle reordering logic here
			console.log('Dropped', draggedItem.id, 'onto', targetId, 'type:', targetType);
			// TODO: Implement actual reordering logic
		},
		[draggedItem]
	);

	const handleDragEnd = useCallback(() => {
		setDraggedItem(null);
		setDragOverItem(null);
		setDropZone(null);
	}, []);

	// Clear search
	const clearSearch = useCallback(() => {
		setSearchTerm('');
	}, []);

	// Handle search
	const handleSearch = useCallback(() => {
		console.log('Searching for:', searchTerm);
		// TODO: Implement search functionality
	}, [searchTerm]);

	// Get background color based on type
	const getBackgroundClass = useCallback((type: string): string => {
		switch (type) {
			case 'menu':
				return 'ping-bg-menu';
			case 'submenu':
				return 'ping-bg-submenu';
			case 'component':
				return 'ping-bg-component';
			default:
				return 'ping-bg-default';
		}
	}, []);

	// Render menu item
	const renderMenuItem = useCallback(
		(item: MenuItem, index: number, parentType?: string) => {
			const isExpanded = expandedItems.has(item.id);
			const isDraggedOver = dragOverItem === item.id;
			const hasChildren = item.children && item.children.length > 0;
			const isActive = location.pathname === item.path;

			return (
				<div
					key={item.id}
					className={`
					ping-menu-item 
					${getBackgroundClass(item.type)}
					${isDraggedOver ? 'ping-menu-item--drag-over' : ''}
					${isActive ? 'ping-menu-item--active' : ''}
				`}
					draggable
					onDragStart={(e) => handleDragStart(e, item, index, parentType)}
					onDragOver={(e) => handleDragOver(e, item.id, item.type)}
					onDragLeave={handleDragLeave}
					onDrop={(e) => handleDrop(e, item.id, item.type)}
					onDragEnd={handleDragEnd}
				>
					<div className="ping-menu-item-content">
						<div className="ping-menu-item-left">
							<MDIIcon icon={item.icon} size={16} ariaLabel={`${item.label} icon`} />
							<span className="ping-menu-item-label">{item.label}</span>
						</div>

						{hasChildren && (
							<button
								className="ping-menu-item-expand"
								onClick={() => toggleExpanded(item.id)}
								aria-label={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
							>
								<MDIIcon
									icon="FiChevronDown"
									size={12}
									ariaLabel={isExpanded ? 'Collapse' : 'Expand'}
								/>
							</button>
						)}
					</div>

					{isExpanded && hasChildren && (
						<div className="ping-menu-children">
							{item.children!.map((child, childIndex) =>
								renderMenuItem(child, childIndex, item.type)
							)}
						</div>
					)}
				</div>
			);
		},
		[
			expandedItems,
			dragOverItem,
			location.pathname,
			handleDragStart,
			handleDragOver,
			handleDragLeave,
			handleDrop,
			handleDragEnd,
			toggleExpanded,
			getBackgroundClass,
		]
	);

	return (
		<div
			className="end-user-nano"
			style={{
				width: `${sidebarWidth}px`,
				minWidth: '200px',
				maxWidth: '600px',
			}}
		>
			<div ref={sidebarRef} className="ping-sidebar ping-sidebar--v3" style={{ width: '100%' }}>
				{/* Header with Search */}
				<div className="ping-sidebar-header">
					<h2 className="ping-sidebar-title">MasterFlow API</h2>

					{/* Search Box */}
					<div className="ping-search-container">
						<div className="ping-search-input-wrapper">
							<MDIIcon icon="FiSearch" size={16} ariaLabel="Search" />
							<input
								type="text"
								className="ping-search-input"
								placeholder="Search menu..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
							/>
							{searchTerm && (
								<button
									className="ping-search-clear"
									onClick={clearSearch}
									aria-label="Clear search"
								>
									<MDIIcon icon="FiX" size={14} ariaLabel="Clear" />
								</button>
							)}
						</div>
						<button className="ping-search-button" onClick={handleSearch} aria-label="Search">
							<MDIIcon icon="FiSearch" size={14} ariaLabel="Search" />
							<span>Search</span>
						</button>
					</div>
				</div>

				{/* Menu Items */}
				<div className="ping-sidebar-content">
					{filteredMenuData.map((item, index) => renderMenuItem(item, index))}
				</div>

				{/* Resize Handle */}
				<div
					ref={resizeHandleRef}
					className="ping-sidebar-resize-handle"
					onMouseDown={handleMouseDown}
					aria-label="Resize sidebar"
				>
					<div className="ping-sidebar-resize-grip"></div>
				</div>
			</div>

			{/* Drop Zone Indicator */}
			{dropZone && (
				<div className={`ping-drop-zone ping-drop-zone--${dropZone}`}>
					<div className="ping-drop-zone-indicator">
						<MDIIcon icon="FiMove" size={20} ariaLabel="Drop zone" />
						<span>Drop {draggedItem?.type} here</span>
					</div>
				</div>
			)}

			{/* CSS Variables and Styles */}
			<style jsx>{`
				/* Ping UI Variables */
				:root {
					--ping-transition-fast: 0.15s ease-in-out;
					--ping-transition-normal: 0.3s ease-in-out;
					
					/* Background Colors for Hierarchy */
					--ping-bg-menu: rgba(249, 250, 251, 0.8);
					--ping-bg-submenu: rgba(243, 244, 246, 0.6);
					--ping-bg-component: rgba(229, 231, 235, 0.4);
					--ping-bg-default: rgba(255, 255, 255, 1);
					
					/* Border Colors */
					--ping-border-menu: rgba(229, 231, 235, 0.8);
					--ping-border-submenu: rgba(209, 213, 219, 0.6);
					--ping-border-component: rgba(156, 163, 175, 0.4);
					
					/* Text Colors */
					--ping-text-primary: #111827;
					--ping-text-secondary: #6b7280;
					--ping-text-muted: #9ca3af;
					
					/* Accent Colors */
					--ping-primary: #3b82f6;
					--ping-primary-hover: #2563eb;
					--ping-primary-light: #dbeafe;
					
					/* Drag & Drop Colors */
					--ping-drag-over: rgba(59, 130, 246, 0.1);
					--ping-drop-zone: rgba(34, 197, 94, 0.2);
					--ping-drop-border: #22c55e;
				}

				/* Sidebar Container */
				.ping-sidebar {
					background: white;
					border: 1px solid var(--ping-border-menu);
					border-radius: 8px;
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
					display: flex;
					flex-direction: column;
					height: 100vh;
					position: relative;
					transition: width var(--ping-transition-normal);
				}

				/* Header */
				.ping-sidebar-header {
					padding: 1rem;
					border-bottom: 1px solid var(--ping-border-menu);
					background: var(--ping-bg-menu);
				}

				.ping-sidebar-title {
					font-size: 1.125rem;
					font-weight: 600;
					color: var(--ping-text-primary);
					margin: 0 0 1rem 0;
				}

				/* Search */
				.ping-search-container {
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
				}

				.ping-search-input-wrapper {
					position: relative;
					display: flex;
					align-items: center;
					gap: 0.5rem;
				}

				.ping-search-input {
					flex: 1;
					padding: 0.5rem 0.75rem;
					border: 1px solid var(--ping-border-submenu);
					border-radius: 6px;
					font-size: 0.875rem;
					background: white;
					color: var(--ping-text-primary);
					transition: all var(--ping-transition-fast);
				}

				.ping-search-input:focus {
					outline: none;
					border-color: var(--ping-primary);
					box-shadow: 0 0 0 2px var(--ping-primary-light);
				}

				.ping-search-clear {
					position: absolute;
					right: 0.5rem;
					background: none;
					border: none;
					color: var(--ping-text-muted);
					cursor: pointer;
					padding: 0.25rem;
					border-radius: 4px;
					transition: all var(--ping-transition-fast);
				}

				.ping-search-clear:hover {
					background: var(--ping-bg-component);
					color: var(--ping-text-secondary);
				}

				.ping-search-button {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					padding: 0.5rem 0.75rem;
					background: var(--ping-primary);
					color: white;
					border: none;
					border-radius: 6px;
					font-size: 0.875rem;
					font-weight: 500;
					cursor: pointer;
					transition: all var(--ping-transition-fast);
				}

				.ping-search-button:hover {
					background: var(--ping-primary-hover);
				}

				/* Content */
				.ping-sidebar-content {
					flex: 1;
					overflow-y: auto;
					padding: 0.5rem;
				}

				/* Menu Items */
				.ping-menu-item {
					border-radius: 6px;
					margin-bottom: 0.25rem;
					transition: all var(--ping-transition-fast);
					cursor: move;
				}

				.ping-menu-item:hover {
					transform: translateX(2px);
				}

				.ping-menu-item--drag-over {
					background: var(--ping-drag-over);
					border: 2px dashed var(--ping-primary);
				}

				.ping-menu-item--active {
					background: var(--ping-primary-light);
					border-left: 3px solid var(--ping-primary);
				}

				/* Background Classes */
				.ping-bg-menu {
					background: var(--ping-bg-menu);
					border: 1px solid var(--ping-border-menu);
				}

				.ping-bg-submenu {
					background: var(--ping-bg-submenu);
					border: 1px solid var(--ping-border-submenu);
				}

				.ping-bg-component {
					background: var(--ping-bg-component);
					border: 1px solid var(--ping-border-component);
				}

				.ping-menu-item-content {
					display: flex;
					align-items: center;
					justify-content: space-between;
					padding: 0.75rem 1rem;
				}

				.ping-menu-item-left {
					display: flex;
					align-items: center;
					gap: 0.75rem;
				}

				.ping-menu-item-label {
					font-size: 0.875rem;
					font-weight: 500;
					color: var(--ping-text-primary);
				}

				.ping-menu-item-expand {
					background: none;
					border: none;
					color: var(--ping-text-muted);
					cursor: pointer;
					padding: 0.25rem;
					border-radius: 4px;
					transition: all var(--ping-transition-fast);
				}

				.ping-menu-item-expand:hover {
					background: var(--ping-bg-component);
					color: var(--ping-text-secondary);
				}

				/* Children */
				.ping-menu-children {
					margin-left: 1rem;
					margin-top: 0.25rem;
					border-left: 2px solid var(--ping-border-submenu);
					padding-left: 0.5rem;
				}

				/* Resize Handle */
				.ping-sidebar-resize-handle {
					position: absolute;
					right: -3px;
					top: 0;
					bottom: 0;
					width: 6px;
					background: transparent;
					cursor: col-resize;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.ping-sidebar-resize-handle:hover {
					background: var(--ping-primary-light);
				}

				.ping-sidebar-resize-grip {
					width: 2px;
					height: 20px;
					background: var(--ping-border-menu);
					border-radius: 1px;
					opacity: 0.5;
					transition: opacity var(--ping-transition-fast);
				}

				.ping-sidebar-resize-handle:hover .ping-sidebar-resize-grip {
					opacity: 1;
					background: var(--ping-primary);
				}

				/* Drop Zone */
				.ping-drop-zone {
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background: var(--ping-drop-zone);
					border: 2px dashed var(--ping-drop-border);
					border-radius: 8px;
					display: flex;
					align-items: center;
					justify-content: center;
					pointer-events: none;
					z-index: 1000;
				}

				.ping-drop-zone-indicator {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 0.5rem;
					color: var(--ping-primary);
					font-weight: 500;
				}

				/* Responsive */
				@media (max-width: 768px) {
					.ping-sidebar {
						width: 100% !important;
						max-width: 100% !important;
					}
					
					.ping-sidebar-resize-handle {
						display: none;
					}
				}
			`}</style>
		</div>
	);
};

export default DragDropSidebarV3;
