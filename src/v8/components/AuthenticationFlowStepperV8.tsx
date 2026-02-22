/**
 * @file AuthenticationFlowStepperV8.tsx
 * @module v8/components
 * @description Dedicated stepper for MFA Authentication flows
 * @version 8.0.0
 * @since 2026-02-06
 *
 * Purpose: Provide a dedicated stepper component for Authentication flows that:
 * - Uses Authentication-specific step sequence (4 steps)
 * - Includes Device Selection step (Step 2)
 * - Goes from User Login to Device Selection then Device Actions
 * - Provides Authentication-specific validation and navigation
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { MFADeviceLimitModalV8 } from '@/apps/mfa/components/MFADeviceLimitModalV8';
import { MFANavigationV8 } from '@/apps/mfa/components/MFANavigationV8';
import { MFASettingsModalV8 } from '@/apps/mfa/components/MFASettingsModalV8';
import { MFAUserDisplayV8 } from '@/apps/mfa/components/MFAUserDisplayV8';
import { WorkerTokenPromptModalV8 } from '@/apps/mfa/components/WorkerTokenPromptModalV8';
import type {
	DeviceAuthenticationPolicy,
	DeviceType,
	MFACredentials,
	MFAState,
} from '@/apps/mfa/flows/shared/MFATypes';
import StepActionButtonsV8 from '@/v8/components/StepActionButtonsV8';
import StepValidationFeedbackV8 from '@/v8/components/StepValidationFeedbackV8';
import { UserLoginModalV8 } from '@/v8/components/UserLoginModalV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔐 AUTHENTICATION-STEPPER-V8]';
const FLOW_KEY = 'mfa-authentication-flow-v8';

export interface AuthenticationFlowStepperV8Props {
	deviceType: DeviceType;
	renderStep0: (props: AuthenticationFlowStepperRenderProps) => React.ReactNode;
	renderStep1: (props: AuthenticationFlowStepperRenderProps) => React.ReactNode;
	renderStep2: (props: AuthenticationFlowStepperRenderProps) => React.ReactNode;
	renderStep3: (props: AuthenticationFlowStepperRenderProps) => React.ReactNode;
	renderStep4: (props: AuthenticationFlowStepperRenderProps) => React.ReactNode;
	renderStep5: (props: AuthenticationFlowStepperRenderProps) => React.ReactNode;
	renderStep6: (props: AuthenticationFlowStepperRenderProps) => React.ReactNode;
	validateStep0: (
		credentials: MFACredentials,
		tokenStatus: any,
		nav: ReturnType<typeof useStepNavigationV8>
	) => boolean;
	stepLabels?: string[];
	/** Optional function to determine if Next button should be hidden */
	shouldHideNextButton?: (props: AuthenticationFlowStepperRenderProps) => boolean;
}

export interface AuthenticationFlowStepperRenderProps {
	credentials: MFACredentials;
	setCredentials: (
		credentials: MFACredentials | ((prev: MFACredentials) => MFACredentials)
	) => void;
	mfaState: MFAState;
	setMfaState: (state: Partial<MFAState>) => void;
	tokenStatus: any;
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

export const AuthenticationFlowStepperV8: React.FC<AuthenticationFlowStepperV8Props> = ({
	deviceType,
	renderStep0,
	renderStep1,
	renderStep2,
	renderStep3,
	renderStep4,
	renderStep5,
	renderStep6,
	validateStep0,
	stepLabels = [
		'Configure',
		'User Login',
		'Device Selection',
		'QR Code',
		'Device Actions',
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
			flowType: 'oauth',
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

	// Authentication flow has 7 steps
	const totalSteps = stepLabels.length;

	const nav = useStepNavigationV8(totalSteps, {
		// ✅ Remove initialStep override - starts at Step 0 (Configuration) as documented
		onStepChange: () => {
			window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
		},
	});

	// Load saved credentials on mount
	useEffect(() => {
		const saved = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
			flowKey: FLOW_KEY,
			flowType: 'oauth',
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

			// Store flow context for callback handler (Unified OAuth pattern)
			const flowContext = {
				returnPath: currentPath,
				returnStep: 2, // Step 2: Device Selection for Authentication
				flowType: 'authentication' as const,
				timestamp: Date.now(),
			};

			sessionStorage.setItem('mfa_flow_callback_context', JSON.stringify(flowContext));

			console.log(`${MODULE_TAG} 🎯 Stored flow context for authentication`);

			// Handle OAuth callback processing
			if (credentials.userToken?.trim()) {
				toastV8.info('🔄 Returning to Device Selection after authentication...');
				setTimeout(() => {
					nav.goToStep(2); // Go to Step 2 (Device Selection) for Authentication
				}, 500);
			}
		}
	}, [searchParams, location.pathname, credentials.userToken, nav]);

	// Step rendering logic
	const renderStepContent = useCallback(() => {
		const renderProps: AuthenticationFlowStepperRenderProps = {
			credentials,
			setCredentials,
			mfaState,
			setMfaState,
			tokenStatus: WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync(),
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
				try {
					// Refresh policies logic here
					console.log(`${MODULE_TAG} Refreshing device auth policies...`);
				} catch (error) {
					setPoliciesError('Failed to refresh policies');
					console.error(`${MODULE_TAG} Error refreshing policies:`, error);
				} finally {
					setIsLoadingPolicies(false);
				}
			},
		};

		switch (nav.currentStep) {
			case 0:
				return renderStep0(renderProps);
			case 1:
				return renderStep1(renderProps);
			case 2:
				return renderStep2(renderProps);
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
		renderStep2,
		renderStep3,
		renderStep4,
		renderStep5,
		renderStep6,
	]);

	// Navigation logic for Authentication flow
	const handleNext = useCallback(() => {
		if (nav.currentStep === 0) {
			if (
				validateStep0(credentials, WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync(), nav)
			) {
				nav.goToNext(); // Goes to Step 1 (User Login)
			}
		} else {
			nav.goToNext();
		}
	}, [nav, credentials, validateStep0]);

	const handlePrevious = useCallback(() => {
		nav.goToPrevious();
	}, [nav]);

	return (
		<div className="authentication-flow-stepper-v8">
			{/* Header Navigation */}
			<MFANavigationV8
				currentStep={nav.currentStep}
				totalSteps={totalSteps}
				stepLabels={stepLabels}
				onStepClick={(step) => nav.goToStep(step)}
			/>

			{/* User Display */}
			<MFAUserDisplayV8
				tokenStatus={WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync()}
				onSettingsClick={() => setShowSettingsModal(true)}
			/>

			{/* Step Progress */}
			<div className="step-progress" style={{ marginBottom: '24px' }}>
				{stepLabels.map((label, idx) => {
					const isCompleted = idx < nav.currentStep;
					const isCurrent = idx === nav.currentStep;

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
								Step {idx + 1}: {label}
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
							flowType: 'oauth',
						};
						if (
							validateStep0(
								credsToValidate,
								WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync(),
								nav
							)
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
				onGetToken={async () => {
					// Handle worker token acquisition
					console.log(`${MODULE_TAG} Getting worker token...`);
					setShowWorkerTokenModal(false);
				}}
			/>

			<UserLoginModalV8
				isOpen={showUserLoginModal}
				onClose={() => setShowUserLoginModal(false)}
				onTokenReceived={(token) => {
					setCredentials((prev) => ({ ...prev, userToken: token }));
					setShowUserLoginModal(false);
				}}
			/>

			<MFASettingsModalV8
				isOpen={showSettingsModal}
				onClose={() => setShowSettingsModal(false)}
				onCredentialsChange={setCredentials}
			/>
		</div>
	);
};
