/**
 * @file UnifiedFlowStepsRefactored.tsx
 * @module v8u/components
 * @description Refactored unified flow steps component with split architecture
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import type { UnifiedFlowCredentials } from '../services/unifiedFlowIntegrationV8U';
import type { FlowState } from '../services/UnifiedFlowStateManager';
import {
	ErrorStep,
	LoadingStep,
	renderStep0,
	renderStep1AuthUrl,
	renderStep3Tokens,
} from './UnifiedFlowStepRenderers';
import { useUnifiedFlowTokenHandlers } from './UnifiedFlowTokenHandlers';
import { UnifiedFlowModals } from './UnifiedFlowModals';

// Import remaining step renderers (these will be created in separate files)
// For now, we'll use placeholder functions
const renderStep1PKCE = () => <div>PKCE Step - To be implemented</div>;
const renderStep1DeviceAuth = () => <div>Device Auth Step - To be implemented</div>;
const renderStep2Callback = () => <div>Callback Step - To be implemented</div>;
const renderStep2Fragment = () => <div>Fragment Step - To be implemented</div>;
const renderStep2Poll = () => <div>Poll Step - To be implemented</div>;
const renderStep2RequestToken = () => <div>Request Token Step - To be implemented</div>;
const renderStep3ExchangeTokens = () => <div>Exchange Tokens Step - To be implemented</div>;
const renderStep6IntrospectionUserInfo = () => (
	<div>Introspection/UserInfo Step - To be implemented</div>
);
const renderStep7Documentation = () => <div>Documentation Step - To be implemented</div>;

interface UnifiedFlowStepsProps {
	credentials: UnifiedFlowCredentials;
	flowType: string;
	currentStep: number;
	flowState: FlowState;
	setFlowState: React.Dispatch<React.SetStateAction<FlowState>>;
}

const MODULE_TAG = '[UnifiedFlowStepsRefactored]';

export const UnifiedFlowStepsRefactored: React.FC<UnifiedFlowStepsProps> = ({
	credentials,
	flowType,
	currentStep,
	flowState,
	setFlowState,
}) => {
	const componentId = useId();

	// State management
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Modal states
	const [showUserInfoModal, setShowUserInfoModal] = useState(false);
	const [showPollingTimeoutModal, setShowPollingTimeoutModal] = useState(false);
	const [showDeviceCodeSuccessModal, setShowDeviceCodeSuccessModal] = useState(false);
	const [showCallbackSuccessModal, setShowCallbackSuccessModal] = useState(false);

	// Refs
	const prevStepRef = useRef(currentStep);

	// Use token handlers hook
	const {} = useUnifiedFlowTokenHandlers({
		credentials,
		flowState,
		setFlowState,
	});

	// Log step changes for debugging
	useEffect(() => {
		if (currentStep !== prevStepRef.current) {
			console.log(`${MODULE_TAG} Step changed: ${prevStepRef.current} → ${currentStep}`);
			prevStepRef.current = currentStep;
		}
	}, [currentStep]);

	// Main render step content function
	const renderStepContent = () => {
		console.log(`${MODULE_TAG} Rendering step ${currentStep} for flow type ${flowType}`);

		switch (currentStep) {
			case 0:
				return renderStep0();

			case 1:
				// Step 1 varies by flow type
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return renderStep1PKCE();
				}
				if (flowType === 'device-code') {
					return renderStep1DeviceAuth();
				}
				return renderStep1AuthUrl({ flowState });

			case 2:
				// Step 2 varies by flow type
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return renderStep1AuthUrl({ flowState });
				}
				if (flowType === 'implicit') {
					return renderStep2Fragment();
				}
				if (flowType === 'device-code') {
					return renderStep2Poll();
				}
				if (flowType === 'client-credentials' || flowType === 'ropc') {
					return renderStep2RequestToken();
				}
				return renderStep2Callback();

			case 3:
				// Step 3 varies by flow type
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return renderStep2Callback();
				}
				if (flowType === 'implicit') {
					return renderStep3Tokens({ flowState });
				}
				if (flowType === 'device-code') {
					return renderStep3Tokens({ flowState });
				}
				if (flowType === 'client-credentials' || flowType === 'ropc') {
					return renderStep6IntrospectionUserInfo();
				}
				return renderStep3ExchangeTokens();

			case 4:
				// Step 4 varies by flow type
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return renderStep3ExchangeTokens();
				}
				if (flowType === 'implicit') {
					return renderStep6IntrospectionUserInfo();
				}
				if (flowType === 'device-code') {
					return renderStep6IntrospectionUserInfo();
				}
				return renderStep7Documentation();

			case 5:
				// Step 5 varies by flow type
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return renderStep3Tokens({ flowState });
				}
				if (flowType === 'implicit' || flowType === 'device-code') {
					return renderStep7Documentation();
				}
				return renderStep3Tokens({ flowState });

			case 6:
				// Step 6 varies by flow type
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return renderStep6IntrospectionUserInfo();
				}
				return renderStep6IntrospectionUserInfo();

			default:
				return (
					<div style={{ padding: '20px', textAlign: 'center' }}>
						<p>Unknown step: {currentStep}</p>
					</div>
				);
		}
	};

	// Main component render
	return (
		<div className="unified-flow-steps-v8u" id={componentId}>
			<style>{`
				.unified-flow-steps-v8u .btn {
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
				.unified-flow-steps-v8u .btn-primary {
					background: #3b82f6;
					color: white;
				}
				.unified-flow-steps-v8u .btn-primary:hover {
					background: #2563eb;
				}
				.unified-flow-steps-v8u .btn-secondary {
					background: #6b7280;
					color: white;
				}
				.unified-flow-steps-v8u .btn-secondary:hover {
					background: #4b5563;
				}
				@keyframes spin {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}
			`}</style>

			{/* Main Step Content */}
			<div style={{ marginBottom: '24px' }}>
				{error ? (
					<ErrorStep error={error} onRetry={() => setError(null)} />
				) : isLoading ? (
					<LoadingStep message="Loading step content..." />
				) : (
					renderStepContent()
				)}
			</div>

			{/* Modals */}
			<UnifiedFlowModals
				showUserInfoModal={showUserInfoModal}
				setShowUserInfoModal={setShowUserInfoModal}
				showPollingTimeoutModal={showPollingTimeoutModal}
				setShowPollingTimeoutModal={setShowPollingTimeoutModal}
				showDeviceCodeSuccessModal={showDeviceCodeSuccessModal}
				setShowDeviceCodeSuccessModal={setShowDeviceCodeSuccessModal}
				showCallbackSuccessModal={showCallbackSuccessModal}
				setShowCallbackSuccessModal={setShowCallbackSuccessModal}
				callbackDetails={flowState.callbackDetails}
				userInfo={flowState.userInfo}
				flowType={flowType}
				deviceCode={flowState.deviceCode || ''}
				userCode={flowState.userCode || ''}
				verificationUri={flowState.verificationUri || ''}
			/>
		</div>
	);
};

export default UnifiedFlowStepsRefactored;
