/**
 * @file EmailFlowV8.tsx
 * @module v8/flows/types
 * @description Email-specific MFA flow component (Refactored with Controller Pattern)
 * @version 8.2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiMail, FiX } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { useDraggableModal } from '@/v8/hooks/useDraggableModal';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { WorkerTokenUIServiceV8 } from '@/v8/services/workerTokenUIServiceV8';
import { navigateToMfaHubWithCleanup } from '@/v8/utils/mfaFlowCleanupV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { UnifiedFlowErrorHandler } from '@/v8u/services/unifiedFlowErrorHandlerV8U';
import { UnifiedFlowLoggerService } from '@/v8u/services/unifiedFlowLoggerServiceV8U';
import { MFADeviceSelector } from '../components/MFADeviceSelector';
import { MFAOTPInput } from '../components/MFAOTPInput';
import { MFAFlowControllerFactory } from '../factories/MFAFlowControllerFactory';
import { MFAConfigurationStepV8 } from '../shared/MFAConfigurationStepV8';
import { type MFAFlowBaseRenderProps, MFAFlowBaseV8 } from '../shared/MFAFlowBaseV8';
import type { DeviceType, MFACredentials } from '../shared/MFATypes';
import { buildSuccessPageData, MFASuccessPageV8 } from '../shared/mfaSuccessPageServiceV8';
import { useUnifiedOTPFlow } from '../shared/useUnifiedOTPFlow';

const _MODULE_TAG = '[📧 EMAIL-FLOW-V8]';

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

const EmailDeviceSelectionStep: React.FC<DeviceSelectionStepProps & { isConfigured?: boolean }> = ({
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
				UnifiedFlowErrorHandler.handleError(
					error,
					{
						flowType: 'mfa' as any,
						deviceType: 'EMAIL',
						operation: 'loadExistingDevices',
					},
					{
						showToast: false, // Silent failure for background operation
						logError: true,
					}
				);
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
					nav.goToStep(3);
					toastV8.success('Authentication successful!');
					break;
				case 'OTP_REQUIRED':
					updateOtpState({ otpSent: true, sendRetryCount: 0, sendError: null });
					nav.markStepComplete();
					nav.goToStep(3);
					toastV8.success('OTP sent to your email. Proceed to validate the code.');
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
			UnifiedFlowErrorHandler.handleError(
				error,
				{
					flowType: 'mfa' as any,
					deviceType: 'EMAIL',
					operation: 'initializeAuthentication',
				},
				{
					showToast: true,
					setValidationErrors: (errs) => nav.setValidationErrors(errs),
					logError: true,
				}
			);
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
		const device = deviceSelection.existingDevices.find(
			(d) => (d as { id?: string }).id === deviceId
		);
		if (device) {
			setMfaState({
				...mfaState,
				deviceId,
				deviceStatus: ((device as { status?: string }).status as string) || 'ACTIVE',
				nickname: ((device as { nickname?: string; name?: string }).nickname ||
					(device as { nickname?: string; name?: string }).name ||
					'') as string,
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
			deviceName: credentials.deviceType || 'EMAIL',
		});
		nav.goToStep(2);
	};

	return (
		<div className="step-content">
			<h2>Select Email Device</h2>
			<p>Choose an existing device or register a new one</p>

			<MFADeviceSelector
				devices={
					deviceSelection.existingDevices as Array<{
						id: string;
						type: string;
						nickname?: string;
						name?: string;
						email?: string;
						status?: string;
					}>
				}
				loading={deviceSelection.loadingDevices}
				selectedDeviceId={deviceSelection.selectedExistingDevice}
				deviceType="EMAIL"
				onSelectDevice={handleSelectExistingDevice}
				onSelectNew={handleSelectNewDevice}
				renderDeviceInfo={(device) => (
					<>
						{(device as { email?: string }).email &&
							`Email: ${(device as { email?: string }).email}`}
						{(device as { status?: string }).status &&
							` • Status: ${(device as { status?: string }).status}`}
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

// Step 0: Configure Credentials (Email-specific) - will be wrapped in component
const createRenderStep0 = (
	_isConfigured: boolean,
	location: ReturnType<typeof useLocation>,
	credentialsUpdatedRef: React.MutableRefObject<boolean>,
	registrationFlowType: 'admin' | 'user',
	setRegistrationFlowType: (type: 'admin' | 'user') => void,
	adminDeviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED',
	setAdminDeviceStatus: (status: 'ACTIVE' | 'ACTIVATION_REQUIRED') => void,
	step0PropsRef: React.MutableRefObject<MFAFlowBaseRenderProps | null>,
	pendingTokenTypeRef: React.MutableRefObject<string | undefined>,
	prevTokenTypeRef: React.MutableRefObject<string | undefined>
) => {
	return (props: MFAFlowBaseRenderProps) => {
		const { nav, credentials, setCredentials } = props;
		const locationState = location.state as {
			configured?: boolean;
			deviceAuthenticationPolicyId?: string;
			policyName?: string;
		} | null;

		// Update ref with current props so hooks at component level can access them
		step0PropsRef.current = props;

		// Update tokenType ref to trigger effects when it changes (use ref to avoid setState during render)
		// Store in ref - useEffect will pick it up
		if (credentials.tokenType !== prevTokenTypeRef.current) {
			prevTokenTypeRef.current = credentials.tokenType;
			// Store in ref to avoid setState during render - useEffect will process it
			pendingTokenTypeRef.current = credentials.tokenType;
		}

		// Update credentials with policy ID from location.state if available (only once)
		if (
			!credentialsUpdatedRef.current &&
			locationState?.deviceAuthenticationPolicyId &&
			credentials.deviceAuthenticationPolicyId !== locationState.deviceAuthenticationPolicyId
		) {
			setCredentials({
				...credentials,
				deviceAuthenticationPolicyId: locationState.deviceAuthenticationPolicyId,
			});
			credentialsUpdatedRef.current = true;
		}

		return (
			<>
				{/* Registration Flow Type Selection - Email/SMS specific - MOVED ABOVE MFAConfigurationStepV8 */}
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
							onClick={() => setRegistrationFlowType('admin')}
						>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}
							>
								<input
									type="radio"
									name="registration-flow-type"
									value="admin"
									checked={registrationFlowType === 'admin'}
									onChange={() => setRegistrationFlowType('admin')}
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
							<div
								style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}
							>
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
												setAdminDeviceStatus('ACTIVE');
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
													setAdminDeviceStatus('ACTIVE');
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
												setAdminDeviceStatus('ACTIVATION_REQUIRED');
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
													setAdminDeviceStatus('ACTIVATION_REQUIRED');
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
							onClick={() => setRegistrationFlowType('user')}
						>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}
							>
								<input
									type="radio"
									name="registration-flow-type"
									value="user"
									checked={registrationFlowType === 'user'}
									onChange={() => setRegistrationFlowType('user')}
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
						Admin Flow allows choosing device status (ACTIVE or ACTIVATION_REQUIRED). User Flow
						always requires activation.
					</small>
				</div>

				<MFAConfigurationStepV8
					{...props}
					deviceType="EMAIL"
					deviceTypeLabel="Email"
					registrationFlowType={registrationFlowType}
					policyDescription="Controls how PingOne challenges the user during Email MFA authentication."
				/>
			</>
		);
	};
};

