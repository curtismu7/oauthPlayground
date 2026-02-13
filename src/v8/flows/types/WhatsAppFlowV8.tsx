/**
 * @file WhatsAppFlowV8.tsx
 * @module v8/flows/types
 * @description WhatsApp-specific MFA flow component (Refactored with Controller Pattern)
 * @version 8.2.0
 *
 * WhatsApp MFA is implemented as an SMS-like MFA factor via PingOne MFA with type = "WHATSAPP".
 * All outbound WhatsApp messages are sent by PingOne using its configured sender.
 * This component reuses SMS patterns but uses WHATSAPP device type.
 */

import React, { useCallback, useState } from 'react';
import { FiShield, FiX } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { CountryCodePickerV8 } from '@/v8/components/CountryCodePickerV8';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { NicknamePromptModalV8 } from '@/v8/components/NicknamePromptModalV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { WhatsAppNotEnabledModalV8 } from '@/v8/components/WhatsAppNotEnabledModalV8';
import { useDraggableModal } from '@/v8/hooks/useDraggableModal';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { fetchPhoneFromPingOne } from '@/v8/services/phoneAutoPopulationServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { navigateToMfaHubWithCleanup } from '@/v8/utils/mfaFlowCleanupV8';
import { isValidPhoneFormat } from '@/v8/utils/phoneValidationV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { UnifiedFlowErrorHandler } from '@/v8u/services/unifiedFlowErrorHandlerV8U';
import { MFADeviceSelector } from '../components/MFADeviceSelector';
import { MFAOTPInput } from '../components/MFAOTPInput';
import { MFAFlowControllerFactory } from '../factories/MFAFlowControllerFactory';
import { MFAConfigurationStepV8 } from '../shared/MFAConfigurationStepV8';
import { type MFAFlowBaseRenderProps, MFAFlowBaseV8 } from '../shared/MFAFlowBaseV8';
import type { DeviceType, MFACredentials } from '../shared/MFATypes';
import { buildSuccessPageData, MFASuccessPageV8 } from '../shared/mfaSuccessPageServiceV8';
import { useUnifiedOTPFlow } from '../shared/useUnifiedOTPFlow';

const MODULE_TAG = '[📲 WHATSAPP-MFA]';

// Device Selection Step Component (identical to SMS, but for WhatsApp)
interface DeviceSelectionStepProps extends MFAFlowBaseRenderProps {
	controller: ReturnType<typeof MFAFlowControllerFactory.create>;
	deviceSelection: DeviceSelectionState;
	setDeviceSelection: React.Dispatch<React.SetStateAction<DeviceSelectionState>>;
	updateOtpState: (update: Partial<OTPState> | ((prev: OTPState) => Partial<OTPState>)) => void;
}

