// src/components/flow/createV7RMOIDCResourceOwnerPasswordSteps.tsx - V7RM (Mock because PingOne doesn't support this flow)

import { FiAlertTriangle, FiKey, FiLock, FiRefreshCw, FiShield, FiUser } from '@icons';
import type { V7RMOIDCResourceOwnerPasswordController } from '../../hooks/useV7RMOIDCResourceOwnerPasswordController';
import type { EnhancedFlowStep } from '../EnhancedStepFlowV2';
import { InfoBox } from '../steps/CommonSteps';

interface CreateV7RMOIDCResourceOwnerPasswordStepsParams {
	controller: V7RMOIDCResourceOwnerPasswordController;
}

const createV7RMOIDCResourceOwnerPasswordSteps = ({
	controller,
}: CreateV7RMOIDCResourceOwnerPasswordStepsParams): EnhancedFlowStep[] => {
	const {
		credentials,
		setCredentials,
		saveCredentials,
		hasCredentialsSaved,
		hasUnsavedCredentialChanges,
		isSavingCredentials,
		isAuthenticating,
		authenticateUser,
		tokens,
		userInfo,
		isFetchingUserInfo,
		fetchUserInfo,
		refreshTokens,
		refreshedTokens,
		isRefreshingTokens,
		resetFlow,
		hasStepResult,
		saveStepResult,
		stepManager,
	} = controller;

	return [
		// Step 1: Setup Mock Credentials
		{
			id: 'setup-credentials',
			title: 'Setup Mock Credentials',
			description: 'Configure mock PingOne credentials and user credentials for the simulation',
			icon: <FiUser />,
			content: (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
					<InfoBox type="warning">
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
							<strong>⚠️ Mock Implementation Notice</strong>
							<span>
								This is a simulated flow for educational purposes. No real authentication occurs.
								PingOne does not support the Resource Owner Password flow.
							</span>
						</div>
					</InfoBox>

					<div style={{ display: 'grid', gap: '1rem' }}>
						<div>
							<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
								Mock Environment ID
							</label>
							<input
								type="text"
								value={credentials.environmentId}
								onChange={(e) => setCredentials({ ...credentials, environmentId: e.target.value })}
								style={{
									width: '100%',
									padding: '0.75rem',
									border: '1px solid #d1d5db',
									borderRadius: '0.5rem',
									fontSize: '1rem',
								}}
								placeholder="mock-env-12345"
							/>
						</div>

						<div>
							<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
								Mock Client ID
							</label>
							<input
								type="text"
								value={credentials.clientId}
								onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
								style={{
									width: '100%',
									padding: '0.75rem',
									border: '1px solid #d1d5db',
									borderRadius: '0.5rem',
									fontSize: '1rem',
								}}
								placeholder="mock-client-id"
							/>
						</div>

						<div>
							<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
								Mock Client Secret
							</label>
							<input
								type="password"
								value={credentials.clientSecret}
								onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
								style={{
									width: '100%',
									padding: '0.75rem',
									border: '1px solid #d1d5db',
									borderRadius: '0.5rem',
									fontSize: '1rem',
								}}
								placeholder="mock-client-secret"
							/>
						</div>

						<div>
							<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
								Mock Username
							</label>
							<input
								type="text"
								value={credentials.username}
								onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
								style={{
									width: '100%',
									padding: '0.75rem',
									border: '1px solid #d1d5db',
									borderRadius: '0.5rem',
									fontSize: '1rem',
								}}
								placeholder="demo@example.com"
							/>
						</div>

						<div>
							<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
								Mock Password
							</label>
							<input
								type="password"
								value={credentials.password}
								onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
								style={{
									width: '100%',
									padding: '0.75rem',
									border: '1px solid #d1d5db',
									borderRadius: '0.5rem',
									fontSize: '1rem',
								}}
								placeholder="demo-password"
							/>
						</div>
					</div>
				</div>
			),
			canExecute:
				Boolean(
					credentials.environmentId &&
						credentials.clientId &&
						credentials.username &&
						credentials.password &&
						!isSavingCredentials
				) &&
				(!hasCredentialsSaved || hasUnsavedCredentialChanges),
			buttonText: isSavingCredentials
				? 'Saving...'
				: hasCredentialsSaved && !hasUnsavedCredentialChanges
					? 'Saved'
					: 'Save Mock Configuration',
			execute: async () => {
				await saveCredentials();
				saveStepResult('setup-credentials', { credentials });
				stepManager.setStep(1, 'credentials saved');
			},
			completed: hasStepResult('setup-credentials'),
		},

		// Step 2: Direct Authentication (Mock)
		{
			id: 'authenticate-user',
			title: 'Direct User Authentication',
			description:
				'Simulate direct username/password authentication (the security risk of this flow)',
			icon: <FiLock />,
			content: (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
					<InfoBox type="error">
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
							<strong>🚨 Security Risk Demonstration</strong>
							<span>
								In a real Resource Owner Password flow, the application would collect and transmit
								the user's actual credentials. This creates significant security vulnerabilities.
							</span>
						</div>
					</InfoBox>

					<div
						style={{
							background: '#f8f9fa',
							padding: '1rem',
							borderRadius: '0.5rem',
							border: '1px solid #e9ecef',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>
							Mock Authentication Request
						</h4>
						<pre
							style={{
								margin: 0,
								fontSize: '0.875rem',
								color: '#6c757d',
								whiteSpace: 'pre-wrap',
							}}
						>
							{`POST /as/token HTTP/1.1
Host: auth.pingone.com
Content-Type: application/x-www-form-urlencoded

grant_type=password
&username=${credentials.username}
&password=***HIDDEN***
&client_id=${credentials.clientId}
&client_secret=***HIDDEN***
&scope=openid profile email`}
						</pre>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc3545' }}>
						<FiAlertTriangle />
						<span style={{ fontSize: '0.875rem' }}>
							This step simulates the dangerous practice of sending user credentials directly to the
							token endpoint.
						</span>
					</div>
				</div>
			),
			canExecute: Boolean(credentials.username && credentials.password && !isAuthenticating),
			buttonText: isAuthenticating ? 'Authenticating...' : 'Simulate Authentication',
			onExecute: async () => {
				await authenticateUser();
				saveStepResult('authenticate-user', { tokens });
			},
			completed: Boolean(tokens),
		},

		// Step 3: Token Response
		{
			id: 'token-response',
			title: 'OIDC Token Response',
			description: 'Review the mock tokens returned by the authorization server',
			icon: <FiKey />,
			content: (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
					{tokens ? (
						<>
							<InfoBox type="success">
								<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
									<strong>✅ Mock Tokens Generated</strong>
									<span>
										The mock authorization server has returned OIDC tokens including an ID token
										with user identity claims.
									</span>
								</div>
							</InfoBox>

							<div
								style={{
									background: '#f8f9fa',
									padding: '1rem',
									borderRadius: '0.5rem',
									border: '1px solid #e9ecef',
								}}
							>
								<h4 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>Mock Token Response</h4>
								<pre
									style={{
										margin: 0,
										fontSize: '0.875rem',
										color: '#6c757d',
										whiteSpace: 'pre-wrap',
									}}
								>
									{JSON.stringify(tokens, null, 2)}
								</pre>
							</div>

							<div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
								<div>
									<strong>Access Token:</strong> Used to access protected resources
								</div>
								<div>
									<strong>ID Token:</strong> Contains user identity information (OIDC extension)
								</div>
								{tokens.refresh_token && (
									<div>
										<strong>Refresh Token:</strong> Used to obtain new access tokens
									</div>
								)}
								<div>
									<strong>Expires In:</strong> {tokens.expires_in} seconds
								</div>
							</div>
						</>
					) : (
						<InfoBox type="info">
							<span>Complete the authentication step to see the mock token response.</span>
						</InfoBox>
					)}
				</div>
			),
			canExecute: false, // This is a display-only step
			buttonText: 'View Tokens',
			onExecute: async () => {
				saveStepResult('token-response', { viewed: true });
				stepManager.setStep(3, 'tokens viewed');
			},
			completed: Boolean(tokens),
		},

		// Step 4: Fetch User Info (OIDC)
		{
			id: 'fetch-userinfo',
			title: 'Fetch User Information',
			description: 'Use the access token to fetch user information from the UserInfo endpoint',
			icon: <FiUser />,
			content: (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
					<InfoBox type="info">
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
							<strong>OIDC UserInfo Endpoint</strong>
							<span>
								OIDC extends OAuth 2.0 with a standardized UserInfo endpoint that returns user
								profile information using the access token.
							</span>
						</div>
					</InfoBox>

					{userInfo ? (
						<div
							style={{
								background: '#f8f9fa',
								padding: '1rem',
								borderRadius: '0.5rem',
								border: '1px solid #e9ecef',
							}}
						>
							<h4 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>Mock User Information</h4>
							<pre
								style={{
									margin: 0,
									fontSize: '0.875rem',
									color: '#6c757d',
									whiteSpace: 'pre-wrap',
								}}
							>
								{JSON.stringify(userInfo, null, 2)}
							</pre>
						</div>
					) : (
						<div
							style={{
								background: '#f8f9fa',
								padding: '1rem',
								borderRadius: '0.5rem',
								border: '1px solid #e9ecef',
							}}
						>
							<h4 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>Mock UserInfo Request</h4>
							<pre
								style={{
									margin: 0,
									fontSize: '0.875rem',
									color: '#6c757d',
									whiteSpace: 'pre-wrap',
								}}
							>
								{`GET /as/userinfo HTTP/1.1
Host: auth.pingone.com
Authorization: Bearer ${tokens?.access_token?.substring(0, 20)}...`}
							</pre>
						</div>
					)}
				</div>
			),
			canExecute: Boolean(tokens?.access_token && !isFetchingUserInfo),
			buttonText: isFetchingUserInfo ? 'Fetching...' : 'Fetch User Info',
			onExecute: async () => {
				await fetchUserInfo();
				saveStepResult('fetch-userinfo', { userInfo });
			},
			completed: Boolean(userInfo),
		},

		// Step 5: Refresh Tokens (Optional)
		{
			id: 'refresh-tokens',
			title: 'Refresh Tokens',
			description: 'Use the refresh token to obtain new access tokens',
			icon: <FiRefreshCw />,
			content: (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
					<InfoBox type="info">
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
							<strong>Token Refresh</strong>
							<span>
								Refresh tokens allow applications to obtain new access tokens without requiring the
								user to re-authenticate.
							</span>
						</div>
					</InfoBox>

					{refreshedTokens ? (
						<div
							style={{
								background: '#f8f9fa',
								padding: '1rem',
								borderRadius: '0.5rem',
								border: '1px solid #e9ecef',
							}}
						>
							<h4 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>Refreshed Tokens</h4>
							<pre
								style={{
									margin: 0,
									fontSize: '0.875rem',
									color: '#6c757d',
									whiteSpace: 'pre-wrap',
								}}
							>
								{JSON.stringify(refreshedTokens, null, 2)}
							</pre>
						</div>
					) : (
						<div
							style={{
								background: '#f8f9fa',
								padding: '1rem',
								borderRadius: '0.5rem',
								border: '1px solid #e9ecef',
							}}
						>
							<h4 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>Mock Refresh Request</h4>
							<pre
								style={{
									margin: 0,
									fontSize: '0.875rem',
									color: '#6c757d',
									whiteSpace: 'pre-wrap',
								}}
							>
								{`POST /as/token HTTP/1.1
Host: auth.pingone.com
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=${tokens?.refresh_token?.substring(0, 20)}...
&client_id=${credentials.clientId}
&client_secret=***HIDDEN***`}
							</pre>
						</div>
					)}
				</div>
			),
			canExecute: Boolean(tokens?.refresh_token && !isRefreshingTokens),
			buttonText: isRefreshingTokens ? 'Refreshing...' : 'Refresh Tokens',
			onExecute: async () => {
				await refreshTokens();
				saveStepResult('refresh-tokens', { refreshedTokens });
			},
			completed: Boolean(refreshedTokens),
		},

		// Step 6: Flow Summary
		{
			id: 'flow-summary',
			title: 'Flow Summary & Security Analysis',
			description: 'Review what happened and understand the security implications',
			icon: <FiShield />,
			content: (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
					<InfoBox type="warning">
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
							<strong>🔍 What We Demonstrated</strong>
							<span>
								This mock flow showed how OIDC Resource Owner Password would work, including the
								security risks and OIDC extensions like ID tokens and UserInfo.
							</span>
						</div>
					</InfoBox>

					<div style={{ display: 'grid', gap: '1rem' }}>
						<div
							style={{
								padding: '1rem',
								background: '#fef2f2',
								borderRadius: '0.5rem',
								border: '1px solid #fecaca',
							}}
						>
							<h4 style={{ margin: '0 0 0.5rem 0', color: '#dc2626' }}>
								Security Risks Demonstrated
							</h4>
							<ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#991b1b' }}>
								<li>Application handles user passwords directly</li>
								<li>Credentials transmitted over network</li>
								<li>No delegation to authorization server</li>
								<li>Phishing attacks become easier</li>
								<li>Loss of SSO and MFA benefits</li>
							</ul>
						</div>

						<div
							style={{
								padding: '1rem',
								background: '#f0fdf4',
								borderRadius: '0.5rem',
								border: '1px solid #bbf7d0',
							}}
						>
							<h4 style={{ margin: '0 0 0.5rem 0', color: '#059669' }}>OIDC Extensions Shown</h4>
							<ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#047857' }}>
								<li>ID tokens with user identity claims</li>
								<li>UserInfo endpoint for additional profile data</li>
								<li>Standardized OIDC scopes (openid, profile, email)</li>
								<li>Token refresh capabilities</li>
							</ul>
						</div>

						<div
							style={{
								padding: '1rem',
								background: '#eff6ff',
								borderRadius: '0.5rem',
								border: '1px solid #bfdbfe',
							}}
						>
							<h4 style={{ margin: '0 0 0.5rem 0', color: '#1d4ed8' }}>Recommended Alternatives</h4>
							<ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#1e40af' }}>
								<li>OIDC Authorization Code Flow with PKCE</li>
								<li>OIDC Device Code Flow for limited input devices</li>
								<li>OIDC Client Credentials for server-to-server</li>
								<li>Any flow that doesn't require direct credential handling</li>
							</ul>
						</div>
					</div>

					<button
						onClick={resetFlow}
						style={{
							padding: '0.75rem 1.5rem',
							background: '#6b7280',
							color: 'white',
							border: 'none',
							borderRadius: '0.5rem',
							cursor: 'pointer',
							fontSize: '1rem',
						}}
					>
						Reset Flow
					</button>
				</div>
			),
			canExecute: false, // This is a summary step
			buttonText: 'Complete',
			onExecute: async () => {
				saveStepResult('flow-summary', { completed: true });
			},
			completed: Boolean(tokens && userInfo),
		},
	];
};

export default createV7RMOIDCResourceOwnerPasswordSteps;
