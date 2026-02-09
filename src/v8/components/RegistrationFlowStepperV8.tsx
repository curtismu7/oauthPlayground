/**
 * @file RegistrationFlowStepperV8.tsx
 * @module v8/components
 * @description Dedicated stepper for MFA Registration flows
 * @version 8.0.0
 * @since 2026-02-06
 *
 * Purpose: Provide a dedicated stepper component for Registration flows that:
 * - Uses Registration-specific step sequence (6 steps)
 * - Skips Device Selection step (Step 2)
 * - Goes directly from User Login to Device Actions (Step 3)
 * - Provides Registration-specific validation and navigation
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { MFADeviceLimitModalV8 } from '@/v8/components/MFADeviceLimitModalV8';
import { MFANavigationV8 } from '@/v8/components/MFANavigationV8';
import { MFASettingsModalV8 } from '@/v8/components/MFASettingsModalV8';
import { MFAUserDisplayV8 } from '@/v8/components/MFAUserDisplayV8';
import StepActionButtonsV8 from '@/v8/components/StepActionButtonsV8';
import StepValidationFeedbackV8 from '@/v8/components/StepValidationFeedbackV8';
import { UserLoginModalV8 } from '@/v8/components/UserLoginModalV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { WorkerTokenPromptModalV8 } from '@/v8/components/WorkerTokenPromptModalV8';
import type {
	DeviceAuthenticationPolicy,
	DeviceType,
	MFACredentials,
	MFAState,
} from '@/v8/flows/shared/MFATypes';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import {
	type TokenStatusInfo,
	WorkerTokenStatusServiceV8,
} from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { ReturnTargetServiceV8U } from '@/v8u/services/returnTargetServiceV8U';

const MODULE_TAG = '[📝 REGISTRATION-STEPPER-V8]';
const FLOW_KEY = 'mfa-registration-flow-v8';

export interface RegistrationFlowStepperV8Props {
	deviceType: DeviceType;
	renderStep0: (props: RegistrationFlowStepperRenderProps) => React.ReactNode;
	renderStep1: (props: RegistrationFlowStepperRenderProps) => React.ReactNode;
	renderStep3: (props: RegistrationFlowStepperRenderProps) => React.ReactNode;
	renderStep4: (props: RegistrationFlowStepperRenderProps) => React.ReactNode;
	renderStep5: (props: RegistrationFlowStepperRenderProps) => React.ReactNode;
	renderStep6: (props: RegistrationFlowStepperRenderProps) => React.ReactNode;
	validateStep0: (
		credentials: MFACredentials,
		tokenStatus: TokenStatusInfo,
		nav: ReturnType<typeof useStepNavigationV8>
	) => boolean;
	stepLabels?: string[];
	/** Optional function to determine if Next button should be hidden */
	shouldHideNextButton?: (props: RegistrationFlowStepperRenderProps) => boolean;
}

export interface RegistrationFlowStepperRenderProps {
	credentials: MFACredentials;
	setCredentials: (
		credentials: MFACredentials | ((prev: MFACredentials) => MFACredentials)
	) => void;
	mfaState: MFAState;
	setMfaState: (state: Partial<MFAState> | ((prev: MFAState) => MFAState)) => void;
	tokenStatus: TokenStatusInfo;
	isLoading: boolean;
	setIsLoading: (loading: boolean) => void;
	nav: ReturnType<typeof useStepNavigationV8>;
	showDeviceLimitModal: boolean;
	setShowDeviceLimitModal: (show: boolean) => void;
	showWorkerTokenModal: boolean;
	setShowWorkerTokenModal: (show: boolean) => void;
	showUserLoginModal: boolean;
	setShowUserLoginModal: (show: boolean) => void;
	showSettingsModal: boolean;
	setShowSettingsModal: (show: boolean) => void;
	deviceAuthPolicies: DeviceAuthenticationPolicy[];
	isLoadingPolicies: boolean;
	policiesError: string | null;
	refreshDeviceAuthPolicies: () => Promise<void>;
}

