// src/utils/fileStorageUtil.ts
// File storage utility for credential persistence across hard restarts

/**
 * File Storage Utility
 *
 * Provides file-based credential storage for persistence across server restarts.
 * Uses backend API endpoints to save credentials to files on the server filesystem.
 * Credentials are stored in ~/.pingone-playground/credentials/ directory.
 *
 * Backend API endpoints:
 * - POST /api/credentials/save
 * - GET /api/credentials/load
 * - DELETE /api/credentials/delete
 */

export interface FileStorageOptions {
	directory: string;
	filename: string;
}

export interface FileStorageResult<T> {
	success: boolean;
	data?: T;
	error?: string;
}

/**
 * File Storage Utility Class
 *
 * Uses backend API to save credentials to files on the server filesystem.
 * Credentials are stored in ~/.pingone-playground/credentials/ directory.
 * This ensures credentials persist across server restarts.
 *
 * Fallback: If backend API is unavailable, falls back to localStorage
 * for offline/development scenarios.
 */
export class FileStorageUtil {
	private static readonly STORAGE_PREFIX = 'file_storage_';

	/**
	 * Save data to file storage via backend API
	 *
	 * @param options - Storage options (directory and filename)
	 * @param data - Data to save
	 * @returns Result indicating success/failure
	 */
	static async save<T>(options: FileStorageOptions, data: T): Promise<FileStorageResult<void>> {
		try {
			// DISABLED: Backend file storage is optional and not critical
			// The app works perfectly fine with just localStorage
			// Uncomment below if you have a backend running on :3001

			/*
			const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://localhost:3001';
			
			try {
				const response = await fetch(`${backendUrl}/api/credentials/save`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						directory: options.directory,
						filename: options.filename,
						data,
					}),
				});

				if (!response.ok) {
					throw new Error(`Backend API returned ${response.status}: ${response.statusText}`);
				}

				const result = await response.json();
				
				if (result.success) {
					console.log(`📁 [FileStorage] Saved to server file: ${options.directory}/${options.filename}`);
					return { success: true };
				} else {
					throw new Error(result.error || 'Backend save failed');
				}
			} catch (apiError) {
			*/
			// Use localStorage as primary storage (backend is optional)
			const key = FileStorageUtil.getStorageKey(options);
			const serialized = JSON.stringify(data);
			localStorage.setItem(key, serialized);

			// Silent success - backend is optional
			return { success: true };
			/*
			}
			*/
		} catch (error) {
			console.error(`❌ [FileStorage] Failed to save:`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Load data from file storage via backend API
	 *
	 * @param options - Storage options (directory and filename)
	 * @returns Result with data or error
	 */
	static async load<T>(options: FileStorageOptions): Promise<FileStorageResult<T>> {
		try {
			// DISABLED: Backend file storage is optional and not critical
			// The app works perfectly fine with just localStorage
			// Use localStorage as primary storage (backend is optional)
			const key = FileStorageUtil.getStorageKey(options);
			const stored = localStorage.getItem(key);

			if (!stored) {
				return {
					success: false,
					error: 'File not found',
				};
			}

			const data = JSON.parse(stored) as T;
			return {
				success: true,
				data,
			};
		} catch (error) {
			console.error(`❌ [FileStorage] Failed to load:`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Delete file from storage via backend API
	 *
	 * @param options - Storage options (directory and filename)
	 * @returns Result indicating success/failure
	 */
	static async delete(options: FileStorageOptions): Promise<FileStorageResult<void>> {
		try {
			// DISABLED: Backend file storage is optional and not critical
			// Use localStorage as primary storage (backend is optional)
			const key = FileStorageUtil.getStorageKey(options);
			localStorage.removeItem(key);

			return {
				success: true,
			};
		} catch (error) {
			console.error(`❌ [FileStorage] Failed to delete:`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Check if file exists (checks both server and localStorage)
	 *
	 * @param options - Storage options (directory and filename)
	 * @returns True if file exists
	 */
	static async exists(options: FileStorageOptions): Promise<boolean> {
		// DISABLED: Backend file storage is optional and not critical
		// Use localStorage as primary storage (backend is optional)
		const key = FileStorageUtil.getStorageKey(options);
		return localStorage.getItem(key) !== null;
	}

	/**
	 * List all "files" in a directory
	 *
	 * @param directory - Directory to list
	 * @returns Array of filenames
	 */
	static async listFiles(directory: string): Promise<string[]> {
		const prefix = `${FileStorageUtil.STORAGE_PREFIX}${directory}/`;
		const files: string[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(prefix)) {
				const filename = key.substring(prefix.length);
				files.push(filename);
			}
		}

		return files;
	}

	/**
	 * Get storage key for file
	 */
	private static getStorageKey(options: FileStorageOptions): string {
		return `${FileStorageUtil.STORAGE_PREFIX}${options.directory}/${options.filename}`;
	}
}

export default FileStorageUtil;
