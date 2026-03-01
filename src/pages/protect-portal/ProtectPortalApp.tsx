/**
 * @file ProtectPortalApp.tsx
 * @module protect-portal
 * @description Main Protect Portal application component — V8 migration
 * @version 9.7.0
 * @since 2026-02-10
 *
 * This is the main component for the Protect Portal application that demonstrates
 * risk-based authentication with custom login, MFA integration, and OIDC token display.
 */

import { FiAlertTriangle, FiCheckCircle, FiLoader, FiShield, FiX } from '@icons';
import React, { useCallback, useEffect, useState } from 'react';
import { WorkerTokenSectionV8 } from '@/v8/components/WorkerTokenSectionV8';
import AmericanAirlinesHero from './components/AmericanAirlinesHero';
import BankOfAmericaHero from './components/BankOfAmericaHero';
import CompanyHeader from './components/CompanyHeader';
import CorporatePortalHero from './components/CorporatePortalHero';
import CustomLoginForm from './components/CustomLoginForm';
import FedExAirlinesHero from './components/FedExAirlinesHero';
import MFAAuthenticationFlow from './components/MFAAuthenticationFlow';
import PortalStats from './components/PortalStats';
import PortalSuccess from './components/PortalSuccess';
import ProtectPage from './components/ProtectPage';
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

// ============================================================================
// INLINE STYLE HELPERS
// ============================================================================

