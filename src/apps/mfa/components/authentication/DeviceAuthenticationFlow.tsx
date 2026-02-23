/**
 * @file DeviceAuthenticationFlow.tsx
 * @module apps/mfa/components/authentication
 * @description Device Authentication Flow Component - Separated authentication UI
 * @version 8.0.0
 * @since 2026-02-20
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiLock } from 'react-icons/fi';
import { AuthenticationCallbackHandler } from '@/apps/mfa/services/authentication/authenticationCallbackHandler';
import { AuthenticationStateManager } from '@/apps/mfa/services/authentication/authenticationStateManager';
import type { AuthenticationResult } from '@/apps/mfa/services/authentication/deviceAuthenticationService';
// Import new separated services
import { DeviceAuthenticationService } from '@/apps/mfa/services/authentication/deviceAuthenticationService';
import { MFACallbackRouter } from '@/apps/mfa/services/shared/mfaCallbackRouter';
// Import types
import type {
	AuthenticationChallenge,
	AuthenticationFlowState,
	MFACallbackData,
	MFADevice,
} from '@/apps/mfa/types/mfaFlowTypes';
import { AuthenticationStep } from '@/apps/mfa/types/mfaFlowTypes';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';
import { MFAErrorBoundary } from '@/v8/components/MFAErrorBoundary';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

interface DeviceAuthenticationFlowProps {
	onComplete?: (result: AuthenticationResult) => void;
	environmentId: string;
	username?: string;
	userId?: string;
	deviceAuthenticationPolicyId: string;
}

/**
 * Device Authentication Flow Component
 * Handles the complete device authentication process with separated concerns
 */
