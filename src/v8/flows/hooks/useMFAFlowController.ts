/**
 * @file useMFAFlowController.ts
 * @module v8/flows/hooks
 * @description Hook for using MFA flow controllers
 * @version 8.2.0
 */

import { useEffect, useState, useMemo } from 'react';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import type { MFACredentials, MFAState } from '../shared/MFATypes';
import type { MFAFlowController, OTPState, ValidationState, DeviceSelectionState } from '../controllers/MFAFlowController';

export interface UseMFAFlowControllerOptions {
	controller: MFAFlowController;
	credentials: MFACredentials;
	tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>;
	mfaState: MFAState;
	setMfaState: (state: Partial<MFAState> | ((prev: MFAState) => MFAState)) => void;
	isLoading: boolean;
	setIsLoading: (loading: boolean) => void;
	currentStep: number;
}

export interface UseMFAFlowControllerReturn {
	// Device selection state
	deviceSelection: DeviceSelectionState;
	setDeviceSelection: (state: Partial<DeviceSelectionState> | ((prev: DeviceSelectionState) => DeviceSelectionState)) => void;
	loadDevices: () => Promise<void>;
	
	// OTP state
	otpState: OTPState;
	setOtpState: (state: Partial<OTPState> | ((prev: OTPState) => OTPState)) => void;
	sendOTP: () => Promise<void>;
	
	// Validation state
	validationState: ValidationState;
	setValidationState: (state: Partial<ValidationState> | ((prev: ValidationState) => Partial<ValidationState>)) => void;
	validateOTP: () => Promise<boolean>;
	
	// Registration
	registerDevice: () => Promise<void>;
	
	// Navigation
	nav: ReturnType<typeof useStepNavigationV8>;
}

/**
 * Hook for managing MFA flow state and operations using a controller
 */
export const useMFAFlowController = (options: UseMFAFlowControllerOptions): UseMFAFlowControllerReturn => {
	const { controller, credentials, tokenStatus, mfaState, setMfaState, isLoading, setIsLoading, currentStep } = options;
	
	const nav = useStepNavigationV8();

	// Device selection state
	const [deviceSelection, setDeviceSelection] = useState<DeviceSelectionState>({
		existingDevices: [],
		loadingDevices: false,
		selectedExistingDevice: '',
		showRegisterForm: false,
	});

	// OTP state
	const [otpState, setOtpState] = useState<OTPState>({
		otpSent: false,
		sendError: null,
		sendRetryCount: 0,
	});

	// Validation state
	const [validationState, setValidationState] = useState<ValidationState>({
		validationAttempts: 0,
		lastValidationError: null,
	});

	// Load devices when entering step 1
	const loadDevices = async () => {
		if (!credentials.environmentId || !credentials.username || !tokenStatus.isValid) {
			return;
		}

		if (currentStep === 1 && deviceSelection.existingDevices.length === 0 && !deviceSelection.loadingDevices) {
			setDeviceSelection((prev) => ({ ...prev, loadingDevices: true }));

			try {
				const devices = await controller.loadExistingDevices(credentials, tokenStatus);
				setDeviceSelection({
					existingDevices: devices,
					loadingDevices: false,
					selectedExistingDevice: devices.length === 0 ? 'new' : '',
					showRegisterForm: devices.length === 0,
				});
			} catch (error) {
				console.error('[useMFAFlowController] Failed to load devices', error);
				setDeviceSelection((prev) => ({
					...prev,
					loadingDevices: false,
					selectedExistingDevice: 'new',
					showRegisterForm: true,
				}));
			}
		}
	};

	// Send OTP
	const sendOTP = async () => {
		if (!mfaState.deviceId) {
			console.error('[useMFAFlowController] No device ID available');
			return;
		}
		await controller.sendOTP(credentials, mfaState.deviceId, otpState, setOtpState, nav, setIsLoading);
	};

	// Validate OTP
	const validateOTP = async (): Promise<boolean> => {
		if (!mfaState.deviceId || !mfaState.otpCode) {
			console.error('[useMFAFlowController] Missing device ID or OTP code');
			return false;
		}
		return await controller.validateOTP(
			credentials,
			mfaState.deviceId,
			mfaState.otpCode,
			mfaState,
			setMfaState,
			validationState,
			setValidationState,
			nav,
			setIsLoading
		);
	};

	// Register device
	const registerDevice = async () => {
		if (!credentials.deviceName?.trim()) {
			nav.setValidationErrors(['Device name is required. Please enter a name for this device.']);
			return;
		}

		setIsLoading(true);
		try {
			const params = controller.getDeviceRegistrationParams(credentials);
			const result = await controller.registerDevice(credentials, params);
			
			setMfaState({
				deviceId: result.deviceId,
				deviceStatus: result.status,
			});

			// Refresh device list
			await loadDevices();

			nav.markStepComplete();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			const isDeviceLimitError =
				errorMessage.toLowerCase().includes('exceed') ||
				errorMessage.toLowerCase().includes('limit') ||
				errorMessage.toLowerCase().includes('maximum');

			if (isDeviceLimitError) {
				nav.setValidationErrors([`Device registration failed: ${errorMessage}`]);
			} else {
				nav.setValidationErrors([`Failed to register device: ${errorMessage}`]);
			}
		} finally {
			setIsLoading(false);
		}
	};

	return {
		deviceSelection,
		setDeviceSelection,
		loadDevices,
		otpState,
		setOtpState,
		sendOTP,
		validationState,
		setValidationState,
		validateOTP,
		registerDevice,
		nav,
	};
};

