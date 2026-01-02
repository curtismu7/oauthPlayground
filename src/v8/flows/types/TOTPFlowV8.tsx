/**
 * @file TOTPFlowV8.tsx
 * @module v8/flows/types
 * @description TOTP-specific MFA flow component (Refactored with Controller Pattern)
 * @version 8.3.0
 * 
 * TOTP Flow Structure (5 Steps):
 * - Step 0: Configure
 * - Step 1: Select Device
 * - Step 2: Register Device (Modal - no contact input, only device name)
 * - Step 3: Scan QR Code & Activate (Modal - ALWAYS shown, activation OTP only if ACTIVATION_REQUIRED)
 * - Step 4: Validate (Modal - for authentication after device is activated)
 */

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { MFAFlowBaseV8, type MFAFlowBaseRenderProps } from '../shared/MFAFlowBaseV8';
import type { MFACredentials } from '../shared/MFATypes';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { MFAFlowControllerFactory } from '../factories/MFAFlowControllerFactory';
import { MFADeviceSelector } from '../components/MFADeviceSelector';
import { MFAOTPInput } from '../components/MFAOTPInput';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { FiShield, FiX } from 'react-icons/fi';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { MFAConfigurationStepV8 } from '../shared/MFAConfigurationStepV8';
import { MFASuccessPageV8, buildSuccessPageData } from '../shared/mfaSuccessPageServiceV8';
import { navigateToMfaHubWithCleanup } from '@/v8/utils/mfaFlowCleanupV8';
import { useDraggableModal } from '@/v8/hooks/useDraggableModal';

const MODULE_TAG = '[🔐 TOTP-FLOW-V8]';

interface TOTPConfigureStepProps extends MFAFlowBaseRenderProps {
	registrationFlowType?: 'admin' | 'user';
	setRegistrationFlowType?: (type: 'admin' | 'user') => void;
	adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
	setAdminDeviceStatus?: (status: 'ACTIVE' | 'ACTIVATION_REQUIRED') => void;
}

const TOTPConfigureStep: React.FC<TOTPConfigureStepProps> = (props) => {
	const { registrationFlowType = 'admin', setRegistrationFlowType, adminDeviceStatus = 'ACTIVE', setAdminDeviceStatus } = props;

	// Ref to prevent infinite loops in bidirectional sync
	const isSyncingRef = React.useRef(false);

	// Bidirectional sync between Registration Flow Type and tokenType dropdown
	React.useEffect(() => {
		if (isSyncingRef.current) return;
		
		// User Flow: Uses User Token (from OAuth login), always set status to ACTIVATION_REQUIRED
		// Admin Flow: Uses Worker Token, can choose ACTIVE or ACTIVATION_REQUIRED
		if (registrationFlowType === 'user' && props.credentials.tokenType !== 'user') {
			console.log(`${MODULE_TAG} User Flow selected - ensuring User Token is used`);
			isSyncingRef.current = true;
			props.setCredentials((prev) => ({
				...prev,
				tokenType: 'user',
			}));
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		} else if (registrationFlowType === 'admin' && props.credentials.tokenType !== 'worker') {
			console.log(`${MODULE_TAG} Admin Flow selected - ensuring Worker Token is used`);
			isSyncingRef.current = true;
			if (props.showUserLoginModal) {
				props.setShowUserLoginModal(false);
			}
			props.setCredentials((prev) => ({
				...prev,
				tokenType: 'worker',
				userToken: '',
			}));
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		}
	}, [registrationFlowType, props.credentials.tokenType, props.showUserLoginModal, props.setCredentials, props.setShowUserLoginModal]);

	// When tokenType dropdown changes, sync to Registration Flow Type
	React.useEffect(() => {
		if (isSyncingRef.current) return;
		
		if (props.credentials.tokenType === 'worker' && registrationFlowType === 'user') {
			console.log(`${MODULE_TAG} Token type is 'worker' but User Flow is selected - switching to Admin Flow`);
			setRegistrationFlowType?.('admin');
			return;
		} else if (props.credentials.tokenType === 'user' && registrationFlowType === 'admin') {
			console.log(`${MODULE_TAG} Token type is 'user' but Admin Flow is selected - switching to User Flow`);
			setRegistrationFlowType?.('user');
			return;
		} else if (props.credentials.tokenType === 'worker' && registrationFlowType !== 'admin') {
			isSyncingRef.current = true;
			setRegistrationFlowType?.('admin');
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		}
	}, [props.credentials.tokenType, registrationFlowType, setRegistrationFlowType]);

	return (
		<>
			{/* Registration Flow Type Selection */}
			<div style={{ 
				marginBottom: '28px',
				padding: '20px',
				background: '#ffffff',
				borderRadius: '8px',
				border: '1px solid #e5e7eb',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
			}}>
				{/* biome-ignore lint/a11y/noLabelWithoutControl: Label is for visual grouping, inputs are inside */}
				<label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
					Registration Flow Type
					<MFAInfoButtonV8 contentKey="mfa.registrationFlowType" displayMode="tooltip" />
				</label>
				<div style={{ display: 'flex', gap: '16px' }}>
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: Radio button inside handles keyboard events */}
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
									Using Worker Token
								</div>
							</div>
						</div>
						{registrationFlowType === 'admin' && (
							<div style={{ marginLeft: '28px', marginTop: '8px' }}>
								{/* biome-ignore lint/a11y/noLabelWithoutControl: Label is for visual grouping, inputs are below */}
								<label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
									Device Status:
								</label>
								<div style={{ display: 'flex', gap: '12px' }}>
									<label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
										<input
											type="radio"
											name="admin-device-status"
											value="ACTIVE"
											checked={adminDeviceStatus === 'ACTIVE'}
											onChange={() => setAdminDeviceStatus?.('ACTIVE')}
											style={{ margin: 0, cursor: 'pointer' }}
										/>
										<span style={{ fontSize: '13px', color: '#374151' }}>ACTIVE</span>
									</label>
									<label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
										<input
											type="radio"
											name="admin-device-status"
											value="ACTIVATION_REQUIRED"
											checked={adminDeviceStatus === 'ACTIVATION_REQUIRED'}
											onChange={() => setAdminDeviceStatus?.('ACTIVATION_REQUIRED')}
											style={{ margin: 0, cursor: 'pointer' }}
										/>
										<span style={{ fontSize: '13px', color: '#374151' }}>ACTIVATION_REQUIRED</span>
									</label>
								</div>
							</div>
						)}
					</label>
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: Radio button inside handles keyboard events */}
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
							<strong style={{ color: '#f59e0b' }}>ACTIVATION_REQUIRED</strong> - OTP validation required for device activation
						</div>
					</label>
				</div>
				<small style={{ display: 'block', marginTop: '12px', fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
					Admin Flow allows choosing device status (ACTIVE or ACTIVATION_REQUIRED). User Flow always requires activation.
				</small>
			</div>
			
			<MFAConfigurationStepV8
				{...props}
				deviceType="TOTP"
				deviceTypeLabel="TOTP"
				policyDescription="Determines which PingOne policy governs TOTP challenges."
			/>
		</>
	);
};

