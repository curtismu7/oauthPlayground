/**
 * @file sectionsViewModeService.ts
 * @description Reusable Full/Hidden View Mode Service for Collapsible Sections
 * @version 1.0.0
 * @since 2025-02-23
 *
 * Provides centralized management for expand/collapse all functionality
 * across all apps with collapsible sections.
 *
 * @example
 * import { sectionsViewModeService } from '@/services/sectionsViewModeService';
 *
 * // In a component
 * const handleExpandAll = () => {
 *   sectionsViewModeService.expandAll('fido2-register', ['section1', 'section2']);
 * };
 */

import React from 'react';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { unifiedStorageManager } from './unifiedStorageManager';

const MODULE_TAG = '[ SECTIONS-VIEW-MODE]';

// Storage key format
const STORAGE_KEY_PREFIX = 'ui.sections.viewMode';
const LEGACY_KEY_PREFIX = 'sections';

// Default state for new pages
const DEFAULT_STATE: Record<string, boolean> = {};

/**
 * Section view mode interface
 */
export interface SectionsViewModeService {
	// Core functionality
	toggleSection(sectionId: string): void;
	setSectionExpanded(sectionId: string, expanded: boolean): void;
	expandAll(pageKey: string, sectionIds: string[]): void;
	collapseAll(pageKey: string, sectionIds: string[]): void;

	// State queries
	isSectionExpanded(sectionId: string): boolean;
	areAllExpanded(pageKey: string, sectionIds: string[]): boolean;
	areAllCollapsed(pageKey: string, sectionIds: string[]): boolean;

	// Persistence
	saveViewState(pageKey: string, state: Record<string, boolean>): Promise<void>;
	loadViewState(pageKey: string): Promise<Record<string, boolean>>;

	// Migration
	migrateLegacyData(pageKey: string): Promise<void>;
}

/**
 * Internal state management
 */
class SectionsViewModeManager {
	private static instance: SectionsViewModeManager;
	private cache: Map<string, Record<string, boolean>> = new Map();
	private writeQueue: Map<string, Record<string, boolean>> = new Map();
	private writeTimeout: NodeJS.Timeout | null = null;

	private constructor() {}

	static getInstance(): SectionsViewModeManager {
		if (!SectionsViewModeManager.instance) {
			SectionsViewModeManager.instance = new SectionsViewModeManager();
		}
		return SectionsViewModeManager.instance;
	}

	/**
	 * Get storage key for a page
	 */
	private getStorageKey(pageKey: string): string {
		return `${STORAGE_KEY_PREFIX}.${pageKey}`;
	}

	/**
	 * Get legacy storage key for migration
	 */
	private getLegacyStorageKey(pageKey: string): string {
		return `${LEGACY_KEY_PREFIX}.${pageKey}`;
	}

	/**
	 * Toggle a single section's expanded state
	 */
	toggleSection(pageKey: string, sectionId: string): void {
		const currentState = this.cache.get(pageKey) || {};
		const newState = {
			...currentState,
			[sectionId]: !currentState[sectionId],
		};
		this.cache.set(pageKey, newState);
		this.scheduleWrite(pageKey, newState);
	}

	/**
	 * Set a section's expanded state
	 */
	setSectionExpanded(pageKey: string, sectionId: string, expanded: boolean): void {
		const currentState = this.cache.get(pageKey) || {};
		const newState = {
			...currentState,
			[sectionId]: expanded,
		};
		this.cache.set(pageKey, newState);
		this.scheduleWrite(pageKey, newState);
	}

	/**
	 * Expand all sections for a page
	 */
	expandAll(pageKey: string, sectionIds: string[]): void {
		const newState: Record<string, boolean> = {};
		sectionIds.forEach((id) => {
			newState[id] = true;
		});
		this.cache.set(pageKey, newState);
		this.scheduleWrite(pageKey, newState);

		toastV8.info('All sections expanded');
		console.log(`${MODULE_TAG} Expanded all sections for ${pageKey}`);
	}

	/**
	 * Collapse all sections for a page
	 */
	collapseAll(pageKey: string, sectionIds: string[]): void {
		const newState: Record<string, boolean> = {};
		sectionIds.forEach((id) => {
			newState[id] = false;
		});
		this.cache.set(pageKey, newState);
		this.scheduleWrite(pageKey, newState);

		toastV8.info('All sections collapsed');
		console.log(`${MODULE_TAG} Collapsed all sections for ${pageKey}`);
	}

