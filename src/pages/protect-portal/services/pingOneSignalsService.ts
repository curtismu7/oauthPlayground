/**
 * @file pingOneSignalsService.ts
 * @module protect-portal/services
 * @description PingOne Signals (Protect) SDK service for device data collection
 * @version 9.6.5
 * @since 2026-02-11
 *
 * This service handles PingOne Signals SDK initialization, device data collection,
 * and payload retrieval following PingOne best practices for risk evaluation.
 */

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
	interface Window {
		_pingOneSignals?: {
			start: (config: any) => Promise<void>;
			getData: () => any;
			pauseBehavioralData: () => void;
			resumeBehavioralData: () => void;
		};
	}
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface PingOneSignalsConfig {
	environmentId: string;
	waitForWindowLoad?: boolean;
	consoleLogEnabled?: boolean;
	enableTrust?: boolean;
	disableTags?: boolean;
	disableHub?: boolean;
	deviceAttributesToIgnore?: string[];
}

export interface DevicePayload {
	deviceId?: string;
	deviceAttributes?: Record<string, any>;
	behavioralData?: Record<string, any>;
	tags?: Record<string, any>;
	timestamp?: string;
}

export interface PingOneSignalsResult {
	success: boolean;
	payload?: DevicePayload;
	error?: string;
	metadata?: {
		collectionTime: number;
		dataSize: number;
		isBehavioralDataIncluded: boolean;
	};
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class PingOneSignalsService {
	private static readonly MODULE_TAG = '[🛡️ PINGONE-SIGNALS-SERVICE]';
	private static readonly DEFAULT_TIMEOUT = 10000; // 10 seconds instead of 2.5
	private static readonly SDK_URL =
		'https://cdn.pingone.com/pingone-protect/sdks/web/v2/pingone-protect.min.js';

	private static isInitialized = false;
	private static isReady = false;
	private static config: PingOneSignalsConfig | null = null;

	/**
	 * Initialize PingOne Signals SDK following best practices
	 */
	static async initialize(config: PingOneSignalsConfig): Promise<PingOneSignalsResult> {
		const startTime = Date.now();

		try {
			console.log(`${PingOneSignalsService.MODULE_TAG} Initializing PingOne Signals SDK`, config);

			// Check if SDK is already loaded
			if (!PingOneSignalsService.isSdkLoaded()) {
				await PingOneSignalsService.loadSdk();
			}

			// Initialize SDK with proper configuration
			await PingOneSignalsService.initializeSdk(config);

			// Set up readiness event handling
			PingOneSignalsService.setupReadinessHandling();

			const result = {
				success: true,
				metadata: {
					collectionTime: Date.now() - startTime,
					dataSize: 0,
					isBehavioralDataIncluded: !config.disableTags,
				},
			};

			console.log(`${PingOneSignalsService.MODULE_TAG} SDK initialized successfully`, result);
			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error(`${PingOneSignalsService.MODULE_TAG} SDK initialization failed`, error);

			return {
				success: false,
				error: errorMessage,
				metadata: {
					collectionTime: Date.now() - startTime,
					dataSize: 0,
					isBehavioralDataIncluded: false,
				},
			};
		}
	}

	/**
	 * Get device payload with proper readiness handling
	 */
	static async getDevicePayload(timeout?: number): Promise<PingOneSignalsResult> {
		const startTime = Date.now();
		const actualTimeout = timeout || PingOneSignalsService.DEFAULT_TIMEOUT;

		try {
			console.log(`${PingOneSignalsService.MODULE_TAG} Getting device payload`);

			// Wait for SDK readiness
			await PingOneSignalsService.waitForReadiness(actualTimeout);

			// Get data from SDK
			const data = await window._pingOneSignals.getData();

			const payload: DevicePayload = {
				deviceId: data.deviceId,
				deviceAttributes: data.deviceAttributes,
				behavioralData: data.behavioralData,
				tags: data.tags,
				timestamp: new Date().toISOString(),
			};

			const result = {
				success: true,
				payload,
				metadata: {
					collectionTime: Date.now() - startTime,
					dataSize: JSON.stringify(payload).length,
					isBehavioralDataIncluded: !!data.behavioralData,
				},
			};

			console.log(`${PingOneSignalsService.MODULE_TAG} Device payload collected successfully`, {
				deviceId: payload.deviceId,
				dataSize: result.metadata?.dataSize,
				hasBehavioralData: result.metadata?.isBehavioralDataIncluded,
			});

			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error(`${PingOneSignalsService.MODULE_TAG} Failed to get device payload`, error);

			return {
				success: false,
				error: errorMessage,
				metadata: {
					collectionTime: Date.now() - startTime,
					dataSize: 0,
					isBehavioralDataIncluded: false,
				},
			};
		}
	}

	/**
	 * Check if SDK is loaded
	 */
	static isSdkLoaded(): boolean {
		return typeof window._pingOneSignals !== 'undefined';
	}

	/**
	 * Check if SDK is ready for data collection
	 */
	static isReadyForCollection(): boolean {
		return PingOneSignalsService.isReady;
	}

	/**
	 * Pause behavioral data collection
	 */
	static pauseBehavioralData(): void {
		if (PingOneSignalsService.isSdkLoaded()) {
			window._pingOneSignals.pauseBehavioralData();
			console.log(`${PingOneSignalsService.MODULE_TAG} Behavioral data collection paused`);
		}
	}

	/**
	 * Resume behavioral data collection
	 */
	static resumeBehavioralData(): void {
		if (PingOneSignalsService.isSdkLoaded()) {
			window._pingOneSignals.resumeBehavioralData();
			console.log(`${PingOneSignalsService.MODULE_TAG} Behavioral data collection resumed`);
		}
	}

	/**
	 * Load SDK script
	 */
	private static async loadSdk(): Promise<void> {
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = PingOneSignalsService.SDK_URL;
			script.async = true;

			script.onload = () => {
				console.log(`${PingOneSignalsService.MODULE_TAG} SDK script loaded`);
				resolve();
			};

			script.onerror = (error) => {
				console.error(`${PingOneSignalsService.MODULE_TAG} Failed to load SDK script`, error);
				reject(new Error('Failed to load PingOne Signals SDK'));
			};

			// Add to head for early loading
			document.head.appendChild(script);
		});
	}

	/**
	 * Initialize SDK with configuration
	 */
	private static async initializeSdk(config: PingOneSignalsConfig): Promise<void> {
		if (!PingOneSignalsService.isSdkLoaded()) {
			throw new Error('PingOne Signals SDK not loaded');
		}

		const initConfig = {
			envId: config.environmentId,
			waitForWindowLoad: config.waitForWindowLoad ?? false, // Initialize on DOMContentLoaded
			consoleLogEnabled: config.consoleLogEnabled ?? false,
			enableTrust: config.enableTrust,
			disableTags: config.disableTags,
			disableHub: config.disableHub,
			deviceAttributesToIgnore: config.deviceAttributesToIgnore,
		};

		await window._pingOneSignals.start(initConfig);

		PingOneSignalsService.isInitialized = true;
		PingOneSignalsService.config = config;

		console.log(`${PingOneSignalsService.MODULE_TAG} SDK initialized with config`, initConfig);
	}

	/**
	 * Set up readiness event handling
	 */
	private static setupReadinessHandling(): void {
		// Dispatch custom readiness event after initialization
		window.dispatchEvent(new Event('PingOneCollectionReady'));
		PingOneSignalsService.isReady = true;

		console.log(`${PingOneSignalsService.MODULE_TAG} SDK ready for data collection`);
	}

	/**
	 * Wait for SDK readiness
	 */
	private static async waitForReadiness(timeout: number): Promise<void> {
		const startTime = Date.now();

		return new Promise((resolve, reject) => {
			const checkReadiness = () => {
				if (PingOneSignalsService.isReady) {
					resolve();
					return;
				}

				if (Date.now() - startTime > timeout) {
					reject(new Error(`SDK readiness timeout after ${timeout}ms`));
					return;
				}

				// Check again in 100ms
				setTimeout(checkReadiness, 100);
			};

			// Listen for readiness event
			const handleReadiness = () => {
				window.removeEventListener('PingOneCollectionReady', handleReadiness);
				resolve();
			};

			window.addEventListener('PingOneCollectionReady', handleReadiness);

			// Start checking
			checkReadiness();
		});
	}

	/**
	 * Get SDK status for debugging
	 */
	static getStatus(): {
		isSdkLoaded: boolean;
		isInitialized: boolean;
		isReady: boolean;
		config: PingOneSignalsConfig | null;
	} {
		return {
			isSdkLoaded: PingOneSignalsService.isSdkLoaded(),
			isInitialized: PingOneSignalsService.isInitialized,
			isReady: PingOneSignalsService.isReady,
			config: PingOneSignalsService.config,
		};
	}
}
