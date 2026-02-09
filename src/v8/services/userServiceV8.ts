/**
 * UserServiceV8
 *
 * Centralized service for PingOne user operations
 * Handles pagination and search across large user directories
 */

import { unifiedWorkerTokenService } from '@/services/unifiedWorkerTokenService';
import { backendConnectivityService } from './backendConnectivityServiceV8';

const MODULE_TAG = '[UserServiceV8]';

export interface User {
	id: string;
	username: string;
	email: string;
}

export interface ListUsersResult {
	users: User[];
	count: number;
	totalCount: number;
	hasMore: boolean;
	limit: number;
	offset: number;
}

export interface ListUsersOptions {
	/** Search term to filter users */
	search?: string;
	/** Number of users per page (PingOne max: 200) */
	limit?: number;
	/** Offset for pagination */
	offset?: number;
	/** Region for API endpoint */
	region?: 'na' | 'eu' | 'asia';
	/** Only return users updated since this date (ISO string) */
	updatedSince?: string;
}

export interface FetchAllUsersOptions {
	/** Maximum number of pages to fetch (default: 100) */
	maxPages?: number;
	/** Delay between requests in ms (default: 100) */
	delayMs?: number;
	/** Progress callback for each page */
	onProgress?: (current: number, total: number, pageUsers: User[]) => void;
}

/**
 * UserServiceV8
 *
 * Provides centralized user management operations for PingOne
 */
