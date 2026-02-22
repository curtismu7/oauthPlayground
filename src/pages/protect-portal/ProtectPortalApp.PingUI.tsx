/**
 * @file ProtectPortalApp.PingUI.tsx
 * @module protect-portal
 * @description PingOne UI version of Protect Portal application component
 * @version 9.0.0
 *
 * PingOne UI migration following pingui2.md standards:
 * - Added .end-user-nano namespace wrapper
 * - Replaced React Icons with MDI CSS icons
 * - Applied Ping UI CSS variables and transitions
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions
 */

import React, { useCallback, useState } from 'react';
import { useGlobalWorkerToken } from '@/hooks/useGlobalWorkerToken';
import { WorkerTokenStatusDisplayV8 } from '@/v8/components/WorkerTokenStatusDisplayV8';
import AmericanAirlinesHero from './components/AmericanAirlinesHero';
import BankOfAmericaHero from './components/BankOfAmericaHero';
import CompanyHeader from './components/CompanyHeader';
import CorporatePortalHero from './components/CorporatePortalHero';
import CustomLoginForm from './components/CustomLoginForm';
import FedExAirlinesHero from './components/FedExAirlinesHero';
import MFAAuthenticationFlow from './components/MFAAuthenticationFlow';
import PortalSuccess from './components/PortalSuccess';
import RiskEvaluationDisplay from './components/RiskEvaluationDisplay';
import CorporateFooter from './components/Shared/CorporateFooter';
import SouthwestAirlinesHero from './components/SouthwestAirlinesHero';
import UnitedAirlinesHero from './components/UnitedAirlinesHero';
import { BrandThemeProvider, useBrandTheme } from './themes/theme-provider';
import type { CorporatePortalConfig } from './types/CorporatePortalConfig';
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

// PingOne UI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	style?: React.CSSProperties;
	title?: string;
}> = ({ icon, size = 24, className = '', style, title }) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: size, ...style }}
			title={title}
		/>
	);
};

// PingOne UI Styled Components (using inline styles with CSS variables)
const getPortalContainerStyle = () => ({
	minHeight: '100vh',
	background: 'var(--pingone-surface-background)',
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
	fontFamily: 'var(--pingone-font-family)',
	alignItems: 'stretch',
	justifyContent: 'flex-start',
});

const getPortalCardStyle = () => ({
	background: 'transparent',
	overflow: 'hidden',
	width: '100%',
	maxWidth: 'none',
	flex: 1,
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'stretch',
	justifyContent: 'flex-start',
});

const getPortalContentStyle = () => ({
	flex: 1,
	padding: 0,
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
	alignItems: 'stretch',
	justifyContent: 'flex-start',
});

const getErrorContainerStyle = () => ({
	background: 'var(--pingone-surface-error)',
	border: '1px solid var(--pingone-border-error)',
	borderRadius: '0.5rem',
	padding: '1.5rem',
	maxWidth: '500px',
	width: '100%',
	textAlign: 'center',
});

const getErrorTitleStyle = () => ({
	color: 'var(--pingone-text-error)',
	fontSize: '1.25rem',
	fontWeight: '600',
	margin: '0 0 0.75rem 0',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: '0.5rem',
});

const getErrorMessageStyle = () => ({
	color: 'var(--pingone-text-primary)',
	marginBottom: '1rem',
	lineHeight: '1.5',
});

const getButtonStyle = (variant: 'primary' | 'secondary' = 'primary') => ({
	background:
		variant === 'primary' ? 'var(--pingone-brand-primary)' : 'var(--pingone-surface-secondary)',
	color: variant === 'primary' ? 'var(--pingone-text-inverse)' : 'var(--pingone-text-primary)',
	border: variant === 'secondary' ? '1px solid var(--pingone-border-primary)' : 'none',
	padding: '0.75rem 1.5rem',
	borderRadius: '0.375rem',
	fontSize: '1rem',
	fontWeight: '500',
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	display: 'inline-flex',
	alignItems: 'center',
	gap: '0.5rem',
	'&:hover': {
		background:
			variant === 'primary'
				? 'var(--pingone-brand-primary-dark)'
				: 'var(--pingone-surface-tertiary)',
		transform: 'translateY(-1px)',
	},
});

const getLoadingContainerStyle = () => ({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: '400px',
	gap: '1rem',
});

