/**
 * @file MobileFlowV8.tsx
 * @module v8/flows/types
 * @description Mobile-specific MFA flow component (Refactored with Controller Pattern)
 * @version 8.2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import { FiMail, FiShield, FiX } from '@icons';
import { CountryCodePickerV8 } from '@/v8/components/CountryCodePickerV8';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { SuccessMessage } from '@/v8/components/shared/MessageBoxV8';
import { useDraggableModal } from '@/v8/hooks/useDraggableModal';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { fetchPhoneFromPingOne } from '@/v8/services/phoneAutoPopulationServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { WorkerTokenUIServiceV8 } from '@/v8/services/workerTokenUIServiceV8'; // NEW - Enhanced UI service
import { useMFALoadingStateManager } from '@/v8/utils/loadingStateManagerV8';
import { navigateToMfaHubWithCleanup } from '@/v8/utils/mfaFlowCleanupV8';
import { isValidPhoneFormat, validateAndNormalizePhone } from '@/v8/utils/phoneValidationV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { type Device, MFADeviceSelector } from '../components/MFADeviceSelector';
import { MFAOTPInput } from '../components/MFAOTPInput';
import { getFullPhoneNumber } from '../controllers/SMSFlowController';
import { MFAFlowControllerFactory } from '../factories/MFAFlowControllerFactory';
import { MFAConfigurationStepV8 } from '../shared/MFAConfigurationStepV8';
import { type MFAFlowBaseRenderProps, MFAFlowBaseV8 } from '../shared/MFAFlowBaseV8';
import type { DeviceType, MFACredentials } from '../shared/MFATypes';
import { buildSuccessPageData, MFASuccessPageV8 } from '../shared/mfaSuccessPageServiceV8';
import { useUnifiedOTPFlow } from '../shared/useUnifiedOTPFlow';

const MODULE_TAG = '[📱 MOBILE-FLOW-V8]';

type DeviceSelectionState = {
	existingDevices: Record<string, unknown>[];
	loadingDevices: boolean;
	selectedExistingDevice: string;
	showRegisterForm: boolean;
};

type OTPState = {
	otpSent: boolean;
	sendError: string | null;
	sendRetryCount: number;
};

type ValidationState = {
	validationAttempts: number;
	lastValidationError: string | null;
};

interface DeviceSelectionStepProps extends MFAFlowBaseRenderProps {
	controller: ReturnType<typeof MFAFlowControllerFactory.create>;
	deviceSelection: DeviceSelectionState;
	setDeviceSelection: React.Dispatch<React.SetStateAction<DeviceSelectionState>>;
	updateOtpState: (update: Partial<OTPState> | ((prev: OTPState) => Partial<OTPState>)) => void;
}

const MobileDeviceSelectionStep: React.FC<
	DeviceSelectionStepProps & { isConfigured?: boolean }
> = ({
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

	React.useEffect(() => {
		// Skip device loading during registration flow (when coming from config page)
		if (isConfigured) {
			setDeviceSelection({
				existingDevices: [],
				loadingDevices: false,
				selectedExistingDevice: 'new',
				showRegisterForm: true,
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
				const devices = await controller.loadExistingDevices(credentials, tokenStatus);
				if (cancelled) {
					return;
				}
				lastLookupRef.current = { environmentId, username };
				setDeviceSelection({
					existingDevices: devices,
					loadingDevices: false,
					selectedExistingDevice: devices.length === 0 ? 'new' : '',
					showRegisterForm: devices.length === 0,
				});
			} catch (error) {
				if (cancelled) {
					return;
				}
				console.error(`${MODULE_TAG} Failed to load devices`, error);
				setDeviceSelection((prev) => ({
					...prev,
					loadingDevices: false,
					selectedExistingDevice: 'new',
					showRegisterForm: true,
				}));
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
		tokenStatus,
	]);

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
						nav.goToStep(4);
						toastV8.success('Authentication successful!');
						break;
					case 'OTP_REQUIRED':
						updateOtpState({ otpSent: true, sendRetryCount: 0, sendError: null });
						nav.markStepComplete();
						nav.goToStep(3);
						toastV8.success('OTP sent to your device. Proceed to validate the code.');
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
						toastV8.success(
							'Device selected for authentication. Follow the next step to continue.'
						);
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Unknown error';
				console.error(`${MODULE_TAG} Failed to initialize authentication:`, error);
				nav.setValidationErrors([`Failed to authenticate: ${message}`]);
				toastV8.error(`Authentication failed: ${message}`);
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
			setMfaState({
				...mfaState,
				deviceId,
				deviceStatus: (device.status as string) || 'ACTIVE',
				nickname: (device.nickname as string) || (device.name as string) || '',
			});
			void authenticateExistingDevice(deviceId);
		}
	};

	const handleSelectNewDevice = () => {
		setDeviceSelection((prev) => ({
			...prev,
			selectedExistingDevice: 'new',
			showRegisterForm: false,
		}));
		setMfaState({
			...mfaState,
			deviceId: '',
			deviceStatus: '',
		});
		setCredentials({
			...credentials,
			deviceName: credentials.deviceType || 'SMS',
			nickname: credentials.nickname || 'MyKnickName',
		});
		nav.goToStep(2);
	};

	return (
		<div className="step-content">
			<h2>Select SMS Device</h2>
			<p>Choose an existing device or register a new one</p>

			<MFADeviceSelector
				devices={deviceSelection.existingDevices.map((d) => {
					const mappedDevice: Device = {
						id: String(d.id ?? ''),
						type: typeof d.type === 'string' ? (d.type as string) : 'SMS',
					};

					if (typeof d.nickname === 'string') {
						mappedDevice.nickname = d.nickname as string;
					}
					if (typeof d.name === 'string') {
						mappedDevice.name = d.name as string;
					}
					if (typeof d.phone === 'string') {
						mappedDevice.phone = d.phone as string;
					}
					if (typeof d.status === 'string') {
						mappedDevice.status = d.status as string;
					}

					return mappedDevice;
				})}
				loading={deviceSelection.loadingDevices}
				selectedDeviceId={deviceSelection.selectedExistingDevice}
				deviceType="MOBILE"
				onSelectDevice={handleSelectExistingDevice}
				onSelectNew={handleSelectNewDevice}
				renderDeviceInfo={(device) => (
					<>
						{device.phone && `Phone: ${device.phone}`}
						{device.status && ` • Status: ${device.status}`}
					</>
				)}
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
		</div>
	);
};

interface MobileConfigureStepProps extends MFAFlowBaseRenderProps {
	registrationFlowType?: 'admin' | 'user';
	setRegistrationFlowType?: (type: 'admin' | 'user') => void;
	adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
	setAdminDeviceStatus?: (status: 'ACTIVE' | 'ACTIVATION_REQUIRED') => void;
}

const MobileConfigureStep: React.FC<MobileConfigureStepProps> = (props) => {
	const {
		registrationFlowType = 'user',
		setRegistrationFlowType,
		adminDeviceStatus = 'ACTIVE',
		setAdminDeviceStatus,
	} = props;
	const currentDeviceType =
		props.credentials.deviceType === 'SMS' || props.credentials.deviceType === 'EMAIL'
			? props.credentials.deviceType
			: 'SMS';

	// Ref to prevent infinite loops in bidirectional sync
	const isSyncingRef = React.useRef(false);

	// Bidirectional sync between Registration Flow Type and tokenType dropdown
	// When Registration Flow Type changes, update tokenType dropdown
	React.useEffect(() => {
		// Skip if we're in the middle of syncing from the other direction
		if (isSyncingRef.current) return;

		// User Flow: Uses User Token (from OAuth login), always set status to ACTIVATION_REQUIRED
		// Admin Flow: Uses Worker Token, can choose ACTIVE or ACTIVATION_REQUIRED
		if (registrationFlowType === 'user' && props.credentials.tokenType !== 'user') {
			// User Flow selected - ensure User Token is used
			console.log(`${MODULE_TAG} User Flow selected - ensuring User Token is used`);
			isSyncingRef.current = true;
			props.setCredentials((prev) => ({
				...prev,
				tokenType: 'user',
				// Preserve userToken if it exists (from OAuth login)
				// Don't clear it - User Flow requires User Token
			}));
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		} else if (registrationFlowType === 'admin' && props.credentials.tokenType !== 'worker') {
			// User selected "Admin Flow" - sync to tokenType dropdown
			console.log(
				`${MODULE_TAG} Registration Flow Type changed to 'admin' - syncing tokenType dropdown`
			);
			isSyncingRef.current = true;

			// Close UserLoginModal if it's open (Admin Flow uses worker token, not user token)
			if (props.showUserLoginModal) {
				console.log(`${MODULE_TAG} Closing UserLoginModal - Admin Flow uses worker token`);
				props.setShowUserLoginModal(false);
			}

			props.setCredentials((prev) => ({
				...prev,
				tokenType: 'worker',
				userToken: '', // Clear user token when switching to admin (Admin Flow uses Worker Token)
			}));
			// Reset flag after state update
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		}
	}, [
		registrationFlowType,
		props.credentials.tokenType,
		props.showUserLoginModal,
		props.setCredentials,
		props.setShowUserLoginModal,
	]);

	// When tokenType dropdown changes, sync to Registration Flow Type
	React.useEffect(() => {
		// Skip if we're in the middle of syncing from the other direction
		if (isSyncingRef.current) return;

		// Admin Flow uses Worker Token, User Flow uses User Token
		// Sync when switching between flows
		if (props.credentials.tokenType === 'worker' && registrationFlowType === 'user') {
			// User changed dropdown to "Worker Token" but User Flow is selected - this is invalid
			// User Flow must use User Token, so we should switch to Admin Flow
			console.log(
				`${MODULE_TAG} Token type is 'worker' but User Flow is selected - switching to Admin Flow`
			);
			setRegistrationFlowType('admin');
			return;
		} else if (props.credentials.tokenType === 'user' && registrationFlowType === 'admin') {
			// User changed dropdown to "User Token" but Admin Flow is selected - switch to User Flow
			console.log(
				`${MODULE_TAG} Token type is 'user' but Admin Flow is selected - switching to User Flow`
			);
			setRegistrationFlowType('user');
			return;
		} else if (props.credentials.tokenType === 'worker' && registrationFlowType !== 'admin') {
			// User changed dropdown to "Worker Token" - sync to Registration Flow Type
			console.log(
				`${MODULE_TAG} Token type dropdown changed to 'worker' - syncing Registration Flow Type`
			);
			isSyncingRef.current = true;
			setRegistrationFlowType?.('admin');
			// Reset flag after state update
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		}
	}, [props.credentials.tokenType, registrationFlowType, setRegistrationFlowType]);

	return (
		<>
			{/* Registration Flow Type Selection - SMS/Email specific - MOVED ABOVE MFAConfigurationStepV8 */}
			<div
				style={{
					marginBottom: '28px',
					padding: '20px',
					background: '#ffffff',
					borderRadius: '8px',
					border: '1px solid #e5e7eb',
					boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
				}}
			>
				<label
					style={{
						display: 'block',
						fontSize: '14px',
						fontWeight: '600',
						color: '#374151',
						marginBottom: '16px',
					}}
				>
					Registration Flow Type <span style={{ color: '#dc2626' }}>*</span>
				</label>
				<div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
					<label
						style={{
							flex: 1,
							padding: '16px',
							border: `2px solid ${registrationFlowType === 'admin' ? '#3b82f6' : '#d1d5db'}`,
							borderRadius: '8px',
							background: registrationFlowType === 'admin' ? '#eff6ff' : 'white',
							cursor: 'pointer',
							transition: 'all 0.2s ease',
						}}
						onClick={() => setRegistrationFlowType?.('admin')}
					>
						<div
							style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}
						>
							<input
								type="radio"
								name="registration-flow-type"
								value="admin"
								checked={registrationFlowType === 'admin'}
								onChange={() => setRegistrationFlowType?.('admin')}
								style={{ margin: 0, cursor: 'pointer', width: '18px', height: '18px' }}
							/>
							<div style={{ flex: 1 }}>
								<span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
									Admin Flow
								</span>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginTop: '2px',
										fontStyle: 'italic',
									}}
								>
									Using worker token
								</div>
							</div>
						</div>
						{/* Always show device status options for Admin Flow, even when not selected */}
						<div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
							<div
								style={{
									fontSize: '13px',
									fontWeight: '600',
									color: '#374151',
									marginBottom: '8px',
									display: 'flex',
									alignItems: 'center',
									gap: '6px',
								}}
							>
								Device Status:
								<MFAInfoButtonV8
									contentKey="device.status.rules"
									displayMode="modal"
									label="What is this?"
									stopPropagation={true}
								/>
							</div>
							<div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
								<label
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										padding: '8px 12px',
										border: `1px solid ${adminDeviceStatus === 'ACTIVE' ? '#10b981' : '#d1d5db'}`,
										borderRadius: '6px',
										background: adminDeviceStatus === 'ACTIVE' ? '#f0fdf4' : 'white',
										cursor: registrationFlowType === 'admin' ? 'pointer' : 'default',
										transition: 'all 0.2s ease',
										opacity: registrationFlowType === 'admin' ? 1 : 0.7,
									}}
									onClick={(e) => {
										e.stopPropagation();
										if (registrationFlowType === 'admin') {
											setAdminDeviceStatus?.('ACTIVE');
										}
									}}
								>
									<input
										type="radio"
										name="admin-device-status"
										value="ACTIVE"
										checked={adminDeviceStatus === 'ACTIVE'}
										onChange={() => {
											if (registrationFlowType === 'admin') {
												setAdminDeviceStatus?.('ACTIVE');
											}
										}}
										onClick={(e) => e.stopPropagation()}
										disabled={registrationFlowType !== 'admin'}
										style={{
											margin: 0,
											cursor: registrationFlowType === 'admin' ? 'pointer' : 'not-allowed',
											width: '16px',
											height: '16px',
										}}
									/>
									<span style={{ fontSize: '13px', color: '#374151' }}>
										<strong>ACTIVE</strong> - Device created as ready to use, no activation needed
									</span>
								</label>
								<label
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										padding: '8px 12px',
										border: `1px solid ${adminDeviceStatus === 'ACTIVATION_REQUIRED' ? '#f59e0b' : '#d1d5db'}`,
										borderRadius: '6px',
										background: adminDeviceStatus === 'ACTIVATION_REQUIRED' ? '#fffbeb' : 'white',
										cursor: registrationFlowType === 'admin' ? 'pointer' : 'default',
										transition: 'all 0.2s ease',
										opacity: registrationFlowType === 'admin' ? 1 : 0.7,
									}}
									onClick={(e) => {
										e.stopPropagation();
										if (registrationFlowType === 'admin') {
											setAdminDeviceStatus?.('ACTIVATION_REQUIRED');
										}
									}}
								>
									<input
										type="radio"
										name="admin-device-status"
										value="ACTIVATION_REQUIRED"
										checked={adminDeviceStatus === 'ACTIVATION_REQUIRED'}
										onChange={() => {
											if (registrationFlowType === 'admin') {
												setAdminDeviceStatus?.('ACTIVATION_REQUIRED');
											}
										}}
										onClick={(e) => e.stopPropagation()}
										disabled={registrationFlowType !== 'admin'}
										style={{
											margin: 0,
											cursor: registrationFlowType === 'admin' ? 'pointer' : 'not-allowed',
											width: '16px',
											height: '16px',
										}}
									/>
									<span style={{ fontSize: '13px', color: '#374151' }}>
										<strong>ACTIVATION_REQUIRED</strong> - OTP will be sent for device activation
									</span>
								</label>
							</div>
						</div>
					</label>
					<label
						style={{
							flex: 1,
							padding: '16px',
							border: `2px solid ${registrationFlowType === 'user' ? '#3b82f6' : '#d1d5db'}`,
							borderRadius: '8px',
							background: registrationFlowType === 'user' ? '#eff6ff' : 'white',
							cursor: 'pointer',
							transition: 'all 0.2s ease',
						}}
						onClick={() => setRegistrationFlowType?.('user')}
					>
						<div
							style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}
						>
							<input
								type="radio"
								name="registration-flow-type"
								value="user"
								checked={registrationFlowType === 'user'}
								onChange={() => setRegistrationFlowType?.('user')}
								style={{ margin: 0, cursor: 'pointer', width: '18px', height: '18px' }}
							/>
							<div style={{ flex: 1 }}>
								<span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
									User Flow
								</span>
								<div
									style={{
										fontSize: '12px',
										color: '#6b7280',
										marginTop: '2px',
										fontStyle: 'italic',
									}}
								>
									Using access token from User Authentication
								</div>
							</div>
						</div>
						<div
							style={{
								fontSize: '13px',
								color: '#6b7280',
								marginLeft: '28px',
								lineHeight: '1.5',
								padding: '8px 12px',
								background: '#f9fafb',
								borderRadius: '6px',
								border: '1px solid #e5e7eb',
							}}
						>
							<strong style={{ color: '#f59e0b' }}>ACTIVATION_REQUIRED</strong> - OTP will be sent
							for device activation
						</div>
					</label>
				</div>
				<small
					style={{
						display: 'block',
						marginTop: '12px',
						fontSize: '12px',
						color: '#6b7280',
						lineHeight: '1.5',
					}}
				>
					Admin Flow allows choosing device status (ACTIVE or ACTIVATION_REQUIRED). User Flow always
					requires activation.
				</small>
			</div>

			<MFAConfigurationStepV8
				{...props}
				deviceType={currentDeviceType}
				deviceTypeLabel={
					currentDeviceType === 'EMAIL' ? 'Email' : currentDeviceType === 'VOICE' ? 'Voice' : 'SMS'
				}
				registrationFlowType={registrationFlowType}
				policyDescription={`Controls how PingOne challenges the user during ${currentDeviceType === 'EMAIL' ? 'Email' : currentDeviceType === 'VOICE' ? 'Voice' : 'SMS'} MFA authentication.`}
			/>
		</>
	);
};

