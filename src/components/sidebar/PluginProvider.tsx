/**
 * PluginProvider - Plugin system for sidebar extensibility
 * Phase 4: Developer Experience
 * 
 * Provides:
 * - Plugin registration and management
 * - Component extension points
 * - Event system for plugins
 * - Plugin lifecycle management
 * - Plugin configuration and settings
 */

import React, { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';

// Plugin interfaces
export interface PluginConfig {
	name: string;
	version: string;
	description?: string;
	author?: string;
	dependencies?: string[];
	permissions?: string[];
	settings?: Record<string, any>;
	enabled?: boolean;
}

export interface PluginAPI {
	// Navigation
	addMenuItem: (item: MenuItem) => void;
	removeMenuItem: (id: string) => void;
	updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
	
	// Sections
	addSection: (section: MenuSection) => void;
	removeSection: (id: string) => void;
	updateSection: (id: string, updates: Partial<MenuSection>) => void;
	
	// Search
	registerSearchProvider: (provider: SearchProvider) => void;
	unregisterSearchProvider: (id: string) => void;
	
	// Context Menu
	addContextMenuItem: (item: ContextMenuItem) => void;
	removeContextMenuItem: (id: string) => void;
	
	// Events
	on: (event: string, handler: EventHandler) => void;
	off: (event: string, handler: EventHandler) => void;
	emit: (event: string, data?: any) => void;
	
	// Storage
	getStorage: (key: string) => any;
	setStorage: (key: string, value: any) => void;
	
	// UI
	showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
	
	// Theme
	getTheme: () => any;
	updateTheme: (updates: any) => void;
}

export interface Plugin {
	config: PluginConfig;
	api: PluginAPI;
	activate: () => void | Promise<void>;
	deactivate: () => void | Promise<void>;
}

export interface MenuItem {
	id: string;
	label: string;
	path?: string;
	icon?: React.ReactNode;
	badge?: React.ReactNode;
	description?: string;
	tags?: string[];
	category?: string;
	order?: number;
	onClick?: () => void;
	onContextMenu?: (e: React.MouseEvent) => void;
}

export interface MenuSection {
	id: string;
	label: string;
	icon?: React.ReactNode;
	order?: number;
	isOpen?: boolean;
	items: MenuItem[];
}

export interface SearchProvider {
	id: string;
	name: string;
	search: (query: string) => Promise<SearchResult[]>;
	priority?: number;
}

export interface SearchResult {
	id: string;
	title: string;
	description?: string;
	path?: string;
	icon?: React.ReactNode;
	score: number;
	provider: string;
}

export interface ContextMenuItem {
	id: string;
	label: string;
	icon?: React.ReactNode;
	shortcut?: string;
	separator?: boolean;
	disabled?: boolean;
	onClick: (context: any) => void;
}

export type EventHandler = (data?: any) => void;

export interface PluginContextType {
	plugins: Map<string, Plugin>;
	registerPlugin: (plugin: Plugin) => void;
	unregisterPlugin: (name: string) => void;
	activatePlugin: (name: string) => void;
	deactivatePlugin: (name: string) => void;
	isPluginActive: (name: string) => boolean;
	getPluginAPI: () => PluginAPI;
	pluginEvents: Map<string, EventHandler[]>;
}

const PluginContext = createContext<PluginContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
	PLUGIN_SETTINGS: 'sidebar.plugins.settings',
	PLUGIN_STATE: 'sidebar.plugins.state',
} as const;

interface PluginProviderProps {
	children: ReactNode;
	defaultPlugins?: Plugin[];
	enablePluginSystem?: boolean;
}

