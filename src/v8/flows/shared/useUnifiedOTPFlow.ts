/**
 * @file useUnifiedOTPFlow.ts
 * @module v8/flows/shared
 * @description Shared hook for SMS and Email OTP-based MFA flows
 * @version 8.3.0
 * 
 * This hook consolidates the common logic between SMS and Email flows.
 * The only differences are:
 * - Device type: "SMS" vs "EMAIL"
 * - Contact field: phone vs email
 * - Phone number formatting/validation (SMS only)
 * - Some UI text differences
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MFAFlowControllerFactory } from '../factories/MFAFlowControllerFactory';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import type { DeviceType, MFACredentials } from './MFATypes';
import type { MFAFlowBaseRenderProps } from './MFAFlowBaseV8';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { getFullPhoneNumber } from '../controllers/SMSFlowController';

export type UnifiedOTPDeviceType = 'SMS' | 'EMAIL' | 'WHATSAPP';

export type DeviceSelectionState = {
	existingDevices: Record<string, unknown>[];
	loadingDevices: boolean;
	selectedExistingDevice: string;
	showRegisterForm: boolean;
};

export type OTPState = {
	otpSent: boolean;
	sendError: string | null;
	sendRetryCount: number;
};

export type ValidationState = {
	validationAttempts: number;
	lastValidationError: string | null;
};

export interface UseUnifiedOTPFlowOptions {
	deviceType: UnifiedOTPDeviceType;
	configPageRoute: string;
}

export interface UseUnifiedOTPFlowReturn {
	// State
	deviceSelection: DeviceSelectionState;
	setDeviceSelection: React.Dispatch<React.SetStateAction<DeviceSelectionState>>;
	otpState: OTPState;
	setOtpState: React.Dispatch<React.SetStateAction<OTPState>>;
	updateOtpState: (update: Partial<OTPState> | ((prev: OTPState) => Partial<OTPState>)) => void;
	validationState: ValidationState;
	setValidationState: React.Dispatch<React.SetStateAction<ValidationState>>;
	updateValidationState: (update: Partial<ValidationState> | ((prev: ValidationState) => Partial<ValidationState>)) => void;
	showModal: boolean;
	setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
	showValidationModal: boolean;
	setShowValidationModal: React.Dispatch<React.SetStateAction<boolean>>;
	registrationFlowType: 'admin' | 'user';
	setRegistrationFlowType: React.Dispatch<React.SetStateAction<'admin' | 'user'>>;
	adminDeviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED';
	setAdminDeviceStatus: React.Dispatch<React.SetStateAction<'ACTIVE' | 'ACTIVATION_REQUIRED'>>;
	deviceRegisteredActive: {
		deviceId: string;
		deviceName: string;
		deviceType: UnifiedOTPDeviceType;
		status: 'ACTIVE' | 'ACTIVATION_REQUIRED';
		username?: string;
		userId?: string;
		createdAt?: string;
		updatedAt?: string;
		environmentId?: string;
	} | null;
	setDeviceRegisteredActive: React.Dispatch<React.SetStateAction<{
		deviceId: string;
		deviceName: string;
		deviceType: UnifiedOTPDeviceType;
		status: 'ACTIVE' | 'ACTIVATION_REQUIRED';
		username?: string;
		userId?: string;
		createdAt?: string;
		updatedAt?: string;
		environmentId?: string;
	} | null>>;
	isApiDisplayVisible: boolean;
	apiDisplayHeight: number;
	isCheckingCredentials: boolean;
	
	// Controllers and utilities
	controller: ReturnType<typeof MFAFlowControllerFactory.create>;
	navigate: ReturnType<typeof useNavigate>;
	location: ReturnType<typeof useLocation>;
	isConfigured: boolean;
	
	// Helper functions
	getContactDisplay: (credentials: MFACredentials) => string;
	getContactLabel: () => string;
	getDeviceTypeDisplay: () => string;
	MODULE_TAG: string;
}

/**
 * Shared hook for SMS and Email OTP flows
 * Consolidates all common state and logic
 */
export function useUnifiedOTPFlow(options: UseUnifiedOTPFlowOptions): UseUnifiedOTPFlowReturn {
	const { deviceType, configPageRoute } = options;
	const MODULE_TAG = deviceType === 'SMS' ? '[📱 SMS-FLOW-V8]' : deviceType === 'WHATSAPP' ? '[📲 WHATSAPP-MFA]' : '[📧 EMAIL-FLOW-V8]';
	const location = useLocation();
	const navigate = useNavigate();
	const isConfigured = (location.state as { configured?: boolean })?.configured === true;
	
	// Redirect to config page if accessed directly without proper setup
	const [isCheckingCredentials, setIsCheckingCredentials] = useState(true);
	
	useEffect(() => {
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
			const visible = apiDisplayServiceV8.isVisible();
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
	const getContactDisplay = useCallback((credentials: MFACredentials): string => {
		if (deviceType === 'SMS' || deviceType === 'WHATSAPP') {
			// WhatsApp uses the same phone format as SMS
			return getFullPhoneNumber(credentials);
		} else {
			return credentials.email || 'Not set';
		}
	}, [deviceType]);

	// Get contact label
	const getContactLabel = useCallback((): string => {
		if (deviceType === 'SMS' || deviceType === 'WHATSAPP') {
			return 'Phone Number';
		}
		return 'Email Address';
	}, [deviceType]);

	// Get device type display name
	const getDeviceTypeDisplay = useCallback((): string => {
		if (deviceType === 'SMS') return 'SMS';
		if (deviceType === 'WHATSAPP') return 'WhatsApp';
		return 'Email';
	}, [deviceType]);

	return {
		// State
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
		
		// Controllers and utilities
		controller,
		navigate,
		location,
		isConfigured,
		
		// Helper functions
		getContactDisplay,
		getContactLabel,
		getDeviceTypeDisplay,
		MODULE_TAG,
	};
}