const styles = {
	portalContainer: {
		minHeight: '100vh',
		background: 'var(--brand-background, #f9fafb)',
		display: 'flex',
		flexDirection: 'column' as const,
		width: '100%',
		fontFamily: 'var(--brand-font-family, inherit)',
		alignItems: 'stretch',
		justifyContent: 'flex-start',
	},
	portalCard: {
		background: 'transparent',
		overflow: 'hidden',
		width: '100%',
		flex: 1,
		display: 'flex',
		flexDirection: 'column' as const,
		alignItems: 'stretch',
		justifyContent: 'flex-start',
	},
	portalContent: {
		flex: 1,
		padding: 0,
		display: 'flex',
		flexDirection: 'column' as const,
		width: '100%',
		alignItems: 'stretch',
		justifyContent: 'flex-start',
	},
	errorContainer: {
		background: '#fef2f2',
		border: '1px solid #fecaca',
		borderRadius: '0.5rem',
		padding: '1.5rem',
		maxWidth: '500px',
		width: '100%',
		textAlign: 'center' as const,
	},
	errorTitle: {
		color: '#dc2626',
		fontSize: '1.25rem',
		fontWeight: 600,
		margin: '0 0 0.75rem 0',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '0.5rem',
	},
	errorMessage: {
		color: '#7f1d1d',
		fontSize: '1rem',
		margin: '0 0 1rem 0',
		lineHeight: 1.5,
	},
	errorActions: {
		display: 'flex',
		gap: '1rem',
		justifyContent: 'center',
		flexWrap: 'wrap' as const,
	},
	resourceSection: {
		background: 'var(--brand-surface, #f9fafb)',
		borderTop: '1px solid var(--brand-border, #e5e7eb)',
		padding: '2rem 1.5rem',
		textAlign: 'center' as const,
	},
	resourceTitle: {
		color: 'var(--brand-text, #1f2937)',
		fontSize: '1.5rem',
		fontWeight: 600,
		margin: '0 0 0.5rem 0',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '0.5rem',
	},
	resourceDescription: {
		color: 'var(--brand-text-secondary, #6b7280)',
		fontSize: '1rem',
		margin: '0 0 1.5rem 0',
		lineHeight: 1.5,
	},
	downloadButton: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.5rem',
		padding: '0.875rem 1.75rem',
		background: '#2563eb',
		color: 'white',
		borderRadius: '0.5rem',
		fontWeight: 600,
		fontSize: '1rem',
		textDecoration: 'none',
		cursor: 'pointer',
	},
	btnBase: {
		padding: '0.75rem 1.5rem',
		borderRadius: '0.5rem',
		fontWeight: 600,
		fontSize: '1rem',
		border: 'none',
		cursor: 'pointer',
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	},
	btnPrimary: {
		background: '#2563eb',
		color: 'white',
	},
	btnSecondary: {
		background: 'var(--brand-surface, #f9fafb)',
		color: 'var(--brand-text, #1f2937)',
		border: '2px solid #2563eb',
	},
	loadingContainer: {
		display: 'flex',
		flexDirection: 'column' as const,
		alignItems: 'center',
		gap: '1rem',
		textAlign: 'center' as const,
		padding: '2rem',
	},
	loadingText: {
		color: '#6b7280',
		fontSize: '1rem',
		margin: 0,
	},
	workerTokenWrapper: {
		padding: '1.5rem',
		borderTop: '1px solid #e5e7eb',
		background: '#f9fafb',
	},
} as const;

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
		setPortalState((prev) => ({
			...prev,
			currentStep: 'custom-login',
			error: null,
		}));
	}, []);

	const handleLoginSuccess = useCallback((userContext: UserContext, loginContext: LoginContext) => {
		setPortalState((prev) => ({
			...prev,
			userContext,
			loginContext,
			currentStep: 'risk-evaluation',
			error: null,
		}));
	}, []);

	const handleRiskEvaluationComplete = useCallback(async (result: RiskEvaluationResult) => {
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
		setPortalState((prev) => ({
			...prev,
			currentStep: 'portal-home',
			error: null,
			isLoading: false,
		}));
	}, []);

	const handleReset = useCallback(() => {
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

		if (isLoading) {
			return (
				<div style={styles.loadingContainer}>
					<FiLoader
						style={{
							animation: 'spin 1s linear infinite',
							fontSize: '2rem',
							color: '#3b82f6',
						}}
					/>
					<p style={styles.loadingText}>Processing your request...</p>
				</div>
			);
		}

		if (error && currentStep === 'error') {
			return (
				<div style={styles.errorContainer}>
					<h3 style={styles.errorTitle}>
						<FiAlertTriangle />
						Something went wrong
					</h3>
					<p style={styles.errorMessage}>{error.message}</p>
					{error.suggestedAction && (
						<p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>
							{error.suggestedAction}
						</p>
					)}
					<div style={styles.errorActions}>
						{error.recoverable && (
							<button
								type="button"
								style={{ ...styles.btnBase, ...styles.btnPrimary }}
								onClick={handleRetry}
							>
								<FiCheckCircle />
								Try Again
							</button>
						)}
						<button
							type="button"
							style={{ ...styles.btnBase, ...styles.btnSecondary }}
							onClick={handleReset}
						>
							<FiX />
							Start Over
						</button>
					</div>
				</div>
			);
		}

		switch (currentStep) {
			case 'portal-home':
				return null;

			case 'custom-login':
				return (
					<CustomLoginForm
						onLoginSuccess={handleLoginSuccess}
						onError={handleError}
						environmentId={environmentId}
						clientId={clientId}
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
						onError={(error) =>
							handleError({
								code: 'PORTAL_STATS_ERROR',
								message: error.message,
								recoverable: error.recoverable ?? true,
								suggestedAction: 'Please try again',
							})
						}
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
						onError={(error) =>
							handleError({
								code: 'PROTECT_PAGE_ERROR',
								message: error.message,
								recoverable: error.recoverable ?? true,
								suggestedAction: 'Please try again',
							})
						}
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
						onError={(error) =>
							handleError({
								code: 'PROTECT_PAGE_ERROR',
								message: error.message,
								recoverable: error.recoverable ?? true,
								suggestedAction: 'Please try again',
							})
						}
						educationalContent={portalState.educationalContent.riskEvaluation}
					/>
				);

			case 'risk-high-block':
				// High protect score: blocked page
				return (
					<div style={styles.errorContainer}>
						<h3 style={styles.errorTitle}>
							<FiShield />
							Access Blocked
						</h3>
						<p style={styles.errorMessage}>
							This login attempt has been blocked due to high-risk indicators. For your security,
							please contact your administrator or try again from a trusted location and device.
						</p>
						<div style={styles.errorActions}>
							<button
								type="button"
								style={{ ...styles.btnBase, ...styles.btnSecondary }}
								onClick={handleReset}
							>
								<FiX />
								Try Again Later
							</button>
						</div>
					</div>
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
					<div style={styles.errorContainer}>
						<h3 style={styles.errorTitle}>
							<FiAlertTriangle />
							Unknown Step
						</h3>
						<p style={styles.errorMessage}>
							The application is in an unknown state. Please start over.
						</p>
						<div style={styles.errorActions}>
							<button
								type="button"
								style={{ ...styles.btnBase, ...styles.btnPrimary }}
								onClick={handleReset}
							>
								<FiCheckCircle />
								Start Over
							</button>
						</div>
					</div>
				);
		}
	};

	// ============================================================================
	// EFFECTS
	// ============================================================================

	useEffect(() => {
		const handleThemeSwitched = () => {
			setPortalState((prev) => ({
				...prev,
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
			}));
		};

		window.addEventListener('protect-portal-theme-switched', handleThemeSwitched);
		return () => window.removeEventListener('protect-portal-theme-switched', handleThemeSwitched);
	}, []);

	// ============================================================================
	// RENDER
	// ============================================================================

	const ProtectPortalContent = () => {
		const { activeTheme } = useBrandTheme();
		const isPortalHome = portalState.currentStep === 'portal-home';
		const showGlobalHeader = !isPortalHome || activeTheme.name !== 'fedex';
		const footerConfig: CorporatePortalConfig =
			activeTheme.portalConfig ??
			({
				company: {
					name: activeTheme.name,
					displayName: activeTheme.displayName,
					industry: 'other',
					logo: {
						url: activeTheme.logo.url ?? '',
						alt: activeTheme.logo.alt,
						width: activeTheme.logo.width,
						height: activeTheme.logo.height,
						text: activeTheme.logo.text ?? activeTheme.displayName,
						colors: activeTheme.logo.colors ?? {},
					},
				},
				login: {
					pattern: 'new-page',
				},
				navigation: {
					style: 'corporate',
					showBrandSelector: true,
					stickyHeader: true,
				},
				content: {
					customerTerminology: true,
					tone: 'corporate',
					heroTitle: activeTheme.portalName,
					heroSubtitle: activeTheme.brandSpecific.messaging.welcome,
					features: [],
				},
				branding: {
					colors: {
						primary: activeTheme.colors.primary,
						primaryDark: activeTheme.colors.primaryDark,
						secondary: activeTheme.colors.secondary,
						accent: activeTheme.colors.accent,
						background: activeTheme.colors.background,
						surface: activeTheme.colors.surface,
						muted: activeTheme.colors.muted,
						border: activeTheme.colors.border,
						text: activeTheme.colors.text,
						textSecondary: activeTheme.colors.textSecondary,
						error: activeTheme.colors.error,
						success: activeTheme.colors.success,
						warning: activeTheme.colors.warning,
						info: activeTheme.colors.info,
						primaryLight: activeTheme.colors.primaryLight,
						secondaryLight: activeTheme.colors.secondaryLight,
						secondaryDark: activeTheme.colors.secondaryDark,
						errorLight: activeTheme.colors.errorLight,
						warningLight: activeTheme.colors.warningLight,
						successLight: activeTheme.colors.successLight,
					},
					typography: {
						heading: activeTheme.typography.headingFont,
						body: activeTheme.typography.bodyFont,
					},
					spacing: {
						xs: activeTheme.spacing.xs,
						sm: activeTheme.spacing.sm,
						md: activeTheme.spacing.md,
						lg: activeTheme.spacing.lg,
						xl: activeTheme.spacing.xl,
						xxl: activeTheme.spacing.xxl,
					},
				},
			} satisfies CorporatePortalConfig);

		return (
			<div style={styles.portalContainer}>
				{/* Global company header for non-home steps or PingIdentity default home */}
				{showGlobalHeader && <CompanyHeader showBrandSelector={true} />}

				<div style={styles.portalCard}>
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
							_onLoginSuccess={handleLoginSuccess}
							_onError={handleError}
							_environmentId={environmentId}
							_clientId={clientId}
							_clientSecret={clientSecret}
							_redirectUri={redirectUri}
						/>
					)}
					{isPortalHome && activeTheme.name === 'fedex' && (
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
					{isPortalHome && activeTheme.name === 'bank-of-america' && (
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
					{isPortalHome && activeTheme.name === 'united-airlines' && (
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
					{(isPortalHome && activeTheme.name === 'pingidentity') ||
					(isPortalHome &&
						![
							'american-airlines',
							'southwest-airlines',
							'fedex',
							'bank-of-america',
							'united-airlines',
							'pingidentity',
						].includes(activeTheme.name)) ? (
						<CorporatePortalHero
							currentStep={portalState.currentStep}
							onLoginStart={handleLoginStart}
							_onLoginSuccess={handleLoginSuccess}
							_onError={handleError}
							_environmentId={environmentId}
							_clientId={clientId}
							_clientSecret={clientSecret}
							_redirectUri={redirectUri}
						/>
					) : null}
					<div style={styles.portalContent}>{renderStep()}</div>
				</div>

				<div style={styles.resourceSection}>
					<h3 style={styles.resourceTitle}>
						<FiShield size={24} />
						PingOne Protect Best Practices
					</h3>
					<p style={styles.resourceDescription}>
						Download our comprehensive guide for debugging PingOne payloads and implementing best
						practices for risk-based authentication.
					</p>
					<a
						style={styles.downloadButton}
						href="/Debugging-PingOne-Payload.pdf"
						download="Debugging-PingOne-Payload.pdf"
						target="_blank"
						rel="noopener noreferrer"
					>
						<FiCheckCircle size={20} />
						Download PDF Guide
					</a>
				</div>

				{/* Worker Token Status */}
				<div style={styles.workerTokenWrapper}>
					<WorkerTokenSectionV8 compact environmentId={environmentId} />
				</div>

				<CorporateFooter config={footerConfig} />
			</div>
		);
	};

	return (
		<BrandThemeProvider>
			<ProtectPortalContent />
		</BrandThemeProvider>
	);
};

export default ProtectPortalApp;
