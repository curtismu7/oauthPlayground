/**
 * @file SMSFlowV8.tsx
 * @module v8/flows/types
 * @description SMS-specific MFA flow component (Refactored with Controller Pattern)
 * @version 8.2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CountryCodePickerV8 } from '@/v8/components/CountryCodePickerV8';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { MFAFlowBaseV8, type MFAFlowBaseRenderProps } from '../shared/MFAFlowBaseV8';
import type { DeviceType, MFACredentials } from '../shared/MFATypes';
import { getFullPhoneNumber } from '../controllers/SMSFlowController';
import { MFAFlowControllerFactory } from '../factories/MFAFlowControllerFactory';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { MFADeviceSelector, type Device } from '../components/MFADeviceSelector';
import { MFAOTPInput } from '../components/MFAOTPInput';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { FiShield, FiX, FiMail } from 'react-icons/fi';
import { MFAConfigurationStepV8 } from '../shared/MFAConfigurationStepV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { validateAndNormalizePhone, isValidPhoneFormat } from '@/v8/utils/phoneValidationV8';
import { useUnifiedOTPFlow } from '../shared/useUnifiedOTPFlow';
import { MFASuccessPageV8, buildSuccessPageData, getSuccessPageStep, type MFASuccessPageData } from '../shared/mfaSuccessPageServiceV8';

const MODULE_TAG = '[📱 SMS-FLOW-V8]';

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

const SMSDeviceSelectionStep: React.FC<DeviceSelectionStepProps & { isConfigured?: boolean }> = ({
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
	]);

	const authenticateExistingDevice = async (deviceId: string) => {
		setIsLoading(true);
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
					updateOtpState({ otpSent: nextStep === 'OTP_REQUIRED', sendRetryCount: 0, sendError: null });
					nav.markStepComplete();
					nav.goToStep(3);
					toastV8.success('Device selected for authentication. Follow the next step to continue.');
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			console.error(`${MODULE_TAG} Failed to initialize authentication:`, error);
			nav.setValidationErrors([`Failed to authenticate: ${message}`]);
			toastV8.error(`Authentication failed: ${message}`);
			updateOtpState({ otpSent: false });
		} finally {
			setIsLoading(false);
		}
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
				deviceType="SMS"
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
				<div className="success-box" style={{ marginTop: '10px' }}>
					<h3>✅ Device Ready</h3>
					<p>
						<strong>Device ID:</strong> {mfaState.deviceId}
					</p>
					<p>
						<strong>Status:</strong> {mfaState.deviceStatus}
					</p>
				</div>
			)}
		</div>
	);
};

interface SMSConfigureStepProps extends MFAFlowBaseRenderProps {
	registrationFlowType?: 'admin' | 'user';
	setRegistrationFlowType?: (type: 'admin' | 'user') => void;
	adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
	setAdminDeviceStatus?: (status: 'ACTIVE' | 'ACTIVATION_REQUIRED') => void;
}

const SMSConfigureStep: React.FC<SMSConfigureStepProps> = (props) => {
	const { registrationFlowType = 'user', setRegistrationFlowType, adminDeviceStatus = 'ACTIVE', setAdminDeviceStatus } = props;
	const currentDeviceType = (props.credentials.deviceType === 'SMS' || props.credentials.deviceType === 'EMAIL') 
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
			console.log(`${MODULE_TAG} Registration Flow Type changed to 'admin' - syncing tokenType dropdown`);
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
	}, [registrationFlowType, props.credentials.tokenType, props.credentials.userToken, props.showUserLoginModal, props.setCredentials, props.setShowUserLoginModal]);

	// When tokenType dropdown changes, sync to Registration Flow Type
	React.useEffect(() => {
		// Skip if we're in the middle of syncing from the other direction
		if (isSyncingRef.current) return;
		
		// Admin Flow uses Worker Token, User Flow uses User Token
		// Sync when switching between flows
		if (props.credentials.tokenType === 'worker' && registrationFlowType === 'user') {
			// User changed dropdown to "Worker Token" but User Flow is selected - this is invalid
			// User Flow must use User Token, so we should switch to Admin Flow
			console.log(`${MODULE_TAG} Token type is 'worker' but User Flow is selected - switching to Admin Flow`);
			setRegistrationFlowType('admin');
			return;
		} else if (props.credentials.tokenType === 'user' && registrationFlowType === 'admin') {
			// User changed dropdown to "User Token" but Admin Flow is selected - switch to User Flow
			console.log(`${MODULE_TAG} Token type is 'user' but Admin Flow is selected - switching to User Flow`);
			setRegistrationFlowType('user');
			return;
		} else if (props.credentials.tokenType === 'worker' && registrationFlowType !== 'admin') {
			// User changed dropdown to "Worker Token" - sync to Registration Flow Type
			console.log(`${MODULE_TAG} Token type dropdown changed to 'worker' - syncing Registration Flow Type`);
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
			<div style={{ 
				marginBottom: '28px',
				padding: '20px',
				background: '#ffffff',
				borderRadius: '8px',
				border: '1px solid #e5e7eb',
				boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
			}}>
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
						<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
							<input
								type="radio"
								name="registration-flow-type"
								value="admin"
								checked={registrationFlowType === 'admin'}
								onChange={() => setRegistrationFlowType?.('admin')}
								style={{ margin: 0, cursor: 'pointer', width: '18px', height: '18px' }}
							/>
							<div style={{ flex: 1 }}>
								<span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>Admin Flow</span>
								<div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', fontStyle: 'italic' }}>
									Using worker token
								</div>
							</div>
						</div>
						{/* Always show device status options for Admin Flow, even when not selected */}
						<div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
							<div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
										style={{ margin: 0, cursor: registrationFlowType === 'admin' ? 'pointer' : 'not-allowed', width: '16px', height: '16px' }}
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
										style={{ margin: 0, cursor: registrationFlowType === 'admin' ? 'pointer' : 'not-allowed', width: '16px', height: '16px' }}
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
						<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
							<input
								type="radio"
								name="registration-flow-type"
								value="user"
								checked={registrationFlowType === 'user'}
								onChange={() => setRegistrationFlowType?.('user')}
								style={{ margin: 0, cursor: 'pointer', width: '18px', height: '18px' }}
							/>
							<div style={{ flex: 1 }}>
								<span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>User Flow</span>
								<div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', fontStyle: 'italic' }}>
									Using access token from User Authentication
								</div>
							</div>
						</div>
						<div style={{ fontSize: '13px', color: '#6b7280', marginLeft: '28px', lineHeight: '1.5', padding: '8px 12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
							<strong style={{ color: '#f59e0b' }}>ACTIVATION_REQUIRED</strong> - OTP will be sent for device activation
						</div>
					</label>
				</div>
				<small style={{ display: 'block', marginTop: '12px', fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
					Admin Flow allows choosing device status (ACTIVE or ACTIVATION_REQUIRED). User Flow always requires activation.
				</small>
			</div>
			
			<MFAConfigurationStepV8
				{...props}
				deviceType={currentDeviceType}
				deviceTypeLabel={currentDeviceType === 'EMAIL' ? 'Email' : 'SMS'}
				registrationFlowType={registrationFlowType}
				policyDescription={`Controls how PingOne challenges the user during ${currentDeviceType} MFA authentication.`}
			/>
		</>
	);
};

// Device selection state management wrapper
const SMSFlowV8WithDeviceSelection: React.FC = () => {
	// Use shared hook for common state and logic
	const flow = useUnifiedOTPFlow({
		deviceType: 'SMS',
		configPageRoute: '/v8/mfa/register/sms',
	});

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
	const dynamicController = useMemo(() => 
		MFAFlowControllerFactory.create({ deviceType: controllerDeviceType }), 
		[controllerDeviceType]
	);
	
	// Use the dynamic controller if device type is different, otherwise use the hook's controller
	const effectiveController = controllerDeviceType !== 'SMS' ? dynamicController : controller;

	// Track previous step to detect when we navigate to step 1
	const previousStepRef = React.useRef<number | null>(null);

	// Track if we've updated credentials from location.state
	const credentialsUpdatedRef = React.useRef(false);
	
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
					if (locationState.deviceAuthenticationPolicyId && 
						updated.deviceAuthenticationPolicyId !== locationState.deviceAuthenticationPolicyId) {
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
			const isTokenValid = tokenType === 'worker' 
				? tokenStatus.isValid 
				: !!credentials.userToken?.trim();
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
					console.log(`${MODULE_TAG} Step 0 skip logic disabled - always showing new configuration screens`);
					// nav.goToStep(1);
				}, 0);
				// return null;
			}

			// If configured flag is true but we are missing env/user/policy,
			// stay on Step 0 so user can complete configuration
			if (isConfigured && !hasMinimumConfig) {
				console.log(`${MODULE_TAG} Configured flag is true but missing prerequisites, staying on Step 0`, {
					hasEnvironmentId: !!credentials.environmentId?.trim(),
					hasUsername: !!credentials.username?.trim(),
					hasPolicy: !!credentials.deviceAuthenticationPolicyId?.trim(),
				});
			}
			
			return <SMSConfigureStep {...props} registrationFlowType={registrationFlowType} setRegistrationFlowType={setRegistrationFlowType} adminDeviceStatus={adminDeviceStatus} setAdminDeviceStatus={setAdminDeviceStatus} />;
		};
	}, [isConfigured, location, registrationFlowType, adminDeviceStatus]);

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
			<SMSDeviceSelectionStep
				controller={controller}
				deviceSelection={deviceSelection}
				setDeviceSelection={setDeviceSelection}
				updateOtpState={updateOtpState}
				isConfigured={isConfigured}
				{...props}
			/>
		);
	};

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
				<span style={{ fontSize: '20px', fontWeight: '700', color: '#E31837', lineHeight: '1.2' }}>Ping</span>
				<span style={{ fontSize: '12px', fontWeight: '400', color: '#6b7280', lineHeight: '1.2' }}>Identity.</span>
			</div>
		</div>
	);

	// Step 2: Register Device (using controller) - Now as a Modal
	// Use useCallback to capture adminDeviceStatus and registrationFlowType in closure
	const renderStep2Register = useCallback((props: MFAFlowBaseRenderProps) => {
		const { credentials, setCredentials, mfaState, setMfaState, nav, setIsLoading, isLoading, setShowDeviceLimitModal, tokenStatus, setShowWorkerTokenModal } = props;

		// Ensure deviceType is set correctly - default to SMS for SMS flow, but allow EMAIL if selected
		// This ensures the button text and validation match what the user selected
		const currentDeviceType = (credentials.deviceType === 'SMS' || credentials.deviceType === 'EMAIL') 
			? credentials.deviceType 
			: 'SMS';

		// Reset deviceName to device type when entering registration step (Step 2)
		React.useEffect(() => {
			if (nav.currentStep === 2 && credentials) {
				// Reset deviceName to device type if it's empty or matches old device type
				const deviceTypeValue = (credentials.deviceType === 'SMS' || credentials.deviceType === 'EMAIL')
					? credentials.deviceType
					: currentDeviceType || 'SMS';
				const shouldReset = !credentials.deviceName || 
					credentials.deviceName === credentials.deviceType ||
					credentials.deviceName === 'SMS' ||
					credentials.deviceName === 'EMAIL';
				if (shouldReset) {
					setCredentials({
						...credentials,
						deviceName: deviceTypeValue,
					});
				}
			}
		}, [nav.currentStep, credentials.deviceType, credentials.deviceName, currentDeviceType, setCredentials]);

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
			const effectiveTokenType = registrationFlowType === 'admin' ? 'worker' 
				: registrationFlowType === 'user' ? 'user'
				: credentials.tokenType || 'worker';
			const isTokenValid = effectiveTokenType === 'worker' 
				? tokenStatus.isValid 
				: !!credentials.userToken?.trim();
			if (!isTokenValid) {
				missingFields.push(effectiveTokenType === 'worker' ? 'Worker Token' : 'User Token');
			}

			if (missingFields.length > 0) {
				nav.setValidationErrors([
					`Missing required configuration: ${missingFields.join(', ')}. Please complete Step 0 configuration.`
				]);
				toastV8.error(`Cannot register device: ${missingFields.join(', ')} required`);
				return;
			}

			// Get the actual device type from credentials (most up-to-date value)
			// This ensures we validate based on what's actually selected in the dropdown
			const actualDeviceType = (credentials.deviceType === 'SMS' || credentials.deviceType === 'EMAIL') 
				? credentials.deviceType 
				: 'SMS';
			
			// Validate based on device type (use actualDeviceType to match what user selected)
			if (actualDeviceType === 'SMS') {
				if (!credentials.phoneNumber?.trim()) {
					nav.setValidationErrors(['Phone number is required. Please enter a valid phone number.']);
					return;
				}
				// Use phone validation utility to handle multiple formats
				const phoneValidation = validateAndNormalizePhone(credentials.phoneNumber, credentials.countryCode);
				if (!phoneValidation.isValid) {
					nav.setValidationErrors([phoneValidation.error || 'Invalid phone number format']);
					return;
				}
			} else if (actualDeviceType === 'EMAIL') {
				if (!credentials.email?.trim()) {
					nav.setValidationErrors(['Email address is required. Please enter a valid email address.']);
					return;
				}
				if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
					nav.setValidationErrors(['Please enter a valid email address format.']);
					return;
				}
			}
			// Use the device name exactly as entered by the user
			const userEnteredDeviceName = credentials.deviceName?.trim();
			if (!userEnteredDeviceName) {
				nav.setValidationErrors(['Device name is required. Please enter a name for this device.']);
				return;
			}

			setIsLoading(true);
			try {
				// Update controller device type if it changed
				if (controllerDeviceType !== actualDeviceType) {
					setControllerDeviceType(actualDeviceType);
				}
				
				// Get the correct controller for the device type
				const correctController = MFAFlowControllerFactory.create({ deviceType: actualDeviceType });
				
				// Use the device name exactly as entered by the user, and ensure deviceType is correct
				const registrationCredentials = {
					...credentials,
					deviceName: userEnteredDeviceName,
					deviceType: actualDeviceType, // Ensure deviceType matches what user selected
				};
				// Determine device status based on selected flow type
				const deviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED' = registrationFlowType === 'admin' ? adminDeviceStatus : 'ACTIVATION_REQUIRED';
				
				console.log(`${MODULE_TAG} 🔍 DEVICE STATUS SELECTION DEBUG:`, {
					'Registration Flow Type': registrationFlowType,
					'Admin Device Status State': adminDeviceStatus,
					'Calculated Device Status': deviceStatus,
					'Will send to API': deviceStatus,
					'Admin Device Status Type': typeof adminDeviceStatus,
					'Admin Device Status Value': adminDeviceStatus,
				});
				
				// CRITICAL: Ensure status is explicitly set - log warning if it's not what we expect
				if (registrationFlowType === 'admin' && deviceStatus !== adminDeviceStatus) {
					console.error(`${MODULE_TAG} ⚠️ STATUS MISMATCH:`, {
						'Expected (adminDeviceStatus)': adminDeviceStatus,
						'Calculated (deviceStatus)': deviceStatus,
						'Registration Flow Type': registrationFlowType,
					});
				}
				
				const result = await correctController.registerDevice(
					registrationCredentials, 
					correctController.getDeviceRegistrationParams(registrationCredentials, deviceStatus)
				);
				
				// Use the actual status returned from the API, not the requested status
				const actualDeviceStatus = result.status || deviceStatus;
				
				// Per rightOTP.md: Extract device.activate URI from registration response
				// If device.activate URI exists, device requires activation
				// If missing, device is ACTIVE (double-check with status)
				const deviceActivateUri = (result as { deviceActivateUri?: string }).deviceActivateUri;
				
				console.log(`${MODULE_TAG} Device registration result:`, {
					requestedStatus: deviceStatus,
					actualStatus: result.status,
					usingStatus: actualDeviceStatus,
					registrationFlowType,
					deviceId: result.deviceId,
					hasDeviceActivateUri: !!deviceActivateUri,
					deviceActivateUri: deviceActivateUri || 'NOT PROVIDED',
					// Per rightOTP.md: If device.activate URI is missing, device is ACTIVE
					deviceIsActive: !deviceActivateUri || actualDeviceStatus === 'ACTIVE',
					'Full Result Object Keys': Object.keys(result),
				});
				// Detailed status logging for debugging
				console.log(`${MODULE_TAG} 📊 STATUS DEBUG:`, {
					'Requested Status': deviceStatus,
					'API Returned Status': result.status || 'NOT RETURNED',
					'Final Status Used': actualDeviceStatus,
					'Has deviceActivateUri': !!deviceActivateUri,
					'Registration Flow Type': registrationFlowType,
					'Admin Device Status': adminDeviceStatus,
					'Full Result Object': result,
				});
				
				// Update mfaState with device info - will be updated again in ACTIVATION_REQUIRED branch if needed
				setMfaState({
					...mfaState,
					deviceId: result.deviceId,
					deviceStatus: actualDeviceStatus,
					// Store device.activate URI per rightOTP.md
					...(deviceActivateUri ? { deviceActivateUri } : {}),
				});

				// Refresh device list
				const devices = await correctController.loadExistingDevices(registrationCredentials, tokenStatus);
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
				const apiReturnedActiveWithoutUri = actualDeviceStatus === 'ACTIVE' && !hasDeviceActivateUri;
				
				console.log(`${MODULE_TAG} 🔍 STATUS DECISION LOGIC:`, {
					'Requested Status': deviceStatus,
					'API Returned Status': actualDeviceStatus,
					'Has deviceActivateUri': hasDeviceActivateUri,
					'Requested ACTIVATION_REQUIRED': requestedActivationRequired,
					'Requested ACTIVE': requestedActive,
					'API Confirmed ACTIVE': apiConfirmedActive,
					'API Returned ACTIVE (no URI)': apiReturnedActiveWithoutUri,
					'Will treat as': apiReturnedActiveWithoutUri ? 'ACTIVE (device already active, cannot activate)' : (requestedActivationRequired && hasDeviceActivateUri ? 'ACTIVATION_REQUIRED' : (requestedActive && apiConfirmedActive ? 'ACTIVE' : 'UNKNOWN')),
				});
				
				// If API returned ACTIVE without deviceActivateUri, device is already active - show success
				// Don't try to activate an already-active device (will cause 400 error)
				console.log(`${MODULE_TAG} 🔍 CHECKING apiReturnedActiveWithoutUri:`, {
					apiReturnedActiveWithoutUri,
					actualDeviceStatus,
					hasDeviceActivateUri,
					'Condition result': actualDeviceStatus === 'ACTIVE' && !hasDeviceActivateUri,
				});
				if (apiReturnedActiveWithoutUri) {
					// Device is already ACTIVE - show success screen
					console.log(`${MODULE_TAG} ✅ Device is already ACTIVE (no activation needed), showing success screen...`);
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
						environmentId: resultWithExtras.environmentId || registrationCredentials.environmentId,
					});
					setShowModal(false);
					toastV8.success(`${actualDeviceType === 'EMAIL' ? 'Email' : 'SMS'} device registered successfully! Device is ready to use (ACTIVE status).`);
				} else if (requestedActivationRequired && hasDeviceActivateUri) {
					// Device requires activation and we have the URI
					// Device requires activation - PingOne automatically sends OTP when status is ACTIVATION_REQUIRED
					// No need to manually call sendOTP - PingOne handles it automatically
					console.log(`${MODULE_TAG} Device registered with ACTIVATION_REQUIRED status - PingOne will automatically send OTP`);
					
					// Ensure device status is explicitly set to ACTIVATION_REQUIRED in mfaState before navigation
					// (mfaState was already updated above, but we want to ensure status is correct)
					console.log(`${MODULE_TAG} 🔍 Setting mfaState for ACTIVATION_REQUIRED:`, {
						deviceId: result.deviceId,
						deviceActivateUri: deviceActivateUri || 'NOT PROVIDED',
						hasDeviceActivateUri: !!deviceActivateUri,
					});
					setMfaState((prev) => ({
						...prev,
						deviceId: result.deviceId,
						deviceStatus: 'ACTIVATION_REQUIRED', // Explicitly set status
						...(deviceActivateUri ? { deviceActivateUri } : {}),
					}));
					
					setShowModal(false);
					setShowValidationModal(true); // Ensure validation modal is open when navigating to Step 4
					nav.markStepComplete();
					
					// Use setTimeout to ensure state updates complete before navigation
					setTimeout(() => {
						nav.goToStep(4); // Go directly to validation step (Step 4) - skip Send OTP step (Step 3)
					}, 100);
					
					toastV8.success(`${actualDeviceType === 'EMAIL' ? 'Email' : 'SMS'} device registered! OTP has been sent automatically.`);
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
					console.log(`${MODULE_TAG} Device registered with ACTIVE status, showing success screen...`, {
						'Requested Status': deviceStatus,
						'API Status': actualDeviceStatus,
						'Final Status': finalStatus,
					});
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
						environmentId: resultWithExtras.environmentId || registrationCredentials.environmentId,
					});
					// Close the registration modal - success screen will be shown by renderStep2Register
					setShowModal(false);
					// Stay on step 2 to show success screen (don't navigate away)
					toastV8.success(`${actualDeviceType === 'EMAIL' ? 'Email' : 'SMS'} device registered successfully! Device is ready to use (ACTIVE status).`);
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
					// Type assertion needed because TypeScript can't narrow the type here
					if ((deviceStatus as string) === 'ACTIVATION_REQUIRED') {
						console.warn(`${MODULE_TAG} Requested ACTIVATION_REQUIRED but API returned ${actualDeviceStatus}, treating as ACTIVATION_REQUIRED`);
						setShowModal(false);
						setShowValidationModal(true);
						nav.markStepComplete();
						nav.goToStep(4);
						toastV8.success(`${actualDeviceType === 'EMAIL' ? 'Email' : 'SMS'} device registered! OTP has been sent automatically.`);
					} else {
						// Unknown status - default to OTP flow to be safe
						console.warn(`${MODULE_TAG} Device status unclear, defaulting to OTP flow`);
						setShowModal(false);
						nav.markStepComplete();
						nav.goToStep(3);
						toastV8.success(`${actualDeviceType === 'EMAIL' ? 'Email' : 'SMS'} device registered successfully!`);
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
					// Show worker token modal for token errors
					setShowWorkerTokenModal(true);
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

		// Use the currentDeviceType already declared above (line 590)
		const isSMS = currentDeviceType === 'SMS';
		const isEMAIL = currentDeviceType === 'EMAIL';
		// Use phone validation utility for format checking
		const isValidPhone = credentials.phoneNumber?.trim() && isValidPhoneFormat(credentials.phoneNumber, credentials.countryCode);
		const isValidEmail = credentials.email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email);
		const isValidForm = credentials.deviceName?.trim() && ((isSMS && isValidPhone) || (isEMAIL && isValidEmail));

		// If device was just registered with ACTIVE status, show success page using unified service
		// Only show success page for ACTIVE devices - ACTIVATION_REQUIRED devices go to Step 4 (validation)
		if (deviceRegisteredActive && deviceRegisteredActive.status === 'ACTIVE' && !showModal) {
			// Build success data from deviceRegisteredActive
			const successData: MFASuccessPageData = {
				deviceId: deviceRegisteredActive.deviceId,
				deviceType: deviceRegisteredActive.deviceType || credentials.deviceType || 'SMS',
				deviceStatus: deviceRegisteredActive.status,
				nickname: deviceRegisteredActive.deviceName,
				username: deviceRegisteredActive.username || credentials.username,
				...(deviceRegisteredActive.userId && { userId: deviceRegisteredActive.userId }),
				environmentId: deviceRegisteredActive.environmentId || credentials.environmentId,
				...(deviceRegisteredActive.createdAt && { createdAt: deviceRegisteredActive.createdAt }),
				...(deviceRegisteredActive.updatedAt && { updatedAt: deviceRegisteredActive.updatedAt }),
				...(credentials.phoneNumber && { phone: getFullPhoneNumber(credentials) }),
				...(credentials.email && { email: credentials.email }),
			};
			return (
				<MFASuccessPageV8
					{...props}
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
			// Build success data from deviceRegisteredActive
			const successData: MFASuccessPageData = {
				deviceId: deviceRegisteredActive.deviceId,
				deviceType: deviceRegisteredActive.deviceType || credentials.deviceType || 'SMS',
				deviceStatus: deviceRegisteredActive.status,
				nickname: deviceRegisteredActive.deviceName,
				username: deviceRegisteredActive.username || credentials.username,
				...(deviceRegisteredActive.userId && { userId: deviceRegisteredActive.userId }),
				environmentId: deviceRegisteredActive.environmentId || credentials.environmentId,
				...(deviceRegisteredActive.createdAt && { createdAt: deviceRegisteredActive.createdAt }),
				...(deviceRegisteredActive.updatedAt && { updatedAt: deviceRegisteredActive.updatedAt }),
				...(credentials.phoneNumber && { phone: getFullPhoneNumber(credentials) }),
				...(credentials.email && { email: credentials.email }),
			};
			return (
				<MFASuccessPageV8
					{...props}
					successData={successData}
					onStartAgain={() => {
						setDeviceRegisteredActive(null);
						navigate('/v8/mfa-hub');
					}}
				/>
			);
		}

		// If modal is closed and no success state, check if we're transitioning to Step 4 (OTP validation)
		// If we're on Step 4 or transitioning to it, don't show "Start again" - Step 4 will handle rendering
		if (!showModal && nav.currentStep !== 4) {
			// Check if we have a device ID and status indicating we should be on Step 4
			if (mfaState.deviceId && (mfaState.deviceStatus === 'ACTIVATION_REQUIRED' || showValidationModal)) {
				// We're transitioning to Step 4 - don't show "Start again", let Step 4 render
				return null;
			}
			
			return (
				<div style={{
					padding: '24px',
					background: 'white',
					borderRadius: '8px',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
					maxWidth: '600px',
					margin: '0 auto',
					textAlign: 'center',
				}}>
					<p style={{
						fontSize: '16px',
						color: '#6b7280',
						margin: '0 0 20px 0',
					}}>
						Registration modal closed. Click below to start again.
					</p>
					<button
						type="button"
						onClick={() => {
							setShowModal(true);
							navigate('/v8/mfa-hub');
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
		
		// If we're on Step 4, don't render Step 2 content
		if (nav.currentStep === 4) {
			return null;
		}

		return (
			<div
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0, 0, 0, 0.5)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 1000,
				}}
				onClick={() => {
					// Don't close on backdrop click - require explicit cancel
				}}
			>
				<div
					style={{
						background: 'white',
						borderRadius: '16px',
						padding: '0',
						maxWidth: '550px',
						width: '90%',
						boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
						overflow: 'hidden',
					}}
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header with Logo */}
					<div
						style={{
							background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
							padding: '16px 20px 12px 20px',
							textAlign: 'center',
							position: 'relative',
						}}
					>
						<button
							type="button"
							onClick={() => {
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
					<div style={{ padding: '16px 20px' }}>
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
							<div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Username</div>
							<div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{credentials.username}</div>
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
									// 3. It's exactly "SMS" or "EMAIL" (generic device type names)
									const currentDeviceName = credentials.deviceName?.trim() || '';
									const shouldUpdateDeviceName = 
										!currentDeviceName || 
										currentDeviceName === oldDeviceType ||
										currentDeviceName === 'SMS' ||
										currentDeviceName === 'EMAIL';
									
									// Determine the new device name
									const newDeviceName = shouldUpdateDeviceName ? newDeviceType : credentials.deviceName;
									
									// Update credentials with new device type and clear appropriate fields
									setCredentials({
										...credentials,
										deviceType: newDeviceType,
										deviceName: newDeviceName,
										// Clear phone/email when switching types to avoid validation errors
										phoneNumber: newDeviceType === 'SMS' ? credentials.phoneNumber : '',
										email: newDeviceType === 'EMAIL' ? credentials.email : '',
									});
									// Update controller device type when user changes selection
									if (newDeviceType === 'SMS' || newDeviceType === 'EMAIL') {
										setControllerDeviceType(newDeviceType);
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
								<option value="EMAIL">📧 Email</option>
							</select>
							<small style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#6b7280' }}>
								Select the type of MFA device you want to register
							</small>
						</div>

						{/* Phone Number Field (for SMS) */}
						{isSMS && (
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
								<small style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
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
										<div style={{ fontSize: '11px', fontWeight: '600', color: '#92400e', marginBottom: '2px' }}>
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
													? (isValidEmail ? '#10b981' : '#ef4444')
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
								<small style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#6b7280' }}>
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
										<div style={{ fontSize: '11px', fontWeight: '600', color: '#92400e', marginBottom: '2px' }}>
											📧 Email Preview:
										</div>
										<div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#1f2937' }}>
											<strong>Will send to:</strong> {credentials.email}
										</div>
									</div>
								)}
							</div>
						)}

						{/* Device Name Field */}
						<div style={{ marginBottom: '12px' }}>
							<label
								htmlFor="mfa-device-name-register"
								style={{
									display: 'block',
									fontSize: '13px',
									fontWeight: '600',
									color: '#374151',
									marginBottom: '6px',
								}}
							>
								Device Name <span style={{ color: '#ef4444' }}>*</span>
							</label>
							<input
								id="mfa-device-name-register"
								type="text"
								value={credentials.deviceName || (currentDeviceType || 'SMS')}
								onChange={(e) => {
									setCredentials({ ...credentials, deviceName: e.target.value });
								}}
								onFocus={(e) => {
									const currentName = credentials.deviceName?.trim() || '';
									if (!currentName || currentName === currentDeviceType || currentName === 'SMS' || currentName === 'EMAIL') {
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
									border: `1px solid ${
										credentials.deviceName?.trim() ? '#10b981' : '#ef4444'
									}`,
									boxShadow:
										credentials.deviceName?.trim()
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
							<small style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#6b7280' }}>
								Enter a friendly name to identify this device (e.g., "My Work Phone", "Personal Email")
							</small>
						</div>

						{/* Worker Token Status */}
						<div style={{ marginBottom: '16px', padding: '10px 12px', background: tokenStatus.isValid ? '#d1fae5' : '#fee2e2', border: `1px solid ${tokenStatus.isValid ? '#10b981' : '#ef4444'}`, borderRadius: '6px' }}>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
									<span style={{ fontSize: '16px' }}>{tokenStatus.isValid ? '✅' : '⚠️'}</span>
									<span style={{ fontSize: '14px', color: tokenStatus.isValid ? '#065f46' : '#991b1b', fontWeight: '500' }}>
										{tokenStatus.isValid ? tokenStatus.message || 'Worker token valid' : tokenStatus.message || 'Worker token required'}
									</span>
								</div>
								<button
									type="button"
									onClick={() => {
										setShowWorkerTokenModal(true);
									}}
									style={{
										padding: '8px 16px',
										background: tokenStatus.isValid ? '#10b981' : '#ef4444',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										fontSize: '13px',
										fontWeight: '600',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										gap: '6px',
									}}
								>
									<span>🔑</span>
									<span>{tokenStatus.isValid ? 'Manage Token' : 'Get Token'}</span>
								</button>
							</div>
						</div>

						{/* API Display Toggle */}
						<div style={{ 
							marginTop: '12px', 
							marginBottom: '8px',
							padding: '10px 12px',
							background: '#f9fafb',
							border: '1px solid #e5e7eb',
							borderRadius: '6px',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}>
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

						{/* Action Buttons */}
						<div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
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
									background: isValidForm && !isLoading && tokenStatus.isValid ? '#10b981' : '#d1d5db',
									color: 'white',
									border: 'none',
									borderRadius: '8px',
									fontSize: '15px',
									fontWeight: '600',
									cursor: isValidForm && !isLoading && tokenStatus.isValid ? 'pointer' : 'not-allowed',
									boxShadow: isValidForm && !isLoading && tokenStatus.isValid ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
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
			</div>
		);
	}, [registrationFlowType, adminDeviceStatus, controllerDeviceType, setControllerDeviceType, setDeviceSelection, updateOtpState, setShowModal, showModal, deviceRegisteredActive, isApiDisplayVisible]);

	// Step 3: Send OTP (using controller)
	const createRenderStep3 = () => {
		return (props: MFAFlowBaseRenderProps) => {
			const { credentials, mfaState, nav, setIsLoading, isLoading, tokenStatus } = props;
			// navigate is available from component level (line 451)

			const handleSendOTP = async () => {
				// Guardrail: Ensure required credentials before sending OTP
				if (!credentials.environmentId?.trim() || !credentials.username?.trim() || !tokenStatus.isValid) {
					nav.setValidationErrors([
						'Missing required configuration. Please ensure Environment ID, Username, and Worker Token are set.'
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
								⚠️ Attempt {otpState.sendRetryCount + 1} - If you continue to have issues, check your phone number and try again.
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
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
								<div>
									<p style={{ margin: 0, fontSize: '14px', color: '#0c4a6e', fontWeight: 600 }}>Device Authentication ID</p>
									<p style={{ margin: '2px 0 0', fontFamily: 'monospace', color: '#1f2937' }}>{mfaState.authenticationId}</p>
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
								Open the Device Authentication Details page to inspect the real-time status returned by PingOne after
								initialization.
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
							{isLoading ? '🔄 Sending...' : otpState.otpSent ? '🔄 Resend OTP Code' : 'Send OTP Code'}
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
								💡 <strong>Tip:</strong> OTP codes typically expire after 5-10 minutes. If you don't receive the code, click "Resend OTP Code" above.
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
			const { credentials, mfaState, setMfaState, nav, setIsLoading, isLoading, tokenStatus } = props;
			
			// Helper function to update OTP state
			const updateOtpState = (update: Partial<typeof otpState> | ((prev: typeof otpState) => typeof otpState)) => {
				setOtpState((prev) => {
					const patch = typeof update === 'function' ? update(prev) : update;
					return { ...prev, ...patch };
				});
			};
			
			// Close modal when verification is complete (handled in render, not useEffect)
			if (mfaState.verificationResult && mfaState.verificationResult.status === 'COMPLETED' && showValidationModal) {
				// Use setTimeout to avoid state updates during render
				setTimeout(() => {
					setShowValidationModal(false);
				}, 0);
			}

			// If validation is complete, show success screen using shared service
			// Close modal and show success page
			if (mfaState.verificationResult && (mfaState.verificationResult.status === 'COMPLETED' || mfaState.verificationResult.status === 'SUCCESS')) {
				// Close modal if it's open
				if (showValidationModal) {
					setShowValidationModal(false);
				}
				
				const successData = buildSuccessPageData(credentials, mfaState);
				return (
					<MFASuccessPageV8
						{...props}
						successData={successData}
						onStartAgain={() => navigate('/v8/mfa-hub')}
					/>
				);
			}

			// Only show validation modal for ACTIVATION_REQUIRED devices
			// If device is ACTIVE and we're on step 4, show success page instead of redirecting
			if (mfaState.deviceStatus === 'ACTIVE' && nav.currentStep === 4) {
				// Device is already active, show success page
				// Check if we have deviceRegisteredActive (just registered) or verificationResult (just activated)
				if (deviceRegisteredActive || mfaState.verificationResult) {
					const successData = buildSuccessPageData(credentials, mfaState);
					return (
						<MFASuccessPageV8
							{...props}
							successData={successData}
							onStartAgain={() => navigate('/v8/mfa-hub')}
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
					<div style={{
						padding: '24px',
						background: 'white',
						borderRadius: '8px',
						boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
						maxWidth: '600px',
						margin: '0 auto',
						textAlign: 'center',
					}}>
						<p style={{
							fontSize: '16px',
							color: '#6b7280',
							margin: '0 0 20px 0',
						}}>
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

			return (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1000,
					}}
					onClick={() => {
						// Don't close on backdrop click - require explicit action
					}}
				>
					<div
						style={{
							background: 'white',
							borderRadius: '16px',
							padding: '0',
							maxWidth: '550px',
							width: '90%',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
							overflow: 'hidden',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header with Logo */}
						<div
							style={{
								background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
								padding: '16px 20px 12px 20px',
								textAlign: 'center',
								position: 'relative',
							}}
						>
							<button
								type="button"
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
								Enter the verification code sent to your phone
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
								<p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
									Device ID:
								</p>
								<p style={{ margin: '0 0 8px 0', fontSize: '11px', fontFamily: 'monospace', color: '#1f2937', wordBreak: 'break-all' }}>
									{mfaState.deviceId}
								</p>
								<p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
									Phone Number:
								</p>
								<p style={{ margin: '0', fontSize: '11px', fontFamily: 'monospace', color: '#1f2937' }}>
									{getFullPhoneNumber(credentials)}
								</p>
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
										if (!credentials.environmentId?.trim() || !credentials.username?.trim() || !tokenStatus.isValid) {
											nav.setValidationErrors([
												'Missing required configuration. Please ensure Environment ID, Username, and Worker Token are set.'
											]);
											toastV8.error('Cannot validate OTP: Missing required configuration');
											return;
										}

										// Per rightOTP.md: Use device.activate URI for device activation during registration
										// For ACTIVATION_REQUIRED devices, always use activateDevice (even if URI not in state)
										// If deviceActivateUri exists, use it; otherwise construct it or let service handle it
										const isActivationRequired = mfaState.deviceStatus === 'ACTIVATION_REQUIRED';
										console.log(`${MODULE_TAG} 🔍 OTP Validation Check:`, {
											hasDeviceActivateUri: !!mfaState.deviceActivateUri,
											deviceActivateUri: mfaState.deviceActivateUri || 'NOT SET',
											deviceStatus: mfaState.deviceStatus,
											deviceId: mfaState.deviceId,
											isActivationRequired,
											'Will use': isActivationRequired ? 'activateDevice' : (mfaState.deviceActivateUri ? 'activateDevice' : 'validateOTP'),
										});
										
										// For ACTIVATION_REQUIRED devices, always use activateDevice
										// For other cases, use activateDevice if URI is available, otherwise use validateOTP
										if (isActivationRequired || mfaState.deviceActivateUri) {
											// Device activation flow (registration)
											setIsLoading(true);
											try {
												// Construct deviceActivateUri if not provided but we have the necessary info
												let deviceActivateUri = mfaState.deviceActivateUri;
												if (!deviceActivateUri && isActivationRequired && mfaState.deviceId && credentials.environmentId) {
													// Construct the URI: POST /environments/{envID}/users/{userID}/devices/{deviceID}
													// We'll let the service handle user lookup and URI construction
													console.log(`${MODULE_TAG} deviceActivateUri not in state, will let service construct it`);
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
												
												const activationResult = await MFAServiceV8.activateDevice(activationParams);

												console.log(`${MODULE_TAG} Device activated successfully`, {
													deviceId: mfaState.deviceId,
													status: activationResult.status,
												});

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
												const errorMessage = error instanceof Error ? error.message : 'Unknown error';
												console.error(`${MODULE_TAG} Failed to activate device:`, error);
												setValidationState({
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
														message: 'OTP validated successfully'
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
									disabled={isLoading}
									onClick={async () => {
										setIsLoading(true);
										try {
											await controller.sendOTP(
												credentials,
												mfaState.deviceId,
												otpState,
												updateOtpState,
												nav,
												setIsLoading
											);
											toastV8.success('OTP code resent successfully!');
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
										cursor: isLoading ? 'not-allowed' : 'pointer',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '6px',
									}}
								>
									<span>🔄</span>
									<span>{isLoading ? 'Sending...' : 'Resend OTP Code'}</span>
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
									<p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: validationState.validationAttempts >= 3 ? '#991b1b' : '#92400e' }}>
										{validationState.validationAttempts >= 3 ? '⚠️ Multiple Failed Attempts' : '⚠️ Validation Failed'}
									</p>
									<p style={{ margin: '0', fontSize: '11px', color: validationState.validationAttempts >= 3 ? '#991b1b' : '#92400e' }}>
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

	// Show loading state while checking credentials
	if (isCheckingCredentials) {
		return (
			<div style={{ 
				minHeight: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: '#f9fafb',
			}}>
				<div style={{ textAlign: 'center' }}>
					<div style={{ fontSize: '18px', color: '#374151', marginBottom: '12px' }}>
						Loading {getDeviceTypeDisplay()} Device Registration...
					</div>
					<div style={{ fontSize: '14px', color: '#6b7280' }}>
						Checking credentials...
					</div>
				</div>
			</div>
		);
	}

	return (
		<div style={{ 
			minHeight: '100vh',
			paddingBottom: isApiDisplayVisible && apiDisplayHeight > 0 ? `${apiDisplayHeight + 40}px` : '0',
			transition: 'padding-bottom 0.3s ease',
			overflow: 'visible',
		}}>
			<MFAFlowBaseV8
				deviceType="SMS"
				renderStep0={renderStep0}
				renderStep1={renderStep1WithSelection}
				renderStep2={renderStep2Register}
				renderStep3={createRenderStep3()}
				renderStep4={createRenderStep4()}
				validateStep0={validateStep0}
				stepLabels={['Configure', 'Select Device', 'Register Device', 'Send OTP', 'Validate']}
				shouldHideNextButton={(props) => {
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

// Main SMS Flow Component
export const SMSFlowV8: React.FC = () => {
	return <SMSFlowV8WithDeviceSelection />;
};