export const PluginProvider: React.FC<PluginProviderProps> = ({
	children,
	defaultPlugins = [],
	enablePluginSystem = true,
}) => {
	const [plugins, setPlugins] = useState<Map<string, Plugin>>(new Map());
	const [pluginEvents, setPluginEvents] = useState<Map<string, EventHandler[]>>(new Map());
	const [menuItems, setMenuItems] = useState<Map<string, MenuItem>>(new Map());
	const [menuSections, setMenuSections] = useState<Map<string, MenuSection>>(new Map());
	const [searchProviders, setSearchProviders] = useState<Map<string, SearchProvider>>(new Map());
	const [contextMenuItems, setContextMenuItems] = useState<Map<string, ContextMenuItem>>(new Map());
	const [pluginStorage, setPluginStorage] = useState<Map<string, any>>(new Map());

	// Load plugin state from localStorage
	useEffect(() => {
		if (!enablePluginSystem) return;

		try {
			const savedSettings = localStorage.getItem(STORAGE_KEYS.PLUGIN_SETTINGS);
			const savedState = localStorage.getItem(STORAGE_KEYS.PLUGIN_STATE);
			
			if (savedSettings) {
				const settings = JSON.parse(savedSettings);
				// Apply settings to plugins
			}
			
			if (savedState) {
				const state = JSON.parse(savedState);
				// Restore plugin state
			}
		} catch {
			// Ignore errors
		}

		// Register default plugins
		defaultPlugins.forEach(plugin => {
			registerPlugin(plugin);
		});
	}, [enablePluginSystem, defaultPlugins]);

	// Save plugin state to localStorage
	const savePluginState = useCallback(() => {
		try {
			const state = {
				plugins: Array.from(plugins.entries()).map(([name, plugin]) => ({
					name,
					config: plugin.config,
					active: plugins.has(name),
				})),
				settings: Object.fromEntries(pluginStorage),
			};
			
			localStorage.setItem(STORAGE_KEYS.PLUGIN_STATE, JSON.stringify(state));
			localStorage.setItem(STORAGE_KEYS.PLUGIN_SETTINGS, JSON.stringify(Object.fromEntries(pluginStorage)));
		} catch {
			// Ignore errors
		}
	}, [plugins, pluginStorage]);

	// Event system
	const on = useCallback((event: string, handler: EventHandler) => {
		setPluginEvents(prev => {
			const handlers = prev.get(event) || [];
			return new Map(prev).set(event, [...handlers, handler]);
		});
	}, []);

	const off = useCallback((event: string, handler: EventHandler) => {
		setPluginEvents(prev => {
			const handlers = prev.get(event) || [];
			const filtered = handlers.filter(h => h !== handler);
			return new Map(prev).set(event, filtered);
		});
	}, []);

	const emit = useCallback((event: string, data?: any) => {
		const handlers = pluginEvents.get(event) || [];
		handlers.forEach(handler => {
			try {
				handler(data);
			} catch (error) {
				console.error(`Plugin event handler error for ${event}:`, error);
			}
		});
	}, [pluginEvents]);

	// Navigation API
	const addMenuItem = useCallback((item: MenuItem) => {
		setMenuItems(prev => new Map(prev).set(item.id, item));
		emit('menuItemAdded', item);
	}, [emit]);

	const removeMenuItem = useCallback((id: string) => {
		const item = menuItems.get(id);
		if (item) {
			setMenuItems(prev => {
				const newMap = new Map(prev);
				newMap.delete(id);
				return newMap;
			});
			emit('menuItemRemoved', item);
		}
	}, [menuItems, emit]);

	const updateMenuItem = useCallback((id: string, updates: Partial<MenuItem>) => {
		const item = menuItems.get(id);
		if (item) {
			const updated = { ...item, ...updates };
			setMenuItems(prev => new Map(prev).set(id, updated));
			emit('menuItemUpdated', updated);
		}
	}, [menuItems, emit]);

	// Sections API
	const addSection = useCallback((section: MenuSection) => {
		setMenuSections(prev => new Map(prev).set(section.id, section));
		emit('sectionAdded', section);
	}, [emit]);

	const removeSection = useCallback((id: string) => {
		const section = menuSections.get(id);
		if (section) {
			setMenuSections(prev => {
				const newMap = new Map(prev);
				newMap.delete(id);
				return newMap;
			});
			emit('sectionRemoved', section);
		}
	}, [menuSections, emit]);

	const updateSection = useCallback((id: string, updates: Partial<MenuSection>) => {
		const section = menuSections.get(id);
		if (section) {
			const updated = { ...section, ...updates };
			setMenuSections(prev => new Map(prev).set(id, updated));
			emit('sectionUpdated', updated);
		}
	}, [menuSections, emit]);

	// Search API
	const registerSearchProvider = useCallback((provider: SearchProvider) => {
		setSearchProviders(prev => new Map(prev).set(provider.id, provider));
		emit('searchProviderRegistered', provider);
	}, [emit]);

	const unregisterSearchProvider = useCallback((id: string) => {
		const provider = searchProviders.get(id);
		if (provider) {
			setSearchProviders(prev => {
				const newMap = new Map(prev);
				newMap.delete(id);
				return newMap;
			});
			emit('searchProviderUnregistered', provider);
		}
	}, [searchProviders, emit]);

	// Context Menu API
	const addContextMenuItem = useCallback((item: ContextMenuItem) => {
		setContextMenuItems(prev => new Map(prev).set(item.id, item));
		emit('contextMenuItemAdded', item);
	}, [emit]);

	const removeContextMenuItem = useCallback((id: string) => {
		const item = contextMenuItems.get(id);
		if (item) {
			setContextMenuItems(prev => {
				const newMap = new Map(prev);
				newMap.delete(id);
				return newMap;
			});
			emit('contextMenuItemRemoved', item);
		}
	}, [contextMenuItems, emit]);

	// Storage API
	const getStorage = useCallback((key: string) => {
		return pluginStorage.get(key);
	}, [pluginStorage]);

	const setStorage = useCallback((key: string, value: any) => {
		setPluginStorage(prev => new Map(prev).set(key, value));
		savePluginState();
	}, [savePluginState]);

	// UI API
	const showNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
		// This would integrate with a notification system
		console.log(`[${type.toUpperCase()}] ${message}`);
		emit('notification', { message, type });
	}, [emit]);

	// Theme API (placeholder - would integrate with DesignTokenProvider)
	const getTheme = useCallback(() => {
		return {}; // Would return current theme tokens
	}, []);

	const updateTheme = useCallback((updates: any) => {
		// Would update theme tokens
		emit('themeUpdated', updates);
	}, [emit]);

	// Plugin API
	const pluginAPI: PluginAPI = {
		addMenuItem,
		removeMenuItem,
		updateMenuItem,
		addSection,
		removeSection,
		updateSection,
		registerSearchProvider,
		unregisterSearchProvider,
		addContextMenuItem,
		removeContextMenuItem,
		on,
		off,
		emit,
		getStorage,
		setStorage,
		showNotification,
		getTheme,
		updateTheme,
	};

	// Plugin management
	const registerPlugin = useCallback((plugin: Plugin) => {
		if (plugins.has(plugin.config.name)) {
			throw new Error(`Plugin ${plugin.config.name} is already registered`);
		}

		// Check dependencies
		if (plugin.config.dependencies) {
			for (const dep of plugin.config.dependencies) {
				if (!plugins.has(dep)) {
					throw new Error(`Plugin ${plugin.config.name} requires ${dep} but it's not available`);
				}
			}
		}

		setPlugins(prev => new Map(prev).set(plugin.config.name, plugin));
		emit('pluginRegistered', plugin);

		// Auto-activate if enabled
		if (plugin.config.enabled !== false) {
			activatePlugin(plugin.config.name);
		}
	}, [plugins, emit]);

	const unregisterPlugin = useCallback((name: string) => {
		const plugin = plugins.get(name);
		if (plugin) {
			// Deactivate first
			deactivatePlugin(name);
			
			setPlugins(prev => {
				const newMap = new Map(prev);
				newMap.delete(name);
				return newMap;
			});
			emit('pluginUnregistered', plugin);
		}
	}, [plugins, emit]);

	const activatePlugin = useCallback((name: string) => {
		const plugin = plugins.get(name);
		if (plugin) {
			try {
				const result = plugin.activate();
				if (result instanceof Promise) {
					result.catch(error => {
						console.error(`Plugin ${name} activation failed:`, error);
						emit('pluginActivationFailed', { plugin, error });
					});
				}
				emit('pluginActivated', plugin);
			} catch (error) {
				console.error(`Plugin ${name} activation failed:`, error);
				emit('pluginActivationFailed', { plugin, error });
			}
		}
	}, [plugins, emit]);

	const deactivatePlugin = useCallback((name: string) => {
		const plugin = plugins.get(name);
		if (plugin) {
			try {
				const result = plugin.deactivate();
				if (result instanceof Promise) {
					result.catch(error => {
						console.error(`Plugin ${name} deactivation failed:`, error);
						emit('pluginDeactivationFailed', { plugin, error });
					});
				}
				emit('pluginDeactivated', plugin);
			} catch (error) {
				console.error(`Plugin ${name} deactivation failed:`, error);
				emit('pluginDeactivationFailed', { plugin, error });
			}
		}
	}, [plugins, emit]);

	const isPluginActive = useCallback((name: string) => {
		return plugins.has(name);
	}, [plugins]);

	const getPluginAPI = useCallback(() => pluginAPI, [pluginAPI]);

	// Save state when plugins change
	useEffect(() => {
		savePluginState();
	}, [plugins, savePluginState]);

	const contextValue: PluginContextType = {
		plugins,
		registerPlugin,
		unregisterPlugin,
		activatePlugin,
		deactivatePlugin,
		isPluginActive,
		getPluginAPI,
		pluginEvents,
	};

	return (
		<PluginContext.Provider value={contextValue}>
			{children}
		</PluginContext.Provider>
	);
};

