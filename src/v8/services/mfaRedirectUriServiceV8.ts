/**
 * @file mfaRedirectUriServiceV8.ts
 * @module v8/services
 * @description Centralized service for MFA redirect URIs using flow mapping
 * @version 8.0.0
 *
 * This service provides the correct redirect URI for MFA flows based on the flow type.
 * Each flow has its own unique redirect URI to return to the correct place in the app.
 */

import { unifiedTokenStorage } from '@/services/unifiedTokenStorageService';
import {
	generateRedirectUriForFlow,
	getAllFlowRedirectUriConfigs,
	getFlowRedirectUriConfig,
} from '@/utils/flowRedirectUriMapping';

const MODULE_TAG = '[🔗 MFA-REDIRECT-URI-SERVICE-V8]';

// Debug configuration
const DEBUG_MODE = true; // Set to false in production
const DEBUG_PREFIX = '[MFA-REDIRECT-DEBUG]';
const PERSISTENT_LOG_KEY = 'mfa_redirect_debug_log';
const MAX_LOG_ENTRIES = 50;

/**
 * Persistent logging that survives redirects
 */
const PersistentLogger = {
	/**
	 * Add a log entry that persists across redirects
	 */
	log(
		level: 'INFO' | 'WARN' | 'ERROR',
		category: string,
		message: string,
		data?: Record<string, unknown>
	): void {
		if (!DEBUG_MODE) return;

		const entry = {
			timestamp: new Date().toISOString(),
			level,
			category,
			message,
			...(data && { data }),
			url: window.location.href,
		};

		// Get existing logs asynchronously and update
		(async () => {
			try {
				const result = await unifiedTokenStorage.getMFADebugLogs(PERSISTENT_LOG_KEY);
				const existingLogs: Array<{
					timestamp: string;
					level: 'INFO' | 'WARN' | 'ERROR';
					category: string;
					message: string;
					data?: Record<string, unknown>;
					url: string;
				}> = result.success && result.data && result.data.length > 0 ? result.data[0] : [];

				// Add new entry
				existingLogs.push(entry);

				// Keep only the latest entries
				if (existingLogs.length > MAX_LOG_ENTRIES) {
					existingLogs.splice(0, existingLogs.length - MAX_LOG_ENTRIES);
				}

				// Save to unified storage
				await unifiedTokenStorage.storeMFADebugLogs(PERSISTENT_LOG_KEY, existingLogs);
			} catch (error) {
				console.warn('Failed to save debug log to unified storage:', error);
			}
		})();

		// Also log to console for immediate visibility
		const consoleMethod =
			level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
		consoleMethod(`${DEBUG_PREFIX} [${category}] ${message}`, data || '');
	},

	/**
	 * Get all stored logs
	 */
	async getLogs(): Promise<
		Array<{
			timestamp: string;
			level: 'INFO' | 'WARN' | 'ERROR';
			category: string;
			message: string;
			data?: Record<string, unknown>;
			url: string;
		}>
	> {
		try {
			const result = await unifiedTokenStorage.getMFADebugLogs(PERSISTENT_LOG_KEY);
			if (result.success && result.data && result.data.length > 0) {
				return result.data[0] as Array<{
					timestamp: string;
					level: 'INFO' | 'WARN' | 'ERROR';
					category: string;
					message: string;
					data?: Record<string, unknown>;
					url: string;
				}>;
			}
			return [];
		} catch (error) {
			console.warn('Failed to get debug logs from unified storage:', error);
			return [];
		}
	},

	/**
	 * Clear all stored logs
	 */
	async clearLogs(): Promise<void> {
		try {
			await unifiedTokenStorage.clearMFADebugLogs(PERSISTENT_LOG_KEY);
		} catch (error) {
			console.warn('Failed to clear debug logs from unified storage:', error);
		}
	},

	/**
	 * Get logs as formatted string for display
	 */
	async getFormattedLogs(): Promise<string> {
		const logs = await PersistentLogger.getLogs();
		if (logs.length === 0) {
			return 'No debug logs found';
		}

		return logs
			.map((entry) => {
				const time = new Date(entry.timestamp).toLocaleTimeString();
				return `[${time}] ${entry.level} [${entry.category}] ${entry.message}${
					entry.data ? `\n  Data: ${JSON.stringify(entry.data, null, 2)}` : ''
				}`;
			})
			.join('\n\n');
	},

	/**
	 * Log redirect URI specific information
	 */
	logRedirectUri(
		flowType: string,
		redirectUri: string | null,
		fallback?: string,
		config?: Record<string, unknown>
	): void {
		PersistentLogger.log('INFO', 'REDIRECT_URI', `Processing redirect URI for flow: ${flowType}`, {
			redirectUri,
			fallback,
			config,
			currentUrl: window.location.href,
			origin: window.location.origin,
			host: window.location.host,
		});
	},

	/**
	 * Log migration events
	 */
	logMigration(oldUri: string | undefined, newUri: string, flowType: string): void {
		PersistentLogger.log('INFO', 'MIGRATION', `URI migration for flow: ${flowType}`, {
			oldUri,
			newUri,
			changed: oldUri !== newUri,
		});
	},

	/**
	 * Log validation issues
	 */
	logValidation(flowType: string, uri: string, issues: string[]): void {
		PersistentLogger.log(
			issues.length > 0 ? 'WARN' : 'INFO',
			'VALIDATION',
			`URI validation for ${flowType}: ${issues.length} issues found`,
			{
				uri,
				issues,
				valid: issues.length === 0,
			}
		);
	},

	/**
	 * Log flow mapping information
	 */
	logFlowMappings(flowType: string, config: Record<string, unknown>): void {
		PersistentLogger.log('INFO', 'FLOW_MAPPING', `Flow configuration for: ${flowType}`, config);
	},
};

