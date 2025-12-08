/**
 * @file MFAHubV8.tsx
 * @module v8/flows
 * @description MFA Hub - Central navigation for all MFA features
 * @version 8.0.0
 * @since 2024-11-19
 *
 * Features:
 * - Device Registration Flow
 * - Device Management
 * - MFA Reporting
 * - Settings
 *
 * @example
 * <MFAHubV8 />
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageScroll } from '@/hooks/usePageScroll';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { oauthStorage } from '@/utils/storage';
import { pingOneLogoutService } from '@/services/pingOneLogoutService';
import { useAuth } from '@/contexts/NewAuthContext';
import { FiTrash2 } from 'react-icons/fi';

interface FeatureCard {
	title: string;
	description: string;
	icon: string;
	path: string;
	color: string;
	features: string[];
}

export const MFAHubV8: React.FC = () => {
	const navigate = useNavigate();
	const [isClearingTokens, setIsClearingTokens] = useState(false);
	const authContext = useAuth();

	// Scroll to top on page load
	usePageScroll({ pageName: 'MFA Hub V8', force: true });

	// Clear all tokens (worker and user tokens) and end PingOne session
	const handleClearTokens = async () => {
		if (!confirm('Are you sure you want to clear all tokens and end your PingOne session? This will clear both worker tokens and user tokens, and log you out of PingOne.')) {
			return;
		}

		setIsClearingTokens(true);
		try {
			// End PingOne session first (if we have an ID token)
			const tokens = oauthStorage.getTokens();
			const idToken = tokens?.id_token || authContext.tokens?.id_token;
			
			// Try to get environment ID from various sources
			let environmentId: string | undefined;
			if (authContext.config?.pingone?.environmentId) {
				environmentId = authContext.config.pingone.environmentId;
			} else {
				// Try to get from MFA flow credentials
				try {
					const mfaFlowKey = 'mfa-flow-v8';
					const credentials = CredentialsServiceV8.loadCredentials(mfaFlowKey, {
						flowKey: mfaFlowKey,
						flowType: 'oidc',
						includeClientSecret: false,
						includeRedirectUri: false,
						includeLogoutUri: false,
						includeScopes: false,
					});
					if (credentials.environmentId) {
						environmentId = credentials.environmentId;
					}
				} catch (error) {
					// Ignore
				}
			}
			
			if (idToken && environmentId) {
				try {
					const logoutResult = await pingOneLogoutService.logout({
						idToken,
						environmentId,
						autoOpen: true,
						openIn: 'new-tab',
						clearClientStorage: false, // We'll clear storage ourselves below
					});
					
					if (logoutResult.success) {
						console.log('[MFA-HUB-V8] PingOne session logout initiated:', logoutResult.message);
						toastV8.info('PingOne session logout initiated in a new tab');
					} else {
						console.warn('[MFA-HUB-V8] PingOne logout failed:', logoutResult.error);
					}
				} catch (error) {
					console.warn('[MFA-HUB-V8] Could not end PingOne session:', error);
				}
			} else {
				console.log('[MFA-HUB-V8] No ID token or environment ID available for PingOne logout', {
					hasIdToken: !!idToken,
					hasEnvironmentId: !!environmentId,
				});
			}

			// Call auth context logout to clear local session state
			try {
				authContext.logout();
				console.log('[MFA-HUB-V8] Auth context logout called');
			} catch (error) {
				console.warn('[MFA-HUB-V8] Could not call auth context logout:', error);
			}

			// Clear worker token
			await workerTokenServiceV8.clearCredentials();
			console.log('[MFA-HUB-V8] Worker token cleared');

			// Clear OAuth tokens from auth context
			try {
				oauthStorage.clearTokens();
				oauthStorage.clearUserInfo();
				console.log('[MFA-HUB-V8] OAuth tokens cleared from auth context');
			} catch (error) {
				console.warn('[MFA-HUB-V8] Could not clear OAuth tokens:', error);
			}

			// Clear user tokens from MFA flow credentials
			const mfaFlowKey = 'mfa-flow-v8';
			try {
				const credentials = CredentialsServiceV8.loadCredentials(mfaFlowKey, {
					flowKey: mfaFlowKey,
					flowType: 'oidc',
					includeClientSecret: false,
					includeRedirectUri: false,
					includeLogoutUri: false,
					includeScopes: false,
				});
				
				if (credentials.userToken) {
					CredentialsServiceV8.saveCredentials(mfaFlowKey, {
						...credentials,
						userToken: undefined,
						tokenType: undefined,
					});
					console.log('[MFA-HUB-V8] User token cleared from MFA flow credentials');
				}
			} catch (error) {
				console.warn('[MFA-HUB-V8] Could not clear user token from credentials:', error);
			}

			// Clear user login credentials
			const userLoginFlowKey = 'user-login-v8';
			try {
				const userLoginCreds = CredentialsServiceV8.loadCredentials(userLoginFlowKey, {
					flowKey: userLoginFlowKey,
					flowType: 'oauth',
					includeClientSecret: true,
					includeRedirectUri: true,
					includeLogoutUri: false,
					includeScopes: true,
				});
				
				if (userLoginCreds.userToken) {
					CredentialsServiceV8.saveCredentials(userLoginFlowKey, {
						...userLoginCreds,
						userToken: undefined,
						tokenType: undefined,
					});
					console.log('[MFA-HUB-V8] User token cleared from user login credentials');
				}
			} catch (error) {
				console.warn('[MFA-HUB-V8] Could not clear user token from user login credentials:', error);
			}

			toastV8.success('All tokens cleared successfully!');
		} catch (error) {
			console.error('[MFA-HUB-V8] Failed to clear tokens:', error);
			toastV8.error('Failed to clear tokens. Please try again.');
		} finally {
			setIsClearingTokens(false);
		}
	};

	const features: FeatureCard[] = [
		{
			title: 'Device Registration',
			description: 'Register and verify MFA devices for users',
			icon: '📱',
			path: '/v8/mfa',
			color: '#10b981',
			features: [
				'Register SMS devices',
				'Register Email devices',
				'Register WhatsApp devices',
				'Register TOTP devices',
				'Send and validate OTP',
				'QR code generation',
			],
		},
		{
			title: 'Device Management',
			description: 'Manage user MFA devices',
			icon: '🔧',
			path: '/v8/mfa-device-management',
			color: '#3b82f6',
			features: [
				'View all devices',
				'Rename devices',
				'Block/Unblock devices',
				'Delete devices',
				'Device status tracking',
			],
		},
		{
			title: 'MFA Reporting',
			description: 'View MFA usage reports and analytics',
			icon: '📊',
			path: '/v8/mfa-reporting',
			color: '#8b5cf6',
			features: [
				'User authentication reports',
				'Device authentication reports',
				'FIDO2 device reports',
				'Usage analytics',
				'Export reports',
			],
		},
		{
			title: 'MFA Settings',
			description: 'Configure MFA policies and settings',
			icon: '⚙️',
			path: '/v8/mfa-settings',
			color: '#f59e0b',
			features: [
				'Pairing settings',
				'Lockout policies',
				'Device limits',
				'OTP configuration',
				'Security policies',
			],
		},
	];

	return (
		<div className="mfa-hub-v8">
			<MFAHeaderV8
				title="PingOne MFA Hub"
				description="Comprehensive MFA device and authentication management"
				versionTag="V8"
				currentPage="hub"
				showRestartFlow={false}
				showBackToMain={false}
				headerColor="purple"
			/>

			<div className="hub-container">
				<div className="welcome-section">
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
						<div style={{ flex: 1 }}>
							<h2>Welcome to MFA Management</h2>
							<p>
								Manage multi-factor authentication devices, view reports, and configure MFA policies for
								your PingOne environment.
							</p>
						</div>
						<button
							type="button"
							onClick={handleClearTokens}
							disabled={isClearingTokens}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '10px 16px',
								background: '#ef4444',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: isClearingTokens ? 'not-allowed' : 'pointer',
								opacity: isClearingTokens ? 0.6 : 1,
								transition: 'all 0.2s ease',
								boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
							}}
							onMouseEnter={(e) => {
								if (!isClearingTokens) {
									e.currentTarget.style.background = '#dc2626';
									e.currentTarget.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.3)';
								}
							}}
							onMouseLeave={(e) => {
								if (!isClearingTokens) {
									e.currentTarget.style.background = '#ef4444';
									e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
								}
							}}
							title="Clear all tokens (worker tokens and user tokens)"
						>
							<FiTrash2 size={16} />
							{isClearingTokens ? 'Clearing...' : 'Clear Tokens'}
						</button>
					</div>
				</div>

				<div className="features-grid">
					{features.map((feature) => (
						<div
							key={feature.path}
							className="feature-card"
							onClick={() => navigate(feature.path)}
							style={{ borderTop: `4px solid ${feature.color}` }}
						>
							<div className="feature-icon" style={{ background: `${feature.color}20` }}>
								<span style={{ fontSize: '48px' }}>{feature.icon}</span>
							</div>
							<h3 style={{ color: feature.color }}>{feature.title}</h3>
							<p className="feature-description">{feature.description}</p>
							<ul className="feature-list">
								{feature.features.map((item, idx) => (
									<li key={idx}>{item}</li>
								))}
							</ul>
							<button
								className="feature-button"
								style={{ background: feature.color }}
								onClick={(e) => {
									e.stopPropagation();
									navigate(feature.path);
								}}
							>
								Open {feature.title}
							</button>
						</div>
					))}
				</div>

				<div className="info-section">
					<h3>About PingOne MFA</h3>
					<p>
						PingOne MFA provides secure multi-factor authentication for your applications. This hub
						gives you complete control over device registration, management, reporting, and
						configuration.
					</p>
					<div className="info-grid">
						<div className="info-card">
							<span className="info-icon">🔐</span>
							<h4>Secure</h4>
							<p>Industry-standard MFA protocols including TOTP, SMS, and Email</p>
						</div>
						<div className="info-card">
							<span className="info-icon">📱</span>
							<h4>Flexible</h4>
							<p>Support for multiple device types and authentication methods</p>
						</div>
						<div className="info-card">
							<span className="info-icon">📊</span>
							<h4>Insightful</h4>
							<p>Comprehensive reporting and analytics for MFA usage</p>
						</div>
						<div className="info-card">
							<span className="info-icon">⚡</span>
							<h4>Fast</h4>
							<p>Quick device registration and authentication flows</p>
						</div>
					</div>
				</div>
			</div>

			<style>{`
				.mfa-hub-v8 {
					max-width: 1400px;
					margin: 0 auto;
					background: #f8f9fa;
					min-height: 100vh;
					overflow-y: auto;
					padding-bottom: 40px;
				}

				.hub-container {
					padding: 40px;
				}

				.welcome-section {
					background: white;
					border-radius: 12px;
					padding: 32px;
					margin-bottom: 40px;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
				}

				.welcome-section h2 {
					font-size: 24px;
					font-weight: 600;
					margin: 0 0 12px 0;
					color: #1f2937;
				}

				.welcome-section p {
					font-size: 16px;
					color: #6b7280;
					margin: 0;
					line-height: 1.6;
				}

				.features-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
					gap: 24px;
					margin-bottom: 40px;
				}

				.feature-card {
					background: white;
					border-radius: 12px;
					padding: 28px;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
					cursor: pointer;
					transition: all 0.3s ease;
					display: flex;
					flex-direction: column;
				}

				.feature-card:hover {
					transform: translateY(-4px);
					box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
				}

				.feature-icon {
					width: 80px;
					height: 80px;
					border-radius: 16px;
					display: flex;
					align-items: center;
					justify-content: center;
					margin-bottom: 20px;
				}

				.feature-card h3 {
					font-size: 20px;
					font-weight: 600;
					margin: 0 0 12px 0;
				}

				.feature-description {
					font-size: 14px;
					color: #6b7280;
					margin: 0 0 20px 0;
					line-height: 1.5;
				}

				.feature-list {
					list-style: none;
					padding: 0;
					margin: 0 0 24px 0;
					flex: 1;
				}

				.feature-list li {
					font-size: 13px;
					color: #6b7280;
					padding: 6px 0;
					padding-left: 20px;
					position: relative;
				}

				.feature-list li:before {
					content: '✓';
					position: absolute;
					left: 0;
					color: #10b981;
					font-weight: bold;
				}

				.feature-button {
					width: 100%;
					padding: 12px 24px;
					border: none;
					border-radius: 8px;
					font-size: 14px;
					font-weight: 600;
					color: white;
					cursor: pointer;
					transition: all 0.2s ease;
				}

				.feature-button:hover {
					opacity: 0.9;
					transform: scale(1.02);
				}

				.info-section {
					background: white;
					border-radius: 12px;
					padding: 32px;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
				}

				.info-section h3 {
					font-size: 20px;
					font-weight: 600;
					margin: 0 0 12px 0;
					color: #1f2937;
				}

				.info-section > p {
					font-size: 14px;
					color: #6b7280;
					margin: 0 0 24px 0;
					line-height: 1.6;
				}

				.info-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
					gap: 20px;
				}

				.info-card {
					text-align: center;
					padding: 20px;
				}

				.info-icon {
					font-size: 36px;
					display: block;
					margin-bottom: 12px;
				}

				.info-card h4 {
					font-size: 16px;
					font-weight: 600;
					margin: 0 0 8px 0;
					color: #1f2937;
				}

				.info-card p {
					font-size: 13px;
					color: #6b7280;
					margin: 0;
					line-height: 1.5;
				}

				@media (max-width: 768px) {
					.hub-container {
						padding: 20px;
					}

					.features-grid {
						grid-template-columns: 1fr;
					}

					.info-grid {
						grid-template-columns: 1fr;
					}
				}
			`}</style>
		</div>
	);
};

export default MFAHubV8;
