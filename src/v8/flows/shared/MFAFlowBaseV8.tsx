/**
 * @file MFAFlowBaseV8.tsx
 * @module v8/flows/shared
 * @description Base MFA Flow component with shared logic
 * @version 8.1.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/NewAuthContext';
import { usePageScroll } from '@/hooks/usePageScroll';
import { MFADeviceLimitModalV8 } from '@/v8/components/MFADeviceLimitModalV8';
import { MFANavigationV8 } from '@/v8/components/MFANavigationV8';
import { MFASettingsModalV8 } from '@/v8/components/MFASettingsModalV8';
import StepActionButtonsV8 from '@/v8/components/StepActionButtonsV8';
import StepValidationFeedbackV8 from '@/v8/components/StepValidationFeedbackV8';
import { UserLoginModalV8 } from '@/v8/components/UserLoginModalV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { WorkerTokenPromptModalV8 } from '@/v8/components/WorkerTokenPromptModalV8';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { sendAnalyticsLog } from '@/v8/utils/analyticsLoggerV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import type { DeviceAuthenticationPolicy, DeviceType, MFACredentials, MFAState } from './MFATypes';

const MODULE_TAG = '[📱 MFA-FLOW-BASE-V8]';
const FLOW_KEY = 'mfa-flow-v8';

export interface MFAFlowBaseProps {
	deviceType: DeviceType;
	renderStep0: (props: MFAFlowBaseRenderProps) => React.ReactNode;
	renderStep1: (props: MFAFlowBaseRenderProps) => React.ReactNode;
	renderStep2: (props: MFAFlowBaseRenderProps) => React.ReactNode;
	renderStep3: (props: MFAFlowBaseRenderProps) => React.ReactNode;
	renderStep4: (props: MFAFlowBaseRenderProps) => React.ReactNode;
	validateStep0: (
		credentials: MFACredentials,
		tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>,
		nav: ReturnType<typeof useStepNavigationV8>
	) => boolean;
	stepLabels?: string[];
	/** Optional function to determine if Next button should be hidden (e.g., when custom action button is shown) */
	shouldHideNextButton?: (props: MFAFlowBaseRenderProps) => boolean;
}

export interface MFAFlowBaseRenderProps {
	credentials: MFACredentials;
	setCredentials: (
		credentials: MFACredentials | ((prev: MFACredentials) => MFACredentials)
	) => void;
	mfaState: MFAState;
	setMfaState: (state: Partial<MFAState> | ((prev: MFAState) => MFAState)) => void;
	tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>;
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

export const MFAFlowBaseV8: React.FC<MFAFlowBaseProps> = ({
	deviceType,
	renderStep0,
	renderStep1,
	renderStep2,
	renderStep3,
	renderStep4,
	validateStep0,
	stepLabels = ['Configure', 'Select Device', 'Register Device', 'Send OTP', 'Validate'],
	shouldHideNextButton,
}) => {
	const location = useLocation();
	const [searchParams] = useSearchParams();
	// Track API display visibility for padding
	const [apiDisplayVisible, setApiDisplayVisible] = useState(false);

	// Get auth context to check for user tokens from Authorization Code Flow
	const authContext = useAuth();

	// Log initialization only once (use ref to track if we've logged)
	const hasLoggedRef = useRef(false);
	useEffect(() => {
		if (!hasLoggedRef.current) {
			console.log(`${MODULE_TAG} Initializing MFA flow for ${deviceType}`);
			hasLoggedRef.current = true;
		}
	}, [deviceType]);

	// Subscribe to API display visibility changes
	useEffect(() => {
		const unsubscribe = apiDisplayServiceV8.subscribe((isVisible) => {
			setApiDisplayVisible(isVisible);
		});
		// Set initial state
		setApiDisplayVisible(apiDisplayServiceV8.isVisible());
		return unsubscribe;
	}, []);

	usePageScroll({ pageName: 'MFA Flow V8', force: true });

	const totalSteps = stepLabels.length;

	const nav = useStepNavigationV8(totalSteps, {
		onStepChange: (step) => {
			// Removed verbose logging
			window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		},
	});

	const [credentials, setCredentials] = useState<MFACredentials>(() => {
		const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
			flowKey: FLOW_KEY,
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
			deviceType: (stored.deviceType as DeviceType) || deviceType,
			countryCode: stored.countryCode || '+1',
			phoneNumber: stored.phoneNumber || '',
			email: stored.email || '',
			deviceName: stored.deviceName || '',
			deviceAuthenticationPolicyId: stored.deviceAuthenticationPolicyId || '',
			registrationPolicyId: stored.registrationPolicyId || '',
			tokenType: stored.tokenType || 'worker',
			userToken: stored.userToken || '',
			region: (stored.region as 'us' | 'eu' | 'ap' | 'ca' | 'na') || 'us',
			customDomain: stored.customDomain as string | undefined,
		};
	});

	const [mfaState, setMfaState] = useState<MFAState>({
		deviceId: '',
		otpCode: '',
		deviceStatus: '',
		verificationResult: null,
	});

