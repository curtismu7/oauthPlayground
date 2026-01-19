/**
 * @file SMSDeviceSelectionStepV8.tsx
 * @module v8/flows/components
 * @description Reusable SMS device selection component extracted from SMSFlowV8
 * @version 8.3.0
 */

import React, { useEffect, useRef } from 'react';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { MFADeviceSelector } from '../components/MFADeviceSelector';
import { useMFALoadingStateManager } from '@/v8/utils/loadingStateManagerV8';
import { CollapsibleSectionV8 } from '@/v8/components/shared/CollapsibleSectionV8';
import { SuccessMessage } from '@/v8/components/shared/MessageBoxV8';
import type { MFACredentials, MFAState } from '../shared/MFATypes';
import type { MFAFlowBaseRenderProps } from '../shared/MFAFlowBaseV8';

const MODULE_TAG = '[📱 SMS-DEVICE-SELECTION-V8]';

export type DeviceSelectionState = {
	existingDevices: Record<string, unknown>[];
	loadingDevices: boolean;
	selectedExistingDevice: string;
	showRegisterForm: boolean;
};

export interface SMSDeviceSelectionStepProps {
	controller: any;
	deviceSelection: DeviceSelectionState;
	setDeviceSelection: React.Dispatch<React.SetStateAction<DeviceSelectionState>>;
	updateOtpState: (update: Partial<any> | ((prev: any) => Partial<any>)) => void;
	credentials: MFACredentials;
	setCredentials: React.Dispatch<React.SetStateAction<MFACredentials>>;
	mfaState: MFAState;
	setMfaState: React.Dispatch<React.SetStateAction<MFAState>>;
	nav: ReturnType<any>;
	setIsLoading: (loading: boolean) => void;
	tokenStatus: any;
	isConfigured?: boolean;
}

/**
 * Reusable SMS device selection component
 * Handles device loading, selection, and authentication initialization
 */
