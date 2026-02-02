/**
 * @file useMFADevices.ts
 * @module v8/flows/MFAAuthenticationMainPageV8/hooks
 * @description Hook for managing MFA device operations
 * @version 1.0.0
 * @since 2026-01-31
 *
 * Extracted from MFAAuthenticationMainPageV8.tsx to improve maintainability.
 * This hook encapsulates device-related logic including:
 * - Loading user devices
 * - Device failure handling
 * - Cooldown/lockout handling
 * - Device search and filtering
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import type { TokenStatusInfo } from '@/v8/services/workerTokenStatusServiceV8';

const MODULE_TAG = '[🔐 useMFADevices]';

export interface UnavailableDevice {
	id: string;
}

export interface MFADevicesHookResult {
	// Device list
	userDevices: Array<Record<string, unknown>>;
	isLoadingDevices: boolean;
	devicesError: string | null;
	hasDevices: boolean;
	
	// Device failure
	showDeviceFailureModal: boolean;
	deviceFailureError: string;
	unavailableDevices: UnavailableDevice[];
	
	// Cooldown/lockout
	cooldownError: {
		message: string;
		deliveryMethod?: string;
		coolDownExpiresAt?: number;
	} | null;
	
	// Search
	deviceSearchQuery: string;
	
	// Actions
	handleDeviceFailureError: (error: unknown) => boolean;
	
	// State setters
	setShowDeviceFailureModal: React.Dispatch<React.SetStateAction<boolean>>;
	setDeviceFailureError: React.Dispatch<React.SetStateAction<string>>;
	setUnavailableDevices: React.Dispatch<React.SetStateAction<UnavailableDevice[]>>;
	setCooldownError: React.Dispatch<React.SetStateAction<{
		message: string;
		deliveryMethod?: string;
		coolDownExpiresAt?: number;
	} | null>>;
	setDeviceSearchQuery: React.Dispatch<React.SetStateAction<string>>;
	setUserDevices: React.Dispatch<React.SetStateAction<Array<Record<string, unknown>>>>;
	setIsLoadingDevices: React.Dispatch<React.SetStateAction<boolean>>;
	setDevicesError: React.Dispatch<React.SetStateAction<string | null>>;
}

export interface UseMFADevicesOptions {
	environmentId: string;
	username: string;
	tokenStatus: TokenStatusInfo;
}

/**
 * Hook for managing MFA device operations
 * 
 * @example
 * ```tsx
 * const {
 *   userDevices,
 *   isLoadingDevices,
 *   handleDeviceFailureError
 * } = useMFADevices({
 *   environmentId: 'env-123',
 *   username: 'john.doe',
 *   tokenStatus
 * });
 * ```
 */
