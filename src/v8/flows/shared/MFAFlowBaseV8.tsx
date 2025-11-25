/**
 * @file MFAFlowBaseV8.tsx
 * @module v8/flows/shared
 * @description Base MFA Flow component with shared logic
 * @version 8.1.0
 */

import React, { useEffect, useState } from 'react';
import { usePageScroll } from '@/hooks/usePageScroll';
import { MFADeviceLimitModalV8 } from '@/v8/components/MFADeviceLimitModalV8';
import { MFASettingsModalV8 } from '@/v8/components/MFASettingsModalV8';
import StepActionButtonsV8 from '@/v8/components/StepActionButtonsV8';
import StepValidationFeedbackV8 from '@/v8/components/StepValidationFeedbackV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { FlowResetServiceV8 } from '@/v8/services/flowResetServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import type { DeviceType, MFACredentials, MFAState } from './MFATypes';

const MODULE_TAG = '[📱 MFA-FLOW-BASE-V8]';
const FLOW_KEY = 'mfa-flow-v8';

export interface MFAFlowBaseProps {
	deviceType: DeviceType;
	renderStep0: (props: MFAFlowBaseRenderProps) => React.ReactNode;
	renderStep1: (props: MFAFlowBaseRenderProps) => React.ReactNode;
	renderStep2: (props: MFAFlowBaseRenderProps) => React.ReactNode;
	renderStep3: (props: MFAFlowBaseRenderProps) => React.ReactNode;
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
}

export const MFAFlowBaseV8: React.FC<MFAFlowBaseProps> = ({
	deviceType,
	renderStep0,
	renderStep1,
	renderStep2,
	renderStep3,
	validateStep0,
	stepLabels = ['Configure', 'Register Device', 'Validate', 'Success'],
}) => {
	console.log(`${MODULE_TAG} Initializing MFA flow for ${deviceType}`);

	usePageScroll({ pageName: 'MFA Flow V8', force: true });

	const nav = useStepNavigationV8(4, {
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
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [tokenStatus, setTokenStatus] = useState(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
	);
	const [isLoading, setIsLoading] = useState(false);

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

	const handleWorkerTokenGenerated = () => {
		window.dispatchEvent(new Event('workerTokenUpdated'));
		const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
		setTokenStatus(newStatus);
		toastV8.success('Worker token generated and saved!');
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
			default:
				return renderStep0(renderProps);
		}
	};

	const isNextDisabled = () => {
		if (isLoading) return true;
		if (nav.currentStep === 0) {
			return !tokenStatus.isValid || !credentials.environmentId.trim() || !credentials.username.trim();
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

				<div className="step-content-wrapper">{renderStepContent()}</div>

				<StepValidationFeedbackV8 errors={nav.validationErrors} warnings={nav.validationWarnings} />

				<StepActionButtonsV8
					currentStep={nav.currentStep}
					totalSteps={4}
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
				}

				.flow-header {
					background: linear-gradient(135deg, #10b981 0%, #059669 100%);
					padding: 28px 40px;
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
					font-size: 26px;
					font-weight: 700;
					margin: 0 0 4px 0;
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
					padding: 12px 20px;
					border-radius: 24px;
					display: flex;
					align-items: center;
					gap: 8px;
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
					padding: 28px 40px;
					border-bottom: 2px solid #10b981;
					display: flex;
					align-items: center;
					gap: 16px;
					flex-wrap: wrap;
				}

				.breadcrumb-item {
					display: flex;
					align-items: center;
					gap: 16px;
				}

				.breadcrumb-text {
					font-size: 15px;
					font-weight: 500;
					color: #6b7280;
					padding: 10px 16px;
					border-radius: 6px;
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
					gap: 16px;
				}

				.step-content-wrapper {
					background: white;
					border: 1px solid #ddd;
					border-radius: 8px;
					padding: 20px;
					min-height: auto;
				}

				.step-content h2 {
					font-size: 20px;
					font-weight: 600;
					margin: 0 0 8px 0;
					color: #1f2937;
				}

				.step-content > p {
					font-size: 14px;
					color: #6b7280;
					margin: 0 0 20px 0;
				}

				.credentials-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
					gap: 16px;
				}

				.form-group {
					display: flex;
					flex-direction: column;
					gap: 6px;
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
					padding: 10px 12px;
					border: 1px solid #d1d5db;
					border-radius: 6px;
					font-size: 14px;
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
					border-radius: 8px;
					padding: 16px;
					margin: 16px 0;
				}

				.info-box p {
					margin: 8px 0;
					font-size: 14px;
					color: #1e40af;
				}

				.success-box {
					background: #d1fae5;
					border: 1px solid #6ee7b7;
					border-radius: 8px;
					padding: 16px;
					margin: 16px 0;
				}

				.success-box h3 {
					margin: 0 0 12px 0;
					font-size: 18px;
					color: #065f46;
				}

				.success-box p {
					margin: 8px 0;
					font-size: 14px;
					color: #047857;
				}

				.btn {
					padding: 12px 24px;
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

