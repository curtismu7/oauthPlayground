/**
 * @file dualStorageServiceV8.ts
 * @module v8/services
 * @description Dual storage service: Browser storage first, then disk fallback
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This service provides dual storage for V8 credentials and worker tokens:
 * 1. Browser storage (localStorage) - checked first, fastest
 * 2. Disk storage (via backend API) - fallback if browser storage is empty
 *
 * This ensures credentials persist even if browser storage is cleared.
 */

import { FileStorageUtil } from '../../utils/fileStorageUtil.ts';

const MODULE_TAG = '[💾 DUAL-STORAGE-V8]';

export interface DualStorageOptions {
	directory: string;
	filename: string;
	browserStorageKey: string;
}

export interface DualStorageResult<T> {
	success: boolean;
	data?: T;
	error?: string;
	source?: 'browser' | 'disk' | 'none';
}

export class DualStorageServiceV8 {
	/**
	 * Save data to both browser storage and disk
	 * @param options - Storage options
	 * @param data - Data to save
	 * @returns Result indicating success/failure
	 */
	static async save<T>(options: DualStorageOptions, data: T): Promise<DualStorageResult<void>> {
		console.log(`${MODULE_TAG} Saving to dual storage`, {
			browserKey: options.browserStorageKey,
			diskPath: `${options.directory}/${options.filename}`,
		});

		// Save to browser storage first (fastest, always available)
		try {
			localStorage.setItem(options.browserStorageKey, JSON.stringify(data));
			console.log(`${MODULE_TAG} Saved to browser storage: ${options.browserStorageKey}`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save to browser storage`, { error });
			// Continue to disk storage even if browser storage fails
		}

		// Also save to disk storage (persists across browser clears)
		try {
			const diskResult = await FileStorageUtil.save(
				{ directory: options.directory, filename: options.filename },
				data
			);

			if (diskResult.success) {
				console.log(
					`${MODULE_TAG} Saved to disk storage: ${options.directory}/${options.filename}`
				);
			} else {
				console.warn(
					`${MODULE_TAG} Failed to save to disk storage (non-critical):`,
					diskResult.error
				);
			}
		} catch (diskError) {
			console.warn(`${MODULE_TAG} Disk storage save failed (non-critical):`, diskError);
			// Browser storage is primary, so this is non-critical
		}

		return { success: true, source: 'browser' };
	}

	/**
	 * Load data: browser storage first, then disk fallback
	 * @param options - Storage options
	 * @returns Result with data and source
	 */
	static async load<T>(options: DualStorageOptions): Promise<DualStorageResult<T>> {
		console.log(`${MODULE_TAG} Loading from dual storage`, {
			browserKey: options.browserStorageKey,
			diskPath: `${options.directory}/${options.filename}`,
		});

		// Try browser storage first (fastest)
		try {
			const browserData = localStorage.getItem(options.browserStorageKey);
			if (browserData) {
				const parsed = JSON.parse(browserData) as T;
				console.log(`${MODULE_TAG} Loaded from browser storage: ${options.browserStorageKey}`);
				return { success: true, data: parsed, source: 'browser' };
			}
		} catch (error) {
			console.warn(`${MODULE_TAG} Browser storage read failed, trying disk:`, error);
		}

		// Fallback to disk storage
		try {
			const diskResult = await FileStorageUtil.load<T>({
				directory: options.directory,
				filename: options.filename,
			});

			if (diskResult.success && diskResult.data) {
				// Restore to browser storage for faster future access
				try {
					localStorage.setItem(options.browserStorageKey, JSON.stringify(diskResult.data));
					console.log(
						`${MODULE_TAG} Restored from disk to browser storage: ${options.browserStorageKey}`
					);
				} catch (error) {
					console.warn(`${MODULE_TAG} Failed to restore to browser storage (non-critical):`, error);
				}

				console.log(
					`${MODULE_TAG} Loaded from disk storage: ${options.directory}/${options.filename}`
				);
				return { success: true, data: diskResult.data, source: 'disk' };
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Disk storage load failed:`, error);
		}

		return {
			success: false,
			error: 'Data not found in browser or disk storage',
			source: 'none',
		};
	}

	/**
	 * Delete data from both browser storage and disk
	 * @param options - Storage options
	 * @returns Result indicating success/failure
	 */
	static async delete(options: DualStorageOptions): Promise<DualStorageResult<void>> {
		console.log(`${MODULE_TAG} Deleting from dual storage`, {
			browserKey: options.browserStorageKey,
			diskPath: `${options.directory}/${options.filename}`,
		});

		// Delete from browser storage
		try {
			localStorage.removeItem(options.browserStorageKey);
			console.log(`${MODULE_TAG} Deleted from browser storage: ${options.browserStorageKey}`);
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to delete from browser storage:`, error);
		}

		// Delete from disk storage
		try {
			await FileStorageUtil.delete({
				directory: options.directory,
				filename: options.filename,
			});
			console.log(
				`${MODULE_TAG} Deleted from disk storage: ${options.directory}/${options.filename}`
			);
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to delete from disk storage:`, error);
		}

		return { success: true };
	}

	/**
	 * Check if data exists (checks browser first, then disk)
	 * @param options - Storage options
	 * @returns True if data exists
	 */
	static async exists(options: DualStorageOptions): Promise<boolean> {
		// Check browser storage first
		try {
			if (localStorage.getItem(options.browserStorageKey)) {
				return true;
			}
		} catch {
			// Continue to disk check
		}

		// Check disk storage
		return await FileStorageUtil.exists({
			directory: options.directory,
			filename: options.filename,
		});
	}
}
