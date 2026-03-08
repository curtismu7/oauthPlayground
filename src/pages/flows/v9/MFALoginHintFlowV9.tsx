// src/pages/flows/v9/MFALoginHintFlowV9.tsx
// MFA-Only Flow Using Login Hint Token - V9 Implementation with Modern Messaging

import { useCallback, useEffect, useState } from 'react';
import { usePageScroll } from '../../../hooks/usePageScroll';
import { V9CredentialStorageService } from '../../../services/v9/V9CredentialStorageService';
import {
	type MessageState,
	V9ModernMessagingService,
} from '../../../services/v9/V9ModernMessagingService';
import V9FlowHeader from '../../../services/v9/v9FlowHeaderService';
import type { DiscoveredApp } from '../../../v8/components/AppPickerV8';
import { CompactAppPickerV8U } from '../../../v8u/components/CompactAppPickerV8U';

// Types
interface MFALoginHintConfig {
	environmentId: string;
	applicationId: string;
	clientId: string;
	clientSecret: string;
	userId?: string;
	phoneNumber?: string;
	email?: string;
}

interface LoginHintTokenResponse {
	login_hint_token: string;
	expires_in: number;
	token_type: string;
	scope?: string;
	user_id?: string;
}

interface MFAResponse {
	flowId: string;
	status: string;
	userId: string;
	challenges: Array<{
		type: string;
		detail: string;
	}>;
	user?: {
		id: string;
		name: string;
	};
	authorizeUrl?: string;
	redirectUri?: string;
	state?: string;
}

interface MFACompletionResponse {
	flowId: string;
	status: string;
	userId: string;
	accessToken?: string;
	tokenType?: string;
	expiresIn?: number;
	scope?: string;
}

// Step metadata for multi-step flow
const STEP_METADATA = [
	{
		title: 'MFA Configuration',
		subtitle: 'Configure MFA login hint parameters',
	},
	{
		title: 'Login Hint Token',
		subtitle: 'Generate login hint token for MFA',
	},
	{
		title: 'MFA Authentication',
		subtitle: 'Complete MFA authentication flow',
	},
	{
		title: 'Access Token',
		subtitle: 'Receive final access token',
	},
	{
		title: 'Flow Completion',
		subtitle: 'Review and complete MFA flow',
	},
];

