// src/pages/flows/v9/JWTBearerTokenFlowV9.tsx
// OAuth 2.0 JWT Bearer Token Flow (RFC 7523) - V9 Service Architecture

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { MockApiCallDisplay } from '../../../components/MockApiCallDisplay';
import { modernMessaging } from '../../../components/v9/V9ModernMessagingComponents';
import UnifiedTokenDisplayService from '../../../services/unifiedTokenDisplayService';
import { V9CredentialStorageService } from '../../../services/v9/V9CredentialStorageService';
import { V9FlowRestartButton } from '../../../services/v9/V9FlowRestartButton';
import { V9ModernMessagingService } from '../../../services/v9/V9ModernMessagingService';
import V9FlowHeader from '../../../services/v9/v9FlowHeaderService';
import { V7MMockBanner } from '../../../v7/components/V7MMockBanner';
import type { DiscoveredApp } from '../../../v8/components/AppPickerV8';
import { CompactAppPickerV8U } from '../../../v8u/components/CompactAppPickerV8U';

// Built-in copy function to replace CopyButtonService
const copyToClipboard = async (text: string): Promise<void> => {
	try {
		await navigator.clipboard.writeText(text);
		modernMessaging.showBanner({
			type: 'success',
			title: 'Copied',
			message: 'Copied to clipboard!',
			dismissible: true,
		});
	} catch (_err) {
		modernMessaging.showCriticalError({
			title: 'Copy Failed',
			message: 'Failed to copy to clipboard',
			contactSupport: false,
		});
	}
};

/**
 * Utility function to mask tokens for security
 * Shows first 8 characters, masks middle, shows last 4 characters
 */
const _maskToken = (token: string): string => {
	if (!token || token.length <= 12) {
		return '••••••••';
	}
	return `${token.slice(0, 8)}...${token.slice(-4)}`;
};

/** Build a real-looking JWT (header.payload.signature) for mock token response so decode works. */
function buildMockAccessTokenJWT(claims: {
	iss: string;
	sub: string;
	aud: string;
	scope?: string;
	client_id?: string;
}): string {
	const header = { alg: 'RS256', typ: 'JWT', kid: 'mock-kid' };
	const now = Math.floor(Date.now() / 1000);
	const payload = {
		iss: claims.iss,
		sub: claims.sub,
		aud: claims.aud,
		iat: now,
		exp: now + 3600,
		scope: claims.scope ?? 'openid profile',
		client_id: claims.client_id ?? claims.sub,
		jti: `mock-${Math.random().toString(36).substring(2, 15)}`,
	};
	const b64url = (obj: object) =>
		btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
	const b64urlChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
	const mockSig = Array.from(
		{ length: 43 },
		() => b64urlChars[Math.floor(Math.random() * b64urlChars.length)]
	).join('');
	return `${b64url(header)}.${b64url(payload)}.${mockSig}`;
}

// JWT Claims interface
interface JWTClaims {
	iss: string; // issuer
	sub: string; // subject
	aud: string; // audience
	iat: number; // issued at
	exp: number; // expiration
	jti: string; // JWT ID
	[key: string]: unknown; // Additional claims
}

// JWT Signature interface
interface JWTSignature {
	algorithm: string;
	privateKey: string;
	publicKey: string;
}

// Step metadata for wizard flow
const STEP_METADATA = [
	{
		title: 'Configuration & Credentials',
		subtitle: 'Configure JWT Bearer authentication',
		description: 'Set up credentials and JWT parameters',
	},
	{
		title: 'JWT Generation',
		subtitle: 'Create signed JWT assertion',
		description: 'Generate JWT with required claims and signature',
	},
	{
		title: 'Token Request',
		subtitle: 'Exchange JWT for access token',
		description: 'Send JWT assertion to token endpoint',
	},
	{
		title: 'Token Response',
		subtitle: 'Receive and validate access token',
		description: 'Process the returned access token',
	},
	{
		title: 'Flow Completion',
		subtitle: 'Review and complete the flow',
		description: 'Summary and next steps',
	},
];

