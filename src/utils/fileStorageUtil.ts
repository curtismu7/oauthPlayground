// src/utils/fileStorageUtil.ts
// File storage utility for credential persistence across hard restarts

/**
 * File Storage Utility
 * 
 * Provides file-based credential storage for persistence across browser restarts.
 * 
 * Note: This is a browser-only implementation. For true file system access,
 * a backend API would be needed. For now, we use browser storage as the
 * "file storage" layer with plans to add backend support later.
 * 
 * Future Enhancement: Add backend API endpoints for:
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
 * Currently uses localStorage as a "file storage" simulation.
 * Will be upgraded to use backend API when available.
 */
export class FileStorageUtil {
	private static readonly STORAGE_PREFIX = 'file_storage_';

	/**
	 * Save data to "file" storage
	 * 
	 * @param options - Storage options (directory and filename)
	 * @param data - Data to save
	 * @returns Result indicating success/failure
	 */
	static async save<T>(
		options: FileStorageOptions,
		data: T
	): Promise<FileStorageResult<void>> {
		try {
			const key = this.getStorageKey(options);
			const serialized = JSON.stringify(data);

			// For now, use localStorage as "file storage"
			// TODO: Replace with backend API call
			localStorage.setItem(key, serialized);

			console.log(`📁 [FileStorage] Saved to ${options.directory}/${options.filename}`);

			return {
				success: true,
			};
		} catch (error) {
			console.error(`❌ [FileStorage] Failed to save:`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Load data from "file" storage
	 * 
	 * @param options - Storage options (directory and filename)
	 * @returns Result with data or error
	 */
	static async load<T>(
		options: FileStorageOptions
	): Promise<FileStorageResult<T>> {
		try {
			const key = this.getStorageKey(options);

			// For now, use localStorage as "file storage"
			// TODO: Replace with backend API call
			const stored = localStorage.getItem(key);

			if (!stored) {
				return {
					success: false,
					error: 'File not found',
				};
			}

			const data = JSON.parse(stored) as T;

			console.log(`📁 [FileStorage] Loaded from ${options.directory}/${options.filename}`);

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
	 * Delete "file" from storage
	 * 
	 * @param options - Storage options (directory and filename)
	 * @returns Result indicating success/failure
	 */
	static async delete(
		options: FileStorageOptions
	): Promise<FileStorageResult<void>> {
		try {
			const key = this.getStorageKey(options);

			// For now, use localStorage as "file storage"
			// TODO: Replace with backend API call
			localStorage.removeItem(key);

			console.log(`📁 [FileStorage] Deleted ${options.directory}/${options.filename}`);

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
	 * Check if "file" exists
	 * 
	 * @param options - Storage options (directory and filename)
	 * @returns True if file exists
	 */
	static async exists(options: FileStorageOptions): Promise<boolean> {
		const key = this.getStorageKey(options);
		return localStorage.getItem(key) !== null;
	}

	/**
	 * List all "files" in a directory
	 * 
	 * @param directory - Directory to list
	 * @returns Array of filenames
	 */
	static async listFiles(directory: string): Promise<string[]> {
		const prefix = `${this.STORAGE_PREFIX}${directory}/`;
		const files: string[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith(prefix)) {
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
		return `${this.STORAGE_PREFIX}${options.directory}/${options.filename}`;
	}
}

export default FileStorageUtil;