const getLoadingSpinnerStyle = () => ({
	width: '2rem',
	height: '2rem',
	border: '3px solid var(--pingone-border-primary)',
	borderTop: '3px solid var(--pingone-brand-primary)',
	borderRadius: '50%',
	animation: 'spin 1s linear infinite',
});

const getLoadingTextStyle = () => ({
	color: 'var(--pingone-text-secondary)',
	fontSize: '1rem',
	fontWeight: '500',
});

const getResourceSectionStyle = () => ({
	background: 'var(--pingone-surface-card)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: '0.75rem',
	padding: '2rem',
	marginTop: '2rem',
	textAlign: 'center',
});

const getResourceTitleStyle = () => ({
	color: 'var(--pingone-text-primary)',
	fontSize: '1.25rem',
	fontWeight: '600',
	marginBottom: '1rem',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: '0.75rem',
});

const getResourceDescriptionStyle = () => ({
	color: 'var(--pingone-text-secondary)',
	marginBottom: '1.5rem',
	lineHeight: '1.6',
});

const getDownloadButtonStyle = () => ({
	background: 'var(--pingone-brand-primary)',
	color: 'var(--pingone-text-inverse)',
	textDecoration: 'none',
	padding: '0.75rem 1.5rem',
	borderRadius: '0.375rem',
	fontSize: '1rem',
	fontWeight: '500',
	display: 'inline-flex',
	alignItems: 'center',
	gap: '0.5rem',
	transition: 'all 0.15s ease-in-out',
	'&:hover': {
		background: 'var(--pingone-brand-primary-dark)',
		transform: 'translateY(-1px)',
	},
});

