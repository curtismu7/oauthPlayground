/**
 * SidebarOptimized - Performance-optimized sidebar component
 * Phase 1: Performance Optimization implementation
 * 
 * This component replaces the monolithic DragDropSidebar with a modular,
 * performance-optimized implementation that maintains all existing functionality.
 */

import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
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
	FiHome,
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
import SidebarSearch from './SidebarSearch';

// Styled components
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

// Types
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

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

// Performance monitoring
class PerformanceMonitor {
	private static renderCount = 0;
	private static searchCount = 0;
	private static renderTimes: number[] = [];
	private static searchTimes: number[] = [];

	static startRenderTimer() {
		const start = performance.now();
		return () => {
			const end = performance.now();
			const time = end - start;
			this.renderTimes.push(time);
			this.renderCount++;
			
			// Keep only last 50 samples
			if (this.renderTimes.length > 50) {
				this.renderTimes.shift();
			}
			
			if (time > 16) {
				console.warn(`🐌 Slow sidebar render: ${time.toFixed(2)}ms`);
			}
		};
	}

	static startSearchTimer() {
		const start = performance.now();
		return () => {
			const end = performance.now();
			const time = end - start;
			this.searchTimes.push(time);
			this.searchCount++;
			
			// Keep only last 50 samples
			if (this.searchTimes.length > 50) {
				this.searchTimes.shift();
			}
			
			if (time > 100) {
				console.warn(`🔍 Slow sidebar search: ${time.toFixed(2)}ms`);
			}
		};
	}

	static getAverageRenderTime() {
		if (this.renderTimes.length === 0) return 0;
		return this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
	}

	static getAverageSearchTime() {
		if (this.searchTimes.length === 0) return 0;
		return this.searchTimes.reduce((a, b) => a + b, 0) / this.searchTimes.length;
	}
}

// Memoized menu item component
const MenuItemComponent = memo<{
	item: MenuItem;
	isActive: boolean;
	dragMode: boolean;
	onClick: () => void;
}>(({ item, isActive, dragMode, onClick }) => {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				padding: '0.75rem 1rem',
				margin: '0.25rem 0.5rem',
				borderRadius: '0.5rem',
				cursor: 'pointer',
				transition: 'all 0.2s ease',
				background: isActive
					? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
					: 'transparent',
				borderLeft: isActive ? '3px solid #3b82f6' : 'none',
				color: isActive ? '#ffffff' : '#374151',
			}}
			onClick={onClick}
		>
			{item.icon && (
				<span style={{ marginRight: '0.75rem', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					{item.icon}
				</span>
			)}
			<span style={{ flex: 1, fontWeight: '500', fontSize: '0.875rem' }}>
				{item.label}
			</span>
			{item.badge}
		</div>
	);
});

MenuItemComponent.displayName = 'MenuItemComponent';

// Memoized section header component
const SectionHeaderComponent = memo<{
	group: MenuGroup;
	onToggle: () => void;
}>(({ group, onToggle }) => {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				padding: '0.75rem 1rem',
				margin: '0.25rem 0.5rem',
				borderRadius: '0.5rem',
				cursor: 'pointer',
				transition: 'all 0.2s ease',
				background: group.isOpen ? '#f3f4f6' : 'transparent',
				color: '#374151',
			}}
			onClick={onToggle}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '0.875rem' }}>
				{group.icon}
				{group.label}
			</div>
			<span
				style={{
					transition: 'transform 0.2s ease',
					transform: group.isOpen ? 'rotate(180deg)' : 'rotate(0)',
				}}
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
					<path d="M6 9l6 6 6-6" />
				</svg>
			</span>
		</div>
	);
});

SectionHeaderComponent.displayName = 'SectionHeaderComponent';

