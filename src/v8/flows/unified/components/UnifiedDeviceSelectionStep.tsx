/**
 * @file UnifiedDeviceSelectionStep.tsx
 * @module v8/flows/unified/components
 * @description Step 1: Device Selection - Load and select existing devices or register new
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Allow users to select an existing device for authentication or register a new device
 *
 * Flow:
 * 1. Load existing devices from API
 * 2. Display device list (if any)
 * 3. Allow selection of existing device
 * 4. Provide "Register New Device" button
 * 5. Navigate to registration or authentication step based on selection
 *
 * @example
 * <UnifiedDeviceSelectionStep
 *   {...mfaFlowBaseProps}
 *   config={config}
 *   controller={controller}
 * />
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { DeviceFlowConfig } from '@/v8/config/deviceFlowConfigTypes';
import type { MFAFlowController } from '@/v8/flows/controllers/MFAFlowController';
import type { MFAFlowBaseRenderProps } from '@/v8/flows/shared/MFAFlowBaseV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { unifiedErrorHandlerV8 } from '@/v8/utils/unifiedErrorHandlerV8';

const MODULE_TAG = '[🔍 UNIFIED-DEVICE-SELECTION-STEP]';

// ============================================================================
// TYPES
// ============================================================================

interface ExistingDevice {
	id: string;
	type: string;
	name?: string;
	status: string;
	phone?: string;
	email?: string;
	createdAt?: string;
}

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface UnifiedDeviceSelectionStepProps extends MFAFlowBaseRenderProps {
	/** Device flow configuration */
	config: DeviceFlowConfig;

	/** Device controller */
	controller: MFAFlowController;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Unified Device Selection Step (Step 1)
 *
 * Loads existing devices and allows user to select one or register a new device.
 */