export const RegistrationFlowStepperV8: React.FC<RegistrationFlowStepperV8Props> = ({
	deviceType,
	renderStep0,
	renderStep1,
	renderStep3,
	renderStep4,
	renderStep5,
	renderStep6,
	validateStep0,
	stepLabels = [
		'Configure',
		'User Login',
		'Device Actions',
		'Activation',
		'API Documentation',
		'Success',
	],
	shouldHideNextButton,
}) => {
	const location = useLocation();
	const [searchParams] = useSearchParams();

	// State management
	const [credentials, setCredentials] = useState<MFACredentials>(() => {
		const saved = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
			flowKey: FLOW_KEY,
			flowType: 'registration',
			includeClientSecret: true,
			includeRedirectUri: true,
			includeLogoutUri: false,
			includeScopes: true,
		});
		return {
			environmentId: '',
			clientId: '',
			clientSecret: '',
			redirectUri: '',
			logoutUri: '',
			scopes: [],
			tokenType: 'user',
			userToken: '',
			...saved,
		};
	});

	const [mfaState, setMfaState] = useState<MFAState>({
		isLoading: false,
		error: null,
		deviceId: null,
		authenticationId: null,
		activationId: null,
		qrCode: null,
		otpCode: null,
		deviceInfo: null,
	});

	const [isLoading, setIsLoading] = useState(false);
	const [showDeviceLimitModal, setShowDeviceLimitModal] = useState(false);
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [showUserLoginModal, setShowUserLoginModal] = useState(false);
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [deviceAuthPolicies, _setDeviceAuthPolicies] = useState<DeviceAuthenticationPolicy[]>([]);
	const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
	const [policiesError, setPoliciesError] = useState<string | null>(null);

	// Registration flow has 6 steps (skips device selection)
	const totalSteps = stepLabels.length;

	const nav = useStepNavigationV8(totalSteps, {
		onStepChange: () => {
			window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
		},
	});

	// Load saved credentials on mount
	useEffect(() => {
		const saved = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
			flowKey: FLOW_KEY,
			flowType: 'registration',
			includeClientSecret: true,
			includeRedirectUri: true,
			includeLogoutUri: false,
			includeScopes: true,
		});

		if (saved) {
			setCredentials((prev) => ({ ...prev, ...saved }));
		}
	}, []);

	// Worker token management — DEAD SIMPLE: if creds exist → no modal, if no creds → modal
	// This bypasses all complex silentApiRetrieval/showTokenAtEnd logic
	useEffect(() => {
		const checkWorkerToken = async () => {
			try {
				const { handleShowWorkerTokenModalSimple } = await import(
					'@/v8/utils/workerTokenModalHelperV8_SIMPLE'
				);
				// forceShowModal=false: this is an automatic check, not a user click
				await handleShowWorkerTokenModalSimple(
					setShowWorkerTokenModal,
					false // forceShowModal=false: automatic mount check
				);
			} catch (error) {
				console.error(`${MODULE_TAG} Error in worker token check:`, error);
			}
		};

		checkWorkerToken();
	}, []);

	// Handle OAuth callback returns
	useEffect(() => {
		const isOAuthCallbackReturn = searchParams.get('code') || searchParams.get('error');
		const currentPath = location.pathname;

		if (isOAuthCallbackReturn) {
			console.log(`${MODULE_TAG} OAuth callback detected, processing return...`);

			// Set return target for registration flow
			ReturnTargetServiceV8U.setReturnTarget(
				'mfa_device_registration',
				currentPath,
				3 // Skip to Step 3 (Device Actions) for Registration
			);

			// Handle OAuth callback processing
			if (credentials.userToken?.trim()) {
				toastV8.info('🔄 Returning to Device Actions after authentication...');
				setTimeout(() => {
					nav.goToStep(3); // Skip to Device Actions for Registration
				}, 500);
			}
		}
	}, [searchParams, location.pathname, credentials.userToken, nav]);

	// Step rendering logic
	const renderStepContent = useCallback(() => {
		const renderProps: RegistrationFlowStepperRenderProps = {
			credentials,
			setCredentials,
			mfaState,
			setMfaState,
			tokenStatus: WorkerTokenStatusServiceV8.getCachedTokenStatus(),
			isLoading,
			setIsLoading,
			nav,
			showDeviceLimitModal,
			setShowDeviceLimitModal,
			showWorkerTokenModal,
			setShowWorkerTokenModal,
			showUserLoginModal,
			setShowUserLoginModal,
			showSettingsModal,
			setShowSettingsModal,
			deviceAuthPolicies,
			isLoadingPolicies,
			policiesError,
			refreshDeviceAuthPolicies: async () => {
				setIsLoadingPolicies(true);
				setPoliciesError(null);
				// TODO: implement policy refresh when service is available
				setIsLoadingPolicies(false);
			},
		};

		switch (nav.currentStep) {
			case 0:
				return renderStep0(renderProps);
			case 1:
				return renderStep1(renderProps);
			case 2:
				// Step 2 (Device Selection) is skipped for Registration
				return renderStep3(renderProps); // Skip to Step 3
			case 3:
				return renderStep3(renderProps);
			case 4:
				return renderStep4(renderProps);
			case 5:
				return renderStep5(renderProps);
			case 6:
				return renderStep6(renderProps);
			default:
				return renderStep0(renderProps);
		}
	}, [
		credentials,
		mfaState,
		isLoading,
		nav,
		showDeviceLimitModal,
		showWorkerTokenModal,
		showUserLoginModal,
		showSettingsModal,
		deviceAuthPolicies,
		isLoadingPolicies,
		policiesError,
		renderStep0,
		renderStep1,
		renderStep3,
		renderStep4,
		renderStep5,
		renderStep6,
	]);

	// Navigation logic for Registration flow
	const handleNext = useCallback(() => {
		if (nav.currentStep === 0) {
			if (validateStep0(credentials, WorkerTokenStatusServiceV8.getCachedTokenStatus(), nav)) {
				nav.goToNext(); // Goes to Step 1 (User Login)
			}
		} else if (nav.currentStep === 1) {
			nav.goToStep(3); // Skip Step 2, go to Step 3 (Device Actions)
		} else {
			nav.goToNext();
		}
	}, [nav, credentials, validateStep0]);

	const handlePrevious = useCallback(() => {
		if (nav.currentStep === 3) {
			nav.goToStep(1); // Skip back to Step 1 (User Login)
		} else {
			nav.goToPrevious();
		}
	}, [nav]);

	return (
		<div className="registration-flow-stepper-v8">
			{/* Header Navigation */}
			<MFANavigationV8
				deviceType={deviceType}
				currentStep={nav.currentStep}
				totalSteps={totalSteps}
				stepLabels={stepLabels}
				onStepClick={(step) => {
					// Skip Step 2 for Registration flow
					if (step === 2) {
						nav.goToStep(3);
					} else {
						nav.goToStep(step);
					}
				}}
			/>

			{/* User Display */}
			<MFAUserDisplayV8
				credentials={credentials}
				tokenStatus={WorkerTokenStatusServiceV8.getCachedTokenStatus()}
				onSettingsClick={() => setShowSettingsModal(true)}
			/>

			{/* Step Progress */}
			<div className="step-progress" style={{ marginBottom: '24px' }}>
				{stepLabels.map((label, idx) => {
					// Skip Step 2 for Registration flow
					if (idx === 2) return null;

					const isCompleted = idx < nav.currentStep;
					const isCurrent = idx === nav.currentStep;
					const displayStep = idx > 2 ? idx - 1 : idx; // Adjust display for skipped step

					return (
						<div
							key={idx}
							className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								marginRight: '16px',
								padding: '8px 12px',
								borderRadius: '6px',
								backgroundColor: isCurrent ? '#e5e7eb' : isCompleted ? '#d1fae5' : '#f9fafb',
								border: isCurrent ? '1px solid #9ca3af' : '1px solid #e5e7eb',
							}}
						>
							<span style={{ fontWeight: isCurrent ? '600' : '400' }}>
								Step {displayStep}: {label}
							</span>
						</div>
					);
				})}
			</div>

			{/* Step Content */}
			<div className="step-content">{renderStepContent()}</div>

			{/* Validation Feedback */}
			<StepValidationFeedbackV8
				errors={nav.validationErrors}
				warnings={nav.validationWarnings}
				onValidationRecheck={() => {
					nav.setValidationErrors([]);
					nav.setValidationWarnings([]);

					if (nav.currentStep === 0) {
						const credsToValidate = {
							...credentials,
							flowKey: FLOW_KEY,
							flowType: 'registration',
						};
						if (
							validateStep0(credsToValidate, WorkerTokenStatusServiceV8.getCachedTokenStatus(), nav)
						) {
							console.log(`${MODULE_TAG} Step 0 validation passed`);
						}
					}
				}}
			/>

			{/* Action Buttons */}
			<StepActionButtonsV8
				currentStep={nav.currentStep}
				totalSteps={totalSteps}
				isLoading={isLoading}
				isNextDisabled={isLoading}
				shouldHideNext={shouldHideNextButton?.({
					credentials,
					setCredentials,
					mfaState,
					setMfaState,
					tokenStatus: WorkerTokenStatusServiceV8.getCachedTokenStatus(),
					isLoading,
					setIsLoading,
					nav,
					showDeviceLimitModal,
					setShowDeviceLimitModal,
					showWorkerTokenModal,
					setShowWorkerTokenModal,
					showUserLoginModal,
					setShowUserLoginModal,
					showSettingsModal,
					setShowSettingsModal,
					deviceAuthPolicies,
					isLoadingPolicies,
					policiesError,
					refreshDeviceAuthPolicies: async () => {},
				})}
				onNext={handleNext}
				onPrevious={handlePrevious}
				onCancel={() => {
					// Handle cancellation
					window.history.back();
				}}
			/>

			{/* Modals */}
			<MFADeviceLimitModalV8
				isOpen={showDeviceLimitModal}
				onClose={() => setShowDeviceLimitModal(false)}
			/>

			<WorkerTokenModalV8
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
			/>

			<WorkerTokenPromptModalV8
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
			/>

			<UserLoginModalV8
				isOpen={showUserLoginModal}
				onClose={() => setShowUserLoginModal(false)}
				onTokenReceived={(token) => {
					setCredentials((prev) => ({ ...prev, userToken: token }));
					setShowUserLoginModal(false);
				}}
				environmentId={credentials.environmentId}
				clientId={credentials.clientId}
				clientSecret={credentials.clientSecret}
				redirectUri={credentials.redirectUri}
			/>

			<MFASettingsModalV8
				isOpen={showSettingsModal}
				onClose={() => setShowSettingsModal(false)}
				credentials={credentials}
				onCredentialsChange={setCredentials}
			/>
		</div>
	);
};