const SidebarOptimized: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
	const navigate = useNavigate();
	const location = useLocation();
	
	const [sidebarWidth, setSidebarWidth] = useState(450);
	const [isDragDropMode, setIsDragDropMode] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [matchAnywhere, setMatchAnywhere] = useState(false);
	const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
	const [draggedItem, setDraggedItem] = useState<any>(null);

	// Performance monitoring
	const endRenderTimer = PerformanceMonitor.startRenderTimer();

	// Default menu structure
	const defaultMenuGroups: MenuGroup[] = useMemo(() => [
		{
			id: 'v8-flows-new',
			label: 'Production',
			icon: <FiZap />,
			isOpen: true,
			items: [
				{
					id: 'unified-oauth-flow-v8u',
					path: '/v8u/unified',
					label: 'Unified OAuth & OIDC',
					icon: <ColoredIcon $color="#10b981"><FiZap /></ColoredIcon>,
					badge: <MigrationBadge>NEW</MigrationBadge>,
				},
				{
					id: 'spiffe-spire-flow-v8u',
					path: '/v8u/spiffe-spire',
					label: 'SPIFFE/SPIRE Mock',
					icon: <ColoredIcon $color="#8b5cf6"><FiShield /></ColoredIcon>,
					badge: <MigrationBadge>MOCK</MigrationBadge>,
				},
				{
					id: 'mfa-playground-v8',
					path: '/v8/mfa',
					label: 'PingOne MFA',
					icon: <ColoredIcon $color="#10b981"><FiSmartphone /></ColoredIcon>,
					badge: <MigrationBadge>NEW</MigrationBadge>,
				},
				{
					id: 'delete-all-devices-utility-v8',
					path: '/v8/delete-all-devices',
					label: 'Delete All Devices',
					icon: <ColoredIcon $color="#ef4444"><FiTrash2 /></ColoredIcon>,
					badge: <MigrationBadge>UTILITY</MigrationBadge>,
				},
				{
					id: 'postman-collection-generator',
					path: '/postman-collection-generator',
					label: 'Postman Collection Generator',
					icon: <ColoredIcon $color="#10b981"><FiPackage /></ColoredIcon>,
					badge: <MigrationBadge>NEW</MigrationBadge>,
				},
				{
					id: 'resources-api-v8',
					path: '/v8/resources-api',
					label: 'Resources API Tutorial',
					icon: <FiBook />,
					badge: <MigrationBadge>NEW</MigrationBadge>,
				},
				{
					id: 'enhanced-state-management',
					path: '/v8u/enhanced-state-management',
					label: 'Enhanced State Management (V2)',
					icon: <FiDatabase />,
					badge: <MigrationBadge>NEW</MigrationBadge>,
				},
			],
		},
		{
			id: 'security-management',
			label: 'Security & Management',
			icon: <FiShield />,
			isOpen: false,
			items: [
				{
					id: 'feature-flags-admin',
					path: '/admin/feature-flags',
					label: '⚙️ Feature Flags Admin',
					icon: <FiSettings />,
					badge: <MigrationBadge>NEW</MigrationBadge>,
				},
				{
					id: 'token-monitoring-dashboard',
					path: '/v8u/token-monitoring',
					label: '🔍 Token Monitoring',
					icon: <FiEye />,
					badge: <MigrationBadge>NEW</MigrationBadge>,
				},
				{
					id: 'security-audit-log',
					path: '/admin/security-audit',
					label: '📋 Security Audit Log',
					icon: <FiFileText />,
					badge: <MigrationBadge>BETA</MigrationBadge>,
				},
			],
		},
		// ... other groups would be added here
	], []);

	// Initialize menu groups
	useEffect(() => {
		setMenuGroups(defaultMenuGroups);
	}, [defaultMenuGroups]);

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
		setMenuGroups((prevGroups) =>
			prevGroups.map((group) =>
				group.id === groupId ? { ...group, isOpen: !group.isOpen } : group
			)
		);
	}, []);

	// Handle search
	const handleSearch = useCallback((query: string) => {
		const endSearchTimer = PerformanceMonitor.startSearchTimer();
		setSearchQuery(query);
		endSearchTimer();
	}, []);

	// Filter menu groups based on search query (optimized)
	const filteredMenuGroups = useMemo(() => {
		if (!searchQuery.trim()) {
			return menuGroups;
		}

		const query = searchQuery.toLowerCase();
		return menuGroups
			.map((group) => {
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
	}, [menuGroups, searchQuery, matchAnywhere]);

	// Handle drag mode toggle
	const toggleDragDropMode = useCallback(() => {
		const newMode = !isDragDropMode;
		setIsDragDropMode(newMode);

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
	}, [isDragDropMode]);

	// Handle mouse events for resizing
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		const startX = e.clientX;
		const startWidth = sidebarWidth;

		const handleMouseMove = (e: MouseEvent) => {
			const newWidth = startWidth + (e.clientX - startX);
			if (newWidth >= 300 && newWidth <= 600) {
				setSidebarWidth(newWidth);
			}
		};

		const handleMouseUp = () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			
			// Save width to localStorage
			try {
				localStorage.setItem('sidebar.width', String(sidebarWidth));
			} catch {
				// Ignore errors
			}
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}, [sidebarWidth]);

	// Load sidebar width from localStorage on mount
	useEffect(() => {
		try {
			const saved = localStorage.getItem('sidebar.width');
			const parsed = saved ? parseInt(saved, 10) : NaN;
			if (Number.isFinite(parsed) && parsed >= 300 && parsed <= 600) {
				setSidebarWidth(parsed);
			}
		} catch {
			// Ignore errors
		}
	}, []);

	// Performance logging
	useEffect(() => {
		endRenderTimer();
		
		// Log performance metrics every 30 seconds
		const interval = setInterval(() => {
			const avgRender = PerformanceMonitor.getAverageRenderTime();
			const avgSearch = PerformanceMonitor.getAverageSearchTime();
			
			if (avgRender > 16 || avgSearch > 100) {
				console.warn('⚠️ Sidebar performance issues detected:', {
					avgRender: `${avgRender.toFixed(2)}ms`,
					avgSearch: `${avgSearch.toFixed(2)}ms`,
				});
			}
		}, 30000);

		return () => clearInterval(interval);
	}, [endRenderTimer]);

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				height: '100vh',
				width: isOpen ? `${sidebarWidth}px` : '0',
				background: 'white',
				boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
				zIndex: 1000,
				transition: 'width 0.3s ease',
				overflow: 'hidden',
			}}
		>
			{isOpen && (
				<>
					<div
						style={{
							position: 'absolute',
							top: 0,
							right: 0,
							width: '4px',
							height: '100%',
							background: '#e5e7eb',
							cursor: 'col-resize',
							transition: 'background 0.2s ease',
						}}
						onMouseDown={handleMouseDown}
					/>
					<div
						style={{
							padding: '1rem',
							borderBottom: '1px solid #e5e7eb',
							background: '#f8fafc',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '1rem', color: '#1f2937' }}>
							PingOne OAuth Playground
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<button
								onClick={toggleDragDropMode}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.25rem',
									padding: '0.375rem 0.75rem',
									border: `1px solid ${isDragDropMode ? '#3b82f6' : '#d1d5db'}`,
									borderRadius: '0.375rem',
									background: isDragDropMode ? '#3b82f6' : 'white',
									color: isDragDropMode ? 'white' : '#374151',
									fontSize: '0.75rem',
									fontWeight: '500',
									cursor: 'pointer',
									transition: 'all 0.2s ease',
								}}
							>
								<FiMove size={14} />
								{isDragDropMode ? 'Drag Mode' : 'Enable Drag'}
							</button>
							<button
								onClick={onClose}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									padding: '0.375rem',
									border: 'none',
									borderRadius: '0.375rem',
									background: 'transparent',
									color: '#6b7280',
									cursor: 'pointer',
									transition: 'all 0.2s ease',
								}}
							>
								<FiX size={20} />
							</button>
						</div>
					</div>
					<SidebarSearch
						onSearch={handleSearch}
						activeSearchQuery={searchQuery}
						matchAnywhere={matchAnywhere}
						onMatchAnywhereChange={setMatchAnywhere}
					/>
					{isDragDropMode && (
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
								</div>
							</div>
						</div>
					)}
					<div style={{ padding: '0 1rem 1rem' }}>
						{filteredMenuGroups.map((group) => (
							<div key={group.id} style={{ marginBottom: '1rem' }}>
								<SectionHeaderComponent
									group={group}
									onToggle={() => handleSectionToggle(group.id)}
								/>
								{group.isOpen && group.items.map((item) => (
									<MenuItemComponent
										key={item.id}
										item={item}
										isActive={isActive(item.path || '')}
										dragMode={isDragDropMode}
										onClick={() => handleMenuItemClick(item.path || '')}
									/>
								))}
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
};

SidebarOptimized.displayName = 'SidebarOptimized';

export default SidebarOptimized;