export const UnifiedDeviceSelectionStep: React.FC<UnifiedDeviceSelectionStepProps> = ({
	credentials,
	setCredentials,
	mfaState,
	setMfaState,
	tokenStatus,
	isLoading,
	setIsLoading,
	nav,
	config,
	controller,
}) => {
	console.log(`${MODULE_TAG} Rendering device selection step for:`, config.deviceType);

	// ========================================================================
	// LOCAL STATE
	// ========================================================================

	const [existingDevices, setExistingDevices] = useState<ExistingDevice[]>([]);
	const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [hasLoadedDevices, setHasLoadedDevices] = useState(false);

	// ========================================================================
	// EFFECTS
	// ========================================================================

	/**
	 * Load existing devices on mount
	 */
	useEffect(() => {
		if (!hasLoadedDevices && credentials.environmentId && credentials.username) {
			loadExistingDevices();
		}
	}, [hasLoadedDevices, credentials.environmentId, credentials.username, loadExistingDevices]);

	// ========================================================================
	// HANDLERS
	// ========================================================================

	/**
	 * Load existing devices for the user
	 */
	const loadExistingDevices = useCallback(async () => {
		console.log(`${MODULE_TAG} Loading existing devices for user:`, credentials.username);

		setIsLoading(true);
		setLoadError(null);

		try {
			// Call controller to load existing devices
			const devices = await controller.loadExistingDevices(credentials, mfaState, tokenStatus, nav);

			console.log(`${MODULE_TAG} Loaded ${devices.length} existing devices:`, devices);

			setExistingDevices(devices);
			setHasLoadedDevices(true);

			// If no devices, show info toast
			if (devices.length === 0) {
				toastV8.info(
					`No existing ${config.displayName} devices found. Register a new device to continue.`
				);
			}
		} catch (error: unknown) {
			// Use standardized error handling
			const context = unifiedErrorHandlerV8.createContext(
				'UnifiedDeviceSelectionStep',
				'loadExistingDevices',
				{ deviceType: config.deviceType }
			);

			const errorMessage = unifiedErrorHandlerV8.handle(error, context, {
				showToast: false, // We'll show our own toast below
			});

			setLoadError(errorMessage);

			// Show error toast
			toastV8.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [credentials, mfaState, tokenStatus, config, controller, nav, setIsLoading]);

	/**
	 * Handle device selection
	 */
	const handleSelectDevice = useCallback((deviceId: string) => {
		console.log(`${MODULE_TAG} Device selected:`, deviceId);
		setSelectedDeviceId(deviceId);
	}, []);

	/**
	 * Handle "Use Selected Device" button click
	 */
	const handleUseSelectedDevice = useCallback(() => {
		if (!selectedDeviceId) {
			toastV8.warning('Please select a device first');
			return;
		}

		const device = existingDevices.find((d) => d.id === selectedDeviceId);
		if (!device) {
			toastV8.error('Selected device not found');
			return;
		}

		console.log(`${MODULE_TAG} Using existing device:`, device);

		// Update MFA state with selected device
		setMfaState((prev) => ({
			...prev,
			deviceId: device.id,
			deviceStatus: device.status,
			existingDevice: true,
		}));

		// Show success toast
		toastV8.success(`Using existing ${config.displayName} device`);

		// Mark step as complete
		nav.markStepComplete();

		// Navigate to authentication/activation step
		// Skip registration since device already exists
		nav.goToStep(3); // Jump to activation step
	}, [selectedDeviceId, existingDevices, config, setMfaState, nav]);

	/**
	 * Handle "Register New Device" button click
	 */
	const handleRegisterNewDevice = useCallback(() => {
		console.log(`${MODULE_TAG} User wants to register a new device`);

		// Clear any previously selected device
		setSelectedDeviceId(null);

		// Update MFA state to indicate new registration
		setMfaState((prev) => ({
			...prev,
			deviceId: undefined,
			deviceStatus: undefined,
			existingDevice: false,
		}));

		// Mark step as complete
		nav.markStepComplete();

		// Navigate to registration step
		nav.goToNext();
	}, [setMfaState, nav]);

	/**
	 * Get device icon based on type
	 */
	const getDeviceIcon = (deviceType: string): string => {
		switch (deviceType.toUpperCase()) {
			case 'SMS':
				return '📱';
			case 'EMAIL':
				return '📧';
			case 'TOTP':
				return '🔐';
			case 'FIDO2':
				return '🔑';
			case 'MOBILE':
				return '📲';
			case 'WHATSAPP':
				return '💬';
			default:
				return '📟';
		}
	};

	/**
	 * Get device display text (name, phone, or email)
	 */
	const getDeviceDisplayText = (device: ExistingDevice): string => {
		if (device.name) {
			return device.name;
		}
		if (device.phone) {
			return device.phone;
		}
		if (device.email) {
			return device.email;
		}
		return `Device ${device.id.substring(0, 8)}`;
	};

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div className="unified-device-selection-step">
			{/* Step Header */}
			<div className="step-header">
				<h2>Select or Register {config.displayName} Device</h2>
				<p className="step-description">
					Choose an existing device or register a new one for multi-factor authentication.
				</p>
			</div>

			{/* Loading State */}
			{isLoading && !hasLoadedDevices && (
				<div className="loading-indicator">
					<div className="spinner" />
					<p>Loading existing devices...</p>
				</div>
			)}

			{/* Load Error */}
			{loadError && (
				<div className="error-card" role="alert">
					<h3>Failed to Load Devices</h3>
					<p>{loadError}</p>
					<button type="button" onClick={loadExistingDevices} className="button-secondary">
						Retry
					</button>
				</div>
			)}

			{/* Device List */}
			{hasLoadedDevices && !loadError && (
				<div className="device-selection-container">
					{/* Existing Devices */}
					{existingDevices.length > 0 && (
						<div className="existing-devices-section">
							<h3>Existing Devices</h3>
							<p className="section-description">
								Select an existing device to use for authentication:
							</p>

							<div className="device-list">
								{existingDevices.map((device) => (
									<div
										role="button"
										tabIndex={0}
										key={device.id}
										className={`device-card ${selectedDeviceId === device.id ? 'selected' : ''}`}
										onClick={() => handleSelectDevice(device.id)}
										role="button"
										tabIndex={0}
										onKeyPress={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												handleSelectDevice(device.id);
											}
										}}
										aria-selected={selectedDeviceId === device.id}
									>
										<div className="device-icon">{getDeviceIcon(device.type)}</div>
										<div className="device-info">
											<h4 className="device-name">{getDeviceDisplayText(device)}</h4>
											<p className="device-type">{device.type}</p>
											<span className={`device-status status-${device.status.toLowerCase()}`}>
												{device.status}
											</span>
											{device.createdAt && (
												<p className="device-created">
													Created: {new Date(device.createdAt).toLocaleDateString()}
												</p>
											)}
										</div>
										{selectedDeviceId === device.id && <div className="selection-indicator">✓</div>}
									</div>
								))}
							</div>

							<div className="selected-device-actions">
								<button
									type="button"
									onClick={handleUseSelectedDevice}
									disabled={!selectedDeviceId || isLoading}
									className="button-primary"
								>
									Use Selected Device
								</button>
							</div>
						</div>
					)}

					{/* No Existing Devices */}
					{existingDevices.length === 0 && (
						<div className="no-devices-message">
							<div className="info-icon">ℹ️</div>
							<h3>No Existing Devices</h3>
							<p>
								You don't have any {config.displayName} devices registered yet. Register a new
								device to continue.
							</p>
						</div>
					)}

					{/* Register New Device Section */}
					<div className="register-new-section">
						<div className="section-divider">
							<span>OR</span>
						</div>
						<h3>Register New Device</h3>
						<p className="section-description">
							Set up a new {config.displayName} device for multi-factor authentication.
						</p>
						<button
							type="button"
							onClick={handleRegisterNewDevice}
							disabled={isLoading}
							className="button-primary register-new-button"
						>
							+ Register New {config.displayName} Device
						</button>
					</div>
				</div>
			)}

			{/* Navigation Buttons */}
			<div className="step-actions">
				<button
					type="button"
					onClick={() => nav.goToPrevious()}
					disabled={isLoading}
					className="button-secondary"
				>
					← Previous
				</button>
			</div>

			{/* Token Status Warning */}
			{!tokenStatus.isValid && (
				<div className="token-warning" role="alert">
					⚠️ Worker token is invalid or expired. Please refresh your token before continuing.
				</div>
			)}
		</div>
	);
};

export default UnifiedDeviceSelectionStep;