// Device selection state management wrapper
const MobileFlowV8WithDeviceSelection: React.FC = () => {
	// Use shared hook for common state and logic
	const flow = useUnifiedOTPFlow({
		deviceType: 'MOBILE',
		configPageRoute: '/v8/mfa/register/mobile',
	});

	// Initialize loading state manager
	const _loadingManager = useMFALoadingStateManager();

	// Destructure from shared hook
	const {
		deviceSelection,
		setDeviceSelection,
		otpState,
		updateOtpState,
		validationState,
		updateValidationState,
		showModal,
		setShowModal,
		showValidationModal,
		setShowValidationModal,
		registrationFlowType,
		setRegistrationFlowType,
		adminDeviceStatus,
		setAdminDeviceStatus,
		deviceRegisteredActive,
		setDeviceRegisteredActive,
		isApiDisplayVisible,
		apiDisplayHeight,
		isCheckingCredentials,
		controller,
		navigate,
		location,
		isConfigured,
		getContactDisplay,
		getContactLabel,
		getDeviceTypeDisplay,
		MODULE_TAG,
	} = flow;

	// Initialize controller using factory - will be updated dynamically based on selected device type
	// Note: The shared hook already provides a controller, but we keep this for dynamic device type switching
	const [controllerDeviceType, setControllerDeviceType] = useState<'SMS' | 'EMAIL'>('SMS');
	const dynamicController = useMemo(
		() => MFAFlowControllerFactory.create({ deviceType: controllerDeviceType }),
		[controllerDeviceType]
	);

	// Use the dynamic controller if device type is different, otherwise use the hook's controller
	const _effectiveController = controllerDeviceType !== 'SMS' ? dynamicController : controller;

	// Track previous step to detect when we navigate to step 1
	const previousStepRef = React.useRef<number | null>(null);

	// Track if we've updated credentials from location.state
	const credentialsUpdatedRef = React.useRef(false);

	// Ref to track if deviceName has been reset for step 2 (to avoid Rules of Hooks violation)
	const step2DeviceNameResetRef = React.useRef<{ step: number; deviceType: string } | null>(null);

	// Ref to store step 2 props for hooks to access
	const step2PropsRef = React.useRef<MFAFlowBaseRenderProps | null>(null);

	// Auto-populate phone from PingOne user when entering step 2
	const phoneFetchAttemptedRef = React.useRef<{ step: number; username: string } | null>(null);
	const pendingPhoneFetchTriggerRef = React.useRef<{
		step: number;
		username: string;
		environmentId: string;
	} | null>(null);

	// Step 0: Configure Credentials - skip if coming from config page with all prerequisites
	const renderStep0 = useMemo(() => {
		return (props: MFAFlowBaseRenderProps) => {
			const { nav, credentials, setCredentials, tokenStatus } = props;
			const locationState = location.state as {
				configured?: boolean;
				deviceAuthenticationPolicyId?: string;
				policyName?: string;
				environmentId?: string;
				username?: string;
				registrationFlowType?: 'admin' | 'user';
				adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
			} | null;

			// Merge location.state into credentials (only once, deferred to avoid render-phase updates)
			if (!credentialsUpdatedRef.current && locationState) {
				// Defer state update to avoid render-phase update warning
				setTimeout(() => {
					const updated = { ...credentials };
					let hasChanges = false;

					// Merge policy ID
					if (
						locationState.deviceAuthenticationPolicyId &&
						updated.deviceAuthenticationPolicyId !== locationState.deviceAuthenticationPolicyId
					) {
						updated.deviceAuthenticationPolicyId = locationState.deviceAuthenticationPolicyId;
						hasChanges = true;
					}

					// Merge environmentId (only if not already set)
					if (locationState.environmentId?.trim() && !updated.environmentId?.trim()) {
						updated.environmentId = locationState.environmentId.trim();
						hasChanges = true;
					}

					// Merge username (only if not already set)
					if (locationState.username?.trim() && !updated.username?.trim()) {
						updated.username = locationState.username.trim();
						hasChanges = true;
					}

					// Merge registrationFlowType and adminDeviceStatus from config page
					if (locationState.registrationFlowType) {
						setRegistrationFlowType(locationState.registrationFlowType);
					}
					if (locationState.adminDeviceStatus) {
						setAdminDeviceStatus(locationState.adminDeviceStatus);
					}

					if (hasChanges) {
						console.log(`${MODULE_TAG} Merged config page state into credentials:`, {
							deviceAuthPolicyId: !!updated.deviceAuthenticationPolicyId,
							environmentId: !!updated.environmentId,
							username: !!updated.username,
						});
						setCredentials(updated);
					}

					credentialsUpdatedRef.current = true;
				}, 0);
			}

			// Check if all prerequisites are satisfied
			// Per rightTOTP.md: Check token validity based on token type (worker or user)
			const tokenType = credentials.tokenType || 'worker';
			const isTokenValid =
				tokenType === 'worker' ? tokenStatus.isValid : !!credentials.userToken?.trim();
			const hasMinimumConfig =
				!!credentials.environmentId?.trim() &&
				!!credentials.username?.trim() &&
				!!credentials.deviceAuthenticationPolicyId?.trim() &&
				isTokenValid;

			// IMPORTANT: Always show Step 0 with new token type selector and user token support
			// Do NOT skip Step 0 - users need to see the new configuration screens
			// The new screens include:
			// - Token Type selector (Worker Token vs User Token)
			// - User Token input with "Login with PingOne" button
			// - Environment ID, Policy, Username fields
			// - Registration Flow Type selector
			//
			// Even if coming from config page with all prerequisites, we show Step 0
			// so users can configure token type and see the new UI
			if (false && isConfigured && nav.currentStep === 0 && hasMinimumConfig) {
				// Disabled: Always show Step 0 now
				setTimeout(() => {
					console.log(
						`${MODULE_TAG} Step 0 skip logic disabled - always showing new configuration screens`
					);
					// nav.goToStep(1);
				}, 0);
				// return null;
			}

			// If configured flag is true but we are missing env/user/policy,
			// stay on Step 0 so user can complete configuration
			if (isConfigured && !hasMinimumConfig) {
				console.log(
					`${MODULE_TAG} Configured flag is true but missing prerequisites, staying on Step 0`,
					{
						hasEnvironmentId: !!credentials.environmentId?.trim(),
						hasUsername: !!credentials.username?.trim(),
						hasPolicy: !!credentials.deviceAuthenticationPolicyId?.trim(),
					}
				);
			}

			return (
				<MobileConfigureStep
					{...props}
					registrationFlowType={registrationFlowType}
					setRegistrationFlowType={setRegistrationFlowType}
					adminDeviceStatus={adminDeviceStatus}
					setAdminDeviceStatus={setAdminDeviceStatus}
				/>
			);
		};
	}, [
		isConfigured,
		location,
		registrationFlowType,
		adminDeviceStatus,
		MODULE_TAG,
		setAdminDeviceStatus,
		setRegistrationFlowType,
	]);

	// Step 1: Device Selection/Registration (using controller)
	const renderStep1WithSelection = (props: MFAFlowBaseRenderProps) => {
		// Clear success state when navigating to step 1
		// Use the nav.currentStep from props to detect step changes
		const currentStep = props.nav.currentStep;
		if (currentStep === 1 && previousStepRef.current !== 1 && deviceRegisteredActive) {
			// Clear the state when we first enter step 1
			previousStepRef.current = 1;
			// Use setTimeout to avoid state updates during render
			setTimeout(() => {
				setDeviceRegisteredActive(null);
			}, 0);
		} else if (currentStep !== 1) {
			// Reset the ref when we leave step 1
			previousStepRef.current = currentStep;
		}

		return (
			<MobileDeviceSelectionStep
				controller={controller}
				deviceSelection={deviceSelection}
				setDeviceSelection={setDeviceSelection}
				updateOtpState={updateOtpState}
				isConfigured={isConfigured}
				{...props}
			/>
		);
	};

	// Auto-populate phone from PingOne user when entering step 2
	React.useEffect(() => {
		const trigger = pendingPhoneFetchTriggerRef.current;
		if (!trigger) return;

		// Clear the ref immediately to avoid re-triggering
		pendingPhoneFetchTriggerRef.current = null;

		const { step, username, environmentId } = trigger;
		if (!step2PropsRef.current) return;

		const props = step2PropsRef.current;
		const currentPhone = props.credentials.phoneNumber?.trim() || '';

		// Only fetch if we don't already have a phone number
		if (currentPhone) {
			return;
		}

		// Check if we've already attempted to fetch phone for this step/username combination
		const lastAttempt = phoneFetchAttemptedRef.current;
		if (lastAttempt && lastAttempt.step === step && lastAttempt.username === username) {
			return; // Already attempted for this step/username
		}

		// Mark that we're attempting to fetch
		phoneFetchAttemptedRef.current = { step, username };

		// Fetch user data from PingOne to get phone number
		const fetchUserPhone = async () => {
			try {
				const phoneNumber = await fetchPhoneFromPingOne(environmentId, username);

				if (phoneNumber && props.credentials.phoneNumber !== phoneNumber) {
					props.setCredentials((prev) => ({
						...prev,
						phoneNumber: phoneNumber,
					}));
				}
			} catch (error) {
				// Silently fail - user can manually enter phone number
				console.error(`${MODULE_TAG} Failed to fetch user phone from PingOne:`, error);
			}
		};

		fetchUserPhone();
	}, [MODULE_TAG]);

	// Close validation modal when verification completes
	// This is handled in renderStep4Validate, not here, to avoid accessing mfaState outside of render props

	// Step 2: Register Device (closure to capture adminDeviceStatus and registrationFlowType)
	// Ping Identity Logo Component
	const PingIdentityLogo: React.FC<{ size?: number }> = ({ size = 40 }) => (
		<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<div
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: size,
					height: size,
					borderRadius: '8px',
					background: '#E31837',
					boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
					marginRight: '12px',
				}}
			>
				<svg
					width={Math.round(size * 0.75)}
					height={Math.round(size * 0.75)}
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<path d="M12 2l7 3v5c0 5.25-3.5 9.75-7 11-3.5-1.25-7-5.75-7-11V5l7-3z" fill="#ffffff" />
					<path d="M12 5l4 1.7V10.5c0 3.2-2.1 6.1-4 7-1.9-.9-4-3.8-4-7V6.7L12 5z" fill="#E31837" />
				</svg>
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
				<span style={{ fontSize: '20px', fontWeight: '700', color: '#E31837', lineHeight: '1.2' }}>
					Ping
				</span>
				<span style={{ fontSize: '12px', fontWeight: '400', color: '#6b7280', lineHeight: '1.2' }}>
					Identity.
				</span>
			</div>
		</div>
	);

	// Draggable modal hooks
	const step2ModalDrag = useDraggableModal(showModal);
	const step4ModalDrag = useDraggableModal(showValidationModal);

	// Ref to store nav object for ESC key handler
	const navRef = React.useRef<ReturnType<typeof useStepNavigationV8> | null>(null);

	// Handle ESC key to close modals
	React.useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				if (showValidationModal) {
					setShowValidationModal(false);
					// Navigate back to previous step when closing validation modal
					if (navRef.current) {
						navRef.current.goToPrevious();
					}
				} else if (showModal) {
					setShowModal(false);
				}
			}
		};

		if (showModal || showValidationModal) {
			window.addEventListener('keydown', handleEscape);
			return () => window.removeEventListener('keydown', handleEscape);
		}
		return undefined;
	}, [showModal, showValidationModal, setShowModal, setShowValidationModal]);

	// Step 2: Register Device (using controller) - Now as a Modal
	// Use useCallback to capture adminDeviceStatus and registrationFlowType in closure
	const renderStep2Register = useCallback(
		(props: MFAFlowBaseRenderProps) => {
			const {
				credentials,
				setCredentials,
				mfaState,
				setMfaState,
				nav,
				setIsLoading,
				isLoading,
				setShowDeviceLimitModal,
				tokenStatus,
				setShowWorkerTokenModal,
			} = props;

			// Store step 2 props for useEffect to access
			step2PropsRef.current = props;

			// Auto-populate phone from PingOne when entering step 2 (for SMS and Voice device types)
			const isPhoneBasedDevice =
				credentials.deviceType === 'SMS' || credentials.deviceType === 'VOICE';
			if (
				nav.currentStep === 2 &&
				credentials.username?.trim() &&
				!credentials.phoneNumber?.trim() &&
				credentials.environmentId?.trim() &&
				isPhoneBasedDevice
			) {
				// Store trigger in ref to avoid setState during render - useEffect will pick it up
				pendingPhoneFetchTriggerRef.current = {
					step: nav.currentStep,
					username: credentials.username.trim(),
					environmentId: credentials.environmentId.trim(),
				};
			}

			// Reset deviceName to device type when entering registration step (Step 2)
			// ALWAYS reset to device type, regardless of previous value
			// Use ref to track if we've already done this for this step/deviceType combination
			// This avoids Rules of Hooks violation by not using useEffect inside render function
			if (nav.currentStep === 2 && credentials) {
				// Force deviceType to be SMS, VOICE, or EMAIL for SMS flow (ignore any stale values like FIDO2)
				const validDeviceType =
					credentials.deviceType === 'SMS' ||
					credentials.deviceType === 'EMAIL' ||
					credentials.deviceType === 'VOICE'
						? credentials.deviceType
						: 'SMS';

				const lastReset = step2DeviceNameResetRef.current;

				// Always reset when entering step 2, unless we've already reset for this exact step/deviceType
				if (
					!lastReset ||
					lastReset.step !== nav.currentStep ||
					lastReset.deviceType !== validDeviceType
				) {
					// Always reset device name to device type when entering registration step
					setTimeout(() => {
						setCredentials({
							...credentials,
							deviceType: validDeviceType, // Force correct device type
							deviceName: validDeviceType, // Always set device name to device type
						});
					}, 0);
					step2DeviceNameResetRef.current = {
						step: nav.currentStep,
						deviceType: validDeviceType,
					};
				}
			}

			// Ensure deviceType is set correctly - default to SMS for SMS flow, but allow EMAIL or VOICE if selected
			// This ensures the button text and validation match what the user selected
			const currentDeviceType =
				credentials.deviceType === 'SMS' ||
				credentials.deviceType === 'EMAIL' ||
				credentials.deviceType === 'VOICE'
					? credentials.deviceType
					: 'SMS';
			const isPhoneBased = currentDeviceType === 'SMS' || currentDeviceType === 'VOICE';

			// Get selected policy to check promptForNicknameOnPairing
			const selectedPolicy = props.deviceAuthPolicies?.find(
				(p) => p.id === credentials.deviceAuthenticationPolicyId
			);
			const shouldPromptForNickname = selectedPolicy?.promptForNicknameOnPairing === true;

			// Handle device registration
			const handleRegisterDevice = async () => {
				// Guardrail: Ensure all required credentials are present before registration
				const missingFields: string[] = [];
				if (!credentials.environmentId?.trim()) {
					missingFields.push('Environment ID');
				}
				if (!credentials.username?.trim()) {
					missingFields.push('Username');
				}
				if (!credentials.deviceAuthenticationPolicyId?.trim()) {
					missingFields.push('Device Authentication Policy');
				}
				// Per rightTOTP.md: Check token validity based on token type (worker or user)
				// CRITICAL: Use registrationFlowType if available (more reliable than credentials.tokenType)
				// Fall back to credentials.tokenType if registrationFlowType is not set
				const effectiveTokenType =
					registrationFlowType === 'admin'
						? 'worker'
						: registrationFlowType === 'user'
							? 'user'
							: credentials.tokenType || 'worker';
				const isTokenValid =
					effectiveTokenType === 'worker' ? tokenStatus.isValid : !!credentials.userToken?.trim();
				if (!isTokenValid) {
					missingFields.push(effectiveTokenType === 'worker' ? 'Worker Token' : 'User Token');
				}

				if (missingFields.length > 0) {
					nav.setValidationErrors([
						`Missing required configuration: ${missingFields.join(', ')}. Please complete Step 0 configuration.`,
					]);
					toastV8.error(`Cannot register device: ${missingFields.join(', ')} required`);
					return;
				}

				// Get the actual device type from credentials (most up-to-date value)
				// This ensures we validate based on what's actually selected in the dropdown
				const actualDeviceType =
					credentials.deviceType === 'SMS' ||
					credentials.deviceType === 'EMAIL' ||
					credentials.deviceType === 'VOICE'
						? credentials.deviceType
						: 'SMS';

				// Validate based on device type (use actualDeviceType to match what user selected)
				// Both SMS and VOICE use phone numbers
				if (actualDeviceType === 'SMS' || actualDeviceType === 'VOICE') {
					if (!credentials.phoneNumber?.trim()) {
						const errorMsg = 'Phone number is required. Please enter a valid phone number.';
						nav.setValidationErrors([errorMsg]);
						toastV8.error(errorMsg);
						return;
					}
					// Use phone validation utility to handle multiple formats
					const phoneValidation = validateAndNormalizePhone(
						credentials.phoneNumber,
						credentials.countryCode
					);
					if (!phoneValidation.isValid) {
						const errorMsg = phoneValidation.error || 'Invalid phone number format';
						nav.setValidationErrors([errorMsg]);
						toastV8.error(errorMsg);
						return;
					}
				} else if (actualDeviceType === 'EMAIL') {
					if (!credentials.email?.trim()) {
						const errorMsg = 'Email address is required. Please enter a valid email address.';
						nav.setValidationErrors([errorMsg]);
						toastV8.error(errorMsg);
						return;
					}
					if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
						const errorMsg = 'Please enter a valid email address format.';
						nav.setValidationErrors([errorMsg]);
						toastV8.error(errorMsg);
						return;
					}
				}
				// Get selected policy to check policy settings
				const selectedPolicy = props.deviceAuthPolicies?.find(
					(p) => p.id === credentials.deviceAuthenticationPolicyId
				);

				// Check if pairing is disabled in the policy
				if (selectedPolicy?.pairingDisabled === true) {
					nav.setValidationErrors([
						'Device pairing is disabled for the selected Device Authentication Policy. Please select a different policy or contact your administrator.',
					]);
					toastV8.error('Device pairing is disabled for this policy');
					return;
				}

				const shouldPromptForNickname = selectedPolicy?.promptForNicknameOnPairing === true;

				// Use the device name exactly as entered by the user, or default to device type if not prompted
				const userEnteredDeviceName = shouldPromptForNickname
					? credentials.deviceName?.trim()
					: currentDeviceType;
				if (shouldPromptForNickname && !userEnteredDeviceName) {
					nav.setValidationErrors([
						'Device name is required. Please enter a name for this device.',
					]);
					return;
				}

				setIsLoading(true);
				try {
					// For VOICE, use SMS controller (both use phone numbers)
					// For SMS/EMAIL, use the appropriate controller
					const controllerTypeForVoice = actualDeviceType === 'VOICE' ? 'SMS' : actualDeviceType;

					// Update controller device type if it changed
					if (controllerDeviceType !== controllerTypeForVoice) {
						setControllerDeviceType(controllerTypeForVoice);
					}

					// Get the correct controller for the device type (use SMS controller for VOICE)
					const correctController = MFAFlowControllerFactory.create({
						deviceType: controllerTypeForVoice,
					});

					// Use the device name exactly as entered by the user, and ensure deviceType is correct
					const registrationCredentials = {
						...credentials,
						deviceName: userEnteredDeviceName,
						deviceType: actualDeviceType, // Ensure deviceType matches what user selected (VOICE, SMS, or EMAIL)
					};
					// Determine device status based on selected flow type
					const deviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED' =
						registrationFlowType === 'admin' ? adminDeviceStatus : 'ACTIVATION_REQUIRED';

					// Store nickname for later update
					const deviceNickname = registrationCredentials.nickname;

					// CRITICAL: Ensure status is explicitly set
					if (registrationFlowType === 'admin' && deviceStatus !== adminDeviceStatus) {
						console.error(`${MODULE_TAG} ⚠️ STATUS MISMATCH:`, {
							'Expected (adminDeviceStatus)': adminDeviceStatus,
							'Calculated (deviceStatus)': deviceStatus,
							'Registration Flow Type': registrationFlowType,
						});
					}

					// Get device registration params from controller
					const deviceParams = correctController.getDeviceRegistrationParams(
						registrationCredentials,
						deviceStatus
					);

					// For VOICE, override the type to 'VOICE' in the API call
					// (We use SMS controller but need to send type: "VOICE" to the API)
					if (actualDeviceType === 'VOICE') {
						deviceParams.type = 'VOICE' as DeviceType;
					}

					const result = await correctController.registerDevice(
						registrationCredentials,
						deviceParams
					);

					// Update device nickname if provided
					if (result.deviceId && deviceNickname) {
						try {
							await MFAServiceV8.updateDeviceNickname(
								{
									environmentId: credentials.environmentId,
									username: credentials.username,
									deviceId: result.deviceId,
								},
								deviceNickname
							);
							console.log(`${MODULE_TAG} ✅ Device nickname updated successfully`);
						} catch (nicknameError) {
							console.warn(`${MODULE_TAG} ⚠️ Failed to update device nickname:`, nicknameError);
							// Don't fail the registration if nickname update fails
						}
					}

					// Use the actual status returned from the API, not the requested status
					const actualDeviceStatus = result.status || deviceStatus;

					// Per rightOTP.md: Extract device.activate URI from registration response
					// If device.activate URI exists, device requires activation
					// If missing, device is ACTIVE (double-check with status)
					const deviceActivateUri = (result as { deviceActivateUri?: string }).deviceActivateUri;

					// Update mfaState with device info - will be updated again in ACTIVATION_REQUIRED branch if needed
					setMfaState({
						...mfaState,
						deviceId: result.deviceId,
						deviceStatus: actualDeviceStatus,
						// Store device.activate URI per rightOTP.md
						...(deviceActivateUri ? { deviceActivateUri } : {}),
					});

					// Refresh device list
					const devices = await correctController.loadExistingDevices(
						registrationCredentials,
						tokenStatus
					);
					setDeviceSelection((prev) => ({
						...prev,
						existingDevices: devices,
					}));

					// Per rightOTP.md: Branch logic
					// A. If user selected "ACTIVE" OR B. If PingOne returned no device.activate URI AND status is ACTIVE
					// → Device is ACTIVE. Show success. No OTP required.
					// C. If status is ACTIVATION_REQUIRED
					// → PingOne automatically sends OTP when device is created with status: "ACTIVATION_REQUIRED"
					// → User must enter OTP to activate device (go directly to validation step)
					// Note: Admin Flow uses Worker Token and can choose ACTIVE or ACTIVATION_REQUIRED. User Flow uses User Token and always uses ACTIVATION_REQUIRED.
					const hasDeviceActivateUri = !!deviceActivateUri;

					// CRITICAL: Use the REQUESTED status (deviceStatus) as the primary source of truth
					// However, if PingOne returns ACTIVE and no deviceActivateUri, the device is already active
					// and we should NOT try to activate it (will cause 400 error)
					const requestedActivationRequired = deviceStatus === 'ACTIVATION_REQUIRED';
					const requestedActive = deviceStatus === 'ACTIVE';
					const apiConfirmedActive = actualDeviceStatus === 'ACTIVE' && !hasDeviceActivateUri;
					const apiReturnedActiveWithoutUri =
						actualDeviceStatus === 'ACTIVE' && !hasDeviceActivateUri;

					// If API returned ACTIVE without deviceActivateUri, device is already active - show success
					// Don't try to activate an already-active device (will cause 400 error)
					if (apiReturnedActiveWithoutUri) {
						// Device is already ACTIVE - show success screen
						nav.markStepComplete();
						const resultWithExtras = result as {
							deviceId: string;
							status: string;
							userId?: string;
							createdAt?: string;
							updatedAt?: string;
							environmentId?: string;
						};
						setDeviceRegisteredActive({
							deviceId: resultWithExtras.deviceId,
							deviceName: userEnteredDeviceName,
							deviceType: actualDeviceType,
							status: 'ACTIVE', // Device is already active
							username: registrationCredentials.username,
							...(resultWithExtras.userId ? { userId: resultWithExtras.userId } : {}),
							...(resultWithExtras.createdAt ? { createdAt: resultWithExtras.createdAt } : {}),
							...(resultWithExtras.updatedAt ? { updatedAt: resultWithExtras.updatedAt } : {}),
							environmentId:
								resultWithExtras.environmentId || registrationCredentials.environmentId,
						});
						setShowModal(false);
						const deviceTypeLabel =
							actualDeviceType === 'EMAIL'
								? 'Email'
								: actualDeviceType === 'VOICE'
									? 'Voice'
									: 'SMS';
						toastV8.success(
							`${deviceTypeLabel} device registered successfully! Device is ready to use (ACTIVE status).`
						);
					} else if (requestedActivationRequired) {
						// Device requires activation - PingOne automatically sends OTP when status is ACTIVATION_REQUIRED
						// This applies to both Admin Flow (with ACTIVATION_REQUIRED selected) and User Flow (always ACTIVATION_REQUIRED)
						// No need to manually call sendOTP - PingOne handles it automatically
						// Follow the same pattern for both flows: close modal, open validation modal, go to Step 4
						// Ensure device status is explicitly set to ACTIVATION_REQUIRED in mfaState before navigation
						// (mfaState was already updated above, but we want to ensure status is correct)
						setMfaState((prev) => ({
							...prev,
							deviceId: result.deviceId,
							deviceStatus: 'ACTIVATION_REQUIRED', // Explicitly set status
							...(deviceActivateUri ? { deviceActivateUri } : {}),
						}));

						// Clean up any OAuth callback parameters from URL to prevent redirect issues
						if (
							window.location.search.includes('code=') ||
							window.location.search.includes('state=')
						) {
							const cleanUrl = window.location.pathname;
							window.history.replaceState({}, document.title, cleanUrl);
						}

						// Set validation modal to open and mark step complete
						setShowValidationModal(true);
						nav.markStepComplete();

						// Close registration modal first, then navigate to Step 4
						// This ensures Step 2 returns null immediately and allows Step 4 to render
						setShowModal(false);

						// Navigate to Step 4 after a short delay to ensure state updates complete
						// This matches the pattern that works for admin flow
						setTimeout(() => {
							nav.goToStep(4); // Go directly to validation step (Step 4) - skip Send OTP step (Step 3)
						}, 100);

						const deviceTypeLabel2 =
							actualDeviceType === 'EMAIL'
								? 'Email'
								: actualDeviceType === 'VOICE'
									? 'Voice'
									: 'SMS';
						toastV8.success(
							`${deviceTypeLabel2} device registered! OTP has been sent automatically.`
						);
					} else if (requestedActive && (apiConfirmedActive || actualDeviceStatus === 'ACTIVE')) {
						// Admin flow: Device is ACTIVE, no OTP needed - show success screen
						// Use requested status (deviceStatus) as the source of truth, but also check API response
						const finalStatus = actualDeviceStatus === 'ACTIVE' ? 'ACTIVE' : deviceStatus;
						const resultWithExtras = result as {
							deviceId: string;
							status: string;
							userId?: string;
							createdAt?: string;
							updatedAt?: string;
							environmentId?: string;
						};
						console.log(
							`${MODULE_TAG} Device registered with ACTIVE status, showing success screen...`,
							{
								'Requested Status': deviceStatus,
								'API Status': actualDeviceStatus,
								'Final Status': finalStatus,
							}
						);
						nav.markStepComplete();
						// Store registration success state before closing modal
						// Use requested status if API didn't return status, otherwise use API status
						setDeviceRegisteredActive({
							deviceId: resultWithExtras.deviceId,
							deviceName: userEnteredDeviceName,
							deviceType: actualDeviceType,
							status: finalStatus, // Use requested status as primary, API status as fallback
							username: registrationCredentials.username,
							...(resultWithExtras.userId ? { userId: resultWithExtras.userId } : {}),
							...(resultWithExtras.createdAt ? { createdAt: resultWithExtras.createdAt } : {}),
							...(resultWithExtras.updatedAt ? { updatedAt: resultWithExtras.updatedAt } : {}),
							environmentId:
								resultWithExtras.environmentId || registrationCredentials.environmentId,
						});
						// Close the registration modal - success screen will be shown by renderStep2Register
						setShowModal(false);
						// Stay on step 2 to show success screen (don't navigate away)
						const deviceTypeLabel3 =
							actualDeviceType === 'EMAIL'
								? 'Email'
								: actualDeviceType === 'VOICE'
									? 'Voice'
									: 'SMS';
						toastV8.success(
							`${deviceTypeLabel3} device registered successfully! Device is ready to use (ACTIVE status).`
						);
					} else {
						// Fallback: If status is unclear or unexpected
						// This should not happen if status is being sent correctly
						console.error(`${MODULE_TAG} ⚠️ UNEXPECTED STATUS:`, {
							'Requested Status': deviceStatus,
							'Actual Status from API': actualDeviceStatus,
							'Has deviceActivateUri': hasDeviceActivateUri,
							'Registration Flow Type': registrationFlowType,
							'Admin Device Status': adminDeviceStatus,
							'Full Result': result,
						});

						// If we requested ACTIVATION_REQUIRED but got something else, treat as activation required
						// Follow the same pattern as the main ACTIVATION_REQUIRED branch
						// Type assertion needed because TypeScript can't narrow the type here
						if ((deviceStatus as string) === 'ACTIVATION_REQUIRED') {
							console.warn(
								`${MODULE_TAG} Requested ACTIVATION_REQUIRED but API returned ${actualDeviceStatus}, treating as ACTIVATION_REQUIRED`
							);
							// Set mfaState correctly
							setMfaState((prev) => ({
								...prev,
								deviceId: result.deviceId,
								deviceStatus: 'ACTIVATION_REQUIRED',
								...(deviceActivateUri ? { deviceActivateUri } : {}),
							}));
							setShowModal(false);
							setShowValidationModal(true);
							nav.markStepComplete();
							setTimeout(() => {
								nav.goToStep(4); // Go directly to validation step (Step 4) - skip Send OTP step (Step 3)
							}, 100);
							const deviceTypeLabel2 =
								actualDeviceType === 'EMAIL'
									? 'Email'
									: actualDeviceType === 'VOICE'
										? 'Voice'
										: 'SMS';
							toastV8.success(
								`${deviceTypeLabel2} device registered! OTP has been sent automatically.`
							);
						} else {
							// Unknown status - default to OTP flow to be safe
							console.warn(`${MODULE_TAG} Device status unclear, defaulting to OTP flow`);
							setShowModal(false);
							nav.markStepComplete();
							nav.goToStep(3);
							const deviceTypeLabel5 =
								actualDeviceType === 'EMAIL'
									? 'Email'
									: actualDeviceType === 'VOICE'
										? 'Voice'
										: 'SMS';
							toastV8.success(`${deviceTypeLabel5} device registered successfully!`);
						}
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					const isDeviceLimitError =
						errorMessage.toLowerCase().includes('exceed') ||
						errorMessage.toLowerCase().includes('limit') ||
						errorMessage.toLowerCase().includes('maximum');

					const isWorkerTokenError =
						errorMessage.includes('Worker token') ||
						errorMessage.includes('worker token') ||
						errorMessage.includes('token is not available') ||
						errorMessage.includes('token has expired');

					if (isDeviceLimitError) {
						setShowDeviceLimitModal(true);
						nav.setValidationErrors([`Device registration failed: ${errorMessage}`]);
						toastV8.error('Device limit exceeded. Please delete an existing device first.');
					} else if (isWorkerTokenError) {
						// Use helper to show worker token modal (respects silent API retrieval setting)
						const { handleShowWorkerTokenModal } = await import(
							'@/v8/utils/workerTokenModalHelperV8'
						);
						// Get current checkbox values from config
						const config = MFAConfigurationServiceV8.loadConfiguration();
						const silentApiRetrieval = config.workerToken.silentApiRetrieval || false;
						const showTokenAtEnd = config.workerToken.showTokenAtEnd !== false;
						// #region agent log - Use safe analytics fetch
						(async () => {
							try {
								const { safeAnalyticsFetch } = await import('@/v8/utils/analyticsServerCheckV8');
								await safeAnalyticsFetch({
									location: 'MobileFlowV8.tsx:1510',
									message: 'Calling handleShowWorkerTokenModal from error handler',
									data: { silentApiRetrieval, showTokenAtEnd },
									timestamp: Date.now(),
									sessionId: 'debug-session',
									runId: 'run1',
									hypothesisId: 'D',
								});
							} catch {
								// Silently ignore - analytics server not available
							}
						})();
						// #endregion
						await handleShowWorkerTokenModal(
							setShowWorkerTokenModal,
							undefined,
							silentApiRetrieval,
							showTokenAtEnd
						);
						nav.setValidationErrors([`Registration failed: ${errorMessage}`]);
						toastV8.error(`Registration failed: ${errorMessage}`);
					} else {
						nav.setValidationErrors([`Failed to register device: ${errorMessage}`]);
						toastV8.error(`Registration failed: ${errorMessage}`);
					}
				} finally {
					setIsLoading(false);
				}
			};

			// Use the currentDeviceType already declared above (line 938)
			const _isSMS = currentDeviceType === 'SMS';
			const isEMAIL = currentDeviceType === 'EMAIL';
			// isPhoneBased is already declared above (line 941)
			// Use phone validation utility for format checking
			const isValidPhone =
				credentials.phoneNumber?.trim() &&
				isValidPhoneFormat(credentials.phoneNumber, credentials.countryCode);
			const isValidEmail =
				credentials.email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email);
			const isValidForm = shouldPromptForNickname
				? credentials.deviceName?.trim() &&
					((isPhoneBased && isValidPhone) || (isEMAIL && isValidEmail))
				: (isPhoneBased && isValidPhone) || (isEMAIL && isValidEmail);

			// If device was just registered with ACTIVE status, show success page using unified service
			// Only show success page for ACTIVE devices - ACTIVATION_REQUIRED devices go to Step 4 (validation)
			if (deviceRegisteredActive && deviceRegisteredActive.status === 'ACTIVE' && !showModal) {
				// Build success data from deviceRegisteredActive using helper function
				const tempMfaState = {
					deviceId: deviceRegisteredActive.deviceId,
					deviceStatus: deviceRegisteredActive.status,
					nickname: deviceRegisteredActive.deviceName,
					userId: deviceRegisteredActive.userId,
					environmentId: deviceRegisteredActive.environmentId,
					createdAt: deviceRegisteredActive.createdAt,
					updatedAt: deviceRegisteredActive.updatedAt,
				} as MFAFlowBaseRenderProps['mfaState'];
				const successData = buildSuccessPageData(
					credentials,
					tempMfaState,
					registrationFlowType,
					adminDeviceStatus,
					credentials.tokenType
				);
				// Ensure deviceType is set for documentation button
				successData.deviceType = 'MOBILE' as DeviceType;
				return (
					<MFASuccessPageV8
						{...props}
						credentials={{ ...credentials, deviceType: 'MOBILE' as DeviceType }}
						successData={successData}
						onStartAgain={() => {
							setDeviceRegisteredActive(null);
							nav.goToStep(0);
						}}
					/>
				);
			}

			// If modal is closed but we have a successfully registered ACTIVE device, show success page using unified service
			// Only show success page for ACTIVE devices - ACTIVATION_REQUIRED devices go to Step 4 (validation)
			if (!showModal && deviceRegisteredActive && deviceRegisteredActive.status === 'ACTIVE') {
				// Build success data from deviceRegisteredActive using helper function
				const tempMfaState = {
					deviceId: deviceRegisteredActive.deviceId,
					deviceStatus: deviceRegisteredActive.status,
					nickname: deviceRegisteredActive.deviceName,
					userId: deviceRegisteredActive.userId,
					environmentId: deviceRegisteredActive.environmentId,
					createdAt: deviceRegisteredActive.createdAt,
					updatedAt: deviceRegisteredActive.updatedAt,
				} as MFAFlowBaseRenderProps['mfaState'];
				const successData = buildSuccessPageData(
					credentials,
					tempMfaState,
					registrationFlowType,
					adminDeviceStatus,
					credentials.tokenType
				);
				// Ensure deviceType is set for documentation button
				successData.deviceType = 'MOBILE' as DeviceType;
				return (
					<MFASuccessPageV8
						{...props}
						credentials={{ ...credentials, deviceType: 'MOBILE' as DeviceType }}
						successData={successData}
						onStartAgain={() => {
							setDeviceRegisteredActive(null);
							navigate('/v8/unified-mfa');
						}}
					/>
				);
			}

			// If we're on Step 4, don't render Step 2 content - let Step 4 handle rendering
			if (nav.currentStep === 4) {
				return null;
			}

			// Check if we're transitioning to Step 4 (OTP validation) - check this BEFORE checking if modal is closed
			// This ensures we return null immediately when transitioning, even if modal is still open
			// User flow always goes to Step 4 after registration (always ACTIVATION_REQUIRED)
			// Admin flow with ACTIVATION_REQUIRED also goes to Step 4
			const isTransitioningToStep4 =
				mfaState.deviceId &&
				(mfaState.deviceStatus === 'ACTIVATION_REQUIRED' ||
					showValidationModal ||
					(registrationFlowType === 'user' && mfaState.deviceId)); // User flow always goes to validation after registration
			if (isTransitioningToStep4) {
				// We're transitioning to Step 4 - don't render Step 2 content, let Step 4 render
				// Return null to allow Step 4 to render
				return null;
			}

			// If modal is closed and no success state, show "Start again" message
			if (!showModal && nav.currentStep !== 4) {
				return (
					<div
						style={{
							padding: '24px',
							background: 'white',
							borderRadius: '8px',
							boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
							maxWidth: '600px',
							margin: '0 auto',
							textAlign: 'center',
						}}
					>
						<p
							style={{
								fontSize: '16px',
								color: '#6b7280',
								margin: '0 0 20px 0',
							}}
						>
							Registration modal closed. Click below to start again.
						</p>
						<button
							type="button"
							onClick={() => {
								setShowModal(true);
								navigate('/v8/unified-mfa');
							}}
							style={{
								padding: '12px 20px',
								background: '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								fontSize: '15px',
								fontWeight: '600',
								cursor: 'pointer',
							}}
						>
							🔄 Start Again
						</button>
					</div>
				);
			}

			const hasPosition =
				step2ModalDrag.modalPosition.x !== 0 || step2ModalDrag.modalPosition.y !== 0;

			return (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'rgba(0, 0, 0, 0.5)',
						display: hasPosition ? 'block' : 'flex',
						alignItems: hasPosition ? 'normal' : 'flex-start',
						justifyContent: hasPosition ? 'normal' : 'center',
						paddingTop: hasPosition ? '0' : '5vh',
						paddingBottom: hasPosition ? '0' : '5vh',
						overflowY: 'auto',
						zIndex: 10000, // Ensure modal overlay is above API display (100 < 10000)
						pointerEvents: 'auto',
					}}
					onClick={() => {
						// Don't close on backdrop click - require explicit cancel
					}}
					onMouseDown={(e) => {
						// Prevent overlay from interfering with drag
						if (e.target === e.currentTarget) {
							e.preventDefault();
						}
					}}
				>
					<div
						ref={step2ModalDrag.modalRef}
						style={{
							background: 'white',
							borderRadius: '16px',
							padding: '0',
							maxWidth: '550px',
							width: '90%',
							maxHeight: '85vh',
							display: 'flex',
							flexDirection: 'column',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
							overflow: 'hidden',
							...step2ModalDrag.modalStyle,
							pointerEvents: 'auto',
							position:
								step2ModalDrag.modalPosition.x !== 0 || step2ModalDrag.modalPosition.y !== 0
									? 'fixed'
									: 'relative',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header with Logo - Draggable */}
						<div
							onMouseDown={(e) => {
								// Allow dragging from header, but prevent if clicking on close button
								if (!(e.target as HTMLElement).closest('button')) {
									step2ModalDrag.handleMouseDown(e);
								}
							}}
							style={{
								background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
								padding: '16px 20px 12px 20px',
								textAlign: 'center',
								position: 'relative',
								cursor: step2ModalDrag.isDragging ? 'grabbing' : 'grab',
								userSelect: 'none',
							}}
						>
							<button
								type="button"
								onMouseDown={(e) => {
									e.stopPropagation();
									e.preventDefault();
								}}
								onClick={(e) => {
									e.stopPropagation();
									setShowModal(false);
									nav.goToPrevious();
								}}
								style={{
									position: 'absolute',
									top: '16px',
									right: '16px',
									background: 'rgba(255, 255, 255, 0.2)',
									border: 'none',
									borderRadius: '50%',
									width: '32px',
									height: '32px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer',
									color: 'white',
									zIndex: 1,
								}}
							>
								<FiX size={18} />
							</button>
							<PingIdentityLogo size={36} />
							<h3
								style={{
									margin: '6px 0 0 0',
									fontSize: '18px',
									fontWeight: '600',
									color: 'white',
									textAlign: 'center',
								}}
							>
								Register MFA Device
							</h3>
							<p
								style={{
									margin: '4px 0 0 0',
									fontSize: '12px',
									color: 'rgba(255, 255, 255, 0.9)',
									textAlign: 'center',
								}}
							>
								Add a new device for multi-factor authentication
							</p>
						</div>

						{/* Modal Body */}
						<div
							style={{
								padding: '16px 20px',
								overflowY: 'auto',
								flex: 1,
								minHeight: 0,
								maxHeight: 'calc(85vh - 200px)', // Reserve space for header (~100px) and footer (~100px)
							}}
						>
							{/* Username Display */}
							<div
								style={{
									marginBottom: '12px',
									padding: '8px 12px',
									background: '#f3f4f6',
									borderRadius: '6px',
									border: '1px solid #e5e7eb',
								}}
							>
								<div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
									Username
								</div>
								<div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
									{credentials.username}
								</div>
							</div>

							{/* Device Type Selector */}
							<div style={{ marginBottom: '12px' }}>
								<label
									htmlFor="mfa-device-type-register"
									style={{
										display: 'block',
										fontSize: '13px',
										fontWeight: '600',
										color: '#374151',
										marginBottom: '6px',
									}}
								>
									Device Type <span style={{ color: '#ef4444' }}>*</span>
								</label>
								<select
									id="mfa-device-type-register"
									value={credentials.deviceType || 'SMS'}
									onChange={(e) => {
										const newDeviceType = e.target.value as DeviceType;
										const oldDeviceType = credentials.deviceType || 'SMS';

										// Update device name if:
										// 1. It's empty
										// 2. It matches the old device type (e.g., "SMS" when switching from SMS)
										// 3. It's exactly "SMS", "EMAIL", or "VOICE" (generic device type names)
										const currentDeviceName = credentials.deviceName?.trim() || '';
										const shouldUpdateDeviceName =
											!currentDeviceName ||
											currentDeviceName === oldDeviceType ||
											currentDeviceName === 'SMS' ||
											currentDeviceName === 'EMAIL' ||
											currentDeviceName === 'VOICE';

										// Determine the new device name
										const newDeviceName = shouldUpdateDeviceName
											? newDeviceType
											: credentials.deviceName;

										// Update credentials with new device type and clear appropriate fields
										setCredentials({
											...credentials,
											deviceType: newDeviceType,
											deviceName: newDeviceName,
											// Clear phone/email when switching types to avoid validation errors
											// Keep phone for SMS and VOICE (both use phone numbers)
											phoneNumber:
												newDeviceType === 'SMS' || newDeviceType === 'VOICE'
													? credentials.phoneNumber
													: '',
											email: newDeviceType === 'EMAIL' ? credentials.email : '',
										});
										// Update controller device type when user changes selection
										// Use SMS controller for VOICE (both use phone numbers)
										if (newDeviceType === 'SMS' || newDeviceType === 'EMAIL') {
											setControllerDeviceType(newDeviceType);
										} else if (newDeviceType === 'VOICE') {
											setControllerDeviceType('SMS'); // Use SMS controller for Voice
										}
									}}
									style={{
										padding: '12px 16px',
										border: '1px solid #d1d5db',
										borderRadius: '8px',
										fontSize: '15px',
										color: '#1f2937',
										background: 'white',
										width: '100%',
										cursor: 'pointer',
									}}
								>
									<option value="SMS">📱 SMS (Text Message)</option>
									<option value="VOICE">📞 Voice Call</option>
									<option value="EMAIL">📧 Email</option>
								</select>
								<small
									style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#6b7280' }}
								>
									Select the type of MFA device you want to register
								</small>
							</div>

							{/* Phone Number Field (for SMS and VOICE) */}
							{isPhoneBased && (
								<div style={{ marginBottom: '12px' }}>
									<label
										htmlFor="mfa-phone-register"
										style={{
											display: 'block',
											fontSize: '14px',
											fontWeight: '600',
											color: '#374151',
											marginBottom: '8px',
										}}
									>
										Phone Number <span style={{ color: '#ef4444' }}>*</span>
									</label>
									<div style={{ display: 'flex', gap: '0' }}>
										<CountryCodePickerV8
											value={credentials.countryCode}
											onChange={(code) => setCredentials({ ...credentials, countryCode: code })}
										/>
										<input
											id="mfa-phone-register"
											type="tel"
											value={credentials.phoneNumber || ''}
											onChange={(e) => {
												const cleaned = e.target.value.replace(/[^\d\s-]/g, '');
												setCredentials({ ...credentials, phoneNumber: cleaned });
											}}
											placeholder={credentials.countryCode === '+1' ? '5125201234' : '234567890'}
											style={{
												flex: 1,
												padding: '12px 16px',
												border: `1px solid ${
													credentials.phoneNumber
														? isValidPhone
															? '#10b981'
															: '#ef4444'
														: '#ef4444'
												}`,
												boxShadow:
													credentials.phoneNumber && isValidPhone
														? 'none'
														: '0 0 0 3px rgba(239, 68, 68, 0.25)',
												outline: 'none',
												borderRadius: '0 8px 8px 0',
												fontSize: '15px',
												fontFamily: 'monospace',
												color: '#1f2937',
												background: 'white',
											}}
										/>
									</div>
									<small
										style={{
											display: 'block',
											marginTop: '6px',
											fontSize: '12px',
											color: '#6b7280',
										}}
									>
										{credentials.countryCode === '+1'
											? 'US/Canada: Enter 10-digit number (area code + number)'
											: 'International: Enter phone number with country code'}
									</small>
									{credentials.phoneNumber && (
										<div
											style={{
												marginTop: '8px',
												padding: '8px 10px',
												background: '#fef3c7',
												border: '1px solid #fbbf24',
												borderRadius: '6px',
											}}
										>
											<div
												style={{
													fontSize: '11px',
													fontWeight: '600',
													color: '#92400e',
													marginBottom: '2px',
												}}
											>
												📋 Phone Number Preview:
											</div>
											<div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#1f2937' }}>
												<strong>Will send to:</strong> {getFullPhoneNumber(credentials)}
											</div>
										</div>
									)}
								</div>
							)}

							{/* Email Field (for EMAIL) */}
							{isEMAIL && (
								<div style={{ marginBottom: '24px' }}>
									<label
										htmlFor="mfa-email-register"
										style={{
											display: 'block',
											fontSize: '14px',
											fontWeight: '600',
											color: '#374151',
											marginBottom: '8px',
										}}
									>
										Email Address <span style={{ color: '#ef4444' }}>*</span>
									</label>
									<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
										<FiMail size={20} style={{ color: '#6b7280' }} />
										<input
											id="mfa-email-register"
											type="email"
											value={credentials.email || ''}
											onChange={(e) => {
												setCredentials({ ...credentials, email: e.target.value });
											}}
											placeholder="user@example.com"
											style={{
												flex: 1,
												padding: '12px 16px',
												border: `1px solid ${
													credentials.email?.trim()
														? isValidEmail
															? '#10b981'
															: '#ef4444'
														: '#d1d5db'
												}`,
												boxShadow:
													credentials.email?.trim() && isValidEmail
														? 'none'
														: '0 0 0 3px rgba(239, 68, 68, 0.25)',
												outline: 'none',
												borderRadius: '8px',
												fontSize: '15px',
												color: '#1f2937',
												background: 'white',
											}}
										/>
									</div>
									<small
										style={{
											display: 'block',
											marginTop: '4px',
											fontSize: '11px',
											color: '#6b7280',
										}}
									>
										Enter the email address where you'll receive verification codes
									</small>
									{credentials.email && isValidEmail && (
										<div
											style={{
												marginTop: '8px',
												padding: '8px 10px',
												background: '#fef3c7',
												border: '1px solid #fbbf24',
												borderRadius: '6px',
											}}
										>
											<div
												style={{
													fontSize: '11px',
													fontWeight: '600',
													color: '#92400e',
													marginBottom: '2px',
												}}
											>
												📧 Email Preview:
											</div>
											<div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#1f2937' }}>
												<strong>Will send to:</strong> {credentials.email}
											</div>
										</div>
									)}
								</div>
							)}

							{/* Device Name Field - Only show if promptForNicknameOnPairing is true */}
							{shouldPromptForNickname ? (
								<div style={{ marginBottom: '12px' }}>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											marginBottom: '6px',
										}}
									>
										<label
											htmlFor="mfa-device-name-register"
											style={{
												display: 'block',
												fontSize: '13px',
												fontWeight: '600',
												color: '#374151',
											}}
										>
											Device Name <span style={{ color: '#ef4444' }}>*</span>
										</label>
										<MFAInfoButtonV8 contentKey="device.nickname" displayMode="tooltip" />
									</div>
									<input
										id="mfa-device-name-register"
										type="text"
										value={credentials.deviceName || currentDeviceType || 'SMS'}
										onChange={(e) => {
											setCredentials({
												...credentials,
												deviceName: e.target.value,
												nickname: credentials.nickname || 'MyKnickName',
											});
										}}
										onFocus={(e) => {
											const currentName = credentials.deviceName?.trim() || '';
											if (
												!currentName ||
												currentName === currentDeviceType ||
												currentName === 'SMS' ||
												currentName === 'EMAIL' ||
												currentName === 'VOICE'
											) {
												e.target.select();
											}
											if (!credentials.deviceName) {
												e.target.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.25)';
											}
										}}
										onBlur={(e) => {
											if (!credentials.deviceName) {
												e.target.style.boxShadow = 'none';
											}
										}}
										placeholder={currentDeviceType || 'Device Name'}
										style={{
											padding: '12px 16px',
											border: `1px solid ${credentials.deviceName?.trim() ? '#10b981' : '#ef4444'}`,
											boxShadow: credentials.deviceName?.trim()
												? 'none'
												: '0 0 0 3px rgba(239, 68, 68, 0.25)',
											outline: 'none',
											borderRadius: '8px',
											fontSize: '15px',
											color: '#1f2937',
											background: 'white',
											width: '100%',
										}}
									/>
									<small
										style={{
											display: 'block',
											marginTop: '4px',
											fontSize: '11px',
											color: '#6b7280',
										}}
									>
										Enter a friendly name to identify this device (e.g., "My Work Phone", "Personal
										Email")
									</small>

									<div style={{ marginBottom: '16px', marginTop: '12px' }}>
										<label
											htmlFor="mfa-device-nickname-register"
											style={{
												display: 'block',
												marginBottom: '8px',
												color: '#374151',
												fontSize: '14px',
												fontWeight: '500',
											}}
										>
											Device Nickname (optional)
										</label>
										<input
											id="mfa-device-nickname-register"
											type="text"
											value={credentials.nickname || 'MyKnickName'}
											onChange={(e) => setCredentials({ ...credentials, nickname: e.target.value })}
											placeholder="MyKnickName"
											style={{
												padding: '12px 16px',
												border: '1px solid #d1d5db',
												outline: 'none',
												borderRadius: '8px',
												fontSize: '15px',
												color: '#1f2937',
												background: 'white',
												width: '100%',
											}}
										/>
										<small
											style={{
												display: 'block',
												marginTop: '4px',
												color: '#6b7280',
												fontSize: '12px',
											}}
										>
											Enter a friendly nickname for this device (e.g., "Personal Phone", "Work SMS")
											{credentials.nickname && (
												<span
													style={{
														marginLeft: '8px',
														color: '#10b981',
														fontWeight: '500',
													}}
												>
													✓ Nickname: "{credentials.nickname}"
												</span>
											)}
										</small>
									</div>
								</div>
							) : (
								<div
									style={{
										marginBottom: '12px',
										padding: '12px',
										background: '#f9fafb',
										border: '1px solid #e5e7eb',
										borderRadius: '8px',
									}}
								>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											marginBottom: '4px',
										}}
									>
										<span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
											Device Name
										</span>
										<MFAInfoButtonV8
											contentKey="policy.promptForNicknameOnPairing.explanation"
											displayMode="tooltip"
										/>
									</div>
									<p style={{ margin: 0, fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
										Device name will be set automatically during registration. Your policy's "Prompt
										for Nickname on Pairing" setting is disabled, so you cannot enter a custom
										nickname at this time. You can rename this device later through device
										management.
									</p>
								</div>
							)}

							{/* Enhanced Worker Token UI Service */}
							<WorkerTokenUIServiceV8
								mode="compact"
								showStatusDisplay={true}
								statusSize="small"
								showRefresh={false}
								environmentId={credentials.environmentId}
								context="mfa"
							/>

							{/* API Display Toggle */}
							<div
								style={{
									marginTop: '12px',
									marginBottom: '8px',
									padding: '10px 12px',
									background: '#f9fafb',
									border: '1px solid #e5e7eb',
									borderRadius: '6px',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
								}}
							>
								<input
									type="checkbox"
									id="api-display-toggle-modal"
									checked={isApiDisplayVisible}
									onChange={(e) => {
										if (e.target.checked) {
											apiDisplayServiceV8.show();
										} else {
											apiDisplayServiceV8.hide();
										}
									}}
									style={{
										width: '18px',
										height: '18px',
										cursor: 'pointer',
										accentColor: '#10b981',
									}}
								/>
								<label
									htmlFor="api-display-toggle-modal"
									style={{
										fontSize: '13px',
										color: '#374151',
										cursor: 'pointer',
										fontWeight: '500',
										display: 'flex',
										alignItems: 'center',
										gap: '6px',
										flex: 1,
									}}
								>
									<span>📡</span>
									<span>Show API Display</span>
								</label>
							</div>
						</div>

						{/* Action Buttons - Sticky Footer */}
						<div
							style={{
								display: 'flex',
								gap: '12px',
								padding: '16px 20px',
								background: 'white',
								borderTop: '1px solid #e5e7eb',
								flexShrink: 0,
							}}
						>
							<button
								type="button"
								onClick={() => {
									setShowModal(false);
									nav.goToPrevious();
								}}
								style={{
									flex: 1,
									padding: '12px 20px',
									background: '#f3f4f6',
									color: '#374151',
									border: '1px solid #d1d5db',
									borderRadius: '8px',
									fontSize: '15px',
									fontWeight: '600',
									cursor: 'pointer',
								}}
							>
								Cancel
							</button>
							<button
								type="button"
								disabled={isLoading || !isValidForm || !tokenStatus.isValid}
								onClick={handleRegisterDevice}
								style={{
									flex: 2,
									padding: '12px 20px',
									background:
										isValidForm && !isLoading && tokenStatus.isValid ? '#10b981' : '#d1d5db',
									color: 'white',
									border: 'none',
									borderRadius: '8px',
									fontSize: '15px',
									fontWeight: '600',
									cursor:
										isValidForm && !isLoading && tokenStatus.isValid ? 'pointer' : 'not-allowed',
									boxShadow:
										isValidForm && !isLoading && tokenStatus.isValid
											? '0 4px 12px rgba(16, 185, 129, 0.3)'
											: 'none',
									transition: 'all 0.2s ease',
								}}
								onMouseEnter={(e) => {
									if (isValidForm && !isLoading && tokenStatus.isValid) {
										e.currentTarget.style.background = '#059669';
										e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.4)';
									}
								}}
								onMouseLeave={(e) => {
									if (isValidForm && !isLoading && tokenStatus.isValid) {
										e.currentTarget.style.background = '#10b981';
										e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
									}
								}}
							>
								{isLoading ? (
									<>🔄 Registering...</>
								) : (
									<>Register {currentDeviceType === 'SMS' ? 'SMS' : 'Email'} Device →</>
								)}
							</button>
						</div>
					</div>
				</div>
			);
		},
		[
			registrationFlowType,
			adminDeviceStatus,
			controllerDeviceType,
			setDeviceSelection,
			setShowModal,
			showModal,
			deviceRegisteredActive,
			isApiDisplayVisible,
			MODULE_TAG,
			navigate,
			setDeviceRegisteredActive,
			setShowValidationModal,
			showValidationModal,
			step2ModalDrag.handleMouseDown,
			step2ModalDrag.isDragging,
			step2ModalDrag.modalPosition.x,
			step2ModalDrag.modalPosition.y,
			step2ModalDrag.modalRef,
			step2ModalDrag.modalStyle,
			PingIdentityLogo,
		]
	);

	// Step 3: Send OTP (using controller)
	const createRenderStep3 = () => {
		return (props: MFAFlowBaseRenderProps) => {
			const { credentials, mfaState, nav, setIsLoading, isLoading, tokenStatus } = props;
			// navigate is available from component level (line 451)

			const handleSendOTP = async () => {
				// Guardrail: Ensure required credentials before sending OTP
				if (
					!credentials.environmentId?.trim() ||
					!credentials.username?.trim() ||
					!tokenStatus.isValid
				) {
					nav.setValidationErrors([
						'Missing required configuration. Please ensure Environment ID, Username, and Worker Token are set.',
					]);
					toastV8.error('Cannot send OTP: Missing required configuration');
					return;
				}

				await controller.sendOTP(
					credentials,
					mfaState.deviceId,
					otpState,
					updateOtpState,
					nav,
					setIsLoading
				);
			};

			const handleViewDeviceAuthentication = () => {
				if (!mfaState.authenticationId) {
					return;
				}

				const params = new URLSearchParams({
					environmentId: credentials.environmentId?.trim() || '',
					authenticationId: mfaState.authenticationId,
				});

				if (credentials.deviceAuthenticationPolicyId?.trim()) {
					params.set('policyId', credentials.deviceAuthenticationPolicyId.trim());
				}

				if (credentials.username?.trim()) {
					params.set('username', credentials.username.trim());
				}

				if (mfaState.deviceId) {
					params.set('deviceId', mfaState.deviceId);
				}

				navigate(`/v8/mfa/device-authentication-details?${params.toString()}`, {
					state: { autoFetch: true },
				});
			};

			return (
				<div className="step-content">
					<h2>
						Send OTP Code
						<MFAInfoButtonV8 contentKey="factor.sms" displayMode="modal" />
					</h2>
					<p>Send a one-time password to the registered device</p>

					<div className="info-box">
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						<p>
							<strong>Phone Number:</strong> {getFullPhoneNumber(credentials)}
						</p>
						{otpState.sendRetryCount > 0 && (
							<p style={{ marginTop: '8px', fontSize: '13px', color: '#92400e' }}>
								⚠️ Attempt {otpState.sendRetryCount + 1} - If you continue to have issues, check your
								phone number and try again.
							</p>
						)}
					</div>

					{mfaState.authenticationId && (
						<div
							style={{
								marginTop: '16px',
								padding: '14px 16px',
								background: '#f0f9ff',
								border: '1px solid #bae6fd',
								borderRadius: '10px',
								display: 'flex',
								flexDirection: 'column',
								gap: '8px',
							}}
						>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									flexWrap: 'wrap',
									gap: '8px',
								}}
							>
								<div>
									<p style={{ margin: 0, fontSize: '14px', color: '#0c4a6e', fontWeight: 600 }}>
										Device Authentication ID
									</p>
									<p style={{ margin: '2px 0 0', fontFamily: 'monospace', color: '#1f2937' }}>
										{mfaState.authenticationId}
									</p>
								</div>
								<button
									type="button"
									onClick={handleViewDeviceAuthentication}
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '6px',
										padding: '8px 12px',
										borderRadius: '8px',
										border: '1px solid #3b82f6',
										background: '#ffffff',
										color: '#1d4ed8',
										fontWeight: 600,
										cursor: 'pointer',
									}}
								>
									<FiShield />
									View Session Details
								</button>
							</div>
							<p style={{ margin: 0, fontSize: '13px', color: '#0c4a6e' }}>
								Open the Device Authentication Details page to inspect the real-time status returned
								by PingOne after initialization.
							</p>
						</div>
					)}

					<div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
						<button
							type="button"
							className="btn btn-primary"
							onClick={handleSendOTP}
							disabled={isLoading}
						>
							{isLoading
								? '🔄 Sending...'
								: otpState.otpSent
									? '🔄 Resend OTP Code'
									: 'Send OTP Code'}
						</button>

						{otpState.otpSent && (
							<button
								type="button"
								className="btn"
								onClick={() => {
									updateOtpState({
										otpSent: false,
										sendRetryCount: 0,
										sendError: null,
									});
								}}
								style={{
									background: '#f3f4f6',
									color: '#374151',
									border: '1px solid #d1d5db',
								}}
							>
								Clear Status
							</button>
						)}
					</div>

					{otpState.sendError && (
						<div
							className="info-box"
							style={{
								background: '#fef2f2',
								border: '1px solid #fecaca',
								color: '#991b1b',
								marginTop: '8px',
							}}
						>
							<h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>⚠️ Error Sending OTP</h4>
							<p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{otpState.sendError}</p>
							<div style={{ marginTop: '12px', fontSize: '13px' }}>
								<strong>Recovery Options:</strong>
								<ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
									<li>Verify your phone number is correct</li>
									<li>Check that your worker token is valid</li>
									<li>Wait a few minutes and try again (rate limiting)</li>
									<li>Go back and select a different device</li>
								</ul>
							</div>
						</div>
					)}

					{otpState.otpSent && !otpState.sendError && (
						<div className="success-box" style={{ marginTop: '10px' }}>
							<h3>✅ OTP Sent</h3>
							<p>Check your phone for the verification code</p>
							<p style={{ marginTop: '12px', fontSize: '14px' }}>
								After receiving the code, proceed to the next step to validate it.
							</p>
							<p style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
								💡 <strong>Tip:</strong> OTP codes typically expire after 5-10 minutes. If you don't
								receive the code, click "Resend OTP Code" above.
							</p>
						</div>
					)}
				</div>
			);
		};
	};

	// Step 4: Validate OTP (using controller)
	const createRenderStep4 = () => {
		return (props: MFAFlowBaseRenderProps) => {
			const { credentials, mfaState, setMfaState, nav, setIsLoading, isLoading, tokenStatus } =
				props;

			// Store nav in ref for ESC key handler
			navRef.current = nav;

			// Helper function to update OTP state
			const _updateOtpState = (
				update: Partial<typeof otpState> | ((prev: typeof otpState) => typeof otpState)
			) => {
				setOtpState((prev) => {
					const patch = typeof update === 'function' ? update(prev) : update;
					return { ...prev, ...patch };
				});
			};

			// Close modal when verification is complete (handled in render, not useEffect)
			if (
				mfaState.verificationResult &&
				mfaState.verificationResult.status === 'COMPLETED' &&
				showValidationModal
			) {
				// Use setTimeout to avoid state updates during render
				setTimeout(() => {
					setShowValidationModal(false);
				}, 0);
			}

			// If validation is complete, show success screen using shared service
			// Close modal and show success page
			if (
				mfaState.verificationResult &&
				(mfaState.verificationResult.status === 'COMPLETED' ||
					mfaState.verificationResult.status === 'SUCCESS')
			) {
				// Don't set state during render - useEffect will handle closing the modal
				const successData = buildSuccessPageData(
					credentials,
					mfaState,
					registrationFlowType,
					adminDeviceStatus,
					credentials.tokenType
				);
				// Ensure deviceType is set for documentation button
				successData.deviceType = 'MOBILE' as DeviceType;
				return (
					<MFASuccessPageV8
						{...props}
						credentials={{ ...credentials, deviceType: 'MOBILE' as DeviceType }}
						successData={successData}
						onStartAgain={() => navigateToMfaHubWithCleanup(navigate)}
					/>
				);
			}

			// Only show validation modal for ACTIVATION_REQUIRED devices
			// If device is ACTIVE and we're on step 4, show success page instead of redirecting
			if (mfaState.deviceStatus === 'ACTIVE' && nav.currentStep === 4) {
				// Device is already active, show success page
				// Check if we have deviceRegisteredActive (just registered) or verificationResult (just activated)
				if (deviceRegisteredActive || mfaState.verificationResult) {
					const successData = buildSuccessPageData(
						credentials,
						mfaState,
						registrationFlowType,
						adminDeviceStatus,
						credentials.tokenType
					);
					return (
						<MFASuccessPageV8
							{...props}
							successData={successData}
							onStartAgain={() => navigateToMfaHubWithCleanup(navigate)}
						/>
					);
				}
				// If no success state, device was already active - navigate back to device selection
				setTimeout(() => {
					nav.goToStep(1);
				}, 0);
				return (
					<div className="step-content">
						<div className="success-box">
							<h3>✅ Device Ready</h3>
							<p>Your device is already active and ready to use. No OTP validation is required.</p>
							<p>
								<strong>Device ID:</strong> {mfaState.deviceId}
							</p>
							<p>
								<strong>Status:</strong> {mfaState.deviceStatus}
							</p>
						</div>
					</div>
				);
			}

			// Show validation UI as modal - always show when on step 4 (unless validation is complete)
			// If modal is closed but we're on step 4, automatically reopen it
			if (!showValidationModal && nav.currentStep === 4) {
				// Use setTimeout to avoid state updates during render
				setTimeout(() => {
					setShowValidationModal(true);
				}, 0);
			}

			// If modal is closed but we're on step 4, show a message
			if (!showValidationModal) {
				return (
					<div
						style={{
							padding: '24px',
							background: 'white',
							borderRadius: '8px',
							boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
							maxWidth: '600px',
							margin: '0 auto',
							textAlign: 'center',
						}}
					>
						<p
							style={{
								fontSize: '16px',
								color: '#6b7280',
								margin: '0 0 20px 0',
							}}
						>
							OTP validation modal closed. Click below to reopen.
						</p>
						<button
							type="button"
							onClick={() => {
								setShowValidationModal(true);
							}}
							style={{
								padding: '12px 20px',
								background: '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								fontSize: '15px',
								fontWeight: '600',
								cursor: 'pointer',
							}}
						>
							Open OTP Validation
						</button>
					</div>
				);
			}

			const hasPosition =
				step4ModalDrag.modalPosition.x !== 0 || step4ModalDrag.modalPosition.y !== 0;

			return (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'rgba(0, 0, 0, 0.5)',
						display: hasPosition ? 'block' : 'flex',
						alignItems: hasPosition ? 'normal' : 'center',
						justifyContent: hasPosition ? 'normal' : 'center',
						zIndex: 1000,
					}}
					onClick={() => {
						// Don't close on backdrop click - require explicit action
					}}
				>
					<div
						ref={step4ModalDrag.modalRef}
						style={{
							background: 'white',
							borderRadius: '16px',
							padding: '0',
							maxWidth: '550px',
							width: '90%',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
							overflow: 'hidden',
							...step4ModalDrag.modalStyle,
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header with Logo */}
						<div
							onMouseDown={step4ModalDrag.handleMouseDown}
							style={{
								background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
								padding: '16px 20px 12px 20px',
								textAlign: 'center',
								position: 'relative',
								cursor: 'grab',
								userSelect: 'none',
							}}
						>
							<button
								type="button"
								onMouseDown={(e) => e.stopPropagation()}
								onClick={() => {
									setShowValidationModal(false);
									nav.goToPrevious();
								}}
								style={{
									position: 'absolute',
									top: '16px',
									right: '16px',
									background: 'rgba(255, 255, 255, 0.2)',
									border: 'none',
									borderRadius: '50%',
									width: '32px',
									height: '32px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer',
									color: 'white',
								}}
							>
								<FiX size={18} />
							</button>
							<PingIdentityLogo size={36} />
							<h3
								style={{
									margin: '6px 0 0 0',
									fontSize: '18px',
									fontWeight: '600',
									color: 'white',
									textAlign: 'center',
								}}
							>
								Validate OTP Code
							</h3>
							<p
								style={{
									margin: '4px 0 0 0',
									fontSize: '12px',
									color: 'rgba(255, 255, 255, 0.9)',
									textAlign: 'center',
								}}
							>
								{credentials.deviceType === 'VOICE'
									? 'Enter the verification code from your voice call'
									: credentials.deviceType === 'EMAIL'
										? 'Enter the verification code sent to your email'
										: 'Enter the verification code sent to your phone'}
							</p>
						</div>

						{/* Modal Body */}
						<div style={{ padding: '16px 20px' }}>
							{/* Device Info */}
							<div
								style={{
									marginBottom: '16px',
									padding: '10px 12px',
									background: '#eff6ff',
									border: '1px solid #bfdbfe',
									borderRadius: '6px',
								}}
							>
								<p
									style={{
										margin: '0 0 4px 0',
										fontSize: '12px',
										color: '#1e40af',
										fontWeight: '600',
									}}
								>
									Device ID:
								</p>
								<p
									style={{
										margin: '0 0 8px 0',
										fontSize: '11px',
										fontFamily: 'monospace',
										color: '#1f2937',
										wordBreak: 'break-all',
									}}
								>
									{mfaState.deviceId}
								</p>
								{credentials.deviceType === 'EMAIL' ? (
									<>
										<p
											style={{
												margin: '0 0 4px 0',
												fontSize: '12px',
												color: '#1e40af',
												fontWeight: '600',
											}}
										>
											Email Address:
										</p>
										<p
											style={{
												margin: '0',
												fontSize: '11px',
												fontFamily: 'monospace',
												color: '#1f2937',
											}}
										>
											{credentials.email}
										</p>
									</>
								) : (
									<>
										<p
											style={{
												margin: '0 0 4px 0',
												fontSize: '12px',
												color: '#1e40af',
												fontWeight: '600',
											}}
										>
											{credentials.deviceType === 'VOICE'
												? 'Phone Number (Voice Call):'
												: 'Phone Number:'}
										</p>
										<p
											style={{
												margin: '0',
												fontSize: '11px',
												fontFamily: 'monospace',
												color: '#1f2937',
											}}
										>
											{getFullPhoneNumber(credentials)}
										</p>
									</>
								)}
							</div>

							{/* OTP Input */}
							<div style={{ marginBottom: '16px' }}>
								<label
									style={{
										display: 'block',
										fontSize: '13px',
										fontWeight: '600',
										color: '#374151',
										marginBottom: '8px',
									}}
								>
									OTP Code <span style={{ color: '#ef4444' }}>*</span>
									<MFAInfoButtonV8 contentKey="otp.validation" displayMode="modal" />
								</label>
								<MFAOTPInput
									value={mfaState.otpCode}
									onChange={(value) => setMfaState({ ...mfaState, otpCode: value })}
									disabled={isLoading}
									placeholder="123456"
								/>
							</div>

							{/* Action Buttons */}
							<div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
								<button
									type="button"
									disabled={isLoading || mfaState.otpCode.length !== 6}
									onClick={async () => {
										// Guardrail: Ensure required credentials before validating OTP
										if (
											!credentials.environmentId?.trim() ||
											!credentials.username?.trim() ||
											!tokenStatus.isValid
										) {
											nav.setValidationErrors([
												'Missing required configuration. Please ensure Environment ID, Username, and Worker Token are set.',
											]);
											toastV8.error('Cannot validate OTP: Missing required configuration');
											return;
										}

										// Per rightOTP.md: Use device.activate URI for device activation during registration
										// For ACTIVATION_REQUIRED devices, always use activateDevice (even if URI not in state)
										// If deviceActivateUri exists, use it; otherwise construct it or let service handle it
										const isActivationRequired = mfaState.deviceStatus === 'ACTIVATION_REQUIRED';

										// For ACTIVATION_REQUIRED devices, always use activateDevice
										// For other cases, use activateDevice if URI is available, otherwise use validateOTP
										if (isActivationRequired || mfaState.deviceActivateUri) {
											// Device activation flow (registration)
											setIsLoading(true);
											try {
												// Construct deviceActivateUri if not provided but we have the necessary info
												const deviceActivateUri = mfaState.deviceActivateUri;
												if (
													!deviceActivateUri &&
													isActivationRequired &&
													mfaState.deviceId &&
													credentials.environmentId
												) {
													// Construct the URI: POST /environments/{envID}/users/{userID}/devices/{deviceID}
													// We'll let the service handle user lookup and URI construction
													console.log(
														`${MODULE_TAG} deviceActivateUri not in state, will let service construct it`
													);
												}

												const activationParams: {
													environmentId: string;
													username: string;
													deviceId: string;
													otp: string;
													deviceActivateUri?: string;
												} = {
													environmentId: credentials.environmentId,
													username: credentials.username,
													deviceId: mfaState.deviceId,
													otp: mfaState.otpCode,
												};
												if (deviceActivateUri) {
													activationParams.deviceActivateUri = deviceActivateUri;
												}

												const activationResult =
													await MFAServiceV8.activateDevice(activationParams);

												// Update device status
												setMfaState((prev) => ({
													...prev,
													deviceStatus: (activationResult.status as string) || 'ACTIVE',
													verificationResult: {
														status: 'COMPLETED',
														message: 'Device activated successfully',
													},
												}));

												nav.markStepComplete();
												nav.goToStep(4); // Ensure we're on step 4 to show success page
												toastV8.success('Device activated successfully!');
											} catch (error) {
												const errorMessage =
													error instanceof Error ? error.message : 'Unknown error';
												console.error(`${MODULE_TAG} Failed to activate device:`, error);
												updateValidationState({
													validationAttempts: validationState.validationAttempts + 1,
													lastValidationError: errorMessage,
												});
												nav.setValidationErrors([`Activation failed: ${errorMessage}`]);
												toastV8.error(`Activation failed: ${errorMessage}`);
											} finally {
												setIsLoading(false);
											}
										} else {
											// Device authentication flow (runtime MFA)
											const isValid = await controller.validateOTP(
												credentials,
												mfaState.deviceId,
												mfaState.otpCode,
												mfaState,
												setMfaState,
												validationState,
												updateValidationState,
												nav,
												setIsLoading
											);

											// If validation succeeded, ensure we navigate to step 4 and show success
											if (isValid) {
												// Controller already navigates to step 4, but ensure verificationResult is set correctly
												setMfaState((prev) => ({
													...prev,
													verificationResult: {
														status: 'COMPLETED',
														message: 'OTP validated successfully',
													},
												}));
											}
										}
									}}
									style={{
										flex: 1,
										padding: '12px 20px',
										background: isLoading || mfaState.otpCode.length !== 6 ? '#d1d5db' : '#3b82f6',
										color: 'white',
										border: 'none',
										borderRadius: '8px',
										fontSize: '14px',
										fontWeight: '600',
										cursor: isLoading || mfaState.otpCode.length !== 6 ? 'not-allowed' : 'pointer',
										transition: 'all 0.2s ease',
									}}
								>
									{isLoading ? '🔄 Validating...' : 'Validate OTP'}
								</button>

								<button
									type="button"
									disabled={isLoading || !otpState.canResend}
									onClick={async () => {
										setIsLoading(true);
										// Start cooldown timer (60 seconds)
										updateOtpState({ canResend: false, resendCooldown: 60 });
										try {
											// For authentication flow (when authenticationId exists), use selectDeviceForAuthentication
											if (mfaState.authenticationId && mfaState.deviceId) {
												const { MfaAuthenticationServiceV8 } = await import(
													'@/v8/services/mfaAuthenticationServiceV8'
												);
												const { MFAServiceV8 } = await import('@/v8/services/mfaServiceV8');

												// Get userId if not already available
												let userId = mfaState.userId;
												if (!userId) {
													const user = await MFAServiceV8.lookupUserByUsername(
														credentials.environmentId,
														credentials.username
													);
													userId = user.id as string;
												}

												// Resend OTP for ACTIVE device using cancel + re-initialize or re-select
												await MfaAuthenticationServiceV8.resendOTPForActiveDevice({
													environmentId: credentials.environmentId,
													username: credentials.username,
													userId,
													authenticationId: mfaState.authenticationId,
													deviceId: mfaState.deviceId,
													region: credentials.region,
													customDomain: credentials.customDomain,
												});
												toastV8.success('OTP code resent successfully!');
											}
											// For registration flow with ACTIVATION_REQUIRED devices, use resendPairingCode
											else if (
												mfaState.deviceStatus === 'ACTIVATION_REQUIRED' &&
												mfaState.deviceId
											) {
												await MFAServiceV8.resendPairingCode({
													environmentId: credentials.environmentId,
													username: credentials.username,
													deviceId: mfaState.deviceId,
													region: credentials.region,
													customDomain: credentials.customDomain,
												});
												toastV8.success('OTP code resent successfully!');
											}
											// For registration flow with ACTIVE devices, re-initialize device authentication
											else if (mfaState.deviceId) {
												const authResult = await controller.initializeDeviceAuthentication(
													credentials,
													mfaState.deviceId
												);
												setMfaState((prev) => ({
													...prev,
													authenticationId: authResult.authenticationId,
													deviceAuthId: authResult.authenticationId,
													nextStep: authResult.nextStep ?? authResult.status,
												}));
												toastV8.success('OTP code resent successfully!');
											} else {
												throw new Error('Device ID is required to resend OTP');
											}
										} catch (error) {
											const errorMessage = error instanceof Error ? error.message : 'Unknown error';
											toastV8.error(`Failed to resend OTP: ${errorMessage}`);
										} finally {
											setIsLoading(false);
										}
									}}
									style={{
										flex: 1,
										padding: '12px 20px',
										background: '#f3f4f6',
										color: '#374151',
										border: '1px solid #d1d5db',
										borderRadius: '8px',
										fontSize: '14px',
										fontWeight: '600',
										cursor: isLoading || !otpState.canResend ? 'not-allowed' : 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '6px',
									}}
								>
									<span>🔄</span>
									<span>
										{isLoading
											? 'Sending...'
											: otpState.canResend
												? 'Resend OTP Code'
												: `Resend in ${otpState.resendCooldown}s`}
									</span>
								</button>
							</div>

							{/* Validation Error Messages */}
							{validationState.validationAttempts > 0 && (
								<div
									style={{
										marginTop: '12px',
										padding: '10px 12px',
										background: validationState.validationAttempts >= 3 ? '#fef2f2' : '#fffbeb',
										border: `1px solid ${validationState.validationAttempts >= 3 ? '#fecaca' : '#fed7aa'}`,
										borderRadius: '6px',
									}}
								>
									<p
										style={{
											margin: '0 0 4px 0',
											fontSize: '12px',
											fontWeight: '600',
											color: validationState.validationAttempts >= 3 ? '#991b1b' : '#92400e',
										}}
									>
										{validationState.validationAttempts >= 3
											? '⚠️ Multiple Failed Attempts'
											: '⚠️ Validation Failed'}
									</p>
									<p
										style={{
											margin: '0',
											fontSize: '11px',
											color: validationState.validationAttempts >= 3 ? '#991b1b' : '#92400e',
										}}
									>
										{validationState.lastValidationError || 'Invalid OTP code entered'}
									</p>
									{validationState.validationAttempts >= 3 && (
										<div style={{ marginTop: '8px', fontSize: '11px', color: '#991b1b' }}>
											<strong>Recovery Options:</strong>
											<ul style={{ margin: '4px 0 0 16px', padding: 0, lineHeight: '1.5' }}>
												<li>Click "Resend OTP Code" to get a fresh code</li>
												<li>Verify you're entering the code from the most recent SMS</li>
												<li>Check that the code hasn't expired (typically 5-10 minutes)</li>
											</ul>
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			);
		};
	};

	// Validation function for Step 0 (using controller)
	const validateStep0 = (
		credentials: MFACredentials,
		tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>,
		nav: ReturnType<typeof useStepNavigationV8>
	): boolean => {
		return controller.validateCredentials(credentials, tokenStatus, nav);
	};

	// apiDisplayHeight is already provided by useUnifiedOTPFlow hook

	// Show loading state while checking credentials - use a small modal instead of full screen
	if (isCheckingCredentials) {
		return (
			<>
				<div
					style={{
						minHeight: '100vh',
						background: '#f9fafb',
					}}
				>
					{/* Empty background - flow will render below */}
				</div>
				{/* Small loading modal */}
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						background: 'rgba(0, 0, 0, 0.3)',
						zIndex: 9999,
					}}
				>
					<div
						style={{
							background: 'white',
							borderRadius: '8px',
							padding: '16px 20px',
							boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
							minWidth: '160px',
							textAlign: 'center',
						}}
					>
						{/* Spinner */}
						<div
							style={{
								width: '24px',
								height: '24px',
								border: '3px solid #e5e7eb',
								borderTop: '3px solid #3b82f6',
								borderRadius: '50%',
								animation: 'spin 1s linear infinite',
								margin: '0 auto 12px',
							}}
						/>
						<div style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>Loading...</div>
					</div>
				</div>
				<style>{`
					@keyframes spin {
						0% { transform: rotate(0deg); }
						100% { transform: rotate(360deg); }
					}
				`}</style>
			</>
		);
	}

	return (
		<div
			style={{
				minHeight: '100vh',
				paddingBottom:
					isApiDisplayVisible && apiDisplayHeight > 0 ? `${apiDisplayHeight + 60}px` : '0',
				transition: 'padding-bottom 0.3s ease',
				overflow: 'visible',
			}}
		>
			<MFAFlowBaseV8
				deviceType="MOBILE"
				renderStep0={renderStep0}
				renderStep1={renderStep1WithSelection}
				renderStep2={renderStep2Register}
				renderStep3={createRenderStep3()}
				renderStep4={createRenderStep4()}
				validateStep0={validateStep0}
				stepLabels={['Configure', 'Select Device', 'Register Device', 'Send OTP', 'Validate']}
				shouldHideNextButton={(props) => {
					// Hide Next button on step 2 when showing success page for ACTIVE devices
					if (
						props.nav.currentStep === 2 &&
						deviceRegisteredActive &&
						deviceRegisteredActive.status === 'ACTIVE'
					) {
						return true;
					}
					// Hide final button on success step (step 4) - we have our own "Start Again" button
					if (props.nav.currentStep === 4) {
						return true;
					}
					return false;
				}}
			/>

			<SuperSimpleApiDisplayV8 flowFilter="mfa" />
		</div>
	);
};

// Main Mobile Flow Component
export const MobileFlowV8: React.FC = () => {
	return <MobileFlowV8WithDeviceSelection />;
};