	/**
	 * Check if a section is expanded
	 */
	isSectionExpanded(pageKey: string, sectionId: string): boolean {
		const state = this.cache.get(pageKey) || {};
		return state[sectionId] ?? false;
	}

	/**
	 * Check if all sections are expanded
	 */
	areAllExpanded(pageKey: string, sectionIds: string[]): boolean {
		const state = this.cache.get(pageKey) || {};
		return sectionIds.every((id) => state[id] === true);
	}

	/**
	 * Check if all sections are collapsed
	 */
	areAllCollapsed(pageKey: string, sectionIds: string[]): boolean {
		const state = this.cache.get(pageKey) || {};
		return sectionIds.every((id) => state[id] === false);
	}

	/**
	 * Save view state to storage
	 */
	async saveViewState(pageKey: string, state: Record<string, boolean>): Promise<void> {
		try {
			const storageKey = this.getStorageKey(pageKey);
			await unifiedStorageManager.save(storageKey, state);
			console.log(`${MODULE_TAG} Saved view state for ${pageKey}`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save view state for ${pageKey}:`, error);
			toastV8.error('Failed to save section states');
		}
	}

	/**
	 * Load view state from storage
	 */
	async loadViewState(pageKey: string): Promise<Record<string, boolean>> {
		try {
			// First try new storage key
			const storageKey = this.getStorageKey(pageKey);
			let state = await unifiedStorageManager.load<Record<string, boolean>>(storageKey);

			// If no state found, try legacy key for migration
			if (!state || Object.keys(state).length === 0) {
				const legacyKey = this.getLegacyStorageKey(pageKey);
				const legacyState = await unifiedStorageManager.load<Record<string, boolean>>(legacyKey);

				if (legacyState && Object.keys(legacyState).length > 0) {
					state = legacyState;
					// Migrate to new storage format
					await this.saveViewState(pageKey, state);
					// Clean up legacy data
					await unifiedStorageManager.clear(legacyKey);
					console.log(`${MODULE_TAG} Migrated legacy data for ${pageKey}`);
				}
			}

			this.cache.set(pageKey, state || {});
			return state || {};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load view state for ${pageKey}:`, error);
			this.cache.set(pageKey, DEFAULT_STATE);
			return DEFAULT_STATE;
		}
	}

