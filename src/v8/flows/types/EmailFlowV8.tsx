/**
 * @file EmailFlowV8.tsx
 * @module v8/flows/types
 * @description Email-specific MFA flow component (Refactored with Controller Pattern)
 * @version 8.2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { MFAFlowBaseV8, type MFAFlowBaseRenderProps } from '../shared/MFAFlowBaseV8';
import type { DeviceType, MFACredentials } from '../shared/MFATypes';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { MFAFlowControllerFactory } from '../factories/MFAFlowControllerFactory';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { MFADeviceSelector } from '../components/MFADeviceSelector';
import { MFAOTPInput } from '../components/MFAOTPInput';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { FiShield, FiX } from 'react-icons/fi';
import { MFAConfigurationStepV8 } from '../shared/MFAConfigurationStepV8';
import { useUnifiedOTPFlow } from '../shared/useUnifiedOTPFlow';
import { MFASuccessPageV8, buildSuccessPageData } from '../shared/mfaSuccessPageServiceV8';
import { navigateToMfaHubWithCleanup } from '@/v8/utils/mfaFlowCleanupV8';

const MODULE_TAG = '[📧 EMAIL-FLOW-V8]';

// Step 0: Configure Credentials (Email-specific) - will be wrapped in component
const createRenderStep0 = (
	isConfigured: boolean, 
	location: ReturnType<typeof useLocation>, 
	credentialsUpdatedRef: React.MutableRefObject<boolean>,
	registrationFlowType: 'admin' | 'user',
	setRegistrationFlowType: (type: 'admin' | 'user') => void,
	adminDeviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED',
	setAdminDeviceStatus: (status: 'ACTIVE' | 'ACTIVATION_REQUIRED') => void,
	step0PropsRef: React.MutableRefObject<MFAFlowBaseRenderProps | null>,
	setLastTokenType: (tokenType: string | undefined) => void,
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
		
		// Update tokenType state to trigger effects when it changes (called during render, React will batch)
		// Only update if it actually changed to avoid unnecessary re-renders
		if (credentials.tokenType !== prevTokenTypeRef.current) {
			prevTokenTypeRef.current = credentials.tokenType;
			setLastTokenType(credentials.tokenType);
		}
		
		// Update credentials with policy ID from location.state if available (only once)
		if (!credentialsUpdatedRef.current && locationState?.deviceAuthenticationPolicyId && 
			credentials.deviceAuthenticationPolicyId !== locationState.deviceAuthenticationPolicyId) {
			console.log(`[📧 EMAIL-FLOW-V8] Updating credentials with policy ID from config page:`, locationState.deviceAuthenticationPolicyId);
			setCredentials({
				...credentials,
				deviceAuthenticationPolicyId: locationState.deviceAuthenticationPolicyId,
			});
			credentialsUpdatedRef.current = true;
		}

		return (
			<>
				{/* Registration Flow Type Selection - Email/SMS specific - MOVED ABOVE MFAConfigurationStepV8 */}
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
							onClick={() => setRegistrationFlowType('admin')}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
								<input
									type="radio"
									name="registration-flow-type"
									value="admin"
									checked={registrationFlowType === 'admin'}
									onChange={() => setRegistrationFlowType('admin')}
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
							onClick={() => setRegistrationFlowType('user')}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
								<input
									type="radio"
									name="registration-flow-type"
									value="user"
									checked={registrationFlowType === 'user'}
									onChange={() => setRegistrationFlowType('user')}
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
	
	// State to track tokenType changes (for triggering effects)
	const [lastTokenType, setLastTokenType] = useState<string | undefined>(undefined);
	
	// Ref to track previous tokenType to avoid unnecessary updates
	const prevTokenTypeRef = React.useRef<string | undefined>(undefined);
	
	// Ref to store step 4 props for potential use at component level
	const step4PropsRef = React.useRef<MFAFlowBaseRenderProps | null>(null);
	
	// Ref to track if deviceName has been reset for step 2 (to avoid Rules of Hooks violation)
	const step2DeviceNameResetRef = React.useRef<{ step: number; deviceType: string } | null>(null);
	
	// Ref to prevent infinite loops in bidirectional sync (moved from createRenderStep0)
	const isSyncingRef = React.useRef(false);

	// State to trigger device loading - updated from render function
	const [deviceLoadTrigger, setDeviceLoadTrigger] = useState<{
		currentStep: number;
		environmentId: string;
		username: string;
		tokenValid: boolean;
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
			console.log(`[📧 EMAIL-FLOW-V8] User Flow selected - ensuring User Token is used`);
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
			console.log(`[📧 EMAIL-FLOW-V8] Registration Flow Type changed to 'admin' - syncing tokenType dropdown`);
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
			console.log(`[📧 EMAIL-FLOW-V8] Token type is 'worker' but User Flow is selected - switching to Admin Flow`);
			setRegistrationFlowType('admin');
			return;
		} else if (props.credentials.tokenType === 'user' && registrationFlowType === 'admin') {
			// User changed dropdown to "User Token" but Admin Flow is selected - switch to User Flow
			console.log(`[📧 EMAIL-FLOW-V8] Token type is 'user' but Admin Flow is selected - switching to User Flow`);
			setRegistrationFlowType('user');
			return;
		} else if (props.credentials.tokenType === 'worker' && registrationFlowType !== 'admin') {
			// User changed dropdown to "Worker Token" - sync to Registration Flow Type
			console.log(`[📧 EMAIL-FLOW-V8] Token type dropdown changed to 'worker' - syncing Registration Flow Type`);
			isSyncingRef.current = true;
			setRegistrationFlowType('admin');
			// Reset flag after state update
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lastTokenType, registrationFlowType, setRegistrationFlowType]);

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
						deviceType: 'EMAIL',
						countryCode: '+1',
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

	// Step 1: Device Selection/Registration (using controller)
	// Use useCallback to capture adminDeviceStatus and registrationFlowType in closure
	const renderStep1WithSelection = useCallback((props: MFAFlowBaseRenderProps) => {
		const { credentials, setCredentials, mfaState, setMfaState, nav, setIsLoading, isLoading, setShowDeviceLimitModal, tokenStatus } = props;

		// During registration flow (from config page), skip device selection and go straight to registration
		if (isConfigured && nav.currentStep === 1) {
			// Skip to registration step immediately
			setTimeout(() => {
				nav.goToStep(2);
			}, 0);
			return null; // Don't render device selection during registration
		}

		// Update trigger state for device loading effect (only when on step 1 and values changed)
		if (nav.currentStep === 1) {
			const newTrigger = {
				currentStep: nav.currentStep,
				environmentId: credentials.environmentId || '',
				username: credentials.username || '',
				tokenValid: tokenStatus.isValid,
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
			// Reset device name to device type when selecting new device
			setCredentials({
				...credentials,
				deviceName: credentials.deviceType || 'EMAIL',
			});
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
					// Initialize device authentication for existing device
					const authResult = await controller.initializeDeviceAuthentication(
						credentials,
						deviceSelection.selectedExistingDevice
					);

					// Update state with authentication info
					// Don't check device status - just trigger authentication immediately
					setMfaState((prev) => ({
						...prev,
						deviceId: deviceSelection.selectedExistingDevice,
						nickname: (device.nickname as string) || (device.name as string) || '',
						authenticationId: authResult.authenticationId,
						deviceAuthId: authResult.authenticationId,
						environmentId: credentials.environmentId,
						nextStep: authResult.nextStep || '',
					}));

					// Handle nextStep response
					if (authResult.nextStep === 'COMPLETED') {
						// Authentication already complete
						nav.markStepComplete();
						nav.goToStep(4); // Go to success step
						toastV8.success('Authentication successful!');
					} else if (authResult.nextStep === 'OTP_REQUIRED') {
						// Navigate to Send OTP step (Step 3) to allow resend / instructions, then to validation
						setOtpState({
							otpSent: true,
							sendRetryCount: 0,
							sendError: null,
						});
						nav.markStepComplete();
						nav.goToStep(3); // Proceed to Send OTP step
						toastV8.success('OTP sent to your email. Proceed to validate the code.');
					} else if (authResult.nextStep === 'SELECTION_REQUIRED') {
						// Shouldn't happen if deviceId is provided, but handle it
						nav.setValidationErrors(['Multiple devices found. Please select a specific device.']);
						toastV8.warning('Please select a specific device');
					} else {
						nav.markStepComplete();
						nav.goToStep(3); // Default to Send OTP step for email authentication
						toastV8.success('Device selected successfully! Follow the next steps to finish.');
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

		// Reset deviceName to device type when entering registration step (Step 2)
		// Use ref to track if we've already done this for this step/deviceType combination
		// This avoids Rules of Hooks violation by not using useEffect inside render function
		if (nav.currentStep === 2 && credentials) {
			const resetKey = `${nav.currentStep}-${credentials.deviceType}`;
			const lastReset = step2DeviceNameResetRef.current;
			
			if (!lastReset || lastReset.step !== nav.currentStep || lastReset.deviceType !== credentials.deviceType) {
				// Reset deviceName to device type if it's empty or matches old device type
				const deviceTypeValue = credentials.deviceType || 'EMAIL';
				const shouldReset = !credentials.deviceName || 
					credentials.deviceName === credentials.deviceType ||
					credentials.deviceName === 'EMAIL' ||
					credentials.deviceName === 'SMS';
				if (shouldReset) {
					// Use setTimeout to avoid state update during render
					setTimeout(() => {
						setCredentials({
							...credentials,
							deviceName: deviceTypeValue,
						});
					}, 0);
					step2DeviceNameResetRef.current = {
						step: nav.currentStep,
						deviceType: credentials.deviceType,
					};
				} else {
					step2DeviceNameResetRef.current = {
						step: nav.currentStep,
						deviceType: credentials.deviceType,
					};
				}
			}
		}

		// Handle device registration
		const handleRegisterDevice = async () => {
			if (!credentials.email?.trim()) {
				nav.setValidationErrors(['Email address is required. Please enter a valid email address.']);
				return;
			}
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
				nav.setValidationErrors(['Please enter a valid email address format.']);
				return;
			}
			// Use the device name exactly as entered by the user
			const userEnteredDeviceName = credentials.deviceName?.trim();
			if (!userEnteredDeviceName) {
				nav.setValidationErrors(['Device name is required. Please enter a name for this device.']);
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
				const deviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED' = registrationFlowType === 'admin' ? adminDeviceStatus : 'ACTIVATION_REQUIRED';
				
				console.log(`[📧 EMAIL-FLOW-V8] 🔍 DEVICE STATUS SELECTION DEBUG:`, {
					'Registration Flow Type': registrationFlowType,
					'Admin Device Status State': adminDeviceStatus,
					'Calculated Device Status': deviceStatus,
					'Will send to API': deviceStatus,
				});
				
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
				const devices = await controller.loadExistingDevices(registrationCredentials, tokenStatus);
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
				const deviceIsActive = actualDeviceStatus === 'ACTIVE' && !hasDeviceActivateUri;
				
				if (actualDeviceStatus === 'ACTIVATION_REQUIRED') {
					// Device requires activation - PingOne automatically sends OTP when status is ACTIVATION_REQUIRED
					// No need to manually call sendOTP - PingOne handles it automatically
					console.log(`${MODULE_TAG} Device registered with ACTIVATION_REQUIRED status - PingOne will automatically send OTP`);
					
					// Ensure device status is explicitly set to ACTIVATION_REQUIRED in mfaState before navigation
					setMfaState((prev) => ({
						...prev,
						deviceId: result.deviceId,
						deviceStatus: 'ACTIVATION_REQUIRED', // Explicitly set status
						...(deviceActivateUri ? { deviceActivateUri } : {}),
					}));
					
					setShowValidationModal(true); // Ensure validation modal is open when navigating to Step 3
					nav.markStepComplete();
					
					// Clean up any OAuth callback parameters from URL to prevent redirect issues
					if (window.location.search.includes('code=') || window.location.search.includes('state=')) {
						const cleanUrl = window.location.pathname;
						window.history.replaceState({}, document.title, cleanUrl);
						console.log(`${MODULE_TAG} Cleaned up OAuth callback parameters from URL`);
					}
					
					// Navigate immediately to avoid any delay - same pattern as SMS flow
					// Use setTimeout to ensure state updates complete before navigation
					setTimeout(() => {
						nav.goToStep(3); // Go directly to validation step (Step 3) - skip Send OTP step (Step 2)
					}, 0);
					
					toastV8.success('Email device registered! OTP has been sent automatically.');
				} else if (actualDeviceStatus === 'ACTIVE') {
					// Admin flow: Device is ACTIVE, no OTP needed - skip OTP steps entirely
					console.log(`${MODULE_TAG} Device registered with ACTIVE status, skipping OTP steps and going back to device selection...`);
					nav.markStepComplete();
					// Skip steps 3 (Send OTP) and 4 (Validate OTP) - go directly back to device selection
					// Return to step 1
					nav.goToStep(1);
					toastV8.success('Email device registered successfully! Device is ready to use (ACTIVE status).');
				} else {
					// Unknown status - default behavior
					console.warn(`${MODULE_TAG} Device registered with unknown status: ${actualDeviceStatus}, defaulting to OTP flow`);
					nav.markStepComplete();
					nav.goToStep(3);
					toastV8.success('Email device registered successfully!');
				}
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

		return (
			<div className="step-content">
				<h2>Select or Register Email Device</h2>
				<p>Choose an existing device or register a new one</p>

				<MFADeviceSelector
					devices={deviceSelection.existingDevices as Array<{ id: string; type: string; nickname?: string; name?: string; email?: string; status?: string }>}
					loading={deviceSelection.loadingDevices}
					selectedDeviceId={deviceSelection.selectedExistingDevice}
					deviceType="EMAIL"
					onSelectDevice={handleSelectExistingDevice}
					onSelectNew={handleSelectNewDevice}
					onUseSelected={handleUseSelectedDevice}
					renderDeviceInfo={(device) => (
						<>
							{device.email && `Email: ${device.email}`}
							{device.status && ` • Status: ${device.status}`}
						</>
					)}
				/>

				{deviceSelection.showRegisterForm && (
					<div>
						<div className="info-box">
							<p>
								<strong>Username:</strong> {credentials.username}
							</p>
						</div>

						<div className="form-group" style={{ marginTop: '0' }}>
							<label htmlFor="mfa-device-type-register">
								Device Type <span className="required">*</span>
								<MFAInfoButtonV8 contentKey="device.enrollment" displayMode="tooltip" />
							</label>
							<select
								id="mfa-device-type-register"
								value={credentials.deviceType}
								onChange={(e) => {
									const newDeviceType = e.target.value as DeviceType;
									// If device name matches old device type, update it to new device type
									// Otherwise, if device name is empty, set it to new device type
									const oldDeviceType = credentials.deviceType;
									const shouldUpdateDeviceName = 
										!credentials.deviceName?.trim() || 
										credentials.deviceName === oldDeviceType;
									const updatedCredentials = {
										...credentials,
										deviceType: newDeviceType,
										deviceName: shouldUpdateDeviceName ? newDeviceType : credentials.deviceName,
									};
									setCredentials(updatedCredentials);
									// Save credentials and trigger flow reload
									CredentialsServiceV8.saveCredentials('mfa-flow-v8', updatedCredentials);
									// Dispatch event to notify router
									window.dispatchEvent(new CustomEvent('mfaDeviceTypeChanged', { detail: newDeviceType }));
									// Reload to switch to new device type flow
									setTimeout(() => {
										window.location.reload();
									}, 100);
								}}
								style={{
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
									color: '#1f2937',
									background: 'white',
									width: '100%',
									cursor: 'pointer',
								}}
							>
								<option value="SMS">📱 SMS (Text Message)</option>
								<option value="EMAIL">📧 Email</option>
								<option value="TOTP">🔐 TOTP (Authenticator App)</option>
								<option value="FIDO2">🔑 FIDO2 (Security Key / Passkey)</option>
								<option value="MOBILE">📲 Mobile (PingID)</option>
								<option value="OATH_TOKEN">🎫 OATH Token (PingID)</option>
								<option value="VOICE">📞 Voice</option>
								<option value="WHATSAPP">💬 WhatsApp</option>
							</select>
							<small>Select the type of MFA device you want to register</small>
						</div>

						{credentials.deviceType === 'EMAIL' && (
							<>
								<div className="form-group" style={{ marginTop: '0' }}>
									<label htmlFor="mfa-email-register">
										Email Address <span className="required">*</span>
									</label>
									<input
										id="mfa-email-register"
										type="email"
										value={credentials.email}
										onChange={(e) => setCredentials({ ...credentials, email: e.target.value.trim() })}
										placeholder="user@example.com"
										style={{
											padding: '10px 12px',
											border: `1px solid ${
												credentials.email?.trim()
													? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)
														? '#10b981'
														: '#ef4444'
													: '#ef4444'
											}`,
											boxShadow:
												credentials.email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)
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
										Enter a valid email address
										{credentials.email && (
											<span
												style={{
													marginLeft: '8px',
													color: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email) ? '#10b981' : '#ef4444',
													fontWeight: '500',
												}}
											>
												{/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)
													? `✓ Valid (${credentials.email})`
													: '✗ Invalid email format'}
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
										value={credentials.deviceName || credentials.deviceType || 'EMAIL'}
										onChange={(e) => setCredentials({ ...credentials, deviceName: e.target.value })}
										placeholder={credentials.deviceType || 'EMAIL'}
										style={{
											padding: '10px 12px',
											border: `1px solid ${
												credentials.deviceName?.trim() ? '#10b981' : '#ef4444'
											}`,
											boxShadow:
												credentials.deviceName?.trim()
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
										Enter a friendly name to identify this device (e.g., "My Work Email", "Personal Email")
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

								<div
									style={{
										marginBottom: '16px',
										padding: '12px',
										background: '#fef3c7',
										border: '1px solid #fbbf24',
										borderRadius: '6px',
									}}
								>
									<p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#92400e' }}>
										📋 Email Address Preview:
									</p>
									<p style={{ margin: '0', fontSize: '14px', fontFamily: 'monospace', color: '#1f2937' }}>
										<strong>Will register:</strong> {credentials.email}
									</p>
								</div>

								<button
									type="button"
									className="btn btn-primary"
									disabled={isLoading || !credentials.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email) || !credentials.deviceName?.trim()}
									onClick={handleRegisterDevice}
								>
									{isLoading ? '🔄 Registering...' : 'Register Email Device'}
								</button>
							</>
						)}
					</div>
				)}

				{mfaState.deviceId && (
					<div className="success-box" style={{ marginTop: '20px' }}>
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
	}, [registrationFlowType, adminDeviceStatus, deviceSelection, controller, isConfigured, deviceLoadTrigger, otpState, setOtpState]);

	// Step 2: Send OTP (using controller)
	const createRenderStep2 = (
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

			// Skip step 2 (Send OTP) for ACTIVATION_REQUIRED devices - OTP is sent automatically by PingOne
			// Redirect to step 3 (Validate) instead
			if (mfaState.deviceStatus === 'ACTIVATION_REQUIRED' && nav.currentStep === 2) {
				console.log(`${MODULE_TAG} Device is ACTIVATION_REQUIRED - skipping Send OTP step, going to Validate step`);
				setTimeout(() => {
					setShowValidationModal(true);
					nav.goToStep(3);
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
						<MFAInfoButtonV8 contentKey="factor.email" displayMode="modal" />
					</h2>
					<p>Send a one-time password to the registered email address</p>

					<div className="info-box">
						<p>
							<strong>Device ID:</strong> {mfaState.deviceId}
						</p>
						<p>
							<strong>Email Address:</strong> {credentials.email}
						</p>
						{sendRetryCount > 0 && (
							<p style={{ marginTop: '8px', fontSize: '13px', color: '#92400e' }}>
								⚠️ Attempt {sendRetryCount + 1} - If you continue to have issues, check your email address and try again.
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
								Track PingOne&apos;s real-time status for this authentication by opening the Device Authentication Details page.
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
									<li>Verify your email address is correct</li>
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
								💡 <strong>Tip:</strong> OTP codes typically expire after 5-10 minutes. If you don't receive the code, click "Resend OTP Code" above.
							</p>
						</div>
					)}
				</div>
			);
		};
	};

	// Step 3: Validate OTP (using controller)
	const createRenderStep3 = (
		validationAttempts: number,
		setValidationAttempts: (value: number | ((prev: number) => number)) => void,
		lastValidationError: string | null,
		setLastValidationError: (value: string | null) => void,
		otpState: { otpSent: boolean; sendError: string | null; sendRetryCount: number },
		setOtpState: (state: Partial<typeof otpState> | ((prev: typeof otpState) => Partial<typeof otpState>)) => void
	) => {
		return (props: MFAFlowBaseRenderProps) => {
			const { credentials, mfaState, setMfaState, nav, setIsLoading, isLoading } = props;

			// If validation is complete, navigate to step 4 to show success screen
			if (mfaState.verificationResult && (mfaState.verificationResult.status === 'COMPLETED' || mfaState.verificationResult.status === 'SUCCESS')) {
				// Navigate to step 4 to show success page
				if (nav.currentStep !== 4) {
					nav.goToStep(4);
				}
				// Return null here - step 4 will render the success page
				return null;
			}

			// Show validation UI as modal - always show when on step 3 (unless validation is complete)
			// If modal is closed but we're on step 3, automatically reopen it
			if (!showValidationModal && nav.currentStep === 3) {
				// Use setTimeout to avoid state updates during render
				setTimeout(() => {
					setShowValidationModal(true);
				}, 0);
			}

			// If modal is closed but we're on step 3, show a message
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

			// Show validation UI as modal
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
								<p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
									Device ID:
								</p>
								<p style={{ margin: '0 0 8px 0', fontSize: '11px', fontFamily: 'monospace', color: '#1f2937', wordBreak: 'break-all' }}>
									{mfaState.deviceId}
								</p>
								<p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
									Email Address:
								</p>
								<p style={{ margin: '0', fontSize: '11px', fontFamily: 'monospace', color: '#1f2937' }}>
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
														setValidationAttempts(updated.validationAttempts ?? current.validationAttempts);
														setLastValidationError(updated.lastValidationError ?? current.lastValidationError);
													} else {
														if (state.validationAttempts !== undefined) setValidationAttempts(state.validationAttempts);
														if (state.lastValidationError !== undefined) setLastValidationError(state.lastValidationError);
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
												'Will use': isActivationRequired ? 'activateDevice' : (mfaState.deviceActivateUri ? 'activateDevice' : 'validateOTP'),
											});
											
											// For ACTIVATION_REQUIRED devices, always use activateDevice
											if (isActivationRequired || mfaState.deviceActivateUri) {
												// Device activation flow (registration)
												setIsLoading(true);
												try {
													let deviceActivateUri = mfaState.deviceActivateUri;
													if (!deviceActivateUri && isActivationRequired && mfaState.deviceId && credentials.environmentId) {
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

													setMfaState((prev) => ({
														...prev,
														deviceStatus: (activationResult.status as string) || 'ACTIVE',
														verificationResult: {
															status: 'COMPLETED',
															message: 'Device activated successfully',
														},
													}));

													nav.markStepComplete();
													nav.goToStep(4);
													toastV8.success('Device activated successfully!');
												} catch (error) {
													const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
															setValidationAttempts(updated.validationAttempts ?? current.validationAttempts);
															setLastValidationError(updated.lastValidationError ?? current.lastValidationError);
														} else {
															if (state.validationAttempts !== undefined) setValidationAttempts(state.validationAttempts);
															if (state.lastValidationError !== undefined) setLastValidationError(state.lastValidationError);
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
															message: 'OTP validated successfully'
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

								{/* Only show resend button for registration flow (not authentication) */}
								{!mfaState.authenticationId && (
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
													setOtpState,
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
										}}
									>
										{isLoading ? '🔄 Sending...' : '🔄 Resend OTP Code'}
									</button>
								)}
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
									<p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
										{lastValidationError}
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			);
		};
	};

	// Step 4: Success Page (using shared component)
	const createRenderStep4 = () => {
		return (props: MFAFlowBaseRenderProps) => {
			const { credentials, mfaState, nav } = props;
			
			// Store props in ref for potential use at component level
			step4PropsRef.current = props;
			
			// Close modal when verification is complete (handled in render, not useEffect to avoid Rules of Hooks violation)
			if (mfaState.verificationResult && (mfaState.verificationResult.status === 'COMPLETED' || mfaState.verificationResult.status === 'SUCCESS') && showValidationModal) {
				// Use setTimeout to avoid state updates during render
				setTimeout(() => {
					setShowValidationModal(false);
				}, 0);
			}

			// If validation is complete, show success screen using shared service
			if (mfaState.verificationResult && (mfaState.verificationResult.status === 'COMPLETED' || mfaState.verificationResult.status === 'SUCCESS')) {
				const successData = buildSuccessPageData(credentials, mfaState);
				return (
					<MFASuccessPageV8
						{...props}
						successData={successData}
						onStartAgain={() => navigateToMfaHubWithCleanup(navigate)}
					/>
				);
			}

			// If device is ACTIVE and we're on step 4, show success page instead of redirecting
			if (mfaState.deviceStatus === 'ACTIVE' && nav.currentStep === 4) {
				// Check if we have deviceRegisteredActive (just registered) or verificationResult (just activated)
				if (deviceRegisteredActive || mfaState.verificationResult) {
					const successData = buildSuccessPageData(credentials, mfaState);
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

			// Default: show empty state (should not reach here if flow is correct)
			return (
				<div className="step-content" style={{ padding: '40px 20px', textAlign: 'center' }}>
					<p style={{ color: '#6b7280', fontSize: '16px' }}>
						Validation complete. Please check the previous step for results.
					</p>
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
		<div style={{ 
			minHeight: '100vh',
			paddingBottom: isApiDisplayVisible && apiDisplayHeight > 0 ? `${apiDisplayHeight + 40}px` : '0',
			transition: 'padding-bottom 0.3s ease',
			overflow: 'visible',
		}}>
			<MFAFlowBaseV8
				deviceType="EMAIL"
				renderStep0={createRenderStep0(isConfigured, location, credentialsUpdatedRef, registrationFlowType, setRegistrationFlowType, adminDeviceStatus, setAdminDeviceStatus, step0PropsRef, setLastTokenType, prevTokenTypeRef)}
				renderStep1={renderStep1WithSelection}
				renderStep2={createRenderStep2(otpState.otpSent, (v) => setOtpState({ ...otpState, otpSent: v }), otpState.sendError, (v) => setOtpState({ ...otpState, sendError: v }), otpState.sendRetryCount, (v) => setOtpState({ ...otpState, sendRetryCount: typeof v === 'function' ? v(otpState.sendRetryCount) : v }))}
				renderStep3={createRenderStep3(
					validationState.validationAttempts,
					(v) => setValidationState({ ...validationState, validationAttempts: typeof v === 'function' ? v(validationState.validationAttempts) : v }),
					validationState.lastValidationError,
					(v) => setValidationState({ ...validationState, lastValidationError: v }),
					otpState,
					(update: Partial<typeof otpState> | ((prev: typeof otpState) => Partial<typeof otpState>)) => {
						setOtpState((prev) => {
							const patch = typeof update === 'function' ? update(prev) : update;
							return { ...prev, ...patch };
						});
					}
				)}
				renderStep4={createRenderStep4()}
				validateStep0={validateStep0}
				stepLabels={['Configure', 'Select/Register Device', 'Send OTP', 'Validate']}
				shouldHideNextButton={(props) => {
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
