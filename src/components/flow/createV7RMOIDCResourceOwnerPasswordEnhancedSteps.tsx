// src/components/flow/createV7RMOIDCResourceOwnerPasswordEnhancedSteps.ts
// Enhanced step definitions for V7RM OIDC Resource Owner Password Flow with real API integration

import { StepDefinition } from '../../components/flow/types';
import { V7RMOIDCResourceOwnerPasswordControllerEnhanced } from '../../hooks/useV7RMOIDCResourceOwnerPasswordControllerEnhanced';

export default function createV7RMOIDCResourceOwnerPasswordEnhancedSteps({
	controller,
}: {
	controller: V7RMOIDCResourceOwnerPasswordControllerEnhanced;
}): StepDefinition[] {
	return [
		{
			id: 'configuration',
			title: 'Step 0: Configuration',
			subtitle: 'Set up PingOne credentials and OIDC settings',
			component: () => (
				<div style={{ padding: '2rem' }}>
					<h3 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>
						🔧 Enhanced Configuration
					</h3>
					
					<div style={{ 
						background: '#f0f9ff', 
						border: '1px solid #bae6fd', 
						borderRadius: '0.5rem', 
						padding: '1rem', 
						marginBottom: '1.5rem' 
					}}>
						<h4 style={{ color: '#0369a1', marginBottom: '0.5rem' }}>
							🌐 Real API Integration
						</h4>
						<p style={{ margin: 0, color: '#0c4a6e' }}>
							This enhanced flow uses real PingOne APIs for authentication and user information while adding OIDC extensions.
						</p>
					</div>

					<div style={{ 
						background: '#fef3c7', 
						border: '1px solid #fcd34d', 
						borderRadius: '0.5rem', 
						padding: '1rem', 
						marginBottom: '1.5rem' 
					}}>
						<h4 style={{ color: '#92400e', marginBottom: '0.5rem' }}>
							⚠️ Security Notice
						</h4>
						<p style={{ margin: 0, color: '#78350f' }}>
							The Resource Owner Password flow is deprecated. Use Authorization Code flow with PKCE for new applications.
						</p>
					</div>

					<div style={{ marginBottom: '1.5rem' }}>
						<h4 style={{ color: '#374151', marginBottom: '1rem' }}>
							Required Credentials
						</h4>
						<ul style={{ color: '#6b7280', lineHeight: '1.6' }}>
							<li><strong>Environment ID:</strong> Your PingOne environment identifier</li>
							<li><strong>Client ID:</strong> Application client ID from PingOne</li>
							<li><strong>Client Secret:</strong> Application client secret</li>
							<li><strong>Username:</strong> PingOne user credentials</li>
							<li><strong>Password:</strong> User password (for demo purposes)</li>
							<li><strong>Scope:</strong> Include 'openid' for OIDC features</li>
						</ul>
					</div>

					<div style={{ marginBottom: '1.5rem' }}>
						<h4 style={{ color: '#374151', marginBottom: '1rem' }}>
							OIDC Enhancements
						</h4>
						<ul style={{ color: '#6b7280', lineHeight: '1.6' }}>
							<li><strong>ID Token:</strong> Generated when not provided by PingOne</li>
							<li><strong>User Info:</strong> Fetched from real PingOne userinfo endpoint</li>
							<li><strong>Standard Claims:</strong> name, email, profile information</li>
							<li><strong>Token Refresh:</strong> Real refresh token support</li>
						</ul>
					</div>
				</div>
			),
			isComplete: () => controller.hasCredentialsSaved,
			canProceed: () => controller.hasCredentialsSaved,
			onComplete: async () => {
				await controller.saveCredentials();
			},
		},
		{
			id: 'authentication',
			title: 'Step 1: Authentication',
			subtitle: 'Exchange credentials for access and ID tokens',
			component: () => (
				<div style={{ padding: '2rem' }}>
					<h3 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>
						🔐 Real Authentication
					</h3>
					
					<div style={{ 
						background: '#f0fdf4', 
						border: '1px solid #bbf7d0', 
						borderRadius: '0.5rem', 
						padding: '1rem', 
						marginBottom: '1.5rem' 
					}}>
						<h4 style={{ color: '#166534', marginBottom: '0.5rem' }}>
							✅ Real PingOne API
						</h4>
						<p style={{ margin: 0, color: '#14532d' }}>
							Using real PingOne token endpoint for authentication with your actual credentials.
						</p>
					</div>

					{controller.tokens && (
						<div style={{ marginBottom: '1.5rem' }}>
							<h4 style={{ color: '#374151', marginBottom: '1rem' }}>
								🎫 Tokens Received
							</h4>
							<div style={{ 
								background: '#f8fafc', 
								border: '1px solid #e2e8f0', 
								borderRadius: '0.5rem', 
								padding: '1rem' 
							}}>
								<ul style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
									<li><strong>Access Token:</strong> {controller.tokens.access_token ? '✅ Received' : '❌ Missing'}</li>
									<li><strong>ID Token:</strong> {controller.tokens.id_token ? '✅ Received' : '🔄 Generated'}</li>
									<li><strong>Refresh Token:</strong> {controller.tokens.refresh_token ? '✅ Received' : '❌ Not Available'}</li>
									<li><strong>Expires In:</strong> {controller.tokens.expires_in} seconds</li>
									<li><strong>Scope:</strong> {controller.tokens.scope}</li>
								</ul>
							</div>
						</div>
					)}

					{controller.enableDebugger && (
						<div style={{ 
							background: '#1f2937', 
							borderRadius: '0.5rem', 
							padding: '1rem', 
							marginTop: '1.5rem' 
						}}>
							<h4 style={{ color: '#f3f4f6', marginBottom: '1rem' }}>
								🔍 Debug Information
							</h4>
							<pre style={{ 
								color: '#d1d5db', 
								fontSize: '0.875rem', 
								overflow: 'auto', 
								margin: 0 
							}}>
								{JSON.stringify({
									environmentId: controller.credentials.environmentId,
									clientId: controller.credentials.clientId,
									scope: controller.credentials.scope,
									hasTokens: !!controller.tokens,
									isAuthenticating: controller.isAuthenticating,
								}, null, 2)}
							</pre>
						</div>
					)}
				</div>
			),
			isComplete: () => !!controller.tokens,
			canProceed: () => !!controller.tokens,
			onComplete: async () => {
				await controller.authenticateUser();
			},
		},
		{
			id: 'user-info',
			title: 'Step 2: User Information',
			subtitle: 'Fetch user details using access token',
			component: () => (
				<div style={{ padding: '2rem' }}>
					<h3 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>
						👤 Real User Information
					</h3>
					
					<div style={{ 
						background: '#f0fdf4', 
						border: '1px solid #bbf7d0', 
						borderRadius: '0.5rem', 
						padding: '1rem', 
						marginBottom: '1.5rem' 
					}}>
						<h4 style={{ color: '#166534', marginBottom: '0.5rem' }}>
							✅ Real PingOne Userinfo API
						</h4>
						<p style={{ margin: 0, color: '#14532d' }}>
							Fetching real user information from PingOne userinfo endpoint using the access token.
						</p>
					</div>

					{controller.userInfo && (
						<div style={{ marginBottom: '1.5rem' }}>
							<h4 style={{ color: '#374151', marginBottom: '1rem' }}>
								📋 User Profile
							</h4>
							<div style={{ 
								background: '#f8fafc', 
								border: '1px solid #e2e8f0', 
								borderRadius: '0.5rem', 
								padding: '1rem' 
							}}>
								<ul style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
									<li><strong>Subject:</strong> {controller.userInfo.sub}</li>
									<li><strong>Name:</strong> {controller.userInfo.name || 'Not provided'}</li>
									<li><strong>Email:</strong> {controller.userInfo.email || 'Not provided'}</li>
									<li><strong>Email Verified:</strong> {controller.userInfo.email_verified ? '✅ Yes' : '❌ No'}</li>
									<li><strong>Given Name:</strong> {controller.userInfo.given_name || 'Not provided'}</li>
									<li><strong>Family Name:</strong> {controller.userInfo.family_name || 'Not provided'}</li>
								</ul>
							</div>
						</div>
					)}

					{controller.enableDebugger && (
						<div style={{ 
							background: '#1f2937', 
							borderRadius: '0.5rem', 
							padding: '1rem', 
							marginTop: '1.5rem' 
						}}>
							<h4 style={{ color: '#f3f4f6', marginBottom: '1rem' }}>
								🔍 Full User Info Response
							</h4>
							<pre style={{ 
								color: '#d1d5db', 
								fontSize: '0.875rem', 
								overflow: 'auto', 
								margin: 0 
							}}>
								{JSON.stringify(controller.userInfo, null, 2)}
							</pre>
						</div>
					)}
				</div>
			),
			isComplete: () => !!controller.userInfo,
			canProceed: () => !!controller.userInfo,
			onComplete: async () => {
				await controller.fetchUserInfo();
			},
		},
		{
			id: 'token-refresh',
			title: 'Step 3: Token Refresh',
			subtitle: 'Refresh access token using refresh token',
			component: () => (
				<div style={{ padding: '2rem' }}>
					<h3 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>
						🔄 Real Token Refresh
					</h3>
					
					<div style={{ 
						background: controller.tokens?.refresh_token ? '#f0fdf4' : '#fef3c7', 
						border: `1px solid ${controller.tokens?.refresh_token ? '#bbf7d0' : '#fcd34d'}`, 
						borderRadius: '0.5rem', 
						padding: '1rem', 
						marginBottom: '1.5rem' 
					}}>
						<h4 style={{ 
							color: controller.tokens?.refresh_token ? '#166534' : '#92400e', 
							marginBottom: '0.5rem' 
						}}>
							{controller.tokens?.refresh_token ? '✅ Refresh Token Available' : '⚠️ No Refresh Token'}
						</h4>
						<p style={{ margin: 0, color: controller.tokens?.refresh_token ? '#14532d' : '#78350f' }}>
							{controller.tokens?.refresh_token 
								? 'Using real PingOne token refresh endpoint to get new access token.'
								: 'Refresh token not provided by PingOne. This may be due to client configuration.'}
						</p>
					</div>

					{controller.refreshedTokens && (
						<div style={{ marginBottom: '1.5rem' }}>
							<h4 style={{ color: '#374151', marginBottom: '1rem' }}>
								🎫 Refreshed Tokens
							</h4>
							<div style={{ 
								background: '#f8fafc', 
								border: '1px solid #e2e8f0', 
								borderRadius: '0.5rem', 
								padding: '1rem' 
							}}>
								<ul style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
									<li><strong>New Access Token:</strong> ✅ Received</li>
									<li><strong>ID Token:</strong> {controller.refreshedTokens.id_token ? '✅ Preserved' : '❌ Missing'}</li>
									<li><strong>New Refresh Token:</strong> {controller.refreshedTokens.refresh_token ? '✅ Received' : '❌ Not Provided'}</li>
									<li><strong>New Expires In:</strong> {controller.refreshedTokens.expires_in} seconds</li>
								</ul>
							</div>
						</div>
					)}

					{controller.enableDebugger && (
						<div style={{ 
							background: '#1f2937', 
							borderRadius: '0.5rem', 
							padding: '1rem', 
							marginTop: '1.5rem' 
						}}>
							<h4 style={{ color: '#f3f4f6', marginBottom: '1rem' }}>
								🔍 Refresh Debug Info
							</h4>
							<pre style={{ 
								color: '#d1d5db', 
								fontSize: '0.875rem', 
								overflow: 'auto', 
								margin: 0 
							}}>
								{JSON.stringify({
									hasRefreshToken: !!controller.tokens?.refresh_token,
									hasRefreshedTokens: !!controller.refreshedTokens,
									isRefreshing: controller.isRefreshingTokens,
									originalExpiresIn: controller.tokens?.expires_in,
									refreshedExpiresIn: controller.refreshedTokens?.expires_in,
								}, null, 2)}
							</pre>
						</div>
					)}
				</div>
			),
			isComplete: () => !!controller.refreshedTokens || !controller.tokens?.refresh_token,
			canProceed: () => true, // Can proceed even if no refresh token
			onComplete: async () => {
				if (controller.tokens?.refresh_token) {
					await controller.refreshTokens();
				}
			},
		},
	];
}