// Step 0: Configure Credentials (TOTP-specific - includes flow selection)
const createRenderStep0 = (
	isConfigured: boolean, 
	location: ReturnType<typeof useLocation>, 
	credentialsUpdatedRef: React.MutableRefObject<boolean>,
	registrationFlowType: 'admin' | 'user',
	setRegistrationFlowType: (type: 'admin' | 'user') => void,
	adminDeviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED',
	setAdminDeviceStatus: (status: 'ACTIVE' | 'ACTIVATION_REQUIRED') => void
) => {
	return (props: MFAFlowBaseRenderProps) => {
		const { nav, credentials, setCredentials } = props;
		const locationState = location.state as { 
			configured?: boolean; 
			deviceAuthenticationPolicyId?: string;
			policyName?: string;
		} | null;
		
		// Update credentials with policy ID from location.state if available (only once)
		if (!credentialsUpdatedRef.current && locationState?.deviceAuthenticationPolicyId && 
			credentials.deviceAuthenticationPolicyId !== locationState.deviceAuthenticationPolicyId) {
			setCredentials({
				...credentials,
				deviceAuthenticationPolicyId: locationState.deviceAuthenticationPolicyId,
			});
			credentialsUpdatedRef.current = true;
		}
		
		// If coming from config page, skip step 0 and go to step 1
		if (isConfigured && nav.currentStep === 0) {
			setTimeout(() => {
				nav.goToStep(1);
			}, 0);
			return null;
		}
		
		return (
			<TOTPConfigureStep
				{...props}
				registrationFlowType={registrationFlowType}
				setRegistrationFlowType={setRegistrationFlowType}
				adminDeviceStatus={adminDeviceStatus}
				setAdminDeviceStatus={setAdminDeviceStatus}
			/>
		);
	};
};

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

