/**
 * @file useUserSearch.ts
 * @module v8/hooks
 * @description Reusable hook for user search with caching
 * @version 8.0.0
 * @since 2026-02-01
 *
 * Provides user fetching, caching, and search functionality
 * Can be used in any component that needs user selection/search
 */

import { useCallback, useEffect, useState } from 'react';
import { SQLiteStatsServiceV8 } from '@/v8/services/sqliteStatsServiceV8';
import type { User } from '@/v8/services/userServiceV8';

const MODULE_TAG = '[🔍 USE-USER-SEARCH]';

export interface UseUserSearchOptions {
	/** Environment ID to fetch users from */
	environmentId: string;
	/** Whether token is valid (required to fetch) */
	tokenValid: boolean;
	/** Maximum pages to fetch initially (default: 10) */
	maxPages?: number;
	/** Whether to use cache (default: true) */
	useCache?: boolean;
}

export interface UseUserSearchReturn {
	/** Current filtered user list */
	users: User[];
	/** All cached users */
	allUsers: User[];
	/** Loading state */
	isLoading: boolean;
	/** Whether initial fetch completed */
	usersFetched: boolean;
	/** Current search query */
	searchQuery: string;
	/** Set search query */
	setSearchQuery: (query: string) => void;
	/** Manually refresh users from server */
	refreshUsers: () => Promise<void>;
}

/**
 * Hook for user search with caching
 *
 * Features:
 * - Auto-fetches users when environment ID and token valid
 * - Uses IndexedDB cache for persistence
 * - Local filtering (instant)
 * - Server search fallback for cache misses
 * - Debounced search (300ms)
 *
 * @example
 * ```tsx
 * const { users, isLoading, searchQuery, setSearchQuery } = useUserSearch({
 *   environmentId: 'env-123',
 *   tokenValid: true,
 * });
 *
 * // Use in SearchableDropdownV8
 * <SearchableDropdownV8
 *   value={username}
 *   options={users.map(u => ({ value: u.username, label: u.username }))}
 *   onChange={setUsername}
 *   isLoading={isLoading}
 *   onSearchChange={setSearchQuery}
 * />
 * ```
 */
export function useUserSearch(options: UseUserSearchOptions): UseUserSearchReturn {
	const { environmentId, tokenValid, maxPages = 100, useCache = true } = options;

	const [users, setUsers] = useState<User[]>([]);
	const [_allUsers, setAllUsers] = useState<User[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [usersFetched, setUsersFetched] = useState(false);

	// Check if users exist in SQLite database
	const checkCache = useCallback(async () => {
		if (!environmentId.trim() || !tokenValid) {
			setUsersFetched(false);
			return;
		}

		try {
			// Use SQLiteStatsServiceV8 to get user count from SQLite database
			const userStats = await SQLiteStatsServiceV8.getUserCount(environmentId);
			setUsersFetched(userStats.success && userStats.totalUsers > 0);

			if (userStats.success) {
				console.log(`${MODULE_TAG} SQLite user count for ${environmentId}:`, userStats.totalUsers);
			} else {
				console.warn(`${MODULE_TAG} Failed to get SQLite user count:`, userStats.error);
			}
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to check SQLite user count:`, error);
			setUsersFetched(false);
		}
	}, [environmentId, tokenValid]);

	// Fetch users to populate cache (background operation)
	const fetchUsers = useCallback(
		async (forceRefresh = false) => {
			if (!environmentId.trim() || !tokenValid) {
				setUsers([]);
				setAllUsers([]);
				setUsersFetched(false);
				return;
			}

			setIsLoading(true);
			try {
				// Fetch to populate cache, but don't load into memory
				const { UserServiceV8 } = await import('@/v8/services/userServiceV8');
				await UserServiceV8.fetchAllUsers(environmentId, {
					maxPages,
					useCache: useCache && !forceRefresh,
				});
				setUsersFetched(true);
				console.log(`${MODULE_TAG} Cache populated, use search to query`);
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to fetch users:`, error);
				setUsersFetched(false);
			} finally {
				setIsLoading(false);
			}
		},
		[environmentId, tokenValid, maxPages, useCache]
	);

	// Initial check when environment ID or token changes
	useEffect(() => {
		checkCache();
	}, [checkCache]);

	// Handle search query changes (search server API)
	useEffect(() => {
		const handleSearch = async () => {
			if (!environmentId.trim() || !tokenValid) {
				setUsers([]);
				return;
			}

			setIsLoading(true);
			try {
				if (!searchQuery || !searchQuery.trim()) {
					// No search - get recent users from server
					console.log(`${MODULE_TAG} No search query - loading recent users from server`);
					const response = await fetch(`/api/users/recent/${environmentId}?limit=100`);
					if (response.ok) {
						const data = await response.json();
						// Ensure we always set an array, even if API returns unexpected format
						const usersArray = Array.isArray(data.users)
							? data.users
							: Array.isArray(data)
								? data
								: [];
						console.log(`${MODULE_TAG} Loaded ${usersArray.length} recent users`);
						setUsers(usersArray);
					} else {
						console.warn(`${MODULE_TAG} Failed to fetch recent users from server`);
						setUsers([]);
					}
				} else {
					// Search via server API
					console.log(`${MODULE_TAG} Searching server for: "${searchQuery}"`);
					const response = await fetch(
						`/api/users/search?environmentId=${environmentId}&q=${encodeURIComponent(searchQuery)}&limit=100`
					);
					if (response.ok) {
						const data = await response.json();
						// Ensure we always set an array, even if API returns unexpected format
						const usersArray = Array.isArray(data.users)
							? data.users
							: Array.isArray(data)
								? data
								: [];
						console.log(`${MODULE_TAG} Found ${usersArray.length} matching users`);
						setUsers(usersArray);
					} else {
						console.warn(`${MODULE_TAG} Search failed on server`);
						setUsers([]);
					}
				}
			} catch (error) {
				console.error(`${MODULE_TAG} Search failed:`, error);
				setUsers([]);
			} finally {
				setIsLoading(false);
			}
		};

		const debounce = setTimeout(handleSearch, 300);
		return () => clearTimeout(debounce);
	}, [searchQuery, environmentId, tokenValid]);

	// Manual refresh function
	const refreshUsers = useCallback(async () => {
		await fetchUsers(true);
	}, [fetchUsers]);

	return {
		users,
		allUsers: [], // No longer needed - we query server directly
		isLoading,
		usersFetched,
		searchQuery,
		setSearchQuery,
		refreshUsers,
	};
}

export default useUserSearch;
