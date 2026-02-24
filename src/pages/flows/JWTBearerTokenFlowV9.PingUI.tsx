// src/pages/flows/JWTBearerTokenFlowV9.PingUI.tsx
// V9 JWT Bearer Token Flow - PingOne UI with New Storage & Messaging
// Migrated from V7 with PingOne UI, unified storage, and feedback service

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import BootstrapIcon from '../../components/BootstrapIcon';
import { ExpandCollapseAllControls } from '../../components/ExpandCollapseAllControls';
import { getBootstrapIconName } from '../../components/iconMapping';
import { LearningTooltip } from '../../components/LearningTooltip';
import { PingUIWrapper } from '../../components/PingUIWrapper';
import { useCredentialBackup } from '../../hooks/useCredentialBackup';
import { usePageScroll } from '../../hooks/usePageScroll';
import { feedbackService } from '../../services/feedback/feedbackService';
import { useSectionsViewMode } from '../../services/sectionsViewModeService';
import { unifiedStorageManager } from '../../services/unifiedStorageManager';

// V9 JWT Bearer Flow Controller Interface
interface JWTBearerFlowV9Controller {
	credentials: any;
	setCredentials: (creds: any) => void;
	saveCredentials: () => Promise<void>;
	showSuccessFeedback: (message: string) => void;
	showInfoFeedback: (message: string) => void;
	showWarningFeedback: (message: string) => void;
	showErrorFeedback: (message: string) => void;
}

// V9 JWT Bearer Flow Component Props
interface JWTBearerFlowV9Props {
	/** Whether to show advanced configuration */
	showAdvancedConfig?: boolean;
	/** Section IDs for expand/collapse functionality */
	sectionIds?: string[];
}

// JWT Claims interface
interface JWTClaims {
	iss: string;
	sub: string;
	aud: string;
	iat: number;
	exp: number;
	jti: string;
	[key: string]: any;
}

// JWT Signature interface
interface JWTSignature {
	algorithm: 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512';
	privateKey: string;
	publicKey?: string;
}