export const usePluginSystem = (): PluginContextType => {
	const context = useContext(PluginContext);
	if (context === undefined) {
		throw new Error('usePluginSystem must be used within a PluginProvider');
	}
	return context;
};

// Hook for plugin development
export const usePlugin = (name: string) => {
	const { plugins, isPluginActive, getPluginAPI } = usePluginSystem();
	const plugin = plugins.get(name);
	const isActive = isPluginActive(name);
	const api = getPluginAPI();

	return {
		plugin,
		isActive,
		api,
	};
};

// Hook for menu extensions
export const usePluginMenu = () => {
	const { menuItems, menuSections } = usePluginSystem();

	return {
		menuItems: Array.from(menuItems.values()),
		menuSections: Array.from(menuSections.values()),
	};
};

// Hook for search extensions
export const usePluginSearch = () => {
	const { searchProviders } = usePluginSystem();

	const searchAll = useCallback(async (query: string): Promise<SearchResult[]> => {
		const providers = Array.from(searchProviders.values());
		const results = await Promise.all(
			providers.map(async provider => {
				try {
					const providerResults = await provider.search(query);
					return providerResults.map(result => ({
						...result,
						provider: provider.name,
					}));
				} catch (error) {
					console.error(`Search provider ${provider.name} failed:`, error);
					return [];
				}
			})
		);

		// Flatten and sort by score
		return results.flat().sort((a, b) => b.score - a.score);
	}, [searchProviders]);

	return {
		searchProviders: Array.from(searchProviders.values()),
		searchAll,
	};
};

// Hook for context menu extensions
export const usePluginContextMenu = () => {
	const { contextMenuItems } = usePluginSystem();

	return {
		contextMenuItems: Array.from(contextMenuItems.values()),
	};
};

// Plugin factory helper
export const createPlugin = (
	config: PluginConfig,
	activate: (api: PluginAPI) => void | Promise<void>,
	deactivate: (api: PluginAPI) => void | Promise<void>
): Plugin => {
	return {
		config,
		api: {} as PluginAPI, // Will be injected by the provider
		activate: () => activate({} as PluginAPI), // Will be injected by the provider
		deactivate: () => deactivate({} as PluginAPI), // Will be injected by the provider
	};
};

export default PluginProvider;
