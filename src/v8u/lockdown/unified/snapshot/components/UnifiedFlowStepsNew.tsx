/**
 * @file UnifiedFlowStepsNew.tsx
 * @description Rewritten Unified flow steps component with modular architecture
 * @author OAuth Playground Team
 * @version 2.0.0
 * @since 2026-01-25
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUnifiedFlowStore } from '../services/UnifiedFlowStateManager';
import { UnifiedEducationalContent } from './educational/UnifiedEducationalContent';
import { IDTokenValidationModalV8U } from './IDTokenValidationModalV8U';
import { StepNavigation } from './StepNavigation';
import { AuthorizationUrlStep } from './steps/AuthorizationUrlStep';
import { CallbackStep } from './steps/CallbackStep';
import { ConfigurationStep } from './steps/ConfigurationStep';
import { DeviceAuthStep } from './steps/DeviceAuthStep';
import { DocumentationStep } from './steps/DocumentationStep';
import { FragmentStep } from './steps/FragmentStep';
import { IntrospectionStep } from './steps/IntrospectionStep';
// Import step components
import { PKCEStep } from './steps/PKCEStep';
import { PollingStep } from './steps/PollingStep';
import { TokenExchangeStep } from './steps/TokenExchangeStep';
import { TokenRequestStep } from './steps/TokenRequestStep';
import { TokensStep } from './steps/TokensStep';
import { TokenDisplayV8U } from './TokenDisplayV8U';
import { UserInfoSuccessModalV8U } from './UserInfoSuccessModalV8U';
import { UserTokenStatusDisplayV8U } from './UserTokenStatusDisplayV8U';

// Main container style
const containerStyle: React.CSSProperties = {
	minHeight: '100vh',
	background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
	padding: '2rem',
};

const contentStyle: React.CSSProperties = {
	maxWidth: '1200px',
	margin: '0 auto',
	background: 'white',
	borderRadius: '1rem',
	boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
	overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
	padding: '2rem',
	background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
	color: 'white',
};

const titleStyle: React.CSSProperties = {
	fontSize: '2rem',
	fontWeight: '700',
	margin: 0,
};

const subtitleStyle: React.CSSProperties = {
	fontSize: '1rem',
	marginTop: '0.5rem',
	opacity: 0.9,
};

const stepsContainerStyle: React.CSSProperties = {
	padding: '2rem',
};

const navigationContainerStyle: React.CSSProperties = {
	padding: '2rem',
	borderTop: '1px solid #e2e8f0',
	background: '#f8fafc',
};

interface UnifiedFlowStepsNewProps {
	onStepChange?: (step: number) => void;
}

export const UnifiedFlowStepsNew: React.FC<UnifiedFlowStepsNewProps> = ({ onStepChange }) => {
	const navigate = useNavigate();
	const { step: urlStep } = useParams<{ step?: string }>();

	// Store state
	const {
		flowType,
		specVersion,
		currentStep,
		totalSteps,
		flowState,
		isLoading,
		loadingMessage,
		error,
		modalStates,
		setCurrentStep,
		setModalState,
		setError,
	} = useUnifiedFlowStore();

	// Initialize from URL
	React.useEffect(() => {
		if (urlStep) {
			const stepNum = parseInt(urlStep, 10);
			if (!Number.isNaN(stepNum) && stepNum >= 0 && stepNum < totalSteps) {
				setCurrentStep(stepNum);
			}
		}
	}, [urlStep, totalSteps, setCurrentStep]);

	// Navigation handlers
	const handleStepChange = (step: number) => {
		setCurrentStep(step);
		navigate(`/v8u/unified/${flowType}/${step}`);
		onStepChange?.(step);
	};

	// Render current step
	const renderCurrentStep = () => {
		switch (currentStep) {
			case 0:
				return <ConfigurationStep />;

			case 1:
				if (flowType === 'device-code') {
					return <DeviceAuthStep />;
				}
				if (flowType === 'client-credentials') {
					return <TokenRequestStep />;
				}
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return <PKCEStep />;
				}
				return <AuthorizationUrlStep />;

			case 2:
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return <AuthorizationUrlStep />;
				}
				if (flowType === 'implicit') {
					return <FragmentStep />;
				}
				if (flowType === 'device-code') {
					return <PollingStep />;
				}
				return <TokensStep />;

			case 3:
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return <CallbackStep />;
				}
				if (flowType === 'implicit' || flowType === 'device-code') {
					return <TokensStep />;
				}
				return <IntrospectionStep />;

			case 4:
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return <TokenExchangeStep />;
				}
				if (flowType === 'implicit') {
					return <IntrospectionStep />;
				}
				return <UserInfoStep />;

			case 5:
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return <TokensStep />;
				}
				if (flowType === 'implicit') {
					return <UserInfoStep />;
				}
				return <DocumentationStep />;

			case 6:
				if (flowType === 'oauth-authz' || flowType === 'hybrid') {
					return <IntrospectionStep />;
				}
				if (flowType === 'client-credentials') {
					return <DocumentationStep />;
				}
				return <ConfigurationStep />;

			case 7:
				return <DocumentationStep />;

			default:
				return <ConfigurationStep />;
		}
	};

	// UserInfo step component
	const UserInfoStep: React.FC = () => (
		<div style={{ padding: '2rem' }}>
			<h2>User Information</h2>
			<p>Fetching user information from the UserInfo endpoint...</p>
			{/* UserInfo implementation will go here */}
		</div>
	);

	return (
		<div style={containerStyle}>
			<div style={contentStyle}>
				{/* Header */}
				<div style={headerStyle}>
					<h1 style={titleStyle}>
						{flowType === 'oauth-authz' && 'OAuth 2.0 Authorization Code'}
						{flowType === 'hybrid' && 'OpenID Connect Hybrid'}
						{flowType === 'implicit' && 'OAuth 2.0 Implicit'}
						{flowType === 'client-credentials' && 'OAuth 2.0 Client Credentials'}
						{flowType === 'device-code' && 'OAuth 2.0 Device Authorization'}
					</h1>
					<p style={subtitleStyle}>
						{(specVersion === 'oauth2.0' || specVersion === 'oauth2.1') && 'OAuth 2.0'}
						{specVersion === 'oidc' && 'OpenID Connect'}
						{' • '}
						Step {currentStep + 1} of {totalSteps}
					</p>
				</div>

				{/* User Token Status Display */}
				<UserTokenStatusDisplayV8U />

				{/* Steps Container */}
				<div style={stepsContainerStyle}>{renderCurrentStep()}</div>

				{/* Educational Content */}
				<UnifiedEducationalContent />

				{/* Navigation */}
				<div style={navigationContainerStyle}>
					<StepNavigation
						totalSteps={totalSteps}
						currentStep={currentStep}
						onStepChange={handleStepChange}
						previousLabel="← Previous"
						nextLabel="Next →"
						resetLabel="🔄 Restart"
					/>
				</div>
			</div>

			{/* Modals */}
			{modalStates.idTokenValidation && (
				<IDTokenValidationModalV8U
					isOpen={modalStates.idTokenValidation}
					onClose={() => setModalState('idTokenValidation', false)}
					idToken={flowState.tokens?.idToken || ''}
				/>
			)}

			{modalStates.userInfo && (
				<UserInfoSuccessModalV8U
					isOpen={modalStates.userInfo}
					onClose={() => setModalState('userInfo', false)}
					userInfo={{}}
					tokens={flowState.tokens}
				/>
			)}

			{/* Token Display */}
			{flowState.tokens?.accessToken && (
				<TokenDisplayV8U
					tokens={(() => {
						const tokenData: {
							accessToken: string;
							idToken?: string;
							refreshToken?: string;
							expiresIn?: number;
						} = {
							accessToken: flowState.tokens.accessToken,
						};
						if (flowState.tokens.idToken) tokenData.idToken = flowState.tokens.idToken;
						if (flowState.tokens.refreshToken)
							tokenData.refreshToken = flowState.tokens.refreshToken;
						if (flowState.tokens.expiresIn) tokenData.expiresIn = flowState.tokens.expiresIn;
						return tokenData;
					})()}
				/>
			)}

			{/* Loading Overlay */}
			{isLoading && (
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
						zIndex: 9999,
					}}
				>
					<div
						style={{
							background: 'white',
							padding: '2rem',
							borderRadius: '0.5rem',
							textAlign: 'center',
						}}
					>
						<div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
							{loadingMessage || 'Loading...'}
						</div>
					</div>
				</div>
			)}

			{/* Error Display */}
			{error && (
				<div
					style={{
						position: 'fixed',
						top: '2rem',
						right: '2rem',
						background: '#fef2f2',
						border: '1px solid #fecaca',
						borderRadius: '0.5rem',
						padding: '1rem',
						maxWidth: '400px',
						zIndex: 9999,
					}}
				>
					<div style={{ color: '#dc2626', fontWeight: '600', marginBottom: '0.5rem' }}>Error</div>
					<div style={{ color: '#991b1b' }}>{error}</div>
					<button
						type="button"
						onClick={() => setError(undefined)}
						style={{
							marginTop: '1rem',
							padding: '0.5rem 1rem',
							background: '#dc2626',
							color: 'white',
							border: 'none',
							borderRadius: '0.25rem',
							cursor: 'pointer',
						}}
					>
						Dismiss
					</button>
				</div>
			)}
		</div>
	);
};

export default UnifiedFlowStepsNew;