export const DeviceAuthenticationFlow: React.FC<DeviceAuthenticationFlowProps> = ({
	environmentId,
	username,
	userId,
	deviceAuthenticationPolicyId,
	onComplete,
}) => {
	const [authenticationState, setAuthenticationState] = useState<AuthenticationFlowState | null>(
		null
	);
	const [isLoading, setIsLoading] = useState(false);
	const [availableDevices, setAvailableDevices] = useState<MFADevice[]>([]);
	const [selectedDevice, setSelectedDevice] = useState<MFADevice | null>(null);
	const [challengeData, setChallengeData] = useState<AuthenticationChallenge | null>(null);
	const [otpCode, setOtpCode] = useState('');

	// Initialize authentication state
	useEffect(() => {
		const initialState = AuthenticationStateManager.createInitialState('login', {
			userId: userId || username || '',
			username: username || '',
			environmentId,
		});

		setAuthenticationState(initialState);
		AuthenticationStateManager.saveState(initialState);
	}, [environmentId, username, userId]);

	// Helper functions - moved before usage to fix hook dependencies
	// Get step name for display
	const getStepName = useCallback((step: AuthenticationStep): string => {
		const stepNames = {
			[AuthenticationStep.DEVICE_SELECTION]: 'Device Selection',
			[AuthenticationStep.CHALLENGE_INITIATION]: 'Challenge Initiation',
			[AuthenticationStep.CHALLENGE_RESPONSE]: 'Challenge Response',
			[AuthenticationStep.AUTHENTICATION_COMPLETE]: 'Authentication Complete',
		};
		return stepNames[step] || 'Unknown Step';
	}, []);

	// Get next step
	const getNextStep = useCallback((currentStep: AuthenticationStep): AuthenticationStep => {
		const stepOrder = Object.values(AuthenticationStep);
		const currentIndex = stepOrder.indexOf(currentStep);
		return stepOrder[Math.min(currentIndex + 1, stepOrder.length - 1)];
	}, []);

	// Get previous step
	const getPreviousStep = useCallback((currentStep: AuthenticationStep): AuthenticationStep => {
		const stepOrder = Object.values(AuthenticationStep);
		const currentIndex = stepOrder.indexOf(currentStep);
		return stepOrder[Math.max(currentIndex - 1, 0)];
	}, []);

	// Handle authentication initiation
	const handleInitiateAuthentication = useCallback(async () => {
		if (!selectedDevice) {
			toastV8.error('Please select a device');
			return;
		}

		setIsLoading(true);
		try {
			const result = await DeviceAuthenticationService.initializeDeviceAuthentication({
				environmentId,
				username: username || '',
				userId: userId || '',
				deviceAuthenticationPolicyId,
				deviceId: selectedDevice.id,
			});

			// Update challenge data
			if (result.challenge) {
				const challenge: AuthenticationChallenge = {
					challengeId: result.challenge.id,
					challengeType: result.challenge.type as 'OTP',
					expiresAt: result.challenge.expiresAt || Date.now() + 15 * 60 * 1000,
					attemptsRemaining: 3,
					challengeData: result.challenge.data || {},
				};

				const updatedState = AuthenticationStateManager.updateChallengeData(
					authenticationState!,
					challenge
				);
				setAuthenticationState(updatedState);
				setChallengeData(challenge);
			}

			toastV8.success('Authentication challenge initiated');
		} catch (_error) {
			toastV8.error('Failed to initiate authentication');
		} finally {
			setIsLoading(false);
		}
	}, [
		selectedDevice,
		authenticationState,
		environmentId,
		username,
		userId,
		deviceAuthenticationPolicyId,
	]);

	// Execute step-specific logic
	const executeStepLogic = useCallback(
		async (step: AuthenticationStep) => {
			switch (step) {
				case AuthenticationStep.CHALLENGE_INITIATION:
					await handleInitiateAuthentication();
					break;
				case AuthenticationStep.CHALLENGE_RESPONSE:
					// OTP validation handled separately
					break;
				case AuthenticationStep.AUTHENTICATION_COMPLETE:
					// Completion logic
					break;
				default:
					break;
			}
		},
		[handleInitiateAuthentication]
	);

	// Load available devices
	const loadAvailableDevices = useCallback(async () => {
		setIsLoading(true);
		try {
			const devices = await DeviceAuthenticationService.getAvailableDevices({
				environmentId,
				username: username || '',
				userId: userId || '',
				deviceAuthenticationPolicyId,
			});
			setAvailableDevices(devices);
		} catch (_error) {
			toastV8.error('Failed to load available devices');
		} finally {
			setIsLoading(false);
		}
	}, [environmentId, username, userId, deviceAuthenticationPolicyId]);

	// Load available devices when needed
	useEffect(() => {
		if (authenticationState?.currentStep === AuthenticationStep.DEVICE_SELECTION) {
			loadAvailableDevices();
		}
	}, [authenticationState?.currentStep, loadAvailableDevices]);

	// Handle callbacks specifically for authentication
	useEffect(() => {
		const handleCallback = async (callbackData: MFACallbackData) => {
			if (!authenticationState) return;

			setIsLoading(true);
			try {
				const result = await AuthenticationCallbackHandler.process(
					callbackData,
					authenticationState
				);
				if (result.success && result.flowState) {
					setAuthenticationState(result.flowState);
					toastV8.success('Authentication callback processed successfully');
				}
			} catch (_error) {
				toastV8.error('Failed to process authentication callback');
			} finally {
				setIsLoading(false);
			}
		};

		// Register callback listener
		MFACallbackRouter.registerCallbackHandler('authentication', handleCallback);

		return () => {
			MFACallbackRouter.unregisterCallbackHandler('authentication');
		};
	}, [authenticationState]);

	// Handle device selection
	const handleDeviceSelect = useCallback(
		(device: MFADevice) => {
			setSelectedDevice(device);
			if (authenticationState) {
				const updatedState = AuthenticationStateManager.updateSelectedDevice(
					authenticationState,
					device
				);
				setAuthenticationState(updatedState);
			}
		},
		[authenticationState]
	);

	// Handle step navigation
	const handleNextStep = useCallback(async () => {
		if (!authenticationState) return;

		setIsLoading(true);
		try {
			const nextStep = getNextStep(authenticationState.currentStep);

			// Execute step-specific logic
			await executeStepLogic(nextStep);

			const updatedState = AuthenticationStateManager.updateStep(authenticationState, nextStep);
			setAuthenticationState(updatedState);

			toastV8.success(`Advanced to ${getStepName(nextStep)}`);
		} catch (_error) {
			toastV8.error('Failed to advance to next step');
		} finally {
			setIsLoading(false);
		}
	}, [authenticationState, executeStepLogic, getNextStep, getStepName]);

	// Handle previous step
	const handlePreviousStep = useCallback(() => {
		if (!authenticationState) return;

		const previousStep = getPreviousStep(authenticationState.currentStep);
		const updatedState = AuthenticationStateManager.updateStep(authenticationState, previousStep);
		setAuthenticationState(updatedState);
	}, [authenticationState, getPreviousStep]);

	// Handle OTP validation
	const handleValidateOTP = useCallback(async () => {
		if (!otpCode || !challengeData) {
			toastV8.error('Please enter the OTP code');
			return;
		}

		setIsLoading(true);
		try {
			const result = await DeviceAuthenticationService.validateOTP({
				environmentId,
				username: username || '',
				userId: userId || '',
				deviceAuthenticationId: challengeData.challengeId,
				otp: otpCode,
			});

			if (result.isValid) {
				const updatedState = AuthenticationStateManager.updateStep(
					authenticationState!,
					AuthenticationStep.AUTHENTICATION_COMPLETE
				);
				setAuthenticationState(updatedState);
				toastV8.success('Authentication completed successfully');
				onComplete?.(result);
			} else {
				toastV8.error('Invalid OTP code');
			}
		} catch (_error) {
			toastV8.error('Failed to validate OTP');
		} finally {
			setIsLoading(false);
		}
	}, [otpCode, challengeData, authenticationState, environmentId, username, userId, onComplete]);

	// Calculate progress percentage
	const getProgressPercentage = (): number => {
		if (!authenticationState) return 0;
		return AuthenticationStateManager.getProgressPercentage(authenticationState);
	};

	// Get security metrics
	const getSecurityMetrics = () => {
		if (!authenticationState) return null;
		return AuthenticationStateManager.getSecurityMetrics(authenticationState);
	};

	// Render current step content
	const renderStepContent = () => {
		if (!authenticationState) return null;

		switch (authenticationState.currentStep) {
			case AuthenticationStep.DEVICE_SELECTION:
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-medium text-gray-900">Select Authentication Device</h3>
						<div className="space-y-2">
							{availableDevices.map((device) => (
								<button
									type="button"
									key={device.id}
									onClick={() => handleDeviceSelect(device)}
									className={`w-full p-3 border-2 rounded-lg text-left transition-colors ${
										selectedDevice?.id === device.id
											? 'border-green-500 bg-green-50'
											: 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
									}`}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center">
											<div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
												{device.type === 'SMS' && '📱'}
												{device.type === 'EMAIL' && '✉️'}
												{device.type === 'FIDO2' && '🔐'}
												{device.type === 'MOBILE' && '📲'}
												{!['SMS', 'EMAIL', 'FIDO2', 'MOBILE'].includes(device.type) && '🔒'}
											</div>
											<div>
												<p className="text-sm font-medium text-gray-900">{device.name}</p>
												<p className="text-xs text-gray-500">
													{device.type} • {device.status}
												</p>
											</div>
										</div>
										<div className="w-4 h-4 border-2 rounded-full flex items-center justify-center">
											{selectedDevice?.id === device.id && (
												<div className="w-2 h-2 bg-green-500 rounded-full"></div>
											)}
										</div>
									</div>
								</button>
							))}
						</div>
					</div>
				);

			case AuthenticationStep.CHALLENGE_INITIATION:
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-medium text-gray-900">Challenge Initiation</h3>
						<div className="bg-green-50 border border-green-200 rounded-lg p-4">
							<div className="flex">
								<FiShieldAlt className="text-green-600 mr-2 mt-0.5" />
								<div>
									<p className="text-sm text-green-800">Secure authentication session active</p>
									<p className="text-xs text-green-600 mt-1">
										Session expires in{' '}
										{getSecurityMetrics()?.stateAge
											? Math.max(0, 15 - Math.floor(getSecurityMetrics()!.stateAge / 60000))
											: 15}{' '}
										minutes
									</p>
								</div>
							</div>
						</div>
						{selectedDevice && (
							<div className="bg-gray-50 rounded-lg p-4">
								<p className="text-sm text-gray-700">
									Ready to send authentication challenge to <strong>{selectedDevice.name}</strong>
								</p>
							</div>
						)}
					</div>
				);

			case AuthenticationStep.CHALLENGE_RESPONSE:
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-medium text-gray-900">Enter Authentication Code</h3>
						<div>
							<label
								className="block text-sm font-medium text-gray-700 mb-1"
								htmlFor="challengedatachallengetypeotpotpcodeauthenticationcode"
							>
								{challengeData?.challengeType === 'OTP' ? 'OTP Code' : 'Authentication Code'}
							</label>
							<input
								type="text"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
								placeholder="Enter code"
								value={otpCode}
								onChange={(e) => setOtpCode(e.target.value)}
								maxLength={6}
							/>
						</div>
						{challengeData && (
							<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
								<div className="flex">
									<FiLock className="text-yellow-600 mr-2 mt-0.5" />
									<div>
										<p className="text-sm text-yellow-800">
											Authentication challenge sent to {selectedDevice?.name}
										</p>
										<p className="text-xs text-yellow-600 mt-1">
											Attempts remaining: {challengeData.attemptsRemaining}
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				);

			case AuthenticationStep.AUTHENTICATION_COMPLETE:
				return (
					<div className="space-y-4">
						<div className="text-center">
							<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<FiCheckCircle className="text-green-600 text-2xl" />
							</div>
							<h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Complete!</h3>
							<p className="text-sm text-gray-600">
								You have successfully authenticated using {selectedDevice?.name}.
							</p>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	if (!authenticationState) {
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
					title="Device Authentication"
					subtitle={`Authenticate using your registered devices for ${username || userId}`}
				/>

				{/* Progress Bar */}
				<div className="mb-6">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium text-gray-700">Authentication Progress</span>
						<span className="text-sm text-gray-500">
							Step {Object.values(AuthenticationStep).indexOf(authenticationState.currentStep) + 1}{' '}
							of {Object.values(AuthenticationStep).length}
						</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="bg-green-600 h-2 rounded-full transition-all duration-300"
							style={{ width: `${getProgressPercentage()}%` }}
						/>
					</div>
				</div>

				{/* Security Metrics */}
				{getSecurityMetrics() && (
					<div className="mb-6 bg-gray-50 rounded-lg p-4">
						<h4 className="text-sm font-medium text-gray-900 mb-2">Security Metrics</h4>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
							<div>
								<span className="text-gray-600">State Age</span>
								<span className="font-medium text-gray-900">
									{Math.floor(getSecurityMetrics()!.stateAge / 60000)}m{' '}
									{(getSecurityMetrics()!.stateAge % 60000) / 1000}s
								</span>
							</div>
							<div>
								<span className="text-gray-600">Risk Level</span>
								<span
									className={`px-2 py-1 rounded text-xs font-medium ${
										getSecurityMetrics()!.riskLevel === 'low'
											? 'bg-green-100 text-green-800'
											: getSecurityMetrics()!.riskLevel === 'medium'
												? 'bg-yellow-100 text-yellow-800'
												: 'bg-red-100 text-red-800'
									}`}
								>
									{getSecurityMetrics()!.riskLevel.toUpperCase()}
								</span>
							</div>
							<div>
								<span className="text-gray-600">Attempts</span>
								<span className="font-medium text-gray-900">
									{challengeData?.attemptsRemaining || 3}
								</span>
							</div>
							<div>
								<span className="text-gray-600">Expires In</span>
								<span className="font-medium text-gray-900">
									{challengeData
										? Math.max(0, Math.floor((challengeData.expiresAt - Date.now()) / 60000))
										: '--'}
									m
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Step Content */}
				<div className="mb-6">{renderStepContent()}</div>

				{/* Action Buttons */}
				<div className="flex justify-between">
					<button
						type="button"
						onClick={handlePreviousStep}
						disabled={authenticationState.currentStep === AuthenticationStep.DEVICE_SELECTION}
						className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<FiArrowLeft className="mr-2" />
						Back
					</button>

					{authenticationState.currentStep === AuthenticationStep.DEVICE_SELECTION ? (
						<button
							type="button"
							onClick={handleNextStep}
							disabled={!selectedDevice || isLoading}
							className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? (
								<ButtonSpinner />
							) : (
								<>
									Send Challenge
									<FiArrowRight className="ml-2" />
								</>
							)}
						</button>
					) : authenticationState.currentStep === AuthenticationStep.CHALLENGE_RESPONSE ? (
						<button
							type="button"
							onClick={handleValidateOTP}
							disabled={!otpCode || isLoading}
							className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? <ButtonSpinner /> : 'Validate Code'}
						</button>
					) : authenticationState.currentStep === AuthenticationStep.AUTHENTICATION_COMPLETE ? (
						<button
							type="button"
							onClick={() => onComplete?.(authenticationState)}
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
								authenticationState.currentStep === AuthenticationStep.AUTHENTICATION_COMPLETE
							}
							className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