const WhatsAppDeviceSelectionStep: React.FC<
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
					showRegisterForm: false,
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
					showRegisterForm: false,
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
					nav.goToStep(5); // Go to success step (Step 5)
					toastV8.success('Authentication successful!');
					break;
				case 'OTP_REQUIRED':
					// PingOne automatically sends OTP when initializeDeviceAuthentication returns OTP_REQUIRED
					// No need to manually send - go directly to validation step
					updateOtpState({ otpSent: true, sendRetryCount: 0, sendError: null });
					nav.markStepComplete();
					setTimeout(() => {
						nav.goToStep(4); // Go directly to validation step (Step 4) - OTP already sent automatically
					}, 100);
					toastV8.success('OTP sent to your WhatsApp automatically. Please enter the code.');
					break;
				case 'SELECTION_REQUIRED':
					nav.setValidationErrors([
						'Multiple devices require selection. Please choose the specific device to authenticate.',
					]);
					toastV8.warning('Please select a specific device');
					break;
				default:
					// For OTP_REQUIRED or unknown status that requires OTP, PingOne sends it automatically
					if (nextStep === 'OTP_REQUIRED' || authResult.status === 'OTP_REQUIRED') {
						updateOtpState({
							otpSent: true,
							sendRetryCount: 0,
							sendError: null,
						});
						nav.markStepComplete();
						setTimeout(() => {
							nav.goToStep(4); // Go directly to validation step (Step 4) - OTP already sent automatically
						}, 100);
						toastV8.success('OTP sent to your WhatsApp automatically. Please enter the code.');
					} else {
						// For other cases, go to Send OTP step as fallback
						updateOtpState({
							otpSent: false,
							sendRetryCount: 0,
							sendError: null,
						});
						nav.markStepComplete();
						nav.goToStep(3); // Default to Send OTP step (Step 3) for manual sending
						toastV8.success(
							'Device selected for authentication. Follow the next step to continue.'
						);
					}
			}
		} catch (error) {
			UnifiedFlowErrorHandler.handleError(
				error,
				{
					flowType: 'mfa' as any,
					deviceType: 'WHATSAPP',
					operation: 'authenticateExistingDevice',
				},
				{
					showToast: true,
					setValidationErrors: (errors) => nav.setValidationErrors(errors),
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
			deviceName: credentials.deviceType || 'WHATSAPP',
			nickname: credentials.nickname || 'MyKnickName',
		});
		nav.goToStep(2);
	};

	return (
		<div className="step-content">
			<h2>Select WhatsApp Device</h2>
			<p>Choose an existing device or register a new one</p>

			<MFADeviceSelector
				devices={deviceSelection.existingDevices.map((d) => {
					const mappedDevice: Device = {
						id: String(d.id ?? ''),
						type: typeof d.type === 'string' ? (d.type as string) : 'WHATSAPP',
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
				deviceType="WHATSAPP"
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

// Step 0: Configure Credentials (WhatsApp-specific) - will be wrapped in component
const createRenderStep0 = (
	_isConfigured: boolean,
	location: ReturnType<typeof useLocation>,
	credentialsUpdatedRef: React.MutableRefObject<boolean>,
	registrationFlowType: 'admin' | 'user',
	setRegistrationFlowType: (type: 'admin' | 'user') => void,
	adminDeviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED',
	setAdminDeviceStatus: (status: 'ACTIVE' | 'ACTIVATION_REQUIRED') => void,
	step0PropsRef: React.MutableRefObject<MFAFlowBaseRenderProps | null>,
	_setLastTokenType: (tokenType: string | undefined) => void,
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

		// Update tokenType ref (state update moved to useEffect to avoid render warning)
		if (credentials.tokenType !== prevTokenTypeRef.current) {
			prevTokenTypeRef.current = credentials.tokenType;
		}

		// Update credentials with policy ID from location.state if available (only once)
		// Use setTimeout to defer state update outside of render
		if (
			!credentialsUpdatedRef.current &&
			locationState?.deviceAuthenticationPolicyId &&
			credentials.deviceAuthenticationPolicyId !== locationState.deviceAuthenticationPolicyId
		) {
			console.log(
				`${MODULE_TAG} Updating credentials with policy ID from config page:`,
				locationState.deviceAuthenticationPolicyId
			);
			setTimeout(() => {
				setCredentials({
					...credentials,
					deviceAuthenticationPolicyId: locationState.deviceAuthenticationPolicyId,
				});
				credentialsUpdatedRef.current = true;
			}, 0);
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
					deviceType="WHATSAPP"
					deviceTypeLabel="WhatsApp"
					registrationFlowType={registrationFlowType}
					policyDescription="Controls how PingOne challenges the user during WhatsApp MFA authentication."
				/>
			</>
		);
	};
};

// Device selection state management wrapper
const WhatsAppFlowV8WithDeviceSelection: React.FC = () => {
	// Use shared hook for common state and logic
	const flow = useUnifiedOTPFlow({
		deviceType: 'WHATSAPP',
		configPageRoute: '/v8/mfa/register/whatsapp',
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

	// Load credentials from storage for use in modals/components outside of MFAFlowBaseV8
	const [credentialsForModal, _setCredentialsForModal] = useState<MFACredentials>(() => {
		const stored = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
			flowKey: 'mfa-flow-v8',
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});
		return {
			environmentId: stored.environmentId || '',
			clientId: stored.clientId || '',
			username: stored.username || '',
			deviceType: 'WHATSAPP' as DeviceType,
			countryCode: stored.countryCode || '+1',
			phoneNumber: stored.phoneNumber || '',
			email: stored.email || '',
			deviceName: stored.deviceName || '',
			deviceAuthenticationPolicyId: stored.deviceAuthenticationPolicyId || '',
			registrationPolicyId: stored.registrationPolicyId || '',
		};
	});

	const credentialsUpdatedRef = React.useRef(false);

	// Ref to store step 0 props for hooks to access
	const step0PropsRef = React.useRef<MFAFlowBaseRenderProps | null>(null);

	// State for nickname prompt modal (shared across steps)
	const [showNicknameModal, setShowNicknameModal] = useState(false);
	const [pendingDeviceId, setPendingDeviceId] = useState<string | null>(null);
	const [isUpdatingNickname, setIsUpdatingNickname] = useState(false);
	const [showWhatsAppNotEnabledModal, setShowWhatsAppNotEnabledModal] = useState(false);

	// Track if user explicitly closed validation modal (prevent auto-reopen)
	const [userClosedValidationModal, setUserClosedValidationModal] = useState(false);

	// State to track tokenType changes (for triggering effects)
	const [_lastTokenType, setLastTokenType] = useState<string | undefined>(undefined);

	// Ref to track previous tokenType to avoid unnecessary updates
	const prevTokenTypeRef = React.useRef<string | undefined>(undefined);

	// Ref to prevent infinite loops in bidirectional sync (moved from createRenderStep0)
	const isSyncingRef = React.useRef(false);

	// Ref to track previous step for clearing deviceRegisteredActive state
	const previousStepRef = React.useRef<number>(-1);

	// Ref to store step 4 props for modal management (moved to avoid Rules of Hooks violation)
	const step4PropsRef = React.useRef<MFAFlowBaseRenderProps | null>(null);

	// Ref to store step 2 props for hooks to access
	const step2PropsRef = React.useRef<MFAFlowBaseRenderProps | null>(null);

	// Auto-populate phone from PingOne user when entering step 2
	const phoneFetchAttemptedRef = React.useRef<{ step: number; username: string } | null>(null);
	const pendingPhoneFetchTriggerRef = React.useRef<{
		step: number;
		username: string;
		environmentId: string;
	} | null>(null);

	// Ref to track device name reset for step 2
	const step2DeviceNameResetRef = React.useRef<{ step: number; deviceType: string } | null>(null);

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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [registrationFlowType, MODULE_TAG]);

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
			setRegistrationFlowType('admin');
			// Reset flag after state update
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [registrationFlowType, setRegistrationFlowType, MODULE_TAG]);

	// Device loading is now handled inside WhatsAppDeviceSelectionStep component (like SMS)

	// Update tokenType state when it changes (moved from render function to avoid render warning)
	React.useEffect(() => {
		const currentTokenType = step0PropsRef.current?.credentials?.tokenType;
		if (currentTokenType !== undefined && currentTokenType !== prevTokenTypeRef.current) {
			prevTokenTypeRef.current = currentTokenType;
			setLastTokenType(currentTokenType);
		}
	}, []);

	// Clear success state when navigating to step 1 (moved to useEffect to avoid render warning)
	React.useEffect(() => {
		const nav = step0PropsRef.current?.nav;
		if (!nav || typeof nav.currentStep !== 'number') return;
		const currentStep = nav.currentStep;
		if (currentStep === 1 && previousStepRef.current !== 1 && deviceRegisteredActive) {
			// Clear the state when we first enter step 1
			previousStepRef.current = 1;
			setDeviceRegisteredActive(null);
		} else if (currentStep !== 1) {
			// Reset the ref when we leave step 1
			previousStepRef.current = currentStep;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [deviceRegisteredActive, setDeviceRegisteredActive]);

	// Step 1: Device Selection (using separate component like SMS)
	const renderStep1WithSelection = (props: MFAFlowBaseRenderProps) => {
		return (
			<WhatsAppDeviceSelectionStep
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

	// Draggable modal hooks
	const _step2ModalDrag = useDraggableModal(showModal);
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

	// Step 2: Register Device (using controller) - Modal structure matching SMS
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
				deviceAuthPolicies,
			} = props;

			// Store step 2 props for useEffect to access
			step2PropsRef.current = props;

			// Auto-populate phone from PingOne when entering step 2
			if (
				nav.currentStep === 2 &&
				credentials.username?.trim() &&
				!credentials.phoneNumber?.trim() &&
				credentials.environmentId?.trim()
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
				// Force deviceType to be WHATSAPP for WhatsApp flow
				const validDeviceType = 'WHATSAPP';

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

			// Ensure deviceType is set correctly - default to WHATSAPP for WhatsApp flow
			const _currentDeviceType = credentials.deviceType || 'WHATSAPP';

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
				if (!tokenStatus.isValid) {
					missingFields.push('Worker Token');
				}

				if (missingFields.length > 0) {
					nav.setValidationErrors([
						`Missing required configuration: ${missingFields.join(', ')}. Please complete Step 0 configuration.`,
					]);
					toastV8.error(`Cannot register device: ${missingFields.join(', ')} required`);
					return;
				}

				// Check if pairing is disabled in the policy
				const selectedPolicy = deviceAuthPolicies.find(
					(p) => p.id === credentials.deviceAuthenticationPolicyId
				);
				if (selectedPolicy?.pairingDisabled === true) {
					nav.setValidationErrors([
						'Device pairing is disabled for the selected Device Authentication Policy. Please select a different policy or contact your administrator.',
					]);
					toastV8.error('Device pairing is disabled for this policy');
					return;
				}

				if (!credentials.phoneNumber?.trim()) {
					const errorMsg = 'Phone number is required. Please enter a valid phone number.';
					nav.setValidationErrors([errorMsg]);
					toastV8.error(errorMsg);
					return;
				}
				if (!isValidPhoneFormat(credentials.phoneNumber, credentials.countryCode)) {
					const errorMsg = 'Please enter a valid phone number format.';
					nav.setValidationErrors([errorMsg]);
					toastV8.error(errorMsg);
					return;
				}
				// Use the device name exactly as entered by the user
				const userEnteredDeviceName = credentials.deviceName?.trim();
				if (!userEnteredDeviceName) {
					const errorMsg = 'Device name is required. Please enter a name for this device.';
					nav.setValidationErrors([errorMsg]);
					toastV8.error(errorMsg);
					return;
				}

				setIsLoading(true);
				try {
					// Use the device name exactly as entered by the user
					const registrationCredentials = {
						...credentials,
						deviceName: userEnteredDeviceName,
					};

					// Determine device status based on selected flow type (same logic as SMS)
					// Per PingOne API docs:
					// - Admin Flow (Worker App on behalf of user): Can use ACTIVE or ACTIVATION_REQUIRED (user's choice)
					// - User Flow (user making request): Can only use ACTIVATION_REQUIRED
					//
					// Status selection:
					// - Admin Flow: Use adminDeviceStatus (user selects ACTIVE or ACTIVATION_REQUIRED via dropdown)
					// - User Flow: Always ACTIVATION_REQUIRED (enforced by PingOne API)
					const deviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED' =
						registrationFlowType === 'admin' ? adminDeviceStatus : 'ACTIVATION_REQUIRED';

					const result = await controller.registerDevice(
						registrationCredentials,
						controller.getDeviceRegistrationParams(registrationCredentials, deviceStatus)
					);

					// Check if policy requires nickname prompt (selectedPolicy already defined above)
					const shouldPromptForNickname = selectedPolicy?.promptForNicknameOnPairing === true;

					if (shouldPromptForNickname) {
						// Store device ID for nickname update and show modal
						setPendingDeviceId(result.deviceId);
						setShowNicknameModal(true);
						// Don't update nickname automatically - wait for user input in modal
					} else {
						// Update device nickname with the user-provided device name (if not prompting)
						// This ensures the nickname appears in the API display and matches what the user entered
						if (result.deviceId && userEnteredDeviceName) {
							try {
								console.log(`${MODULE_TAG} Updating device nickname after registration:`, {
									deviceId: result.deviceId,
									nickname: userEnteredDeviceName,
								});
								await MFAServiceV8.updateDeviceNickname(
									{
										environmentId: registrationCredentials.environmentId,
										username: registrationCredentials.username,
										deviceId: result.deviceId,
									},
									userEnteredDeviceName
								);
								console.log(`${MODULE_TAG} ✅ Device nickname updated successfully`);
							} catch (nicknameError) {
								console.warn(
									`${MODULE_TAG} ⚠️ Failed to update device nickname (non-fatal):`,
									nicknameError
								);
								// Don't fail registration if nickname update fails - device was created successfully
							}
						}
					}

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
						// Per rightOTP.md: If device.activate URI is missing, device is ACTIVE
						deviceIsActive: !deviceActivateUri || actualDeviceStatus === 'ACTIVE',
					});

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
						console.log(
							`${MODULE_TAG} Device registered with ACTIVATION_REQUIRED status - PingOne will automatically send OTP`
						);

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
							console.log(`${MODULE_TAG} Cleaned up OAuth callback parameters from URL`);
						}

						// Navigate immediately to avoid any delay - same pattern as SMS flow
						// Use setTimeout to ensure state updates complete before navigation
						setTimeout(() => {
							nav.goToStep(4); // Go directly to validation step (Step 4) - skip Send OTP step (Step 3)
						}, 0);

						toastV8.success('WhatsApp device registered! OTP has been sent automatically.');
					} else if (actualDeviceStatus === 'ACTIVE') {
						// Admin flow: Device is ACTIVE, no OTP needed - show success screen
						console.log(
							`${MODULE_TAG} Device registered with ACTIVE status, showing success screen...`
						);
						nav.markStepComplete();

						// Store registration success state to trigger success page (same pattern as SMS flow)
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
							deviceType: 'WHATSAPP',
							status: 'ACTIVE',
							username: registrationCredentials.username,
							...(resultWithExtras.userId ? { userId: resultWithExtras.userId } : {}),
							...(resultWithExtras.createdAt ? { createdAt: resultWithExtras.createdAt } : {}),
							...(resultWithExtras.updatedAt ? { updatedAt: resultWithExtras.updatedAt } : {}),
							environmentId:
								resultWithExtras.environmentId || registrationCredentials.environmentId,
						});
						setShowModal(false);

						toastV8.success(
							'WhatsApp device registered successfully! Device is ready to use (ACTIVE status).'
						);
					} else {
						// Unknown status - default behavior
						console.warn(
							`${MODULE_TAG} Device registered with unknown status: ${actualDeviceStatus}, defaulting to OTP flow`
						);
						nav.markStepComplete();
						nav.goToStep(3);
						toastV8.success('WhatsApp device registered successfully!');
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					const normalizedMessage = errorMessage.toLowerCase();

					// Only trigger WhatsApp MFA disabled modal for very specific error codes
					// Be conservative - don't show modal for policy-level restrictions or ambiguous errors
					// Only show if we're certain it's an environment-level WhatsApp MFA disabled error
					const errorCode =
						error && typeof error === 'object' && 'code' in error
							? (error as { code?: string }).code
							: undefined;
					// Only show modal for explicit WhatsApp MFA disabled error codes
					// Policy-level restrictions or other errors should show generic error message
					const isWhatsAppNotAllowedError = errorCode === 'WHATSAPP_MFA_NOT_ENABLED';

					const isDeviceLimitError =
						normalizedMessage.includes('exceed') ||
						normalizedMessage.includes('limit') ||
						normalizedMessage.includes('maximum');

					if (isWhatsAppNotAllowedError) {
						nav.setValidationErrors([
							'WhatsApp MFA is not enabled for this environment. Please enable WhatsApp MFA in the PingOne Admin Console.',
						]);
						setShowWhatsAppNotEnabledModal(true);
						toastV8.error('WhatsApp MFA is not enabled for this environment.');
					} else if (isDeviceLimitError) {
						setShowDeviceLimitModal(true);
						nav.setValidationErrors([`Device registration failed: ${errorMessage}`]);
						toastV8.error('Device limit exceeded. Please delete an existing device first.');
					} else {
						nav.setValidationErrors([`Failed to register device: ${errorMessage}`]);
						toastV8.error(`Registration failed: ${errorMessage}`);
					}
				} finally {
					setIsLoading(false);
				}
			};

			// Check if device was successfully registered with ACTIVE status
			// We'll hide the register button and show Next button instead
			const _isDeviceRegisteredActive =
				(deviceRegisteredActive && deviceRegisteredActive.status === 'ACTIVE') ||
				(mfaState.deviceId && mfaState.deviceStatus === 'ACTIVE' && !showModal);

			// Use phone validation utility for format checking
			const isValidPhone =
				credentials.phoneNumber?.trim() &&
				isValidPhoneFormat(credentials.phoneNumber, credentials.countryCode);
			const isValidForm = credentials.deviceName?.trim() && isValidPhone;

			return (
				<div className="step-content">
					<h2>Register WhatsApp Device</h2>
					<p>Enter your phone number and device name to register a new WhatsApp device</p>

					<div className="info-box">
						<p>
							<strong>Username:</strong> {credentials.username}
						</p>
					</div>

					<div className="form-group" style={{ marginTop: '0' }}>
						<label htmlFor="mfa-phone-register">
							Phone Number <span className="required">*</span>
						</label>
						<div style={{ display: 'flex', gap: '8px' }}>
							<CountryCodePickerV8
								value={credentials.countryCode || '+1'}
								onChange={(code) => setCredentials({ ...credentials, countryCode: code })}
							/>
							<input
								id="mfa-phone-register"
								type="tel"
								value={credentials.phoneNumber || ''}
								onChange={(e) =>
									setCredentials({ ...credentials, phoneNumber: e.target.value.trim() })
								}
								placeholder="5125551234"
								style={{
									flex: 1,
									padding: '10px 12px',
									border: `1px solid ${
										credentials.phoneNumber?.trim() &&
										isValidPhoneFormat(credentials.phoneNumber, credentials.countryCode)
											? '#10b981'
											: '#ef4444'
									}`,
									boxShadow:
										credentials.phoneNumber?.trim() &&
										isValidPhoneFormat(credentials.phoneNumber, credentials.countryCode)
											? 'none'
											: '0 0 0 3px rgba(239, 68, 68, 0.25)',
									outline: 'none',
									borderRadius: '6px',
									fontSize: '14px',
									color: '#1f2937',
									background: 'white',
								}}
							/>
						</div>
						<small>
							Enter a valid phone number
							{credentials.phoneNumber && (
								<span
									style={{
										marginLeft: '8px',
										color: isValidPhoneFormat(credentials.phoneNumber, credentials.countryCode)
											? '#10b981'
											: '#ef4444',
										fontWeight: '500',
									}}
								>
									{isValidPhoneFormat(credentials.phoneNumber, credentials.countryCode)
										? `✓ Valid`
										: '✗ Invalid phone format'}
								</span>
							)}
						</small>
					</div>

					<div className="form-group" style={{ marginTop: '0' }}>
						<label htmlFor="mfa-device-name-register">
							Device Name <span className="required">*</span>
						</label>
						<input
							id="mfa-device-name-register"
							type="text"
							value={credentials.deviceName || 'WHATSAPP'}
							onChange={(e) =>
								setCredentials({
									...credentials,
									deviceName: e.target.value,
									nickname: credentials.nickname || 'MyKnickName',
								})
							}
							placeholder={credentials.deviceType || 'WHATSAPP'}
							style={{
								padding: '10px 12px',
								border: `1px solid ${credentials.deviceName?.trim() ? '#10b981' : '#ef4444'}`,
								boxShadow: credentials.deviceName?.trim()
									? 'none'
									: '0 0 0 3px rgba(239, 68, 68, 0.25)',
								outline: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								color: '#1f2937',
								background: 'white',
								width: '100%',
							}}
						/>
						<small>
							Enter a friendly name to identify this device (e.g., "My WhatsApp", "Work WhatsApp")
							{credentials.deviceName && (
								<span
									style={{
										marginLeft: '8px',
										color: '#10b981',
										fontWeight: '500',
									}}
								>
									✓ Device will be registered as: "{credentials.deviceName}"
								</span>
							)}
						</small>
					</div>

					<div style={{ marginBottom: '16px' }}>
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
								padding: '10px 12px',
								border: '1px solid #d1d5db',
								outline: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								color: '#1f2937',
								background: 'white',
								width: '100%',
							}}
						/>
						<small
							style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}
						>
							Enter a friendly nickname for this device (e.g., "Personal WhatsApp", "Work Phone")
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

					<div
						style={{
							marginBottom: '16px',
							padding: '12px',
							background: '#fef3c7',
							border: '1px solid #fbbf24',
							borderRadius: '6px',
						}}
					>
						<p
							style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#92400e' }}
						>
							📋 Phone Number Preview:
						</p>
						<p style={{ margin: '0', fontSize: '14px', fontFamily: 'monospace', color: '#1f2937' }}>
							<strong>Will register:</strong> {getContactDisplay(credentials)}
						</p>
					</div>

					<div
						style={{
							display: 'flex',
							justifyContent: 'flex-end',
							marginTop: '8px',
						}}
					>
						<button
							type="button"
							disabled={isLoading || !isValidForm}
							onClick={handleRegisterDevice}
							style={{
								minWidth: '200px',
								padding: '10px 20px',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: 500,
								border: 'none',
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								cursor: isLoading || !isValidForm ? 'not-allowed' : 'pointer',
								background: isLoading || !isValidForm ? '#d1d5db' : '#10b981',
								color: isLoading || !isValidForm ? '#6b7280' : '#ffffff',
								transition: 'all 0.2s ease',
								boxShadow: isLoading || !isValidForm ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.3)',
							}}
						>
							{isLoading ? '🔄 Registering...' : 'Register WhatsApp Device'}
						</button>
					</div>

					{/* Nickname Prompt Modal */}
					<NicknamePromptModalV8
						isOpen={showNicknameModal}
						onClose={() => {
							setShowNicknameModal(false);
							setPendingDeviceId(null);
						}}
						onSave={async (nickname: string) => {
							if (!pendingDeviceId) {
								throw new Error('Device ID is missing');
							}
							setIsUpdatingNickname(true);
							try {
								await MFAServiceV8.updateDeviceNickname(
									{
										environmentId: credentials.environmentId,
										username: credentials.username,
										deviceId: pendingDeviceId,
									},
									nickname
								);
								toastV8.success('Device nickname updated successfully');
								setShowNicknameModal(false);
								setPendingDeviceId(null);
							} finally {
								setIsUpdatingNickname(false);
							}
						}}
						currentNickname={credentials.deviceName}
						deviceType="WHATSAPP"
						isLoading={isUpdatingNickname}
					/>
				</div>
			);
		},
		[
			registrationFlowType,
			adminDeviceStatus,
			controller,
			getContactDisplay,
			showNicknameModal,
			pendingDeviceId,
			isUpdatingNickname,
			MODULE_TAG,
			deviceRegisteredActive,
			setDeviceRegisteredActive,
			setDeviceSelection,
			setShowModal,
			setShowValidationModal,
			showModal,
		]
	);

	// Step 3: Send OTP (using controller) - Renumbered from Step 2
	const _createRenderStep3 = (
		otpSent: boolean,
		setOtpSent: (value: boolean) => void,
		sendError: string | null,
		setSendError: (value: string | null) => void,
		sendRetryCount: number,
		setSendRetryCount: (value: number | ((prev: number) => number)) => void
	) => {
		return (props: MFAFlowBaseRenderProps) => {
			const { credentials, mfaState, nav, setIsLoading, isLoading } = props;
			// navigate is now available from component level

			// If device is ACTIVE and we just came from step 2, show success page
			if (mfaState.deviceStatus === 'ACTIVE' && nav.currentStep === 3) {
				// Check if we have deviceRegisteredActive (just registered) or deviceId (device exists)
				if (deviceRegisteredActive || mfaState.deviceId) {
					const activeDevice = deviceRegisteredActive || {
						deviceId: mfaState.deviceId,
						deviceName: mfaState.nickname || credentials.deviceName || 'WHATSAPP',
						deviceType: 'WHATSAPP' as const,
						status: 'ACTIVE' as const,
						username: credentials.username,
						userId: mfaState.userId,
						environmentId: credentials.environmentId,
						createdAt: mfaState.createdAt,
						updatedAt: mfaState.updatedAt,
					};

					// Build success data
					const tempMfaState = {
						deviceId: activeDevice.deviceId,
						deviceStatus: activeDevice.status,
						nickname: activeDevice.deviceName,
						userId: activeDevice.userId,
						environmentId: activeDevice.environmentId,
						createdAt: activeDevice.createdAt,
						updatedAt: activeDevice.updatedAt,
					} as MFAFlowBaseRenderProps['mfaState'];
					const successData = buildSuccessPageData(
						credentials,
						tempMfaState,
						registrationFlowType,
						adminDeviceStatus,
						credentials.tokenType
					);
					// Ensure deviceType is set for documentation button
					successData.deviceType = 'WHATSAPP' as DeviceType;

					// Store in state if not already stored
					if (!deviceRegisteredActive) {
						setDeviceRegisteredActive(activeDevice);
					}

					return (
						<MFASuccessPageV8
							{...props}
							credentials={{ ...credentials, deviceType: 'WHATSAPP' as DeviceType }}
							successData={successData}
							onStartAgain={() => {
								setDeviceRegisteredActive(null);
								nav.goToStep(0);
							}}
						/>
					);
				}
			}

			// Skip step 3 (Send OTP) for ACTIVATION_REQUIRED devices - OTP is sent automatically by PingOne
			// Redirect to step 4 (Validate) instead
			if (
				(mfaState.deviceStatus === 'ACTIVATION_REQUIRED' || mfaState.authenticationId) &&
				nav.currentStep === 3
			) {
				console.log(
					`${MODULE_TAG} Device is ACTIVATION_REQUIRED - skipping Send OTP step, going to Validate step`
				);
				setTimeout(() => {
					setShowValidationModal(true);
					nav.goToStep(4);
				}, 0);
				return (
					<div className="step-content">
						<p>Redirecting to validation step...</p>
					</div>
				);
			}

			const handleSendOTP = async () => {
				await controller.sendOTP(
					credentials,
					mfaState.deviceId,
					{ otpSent, sendError, sendRetryCount },
					(state) => {
						if (typeof state === 'function') {
							const current = { otpSent, sendError, sendRetryCount };
							const updated = state(current);
							setOtpSent(updated.otpSent ?? current.otpSent);
							setSendError(updated.sendError ?? current.sendError);
							setSendRetryCount(updated.sendRetryCount ?? current.sendRetryCount);
						} else {
							if (state.otpSent !== undefined) setOtpSent(state.otpSent);
							if (state.sendError !== undefined) setSendError(state.sendError);
							if (state.sendRetryCount !== undefined) setSendRetryCount(state.sendRetryCount);
						}
					},
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
						<MFAInfoButtonV8 contentKey="factor.whatsapp" displayMode="modal" />
					</h2>
					<p>Send a one-time password to the registered WhatsApp number</p>

					<div className="info-box">
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						<p>
							<strong>Phone Number:</strong> {getContactDisplay(credentials)}
						</p>
						{sendRetryCount > 0 && (
							<p style={{ marginTop: '8px', fontSize: '13px', color: '#92400e' }}>
								⚠️ Attempt {sendRetryCount + 1} - If you continue to have issues, check your phone
								number and try again.
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
								Track PingOne&apos;s real-time status for this authentication by opening the Device
								Authentication Details page.
							</p>
						</div>
					)}

					<div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
						<button
							type="button"
							className="btn btn-primary"
							onClick={handleSendOTP}
							disabled={isLoading}
						>
							{isLoading ? '🔄 Sending...' : otpSent ? '🔄 Resend OTP Code' : 'Send OTP Code'}
						</button>

						{otpSent && (
							<button
								type="button"
								className="btn"
								onClick={() => {
									setOtpSent(false);
									setSendRetryCount(0);
									setSendError(null);
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

					{sendError && (
						<div
							className="info-box"
							style={{
								background: '#fef2f2',
								border: '1px solid #fecaca',
								color: '#991b1b',
								marginTop: '16px',
							}}
						>
							<h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>⚠️ Error Sending OTP</h4>
							<p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{sendError}</p>
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

					{otpSent && !sendError && (
						<div className="success-box" style={{ marginTop: '20px' }}>
							<h3>✅ OTP Sent</h3>
							<p>Check your email for the verification code</p>
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

	// Step 4: Validate OTP (using controller) - Renumbered from Step 3
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
			step4PropsRef.current = props;

			// Close modal when verification is complete (handled in render, not useEffect to avoid Rules of Hooks violation)
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

			// Auto-open validation modal when on step 4 (handled in render, not useEffect to avoid Rules of Hooks violation)
			// But respect if user explicitly closed it
			if (
				!showValidationModal &&
				nav.currentStep === 4 &&
				!mfaState.verificationResult &&
				!userClosedValidationModal
			) {
				// Use setTimeout to avoid state updates during render
				setTimeout(() => {
					setShowValidationModal(true);
				}, 0);
			}

			// Reset closed flag when step changes away from 4
			if (nav.currentStep !== 4 && userClosedValidationModal) {
				setUserClosedValidationModal(false);
			}

			// If validation is complete, show success screen using shared service
			// Close modal and show success page directly in step 4 (like SMS flow)
			if (
				mfaState.verificationResult &&
				(mfaState.verificationResult.status === 'COMPLETED' ||
					mfaState.verificationResult.status === 'SUCCESS')
			) {
				const successData = buildSuccessPageData(
					credentials,
					mfaState,
					registrationFlowType,
					adminDeviceStatus,
					credentials.tokenType
				);
				// Ensure deviceType is set for documentation button
				successData.deviceType = 'WHATSAPP' as DeviceType;
				return (
					<MFASuccessPageV8
						{...props}
						credentials={{ ...credentials, deviceType: 'WHATSAPP' as DeviceType }}
						successData={successData}
						onStartAgain={() => navigateToMfaHubWithCleanup(navigate)}
					/>
				);
			}

			// If device is ACTIVE and we're on step 4, show success page instead of redirecting
			if (mfaState.deviceStatus === 'ACTIVE' && nav.currentStep === 4) {
				// Check if we have deviceRegisteredActive (just registered) or verificationResult (just activated)
				if (deviceRegisteredActive || mfaState.verificationResult) {
					const successData = buildSuccessPageData(
						credentials,
						mfaState,
						registrationFlowType,
						adminDeviceStatus,
						credentials.tokenType
					);
					// Ensure deviceType is set for documentation button
					successData.deviceType = 'WHATSAPP' as DeviceType;
					return (
						<MFASuccessPageV8
							{...props}
							credentials={{ ...credentials, deviceType: 'WHATSAPP' as DeviceType }}
							successData={successData}
							onStartAgain={() => navigateToMfaHubWithCleanup(navigate)}
						/>
					);
				}
				// If no success state, device was already active - navigate back to device selection
				// Use setTimeout to avoid state updates during render (moved from useEffect to avoid Rules of Hooks violation)
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
						zIndex: 10000, // Ensure modal overlay is above API display (100 < 10000)
						pointerEvents: 'auto',
					}}
					onClick={() => {
						// Don't close on backdrop click - require explicit action
					}}
					onMouseDown={(e) => {
						// Prevent overlay from interfering with drag
						if (e.target === e.currentTarget) {
							e.preventDefault();
						}
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
							pointerEvents: 'auto',
							position:
								step4ModalDrag.modalPosition.x !== 0 || step4ModalDrag.modalPosition.y !== 0
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
									step4ModalDrag.handleMouseDown(e);
								}
							}}
							style={{
								background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
								padding: '16px 20px 12px 20px',
								textAlign: 'center',
								position: 'relative',
								cursor: step4ModalDrag.isDragging ? 'grabbing' : 'grab',
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
									setShowValidationModal(false);
									setUserClosedValidationModal(true); // Track that user explicitly closed modal
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
											console.log(`${MODULE_TAG} 🔍 OTP Validation Check:`, {
												hasDeviceActivateUri: !!mfaState.deviceActivateUri,
												deviceActivateUri: mfaState.deviceActivateUri || 'NOT SET',
												deviceStatus: mfaState.deviceStatus,
												deviceId: mfaState.deviceId,
												isActivationRequired,
												'Will use': isActivationRequired
													? 'activateDevice'
													: mfaState.deviceActivateUri
														? 'activateDevice'
														: 'validateOTP',
											});

											// For ACTIVATION_REQUIRED devices, always use activateDevice
											if (isActivationRequired || mfaState.deviceActivateUri) {
												// Device activation flow (registration)
												setIsLoading(true);
												try {
													const deviceActivateUri = mfaState.deviceActivateUri;
													if (
														!deviceActivateUri &&
														isActivationRequired &&
														mfaState.deviceId &&
														credentials.environmentId
													) {
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

													console.log(`${MODULE_TAG} Device activated successfully`, {
														deviceId: mfaState.deviceId,
														status: activationResult.status,
													});

													setMfaState((prev) => ({
														...prev,
														deviceStatus: (activationResult.status as string) || 'ACTIVE',
														verificationResult: {
															status: 'COMPLETED',
															message: 'Device activated successfully',
														},
													}));

													nav.markStepComplete();
													nav.goToStep(5);
													toastV8.success('Device activated successfully!');
												} catch (error) {
													const errorMessage =
														error instanceof Error ? error.message : 'Unknown error';
													console.error(`${MODULE_TAG} Failed to activate device:`, error);
													setValidationAttempts((prev) => prev + 1);
													setLastValidationError(errorMessage);
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
									}}
								>
									{isLoading
										? '🔄 Sending...'
										: otpState.canResend
											? '🔄 Resend OTP Code'
											: `🔄 Resend in ${otpState.resendCooldown}s`}
								</button>
							</div>

							{/* Error Display */}
							{validationAttempts > 0 && (
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
									<p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
										{lastValidationError || 'OTP code invalid'}
									</p>
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
				deviceType="WHATSAPP"
				renderStep0={createRenderStep0(
					isConfigured,
					location,
					credentialsUpdatedRef,
					registrationFlowType,
					setRegistrationFlowType,
					adminDeviceStatus,
					setAdminDeviceStatus,
					step0PropsRef,
					setLastTokenType,
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
					validationState.validationError,
					(v) => setValidationState({ ...validationState, validationError: v }),
					validationState.showValidationModal,
					setShowValidationModal
				)}
				renderStep4={createRenderStep4(
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
					mfaState.deviceStatus === 'ACTIVATION_REQUIRED' || mfaState.authenticationId
						? ['Configure', 'Select Device', 'Register Device', 'Validate']
						: ['Configure', 'Select Device', 'Register Device', 'Send OTP', 'Validate']
				}
				shouldHideNextButton={(props) => {
					// Hide final button on success step (step 4) - we have our own "Start Again" button
					if (props.nav.currentStep === 4) {
						return true;
					}
					return false;
				}}
			/>
			<WhatsAppNotEnabledModalV8
				isOpen={showWhatsAppNotEnabledModal}
				onClose={() => setShowWhatsAppNotEnabledModal(false)}
				environmentId={credentialsForModal.environmentId}
			/>
			<SuperSimpleApiDisplayV8 flowFilter="mfa" />
		</div>
	);
};

// Main WhatsApp Flow Component
export const WhatsAppFlowV8: React.FC = () => {
	return <WhatsAppFlowV8WithDeviceSelection />;
};
