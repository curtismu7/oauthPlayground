/**
 * MenuPersistence - Handles all localStorage operations for menu state
 * Provides optimized persistence with debouncing and error handling
 */

import { useCallback, useRef } from 'react';

// Types for menu persistence
export interface SerializableMenuItem {
	id: string;
	path: string;
	label: string;
}

export interface SerializableMenuGroup {
	id: string;
	label: string;
	isOpen: boolean;
	items: SerializableMenuItem[];
	subGroups?: SerializableMenuGroup[];
}

export interface MenuGroup {
	id: string;
	label: string;
	icon: React.ReactNode;
	items: MenuItem[];
	subGroups?: MenuGroup[];
	isOpen: boolean;
}

export interface MenuItem {
	id: string;
	path: string;
	label: string;
	icon: React.ReactNode;
	badge?: React.ReactNode;
}

// Storage keys
const STORAGE_KEYS = {
	MENU_ORDER: 'simpleDragDropSidebar.menuOrder',
	MENU_VERSION: 'simpleDragDropSidebar.menuVersion',
	SIDEBAR_WIDTH: 'sidebar.width',
	DRAG_MODE: 'sidebar.dragDropMode',
	OPEN_SECTIONS: 'nav.openSections',
} as const;

// Current menu version - increment when menu structure changes significantly
const CURRENT_MENU_VERSION = '2.4'; // Updated for performance optimization

export class MenuPersistenceService {
	// Convert menu groups to serializable format
	static createSerializableGroups = (groups: MenuGroup[]): SerializableMenuGroup[] => {
		return groups.map((group) => {
			const result: SerializableMenuGroup = {
				id: group.id,
				label: group.label,
				isOpen: group.isOpen,
				items: group.items.map((item) => ({
					id: item.id,
					path: item.path,
					label: item.label,
				})),
			};
			if (group.subGroups && group.subGroups.length > 0) {
				result.subGroups = this.createSerializableGroups(group.subGroups);
			}
			return result;
		});
	};

	// Restore menu groups from serialized format
	static restoreMenuGroups = (
		serializedGroups: SerializableMenuGroup[],
		defaultGroups: MenuGroup[]
	): MenuGroup[] => {
		const restored = serializedGroups
			.map((serializedGroup) => {
				const defaultGroup = defaultGroups.find((g) => g.id === serializedGroup.id);
				if (!defaultGroup) return null;

				// Restore items and deduplicate by ID (keep first occurrence)
				const seenIds = new Set<string>();
				const restoredItems = serializedGroup.items
					.map((serializedItem) => {
						// Skip duplicates
						if (seenIds.has(serializedItem.id)) {
							return null;
						}
						seenIds.add(serializedItem.id);

						// Find the item in any of the default groups (since items can move between groups)
						let defaultItem = null;
						for (const group of defaultGroups) {
							defaultItem = group.items.find((i) => i.id === serializedItem.id);
							if (defaultItem) break;
							// Also check subGroups if they exist
							if (group.subGroups) {
								for (const subGroup of group.subGroups) {
									defaultItem = subGroup.items.find((i) => i.id === serializedItem.id);
									if (defaultItem) break;
								}
								if (defaultItem) break;
							}
						}
						return defaultItem || {
							id: serializedItem.id,
							path: serializedItem.path,
							label: serializedItem.label,
							icon: null, // fallback icon
						};
					})
					.filter(Boolean);

				// Restore subGroups if they exist
				let restoredSubGroups: MenuGroup[] | undefined;
				if (defaultGroup.subGroups && serializedGroup.subGroups) {
					restoredSubGroups = this.restoreMenuGroups(serializedGroup.subGroups, defaultGroup.subGroups);
				} else if (defaultGroup.subGroups) {
					// If default has subGroups but saved doesn't, use default
					restoredSubGroups = defaultGroup.subGroups;
				}

				return {
					...defaultGroup,
					isOpen: serializedGroup.isOpen,
					items: restoredItems,
					subGroups: restoredSubGroups,
				};
			})
			.filter(Boolean) as MenuGroup[];

		// Ensure new default items appear even if not in saved layout
		const presentIds = new Set<string>();
		const collectItemIds = (groups: MenuGroup[]) => {
			groups.forEach((g) => {
				g.items.forEach((i) => {
					presentIds.add(i.id);
				});
				if (g.subGroups) {
					collectItemIds(g.subGroups);
				}
			});
		};
		collectItemIds(restored);

		const addMissingItems = (savedGroups: MenuGroup[], defaultGroups: MenuGroup[]) => {
			defaultGroups.forEach((defGroup) => {
				defGroup.items.forEach((defItem) => {
					if (!presentIds.has(defItem.id)) {
						// Find the saved group (or create it if it doesn't exist)
						const savedGroup = savedGroups.find((g) => g.id === defGroup.id);
						if (savedGroup) {
							savedGroup.items.push(defItem);
						}
					}
				});
				if (defGroup.subGroups) {
					addMissingItems(
						savedGroups.flatMap((g) => g.subGroups || []),
						defGroup.subGroups
					);
				}
			});
		};
		addMissingItems(restored, defaultGroups);

		// Create ordered list: first use saved order, then add any new groups in default order
		const orderedRestored: MenuGroup[] = [];
		const addedGroupIds = new Set<string>();

		// First, add groups in the order they were saved (preserving user's custom order)
		restored.forEach((group) => {
			orderedRestored.push(group);
			addedGroupIds.add(group.id);
		});

		// Then add any new groups that weren't in the saved layout
		defaultGroups.forEach((defGroup) => {
			if (!addedGroupIds.has(defGroup.id)) {
				orderedRestored.push(defGroup);
				addedGroupIds.add(defGroup.id);
			}
		});

		return orderedRestored;
	};

