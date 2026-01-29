/**
 * @file useUnifiedMFAState.ts
 * @module v8/flows/unified/hooks
 * @description Centralized state management hook for unified MFA registration flow
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Manage all state layers for the unified MFA registration flow:
 * - Layer 1: Global state (MFACredentialContext, MFATokenManagerV8)
 * - Layer 2: Flow state (device fields, MFA state)
 * - Layer 3: Config and controller (deviceFlowConfigs, MFAFlowController)
 *
 * @example
 * const {
 *   config,
 *   credentials,
 *   saveCredentials,
 *   controller,
 *   deviceFields,
 *   setDeviceFields,
 * } = useUnifiedMFAState('SMS');
 */

import { useMemo, useState } from 'react';
import { getDeviceConfig } from '@/v8/config/deviceFlowConfigs';
import type { DeviceConfigKey } from '@/v8/config/deviceFlowConfigTypes';
import { useCredentialManager } from '@/v8/contexts/MFACredentialContext';
import { MFAFlowControllerFactory } from '@/v8/flows/controllers/MFAFlowControllerFactory';

const MODULE_TAG = '[🪝 USE-UNIFIED-MFA-STATE]';

/**
 * Centralized state management for unified MFA flow
 *
 * @param deviceType - Device type to configure state for
 * @returns State and actions for the unified flow
 */
export const useUnifiedMFAState = (deviceType: DeviceConfigKey) => {
	console.log(`${MODULE_TAG} Initializing state for device type:`, deviceType);

	// ========================================================================
	// LAYER 1: GLOBAL STATE (FROM CONTEXTS)
	// ========================================================================

	// Get credentials from MFACredentialContext
	const credentialManager = useCredentialManager();
	const { credentials, saveCredentials, loadCredentials, validateCredentials } = credentialManager;

	console.log(`${MODULE_TAG} Credentials loaded:`, {
		environmentId: credentials?.environmentId,
		username: credentials?.username,
		deviceType: credentials?.deviceType,
	});

	// ========================================================================
	// LAYER 2: CONFIG AND CONTROLLER
	// ========================================================================

	// Load device-specific configuration
	const config = useMemo(() => {
		console.log(`${MODULE_TAG} Loading device config for:`, deviceType);
		return getDeviceConfig(deviceType);
	}, [deviceType]);

	// Create controller for this device type
	const controller = useMemo(() => {
		console.log(`${MODULE_TAG} Creating controller for:`, deviceType);
		return MFAFlowControllerFactory.create(deviceType);
	}, [deviceType]);

	// ========================================================================
	// LAYER 3: DEVICE-SPECIFIC FORM STATE
	// ========================================================================

	/**
	 * Initialize device fields from config
	 * Creates a map of field names to values, populated from credentials if available
	 */
	const [deviceFields, setDeviceFields] = useState<Record<string, string>>(() => {
		const fields: Record<string, string> = {};

		// Combine required and optional fields
		const allFields = [...config.requiredFields, ...config.optionalFields];

		// Initialize each field from credentials or empty string
		allFields.forEach((field) => {
			fields[field] = (credentials?.[field as keyof typeof credentials] as string) || '';
		});

		console.log(`${MODULE_TAG} Initialized device fields:`, fields);
		return fields;
	});

	// ========================================================================
	// HELPER FUNCTIONS
	// ========================================================================

	/**
	 * Update a single device field
	 */
	const updateDeviceField = (fieldName: string, value: string) => {
		console.log(`${MODULE_TAG} Updating field:`, fieldName, '=', value);
		setDeviceFields((prev) => ({ ...prev, [fieldName]: value }));
	};

	/**
	 * Update multiple device fields at once
	 */
	const updateDeviceFields = (fields: Record<string, string>) => {
		console.log(`${MODULE_TAG} Updating multiple fields:`, fields);
		setDeviceFields((prev) => ({ ...prev, ...fields }));
	};

	/**
	 * Reset device fields to empty/default values
	 */
	const resetDeviceFields = () => {
		console.log(`${MODULE_TAG} Resetting device fields`);
		const fields: Record<string, string> = {};
		const allFields = [...config.requiredFields, ...config.optionalFields];
		allFields.forEach((field) => {
			fields[field] = '';
		});
		setDeviceFields(fields);
	};

	/**
	 * Sync device fields to credentials
	 * Useful before saving or submitting
	 */
	const syncFieldsToCredentials = () => {
		console.log(`${MODULE_TAG} Syncing fields to credentials`);
		const updatedCredentials = {
			...credentials,
			deviceType,
			...deviceFields,
		};
		saveCredentials('mfa-flow-v8', updatedCredentials);
		return updatedCredentials;
	};

	// ========================================================================
	// RETURN STATE AND ACTIONS
	// ========================================================================

	return {
		// Config and controller
		config,
		controller,

		// Global credentials (from context)
		credentials,
		saveCredentials,
		loadCredentials,
		validateCredentials,

		// Device-specific form fields
		deviceFields,
		setDeviceFields,
		updateDeviceField,
		updateDeviceFields,
		resetDeviceFields,
		syncFieldsToCredentials,

		// Full credential manager (for advanced use cases)
		credentialManager,
	};
};

export default useUnifiedMFAState;
