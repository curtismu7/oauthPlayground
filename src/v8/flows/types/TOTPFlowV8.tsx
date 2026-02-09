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

import { QRCodeSVG } from 'qrcode.react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiInfo, FiX } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { TOTPExpiredModalV8 } from '@/v8/components/TOTPExpiredModalV8';
import { useDraggableModal } from '@/v8/hooks/useDraggableModal';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import {
	type MFAConfiguration,
	MFAConfigurationServiceV8,
} from '@/v8/services/mfaConfigurationServiceV8';
import {
	type DeviceRegistrationResult,
	MFAServiceV8,
	type SendOTPParams,
} from '@/v8/services/mfaServiceV8';
import { TokenDisplayServiceV8 } from '@/v8/services/tokenDisplayServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { useMFALoadingStateManager } from '@/v8/utils/loadingStateManagerV8';
import { navigateToMfaHubWithCleanup } from '@/v8/utils/mfaFlowCleanupV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { MFADeviceSelector } from '../components/MFADeviceSelector';
import { MFAOTPInput } from '../components/MFAOTPInput';
import { MFAFlowControllerFactory } from '../factories/MFAFlowControllerFactory';
import { MFAConfigurationStepV8 } from '../shared/MFAConfigurationStepV8';
import { type MFAFlowBaseRenderProps, MFAFlowBaseV8 } from '../shared/MFAFlowBaseV8';
import type { DeviceType, MFACredentials, MFAState } from '../shared/MFATypes';
import { buildSuccessPageData, MFASuccessPageV8 } from '../shared/mfaSuccessPageServiceV8';

const MODULE_TAG = '[🔐 TOTP-FLOW-V8]';

interface TOTPConfigureStepProps extends MFAFlowBaseRenderProps {
	registrationFlowType?: 'admin' | 'user';
	setRegistrationFlowType?: (type: 'admin' | 'user') => void;
	adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
	setAdminDeviceStatus?: (status: 'ACTIVE' | 'ACTIVATION_REQUIRED') => void;
}