	const [showDeviceLimitModal, setShowDeviceLimitModal] = useState(false);
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [showUserLoginModal, setShowUserLoginModal] = useState(false);
	const [showWorkerTokenPromptModal, setShowWorkerTokenPromptModal] = useState(false);
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [tokenStatus, setTokenStatus] = useState(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
	);
	const [isLoading, setIsLoading] = useState(false);
	const [deviceAuthPolicies, setDeviceAuthPolicies] = useState<DeviceAuthenticationPolicy[]>([]);
	const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
	const [policiesError, setPoliciesError] = useState<string | null>(null);
	const lastFetchedEnvIdRef = useRef<string | null>(null);
	const isFetchingPoliciesRef = useRef(false);

	const fetchDeviceAuthPolicies = useCallback(async () => {
		const envId = credentials.environmentId?.trim();
		const tokenValid = WorkerTokenStatusServiceV8.checkWorkerTokenStatus().isValid;
		if (!envId || !tokenValid) {
			setDeviceAuthPolicies([]);
			setPoliciesError(null);
			lastFetchedEnvIdRef.current = null;
			return;
		}

		// Prevent duplicate calls - if we're already fetching or already fetched for this env, skip
		if (isFetchingPoliciesRef.current || lastFetchedEnvIdRef.current === envId) {
			console.log(`${MODULE_TAG} Skipping duplicate policy fetch`, {
				isFetching: isFetchingPoliciesRef.current,
				lastFetchedEnv: lastFetchedEnvIdRef.current,
				currentEnv: envId,
			});
			return;
		}

		console.log(`${MODULE_TAG} Fetching device authentication policies`, { environmentId: envId });
		isFetchingPoliciesRef.current = true;
		setIsLoadingPolicies(true);
		setPoliciesError(null);

		try {
			const policies = await MFAServiceV8.listDeviceAuthenticationPolicies(envId);
			// eslint-disable-next-line require-atomic-updates
			lastFetchedEnvIdRef.current = envId;
			setDeviceAuthPolicies(policies);

			if (policies.length > 0) {
				setCredentials((prev) => {
					const prevId = prev.deviceAuthenticationPolicyId?.trim();
					const policyIds = policies.map((policy) => policy.id);
					if (prevId && policyIds.includes(prevId)) {
						return prev;
					}

					const defaultPolicyId = policies[0]?.id ?? '';
					if (!defaultPolicyId) {
						return prev;
					}

					if (prevId === defaultPolicyId) {
						return prev;
					}

					return {
						...prev,
						deviceAuthenticationPolicyId: defaultPolicyId,
					};
				});
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			setPoliciesError(message);
			console.error(`${MODULE_TAG} Failed to load device authentication policies`, error);
			toastV8.error(`Failed to load device authentication policies: ${message}`);
		} finally {
			// eslint-disable-next-line require-atomic-updates
			isFetchingPoliciesRef.current = false;
			setIsLoadingPolicies(false);
		}
	}, [credentials.environmentId]);

	// Check token status periodically
	useEffect(() => {
		const interval = setInterval(() => {
			const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(newStatus);
		}, 5000);

		const handleStorageChange = () => {
			const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(newStatus);
		};

		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('workerTokenUpdated', handleStorageChange);

		return () => {
			clearInterval(interval);
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('workerTokenUpdated', handleStorageChange);
		};
	}, []);

	// Save credentials when they change
	useEffect(() => {
		CredentialsServiceV8.saveCredentials(FLOW_KEY, credentials);
	}, [credentials]);

	// Fetch device authentication policies when environment or token changes
	// Only fetch if environment actually changed (not on every token status check)
	useEffect(() => {
		const envId = credentials.environmentId?.trim();

		if (!envId || !tokenStatus.isValid) {
			setDeviceAuthPolicies([]);
			setPoliciesError(null);
			lastFetchedEnvIdRef.current = null;
			return;
		}

		// Only fetch if environment changed (not on every render or token status update)
		if (lastFetchedEnvIdRef.current !== envId && !isFetchingPoliciesRef.current) {
			void fetchDeviceAuthPolicies();
		}
	}, [credentials.environmentId, tokenStatus.isValid, fetchDeviceAuthPolicies]);

	// Auto-populate user token from auth context if available
	// This handles the case where user logged in via Authorization Code Flow and was redirected back
	const hasAutoPopulatedRef = useRef(false);
	useEffect(() => {
		const authToken = authContext.tokens?.access_token;
		const isAuthenticated = authContext.isAuthenticated;

		// Only auto-populate if:
		// 1. User is authenticated and has an access token
		// 2. We haven't already auto-populated (prevent re-running)
		// 3. We don't already have a user token in credentials
		if (isAuthenticated && authToken && !hasAutoPopulatedRef.current && !credentials.userToken) {
			// Check current token type - only auto-populate if 'user' or not set
			const currentTokenType = credentials.tokenType;
			if (currentTokenType === 'user' || !currentTokenType) {
				console.log(`${MODULE_TAG} Auto-populating user token from auth context`, {
					hasToken: !!authToken,
					tokenLength: authToken.length,
					tokenPreview: `${authToken.substring(0, 20)}...`,
					currentTokenType: currentTokenType,
				});

				hasAutoPopulatedRef.current = true;
				setCredentials((prev) => ({
					...prev,
					userToken: authToken,
					tokenType: 'user' as const,
				}));

				toastV8.success('User token automatically loaded from your recent login!');
			}
		}

		// Reset the ref if auth token is cleared (user logged out) or if user token was manually cleared
		if (!isAuthenticated || !authToken || (!credentials.userToken && hasAutoPopulatedRef.current)) {
			hasAutoPopulatedRef.current = false;
		}
	}, [
		authContext.tokens?.access_token,
		authContext.isAuthenticated,
		credentials.tokenType,
		credentials.userToken,
	]);

	// Check for OAuth callback code in URL and open UserLoginModal if needed
	useEffect(() => {
		const code = searchParams.get('code');
		const hasUserLoginState = sessionStorage.getItem('user_login_state_v8');
		const isOAuthCallbackReturn = sessionStorage.getItem('mfa_oauth_callback_return') === 'true';

		// #region agent log
		sendAnalyticsLog({
			location: 'MFAFlowBaseV8.tsx:319',
			message: 'Checking for OAuth callback code in MFAFlowBaseV8',
			data: {
				hasCode: !!code,
				hasUserLoginState: !!hasUserLoginState,
				isOAuthCallbackReturn,
				showUserLoginModal,
				windowLocationSearch: window.location.search,
			},
			timestamp: Date.now(),
			sessionId: 'debug-session',
			runId: 'run3',
			hypothesisId: 'F',
		});
		// #endregion

		// If we have a code and user login state, this is a callback from user login
		if (code && hasUserLoginState && !showUserLoginModal) {
			// #region agent log
			sendAnalyticsLog({
				location: 'MFAFlowBaseV8.tsx:324',
				message: 'Opening UserLoginModal to process callback code',
				data: { hasCode: !!code, hasUserLoginState: !!hasUserLoginState, showUserLoginModal },
				timestamp: Date.now(),
				sessionId: 'debug-session',
				runId: 'run3',
				hypothesisId: 'F',
			});
			// #endregion

			console.log(
				`${MODULE_TAG} Detected OAuth callback code in URL, opening UserLoginModal to process it`
			);
			setShowUserLoginModal(true);
		}

		// CRITICAL: After OAuth callback returns, check if we need to auto-advance
		// This handles the case where user was on Step 0 (or Step 2 for registration) before OAuth
		// and now needs to proceed after receiving the user token
		if (isOAuthCallbackReturn && credentials.userToken?.trim() && nav.currentStep === 0) {
			console.log(
				`${MODULE_TAG} ✅ OAuth callback return detected with user token - auto-advancing from step 0`
			);
			toastV8.info('🔄 Returning to your previous step after authentication...');

			// Clean up the marker
			sessionStorage.removeItem('mfa_oauth_callback_return');

			// Validate step 0 and advance if valid
			setTimeout(() => {
				if (validateStep0(credentials, tokenStatus, nav)) {
					nav.goToNext();
					console.log(`${MODULE_TAG} ✅ Auto-advanced to step 1 after OAuth callback`);
				} else {
					console.log(`${MODULE_TAG} ⚠️ Step 0 validation failed, staying on step 0`);
				}
			}, 500); // Small delay to ensure credentials are fully updated
		}
	}, [
		searchParams,
		showUserLoginModal,
		credentials.userToken,
		nav,
		validateStep0,
		credentials,
		tokenStatus,
	]);

	// Watch for worker token errors and show prompt modal (or attempt silent retrieval)
	useEffect(() => {
		const hasWorkerTokenError = nav.validationErrors.some(
			(error) =>
				error.includes('Failed to get worker token') ||
				error.includes('Please configure worker token credentials first') ||
				error.includes('Worker token is not available') ||
				error.includes('Worker token has expired') ||
				error.includes('Worker token expired') ||
				error.includes('token is not available') ||
				error.includes('token has expired') ||
				(error.includes('Failed to authenticate') && error.includes('worker token'))
		);

		if (hasWorkerTokenError && !showWorkerTokenPromptModal) {
			// Check MFA configuration for silent API retrieval setting
			void (async () => {
				let silentRetrievalSucceeded = false;
				try {
					const { MFAConfigurationServiceV8 } = await import(
						'@/v8/services/mfaConfigurationServiceV8'
					);
					const config = MFAConfigurationServiceV8.loadConfiguration();
					const silentApiRetrieval = config.workerToken.silentApiRetrieval;
					const showTokenAtEnd = config.workerToken.showTokenAtEnd;

					console.log(`${MODULE_TAG} Worker token error detected`, {
						silentApiRetrieval,
						showTokenAtEnd,
						hasWorkerTokenError,
					});

					// Use helper function to attempt silent retrieval (respects silentApiRetrieval setting)
					const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
					// #region agent log
					fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MFAFlowBaseV8.tsx:439',message:'Calling handleShowWorkerTokenModal from error handler',data:{silentApiRetrieval,showTokenAtEnd},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
					// #endregion
					await handleShowWorkerTokenModal(setShowWorkerTokenModal, setTokenStatus, silentApiRetrieval, showTokenAtEnd);
				} catch (configError) {
					console.error(`${MODULE_TAG} Failed to load MFA configuration:`, configError);
					// Only show modal if config can't be loaded AND we can't determine showTokenAtEnd
					// Default to not showing modal to be safe (user can manually trigger if needed)
					console.warn(`${MODULE_TAG} Config error - not showing modal automatically`);
				}
			})();
		}
	}, [nav.validationErrors, showWorkerTokenPromptModal, setTokenStatus, nav]);

	useEffect(() => {
		// NOTE: Scope checking removed - worker token provides necessary permissions
	}, []);

	const handleWorkerTokenGenerated = () => {
		void (async () => {
			window.dispatchEvent(new Event('workerTokenUpdated'));
			const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(newStatus);
			nav.setValidationErrors([]);
			toastV8.success('Worker token generated and saved!');

			await fetchDeviceAuthPolicies();
		})();
	};

	// Wrapper for setMfaState to handle Partial<MFAState>
	const handleSetMfaState = (state: Partial<MFAState> | ((prev: MFAState) => MFAState)) => {
		if (typeof state === 'function') {
			setMfaState(state);
		} else {
			setMfaState((prev) => ({ ...prev, ...state }));
		}
	};

	const renderStepContent = () => {
		const renderProps: MFAFlowBaseRenderProps = {
			credentials,
			setCredentials,
			mfaState,
			setMfaState: handleSetMfaState,
			tokenStatus,
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
			refreshDeviceAuthPolicies: fetchDeviceAuthPolicies,
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
			default:
				return renderStep0(renderProps);
		}
	};

	const isNextDisabled = () => {
		if (isLoading) return true;
		if (nav.currentStep === 0) {
			// Per rightTOTP.md: Check token validity based on token type (worker or user)
			const tokenType = credentials.tokenType || 'worker';
			const isTokenValid =
				tokenType === 'worker' ? tokenStatus.isValid : !!credentials.userToken?.trim();

			// Debug logging for token validation
			if (tokenType === 'user' && !isTokenValid) {
				console.log(`${MODULE_TAG} [DEBUG] Next button disabled - user token validation`, {
					hasUserToken: !!credentials.userToken,
					userTokenLength: credentials.userToken?.length,
					tokenType,
					environmentId: !!credentials.environmentId.trim(),
					username: !!credentials.username.trim(),
					isLoadingPolicies,
					hasPolicy: !!credentials.deviceAuthenticationPolicyId?.trim(),
				});
			}

			return (
				!isTokenValid ||
				!credentials.environmentId.trim() ||
				!credentials.username.trim() ||
				isLoadingPolicies ||
				!credentials.deviceAuthenticationPolicyId?.trim()
			);
		}
		return false;
	};

	const shouldHideNext = () => {
		if (shouldHideNextButton) {
			const renderProps: MFAFlowBaseRenderProps = {
				credentials,
				setCredentials,
				mfaState,
				setMfaState: handleSetMfaState,
				tokenStatus,
				isLoading,
				setIsLoading,
				nav,
				showDeviceLimitModal,
				setShowDeviceLimitModal,
				showWorkerTokenModal,
				setShowWorkerTokenModal,
				showSettingsModal,
				setShowSettingsModal,
				deviceAuthPolicies,
				isLoadingPolicies,
				policiesError,
				refreshDeviceAuthPolicies: fetchDeviceAuthPolicies,
			};
			return shouldHideNextButton(renderProps);
		}
		return false;
	};

	return (
		<div className="mfa-flow-v8">
			<div className="flow-header">
				<div className="header-content">
					<div className="header-left">
						<div>
							<div className="version-tag">MFA Flow V8</div>
							<h1>PingOne MFA Device Management</h1>
							<p>Register and manage MFA devices for users</p>
						</div>
					</div>
					<div className="header-right">
						<div className="step-badge">
							{(() => {
								// Count visible steps (non-empty labels) up to current step
								const visibleSteps = stepLabels.filter((label) => label && label.trim() !== '');
								const currentVisibleStep = stepLabels
									.slice(0, nav.currentStep + 1)
									.filter((label) => label && label.trim() !== '').length;
								const totalVisibleSteps = visibleSteps.length;
								return (
									<>
										<span className="step-number">{currentVisibleStep}</span>
										<span className="step-divider">/</span>
										<span className="step-total">{totalVisibleSteps}</span>
									</>
								);
							})()}
						</div>
					</div>
				</div>
			</div>

			{/* Navigation */}
			<MFANavigationV8 currentPage="registration" showBackToMain={true} />

			<div className="flow-container">
				<div className="step-breadcrumb">
					{stepLabels
						.map((label, idx) => ({ label, idx }))
						.filter(({ label }) => label && label.trim() !== '') // Filter out empty labels
						.map(({ label, idx }) => (
							<div key={`${label}-${idx}`} className="breadcrumb-item">
								<span
									className={`breadcrumb-text ${idx === nav.currentStep ? 'active' : ''} ${nav.completedSteps.includes(idx) ? 'completed' : ''}`}
								>
									{label}
								</span>
								{idx < stepLabels.length - 1 && <span className="breadcrumb-arrow">→</span>}
							</div>
						))}
				</div>

				<div className="step-content-wrapper" style={{ paddingBottom: '12px' }}>
					{renderStepContent()}
				</div>

				<StepValidationFeedbackV8 errors={nav.validationErrors} warnings={nav.validationWarnings} />

				{/* Cancel Authentication Button - Show when authentication is in progress */}
				{mfaState.authenticationId && (nav.currentStep === 3 || nav.currentStep === 4) && (
					<div
						style={{
							position: 'fixed',
							bottom: '20px',
							left: 0,
							right: 0,
							display: 'flex',
							justifyContent: 'center',
							padding: '16px',
							background: 'rgba(255, 255, 255, 0.9)',
							boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
							zIndex: 1000,
						}}
					>
						<button
							type="button"
							className="btn btn-outline-danger"
							style={{
								padding: '8px 20px',
								borderRadius: '4px',
								fontWeight: 500,
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
							onClick={async () => {
								if (!mfaState.authenticationId) return;

								setIsLoading(true);
								try {
									console.log(`${MODULE_TAG} Canceling device authentication:`, {
										authenticationId: mfaState.authenticationId,
									});

									await MFAServiceV8.cancelDeviceAuthentication({
										...credentials,
										authenticationId: mfaState.authenticationId,
										reason: 'CHANGE_DEVICE',
									});

									// Clear authentication state
									setMfaState((prev) => ({
										...prev,
										authenticationId: '',
										otpCode: '',
										verificationResult: null,
									}));

									// Navigate back to device selection
									nav.setValidationErrors([]);
									nav.setValidationWarnings([]);
									nav.goToStep(1);
									toastV8.success('Authentication canceled successfully');
								} catch (error) {
									const errorMessage = error instanceof Error ? error.message : 'Unknown error';
									console.error(`${MODULE_TAG} Failed to cancel authentication:`, error);
									toastV8.error(`Failed to cancel authentication: ${errorMessage}`);
									nav.setValidationErrors([`Failed to cancel: ${errorMessage}`]);
								} finally {
									setIsLoading(false);
								}
							}}
							disabled={isLoading}
							title="Cancel the current authentication flow"
						>
							{isLoading ? (
								<>
									{/* biome-ignore lint/a11y/useSemanticElements: Bootstrap spinner requires span with role="status" */}
									<span
										className="spinner-border spinner-border-sm me-2"
										role="status"
										aria-hidden="true"
									></span>
									Canceling...
								</>
							) : (
								<>
									<FiX size={16} />
									Cancel Authentication
								</>
							)}
						</button>
					</div>
				)}

				<StepActionButtonsV8
					currentStep={nav.currentStep}
					totalSteps={totalSteps}
					isNextDisabled={isNextDisabled()}
					hideNextButton={shouldHideNext()}
					hidePreviousButton={false}
					onPrevious={() => {
						nav.setValidationErrors([]);
						nav.setValidationWarnings([]);
						
						// For TOTP, close modals before navigating
						if (deviceType === 'TOTP') {
							// Close any open modals first
							// Note: Modal state is managed in TOTPFlowV8, so we just navigate
							// The modal close handlers will handle cleanup
						}
						
						// Navigate to previous step
						if (nav.canGoPrevious) {
							nav.goToPrevious();
						} else {
							// No valid previous step, this shouldn't happen (Previous button should be disabled)
							console.warn(`${MODULE_TAG} Previous button clicked but canGoPrevious is false`);
						}
					}}
					onNext={() => {
						if (nav.currentStep === 0) {
							// Re-check credentials before validation (in case they were just updated)
							const currentCreds = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
								flowKey: FLOW_KEY,
								flowType: 'oidc',
								includeClientSecret: false,
								includeRedirectUri: false,
								includeLogoutUri: false,
								includeScopes: false,
							});

							// Use current credentials if they have a userToken but state doesn't
							const credsToValidate =
								currentCreds.userToken && !credentials.userToken
									? { ...credentials, ...currentCreds }
									: credentials;

							console.log(`${MODULE_TAG} Validating step 0 before proceeding`, {
								hasUserToken: !!credsToValidate.userToken,
								tokenType: credsToValidate.tokenType,
								hasEnvironmentId: !!credsToValidate.environmentId,
								hasUsername: !!credsToValidate.username,
								hasPolicy: !!credsToValidate.deviceAuthenticationPolicyId,
							});

							if (validateStep0(credsToValidate, tokenStatus, nav)) {
								nav.goToNext();
							}
						} else if (nav.currentStep === 1) {
							// Step 1: Select Device
							// If user has selected an existing device and has authenticationId, they should use "Use Selected Device" button
							// Don't allow Next button to go to registration if they have an existing device selected
							if (mfaState.authenticationId) {
								console.warn(
									`${MODULE_TAG} User has authenticationId but clicked Next - this should use "Use Selected Device" button instead`
								);
								nav.setValidationErrors([
									'Please click "Use Selected Device" button to authenticate with the selected device, or select "Register New Device" to register a new one.',
								]);
								return;
							}
							// If no device selected or new device selected, allow navigation to registration
							nav.goToNext();
						} else if (nav.currentStep === 3 && deviceType === 'TOTP') {
							// Step 3: QR Code page for TOTP
							// For TOTP registration flow, Step 3 is the QR code page and should never navigate to Step 4
							// Step 4 is only for authentication flow validation
							// Check if this is a registration flow (configured flag in location state)
							const locationState = location.state as { configured?: boolean } | undefined;
							const isRegistrationFlow = locationState?.configured === true;
							
							if (isRegistrationFlow) {
								// For registration flow, don't navigate to Step 4
								// The QR code page (Step 3) should stay on Step 3
								// Success page will be shown after device activation
								console.log(`${MODULE_TAG} TOTP registration flow: Preventing navigation from Step 3 to Step 4`);
								return;
							}
							// For authentication flow, allow navigation to Step 4
							nav.goToNext();
						} else {
							nav.goToNext();
						}
					}}
					onFinal={() => {
						console.log(`${MODULE_TAG} Starting new flow`);
						nav.reset();
						nav.setValidationErrors([]);
						nav.setValidationWarnings([]);
						setMfaState({
							deviceId: '',
							otpCode: '',
							deviceStatus: '',
							verificationResult: null,
						});
					}}
				></StepActionButtonsV8>
			</div>

			{/* Modals */}
			<WorkerTokenPromptModalV8
				isOpen={showWorkerTokenPromptModal}
				onClose={() => {
					setShowWorkerTokenPromptModal(false);
					// Clear the error when user dismisses the modal
					nav.setValidationErrors([]);
				}}
				onGetToken={async () => {
					// Use helper to show worker token modal (respects silent API retrieval setting)
					const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
					// Load config to get silentApiRetrieval and showTokenAtEnd
					const { MFAConfigurationServiceV8 } = await import('@/v8/services/mfaConfigurationServiceV8');
					const config = MFAConfigurationServiceV8.loadConfiguration();
					const silentApiRetrieval = config.workerToken.silentApiRetrieval || false;
					const showTokenAtEnd = config.workerToken.showTokenAtEnd !== false;
					// #region agent log
					fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MFAFlowBaseV8.tsx:836',message:'Calling handleShowWorkerTokenModal from prompt modal',data:{silentApiRetrieval,showTokenAtEnd},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
					// #endregion
					await handleShowWorkerTokenModal(setShowWorkerTokenModal, setTokenStatus, silentApiRetrieval, showTokenAtEnd, true);
				}}
			/>

			{showWorkerTokenModal && (() => {
				// Check if we should show token only (matches MFA pattern)
				try {
					const { MFAConfigurationServiceV8 } = require('@/v8/services/mfaConfigurationServiceV8');
					const config = MFAConfigurationServiceV8.loadConfiguration();
					const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
					
					// Show token-only if showTokenAtEnd is ON and token is valid
					const showTokenOnly = config.workerToken.showTokenAtEnd && tokenStatus.isValid;
					
					return (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={() => setShowWorkerTokenModal(false)}
					onTokenGenerated={handleWorkerTokenGenerated}
							showTokenOnly={showTokenOnly}
						/>
					);
				} catch {
					return (
						<WorkerTokenModalV8
							isOpen={showWorkerTokenModal}
							onClose={() => setShowWorkerTokenModal(false)}
							onTokenGenerated={handleWorkerTokenGenerated}
						/>
					);
				}
			})()}

			{showUserLoginModal && (
				<UserLoginModalV8
					isOpen={showUserLoginModal}
					onClose={() => setShowUserLoginModal(false)}
					onTokenReceived={(token) => {
						// #region agent log
						sendAnalyticsLog({
							location: 'MFAFlowBaseV8.tsx:718',
							message: 'onTokenReceived callback invoked',
							data: { hasToken: !!token, tokenLength: token?.length },
							timestamp: Date.now(),
							sessionId: 'debug-session',
							runId: 'run3',
							hypothesisId: 'F',
						});
						// #endregion

						console.log(`${MODULE_TAG} Token received, updating credentials`, {
							tokenLength: token.length,
							tokenPreview: `${token.substring(0, 20)}...`,
						});

						// Clean up callback URL parameters to prevent re-processing
						if (
							window.location.search.includes('code=') ||
							window.location.search.includes('state=')
						) {
							const cleanUrl = window.location.pathname;
							window.history.replaceState({}, document.title, cleanUrl);
						}

						setCredentials((prev) => {
							const updated = { ...prev, userToken: token, tokenType: 'user' as const };

							// #region agent log
							sendAnalyticsLog({
								location: 'MFAFlowBaseV8.tsx:730',
								message: 'Credentials updated with user token',
								data: {
									hasUserToken: !!updated.userToken,
									tokenType: updated.tokenType,
									userTokenLength: updated.userToken?.length,
								},
								timestamp: Date.now(),
								sessionId: 'debug-session',
								runId: 'run3',
								hypothesisId: 'F',
							});
							// #endregion

							console.log(`${MODULE_TAG} Updated credentials`, {
								hasUserToken: !!updated.userToken,
								tokenType: updated.tokenType,
								userTokenLength: updated.userToken?.length,
							});
							return updated;
						});

						// Check if we need to restore flow state after OAuth callback
						// This handles the case where user was registering a device with ACTIVATION_REQUIRED status
						const storedFlowState = sessionStorage.getItem('mfa_flow_state_after_oauth');
						if (storedFlowState) {
							try {
								const flowState = JSON.parse(storedFlowState);
								console.log(`${MODULE_TAG} Restoring flow state after OAuth callback`, flowState);

								// Restore step if device was registered with ACTIVATION_REQUIRED
								if (flowState.deviceStatus === 'ACTIVATION_REQUIRED' && flowState.deviceId) {
									setMfaState((prev) => ({
										...prev,
										deviceId: flowState.deviceId,
										deviceStatus: 'ACTIVATION_REQUIRED',
										...(flowState.deviceActivateUri
											? { deviceActivateUri: flowState.deviceActivateUri }
											: {}),
									}));

									// Navigate to validation step (Step 3 for Email, Step 4 for SMS/WhatsApp)
									// The actual step number depends on the flow, but we'll let the flow component handle it
									console.log(
										`${MODULE_TAG} Device requires activation - user should proceed to OTP validation`
									);
								}

								// Clean up stored state
								sessionStorage.removeItem('mfa_flow_state_after_oauth');
							} catch (error) {
								console.error(`${MODULE_TAG} Failed to restore flow state:`, error);
							}
						}

						setShowUserLoginModal(false);
						toastV8.success('User token received and saved!');

						// Force a re-validation check after state update
						setTimeout(() => {
							const currentCreds = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
								flowKey: FLOW_KEY,
								flowType: 'oidc',
								includeClientSecret: false,
								includeRedirectUri: false,
								includeLogoutUri: false,
								includeScopes: false,
							});
							console.log(`${MODULE_TAG} Post-save credential check`, {
								hasUserToken: !!currentCreds.userToken,
								tokenType: currentCreds.tokenType,
							});

							// Check if Step 0 is now complete and we can proceed
							if (nav.currentStep === 0) {
								const tokenType = currentCreds.tokenType || 'worker';
								const isTokenValid =
									tokenType === 'worker' ? tokenStatus.isValid : !!currentCreds.userToken?.trim();

								const isStep0Complete =
									isTokenValid &&
									currentCreds.environmentId?.trim() &&
									currentCreds.username?.trim() &&
									!isLoadingPolicies &&
									currentCreds.deviceAuthenticationPolicyId?.trim();

								if (isStep0Complete) {
									console.log(
										`${MODULE_TAG} Step 0 is now complete after token receipt - user can proceed to next step`
									);
									// Don't auto-advance, let user click Next button
									// But ensure they stay on the current page
								}
							}
						}, 100);
					}}
					onCredentialsSaved={() => {
						// Reload saved credentials from user-login-v8 flow to sync with MFA flow
						const savedCreds = CredentialsServiceV8.loadCredentials('user-login-v8', {
							flowKey: 'user-login-v8',
							flowType: 'oidc',
							includeClientSecret: true,
							includeRedirectUri: true,
							includeLogoutUri: false,
							includeScopes: true,
						});

						// Update MFA credentials with saved user login credentials (but don't overwrite existing MFA-specific fields)
						if (savedCreds.environmentId || savedCreds.clientId) {
							setCredentials((prev) => ({
								...prev,
								environmentId: savedCreds.environmentId || prev.environmentId,
								clientId: savedCreds.clientId || prev.clientId,
								// Note: userToken is only set when actually received via onTokenReceived
							}));
							console.log(`${MODULE_TAG} Synced saved credentials from User Login Modal`);
						}
					}}
					environmentId={credentials.environmentId}
				/>
			)}