// Device selection state management wrapper
const EmailFlowV8WithDeviceSelection: React.FC = () => {
	// Use shared hook for common state and logic
	const flow = useUnifiedOTPFlow({
		deviceType: 'EMAIL',
		configPageRoute: '/v8/mfa/register/email',
	});

	// Destructure from shared hook
	const {
		deviceSelection,
		setDeviceSelection,
		otpState,
		setOtpState,
		updateOtpState,
		validationState,
		setValidationState,
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

	const credentialsUpdatedRef = React.useRef(false);

	// Ref to store step 0 props for hooks to access
	const step0PropsRef = React.useRef<MFAFlowBaseRenderProps | null>(null);

	// Ref to track previous tokenType to avoid unnecessary updates
	const prevTokenTypeRef = React.useRef<string | undefined>(undefined);

	// Ref to store pending tokenType changes (to avoid setState during render)
	const pendingTokenTypeRef = React.useRef<string | undefined>(undefined);

	// Ref to store step 4 props for potential use at component level
	const _step4PropsRef = React.useRef<MFAFlowBaseRenderProps | null>(null);

	// Ref to track if deviceName has been reset for step 2 (to avoid Rules of Hooks violation)
	const step2DeviceNameResetRef = React.useRef<{ step: number; deviceType: string } | null>(null);

	// Ref to store step 2 props for hooks to access
	const step2PropsRef = React.useRef<MFAFlowBaseRenderProps | null>(null);

	// Ref to prevent infinite loops in bidirectional sync (moved from createRenderStep0)
	const isSyncingRef = React.useRef(false);

	// State to trigger device loading - updated from render function
	const [deviceLoadTrigger, setDeviceLoadTrigger] = useState<{
		currentStep: number;
		environmentId: string;
		username: string;
		tokenValid: boolean;
	} | null>(null);

	// Auto-populate email from PingOne user when entering step 2
	const emailFetchAttemptedRef = React.useRef<{ step: number; username: string } | null>(null);
	const pendingEmailFetchTriggerRef = React.useRef<{
		step: number;
		username: string;
		environmentId: string;
	} | null>(null);

	// Bidirectional sync between Registration Flow Type and tokenType dropdown
	// When Registration Flow Type changes, update tokenType dropdown
	// Moved from createRenderStep0 to component level to fix hooks order issue
	React.useEffect(() => {
		// Only run when on step 0
		if (!step0PropsRef.current || step0PropsRef.current.nav.currentStep !== 0) return;

		const props = step0PropsRef.current;

		// Skip if we're in the middle of syncing from the other direction
		if (isSyncingRef.current) return;

		// User Flow: Uses User Token (from OAuth login), always set status to ACTIVATION_REQUIRED
		// Admin Flow: Uses Worker Token, can choose ACTIVE or ACTIVATION_REQUIRED
		if (registrationFlowType === 'user' && props.credentials.tokenType !== 'user') {
			// User Flow selected - ensure User Token is used
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
			isSyncingRef.current = true;
			props.setCredentials((prev) => ({
				...prev,
				tokenType: 'worker',
				userToken: '', // Clear user token when switching to admin
			}));
			// Reset flag after state update
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [registrationFlowType]);

	// When tokenType dropdown changes, sync to Registration Flow Type
	// Moved from createRenderStep0 to component level to fix hooks order issue
	React.useEffect(() => {
		// Only run when on step 0
		if (!step0PropsRef.current || step0PropsRef.current.nav.currentStep !== 0) return;

		const props = step0PropsRef.current;

		// Skip if we're in the middle of syncing from the other direction
		if (isSyncingRef.current) return;

		// Admin Flow uses Worker Token, User Flow uses User Token
		// Sync when switching between flows
		if (props.credentials.tokenType === 'worker' && registrationFlowType === 'user') {
			// User changed dropdown to "Worker Token" but User Flow is selected - this is invalid
			// User Flow must use User Token, so we should switch to Admin Flow
			setRegistrationFlowType('admin');
			return;
		} else if (props.credentials.tokenType === 'user' && registrationFlowType === 'admin') {
			// User changed dropdown to "User Token" but Admin Flow is selected - switch to User Flow
			setRegistrationFlowType('user');
			return;
		} else if (props.credentials.tokenType === 'worker' && registrationFlowType !== 'admin') {
			// User changed dropdown to "Worker Token" - sync to Registration Flow Type
			isSyncingRef.current = true;
			setRegistrationFlowType('admin');
			// Reset flag after state update
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [registrationFlowType, setRegistrationFlowType]);

	// Update deviceLoadTrigger when on step 1 (triggered via step0PropsRef, avoids setState during render)
	React.useEffect(() => {
		// Only update when on step 1
		const props = step0PropsRef.current;
		if (!props || props.nav.currentStep !== 1) return;

		const newTrigger = {
			currentStep: props.nav.currentStep,
			environmentId: props.credentials.environmentId || '',
			username: props.credentials.username || '',
			tokenValid: props.tokenStatus.isValid,
		};
		// Only update if values actually changed to avoid infinite loops
		if (
			!deviceLoadTrigger ||
			deviceLoadTrigger.currentStep !== newTrigger.currentStep ||
			deviceLoadTrigger.environmentId !== newTrigger.environmentId ||
			deviceLoadTrigger.username !== newTrigger.username ||
			deviceLoadTrigger.tokenValid !== newTrigger.tokenValid
		) {
			setDeviceLoadTrigger(newTrigger);
		}
		// Note: We can't use step0PropsRef.current in dependencies, so we use a combination of other dependencies
		// and check step0PropsRef.current inside the effect
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [deviceLoadTrigger]); // showModal changes when modal opens/closes, which helps trigger updates

	// Load devices when entering step 1 - moved to parent component level
	// Skip device loading during registration flow (when coming from config page)
	useEffect(() => {
		// During registration flow, skip device loading and go straight to registration
		if (isConfigured) {
			setDeviceSelection({
				existingDevices: [],
				loadingDevices: false,
				selectedExistingDevice: 'new',
				showRegisterForm: true,
			});
			return;
		}

		if (!deviceLoadTrigger) return;

		const loadDevices = async () => {
			if (
				!deviceLoadTrigger.environmentId ||
				!deviceLoadTrigger.username ||
				!deviceLoadTrigger.tokenValid
			) {
				return;
			}

			if (
				deviceLoadTrigger.currentStep === 1 &&
				deviceSelection.existingDevices.length === 0 &&
				!deviceSelection.loadingDevices
			) {
				setDeviceSelection((prev) => ({ ...prev, loadingDevices: true }));

				try {
					const credentials: MFACredentials = {
						environmentId: deviceLoadTrigger.environmentId,
						username: deviceLoadTrigger.username,
						clientId: '',
						deviceType: 'EMAIL',
						countryCode: '+1',
						phoneNumber: '',
						email: '',
						deviceName: '',
						deviceAuthenticationPolicyId: '',
					};
					const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
					const devices = await controller.loadExistingDevices(credentials, tokenStatus);
					setDeviceSelection({
						existingDevices: devices,
						loadingDevices: false,
						selectedExistingDevice: devices.length === 0 ? 'new' : '',
						showRegisterForm: devices.length === 0,
					});
				} catch (error) {
					UnifiedFlowErrorHandler.handleError(
						error,
						{
							flowType: 'mfa' as any,
							deviceType: 'EMAIL',
							operation: 'loadExistingDevices',
						},
						{
							showToast: false, // Silent failure for background operation
							logError: true,
						}
					);
					setDeviceSelection((prev) => ({
						...prev,
						loadingDevices: false,
						selectedExistingDevice: 'new',
						showRegisterForm: true,
					}));
				}
			}
		};

		loadDevices();
	}, [
		deviceLoadTrigger?.currentStep,
		deviceLoadTrigger?.environmentId,
		deviceLoadTrigger?.username,
		deviceLoadTrigger?.tokenValid,
		isConfigured,
		controller,
		deviceSelection.existingDevices.length,
		deviceSelection.loadingDevices,
		deviceLoadTrigger,
		setDeviceSelection,
	]);

	// Auto-populate email from PingOne user when entering step 2
	React.useEffect(() => {
		const trigger = pendingEmailFetchTriggerRef.current;
		if (!trigger) return;

		// Clear the ref immediately to avoid re-triggering
		pendingEmailFetchTriggerRef.current = null;

		const { step, username, environmentId } = trigger;
		if (!step2PropsRef.current) return;

		const props = step2PropsRef.current;
		const currentEmail = props.credentials.email?.trim() || '';

		// Only fetch if we don't already have an email
		if (currentEmail) {
			return;
		}

		// Check if we've already attempted to fetch email for this step/username combination
		const lastAttempt = emailFetchAttemptedRef.current;
		if (lastAttempt && lastAttempt.step === step && lastAttempt.username === username) {
			return; // Already attempted for this step/username
		}

		// Mark that we're attempting to fetch
		emailFetchAttemptedRef.current = { step, username };

		// Fetch user data from PingOne to get email
		const fetchUserEmail = async () => {
			try {
				const user = await MFAServiceV8.lookupUserByUsername(environmentId, username);

				// Extract email from user object - could be user.email or user.emails[0].value
				const userEmail =
					(user as { email?: string; emails?: Array<{ value?: string; primary?: boolean }> })
						.email ||
					(user as { emails?: Array<{ value?: string; primary?: boolean }> }).emails?.[0]?.value ||
					'';

				if (userEmail && props.credentials.email !== userEmail) {
					props.setCredentials((prev) => ({
						...prev,
						email: userEmail,
					}));
				}
			} catch (error) {
				// Silently fail - user can manually enter email
				UnifiedFlowErrorHandler.handleError(
					error,
					{
						flowType: 'mfa' as any,
						deviceType: 'EMAIL',
						operation: 'fetchUserEmail',
					},
					{
						showToast: false, // Silent failure
						logError: true,
					}
				);
			}
		};

		fetchUserEmail();
	});

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

	// Track previous step to detect when we navigate to step 1
	const previousStepRef = React.useRef<number | null>(null);

	// Step 1: Device Selection (using controller) - matches SMS structure
	const renderStep1WithSelection = (props: MFAFlowBaseRenderProps) => {
		// Store step 0 props for hooks to access (used by device loading effect)
		step0PropsRef.current = props;

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
			<EmailDeviceSelectionStep
				controller={controller}
				deviceSelection={deviceSelection}
				setDeviceSelection={setDeviceSelection}
				updateOtpState={updateOtpState}
				isConfigured={isConfigured}
				{...props}
			/>
		);
	};

	// Step 2: Register Device (using controller) - matches SMS structure
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

			// Store props in ref for useEffect to access
			step2PropsRef.current = props;

			// Auto-populate email from PingOne when entering step 2
			if (
				nav.currentStep === 2 &&
				credentials.username?.trim() &&
				!credentials.email?.trim() &&
				credentials.environmentId?.trim()
			) {
				// Store trigger in ref to avoid setState during render - useEffect will pick it up
				pendingEmailFetchTriggerRef.current = {
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
				const validDeviceType = credentials.deviceType || 'EMAIL';

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
							deviceType: validDeviceType,
							deviceName: validDeviceType, // Always set device name to device type
						});
					}, 0);
					step2DeviceNameResetRef.current = {
						step: nav.currentStep,
						deviceType: validDeviceType,
					};
				}
			}

			// Ensure deviceType is set correctly - default to EMAIL for Email flow
			const currentDeviceType = credentials.deviceType || 'EMAIL';

			// Get selected policy to check promptForNicknameOnPairing
			const selectedPolicy = props.deviceAuthPolicies?.find(
				(p) => p.id === credentials.deviceAuthenticationPolicyId
			);
			const shouldPromptForNickname = selectedPolicy?.promptForNicknameOnPairing === true;

			// Email validation
			const isValidEmail =
				credentials.email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email);
			// Only require deviceName if promptForNicknameOnPairing is true
			const isValidForm = shouldPromptForNickname
				? credentials.deviceName?.trim() && isValidEmail
				: isValidEmail;

			// Handle device registration
			const handleRegisterDevice = async () => {
				if (!credentials.email?.trim()) {
					nav.setValidationErrors([
						'Email address is required. Please enter a valid email address.',
					]);
					return;
				}
				if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
					nav.setValidationErrors(['Please enter a valid email address format.']);
					return;
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
					// Use the device name exactly as entered by the user
					const registrationCredentials = {
						...credentials,
						deviceName: userEnteredDeviceName,
					};

					// Determine device status based on selected flow type
					const deviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED' =
						registrationFlowType === 'admin' ? adminDeviceStatus : 'ACTIVATION_REQUIRED';

					const result = await controller.registerDevice(
						registrationCredentials,
						controller.getDeviceRegistrationParams(registrationCredentials, deviceStatus)
					);

					// Use the actual status returned from the API, not the requested status
					const actualDeviceStatus = result.status || deviceStatus;

					// Per rightOTP.md: Extract device.activate URI from registration response
					// If device.activate URI exists, device requires activation
					// If missing, device is ACTIVE (double-check with status)
					const deviceActivateUri = (result as { deviceActivateUri?: string }).deviceActivateUri;

					setMfaState({
						...mfaState,
						deviceId: result.deviceId,
						deviceStatus: actualDeviceStatus,
						// Store device.activate URI per rightOTP.md
						...(deviceActivateUri ? { deviceActivateUri } : {}),
					});

					// Refresh device list
					const devices = await controller.loadExistingDevices(
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
					const _deviceIsActive = actualDeviceStatus === 'ACTIVE' && !hasDeviceActivateUri;

					if (actualDeviceStatus === 'ACTIVATION_REQUIRED') {
						// Device requires activation - PingOne automatically sends OTP when status is ACTIVATION_REQUIRED
						// No need to manually call sendOTP - PingOne handles it automatically

						// Ensure device status is explicitly set to ACTIVATION_REQUIRED in mfaState before navigation
						setMfaState((prev) => ({
							...prev,
							deviceId: result.deviceId,
							deviceStatus: 'ACTIVATION_REQUIRED', // Explicitly set status
							...(deviceActivateUri ? { deviceActivateUri } : {}),
						}));

						setShowValidationModal(true); // Ensure validation modal is open when navigating to Step 4
						nav.markStepComplete();

						// Clean up any OAuth callback parameters from URL to prevent redirect issues
						if (
							window.location.search.includes('code=') ||
							window.location.search.includes('state=')
						) {
							const cleanUrl = window.location.pathname;
							window.history.replaceState({}, document.title, cleanUrl);
						}

						setShowModal(false);
						// Auto-advance removed - user must manually click "Next" button
						// User controls navigation to validation step

						toastV8.success('Email device registered! OTP has been sent automatically.');
					} else if (actualDeviceStatus === 'ACTIVE') {
						// Admin flow: Device is ACTIVE, no OTP needed - show success screen
						nav.markStepComplete();
						// Store registration success state before closing modal
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
							deviceType: currentDeviceType,
							status: actualDeviceStatus,
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
						toastV8.success(
							'Email device registered successfully! Device is ready to use (ACTIVE status).'
						);
					} else {
						// Unknown status - default behavior
						UnifiedFlowLoggerService.warn(
							'Device registered with unknown status, defaulting to OTP flow',
							{
								flowType: 'mfa' as any,
								deviceType: 'EMAIL',
								operation: 'registerDevice',
								actualDeviceStatus,
							}
						);
						nav.markStepComplete();
						nav.goToStep(4);
						toastV8.success('Email device registered successfully!');
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';

					// Use ValidationServiceV8 for consistent error formatting
					const formattedError = ValidationServiceV8.formatMFAError(error, {
						operation: 'register',
						deviceType: 'EMAIL',
					});

					const isDeviceLimitError =
						errorMessage.toLowerCase().includes('exceed') ||
						errorMessage.toLowerCase().includes('limit') ||
						errorMessage.toLowerCase().includes('maximum');

					if (isDeviceLimitError) {
						setShowDeviceLimitModal(true);
						nav.setValidationErrors([formattedError.userFriendlyMessage]);
						toastV8.mfaOperationError('registration', formattedError.userFriendlyMessage);
					} else {
						nav.setValidationErrors([formattedError.userFriendlyMessage]);
						toastV8.mfaOperationError('registration', formattedError.userFriendlyMessage);
					}
				} finally {
					setIsLoading(false);
				}
			};

			// If device was just registered with ACTIVE status, show success page using unified service
			// Only show success page for ACTIVE devices - ACTIVATION_REQUIRED devices go to Step 4 (validation)
			if (deviceRegisteredActive && deviceRegisteredActive.status === 'ACTIVE' && !showModal) {
				// Build success data from deviceRegisteredActive
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
				successData.deviceType = 'EMAIL' as DeviceType;
				return (
					<MFASuccessPageV8
						{...props}
						credentials={{ ...credentials, deviceType: 'EMAIL' as DeviceType }}
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
				successData.deviceType = 'EMAIL' as DeviceType;
				return (
					<MFASuccessPageV8
						{...props}
						credentials={{ ...credentials, deviceType: 'EMAIL' as DeviceType }}
						successData={successData}
						onStartAgain={() => {
							setDeviceRegisteredActive(null);
							navigate('/v8/mfa-hub');
						}}
					/>
				);
			}

			// If we're on Step 3, don't render Step 2 content - let Step 3 handle rendering
			if (nav.currentStep === 3) {
				return null;
			}

			// Check if we're transitioning to Step 3 (OTP validation) - check this BEFORE checking if modal is closed
			// This ensures we return null immediately when transitioning, even if modal is still open
			// User flow always goes to Step 3 after registration (always ACTIVATION_REQUIRED)
			// Admin flow with ACTIVATION_REQUIRED also goes to Step 3
			const isTransitioningToStep3 =
				mfaState.deviceId &&
				(mfaState.deviceStatus === 'ACTIVATION_REQUIRED' ||
					showValidationModal ||
					(registrationFlowType === 'user' && mfaState.deviceId)); // User flow always goes to validation after registration
			if (isTransitioningToStep3) {
				// We're transitioning to Step 3 - don't render Step 2 content, let Step 3 render
				// Return null to allow Step 3 to render
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

						{/* Modal Body - Scrollable */}
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

							{/* Email Field */}
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
									style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#6b7280' }}
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
										value={credentials.deviceName || currentDeviceType}
										onChange={(e) => {
											setCredentials({ ...credentials, deviceName: e.target.value });
										}}
										onFocus={(e) => {
											const currentName = credentials.deviceName?.trim() || '';
											if (
												!currentName ||
												currentName === currentDeviceType ||
												currentName === 'SMS' ||
												currentName === 'EMAIL'
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
											border: '1px solid #d1d5db',
											boxShadow: 'none',
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
										Enter a friendly name to identify this device (e.g., "My Work Email", "Personal
										Email")
									</small>
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
								environmentId={props.credentials.environmentId}
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
								disabled={
									isLoading ||
									!isValidForm ||
									(registrationFlowType === 'admin' ? !tokenStatus.token : !tokenStatus.isValid)
								}
								onClick={handleRegisterDevice}
								style={{
									flex: 2,
									padding: '12px 20px',
									background:
										isValidForm &&
										!isLoading &&
										(registrationFlowType === 'admin' ? !!tokenStatus.token : tokenStatus.isValid)
											? '#10b981'
											: '#d1d5db',
									color: 'white',
									border: 'none',
									borderRadius: '8px',
									fontSize: '15px',
									fontWeight: '600',
									cursor:
										isValidForm &&
										!isLoading &&
										(registrationFlowType === 'admin' ? !!tokenStatus.token : tokenStatus.isValid)
											? 'pointer'
											: 'not-allowed',
									boxShadow:
										isValidForm &&
										!isLoading &&
										(registrationFlowType === 'admin' ? !!tokenStatus.token : tokenStatus.isValid)
											? '0 4px 12px rgba(16, 185, 129, 0.3)'
											: 'none',
									transition: 'all 0.2s ease',
								}}
								onMouseEnter={(e) => {
									if (
										isValidForm &&
										!isLoading &&
										(registrationFlowType === 'admin' ? !!tokenStatus.token : tokenStatus.isValid)
									) {
										e.currentTarget.style.background = '#059669';
										e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.4)';
									}
								}}
								onMouseLeave={(e) => {
									if (
										isValidForm &&
										!isLoading &&
										(registrationFlowType === 'admin' ? !!tokenStatus.token : tokenStatus.isValid)
									) {
										e.currentTarget.style.background = '#10b981';
										e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
									}
								}}
							>
								{isLoading ? <>🔄 Registering...</> : <>Register Email Device →</>}
							</button>
						</div>
					</div>
				</div>
			);
		},
		[
			registrationFlowType,
			adminDeviceStatus,
			setDeviceSelection,
			controller,
			setShowModal,
			showModal,
			deviceRegisteredActive,
			isApiDisplayVisible,
			showValidationModal,
			navigate,
			setDeviceRegisteredActive,
			setShowValidationModal,
			step2ModalDrag.handleMouseDown,
			step2ModalDrag.isDragging,
			step2ModalDrag.modalPosition.x,
			step2ModalDrag.modalPosition.y,
			step2ModalDrag.modalRef,
			step2ModalDrag.modalStyle,
		]
	);

	// Step 3: Validate OTP (using controller) - Step 3 renamed from Step 4 after removing Send OTP step
	const createRenderStep4 = (
		validationAttempts: number,
		setValidationAttempts: (value: number | ((prev: number) => number)) => void,
		lastValidationError: string | null,
		setLastValidationError: (value: string | null) => void,
		_otpState: { otpSent: boolean; sendError: string | null; sendRetryCount: number },
		_setOtpState: (
			state: Partial<typeof otpState> | ((prev: typeof otpState) => Partial<typeof otpState>)
		) => void
	) => {
		return (props: MFAFlowBaseRenderProps) => {
			const { credentials, mfaState, setMfaState, nav, setIsLoading, isLoading } = props;

			// Store nav in ref for ESC key handler
			navRef.current = nav;

			// Close modal when verification is complete (handled in render, not useEffect)
			if (
				mfaState.verificationResult &&
				(mfaState.verificationResult.status === 'COMPLETED' ||
					mfaState.verificationResult.status === 'SUCCESS') &&
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
				// Close modal if it's open - use setTimeout to avoid state updates during render
				if (showValidationModal) {
					setTimeout(() => {
						setShowValidationModal(false);
					}, 0);
				}

				const successData = buildSuccessPageData(
					credentials,
					mfaState,
					registrationFlowType,
					adminDeviceStatus,
					credentials.tokenType
				);
				// Ensure deviceType is set for documentation button
				successData.deviceType = 'EMAIL' as DeviceType;
				return (
					<MFASuccessPageV8
						{...props}
						credentials={{ ...credentials, deviceType: 'EMAIL' as DeviceType }}
						successData={successData}
						onStartAgain={() => navigateToMfaHubWithCleanup(navigate)}
					/>
				);
			}

			// Only show validation modal for ACTIVATION_REQUIRED devices
			// If device is ACTIVE and we're on step 3, show success page instead of redirecting
			if (mfaState.deviceStatus === 'ACTIVE' && nav.currentStep === 3) {
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

			// Show validation UI as modal - always show when on step 3 (unless validation is complete)
			// If modal is closed but we're on step 3, automatically reopen it
			if (!showValidationModal && nav.currentStep === 3) {
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
							<path
								d="M12 2l7 3v5c0 5.25-3.5 9.75-7 11-3.5-1.25-7-5.75-7-11V5l7-3z"
								fill="#ffffff"
							/>
							<path
								d="M12 5l4 1.7V10.5c0 3.2-2.1 6.1-4 7-1.9-.9-4-3.8-4-7V6.7L12 5z"
								fill="#E31837"
							/>
						</svg>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
						<span
							style={{ fontSize: '20px', fontWeight: '700', color: '#E31837', lineHeight: '1.2' }}
						>
							Ping
						</span>
						<span
							style={{ fontSize: '12px', fontWeight: '400', color: '#6b7280', lineHeight: '1.2' }}
						>
							Identity.
						</span>
					</div>
				</div>
			);

			// Show validation UI as modal
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
								Enter the verification code sent to your email
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
										// Use authentication endpoint if authenticationId exists (existing device)
										// Otherwise use registration endpoint (new device)
										if (mfaState.authenticationId) {
											await controller.validateOTPForDevice(
												credentials,
												mfaState.authenticationId,
												mfaState.otpCode,
												mfaState,
												setMfaState,
												{ validationAttempts, lastValidationError },
												(state) => {
													if (typeof state === 'function') {
														const current = { validationAttempts, lastValidationError };
														const updated = state(current);
														setValidationAttempts(
															updated.validationAttempts ?? current.validationAttempts
														);
														setLastValidationError(
															updated.lastValidationError ?? current.lastValidationError
														);
													} else {
														if (state.validationAttempts !== undefined)
															setValidationAttempts(state.validationAttempts);
														if (state.lastValidationError !== undefined)
															setLastValidationError(state.lastValidationError);
													}
												},
												nav,
												setIsLoading
											);
										} else {
											// Per rightOTP.md: Use device.activate URI for device activation during registration
											// For ACTIVATION_REQUIRED devices, always use activateDevice (even if URI not in state)
											const isActivationRequired = mfaState.deviceStatus === 'ACTIVATION_REQUIRED';

											// For ACTIVATION_REQUIRED devices, always use activateDevice
											if (isActivationRequired || mfaState.deviceActivateUri) {
												// Device activation flow (registration)
												setIsLoading(true);
												try {
													const deviceActivateUri = mfaState.deviceActivateUri;

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

													setMfaState((prev) => ({
														...prev,
														deviceStatus: (activationResult.status as string) || 'ACTIVE',
														verificationResult: {
															status: 'COMPLETED',
															message: 'Device activated successfully',
														},
													}));

													nav.markStepComplete();
													nav.goToStep(3);
													toastV8.success('Device activated successfully!');
												} catch (error) {
													const parsed = UnifiedFlowErrorHandler.handleError(
														error,
														{
															flowType: 'mfa' as any,
															deviceType: 'EMAIL',
															operation: 'activateDevice',
														},
														{
															showToast: true,
															logError: true,
														}
													);
													setValidationAttempts((prev) => prev + 1);
													setLastValidationError(parsed.userFriendlyMessage);
													nav.setValidationErrors([
														`Activation failed: ${parsed.userFriendlyMessage}`,
													]);
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
													{ validationAttempts, lastValidationError },
													(state) => {
														if (typeof state === 'function') {
															const current = { validationAttempts, lastValidationError };
															const updated = state(current);
															setValidationAttempts(
																updated.validationAttempts ?? current.validationAttempts
															);
															setLastValidationError(
																updated.lastValidationError ?? current.lastValidationError
															);
														} else {
															if (state.validationAttempts !== undefined)
																setValidationAttempts(state.validationAttempts);
															if (state.lastValidationError !== undefined)
																setLastValidationError(state.lastValidationError);
														}
													},
													nav,
													setIsLoading
												);

												if (isValid) {
													setMfaState((prev) => ({
														...prev,
														verificationResult: {
															status: 'COMPLETED',
															message: 'OTP validated successfully',
														},
													}));
												}
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

								{/* Resend OTP button - works for both registration and authentication flows */}
								<button
									type="button"
									disabled={isLoading}
									onClick={async () => {
										setIsLoading(true);
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
											UnifiedFlowErrorHandler.handleError(
												error,
												{
													flowType: 'mfa' as any,
													deviceType: 'EMAIL',
													operation: 'resendOTP',
												},
												{
													showToast: true,
													logError: true,
												}
											);
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
									}}
								>
									{isLoading ? '🔄 Sending...' : '🔄 Resend OTP Code'}
								</button>
							</div>

							{/* Error Display */}
							{validationAttempts > 0 && lastValidationError && (
								<div
									style={{
										marginTop: '12px',
										padding: '12px',
										background: validationAttempts >= 3 ? '#fef2f2' : '#fffbeb',
										border: `1px solid ${validationAttempts >= 3 ? '#fecaca' : '#fed7aa'}`,
										borderRadius: '6px',
										color: validationAttempts >= 3 ? '#991b1b' : '#92400e',
									}}
								>
									<p style={{ margin: '0', fontSize: '13px', fontWeight: '600' }}>
										{validationAttempts >= 3 ? '⚠️ Multiple Failed Attempts' : '⚠️ Validation Failed'}
									</p>
									<p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>{lastValidationError}</p>
								</div>
							)}
						</div>
					</div>
				</div>
			);
		};
	};

	// Validation function for Step 0
	const validateStep0 = (
		credentials: MFACredentials,
		tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>,
		nav: ReturnType<typeof useStepNavigationV8>
	): boolean => {
		return controller.validateCredentials(credentials, tokenStatus, nav);
	};

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
				deviceType="EMAIL"
				renderStep0={createRenderStep0(
					isConfigured,
					location,
					credentialsUpdatedRef,
					registrationFlowType,
					setRegistrationFlowType,
					adminDeviceStatus,
					setAdminDeviceStatus,
					step0PropsRef,
					pendingTokenTypeRef,
					prevTokenTypeRef
				)}
				renderStep1={renderStep1WithSelection}
				renderStep2={renderStep2Register}
				renderStep3={createRenderStep4(
					validationState.validationAttempts,
					(v) =>
						setValidationState({
							...validationState,
							validationAttempts:
								typeof v === 'function' ? v(validationState.validationAttempts) : v,
						}),
					validationState.lastValidationError,
					(v) => setValidationState({ ...validationState, lastValidationError: v }),
					otpState,
					(
						update: Partial<typeof otpState> | ((prev: typeof otpState) => Partial<typeof otpState>)
					) => {
						setOtpState((prev) => {
							const patch = typeof update === 'function' ? update(prev) : update;
							return { ...prev, ...patch };
						});
					}
				)}
				validateStep0={validateStep0}
				stepLabels={
					isConfigured
						? [
								// Registration flow: Config -> Register Device -> Validate
								// Step 0: Configure (shown when coming from config page)
								'Configure',
								// Step 1: Select Device (skipped, returns null) - hide from breadcrumb
								'', // Empty string will hide this step from breadcrumb
								// Step 2: Register Device (email input and registration)
								'Register Device',
								// Step 3: Validate OTP
								'Validate',
							]
						: [
								// Authentication flow: Include device selection
								'Configure',
								'Select Device',
								'Register Device',
								'Validate',
							]
				}
				shouldHideNextButton={(props) => {
					// Hide Next button on step 2 when showing success page for ACTIVE devices
					if (
						props.nav.currentStep === 2 &&
						deviceRegisteredActive &&
						deviceRegisteredActive.status === 'ACTIVE'
					) {
						return true;
					}
					// Hide final button on success step (step 3) - we have our own "Start Again" button
					if (props.nav.currentStep === 3) {
						return true;
					}
					return false;
				}}
			/>
			<SuperSimpleApiDisplayV8 flowFilter="mfa" />
		</div>
	);
};

// Main Email Flow Component
export const EmailFlowV8: React.FC = () => {
	return <EmailFlowV8WithDeviceSelection />;
};
