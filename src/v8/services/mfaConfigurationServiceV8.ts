/**
 * @file mfaConfigurationServiceV8.ts
 * @module v8/services
 * @description MFA Configuration Service - manages MFA-specific settings in localStorage
 * @version 8.0.0
 * @since 2025-01-XX
 */

const STORAGE_KEY = 'pingone_mfa_configuration_v8';
const MODULE_TAG = '[⚙️ MFA-CONFIG-SERVICE-V8]';

export interface MFAConfiguration {
	workerToken: {
		autoRenewal: boolean;
		renewalThreshold: number; // seconds before expiry
		retryAttempts: number;
		retryDelay: number; // milliseconds
		showTokenAtEnd: boolean; // show token after generation
		silentApiRetrieval: boolean; // silently fetch token via API without showing modals
	};
	defaultMfaPolicyId: string; // Default MFA policy ID to use
	autoSelectDefaultPolicies: boolean;
	autoSelectFirstDevice: boolean;
	alwaysShowDeviceSelection: boolean;
	deviceSelectionTimeout: number; // seconds
	otpCodeLength: 6 | 7 | 8 | 9 | 10;
	otpInputAutoFocus: boolean;
	otpInputAutoSubmit: boolean;
	otpValidationTimeout: number; // seconds
	otpResendDelay: number; // seconds
	fido2: {
		preferredAuthenticatorType: 'platform' | 'cross-platform' | 'both';
		userVerification: 'discouraged' | 'preferred' | 'required';
		discoverableCredentials: 'discouraged' | 'preferred' | 'required';
		relyingPartyId: string;
		relyingPartyIdType: 'pingone' | 'custom' | 'other';
		fidoDeviceAggregation: boolean;
		publicKeyCredentialHints: Array<'security-key' | 'client-device' | 'hybrid'>;
		backupEligibility: 'allow' | 'disallow';
		enforceBackupEligibilityDuringAuth: boolean;
		attestationRequest: 'none' | 'direct' | 'enterprise';
		includeEnvironmentName: boolean;
		includeOrganizationName: boolean;
	};
	pushNotificationTimeout: number; // seconds
	pushPollingInterval: number; // seconds
	autoStartPushPolling: boolean;
	showPushNotificationInstructions: boolean;
	debounceDeviceLoading: boolean;
	deviceLoadingDebounceDelay: number; // milliseconds
	cacheDeviceList: boolean;
	cacheDuration: number; // seconds
	ui: {
		showDeviceIcons: boolean;
		showDeviceStatusBadges: boolean;
		modalAnimationDuration: number; // milliseconds
		showLoadingSpinners: boolean;
	};
	security: {
		requireUsernameForAuthentication: boolean;
		allowUsernamelessFido2: boolean;
		validateDeviceIds: boolean;
		sanitizeDeviceNames: boolean;
	};
	oauth: {
		pkceEnabled: boolean;
		refreshTokenEnabled: boolean;
		tokenStorage: 'localStorage' | 'sessionStorage' | 'memory';
	};
}

const DEFAULT_CONFIG: MFAConfiguration = {
	workerToken: {
		autoRenewal: true,
		renewalThreshold: 300, // 5 minutes
		retryAttempts: 3,
		retryDelay: 1000, // 1 second
		showTokenAtEnd: true, // show token after generation by default
		silentApiRetrieval: true, // enable silent token retrieval by default
	},
	defaultMfaPolicyId: '', // Empty by default - user must set
	autoSelectDefaultPolicies: true,
	autoSelectFirstDevice: true,
	alwaysShowDeviceSelection: false,
	deviceSelectionTimeout: 60, // 60 seconds
	otpCodeLength: 6,
	otpInputAutoFocus: true,
	otpInputAutoSubmit: false,
	otpValidationTimeout: 300, // 5 minutes
	otpResendDelay: 30, // 30 seconds
	fido2: {
		preferredAuthenticatorType: 'both',
		userVerification: 'required',
		discoverableCredentials: 'required',
		relyingPartyId:
			window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
		relyingPartyIdType: 'other',
		fidoDeviceAggregation: true,
		publicKeyCredentialHints: [],
		backupEligibility: 'allow',
		enforceBackupEligibilityDuringAuth: true,
		attestationRequest: 'none',
		includeEnvironmentName: true,
		includeOrganizationName: true,
	},
	pushNotificationTimeout: 120, // 2 minutes
	pushPollingInterval: 2, // 2 seconds
	autoStartPushPolling: true,
	showPushNotificationInstructions: true,
	debounceDeviceLoading: true,
	deviceLoadingDebounceDelay: 500, // 500ms
	cacheDeviceList: true,
	cacheDuration: 60, // 60 seconds
	ui: {
		showDeviceIcons: true,
		showDeviceStatusBadges: true,
		modalAnimationDuration: 200, // 200ms
		showLoadingSpinners: true,
	},
	security: {
		requireUsernameForAuthentication: false,
		allowUsernamelessFido2: true,
		validateDeviceIds: true,
		sanitizeDeviceNames: true,
	},
	oauth: {
		pkceEnabled: false,
		refreshTokenEnabled: false,
		tokenStorage: 'localStorage',
	},
};