export const SMSDeviceSelectionStep: React.FC<SMSDeviceSelectionStepProps> = ({
	controller,
	deviceSelection,
	setDeviceSelection,
	updateOtpState,
	credentials,
	setCredentials,
	mfaState,
	setMfaState,
	nav,
	setIsLoading,
	tokenStatus,
	isConfigured = false,
}) => {
	const lastLookupRef = React.useRef<{ environmentId: string; username: string } | null>(null);
	const loadingManager = useMFALoadingStateManager();

	const environmentId = credentials.environmentId?.trim();
	const username = credentials.username?.trim();

	// Load existing devices when component mounts or dependencies change
	useEffect(() => {
		// Skip device loading during registration flow (when coming from config page)
		if (isConfigured) {
			setDeviceSelection({
				existingDevices: [],
				loadingDevices: false,
				selectedExistingDevice: 'new',
				showRegisterForm: false,
			});
			// Skip to registration step immediately
			if (nav.currentStep === 1) {
				nav.goToStep(2);
			}
			return;
		}

		if (nav.currentStep !== 1) {
			return;
		}
		if (!environmentId || !username || !tokenStatus.isValid) {
			return;
		}

		const alreadyLoaded =
			lastLookupRef.current &&
			lastLookupRef.current.environmentId === environmentId &&
			lastLookupRef.current.username === username &&
			deviceSelection.existingDevices.length > 0;

		if (alreadyLoaded) {
			return;
		}

		let cancelled = false;
		setDeviceSelection((prev) => ({ ...prev, loadingDevices: true }));

		const fetchDevices = async () => {
			try {
				const devices = await controller.getExistingDevices(credentials);
				if (!cancelled) {
					setDeviceSelection((prev) => ({
						...prev,
						existingDevices: devices || [],
						loadingDevices: false,
						selectedExistingDevice: devices && devices.length > 0 ? 'new' : 'new',
						showRegisterForm: devices && devices.length === 0,
					}));
				}
			} catch (error) {
				if (!cancelled) {
					console.error(`${MODULE_TAG} Failed to load existing devices:`, error);
					setDeviceSelection((prev) => ({
						...prev,
						loadingDevices: false,
						selectedExistingDevice: 'new',
						showRegisterForm: true,
					}));
				}
			}
		};

		void fetchDevices();

		return () => {
			cancelled = true;
		};
	}, [
		controller,
		deviceSelection.existingDevices.length,
		environmentId,
		isConfigured,
		nav,
		setDeviceSelection,
		tokenStatus.isValid,
		username,
		credentials,
	]);

	// Authenticate existing device using loading manager
	const authenticateExistingDevice = async (deviceId: string) => {
		await loadingManager.withLoading(async () => {
			try {
				const authResult = await controller.initializeDeviceAuthentication(credentials, deviceId);
				const nextStep = authResult.nextStep ?? authResult.status;

				setMfaState((prev) => ({
					...prev,
					deviceId,
					authenticationId: authResult.authenticationId,
					deviceAuthId: authResult.authenticationId,
					environmentId: credentials.environmentId,
					...(nextStep ? { nextStep } : {}),
				}));

				switch (nextStep) {
					case 'COMPLETED':
						nav.markStepComplete();
						nav.goToStep(3);
						toastV8.success('Authentication successful!');
						break;
					case 'OTP_REQUIRED':
						updateOtpState({ otpSent: true, sendRetryCount: 0, sendError: null });
						nav.markStepComplete();
						nav.goToStep(3);
						toastV8.success('OTP sent to your phone. Proceed to validate the code.');
						break;
					case 'SELECTION_REQUIRED':
						nav.setValidationErrors([
							'Multiple devices require selection. Please choose the specific device to authenticate.',
						]);
						toastV8.warning('Please select a specific device');
						break;
					default:
						updateOtpState({
							otpSent: nextStep === 'OTP_REQUIRED',
							sendRetryCount: 0,
							sendError: null,
						});
						nav.markStepComplete();
						nav.goToStep(3);
						toastV8.success('Device selected for authentication. Follow the next step to continue.');
				}
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to initialize authentication:`, error);
				nav.setValidationErrors([`Failed to authenticate: ${error instanceof Error ? error.message : 'Unknown error'}`]);
				toastV8.error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
				updateOtpState({ otpSent: false });
			}
		});
	};

	const handleSelectExistingDevice = (deviceId: string) => {
		setDeviceSelection((prev) => ({
			...prev,
			selectedExistingDevice: deviceId,
			showRegisterForm: false,
		}));
		updateOtpState({ otpSent: false, sendError: null });
		const device = deviceSelection.existingDevices.find((d) => d.id === deviceId);
		if (device) {
			void authenticateExistingDevice(deviceId);
		}
	};

	const handleSelectNewDevice = () => {
		setDeviceSelection((prev) => ({
			...prev,
			selectedExistingDevice: 'new',
			showRegisterForm: true,
		}));
		updateOtpState({ otpSent: false, sendError: null });
	};

	return (
		<CollapsibleSectionV8 
			title="Select SMS Device - Choose an existing device or register a new one"
			defaultExpanded={true}
		>
			<MFADeviceSelector
				devices={deviceSelection.existingDevices}
				selectedDevice={deviceSelection.selectedExistingDevice}
				loadingDevices={deviceSelection.loadingDevices}
				onSelectDevice={handleSelectExistingDevice}
				onSelectNew={handleSelectNewDevice}
				onUseSelected={handleSelectExistingDevice}
				renderDeviceInfo={(device) => <>{device.status && `Status: ${device.status}`}</>}
			/>
			
			{mfaState.deviceId && (
				<SuccessMessage title="Device Ready">
					<p>
						<strong>Device ID:</strong> {mfaState.deviceId}
					</p>
					<p>
						<strong>Status:</strong> {mfaState.deviceStatus}
					</p>
				</SuccessMessage>
			)}
		</CollapsibleSectionV8>
	);
};

export default SMSDeviceSelectionStep;