// Main component with Modern Messaging provider
const JWTBearerTokenFlowV9: React.FC = () => {
	// Step navigation state
	const [currentStep, setCurrentStep] = useState(0);

	// Collapsible sections state
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
		overview: true,
		security: true,
		implementation: true,
		credentials: false,
		endpoint: false,
		jwtBuilder: false,
		generatedJWT: false,
		tokenRequest: true,
		tokenResponse: true,
		completion: true,
	});

	// JWT configuration state
	const [tokenEndpoint, setTokenEndpoint] = useState('https://api.pingone.com/oauth2/token');
	const [audience, setAudience] = useState('https://api.pingone.com');
	const [clientId, setClientId] = useState('test-client');
	const [jwtClaims, setJwtClaims] = useState<JWTClaims>({
		iss: 'https://api.pingone.com',
		sub: '',
		aud: 'https://api.pingone.com/oauth2/token',
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + 3600,
		jti: `jwt-${Math.random().toString(36).substring(2, 9)}`,
	});
	const [jwtSignature, setJwtSignature] = useState<JWTSignature>({
		algorithm: 'RS256',
		privateKey:
			'-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA1234567890abcdef\n-----END RSA PRIVATE KEY-----',
		publicKey:
			'-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890abcdef\n-----END PUBLIC KEY-----',
	});
	const [generatedJWT, setGeneratedJWT] = useState('');
	const [tokenResponse, setTokenResponse] = useState<unknown>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Environment ID from URL params or storage
	const [environmentId, setEnvironmentId] = useState('');

	// Initialize environment ID credentials on mount
	useEffect(() => {
		const synced = V9CredentialStorageService.loadSync('v9:jwt-bearer');
		if (synced) {
			if (synced.clientId) setClientId(synced.clientId);
			if (synced.environmentId) setEnvironmentId(synced.environmentId);
		}
		V9CredentialStorageService.load('v9:jwt-bearer').then((creds) => {
			if (creds?.clientId) setClientId(creds.clientId);
			if (creds?.environmentId) setEnvironmentId(creds.environmentId);
		});
	}, []);

	const saveJwtCredentials = useCallback((cId: string, envId: string) => {
		V9CredentialStorageService.save(
			'v9:jwt-bearer',
			{ clientId: cId, environmentId: envId },
			envId ? { environmentId: envId } : {}
		);
	}, []);

	const handleJwtAppSelected = useCallback(
		(app: DiscoveredApp) => {
			setClientId(app.id);
			saveJwtCredentials(app.id, environmentId);
		},
		[environmentId, saveJwtCredentials]
	);

	// Restart functionality
	const restartFlow = useCallback(() => {
		// Reset all state to initial values
		setCurrentStep(0);
		setTokenEndpoint('https://api.pingone.com/oauth2/token');
		setAudience('https://api.pingone.com');
		setClientId('test-client');
		setJwtClaims({
			iss: 'https://api.pingone.com',
			sub: '',
			aud: 'https://api.pingone.com/oauth2/token',
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 3600,
			jti: `jwt-${Math.random().toString(36).substring(2, 9)}`,
		});
		setJwtSignature({
			algorithm: 'RS256',
			privateKey:
				'-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA1234567890abcdef\n-----END RSA PRIVATE KEY-----',
			publicKey:
				'-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890abcdef\n-----END PUBLIC KEY-----',
		});
		setGeneratedJWT('');
		setTokenResponse(null);
		setIsLoading(false);

		// Show notification
		const modernMessaging = V9ModernMessagingService.getInstance();
		modernMessaging.showBanner({
			type: 'info',
			title: 'Flow Restarted',
			message: 'All progress has been reset. You can start again from step 1.',
			dismissible: true,
		});
	}, []);

	// Step navigation functions
	const goToNextStep = useCallback(() => {
		if (currentStep < STEP_METADATA.length - 1) {
			setCurrentStep((prev) => prev + 1);
		}
	}, [currentStep]);

	const goToPreviousStep = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	}, [currentStep]);

	const goToStep = useCallback((step: number) => {
		if (step >= 0 && step < STEP_METADATA.length) {
			setCurrentStep(step);
		}
	}, []);

	// Toggle section handler
	const toggleSection = useCallback((section: string) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	// Validate current step
	const validateCurrentStep = useCallback(() => {
		switch (currentStep) {
			case 0: // Configuration & Credentials
				return !!(clientId && tokenEndpoint && jwtSignature.privateKey && jwtSignature.publicKey);
			case 1: // JWT Generation
				return !!generatedJWT;
			case 2: // Token Request
				return !!generatedJWT;
			case 3: // Token Response
				return !!tokenResponse;
			case 4: // Flow Completion
				return true;
			default:
				return false;
		}
	}, [currentStep, clientId, tokenEndpoint, jwtSignature, generatedJWT, tokenResponse]);

	// Generate JWT
	const generateJWT = useCallback(async () => {
		if (!jwtSignature.privateKey || !jwtSignature.publicKey) {
			modernMessaging.showBanner({
				type: 'warning',
				title: 'Missing Keys',
				message: 'Please provide both private and public keys',
				dismissible: true,
			});
			return;
		}

		setIsLoading(true);
		try {
			// Update JWT claims with current values
			const updatedClaims = {
				...jwtClaims,
				sub: clientId,
				aud: audience,
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 3600,
				jti: `jwt-${Math.random().toString(36).substring(2, 9)}`,
			};

			// Mock JWT generation for demonstration
			const header = btoa(JSON.stringify({ alg: jwtSignature.algorithm, typ: 'JWT' }));
			const payload = btoa(JSON.stringify(updatedClaims));
			const signature = `mock_signature_${Date.now()}`;
			const mockJWT = `${header}.${payload}.${signature}`;
			setGeneratedJWT(mockJWT);

			// Update claims state
			setJwtClaims(updatedClaims);

			modernMessaging.showBanner({
				type: 'success',
				title: 'JWT Generated',
				message: 'JWT has been generated successfully',
				dismissible: true,
			});
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'JWT Generation Failed',
				message: 'Failed to generate JWT token',
				contactSupport: false,
			});
		} finally {
			setIsLoading(false);
		}
	}, [jwtSignature, clientId, audience, jwtClaims]);

	// Token request function — returns real-looking JWT so decode/display service works
	const requestToken = useCallback(async () => {
		if (!generatedJWT) {
			modernMessaging.showBanner({
				type: 'warning',
				title: 'No JWT',
				message: 'Please generate a JWT first',
				dismissible: true,
			});
			return;
		}

		setIsLoading(true);
		try {
			const mockAccessToken = buildMockAccessTokenJWT({
				iss: jwtClaims.iss,
				sub: clientId,
				aud: audience,
				scope: 'openid profile',
				client_id: clientId,
			});
			const mockResponse = {
				access_token: mockAccessToken,
				token_type: 'Bearer' as const,
				expires_in: 3600,
				scope: 'openid profile',
			};

			setTokenResponse(mockResponse);

			modernMessaging.showBanner({
				type: 'success',
				title: 'Token Received',
				message: 'Access token has been successfully obtained',
				dismissible: true,
			});
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'Token Request Failed',
				message: 'Failed to obtain access token',
				contactSupport: false,
			});
		} finally {
			setIsLoading(false);
		}
	}, [generatedJWT, jwtClaims.iss, clientId, audience]);

	// Handle form field changes
	const handleFieldChange = useCallback((field: string, value: string) => {
		switch (field) {
			case 'tokenEndpoint':
				setTokenEndpoint(value);
				break;
			case 'audience':
				setAudience(value);
				break;
			case 'clientId':
				setClientId(value);
				break;
			case 'jwtAlgorithm':
				setJwtSignature((prev) => ({ ...prev, algorithm: value }));
				break;
			case 'privateKey':
				setJwtSignature((prev) => ({ ...prev, privateKey: value }));
				break;
			case 'publicKey':
				setJwtSignature((prev) => ({ ...prev, publicKey: value }));
				break;
		}
	}, []);

	// Generate sample RSA keys (use getInstance() so banner shows in provider context)
	const generateSampleKeys = useCallback(() => {
		const samplePrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}
-----END RSA PRIVATE KEY-----`;

		const samplePublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}
-----END PUBLIC KEY-----`;

		setJwtSignature((prev) => ({
			...prev,
			privateKey: samplePrivateKey,
			publicKey: samplePublicKey,
		}));

		const messaging = V9ModernMessagingService.getInstance();
		messaging.showBanner({
			type: 'success',
			title: 'Sample Keys Generated',
			message: 'New RSA key pair has been generated for testing',
			dismissible: true,
		});
	}, []);

	// Copy to clipboard
	const handleCopy = useCallback(async (text: string) => {
		await copyToClipboard(text);
	}, []);

	// Render component (messaging from app-level V9ModernMessagingProvider to avoid duplicate banners)
	return (
		<div style={{ padding: '2rem', maxWidth: '90rem', margin: '0 auto' }}>
			<V7MMockBanner description="This flow simulates the OAuth 2.0 JWT Bearer Token flow (RFC 7523) in-browser. No external APIs are called. JWT and token responses are generated for learning." />
			<V9FlowHeader flowId="jwt-bearer-token-v7" />

			{/* Restart Button */}
			<div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
				<V9FlowRestartButton
					onRestart={restartFlow}
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					position="header"
				/>
			</div>

			{/* Step Progress Indicator */}
			<div style={{ marginBottom: '2rem' }}>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '1rem',
					}}
				>
					{STEP_METADATA.map((_step, index) => (
						<div key={index} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
							<div
								style={{
									width: '32px',
									height: '32px',
									borderRadius: '50%',
									background: index <= currentStep ? '#3b82f6' : '#e5e7eb',
									color: index <= currentStep ? '#ffffff' : '#6b7280',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontWeight: 600,
									fontSize: '0.875rem',
								}}
							>
								{index + 1}
							</div>
							{index < STEP_METADATA.length - 1 && (
								<div
									style={{
										flex: 1,
										height: '2px',
										background: index < currentStep ? '#3b82f6' : '#e5e7eb',
										margin: '0 1rem',
									}}
								/>
							)}
						</div>
					))}
				</div>
				<div>
					<h3 style={{ margin: 0, color: '#1f2937' }}>{STEP_METADATA[currentStep].title}</h3>
					<p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
						{STEP_METADATA[currentStep].subtitle}
					</p>
				</div>
			</div>

			{/* Step Content */}
			<div style={{ marginTop: '2rem' }}>
				{currentStep === 0 && (
					<div>
						{/* Overview Section */}
						<div
							style={{
								background: '#f8fafc',
								padding: '1.5rem',
								borderRadius: '0.5rem',
								marginBottom: '2rem',
								border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
							}}
						>
							<button
								type="button"
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									cursor: 'pointer',
									marginBottom: collapsedSections.overview ? '0' : '1rem',
									background: 'none',
									border: 'none',
									padding: 0,
									width: '100%',
									textAlign: 'left',
								}}
								onClick={() => toggleSection('overview')}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										toggleSection('overview');
									}
								}}
							>
								<h3 style={{ margin: 0 }}>📋 Overview</h3>
								<span style={{ fontSize: '1.25rem' }}>
									{collapsedSections.overview ? '▶' : '▼'}
								</span>
							</button>
							{!collapsedSections.overview && (
								<div>
									<p style={{ color: '#1f2937', marginBottom: '1rem' }}>
										<strong>RFC 7523</strong> defines how to use JSON Web Tokens (JWTs) for OAuth
										2.0 bearer tokens.
									</p>
									<ul style={{ color: '#1f2937', paddingLeft: '1.5rem', margin: 0 }}>
										<li>JWTs are self-contained tokens with claims</li>
										<li>No need for token introspection</li>
										<li>Suitable for service-to-service authentication</li>
										<li>Supports asymmetric cryptography</li>
									</ul>
								</div>
							)}
						</div>

						{/* Credentials Configuration */}
						<div
							style={{
								background: '#f8fafc',
								padding: '1.5rem',
								borderRadius: '0.5rem',
								marginBottom: '2rem',
								border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
							}}
						>
							<button
								type="button"
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									cursor: 'pointer',
									marginBottom: collapsedSections.credentials ? '0' : '1rem',
									background: 'none',
									border: 'none',
									padding: 0,
									width: '100%',
									textAlign: 'left',
								}}
								onClick={() => toggleSection('credentials')}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										toggleSection('credentials');
									}
								}}
							>
								<h3 style={{ margin: 0 }}>🔐 Credentials Configuration</h3>
								<span style={{ fontSize: '1.25rem' }}>
									{collapsedSections.credentials ? '▶' : '▼'}
								</span>
							</button>
							{!collapsedSections.credentials && (
								<div>
									<CompactAppPickerV8U
										environmentId={environmentId}
										onAppSelected={handleJwtAppSelected}
									/>
									<div style={{ marginBottom: '1rem' }}>
										<label
											htmlFor="clientId"
											style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
										>
											Client ID:
										</label>
										<input
											id="clientId"
											type="text"
											value={clientId}
											onChange={(e) => handleFieldChange('clientId', e.target.value)}
											style={{
												width: '100%',
												padding: '0.5rem',
												border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
												borderRadius: '0.25rem',
											}}
										/>
									</div>
								</div>
							)}
						</div>

						{/* Token Endpoint Configuration */}
						<div
							style={{
								background: '#f8fafc',
								padding: '1.5rem',
								borderRadius: '0.5rem',
								marginBottom: '2rem',
								border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
							}}
						>
							<button
								type="button"
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									cursor: 'pointer',
									marginBottom: collapsedSections.endpoint ? '0' : '1rem',
									background: 'none',
									border: 'none',
									padding: 0,
									width: '100%',
									textAlign: 'left',
								}}
								onClick={() => toggleSection('endpoint')}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										toggleSection('endpoint');
									}
								}}
							>
								<h3 style={{ margin: 0 }}>🌐 Token Endpoint Configuration</h3>
								<span style={{ fontSize: '1.25rem' }}>
									{collapsedSections.endpoint ? '▶' : '▼'}
								</span>
							</button>
							{!collapsedSections.endpoint && (
								<div>
									<div style={{ marginBottom: '1rem' }}>
										<label
											htmlFor="tokenEndpoint"
											style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
										>
											Token Endpoint:
										</label>
										<input
											id="tokenEndpoint"
											type="url"
											value={tokenEndpoint}
											onChange={(e) => handleFieldChange('tokenEndpoint', e.target.value)}
											style={{
												width: '100%',
												padding: '0.5rem',
												border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
												borderRadius: '0.25rem',
											}}
										/>
									</div>
									<div style={{ marginBottom: '1rem' }}>
										<label
											htmlFor="audience"
											style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
										>
											Audience:
										</label>
										<input
											id="audience"
											type="url"
											value={audience}
											onChange={(e) => handleFieldChange('audience', e.target.value)}
											style={{
												width: '100%',
												padding: '0.5rem',
												border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
												borderRadius: '0.25rem',
											}}
										/>
									</div>
								</div>
							)}
						</div>

						{/* JWT Configuration */}
						<div
							style={{
								background: '#f8fafc',
								padding: '1.5rem',
								borderRadius: '0.5rem',
								marginBottom: '2rem',
								border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
							}}
						>
							<button
								type="button"
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									cursor: 'pointer',
									marginBottom: collapsedSections.jwtBuilder ? '0' : '1rem',
									background: 'none',
									border: 'none',
									padding: 0,
									width: '100%',
									textAlign: 'left',
								}}
								onClick={() => toggleSection('jwtBuilder')}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										toggleSection('jwtBuilder');
									}
								}}
							>
								<h3 style={{ margin: 0 }}>🔑 JWT Configuration</h3>
								<span style={{ fontSize: '1.25rem' }}>
									{collapsedSections.jwtBuilder ? '▶' : '▼'}
								</span>
							</button>
							{!collapsedSections.jwtBuilder && (
								<div>
									<div style={{ marginBottom: '1rem' }}>
										<label
											htmlFor="jwtAlgorithm"
											style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
										>
											Algorithm:
										</label>
										<select
											id="jwtAlgorithm"
											value={jwtSignature.algorithm}
											onChange={(e) => handleFieldChange('jwtAlgorithm', e.target.value)}
											style={{
												width: '100%',
												padding: '0.5rem',
												border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
												borderRadius: '0.25rem',
											}}
										>
											<option value="RS256">RS256</option>
											<option value="RS384">RS384</option>
											<option value="RS512">RS512</option>
											<option value="ES256">ES256</option>
											<option value="ES384">ES384</option>
											<option value="ES512">ES512</option>
										</select>
									</div>
									<div style={{ marginBottom: '1rem' }}>
										<label
											htmlFor="privateKey"
											style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
										>
											Private Key:
										</label>
										<textarea
											id="privateKey"
											value={jwtSignature.privateKey}
											onChange={(e) => handleFieldChange('privateKey', e.target.value)}
											placeholder="Enter your private key here..."
											rows={6}
											style={{
												width: '100%',
												padding: '0.5rem',
												border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
												borderRadius: '0.25rem',
												fontFamily: 'monospace',
												fontSize: '0.875rem',
											}}
										/>
									</div>
									<div style={{ marginBottom: '1rem' }}>
										<label
											htmlFor="publicKey"
											style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
										>
											Public Key:
										</label>
										<textarea
											id="publicKey"
											value={jwtSignature.publicKey}
											onChange={(e) => handleFieldChange('publicKey', e.target.value)}
											placeholder="Enter your public key here..."
											rows={6}
											style={{
												width: '100%',
												padding: '0.5rem',
												border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
												borderRadius: '0.25rem',
												fontFamily: 'monospace',
												fontSize: '0.875rem',
											}}
										/>
									</div>
									<button
										onClick={generateSampleKeys}
										type="button"
										style={{
											padding: '0.5rem 1rem',
											background: '#10b981',
											color: '#ffffff',
											border: 'none',
											borderRadius: '0.375rem',
											cursor: 'pointer',
											fontWeight: 600,
											fontSize: '0.875rem',
										}}
									>
										Generate Sample Keys
									</button>
								</div>
							)}
						</div>
					</div>
				)}

				{currentStep === 1 && (
					<div>
						{/* JWT Generation */}
						<div
							style={{
								background: '#f8fafc',
								padding: '1.5rem',
								borderRadius: '0.5rem',
								marginBottom: '2rem',
								border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
							}}
						>
							<h3 style={{ margin: '0 0 1rem 0' }}>🔧 JWT Generation</h3>
							<p style={{ color: '#1f2937', marginBottom: '1rem' }}>
								Generate a signed JWT assertion for the OAuth 2.0 token request.
							</p>

							{/* Where the JWT comes from / how it's generated */}
							<div
								style={{
									background: '#eff6ff',
									border: '1px solid #bfdbfe',
									borderRadius: '0.5rem',
									padding: '1rem',
									marginBottom: '1rem',
								}}
							>
								<h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9375rem', color: '#1e40af' }}>
									Where does this JWT come from?
								</h4>
								<p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.875rem', lineHeight: 1.5 }}>
									The <strong>client (your application)</strong> creates the JWT — not the
									authorization server. You build it from the claims and keys you configured in step
									1, then send it in the next step as the{' '}
									<code
										style={{
											background: 'rgba(255,255,255,0.6)',
											padding: '0.125rem 0.25rem',
											borderRadius: 4,
										}}
									>
										assertion
									</code>{' '}
									parameter.
								</p>
								<h4
									style={{ margin: '0.75rem 0 0.5rem 0', fontSize: '0.9375rem', color: '#1e40af' }}
								>
									How is it generated?
								</h4>
								<ul
									style={{
										margin: 0,
										paddingLeft: '1.25rem',
										color: '#1e3a8a',
										fontSize: '0.875rem',
										lineHeight: 1.6,
									}}
								>
									<li>
										<strong>Header:</strong> Algorithm (e.g. RS256) and type (<code>JWT</code>),
										base64url-encoded.
									</li>
									<li>
										<strong>Payload:</strong> Claims (iss, sub, aud, iat, exp, jti, scope, etc.)
										from step 1, base64url-encoded.
									</li>
									<li>
										<strong>Signature:</strong> Sign <code>header.payload</code> with your{' '}
										<strong>private key</strong> using the chosen algorithm. The authorization
										server verifies with your <strong>public key</strong> (or JWKS).
									</li>
								</ul>
								<p
									style={{
										margin: '0.75rem 0 0',
										color: '#1e3a8a',
										fontSize: '0.875rem',
										lineHeight: 1.5,
									}}
								>
									In production you use a JWT library (e.g. <code>jose</code>,{' '}
									<code>jsonwebtoken</code>) to create and sign the JWT. Here we simulate the
									structure so you can see the result; in the next step this value is sent as{' '}
									<code>assertion</code> in the token request (RFC 7523).
								</p>
							</div>

							<div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
								<button
									onClick={generateJWT}
									disabled={isLoading}
									type="button"
									style={{
										padding: '0.75rem 1.5rem',
										background: isLoading ? '#9ca3af' : '#3b82f6',
										color: '#ffffff',
										border: 'none',
										borderRadius: '0.375rem',
										cursor: isLoading ? 'not-allowed' : 'pointer',
										fontWeight: 600,
									}}
								>
									{isLoading ? 'Generating...' : 'Generate JWT'}
								</button>
							</div>
							<p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
								To change keys, go back to step 1 and use “Generate Sample Keys” in JWT
								Configuration.
							</p>
						</div>

						{/* Generated JWT Display */}
						{generatedJWT && (
							<div
								style={{
									background: '#f8fafc',
									padding: '1.5rem',
									borderRadius: '0.5rem',
									border: '1px solid #0ea5e9',
								}}
							>
								<h3 style={{ margin: '0 0 1rem 0' }}>🎯 Generated JWT</h3>
								<div
									style={{
										background: '#1e293b',
										color: '#e5e7eb',
										padding: '1rem',
										borderRadius: '0.375rem',
										fontFamily: 'monospace',
										fontSize: '0.875rem',
										wordBreak: 'break-all',
										marginBottom: '1rem',
									}}
								>
									{generatedJWT}
								</div>
								<div style={{ display: 'flex', gap: '1rem' }}>
									<button
										onClick={() => handleCopy(generatedJWT)}
										type="button"
										style={{
											padding: '0.5rem 1rem',
											background: '#0ea5e9',
											color: '#ffffff',
											border: 'none',
											borderRadius: '0.375rem',
											cursor: 'pointer',
											fontWeight: 600,
										}}
									>
										Copy JWT
									</button>
								</div>
							</div>
						)}
					</div>
				)}

				{currentStep === 2 && (
					<div>
						{/* Mock API request — educational: what gets sent (RFC 7523) */}
						<MockApiCallDisplay
							title="JWT Bearer Token Request (RFC 7523)"
							method="POST"
							url={tokenEndpoint}
							headers={{
								'Content-Type': 'application/x-www-form-urlencoded',
								Accept: 'application/json',
							}}
							body={
								generatedJWT
									? `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${encodeURIComponent(generatedJWT)}`
									: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=<your-generated-jwt>'
							}
							response={
								tokenResponse &&
								typeof tokenResponse === 'object' &&
								'access_token' in tokenResponse
									? {
											status: 200,
											statusText: 'OK',
											headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
											data: tokenResponse as {
												access_token: string;
												token_type?: string;
												expires_in?: number;
												scope?: string;
											},
										}
									: undefined
							}
							description="The client POSTs the JWT assertion to the token endpoint. grant_type identifies the JWT Bearer grant; assertion is the signed JWT. In production the AS validates the JWT signature and claims before issuing an access token."
							note="This is a mock request for learning. No real API call is made; the response is simulated in-browser."
							defaultExpanded={true}
						/>

						{/* Token Request */}
						<div
							style={{
								background: '#f8fafc',
								padding: '1.5rem',
								borderRadius: '0.5rem',
								marginBottom: '2rem',
								border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
							}}
						>
							<h3 style={{ margin: '0 0 1rem 0' }}>🚀 Token Request</h3>
							<p style={{ color: '#1f2937', marginBottom: '1rem' }}>
								Send the JWT assertion to the token endpoint to obtain an access token.
							</p>
							<div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
								<button
									onClick={requestToken}
									disabled={isLoading || !generatedJWT}
									type="button"
									style={{
										padding: '0.75rem 1.5rem',
										background: isLoading || !generatedJWT ? '#9ca3af' : '#3b82f6',
										color: '#ffffff',
										border: 'none',
										borderRadius: '0.375rem',
										cursor: isLoading || !generatedJWT ? 'not-allowed' : 'pointer',
										fontWeight: 600,
									}}
								>
									{isLoading ? 'Requesting...' : 'Request Access Token'}
								</button>
							</div>
							{!generatedJWT && (
								<div
									style={{
										background: '#fef3c7',
										padding: '1rem',
										borderRadius: '0.375rem',
										border: '1px solid V9_COLORS.PRIMARY.YELLOW',
										marginBottom: '1rem',
									}}
								>
									<p style={{ margin: 0, color: '#d97706' }}>
										⚠️ Please generate a JWT first before requesting an access token.
									</p>
								</div>
							)}
						</div>
					</div>
				)}

				{currentStep === 3 && (
					<div>
						{/* Token Response — real-looking JWT with decode/copy via UnifiedTokenDisplayService */}
						<div
							style={{
								background: '#f8fafc',
								padding: '1.5rem',
								borderRadius: '0.5rem',
								marginBottom: '2rem',
								border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
							}}
						>
							<h3 style={{ margin: '0 0 1rem 0' }}>📋 Token Response</h3>
							{tokenResponse &&
							typeof tokenResponse === 'object' &&
							'access_token' in tokenResponse ? (
								<div>
									<p style={{ color: '#1f2937', marginBottom: '1rem' }}>
										Successfully obtained access token from the token endpoint. Decode or copy
										below.
									</p>
									{UnifiedTokenDisplayService.showTokens(
										{
											access_token: (tokenResponse as { access_token: string }).access_token,
											token_type: (tokenResponse as { token_type: string }).token_type ?? 'Bearer',
											expires_in: (tokenResponse as { expires_in?: number }).expires_in ?? 3600,
											scope: (tokenResponse as { scope?: string }).scope,
										},
										'oauth',
										'jwt-bearer-token-v9',
										{ showCopyButtons: true, showDecodeButtons: true, showFullToken: true }
									)}
								</div>
							) : (
								<div
									style={{
										background: '#fef3c7',
										padding: '1rem',
										borderRadius: '0.375rem',
										border: '1px solid V9_COLORS.PRIMARY.YELLOW',
									}}
								>
									<p style={{ margin: 0, color: '#d97706' }}>
										⚠️ No token response yet. Please complete the token request step first.
									</p>
								</div>
							)}
						</div>
					</div>
				)}

				{currentStep === 4 && (
					<div>
						{/* Flow Completion — why use this flow, why it's secure, PingOne docs */}
						<div
							style={{
								background: '#f0fdf4',
								padding: '1.5rem',
								borderRadius: '0.5rem',
								marginBottom: '2rem',
								border: '1px solid #10b981',
							}}
						>
							<h3 style={{ margin: '0 0 1rem 0', color: '#059669' }}>✅ Flow Completion</h3>
							<p style={{ color: '#047857', marginBottom: '1.25rem', fontSize: '1rem' }}>
								You have successfully completed the JWT Bearer Token flow. Your access token is
								ready for API authentication.
							</p>

							<div
								style={{
									background: '#ffffff',
									border: '1px solid #d1fae5',
									borderRadius: '0.5rem',
									padding: '1rem',
									marginBottom: '1rem',
								}}
							>
								<h4 style={{ margin: '0 0 0.5rem 0', color: '#065f46', fontSize: '0.9375rem' }}>
									What you did
								</h4>
								<ul
									style={{
										margin: 0,
										paddingLeft: '1.25rem',
										color: '#1f2937',
										fontSize: '0.875rem',
										lineHeight: 1.6,
									}}
								>
									<li>Configured credentials and JWT claims (iss, sub, aud, keys)</li>
									<li>Generated a signed JWT assertion (header + payload + signature)</li>
									<li>Exchanged the JWT for an access token at the token endpoint</li>
									<li>Received an access token you can use for protected resources</li>
								</ul>
							</div>

							<div
								style={{
									background: '#eff6ff',
									border: '1px solid #bfdbfe',
									borderRadius: '0.5rem',
									padding: '1rem',
									marginBottom: '1rem',
								}}
							>
								<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '0.9375rem' }}>
									Why use this flow?
								</h4>
								<p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.875rem', lineHeight: 1.6 }}>
									The JWT Bearer grant (RFC 7523) is used when the{' '}
									<strong>client or another issuer</strong> has already authenticated the user and
									can produce a <strong>signed JWT</strong>. The authorization server does not
									interact with the resource owner in this flow. Use it for:
								</p>
								<ul
									style={{
										margin: '0.5rem 0 0 1.25rem',
										color: '#1e3a8a',
										fontSize: '0.875rem',
										lineHeight: 1.6,
									}}
								>
									<li>
										<strong>Service-to-service (M2M)</strong> — backends exchanging a JWT from a
										trusted issuer for an access token
									</li>
									<li>
										<strong>Federated identity</strong> — an external IdP issues a JWT; your app
										exchanges it for a local access token
									</li>
									<li>
										<strong>Batch / automation</strong> — systems that have a pre-issued JWT and
										need an access token without user interaction
									</li>
									<li>
										<strong>Migration</strong> — moving from SAML or another protocol where an
										issuer already produces signed assertions
									</li>
								</ul>
							</div>

							<div
								style={{
									background: '#fefce8',
									border: '1px solid #fef08a',
									borderRadius: '0.5rem',
									padding: '1rem',
									marginBottom: '1rem',
								}}
							>
								<h4 style={{ margin: '0 0 0.5rem 0', color: '#854d0e', fontSize: '0.9375rem' }}>
									Why it's secure
								</h4>
								<ul
									style={{
										margin: 0,
										paddingLeft: '1.25rem',
										color: '#713f12',
										fontSize: '0.875rem',
										lineHeight: 1.6,
									}}
								>
									<li>
										<strong>Signed JWT</strong> — The assertion is cryptographically signed (e.g.
										RS256). The authorization server validates the signature with the issuer's
										public key before issuing an access token.
									</li>
									<li>
										<strong>Asymmetric keys</strong> — Only the issuer holds the private key; the AS
										only needs the public key or JWKS, so secrets are not shared.
									</li>
									<li>
										<strong>No passwords on the wire</strong> — No user password is sent to the
										token endpoint; the JWT proves authorization from a trusted issuer.
									</li>
									<li>
										<strong>RFC 7523 validation</strong> — The AS checks <code>iss</code>,{' '}
										<code>aud</code>, <code>exp</code>, and signature so only valid, non-expired
										assertions from trusted issuers are accepted.
									</li>
								</ul>
							</div>

							<div
								style={{
									background: '#ffffff',
									border: '1px solid #e5e7eb',
									borderRadius: '0.5rem',
									padding: '1rem',
								}}
							>
								<h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '0.9375rem' }}>
									PingOne documentation
								</h4>
								<p style={{ margin: 0, color: '#4b5563', fontSize: '0.875rem', lineHeight: 1.5 }}>
									To use this flow with PingOne Advanced Identity Cloud, configure a trusted JWT
									issuer profile, register an OAuth client with the JWT Bearer grant, and exchange
									the signed JWT at the access token endpoint.
								</p>
								<a
									href="https://docs.pingidentity.com/pingoneaic/latest/am-oauth2/oauth2-jwt-bearer-grant.html"
									target="_blank"
									rel="noopener noreferrer"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.375rem',
										marginTop: '0.75rem',
										padding: '0.5rem 0.75rem',
										background: '#2563eb',
										color: '#ffffff',
										borderRadius: '0.375rem',
										fontSize: '0.875rem',
										fontWeight: 600,
										textDecoration: 'none',
									}}
								>
									JWT profile for authorization — PingOne docs →
								</a>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Step Navigation */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					marginTop: '2rem',
					paddingTop: '2rem',
					borderTop: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
				}}
			>
				<button
					onClick={goToPreviousStep}
					disabled={currentStep === 0}
					type="button"
					style={{
						padding: '0.75rem 1.5rem',
						background: currentStep === 0 ? '#e5e7eb' : '#6b7280',
						color: '#ffffff',
						border: 'none',
						borderRadius: '0.375rem',
						cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
						fontWeight: 600,
					}}
				>
					← Previous
				</button>
				<div style={{ display: 'flex', gap: '0.5rem' }}>
					{STEP_METADATA.map((_, index) => (
						<button
							key={index}
							onClick={() => goToStep(index)}
							type="button"
							style={{
								padding: '0.5rem 1rem',
								background: index === currentStep ? '#3b82f6' : '#e5e7eb',
								color: index === currentStep ? '#ffffff' : '#6b7280',
								border: 'none',
								borderRadius: '0.375rem',
								cursor: 'pointer',
								fontWeight: 600,
								fontSize: '0.875rem',
							}}
						>
							{index + 1}
						</button>
					))}
				</div>
				<button
					onClick={goToNextStep}
					disabled={currentStep === STEP_METADATA.length - 1 || !validateCurrentStep()}
					type="button"
					style={{
						padding: '0.75rem 1.5rem',
						background:
							currentStep === STEP_METADATA.length - 1 || !validateCurrentStep()
								? '#e5e7eb'
								: '#3b82f6',
						color: '#ffffff',
						border: 'none',
						borderRadius: '0.375rem',
						cursor:
							currentStep === STEP_METADATA.length - 1 || !validateCurrentStep()
								? 'not-allowed'
								: 'pointer',
						fontWeight: 600,
					}}
				>
					{currentStep === STEP_METADATA.length - 1 ? 'Complete' : 'Next →'}
				</button>
			</div>

			{/* Flow Completion Summary */}
			{currentStep === STEP_METADATA.length - 1 && (
				<div
					style={{
						background: '#f0fdf4',
						border: '1px solid #86efac',
						borderRadius: '0.5rem',
						padding: '1.5rem',
						marginTop: '2rem',
					}}
				>
					<h3
						style={{
							margin: '0 0 1rem 0',
							color: '#059669',
							fontSize: '1.25rem',
							fontWeight: 600,
						}}
					>
						🎉 Flow Completion Summary
					</h3>
					<p style={{ margin: '0 0 1rem 0', color: '#047857', fontSize: '0.875rem' }}>
						Review “Why use this flow?” and “Why it's secure?” above. Use your access token for API
						calls; see PingOne docs to configure this flow in production.
					</p>
					<div
						style={{
							background: 'white',
							borderRadius: '0.375rem',
							padding: '1rem',
							marginBottom: '1rem',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>Achievements</h4>
						<ul
							style={{ margin: 0, paddingLeft: '1.5rem', color: '#4b5563', fontSize: '0.875rem' }}
						>
							<li>JWT Bearer configuration and signed assertion</li>
							<li>Token request executed; access token obtained</li>
							<li>{STEP_METADATA.length} steps completed</li>
						</ul>
					</div>
					{tokenResponse && (
						<div
							style={{
								background: 'white',
								borderRadius: '0.375rem',
								padding: '1rem',
							}}
						>
							<h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>Token Details:</h4>
							<div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
								<p>
									<strong>Type:</strong> {tokenResponse.token_type}
								</p>
								<p>
									<strong>Expires In:</strong> {tokenResponse.expires_in} seconds
								</p>
								{tokenResponse.scope && (
									<p>
										<strong>Scope:</strong> {tokenResponse.scope}
									</p>
								)}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default JWTBearerTokenFlowV9;
