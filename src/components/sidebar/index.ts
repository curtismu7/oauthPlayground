/**
 * Sidebar Components - Complete AI-powered sidebar implementation
 * Phase 1: Performance Optimization
 * Phase 2: User Experience Enhancement
 * Phase 3: Advanced Features
 * Phase 4: Developer Experience
 * Phase 5: AI Features
 */

// Phase 1 Components
export { default as SidebarContainer } from './SidebarContainer';
export { default as SidebarHeader } from './SidebarHeader';
export { default as SidebarMenu } from './SidebarMenu';
export { default as DragDropProvider, useDragDrop, useDraggedItemData } from './DragDropProvider';
export { 
	default as MenuPersistenceService, 
	useMenuPersistence,
	type MenuGroup,
	type MenuItem,
	type SerializableMenuGroup,
	type SerializableMenuItem
} from './MenuPersistence';

// Phase 2 Components
export { default as KeyboardNavigationProvider, useKeyboardNavigation, useKeyboardShortcuts } from './KeyboardNavigationProvider';
export { default as MobileOptimizationProvider, useMobileOptimization, useResponsive, useTouchGestures } from './MobileOptimizationProvider';
export { 
	default as ContextMenuProvider, 
	useContextMenu, 
	useSidebarContextMenu,
	type ContextMenuItem,
	type ContextMenuState
} from './ContextMenuProvider';
export { default as SidebarMenuEnhanced } from './SidebarMenuEnhanced';

// Phase 3 Components
export { default as UserPreferencesProvider, useUserPreferences, useFavorites, useRecentItems, usePreferences } from './UserPreferencesProvider';
export { default as SmartSearchProvider, useSmartSearch, useSearch } from './SmartSearchProvider';
export { default as SidebarMenuAdvanced } from './SidebarMenuAdvanced';

// Phase 4 Components
export { default as DesignTokenProvider, useDesignTokens, useTheme, useTokens } from './DesignTokenProvider';
export { default as PluginProvider, usePluginSystem, usePlugin, usePluginMenu, usePluginSearch, usePluginContextMenu, createPlugin } from './PluginProvider';
export { default as PerformanceProvider, usePerformance, usePerformanceTracker, PerformanceDashboard } from './PerformanceDashboard';
export { default as DocumentationProvider, useDocumentation, APIDocumentationViewer } from './APIDocumentation';

// Phase 5 Components
export { default as AIProvider, useAI, useAIDocumentation, useAIPerformance, useAICodeGeneration, useAITesting, useAIInsights } from './AIProvider';
export { default as AIDocumentationGenerator } from './AIDocumentationGenerator';
export { default as AIPerformanceRecommendations } from './AIPerformanceRecommendations';
export { default as AICodeGenerator } from './AICodeGenerator';

// Complete Sidebars
export { default as SidebarEnhanced } from '../SidebarEnhanced';
export { default as SidebarAdvanced } from '../SidebarAdvanced';
export { default as SidebarDeveloper } from '../SidebarDeveloper';
export { default as SidebarAI } from '../SidebarAI';

// Re-export the existing SidebarSearch component
export { default as SidebarSearch } from '../SidebarSearch';
