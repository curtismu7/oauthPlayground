// src/pages/flows/PingOnePARFlowV9.PingUI.tsx
// V9 PingOne PAR Flow - PingOne UI with New Storage & Messaging
// Migrated from V7 with PingOne UI, unified storage, and feedback service

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthorizationDetailsEditor } from '../../components/AuthorizationDetailsEditor';
import BootstrapIcon from '../../components/BootstrapIcon';
import ColoredTokenDisplay from '../../components/ColoredTokenDisplay';
import ColoredUrlDisplay from '../../components/ColoredUrlDisplay';
import { ExpandCollapseAllControls } from '../../components/ExpandCollapseAllControls';
import { getBootstrapIconName } from '../../components/iconMapping';
import { LearningTooltip } from '../../components/LearningTooltip';
import { PingUIWrapper } from '../../components/PingUIWrapper';
import { useAuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowController';
import { useCredentialBackup } from '../../hooks/useCredentialBackup';
import { usePageScroll } from '../../hooks/usePageScroll';
import { feedbackService } from '../../services/feedback/feedbackService';
import { useSectionsViewMode } from '../../services/sectionsViewModeService';
import { unifiedStorageManager } from '../../services/unifiedStorageManager';

// V9 PAR Flow Controller Interface
interface PingOnePARFlowV9Controller {
	flowVariant: 'oauth' | 'oidc';
	setFlowVariant: (variant: 'oauth' | 'oidc') => void;
	credentials: any;
	setCredentials: (creds: any) => void;
	authCode: string;
	authorizationUrl: string;
	generateAuthorizationUrl: () => string;
	resetFlow: () => void;
	saveCredentials: () => Promise<void>;
	showSuccessFeedback: (message: string) => void;
	showInfoFeedback: (message: string) => void;
	showWarningFeedback: (message: string) => void;
	showErrorFeedback: (message: string) => void;
}

// V9 PAR Flow Component Props
interface PingOnePARFlowV9Props {
	/** Whether to show advanced configuration */
	showAdvancedConfig?: boolean;
	/** Section IDs for expand/collapse functionality */
	sectionIds?: string[];
}

// PAR Configuration interface
interface PARConfiguration {
	requestLifetime?: number;
	requireHttps?: boolean;
	requireMtls?: boolean;
}

// Authorization Detail interface
interface AuthorizationDetail {
	type: string;
	actions?: string[];
	locations?: string[];
	datatypes?: string[];
	identifier?: string;
	privileges?: string[];
}

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

const PingOnePARFlowV9: React.FC<PingOnePARFlowV9Props> = ({
	showAdvancedConfig = true,
	sectionIds = [
		'overview',
		'credentials',
		'pkce',
		'par-request',
		'auth',
		'response',
		'exchange',
		'tokens',
		'completion',
	],
}) => {
	const location = useLocation();

	// Section management with V9 service
	const { expandedStates, toggleSection, expandAll, collapseAll, areAllExpanded, areAllCollapsed } =
		useSectionsViewMode('pingone-par-flow-v9', sectionIds);

	// Core state
	const [currentStep, setCurrentStep] = useState(0);
	const [selectedVariant, setSelectedVariant] = useState<'oauth' | 'oidc'>('oidc');
	const [workerToken, setWorkerToken] = useState<string>('');
	const [pkceCodes, setPkceCodes] = useState({
		codeVerifier: '',
		codeChallenge: '',
		codeChallengeMethod: 'S256' as const,
	});

	// PAR-specific state
	const [parConfig, setParConfig] = useState<PARConfiguration>({
		requestLifetime: 600,
		requireHttps: true,
		requireMtls: false,
	});
	const [authorizationDetails, setAuthorizationDetails] = useState<AuthorizationDetail[]>([
		{
			type: 'account_information',
			actions: ['read'],
			locations: ['https://example.com/api'],
			datatypes: ['account_numbers', 'balances'],
		},
	]);
	const [parRequestUri, setParRequestUri] = useState('');
	const [tokens, setTokens] = useState<any>(null);

	// Initialize controller with V9 flow key
	const controller = useAuthorizationCodeFlowController({
		flowKey: 'pingone-par-flow-v9',
		defaultFlowVariant: selectedVariant,
	}) as PingOnePARFlowV9Controller;

	// V9: Persist flow state using unified storage
	useEffect(() => {
		const saveFlowState = async () => {
			try {
				await unifiedStorageManager.save('pingone-par-flow-v9-state', {
					selectedVariant,
					currentStep,
					pkceCodes,
					parConfig,
					authorizationDetails,
					parRequestUri,
					tokens,
					timestamp: new Date().toISOString(),
				});
			} catch (error) {
				console.error('[PingOnePARFlowV9] Failed to save flow state:', error);
				controller.showWarningFeedback('Failed to save flow state');
			}
		};

		saveFlowState();
	}, [
		selectedVariant,
		currentStep,
		pkceCodes,
		parConfig,
		authorizationDetails,
		parRequestUri,
		tokens,
		controller,
	]);

	// V9: Load flow state on mount
	useEffect(() => {
		const loadFlowState = async () => {
			try {
				const savedState = (await unifiedStorageManager.load('pingone-par-flow-v9-state')) as {
					selectedVariant?: 'oauth' | 'oidc';
					currentStep?: number;
					pkceCodes?: typeof pkceCodes;
					parConfig?: PARConfiguration;
					authorizationDetails?: AuthorizationDetail[];
					parRequestUri?: string;
					tokens?: any;
					timestamp?: string;
				};

				if (savedState) {
					console.log('🔄 [PingOnePARFlowV9] Restored flow state:', savedState);
					// Restore state if available and recent (within 1 hour)
					const stateAge = Date.now() - new Date(savedState.timestamp || '').getTime();
					if (stateAge < 3600000) {
						setSelectedVariant(savedState.selectedVariant || 'oidc');
						setCurrentStep(savedState.currentStep || 0);
						if (savedState.pkceCodes) setPkceCodes(savedState.pkceCodes);
						if (savedState.parConfig) setParConfig(savedState.parConfig);
						if (savedState.authorizationDetails)
							setAuthorizationDetails(savedState.authorizationDetails);
						setParRequestUri(savedState.parRequestUri || '');
						setTokens(savedState.tokens || null);
					}
				}
			} catch (error) {
				console.error('[PingOnePARFlowV9] Failed to load flow state:', error);
			}
		};

		loadFlowState();
	}, []);

	// Get worker token from storage
	useEffect(() => {
		const loadToken = async () => {
			try {
				const savedToken = (await unifiedStorageManager.load('worker-token')) as string;
				if (savedToken) {
					setWorkerToken(savedToken);
					console.log('[PingOnePARFlowV9] Worker token loaded from storage');
				}
			} catch (error) {
				console.error('[PingOnePARFlowV9] Failed to load worker token:', error);
			}
		};

		loadToken();
	}, []);

	// Update controller when variant changes
	useEffect(() => {
		controller.setFlowVariant(selectedVariant);
	}, [selectedVariant, controller]);

	usePageScroll({ pageName: 'PingOne PAR Flow V9 - PingOne UI', force: true });

	// V9 step validation
	const isStepValid = useCallback(
		(step: number): boolean => {
			switch (step) {
				case 0:
					return !!(controller.credentials?.environmentId && controller.credentials?.clientId);
				case 1:
					return !!(pkceCodes.codeVerifier && pkceCodes.codeChallenge);
				case 2:
					return !!parRequestUri;
				case 3:
					return !!controller.authorizationUrl;
				case 4:
					return !!controller.authCode;
				case 5:
					return !!tokens;
				default:
					return true;
			}
		},
		[controller, pkceCodes, parRequestUri, tokens]
	);

	// V9 handlers
	const handleVariantChange = useCallback(
		(variant: 'oauth' | 'oidc') => {
			setSelectedVariant(variant);
			setCurrentStep(0);
			controller.resetFlow();
			controller.showSuccessFeedback(`Switched to ${variant.toUpperCase()} PAR Flow variant`);
		},
		[controller]
	);

	const handleGeneratePKCE = useCallback(async () => {
		try {
			// Generate PKCE codes (mock implementation for demo)
			const codeVerifier = `cv_${Math.random().toString(36).substr(2, 64)}`;
			const codeChallenge = `cc_${Math.random().toString(36).substr(2, 43)}`;

			setPkceCodes({
				codeVerifier,
				codeChallenge,
				codeChallengeMethod: 'S256',
			});

			controller.showSuccessFeedback('PKCE parameters generated successfully');
			setCurrentStep(1);
		} catch (error) {
			console.error('[PingOnePARFlowV9] PKCE generation failed:', error);
			controller.showErrorFeedback('Failed to generate PKCE parameters');
		}
	}, [controller]);

	const handlePARRequest = useCallback(async () => {
		if (!controller.credentials?.environmentId || !controller.credentials?.clientId) {
			controller.showWarningFeedback('Please configure credentials first');
			return;
		}

		try {
			// Mock PAR request - generate request URI
			const requestUri = `urn:ietf:params:oauth:request_uri:${Math.random().toString(36).substr(2, 16)}`;
			setParRequestUri(requestUri);

			controller.showSuccessFeedback('PAR request sent successfully');
			setCurrentStep(2);
		} catch (error) {
			console.error('[PingOnePARFlowV9] PAR request failed:', error);
			controller.showErrorFeedback('PAR request failed');
		}
	}, [controller]);

	const handleGenerateAuthUrl = useCallback(() => {
		if (!parRequestUri) {
			controller.showWarningFeedback('Please send PAR request first');
			return;
		}

		try {
			// Generate authorization URL using request URI
			const authUrl = `https://auth.pingone.com/${controller.credentials?.environmentId}/authorize?request_uri=${parRequestUri}&client_id=${controller.credentials?.clientId}`;
			// In real implementation, this would call controller.generateAuthorizationUrl()

			controller.showSuccessFeedback('Authorization URL generated');
			setCurrentStep(3);
		} catch (error) {
			console.error('[PingOnePARFlowV9] Auth URL generation failed:', error);
			controller.showErrorFeedback('Failed to generate authorization URL');
		}
	}, [controller, parRequestUri]);

	const handleTokenExchange = useCallback(async () => {
		if (!controller.authCode) {
			controller.showWarningFeedback('No authorization code available');
			return;
		}

		try {
			// Mock token exchange
			const mockTokens = {
				access_token: `at_${Math.random().toString(36).substr(2, 64)}`,
				token_type: 'Bearer',
				expires_in: 3600,
				scope: selectedVariant === 'oidc' ? 'openid profile email' : 'api.read',
				...(selectedVariant === 'oidc' && {
					id_token: `id_${Math.random().toString(36).substr(2, 64)}`,
				}),
			};

			setTokens(mockTokens);
			controller.showSuccessFeedback('Tokens exchanged successfully');
			setCurrentStep(5);
		} catch (error) {
			console.error('[PingOnePARFlowV9] Token exchange failed:', error);
			controller.showErrorFeedback('Token exchange failed');
		}
	}, [controller, selectedVariant]);

	const handleReset = useCallback(() => {
		setCurrentStep(0);
		setPkceCodes({ codeVerifier: '', codeChallenge: '', codeChallengeMethod: 'S256' });
		setParRequestUri('');
		setTokens(null);
		controller.resetFlow();
		controller.showInfoFeedback('Flow reset successfully');
	}, [controller]);

	const handleCopy = useCallback(
		async (text: string, label: string) => {
			try {
				await navigator.clipboard.writeText(text);
				controller.showSuccessFeedback(`${label} copied to clipboard`);
			} catch (error) {
				controller.showWarningFeedback('Failed to copy to clipboard');
			}
		},
		[controller]
	);

	// V9 PAR request preview
	const parRequestPreview = useMemo(() => {
		if (!controller.credentials?.environmentId || !controller.credentials?.clientId) {
			return '';
		}

		const lines = [
			`POST https://auth.pingone.com/${controller.credentials.environmentId}/as/par`,
			'Content-Type: application/x-www-form-urlencoded',
			'',
			'response_type=code',
			`client_id=${controller.credentials.clientId}`,
			`scope=${selectedVariant === 'oidc' ? 'openid profile email' : 'api.read api.write'}`,
			`redirect_uri=${controller.credentials.redirectUri || 'https://localhost:3000/par-callback'}`,
			`state=par-v9-${selectedVariant}-[timestamp]`,
			`code_challenge=${pkceCodes.codeChallenge}`,
			'code_challenge_method=S256',
		];

		if (parConfig.requestLifetime) {
			lines.push(`request_lifetime=${parConfig.requestLifetime}`);
		}

		if (authorizationDetails.length > 0) {
			lines.push(`authorization_details=${JSON.stringify(authorizationDetails)}`);
		}

		return lines.join('\n');
	}, [controller.credentials, selectedVariant, pkceCodes, parConfig, authorizationDetails]);

	// V9 variant selector
	const renderVariantSelector = () => (
		<div className="row g-3 mb-4">
			<div className="col-12">
				<div className="d-flex gap-3 p-3 bg-light rounded-3 border">
					<button
						type="button"
						className={`btn flex-fill ${
							selectedVariant === 'oauth' ? 'btn-success' : 'btn-outline-success'
						}`}
						onClick={() => handleVariantChange('oauth')}
					>
						<BootstrapIcon icon={getBootstrapIconName('shield-check')} size={16} className="me-2" />
						<div className="text-start">
							<div className="fw-semibold">OAuth 2.0 PAR</div>
							<small className="opacity-75">Access token only - API authorization</small>
						</div>
					</button>
					<button
						type="button"
						className={`btn flex-fill ${
							selectedVariant === 'oidc' ? 'btn-primary' : 'btn-outline-primary'
						}`}
						onClick={() => handleVariantChange('oidc')}
					>
						<BootstrapIcon icon={getBootstrapIconName('person-badge')} size={16} className="me-2" />
						<div className="text-start">
							<div className="fw-semibold">OpenID Connect PAR</div>
							<small className="opacity-75">
								ID token + Access token - Authentication + Authorization
							</small>
						</div>
					</button>
				</div>
			</div>
		</div>
	);

	// V9 step content renderer
	const renderStepContent = useMemo(() => {
		switch (currentStep) {
			case 0:
				return (
					<div className="row g-3">
						<div className="col-12">
							{/* Overview */}
							<div className="card mb-4">
								<div className="card-header d-flex align-items-center justify-content-between">
									<h5 className="mb-0 d-flex align-items-center">
										<BootstrapIcon
											icon={getBootstrapIconName('info-circle')}
											size={20}
											className="me-2 text-info"
										/>
										PingOne PAR Flow Overview
									</h5>
									<button
										type="button"
										className="btn btn-sm btn-outline-secondary"
										onClick={() => toggleSection('overview')}
									>
										<BootstrapIcon
											icon={getBootstrapIconName(
												expandedStates['overview'] ? 'chevron-up' : 'chevron-down'
											)}
											size={16}
										/>
									</button>
								</div>
								{expandedStates['overview'] && (
									<div className="card-body">
										<div className="alert alert-info">
											<BootstrapIcon
												icon={getBootstrapIconName('shield-lock')}
												size={16}
												className="me-2"
											/>
											<strong>Pushed Authorization Requests (PAR)</strong> is an OAuth 2.0 security
											enhancement (RFC 9126) that addresses authorization code interception attacks
											by pushing authorization request parameters to the authorization server before
											redirecting the user.
										</div>

										<div className="row g-3 mt-3">
											<div className="col-md-6">
												<div className="card h-100 border-danger">
													<div className="card-body">
														<h6 className="card-title d-flex align-items-center">
															<BootstrapIcon
																icon={getBootstrapIconName('exclamation-triangle')}
																size={18}
																className="me-2 text-danger"
															/>
															Security Problem Solved
														</h6>
														<p className="card-text small">
															PAR prevents authorization code interception attacks by keeping
															sensitive parameters server-side instead of in the browser URL.
														</p>
													</div>
												</div>
											</div>
											<div className="col-md-6">
												<div className="card h-100 border-success">
													<div className="card-body">
														<h6 className="card-title d-flex align-items-center">
															<BootstrapIcon
																icon={getBootstrapIconName('check-circle')}
																size={18}
																className="me-2 text-success"
															/>
															PingOne Implementation
														</h6>
														<p className="card-text small">
															PingOne provides full PAR support with advanced security features,
															Rich Authorization Requests (RAR), and seamless integration.
														</p>
													</div>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Variant Selector */}
							{renderVariantSelector()}

							{/* Credentials */}
							<div className="card">
								<div className="card-header">
									<h5 className="mb-0 d-flex align-items-center">
										<BootstrapIcon
											icon={getBootstrapIconName('key')}
											size={20}
											className="me-2 text-warning"
										/>
										Credentials Configuration
									</h5>
								</div>
								<div className="card-body">
									<div className="alert alert-warning">
										<BootstrapIcon
											icon={getBootstrapIconName('info-circle')}
											size={16}
											className="me-2"
										/>
										Configure your PingOne environment and application credentials for PAR flow.
									</div>

									<div className="row g-3">
										<div className="col-md-6">
											<label className="form-label">Environment ID *</label>
											<input
												type="text"
												className="form-control"
												value={controller.credentials?.environmentId || ''}
												onChange={(e) =>
													controller.setCredentials({
														...controller.credentials,
														environmentId: e.target.value,
													})
												}
												placeholder="your-environment-id"
											/>
										</div>
										<div className="col-md-6">
											<label className="form-label">Client ID *</label>
											<input
												type="text"
												className="form-control"
												value={controller.credentials?.clientId || ''}
												onChange={(e) =>
													controller.setCredentials({
														...controller.credentials,
														clientId: e.target.value,
													})
												}
												placeholder="your-client-id"
											/>
										</div>
										<div className="col-md-6">
											<label className="form-label">Client Secret</label>
											<input
												type="password"
												className="form-control"
												value={controller.credentials?.clientSecret || ''}
												onChange={(e) =>
													controller.setCredentials({
														...controller.credentials,
														clientSecret: e.target.value,
													})
												}
												placeholder="your-client-secret"
											/>
										</div>
										<div className="col-md-6">
											<label className="form-label">Redirect URI</label>
											<input
												type="url"
												className="form-control"
												value={
													controller.credentials?.redirectUri ||
													'https://localhost:3000/par-callback'
												}
												onChange={(e) =>
													controller.setCredentials({
														...controller.credentials,
														redirectUri: e.target.value,
													})
												}
												placeholder="https://your-app.com/callback"
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				);

			case 1:
				return (
					<div className="row g-3">
						<div className="col-12">
							<div className="card">
								<div className="card-header">
									<h5 className="mb-0 d-flex align-items-center">
										<BootstrapIcon
											icon={getBootstrapIconName('cpu')}
											size={20}
											className="me-2 text-success"
										/>
										PKCE Generation
									</h5>
								</div>
								<div className="card-body">
									<div className="alert alert-info">
										<BootstrapIcon
											icon={getBootstrapIconName('shield-check')}
											size={16}
											className="me-2"
										/>
										Generate secure PKCE (Proof Key for Code Exchange) parameters for enhanced
										security in the PAR flow.
									</div>

									{pkceCodes.codeVerifier && (
										<div className="row g-3">
											<div className="col-12">
												<div className="border rounded p-3 bg-light">
													<h6 className="mb-2">Generated PKCE Parameters</h6>
													<div className="row g-2">
														<div className="col-md-6">
															<small className="text-muted d-block">Code Verifier</small>
															<code className="d-block text-break small">
																{pkceCodes.codeVerifier}
															</code>
														</div>
														<div className="col-md-6">
															<small className="text-muted d-block">Code Challenge</small>
															<code className="d-block text-break small">
																{pkceCodes.codeChallenge}
															</code>
														</div>
													</div>
												</div>
											</div>
										</div>
									)}

									<div className="d-flex gap-2 mt-3">
										<button
											type="button"
											className="btn btn-success"
											onClick={handleGeneratePKCE}
											disabled={!!pkceCodes.codeVerifier}
										>
											<BootstrapIcon
												icon={getBootstrapIconName('cpu')}
												size={16}
												className="me-2"
											/>
											{pkceCodes.codeVerifier ? 'PKCE Generated' : 'Generate PKCE'}
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				);

			default:
				return (
					<div className="alert alert-secondary">
						<BootstrapIcon icon={getBootstrapIconName('info-circle')} size={16} className="me-2" />
						PingOne PAR Flow V9 - Step {currentStep + 1} content will be implemented here
					</div>
				);
		}
	}, [
		currentStep,
		expandedStates,
		selectedVariant,
		controller.credentials,
		pkceCodes,
		toggleSection,
		handleVariantChange,
		handleGeneratePKCE,
	]);

	return (
		<PingUIWrapper>
			<div className="container-fluid py-4">
				{/* V9 Header */}
				<div className="row mb-4">
					<div className="col-12">
						<div className="d-flex align-items-center justify-content-between">
							<div>
								<h1 className="h2 mb-2 d-flex align-items-center">
									<BootstrapIcon
										icon={getBootstrapIconName('send-check')}
										size={28}
										className="me-3 text-primary"
									/>
									PingOne PAR Flow V9
									<span className="badge bg-success ms-2">PingOne UI</span>
								</h1>
								<p className="text-muted mb-0">
									Pushed Authorization Requests with PingOne UI and enhanced security
								</p>
							</div>
							<div className="d-flex gap-2">
								<ExpandCollapseAllControls
									pageKey="pingone-par-flow-v9"
									sectionIds={sectionIds}
									allExpanded={areAllExpanded()}
									allCollapsed={areAllCollapsed()}
									onExpandAll={expandAll}
									onCollapseAll={collapseAll}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* V9 Step Indicator */}
				<div className="row mb-4">
					<div className="col-12">
						<div className="d-flex justify-content-center">
							<nav aria-label="PingOne PAR flow steps">
								<ul className="pagination pagination-lg">
									{STEP_METADATA.map((step, index) => (
										<li
											key={step.title}
											className={`page-item ${currentStep === index ? 'active' : ''} ${isStepValid(index) ? '' : 'disabled'}`}
										>
											<button
												type="button"
												className="page-link"
												onClick={() => isStepValid(index) && setCurrentStep(index)}
												disabled={!isStepValid(index)}
											>
												{index + 1}. {step.title.split(' ')[0]}
											</button>
										</li>
									))}
								</ul>
							</nav>
						</div>
					</div>
				</div>

				{/* PAR Request Preview */}
				{parRequestPreview && (
					<div className="row mb-4">
						<div className="col-12">
							<div className="card">
								<div className="card-header d-flex align-items-center justify-content-between">
									<h5 className="mb-0 d-flex align-items-center">
										<BootstrapIcon
											icon={getBootstrapIconName('code-slash')}
											size={20}
											className="me-2 text-info"
										/>
										PAR Request Preview
									</h5>
									<button
										type="button"
										className="btn btn-sm btn-outline-secondary"
										onClick={() => handleCopy(parRequestPreview, 'PAR Request')}
									>
										<BootstrapIcon
											icon={getBootstrapIconName('clipboard')}
											size={16}
											className="me-1"
										/>
										Copy
									</button>
								</div>
								<div className="card-body">
									<pre className="bg-dark text-light p-3 rounded small">
										<code>{parRequestPreview}</code>
									</pre>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Tokens Display */}
				{tokens && (
					<div className="row mb-4">
						<div className="col-12">
							<div className="card">
								<div className="card-header">
									<h5 className="mb-0 d-flex align-items-center">
										<BootstrapIcon
											icon={getBootstrapIconName('key')}
											size={20}
											className="me-2 text-success"
										/>
										Received Tokens
									</h5>
								</div>
								<div className="card-body">
									<pre className="bg-light p-3 rounded">
										<code>{JSON.stringify(tokens, null, 2)}</code>
									</pre>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* V9 Step Content */}
				<div className="row">
					<div className="col-12">{renderStepContent}</div>
				</div>

				{/* V9 Action Buttons */}
				<div className="row mt-4">
					<div className="col-12">
						<div className="d-flex justify-content-between">
							<button
								type="button"
								className="btn btn-outline-secondary"
								onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
								disabled={currentStep === 0}
							>
								<BootstrapIcon
									icon={getBootstrapIconName('chevron-left')}
									size={16}
									className="me-1"
								/>
								Previous
							</button>

							<div className="d-flex gap-2">
								{currentStep === 1 && !pkceCodes.codeVerifier && (
									<button type="button" className="btn btn-success" onClick={handleGeneratePKCE}>
										<BootstrapIcon icon={getBootstrapIconName('cpu')} size={16} className="me-2" />
										Generate PKCE
									</button>
								)}

								{currentStep === 2 && !parRequestUri && (
									<button type="button" className="btn btn-primary" onClick={handlePARRequest}>
										<BootstrapIcon icon={getBootstrapIconName('send')} size={16} className="me-2" />
										Send PAR Request
									</button>
								)}

								{currentStep === 3 && !controller.authorizationUrl && (
									<button type="button" className="btn btn-primary" onClick={handleGenerateAuthUrl}>
										<BootstrapIcon icon={getBootstrapIconName('link')} size={16} className="me-2" />
										Generate Auth URL
									</button>
								)}

								{currentStep === 4 && controller.authCode && !tokens && (
									<button type="button" className="btn btn-success" onClick={handleTokenExchange}>
										<BootstrapIcon
											icon={getBootstrapIconName('arrow-left-right')}
											size={16}
											className="me-2"
										/>
										Exchange Tokens
									</button>
								)}

								<button type="button" className="btn btn-outline-danger" onClick={handleReset}>
									<BootstrapIcon
										icon={getBootstrapIconName('arrow-clockwise')}
										size={16}
										className="me-1"
									/>
									Reset Flow
								</button>
							</div>

							<button
								type="button"
								className="btn btn-primary"
								onClick={() => setCurrentStep(Math.min(STEP_METADATA.length - 1, currentStep + 1))}
								disabled={!isStepValid(currentStep) || currentStep === STEP_METADATA.length - 1}
							>
								Next
								<BootstrapIcon
									icon={getBootstrapIconName('chevron-right')}
									size={16}
									className="ms-1"
								/>
							</button>
						</div>
					</div>
				</div>

				{/* V9 Footer */}
				<div className="row mt-4">
					<div className="col-12">
						<div className="text-center">
							<div className="d-flex justify-content-center gap-2 mb-2">
								<span className="badge bg-secondary">V9.3.6</span>
								<span className="badge bg-info">PingOne PAR</span>
								<span className="badge bg-warning">RFC 9126</span>
							</div>
							<p className="text-muted small mb-0">
								Enhanced with PingOne UI • Unified Storage • Contextual Messaging
							</p>
						</div>
					</div>
				</div>
			</div>
		</PingUIWrapper>
	);
};

export default PingOnePARFlowV9;
