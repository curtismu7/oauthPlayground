/**
 * @file useMFADevices.ts
 * @module v8/hooks
 * @description Custom hook for managing MFA device state and operations
 * @version 3.0.0
 *
 * Extracted from MFAAuthenticationMainPageV8.tsx as part of V3 refactoring.
 * Centralizes all device-related logic including:
 * - Loading user devices
 * - Device list management
 * - Device selection
 * - Error handling
 * - Debounced loading to prevent UI flicker
 * - Race condition prevention
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';

// Device type from PingOne API
export type MFADevice = Record<string, unknown>;

export interface UseMFADevicesConfig {
	/** Environment ID for device queries */
	environmentId?: string;
	/** Username for device queries */
	username?: string;
	/** Whether worker token is valid (required for API calls) */
	tokenIsValid?: boolean;
	/** Debounce delay in milliseconds (default: 500) */
	debounceDelay?: number;
	/** Auto-load devices when config changes */
	autoLoad?: boolean;
}

export interface UseMFADevicesReturn {
	// State
	devices: MFADevice[];
	isLoading: boolean;
	error: string | null;
	selectedDevice: MFADevice | null;

	// Actions
	loadDevices: () => Promise<void>;
	refreshDevices: () => Promise<void>;
	selectDevice: (device: MFADevice | null) => void;
	clearDevices: () => void;
	clearError: () => void;

	// Computed
	hasDevices: boolean;
	deviceCount: number;
}

const MODULE_TAG = '[🔐 USE-MFA-DEVICES]';

/**
 * Custom hook for managing MFA device state and operations
 */
export const useMFADevices = (config: UseMFADevicesConfig = {}): UseMFADevicesReturn => {
	const {
		environmentId,
		username,
		tokenIsValid = false,
		debounceDelay = 500,
		autoLoad = true,
	} = config;

	// State
	const [devices, setDevices] = useState<MFADevice[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedDevice, setSelectedDevice] = useState<MFADevice | null>(null);

	// Track last loaded username/environment to prevent unnecessary reloads
	const lastLoadedRef = useRef<{ username: string; environmentId: string } | null>(null);
	const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Load devices function
	const loadDevices = useCallback(async () => {
		if (!environmentId || !username?.trim() || !tokenIsValid) {
			setDevices([]);
			lastLoadedRef.current = null;
			return;
		}

		const currentUsername = username.trim();
		const currentEnvId = environmentId;

		// Skip if we already loaded devices for this exact username/environment combination
		const lastLoaded = lastLoadedRef.current;
		if (
			lastLoaded &&
			lastLoaded.username === currentUsername &&
			lastLoaded.environmentId === currentEnvId
		) {
			// Already loaded for this user/environment, skip to prevent repeated user lookups
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const loadedDevices = await MFAServiceV8.getAllDevices({
				environmentId: currentEnvId,
				username: currentUsername,
			});

			// Only set devices if username hasn't changed (prevent race condition)
			if (username.trim() === currentUsername) {
				setDevices(loadedDevices);
				// Mark as loaded for this username/environment
				lastLoadedRef.current = {
					username: currentUsername,
					environmentId: currentEnvId,
				};
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load devices';

			// Check if this is a server connection error
			const isServerError =
				errorMessage.toLowerCase().includes('failed to connect') ||
				errorMessage.toLowerCase().includes('server is running') ||
				errorMessage.toLowerCase().includes('network error') ||
				errorMessage.toLowerCase().includes('connection refused') ||
				errorMessage.toLowerCase().includes('econnrefused');

			if (isServerError) {
				setError(
					'⚠️ Backend server is not running or unreachable. Please ensure the server is running on port 3001 and try again.'
				);
			} else {
				setError(errorMessage);
			}

			console.error(`${MODULE_TAG} Failed to load user devices:`, err);
		} finally {
			setIsLoading(false);
		}
	}, [environmentId, username, tokenIsValid]);

	// Refresh devices (force reload)
	const refreshDevices = useCallback(async () => {
		// Clear cache to force reload
		lastLoadedRef.current = null;
		await loadDevices();
	}, [loadDevices]);

	// Select device
	const selectDevice = useCallback((device: MFADevice | null) => {
		setSelectedDevice(device);
	}, []);

	// Clear devices
	const clearDevices = useCallback(() => {
		setDevices([]);
		setSelectedDevice(null);
		lastLoadedRef.current = null;
	}, []);

	// Clear error
	const clearError = useCallback(() => {
		setError(null);
	}, []);

	// Auto-load devices with debouncing
	useEffect(() => {
		if (!autoLoad) return;

		// Clear any existing timeout
		if (loadTimeoutRef.current) {
			clearTimeout(loadTimeoutRef.current);
		}

		// Debounce device loading to prevent blinking while typing
		loadTimeoutRef.current = setTimeout(() => {
			void loadDevices();
		}, debounceDelay);

		return () => {
			if (loadTimeoutRef.current) {
				clearTimeout(loadTimeoutRef.current);
			}
		};
	}, [autoLoad, debounceDelay, loadDevices]);

	// Computed values
	const hasDevices = devices.length > 0;
	const deviceCount = devices.length;

	return {
		// State
		devices,
		isLoading,
		error,
		selectedDevice,

		// Actions
		loadDevices,
		refreshDevices,
		selectDevice,
		clearDevices,
		clearError,

		// Computed
		hasDevices,
		deviceCount,
	};
};