const MFALoginHintFlowV9: React.FC = () => {
	const [messageState, setMessageState] = useState<MessageState>({});
	const modernMessaging = V9ModernMessagingService.getInstance();

	useEffect(() => {
		return modernMessaging.subscribe(setMessageState);
	}, [modernMessaging]);

	const { scrollToTopAfterAction } = usePageScroll();

	// State management
	const [currentStep, setCurrentStep] = useState(0);

	// MFA Configuration
	const [mfaConfig, setMfaConfig] = useState<MFALoginHintConfig>({
		environmentId: '',
		applicationId: '',
		clientId: '',
		clientSecret: '',
		userId: '',
		phoneNumber: '',
		email: '',
	});

	// Load stored credentials on mount
	useEffect(() => {
		const synced = V9CredentialStorageService.loadSync('v9:mfa-login-hint');
		if (synced) {
			setMfaConfig((prev) => ({
				...prev,
				...(synced.clientId ? { clientId: synced.clientId } : {}),
				...(synced.clientSecret ? { clientSecret: synced.clientSecret } : {}),
				...(synced.environmentId ? { environmentId: synced.environmentId } : {}),
			}));
		}
		V9CredentialStorageService.load('v9:mfa-login-hint').then((creds) => {
			if (creds) setMfaConfig((prev) => ({ ...prev, ...creds }));
		});
	}, []);

	const saveCredentials = useCallback((config: MFALoginHintConfig) => {
		V9CredentialStorageService.save(
			'v9:mfa-login-hint',
			{
				clientId: config.clientId,
				clientSecret: config.clientSecret,
				environmentId: config.environmentId,
			},
			config.environmentId ? { environmentId: config.environmentId } : {}
		);
	}, []);

	const handleAppSelected = useCallback(
		(app: DiscoveredApp) => {
			setMfaConfig((prev) => {
				const updated = { ...prev, clientId: app.id };
				saveCredentials(updated);
				return updated;
			});
		},
		[saveCredentials]
	);

	// Token and response states
	const [loginHintToken, setLoginHintToken] = useState<LoginHintTokenResponse | null>(null);
	const [mfaResponse, setMfaResponse] = useState<MFAResponse | null>(null);
	const [completionResponse, setCompletionResponse] = useState<MFACompletionResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Step navigation
	const goToNextStep = useCallback(() => {
		if (currentStep < STEP_METADATA.length - 1) {
			setCurrentStep(currentStep + 1);
			scrollToTopAfterAction();
		}
	}, [currentStep, scrollToTopAfterAction]);

	const goToPreviousStep = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
			scrollToTopAfterAction();
		}
	}, [currentStep, scrollToTopAfterAction]);

	const goToStep = useCallback(
		(step: number) => {
			if (step >= 0 && step < STEP_METADATA.length) {
				setCurrentStep(step);
				scrollToTopAfterAction();
			}
		},
		[scrollToTopAfterAction]
	);

	// Step validation
	const validateCurrentStep = useCallback(() => {
		switch (currentStep) {
			case 0: // MFA Configuration
				return mfaConfig.environmentId && mfaConfig.clientId && mfaConfig.clientSecret;
			case 1: // Login Hint Token
				return loginHintToken !== null;
			case 2: // MFA Authentication
				return mfaResponse !== null;
			case 3: // Access Token
				return completionResponse !== null;
			default:
				return true;
		}
	}, [currentStep, mfaConfig, loginHintToken, mfaResponse, completionResponse]);

	// Generate login hint token
	const generateLoginHintToken = useCallback(async () => {
		setIsLoading(true);
		try {
			// Mock implementation - replace with actual API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			const mockResponse: LoginHintTokenResponse = {
				login_hint_token: `mock_login_hint_${Date.now()}`,
				expires_in: 3600,
				token_type: 'Bearer',
				scope: 'openid profile email',
				user_id: mfaConfig.userId || 'mock_user_id',
			};

			setLoginHintToken(mockResponse);
			modernMessaging.showBanner({
				type: 'success',
				title: 'Login Hint Token Generated',
				message: 'Successfully generated login hint token for MFA flow',
				dismissible: true,
			});
		} catch {
			modernMessaging.showCriticalError({
				title: 'Token Generation Failed',
				message: 'Failed to generate login hint token. Please check your configuration.',
				recoveryActions: [
					{
						label: 'Retry',
						action: () => generateLoginHintToken(),
					},
				],
			});
		} finally {
			setIsLoading(false);
		}
	}, [mfaConfig, modernMessaging]);

	// Start MFA authentication
	const startMFAAuthentication = useCallback(async () => {
		setIsLoading(true);
		try {
			// Mock implementation - replace with actual API call
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const mockResponse: MFAResponse = {
				flowId: `mfa_flow_${Date.now()}`,
				status: 'challenge_required',
				userId: mfaConfig.userId || 'mock_user_id',
				challenges: [
					{
						type: 'otp',
						detail: 'Enter the one-time password sent to your device',
					},
				],
				user: {
					id: mfaConfig.userId || 'mock_user_id',
					name: 'Test User',
				},
				authorizeUrl: 'https://mock-auth.pingone.com/authorize',
				redirectUri: 'http://localhost:3000/callback',
				state: `state_${Date.now()}`,
			};

			setMfaResponse(mockResponse);
			modernMessaging.showBanner({
				type: 'info',
				title: 'MFA Challenge Required',
				message: 'Please complete the MFA challenge to continue',
				dismissible: true,
			});
		} catch {
			modernMessaging.showCriticalError({
				title: 'MFA Authentication Failed',
				message: 'Failed to start MFA authentication. Please try again.',
				recoveryActions: [
					{
						label: 'Retry',
						action: () => startMFAAuthentication(),
					},
				],
			});
		} finally {
			setIsLoading(false);
		}
	}, [mfaConfig, modernMessaging]);

	// Complete MFA flow
	const completeMFAFlow = useCallback(async () => {
		setIsLoading(true);
		try {
			// Mock implementation - replace with actual API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			const mockResponse: MFACompletionResponse = {
				flowId: mfaResponse?.flowId || '',
				status: 'completed',
				userId: mfaResponse?.userId || '',
				accessToken: `mock_access_${Date.now()}`,
				tokenType: 'Bearer',
				expiresIn: 3600,
				scope: 'openid profile email',
			};

			setCompletionResponse(mockResponse);
			modernMessaging.showBanner({
				type: 'success',
				title: 'MFA Flow Completed',
				message: 'Successfully completed MFA authentication flow',
				dismissible: true,
			});
		} catch {
			modernMessaging.showCriticalError({
				title: 'MFA Completion Failed',
				message: 'Failed to complete MFA flow. Please try again.',
				recoveryActions: [
					{
						label: 'Retry',
						action: () => completeMFAFlow(),
					},
				],
			});
		} finally {
			setIsLoading(false);
		}
	}, [mfaResponse, modernMessaging]);

	// Copy to clipboard utility
	const handleCopy = useCallback(
		async (text: string, label: string) => {
			try {
				await navigator.clipboard.writeText(text);
				modernMessaging.showBanner({
					type: 'success',
					title: 'Copied to Clipboard',
					message: `${label} has been copied to your clipboard`,
					dismissible: true,
				});
			} catch (_error) {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Copy Failed',
					message: 'Failed to copy to clipboard. Please copy manually.',
					dismissible: true,
				});
			}
		},
		[modernMessaging]
	);

	// Render step content
	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<div>
						<h3 style={{ margin: '0 0 1rem 0', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>🔐 MFA Configuration</h3>
						<p style={{ color: 'V9_COLORS.TEXT.GRAY_MEDIUM', marginBottom: '1.5rem' }}>
							Configure the MFA login hint parameters for authentication.
						</p>

						<CompactAppPickerV8U
							environmentId={mfaConfig.environmentId}
							onAppSelected={handleAppSelected}
						/>

						<div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
							<div>
								<label
									htmlFor="environmentId"
									style={{
										display: 'block',
										fontWeight: 500,
										marginBottom: '0.5rem',
										color: 'V9_COLORS.TEXT.GRAY_DARK',
									}}
								>
									Environment ID
								</label>
								<input
									id="environmentId"
									type="text"
									value={mfaConfig.environmentId}
									onChange={(e) =>
										setMfaConfig((prev) => ({ ...prev, environmentId: e.target.value }))
									}
									placeholder="Enter environment ID"
									style={{
										width: '100%',
										padding: '0.75rem',
										border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
										borderRadius: '0.5rem',
										fontSize: '0.875rem',
									}}
								/>
							</div>

							<div>
								<label
									htmlFor="clientId"
									style={{
										display: 'block',
										fontWeight: 500,
										marginBottom: '0.5rem',
										color: 'V9_COLORS.TEXT.GRAY_DARK',
									}}
								>
									Client ID
								</label>
								<input
									id="clientId"
									type="text"
									value={mfaConfig.clientId}
									onChange={(e) => setMfaConfig((prev) => ({ ...prev, clientId: e.target.value }))}
									placeholder="Enter client ID"
									style={{
										width: '100%',
										padding: '0.75rem',
										border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
										borderRadius: '0.5rem',
										fontSize: '0.875rem',
									}}
								/>
							</div>

							<div>
								<label
									htmlFor="clientSecret"
									style={{
										display: 'block',
										fontWeight: 500,
										marginBottom: '0.5rem',
										color: 'V9_COLORS.TEXT.GRAY_DARK',
									}}
								>
									Client Secret
								</label>
								<input
									id="clientSecret"
									type="password"
									value={mfaConfig.clientSecret}
									onChange={(e) =>
										setMfaConfig((prev) => ({ ...prev, clientSecret: e.target.value }))
									}
									placeholder="Enter client secret"
									style={{
										width: '100%',
										padding: '0.75rem',
										border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
										borderRadius: '0.5rem',
										fontSize: '0.875rem',
									}}
								/>
							</div>

							<div>
								<label
									htmlFor="userId"
									style={{
										display: 'block',
										fontWeight: 500,
										marginBottom: '0.5rem',
										color: 'V9_COLORS.TEXT.GRAY_DARK',
									}}
								>
									User ID (Optional)
								</label>
								<input
									id="userId"
									type="text"
									value={mfaConfig.userId}
									onChange={(e) => setMfaConfig((prev) => ({ ...prev, userId: e.target.value }))}
									placeholder="Enter user ID"
									style={{
										width: '100%',
										padding: '0.75rem',
										border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
										borderRadius: '0.5rem',
										fontSize: '0.875rem',
									}}
								/>
							</div>

							<div>
								<label
									htmlFor="email"
									style={{
										display: 'block',
										fontWeight: 500,
										marginBottom: '0.5rem',
										color: 'V9_COLORS.TEXT.GRAY_DARK',
									}}
								>
									Email (Optional)
								</label>
								<input
									id="email"
									type="email"
									value={mfaConfig.email}
									onChange={(e) => setMfaConfig((prev) => ({ ...prev, email: e.target.value }))}
									placeholder="Enter email address"
									style={{
										width: '100%',
										padding: '0.75rem',
										border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
										borderRadius: '0.5rem',
										fontSize: '0.875rem',
									}}
								/>
							</div>

							<div>
								<label
									htmlFor="phoneNumber"
									style={{
										display: 'block',
										fontWeight: 500,
										marginBottom: '0.5rem',
										color: 'V9_COLORS.TEXT.GRAY_DARK',
									}}
								>
									Phone Number (Optional)
								</label>
								<input
									id="phoneNumber"
									type="tel"
									value={mfaConfig.phoneNumber}
									onChange={(e) =>
										setMfaConfig((prev) => ({ ...prev, phoneNumber: e.target.value }))
									}
									placeholder="Enter phone number"
									style={{
										width: '100%',
										padding: '0.75rem',
										border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
										borderRadius: '0.5rem',
										fontSize: '0.875rem',
									}}
								/>
							</div>
						</div>
					</div>
				);

			case 1:
				return (
					<div>
						<h3 style={{ margin: '0 0 1rem 0', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>🎫 Login Hint Token</h3>
						<p style={{ color: 'V9_COLORS.TEXT.GRAY_MEDIUM', marginBottom: '1.5rem' }}>
							Generate a login hint token to initiate the MFA authentication flow.
						</p>

						<div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
							<button
								onClick={generateLoginHintToken}
								disabled={isLoading || !validateCurrentStep()}
								type="button"
								style={{
									padding: '0.75rem 1.5rem',
									background: !isLoading && validateCurrentStep() ? 'V9_COLORS.PRIMARY.GREEN' : 'V9_COLORS.TEXT.GRAY_LIGHT',
									color: 'white',
									border: 'none',
									borderRadius: '0.375rem',
									cursor: !isLoading && validateCurrentStep() ? 'pointer' : 'not-allowed',
									fontWeight: 600,
									opacity: !isLoading && validateCurrentStep() ? 1 : 0.6,
								}}
							>
								{isLoading ? 'Generating...' : 'Generate Login Hint Token'}
							</button>
						</div>

						{loginHintToken && (
							<div>
								<h4 style={{ margin: '0 0 1rem 0', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>
									📋 Login Hint Token Response
								</h4>
								<div
									style={{
										background: 'V9_COLORS.BG.GRAY_LIGHT',
										padding: '1rem',
										borderRadius: '0.5rem',
										marginBottom: '1rem',
										border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
									}}
								>
									<div style={{ marginBottom: '0.5rem' }}>
										<strong>Token:</strong>
										<button
											onClick={() =>
												handleCopy(loginHintToken.login_hint_token, 'Login Hint Token')
											}
											type="button"
											style={{
												marginLeft: '0.5rem',
												padding: '0.25rem 0.5rem',
												background: 'V9_COLORS.PRIMARY.BLUE',
												color: 'white',
												border: 'none',
												borderRadius: '0.25rem',
												cursor: 'pointer',
												fontSize: '0.75rem',
											}}
										>
											Copy
										</button>
									</div>
									<div style={{ wordBreak: 'break-all', fontSize: '0.875rem', color: 'V9_COLORS.TEXT.GRAY_MEDIUM' }}>
										{loginHintToken.login_hint_token}
									</div>
									<div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
										<div>
											<strong>Expires In:</strong> {loginHintToken.expires_in} seconds
										</div>
										<div>
											<strong>Token Type:</strong> {loginHintToken.token_type}
										</div>
										<div>
											<strong>Scope:</strong> {loginHintToken.scope}
										</div>
										<div>
											<strong>User ID:</strong> {loginHintToken.user_id}
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				);

			case 2:
				return (
					<div>
						<h3 style={{ margin: '0 0 1rem 0', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>🔐 MFA Authentication</h3>
						<p style={{ color: 'V9_COLORS.TEXT.GRAY_MEDIUM', marginBottom: '1.5rem' }}>
							Complete the MFA authentication challenge to verify your identity.
						</p>

						<div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
							<button
								onClick={startMFAAuthentication}
								disabled={isLoading || !validateCurrentStep()}
								type="button"
								style={{
									padding: '0.75rem 1.5rem',
									background: !isLoading && validateCurrentStep() ? 'V9_COLORS.PRIMARY.GREEN' : 'V9_COLORS.TEXT.GRAY_LIGHT',
									color: 'white',
									border: 'none',
									borderRadius: '0.375rem',
									cursor: !isLoading && validateCurrentStep() ? 'pointer' : 'not-allowed',
									fontWeight: 600,
									opacity: !isLoading && validateCurrentStep() ? 1 : 0.6,
								}}
							>
								{isLoading ? 'Authenticating...' : 'Start MFA Authentication'}
							</button>
						</div>

						{mfaResponse && (
							<div>
								<h4 style={{ margin: '0 0 1rem 0', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>
									📋 MFA Challenge Response
								</h4>
								<div
									style={{
										background: 'V9_COLORS.BG.GRAY_LIGHT',
										padding: '1rem',
										borderRadius: '0.5rem',
										marginBottom: '1rem',
										border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
									}}
								>
									<div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
										<div>
											<strong>Flow ID:</strong> {mfaResponse.flowId}
										</div>
										<div>
											<strong>Status:</strong> {mfaResponse.status}
										</div>
										<div>
											<strong>User ID:</strong> {mfaResponse.userId}
										</div>
										{mfaResponse.user && (
											<div>
												<strong>User Name:</strong> {mfaResponse.user.name}
											</div>
										)}
									</div>

									{mfaResponse.challenges.length > 0 && (
										<div>
											<strong>Challenges:</strong>
											<ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
												{mfaResponse.challenges.map((challenge, index) => (
													<li key={index} style={{ color: 'V9_COLORS.TEXT.GRAY_MEDIUM' }}>
														<strong>{challenge.type}:</strong> {challenge.detail}
													</li>
												))}
											</ul>
										</div>
									)}

									{mfaResponse.authorizeUrl && (
										<div style={{ marginTop: '1rem' }}>
											<strong>Authorization URL:</strong>
											<button
												onClick={() => handleCopy(mfaResponse.authorizeUrl!, 'Authorization URL')}
												type="button"
												style={{
													marginLeft: '0.5rem',
													padding: '0.25rem 0.5rem',
													background: 'V9_COLORS.PRIMARY.BLUE',
													color: 'white',
													border: 'none',
													borderRadius: '0.25rem',
													cursor: 'pointer',
													fontSize: '0.75rem',
												}}
											>
												Copy
											</button>
											<div
												style={{
													wordBreak: 'break-all',
													fontSize: '0.875rem',
													color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
													marginTop: '0.5rem',
												}}
											>
												{mfaResponse.authorizeUrl}
											</div>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				);

			case 3:
				return (
					<div>
						<h3 style={{ margin: '0 0 1rem 0', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>🎫 Access Token</h3>
						<p style={{ color: 'V9_COLORS.TEXT.GRAY_MEDIUM', marginBottom: '1.5rem' }}>
							Receive the final access token after completing MFA authentication.
						</p>

						<div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
							<button
								onClick={completeMFAFlow}
								disabled={isLoading || !validateCurrentStep()}
								type="button"
								style={{
									padding: '0.75rem 1.5rem',
									background: !isLoading && validateCurrentStep() ? 'V9_COLORS.PRIMARY.GREEN' : 'V9_COLORS.TEXT.GRAY_LIGHT',
									color: 'white',
									border: 'none',
									borderRadius: '0.375rem',
									cursor: !isLoading && validateCurrentStep() ? 'pointer' : 'not-allowed',
									fontWeight: 600,
									opacity: !isLoading && validateCurrentStep() ? 1 : 0.6,
								}}
							>
								{isLoading ? 'Completing...' : 'Complete MFA Flow'}
							</button>
						</div>

						{completionResponse && (
							<div>
								<h4 style={{ margin: '0 0 1rem 0', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>📋 Final Access Token</h4>
								<div
									style={{
										background: 'V9_COLORS.BG.GRAY_LIGHT',
										padding: '1rem',
										borderRadius: '0.5rem',
										marginBottom: '1rem',
										border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
									}}
								>
									<div style={{ marginBottom: '0.5rem' }}>
										<strong>Access Token:</strong>
										<button
											onClick={() => handleCopy(completionResponse.accessToken!, 'Access Token')}
											type="button"
											style={{
												marginLeft: '0.5rem',
												padding: '0.25rem 0.5rem',
												background: 'V9_COLORS.PRIMARY.BLUE',
												color: 'white',
												border: 'none',
												borderRadius: '0.25rem',
												cursor: 'pointer',
												fontSize: '0.75rem',
											}}
										>
											Copy
										</button>
									</div>
									<div style={{ wordBreak: 'break-all', fontSize: '0.875rem', color: 'V9_COLORS.TEXT.GRAY_MEDIUM' }}>
										{completionResponse.accessToken}
									</div>
									<div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
										<div>
											<strong>Token Type:</strong> {completionResponse.tokenType}
										</div>
										<div>
											<strong>Expires In:</strong> {completionResponse.expiresIn} seconds
										</div>
										<div>
											<strong>Scope:</strong> {completionResponse.scope}
										</div>
										<div>
											<strong>Flow ID:</strong> {completionResponse.flowId}
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				);

			case 4:
				return (
					<div>
						<h3 style={{ margin: '0 0 1rem 0', color: 'V9_COLORS.PRIMARY.GREEN' }}>✅ Flow Completion</h3>
						<p style={{ color: 'V9_COLORS.PRIMARY.GREEN', marginBottom: '1.5rem' }}>
							MFA login hint flow has been completed successfully!
						</p>

						<div
							style={{
								background: '#f0fdf4',
								padding: '1.5rem',
								borderRadius: '0.5rem',
								marginBottom: '1.5rem',
								border: '1px solid V9_COLORS.BG.SUCCESS_BORDER',
							}}
						>
							<h4 style={{ margin: '0 0 0.5rem 0', color: 'V9_COLORS.PRIMARY.GREEN' }}>Summary:</h4>
							<ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'V9_COLORS.PRIMARY.GREEN' }}>
								<li>✅ Configured MFA login hint parameters</li>
								<li>✅ Generated login hint token for MFA</li>
								<li>✅ Completed MFA authentication challenge</li>
								<li>✅ Obtained final access token</li>
								<li>✅ Completed OAuth 2.0 MFA Login Hint Flow</li>
							</ul>
						</div>

						<p style={{ color: 'V9_COLORS.PRIMARY.GREEN', margin: 0 }}>
							<strong>Next Steps:</strong> Use the access token to authenticate with protected
							resources.
						</p>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div>
			{messageState.waitScreen && (
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
						<div
							style={{
								width: '40px',
								height: '40px',
								border: '4px solid V9_COLORS.TEXT.GRAY_LIGHTER',
								borderTop: '4px solid V9_COLORS.PRIMARY.BLUE',
								borderRadius: '50%',
								animation: 'spin 1s linear infinite',
								margin: '0 auto 1rem',
							}}
						/>
						<p>{messageState.waitScreen.message}</p>
					</div>
				</div>
			)}
			{messageState.criticalError && (
				<div
					style={{
						position: 'fixed',
						top: '1rem',
						right: '1rem',
						background: 'V9_COLORS.PRIMARY.RED',
						color: 'white',
						padding: '1rem',
						borderRadius: '0.5rem',
						zIndex: 9999,
					}}
				>
					<strong>Error:</strong>
					<p>{messageState.criticalError.message}</p>
				</div>
			)}
			<V9FlowHeader
				flowId="mfa-login-hint"
				customConfig={{
					title: 'MFA Login Hint Flow',
					subtitle: 'Multi-Factor Authentication using Login Hint Token',
				}}
			/>

			<div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
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
						{STEP_METADATA.map((step, index) => (
							<div
								key={index}
								style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
							>
								<div
									style={{
										width: '32px',
										height: '32px',
										borderRadius: '50%',
										background: index <= currentStep ? 'V9_COLORS.PRIMARY.GREEN' : 'V9_COLORS.TEXT.GRAY_LIGHTER',
										color: index <= currentStep ? 'white' : 'V9_COLORS.TEXT.GRAY_MEDIUM',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '0.875rem',
										fontWeight: 600,
										marginBottom: '0.5rem',
									}}
								>
									{index + 1}
								</div>
								<div style={{ fontSize: '0.75rem', textAlign: 'center', color: 'V9_COLORS.TEXT.GRAY_MEDIUM' }}>
									{step.title.split(' ')[0]}
								</div>
							</div>
						))}
					</div>
					<div
						style={{
							background: 'V9_COLORS.TEXT.GRAY_LIGHTER',
							height: '4px',
							borderRadius: '2px',
							overflow: 'hidden',
						}}
					>
						<div
							style={{
								background: 'V9_COLORS.PRIMARY.GREEN',
								height: '100%',
								width: `${((currentStep + 1) / STEP_METADATA.length) * 100}%`,
								transition: 'width 0.3s ease',
							}}
						/>
					</div>
				</div>

				{/* Step Content */}
				<div style={{ marginBottom: '2rem' }}>{renderStepContent()}</div>

				{/* Step Navigation */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<button
						onClick={goToPreviousStep}
						disabled={currentStep === 0}
						type="button"
						style={{
							padding: '0.75rem 1.5rem',
							background: currentStep === 0 ? 'V9_COLORS.TEXT.GRAY_LIGHTER' : 'V9_COLORS.TEXT.GRAY_MEDIUM',
							color: 'white',
							border: 'none',
							borderRadius: '0.375rem',
							cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
							fontWeight: 600,
							opacity: currentStep === 0 ? 0.6 : 1,
						}}
					>
						Previous
					</button>

					<div style={{ display: 'flex', gap: '0.5rem' }}>
						{STEP_METADATA.map((_, index) => (
							<button
								key={index}
								onClick={() => goToStep(index)}
								type="button"
								style={{
									padding: '0.5rem 1rem',
									background: index === currentStep ? 'V9_COLORS.PRIMARY.GREEN' : 'V9_COLORS.TEXT.GRAY_LIGHTER',
									color: index === currentStep ? 'white' : 'V9_COLORS.TEXT.GRAY_MEDIUM',
									border: 'none',
									borderRadius: '0.375rem',
									cursor: 'pointer',
									fontSize: '0.875rem',
									fontWeight: index === currentStep ? 600 : 400,
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
									? 'V9_COLORS.TEXT.GRAY_LIGHTER'
									: 'V9_COLORS.PRIMARY.GREEN',
							color: 'white',
							border: 'none',
							borderRadius: '0.375rem',
							cursor:
								currentStep === STEP_METADATA.length - 1 || !validateCurrentStep()
									? 'not-allowed'
									: 'pointer',
							fontWeight: 600,
							opacity: currentStep === STEP_METADATA.length - 1 || !validateCurrentStep() ? 0.6 : 1,
						}}
					>
						{currentStep === STEP_METADATA.length - 1 ? 'Complete' : 'Next'}
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
								color: 'V9_COLORS.PRIMARY.GREEN_DARK',
								fontSize: '1.25rem',
								fontWeight: 600,
							}}
						>
							🎉 MFA Flow Completion Summary
						</h3>
						<div
							style={{
								background: 'white',
								borderRadius: '0.375rem',
								padding: '1rem',
								marginBottom: '1rem',
							}}
						>
							<h4 style={{ margin: '0 0 0.5rem 0', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>Achievements:</h4>
							<ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#4b5563' }}>
								<li>✅ Login Hint Token generated</li>
								<li>✅ MFA Authentication completed</li>
								<li>✅ Multi-factor authentication successful</li>
								<li>✅ Flow steps: {STEP_METADATA.length} completed</li>
							</ul>
						</div>
						{mfaResponse && (
							<div
								style={{
									background: 'white',
									borderRadius: '0.375rem',
									padding: '1rem',
								}}
							>
								<h4 style={{ margin: '0 0 0.5rem 0', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>
									Authentication Details:
								</h4>
								<div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
									<p>
										<strong>Flow ID:</strong> {mfaResponse.flowId}
									</p>
									<p>
										<strong>Status:</strong> {mfaResponse.status}
									</p>
									<p>
										<strong>User ID:</strong> {mfaResponse.userId}
									</p>
									<p>
										<strong>Challenges:</strong> {mfaResponse.challenges.length} completed
									</p>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default MFALoginHintFlowV9;