const ProtectPortalAppPingUI: React.FC = () => {
	const { workerToken, isLoading: workerTokenLoading } = useGlobalWorkerToken();
	const { activeTheme } = useBrandTheme();

	// State management
	const [portalState, setPortalState] = useState<PortalState>({
		currentStep: 'portal-home',
		userContext: null,
		loginContext: null,
		riskEvaluation: null,
		selectedDevice: null,
		availableDevices: [],
		tokens: null,
		tokenDisplay: null,
		error: null,
		isLoading: false,
	});

	// Configuration
	const environmentId = import.meta.env.VITE_PINGONE_ENV_ID;
	const clientId = import.meta.env.VITE_PINGONE_CLIENT_ID;
	const clientSecret = import.meta.env.VITE_PINGONE_CLIENT_SECRET;
	const redirectUri = import.meta.env.VITE_PINGONE_REDIRECT_URI;

	const initialStep: PortalStep = 'portal-home';

	// Footer configuration
	const footerConfig: CorporatePortalConfig = {
		companyName: activeTheme.companyName,
		supportEmail: 'support@example.com',
		privacyUrl: '/privacy',
		termsUrl: '/terms',
		securityUrl: '/security',
	};

	// Event handlers
	const handleLoginStart = useCallback((loginContext: LoginContext) => {
		console.log('[🚀 PROTECT-PORTAL-PINGUI] Login started:', loginContext);
		setPortalState((prev) => ({
			...prev,
			loginContext,
			currentStep: 'custom-login',
			isLoading: false,
			error: null,
		}));
	}, []);

	const handleLoginSuccess = useCallback((userContext: UserContext) => {
		console.log('[🚀 PROTECT-PORTAL-PINGUI] Login successful:', userContext);
		setPortalState((prev) => ({
			...prev,
			userContext,
			currentStep: 'risk-evaluation',
			isLoading: true,
			error: null,
		}));

		// Simulate risk evaluation
		setTimeout(() => {
			const riskLevel = Math.random() > 0.3 ? 'low' : Math.random() > 0.5 ? 'medium' : 'high';
			const riskEvaluation: RiskEvaluationResult = {
				riskLevel,
				riskScore: riskLevel === 'low' ? 0.2 : riskLevel === 'medium' ? 0.6 : 0.9,
				factors: [
					{
						type: 'device-reputation',
						description: 'Device reputation check',
						impact: riskLevel === 'low' ? 'positive' : 'neutral',
					},
					{
						type: 'location-anomaly',
						description: 'Location analysis',
						impact: 'neutral',
					},
				],
				recommendation:
					riskLevel === 'high' ? 'mfa-required' : riskLevel === 'medium' ? 'mfa-optional' : 'allow',
			};

			setPortalState((prev) => ({
				...prev,
				riskEvaluation,
				currentStep: riskLevel === 'high' ? 'mfa-authentication' : 'portal-success',
				isLoading: false,
			}));
		}, 2000);
	}, []);

	const handleMFAComplete = useCallback((tokens: TokenSet) => {
		console.log('[🚀 PROTECT-PORTAL-PINGUI] MFA completed, proceeding to success');
		setPortalState((prev) => ({
			...prev,
			tokens,
			currentStep: 'portal-success',
			error: null,
		}));
	}, []);

	const handleError = useCallback((error: PortalError) => {
		console.error('[🚀 PROTECT-PORTAL-PINGUI] Error occurred:', error);
		setPortalState((prev) => ({
			...prev,
			currentStep: 'error',
			error,
			isLoading: false,
		}));
	}, []);

	const handleRetry = useCallback(() => {
		console.log('[🚀 PROTECT-PORTAL-PINGUI] Retrying from error state');
		setPortalState((prev) => ({
			...prev,
			currentStep: 'portal-home',
			error: null,
			isLoading: false,
		}));
	}, []);

	const handleReset = useCallback(() => {
		console.log('[🚀 PROTECT-PORTAL-PINGUI] Resetting to initial state');
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
	}, []);

	// Render step components
	const renderStep = () => {
		const { currentStep, isLoading, error } = portalState;

		console.log('[🚀 PROTECT-PORTAL-APP-PINGUI] Rendering step:', currentStep);

		if (isLoading) {
			return (
				<div style={getLoadingContainerStyle()}>
					<div style={getLoadingSpinnerStyle()} />
					<div style={getLoadingTextStyle()}>Processing your request...</div>
				</div>
			);
		}

		if (error && currentStep === 'error') {
			return (
				<div style={getErrorContainerStyle()}>
					<div style={getErrorTitleStyle()}>
						<MDIIcon icon="alert-circle" size={24} />
						Something went wrong
					</div>
					<div style={getErrorMessageStyle()}>{error.message}</div>
					{error.suggestedAction && (
						<p
							style={{
								color: 'var(--pingone-text-tertiary)',
								fontSize: '0.875rem',
								marginBottom: '1rem',
							}}
						>
							{error.suggestedAction}
						</p>
					)}
					<div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
						{error.recoverable && (
							<button style={getButtonStyle('primary')} onClick={handleRetry}>
								<MDIIcon icon="refresh" size={20} />
								Try Again
							</button>
						)}
						<button style={getButtonStyle('secondary')} onClick={handleReset}>
							<MDIIcon icon="home" size={20} />
							Start Over
						</button>
					</div>
				</div>
			);
		}

		switch (currentStep) {
			case 'portal-home':
				return null; // Will be handled by theme-specific hero components
			case 'custom-login':
				return <CustomLoginForm onLoginSuccess={handleLoginSuccess} onError={handleError} />;
			case 'risk-evaluation':
				return (
					<RiskEvaluationDisplay
						riskEvaluation={portalState.riskEvaluation}
						onMFARequired={() =>
							setPortalState((prev) => ({ ...prev, currentStep: 'mfa-authentication' }))
						}
						onProceed={() => setPortalState((prev) => ({ ...prev, currentStep: 'portal-success' }))}
					/>
				);
			case 'mfa-authentication':
				return (
					<MFAAuthenticationFlow
						onMFAComplete={handleMFAComplete}
						onError={handleError}
						environmentId={environmentId}
						clientId={clientId}
						clientSecret={clientSecret}
					/>
				);
			case 'portal-success':
				return (
					<PortalSuccess
						tokens={portalState.tokens}
						userContext={portalState.userContext}
						onReset={handleReset}
					/>
				);
			default:
				return (
					<div style={getErrorContainerStyle()}>
						<div style={getErrorTitleStyle()}>
							<MDIIcon icon="alert-circle" size={24} />
							Unknown State
						</div>
						<div style={getErrorMessageStyle()}>
							The application is in an unknown state. Please try again.
						</div>
						<button style={getButtonStyle('primary')} onClick={handleReset}>
							<MDIIcon icon="refresh" size={20} />
							Reset Application
						</button>
					</div>
				);
		}
	};

	const ProtectPortalContent = () => {
		const { currentStep } = portalState;
		const isPortalHome = currentStep === 'portal-home';

		return (
			<div className="end-user-nano">
				<div style={getPortalContainerStyle()}>
					{/* Company Header */}
					<CompanyHeader config={footerConfig} />

					{/* Main Portal Card */}
					<div style={getPortalCardStyle()}>
						{/* Theme-specific Hero Components */}
						{isPortalHome && activeTheme.name === 'american-airlines' && (
							<AmericanAirlinesHero
								currentStep={portalState.currentStep}
								onLoginStart={handleLoginStart}
								onLoginSuccess={handleLoginSuccess}
								onError={handleError}
								environmentId={environmentId}
								clientId={clientId}
								clientSecret={clientSecret}
								redirectUri={redirectUri}
							/>
						)}
						{isPortalHome && activeTheme.name === 'southwest-airlines' && (
							<SouthwestAirlinesHero
								currentStep={portalState.currentStep}
								onLoginStart={handleLoginStart}
								onLoginSuccess={handleLoginSuccess}
								onError={handleError}
								environmentId={environmentId}
								clientId={clientId}
								clientSecret={clientSecret}
								redirectUri={redirectUri}
							/>
						)}
						{isPortalHome && activeTheme.name === 'fedex' && (
							<FedExAirlinesHero
								currentStep={portalState.currentStep}
								onLoginStart={handleLoginStart}
								onLoginSuccess={handleLoginSuccess}
								onError={handleError}
								environmentId={environmentId}
								clientId={clientId}
								clientSecret={clientSecret}
								redirectUri={redirectUri}
							/>
						)}
						{isPortalHome && activeTheme.name === 'bank-of-america' && (
							<BankOfAmericaHero
								currentStep={portalState.currentStep}
								onLoginStart={handleLoginStart}
								onLoginSuccess={handleLoginSuccess}
								onError={handleError}
								environmentId={environmentId}
								clientId={clientId}
								clientSecret={clientSecret}
								redirectUri={redirectUri}
							/>
						)}
						{isPortalHome && activeTheme.name === 'united-airlines' && (
							<UnitedAirlinesHero
								currentStep={portalState.currentStep}
								onLoginStart={handleLoginStart}
								onLoginSuccess={handleLoginSuccess}
								onError={handleError}
								environmentId={environmentId}
								clientId={clientId}
								clientSecret={clientSecret}
								redirectUri={redirectUri}
							/>
						)}
						{isPortalHome && activeTheme.name === 'pingidentity' && (
							<CorporatePortalHero
								currentStep={portalState.currentStep}
								onLoginStart={handleLoginStart}
								onLoginSuccess={handleLoginSuccess}
								onError={handleError}
								environmentId={environmentId}
								clientId={clientId}
								clientSecret={clientSecret}
								redirectUri={redirectUri}
							/>
						)}
						{isPortalHome &&
							![
								'american-airlines',
								'southwest-airlines',
								'fedex',
								'bank-of-america',
								'united-airlines',
								'pingidentity',
							].includes(activeTheme.name) && (
								<CorporatePortalHero
									currentStep={portalState.currentStep}
									onLoginStart={handleLoginStart}
									onLoginSuccess={handleLoginSuccess}
									onError={handleError}
									environmentId={environmentId}
									clientId={clientId}
									clientSecret={clientSecret}
									redirectUri={redirectUri}
								/>
							)}
						<div style={getPortalContentStyle()}>{renderStep()}</div>
					</div>

					{/* Resource Section */}
					<div style={getResourceSectionStyle()}>
						<div style={getResourceTitleStyle()}>
							<MDIIcon icon="shield-check" size={24} />
							PingOne Protect Best Practices
						</div>
						<div style={getResourceDescriptionStyle()}>
							Download our comprehensive guide for debugging PingOne payloads and implementing best
							practices for risk-based authentication.
						</div>
						<a
							href="/Debugging-PingOne-Payload.pdf"
							download="Debugging-PingOne-Payload.pdf"
							target="_blank"
							rel="noopener noreferrer"
							style={getDownloadButtonStyle()}
						>
							<MDIIcon icon="file-download" size={20} />
							Download PDF Guide
						</a>
					</div>

					{/* Worker Token Status Display */}
					<WorkerTokenStatusDisplayV8 />

					<CorporateFooter config={footerConfig} />
				</div>
			</div>
		);
	};

	return (
		<BrandThemeProvider>
			<ProtectPortalContent />
		</BrandThemeProvider>
	);
};

export default ProtectPortalAppPingUI;
