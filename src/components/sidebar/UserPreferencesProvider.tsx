/**
 * UserPreferencesProvider - User preferences and personalization
 * Phase 3: Advanced Features
 * 
 * Provides:
 * - Favorites system
 * - Recent items tracking
 * - User preferences persistence
 * - Personalization settings
 */

import React, { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';

// Types for user preferences
export interface FavoriteItem {
	id: string;
	path: string;
	label: string;
	icon?: React.ReactNode;
	addedAt: number;
	category?: string;
}

export interface RecentItem {
	id: string;
	path: string;
	label: string;
	accessedAt: number;
	accessCount: number;
}

export interface UserPreferences {
	favorites: FavoriteItem[];
	recentItems: RecentItem[];
	collapsedSections: string[];
	theme: 'light' | 'dark' | 'auto';
	density: 'compact' | 'normal' | 'spacious';
	showBadges: boolean;
	enableAnimations: boolean;
	enableSounds: boolean;
	language: string;
}

export interface UserPreferencesContextType {
	preferences: UserPreferences;
	addFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
	removeFavorite: (id: string) => void;
	isFavorite: (id: string) => boolean;
	addRecentItem: (item: Omit<RecentItem, 'accessedAt' | 'accessCount'>) => void;
	getRecentItems: (limit?: number) => RecentItem[];
	clearRecentItems: () => void;
	toggleSectionCollapsed: (sectionId: string) => void;
	updatePreferences: (updates: Partial<UserPreferences>) => void;
	resetPreferences: () => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
	PREFERENCES: 'sidebar.userPreferences',
	FAVORITES: 'sidebar.favorites',
	RECENT_ITEMS: 'sidebar.recentItems',
} as const;

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
	favorites: [],
	recentItems: [],
	collapsedSections: [],
	theme: 'auto',
	density: 'normal',
	showBadges: true,
	enableAnimations: true,
	enableSounds: false,
	language: 'en',
};

interface UserPreferencesProviderProps {
	children: ReactNode;
	maxRecentItems?: number;
	maxFavorites?: number;
}