export class UserServiceV8 {
	/**
	 * List users with pagination and search
	 *
	 * @param environmentId - PingOne environment ID
	 * @param options - List options (search, limit, offset, region)
	 * @returns Paginated list of users
	 *
	 * @example
	 * ```typescript
	 * // List first 200 users
	 * const result = await UserServiceV8.listUsers(envId);
	 *
	 * // Search for users
	 * const searched = await UserServiceV8.listUsers(envId, { search: 'curtis' });
	 *
	 * // Paginate through users
	 * const page2 = await UserServiceV8.listUsers(envId, { limit: 200, offset: 200 });
	 * ```
	 */
	static async listUsers(
		environmentId: string,
		options: ListUsersOptions = {}
	): Promise<ListUsersResult> {
		try {
			const accessToken = await unifiedWorkerTokenService.getToken();
			if (!accessToken) {
				throw new Error('Worker token not available. Please authenticate first.');
			}

			const { search, limit = 10, offset = 0, region = 'na', updatedSince } = options;

			const requestBody = {
				environmentId,
				workerToken: accessToken,
				...(search && { search }),
				...(updatedSince && { updatedSince }),
				limit,
				offset,
				region,
			};

			const response = await fetch('/api/pingone/mfa/list-users', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				// Record backend error
				if (response.status >= 500) {
					backendConnectivityService.recordFailure();
				}

				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(
					`Failed to list users: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			// Record success
			backendConnectivityService.recordSuccess();

			const data = await response.json();
			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} List users error`, error);
			throw error;
		}
	}

	/**
	 * Search all users on server-side by paging through results (useful when search doesn't
	 * return all matches in a single page). Aggregates pages until no more results or
	 * until maxPages is reached.
	 */
	static async searchAllUsers(
		environmentId: string,
		options: ListUsersOptions & { maxPages?: number } = {}
	): Promise<User[]> {
		const { search, limit = 200, region = 'na', maxPages = 10 } = options;
		let offset = 0;
		const all: User[] = [];
		let page = 0;

		console.log(
			`${MODULE_TAG} searchAllUsers: starting multi-page search for "${search}" (limit=${limit}, maxPages=${maxPages})`
		);

		while (page < maxPages) {
			console.log(`${MODULE_TAG} searchAllUsers: fetching page ${page + 1} at offset ${offset}`);

			const result = await UserServiceV8.listUsers(environmentId, {
				search,
				limit,
				offset,
				region,
			});

			console.log(`${MODULE_TAG} searchAllUsers: page ${page + 1} returned`, {
				usersCount: result.users?.length || 0,
				hasMore: result.hasMore,
				totalCount: result.totalCount,
			});

			if (!result || !Array.isArray(result.users) || result.users.length === 0) {
				console.log(`${MODULE_TAG} searchAllUsers: no more users, breaking`);
				break;
			}

			// Append unique users by id
			const beforeCount = all.length;
			for (const u of result.users) {
				if (!all.some((existing) => existing.id === u.id)) all.push(u);
			}
			console.log(
				`${MODULE_TAG} searchAllUsers: added ${all.length - beforeCount} unique users (${beforeCount} -> ${all.length})`
			);

			page += 1;

			// Continue if:
			// 1. API says hasMore is true, OR
			// 2. We got a full page of results (indicates more might exist), OR
			// 3. totalCount indicates more results exist
			const gotFullPage = result.users.length >= limit;
			const moreExist = result.totalCount && all.length < result.totalCount;
			const shouldContinue = result.hasMore || gotFullPage || moreExist;

			console.log(
				`${MODULE_TAG} searchAllUsers: shouldContinue=${shouldContinue} (hasMore=${result.hasMore}, gotFullPage=${gotFullPage}, moreExist=${moreExist})`
			);

			if (!shouldContinue) break;

			offset += limit;

			// Small delay to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		console.log(
			`${MODULE_TAG} searchAllUsers: completed - fetched ${page} pages, ${all.length} unique users`
		);
		return all;
	}

	/**
	 * Fetch all users from an environment with pagination
	 *
	 * Automatically handles pagination and returns all users up to maxPages.
	 * Fetches directly from PingOne API for fresh data.
	 *
	 * @param environmentId - Environment ID
	 * @param options - Fetch options
	 * @returns Promise resolving to array of users
	 *
	 * @example
	 * ```typescript
	 * // Fetch up to 10 pages (2000 users)
	 * const users = await UserServiceV8.fetchAllUsers(envId);
	 *
	 * // Fetch up to 20 pages (4000 users) with progress tracking
	 * const users = await UserServiceV8.fetchAllUsers(envId, { 
	 *   maxPages: 20,
	 *   onProgress: (count, pages, latest) => console.log(`Fetched ${count} users`)
	 * });
	 * ```
	 */
	static async fetchAllUsers(
		environmentId: string,
		options: FetchAllUsersOptions = {}
	): Promise<User[]> {
		const { maxPages = 10, delayMs = 100, onProgress } = options;

		
		const allUsers: User[] = [];
		let offset = 0;
		const limit = 200; // PingOne max per request
		let hasMore = true;
		let fetchedPages = 0;

		console.log(`${MODULE_TAG} Starting to fetch users from environment:`, environmentId);

		try {
			while (hasMore && fetchedPages < maxPages) {
				const result = await UserServiceV8.listUsers(environmentId, { limit, offset });
				const fetchedCount = result.users.length;

				if (fetchedCount > 0) {
					allUsers.push(...result.users);
					fetchedPages++;

					console.log(
						`${MODULE_TAG} Fetched page ${fetchedPages} at offset ${offset} - got ${fetchedCount} users. Total: ${allUsers.length}`
					);

					// Call progress callback
					onProgress?.(allUsers.length, fetchedPages, result.users);
				}

				// Check if there are more results
				hasMore = result.hasMore && fetchedCount > 0;

				if (hasMore) {
					offset += fetchedCount; // Use actual count (PingOne may return less than requested)

					// Delay between requests to avoid rate limiting
					if (delayMs > 0) {
						await new Promise((resolve) => setTimeout(resolve, delayMs));
					}
				}
			}

			console.log(
				`${MODULE_TAG} Finished fetching users. Total: ${allUsers.length} across ${fetchedPages} pages`
			);

			
			return allUsers;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to fetch all users:`, error);
			throw error;
		}
	}

	/**
	 * Search users locally from a cached list
	 *
	 * @param users - Cached user list
	 * @param searchTerm - Search term
	 * @returns Filtered users
	 */
	static searchLocal(users: User[], searchTerm: string): User[] {
		if (!searchTerm || !searchTerm.trim()) {
			return users;
		}

		const lowerSearch = searchTerm.toLowerCase();
		return users.filter(
			(user) =>
				user.username.toLowerCase().includes(lowerSearch) ||
				user.email?.toLowerCase().includes(lowerSearch)
		);
	}

	/**
	 * Get user by ID
	 *
	 * Note: This requires a separate API call. If you have the user cached, use that instead.
	 *
	 * @param environmentId - PingOne environment ID
	 * @param userId - User ID
	 * @returns User details
	 */
	static async getUser(environmentId: string, userId: string): Promise<User> {
		try {
			const accessToken = await unifiedWorkerTokenService.getToken();
			if (!accessToken) {
				throw new Error('Worker token not available. Please authenticate first.');
			}

			const response = await fetch('/api/pingone/mfa/get-user', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					workerToken: accessToken,
					userId,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(
					`Failed to get user: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Get user error`, error);
			throw error;
		}
	}
}

export default UserServiceV8;
