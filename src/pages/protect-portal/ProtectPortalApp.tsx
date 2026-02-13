/**
 * @file ProtectPortalApp.tsx
 * @module protect-portal
 * @description Main Protect Portal application component
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This is the main component for the Protect Portal application that demonstrates
 * risk-based authentication with custom login, MFA integration, and OIDC token display.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiLoader, FiShield, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import AmericanAirlinesHero from './components/AmericanAirlinesHero';
import BankOfAmericaHero from './components/BankOfAmericaHero';
import CompanyHeader from './components/CompanyHeader';
import CustomLoginForm from './components/CustomLoginForm';
import FedExAirlinesHero from './components/FedExAirlinesHero';
import MFAAuthenticationFlow from './components/MFAAuthenticationFlow';
import PortalHome from './components/PortalHome';
import PortalStats from './components/PortalStats';
import PortalSuccess from './components/PortalSuccess';
import ProtectPage from './components/ProtectPage';
import RiskEvaluationDisplay from './components/RiskEvaluationDisplay';
import SouthwestAirlinesHero from './components/SouthwestAirlinesHero';
import UnitedAirlinesHero from './components/UnitedAirlinesHero';
import { BrandThemeProvider, useBrandTheme } from './themes/theme-provider';
// Import types and config
import type {
	LoginContext,
	PortalError,
	PortalState,
	PortalStep,
	RiskEvaluationResult,
	TokenSet,
	UserContext,
} from './types/protectPortal.types';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const PortalContainer = styled.div`
  min-height: 100vh;
  background: var(--brand-background);
  display: flex;
  flex-direction: column;
  width: 100%;
  font-family: var(--brand-font-family);
  align-items: stretch;
  justify-content: flex-start;
`;

const PortalCard = styled.div`
  background: transparent;
  overflow: hidden;
  width: 100%;
  max-width: none;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
`;

const PortalContent = styled.div`
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: stretch;
  justify-content: flex-start;
`;

const ErrorContainer = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
`;

const ErrorTitle = styled.h3`
  color: #dc2626;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const ErrorMessage = styled.p`
  color: #7f1d1d;
  font-size: 1rem;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const ErrorActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border-radius: var(--brand-radius-md);
  font-weight: 600;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: var(--brand-transition);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${(props) => {
		switch (props.variant) {
			case 'primary':
				return `
          background: var(--brand-primary);
          color: white;
          &:hover {
            background: var(--brand-accent);
          }
        `;
			case 'secondary':
				return `
          background: var(--brand-surface);
          color: var(--brand-text);
          border: 2px solid var(--brand-primary);
          &:hover {
            background: var(--brand-primary);
            color: white;
          }
        `;
			case 'danger':
				return `
          background: var(--brand-error);
          color: white;
          &:hover {
            background: #b91c1c;
          }
        `;
			default:
				return `
          background: var(--brand-primary);
          color: white;
          &:hover {
            background: var(--brand-accent);
          }
        `;
		}
	}}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
`;

const LoadingSpinner = styled(FiLoader)`
  animation: spin 1s linear infinite;
  font-size: 2rem;
  color: #3b82f6;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ProtectPortalAppProps {
	/** Initial step for testing purposes */
	initialStep?: PortalStep;
	/** PingOne environment configuration */
	environmentId: string;
	/** PingOne client configuration */
	clientId: string;
	/** PingOne client secret */
	clientSecret: string;
	/** Redirect URI for OAuth flow */
	redirectUri: string;
	/** Protect credentials for risk evaluation */
	protectCredentials?: {
		environmentId: string;
		workerToken: string;
		region: 'us' | 'eu' | 'ap' | 'ca';
	};
}

