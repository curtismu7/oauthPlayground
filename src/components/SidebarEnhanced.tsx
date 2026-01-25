/**
 * SidebarEnhanced - Complete enhanced sidebar with Phase 2 UX improvements
 * Phase 2: User Experience Enhancement
 * 
 * Combines all Phase 2 features:
 * - Keyboard navigation
 * - Mobile touch gestures
 * - Context menus
 * - Accessibility improvements
 * - Enhanced visual feedback
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { KeyboardNavigationProvider, useKeyboardShortcuts } from './sidebar/KeyboardNavigationProvider';
import { MobileOptimizationProvider } from './sidebar/MobileOptimizationProvider';
import { ContextMenuProvider } from './sidebar/ContextMenuProvider';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarSearch from './SidebarSearch';
import SidebarMenuEnhanced from './sidebar/SidebarMenuEnhanced';
import { useMenuPersistence, type MenuGroup } from './sidebar/MenuPersistence';

// Styled components
const SidebarContainer = styled.div<{ $isOpen: boolean; $width: number; $isMobile: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	height: 100vh;
	width: ${(props) => (props.$isOpen ? (props.$isMobile ? '100%' : `${props.$width}px`) : '0')};
	background: white;
	box-shadow: ${(props) => (props.$isMobile ? 'none' : '2px 0 10px rgba(0, 0, 0, 0.1)')};
	z-index: 1000;
	transition: width 0.3s ease, transform 0.3s ease;
	overflow: hidden;
	transform: ${(props) => (props.$isOpen ? 'translateX(0)' : 'translateX(-100%)')};

	@media (max-width: 767px) {
		width: 100%;
		transform: ${(props) => (props.$isOpen ? 'translateX(0)' : 'translateX(-100%)')};
	}
`;

const ResizeHandle = styled.div<{ $isVisible: boolean }>`
	position: absolute;
	top: 0;
	right: 0;
	width: 4px;
	height: 100%;
	background: #e5e7eb;
	cursor: col-resize;
	transition: background 0.2s ease;
	display: ${(props) => (props.$isVisible ? 'block' : 'none')};

	&:hover {
		background: #3b82f6;
	}

	@media (max-width: 767px) {
		display: none;
	}
`;

const Overlay = styled.div<{ $isOpen: boolean; $isMobile: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background: rgba(0, 0, 0, 0.5);
	z-index: 999;
	opacity: ${(props) => (props.$isOpen ? 1 : 0)};
	visibility: ${(props) => (props.$isOpen ? 'visible' : 'hidden')};
	transition: opacity 0.3s ease, visibility 0.3s ease;
	display: ${(props) => (props.$isMobile ? 'block' : 'none')};
`;

const DragModeBanner = styled.div<{ $isMobile: boolean }>`
	margin-bottom: ${(props) => (props.$isMobile ? '0.5rem' : '1rem')};
	padding: ${(props) => (props.$isMobile ? '0.75rem' : '1rem')};
	background-color: #dcfce7;
	border-radius: ${(props) => (props.$isMobile ? '0.375rem' : '0.5rem')};
	border: 2px solid #22c55e;
	box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
`;

interface SidebarEnhancedProps {
	isOpen: boolean;
	onClose: () => void;
	initialWidth?: number;
	minWidth?: number;
	maxWidth?: number;
}

const SidebarEnhanced: React.FC<SidebarEnhancedProps> = ({
	isOpen,
	onClose,
	initialWidth = 450,
	minWidth = 300,
	maxWidth = 600,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	
	const [sidebarWidth, setSidebarWidth] = useState(() => {
		// Load saved width from localStorage
		try {
			const saved = localStorage.getItem('sidebar.width');
			const parsed = saved ? parseInt(saved, 10) : NaN;
			if (Number.isFinite(parsed) && parsed >= minWidth && parsed <= maxWidth) {
				return parsed;
			}
		} catch {
			// Ignore errors
		}
		return initialWidth;
	});

	const [isDragDropMode, setIsDragDropMode] = useState(() => {
		// Load drag mode state from localStorage
		try {
			const saved = localStorage.getItem('sidebar.dragDropMode');
			return saved === 'true';
		} catch {
			return false;
		}
	});

	const [searchQuery, setSearchQuery] = useState('');
	const [matchAnywhere, setMatchAnywhere] = useState(false);

	// Load menu groups from persistence
	const { loadMenuLayout, saveMenuLayout } = useMenuPersistence();
	
	// Default menu structure
	const defaultMenuGroups: MenuGroup[] = useMemo(() => [
		{
			id: 'v8-flows-new',
			label: 'Production',
			icon: null, // Will be set in render
			isOpen: true,
			items: [
				{
					id: 'unified-oauth-flow-v8u',
					path: '/v8u/unified',
					label: 'Unified OAuth & OIDC',
					icon: null,
					badge: null, // Will be set in render
				},
				{
					id: 'spiffe-spire-flow-v8u',
					path: '/v8u/spiffe-spire',
					label: 'SPIFFE/SPIRE Mock',
					icon: null,
					badge: null,
				},
				{
					id: 'mfa-playground-v8',
					path: '/v8/mfa',
					label: 'PingOne MFA',
					icon: null,
					badge: null,
				},
				{
					id: 'delete-all-devices-utility-v8',
					path: '/v8/delete-all-devices',
					label: 'Delete All Devices',
					icon: null,
					badge: null,
				},
				{
					id: 'postman-collection-generator',
					path: '/postman-collection-generator',
					label: 'Postman Collection Generator',
					icon: null,
					badge: null,
				},
				{
					id: 'resources-api-v8',
					path: '/v8/resources-api',
					label: 'Resources API Tutorial',
					icon: null,
					badge: null,
				},
				{
					id: 'enhanced-state-management',
					path: '/v8u/enhanced-state-management',
					label: 'Enhanced State Management (V2)',
					icon: null,
					badge: null,
				},
			],
		},
		{
			id: 'security-management',
			label: 'Security & Management',
			icon: null,
			isOpen: false,
			items: [
				{
					id: 'feature-flags-admin',
					path: '/admin/feature-flags',
					label: '⚙️ Feature Flags Admin',
					icon: null,
					badge: null,
				},
				{
					id: 'token-monitoring-dashboard',
					path: '/v8u/token-monitoring',
					label: '🔍 Token Monitoring',
					icon: null,
					badge: null,
				},
				{
					id: 'security-audit-log',
					path: '/admin/security-audit',
					label: '📋 Security Audit Log',
					icon: null,
					badge: null,
				},
			],
		},
		// ... other groups would be added here
	], []);

	// Initialize menu groups
	const [menuGroups, setMenuGroups] = useState<MenuGroup[]>(() => {
		return loadMenuLayout(defaultMenuGroups) || defaultMenuGroups;
	});

	// Handle search
	const handleSearch = useCallback((query: string) => {
		setSearchQuery(query);
	}, []);

	// Handle section toggle
	const handleSectionToggle = useCallback((groupId: string) => {
		setMenuGroups((prevGroups) =>
			prevGroups.map((group) =>
				group.id === groupId ? { ...group, isOpen: !group.isOpen } : group
			)
		);
		saveMenuLayout(menuGroups);
	}, [menuGroups, saveMenuLayout]);

	// Handle item activation (for keyboard navigation)
	const handleActivateItem = useCallback((groupId: string, itemIndex: number) => {
		const group = menuGroups.find(g => g.id === groupId);
		if (group && group.items[itemIndex]) {
			const item = group.items[itemIndex];
			navigate(item.path || '');
		}
	}, [menuGroups, navigate]);

	// Handle drag mode toggle
	const toggleDragDropMode = useCallback(() => {
		const newMode = !isDragDropMode;
		setIsDragDropMode(newMode);

		// Save to localStorage
		try {
			localStorage.setItem('sidebar.dragDropMode', newMode.toString());
		} catch {
			// Ignore errors
		}

		// Show toast notification
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
			if (newWidth >= minWidth && newWidth <= maxWidth) {
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
	}, [sidebarWidth, minWidth, maxWidth]);

	// Handle overlay click
	const handleOverlayClick = useCallback(() => {
		onClose();
	}, [onClose]);

	// Handle escape key
	const handleEscape = useCallback(() => {
		if (isOpen) {
			onClose();
		}
	}, [isOpen, onClose]);

	// Keyboard shortcuts
	useKeyboardShortcuts({
		'ctrl+b': toggleDragDropMode,
		'escape': handleEscape,
		'ctrl+f': () => {
			// Focus search input
			const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
			searchInput?.focus();
		},
	});

	// Load sidebar width from localStorage on mount
	useEffect(() => {
		try {
			const saved = localStorage.getItem('sidebar.width');
			const parsed = saved ? parseInt(saved, 10) : NaN;
			if (Number.isFinite(parsed) && parsed >= minWidth && parsed <= maxWidth) {
				setSidebarWidth(parsed);
			}
		} catch {
			// Ignore errors
		}
	}, [minWidth, maxWidth]);

	// Check if mobile
	const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

	return (
		<>
			<Overlay $isOpen={isOpen} $isMobile={isMobile} onClick={handleOverlayClick} />
			<SidebarContainer $isOpen={isOpen} $width={sidebarWidth} $isMobile={isMobile}>
				<ResizeHandle $isVisible={!isMobile} onMouseDown={handleMouseDown} />
				
				<KeyboardNavigationProvider onEscape={handleEscape} onActivate={handleActivateItem}>
					<MobileOptimizationProvider
						onSwipeLeft={isMobile ? onClose : undefined}
						onSwipeRight={undefined}
					>
						<ContextMenuProvider>
							<SidebarHeader
								isOpen={isOpen}
								onClose={onClose}
								isDragDropMode={isDragDropMode}
								onToggleDragMode={toggleDragDropMode}
							/>
							
							<SidebarSearch
								onSearch={handleSearch}
								activeSearchQuery={searchQuery}
								matchAnywhere={matchAnywhere}
								onMatchAnywhereChange={setMatchAnywhere}
							/>
							
							{isDragDropMode && (
								<DragModeBanner $isMobile={isMobile}>
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
										<div>
											<strong style={{ color: '#166534' }}>🎯 Drag & Drop Mode Active:</strong>
											<div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: '#166534', marginTop: '0.25rem' }}>
												Drag items to reorder • Green zones show drop areas
											</div>
										</div>
									</div>
								</DragModeBanner>
							)}

							<SidebarMenuEnhanced
								dragMode={isDragDropMode}
								searchQuery={searchQuery}
								matchAnywhere={matchAnywhere}
								menuGroups={menuGroups}
								onToggleSection={handleSectionToggle}
								onActivateItem={handleActivateItem}
							/>
						</ContextMenuProvider>
					</MobileOptimizationProvider>
				</KeyboardNavigationProvider>
			</SidebarContainer>
		</>
	);
};

export default SidebarEnhanced;
