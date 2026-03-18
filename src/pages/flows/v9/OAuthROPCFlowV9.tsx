// src/pages/flows/v9/OAuthROPCFlowV9.tsx
// lint-file-disable: token-value-in-jsx
// OAuth Resource Owner Password Credentials Flow - V9 Implementation with Modern Messaging

import { useCallback, useEffect, useState } from 'react';
import { MockApiCallDisplay } from '../../../components/MockApiCallDisplay';
import { usePageScroll } from '../../../hooks/usePageScroll';
import { getButtonStyles, getStepStyles, V9_COLORS } from '../../../services/v9/V9ColorStandards';
import { V9CredentialStorageService } from '../../../services/v9/V9CredentialStorageService';
import { V9FlowRestartButton } from '../../../services/v9/V9FlowRestartButton';
import { V9ModernMessagingService } from '../../../services/v9/V9ModernMessagingService';
import V9FlowHeader from '../../../services/v9/v9FlowHeaderService';
import type { DiscoveredApp } from '../../../v8/components/AppPickerV8';
import { CompactAppPickerV8U } from '../../../v8u/components/CompactAppPickerV8U';

// Types
interface ROPCConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	username: string;
	password: string;
	scope?: string;
}

interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	scope: string;
}

interface UserInfo {
	sub: string;
	name: string;
	email: string;
	email_verified: boolean;
	preferred_username?: string;
}

/**
 * Utility function to mask tokens for security
 * Shows first 8 characters, masks middle, shows last 4 characters
 */
const maskToken = (token: string): string => {
	if (!token || token.length <= 12) {
		return '••••••••';
	}
	return `${token.slice(0, 8)}...${token.slice(-4)}`;
};

// Step metadata
const STEP_METADATA = [
	{
		title: 'Setup',
		subtitle: 'Configure OAuth ROPC credentials',
	},
	{
		title: 'Token Request',
		subtitle: 'Request access token with credentials',
	},
	{
		title: 'User Info',
		subtitle: 'Fetch user information',
	},
	{
		title: 'Token Refresh',
		subtitle: 'Refresh access token',
	},
	{
		title: 'Complete',
		subtitle: 'Review and complete ROPC flow',
	},
];

