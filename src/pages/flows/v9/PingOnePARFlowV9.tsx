// src/pages/flows/v9/PingOnePARFlowV9.tsx
// V9.0.0 PingOne PAR (Pushed Authorization Request) Flow - Modern V9 Architecture

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthorizationDetailsEditor } from '../../../components/AuthorizationDetailsEditor';
import ColoredTokenDisplay from '../../../components/ColoredTokenDisplay';
import { useAuthorizationCodeFlowController } from '../../../hooks/useAuthorizationCodeFlowController';
import { usePageScroll } from '../../../hooks/usePageScroll';
import { comprehensiveFlowDataService } from '../../../services/comprehensiveFlowDataService';
import {
	type PARConfiguration,
	PARConfigurationServiceUtils,
} from '../../../services/parConfigurationService';
import { PKCEServiceUtils } from '../../../services/pkceService';
import { type AuthorizationDetail, RARService } from '../../../services/rarService';
import { V9FlowCredentialService } from '../../../services/v9/core/V9FlowCredentialService';
import { V9CredentialStorageService } from '../../../services/v9/V9CredentialStorageService';
import { V9FlowRestartButton } from '../../../services/v9/V9FlowRestartButton';
import { V9ModernMessagingService } from '../../../services/v9/V9ModernMessagingService';
import { createModuleLogger } from '../../../utils/consoleMigrationHelper';
import { logger } from '../../../utils/logger';
import type { DiscoveredApp } from '../../../v8/components/AppPickerV8';
import { CompactAppPickerV8U } from '../../../v8u/components/CompactAppPickerV8U';
import { PKCEStorageServiceV8U } from '../../../v8u/services/pkceStorageServiceV8U';

// Step metadata for V9
const STEP_METADATA = [
	{
		title: 'Setup & Credentials',
		subtitle: 'Configure your PingOne environment and application settings',
	},
	{
		title: 'PKCE Generation',
		subtitle: 'Generate secure PKCE parameters for enhanced security',
	},
	{
		title: 'Push Authorization Request',
		subtitle: 'Send authorization request to PAR endpoint with all parameters',
	},
	{
		title: 'User Authentication',
		subtitle: 'Complete authorization using the request_uri from PAR',
	},
	{
		title: 'Authorization Response',
		subtitle: 'Handle the authorization callback and extract authorization code',
	},
	{
		title: 'Token Exchange',
		subtitle: 'Exchange authorization code for access tokens',
	},
	{
		title: 'Token Management',
		subtitle: 'Introspect and manage the received tokens',
	},
	{
		title: 'Flow Complete',
		subtitle: 'Review the completed PAR flow and next steps',
	},
];

const RAR_TEMPLATES = RARService.getTemplates();

// educational-ok: deep clone of authorization detail for UI mutation safety
const cloneAuthorizationDetail = (detail: AuthorizationDetail): AuthorizationDetail =>
	// educational-ok: deep clone of authorization detail for UI mutation safety
	JSON.parse(JSON.stringify(detail));

const _log = createModuleLogger('src/pages/flows/v9/PingOnePARFlowV9.tsx');

