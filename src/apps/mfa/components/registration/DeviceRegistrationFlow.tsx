/**
 * @file DeviceRegistrationFlow.tsx
 * @module apps/mfa/components/registration
 * @description Device Registration Flow Component - Separated registration UI
 * @version 8.0.0
 * @since 2026-02-20
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiUserPlus } from 'react-icons/fi';
// Import new separated services
import { DeviceRegistrationService } from '@/apps/mfa/services/registration/deviceRegistrationService';
import { RegistrationCallbackHandler } from '@/apps/mfa/services/registration/registrationCallbackHandler';
import { RegistrationStateManager } from '@/apps/mfa/services/registration/registrationStateManager';
import { MFACallbackRouter } from '@/apps/mfa/services/shared/mfaCallbackRouter';
// Import types
import type {
	DeviceConfigKey,
	DeviceRegistrationData,
	MFACallbackData,
	RegistrationFlowState,
} from '@/apps/mfa/types/mfaFlowTypes';
import { RegistrationStep } from '@/apps/mfa/types/mfaFlowTypes';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';
import { MFAErrorBoundary } from '@/v8/components/MFAErrorBoundary';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

interface DeviceRegistrationFlowProps {
	environmentId: string;
	username: string;
	deviceType?: DeviceConfigKey;
	onComplete?: (result: DeviceRegistrationData) => void;
}

/**
 * Device Registration Flow Component
 * Handles the complete device registration process with separated concerns
 */
