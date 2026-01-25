/**
 * SidebarAI - Complete AI-powered sidebar
 * Phase 5: AI Features
 * 
 * Combines all Phase 5 features:
 * - AI documentation generation
 * - AI performance recommendations
 * - AI code generation
 * - Smart testing suggestions
 * - Predictive insights
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { KeyboardNavigationProvider, useKeyboardShortcuts } from './sidebar/KeyboardNavigationProvider';
import { MobileOptimizationProvider } from './sidebar/MobileOptimizationProvider';
import { ContextMenuProvider } from './sidebar/ContextMenuProvider';
import { UserPreferencesProvider } from './sidebar/UserPreferencesProvider';
import { SmartSearchProvider } from './sidebar/SmartSearchProvider';
import { DesignTokenProvider } from './sidebar/DesignTokenProvider';
import { PluginProvider } from './sidebar/PluginProvider';
import { PerformanceProvider } from './sidebar/PerformanceDashboard';
import { DocumentationProvider } from './sidebar/APIDocumentation';
import { AIProvider } from './sidebar/AIProvider';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarSearch from './SidebarSidebarSearch';
import AIDocumentationGenerator from './sidebar/AIDocumentationGenerator';
import AIPerformanceRecommendations from './sidebar/AIPerformanceRecommendations';
import AICodeGenerator from './sidebar/AICodeGenerator';
import SidebarMenuAdvanced from './sidebar/SidebarMenuAdvanced';
import { useMenuPersistence, type MenuGroup } from './sidebar/MenuPersistence';
import { FiBrain, FiSparkles, FiActivity, FiBook, FiCode, FiZap, FiTerminal } from 'react-icons/fi';

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
	transform: ${(props) => (props.$isOpen ? 'translateX(0)' : 'translateX(-1)')};
}

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

const AIPanel = styled.div<{ $isMobile: boolean }>`
	margin-bottom: ${(props) => (props.$isMobile ? '0.5rem' : '1rem')};
	padding: ${(props) => (props.$isMobile ? '0.75rem' : '1rem')};
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border-radius: ${(props) => (props.$isMobile ? '0.375rem' : '0.5rem')};
	border: 1px solid #0ea5e9;
`;

const AIHeader = styled.div<{ $isMobile: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: ${(props) => (props.$isMobile ? '0.5rem' : '0.75rem')};

const AITitle = styled.div<{ $isMobile: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	font-size: ${(props) => (props.$isMobile ? '0.8rem' : '0.875rem')};
	color: #0c4a6e;

const AIActions = styled.div`
	display: flex;
	align-items: center;
	gap: 0.25rem;
`;

const AIButton = styled.button<{ $isMobile: boolean; $active?: boolean }>`
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
	background: ${(props) => (props.$active ? '#0284c1' : 'rgba(255, 255, 255, 1)')};
	color: ${(props) => (props.$active ? '#ffffff' : '#0284c1')};
}

const AIContent = styled.div<{ $isMobile: boolean }>`
	margin-top: ${(props) => (props.$isMobile ? '0.5rem' : '0.75rem')};
	max-height: 400px;
	overflow-y: auto;

interface SidebarAIProps {
	isOpen: boolean;
	onClose: () => void;
	initialWidth?: number;
	minWidth?: number;
	maxWidth?: number;
	enableAIFeatures?: boolean;
	aiSettings?: {
		autoDocumentation?: boolean;
		performanceRecommendations?: boolean;
		codeGeneration?: boolean;
		testSuggestions?: boolean;
		predictiveInsights?: boolean;
	};
}

const SidebarAI: React.FC<SidebarAIProps> = ({
	isOpen,
	onClose,
	initialWidth = 450,
	minWidth = 300,
	maxWidth = 600,
	enableAIFeatures = true,
	aiSettings = {},
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
	const [activeAITool, setActiveAITool] = useState<'documentation' | 'performance' | 'code' | 'testing' | 'insights' | null>(null);

	// Load menu groups from persistence
	const { loadMenuLayout, saveMenuLayout } = useMenuPersistence();
	
	// Default menu structure with AI features
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
		// AI features section
		...(enableAIFeatures ? [{
			id: 'ai-tools',
			label: 'AI Tools',
			icon: null,
			isOpen: false,
			items: [
				{
					id: 'ai-documentation',
					path: '/dev/ai/documentation',
					label: '📚 AI Documentation',
					icon: null,
					badge: null,
					description: 'AI-powered documentation generation',
					tags: ['ai', 'documentation', 'automation'],
				},
				{
					id: 'ai-performance',
					path: '/dev/ai/performance',
					label: '🔍 AI Performance',
					icon: null,
					badge: null,
					description: 'AI-powered performance recommendations',
					tags: ['ai', 'performance', 'optimization'],
				},
				{
					id: 'ai-code-generator',
					path: '/dev/ai/code-generator',
					label: '🤖 AI Code Generator',
					icon: null,
					badge: null,
					description: 'AI-assisted code generation and optimization',
					tags: ['ai', 'code', 'generation', 'optimization'],
				},
				{
					id: 'ai-testing',
					path: '/dev/ai/testing',
					label: '🧪 AI Testing',
					icon: null,
					badge: null,
					description: 'AI-powered test generation and suggestions',
					tags: ['ai', 'testing', 'automation'],
				},
				{
					id: 'ai-insights',
					path: '/dev/ai/insights',
					label: '🧠 AI Insights',
					icon: null,
					badge: null,
					description: 'AI-powered predictive insights and analytics',
					tags: ['ai', 'insights', 'analytics'],
				},
				{
					id: 'ai-settings',
					path: '/dev/ai/settings',
					label: '⚙️ AI Settings',
					icon: null,
					badge: null,
					description: 'AI feature configuration and settings',
					tags: ['ai', 'settings', 'configuration'],
				},
			}] : []),
	], [enableAIFeatures]);

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

	// Toggle AI tool
	const toggleAITool = useCallback((tool: typeof activeAITool) => {
		setActiveAITool(activeAITool === tool ? null : tool);
	}, [activeAITool]);

	// Handle AI settings
	const updateAISettings = useCallback((settings: Partial<AISettings>) => {
		// In a real implementation, this would update AI settings
		console.log('Updating AI settings:', settings);
	}, []);

	// Keyboard shortcuts
	useKeyboardShortcuts({
		'ctrl+b': toggleDragDropMode,
	'escape': handleEscape,
		'ctrl+f': () => {
			const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
			searchInput?.focus();
		},
		'ctrl+shift+d': () => toggleAITool('documentation'),
		'ctrl+shift+p': () => toggleAITool('performance'),
		'ctrl+shift+c': () => toggleAITool('code'),
	'ctrl+shift+t': () => toggleAITool('testing'),
	'ctrl+shift+i': () => toggleAITool('insights'),
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

	// Render AI tool content
	const renderAITool = () => {
		switch (activeAITool) {
			case 'documentation':
				return (
					<AIDocumentationGenerator
						componentName="SidebarComponent"
						componentCode={code}
						onDocumentationGenerated={(doc) => {
							console.log('Documentation generated:', doc);
						}}
					/>
				);
			case 'performance':
				return (
					<AIPerformanceRecommendations
						metrics={{
							renderTime: 15.2,
							renderCount: 100,
							averageRenderTime: 15.2,
							maxRenderTime: 45.2,
							memoryUsage: 45 * 1024 * 1024,
							memoryPeak: 60 * 1024 * 1024,
							interactionTime: 120,
							interactionCount: 50,
							averageInteractionTime: 120,
							bundleSize: 45 * 1024,
							networkRequests: 25,
							accessibilityScore: 85,
						}}
						onApplyRecommendation={(rec) => {
							console.log('Applied recommendation:', rec);
						}}
					/>
				);
			case 'code':
				return (
					<AICodeGenerator
						initialCode={code}
						language={'typescript'}
						onCodeGenerated={(result) => {
							console.log('Code generated:', result);
						}}
					/>
				);
			case 'testing':
				return (
					<AICodeGenerator
						initialCode={code}
						language={'typescript'}
						onCodeGenerated={(result) => {
							console.log('Tests generated:', result);
						}}
					/>
				);
			case 'insights':
				return (
					<div style={{ padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
						<h3>AI Insights</h3>
						<p>AI-powered insights coming soon...</p>
					</div>
				);
			default:
				return null;
		}
	};

		return (
			<AIContent $isMobile={isMobile}>
				{renderAITool()}
			</AIContent>
		);
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
													<AIProvider aiSettings={aiSettings}>
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
													
													{enableAIFeatures && (
														<AIPanel $isMobile={isMobile}>
															<AIHeader $isMobile={isMobile}>
																<AITitle $isMobile={isMobile}>
																	<FiBrain />
																	AI Tools
																</AITitle>
																<AIActions $isMobile={isMobile}>
																	<AIButton
																		$isMobile={isMobile}
																		$active={activeAITool === 'documentation'}
																		onClick={() => toggleAITool('documentation')}
																	>
																		<FiBook />
																		Docs
																	</AIButton>
																	<AIButton
																		$isMobile={isMobile}
																		$active={activeAITool === 'performance'}
																		onClick={() => toggleAITool('performance')}
																	>
																		<FiActivity />
																		Performance
																	</AIButton>
																	<AIButton
																		$isMobile={isMobile}
																		$active={activeAITool === 'code'}
																		onClick={() => toggleAITool('code')}
																	>
																		<FiCode />
																		Code
																	</AIButton>
																	<AIButton
																		$isMobile={isMobile}
																		$active={activeAITool === 'testing'}
																		onClick={() => toggleAITool('testing')}
																	>
																		<FiCheckCircle />
																		Testing
																	</AIButton>
																	<AIButton
																		$isMobile={isMobile}
																		$active={activeAITool === 'insights'}
																		onClick={() => toggleAITool('insights')}
																	>
																		<FiTrendingUp />
																		Insights
																	</AIButton>
																</AIActions>
															</AIHeader>
															
															{renderAITool()}
														</AIPanel>
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

export default SidebarAI;