const TOTPConfigureStep: React.FC<TOTPConfigureStepProps> = (props) => {
	const {
		registrationFlowType = 'admin',
		setRegistrationFlowType,
		adminDeviceStatus = 'ACTIVE',
		setAdminDeviceStatus,
	} = props;

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
	}, [
		registrationFlowType,
		props.credentials.tokenType,
		props.showUserLoginModal,
		props.setCredentials,
		props.setShowUserLoginModal,
	]);

	// When tokenType dropdown changes, sync to Registration Flow Type
	React.useEffect(() => {
		if (isSyncingRef.current) return;

		if (props.credentials.tokenType === 'worker' && registrationFlowType === 'user') {
			console.log(
				`${MODULE_TAG} Token type is 'worker' but User Flow is selected - switching to Admin Flow`
			);
			setRegistrationFlowType?.('admin');
			return;
		} else if (props.credentials.tokenType === 'user' && registrationFlowType === 'admin') {
			console.log(
				`${MODULE_TAG} Token type is 'user' but Admin Flow is selected - switching to User Flow`
			);
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
			<div
				style={{
					marginBottom: '28px',
					padding: '20px',
					background: '#ffffff',
					borderRadius: '6px',
					border: '1px solid #e5e7eb',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
				}}
			>
				{/* biome-ignore lint/a11y/noLabelWithoutControl: Label is for visual grouping, inputs are inside */}
				<label
					style={{
						display: 'block',
						marginBottom: '12px',
						fontSize: '14px',
						fontWeight: '600',
						color: '#374151',
					}}
				>
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
							borderRadius: '6px',
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
									Using Worker Token
								</div>
							</div>
						</div>
						{registrationFlowType === 'admin' && (
							<div style={{ marginLeft: '28px', marginTop: '8px' }}>
								{/* biome-ignore lint/a11y/noLabelWithoutControl: Label is for visual grouping, inputs are below */}
								<label
									style={{
										display: 'block',
										marginBottom: '8px',
										fontSize: '13px',
										fontWeight: '500',
										color: '#374151',
									}}
								>
									Device Status:
								</label>
								<div style={{ display: 'flex', gap: '12px' }}>
									<label
										style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
									>
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
									<label
										style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
									>
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
							borderRadius: '6px',
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
							<strong style={{ color: '#f59e0b' }}>ACTIVATION_REQUIRED</strong> - OTP validation
							required for device activation
						</div>
					</label>
				</div>
				<small
					style={{
						display: 'block',
						marginTop: '8px',
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
				deviceType="TOTP"
				deviceTypeLabel="TOTP"
				policyDescription="Determines which PingOne policy governs TOTP challenges."
			/>
		</>
	);
};

// Step 0: Configure Credentials (TOTP-specific - includes flow selection)
// Returns a render function (not a component) to avoid hook dependency issues
const createRenderStep0 = (
	isConfigured: boolean,
	location: ReturnType<typeof useLocation>,
	credentialsUpdatedRef: React.MutableRefObject<boolean>,
	registrationFlowType: 'admin' | 'user',
	setRegistrationFlowType: (type: 'admin' | 'user') => void,
	adminDeviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED',
	setAdminDeviceStatus: (status: 'ACTIVE' | 'ACTIVATION_REQUIRED') => void,
	_autoNavigateRef: React.MutableRefObject<{ step: number; triggered: boolean }>,
	step0PropsRef: React.MutableRefObject<MFAFlowBaseRenderProps | null>
) => {
	return (props: MFAFlowBaseRenderProps) => {
		const { nav, credentials, setCredentials } = props;

		// Store props in ref for parent-level useEffect hooks
		step0PropsRef.current = props;

		const locationState = location.state as {
			configured?: boolean;
			deviceAuthenticationPolicyId?: string;
			policyName?: string;
		} | null;

		// Update credentials with policy ID from location.state if available (only once)
		if (
			!credentialsUpdatedRef.current &&
			locationState?.deviceAuthenticationPolicyId &&
			credentials.deviceAuthenticationPolicyId !== locationState.deviceAuthenticationPolicyId
		) {
			const policyId = locationState.deviceAuthenticationPolicyId;
			setCredentials({
				...credentials,
				...(policyId ? { deviceAuthenticationPolicyId: policyId } : {}),
			});
			credentialsUpdatedRef.current = true;
		}

		// If coming from config page, show loading message while redirecting
		if (isConfigured && nav.currentStep === 0) {
			return (
				<div
					style={{
						padding: '40px 20px',
						textAlign: 'center',
						minHeight: '400px',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<div
						style={{
							width: '48px',
							height: '48px',
							border: '4px solid #e5e7eb',
							borderTop: '4px solid #10b981',
							borderRadius: '50%',
							animation: 'spin 1s linear infinite',
							margin: '0 auto 20px',
						}}
					/>
					<p
						style={{
							fontSize: '16px',
							fontWeight: '600',
							color: '#1f2937',
							margin: '0 0 8px 0',
						}}
					>
						Redirecting to QR Code setup...
					</p>
					<p
						style={{
							fontSize: '14px',
							color: '#6b7280',
							margin: '0',
						}}
					>
						Please wait while we prepare your TOTP device registration
					</p>
					<style>
						{`@keyframes spin {
							0% { transform: rotate(0deg); }
							100% { transform: rotate(360deg); }
						}`}
					</style>
				</div>
			);
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
				borderRadius: '6px',
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

// Device selection state management wrapper
const TOTPFlowV8WithDeviceSelection: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const isConfigured = (location.state as { configured?: boolean })?.configured === true;
	const credentialsUpdatedRef = React.useRef(false);
	const _loadingManager = useMFALoadingStateManager();

	// Get configured OTP length - reload on config updates
	const [otpLength, setOtpLength] = useState(() => {
		const config = MFAConfigurationServiceV8.loadConfiguration();
		return config.otpCodeLength;
	});

	// Listen for configuration updates
	useEffect(() => {
		const handleConfigUpdate = (event: Event) => {
			const customEvent = event as CustomEvent<MFAConfiguration>;
			const newConfig = customEvent.detail || MFAConfigurationServiceV8.loadConfiguration();
			const newOtpLength = newConfig.otpCodeLength;
			// Only update if the value actually changed to prevent unnecessary re-renders
			setOtpLength((prev) => {
				if (prev !== newOtpLength) {
					return newOtpLength;
				}
				return prev;
			});
		};

		window.addEventListener('mfaConfigurationUpdated', handleConfigUpdate);
		return () => {
			window.removeEventListener('mfaConfigurationUpdated', handleConfigUpdate);
		};
	}, []);

	// Initialize controller using factory
	const controller = useMemo(() => MFAFlowControllerFactory.create({ deviceType: 'TOTP' }), []);

	// Store credentials, tokenStatus, and mfaState in refs for use in expired modal handlers
	const credentialsRef = React.useRef<MFACredentials | null>(null);
	const tokenStatusRef = React.useRef<ReturnType<
		typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus
	> | null>(null);
	const mfaStateRef = React.useRef<{
		deviceId?: string;
		deviceStatus?: string;
		createdAt?: string;
		qrCodeUrl?: string;
		totpSecret?: string;
		keyUri?: string;
		secret?: string;
	} | null>(null);
	// Track current step for expiration check
	const currentStepRef = React.useRef<number>(0);
	// Track if we need to auto-navigate (for config page flow)
	const autoNavigateRef = React.useRef<{ step: number; triggered: boolean }>({
		step: 0,
		triggered: false,
	});
	// Store Step 0 props for parent-level useEffect hooks to access
	const step0PropsRef = React.useRef<MFAFlowBaseRenderProps | null>(null);
	// Store Step 1 props for parent-level useEffect hooks to access
	const step1PropsRef = React.useRef<MFAFlowBaseRenderProps | null>(null);
	// Track if user explicitly closed QR modal (to prevent auto-reopening)
	const userClosedQrModalRef = React.useRef(false);

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
	// Track when secret/keyUri were received (for 30-minute expiration check)
	const [secretReceivedAt, setSecretReceivedAt] = useState<number | null>(null);
	// Modal state for expired QR code/secret
	const [showExpiredModal, setShowExpiredModal] = useState(false);
	// Modal state for guidance when configured
	const [showGuidanceModal, setShowGuidanceModal] = useState(false);

	// State for secret copy button
	const [secretCopied, setSecretCopied] = useState(false);

	// Modal state for limit exceeded error
	const [limitExceededError, setLimitExceededError] = useState<{
		message: string;
		deliveryMethod?: string;
		coolDownExpiresAt?: number;
	} | null>(null);

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

	// Helper function for safe navigation with fallback to hub
	const navigateSafely = useCallback(
		(nav: ReturnType<typeof useStepNavigationV8>, targetStep: number | 'previous' | 'hub') => {
			try {
				if (targetStep === 'hub') {
					navigateToMfaHubWithCleanup(navigate);
					return;
				}

				if (targetStep === 'previous') {
					if (nav.canGoPrevious) {
						nav.goToPrevious();
					} else {
						// No valid previous step, go to hub
						console.log(`${MODULE_TAG} No valid previous step, navigating to hub`);
						navigateToMfaHubWithCleanup(navigate);
					}
					return;
				}

				// Navigate to specific step
				if (targetStep >= 0 && targetStep < 5) {
					nav.goToStep(targetStep);
				} else {
					// Invalid step, go to hub
					console.warn(`${MODULE_TAG} Invalid target step ${targetStep}, navigating to hub`);
					navigateToMfaHubWithCleanup(navigate);
				}
			} catch (error) {
				console.error(`${MODULE_TAG} Navigation error, falling back to hub:`, error);
				navigateToMfaHubWithCleanup(navigate);
			}
		},
		[navigate]
	);

	// Handle ESC key to close modals and navigate back
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				// Get current nav from refs (updated in render functions)
				const currentNav = step1PropsRef.current?.nav;
				if (!currentNav) return;

				if (showValidationModal) {
					setShowValidationModal(false);
					// Step 4: Navigate back to Step 3
					navigateSafely(currentNav, isConfigured ? 'hub' : 3);
				} else if (showQrModal) {
					setShowQrModal(false);
					userClosedQrModalRef.current = true;
					// Step 3: Navigate back to previous step or hub
					if (isConfigured) {
						// Registration flow: go to hub (Step 0 is skipped)
						navigateSafely(currentNav, 'hub');
					} else {
						// Authentication flow: go to Step 2
						navigateSafely(currentNav, 2);
					}
				} else if (showModal) {
					setShowModal(false);
					// Step 2: Navigate back to Step 1 or hub
					navigateSafely(currentNav, isConfigured ? 'hub' : 'previous');
				}
			}
		};

		if (showModal || showQrModal || showValidationModal) {
			window.addEventListener('keydown', handleEscape);
			return () => window.removeEventListener('keydown', handleEscape);
		}
		return undefined;
	}, [showModal, showQrModal, showValidationModal, isConfigured, navigateSafely]);

	// TOTP activation OTP state (for Step 3)
	const [activationOtp, setActivationOtp] = useState('');
	const [activationError, setActivationError] = useState<string | null>(null);
	// Modal state for activation OTP (separate from QR modal)
	const [showActivationModal, setShowActivationModal] = useState(false);
	// Loading state for activation modal
	const [isActivating, setIsActivating] = useState(false);

	// Ref to store latest props for activation handler
	const activationPropsRef = React.useRef<{
		credentials: MFACredentials;
		mfaState: MFAState;
		setMfaState: (state: Partial<MFAState> | ((prev: MFAState) => MFAState)) => void;
		nav: ReturnType<typeof useStepNavigationV8>;
		setIsLoading: (loading: boolean) => void;
	} | null>(null);

	// Activation handler (accessible from modal)
	const handleActivateDevice = useCallback(async () => {
		const props = activationPropsRef.current;
		if (!props) {
			console.error(`${MODULE_TAG} Activation props not available`);
			return;
		}

		if (!activationOtp || activationOtp.length !== otpLength) {
			setActivationError(`Please enter a valid ${otpLength}-digit code`);
			return;
		}

		if (!props.mfaState.deviceId) {
			setActivationError('Device ID is missing');
			return;
		}

		props.setIsLoading(true);
		setIsActivating(true);
		setActivationError(null);

		try {
			const activationResult = await MFAServiceV8.activateTOTPDevice({
				environmentId: props.credentials.environmentId,
				username: props.credentials.username,
				deviceId: props.mfaState.deviceId,
				otp: activationOtp,
			});

			const updatedMfaState = {
				...props.mfaState,
				deviceStatus: (activationResult.status as string) || 'ACTIVE',
			};
			props.setMfaState(updatedMfaState);

			// Update mfaState ref so success page can access it
			mfaStateRef.current = {
				...mfaStateRef.current,
				deviceStatus: updatedMfaState.deviceStatus,
			};

			// Clear activation OTP state
			setActivationOtp('');
			setActivationError(null);

			// Close activation modal FIRST
			setShowActivationModal(false);

			// CRITICAL: Prevent QR modal from reopening after successful activation
			userClosedQrModalRef.current = true;

			// Close QR modal if it's still open
			setShowQrModal(false);

			// For registration flow, navigate to Step 4 to show success page
			// Step 4 will render the success page when deviceStatus is ACTIVE
			props.nav.markStepComplete();
			props.nav.goToStep(4);

			toastV8.success('TOTP device activated successfully!');

			// Success page will render automatically when:
			// 1. deviceStatus is ACTIVE
			// 2. Both modals are closed (!showQrModal && !showActivationModal)
			// 3. We're on Step 3 or 4
			// The render logic at line 2097-2130 will show the success page
		} catch (error) {
			// On error: Stay on activation modal and show error message
			// Don't close modal, don't navigate away
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error(`${MODULE_TAG} Failed to activate TOTP device:`, error);

			// Normalize error message for better UX
			const normalizedError =
				errorMessage.toLowerCase().includes('invalid') ||
				errorMessage.toLowerCase().includes('incorrect') ||
				errorMessage.toLowerCase().includes('wrong') ||
				errorMessage.toLowerCase().includes('400') ||
				errorMessage.toLowerCase().includes('bad request')
					? 'Invalid OTP code. Please try again.'
					: errorMessage;

			setActivationError(normalizedError);
			toastV8.error(`Activation failed: ${normalizedError}`);

			// Clear OTP input so user can try again
			setActivationOtp('');
		} finally {
			props.setIsLoading(false);
			setIsActivating(false);
		}
	}, [activationOtp, otpLength]);

	// Track successful registration (unused but kept for potential future use)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_deviceRegisteredActive, _setDeviceRegisteredActive] = useState<{
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

	// Track if auto-registration has been triggered (to prevent duplicate registrations)
	const autoRegistrationTriggeredRef = React.useRef(false);

	// Auto-navigate from Step 1 to Step 3 for registration flow
	// Use an interval to check if we're stuck on Step 1 (backup navigation)
	React.useEffect(() => {
		// #region agent log - Use safe analytics fetch
		(async () => {
			try {
				const { safeAnalyticsFetch } = await import('@/v8/utils/analyticsServerCheckV8');
				await safeAnalyticsFetch({
					location: 'TOTPFlowV8.tsx:604',
					message: 'useEffect for Step 1 navigation - entry',
					data: {
						isConfigured,
						hasProps: !!step1PropsRef.current,
						propsStep: step1PropsRef.current?.nav?.currentStep,
					},
					timestamp: Date.now(),
					sessionId: 'debug-session',
					runId: 'run1',
					hypothesisId: 'E',
				});
			} catch {
				// Silently ignore - analytics server not available
			}
		})();
		// #endregion

		if (!isConfigured) return;

		const checkAndNavigate = () => {
			// CRITICAL: Use currentStepRef instead of props.nav.currentStep to avoid stale ref issues
			// currentStepRef is updated in renderStep3QrCode when nav.currentStep changes
			const currentStep = currentStepRef.current;

			// If we're already on Step 3, stop checking (navigation succeeded)
			if (currentStep === 3) {
				return;
			}

			// Don't navigate if user explicitly closed the QR modal
			if (userClosedQrModalRef.current) {
				return;
			}

			// Only navigate if we're on Step 1 and haven't already triggered navigation
			// CRITICAL: Don't retry if already triggered - that causes infinite loops
			if (currentStep === 1 && !autoNavigateRef.current.triggered) {
				console.log(`${MODULE_TAG} [useEffect] Auto-navigating from Step 1 to Step 3`, {
					currentStep,
					userClosedQrModal: userClosedQrModalRef.current,
				});

				autoNavigateRef.current = { step: 3, triggered: true };

				// Get nav from props ref if available
				const props = step1PropsRef.current;
				if (props) {
					props.nav.goToStep(3);
				}
			}
		};

		// Check after a short delay to let render function try first
		const timeout = setTimeout(checkAndNavigate, 100);

		// Also check once more after a longer delay as backup (but only once, not in interval)
		const backupTimeout = setTimeout(checkAndNavigate, 500);

		return () => {
			clearTimeout(timeout);
			clearTimeout(backupTimeout);
		};
	}, [isConfigured]);

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

	// Handle auto-navigation from Step 0 to Step 2 (for configured flow)
	// Check ref in useEffect (similar to Email flow pattern)
	useEffect(() => {
		const props = step0PropsRef.current;
		if (!props) return;

		const currentStep = typeof props.nav?.currentStep === 'number' ? props.nav.currentStep : 0;
		const isConfiguredValue = Boolean(isConfigured);

		// Auto-navigation removed - user must manually click "Next" button
		// Show guidance modal instead when configured
		if (isConfiguredValue && currentStep === 0 && !autoNavigateRef.current.triggered) {
			console.log(
				`${MODULE_TAG} [useEffect] TOTP configured, showing guidance instead of auto-navigating`,
				{
					currentStep,
					isConfigured: isConfiguredValue,
				}
			);

			autoNavigateRef.current = { step: 2, triggered: true };
			// Show guidance modal to direct user to click "Next" button
			setShowGuidanceModal(true);
		}
	}, [isConfigured]);

	// Handle auto-navigation from Step 1 to Step 2 (for registration flow)
	// Check ref in useEffect (similar to Email flow pattern)
	useEffect(() => {
		const props = step1PropsRef.current;
		if (!props) return;

		const currentStep = typeof props.nav?.currentStep === 'number' ? props.nav.currentStep : 0;
		const isConfiguredValue = Boolean(isConfigured);

		if (isConfiguredValue && currentStep === 1 && !autoNavigateRef.current.triggered) {
			autoNavigateRef.current = { step: 2, triggered: true };
			props.nav.goToStep(2);
		}
		// Note: We can't use step1PropsRef.current in dependencies, so we use deviceSelection.showRegisterForm to trigger updates
	}, [isConfigured]);

	// Handle device load trigger update (for authentication flow)
	// Check ref in useEffect (similar to Email flow pattern)
	useEffect(() => {
		const props = step1PropsRef.current;
		if (!props) return;

		const currentStep = typeof props.nav?.currentStep === 'number' ? props.nav.currentStep : 0;
		const envId = props.credentials?.environmentId || '';
		const username = props.credentials?.username || '';
		const tokenValid = Boolean(props.tokenStatus?.isValid);
		const isConfiguredValue = Boolean(isConfigured);

		if (!isConfiguredValue && currentStep === 1) {
			const newTrigger = {
				currentStep: currentStep,
				environmentId: envId,
				username: username,
				tokenValid: tokenValid,
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
		// Note: We can't use step1PropsRef.current in dependencies, so we use deviceSelection.showRegisterForm to trigger updates
	}, [isConfigured, deviceLoadTrigger]);

	// Load devices when entering step 1 - moved to parent component level
	useEffect(() => {
		// During registration flow, skip device loading entirely
		// Registration and authentication are completely separate - no device loading for registration
		if (isConfigured) {
			// Don't load devices or set device selection state during registration
			// Registration flow should go directly to Step 2 (device registration)
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
	}, [
		deviceLoadTrigger,
		isConfigured,
		controller,
		deviceSelection.existingDevices.length,
		deviceSelection.loadingDevices,
	]);

	// Step 1: Device Selection (ONLY for authentication flow, completely skipped for registration)
	const renderStep1WithSelection = (props: MFAFlowBaseRenderProps) => {
		const { credentials, setCredentials, mfaState, setMfaState, nav, setIsLoading } = props;

		// Store props in ref for parent-level useEffect hooks to access
		step1PropsRef.current = props;

		// Extract values for logic (not for hooks - hooks are in parent component)
		const isConfiguredValue = Boolean(isConfigured);

		// CRITICAL: During registration flow, Step 1 is completely skipped
		// Registration flow goes: Config -> Register (Step 2) -> QR (Step 3) -> OTP (Step 4) -> Success
		// Device selection should NEVER be shown during registration
		// Return null immediately to prevent device selection UI from rendering
		if (isConfiguredValue) {
			// Auto-navigate to Step 3 if we're on Step 1 during registration flow
			// BUT: Don't auto-navigate if user explicitly closed the QR modal (they want to go back)
			if (nav.currentStep === 1 && !userClosedQrModalRef.current) {
				console.log(`${MODULE_TAG} [Step 1] Registration flow detected, navigating to Step 3`, {
					currentStep: nav.currentStep,
					alreadyTriggered: autoNavigateRef.current.triggered,
				});

				// Navigate immediately - don't wait
				if (!autoNavigateRef.current.triggered) {
					autoNavigateRef.current = { step: 3, triggered: true };
					console.log(`${MODULE_TAG} [Step 1] Calling nav.goToStep(3)`);

					// Try multiple approaches to ensure navigation happens
					nav.goToStep(3); // Direct call

					// Also try with setTimeout as backup
					setTimeout(() => {
						if (nav.currentStep === 1) {
							console.warn(
								`${MODULE_TAG} [Step 1] Still on step 1 after direct call, retrying navigation`
							);
							nav.goToStep(3);
						}
					}, 50);
				}
			}

			// CRITICAL: Return null immediately - do NOT show device selection UI during registration
			return null;
		}

		// Handle selecting an existing device (authentication flow only)
		const handleSelectExistingDevice = (deviceId: string) => {
			setDeviceSelection((prev) => ({
				...prev,
				selectedExistingDevice: deviceId,
				showRegisterForm: false,
			}));
			const device = deviceSelection.existingDevices.find(
				(d: Record<string, unknown>) => d.id === deviceId
			);
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
					nickname: credentials.nickname || 'MyKnickName',
				});
			}
		};

		// Handle using selected existing device - trigger authentication flow
		const handleUseSelectedDevice = async () => {
			if (
				deviceSelection.selectedExistingDevice &&
				deviceSelection.selectedExistingDevice !== 'new'
			) {
				const device = deviceSelection.existingDevices.find(
					(d: Record<string, unknown>) => d.id === deviceSelection.selectedExistingDevice
				);
				if (!device) {
					toastV8.error('Device not found');
					return;
				}

				// Use loading manager pattern - wrap the entire operation
				try {
					setIsLoading(true);
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
						toastV8.success(
							'Device selected. Please enter the TOTP code from your authenticator app.'
						);
					} else {
						nav.markStepComplete();
						nav.goToStep(4);
						toastV8.success('Device selected successfully!');
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					console.error(`${MODULE_TAG} Failed to initialize authentication:`, error);

					// Check for LIMIT_EXCEEDED error
					const errorWithCode = error as Error & {
						errorCode?: string;
						deliveryMethod?: string;
						coolDownExpiresAt?: number;
					};
					if (errorWithCode.errorCode === 'LIMIT_EXCEEDED') {
						setLimitExceededError({
							message: errorMessage,
							...(errorWithCode.deliveryMethod
								? { deliveryMethod: errorWithCode.deliveryMethod }
								: {}),
							...(errorWithCode.coolDownExpiresAt
								? { coolDownExpiresAt: errorWithCode.coolDownExpiresAt }
								: {}),
						});
					} else {
						const formattedError = ValidationServiceV8.formatMFAError(error as Error, {
							operation: 'authenticate',
							deviceType: 'TOTP',
						});
						nav.setValidationErrors([formattedError.userFriendlyMessage]);
						toastV8.error(`Authentication failed: ${formattedError.userFriendlyMessage}`);
					}
				} finally {
					setIsLoading(false);
				}
			}
		};

		// Only show device selector during authentication flow
		return (
			<div className="step-content">
				<h2>Select TOTP Device</h2>
				<p>Choose an existing device or register a new authenticator app</p>

				<MFADeviceSelector
					devices={
						deviceSelection.existingDevices as Array<{
							id: string;
							type: string;
							nickname?: string;
							name?: string;
							status?: string;
						}>
					}
					loading={deviceSelection.loadingDevices}
					selectedDeviceId={deviceSelection.selectedExistingDevice}
					deviceType="TOTP"
					onSelectDevice={handleSelectExistingDevice}
					onSelectNew={handleSelectNewDevice}
					onUseSelected={handleUseSelectedDevice}
					renderDeviceInfo={(device) => <>{device.status && `Status: ${device.status}`}</>}
				/>
			</div>
		);
	};

	// Ref to track device name reset for Step 2
	const step2DeviceNameResetRef = React.useRef<{ step: number; deviceType: string } | null>(null);

	// Draggable modal hooks
	const step2ModalDrag = useDraggableModal(showModal);
	const step3ModalDrag = useDraggableModal(showQrModal);
	const step4ModalDrag = useDraggableModal(showValidationModal);

	// Step 2: Register Device (Modal - no contact input, only device name)
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
			} = props;

			// Update refs for use in expired modal handlers
			credentialsRef.current = credentials;
			tokenStatusRef.current = tokenStatus;
			mfaStateRef.current = mfaState;
			currentStepRef.current = nav.currentStep;

			// Auto-open Step 2 modal when on Step 2
			// This ensures the registration modal always shows
			if (nav.currentStep === 2 && !showModal) {
				// Use setTimeout to defer state update outside of render
				setTimeout(() => {
					setShowModal(true);
				}, 0);
			}

			// Reset deviceName to device type when entering registration step (Step 2)
			// ALWAYS reset to device type, regardless of previous value
			// Use ref to track if we've already done this for this step/deviceType combination
			if (nav.currentStep === 2 && credentials) {
				const validDeviceType = 'TOTP';
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

			// Auto-registration removed - user must manually click "Register Device" button
			// Per UI contract: Step 0 -> Step 2 (register) -> Step 3 (QR code)
			// Registration now requires manual button click in Step 2 modal

			// Handle device registration
			const handleRegisterDevice = async () => {
				// Check if pairing is disabled in the policy
				const selectedPolicy = props.deviceAuthPolicies?.find(
					(p) => p.id === credentials.deviceAuthenticationPolicyId
				);
				if (selectedPolicy?.pairingDisabled === true) {
					nav.setValidationErrors([
						'Device pairing is disabled for the selected Device Authentication Policy. Please select a different policy or contact your administrator.',
					]);
					toastV8.error('Device pairing is disabled for this policy');
					return;
				}

				const userEnteredDeviceName = credentials.deviceName?.trim();
				if (!userEnteredDeviceName) {
					nav.setValidationErrors([
						'Device name is required. Please enter a name for this device.',
					]);
					return;
				}

				setIsLoading(true);
				try {
					const registrationCredentials = {
						...credentials,
						deviceName: userEnteredDeviceName,
					};

					// Determine device status based on flow type
					const deviceStatus =
						registrationFlowType === 'user' ? 'ACTIVATION_REQUIRED' : adminDeviceStatus;

					const result = (await controller.registerDevice(
						registrationCredentials,
						controller.getDeviceRegistrationParams(registrationCredentials, deviceStatus)
					)) as DeviceRegistrationResult;

					// Update device nickname if provided
					if (result.deviceId && registrationCredentials.nickname) {
						try {
							await MFAServiceV8.updateDeviceNickname(
								{
									environmentId: credentials.environmentId,
									username: credentials.username,
									deviceId: result.deviceId,
								},
								registrationCredentials.nickname
							);
							console.log(`${MODULE_TAG} ✅ Device nickname updated successfully`);
						} catch (nicknameError) {
							console.warn(`${MODULE_TAG} ⚠️ Failed to update device nickname:`, nicknameError);
							// Don't fail the registration if nickname update fails
						}
					}
					const resultWithTotp = result as {
						secret?: string;
						keyUri?: string;
						totpResult?: {
							secret?: string;
							qrCode?: string;
							manualEntryKey?: string;
						};
					};

					// Try multiple locations for secret and keyUri
					const secret =
						resultWithTotp.secret ||
						resultWithTotp.totpResult?.secret ||
						resultWithTotp.totpResult?.manualEntryKey;
					const keyUri =
						resultWithTotp.keyUri ||
						(resultWithTotp.totpResult?.qrCode
							? `data:image/png;base64,${resultWithTotp.totpResult.qrCode}`
							: undefined);

					// If secret/keyUri are missing from registration response, fetch device details
					let finalSecret = secret;
					let finalKeyUri = keyUri;

					if (!secret && !keyUri && result.deviceId) {
						console.log(
							`${MODULE_TAG} ⚠️ Secret/keyUri not in registration response, fetching device details...`
						);
						try {
							const deviceDetails = await MFAServiceV8.getDevice({
								...credentials,
								deviceId: result.deviceId,
							} as SendOTPParams);

							console.log(`${MODULE_TAG} 📋 Full device details response:`, {
								deviceId: (deviceDetails as { id?: string }).id,
								status: (deviceDetails as { status?: string }).status,
								hasProperties: !!(deviceDetails as { properties?: unknown }).properties,
								propertiesKeys: (deviceDetails as { properties?: Record<string, unknown> })
									.properties
									? Object.keys(
											(deviceDetails as { properties: Record<string, unknown> }).properties
										)
									: [],
								allKeys: Object.keys(deviceDetails as Record<string, unknown>),
								fullResponse: deviceDetails,
							});

							// Extract from device details (properties.secret and properties.keyUri)
							const deviceProperties = (
								deviceDetails as { properties?: { secret?: string; keyUri?: string } }
							).properties;
							if (deviceProperties) {
								finalSecret = deviceProperties.secret || finalSecret;
								finalKeyUri = deviceProperties.keyUri || finalKeyUri;
								console.log(`${MODULE_TAG} ✅ Fetched secret/keyUri from device details:`, {
									hasSecret: !!finalSecret,
									hasKeyUri: !!finalKeyUri,
									secretLength: finalSecret?.length,
									keyUriLength: finalKeyUri?.length,
								});
							} else {
								console.warn(`${MODULE_TAG} ⚠️ Device details response has no properties object:`, {
									deviceDetailsKeys: Object.keys(deviceDetails as Record<string, unknown>),
								});
							}
						} catch (error) {
							console.error(`${MODULE_TAG} ❌ Failed to fetch device details for QR code:`, error);
							if (error instanceof Error) {
								console.error(`${MODULE_TAG} Error details:`, {
									message: error.message,
									stack: error.stack,
								});
							}
						}
					}

					// Debug logging to diagnose missing QR code data
					if (!finalSecret && !finalKeyUri) {
						console.warn(`${MODULE_TAG} ⚠️ TOTP registration response missing secret and keyUri:`, {
							deviceId: result.deviceId,
							status: result.status,
							resultKeys: Object.keys(result),
							hasSecret: 'secret' in result,
							hasKeyUri: 'keyUri' in result,
							hasTotpResult: 'totpResult' in result,
							totpResultKeys: resultWithTotp.totpResult
								? Object.keys(resultWithTotp.totpResult)
								: [],
						});
					} else {
						console.log(`${MODULE_TAG} ✅ TOTP QR code data extracted:`, {
							hasSecret: !!finalSecret,
							hasKeyUri: !!finalKeyUri,
							secretLength: finalSecret?.length,
							keyUriLength: finalKeyUri?.length,
						});
					}

					// Store TOTP-specific data (both in local state and mfaState)
					// Also track when we received the secret/keyUri (for 30-minute expiration check)
					if (finalSecret || finalKeyUri) {
						setSecretReceivedAt(Date.now()); // Store timestamp when secret/keyUri were received
					}
					if (finalSecret) {
						setTotpSecret(finalSecret);
					}
					if (finalKeyUri) {
						setQrCodeUrl(finalKeyUri);
					}

					const updatedMfaState: Partial<MFAState> = {
						...mfaState,
						deviceId: result.deviceId,
						deviceStatus: result.status,
						...(finalSecret ? { totpSecret: finalSecret } : {}),
						...(finalKeyUri ? { qrCodeUrl: finalKeyUri } : {}),
						// Store device creation time for expiration check
						...(result.createdAt ? { createdAt: result.createdAt } : {}),
					};

					// Update mfaState ref immediately so it's available for render
					// Store keyUri and secret in ref for internal use (not in MFAState type)
					mfaStateRef.current = {
						...(updatedMfaState.deviceId ? { deviceId: updatedMfaState.deviceId } : {}),
						...(updatedMfaState.deviceStatus ? { deviceStatus: updatedMfaState.deviceStatus } : {}),
						...(updatedMfaState.createdAt ? { createdAt: updatedMfaState.createdAt } : {}),
						...(updatedMfaState.qrCodeUrl ? { qrCodeUrl: updatedMfaState.qrCodeUrl } : {}),
						...(updatedMfaState.totpSecret ? { totpSecret: updatedMfaState.totpSecret } : {}),
						// Store keyUri and secret in ref for internal use
						...(finalKeyUri ? { keyUri: finalKeyUri } : {}),
						...(finalSecret ? { secret: finalSecret } : {}),
					};

					setMfaState(updatedMfaState);

					// Ensure QR code modal is visible
					setShowQrModal(true);

					// Refresh device list
					const devices = await controller.loadExistingDevices(
						registrationCredentials,
						tokenStatus
					);
					setDeviceSelection((prev) => ({
						...prev,
						existingDevices: devices,
					}));

					// CRITICAL: ALWAYS show QR code modal (Step 3) after registration
					// Navigate to Step 3 regardless of device status
					nav.markStepComplete();

					// Close Step 2 modal and open Step 3 modal
					setShowModal(false);
					setShowQrModal(true);

					// Log state before navigation
					console.log(`${MODULE_TAG} Navigating to Step 3 with QR code data:`, {
						hasDeviceId: !!result.deviceId,
						deviceStatus: result.status,
						hasFinalSecret: !!finalSecret,
						hasFinalKeyUri: !!finalKeyUri,
						totpSecretState: totpSecret,
						qrCodeUrlState: qrCodeUrl,
						mfaStateTotpSecret: mfaState.totpSecret,
						mfaStateQrCodeUrl: mfaState.qrCodeUrl,
						showQrModal: true,
					});

					// Navigate to Step 3 after a brief delay to ensure modals are updated
					// Use setTimeout to ensure state updates complete before navigation
					setTimeout(() => {
						nav.goToStep(3);
					}, 50);
					toastV8.info('Device registered. Scan the QR code to complete setup.');
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					const isDeviceLimitError =
						errorMessage.toLowerCase().includes('exceed') ||
						errorMessage.toLowerCase().includes('limit') ||
						errorMessage.toLowerCase().includes('maximum');

					if (isDeviceLimitError) {
						setShowDeviceLimitModal(true);
						const formattedError = ValidationServiceV8.formatMFAError(error as Error, {
							operation: 'register',
							deviceType: 'TOTP',
						});
						nav.setValidationErrors([formattedError.userFriendlyMessage]);
						toastV8.error('Device limit exceeded. Please delete an existing device first.');
					} else {
						const formattedError = ValidationServiceV8.formatMFAError(error as Error, {
							operation: 'register',
							deviceType: 'TOTP',
						});
						nav.setValidationErrors([formattedError.userFriendlyMessage]);
						toastV8.error(`Registration failed: ${formattedError.userFriendlyMessage}`);
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
					<div
						style={{
							padding: '24px',
							background: 'white',
							borderRadius: '6px',
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
								padding: '8px 16px',
								background: '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
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

			// Get selected policy to check promptForNicknameOnPairing
			const selectedPolicy = props.deviceAuthPolicies?.find(
				(p) => p.id === credentials.deviceAuthenticationPolicyId
			);
			const shouldPromptForNickname = selectedPolicy?.promptForNicknameOnPairing === true;

			// Form is valid if nickname is provided when required, or if nickname is not required
			const isValidForm = shouldPromptForNickname ? credentials.deviceName?.trim() : true; // If not prompting, form is always valid (device name will be set automatically)

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
							zIndex: 10000, // Ensure modal overlay is above API display (100 < 10000)
							pointerEvents: 'auto',
						}}
						onClick={() => {
							// Don't close on backdrop click
						}}
						onMouseDown={(e) => {
							// Prevent overlay from interfering with drag
							if (e.target === e.currentTarget) {
								e.preventDefault();
							}
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
								maxHeight: '90vh',
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
							{/* biome-ignore lint/a11y/noStaticElementInteractions: Draggable modal header */}
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
										// Step 2: Navigate back to Step 1 or hub
										if (isConfigured) {
											// Registration flow: Step 1 is skipped, go to hub
											navigateToMfaHubWithCleanup(navigate);
										} else {
											// Authentication flow: go to Step 1
											navigateSafely(nav, 1);
										}
									}}
									style={{
										position: 'absolute',
										top: '10px',
										right: '10px',
										background: 'rgba(255, 255, 255, 0.2)',
										border: 'none',
										borderRadius: '50%',
										width: '28px',
										height: '28px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										cursor: 'pointer',
										color: 'white',
										zIndex: 1,
									}}
								>
									<FiX size={16} />
								</button>
								<PingIdentityLogo size={28} />
								<h3
									style={{
										margin: '4px 0 0 0',
										fontSize: '16px',
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
							<div
								style={{
									padding: '12px 16px',
									overflowY: 'auto',
									flex: 1,
									minHeight: 0,
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

								{/* Get selected policy to check promptForNicknameOnPairing */}
								{(() => {
									const selectedPolicy = props.deviceAuthPolicies?.find(
										(p) => p.id === credentials.deviceAuthenticationPolicyId
									);
									const shouldPromptForNickname =
										selectedPolicy?.promptForNicknameOnPairing === true;

									return shouldPromptForNickname === false ? (
										<div style={{ marginBottom: '12px' }}>
											<div
												style={{
													padding: '12px 16px',
													background: '#f3f4f6',
													borderRadius: '6px',
													border: '1px solid #e5e7eb',
													color: '#4b5563',
													fontSize: '14px',
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
												}}
											>
												<FiInfo size={16} color="#6b7280" />
												<span>
													Device name will be set automatically during registration. You can rename
													this device later through device management.
													<MFAInfoButtonV8
														contentKey="policy.promptForNicknameOnPairing.explanation"
														displayMode="tooltip"
													/>
												</span>
											</div>
										</div>
									) : (
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
												<MFAInfoButtonV8 contentKey="device.name" displayMode="tooltip" />
											</label>
											<input
												id="mfa-device-name-register"
												type="text"
												value={credentials.deviceName || 'TOTP'}
												onChange={(e) => {
													setCredentials({
														...credentials,
														deviceName: e.target.value,
														nickname: credentials.nickname || 'MyKnickName',
													});
												}}
												placeholder="TOTP Device"
												style={{
													padding: '12px 16px',
													border: `1px solid ${credentials.deviceName?.trim() ? '#10b981' : '#ef4444'}`,
													boxShadow: credentials.deviceName?.trim()
														? 'none'
														: '0 0 0 3px rgba(239, 68, 68, 0.25)',
													outline: 'none',
													borderRadius: '6px',
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
												Enter a friendly name to identify this device (e.g., "My Authenticator App")
											</small>

											<div style={{ marginTop: '12px' }}>
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
													onChange={(e) =>
														setCredentials({ ...credentials, nickname: e.target.value })
													}
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
													style={{
														display: 'block',
														marginTop: '4px',
														color: '#6b7280',
														fontSize: '12px',
													}}
												>
													Enter a friendly nickname for this device (e.g., "Personal Authenticator",
													"Work TOTP")
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
									);
								})()}
							</div>

							{/* Action Buttons - Sticky Footer */}
							<div
								style={{
									padding: '12px 16px',
									borderTop: '1px solid #e5e7eb',
									background: 'white',
									display: 'flex',
									gap: '8px',
									marginTop: 'auto',
								}}
							>
								<button
									type="button"
									onClick={() => {
										setShowModal(false);
										// Step 2: Navigate back to Step 1 or hub
										if (isConfigured) {
											// Registration flow: Step 1 is skipped, go to hub
											navigateToMfaHubWithCleanup(navigate);
										} else {
											// Authentication flow: go to Step 1
											navigateSafely(nav, 1);
										}
									}}
									style={{
										flex: 1,
										padding: '8px 16px',
										background: '#f3f4f6',
										color: '#374151',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
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
										padding: '8px 16px',
										background:
											isValidForm && !isLoading && tokenStatus.isValid ? '#10b981' : '#d1d5db',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
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
								>
									{isLoading ? '🔄 Registering...' : 'Register TOTP Device →'}
								</button>
							</div>
						</div>
					</div>
				</>
			);
		},
		[
			showModal,
			step2ModalDrag,
			controller,
			navigate,
			registrationFlowType,
			adminDeviceStatus,
			isConfigured,
			navigateSafely,
			qrCodeUrl,
			totpSecret,
		]
	);

	// Step 3: Scan QR Code & Activate (Modal - ALWAYS shown, activation OTP only if ACTIVATION_REQUIRED)
	// For registration flow, device registration happens automatically when this step opens
	const renderStep3QrCode = useCallback(
		(props: MFAFlowBaseRenderProps) => {
			const { credentials, mfaState, setMfaState, nav, setIsLoading, isLoading, tokenStatus } =
				props;

			// Update refs FIRST so they're available for QR code data lookup and auto-registration
			credentialsRef.current = credentials;
			tokenStatusRef.current = tokenStatus;

			// Update activation props ref for activation handler
			activationPropsRef.current = {
				credentials,
				mfaState,
				setMfaState,
				nav,
				setIsLoading,
			};

			// Auto-registration logic removed from Step 3 - should be in Step 2 per UI contract
			// Registration flow: Step 0 -> Step 2 (register) -> Step 3 (QR code)

			// Update mfaState ref with latest data, preserving any QR code data that might be in the ref
			const updatedRef: {
				deviceId?: string;
				deviceStatus?: string;
				createdAt?: string;
				qrCodeUrl?: string;
				totpSecret?: string;
				keyUri?: string;
				secret?: string;
			} = {};

			// Copy existing ref values
			if (mfaStateRef.current) {
				if (mfaStateRef.current.deviceId) updatedRef.deviceId = mfaStateRef.current.deviceId;
				if (mfaStateRef.current.deviceStatus)
					updatedRef.deviceStatus = mfaStateRef.current.deviceStatus;
				if (mfaStateRef.current.createdAt) updatedRef.createdAt = mfaStateRef.current.createdAt;
				if (mfaStateRef.current.qrCodeUrl) updatedRef.qrCodeUrl = mfaStateRef.current.qrCodeUrl;
				if (mfaStateRef.current.totpSecret) updatedRef.totpSecret = mfaStateRef.current.totpSecret;
				if (mfaStateRef.current.keyUri) updatedRef.keyUri = mfaStateRef.current.keyUri;
				if (mfaStateRef.current.secret) updatedRef.secret = mfaStateRef.current.secret;
			}

			// Update with mfaState values (overwrite ref values)
			if (mfaState.deviceId) updatedRef.deviceId = mfaState.deviceId;
			if (mfaState.deviceStatus) updatedRef.deviceStatus = mfaState.deviceStatus;
			if (mfaState.createdAt) updatedRef.createdAt = mfaState.createdAt;
			if (mfaState.qrCodeUrl) updatedRef.qrCodeUrl = mfaState.qrCodeUrl;
			if (mfaState.totpSecret) updatedRef.totpSecret = mfaState.totpSecret;

			mfaStateRef.current = updatedRef;
			currentStepRef.current = nav.currentStep;
			// Note: State updates moved to useEffect to avoid setState during render

			// CRITICAL: ALWAYS show QR code modal if we have device ID and QR code/secret
			// Check multiple sources: local state, mfaState prop, and ref (in that order)
			const refMfaState = mfaStateRef.current;
			const currentQrCodeUrl =
				qrCodeUrl || mfaState.qrCodeUrl || refMfaState?.qrCodeUrl || refMfaState?.keyUri || '';
			const currentTotpSecret =
				totpSecret || mfaState.totpSecret || refMfaState?.totpSecret || refMfaState?.secret || '';
			const shouldShowQrCode = mfaState.deviceId && (currentQrCodeUrl || currentTotpSecret);
			const isActivationRequired = mfaState.deviceStatus === 'ACTIVATION_REQUIRED';

			// Note: Expiration check is handled in useEffect at component level
			// Per PingOne API docs (https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-totp):
			// - secret and keyUri expire after 30 minutes from device creation
			// - We always show QR code if data is available, regardless of device status

			// Debug logging for QR code modal rendering (only log once per step change to prevent spam)
			// Removed verbose logging that was causing console spam
			// If debugging is needed, uncomment and add a ref to track if we've already logged for this step

			// Removed verbose debug logging - only log once per session if needed
			// if (nav.currentStep === 3 && !shouldShowQrCode && !hasLoggedQrWarning) {
			// 	console.warn(`${MODULE_TAG} Missing QR code data on Step 3`);
			// 	hasLoggedQrWarning = true;
			// }

			// Note: handleActivateDevice is now defined outside this callback (at component level)
			// to make it accessible to the activation modal

			// Handle "Continue" button (if device is already ACTIVE)
			// For ACTIVE devices: Close QR modal and show success page immediately
			// For ACTIVATION_REQUIRED devices: This button should not be shown (activation modal is shown instead)
			const handleContinue = () => {
				// Close QR modal
				setShowQrModal(false);
				userClosedQrModalRef.current = true;

				// Mark step complete
				nav.markStepComplete();

				// For ACTIVE devices, success page will be shown automatically
				// when deviceStatus is ACTIVE and !showQrModal (see logic at line 2078)
			};

			// CRITICAL: For ACTIVE devices, auto-advance to success page after QR code is shown
			// QR code page is ALWAYS shown, but if device is ACTIVE, automatically proceed to success
			// This happens when:
			// 1. Device is ACTIVE (not ACTIVATION_REQUIRED)
			// 2. QR modal is open and showing QR code
			// 3. User has had time to scan (we auto-advance after a brief delay)
			const isRegistrationFlow = Boolean(isConfigured);
			const deviceIsActive = mfaState.deviceStatus === 'ACTIVE';

			// For registration flow: If device is ACTIVE and modals are closed, show success page
			// This happens after device activation in Step 3 or after user clicks Continue
			if (
				isRegistrationFlow &&
				deviceIsActive &&
				!showQrModal &&
				!showActivationModal &&
				(nav.currentStep === 3 || nav.currentStep === 4)
			) {
				const locationState = location.state as {
					registrationFlowType?: 'admin' | 'user';
					adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
				} | null;
				const flowType =
					locationState?.registrationFlowType || credentials.tokenType === 'user'
						? 'user'
						: 'admin';
				const deviceStatus = locationState?.adminDeviceStatus || 'ACTIVE';
				const successData = buildSuccessPageData(
					credentials,
					mfaState,
					flowType,
					deviceStatus,
					credentials.tokenType
				);
				// Ensure deviceType is set for documentation button
				successData.deviceType = 'TOTP' as DeviceType;
				return (
					<MFASuccessPageV8
						{...props}
						credentials={{ ...credentials, deviceType: 'TOTP' as DeviceType }}
						successData={successData}
						onStartAgain={() => navigateToMfaHubWithCleanup(navigate)}
					/>
				);
			}

			// If we're on Step 4, don't render Step 3 content
			if (nav.currentStep === 4) {
				return null;
			}

			// CRITICAL: If we're on Step 3, ALWAYS show the QR code modal (regardless of device status)
			// QR code page must ALWAYS be shown - user needs to scan it
			// Only exception: if user explicitly closed it during registration
			if (nav.currentStep === 3 && !showQrModal) {
				// Auto-open QR modal if we have device ID and QR code data
				// Don't reopen if user explicitly closed it
				if (
					mfaState.deviceId &&
					(currentQrCodeUrl || currentTotpSecret) &&
					!userClosedQrModalRef.current
				) {
					// Use setTimeout to avoid state updates during render
					setTimeout(() => {
						setShowQrModal(true);
					}, 0);
				}
			}

			// If modal is closed and we're not on Step 3, show message
			if (!showQrModal && nav.currentStep !== 3 && nav.currentStep !== 4) {
				return (
					<div
						style={{
							padding: '24px',
							background: 'white',
							borderRadius: '6px',
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
							QR Code modal closed. Click below to reopen.
						</p>
						<button
							type="button"
							onClick={() => {
								setShowQrModal(true);
							}}
							style={{
								padding: '8px 16px',
								background: '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
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

			const hasPosition =
				step3ModalDrag.modalPosition.x !== 0 || step3ModalDrag.modalPosition.y !== 0;

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
							alignItems: hasPosition ? 'normal' : 'flex-start',
							justifyContent: hasPosition ? 'normal' : 'center',
							paddingTop: hasPosition ? '0' : '5vh',
							paddingBottom: hasPosition ? '0' : '5vh',
							overflowY: 'auto',
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
								borderRadius: '12px',
								padding: '0',
								maxWidth: '450px',
								width: '90%',
								maxHeight: '90vh',
								display: 'flex',
								flexDirection: 'column',
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
									background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
									padding: '12px 16px 8px 16px',
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
										// Always allow closing the modal
										setShowQrModal(false);
										userClosedQrModalRef.current = true;

										// Step 3: Navigate back to previous step or hub
										if (isConfigured) {
											// Registration flow: Step 0 and 1 are skipped, go to hub
											setUserClosedQrModal(true);
											navigateToMfaHubWithCleanup(navigate);
										} else {
											// Authentication flow: go to Step 2
											navigateSafely(nav, 2);
										}
									}}
									style={{
										position: 'absolute',
										top: '10px',
										right: '10px',
										background: 'rgba(255, 255, 255, 0.2)',
										border: 'none',
										borderRadius: '50%',
										width: '28px',
										height: '28px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										cursor: 'pointer',
										color: 'white',
									}}
								>
									<FiX size={16} />
								</button>
								<PingIdentityLogo size={28} />
								<h3
									style={{
										margin: '4px 0 0 0',
										fontSize: '16px',
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

							{/* Modal Body - Scrollable */}
							<div
								style={{
									padding: '12px 16px',
									overflowY: 'auto',
									flex: 1,
									minHeight: 0,
									maxHeight: 'calc(90vh - 140px)', // Reserve space for header (~100px) and footer (~100px)
								}}
							>
								{/* Show loading state while auto-registering device */}
								{isConfigured && !mfaState.deviceId && isLoading && (
									<div
										style={{
											padding: '40px 20px',
											textAlign: 'center',
										}}
									>
										<div
											style={{
												width: '48px',
												height: '48px',
												border: '4px solid #e5e7eb',
												borderTop: '4px solid #10b981',
												borderRadius: '50%',
												animation: 'spin 1s linear infinite',
												margin: '0 auto 20px',
											}}
										/>
										<p
											style={{
												fontSize: '16px',
												fontWeight: '600',
												color: '#1f2937',
												margin: '0 0 8px 0',
											}}
										>
											Registering device...
										</p>
										<p
											style={{
												fontSize: '14px',
												color: '#6b7280',
												margin: '0',
											}}
										>
											Please wait while we set up your TOTP device
										</p>
										<style>
											{`@keyframes spin {
												0% { transform: rotate(0deg); }
												100% { transform: rotate(360deg); }
											}`}
										</style>
									</div>
								)}

								{/* Show error if QR code data is missing */}
								{!shouldShowQrCode && mfaState.deviceId && !isLoading && (
									<div
										style={{
											padding: '20px',
											background: '#fef2f2',
											border: '1px solid #fca5a5',
											borderRadius: '6px',
											marginBottom: '20px',
											textAlign: 'center',
										}}
									>
										<p
											style={{
												fontSize: '16px',
												color: '#ef4444',
												margin: '0 0 12px 0',
												fontWeight: '600',
											}}
										>
											⚠️ QR Code Data Missing
										</p>
										<p
											style={{
												fontSize: '14px',
												color: '#6b7280',
												margin: '0 0 20px 0',
											}}
										>
											Unable to display QR code. The device was registered but the secret/keyUri
											were not returned. Please check the device details or try registering again.
										</p>
										<button
											type="button"
											onClick={() => {
												nav.goToStep(2);
											}}
											style={{
												padding: '8px 16px',
												background: '#10b981',
												color: 'white',
												border: 'none',
												borderRadius: '6px',
												fontSize: '15px',
												fontWeight: '600',
												cursor: 'pointer',
											}}
										>
											Go Back to Registration
										</button>
									</div>
								)}

								{/* QR Code Display */}
								{/* Show QR code if we have the URL and device ID (even if loading) */}
								{currentQrCodeUrl && mfaState.deviceId && (
									<div style={{ marginBottom: '12px', textAlign: 'center' }}>
										<p
											style={{
												margin: '0 0 12px 0',
												fontSize: '15px',
												fontWeight: '600',
												color: '#1f2937',
											}}
										>
											Scan this QR code with your authenticator app
										</p>
										<p
											style={{
												margin: '0 0 16px 0',
												fontSize: '13px',
												color: '#6b7280',
											}}
										>
											Then enter the 6-digit code below to complete setup
										</p>
										<div
											style={{
												display: 'inline-block',
												padding: '8px',
												background: 'white',
												border: '1px solid #e5e7eb',
												borderRadius: '6px',
												boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
											}}
										>
											<QRCodeSVG
												value={currentQrCodeUrl}
												size={140}
												level="M"
												includeMargin={true}
											/>
										</div>
									</div>
								)}

								{/* Secret Key Display - Always shown alongside QR code for manual entry */}
								{currentTotpSecret && (
									<div
										style={{
											marginBottom: '20px',
											padding: '16px',
											background: '#f9fafb',
											borderRadius: '6px',
											border: '1px solid #e5e7eb',
										}}
									>
										<p
											style={{
												margin: '0 0 12px 0',
												fontSize: '14px',
												fontWeight: '600',
												color: '#374151',
											}}
										>
											🔑 Secret Key (for manual entry):
										</p>
										<p
											style={{
												margin: '0 0 8px 0',
												fontSize: '12px',
												color: '#6b7280',
											}}
										>
											Can't scan the QR code? Enter this secret manually into your authenticator
											app:
										</p>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												background: 'white',
												padding: '10px',
												borderRadius: '6px',
												border: '1px solid #d1d5db',
											}}
										>
											<code
												style={{
													flex: 1,
													fontFamily: 'monospace',
													fontSize: '14px',
													wordBreak: 'break-all',
													color: '#1f2937',
													margin: 0,
												}}
											>
												{currentTotpSecret}
											</code>
											<button
												type="button"
												onClick={async () => {
													const success = await TokenDisplayServiceV8.copyToClipboard(
														currentTotpSecret,
														'TOTP Secret'
													);
													if (success) {
														setSecretCopied(true);
														setTimeout(() => setSecretCopied(false), 2000);
														toastV8.success('Secret copied to clipboard!');
													} else {
														toastV8.error('Failed to copy secret');
													}
												}}
												style={{
													padding: '4px 8px',
													background: secretCopied ? '#10b981' : '#f3f4f6',
													color: secretCopied ? 'white' : '#374151',
													border: '1px solid #d1d5db',
													borderRadius: '6px',
													cursor: 'pointer',
													fontSize: '12px',
													fontWeight: '600',
													whiteSpace: 'nowrap',
													transition: 'all 0.2s',
												}}
											>
												{secretCopied ? '✓' : '📋'}
											</button>
										</div>
										<div style={{ marginTop: '8px', fontSize: '10px', color: '#6b7280' }}>
											<p style={{ margin: '0 0 2px 0' }}>Instructions:</p>
											<ol style={{ margin: '0 0 0 16px', padding: 0 }}>
												<li>Open authenticator app</li>
												<li>Select "Add account"</li>
												<li>Choose "Enter setup key"</li>
												<li>Enter secret key above</li>
												<li>Select "Time-based" and "6 digits"</li>
												<li>Save</li>
											</ol>
										</div>
									</div>
								)}

								{/* Activation Button (only shown if ACTIVATION_REQUIRED) */}
								{isActivationRequired && (
									<div style={{ marginBottom: '12px', textAlign: 'center' }}>
										<button
											type="button"
											onClick={() => {
												setShowActivationModal(true);
											}}
											style={{
												padding: '8px 16px',
												background: '#10b981',
												color: 'white',
												border: 'none',
												borderRadius: '6px',
												fontSize: '15px',
												fontWeight: '600',
												cursor: 'pointer',
												boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
												transition: 'all 0.2s',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background = '#059669';
												e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.4)';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = '#10b981';
												e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
											}}
										>
											🔐 Activate Device with OTP
										</button>
										<p
											style={{
												marginTop: '8px',
												fontSize: '13px',
												color: '#6b7280',
											}}
										>
											After scanning, click to enter the 6-digit code
										</p>
									</div>
								)}

								{/* Info Note */}
								<p
									style={{
										marginTop: '8px',
										marginBottom: '0',
										fontSize: '11px',
										color: '#9ca3af',
										textAlign: 'center',
									}}
								>
									💡 QR code expires after ~30 minutes
								</p>

								{/* Stuck Device Warning - Show when device is in ACTIVATION_REQUIRED status and missing QR data */}
								{mfaState.deviceStatus === 'ACTIVATION_REQUIRED' &&
									mfaState.deviceId &&
									!currentQrCodeUrl &&
									!currentTotpSecret && (
										<div
											style={{
												marginTop: '20px',
												padding: '16px',
												background: '#fef2f2',
												border: '1px solid #fecaca',
												borderRadius: '6px',
											}}
										>
											<div
												style={{
													display: 'flex',
													alignItems: 'flex-start',
													gap: '12px',
													marginBottom: '12px',
												}}
											>
												<span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
												<div style={{ flex: 1 }}>
													<p
														style={{
															margin: '0 0 8px 0',
															fontSize: '14px',
															fontWeight: '600',
															color: '#991b1b',
														}}
													>
														Device Stuck in Activation Required
													</p>
													<p
														style={{
															margin: '0 0 12px 0',
															fontSize: '13px',
															color: '#7f1d1d',
															lineHeight: '1.5',
														}}
													>
														This device is stuck in "ACTIVATION_REQUIRED" status and needs to be
														removed before you can start over. Delete this device to return to the
														hub and register a new one.
													</p>
													<p
														style={{
															margin: '0 0 12px 0',
															fontSize: '12px',
															color: '#991b1b',
															fontStyle: 'italic',
														}}
													>
														💡 <strong>Tip:</strong> If you need to delete multiple devices, use the
														"Delete All Devices" button below.
													</p>
												</div>
											</div>
											<div
												style={{
													display: 'flex',
													gap: '8px',
													flexWrap: 'wrap',
												}}
											>
												<button
													type="button"
													onClick={async () => {
														if (
															!mfaState.deviceId ||
															!credentials.username ||
															!credentials.environmentId
														) {
															toastV8.error('Missing device information. Cannot delete device.');
															return;
														}

														const { uiNotificationServiceV8 } = await import(
															'@/v8/services/uiNotificationServiceV8'
														);
														const confirmed = await uiNotificationServiceV8.confirm({
															title: 'Delete Device',
															message:
																'Are you sure you want to delete this device? You can then register a new device.',
															confirmText: 'Delete Device',
															cancelText: 'Cancel',
															severity: 'danger',
														});

														if (!confirmed) {
															return;
														}

														setIsLoading(true);
														try {
															await MFAServiceV8.deleteDevice({
																environmentId: credentials.environmentId,
																username: credentials.username,
																deviceId: mfaState.deviceId,
															});

															toastV8.success(
																'Device deleted successfully. You can now register a new device.'
															);

															// Clear device state to allow new registration
															setMfaState((prev) => ({
																...prev,
																deviceId: '',
																deviceStatus: '',
																totpSecret: '',
																qrCodeUrl: '',
															}));

															// Reset auto-registration trigger so new device can be registered
															autoRegistrationTriggeredRef.current = false;

															// Clear QR code state variables
															setQrCodeUrl('');
															setTotpSecret('');

															// Reset modal close flag so QR modal can open again for new device
															userClosedQrModalRef.current = false;

															// Close QR modal and navigate to Step 2 to register a new device
															setShowQrModal(false);
															nav.goToStep(2);
														} catch (error) {
															console.error(`${MODULE_TAG} Failed to delete device:`, error);
															toastV8.error(
																`Failed to delete device: ${error instanceof Error ? error.message : 'Unknown error'}`
															);
														} finally {
															setIsLoading(false);
														}
													}}
													disabled={isLoading}
													style={{
														flex: 1,
														minWidth: '140px',
														padding: '10px 16px',
														background: isLoading ? '#d1d5db' : '#dc2626',
														color: 'white',
														border: 'none',
														borderRadius: '6px',
														fontSize: '13px',
														fontWeight: '600',
														cursor: isLoading ? 'not-allowed' : 'pointer',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														gap: '6px',
													}}
												>
													{isLoading ? (
														<>
															<span
																style={{
																	display: 'inline-block',
																	width: '12px',
																	height: '12px',
																	border: '2px solid rgba(255, 255, 255, 0.3)',
																	borderTop: '2px solid white',
																	borderRadius: '50%',
																	animation: 'spin 0.8s linear infinite',
																}}
															/>
															Deleting...
														</>
													) : (
														<>🗑️ Delete Device</>
													)}
												</button>
												<button
													type="button"
													onClick={() => {
														// Navigate to delete all devices page with pre-filled credentials
														navigate('/v8/delete-all-devices', {
															state: {
																environmentId: credentials.environmentId,
																username: credentials.username,
																deviceType: 'TOTP',
																deviceStatus: 'ACTIVATION_REQUIRED',
															},
														});
													}}
													style={{
														flex: 1,
														minWidth: '140px',
														padding: '10px 16px',
														background: '#f59e0b',
														color: 'white',
														border: 'none',
														borderRadius: '6px',
														fontSize: '13px',
														fontWeight: '600',
														cursor: 'pointer',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														gap: '6px',
													}}
												>
													🗑️ Delete All Devices
												</button>
											</div>
											<style>
												{`@keyframes spin {
												0% { transform: rotate(0deg); }
												100% { transform: rotate(360deg); }
											}`}
											</style>
										</div>
									)}
							</div>

							{/* Action Buttons - Sticky Footer */}
							<div
								style={{
									display: 'flex',
									gap: '12px',
									padding: '12px 16px',
									background: 'white',
									borderTop: '1px solid #e5e7eb',
									flexShrink: 0,
								}}
							>
								<button
									type="button"
									onClick={() => {
										setShowQrModal(false);
										userClosedQrModalRef.current = true;
										navigateSafely(nav, isConfigured ? 'hub' : 2);
									}}
									style={{
										flex: 1,
										padding: '8px 16px',
										background: '#f3f4f6',
										color: '#374151',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										fontSize: '15px',
										fontWeight: '600',
										cursor: 'pointer',
									}}
								>
									{isActivationRequired ? 'Cancel' : 'Close'}
								</button>
								{!isActivationRequired && (
									<button
										type="button"
										onClick={handleContinue}
										style={{
											width: '100%',
											padding: '8px 16px',
											background: '#10b981',
											color: 'white',
											border: 'none',
											borderRadius: '6px',
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
						</div>
					</div>
				</>
			);
		},
		[
			showQrModal,
			// Only include primitive values from step3ModalDrag that actually change
			// modalRef is stable (ref object), so we don't need it in deps
			// modalPosition.x and .y are primitives that change when dragging
			step3ModalDrag.modalPosition.x,
			step3ModalDrag.modalPosition.y,
			// handleMouseDown is a useCallback, should be stable, but include it to be safe
			step3ModalDrag.handleMouseDown,
			// Note: step3ModalDrag.modalStyle is intentionally NOT in dependencies
			// because it's a new object on every render, which would cause infinite loops
			qrCodeUrl,
			totpSecret,
			secretCopied,
			showActivationModal,
			// Note: mfaState is a prop, not in component scope, so we can't include it in deps
			// The callback will re-run when props change naturally
			// Include isConfigured to re-render when flow type changes
			isConfigured,
			navigateSafely,
			location.state, // Navigate to delete all devices page with pre-filled credentials
			navigate,
			step3ModalDrag.modalRef,
			step3ModalDrag.modalStyle,
			// Include mfaState.deviceStatus and mfaState.deviceId for stuck device warning
			// Note: mfaState is a prop, but we need to track deviceStatus and deviceId changes
			// We'll use a ref to track these values or include them conditionally
		]
	);

	// Step 4: Validate OTP (Modal - for authentication after device is activated)
	// NOTE: For registration flow, Step 4 should never be shown - success page is shown after activation in Step 3
	const renderStep4Validate = useCallback(
		(props: MFAFlowBaseRenderProps) => {
			const { credentials, mfaState, setMfaState, nav, setIsLoading, isLoading, tokenStatus } =
				props;

			// Update refs for use in expired modal handlers
			credentialsRef.current = credentials;
			tokenStatusRef.current = tokenStatus;
			mfaStateRef.current = mfaState;
			currentStepRef.current = nav.currentStep;
			// Note: State updates moved to useEffect to avoid setState during render

			// CRITICAL: For registration flow, Step 4 should never be shown
			// Registration flow goes: Register -> QR Code -> Activate -> Success (shown in Step 3)
			// Step 4 is only for authentication flow
			if (isConfigured) {
				// For registration flow, if we somehow end up on Step 4, show success page instead
				const locationState = location.state as {
					registrationFlowType?: 'admin' | 'user';
					adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
				} | null;
				const flowType =
					locationState?.registrationFlowType || credentials.tokenType === 'user'
						? 'user'
						: 'admin';
				const deviceStatus = locationState?.adminDeviceStatus || 'ACTIVE';
				const successData = buildSuccessPageData(
					credentials,
					mfaState,
					flowType,
					deviceStatus,
					credentials.tokenType
				);
				successData.deviceType = 'TOTP' as DeviceType;
				return (
					<MFASuccessPageV8
						{...props}
						credentials={{ ...credentials, deviceType: 'TOTP' as DeviceType }}
						successData={successData}
						onStartAgain={() => navigateToMfaHubWithCleanup(navigate)}
					/>
				);
			}

			// If validation is complete, show success screen
			if (mfaState.verificationResult && mfaState.verificationResult.status === 'COMPLETED') {
				// TOTP flow doesn't use useUnifiedOTPFlow hook, so we need to get flow type from credentials or location state
				const locationState = location.state as {
					registrationFlowType?: 'admin' | 'user';
					adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
				} | null;
				const flowType =
					locationState?.registrationFlowType || credentials.tokenType === 'user'
						? 'user'
						: 'admin';
				const deviceStatus = locationState?.adminDeviceStatus || 'ACTIVATION_REQUIRED';
				const successData = buildSuccessPageData(
					credentials,
					mfaState,
					flowType,
					deviceStatus,
					credentials.tokenType
				);
				// Ensure deviceType is set for documentation button
				successData.deviceType = 'TOTP' as DeviceType;
				return (
					<MFASuccessPageV8
						{...props}
						credentials={{ ...credentials, deviceType: 'TOTP' as DeviceType }}
						successData={successData}
						onStartAgain={() => navigateToMfaHubWithCleanup(navigate)}
					/>
				);
			}

			// Close modal when verification is complete
			if (
				mfaState.verificationResult &&
				mfaState.verificationResult.status === 'COMPLETED' &&
				showValidationModal
			) {
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
					<div
						style={{
							padding: '24px',
							background: 'white',
							borderRadius: '6px',
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
								padding: '8px 16px',
								background: '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
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
						// Don't close on backdrop click
					}}
				>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: Modal content needs click handler */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal content click handled by buttons */}
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
						{/* biome-ignore lint/a11y/noStaticElementInteractions: Draggable modal header */}
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
									// Step 4: Navigate back to Step 3 or hub
									if (isConfigured) {
										// Registration flow: Step 4 should never be shown, go to hub
										navigateToMfaHubWithCleanup(navigate);
									} else {
										// Authentication flow: go to Step 3
										navigateSafely(nav, 3);
									}
								}}
								style={{
									position: 'absolute',
									top: '10px',
									right: '10px',
									background: 'rgba(255, 255, 255, 0.2)',
									border: 'none',
									borderRadius: '50%',
									width: '28px',
									height: '28px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer',
									color: 'white',
								}}
							>
								<FiX size={16} />
							</button>
							<PingIdentityLogo size={28} />
							<h3
								style={{
									margin: '4px 0 0 0',
									fontSize: '16px',
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
						<div style={{ padding: '12px 16px' }}>
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
										margin: '0 0 2px 0',
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
										margin: '0 0 2px 0',
										fontSize: '12px',
										color: '#1e40af',
										fontWeight: '600',
									}}
								>
									Device Name:
								</p>
								<p
									style={{
										margin: '0',
										fontSize: '11px',
										fontFamily: 'monospace',
										color: '#1f2937',
									}}
								>
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
									disabled={isLoading || mfaState.otpCode.length !== otpLength}
									onClick={async () => {
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

										try {
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
										} catch (error) {
											// Ensure error is displayed in the modal
											// Normalize error messages per MFA_OTP_TOTP_MASTER.md
											const rawErrorMessage =
												error instanceof Error ? error.message : 'Invalid OTP code entered';
											const normalizedError =
												rawErrorMessage.toLowerCase().includes('invalid') ||
												rawErrorMessage.toLowerCase().includes('incorrect') ||
												rawErrorMessage.toLowerCase().includes('wrong') ||
												rawErrorMessage.toLowerCase().includes('400') ||
												rawErrorMessage.toLowerCase().includes('bad request')
													? 'OTP code invalid'
													: rawErrorMessage;

											setValidationState({
												validationAttempts: validationState.validationAttempts + 1,
												lastValidationError: normalizedError,
											});
											toastV8.error(`Validation failed: ${normalizedError}`);
											setIsLoading(false);
										}
									}}
									style={{
										flex: 1,
										padding: '8px 16px',
										background: isLoading || mfaState.otpCode.length !== 6 ? '#d1d5db' : '#3b82f6',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
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
							{(validationState.validationAttempts > 0 || validationState.lastValidationError) && (
								<div
									style={{
										marginTop: '8px',
										padding: '10px 12px',
										background: validationState.validationAttempts >= 3 ? '#fef2f2' : '#fffbeb',
										border: `1px solid ${validationState.validationAttempts >= 3 ? '#fecaca' : '#fed7aa'}`,
										borderRadius: '6px',
									}}
								>
									<p
										style={{
											margin: '0 0 2px 0',
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
												<li>
													Make sure you're entering the current code (codes refresh every 30
													seconds)
												</li>
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
		},
		[
			showValidationModal,
			step4ModalDrag,
			validationState,
			navigate,
			controller,
			location,
			isConfigured,
			navigateSafely,
			otpLength,
		]
	);

	// Track current step and mfaState for expiration check (state variables to trigger useEffect)
	const [currentStepForExpiration, setCurrentStepForExpiration] = useState<number>(0);
	const [mfaStateForExpiration, setMfaStateForExpiration] = useState<{
		deviceId?: string;
		deviceStatus?: string;
		createdAt?: string;
		qrCodeUrl?: string;
		totpSecret?: string;
		keyUri?: string;
		secret?: string;
	} | null>(null);

	// Refs to track previous values for comparison
	const prevStepRef = React.useRef<number>(0);
	const prevMfaStateRef = React.useRef<typeof mfaStateRef.current>(null);

	// Sync refs to state for expiration check (runs after render to avoid setState during render)
	// This effect syncs the refs (updated in render) to state for the expiration check useEffect
	React.useEffect(() => {
		const timeoutId = setTimeout(() => {
			const currentStep = currentStepRef.current;
			const currentMfaState = mfaStateRef.current;

			// Update step if changed
			if (currentStep !== prevStepRef.current) {
				prevStepRef.current = currentStep;
				setCurrentStepForExpiration(currentStep);
			}

			// Update mfaState if changed
			if (currentMfaState) {
				const prevMfaState = prevMfaStateRef.current;
				const stateChanged =
					!prevMfaState ||
					currentMfaState.deviceId !== prevMfaState.deviceId ||
					currentMfaState.deviceStatus !== prevMfaState.deviceStatus ||
					currentMfaState.createdAt !== prevMfaState.createdAt ||
					currentMfaState.qrCodeUrl !== prevMfaState.qrCodeUrl ||
					currentMfaState.totpSecret !== prevMfaState.totpSecret ||
					currentMfaState.keyUri !== prevMfaState.keyUri ||
					currentMfaState.secret !== prevMfaState.secret;
				if (stateChanged) {
					prevMfaStateRef.current = { ...currentMfaState };
					setMfaStateForExpiration({
						...(currentMfaState.deviceId ? { deviceId: currentMfaState.deviceId } : {}),
						...(currentMfaState.deviceStatus ? { deviceStatus: currentMfaState.deviceStatus } : {}),
						...(currentMfaState.createdAt ? { createdAt: currentMfaState.createdAt } : {}),
						...(currentMfaState.qrCodeUrl ? { qrCodeUrl: currentMfaState.qrCodeUrl } : {}),
						...(currentMfaState.totpSecret ? { totpSecret: currentMfaState.totpSecret } : {}),
						...(currentMfaState.keyUri ? { keyUri: currentMfaState.keyUri } : {}),
						...(currentMfaState.secret ? { secret: currentMfaState.secret } : {}),
					});
				}
			}
		}, 0);

		return () => clearTimeout(timeoutId);
	}, []); // Trigger when secret data changes

	// Also sync when mfaState changes (passed from MFAFlowBaseV8)
	// This ensures we catch updates that happen via setMfaState
	React.useEffect(() => {
		// This will be triggered by the render function updating the ref
		// The sync effect above will pick it up
	}, []); // Empty deps - this is just to ensure the sync effect runs after mfaState updates

	// CRITICAL: Auto-open Step 2 modal when navigating to Step 2
	// This ensures the registration modal always shows when Step 2 is reached
	React.useEffect(() => {
		// Check if we're on Step 2 and modal is closed
		// Use a polling approach since we can't use nav.currentStep in dependencies
		const checkStep2 = () => {
			// We need to check the actual nav.currentStep from MFAFlowBaseV8
			// Since we can't access it directly, we'll rely on the render function to update currentStepRef
			if (currentStepRef.current === 2 && !showModal) {
				setShowModal(true);
			}
		};
		const interval = setInterval(checkStep2, 100);
		return () => clearInterval(interval);
	}, [showModal]);

	// CRITICAL: Auto-open QR modal when navigating to Step 3
	// This ensures the QR code page always shows when Step 3 is reached
	// But respect user's choice to close it during registration flow
	const [userClosedQrModal, setUserClosedQrModal] = React.useState(false);

	React.useEffect(() => {
		// Reset closed flag when step changes away from 3
		if (currentStepRef.current !== 3) {
			setUserClosedQrModal(false);
			userClosedQrModalRef.current = false; // Also reset ref
		}

		// Auto-open only if:
		// 1. We're on Step 3
		// 2. Modal is closed
		// 3. User hasn't explicitly closed it (CRITICAL: respect user's choice)
		// Note: We do NOT auto-open if userClosedQrModal is true, even if deviceId exists
		// This prevents the modal from re-opening after user closes it
		if (
			currentStepRef.current === 3 &&
			!showQrModal &&
			!userClosedQrModal // Only auto-open if user hasn't explicitly closed it
		) {
			setShowQrModal(true);
			setUserClosedQrModal(false); // Reset flag when auto-opening
		}
	}, [showQrModal, userClosedQrModal]);

	// Check for TOTP secret/keyUri expiration (30 minutes) - must be at component level, not inside render callback
	// This useEffect runs whenever the step changes or mfaState/secret data changes
	// Also reads from refs as fallback to handle cases where state hasn't synced yet
	useEffect(() => {
		// Use state if available, otherwise fall back to refs
		const currentStep =
			currentStepForExpiration !== undefined ? currentStepForExpiration : currentStepRef.current;
		const mfaState = mfaStateForExpiration || mfaStateRef.current;

		// Only check expiration when on Step 3 and we have a device ID
		if (!mfaState || currentStep !== 3 || !mfaState.deviceId) {
			return;
		}

		// Check if we have QR code data
		const currentQrCodeUrl = qrCodeUrl || mfaState.qrCodeUrl || '';
		const currentTotpSecret = totpSecret || mfaState.totpSecret || '';
		const shouldShowQrCode = mfaState.deviceId && (currentQrCodeUrl || currentTotpSecret);

		// Check expiration if we have QR code data (regardless of device status)
		// We always show QR code if data is available
		if (!shouldShowQrCode) {
			return;
		}

		// Calculate expiration
		let creationTime: number | null = null;
		if (mfaState.createdAt) {
			creationTime = new Date(mfaState.createdAt).getTime();
		} else if (secretReceivedAt) {
			creationTime = secretReceivedAt;
		}

		if (!creationTime) {
			return; // Can't check expiration without creation time
		}

		const now = Date.now();
		const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
		const isExpired = now - creationTime > thirtyMinutes;

		// Show expired modal if secret/keyUri have expired
		if (isExpired) {
			setShowExpiredModal(true);
		}
	}, [totpSecret, qrCodeUrl, secretReceivedAt, currentStepForExpiration, mfaStateForExpiration]); // Dependencies: secret data, timestamps, step, and mfaState
	// Note: Also reads from refs (currentStepRef, mfaStateRef) as fallback, so works even if state hasn't synced

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
				deviceType="TOTP"
				renderStep0={createRenderStep0(
					isConfigured,
					location,
					credentialsUpdatedRef,
					registrationFlowType,
					setRegistrationFlowType,
					adminDeviceStatus,
					setAdminDeviceStatus,
					autoNavigateRef,
					step0PropsRef
				)}
				renderStep1={renderStep1WithSelection}
				renderStep2={renderStep2Register}
				renderStep3={renderStep3QrCode}
				renderStep4={renderStep4Validate}
				validateStep0={validateStep0}
				stepLabels={
					isConfigured
						? [
								// Registration flow: Config -> Device Registration -> QR Code -> OTP -> Success
								// Step 0: Configure (skipped when coming from config page)
								'Configure',
								// Step 1: Select Device (skipped, returns null) - hide from breadcrumb
								'', // Empty string will hide this step from breadcrumb
								// Step 2: Register Device (device registration happens here)
								'Register Device',
								// Step 3: QR Code (show QR code and handle activation)
								'Scan QR Code',
								// Step 4: OTP/Activate -> Success
								'Activate Device',
							]
						: [
								// Authentication flow: Include device selection
								'Configure',
								'Select Device',
								'Register Device',
								'Scan QR Code & Activate',
								'Validate',
							]
				}
				shouldHideNextButton={(props) => {
					// For registration flow, hide Next button on steps with modals
					// Step 2 (Register Device), Step 3 (QR Code), Step 4 (OTP/Activate) all have modals
					if (isConfigured) {
						if (
							props.nav.currentStep === 2 ||
							props.nav.currentStep === 3 ||
							props.nav.currentStep === 4
						) {
							return true;
						}
					} else {
						// For authentication flow, hide Next button on steps with modals
						if (
							props.nav.currentStep === 2 ||
							props.nav.currentStep === 3 ||
							props.nav.currentStep === 4
						) {
							return true;
						}
					}
					return false;
				}}
			/>

			{/* Guidance Modal for Configured Flow */}
			{showGuidanceModal && (
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
					onClick={() => setShowGuidanceModal(false)}
				>
					<div
						style={{
							background: 'white',
							borderRadius: '12px',
							padding: '32px',
							maxWidth: '450px',
							width: '90%',
							textAlign: 'center',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<div
							style={{
								width: '60px',
								height: '60px',
								background: '#10b981',
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								margin: '0 auto 24px auto',
								animation: 'pulse 2s infinite',
							}}
						>
							<span style={{ fontSize: '28px', color: 'white' }}>✓</span>
						</div>

						<h2
							style={{
								margin: '0 0 16px 0',
								fontSize: '24px',
								fontWeight: '600',
								color: '#1f2937',
							}}
						>
							Ready to Continue!
						</h2>

						<p
							style={{
								margin: '0 0 24px 0',
								fontSize: '16px',
								color: '#6b7280',
								lineHeight: 1.6,
							}}
						>
							Your TOTP configuration is complete and you've successfully logged into PingOne.
							Please click the <strong>"Next Step"</strong> button to continue with device
							registration.
						</p>

						<div
							style={{
								background: '#f0f9ff',
								border: '1px solid #bfdbfe',
								borderRadius: '8px',
								padding: '16px',
								marginBottom: '24px',
							}}
						>
							<p
								style={{
									margin: 0,
									fontSize: '14px',
									color: '#1e40af',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
								}}
							>
								<span style={{ fontSize: '18px' }}>💡</span>
								Look for the <strong>"Next Step"</strong> button below to proceed
							</p>
						</div>

						<button
							type="button"
							onClick={() => setShowGuidanceModal(false)}
							style={{
								padding: '12px 24px',
								background: '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '16px',
								fontWeight: '600',
								cursor: 'pointer',
								boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
								transition: 'all 0.2s ease',
							}}
							onMouseOver={(e) => {
								e.currentTarget.style.background = '#059669';
							}}
							onMouseOut={(e) => {
								e.currentTarget.style.background = '#10b981';
							}}
						>
							Got it, I'll click Next Step
						</button>
					</div>
				</div>
			)}

			<SuperSimpleApiDisplayV8 flowFilter="mfa" />

			{/* Limit Exceeded Error Modal */}
			{limitExceededError && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 10000,
					}}
					onClick={() => setLimitExceededError(null)}
				>
					<div
						style={{
							backgroundColor: 'white',
							borderRadius: '12px',
							padding: '24px',
							maxWidth: '500px',
							width: '90%',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
							<div
								style={{
									width: '48px',
									height: '48px',
									borderRadius: '50%',
									backgroundColor: '#fef2f2',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									marginRight: '16px',
								}}
							>
								<span style={{ fontSize: '24px' }}>⏰</span>
							</div>
							<div>
								<h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
									Temporarily Locked
								</h2>
								<p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
									Too many authentication attempts
								</p>
							</div>
						</div>
						<div style={{ marginBottom: '20px', color: '#374151', lineHeight: '1.6' }}>
							<p style={{ margin: 0 }}>{limitExceededError.message}</p>
							{limitExceededError.coolDownExpiresAt && (
								<div
									style={{
										marginTop: '8px',
										padding: '8px',
										backgroundColor: '#fef3c7',
										borderRadius: '6px',
										borderLeft: '4px solid #f59e0b',
									}}
								>
									<p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
										<strong>⏱️ Cooldown Period:</strong> Please wait before trying again.
									</p>
								</div>
							)}
						</div>
						<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
							<button
								type="button"
								onClick={() => setLimitExceededError(null)}
								style={{
									backgroundColor: '#dc2626',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									padding: '10px 20px',
									fontSize: '14px',
									fontWeight: 600,
									cursor: 'pointer',
								}}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			{/* TOTP Expired Modal */}
			<TOTPExpiredModalV8
				isOpen={showExpiredModal}
				onClose={() => setShowExpiredModal(false)}
				onRegenerate={async () => {
					// Delete the expired device and go back to registration
					const currentCredentials = credentialsRef.current;
					const currentTokenStatus = tokenStatusRef.current;
					const currentMfaState = mfaStateRef.current;
					if (currentMfaState?.deviceId && currentCredentials && currentTokenStatus) {
						try {
							await MFAServiceV8.deleteDevice({
								...currentCredentials,
								deviceId: currentMfaState.deviceId,
							} as SendOTPParams);
							toastV8.success('Expired device deleted. Please register a new device.');
							setShowExpiredModal(false);
							// Clear expired secret/keyUri
							setTotpSecret('');
							setQrCodeUrl('');
							setSecretReceivedAt(null);
							// Refresh device list
							const devices = await controller.loadExistingDevices(
								currentCredentials,
								currentTokenStatus
							);
							setDeviceSelection((prev) => ({
								...prev,
								existingDevices: devices,
							}));
							// Go back to device selection - we need to get nav from MFAFlowBaseV8
							// For now, just navigate to hub
							navigateToMfaHubWithCleanup(navigate);
						} catch (error) {
							console.error(`${MODULE_TAG} Failed to delete expired device:`, error);
							toastV8.error('Failed to delete expired device. Please try again.');
						}
					}
				}}
				onGoBack={() => {
					setShowExpiredModal(false);
					navigateToMfaHubWithCleanup(navigate);
				}}
			/>

			{/* Activation OTP Modal (separate from QR modal) */}
			{showActivationModal &&
				activationPropsRef.current?.mfaState.deviceStatus === 'ACTIVATION_REQUIRED' && (
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
							zIndex: 1001,
							padding: '20px',
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
								maxWidth: '500px',
								width: '100%',
								maxHeight: '85vh',
								display: 'flex',
								flexDirection: 'column',
								boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
								overflow: 'hidden',
							}}
							onClick={(e) => e.stopPropagation()}
						>
							{/* Header */}
							<div
								style={{
									background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
									padding: '20px 24px',
									textAlign: 'center',
									position: 'relative',
								}}
							>
								<button
									type="button"
									onClick={() => {
										setShowActivationModal(false);
										setActivationOtp('');
										setActivationError(null);
									}}
									style={{
										position: 'absolute',
										top: '10px',
										right: '10px',
										background: 'rgba(255, 255, 255, 0.2)',
										border: 'none',
										borderRadius: '50%',
										width: '28px',
										height: '28px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										cursor: 'pointer',
										color: 'white',
										fontSize: '16px',
									}}
								>
									<FiX />
								</button>
								<h2
									style={{
										margin: '0 0 8px 0',
										fontSize: '24px',
										fontWeight: '700',
										color: 'white',
									}}
								>
									Activate TOTP Device
								</h2>
								<p
									style={{
										margin: 0,
										fontSize: '14px',
										color: 'rgba(255, 255, 255, 0.9)',
									}}
								>
									Enter the 6-digit code from your authenticator app
								</p>
							</div>

							{/* Modal Body */}
							<div
								style={{
									padding: '24px',
									overflowY: 'auto',
									flex: 1,
									minHeight: 0,
								}}
							>
								<div style={{ marginBottom: '20px' }}>
									<label
										htmlFor="activation-otp-input"
										style={{
											display: 'block',
											marginBottom: '12px',
											fontSize: '15px',
											fontWeight: '600',
											color: '#374151',
										}}
									>
										OTP Code <span style={{ color: '#ef4444' }}>*</span>
										<MFAInfoButtonV8 contentKey="otp.validation" displayMode="tooltip" />
									</label>
									<MFAOTPInput
										value={activationOtp}
										onChange={setActivationOtp}
										maxLength={otpLength}
										placeholder={'0'.repeat(otpLength)}
										disabled={isActivating}
									/>
									{activationError && (
										<div
											style={{
												marginTop: '8px',
												padding: '8px',
												background: '#fef2f2',
												border: '1px solid #fecaca',
												borderRadius: '6px',
												color: '#991b1b',
												fontSize: '14px',
											}}
										>
											<strong>Error:</strong> {activationError}
										</div>
									)}
								</div>

								{/* Info */}
								<div
									style={{
										padding: '8px',
										background: '#eff6ff',
										border: '1px solid #bfdbfe',
										borderRadius: '6px',
										marginBottom: '20px',
									}}
								>
									<p
										style={{
											margin: 0,
											fontSize: '13px',
											color: '#1e40af',
											lineHeight: '1.5',
										}}
									>
										💡 <strong>Tip:</strong> Open your authenticator app (Google Authenticator,
										Authy, etc.) and enter the 6-digit code shown there.
									</p>
								</div>
							</div>

							{/* Action Buttons - Sticky Footer */}
							<div
								style={{
									display: 'flex',
									gap: '12px',
									padding: '16px 24px',
									background: 'white',
									borderTop: '1px solid #e5e7eb',
									flexShrink: 0,
								}}
							>
								<button
									type="button"
									onClick={() => {
										setShowActivationModal(false);
										setActivationOtp('');
										setActivationError(null);
									}}
									style={{
										flex: 1,
										padding: '8px 16px',
										background: '#f3f4f6',
										color: '#374151',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										fontSize: '15px',
										fontWeight: '600',
										cursor: 'pointer',
									}}
								>
									Cancel
								</button>
								<button
									type="button"
									disabled={isActivating || activationOtp.length !== otpLength}
									onClick={handleActivateDevice}
									style={{
										flex: 2,
										padding: '8px 16px',
										background:
											activationOtp.length === otpLength && !isActivating ? '#10b981' : '#d1d5db',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										fontSize: '15px',
										fontWeight: '600',
										cursor:
											activationOtp.length === otpLength && !isActivating
												? 'pointer'
												: 'not-allowed',
										boxShadow:
											activationOtp.length === otpLength && !isActivating
												? '0 4px 12px rgba(16, 185, 129, 0.3)'
												: 'none',
									}}
								>
									{isActivating ? '🔄 Activating...' : 'Activate Device →'}
								</button>
							</div>
						</div>
					</div>
				)}
		</div>
	);
};

// Main TOTP Flow Component
export const TOTPFlowV8: React.FC = () => {
	return <TOTPFlowV8WithDeviceSelection />;
};
