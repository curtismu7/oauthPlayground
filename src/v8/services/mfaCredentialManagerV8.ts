/**
 * @file mfaCredentialManagerV8.ts
 * @module v8/services
 * @description Centralized MFA credential management service
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Unified credential state management for all MFA flows
 * - Wraps existing CredentialsServiceV8
 * - Provides MFA-specific credential handling
 * - Supports subscription-based updates
 * - Singleton pattern for consistent state
 *
 * @example
 * // Subscribe to credential updates
 * const manager = MFACredentialManagerV8.getInstance();
 * const unsubscribe = manager.subscribe((creds) => {
 *   console.log('Credentials updated:', creds);
 * });
 *
 * // Load credentials
 * const creds = manager.loadCredentials('mfa-flow-v8');
 *
 * // Save credentials
 * manager.saveCredentials('mfa-flow-v8', credentials);
 */

import type { MFACredentials } from '../flows/shared/MFATypes';
import { CredentialsServiceV8 } from './credentialsServiceV8';
import { EnvironmentIdServiceV8 } from './environmentIdServiceV8';

export type CredentialUpdateCallback = (credentials: MFACredentials | null) => void;

export interface ValidationResult {
	valid: boolean;
	errors: Array<{ message: string; field?: string }>;
	warnings: Array<{ message: string; field?: string }>;
}

const MFA_FLOW_KEY = 'mfa-flow-v8';

/**
 * Centralized credential manager for MFA flows
 *
 * Features:
 * - Singleton pattern (one instance across all MFA flows)
 * - Subscription-based updates (reactive state management)
 * - Wraps existing CredentialsServiceV8 (no breaking changes)
 * - MFA-specific credential validation
 * - Environment ID integration
 */
export class MFACredentialManagerV8 {
	private static instance: MFACredentialManagerV8 | null = null;
	private credentials: MFACredentials | null;
	private subscribers: Set<CredentialUpdateCallback>;

	/**
	 * Private constructor (singleton pattern)
	 */
	private constructor() {
		this.subscribers = new Set();
		this.credentials = null;

		console.log('[MFACredentialManagerV8] Initialized');
	}

	/**
	 * Get singleton instance
	 */
	static getInstance(): MFACredentialManagerV8 {
		if (!MFACredentialManagerV8.instance) {
			MFACredentialManagerV8.instance = new MFACredentialManagerV8();
		}
		return MFACredentialManagerV8.instance;
	}

	/**
	 * Reset instance (testing only)
	 */
	static resetInstance(): void {
		if (MFACredentialManagerV8.instance) {
			MFACredentialManagerV8.instance.subscribers.clear();
			MFACredentialManagerV8.instance = null;
		}
		console.log('[MFACredentialManagerV8] Instance reset');
	}

	/**
	 * Subscribe to credential updates
	 *
	 * @param callback - Function to call when credentials change
	 * @returns Unsubscribe function
	 */
	subscribe(callback: CredentialUpdateCallback): () => void {
		this.subscribers.add(callback);
		console.log(`[MFACredentialManagerV8] Subscriber added (total: ${this.subscribers.size})`);

		// Immediately notify with current state
		callback(this.credentials);

		// Return unsubscribe function
		return () => {
			this.unsubscribe(callback);
		};
	}

	/**
	 * Unsubscribe from credential updates
	 *
	 * @param callback - The callback to remove
	 */
	unsubscribe(callback: CredentialUpdateCallback): void {
		const removed = this.subscribers.delete(callback);
		if (removed) {
			console.log(`[MFACredentialManagerV8] Subscriber removed (total: ${this.subscribers.size})`);
		}
	}