export const useMFADevices = (options: UseMFADevicesOptions): MFADevicesHookResult => {
	const { environmentId, username, tokenStatus } = options;

	// Device list state
	const [userDevices, setUserDevices] = useState<Array<Record<string, unknown>>>([]);
	const [isLoadingDevices, setIsLoadingDevices] = useState(false);
	const [devicesError, setDevicesError] = useState<string | null>(null);

	// Device failure modal state
	const [showDeviceFailureModal, setShowDeviceFailureModal] = useState(false);
	const [deviceFailureError, setDeviceFailureError] = useState<string>('');
	const [unavailableDevices, setUnavailableDevices] = useState<UnavailableDevice[]>([]);

	// Cooldown/lockout modal state
	const [cooldownError, setCooldownError] = useState<{
		message: string;
		deliveryMethod?: string;
		coolDownExpiresAt?: number;
	} | null>(null);

	// Device search
	const [deviceSearchQuery, setDeviceSearchQuery] = useState('');

	// Track last loaded username/environment to prevent unnecessary reloads
	const lastLoadedDevicesRef = useRef<{ username: string; environmentId: string } | null>(null);

	/**
	 * Helper function to handle NO_USABLE_DEVICES errors
	 */
	const handleDeviceFailureError = useCallback((error: unknown): boolean => {
		// Check if error has NO_USABLE_DEVICES error code
		if (
			error instanceof Error &&
			(error as Error & { errorCode?: string }).errorCode === 'NO_USABLE_DEVICES'
		) {
			const errorWithDevices = error as Error & {
				errorCode?: string;
				unavailableDevices?: Array<{ id: string }>;
			};
			const unavailableDevices: UnavailableDevice[] = (
				errorWithDevices.unavailableDevices || []
			).map((d) => ({
				id: d.id,
			}));

			setDeviceFailureError(error.message || 'No usable devices found for authentication');
			setUnavailableDevices(unavailableDevices);
			setShowDeviceFailureModal(true);
			return true; // Indicates error was handled
		}

		// Check if error response contains NO_USABLE_DEVICES
		if (
			error &&
			typeof error === 'object' &&
			'errorCode' in error &&
			error.errorCode === 'NO_USABLE_DEVICES'
		) {
			const errorObj = error as {
				errorCode: string;
				message?: string;
				unavailableDevices?: Array<{ id: string }>;
			};
			const unavailableDevices: UnavailableDevice[] = (errorObj.unavailableDevices || []).map(
				(d) => ({
					id: d.id,
				})
			);

			setDeviceFailureError(errorObj.message || 'No usable devices found for authentication');
			setUnavailableDevices(unavailableDevices);
			setShowDeviceFailureModal(true);
			return true;
		}

		return false; // Error was not handled
	}, []);

	// Load user devices for dashboard - debounced to prevent blinking while typing
	useEffect(() => {
		const loadUserDevices = async () => {
			if (!environmentId || !username.trim() || !tokenStatus.isValid) {
				setUserDevices([]);
				lastLoadedDevicesRef.current = null;
				return;
			}

			const currentUsername = username.trim();
			const currentEnvId = environmentId;

			// Skip if we already loaded devices for this exact username/environment combination
			const lastLoaded = lastLoadedDevicesRef.current;
			if (
				lastLoaded &&
				lastLoaded.username === currentUsername &&
				lastLoaded.environmentId === currentEnvId
			) {
				// Already loaded for this user/environment, skip to prevent repeated user lookups
				return;
			}

			setIsLoadingDevices(true);
			setDevicesError(null);

			try {
				const devices = await MFAServiceV8.getAllDevices({
					environmentId: currentEnvId,
					username: currentUsername,
				});
				// Only set devices if username hasn't changed (prevent race condition)
				if (username.trim() === currentUsername) {
					setUserDevices(devices);
					// Mark as loaded for this username/environment
					lastLoadedDevicesRef.current = {
						username: currentUsername,
						environmentId: currentEnvId,
					};
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to load devices';

				// Check if this is a server connection error
				const isServerError =
					errorMessage.toLowerCase().includes('failed to connect') ||
					errorMessage.toLowerCase().includes('server is running') ||
					errorMessage.toLowerCase().includes('network error') ||
					errorMessage.toLowerCase().includes('connection refused') ||
					errorMessage.toLowerCase().includes('econnrefused');

				if (isServerError) {
					setDevicesError(
						'⚠️ Backend server is not running or unreachable. Please ensure the server is running on port 3001 and try again.'
					);
				} else {
					setDevicesError(errorMessage);
				}

				console.error(`${MODULE_TAG} Failed to load user devices:`, error);
			} finally {
				setIsLoadingDevices(false);
			}
		};

		// Debounce device loading to prevent blinking while typing
		const timeoutId = setTimeout(() => {
			void loadUserDevices();
		}, 500); // Wait 500ms after user stops typing

		return () => clearTimeout(timeoutId);
	}, [environmentId, username, tokenStatus.isValid]);

	return {
		// Device list
		userDevices,
		isLoadingDevices,
		devicesError,
		hasDevices: userDevices.length > 0,
		
		// Device failure
		showDeviceFailureModal,
		deviceFailureError,
		unavailableDevices,
		
		// Cooldown/lockout
		cooldownError,
		
		// Search
		deviceSearchQuery,
		
		// Actions
		handleDeviceFailureError,
		
		// State setters
		setShowDeviceFailureModal,
		setDeviceFailureError,
		setUnavailableDevices,
		setCooldownError,
		setDeviceSearchQuery,
		setUserDevices,
		setIsLoadingDevices,
		setDevicesError,
	};
};