const PingOnePARFlowV9: React.FC = () => {
	const location = useLocation();
	const [currentStep, setCurrentStep] = useState(0);
	const messagingService = V9ModernMessagingService.getInstance();

	// Initialize page scroll management
	usePageScroll({ pageName: 'PingOne PAR Flow V9', force: true });

	// Detect default variant based on navigation context
	const getDefaultVariant = (): 'oauth' | 'oidc' => {
		// Check if there's a variant specified in the URL params
		const urlParams = new URLSearchParams(location.search);
		const urlVariant = urlParams.get('variant');
		if (urlVariant === 'oidc' || urlVariant === 'oauth') {
			return urlVariant as 'oauth' | 'oidc';
		}

		// Default to OIDC for PAR flows (more common use case)
		return 'oidc';
	};

	const [selectedVariant, setSelectedVariant] = (useState < 'oauth') | 'oidc'(getDefaultVariant());

	// Initialize authorization code flow controller with V9 settings
	// Use dedicated PAR flow key to ensure separate storage
	const controller = useAuthorizationCodeFlowController({
		flowKey: 'pingone-par-flow-v9',
		defaultFlowVariant: selectedVariant,
	});

	const [_parConfig, setParConfig] = useState<PARConfiguration>(() =>
		PARConfigurationServiceUtils.getDefaultConfig()
	);

	const [authorizationDetails, setAuthorizationDetails] = useState<AuthorizationDetail[]>(() => [
		cloneAuthorizationDetail(RAR_TEMPLATES.customerInformation),
	]);

	const handleAuthorizationDetailsChange = useCallback((details: AuthorizationDetail[]) => {
		setAuthorizationDetails(details);
	}, []);

	// Override redirect URI for PAR flows to use par-callback
	const handleParAppSelected = useCallback(
		(app: DiscoveredApp) => {
			const updated = { ...controller.credentials, clientId: app.id };
			controller.setCredentials(updated);
			V9CredentialStorageService.save(
				'v9:pingone-par',
				{
					clientId: app.id,
					clientSecret: updated.clientSecret,
					environmentId: updated.environmentId,
				},
				updated.environmentId ? { environmentId: updated.environmentId } : {}
			);
		},
		[controller]
	);

	useEffect(() => {
		if (
			controller.credentials &&
			controller.credentials.redirectUri !== 'https://localhost:3000/par-callback'
		) {
			logger.info('PingOnePARFlowV9', 'Overriding redirect URI for PAR flow', {
				from: controller.credentials.redirectUri,
				to: 'https://localhost:3000/par-callback',
			});
			controller.setCredentials({
				...controller.credentials,
				redirectUri: 'https://localhost:3000/par-callback',
			});
		}
	}, [controller.credentials, controller.setCredentials]); // Only run when variant changes

	// Ensure PAR flow uses its own credential storage
	useEffect(() => {
		// Save current credentials to PAR-specific storage
		if (
			controller.credentials &&
			(controller.credentials.environmentId || controller.credentials.clientId)
		) {
			logger.info('PingOnePARFlowV9', 'Saving credentials to PAR-specific storage', {
				flowKey: 'pingone-par-flow-v9',
				environmentId: controller.credentials.environmentId,
				clientId: `${controller.credentials.clientId?.substring(0, 8)}...`,
				redirectUri: controller.credentials.redirectUri,
			});

			// Save to comprehensive service with complete isolation
			const success = comprehensiveFlowDataService.saveFlowDataComprehensive(
				'pingone-par-flow-v9',
				{
					...(controller.credentials.environmentId && {
						sharedEnvironment: {
							environmentId: controller.credentials.environmentId,
							region: 'us', // Default region
							issuerUrl: `https://auth.pingone.com/${controller.credentials.environmentId}`,
						},
					}),
					flowCredentials: {
						clientId: controller.credentials.clientId,
						clientSecret: controller.credentials.clientSecret,
						redirectUri: controller.credentials.redirectUri,
						scopes: Array.isArray(controller.credentials.scopes)
							? controller.credentials.scopes
							: controller.credentials.scopes
								? [controller.credentials.scopes]
								: [],
						tokenEndpointAuthMethod: 'client_secret_basic',
						lastUpdated: Date.now(),
					},
				}
			);

			if (success) {
				logger.info('PingOnePARFlowV9', 'Credentials saved successfully to PAR-specific storage');
			}
		}
	}, [controller.credentials]);

	// Initialize PKCE codes
	const [pkceCodes, setPkceCodes] = useState<PKCECodes | null>(null);

	const generatePKCE = useCallback(() => {
		try {
			const codes = PKCEServiceUtils.generatePKCECodes();
			setPkceCodes(codes);

			// Store PKCE codes for PAR flow
			PKCEStorageServiceV8U.storePKCECodes('pingone-par-flow-v9', codes);

			messagingService.showSuccessBanner('PKCE codes generated successfully');
			logger.info('PingOnePARFlowV9', 'PKCE codes generated', {
				codeChallengeLength: codes.codeChallenge.length,
				codeVerifierLength: codes.codeVerifier.length,
			});
		} catch (_error) {
			messagingService.showErrorBanner('Failed to generate PKCE codes');
		}
	}, [messagingService]);

	// Load stored PKCE codes on mount
	useEffect(() => {
		const storedCodes = PKCEStorageServiceV8U.getStoredPKCECodes('pingone-par-flow-v9');
		if (storedCodes) {
			setPkceCodes(storedCodes);
			logger.info('PingOnePARFlowV9', 'Loaded stored PKCE codes');
		}
	}, []);

	// Step navigation handlers
	const handleNextStep = useCallback(() => {
		if (currentStep < STEP_METADATA.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	}, [currentStep]);

	const handlePreviousStep = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	}, [currentStep]);

	const handleStepSelect = useCallback((stepIndex: number) => {
		if (stepIndex >= 0 && stepIndex < STEP_METADATA.length) {
			setCurrentStep(stepIndex);
		}
	}, []);

	// Restart flow handler
	const handleRestartFlow = useCallback(() => {
		setCurrentStep(0);
		setParConfig(PARConfigurationServiceUtils.getDefaultConfig());
		setAuthorizationDetails([cloneAuthorizationDetail(RAR_TEMPLATES.customerInformation)]);
		setPkceCodes(null);

		// Clear PKCE storage
		PKCEStorageServiceV8U.clearPKCECodes('pingone-par-flow-v9');

		// Reset controller
		controller.reset();

		messagingService.showSuccessBanner('Flow restarted successfully');
		logger.info('PingOnePARFlowV9', 'Flow restarted');
	}, [controller, messagingService]);

	// Validate step before proceeding
	const validateCurrentStep = useCallback((): boolean => {
		switch (currentStep) {
			case 0: // Setup & Credentials
				if (!controller.credentials?.environmentId || !controller.credentials?.clientId) {
					messagingService.showErrorBanner('Please configure environment ID and client ID');
					return false;
				}
				return true;
			case 1: // PKCE Generation
				if (!pkceCodes) {
					messagingService.showErrorBanner('Please generate PKCE codes first');
					return false;
				}
				return true;
			default:
				return true;
		}
	}, [currentStep, controller.credentials, pkceCodes, messagingService]);

	// Handle next step with validation
	const handleNextStepWithValidation = useCallback(() => {
		if (validateCurrentStep()) {
			handleNextStep();
		}
	}, [validateCurrentStep, handleNextStep]);

	// Render step content
	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<div style={{ padding: '2rem' }}>
						<h3
							style={{
								fontSize: '1.5rem',
								fontWeight: '600',
								marginBottom: '1rem',
								color: '#1f2937',
							}}
						>
							Setup & Credentials
						</h3>
						<p style={{ marginBottom: '2rem', color: '#6b7280' }}>
							Configure your PingOne environment and application settings for the PAR flow.
						</p>

						{/* Variant Selector */}
						<div
							style={{
								display: 'flex',
								gap: '1rem',
								marginBottom: '2rem',
								padding: '1.5rem',
								background: '#f8fafc',
								borderRadius: '0.75rem',
								border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
							}}
						>
							<button
								type="button"
								onClick={() => setSelectedVariant('oauth')}
								style={{
									flex: 1,
									padding: '1rem',
									borderRadius: '0.5rem',
									border: `2px solid ${selectedVariant === 'oauth' ? '#059669' : '#cbd5e1'}`,
									background: selectedVariant === 'oauth' ? '#ecfdf5' : 'white',
									color: selectedVariant === 'oauth' ? '#10b981' : '#6b7280',
									fontWeight: selectedVariant === 'oauth' ? '600' : '500',
									transition: 'all 0.2s ease',
									cursor: 'pointer',
								}}
							>
								<div style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>OAuth 2.0</div>
								<div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Standard OAuth flow</div>
							</button>
							<button
								type="button"
								onClick={() => setSelectedVariant('oidc')}
								style={{
									flex: 1,
									padding: '1rem',
									borderRadius: '0.5rem',
									border: `2px solid ${selectedVariant === 'oidc' ? '#059669' : '#cbd5e1'}`,
									background: selectedVariant === 'oidc' ? '#ecfdf5' : 'white',
									color: selectedVariant === 'oidc' ? '#10b981' : '#6b7280',
									fontWeight: selectedVariant === 'oidc' ? '600' : '500',
									transition: 'all 0.2s ease',
									cursor: 'pointer',
								}}
							>
								<div style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>OpenID Connect</div>
								<div style={{ fontSize: '0.875rem', opacity: 0.8 }}>With ID tokens</div>
							</button>
						</div>

						{/* Credentials Input */}
						<CompactAppPickerV8U
							environmentId={controller.credentials.environmentId ?? ''}
							onAppSelected={handleParAppSelected}
						/>
						<V9FlowCredentialService
							flowKey="pingone-par-flow-v9"
							onCredentialsChange={(credentials) => {
								if (credentials) {
									controller.setCredentials(credentials);
								}
							}}
						/>
					</div>
				);

			case 1:
				return (
					<div style={{ padding: '2rem' }}>
						<h3
							style={{
								fontSize: '1.5rem',
								fontWeight: '600',
								marginBottom: '1rem',
								color: '#1f2937',
							}}
						>
							PKCE Generation
						</h3>
						<p style={{ marginBottom: '2rem', color: '#6b7280' }}>
							Generate PKCE (Proof Key for Code Exchange) parameters for enhanced security.
						</p>

						{pkceCodes ? (
							<div
								style={{
									background: '#f8fafc',
									border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
									borderRadius: '0.75rem',
									padding: '1.5rem',
								}}
							>
								<h4
									style={{
										fontSize: '1.1rem',
										fontWeight: '600',
										marginBottom: '1rem',
										color: '#1f2937',
									}}
								>
									Generated PKCE Codes
								</h4>
								<div style={{ marginBottom: '1rem' }}>
									<div
										style={{
											display: 'block',
											fontWeight: '500',
											marginBottom: '0.5rem',
											color: '#1f2937',
										}}
									>
										Code Challenge:
									</div>
									<code
										style={{
											background: '#f3f4f6',
											padding: '0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
											wordBreak: 'break-all',
										}}
									>
										{pkceCodes.codeChallenge}
									</code>
								</div>
								<div style={{ marginBottom: '1rem' }}>
									<div
										style={{
											display: 'block',
											fontWeight: '500',
											marginBottom: '0.5rem',
											color: '#1f2937',
										}}
									>
										Code Verifier:
									</div>
									<code
										style={{
											background: '#f3f4f6',
											padding: '0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
											wordBreak: 'break-all',
										}}
									>
										{pkceCodes.codeVerifier}
									</code>
								</div>
								<div style={{ marginBottom: '1rem' }}>
									<div
										style={{
											display: 'block',
											fontWeight: '500',
											marginBottom: '0.5rem',
											color: '#1f2937',
										}}
									>
										Code Challenge Method:
									</div>
									<code
										style={{
											background: '#f3f4f6',
											padding: '0.5rem',
											borderRadius: '0.25rem',
											fontSize: '0.875rem',
										}}
									>
										{pkceCodes.codeChallengeMethod}
									</code>
								</div>
							</div>
						) : (
							<div
								style={{
									textAlign: 'center',
									padding: '3rem',
									background: '#f8fafc',
									borderRadius: '0.75rem',
									border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
								}}
							>
								<p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
									No PKCE codes generated yet. Generate them to proceed with the PAR flow.
								</p>
								<button
									type="button"
									onClick={generatePKCE}
									style={{
										background: '#059669',
										color: 'white',
										padding: '0.75rem 1.5rem',
										borderRadius: '0.5rem',
										border: 'none',
										fontWeight: '500',
										cursor: 'pointer',
									}}
								>
									Generate PKCE Codes
								</button>
							</div>
						)}
					</div>
				);

			case 2:
				return (
					<div style={{ padding: '2rem' }}>
						<h3
							style={{
								fontSize: '1.5rem',
								fontWeight: '600',
								marginBottom: '1rem',
								color: '#1f2937',
							}}
						>
							Push Authorization Request
						</h3>
						<p style={{ marginBottom: '2rem', color: '#6b7280' }}>
							Send authorization request to PAR endpoint with all parameters.
						</p>

						<div
							style={{
								background: '#fef3c7',
								border: '1px solid V9_COLORS.PRIMARY.YELLOW',
								borderRadius: '0.5rem',
								padding: '1rem',
								marginBottom: '2rem',
							}}
						>
							<p style={{ margin: 0, color: '#d97706', fontSize: '0.875rem' }}>
								⚠️ <strong>Note:</strong> PAR functionality requires backend implementation. This is
								a demonstration of the UI flow.
							</p>
						</div>

						{/* PAR Configuration */}
						<div
							style={{
								background: '#f8fafc',
								border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
								borderRadius: '0.75rem',
								padding: '1.5rem',
								marginBottom: '2rem',
							}}
						>
							<h4
								style={{
									fontSize: '1.1rem',
									fontWeight: '600',
									marginBottom: '1rem',
									color: '#1f2937',
								}}
							>
								PAR Configuration
							</h4>
							<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
								<div style={{ marginBottom: '0.5rem' }}>
									<strong>Client ID:</strong> {controller.credentials?.clientId || 'Not configured'}
								</div>
								<div style={{ marginBottom: '0.5rem' }}>
									<strong>Redirect URI:</strong>{' '}
									{controller.credentials?.redirectUri || 'https://localhost:3000/par-callback'}
								</div>
								<div style={{ marginBottom: '0.5rem' }}>
									<strong>Scopes:</strong>{' '}
									{Array.isArray(controller.credentials?.scopes)
										? controller.credentials.scopes.join(', ')
										: controller.credentials?.scopes || 'Not configured'}
								</div>
								<div style={{ marginBottom: '0.5rem' }}>
									<strong>PKCE Code Challenge:</strong>{' '}
									{pkceCodes?.codeChallenge || 'Not generated'}
								</div>
							</div>
						</div>

						{/* Authorization Details */}
						<div>
							<h4
								style={{
									fontSize: '1.1rem',
									fontWeight: '600',
									marginBottom: '1rem',
									color: '#1f2937',
								}}
							>
								Authorization Details (Optional)
							</h4>
							<AuthorizationDetailsEditor
								authorizationDetails={authorizationDetails}
								onChange={handleAuthorizationDetailsChange}
							/>
						</div>
					</div>
				);

			case 3:
				return (
					<div style={{ padding: '2rem' }}>
						<h3
							style={{
								fontSize: '1.5rem',
								fontWeight: '600',
								marginBottom: '1rem',
								color: '#1f2937',
							}}
						>
							User Authentication
						</h3>
						<p style={{ marginBottom: '2rem', color: '#6b7280' }}>
							Complete authorization using the request_uri from PAR response.
						</p>

						<div
							style={{
								background: '#f8fafc',
								border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
								borderRadius: '0.75rem',
								padding: '1.5rem',
							}}
						>
							<h4
								style={{
									fontSize: '1.1rem',
									fontWeight: '600',
									marginBottom: '1rem',
									color: '#1f2937',
								}}
							>
								Authentication URL
							</h4>
							<p style={{ color: '#6b7280', marginBottom: '1rem' }}>
								After successful PAR request, you'll receive a request_uri to use for user
								authentication.
							</p>
							<div
								style={{
									background: '#f3f4f6',
									padding: '1rem',
									borderRadius: '0.5rem',
									fontFamily: 'monospace',
									fontSize: '0.875rem',
								}}
							>
								https://auth.pingone.com/{controller.credentials?.environmentId}/as/authorize?
								<br />
								request_uri=urn:pingone:par:request_uri:xxx
								<br />
								client_id={controller.credentials?.clientId}
							</div>
						</div>
					</div>
				);

			case 4:
				return (
					<div style={{ padding: '2rem' }}>
						<h3
							style={{
								fontSize: '1.5rem',
								fontWeight: '600',
								marginBottom: '1rem',
								color: '#1f2937',
							}}
						>
							Authorization Response
						</h3>
						<p style={{ marginBottom: '2rem', color: '#6b7280' }}>
							Handle the authorization callback and extract authorization code.
						</p>

						<div
							style={{
								background: '#f8fafc',
								border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
								borderRadius: '0.75rem',
								padding: '1.5rem',
							}}
						>
							<h4
								style={{
									fontSize: '1.1rem',
									fontWeight: '600',
									marginBottom: '1rem',
									color: '#1f2937',
								}}
							>
								Callback Parameters
							</h4>
							<p style={{ color: '#6b7280', marginBottom: '1rem' }}>
								The authorization server will redirect to your callback URL with the following
								parameters:
							</p>
							<div
								style={{
									background: '#f3f4f6',
									padding: '1rem',
									borderRadius: '0.5rem',
									fontFamily: 'monospace',
									fontSize: '0.875rem',
								}}
							>
								https://localhost:3000/par-callback?
								<br />
								code=authorization_code_here
								<br />
								state=your_state_parameter
							</div>
						</div>
					</div>
				);

			case 5:
				return (
					<div style={{ padding: '2rem' }}>
						<h3
							style={{
								fontSize: '1.5rem',
								fontWeight: '600',
								marginBottom: '1rem',
								color: '#1f2937',
							}}
						>
							Token Exchange
						</h3>
						<p style={{ marginBottom: '2rem', color: '#6b7280' }}>
							Exchange authorization code for access tokens.
						</p>

						<div
							style={{
								background: '#f8fafc',
								border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
								borderRadius: '0.75rem',
								padding: '1.5rem',
							}}
						>
							<h4
								style={{
									fontSize: '1.1rem',
									fontWeight: '600',
									marginBottom: '1rem',
									color: '#1f2937',
								}}
							>
								Token Request
							</h4>
							<p style={{ color: '#6b7280', marginBottom: '1rem' }}>
								Exchange the authorization code for tokens using the token endpoint:
							</p>
							<div
								style={{
									background: '#f3f4f6',
									padding: '1rem',
									borderRadius: '0.5rem',
									fontFamily: 'monospace',
									fontSize: '0.875rem',
								}}
							>
								POST https://auth.pingone.com/{controller.credentials?.environmentId}
								/as/oauth2/token
								<br />
								<br />
								Content-Type: application/x-www-form-urlencoded
								<br />
								<br />
								grant_type=authorization_code
								<br />
								code=authorization_code_here
								<br />
								redirect_uri=https://localhost:3000/par-callback
								<br />
								client_id={controller.credentials?.clientId}
								<br />
								code_verifier={pkceCodes?.codeVerifier}
							</div>
						</div>
					</div>
				);

			case 6:
				return (
					<div style={{ padding: '2rem' }}>
						<h3
							style={{
								fontSize: '1.5rem',
								fontWeight: '600',
								marginBottom: '1rem',
								color: '#1f2937',
							}}
						>
							Token Management
						</h3>
						<p style={{ marginBottom: '2rem', color: '#6b7280' }}>
							Introspect and manage the received tokens.
						</p>

						{controller.tokens?.accessToken ? (
							<div>
								<ColoredTokenDisplay
									accessToken={controller.tokens.accessToken}
									refreshToken={controller.tokens.refreshToken}
									idToken={controller.tokens.idToken}
									tokenType={controller.tokens.tokenType}
									expiresIn={controller.tokens.expiresIn}
									scope={controller.tokens.scope}
								/>
							</div>
						) : (
							<div
								style={{
									textAlign: 'center',
									padding: '3rem',
									background: '#f8fafc',
									borderRadius: '0.75rem',
									border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
								}}
							>
								<p style={{ color: '#6b7280' }}>
									No tokens available. Complete the token exchange step first.
								</p>
							</div>
						)}
					</div>
				);

			case 7:
				return (
					<div style={{ padding: '2rem' }}>
						<h3
							style={{
								fontSize: '1.5rem',
								fontWeight: '600',
								marginBottom: '1rem',
								color: '#1f2937',
							}}
						>
							Flow Complete
						</h3>
						<p style={{ marginBottom: '2rem', color: '#6b7280' }}>
							Review the completed PAR flow and next steps.
						</p>

						<div
							style={{
								background: '#ecfdf5',
								border: '1px solid V9_COLORS.PRIMARY.GREEN_DARK',
								borderRadius: '0.75rem',
								padding: '1.5rem',
								marginBottom: '2rem',
							}}
						>
							<h4
								style={{
									fontSize: '1.1rem',
									fontWeight: '600',
									marginBottom: '1rem',
									color: '#10b981',
								}}
							>
								✅ PAR Flow Completed Successfully
							</h4>
							<p style={{ color: '#10b981', marginBottom: '1rem' }}>
								You have successfully completed the PingOne PAR (Pushed Authorization Request) flow
								using the V9 architecture.
							</p>
							<ul style={{ color: '#10b981', paddingLeft: '1.5rem', margin: 0 }}>
								<li>✅ Credentials configured</li>
								<li>✅ PKCE codes generated</li>
								<li>✅ PAR request prepared</li>
								<li>✅ User authentication flow understood</li>
								<li>✅ Token exchange process documented</li>
								<li>✅ Token management available</li>
							</ul>
						</div>

						<div
							style={{
								background: '#f8fafc',
								border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
								borderRadius: '0.75rem',
								padding: '1.5rem',
							}}
						>
							<h4
								style={{
									fontSize: '1.1rem',
									fontWeight: '600',
									marginBottom: '1rem',
									color: '#1f2937',
								}}
							>
								Next Steps
							</h4>
							<ul style={{ color: '#6b7280', paddingLeft: '1.5rem' }}>
								<li>Implement backend PAR endpoint integration</li>
								<li>Add error handling for PAR failures</li>
								<li>Implement token refresh logic</li>
								<li>Add token revocation support</li>
								<li>Configure production PAR settings</li>
							</ul>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div style={{ minHeight: '100vh', background: '#f9fafb' }}>
			{/* Header */}
			<div
				style={{
					background: 'linear-gradient(135deg, V9_COLORS.PRIMARY.GREEN_DARK 0%, #15803d 100%)',
					color: 'white',
					padding: '2rem',
				}}
			>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<div>
						<h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>PingOne PAR Flow</h1>
						<p
							style={{
								fontSize: '1rem',
								color: 'rgba(255, 255, 255, 0.85)',
								margin: '0.5rem 0 0 0',
							}}
						>
							Pushed Authorization Request - V9 Architecture
						</p>
					</div>
					<div style={{ textAlign: 'right' }}>
						<div style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: '1' }}>
							{currentStep + 1}
						</div>
						<div
							style={{
								fontSize: '0.875rem',
								color: 'rgba(255, 255, 255, 0.75)',
								letterSpacing: '0.05em',
							}}
						>
							of {STEP_METADATA.length}
						</div>
					</div>
				</div>
			</div>

			{/* Progress Steps */}
			<div
				style={{
					padding: '2rem',
					background: 'white',
					borderBottom: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
				}}
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						maxWidth: '1200px',
						margin: '0 auto',
					}}
				>
					{STEP_METADATA.map((step, index) => (
						<button
							key={index}
							type="button"
							style={{
								flex: 1,
								textAlign: 'center',
								position: 'relative',
								cursor: 'pointer',
								background: 'none',
								border: 'none',
								padding: 0,
							}}
							onClick={() => handleStepSelect(index)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									handleStepSelect(index);
								}
							}}
						>
							<div
								style={{
									width: '2rem',
									height: '2rem',
									borderRadius: '50%',
									background: index <= currentStep ? '#059669' : '#e5e7eb',
									color: index <= currentStep ? 'white' : '#6b7280',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontWeight: '600',
									fontSize: '0.875rem',
									margin: '0 auto 0.5rem',
								}}
							>
								{index + 1}
							</div>
							<div
								style={{
									fontSize: '0.75rem',
									color: '#1f2937',
									maxWidth: '8rem',
									margin: '0 auto',
								}}
							>
								{step.title}
							</div>
						</button>
					))}
				</div>
			</div>

			{/* Main Content */}
			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
				<div
					style={{
						background: 'white',
						borderRadius: '1rem',
						boxShadow: '0 20px 40px rgba(15, 23, 42, 0.1)',
						border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
						overflow: 'hidden',
					}}
				>
					{/* Step Header */}
					<div
						style={{
							background: '#f8fafc',
							padding: '1.5rem',
							borderBottom: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
						}}
					>
						<h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
							{STEP_METADATA[currentStep].title}
						</h2>
						<p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
							{STEP_METADATA[currentStep].subtitle}
						</p>
					</div>

					{/* Step Content */}
					{renderStepContent()}

					{/* Navigation Buttons */}
					<div
						style={{
							padding: '1.5rem',
							borderTop: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
						}}
					>
						<div>
							{currentStep > 0 && (
								<button
									type="button"
									onClick={handlePreviousStep}
									style={{
										background: '#f3f4f6',
										color: '#1f2937',
										padding: '0.75rem 1.5rem',
										borderRadius: '0.5rem',
										border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
										fontWeight: '500',
										cursor: 'pointer',
									}}
								>
									Previous
								</button>
							)}
						</div>
						<div>
							<V9FlowRestartButton onRestart={handleRestartFlow} />
							{currentStep < STEP_METADATA.length - 1 && (
								<button
									type="button"
									onClick={handleNextStepWithValidation}
									style={{
										background: '#059669',
										color: 'white',
										padding: '0.75rem 1.5rem',
										borderRadius: '0.5rem',
										border: 'none',
										fontWeight: '500',
										cursor: 'pointer',
										marginLeft: '1rem',
									}}
								>
									Next
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PingOnePARFlowV9;
