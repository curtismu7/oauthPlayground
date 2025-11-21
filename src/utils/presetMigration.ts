// src/utils/presetMigration.ts
// Migration utilities for configuration presets

import type { ConfigurationPreset } from '../services/presetManagerService';
import { migratePreset, sanitizePreset, validatePreset } from './presetValidation';

export interface MigrationResult {
	success: boolean;
	migratedCount: number;
	errors: string[];
	warnings: string[];
}

/**
 * Current preset schema version
 */
const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * Migrates custom presets to the latest schema version
 */
export function migrateCustomPresets(): MigrationResult {
	const result: MigrationResult = {
		success: true,
		migratedCount: 0,
		errors: [],
		warnings: [],
	};

	try {
		const storageKey = 'app-generator-custom-presets';
		const stored = localStorage.getItem(storageKey);

		if (!stored) {
			return result; // No presets to migrate
		}

		let presets: any[];
		try {
			presets = JSON.parse(stored);
		} catch (_parseError) {
			result.success = false;
			result.errors.push('Failed to parse stored presets: Invalid JSON format');
			return result;
		}

		if (!Array.isArray(presets)) {
			result.success = false;
			result.errors.push('Stored presets data is not in array format');
			return result;
		}

		const migratedPresets: ConfigurationPreset[] = [];

		for (let i = 0; i < presets.length; i++) {
			const preset = presets[i];

			try {
				// Attempt to migrate the preset
				const migrated = migratePreset(preset);

				if (!migrated) {
					result.warnings.push(`Failed to migrate preset at index ${i}: Unable to convert format`);
					continue;
				}

				// Sanitize the migrated preset
				const sanitized = sanitizePreset(migrated);

				// Validate the migrated preset
				const validation = validatePreset(sanitized);

				if (!validation.isValid) {
					result.warnings.push(
						`Preset "${sanitized.name}" has validation errors: ${validation.errors.map((e) => e.message).join(', ')}`
					);
					// Still include it but mark as warning
				}

				// Add schema version
				const finalPreset: ConfigurationPreset = {
					...sanitized,
					metadata: {
						...sanitized.metadata,
						schemaVersion: CURRENT_SCHEMA_VERSION,
						migrated: true,
						migratedAt: new Date().toISOString(),
					},
				};

				migratedPresets.push(finalPreset);
				result.migratedCount++;
			} catch (error) {
				result.warnings.push(
					`Failed to migrate preset at index ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		}

		// Save migrated presets back to storage
		try {
			localStorage.setItem(storageKey, JSON.stringify(migratedPresets));
		} catch (_saveError) {
			result.success = false;
			result.errors.push('Failed to save migrated presets to storage');
			return result;
		}

		if (result.migratedCount > 0) {
			console.log(`[PresetMigration] Successfully migrated ${result.migratedCount} presets`);
		}
	} catch (error) {
		result.success = false;
		result.errors.push(
			`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}

	return result;
}

/**
 * Checks if presets need migration
 */
export function needsMigration(): boolean {
	try {
		const stored = localStorage.getItem('app-generator-custom-presets');
		if (!stored) return false;

		const presets = JSON.parse(stored);
		if (!Array.isArray(presets)) return true;

		// Check if any preset lacks the current schema version
		return presets.some(
			(preset) =>
				!preset.metadata?.schemaVersion || preset.metadata.schemaVersion !== CURRENT_SCHEMA_VERSION
		);
	} catch {
		return true; // If we can't parse, assume migration is needed
	}
}

/**
 * Creates a backup of current presets before migration
 */
export function createPresetBackup(): boolean {
	try {
		const stored = localStorage.getItem('app-generator-custom-presets');
		if (!stored) return true; // No data to backup

		const backupKey = `app-generator-custom-presets-backup-${Date.now()}`;
		localStorage.setItem(backupKey, stored);

		console.log(`[PresetMigration] Created backup at key: ${backupKey}`);
		return true;
	} catch (error) {
		console.error('[PresetMigration] Failed to create backup:', error);
		return false;
	}
}

/**
 * Restores presets from a backup
 */
export function restoreFromBackup(backupKey: string): boolean {
	try {
		const backup = localStorage.getItem(backupKey);
		if (!backup) {
			console.error('[PresetMigration] Backup not found:', backupKey);
			return false;
		}

		localStorage.setItem('app-generator-custom-presets', backup);
		console.log(`[PresetMigration] Restored presets from backup: ${backupKey}`);
		return true;
	} catch (error) {
		console.error('[PresetMigration] Failed to restore from backup:', error);
		return false;
	}
}

/**
 * Lists available backups
 */
export function listBackups(): string[] {
	const backups: string[] = [];

	try {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith('app-generator-custom-presets-backup-')) {
				backups.push(key);
			}
		}
	} catch (error) {
		console.error('[PresetMigration] Failed to list backups:', error);
	}

	return backups.sort().reverse(); // Most recent first
}

/**
 * Cleans up old backups (keeps only the 5 most recent)
 */
export function cleanupOldBackups(): number {
	const backups = listBackups();
	const toDelete = backups.slice(5); // Keep only 5 most recent

	let deletedCount = 0;
	for (const backup of toDelete) {
		try {
			localStorage.removeItem(backup);
			deletedCount++;
		} catch (error) {
			console.warn(`[PresetMigration] Failed to delete backup ${backup}:`, error);
		}
	}

	if (deletedCount > 0) {
		console.log(`[PresetMigration] Cleaned up ${deletedCount} old backups`);
	}

	return deletedCount;
}

/**
 * Performs automatic migration with backup
 */
export function performAutoMigration(): MigrationResult {
	const result: MigrationResult = {
		success: true,
		migratedCount: 0,
		errors: [],
		warnings: [],
	};

	try {
		// Check if migration is needed
		if (!needsMigration()) {
			return result; // No migration needed
		}

		// Create backup before migration
		if (!createPresetBackup()) {
			result.warnings.push('Failed to create backup before migration');
		}

		// Perform migration
		const migrationResult = migrateCustomPresets();

		// Merge results
		result.success = migrationResult.success;
		result.migratedCount = migrationResult.migratedCount;
		result.errors.push(...migrationResult.errors);
		result.warnings.push(...migrationResult.warnings);

		// Clean up old backups
		cleanupOldBackups();
	} catch (error) {
		result.success = false;
		result.errors.push(
			`Auto-migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}

	return result;
}