			{showSettingsModal && credentials.environmentId && (
				<MFASettingsModalV8
					isOpen={showSettingsModal}
					environmentId={credentials.environmentId}
					onClose={() => setShowSettingsModal(false)}
				/>
			)}

			{showDeviceLimitModal && (
				<MFADeviceLimitModalV8
					isOpen={showDeviceLimitModal}
					onClose={() => setShowDeviceLimitModal(false)}
					deviceType="MFA"
				/>
			)}

			<style>{`
				.mfa-flow-v8 {
					max-width: 1000px;
					margin: 0 auto;
					background: #f8f9fa;
					min-height: auto;
					overflow-y: auto;
					padding-bottom: ${apiDisplayVisible ? '420px' : '16px'};
					transition: padding-bottom 0.3s ease;
				}

				body {
					overflow-y: auto !important;
					overflow-x: hidden;
				}

				html {
					overflow-y: auto !important;
					overflow-x: hidden;
				}

				.flow-header {
					background: linear-gradient(135deg, #10b981 0%, #059669 100%);
					padding: 12px 20px;
					margin-bottom: 0;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
				}

				.header-content {
					display: flex;
					align-items: center;
					justify-content: space-between;
				}

				.header-left {
					display: flex;
					align-items: flex-start;
					gap: 20px;
					flex: 1;
				}

				.version-tag {
					font-size: 11px;
					font-weight: 700;
					color: rgba(26, 26, 26, 0.7);
					letter-spacing: 1.5px;
					text-transform: uppercase;
					padding-top: 2px;
				}

				.flow-header h1 {
					font-size: 20px;
					font-weight: 700;
					margin: 0 0 2px 0;
					color: #1a1a1a;
				}

				.flow-header p {
					font-size: 13px;
					color: rgba(26, 26, 26, 0.75);
					margin: 0;
				}

				.header-right {
					display: flex;
					align-items: center;
				}

				.step-badge {
					background: rgba(255, 255, 255, 0.95);
					padding: 6px 12px;
					border-radius: 16px;
					display: flex;
					align-items: center;
					gap: 4px;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
				}

				.step-number {
					font-size: 18px;
					font-weight: 700;
					color: #10b981;
				}

				.step-divider {
					font-size: 12px;
					color: #999;
					font-weight: 500;
				}

				.step-total {
					font-size: 14px;
					font-weight: 600;
					color: #666;
				}

				.step-breadcrumb {
					background: linear-gradient(to bottom, #d1fae5, #a7f3d0);
					padding: 10px 16px;
					border-bottom: 2px solid #10b981;
					display: flex;
					align-items: center;
					gap: 8px;
					flex-wrap: wrap;
				}

				.breadcrumb-item {
					display: flex;
					align-items: center;
					gap: 6px;
				}

				.breadcrumb-text {
					font-size: 12px;
					font-weight: 500;
					color: #6b7280;
					padding: 4px 10px;
					border-radius: 4px;
					background: white;
					border: 1px solid #e8e8e8;
					transition: all 0.3s ease;
					cursor: default;
				}

				.breadcrumb-text.completed {
					color: white;
					background: #10b981;
					border-color: #10b981;
					font-weight: 700;
					box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
				}

				.breadcrumb-text.active {
					color: white;
					background: #059669;
					border-color: #059669;
					font-weight: 700;
					box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
					transform: scale(1.05);
				}

				.breadcrumb-arrow {
					color: #10b981;
					font-size: 20px;
					font-weight: 700;
					opacity: 0.6;
				}

				.flow-container {
					display: flex;
					flex-direction: column;
					gap: 8px;
					padding-bottom: 16px;
				}

				.step-content-wrapper {
					background: white;
					border: 1px solid #ddd;
					border-radius: 8px;
					padding: 12px 16px;
					margin: 8px 0;
					min-height: auto;
				}

				.step-content h2 {
					font-size: 16px;
					font-weight: 600;
					margin: 0 0 4px 0;
					color: #1f2937;
				}

				.step-content > p {
					font-size: 12px;
					color: #6b7280;
					margin: 0 0 8px 0;
				}

				.credentials-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
					gap: 0;
				}

				.form-group {
					display: flex;
					flex-direction: column;
					gap: 4px;
					margin-bottom: 0;
				}

				.form-group label {
					font-size: 13px;
					font-weight: 500;
					color: #374151;
				}

				.required {
					color: #ef4444;
					margin-left: 2px;
				}

				.form-group input,
				.form-group select {
					padding: 6px 10px;
					border: 1px solid #d1d5db;
					border-radius: 4px;
					font-size: 13px;
					color: #1f2937;
					background: white;
				}

				.form-group input:focus,
				.form-group select:focus {
					outline: none;
					border-color: #10b981;
					box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
				}

				.form-group small {
					font-size: 12px;
					color: #6b7280;
				}

				.info-box {
					background: #dbeafe;
					border: 1px solid #93c5fd;
					border-radius: 6px;
					padding: 16px 20px;
					margin: 8px 0;
				}

				.info-box h4 {
					margin: 0 0 12px 0;
					font-size: 16px;
					font-weight: 600;
					color: #1e40af;
				}

				.info-box ul {
					margin: 0;
					padding-left: 20px;
					color: #1e40af;
				}

				.info-box li {
					margin: 6px 0;
					font-size: 14px;
					line-height: 1.5;
					color: #1e40af;
				}

				.info-box p {
					margin: 4px 0;
					font-size: 12px;
					color: #1e40af;
				}

				.success-box {
					background: #d1fae5;
					border: 1px solid #6ee7b7;
					border-radius: 6px;
					padding: 8px 12px;
					margin: 8px 0;
				}

				.success-box h3 {
					margin: 0 0 6px 0;
					font-size: 14px;
					color: #065f46;
				}

				.success-box p {
					margin: 4px 0;
					font-size: 12px;
					color: #047857;
				}

				.btn {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					gap: 8px;
					padding: 10px 20px;
					border: none;
					border-radius: 6px;
					font-size: 14px;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;
				}

				.btn-primary {
					background: #10b981;
					color: white;
				}

				.btn-primary:hover {
					background: #059669;
				}

				.btn-primary:disabled {
					background: #d1d5db;
					cursor: not-allowed;
				}

				.btn-reset {
					background: #f59e0b;
					color: white;
					align-self: flex-start;
				}

				.btn-reset:hover {
					background: #d97706;
				}

				@media (max-width: 600px) {
					.mfa-flow-v8 {
						padding: 12px;
					}

					.flow-header h1 {
						font-size: 20px;
					}

					.credentials-grid {
						grid-template-columns: 1fr;
					}

					.btn {
						width: 100%;
					}
				}
			`}</style>
		</div>
	);
};