export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({
	children,
	maxRecentItems = 20,
	maxFavorites = 50,
}) => {
	const [preferences, setPreferences] = useState<UserPreferences>(() => {
		// Load preferences from localStorage
		try {
			const saved = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
			if (saved) {
				const parsed = JSON.parse(saved);
				return { ...DEFAULT_PREFERENCES, ...parsed };
			}
		} catch (error) {
			console.warn('Failed to load user preferences:', error);
		}
		return DEFAULT_PREFERENCES;
	});

	// Save preferences to localStorage
	const savePreferences = useCallback((prefs: UserPreferences) => {
		try {
			localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
		} catch (error) {
			console.warn('Failed to save user preferences:', error);
		}
	}, []);

	// Add item to favorites
	const addFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
		setPreferences((prev) => {
			const newFavorite: FavoriteItem = {
				...item,
				addedAt: Date.now(),
			};

			// Check if already favorited
			const existingIndex = prev.favorites.findIndex(fav => fav.id === item.id);
			let newFavorites: FavoriteItem[];

			if (existingIndex >= 0) {
				// Update existing favorite
				newFavorites = [...prev.favorites];
				newFavorites[existingIndex] = newFavorite;
			} else {
				// Add new favorite
				newFavorites = [...prev.favorites, newFavorite];
				
				// Limit number of favorites
				if (newFavorites.length > maxFavorites) {
					newFavorites = newFavorites.slice(-maxFavorites);
				}
			}

			const updated = { ...prev, favorites: newFavorites };
			savePreferences(updated);
			return updated;
		});
	}, [maxFavorites, savePreferences]);

	// Remove item from favorites
	const removeFavorite = useCallback((id: string) => {
		setPreferences((prev) => {
			const newFavorites = prev.favorites.filter(fav => fav.id !== id);
			const updated = { ...prev, favorites: newFavorites };
			savePreferences(updated);
			return updated;
		});
	}, [savePreferences]);

	// Check if item is favorited
	const isFavorite = useCallback((id: string) => {
		return preferences.favorites.some(fav => fav.id === id);
	}, [preferences.favorites]);

	// Add recent item
	const addRecentItem = useCallback((item: Omit<RecentItem, 'accessedAt' | 'accessCount'>) => {
		setPreferences((prev) => {
			const existingIndex = prev.recentItems.findIndex(recent => recent.id === item.id);
			let newRecentItems: RecentItem[];

			if (existingIndex >= 0) {
				// Update existing item
				newRecentItems = [...prev.recentItems];
				newRecentItems[existingIndex] = {
					...newRecentItems[existingIndex],
					accessedAt: Date.now(),
					accessCount: newRecentItems[existingIndex].accessCount + 1,
				};
				
				// Move to top
				const [updated] = newRecentItems.splice(existingIndex, 1);
				newRecentItems.unshift(updated);
			} else {
				// Add new item
				const newItem: RecentItem = {
					...item,
					accessedAt: Date.now(),
					accessCount: 1,
				};
				newRecentItems = [newItem, ...prev.recentItems];
			}

			// Limit number of recent items
			if (newRecentItems.length > maxRecentItems) {
				newRecentItems = newRecentItems.slice(0, maxRecentItems);
			}

			const updated = { ...prev, recentItems: newRecentItems };
			savePreferences(updated);
			return updated;
		});
	}, [maxRecentItems, savePreferences]);

	// Get recent items (sorted by most recent)
	const getRecentItems = useCallback((limit?: number) => {
		const items = [...preferences.recentItems].sort((a, b) => b.accessedAt - a.accessedAt);
		return limit ? items.slice(0, limit) : items;
	}, [preferences.recentItems]);

	// Clear recent items
	const clearRecentItems = useCallback(() => {
		setPreferences((prev) => {
			const updated = { ...prev, recentItems: [] };
			savePreferences(updated);
			return updated;
		});
	}, [savePreferences]);

	// Toggle section collapsed state
	const toggleSectionCollapsed = useCallback((sectionId: string) => {
		setPreferences((prev) => {
			const isCollapsed = prev.collapsedSections.includes(sectionId);
			let newCollapsed: string[];

			if (isCollapsed) {
				// Remove from collapsed sections
				newCollapsed = prev.collapsedSections.filter(id => id !== sectionId);
			} else {
				// Add to collapsed sections
				newCollapsed = [...prev.collapsedSections, sectionId];
			}

			const updated = { ...prev, collapsedSections: newCollapsed };
			savePreferences(updated);
			return updated;
		});
	}, [savePreferences]);

	// Update preferences
	const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
		setPreferences((prev) => {
			const updated = { ...prev, ...updates };
			savePreferences(updated);
			return updated;
		});
	}, [savePreferences]);

	// Reset preferences to defaults
	const resetPreferences = useCallback(() => {
		setPreferences(DEFAULT_PREFERENCES);
		savePreferences(DEFAULT_PREFERENCES);
	}, [savePreferences]);

	// Clean up old recent items (older than 30 days)
	useEffect(() => {
		const cleanupInterval = setInterval(() => {
			const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
			
			setPreferences((prev) => {
				const filteredRecent = prev.recentItems.filter(
					item => item.accessedAt > thirtyDaysAgo
				);
				
				if (filteredRecent.length !== prev.recentItems.length) {
					const updated = { ...prev, recentItems: filteredRecent };
					savePreferences(updated);
					return updated;
				}
				
				return prev;
			});
		}, 24 * 60 * 60 * 1000); // Run daily

		return () => clearInterval(cleanupInterval);
	}, [savePreferences]);

	const contextValue: UserPreferencesContextType = {
		preferences,
		addFavorite,
		removeFavorite,
		isFavorite,
		addRecentItem,
		getRecentItems,
		clearRecentItems,
		toggleSectionCollapsed,
		updatePreferences,
		resetPreferences,
	};

	return (
		<UserPreferencesContext.Provider value={contextValue}>
			{children}
		</UserPreferencesContext.Provider>
	);
};

export const useUserPreferences = (): UserPreferencesContextType => {
	const context = useContext(UserPreferencesContext);
	if (context === undefined) {
		throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
	}
	return context;
};

// Hook for favorites management
export const useFavorites = () => {
	const { favorites, addFavorite, removeFavorite, isFavorite } = useUserPreferences();

	return {
		favorites,
		addFavorite,
		removeFavorite,
		isFavorite,
		favoriteCount: favorites.length,
	};
};

// Hook for recent items management
export const useRecentItems = () => {
	const { recentItems, addRecentItem, getRecentItems, clearRecentItems } = useUserPreferences();

	return {
		recentItems,
		addRecentItem,
		getRecentItems,
		clearRecentItems,
		recentCount: recentItems.length,
	};
};

// Hook for user preferences
export const usePreferences = () => {
	const { preferences, updatePreferences, resetPreferences } = useUserPreferences();

	return {
		preferences,
		updatePreferences,
		resetPreferences,
	};
};

export default UserPreferencesProvider;
