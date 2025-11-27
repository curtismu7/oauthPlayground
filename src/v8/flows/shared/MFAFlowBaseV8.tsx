/**
 * @file MFAFlowBaseV8.tsx
 * @module v8/flows/shared
 * @description Base MFA Flow component with shared logic
 * @version 8.1.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePageScroll } from '@/hooks/usePageScroll';
import { MFADeviceLimitModalV8 } from '@/v8/components/MFADeviceLimitModalV8';
import { MFANavigationV8 } from '@/v8/components/MFANavigationV8';
import { MFASettingsModalV8 } from '@/v8/components/MFASettingsModalV8';
import StepActionButtonsV8 from '@/v8/components/StepActionButtonsV8';
import StepValidationFeedbackV8 from '@/v8/components/StepValidationFeedbackV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { WorkerTokenPromptModalV8 } from '@/v8/components/WorkerTokenPromptModalV8';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { FlowResetServiceV8 } from '@/v8/services/flowResetServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import workerTokenServiceV8 from '@/v8/services/workerTokenServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { FiX } from 'react-icons/fi';
import type { DeviceAuthenticationPolicy, DeviceType, MFACredentials, MFAState } from './MFATypes';
import { PINGONE_WORKER_MFA_SCOPES } from '@/v8/config/constants';

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
}

export interface MFAFlowBaseRenderProps {
	credentials: MFACredentials;
	setCredentials: (credentials: MFACredentials | ((prev: MFACredentials) => MFACredentials)) => void;
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
}) => {
	console.log(`${MODULE_TAG} Initializing MFA flow for ${deviceType}`);

	usePageScroll({ pageName: 'MFA Flow V8', force: true });

	const nav = useStepNavigationV8(5, {
		onStepChange: (step) => {
			console.log(`${MODULE_TAG} Step changed to`, { step });
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

	const fetchDeviceAuthPolicies = useCallback(async () => {
	const envId = credentials.environmentId?.trim();
		const tokenValid = WorkerTokenStatusServiceV8.checkWorkerTokenStatus().isValid;
		if (!envId || !tokenValid) {
		setDeviceAuthPolicies([]);
		setPoliciesError(null);
		lastFetchedEnvIdRef.current = null;
		return;
	}

	console.log(`${MODULE_TAG} Fetching device authentication policies`, { environmentId: envId });
	setIsLoadingPolicies(true);
	setPoliciesError(null);

	try {
		const policies = await MFAServiceV8.listDeviceAuthenticationPolicies(envId);
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
		setIsLoadingPolicies(false);
	}
}, [credentials.environmentId, setCredentials, tokenStatus.isValid]);

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
useEffect(() => {
	const envId = credentials.environmentId?.trim();

	if (!envId || !tokenStatus.isValid) {
		setDeviceAuthPolicies([]);
		setPoliciesError(null);
		lastFetchedEnvIdRef.current = null;
		return;
	}

	if (lastFetchedEnvIdRef.current !== envId) {
		void fetchDeviceAuthPolicies();
	}
}, [credentials.environmentId, tokenStatus.isValid, fetchDeviceAuthPolicies]);

	// Watch for worker token errors and show prompt modal
	useEffect(() => {
		const hasWorkerTokenError = nav.validationErrors.some(
			(error) =>
				error.includes('Failed to get worker token') ||
				error.includes('Please configure worker token credentials first') ||
				(error.includes('Failed to authenticate') && error.includes('worker token'))
		);

		if (hasWorkerTokenError && !showWorkerTokenPromptModal) {
			console.log(`${MODULE_TAG} Worker token error detected, showing prompt modal`);
			setShowWorkerTokenPromptModal(true);
		}
	}, [nav.validationErrors, showWorkerTokenPromptModal]);

	useEffect(() => {
		const handleMissingScopes = (event: Event) => {
			const detail = (event as CustomEvent<{ scopes?: string[] }>).detail;
			const scopeList = detail?.scopes && detail.scopes.length ? detail.scopes : [...PINGONE_WORKER_MFA_SCOPES];
			toastV8.warning(
				`Worker token is missing recommended MFA scopes. We've updated your saved scope list to include: ${scopeList.join(
					', '
				)}. Please regenerate the worker token to apply these changes.`
			);
			setShowWorkerTokenPromptModal(true);
		};

		window.addEventListener('workerTokenMissingScopes', handleMissingScopes as EventListener);
		return () => {
			window.removeEventListener('workerTokenMissingScopes', handleMissingScopes as EventListener);
		};
	}, []);

	const handleWorkerTokenGenerated = () => {
		void (async () => {
			window.dispatchEvent(new Event('workerTokenUpdated'));
			const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(newStatus);
			nav.setValidationErrors([]);
			toastV8.success('Worker token generated and saved! Ensuring required scopes are included...');

			// Warn if required scopes are missing
			const requiredScopes = [...PINGONE_WORKER_MFA_SCOPES];

			try {
				const token = (await workerTokenServiceV8.getToken()) ?? '';
				if (token) {
					const payloadPart = token.split('.')[1];
					const payload = payloadPart
						? JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')))
						: undefined;
					const scopes = payload?.scp ?? [];
					const missingScopes = requiredScopes.filter((scope) => !scopes.includes(scope));
					if (missingScopes.length > 0) {
						toastV8.warning(
							`Worker token is missing recommended MFA scopes: ${missingScopes.join(
								', '
							)}. Please regenerate the token with these scopes.`
						);
					}
				}
			} catch (error) {
				console.warn(`${MODULE_TAG} Unable to inspect worker token scopes`, error);
			}

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
		return (
			!tokenStatus.isValid ||
			!credentials.environmentId.trim() ||
			!credentials.username.trim() ||
			isLoadingPolicies ||
			!credentials.deviceAuthenticationPolicyId?.trim()
		);
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
							<span className="step-number">{nav.currentStep + 1}</span>
							<span className="step-divider">/</span>
							<span className="step-total">{stepLabels.length}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Navigation */}
			<MFANavigationV8
				currentPage="registration"
				showRestartFlow={true}
				onRestartFlow={() => {
					FlowResetServiceV8.resetFlow(FLOW_KEY);
					window.location.reload();
				}}
				showBackToMain={true}
			/>

			<div className="flow-container">
				<div className="step-breadcrumb">
					{stepLabels.map((label, idx) => (
						<div key={label} className="breadcrumb-item">
							<span
								className={`breadcrumb-text ${idx === nav.currentStep ? 'active' : ''} ${nav.completedSteps.includes(idx) ? 'completed' : ''}`}
							>
								{label}
							</span>
							{idx < stepLabels.length - 1 && <span className="breadcrumb-arrow">→</span>}
						</div>
					))}
				</div>

				<div className="step-content-wrapper" style={{ paddingBottom: '80px' }}>{renderStepContent()}</div>

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
									<span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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
					totalSteps={5}
					isNextDisabled={isNextDisabled()}
					onPrevious={() => {
						nav.setValidationErrors([]);
						nav.setValidationWarnings([]);
						nav.goToPrevious();
					}}
					onNext={() => {
						if (nav.currentStep === 0) {
							if (validateStep0(credentials, tokenStatus, nav)) {
								nav.goToNext();
							}
						} else if (nav.currentStep === 1) {
							// Step 1: Select Device
							// If user has selected an existing device and has authenticationId, they should use "Use Selected Device" button
							// Don't allow Next button to go to registration if they have an existing device selected
							if (mfaState.authenticationId) {
								console.warn(`${MODULE_TAG} User has authenticationId but clicked Next - this should use "Use Selected Device" button instead`);
								nav.setValidationErrors(['Please click "Use Selected Device" button to authenticate with the selected device, or select "Register New Device" to register a new one.']);
								return;
							}
							// If no device selected or new device selected, allow navigation to registration
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
				>
					<button
						type="button"
						className="btn btn-reset"
						onClick={() => {
							FlowResetServiceV8.resetFlow(FLOW_KEY);
							window.location.reload();
						}}
					>
						🔄 Reset Flow
					</button>
				</StepActionButtonsV8>
			</div>

			{/* Modals */}
			<WorkerTokenPromptModalV8
				isOpen={showWorkerTokenPromptModal}
				onClose={() => {
					setShowWorkerTokenPromptModal(false);
					// Clear the error when user dismisses the modal
					nav.setValidationErrors([]);
				}}
				onGetToken={() => {
					setShowWorkerTokenModal(true);
				}}
			/>

			{showWorkerTokenModal && (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={() => setShowWorkerTokenModal(false)}
					onTokenGenerated={handleWorkerTokenGenerated}
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
					min-height: 100vh;
					overflow-y: auto;
					padding-bottom: 40px;
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
					padding-bottom: 40px;
				}

				.step-content-wrapper {
					background: white;
					border: 1px solid #ddd;
					border-radius: 8px;
					padding: 12px;
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
					padding: 8px 12px;
					margin: 8px 0;
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
					padding: 6px 12px;
					border: none;
					border-radius: 4px;
					font-size: 12px;
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