	/**
	 * Migrate legacy data from old storage format
	 */
	async migrateLegacyData(pageKey: string): Promise<void> {
		try {
			const legacyKey = this.getLegacyStorageKey(pageKey);
			const legacyState = await unifiedStorageManager.load<Record<string, boolean>>(legacyKey);

			if (legacyState && Object.keys(legacyState).length > 0) {
				const newKey = this.getStorageKey(pageKey);
				await unifiedStorageManager.save(newKey, legacyState);
				await unifiedStorageManager.clear(legacyKey);
				console.log(`${MODULE_TAG} Successfully migrated legacy data for ${pageKey}`);
				toastV8.success('Settings migrated successfully');
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to migrate legacy data for ${pageKey}:`, error);
		}
	}

	/**
	 * Schedule write operation with debouncing
	 */
	private scheduleWrite(pageKey: string, state: Record<string, boolean>): void {
		this.writeQueue.set(pageKey, state);

		if (this.writeTimeout) {
			clearTimeout(this.writeTimeout);
		}

		this.writeTimeout = setTimeout(async () => {
			if (this.writeQueue.size === 0) return;

			const operations = Array.from(this.writeQueue.entries());
			this.writeQueue.clear();

			try {
				await Promise.all(operations.map(([key, data]) => this.saveViewState(key, data)));
			} catch (error) {
				console.error(`${MODULE_TAG} Batch write failed:`, error);
			}
		}, 300); // 300ms debounce
	}

	/**
	 * Clear cache for testing or reset
	 */
	clearCache(): void {
		this.cache.clear();
		this.writeQueue.clear();
		if (this.writeTimeout) {
			clearTimeout(this.writeTimeout);
			this.writeTimeout = null;
		}
	}
}

/**
 * Public service instance
 */
const sectionsViewModeManager = SectionsViewModeManager.getInstance();

/**
 * Sections View Mode Service
 *
 * Provides centralized management for expand/collapse all functionality
 * across all apps with collapsible sections.
 */
export const sectionsViewModeService: SectionsViewModeService = {
	/**
	 * Toggle a single section's expanded state
	 */
	toggleSection(sectionId: string): void {
		// Extract pageKey from sectionId or use default
		const pageKey = sectionId.split('.')[0] || 'default';
		sectionsViewModeManager.toggleSection(pageKey, sectionId);
	},

	/**
	 * Set a section's expanded state
	 */
	setSectionExpanded(sectionId: string, expanded: boolean): void {
		const pageKey = sectionId.split('.')[0] || 'default';
		sectionsViewModeManager.setSectionExpanded(pageKey, sectionId, expanded);
	},

	/**
	 * Expand all sections for a page
	 */
	expandAll(pageKey: string, sectionIds: string[]): void {
		sectionsViewModeManager.expandAll(pageKey, sectionIds);
	},

	/**
	 * Collapse all sections for a page
	 */
	collapseAll(pageKey: string, sectionIds: string[]): void {
		sectionsViewModeManager.collapseAll(pageKey, sectionIds);
	},

	/**
	 * Check if a section is expanded
	 */
	isSectionExpanded(sectionId: string): boolean {
		const pageKey = sectionId.split('.')[0] || 'default';
		return sectionsViewModeManager.isSectionExpanded(pageKey, sectionId);
	},

	/**
	 * Check if all sections are expanded
	 */
	areAllExpanded(pageKey: string, sectionIds: string[]): boolean {
		return sectionsViewModeManager.areAllExpanded(pageKey, sectionIds);
	},

	/**
	 * Check if all sections are collapsed
	 */
	areAllCollapsed(pageKey: string, sectionIds: string[]): boolean {
		return sectionsViewModeManager.areAllCollapsed(pageKey, sectionIds);
	},

	/**
	 * Save view state to storage
	 */
	saveViewState(pageKey: string, state: Record<string, boolean>): Promise<void> {
		return sectionsViewModeManager.saveViewState(pageKey, state);
	},

	/**
	 * Load view state from storage
	 */
	loadViewState(pageKey: string): Promise<Record<string, boolean>> {
		return sectionsViewModeManager.loadViewState(pageKey);
	},

	/**
	 * Migrate legacy data from old storage format
	 */
	migrateLegacyData(pageKey: string): Promise<void> {
		return sectionsViewModeManager.migrateLegacyData(pageKey);
	},
};

/**
 * Hook for using sections view mode in React components
 */
export function useSectionsViewMode(pageKey: string, sectionIds: string[]) {
	const [expandedStates, setExpandedStates] = React.useState<Record<string, boolean>>({});
	const [isLoading, setIsLoading] = React.useState(true);

	React.useEffect(() => {
		const loadState = async () => {
			try {
				setIsLoading(true);
				const state = await sectionsViewModeService.loadViewState(pageKey);
				setExpandedStates(state);
			} catch (error) {
				console.error('Failed to load sections view mode:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadState();
	}, [pageKey]);

	const toggleSection = React.useCallback((sectionId: string) => {
		sectionsViewModeService.toggleSection(sectionId);
		setExpandedStates((prev) => ({
			...prev,
			[sectionId]: !prev[sectionId],
		}));
	}, []);

	const expandAll = React.useCallback(() => {
		sectionsViewModeService.expandAll(pageKey, sectionIds);
		setExpandedStates(Object.fromEntries(sectionIds.map((id) => [id, true])));
	}, [pageKey, sectionIds]);

	const collapseAll = React.useCallback(() => {
		sectionsViewModeService.collapseAll(pageKey, sectionIds);
		setExpandedStates(Object.fromEntries(sectionIds.map((id) => [id, false])));
	}, [pageKey, sectionIds]);

	const isSectionExpanded = React.useCallback(
		(sectionId: string) => {
			return expandedStates[sectionId] ?? false;
		},
		[expandedStates]
	);

	const areAllExpanded = React.useCallback(() => {
		return sectionIds.every((id) => expandedStates[id] === true);
	}, [expandedStates, sectionIds]);

	const areAllCollapsed = React.useCallback(() => {
		return sectionIds.every((id) => expandedStates[id] === false);
	}, [expandedStates, sectionIds]);

	return {
		expandedStates,
		isLoading,
		toggleSection,
		expandAll,
		collapseAll,
		isSectionExpanded,
		areAllExpanded,
		areAllCollapsed,
	};
}

export default sectionsViewModeService;