	// Save menu layout to localStorage with debouncing
	static saveMenuLayout = (groups: MenuGroup[], debounceMs = 500): void => {
		// Clear existing timeout
		if (this.saveTimeoutRef) {
			clearTimeout(this.saveTimeoutRef);
		}

		// Set new timeout
		this.saveTimeoutRef = setTimeout(() => {
			try {
				// Deduplicate menu groups before saving
				const deduplicatedGroups = this.deduplicateGroups(groups);
				const serializable = this.createSerializableGroups(deduplicatedGroups);
				
				localStorage.setItem(STORAGE_KEYS.MENU_ORDER, JSON.stringify(serializable));
				localStorage.setItem(STORAGE_KEYS.MENU_VERSION, CURRENT_MENU_VERSION);
				
				console.log('💾 Menu layout saved to localStorage');
			} catch (error) {
				console.warn('❌ Failed to save menu layout:', error);
			}
		}, debounceMs);
	};

	// Load menu layout from localStorage
	static loadMenuLayout = (defaultGroups: MenuGroup[]): MenuGroup[] | null => {
		try {
			const savedVersion = localStorage.getItem(STORAGE_KEYS.MENU_VERSION);

			// If version changed, clear old menu layout and use new structure
			if (savedVersion !== CURRENT_MENU_VERSION) {
				localStorage.removeItem(STORAGE_KEYS.MENU_ORDER);
				localStorage.setItem(STORAGE_KEYS.MENU_VERSION, CURRENT_MENU_VERSION);
				return null;
			}

			const savedOrder = localStorage.getItem(STORAGE_KEYS.MENU_ORDER);
			if (savedOrder) {
				const serializedGroups = JSON.parse(savedOrder);
				console.log('🔄 Restoring menu layout from localStorage');
				return this.restoreMenuGroups(serializedGroups, defaultGroups);
			}
		} catch (error) {
			console.warn('Failed to load menu layout:', error);
		}
		return null;
	};

	// Deduplicate menu groups by ID
	static deduplicateGroups = (groups: MenuGroup[]): MenuGroup[] => {
		return groups.map((group) => {
			const seenIds = new Set<string>();
			const uniqueItems = group.items.filter((item) => {
				if (seenIds.has(item.id)) {
					console.warn(`Removing duplicate menu item: ${item.id}`);
					return false;
				}
				seenIds.add(item.id);
				return true;
			});

			const result: MenuGroup = { ...group, items: uniqueItems };
			if (group.subGroups && group.subGroups.length > 0) {
				const deduplicatedSubGroups = this.deduplicateGroups(group.subGroups);
				if (deduplicatedSubGroups.length > 0) {
					result.subGroups = deduplicatedSubGroups;
				}
			}
			return result;
		});
	};