	/**
	 * Load credentials from storage
	 *
	 * @param flowKey - Flow key (defaults to 'mfa-flow-v8')
	 * @returns Loaded credentials or defaults
	 */
	loadCredentials(flowKey: string = MFA_FLOW_KEY): MFACredentials {
		console.log('[MFACredentialManagerV8] Loading credentials...', { flowKey });

		try {
			// Load from existing service
			const stored = CredentialsServiceV8.loadCredentials(flowKey, {
				flowKey,
				flowType: 'oauth',
				includeClientSecret: true,
				includeRedirectUri: false,
				includeLogoutUri: false,
				includeScopes: false,
			});

			// Convert to MFA credentials format
			const mfaCredentials: MFACredentials = {
				environmentId: stored.environmentId || '',
				clientId: stored.clientId || '',
				username: (stored as any).username || '',
				deviceType: (stored as any).deviceType || 'SMS',
				countryCode: (stored as any).countryCode || '+1',
				phoneNumber: (stored as any).phoneNumber || '',
				email: (stored as any).email || '',
				deviceName: (stored as any).deviceName || '',
				deviceStatus: (stored as any).deviceStatus,
				deviceAuthenticationPolicyId: (stored as any).deviceAuthenticationPolicyId,
				registrationPolicyId: (stored as any).registrationPolicyId,
				fido2PolicyId: (stored as any).fido2PolicyId,
				tokenType: (stored as any).tokenType || 'worker',
				userToken: (stored as any).userToken,
				region: (stored as any).region || 'na',
				customDomain: (stored as any).customDomain,
			};

			// Update internal state
			this.credentials = mfaCredentials;

			console.log('[MFACredentialManagerV8] Credentials loaded successfully');
			return mfaCredentials;
		} catch (error) {
			console.error('[MFACredentialManagerV8] Error loading credentials:', error);

			// Return defaults
			const defaults = this.getDefaultCredentials();
			this.credentials = defaults;
			return defaults;
		}
	}

	/**
	 * Load credentials with backup fallback (async)
	 *
	 * @param flowKey - Flow key (defaults to 'mfa-flow-v8')
	 * @returns Promise resolving to credentials
	 */
	async loadCredentialsWithBackup(flowKey: string = MFA_FLOW_KEY): Promise<MFACredentials> {
		console.log('[MFACredentialManagerV8] Loading credentials with backup...', { flowKey });

		try {
			// Load from existing service with backup
			const stored = await CredentialsServiceV8.loadCredentialsWithBackup(flowKey, {
				flowKey,
				flowType: 'oauth',
				includeClientSecret: true,
				includeRedirectUri: false,
				includeLogoutUri: false,
				includeScopes: false,
			});

			// Convert to MFA credentials format
			const mfaCredentials: MFACredentials = {
				environmentId: stored.environmentId || '',
				clientId: stored.clientId || '',
				username: (stored as any).username || '',
				deviceType: (stored as any).deviceType || 'SMS',
				countryCode: (stored as any).countryCode || '+1',
				phoneNumber: (stored as any).phoneNumber || '',
				email: (stored as any).email || '',
				deviceName: (stored as any).deviceName || '',
				deviceStatus: (stored as any).deviceStatus,
				deviceAuthenticationPolicyId: (stored as any).deviceAuthenticationPolicyId,
				registrationPolicyId: (stored as any).registrationPolicyId,
				fido2PolicyId: (stored as any).fido2PolicyId,
				tokenType: (stored as any).tokenType || 'worker',
				userToken: (stored as any).userToken,
				region: (stored as any).region || 'na',
				customDomain: (stored as any).customDomain,
			};

			// Update internal state and notify
			this.credentials = mfaCredentials;
			this.notify();

			console.log('[MFACredentialManagerV8] Credentials loaded with backup successfully');
			return mfaCredentials;
		} catch (error) {
			console.error('[MFACredentialManagerV8] Error loading credentials with backup:', error);

			// Return defaults
			const defaults = this.getDefaultCredentials();
			this.credentials = defaults;
			this.notify();
			return defaults;
		}
	}