export const DeviceRegistrationFlow: React.FC<DeviceRegistrationFlowProps> = ({
	environmentId,
	username,
	deviceType,
	onComplete,
}) => {
	const [registrationState, setRegistrationState] = useState<RegistrationFlowState | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [deviceData, setDeviceData] = useState<Partial<DeviceRegistrationData>>({});
	const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceConfigKey>(deviceType);

	// Initialize registration state
	useEffect(() => {
		const initialState = RegistrationStateManager.createInitialState(
			selectedDeviceType,
			{
				userId: username,
				username,
				environmentId,
			},
			'user_initiated'
		);

		setRegistrationState(initialState);
		RegistrationStateManager.saveState(initialState);
	}, [environmentId, username, selectedDeviceType]);

	// Handle callbacks specifically for registration
	useEffect(() => {
		const handleCallback = async (callbackData: MFACallbackData) => {
			if (!registrationState) return;

			setIsLoading(true);
			try {
				const result = await RegistrationCallbackHandler.process(callbackData, registrationState);
				if (result.success && result.flowState) {
					setRegistrationState(result.flowState);
					toastV8.success('Registration callback processed successfully');
				}
			} catch (_error) {
				toastV8.error('Failed to process registration callback');
			} finally {
				setIsLoading(false);
			}
		};

		// Register callback listener
		MFACallbackRouter.registerCallbackHandler('registration', handleCallback);

		return () => {
			MFACallbackRouter.unregisterCallbackHandler('registration');
		};
	}, [registrationState]);

	// Helper functions - moved before usage to fix hook dependencies
	// Get step name for display
	const getStepName = useCallback((step: RegistrationStep): string => {
		const stepNames = {
			[RegistrationStep.DEVICE_TYPE_SELECTION]: 'Device Type Selection',
			[RegistrationStep.USER_VERIFICATION]: 'User Verification',
			[RegistrationStep.DEVICE_CONFIGURATION]: 'Device Configuration',
			[RegistrationStep.DEVICE_VALIDATION]: 'Device Validation',
			[RegistrationStep.REGISTRATION_COMPLETE]: 'Registration Complete',
		};
		return stepNames[step] || 'Unknown Step';
	}, []);

	// Get next step
	const getNextStep = useCallback((currentStep: RegistrationStep): RegistrationStep => {
		const stepOrder = Object.values(RegistrationStep);
		const currentIndex = stepOrder.indexOf(currentStep);
		return stepOrder[Math.min(currentIndex + 1, stepOrder.length - 1)];
	}, []);

	// Get previous step
	const getPreviousStep = useCallback((currentStep: RegistrationStep): RegistrationStep => {
		const stepOrder = Object.values(RegistrationStep);
		const currentIndex = stepOrder.indexOf(currentStep);
		return stepOrder[Math.max(currentIndex - 1, 0)];
	}, []);

	// Execute step-specific logic
	const executeStepLogic = useCallback(async (step: RegistrationStep, _state: RegistrationFlowState) => {
		switch (step) {
			case RegistrationStep.DEVICE_CONFIGURATION:
				// Device configuration logic
				break;
			case RegistrationStep.DEVICE_VALIDATION:
				// Device validation logic
				break;
			case RegistrationStep.REGISTRATION_COMPLETE:
				// Completion logic
				break;
			default:
				break;
		}
	}, []);

	// Handle step navigation
	const handleNextStep = useCallback(async () => {
		if (!registrationState) return;

		setIsLoading(true);
		try {
			const nextStep = getNextStep(registrationState.currentStep);
			const updatedState = RegistrationStateManager.updateStep(registrationState, nextStep);
			setRegistrationState(updatedState);

			// Execute step-specific logic
			await executeStepLogic(nextStep, updatedState);

			toastV8.success(`Advanced to ${getStepName(nextStep)}`);
		} catch (_error) {
			toastV8.error('Failed to advance to next step');
		} finally {
			setIsLoading(false);
		}
	}, [registrationState, executeStepLogic, getNextStep, getStepName]);

	// Handle previous step
	const handlePreviousStep = useCallback(() => {
		if (!registrationState) return;

		const previousStep = getPreviousStep(registrationState.currentStep);
		const updatedState = RegistrationStateManager.updateStep(registrationState, previousStep);
		setRegistrationState(updatedState);
	}, [registrationState, getPreviousStep]);

	// Handle device type selection
	const handleDeviceTypeSelect = useCallback(
		(type: DeviceConfigKey) => {
			setSelectedDeviceType(type);
			if (registrationState) {
				const updatedState = RegistrationStateManager.updateStep(
					registrationState,
					RegistrationStep.USER_VERIFICATION,
					{ deviceType: type }
				);
				setRegistrationState(updatedState);
			}
		},
		[registrationState]
	);

	// Handle device registration
	const handleRegisterDevice = useCallback(async () => {
		if (!registrationState || (!deviceData.phone && !deviceData.email)) {
			toastV8.error('Please provide phone number or email');
			return;
		}

		setIsLoading(true);
		try {
			const result = await DeviceRegistrationService.registerDevice({
				type: selectedDeviceType,
				environmentId,
				username,
				...deviceData,
			});

			toastV8.success('Device registered successfully!');

			// Update state with registration result
			const updatedState = RegistrationStateManager.updateStep(
				registrationState,
				RegistrationStep.REGISTRATION_COMPLETE,
				{ deviceData: { ...deviceData, deviceId: result.deviceId } }
			);
			setRegistrationState(updatedState);

			onComplete?.(result);
		} catch (_error) {
			toastV8.error('Failed to register device');
		} finally {
			setIsLoading(false);
		}
	}, [registrationState, deviceData, selectedDeviceType, environmentId, username, onComplete]);

	// Calculate progress percentage
	const getProgressPercentage = (): number => {
		if (!registrationState) return 0;
		return RegistrationStateManager.getProgressPercentage(registrationState);
	};

	// Render current step content
	const renderStepContent = () => {
		if (!registrationState) return null;

		switch (registrationState.currentStep) {
			case RegistrationStep.DEVICE_TYPE_SELECTION:
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-medium text-gray-900">Select Device Type</h3>
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
							{(['SMS', 'EMAIL', 'MOBILE', 'WHATSAPP', 'TOTP', 'FIDO2'] as DeviceConfigKey[]).map(
								(type) => (
									<button
										type="button"
										key={type}
										onClick={() => handleDeviceTypeSelect(type)}
										className={`p-4 border-2 rounded-lg text-center transition-colors ${
											selectedDeviceType === type
												? 'border-blue-500 bg-blue-50 text-blue-700'
												: 'border-gray-300 hover:border-gray-400 text-gray-700'
										}`}
									>
										<div className="text-2xl mb-2">
											{type === 'SMS' && '📱'}
											{type === 'EMAIL' && '✉️'}
											{type === 'MOBILE' && '📲'}
											{type === 'WHATSAPP' && '💬'}
											{type === 'TOTP' && '🔢'}
											{type === 'FIDO2' && '🔐'}
										</div>
										<div className="text-sm font-medium">{type}</div>
									</button>
								)
							)}
						</div>
					</div>
				);

			case RegistrationStep.USER_VERIFICATION:
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-medium text-gray-900">User Verification</h3>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
								Username
							</label>
							<input
								type="text"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								value={username}
								readOnly
							/>
						</div>
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<div className="flex">
								<FiUserPlus className="text-blue-600 mr-2 mt-0.5" />
								<div>
									<p className="text-sm text-blue-800">
										Registering {selectedDeviceType} device for user verification
									</p>
									<p className="text-xs text-blue-600 mt-1">
										A verification code will be sent to complete registration
									</p>
								</div>
							</div>
						</div>
					</div>
				);

			case RegistrationStep.DEVICE_CONFIGURATION:
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-medium text-gray-900">Device Configuration</h3>

						{selectedDeviceType === 'SMS' && (
							<div>
								<label
									className="block text-sm font-medium text-gray-700 mb-1"
									htmlFor="phonenumber"
								>
									Phone Number
								</label>
								<input
									type="tel"
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="+1 (555) 123-4567"
									onChange={(e) => setDeviceData({ ...deviceData, phone: e.target.value })}
								/>
							</div>
						)}

						{selectedDeviceType === 'EMAIL' && (
							<div>
								<label
									className="block text-sm font-medium text-gray-700 mb-1"
									htmlFor="emailaddress"
								>
									Email Address
								</label>
								<input
									type="email"
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="user@example.com"
									onChange={(e) => setDeviceData({ ...deviceData, email: e.target.value })}
								/>
							</div>
						)}

						<div>
							<label
								className="block text-sm font-medium text-gray-700 mb-1"
								htmlFor="devicenameoptional"
							>
								Device Name (Optional)
							</label>
							<input
								type="text"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder={`My ${selectedDeviceType} Device`}
								onChange={(e) => setDeviceData({ ...deviceData, name: e.target.value })}
							/>
						</div>
					</div>
				);

			case RegistrationStep.DEVICE_VALIDATION:
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-medium text-gray-900">Device Validation</h3>
						<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
							<div className="flex">
								<FiCheckCircle className="text-yellow-600 mr-2 mt-0.5" />
								<div>
									<p className="text-sm text-yellow-800">Device validation in progress</p>
									<p className="text-xs text-yellow-600 mt-1">
										Please wait while we validate your device configuration
									</p>
								</div>
							</div>
						</div>
					</div>
				);

			case RegistrationStep.REGISTRATION_COMPLETE:
				return (
					<div className="space-y-4">
						<div className="text-center">
							<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<FiCheckCircle className="text-green-600 text-2xl" />
							</div>
							<h3 className="text-lg font-medium text-gray-900 mb-2">Registration Complete!</h3>
							<p className="text-sm text-gray-600">
								Your {selectedDeviceType} device has been successfully registered.
							</p>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	if (!registrationState) {
		return (
			<div className="flex items-center justify-center p-8">
				<ButtonSpinner />
			</div>
		);
	}

	return (
		<MFAErrorBoundary>
			<div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
				{/* Header */}
				<MFAHeaderV8
					title="Device Registration"
					subtitle={`Register a ${selectedDeviceType} device for ${username}`}
				/>

				{/* Progress Bar */}
				<div className="mb-6">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium text-gray-700">Registration Progress</span>
						<span className="text-sm text-gray-500">
							Step {Object.values(RegistrationStep).indexOf(registrationState.currentStep) + 1} of{' '}
							{Object.values(RegistrationStep).length}
						</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="bg-blue-600 h-2 rounded-full transition-all duration-300"
							style={{ width: `${getProgressPercentage()}%` }}
						/>
					</div>
				</div>

				{/* Step Content */}
				<div className="mb-6">{renderStepContent()}</div>

				{/* Action Buttons */}
				<div className="flex justify-between">
					<button
						type="button"
						onClick={handlePreviousStep}
						disabled={registrationState.currentStep === RegistrationStep.DEVICE_TYPE_SELECTION}
						className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<FiArrowLeft className="mr-2" />
						Back
					</button>

					{registrationState.currentStep === RegistrationStep.DEVICE_CONFIGURATION ? (
						<button
							type="button"
							onClick={handleRegisterDevice}
							disabled={isLoading}
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? <ButtonSpinner /> : 'Register Device'}
						</button>
					) : registrationState.currentStep === RegistrationStep.REGISTRATION_COMPLETE ? (
						<button
							type="button"
							onClick={() => onComplete?.(registrationState)}
							className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
						>
							Complete
						</button>
					) : (
						<button
							type="button"
							onClick={handleNextStep}
							disabled={
								isLoading ||
								registrationState.currentStep === RegistrationStep.REGISTRATION_COMPLETE
							}
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? (
								<ButtonSpinner />
							) : (
								<>
									Next Step
									<FiArrowRight className="ml-2" />
								</>
							)}
						</button>
					)}
				</div>
			</div>
		</MFAErrorBoundary>
	);
};
