/**
 * @file UnifiedOTPFlowV8.tsx
 * @module v8/flows/shared
 * @description Unified OTP-based MFA flow component for SMS and Email devices
 * @version 8.3.0
 * 
 * This component consolidates the SMS and Email MFA flows since they are nearly identical.
 * The only differences are:
 * - Device type: "SMS" vs "EMAIL"
 * - Contact field: phone vs email
 * - Phone number formatting/validation (SMS only)
 * - Some UI text differences
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CountryCodePickerV8 } from '@/v8/components/CountryCodePickerV8';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { MFAFlowBaseV8, type MFAFlowBaseRenderProps } from './MFAFlowBaseV8';
import type { DeviceType, MFACredentials } from './MFATypes';
import { getFullPhoneNumber } from '../controllers/SMSFlowController';
import { MFAFlowControllerFactory } from '../factories/MFAFlowControllerFactory';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { MFADeviceSelector, type Device } from '../components/MFADeviceSelector';
import { MFAOTPInput } from '../components/MFAOTPInput';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { FiShield, FiX, FiMail } from 'react-icons/fi';
import { MFAConfigurationStepV8 } from './MFAConfigurationStepV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { validateAndNormalizePhone, isValidPhoneFormat } from '@/v8/utils/phoneValidationV8';

export type UnifiedOTPDeviceType = 'SMS' | 'EMAIL';

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

interface UnifiedOTPFlowProps {
	deviceType: UnifiedOTPDeviceType;
	configPageRoute: string; // e.g., '/v8/mfa/register/sms' or '/v8/mfa/register/email'
}

/**
 * Unified OTP Flow Component
 * Handles both SMS and Email MFA device registration and activation
 */
export const UnifiedOTPFlowV8: React.FC<UnifiedOTPFlowProps> = ({ deviceType, configPageRoute }) => {
	const MODULE_TAG = deviceType === 'SMS' ? '[📱 SMS-FLOW-V8]' : '[📧 EMAIL-FLOW-V8]';
	const location = useLocation();
	const navigate = useNavigate();
	const isConfigured = (location.state as { configured?: boolean })?.configured === true;
	
	// Redirect to config page if accessed directly without proper setup
	const [isCheckingCredentials, setIsCheckingCredentials] = useState(true);
	
	React.useEffect(() => {
		const locationState = location.state as { 
			configured?: boolean; 
			deviceAuthenticationPolicyId?: string;
			environmentId?: string;
			username?: string;
		} | null;
		
		// If we have state from navigation, credentials are good
		if (locationState && (isConfigured || locationState.deviceAuthenticationPolicyId)) {
			setIsCheckingCredentials(false);
			return;
		}
		
		// If no state passed and no configured flag, check stored credentials
		if (!locationState && !isConfigured) {
			// Check if we have credentials in storage
			const storedCredentials = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
				flowKey: 'mfa-flow-v8',
				flowType: 'oidc',
				includeClientSecret: false,
				includeRedirectUri: false,
				includeLogoutUri: false,
				includeScopes: false,
			});
			
			// If no stored credentials either, redirect to config page
			if (!storedCredentials?.environmentId?.trim() || 
				!storedCredentials?.username?.trim() || 
				!storedCredentials?.deviceAuthenticationPolicyId?.trim()) {
				console.log(`${MODULE_TAG} No credentials found, redirecting to config page`);
				navigate(configPageRoute, { replace: true });
				return;
			}
		}
		
		// Credentials check complete
		setIsCheckingCredentials(false);
	}, [location.state, isConfigured, navigate, configPageRoute, MODULE_TAG]);
	
	// Initialize controller using factory
	const controller = useMemo(() => 
		MFAFlowControllerFactory.create({ deviceType }), 
		[deviceType]
	);

	// Device selection state
	const [deviceSelection, setDeviceSelection] = useState<DeviceSelectionState>({
		existingDevices: [],
		loadingDevices: false,
		selectedExistingDevice: '',
		showRegisterForm: false,
	});

	// OTP state
	const [otpState, setOtpState] = useState<OTPState>({
		otpSent: false,
		sendError: null,
		sendRetryCount: 0,
	});

	// Track successful registration
	const [deviceRegisteredActive, setDeviceRegisteredActive] = useState<{
		deviceId: string;
		deviceName: string;
		deviceType: UnifiedOTPDeviceType;
		status: 'ACTIVE' | 'ACTIVATION_REQUIRED';
		username?: string;
		userId?: string;
		createdAt?: string;
		updatedAt?: string;
		environmentId?: string;
	} | null>(null);

	// Validation state
	const [validationState, setValidationState] = useState<ValidationState>({
		validationAttempts: 0,
		lastValidationError: null,
	});

	// Modal state for step 2 registration
	const [showModal, setShowModal] = useState(true);
	
	// Modal state for step 4 OTP validation
	const [showValidationModal, setShowValidationModal] = useState(true);
	
	// Device registration flow type: 'admin' (can choose ACTIVE or ACTIVATION_REQUIRED) or 'user' (always ACTIVATION_REQUIRED)
	const initialLocationState = location.state as { 
		registrationFlowType?: 'admin' | 'user';
		adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
	} | null;
	const [registrationFlowType, setRegistrationFlowType] = useState<'admin' | 'user'>(
		initialLocationState?.registrationFlowType || 'user'
	);
	const [adminDeviceStatus, setAdminDeviceStatus] = useState<'ACTIVE' | 'ACTIVATION_REQUIRED'>(
		initialLocationState?.adminDeviceStatus || 'ACTIVE'
	);

	const updateOtpState = useCallback(
		(update: Partial<OTPState> | ((prev: OTPState) => Partial<OTPState>)) => {
			setOtpState((prev) => {
				const patch = typeof update === 'function' ? update(prev) : update;
				return { ...prev, ...patch };
			});
		},
		[]
	);

	const updateValidationState = useCallback(
		(update: Partial<ValidationState> | ((prev: ValidationState) => Partial<ValidationState>)) => {
			setValidationState((prev) => {
				const patch = typeof update === 'function' ? update(prev) : update;
				return { ...prev, ...patch };
			});
		},
		[]
	);

	// Track API display visibility and height for dynamic padding
	const [isApiDisplayVisible, setIsApiDisplayVisible] = useState(false);
	const [apiDisplayHeight, setApiDisplayHeight] = useState(0);

	useEffect(() => {
		const checkVisibility = () => {
			const visible = apiDisplayServiceV8.getVisibility();
			setIsApiDisplayVisible(visible);
		};

		const unsubscribe = apiDisplayServiceV8.subscribe(checkVisibility);
		checkVisibility(); // Initial check

		return unsubscribe;
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

	// Get contact info display helper
	const getContactDisplay = (credentials: MFACredentials): string => {
		if (deviceType === 'SMS') {
			return getFullPhoneNumber(credentials);
		} else {
			return credentials.email || 'Not set';
		}
	};

	// Get contact label
	const getContactLabel = (): string => {
		return deviceType === 'SMS' ? 'Phone Number' : 'Email Address';
	};

	// Get device type display name
	const getDeviceTypeDisplay = (): string => {
		return deviceType === 'SMS' ? 'SMS' : 'Email';
	};

	// TODO: Add Step 0, Step 1, Step 2, Step 3, Step 4 render functions here
	// These will be extracted from SMSFlowV8.tsx and made generic

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
			{/* TODO: Add MFAFlowBaseV8 with all step renderers */}
			<SuperSimpleApiDisplayV8 flowFilter="mfa" />
		</div>
	);
};