/**
 * Enhanced debugging utilities for MFA redirect URIs
 */
const MFARedirectUriDebugger = {
	/**
	 * Validate a redirect URI and return any issues
	 */
	validateUri(uri: string): string[] {
		const issues: string[] = [];

		if (!uri) {
			issues.push('Empty URI');
		} else {
			if (!uri.startsWith('https://') && !uri.startsWith('http://')) {
				issues.push('Missing protocol (http/https)');
			}
			if (uri.includes('localhost') && !uri.startsWith('https://')) {
				issues.push('Localhost should use HTTPS');
			}
			if (uri.includes('#')) {
				issues.push('Contains fragment (#) - not allowed in redirect URIs');
			}
		}

		return issues;
	},

	/**
	 * Log detailed redirect URI information
	 */
	logRedirectUriDetails(flowType: string, redirectUri: string | null, fallback?: string): void {
		if (!DEBUG_MODE) return;

		console.group(`${DEBUG_PREFIX} Redirect URI Analysis for: ${flowType}`);
		console.log('📍 Flow Type:', flowType);
		console.log('🔗 Generated Redirect URI:', redirectUri);
		console.log('🌐 Current Origin:', window.location.origin);
		console.log('🏠 Current Host:', window.location.host);
		console.log('🛣️ Current Pathname:', window.location.pathname);

		if (fallback) {
			console.log('⚠️ Fallback URI Used:', fallback);
			console.log('❌ Reason: No mapping found for flow type');
		}

		// Check if URI is HTTPS
		if (redirectUri) {
			const isHttps = redirectUri.startsWith('https://');
			console.log('🔒 HTTPS Protocol:', isHttps ? '✅ Yes' : '❌ No');

			if (!isHttps) {
				console.warn('⚠️ SECURITY WARNING: Redirect URI is not using HTTPS!');
			}
		}

		// Get flow configuration details
		const config = getFlowRedirectUriConfig(flowType);
		if (config) {
			console.log('📋 Flow Config:', {
				requiresRedirectUri: config.requiresRedirectUri,
				callbackPath: config.callbackPath,
				description: config.description,
				specification: config.specification,
			});
		} else {
			console.warn('⚠️ No flow configuration found for:', flowType);
		}

		console.groupEnd();
	},

	/**
	 * Log migration information
	 */
	logMigration(oldUri: string | undefined, newUri: string, flowType: string): void {
		if (!DEBUG_MODE) return;

		console.group(`${DEBUG_PREFIX} URI Migration`);
		console.log('🔄 Flow Type:', flowType);
		console.log('📤 Old URI:', oldUri || 'None');
		console.log('📥 New URI:', newUri);
		console.log(`✅ Migration Status: ${oldUri !== newUri ? 'Changed' : 'No change needed'}`);
		console.groupEnd();
	},

	/**
	 * Log validation results
	 */
	logValidation(flowType: string, uri: string): void {
		if (!DEBUG_MODE) return;

		const issues: string[] = [];

		// Check for common issues
		if (!uri) {
			issues.push('Empty URI');
		} else {
			if (!uri.startsWith('https://') && !uri.startsWith('http://')) {
				issues.push('Missing protocol (http/https)');
			}
			if (uri.includes('localhost') && !uri.startsWith('https://')) {
				issues.push('Localhost should use HTTPS');
			}
			if (uri.includes('#')) {
				issues.push('Contains fragment (#) - not allowed in redirect URIs');
			}
		}

		console.group(`${DEBUG_PREFIX} URI Validation for: ${flowType}`);
		console.log('🔗 URI:', uri);

		if (issues.length > 0) {
			console.warn('⚠️ Issues Found:');
			issues.forEach((issue) => {
				console.warn('  -', issue);
			});
		} else {
			console.log('✅ URI validation passed');
		}

		console.groupEnd();
	},

	/**
	 * Log all available flow mappings
	 */
	logAllFlowMappings(): void {
		if (!DEBUG_MODE) return;

		const allConfigs = getAllFlowRedirectUriConfigs();

		console.group(`${DEBUG_PREFIX} All Flow Mappings`);
		console.log('📊 Total flows configured:', allConfigs.length);

		allConfigs.forEach((config) => {
			console.log(`🔄 ${config.flowType}:`, {
				path: config.callbackPath,
				requiresUri: config.requiresRedirectUri,
				description: config.description,
			});
		});

		console.groupEnd();
	},
};

