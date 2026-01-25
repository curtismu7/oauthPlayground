/**
 * SidebarDeveloper - Complete developer experience sidebar
 * Phase 4: Developer Experience
 * 
 * Combines all Phase 4 features:
 * - Design token system
 * - Plugin architecture
 * - Performance monitoring
 * - API documentation
 * - Developer tools
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { FiBook, FiCode, FiActivity, FiSettings, FiTerminal, FiLayers, FiZap } from 'react-icons/fi';
import { KeyboardNavigationProvider, useKeyboardShortcuts } from './sidebar/KeyboardNavigationProvider';
import { MobileOptimizationProvider } from './sidebar/MobileOptimizationProvider';
import { ContextMenuProvider } from './sidebar/ContextMenuProvider';
import { UserPreferencesProvider } from './sidebar/UserPreferencesProvider';
import { SmartSearchProvider } from './sidebar/SmartSearchProvider';
import { DesignTokenProvider } from './sidebar/DesignTokenProvider';
import { PluginProvider } from './sidebar/PluginProvider';
import { PerformanceProvider } from './sidebar/PerformanceDashboard';
import { DocumentationProvider } from './sidebar/APIDocumentation';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarSearch from './sidebar/SidebarSearch';
import SidebarMenuAdvanced from './sidebar/SidebarMenuAdvanced';
import { PerformanceDashboard } from './sidebar/PerformanceDashboard';
import { APIDocumentationViewer } from './sidebar/APIDocumentation';
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
	transform: ${(props) => (props.$isOpen ? 'translateX(0)' : 'translateX(-100)')};

	@media (max-width: 767px) {
		width: 100%;
		transform: ${(props) => (props.$isOpen ? 'translateX(0)' : 'translateX(-100)')};
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

const DeveloperPanel = styled.div<{ $isMobile: boolean }>`
	margin-bottom: ${(props) => (props.$isMobile ? '0.5rem' : '1rem')};
	padding: ${(props) => (props.$isMobile ? '0.75rem' : '1rem')};
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border-radius: ${(props) => (props.$isMobile ? '0.375rem' : '0.5rem')};
	border: 1px solid #0ea5e9;
`;

const DeveloperHeader = styled.div<{ $isMobile: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: ${(props) => (props.$isMobile ? '0.5rem' : '0.75rem')};
`;

const DeveloperTitle = styled.div<{ $isMobile: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	font-size: ${(props) => (props.$isMobile ? '0.8rem' : '0.875rem')};
	color: #0c4a6e;
`;

const DeveloperActions = styled.div`
	display: flex;
	align-items: center;
	gap: 0.25rem;
`;

const DeveloperButton = styled.button<{ $isMobile: boolean; $active?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: ${(props) => (props.$isMobile ? '0.25rem' : '0.375rem')};
	border: 1px solid #0ea5e9;
	border-radius: ${(props) => (props.$isMobile ? '0.25rem' : '0.375rem')};
	background: ${(props) => (props.$active ? '#0ea5e9' : 'rgba(255, 255, 255, 0.8)')};
	color: ${(props) => (props.$active ? '#ffffff' : '#0c4a6e')};
	cursor: pointer;
	transition: all 0.2s ease;
	font-size: ${(props) => (props.$isMobile ? '12px' : '14px')};

	&:hover {
		background: ${(props) => (props.$active ? '#0284c7' : 'rgba(255, 255, 255, 1)')};
		color: ${(props) => (props.$active ? '#ffffff' : '#0284c7')};
	}

	&:active {
		transform: scale(0.95);
	}
`;

const DeveloperContent = styled.div<{ $isMobile: boolean }>`
	margin-top: ${(props) => (props.$isMobile ? '0.5rem' : '0.75rem')};
	max-height: 400px;
	overflow-y: auto;
`;

interface SidebarDeveloperProps {
	isOpen: boolean;
	onClose: () => void;
	initialWidth?: number;
	minWidth?: number;
	maxWidth?: number;
	enableDeveloperTools?: boolean;
}

const SidebarDeveloper: React.FC<SidebarDeveloperProps> = ({
	isOpen,
	onClose,
	initialWidth = 450,
	minWidth = 300,
	maxWidth = 600,
	enableDeveloperTools = true,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	
	const [sidebarWidth, setSidebarWidth] = useState(() => {
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
		try {
			const saved = localStorage.getItem('sidebar.dragDropMode');
			return saved === 'true';
		} catch {
			return false;
		}
	});

	const [searchQuery, setSearchQuery] = useState('');
	const [matchAnywhere, setMatchAnywhere] = useState(false);
	const [activeDeveloperTool, setActiveDeveloperTool] = useState<'performance' | 'docs' | 'tokens' | 'plugins' | null>(null);

	// Load menu groups from persistence
	const { loadMenuLayout, saveMenuLayout } = useMenuPersistence();
	
	// Default menu structure with developer tools
	const defaultMenuGroups: MenuGroup[] = useMemo(() => [
		{
			id: 'v8-flows-new',
			label: 'Production',
			icon: null,
			isOpen: true,
			items: [
				{
					id: 'unified-oauth-flow-v8u',
					path: '/v8u/unified',
					label: 'Unified OAuth & OIDC',
					icon: null,
					badge: null,
					description: 'Complete OAuth 2.0 and OpenID Connect flow',
					tags: ['oauth', 'oidc', 'unified', 'production'],
				},
				{
					id: 'spiffe-spire-flow-v8u',
					path: '/v8u/spiffe-spire',
					label: 'SPIFFE/SPIRE Mock',
					icon: null,
					badge: null,
					description: 'Mock SPIFFE and SPIRE implementation',
					tags: ['spiffe', 'spire', 'mock', 'production'],
				},
				{
					id: 'mfa-playground-v8',
					path: '/v8/mfa',
					label: 'PingOne MFA',
					icon: null,
					badge: null,
					description: 'Multi-factor authentication flows',
					tags: ['mfa', 'authentication', 'security'],
				},
				{
					id: 'delete-all-devices-utility-v8',
					path: '/v8/delete-all-devices',
					label: 'Delete All Devices',
					icon: null,
					badge: null,
					description: 'Utility for device management',
					tags: ['devices', 'utility', 'management'],
				},
				{
					id: 'postman-collection-generator',
					path: '/postman-collection-generator',
					label: 'Postman Collection Generator',
					icon: null,
					badge: null,
					description: 'Generate Postman collections',
					tags: ['postman', 'api', 'generator'],
				},
				{
					id: 'resources-api-v8',
					path: '/v8/resources-api',
					label: 'Resources API Tutorial',
					icon: null,
					badge: null,
					description: 'Learn about Resources API',
					tags: ['api', 'resources', 'tutorial'],
				},
				{
					id: 'enhanced-state-management',
					path: '/v8u/enhanced-state-management',
					label: 'Enhanced State Management (V2)',
					icon: null,
					badge: null,
					description: 'Advanced state management patterns',
					tags: ['state', 'management', 'v2'],
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
					description: 'Control Phase 1-3 OIDC services rollout',
					tags: ['admin', 'feature-flags', 'security', 'phase1', 'phase2', 'phase3'],
				},
				{
					id: 'token-monitoring-dashboard',
					path: '/v8u/token-monitoring',
					label: '🔍 Token Monitoring',
					icon: null,
					badge: null,
					description: 'Real-time token monitoring and management',
					tags: ['tokens', 'monitoring', 'security', 'dashboard'],
				},
				{
					id: 'security-audit-log',
					path: '/admin/security-audit',
					label: '📋 Security Audit Log',
					icon: null,
					badge: null,
					description: 'Security events and audit trail',
					tags: ['security', 'audit', 'logging', 'compliance'],
				},
			],
		},
		// Developer tools section
		...(enableDeveloperTools ? [{
			id: 'developer-tools',
			label: 'Developer Tools',
			icon: null,
			isOpen: false,
			items: [
				{
					id: 'performance-dashboard',
					path: '/dev/performance',
					label: '📊 Performance Dashboard',
					icon: null,
					badge: null,
					description: 'Real-time performance monitoring and analytics',
					tags: ['performance', 'monitoring', 'analytics', 'developer'],
				},
				{
					id: 'api-documentation',
					path: '/dev/docs',
					label: '📚 API Documentation',
					icon: null,
					badge: null,
					description: 'Interactive API documentation and examples',
					tags: ['api', 'documentation', 'examples', 'developer'],
				},
				{
					id: 'design-tokens',
					path: '/dev/tokens',
					label: '🎨 Design Tokens',
					icon: null,
					badge: null,
					description: 'Design system tokens and theme management',
					tags: ['design', 'tokens', 'theme', 'developer'],
				},
				{
					id: 'plugin-manager',
					path: '/dev/plugins',
					label: '🔌 Plugin Manager',
					icon: null,
					badge: null,
					description: 'Manage sidebar plugins and extensions',
					tags: ['plugins', 'extensions', 'developer', 'tools'],
				},
				{
					id: 'component-playground',
					path: '/dev/playground',
					label: '🛠️ Component Playground',
					icon: null,
					badge: null,
					description: 'Interactive component testing and development',
					tags: ['components', 'testing', 'playground', 'developer'],
				},
			],
		}] : []),
	], [enableDeveloperTools]);

	// Initialize menu groups
	const [menuGroups, setMenuGroups] = useState<MenuGroup[]>(() => {
		const loaded = loadMenuLayout(defaultMenuGroups);
		return loaded || defaultMenuGroups;
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

	// Handle item activation
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

		try {
			localStorage.setItem('sidebar.dragDropMode', newMode.toString());
		} catch {
			// Ignore errors
		}

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

	// Toggle developer tools
	const toggleDeveloperTool = useCallback((tool: typeof activeDeveloperTool) => {
		setActiveDeveloperTool(activeDeveloperTool === tool ? null : tool);
	}, [activeDeveloperTool]);

	// Keyboard shortcuts
	useKeyboardShortcuts({
		'ctrl+b': toggleDragDropMode,
		'escape': handleEscape,
		'ctrl+f': () => {
			const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
			searchInput?.focus();
		},
		'ctrl+d': () => toggleDeveloperTool('performance'),
		'ctrl+shift+d': () => toggleDeveloperTool('docs'),
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

	// Render developer tool content
	const renderDeveloperTool = () => {
		switch (activeDeveloperTool) {
			case 'performance':
				return <PerformanceDashboard />;
			case 'docs':
				return <APIDocumentationViewer />;
			case 'tokens':
				return (
					<div style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
						<h3 style={{ margin: '0 0 1rem 0' }}>Design Tokens</h3>
						<p>Design token viewer coming soon...</p>
					</div>
				);
			case 'plugins':
				return (
					<div style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
						<h3 style={{ margin: '0 0 1rem 0' }}>Plugin Manager</h3>
						<p>Plugin manager coming soon...</p>
					</div>
				);
			default:
				return null;
		}
	};

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
							<UserPreferencesProvider>
								<SmartSearchProvider>
									<DesignTokenProvider>
										<PluginProvider>
											<PerformanceProvider>
												<DocumentationProvider>
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
													
													{enableDeveloperTools && (
														<DeveloperPanel $isMobile={isMobile}>
															<DeveloperHeader $isMobile={isMobile}>
																<DeveloperTitle $isMobile={isMobile}>
																	<FiTerminal />
																	Developer Tools
																</DeveloperTitle>
																<DeveloperActions>
																	<DeveloperButton
																		$isMobile={isMobile}
																		$active={activeDeveloperTool === 'performance'}
																		onClick={() => toggleDeveloperTool('performance')}
																		title="Performance Dashboard"
																	>
																		<FiActivity />
																	</DeveloperButton>
																	<DeveloperButton
																		$isMobile={isMobile}
																		$active={activeDeveloperTool === 'docs'}
																		onClick={() => toggleDeveloperTool('docs')}
																		title="API Documentation"
																	>
																		<FiBook />
																	</DeveloperButton>
																	<DeveloperButton
																		$isMobile={isMobile}
																		$active={activeDeveloperTool === 'tokens'}
																		onClick={() => toggleDeveloperTool('tokens')}
																		title="Design Tokens"
																	>
																		<FiZap />
																	</DeveloperButton>
																	<DeveloperButton
																		$isMobile={isMobile}
																		$active={activeDeveloperTool === 'plugins'}
																		onClick={() => toggleDeveloperTool('plugins')}
																		title="Plugin Manager"
																	>
																		<FiLayers />
																	</DeveloperButton>
																</DeveloperActions>
															</DeveloperHeader>
															
															{activeDeveloperTool && (
																<DeveloperContent $isMobile={isMobile}>
																	{renderDeveloperTool()}
																</DeveloperContent>
															)}
														</DeveloperPanel>
													)}
													
													<SidebarMenuAdvanced
														dragMode={isDragDropMode}
														searchQuery={searchQuery}
														matchAnywhere={matchAnywhere}
														menuGroups={menuGroups}
														onToggleSection={handleSectionToggle}
														onActivateItem={handleActivateItem}
													/>
												</DocumentationProvider>
											</PerformanceProvider>
										</PluginProvider>
									</DesignTokenProvider>
								</SmartSearchProvider>
							</UserPreferencesProvider>
						</ContextMenuProvider>
					</MobileOptimizationProvider>
				</KeyboardNavigationProvider>
			</SidebarContainer>
		</>
	);
};

export default SidebarDeveloper;