	// Save sidebar width
	static saveSidebarWidth = (width: number): void => {
		try {
			localStorage.setItem(STORAGE_KEYS.SIDEBAR_WIDTH, String(width));
		} catch (error) {
			console.warn('Failed to save sidebar width:', error);
		}
	};

	// Load sidebar width
	static loadSidebarWidth = (defaultWidth: number, minWidth: number, maxWidth: number): number => {
		try {
			const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR_WIDTH);
			const parsed = saved ? parseInt(saved, 10) : NaN;
			if (Number.isFinite(parsed) && parsed >= minWidth && parsed <= maxWidth) {
				return parsed;
			}
		} catch {
			// Ignore errors
		}
		return defaultWidth;
	};

	// Save drag mode
	static saveDragMode = (enabled: boolean): void => {
		try {
			localStorage.setItem(STORAGE_KEYS.DRAG_MODE, enabled.toString());
		} catch (error) {
			console.warn('Failed to save drag mode:', error);
		}
	};

	// Load drag mode
	static loadDragMode = (defaultMode: boolean = false): boolean => {
		try {
			const saved = localStorage.getItem(STORAGE_KEYS.DRAG_MODE);
			return saved === 'true';
		} catch {
			return defaultMode;
		}
	};

	// Save open sections
	static saveOpenSections = (openSections: Record<string, boolean>): void => {
		try {
			localStorage.setItem(STORAGE_KEYS.OPEN_SECTIONS, JSON.stringify(openSections));
		} catch (error) {
			console.warn('Failed to save open sections:', error);
		}
	};

	// Load open sections
	static loadOpenSections = (defaultSections: Record<string, boolean> = {}): Record<string, boolean> => {
		try {
			const saved = localStorage.getItem(STORAGE_KEYS.OPEN_SECTIONS);
			if (saved) {
				return { ...defaultSections, ...JSON.parse(saved) };
			}
		} catch {
			// Ignore errors
		}
		return defaultSections;
	};

	// Clear all menu data
	static clearAllMenuData = (): void => {
		try {
			Object.values(STORAGE_KEYS).forEach((key) => {
				localStorage.removeItem(key);
			});
			console.log('🗑️ All menu data cleared from localStorage');
		} catch (error) {
			console.warn('Failed to clear menu data:', error);
		}
	};

	// Private timeout reference for debouncing
	private static saveTimeoutRef: NodeJS.Timeout | null = null;
}

// Hook for using menu persistence
export const useMenuPersistence = () => {
	const saveMenuLayout = useCallback((groups: MenuGroup[]) => {
		MenuPersistenceService.saveMenuLayout(groups);
	}, []);

	const loadMenuLayout = useCallback((defaultGroups: MenuGroup[]) => {
		return MenuPersistenceService.loadMenuLayout(defaultGroups);
	}, []);

	const saveSidebarWidth = useCallback((width: number) => {
		MenuPersistenceService.saveSidebarWidth(width);
	}, []);

	const loadSidebarWidth = useCallback((defaultWidth: number, minWidth: number, maxWidth: number) => {
		return MenuPersistenceService.loadSidebarWidth(defaultWidth, minWidth, maxWidth);
	}, []);

	return {
		saveMenuLayout,
		loadMenuLayout,
		saveSidebarWidth,
		loadSidebarWidth,
		saveDragMode: MenuPersistenceService.saveDragMode,
		loadDragMode: MenuPersistenceService.loadDragMode,
		saveOpenSections: MenuPersistenceService.saveOpenSections,
		loadOpenSections: MenuPersistenceService.loadOpenSections,
		clearAllMenuData: MenuPersistenceService.clearAllMenuData,
	};
};

export default MenuPersistenceService;