/**
 * MFA Redirect URI Service
 *
 * Provides the correct redirect URI for MFA flows based on flow type.
 * Uses the centralized flow mapping system to ensure each flow gets its unique URI.
 */
export const MFARedirectUriServiceV8 = {
	/**
	 * Get the redirect URI for a specific MFA flow type
	 * This uses the centralized flow mapping to get the correct unique URI
	 *
	 * @param flowType - The flow type (e.g., 'unified-mfa-v8', 'oauth-authz-v8u')
	 * @returns The redirect URI for the specified flow
	 */
	getRedirectUri(flowType: string): string {
		const redirectUri = generateRedirectUriForFlow(flowType);
		const config = getFlowRedirectUriConfig(flowType);

		if (!redirectUri) {
			// Always use HTTPS for security (even in development)
			const protocol = 'https';
			const fallbackUri = `${protocol}://${window.location.host}/v8/unified-mfa-callback`;

			// Log to persistent storage
			PersistentLogger.logRedirectUri(
				flowType,
				null,
				fallbackUri,
				config as unknown as Record<string, unknown>
			);

			console.error(`${MODULE_TAG} No redirect URI found for flow type: ${flowType}`);
			return fallbackUri;
		}

		// Log successful URI generation
		PersistentLogger.logRedirectUri(
			flowType,
			redirectUri,
			undefined,
			config as unknown as Record<string, unknown>
		);

		// Validate the URI and log any issues
		const issues = MFARedirectUriDebugger.validateUri(redirectUri);
		if (issues.length > 0) {
			PersistentLogger.logValidation(flowType, redirectUri, issues);
		}

		console.log(`${MODULE_TAG} Providing redirect URI for ${flowType}: ${redirectUri}`);
		return redirectUri;
	},

	/**
	 * Get the redirect URI for unified MFA flow (backward compatibility)
	 *
	 * @returns The redirect URI for unified MFA flow
	 */
	getUnifiedMFARedirectUri(): string {
		return MFARedirectUriServiceV8.getRedirectUri('unified-mfa-v8');
	},

	/**
	 * Get the redirect URI for V8U OAuth flow
	 *
	 * @returns The redirect URI for V8U OAuth flow
	 */
	getV8UOAuthRedirectUri(): string {
		return MFARedirectUriServiceV8.getRedirectUri('oauth-authz-v8u');
	},

	/**
	 * Get the redirect URI for MFA Hub flow
	 *
	 * @returns The redirect URI for MFA Hub flow
	 */
	getMFAHubRedirectUri(): string {
		return MFARedirectUriServiceV8.getRedirectUri('mfa-hub-v8');
	},

	/**
	 * Check if a redirect URI is the old mfa-hub URI that needs migration
	 *
	 * @param uri - The redirect URI to check
	 * @returns True if the URI needs migration
	 */
	needsMigration(uri: string | undefined): boolean {
		if (!uri) return true;

		return (
			uri.includes('mfa-hub') ||
			uri.includes('/v8/mfa-unified-callback') ||
			uri.includes('/v8/unified-mfa-callback')
		);
	},

	/**
	 * Persist redirect-debug events in localStorage so logs survive full-page redirects.
	 */
	logDebugEvent(
		category: string,
		message: string,
		data?: Record<string, unknown>,
		level: 'INFO' | 'WARN' | 'ERROR' = 'INFO'
	): void {
		PersistentLogger.log(level, category, message, data);
	},

	/**
	 * Migrate credentials to use the correct redirect URI for their flow type
	 * This will update any saved credentials that have old redirect URIs
	 *
	 * @param credentials - The credentials object to migrate
	 * @param flowType - The flow type to get the correct URI for
	 * @returns The migrated credentials with correct redirect URI
	 */
	migrateCredentials<T extends { redirectUri?: string }>(credentials: T, flowType: string): T {
		if (MFARedirectUriServiceV8.needsMigration(credentials.redirectUri)) {
			const correctUri = MFARedirectUriServiceV8.getRedirectUri(flowType);

			// Log migration to persistent storage
			PersistentLogger.logMigration(credentials.redirectUri, correctUri, flowType);

			console.warn(
				`${MODULE_TAG} Migrating old redirect URI to: ${correctUri} (flow: ${flowType})`
			);

			return {
				...credentials,
				redirectUri: correctUri,
			};
		}

		return credentials;
	},

	/**
	 * Get all persistent debug logs
	 */
	async getDebugLogs(): Promise<string> {
		return await PersistentLogger.getFormattedLogs();
	},

	/**
	 * Clear all persistent debug logs
	 */
	async clearDebugLogs(): Promise<void> {
		await PersistentLogger.clearLogs();
	},

	/**
	 * Export debug logs for analysis
	 */
	async exportDebugLogs(): Promise<void> {
		const logs = await PersistentLogger.getFormattedLogs();
		const blob = new Blob([logs], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `mfa-redirect-debug-${new Date().toISOString().slice(0, 19)}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	},
};