const ProtectPortalApp: React.FC<ProtectPortalAppProps> = ({
	initialStep = 'portal-home',
	environmentId,
	clientId,
	clientSecret,
	redirectUri,
	protectCredentials,
}) => {
	// ============================================================================
	// STATE MANAGEMENT
	// ============================================================================

	const [portalState, setPortalState] = useState<PortalState>({
		currentStep: initialStep,
		userContext: null,
		loginContext: null,
		riskEvaluation: null,
		selectedDevice: null,
		availableDevices: [],
		tokens: null,
		tokenDisplay: null,
		isLoading: false,
		error: null,
		educationalContent: {
			riskEvaluation: {
				title: 'Risk-Based Authentication',
				description:
					'We evaluate your login attempt in real-time to determine the appropriate level of security.',
				keyPoints: [
					'Analyzes login patterns, device information, and location',
					'Uses machine learning to detect suspicious activity',
					'Adapts security requirements based on risk level',
					'Protects your account while minimizing friction',
				],
				learnMore: {
					title: 'Learn About Risk-Based Authentication',
					description:
						'Discover how our advanced security measures protect your account while providing a seamless experience.',
					url: 'https://docs.pingidentity.com/pingone/risk-based-authentication',
				},
			},
			mfaAuthentication: {
				title: 'Multi-Factor Authentication',
				description:
					'Additional verification steps provide an extra layer of security for your account.',
				keyPoints: [
					'Choose from multiple authentication methods',
					'Biometric options for quick and secure access',
					'One-time codes for enhanced verification',
					'Hardware tokens for maximum security',
				],
				learnMore: {
					title: 'Learn About Multi-Factor Authentication',
					description:
						'Explore different MFA methods and find the best option for your security needs.',
					url: 'https://docs.pingidentity.com/pingone/mfa-methods',
				},
			},
			tokenDisplay: {
				title: 'OAuth 2.0 Tokens',
				description: 'Secure tokens that authenticate your requests to protected resources.',
				keyPoints: [
					'Access tokens for API authorization',
					'ID tokens containing user information',
					'Refresh tokens for extended sessions',
					'Secure token storage and management',
				],
				learnMore: {
					title: 'Learn About OAuth 2.0 Tokens',
					description: 'Understand how OAuth 2.0 tokens work and how to use them securely.',
					url: 'https://docs.pingidentity.com/pingone/oauth2-tokens',
				},
			},
		},
	});

	// ============================================================================
	// STEP HANDLERS
	// ============================================================================

	const handleLoginStart = useCallback(() => {
		console.log('[🚀 PROTECT-PORTAL] Starting login flow');
		setPortalState((prev) => ({
			...prev,
			currentStep: 'custom-login',
			error: null,
		}));
	}, []);

	const handleLoginSuccess = useCallback((userContext: UserContext, loginContext: LoginContext) => {
		console.log('[🚀 PROTECT-PORTAL] Login successful, starting risk evaluation');
		setPortalState((prev) => ({
			...prev,
			userContext,
			loginContext,
			currentStep: 'risk-evaluation',
			error: null,
		}));
	}, []);

	const handleRiskEvaluationComplete = useCallback(async (result: RiskEvaluationResult) => {
		console.log('[🚀 PROTECT-PORTAL] Risk evaluation completed:', result.result.level);

		setPortalState((prev) => ({
			...prev,
			riskEvaluation: result,
			error: null,
		}));

		// Route based on risk level according to requirements
		switch (result.result.level) {
			case 'LOW':
				// Low protect score: stats page and success page
				setPortalState((prev) => ({ ...prev, currentStep: 'risk-low-stats' }));
				break;
			case 'MEDIUM':
				// Medium protect score: P1MFA (OTP and FIDO) → protect page → success page
				setPortalState((prev) => ({ ...prev, currentStep: 'risk-medium-mfa' }));
				break;
			case 'HIGH':
				// High protect score: protect page → blocked page
				setPortalState((prev) => ({ ...prev, currentStep: 'risk-high-protect' }));
				break;
			default:
				setPortalState((prev) => ({
					...prev,
					currentStep: 'error',
					error: {
						code: 'UNKNOWN_RISK_LEVEL',
						message: 'Risk level could not be determined',
						recoverable: true,
						suggestedAction: 'Please try again',
					},
				}));
		}
	}, []);

	const handleMFAComplete = useCallback((tokens: TokenSet) => {
		console.log('[🚀 PROTECT-PORTAL] MFA completed, proceeding to success');
		setPortalState((prev) => ({
			...prev,
			tokens,
			currentStep: 'portal-success',
			error: null,
		}));
	}, []);

	const handleError = useCallback((error: PortalError) => {
		console.error('[🚀 PROTECT-PORTAL] Error occurred:', error);
		setPortalState((prev) => ({
			...prev,
			currentStep: 'error',
			error,
			isLoading: false,
		}));
	}, []);

	const handleRetry = useCallback(() => {
		console.log('[🚀 PROTECT-PORTAL] Retrying from error state');
		setPortalState((prev) => ({
			...prev,
			currentStep: 'portal-home',
			error: null,
			isLoading: false,
		}));
	}, []);

	const handleReset = useCallback(() => {
		console.log('[🚀 PROTECT-PORTAL] Resetting to initial state');
		setPortalState((prev) => ({
			...prev,
			currentStep: initialStep,
			userContext: null,
			loginContext: null,
			riskEvaluation: null,
			selectedDevice: null,
			availableDevices: [],
			tokens: null,
			tokenDisplay: null,
			error: null,
			isLoading: false,
		}));
	}, [initialStep]);

	// ============================================================================
	// RENDER STEP COMPONENTS
	// ============================================================================

	const renderStep = () => {
		const { currentStep, isLoading, error } = portalState;

		console.log('[🚀 PROTECT-PORTAL-APP] Rendering step:', currentStep);

		if (isLoading) {
			return (
				<LoadingContainer>
					<LoadingSpinner />
					<LoadingText>Processing your request...</LoadingText>
				</LoadingContainer>
			);
		}

		if (error && currentStep === 'error') {
			return (
				<ErrorContainer>
					<ErrorTitle>
						<FiAlertTriangle />
						Something went wrong
					</ErrorTitle>
					<ErrorMessage>{error.message}</ErrorMessage>
					{error.suggestedAction && (
						<p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>
							{error.suggestedAction}
						</p>
					)}
					<ErrorActions>
						{error.recoverable && (
							<Button variant="primary" onClick={handleRetry}>
								<FiCheckCircle />
								Try Again
							</Button>
						)}
						<Button variant="secondary" onClick={handleReset}>
							<FiX />
							Start Over
						</Button>
					</ErrorActions>
				</ErrorContainer>
			);
		}

		switch (currentStep) {
			case 'portal-home':
				return (
					<PortalHome
						onLoginStart={handleLoginStart}
						educationalContent={portalState.educationalContent.riskEvaluation}
					/>
				);

			case 'custom-login':
				return (
					<CustomLoginForm
						onLoginSuccess={handleLoginSuccess}
						onError={handleError}
						environmentId={environmentId}
						clientId={clientId}
						clientSecret={clientSecret}
						redirectUri={redirectUri}
					/>
				);

			case 'risk-evaluation':
				return (
					<RiskEvaluationDisplay
						userContext={portalState.userContext!}
						loginContext={portalState.loginContext!}
						onComplete={handleRiskEvaluationComplete}
						onError={handleError}
						protectCredentials={protectCredentials!}
						educationalContent={portalState.educationalContent.riskEvaluation}
					/>
				);

			case 'risk-low-stats':
				// Low protect score: stats page
				return (
					<PortalStats
						userContext={portalState.userContext!}
						riskEvaluation={portalState.riskEvaluation!}
						onSuccess={() =>
							setPortalState((prev) => ({ ...prev, currentStep: 'risk-low-success' }))
						}
						onError={handleError}
						educationalContent={portalState.educationalContent.riskEvaluation}
					/>
				);

			case 'risk-low-success':
				// Low protect score: success page
				return (
					<PortalSuccess
						userContext={portalState.userContext!}
						riskEvaluation={portalState.riskEvaluation!}
						tokens={portalState.tokens!}
						onLogout={handleReset}
						educationalContent={portalState.educationalContent.tokenDisplay}
					/>
				);

			case 'risk-medium-mfa':
				// Medium protect score: P1MFA (OTP and FIDO)
				return (
					<MFAAuthenticationFlow
						userContext={portalState.userContext!}
						riskEvaluation={portalState.riskEvaluation!}
						onComplete={handleMFAComplete}
						onError={handleError}
						mfaCredentials={{
							environmentId: environmentId,
							accessToken: portalState.tokens?.accessToken || '',
							region: 'us', // Default to US region
						}}
						loginContext={portalState.loginContext!}
						educationalContent={portalState.educationalContent.mfaAuthentication}
					/>
				);

			case 'risk-medium-protect':
				// Medium protect score: protect page
				return (
					<ProtectPage
						userContext={portalState.userContext!}
						riskEvaluation={portalState.riskEvaluation!}
						onSuccess={() =>
							setPortalState((prev) => ({ ...prev, currentStep: 'risk-medium-success' }))
						}
						onError={handleError}
						educationalContent={portalState.educationalContent.riskEvaluation}
					/>
				);

			case 'risk-medium-success':
				// Medium protect score: success page
				return (
					<PortalSuccess
						userContext={portalState.userContext!}
						riskEvaluation={portalState.riskEvaluation!}
						tokens={portalState.tokens!}
						onLogout={handleReset}
						educationalContent={portalState.educationalContent.tokenDisplay}
					/>
				);

			case 'risk-high-protect':
				// High protect score: protect page
				return (
					<ProtectPage
						userContext={portalState.userContext!}
						riskEvaluation={portalState.riskEvaluation!}
						onSuccess={() =>
							setPortalState((prev) => ({ ...prev, currentStep: 'risk-high-block' }))
						}
						onError={handleError}
						educationalContent={portalState.educationalContent.riskEvaluation}
					/>
				);

			case 'risk-high-block':
				// High protect score: blocked page
				return (
					<ErrorContainer>
						<ErrorTitle>
							<FiShield />
							Access Blocked
						</ErrorTitle>
						<ErrorMessage>
							This login attempt has been blocked due to high-risk indicators. For your security,
							please contact your administrator or try again from a trusted location and device.
						</ErrorMessage>
						<ErrorActions>
							<Button variant="secondary" onClick={handleReset}>
								<FiX />
								Try Again Later
							</Button>
						</ErrorActions>
					</ErrorContainer>
				);

			case 'portal-success':
				return (
					<PortalSuccess
						userContext={portalState.userContext!}
						riskEvaluation={portalState.riskEvaluation!}
						tokens={portalState.tokens!}
						onLogout={handleReset}
						educationalContent={portalState.educationalContent.tokenDisplay}
					/>
				);

			default:
				return (
					<ErrorContainer>
						<ErrorTitle>
							<FiAlertTriangle />
							Unknown Step
						</ErrorTitle>
						<ErrorMessage>The application is in an unknown state. Please start over.</ErrorMessage>
						<ErrorActions>
							<Button variant="primary" onClick={handleReset}>
								<FiCheckCircle />
								Start Over
							</Button>
						</ErrorActions>
					</ErrorContainer>
				);
		}
	};

	// ============================================================================
	// EFFECTS
	// ============================================================================

	useEffect(() => {
		console.log('[�️ PROTECT-PORTAL] Portal app initialized', {
			initialStep,
			environmentId,
			clientId,
			protectCredentials: !!protectCredentials,
		});
	}, [initialStep, environmentId, clientId, protectCredentials]);

	// ============================================================================
	// RENDER
	// ============================================================================

	const ProtectPortalContent = () => {
		const { activeTheme } = useBrandTheme();

		return (
			<PortalContainer>
				{activeTheme.name === 'american-airlines' && (
					<AmericanAirlinesHero
						currentStep={portalState.currentStep}
						onLoginStart={handleLoginStart}
						_onLoginSuccess={handleLoginSuccess}
						_onError={handleError}
						_environmentId={environmentId}
						_clientId={clientId}
						_clientSecret={clientSecret}
						_redirectUri={redirectUri}
					/>
				)}
				{activeTheme.name === 'southwest-airlines' && (
					<SouthwestAirlinesHero
						currentStep={portalState.currentStep}
						onLoginStart={handleLoginStart}
						_onLoginSuccess={handleLoginSuccess}
						_onError={handleError}
						_environmentId={environmentId}
						_clientId={clientId}
						_clientSecret={clientSecret}
						_redirectUri={redirectUri}
					/>
				)}
				{activeTheme.name === 'fedex' && (
					<FedExAirlinesHero
						currentStep={portalState.currentStep}
						onLoginStart={handleLoginStart}
						_onLoginSuccess={handleLoginSuccess}
						_onError={handleError}
						_environmentId={environmentId}
						_clientId={clientId}
						_clientSecret={clientSecret}
						_redirectUri={redirectUri}
					/>
				)}
				{activeTheme.name === 'bank-of-america' && (
					<BankOfAmericaHero
						currentStep={portalState.currentStep}
						onLoginStart={handleLoginStart}
						_onLoginSuccess={handleLoginSuccess}
						_onError={handleError}
						_environmentId={environmentId}
						_clientId={clientId}
						_clientSecret={clientSecret}
						_redirectUri={redirectUri}
					/>
				)}
				{activeTheme.name === 'united-airlines' && (
					<UnitedAirlinesHero
						currentStep={portalState.currentStep}
						onLoginStart={handleLoginStart}
						_onLoginSuccess={handleLoginSuccess}
						_onError={handleError}
						_environmentId={environmentId}
						_clientId={clientId}
						_clientSecret={clientSecret}
						_redirectUri={redirectUri}
					/>
				)}
				{activeTheme.name !== 'american-airlines' &&
					activeTheme.name !== 'southwest-airlines' &&
					activeTheme.name !== 'fedex' &&
					activeTheme.name !== 'bank-of-america' &&
					activeTheme.name !== 'united-airlines' && <CompanyHeader />}
				<PortalCard>
					<PortalContent>{renderStep()}</PortalContent>
				</PortalCard>
			</PortalContainer>
		);
	};

	return (
		<BrandThemeProvider>
			<ProtectPortalContent />
		</BrandThemeProvider>
	);
};

export default ProtectPortalApp;