export class MFAConfigurationServiceV8 {
	/**
	 * Load configuration from localStorage or return defaults
	 */
	static loadConfiguration(): MFAConfiguration {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) {
				return { ...DEFAULT_CONFIG };
			}

			const parsed = JSON.parse(stored) as Partial<MFAConfiguration>;
			// Merge with defaults to ensure all fields exist
			const config = { ...DEFAULT_CONFIG, ...parsed };

			// Deep merge nested objects
			if (parsed.workerToken) {
				config.workerToken = { ...DEFAULT_CONFIG.workerToken, ...parsed.workerToken };
			}
			if (parsed.fido2) {
				config.fido2 = { ...DEFAULT_CONFIG.fido2, ...parsed.fido2 };
			}
			if (parsed.ui) {
				config.ui = { ...DEFAULT_CONFIG.ui, ...parsed.ui };
			}
			if (parsed.security) {
				config.security = { ...DEFAULT_CONFIG.security, ...parsed.security };
			}

			// Configuration loaded successfully
			return config;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load configuration:`, error);
			return { ...DEFAULT_CONFIG };
		}
	}

	/**
	 * Save configuration to localStorage
	 */
	static saveConfiguration(config: MFAConfiguration): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
			console.log(`${MODULE_TAG} Configuration saved to localStorage`);

			// Dispatch custom event to notify other components
			window.dispatchEvent(
				new CustomEvent('mfaConfigurationUpdated', {
					detail: config,
				})
			);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save configuration:`, error);
			throw new Error('Failed to save configuration to localStorage');
		}
	}

	/**
	 * Reset configuration to defaults
	 */
	static resetToDefaults(): void {
		try {
			localStorage.removeItem(STORAGE_KEY);
			console.log(`${MODULE_TAG} Configuration reset to defaults`);

			// Dispatch custom event with default config
			window.dispatchEvent(
				new CustomEvent('mfaConfigurationUpdated', {
					detail: { ...DEFAULT_CONFIG },
				})
			);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to reset configuration:`, error);
			throw new Error('Failed to reset configuration');
		}
	}

	/**
	 * Export configuration as JSON string
	 */
	static exportConfiguration(): string {
		const config = MFAConfigurationServiceV8.loadConfiguration();
		return JSON.stringify(config, null, 2);
	}

	/**
	 * Import configuration from JSON string
	 * @returns true if import was successful, false otherwise
	 */
	static importConfiguration(json: string): boolean {
		try {
			const parsed = JSON.parse(json) as Partial<MFAConfiguration>;

			// Validate that it's a valid configuration object
			if (typeof parsed !== 'object' || parsed === null) {
				console.error(`${MODULE_TAG} Invalid configuration format: not an object`);
				return false;
			}

			// Merge with defaults to ensure all fields exist
			const config = { ...DEFAULT_CONFIG, ...parsed };

			// Deep merge nested objects
			if (parsed.workerToken) {
				config.workerToken = { ...DEFAULT_CONFIG.workerToken, ...parsed.workerToken };
			}
			if (parsed.fido2) {
				config.fido2 = { ...DEFAULT_CONFIG.fido2, ...parsed.fido2 };
			}
			if (parsed.ui) {
				config.ui = { ...DEFAULT_CONFIG.ui, ...parsed.ui };
			}
			if (parsed.security) {
				config.security = { ...DEFAULT_CONFIG.security, ...parsed.security };
			}

			MFAConfigurationServiceV8.saveConfiguration(config);
			console.log(`${MODULE_TAG} Configuration imported successfully`);
			return true;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to import configuration:`, error);
			return false;
		}
	}

	/**
	 * Get a specific configuration value
	 */
	static getValue<K extends keyof MFAConfiguration>(key: K): MFAConfiguration[K] {
		const config = MFAConfigurationServiceV8.loadConfiguration();
		return config[key];
	}

	/**
	 * Set a specific configuration value
	 */
	static setValue<K extends keyof MFAConfiguration>(key: K, value: MFAConfiguration[K]): void {
		const config = MFAConfigurationServiceV8.loadConfiguration();
		config[key] = value;
		MFAConfigurationServiceV8.saveConfiguration(config);
	}
}