	/**
	 * Save credentials to storage
	 *
	 * @param flowKey - Flow key (defaults to 'mfa-flow-v8')
	 * @param credentials - Credentials to save
	 */
	saveCredentials(flowKey: string = MFA_FLOW_KEY, credentials: MFACredentials): void {
		console.log('[MFACredentialManagerV8] Saving credentials...', { flowKey });

		try {
			// Save using existing service
			CredentialsServiceV8.saveCredentials(flowKey, credentials as any);

			// Update internal state
			this.credentials = credentials;

			// Notify subscribers
			this.notify();

			console.log('[MFACredentialManagerV8] Credentials saved successfully');
		} catch (error) {
			console.error('[MFACredentialManagerV8] Error saving credentials:', error);
			throw error;
		}
	}

	/**
	 * Clear credentials from storage
	 *
	 * @param flowKey - Flow key (defaults to 'mfa-flow-v8')
	 */
	clearCredentials(flowKey: string = MFA_FLOW_KEY): void {
		console.log('[MFACredentialManagerV8] Clearing credentials...', { flowKey });

		try {
			CredentialsServiceV8.clearCredentials(flowKey);

			// Clear internal state
			this.credentials = null;

			// Notify subscribers
			this.notify();

			console.log('[MFACredentialManagerV8] Credentials cleared successfully');
		} catch (error) {
			console.error('[MFACredentialManagerV8] Error clearing credentials:', error);
			throw error;
		}
	}