const JWTBearerTokenFlowV9: React.FC<JWTBearerFlowV9Props> = ({
	showAdvancedConfig = false,
	sectionIds = [
		'overview',
		'credentials',
		'jwt-builder',
		'jwt-display',
		'token-request',
		'token-response',
	],
}) => {
	const location = useLocation();

	// Section management with V9 service
	const { expandedStates, toggleSection, expandAll, collapseAll, areAllExpanded, areAllCollapsed } =
		useSectionsViewMode('jwt-bearer-flow-v9', sectionIds);

	// Core state
	const [currentStep, setCurrentStep] = useState(0);
	const [workerToken, setWorkerToken] = useState<string>('');

	// Configuration state
	const [environmentId, setEnvironmentId] = useState('');
	const [clientId, setClientId] = useState('');
	const [tokenEndpoint, setTokenEndpoint] = useState('https://auth.pingone.com/as/token');
	const [audience, setAudience] = useState('https://auth.pingone.com/as/token');
	const [scopes, setScopes] = useState('openid');

	// JWT state
	const [jwtClaims, setJwtClaims] = useState<JWTClaims>({
		iss: 'https://auth.pingone.com',
		sub: '',
		aud: 'https://auth.pingone.com/as/token',
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + 3600,
		jti: `jwt-${Math.random().toString(36).substr(2, 9)}`,
	});

	const [jwtSignature, setJwtSignature] = useState<JWTSignature>({
		algorithm: 'RS256',
		privateKey: '',
		publicKey: '',
	});

	const [generatedJWT, setGeneratedJWT] = useState('');
	const [tokenResponse, setTokenResponse] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Initialize controller with V9 flow key
	const controller = {
		credentials: { environmentId, clientId, scopes },
		setCredentials: (creds: any) => {
			if (creds.environmentId) setEnvironmentId(creds.environmentId);
			if (creds.clientId) setClientId(creds.clientId);
			if (creds.scopes) setScopes(creds.scopes);
		},
		saveCredentials: async () => {
			try {
				await unifiedStorageManager.save('jwt-bearer-flow-v9-credentials', {
					environmentId,
					clientId,
					tokenEndpoint,
					audience,
					scopes,
					lastUpdated: new Date().toISOString(),
				});
				controller.showSuccessFeedback('Credentials saved successfully');
			} catch (error) {
				console.error('[JWTBearerFlowV9] Failed to save credentials:', error);
				controller.showErrorFeedback('Failed to save credentials');
			}
		},
		showSuccessFeedback: (message: string) =>
			feedbackService.showSnackbar({
				type: 'success',
				message,
				duration: 4000,
			}),
		showInfoFeedback: (message: string) =>
			feedbackService.showSnackbar({
				type: 'info',
				message,
				duration: 3000,
			}),
		showWarningFeedback: (message: string) =>
			feedbackService.showSnackbar({
				type: 'warning',
				message,
				duration: 3000,
			}),
		showErrorFeedback: (message: string) =>
			feedbackService.showSnackbar({
				type: 'error',
				message,
				duration: 5000,
			}),
	} as JWTBearerFlowV9Controller;

	// V9: Persist flow state using unified storage
	useEffect(() => {
		const saveFlowState = async () => {
			try {
				await unifiedStorageManager.save('jwt-bearer-flow-v9-state', {
					currentStep,
					environmentId,
					clientId,
					tokenEndpoint,
					audience,
					scopes,
					jwtClaims,
					jwtSignature,
					generatedJWT,
					tokenResponse,
					timestamp: new Date().toISOString(),
				});
			} catch (error) {
				console.error('[JWTBearerFlowV9] Failed to save flow state:', error);
			}
		};

		saveFlowState();
	}, [
		currentStep,
		environmentId,
		clientId,
		tokenEndpoint,
		audience,
		scopes,
		jwtClaims,
		jwtSignature,
		generatedJWT,
		tokenResponse,
	]);

	// V9: Load flow state on mount
	useEffect(() => {
		const loadFlowState = async () => {
			try {
				const savedState = (await unifiedStorageManager.load('jwt-bearer-flow-v9-state')) as {
					currentStep?: number;
					environmentId?: string;
					clientId?: string;
					tokenEndpoint?: string;
					audience?: string;
					scopes?: string;
					jwtClaims?: JWTClaims;
					jwtSignature?: JWTSignature;
					generatedJWT?: string;
					tokenResponse?: any;
					timestamp?: string;
				};

				if (savedState) {
					console.log('🔄 [JWTBearerFlowV9] Restored flow state:', savedState);
					// Restore state if available and recent (within 1 hour)
					const stateAge = Date.now() - new Date(savedState.timestamp || '').getTime();
					if (stateAge < 3600000) {
						setCurrentStep(savedState.currentStep || 0);
						setEnvironmentId(savedState.environmentId || '');
						setClientId(savedState.clientId || '');
						setTokenEndpoint(savedState.tokenEndpoint || 'https://auth.pingone.com/as/token');
						setAudience(savedState.audience || 'https://auth.pingone.com/as/token');
						setScopes(savedState.scopes || 'openid');
						if (savedState.jwtClaims) setJwtClaims(savedState.jwtClaims);
						if (savedState.jwtSignature) setJwtSignature(savedState.jwtSignature);
						setGeneratedJWT(savedState.generatedJWT || '');
						setTokenResponse(savedState.tokenResponse || null);
					}
				}
			} catch (error) {
				console.error('[JWTBearerFlowV9] Failed to load flow state:', error);
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
					console.log('[JWTBearerFlowV9] Worker token loaded from storage');
				}
			} catch (error) {
				console.error('[JWTBearerFlowV9] Failed to load worker token:', error);
			}
		};

		loadToken();
	}, []);

	// Update JWT claims when client data changes
	useEffect(() => {
		setJwtClaims((prev) => ({
			...prev,
			sub: clientId || prev.sub,
			aud: audience || tokenEndpoint || prev.aud,
		}));
	}, [clientId, tokenEndpoint, audience]);

	usePageScroll({ pageName: 'JWT Bearer Token Flow V9 - PingOne UI', force: true });

	// V9 step validation
	const isStepValid = useCallback(
		(step: number): boolean => {
			switch (step) {
				case 0:
					return !!(environmentId && clientId);
				case 1:
					return !!generatedJWT;
				case 2:
					return !!generatedJWT;
				case 3:
					return !!tokenResponse;
				case 4:
					return !!tokenResponse;
				default:
					return true;
			}
		},
		[environmentId, clientId, generatedJWT, tokenResponse]
	);

	// V9 handlers
	const handleEnvironmentIdChange = useCallback((value: string) => {
		setEnvironmentId(value);
	}, []);

	const handleClientIdChange = useCallback((value: string) => {
		setClientId(value);
	}, []);

	const handleTokenEndpointChange = useCallback((value: string) => {
		setTokenEndpoint(value);
	}, []);

	const handleAudienceChange = useCallback((value: string) => {
		setAudience(value);
	}, []);

	const handleScopesChange = useCallback((value: string) => {
		setScopes(value);
	}, []);

	const handleGenerateJWTId = useCallback(() => {
		const jti = `jwt_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
		setJwtClaims((prev) => ({ ...prev, jti }));
	}, []);

	const handleDiscoverAudience = useCallback(async () => {
		if (!environmentId.trim()) {
			controller.showWarningFeedback('Please enter an Environment ID first');
			return;
		}

		try {
			// Mock OIDC discovery for demonstration
			const issuerUrl = `https://auth.pingone.com/${environmentId}/as`;
			setAudience(issuerUrl);
			setJwtClaims((prev) => ({ ...prev, aud: issuerUrl }));
			controller.showSuccessFeedback('Audience discovered and populated');
		} catch (error) {
			console.error('[JWTBearerFlowV9] Failed to discover audience:', error);
			controller.showErrorFeedback('Failed to discover audience');
		}
	}, [environmentId, controller]);

	const handleGenerateSampleKeys = useCallback(() => {
		// Sample RSA keys for educational purposes
		const samplePrivateKey = `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADAN...-----END PRIVATE KEY-----`;
		const samplePublicKey = `-----BEGIN PUBLIC KEY-----\nMIIBIjAN...-----END PUBLIC KEY-----`;

		setJwtSignature((prev) => ({
			...prev,
			privateKey: samplePrivateKey,
			publicKey: samplePublicKey,
		}));

		controller.showSuccessFeedback('Sample RSA key pair generated (educational purposes only)');
	}, [controller]);

	const handleGenerateJWT = useCallback(() => {
		const missing: string[] = [];

		if (!clientId) missing.push('Client ID');
		if (!tokenEndpoint) missing.push('Token Endpoint');
		if (!audience) missing.push('Audience');
		if (!jwtSignature.privateKey) missing.push('Private Key');

		if (missing.length > 0) {
			controller.showWarningFeedback(`Missing required fields: ${missing.join(', ')}`);
			return;
		}

		try {
			// Update claims with current values
			const claims: JWTClaims = {
				...jwtClaims,
				iss: clientId,
				sub: clientId,
				aud: audience,
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 3600,
			};

			// Mock JWT generation for educational purposes
			const header = { alg: jwtSignature.algorithm, typ: 'JWT' };
			const encodedHeader = btoa(JSON.stringify(header));
			const encodedPayload = btoa(JSON.stringify(claims));
			const signature = `mock_signature_${Date.now()}`;
			const encodedSignature = btoa(signature);

			const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
			setGeneratedJWT(jwt);

			controller.showSuccessFeedback('JWT generated successfully');
			setCurrentStep(2);
		} catch (error) {
			console.error('[JWTBearerFlowV9] Failed to generate JWT:', error);
			controller.showErrorFeedback('Failed to generate JWT');
		}
	}, [clientId, tokenEndpoint, audience, jwtClaims, jwtSignature, controller]);

	const handleMakeTokenRequest = useCallback(async () => {
		if (!generatedJWT) {
			controller.showWarningFeedback('Please generate a JWT first');
			return;
		}

		setIsLoading(true);
		try {
			// Simulate token request delay
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Mock token response for educational purposes
			const mockTokenResponse = {
				access_token: `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.mock_payload.mock_signature_${Date.now()}`,
				token_type: 'Bearer',
				expires_in: 3600,
				scope: scopes,
				_mock: true,
				_note: 'Mock JWT Bearer access token for educational purposes',
			};

			setTokenResponse(mockTokenResponse);
			setCurrentStep(3);
			controller.showSuccessFeedback('Mock token request completed (educational simulation)');
		} catch (error) {
			console.error('[JWTBearerFlowV9] Token request failed:', error);
			controller.showErrorFeedback('Token request failed');
		} finally {
			setIsLoading(false);
		}
	}, [generatedJWT, scopes, controller]);

	const handleReset = useCallback(() => {
		setCurrentStep(0);
		setGeneratedJWT('');
		setTokenResponse(null);
		setIsLoading(false);
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
											icon={getBootstrapIconName('shield-check')}
											size={20}
											className="me-2 text-info"
										/>
										JWT Bearer Flow Overview
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
												icon={getBootstrapIconName('info-circle')}
												size={16}
												className="me-2"
											/>
											<strong>JWT Bearer Token Flow (RFC 7523)</strong> enables OAuth clients to
											authenticate using JWT assertions instead of traditional client credentials.
											Perfect for server-to-server scenarios.
										</div>
										<div className="alert alert-warning">
											<BootstrapIcon
												icon={getBootstrapIconName('exclamation-triangle')}
												size={16}
												className="me-2"
											/>
											<strong>Educational Mock Implementation:</strong> This is a simulated
											implementation for learning purposes. PingOne does not currently support JWT
											Bearer assertions.
										</div>
									</div>
								)}
							</div>

							{/* Configuration */}
							<div className="card">
								<div className="card-header d-flex align-items-center justify-content-between">
									<h5 className="mb-0 d-flex align-items-center">
										<BootstrapIcon
											icon={getBootstrapIconName('gear')}
											size={20}
											className="me-2 text-primary"
										/>
										JWT Bearer Configuration
									</h5>
									<button
										type="button"
										className="btn btn-sm btn-outline-secondary"
										onClick={() => toggleSection('credentials')}
									>
										<BootstrapIcon
											icon={getBootstrapIconName(
												expandedStates['credentials'] ? 'chevron-up' : 'chevron-down'
											)}
											size={16}
										/>
									</button>
								</div>
								{expandedStates['credentials'] && (
									<div className="card-body">
										<div className="row g-3">
											<div className="col-md-6">
												<label className="form-label">Environment ID *</label>
												<input
													type="text"
													className="form-control"
													value={environmentId}
													onChange={(e) => handleEnvironmentIdChange(e.target.value)}
													placeholder="your-environment-id"
												/>
											</div>
											<div className="col-md-6">
												<label className="form-label">Client ID *</label>
												<input
													type="text"
													className="form-control"
													value={clientId}
													onChange={(e) => handleClientIdChange(e.target.value)}
													placeholder="your-client-id"
												/>
											</div>
											<div className="col-md-6">
												<label className="form-label">Token Endpoint *</label>
												<input
													type="url"
													className="form-control"
													value={tokenEndpoint}
													onChange={(e) => handleTokenEndpointChange(e.target.value)}
													placeholder="https://auth.example.com/oauth/token"
												/>
											</div>
											<div className="col-md-6">
												<label className="form-label">Audience</label>
												<div className="input-group">
													<input
														type="text"
														className="form-control"
														value={audience}
														onChange={(e) => handleAudienceChange(e.target.value)}
														placeholder="https://api.example.com"
													/>
													<button
														type="button"
														className="btn btn-outline-secondary"
														onClick={handleDiscoverAudience}
														disabled={!environmentId}
													>
														<BootstrapIcon icon={getBootstrapIconName('search')} size={16} />
													</button>
												</div>
											</div>
											<div className="col-12">
												<label className="form-label">Scopes</label>
												<input
													type="text"
													className="form-control"
													value={scopes}
													onChange={(e) => handleScopesChange(e.target.value)}
													placeholder="openid profile email"
												/>
											</div>
										</div>
									</div>
								)}
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
											icon={getBootstrapIconName('file-earmark-code')}
											size={20}
											className="me-2 text-success"
										/>
										JWT Generation
									</h5>
								</div>
								<div className="card-body">
									<div className="alert alert-info">
										<BootstrapIcon
											icon={getBootstrapIconName('info-circle')}
											size={16}
											className="me-2"
										/>
										Configure JWT claims and signature algorithm. The JWT will be used as a client
										assertion in the token request.
									</div>

									<div className="row g-3">
										<div className="col-md-6">
											<label className="form-label">Issuer (iss) *</label>
											<input
												type="text"
												className="form-control"
												value={jwtClaims.iss}
												onChange={(e) => setJwtClaims((prev) => ({ ...prev, iss: e.target.value }))}
												placeholder="https://auth.pingone.com"
											/>
											<div className="form-text">Should be the authorization server URL</div>
										</div>
										<div className="col-md-6">
											<label className="form-label">Subject (sub) *</label>
											<input
												type="text"
												className="form-control"
												value={jwtClaims.sub}
												onChange={(e) => setJwtClaims((prev) => ({ ...prev, sub: e.target.value }))}
												placeholder="your-client-id"
											/>
										</div>
										<div className="col-12">
											<label className="form-label">Private Key *</label>
											<textarea
												className="form-control"
												rows={4}
												value={jwtSignature.privateKey}
												onChange={(e) =>
													setJwtSignature((prev) => ({ ...prev, privateKey: e.target.value }))
												}
												placeholder="-----BEGIN PRIVATE KEY-----..."
											/>
											<div className="d-flex gap-2 mt-2">
												<button
													type="button"
													className="btn btn-sm btn-outline-primary"
													onClick={handleGenerateSampleKeys}
												>
													<BootstrapIcon
														icon={getBootstrapIconName('key')}
														size={16}
														className="me-1"
													/>
													Generate Sample Keys
												</button>
												<button
													type="button"
													className="btn btn-sm btn-outline-secondary"
													onClick={handleGenerateJWTId}
												>
													<BootstrapIcon
														icon={getBootstrapIconName('arrow-clockwise')}
														size={16}
														className="me-1"
													/>
													New JWT ID
												</button>
											</div>
										</div>
									</div>

									<div className="d-flex gap-2 mt-3">
										<button
											type="button"
											className="btn btn-success"
											onClick={handleGenerateJWT}
											disabled={!jwtSignature.privateKey}
										>
											<BootstrapIcon
												icon={getBootstrapIconName('cpu')}
												size={16}
												className="me-2"
											/>
											Generate JWT
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
						JWT Bearer Flow V9 - Step {currentStep + 1} content will be implemented here
					</div>
				);
		}
	}, [
		currentStep,
		expandedStates,
		environmentId,
		clientId,
		tokenEndpoint,
		audience,
		scopes,
		jwtClaims,
		jwtSignature,
		generatedJWT,
		tokenResponse,
		isLoading,
		toggleSection,
		handleEnvironmentIdChange,
		handleClientIdChange,
		handleTokenEndpointChange,
		handleAudienceChange,
		handleScopesChange,
		handleDiscoverAudience,
		handleGenerateJWTId,
		handleGenerateSampleKeys,
		handleGenerateJWT,
		handleMakeTokenRequest,
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
										icon={getBootstrapIconName('file-earmark-binary')}
										size={28}
										className="me-3 text-warning"
									/>
									JWT Bearer Token Flow V9
									<span className="badge bg-success ms-2">PingOne UI</span>
								</h1>
								<p className="text-muted mb-0">JWT Bearer Token Flow (RFC 7523) with PingOne UI</p>
							</div>
							<div className="d-flex gap-2">
								<ExpandCollapseAllControls
									pageKey="jwt-bearer-flow-v9"
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
							<nav aria-label="JWT Bearer flow steps">
								<ul className="pagination pagination-lg">
									{['Setup', 'JWT Gen', 'Request', 'Tokens'].map((step, index) => (
										<li
											key={step}
											className={`page-item ${currentStep === index ? 'active' : ''} ${isStepValid(index) ? '' : 'disabled'}`}
										>
											<button
												type="button"
												className="page-link"
												onClick={() => isStepValid(index) && setCurrentStep(index)}
												disabled={!isStepValid(index)}
											>
												{index + 1}. {step}
											</button>
										</li>
									))}
								</ul>
							</nav>
						</div>
					</div>
				</div>

				{/* Generated JWT Display */}
				{generatedJWT && (
					<div className="row mb-4">
						<div className="col-12">
							<div className="card">
								<div className="card-header d-flex align-items-center justify-content-between">
									<h5 className="mb-0 d-flex align-items-center">
										<BootstrapIcon
											icon={getBootstrapIconName('file-earmark-code')}
											size={20}
											className="me-2 text-success"
										/>
										Generated JWT
									</h5>
									<button
										type="button"
										className="btn btn-sm btn-outline-secondary"
										onClick={() => handleCopy(generatedJWT, 'JWT')}
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
									<code className="text-break">{generatedJWT}</code>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Token Response Display */}
				{tokenResponse && (
					<div className="row mb-4">
						<div className="col-12">
							<div className="card">
								<div className="card-header">
									<h5 className="mb-0 d-flex align-items-center">
										<BootstrapIcon
											icon={getBootstrapIconName('check-circle')}
											size={20}
											className="me-2 text-success"
										/>
										Token Response
									</h5>
								</div>
								<div className="card-body">
									<pre className="bg-light p-3 rounded">
										<code>{JSON.stringify(tokenResponse, null, 2)}</code>
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
								{currentStep === 2 && !tokenResponse && (
									<button
										type="button"
										className="btn btn-primary"
										onClick={handleMakeTokenRequest}
										disabled={isLoading}
									>
										{isLoading ? (
											<>
												<BootstrapIcon
													icon={getBootstrapIconName('arrow-repeat')}
													size={16}
													className="me-2 spinning"
												/>
												Requesting Token...
											</>
										) : (
											<>
												<BootstrapIcon
													icon={getBootstrapIconName('send')}
													size={16}
													className="me-2"
												/>
												Make Token Request
											</>
										)}
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
								onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
								disabled={!isStepValid(currentStep) || currentStep === 3}
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
								<span className="badge bg-info">JWT Bearer</span>
								<span className="badge bg-warning">RFC 7523</span>
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

export default JWTBearerTokenFlowV9;
