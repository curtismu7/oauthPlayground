/**
 * @file global.d.ts
 * @module types
 * @description Global type definitions for window object extensions
 * @version 9.0.0
 * @since 2026-02-28
 */

declare global {
	interface Window {
		// IndexedDB Backup Services
		IndexedDBBackupServiceV8U?: {
			save<T>(key: string, data: T): Promise<void>;
			load<T>(key: string): Promise<T | null>;
			delete(key: string): Promise<void>;
		};

		// Global Service References (for debugging)
		UnifiedOAuthCredentialsServiceV8U?: unknown;
		MFADeviceManagerV8?: unknown;
		TokenMonitoringServiceV8U?: unknown;

		// Debug Utilities
		debugLogViewerPopoutHelperV8?: {
			isPopoutWindow(): boolean;
		};

		// Other Global Services
		[key: string]: unknown;
	}
}

export {};