// Device selection state management wrapper
const TOTPFlowV8WithDeviceSelection: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const isConfigured = (location.state as { configured?: boolean })?.configured === true;
	const credentialsUpdatedRef = React.useRef(false);
	
	// Initialize controller using factory
	const controller = useMemo(() => 
		MFAFlowControllerFactory.create({ deviceType: 'TOTP' }), []
	);

	// Device selection state
	const [deviceSelection, setDeviceSelection] = useState({
		existingDevices: [] as Array<Record<string, unknown>>,
		loadingDevices: false,
		selectedExistingDevice: '',
		showRegisterForm: false,
	});

	// TOTP-specific state (QR code, secret)
	const [totpSecret, setTotpSecret] = useState<string>('');
	const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

	// Validation state
	const [validationState, setValidationState] = useState({
		validationAttempts: 0,
		lastValidationError: null as string | null,
	});

	// Modal state for step 2 registration
	const [showModal, setShowModal] = useState(true);
	
	// Modal state for step 3 QR code
	const [showQrModal, setShowQrModal] = useState(true);
	
	// Modal state for step 4 OTP validation
	const [showValidationModal, setShowValidationModal] = useState(true);

	// TOTP activation OTP state (for Step 3)
	const [activationOtp, setActivationOtp] = useState('');
	const [activationError, setActivationError] = useState<string | null>(null);

	// Track successful registration
	const [deviceRegisteredActive, setDeviceRegisteredActive] = useState<{
		deviceId: string;
		deviceName: string;
		deviceType: 'TOTP';
		status: 'ACTIVE' | 'ACTIVATION_REQUIRED';
		username?: string;
		userId?: string;
		createdAt?: string;
		updatedAt?: string;
		environmentId?: string;
	} | null>(null);

	// Track API display visibility and height for dynamic padding
	const [isApiDisplayVisible, setIsApiDisplayVisible] = useState(false);
	const [apiDisplayHeight, setApiDisplayHeight] = useState(0);

	// Device registration flow type: 'admin' (can choose ACTIVE or ACTIVATION_REQUIRED) or 'user' (always ACTIVATION_REQUIRED)
	const initialLocationState = location.state as { 
		registrationFlowType?: 'admin' | 'user';
		adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
	} | null;
	const [registrationFlowType, setRegistrationFlowType] = useState<'admin' | 'user'>(
		initialLocationState?.registrationFlowType || 'admin'
	);
	const [adminDeviceStatus, setAdminDeviceStatus] = useState<'ACTIVE' | 'ACTIVATION_REQUIRED'>(
		initialLocationState?.adminDeviceStatus || 'ACTIVE'
	);

	useEffect(() => {
		const checkVisibility = () => {
			setIsApiDisplayVisible(apiDisplayServiceV8.isVisible());
		};

		checkVisibility();
		const unsubscribe = apiDisplayServiceV8.subscribe(checkVisibility);
		return () => unsubscribe();
	}, []);

	// Observe API Display height changes for dynamic padding
	useEffect(() => {
		if (!isApiDisplayVisible) {
			setApiDisplayHeight(0);
			return;
		}

		const updateHeight = () => {
			const apiDisplayElement = document.querySelector('.super-simple-api-display') as HTMLElement;
			if (apiDisplayElement) {
				const rect = apiDisplayElement.getBoundingClientRect();
				const height = rect.height;
				setApiDisplayHeight(height > 0 ? height : apiDisplayElement.offsetHeight);
			}
		};

		const initialTimeout = setTimeout(updateHeight, 100);
		const resizeObserver = new ResizeObserver(() => {
			updateHeight();
		});

		const apiDisplayElement = document.querySelector('.super-simple-api-display');
		if (apiDisplayElement) {
			resizeObserver.observe(apiDisplayElement);
		}

		return () => {
			clearTimeout(initialTimeout);
			resizeObserver.disconnect();
		};
	}, [isApiDisplayVisible]);

	// State to trigger device loading - updated from render function
	const [deviceLoadTrigger, setDeviceLoadTrigger] = useState<{
		currentStep: number;
		environmentId: string;
		username: string;
		tokenValid: boolean;
	} | null>(null);

	// Load devices when entering step 1 - moved to parent component level
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
			if (!deviceLoadTrigger.environmentId || !deviceLoadTrigger.username || !deviceLoadTrigger.tokenValid) {
				return;
			}

			if (deviceLoadTrigger.currentStep === 1 && deviceSelection.existingDevices.length === 0 && !deviceSelection.loadingDevices) {
				setDeviceSelection((prev) => ({ ...prev, loadingDevices: true }));

				try {
					const credentials: MFACredentials = {
						environmentId: deviceLoadTrigger.environmentId,
						username: deviceLoadTrigger.username,
						clientId: '',
						deviceType: 'TOTP',
						countryCode: '',
						phoneNumber: '',
						email: '',
						deviceName: '',
						deviceAuthenticationPolicyId: '',
					};
					const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
					const devices = await controller.loadExistingDevices(credentials, tokenStatus);
					setDeviceSelection({
						existingDevices: devices,
						loadingDevices: false,
						selectedExistingDevice: devices.length === 0 ? 'new' : '',
						showRegisterForm: devices.length === 0,
					});
				} catch (error) {
					console.error(`${MODULE_TAG} Failed to load devices`, error);
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
	}, [deviceLoadTrigger?.currentStep, deviceLoadTrigger?.environmentId, deviceLoadTrigger?.username, deviceLoadTrigger?.tokenValid, isConfigured, controller, deviceSelection.existingDevices.length, deviceSelection.loadingDevices]);

	// Step 1: Device Selection (inline, similar to SMS)
	const renderStep1WithSelection = (props: MFAFlowBaseRenderProps) => {
		const { credentials, setCredentials, mfaState, setMfaState, nav, setIsLoading, isLoading, setShowDeviceLimitModal, tokenStatus } = props;

		// During registration flow (from config page), skip device selection and go straight to registration
		if (isConfigured && nav.currentStep === 1) {
			setTimeout(() => {
				nav.goToStep(2);
			}, 0);
			return null;
		}

		// Update trigger state for device loading effect
		if (nav.currentStep === 1) {
			const newTrigger = {
				currentStep: nav.currentStep,
				environmentId: credentials.environmentId || '',
				username: credentials.username || '',
				tokenValid: tokenStatus.isValid,
			};
			if (
				!deviceLoadTrigger ||
				deviceLoadTrigger.currentStep !== newTrigger.currentStep ||
				deviceLoadTrigger.environmentId !== newTrigger.environmentId ||
				deviceLoadTrigger.username !== newTrigger.username ||
				deviceLoadTrigger.tokenValid !== newTrigger.tokenValid
			) {
				setDeviceLoadTrigger(newTrigger);
			}
		}

		// Handle selecting an existing device
		const handleSelectExistingDevice = (deviceId: string) => {
			setDeviceSelection((prev) => ({
				...prev,
				selectedExistingDevice: deviceId,
				showRegisterForm: false,
			}));
			const device = deviceSelection.existingDevices.find((d: Record<string, unknown>) => d.id === deviceId);
			if (device) {
				setMfaState({
					...mfaState,
					deviceId: deviceId,
					deviceStatus: (device.status as string) || 'ACTIVE',
					nickname: (device.nickname as string) || (device.name as string) || '',
				});
			}
		};

		// Handle selecting "new device"
		const handleSelectNewDevice = () => {
			setDeviceSelection((prev) => ({
				...prev,
				selectedExistingDevice: 'new',
				showRegisterForm: true,
			}));
			setMfaState({
				...mfaState,
				deviceId: '',
				deviceStatus: '',
			});
			if (!credentials.deviceName?.trim()) {
				setCredentials({
					...credentials,
					deviceName: 'TOTP',
				});
			}
		};

		// Handle using selected existing device - trigger authentication flow
		const handleUseSelectedDevice = async () => {
			if (deviceSelection.selectedExistingDevice && deviceSelection.selectedExistingDevice !== 'new') {
				const device = deviceSelection.existingDevices.find((d: Record<string, unknown>) => d.id === deviceSelection.selectedExistingDevice);
				if (!device) {
					toastV8.error('Device not found');
					return;
				}

				setIsLoading(true);
				try {
					const authResult = await controller.initializeDeviceAuthentication(
						credentials,
						deviceSelection.selectedExistingDevice
					);

					setMfaState((prev) => ({
						...prev,
						deviceId: deviceSelection.selectedExistingDevice,
						nickname: (device.nickname as string) || (device.name as string) || '',
						authenticationId: authResult.authenticationId,
						deviceAuthId: authResult.authenticationId,
						environmentId: credentials.environmentId,
						nextStep: authResult.nextStep || '',
					}));

					if (authResult.nextStep === 'COMPLETED') {
						nav.markStepComplete();
						nav.goToStep(4);
						toastV8.success('Authentication successful!');
					} else if (authResult.nextStep === 'OTP_REQUIRED') {
						nav.markStepComplete();
						nav.goToStep(4);
						toastV8.success('Device selected. Please enter the TOTP code from your authenticator app.');
					} else {
						nav.markStepComplete();
						nav.goToStep(4);
						toastV8.success('Device selected successfully!');
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					console.error(`${MODULE_TAG} Failed to initialize authentication:`, error);
					nav.setValidationErrors([`Failed to authenticate: ${errorMessage}`]);
					toastV8.error(`Authentication failed: ${errorMessage}`);
				} finally {
					setIsLoading(false);
				}
			}
		};

		return (
			<div className="step-content">
				<h2>Select TOTP Device</h2>
				<p>Choose an existing device or register a new authenticator app</p>

				<MFADeviceSelector
					devices={deviceSelection.existingDevices as Array<{ id: string; type: string; nickname?: string; name?: string; status?: string }>}
					loading={deviceSelection.loadingDevices}
					selectedDeviceId={deviceSelection.selectedExistingDevice}
					deviceType="TOTP"
					onSelectDevice={handleSelectExistingDevice}
					onSelectNew={handleSelectNewDevice}
					onUseSelected={handleUseSelectedDevice}
					renderDeviceInfo={(device) => (
						<>
							{device.status && `Status: ${device.status}`}
						</>
					)}
				/>
			</div>
		);
	};

	// Draggable modal hooks
	const step2ModalDrag = useDraggableModal(showModal);
	const step3ModalDrag = useDraggableModal(showQrModal);
	const step4ModalDrag = useDraggableModal(showValidationModal);

	// Step 2: Register Device (Modal - no contact input, only device name)
	const renderStep2Register = useCallback((props: MFAFlowBaseRenderProps) => {
		const { credentials, setCredentials, mfaState, setMfaState, nav, setIsLoading, isLoading, setShowDeviceLimitModal, tokenStatus } = props;

		// Handle device registration
		const handleRegisterDevice = async () => {
			const userEnteredDeviceName = credentials.deviceName?.trim();
			if (!userEnteredDeviceName) {
				nav.setValidationErrors(['Device name is required. Please enter a name for this device.']);
				return;
			}

			setIsLoading(true);
			try {
				const registrationCredentials = {
					...credentials,
					deviceName: userEnteredDeviceName,
				};
				
				// Determine device status based on flow type
				const deviceStatus = registrationFlowType === 'user' ? 'ACTIVATION_REQUIRED' : adminDeviceStatus;
				
				const result = await controller.registerDevice(
					registrationCredentials, 
					controller.getDeviceRegistrationParams(registrationCredentials, deviceStatus)
				);
				
				// Extract secret and keyUri from response
				const deviceResponse = result as Record<string, unknown> & {
					secret?: string;
					keyUri?: string;
				};

				// Store TOTP-specific data (both in local state and mfaState)
				const secret = deviceResponse.secret as string | undefined;
				const keyUri = deviceResponse.keyUri as string | undefined;
				
				if (secret) {
					setTotpSecret(secret);
				}
				if (keyUri) {
					setQrCodeUrl(keyUri);
				}

				setMfaState({
					...mfaState,
					deviceId: result.deviceId,
					deviceStatus: result.status,
					totpSecret: secret,
					qrCodeUrl: keyUri,
					// Also store as secret/keyUri for buildSuccessPageData compatibility
					...(secret ? { secret } : {}),
					...(keyUri ? { keyUri } : {}),
				});

				// Refresh device list
				const devices = await controller.loadExistingDevices(registrationCredentials, tokenStatus);
				setDeviceSelection((prev) => ({
					...prev,
					existingDevices: devices,
				}));

				// CRITICAL: ALWAYS show QR code modal (Step 3) after registration
				// Navigate to Step 3 regardless of device status
				nav.markStepComplete();
				setShowModal(false);
				setTimeout(() => {
					nav.goToStep(3);
				}, 0);
				toastV8.info('Device registered. Scan the QR code to complete setup.');
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				const isDeviceLimitError =
					errorMessage.toLowerCase().includes('exceed') ||
					errorMessage.toLowerCase().includes('limit') ||
					errorMessage.toLowerCase().includes('maximum');

				if (isDeviceLimitError) {
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

		// If we're on Step 3 or 4, don't render Step 2 content
		if (nav.currentStep === 3 || nav.currentStep === 4) {
			return null;
		}

		// If modal is closed, show message
		if (!showModal && nav.currentStep !== 3 && nav.currentStep !== 4) {
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

		const hasPosition = step2ModalDrag.modalPosition.x !== 0 || step2ModalDrag.modalPosition.y !== 0;
		const isValidForm = credentials.deviceName?.trim();

		return (
			<>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: Modal overlay needs click handler */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal overlay click handled by modal content */}
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
					// Don't close on backdrop click
				}}
			>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: Modal content needs click handler */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal content click handled by buttons */}
				<div
					ref={step2ModalDrag.modalRef}
					style={{
						background: 'white',
						borderRadius: '16px',
						padding: '0',
						maxWidth: '550px',
						width: '90%',
						boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
						overflow: 'hidden',
						...step2ModalDrag.modalStyle,
					}}
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header with Logo */}
						{/* biome-ignore lint/a11y/noStaticElementInteractions: Draggable modal header */}
					<div
						onMouseDown={step2ModalDrag.handleMouseDown}
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
							Register TOTP Device
						</h3>
						<p
							style={{
								margin: '4px 0 0 0',
								fontSize: '12px',
								color: 'rgba(255, 255, 255, 0.9)',
								textAlign: 'center',
							}}
						>
							Add a new authenticator app device
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

						{/* Device Name Field */}
						<div style={{ marginBottom: '24px' }}>
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
								value={credentials.deviceName || 'TOTP'}
								onChange={(e) => {
									setCredentials({ ...credentials, deviceName: e.target.value });
								}}
								placeholder="TOTP Device"
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
							<small style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#6b7280' }}>
								Enter a friendly name to identify this device (e.g., "My Authenticator App")
							</small>
						</div>

						{/* Worker Token Status */}
						<div style={{ marginBottom: '16px', padding: '10px 12px', background: tokenStatus.isValid ? '#d1fae5' : '#fee2e2', border: `1px solid ${tokenStatus.isValid ? '#10b981' : '#ef4444'}`, borderRadius: '6px' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<span style={{ fontSize: '16px' }}>{tokenStatus.isValid ? '✅' : '⚠️'}</span>
								<span style={{ fontSize: '14px', color: tokenStatus.isValid ? '#065f46' : '#991b1b', fontWeight: '500' }}>
									{tokenStatus.isValid ? tokenStatus.message || 'Worker token valid' : tokenStatus.message || 'Worker token required'}
								</span>
							</div>
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
							>
								{isLoading ? '🔄 Registering...' : 'Register TOTP Device →'}
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}, [showModal, step2ModalDrag, controller, navigate]);

	// Step 3: Scan QR Code & Activate (Modal - ALWAYS shown, activation OTP only if ACTIVATION_REQUIRED)
	const renderStep3QrCode = useCallback((props: MFAFlowBaseRenderProps) => {
		const { credentials, mfaState, setMfaState, nav, setIsLoading, isLoading } = props;

		// CRITICAL: ALWAYS show QR code modal if we have device ID and QR code/secret
		// Use mfaState as fallback if local state is empty (for consistency)
		const currentQrCodeUrl = qrCodeUrl || mfaState.qrCodeUrl || '';
		const currentTotpSecret = totpSecret || mfaState.totpSecret || '';
		const shouldShowQrCode = mfaState.deviceId && (currentQrCodeUrl || currentTotpSecret);
		const isActivationRequired = mfaState.deviceStatus === 'ACTIVATION_REQUIRED';

		// Handle TOTP device activation (only if ACTIVATION_REQUIRED)
		const handleActivateDevice = async () => {
			if (!activationOtp || activationOtp.length !== 6) {
				setActivationError('Please enter a valid 6-digit code');
				return;
			}

			if (!mfaState.deviceId) {
				setActivationError('Device ID is missing');
				return;
			}

			setIsLoading(true);
			setActivationError(null);

			try {
				const activationResult = await MFAServiceV8.activateTOTPDevice({
					environmentId: credentials.environmentId,
					username: credentials.username,
					deviceId: mfaState.deviceId,
					otp: activationOtp,
				});

				setMfaState((prev) => ({
					...prev,
					deviceStatus: (activationResult.status as string) || 'ACTIVE',
				}));

				// Clear activation OTP state
				setActivationOtp('');
				setActivationError(null);

				nav.markStepComplete();
				setShowQrModal(false);
				setTimeout(() => {
					nav.goToStep(4);
				}, 0);
				toastV8.success('TOTP device activated successfully!');
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				console.error(`${MODULE_TAG} Failed to activate TOTP device:`, error);
				setActivationError(errorMessage);
				toastV8.error(`Activation failed: ${errorMessage}`);
			} finally {
				setIsLoading(false);
			}
		};

		// Handle "Continue" button (if device is already ACTIVE)
		const handleContinue = () => {
			setShowQrModal(false);
			nav.markStepComplete();
			setTimeout(() => {
				nav.goToStep(4);
			}, 0);
		};

		// If we don't have QR code data, don't render
		if (!shouldShowQrCode) {
			return null;
		}

		// If we're on Step 4, don't render Step 3 content
		if (nav.currentStep === 4) {
			return null;
		}

		// If modal is closed, show message
		if (!showQrModal && nav.currentStep !== 4) {
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
						QR Code modal closed. Click below to reopen.
					</p>
					<button
						type="button"
						onClick={() => {
							setShowQrModal(true);
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
						Open QR Code
					</button>
				</div>
			);
		}

		const hasPosition = step3ModalDrag.modalPosition.x !== 0 || step3ModalDrag.modalPosition.y !== 0;

		return (
			<>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: Modal overlay needs click handler */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal overlay click handled by modal content */}
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
					// Don't close on backdrop click
				}}
			>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: Modal content needs click handler */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal content click handled by buttons */}
				<div
					ref={step3ModalDrag.modalRef}
					style={{
						background: 'white',
						borderRadius: '16px',
						padding: '0',
						maxWidth: '600px',
						width: '90%',
						boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
						overflow: 'hidden',
						...step3ModalDrag.modalStyle,
					}}
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header with Logo */}
						{/* biome-ignore lint/a11y/noStaticElementInteractions: Draggable modal header */}
					<div
						onMouseDown={step3ModalDrag.handleMouseDown}
						style={{
							background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
								setShowQrModal(false);
								if (isActivationRequired) {
									// Don't allow closing if activation is required
									setShowQrModal(true);
									toastV8.warning('Please activate the device before proceeding');
									return;
								}
								handleContinue();
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
							Setup TOTP Device
						</h3>
						<p
							style={{
								margin: '4px 0 0 0',
								fontSize: '12px',
								color: 'rgba(255, 255, 255, 0.9)',
								textAlign: 'center',
							}}
						>
							Scan the QR code with your authenticator app
						</p>
					</div>

					{/* Modal Body */}
					<div style={{ padding: '20px' }}>
					{/* QR Code Display */}
					{currentQrCodeUrl && (
						<div style={{ marginBottom: '20px', textAlign: 'center' }}>
							<div style={{ 
								display: 'inline-block', 
								padding: '16px', 
								background: 'white', 
								border: '1px solid #d1d5db', 
								borderRadius: '8px',
								marginBottom: '12px',
							}}>
								<QRCodeSVG 
									value={currentQrCodeUrl} 
									size={256}
									level="M"
									includeMargin={true}
								/>
							</div>
							<p style={{ marginTop: '12px', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
								Scan this code with your authenticator app
							</p>
							<p style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
								(Google Authenticator, Authy, Microsoft Authenticator, etc.)
							</p>
						</div>
					)}

					{/* Manual Secret Entry Section */}
					{currentTotpSecret && (
							<div style={{ marginBottom: '20px', padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
								<details>
									<summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
										Can't scan? Use manual setup
									</summary>
									<div style={{ marginTop: '12px' }}>
										<p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>
											🔑 Secret Key:
										</p>
										<p style={{ margin: '0', fontFamily: 'monospace', fontSize: '14px', wordBreak: 'break-all', color: '#1f2937', background: 'white', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
											{currentTotpSecret}
										</p>
										<p style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
											Enter this secret in your authenticator app manually. Choose "Time-based" and 6 digits.
										</p>
									</div>
								</details>
							</div>
						)}

						{/* Activation OTP Input (only shown if ACTIVATION_REQUIRED) */}
						{isActivationRequired && (
							<div style={{ marginBottom: '20px' }}>
								<label
									htmlFor="activation-otp"
									style={{
										display: 'block',
										marginBottom: '8px',
										fontSize: '14px',
										fontWeight: '600',
										color: '#374151',
									}}
								>
									Enter 6-digit code from your authenticator app:
								</label>
								<MFAOTPInput
									value={activationOtp}
									onChange={setActivationOtp}
									maxLength={6}
									placeholder="000000"
									disabled={isLoading}
								/>
								{activationError && (
									<div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '13px' }}>
										<strong>Error:</strong> {activationError}
									</div>
								)}
							</div>
						)}

						{/* Action Buttons */}
						<div style={{ display: 'flex', gap: '12px' }}>
							{isActivationRequired ? (
								<>
									<button
										type="button"
										onClick={() => {
											setShowQrModal(false);
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
										disabled={isLoading || activationOtp.length !== 6}
										onClick={handleActivateDevice}
										style={{
											flex: 2,
											padding: '12px 20px',
											background: activationOtp.length === 6 && !isLoading ? '#10b981' : '#d1d5db',
											color: 'white',
											border: 'none',
											borderRadius: '8px',
											fontSize: '15px',
											fontWeight: '600',
											cursor: activationOtp.length === 6 && !isLoading ? 'pointer' : 'not-allowed',
											boxShadow: activationOtp.length === 6 && !isLoading ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
										}}
									>
										{isLoading ? '🔄 Activating...' : 'Activate Device →'}
									</button>
								</>
							) : (
								<button
									type="button"
									onClick={handleContinue}
									style={{
										width: '100%',
										padding: '12px 20px',
										background: '#10b981',
										color: 'white',
										border: 'none',
										borderRadius: '8px',
										fontSize: '15px',
										fontWeight: '600',
										cursor: 'pointer',
										boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
									}}
								>
									Continue →
								</button>
							)}
						</div>

						{/* Info Note */}
						<p style={{ marginTop: '16px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
							💡 <strong>Tip:</strong> The QR code and secret expire after ~30 minutes. If they expire, delete the device and create a new one.
						</p>
					</div>
				</div>
			</div>
		);
	}, [showQrModal, step3ModalDrag, qrCodeUrl, totpSecret, navigate, controller, activationOtp, setActivationOtp, activationError, setActivationError]);

	// Step 4: Validate OTP (Modal - for authentication after device is activated)
	const renderStep4Validate = useCallback((props: MFAFlowBaseRenderProps) => {
		const { credentials, mfaState, setMfaState, nav, setIsLoading, isLoading, tokenStatus } = props;

		// If validation is complete, show success screen
		if (mfaState.verificationResult && mfaState.verificationResult.status === 'COMPLETED') {
			// TOTP flow doesn't use useUnifiedOTPFlow hook, so we need to get flow type from credentials or location state
			const locationState = location.state as { registrationFlowType?: 'admin' | 'user'; adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED' } | null;
			const flowType = locationState?.registrationFlowType || credentials.tokenType === 'user' ? 'user' : 'admin';
			const deviceStatus = locationState?.adminDeviceStatus || 'ACTIVATION_REQUIRED';
			const successData = buildSuccessPageData(credentials, mfaState, flowType, deviceStatus, credentials.tokenType);
			return (
				<MFASuccessPageV8
					{...props}
					successData={successData}
					onStartAgain={() => navigateToMfaHubWithCleanup(navigate)}
				/>
			);
		}

		// Close modal when verification is complete
		if (mfaState.verificationResult && mfaState.verificationResult.status === 'COMPLETED' && showValidationModal) {
			setTimeout(() => {
				setShowValidationModal(false);
			}, 0);
		}

		// If modal is closed but we're on step 4, reopen it
		if (!showValidationModal && nav.currentStep === 4) {
			setTimeout(() => {
				setShowValidationModal(true);
			}, 0);
		}

		// If modal is closed, show message
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

		const hasPosition = step4ModalDrag.modalPosition.x !== 0 || step4ModalDrag.modalPosition.y !== 0;

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
					// Don't close on backdrop click
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
							Enter the code from your authenticator app
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
								Device Name:
							</p>
							<p style={{ margin: '0', fontSize: '11px', fontFamily: 'monospace', color: '#1f2937' }}>
								{mfaState.nickname || 'TOTP Device'}
							</p>
						</div>

						{/* OTP Input */}
						<div style={{ marginBottom: '16px' }}>
							{/* biome-ignore lint/a11y/noLabelWithoutControl: Label is associated with MFAOTPInput component */}
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
								<MFAInfoButtonV8 contentKey="otp.validation" displayMode="tooltip" />
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
									if (!credentials.environmentId?.trim() || !credentials.username?.trim() || !tokenStatus.isValid) {
										nav.setValidationErrors([
											'Missing required configuration. Please ensure Environment ID, Username, and Worker Token are set.'
										]);
										toastV8.error('Cannot validate OTP: Missing required configuration');
										return;
									}

									// Use authentication endpoint if authenticationId exists (existing device)
									if (mfaState.authenticationId) {
										await controller.validateOTPForDevice(
											credentials,
											mfaState.authenticationId,
											mfaState.otpCode,
											mfaState,
											setMfaState,
											validationState,
											(state) => {
												if (typeof state === 'function') {
													const current = validationState;
													const updated = state(current);
													setValidationState({ ...current, ...updated });
												} else {
													setValidationState({ ...validationState, ...state });
												}
											},
											nav,
											setIsLoading
										);
									} else {
										await controller.validateOTP(
											credentials,
											mfaState.deviceId,
											mfaState.otpCode,
											mfaState,
											setMfaState,
											validationState,
											(state) => {
												if (typeof state === 'function') {
													const current = validationState;
													const updated = state(current);
													setValidationState({ ...current, ...updated });
												} else {
													setValidationState({ ...validationState, ...state });
												}
											},
											nav,
											setIsLoading
										);
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
											<li>Make sure you're entering the current code (codes refresh every 30 seconds)</li>
											<li>Verify your device time is synchronized</li>
											<li>Check that you scanned the QR code correctly</li>
											<li>Go back and select a different device if available</li>
										</ul>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}, [showValidationModal, step4ModalDrag, validationState, setValidationState, navigate]);

	// Validation function for Step 0
	const validateStep0 = (
		credentials: MFACredentials,
		tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>,
		nav: ReturnType<typeof useStepNavigationV8>
	): boolean => {
		return controller.validateCredentials(credentials, tokenStatus, nav);
	};

	return (
		<div style={{ 
			minHeight: '100vh',
			paddingBottom: isApiDisplayVisible && apiDisplayHeight > 0 ? `${apiDisplayHeight + 40}px` : '0',
			transition: 'padding-bottom 0.3s ease',
			overflow: 'visible',
		}}>
			<MFAFlowBaseV8
				deviceType="TOTP"
				renderStep0={createRenderStep0(isConfigured, location, credentialsUpdatedRef, registrationFlowType, setRegistrationFlowType, adminDeviceStatus, setAdminDeviceStatus)}
				renderStep1={renderStep1WithSelection}
				renderStep2={renderStep2Register}
				renderStep3={renderStep3QrCode}
				renderStep4={renderStep4Validate}
				validateStep0={validateStep0}
				stepLabels={['Configure', 'Select Device', 'Register Device', 'Scan QR Code & Activate', 'Validate']}
				shouldHideNextButton={(props) => {
					// Hide Next button on steps with modals (steps 2, 3, 4)
					if (props.nav.currentStep === 2 || props.nav.currentStep === 3 || props.nav.currentStep === 4) {
						return true;
					}
					return false;
				}}
			/>
			
			<SuperSimpleApiDisplayV8 flowFilter="mfa" />
			
		</div>
	);
};

// Main TOTP Flow Component
export const TOTPFlowV8: React.FC = () => {
	return <TOTPFlowV8WithDeviceSelection />;
};