const OAuthROPCFlowV9: React.FC = () => {
	const { scrollToTopAfterAction } = usePageScroll();
	const modernMessaging = V9ModernMessagingService.getInstance();

	// State management
	const [currentStep, setCurrentStep] = useState(0);

	// ROPC Configuration
	const [ropcConfig, setRopcConfig] = useState<ROPCConfig>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		username: '',
		password: '',
		scope: 'openid profile email',
	});

	// Load stored credentials on mount
	useEffect(() => {
		const synced = V9CredentialStorageService.loadSync('v9:ropc');
		if (synced) {
			setRopcConfig((prev) => ({
				...prev,
				...(synced.clientId ? { clientId: synced.clientId } : {}),
				...(synced.clientSecret ? { clientSecret: synced.clientSecret } : {}),
				...(synced.environmentId ? { environmentId: synced.environmentId } : {}),
			}));
		}
		V9CredentialStorageService.load('v9:ropc').then((creds) => {
			if (creds) setRopcConfig((prev) => ({ ...prev, ...creds }));
		});
	}, []);

	const saveRopcCredentials = useCallback((config: ROPCConfig) => {
		V9CredentialStorageService.save(
			'v9:ropc',
			{
				clientId: config.clientId,
				clientSecret: config.clientSecret,
				environmentId: config.environmentId,
			},
			config.environmentId ? { environmentId: config.environmentId } : {}
		);
	}, []);

	const handleRopcAppSelected = useCallback(
		(app: DiscoveredApp) => {
			setRopcConfig((prev) => {
				const updated = { ...prev, clientId: app.id };
				saveRopcCredentials(updated);
				return updated;
			});
		},
		[saveRopcCredentials]
	);

	// Token and response states
	const [tokenResponse, setTokenResponse] = useState<TokenResponse | null>(null);
	const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
	const [refreshedToken, setRefreshedToken] = useState<TokenResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Step validation
	const validateCurrentStep = useCallback(() => {
		switch (currentStep) {
			case 0: // Setup
				return ropcConfig.environmentId && ropcConfig.clientId && ropcConfig.clientSecret;
			case 1: // Token Request
				return tokenResponse !== null;
			case 2: // User Info
				return userInfo !== null;
			case 3: // Token Refresh
				return refreshedToken !== null;
			case 4: // Complete
				return true;
			default:
				return false;
		}
	}, [currentStep, ropcConfig, tokenResponse, userInfo, refreshedToken]);

	// Restart functionality
	const restartFlow = useCallback(() => {
		// Reset all state
		setCurrentStep(0);
		setRopcConfig({
			environmentId: '',
			clientId: '',
			clientSecret: '',
			username: '',
			password: '',
			scope: 'openid profile email',
		});
		setTokenResponse(null);
		setUserInfo(null);
		setRefreshedToken(null);
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

	// Step navigation
	useEffect(() => {
		scrollToTopAfterAction();
	}, [scrollToTopAfterAction]);

	const goToStep = useCallback(
		(step: number) => {
			if (step >= 0 && step < STEP_METADATA.length) {
				setCurrentStep(step);
				scrollToTopAfterAction();
			}
		},
		[scrollToTopAfterAction]
	);

	const goToNextStep = useCallback(() => {
		if (currentStep < STEP_METADATA.length - 1 && validateCurrentStep()) {
			goToStep(currentStep + 1);
		}
	}, [currentStep, goToStep, validateCurrentStep]);

	const goToPreviousStep = useCallback(() => {
		if (currentStep > 0) {
			goToStep(currentStep - 1);
		}
	}, [currentStep, goToStep]);

	// API calls
	const requestAccessToken = useCallback(async () => {
		setIsLoading(true);
		try {
			// Mock implementation - replace with actual API call
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const mockResponse: TokenResponse = {
				access_token: `mock_access_token_${Date.now()}`,
				token_type: 'Bearer',
				expires_in: 3600,
				refresh_token: `mock_refresh_token_${Date.now()}`,
				scope: ropcConfig.scope || 'openid profile email',
			};

			setTokenResponse(mockResponse);
			modernMessaging.showBanner({
				type: 'success',
				title: 'Access Token Received',
				message: 'Successfully obtained access token using ROPC flow',
				dismissible: true,
			});
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'Token Request Failed',
				message: 'Failed to obtain access token. Please check your credentials.',
				recoveryActions: [
					{
						label: 'Retry',
						action: () => requestAccessToken(),
					},
				],
			});
		} finally {
			setIsLoading(false);
		}
	}, [ropcConfig, modernMessaging]);

	const fetchUserInfo = useCallback(async () => {
		if (!tokenResponse?.access_token) return;

		setIsLoading(true);
		try {
			// Mock implementation - replace with actual API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			const mockUserInfo: UserInfo = {
				sub: ropcConfig.username,
				name: 'Test User',
				email: ropcConfig.username.includes('@')
					? ropcConfig.username
					: `${ropcConfig.username}@example.com`,
				email_verified: true,
				preferred_username: ropcConfig.username,
			};

			setUserInfo(mockUserInfo);
			modernMessaging.showBanner({
				type: 'success',
				title: 'User Info Retrieved',
				message: 'Successfully fetched user information',
				dismissible: true,
			});
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'User Info Failed',
				message: 'Failed to fetch user information. Please try again.',
				recoveryActions: [
					{
						label: 'Retry',
						action: () => fetchUserInfo(),
					},
				],
			});
		} finally {
			setIsLoading(false);
		}
	}, [tokenResponse, ropcConfig, modernMessaging]);

	const refreshToken = useCallback(async () => {
		if (!tokenResponse?.refresh_token) return;

		setIsLoading(true);
		try {
			// Mock implementation - replace with actual API call
			await new Promise((resolve) => setTimeout(resolve, 1500));

			const mockRefreshedToken: TokenResponse = {
				access_token: `refreshed_access_token_${Date.now()}`,
				token_type: 'Bearer',
				expires_in: 3600,
				refresh_token: tokenResponse.refresh_token,
				scope: ropcConfig.scope || 'openid profile email',
			};

			setRefreshedToken(mockRefreshedToken);
			modernMessaging.showBanner({
				type: 'success',
				title: 'Token Refreshed',
				message: 'Successfully refreshed access token',
				dismissible: true,
			});
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'Token Refresh Failed',
				message: 'Failed to refresh access token. Please try again.',
				recoveryActions: [
					{
						label: 'Retry',
						action: () => refreshToken(),
					},
				],
			});
		} finally {
			setIsLoading(false);
		}
	}, [tokenResponse, ropcConfig, modernMessaging]);

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
						<h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>🔐 ROPC Configuration</h3>
						<p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
							Configure the OAuth Resource Owner Password Credentials parameters.
						</p>

						<CompactAppPickerV8U
							environmentId={ropcConfig.environmentId}
							onAppSelected={handleRopcAppSelected}
						/>

						<div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
							<div>
								<label
									htmlFor="environmentId"
									style={{
										display: 'block',
										fontWeight: 500,
										marginBottom: '0.5rem',
										color: '#1f2937',
									}}
								>
									Environment ID
								</label>
								<input
									id="environmentId"
									type="text"
									value={ropcConfig.environmentId}
									onChange={(e) =>
										setRopcConfig((prev) => ({ ...prev, environmentId: e.target.value }))
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
										color: '#1f2937',
									}}
								>
									Client ID
								</label>
								<input
									id="clientId"
									type="text"
									value={ropcConfig.clientId}
									onChange={(e) => setRopcConfig((prev) => ({ ...prev, clientId: e.target.value }))}
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
										color: '#1f2937',
									}}
								>
									Client Secret
								</label>
								<input
									id="clientSecret"
									type="password"
									value={ropcConfig.clientSecret}
									onChange={(e) =>
										setRopcConfig((prev) => ({ ...prev, clientSecret: e.target.value }))
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
									htmlFor="username"
									style={{
										display: 'block',
										fontWeight: 500,
										marginBottom: '0.5rem',
										color: '#1f2937',
									}}
								>
									Username
								</label>
								<input
									id="username"
									type="text"
									value={ropcConfig.username}
									onChange={(e) => setRopcConfig((prev) => ({ ...prev, username: e.target.value }))}
									placeholder="Enter username"
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
									htmlFor="password"
									style={{
										display: 'block',
										fontWeight: 500,
										marginBottom: '0.5rem',
										color: '#1f2937',
									}}
								>
									Password
								</label>
								<input
									id="password"
									type="password"
									value={ropcConfig.password}
									onChange={(e) => setRopcConfig((prev) => ({ ...prev, password: e.target.value }))}
									placeholder="Enter password"
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
									htmlFor="scope"
									style={{
										display: 'block',
										fontWeight: 500,
										marginBottom: '0.5rem',
										color: '#1f2937',
									}}
								>
									Scope (Optional)
								</label>
								<input
									id="scope"
									type="text"
									value={ropcConfig.scope}
									onChange={(e) => setRopcConfig((prev) => ({ ...prev, scope: e.target.value }))}
									placeholder="openid profile email"
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
						<h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>🎫 Access Token Request</h3>
						<p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
							Request an access token using the Resource Owner Password Credentials flow.
						</p>

						<div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
							<button
								onClick={requestAccessToken}
								disabled={isLoading || !validateCurrentStep()}
								type="button"
								style={{
									padding: '0.75rem 1.5rem',
									...getButtonStyles('primary', isLoading || !validateCurrentStep()),
									fontWeight: 600,
								}}
							>
								{isLoading ? 'Requesting...' : 'Request Access Token'}
							</button>
						</div>

						{tokenResponse && (
							<div
								style={{
									background: '#f8fafc',
									padding: '1rem',
									borderRadius: '0.5rem',
									marginBottom: '1rem',
									border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
								}}
							>
								<div style={{ marginBottom: '0.5rem' }}>
									<strong>Access Token:</strong>
									<button
										onClick={() => handleCopy(tokenResponse.access_token, 'Access Token')}
										type="button"
										style={{
											marginLeft: '0.5rem',
											padding: '0.25rem 0.5rem',
											background: '#3b82f6',
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
								<div style={{ wordBreak: 'break-all', fontSize: '0.875rem', color: '#6b7280' }}>
									{maskToken(tokenResponse.access_token)}
								</div>

								<div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
									<div>
										<strong>Token Type:</strong> {tokenResponse.token_type}
									</div>
									<div>
										<strong>Expires In:</strong> {tokenResponse.expires_in} seconds
									</div>
									<div>
										<strong>Scope:</strong> {tokenResponse.scope}
									</div>
									{tokenResponse.refresh_token && (
										<div>
											<strong>Refresh Token:</strong>
											<button
												onClick={() => handleCopy(tokenResponse.refresh_token!, 'Refresh Token')}
												type="button"
												style={{
													marginLeft: '0.5rem',
													padding: '0.25rem 0.5rem',
													background: '#3b82f6',
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
												style={{ wordBreak: 'break-all', color: '#6b7280', marginTop: '0.25rem' }}
											>
												{maskToken(tokenResponse.refresh_token)}
											</div>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Mock API Call Example */}
						{ropcConfig.environmentId && ropcConfig.clientId && (
							<MockApiCallDisplay
								title="Resource Owner Password Credentials Token Request"
								method="POST"
								url={`https://auth.pingone.com/${ropcConfig.environmentId}/as/token`}
								headers={{
									'Content-Type': 'application/x-www-form-urlencoded',
									Accept: 'application/json',
								}}
								body={{
									grant_type: 'password',
									username: ropcConfig.username || 'user@example.com',
									password: '***REDACTED***',
									client_id: ropcConfig.clientId,
									client_secret: '***REDACTED***',
									scope: ropcConfig.scope || 'openid profile email',
								}}
								response={{
									status: 200,
									statusText: 'OK',
									data: {
										access_token:
											'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20iLCJzdWIiOiJ1c2VyLTEyMzQ1IiwiYXVkIjoiY2xpZW50LWlkIiwiZXhwIjoxNjk3NDMzMDAwLCJpYXQiOjE2OTc0Mjk0MDAsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwifQ.signature',
										token_type: 'Bearer',
										expires_in: 3600,
										refresh_token: 'refresh_token_value_here',
										scope: ropcConfig.scope || 'openid profile email',
									},
									headers: {
										'Content-Type': 'application/json',
										'Cache-Control': 'no-store',
										Pragma: 'no-cache',
									},
								}}
								note="This is a mock API call example. In a real implementation, the password and client_secret would be sent securely, and the access_token would be a valid JWT."
								description="The ROPC flow exchanges user credentials directly for an access token. This flow should only be used when the client is trusted and other OAuth flows aren't suitable."
								defaultExpanded={false}
							/>
						)}
					</div>
				);

			case 2:
				return (
					<div>
						<h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>👤 User Information</h3>
						<p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
							Fetch user information using the access token.
						</p>

						<div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
							<button
								onClick={fetchUserInfo}
								disabled={isLoading || !validateCurrentStep()}
								type="button"
								style={{
									padding: '0.75rem 1.5rem',
									...getButtonStyles('primary', isLoading || !validateCurrentStep()),
									fontWeight: 600,
								}}
							>
								{isLoading ? 'Fetching...' : 'Fetch User Info'}
							</button>
						</div>

						{userInfo && (
							<div
								style={{
									background: '#f8fafc',
									padding: '1rem',
									borderRadius: '0.5rem',
									marginBottom: '1rem',
									border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
								}}
							>
								<h4 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>User Profile</h4>
								<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1f2937' }}>
									<li>
										<strong>Subject:</strong> {userInfo.sub}
									</li>
									<li>
										<strong>Name:</strong> {userInfo.name}
									</li>
									<li>
										<strong>Email:</strong> {userInfo.email}
									</li>
									<li>
										<strong>Email Verified:</strong> {userInfo.email_verified ? '✅ Yes' : '❌ No'}
									</li>
									{userInfo.preferred_username && (
										<li>
											<strong>Preferred Username:</strong> {userInfo.preferred_username}
										</li>
									)}
								</ul>
							</div>
						)}

						{/* Mock API Call Example */}
						{ropcConfig.environmentId && tokenResponse?.access_token && (
							<MockApiCallDisplay
								title="OpenID Connect UserInfo Request"
								method="GET"
								url={`https://auth.pingone.com/${ropcConfig.environmentId}/as/userinfo`}
								headers={{
									Authorization: `Bearer ${tokenResponse.access_token.substring(0, 20)}...`,
									Accept: 'application/json',
								}}
								response={{
									status: 200,
									statusText: 'OK',
									data: {
										sub: userInfo?.sub || 'user-12345',
										name: userInfo?.name || 'John Doe',
										email: userInfo?.email || 'john.doe@example.com',
										email_verified: userInfo?.email_verified ?? true,
										preferred_username: userInfo?.preferred_username || 'john.doe',
									},
									headers: {
										'Content-Type': 'application/json',
									},
								}}
								note="The access token must be valid and include the openid scope to access this endpoint."
								description="Retrieve user profile information using the access token obtained from the token endpoint."
								defaultExpanded={false}
							/>
						)}
					</div>
				);

			case 3:
				return (
					<div>
						<h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>🔄 Token Refresh</h3>
						<p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
							Refresh the access token using the refresh token.
						</p>

						<div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
							<button
								onClick={refreshToken}
								disabled={isLoading || !validateCurrentStep()}
								type="button"
								style={{
									padding: '0.75rem 1.5rem',
									...getButtonStyles('primary', isLoading || !validateCurrentStep()),
									fontWeight: 600,
								}}
							>
								{isLoading ? 'Refreshing...' : 'Refresh Token'}
							</button>
						</div>

						{refreshedToken && (
							<div
								style={{
									background: '#f8fafc',
									padding: '1rem',
									borderRadius: '0.5rem',
									marginBottom: '1rem',
									border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
								}}
							>
								<div style={{ marginBottom: '0.5rem' }}>
									<strong>Refreshed Access Token:</strong>
									<button
										onClick={() =>
											handleCopy(refreshedToken.access_token, 'Refreshed Access Token')
										}
										type="button"
										style={{
											marginLeft: '0.5rem',
											padding: '0.25rem 0.5rem',
											background: '#3b82f6',
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
								<div style={{ wordBreak: 'break-all', fontSize: '0.875rem', color: '#6b7280' }}>
									{maskToken(refreshedToken.access_token)}
								</div>

								<div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
									<div>
										<strong>Token Type:</strong> {refreshedToken.token_type}
									</div>
									<div>
										<strong>Expires In:</strong> {refreshedToken.expires_in} seconds
									</div>
									<div>
										<strong>Scope:</strong> {refreshedToken.scope}
									</div>
								</div>
							</div>
						)}

						{/* Mock API Call Example */}
						{ropcConfig.environmentId && tokenResponse?.refresh_token && (
							<MockApiCallDisplay
								title="OAuth 2.0 Token Refresh Request"
								method="POST"
								url={`https://auth.pingone.com/${ropcConfig.environmentId}/as/token`}
								headers={{
									'Content-Type': 'application/x-www-form-urlencoded',
									Accept: 'application/json',
								}}
								body={{
									grant_type: 'refresh_token',
									refresh_token: '***REDACTED***',
									client_id: ropcConfig.clientId,
									client_secret: '***REDACTED***',
								}}
								response={{
									status: 200,
									statusText: 'OK',
									data: {
										access_token:
											'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20iLCJzdWIiOiJ1c2VyLTEyMzQ1IiwiYXVkIjoiY2xpZW50LWlkIiwiZXhwIjoxNjk3NDMzMDAwLCJpYXQiOjE2OTc0Mjk0MDAsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwifQ.refreshed_signature',
										token_type: 'Bearer',
										expires_in: 3600,
										refresh_token: 'new_refresh_token_value_here',
										scope: ropcConfig.scope || 'openid profile email',
									},
									headers: {
										'Content-Type': 'application/json',
										'Cache-Control': 'no-store',
										Pragma: 'no-cache',
									},
								}}
								note="The refresh token must be valid and not expired. Some implementations may return a new refresh token."
								description="Use the refresh token to obtain a new access token without requiring the user to provide credentials again."
								defaultExpanded={false}
							/>
						)}
					</div>
				);

			case 4:
				return (
					<div>
						<h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>🎉 ROPC Flow Complete</h3>
						<p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
							Successfully completed the OAuth Resource Owner Password Credentials flow.
						</p>

						<div
							style={{
								background: '#f0fdf4',
								padding: '1rem',
								borderRadius: '0.5rem',
								marginBottom: '1rem',
								border: '1px solid V9_COLORS.BG.SUCCESS_BORDER',
							}}
						>
							<h4 style={{ margin: '0 0 1rem 0', color: '#10b981' }}>✅ Completed Steps</h4>
							<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#10b981' }}>
								<li>✅ Configured ROPC credentials</li>
								<li>✅ Obtained access token with username/password</li>
								<li>✅ Fetched user information</li>
								<li>✅ Refreshed access token</li>
								<li>✅ Completed OAuth 2.0 ROPC Flow</li>
							</ul>
							<p style={{ color: '#10b981', margin: '1rem 0 0 0' }}>
								<strong>Next Steps:</strong> Use the access token to authenticate with protected
								resources.
							</p>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div>
			<V9FlowHeader
				flowId="oauth-ropc-v9"
				customConfig={{
					flowType: 'pingone',
					title: 'OAuth ROPC Flow',
					subtitle: 'Resource Owner Password Credentials Flow',
				}}
			/>

			<div style={{ maxWidth: '90rem', margin: '0 auto', padding: '2rem' }}>
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
										...getStepStyles(index === currentStep, index < currentStep),
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
								<div style={{ fontSize: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
									{step.title.split(' ')[0]}
								</div>
							</div>
						))}
					</div>
					<div
						style={{
							background: '#e5e7eb',
							height: '4px',
							borderRadius: '2px',
							overflow: 'hidden',
						}}
					>
						<div
							style={{
								background: V9_COLORS.PRIMARY.GREEN,
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
						type="button"
						onClick={goToPreviousStep}
						disabled={currentStep === 0}
						style={{
							padding: '0.75rem 1.5rem',
							background: currentStep === 0 ? '#e5e7eb' : '#6b7280',
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
								type="button"
								onClick={() => goToStep(index)}
								style={{
									padding: '0.5rem 1rem',
									...getStepStyles(index === currentStep, false),
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
						type="button"
						onClick={goToNextStep}
						disabled={currentStep === STEP_METADATA.length - 1 || !validateCurrentStep()}
						style={{
							padding: '0.75rem 1.5rem',
							...getButtonStyles(
								'primary',
								currentStep === STEP_METADATA.length - 1 || !validateCurrentStep()
							),
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
								color: '#059669',
								fontSize: '1.25rem',
								fontWeight: 600,
							}}
						>
							🎉 ROPC Flow Completion Summary
						</h3>
						<div
							style={{
								background: 'white',
								borderRadius: '0.375rem',
								padding: '1rem',
								marginBottom: '1rem',
							}}
						>
							<h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>Achievements:</h4>
							<ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#4b5563' }}>
								<li>✅ Resource Owner credentials configured</li>
								<li>✅ OAuth ROPC request completed</li>
								<li>✅ Access token obtained successfully</li>
								<li>✅ Flow steps: {STEP_METADATA.length} completed</li>
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
										<strong>Token Type:</strong> {tokenResponse.token_type}
									</p>
									<p>
										<strong>Expires In:</strong> {tokenResponse.expires_in} seconds
									</p>
									<p>
										<strong>Scope:</strong> {tokenResponse.scope}
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

export default OAuthROPCFlowV9;