	/**
	 * Validate MFA credentials
	 *
	 * @param credentials - Credentials to validate
	 * @returns Validation result with errors and warnings
	 */
	validateCredentials(credentials: Partial<MFACredentials>): ValidationResult {
		const errors: Array<{ message: string; field?: string }> = [];
		const warnings: Array<{ message: string; field?: string }> = [];

		// Required fields
		if (!credentials.environmentId?.trim()) {
			errors.push({ message: 'Environment ID is required', field: 'environmentId' });
		}

		if (!credentials.clientId?.trim()) {
			errors.push({ message: 'Client ID is required', field: 'clientId' });
		}

		if (!credentials.username?.trim()) {
			errors.push({ message: 'Username is required', field: 'username' });
		}

		if (!credentials.deviceType) {
			errors.push({ message: 'Device type is required', field: 'deviceType' });
		}

		// Device-specific validation
		if (credentials.deviceType === 'SMS' || credentials.deviceType === 'VOICE') {
			if (!credentials.phoneNumber?.trim()) {
				errors.push({ message: 'Phone number is required for SMS/Voice', field: 'phoneNumber' });
			}
		}

		if (credentials.deviceType === 'EMAIL') {
			if (!credentials.email?.trim()) {
				errors.push({ message: 'Email is required for Email OTP', field: 'email' });
			} else if (!this.isValidEmail(credentials.email)) {
				warnings.push({ message: 'Email format may be invalid', field: 'email' });
			}
		}

		if (credentials.deviceType === 'WHATSAPP') {
			if (!credentials.phoneNumber?.trim()) {
				errors.push({ message: 'Phone number is required for WhatsApp', field: 'phoneNumber' });
			}
		}

		// Token validation
		if (credentials.tokenType === 'user' && !credentials.userToken?.trim()) {
			warnings.push({
				message: 'User token is required when using user token type',
				field: 'userToken',
			});
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Get current credentials (synchronous)
	 *
	 * @returns Current credentials or null
	 */
	getCredentials(): MFACredentials | null {
		return this.credentials;
	}

	/**
	 * Get environment ID from credentials or global service
	 *
	 * @returns Environment ID or null
	 */
	getEnvironmentId(): string | null {
		// Try credentials first
		if (this.credentials?.environmentId) {
			return this.credentials.environmentId;
		}

		// Fall back to global service
		return EnvironmentIdServiceV8.getEnvironmentId();
	}

	/**
	 * Set environment ID in credentials and global service
	 *
	 * @param environmentId - Environment ID to set
	 */
	setEnvironmentId(environmentId: string): void {
		console.log('[MFACredentialManagerV8] Setting environment ID:', environmentId);

		// Update global service
		EnvironmentIdServiceV8.saveEnvironmentId(environmentId);

		// Update credentials if they exist
		if (this.credentials) {
			this.credentials.environmentId = environmentId;
			this.notify();
		}
	}

	/**
	 * Check if credentials have changed
	 *
	 * @param newCredentials - New credentials to compare
	 * @returns True if credentials have changed
	 */
	hasCredentialsChanged(newCredentials: MFACredentials): boolean {
		if (!this.credentials) {
			return true; // No previous credentials, consider changed
		}

		// Compare key fields
		return (
			this.credentials.environmentId !== newCredentials.environmentId ||
			this.credentials.clientId !== newCredentials.clientId ||
			this.credentials.username !== newCredentials.username ||
			this.credentials.deviceType !== newCredentials.deviceType ||
			this.credentials.phoneNumber !== newCredentials.phoneNumber ||
			this.credentials.email !== newCredentials.email ||
			this.credentials.deviceAuthenticationPolicyId !== newCredentials.deviceAuthenticationPolicyId
		);
	}

	/**
	 * Get default MFA credentials
	 *
	 * @returns Default credentials object
	 */
	private getDefaultCredentials(): MFACredentials {
		return {
			environmentId: EnvironmentIdServiceV8.getEnvironmentId() || '',
			clientId: '',
			username: '',
			deviceType: 'SMS',
			countryCode: '+1',
			phoneNumber: '',
			email: '',
			deviceName: '',
			tokenType: 'worker',
			region: 'na',
		};
	}

	/**
	 * Notify all subscribers of credential change
	 */
	private notify(): void {
		console.log(`[MFACredentialManagerV8] Notifying ${this.subscribers.size} subscribers`);
		this.subscribers.forEach((callback) => {
			try {
				callback(this.credentials);
			} catch (error) {
				console.error('[MFACredentialManagerV8] Error in subscriber callback:', error);
			}
		});
	}

	/**
	 * Validate email format
	 *
	 * @param email - Email to validate
	 * @returns True if valid email format
	 */
	private isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	/**
	 * Export credentials as JSON
	 *
	 * @param credentials - Credentials to export
	 * @returns JSON string
	 */
	static exportCredentials(credentials: MFACredentials): string {
		return JSON.stringify(credentials, null, 2);
	}

	/**
	 * Import credentials from JSON
	 *
	 * @param json - JSON string to import
	 * @returns Parsed credentials
	 * @throws Error if JSON is invalid
	 */
	static importCredentials(json: string): MFACredentials {
		try {
			const parsed = JSON.parse(json);
			if (!parsed.environmentId || !parsed.clientId || !parsed.username) {
				throw new Error('Invalid MFA credentials: missing required fields');
			}
			return parsed;
		} catch (error) {
			console.error('[MFACredentialManagerV8] Error importing credentials:', error);
			throw new Error(
				`Failed to import credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Get human-readable summary of credentials
	 *
	 * @param credentials - Credentials to summarize
	 * @returns Human-readable summary
	 */
	static getCredentialsSummary(credentials: MFACredentials | null): string {
		if (!credentials) {
			return 'No credentials';
		}

		const parts: string[] = [];

		if (credentials.environmentId) {
			const shortEnv = credentials.environmentId.substring(0, 8);
			parts.push(`Env: ${shortEnv}...`);
		}

		if (credentials.username) {
			parts.push(`User: ${credentials.username}`);
		}

		if (credentials.deviceType) {
			parts.push(`Device: ${credentials.deviceType}`);
		}

		if (credentials.tokenType) {
			parts.push(`Token: ${credentials.tokenType}`);
		}

		return parts.join(', ') || 'Empty credentials';
	}
}
