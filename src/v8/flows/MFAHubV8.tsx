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

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { FiTrash2, FiPackage, FiChevronDown } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/NewAuthContext';
import { usePageScroll } from '@/hooks/usePageScroll';
import { pingOneLogoutService } from '@/services/pingOneLogoutService';
import { oauthStorage } from '@/utils/storage';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { WorkerTokenStatusDisplayV8 } from '@/v8/components/WorkerTokenStatusDisplayV8';
import { useApiDisplayPadding } from '@/v8/hooks/useApiDisplayPadding';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import WorkerTokenStatusServiceV8, { type TokenStatusInfo } from '@/v8/services/workerTokenStatusServiceV8';
import { handleShowWorkerTokenModal } from '@/v8/utils/workerTokenModalHelperV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import {
	generateComprehensiveMFAPostmanCollection,
	downloadPostmanCollectionWithEnvironment,
} from '@/services/postmanCollectionGeneratorV8';
import styled from 'styled-components';

// Collapsible components
const CollapsibleSection = styled.div`
	margin-bottom: 1.5rem;
	background-color: #ffffff;
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

const CollapsibleHeaderButton = styled.button<{ $collapsed?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.5rem 1.75rem;
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%);
	border: 3px solid transparent;
	border-radius: 1rem;
	cursor: pointer;
	font-size: 1.2rem;
	font-weight: 700;
	color: #14532d;
	transition: all 0.3s ease;
	position: relative;
	box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);

	&:hover {
		background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
		border-color: #86efac;
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(34, 197, 94, 0.2);
	}

	&:active {
		transform: translateY(0);
		box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
	}
`;

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	border-radius: 12px;
	background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
	border: 3px solid #3b82f6;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
	transition: all 0.3s ease;
	cursor: pointer;
	color: #3b82f6;
	box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);

	&:hover {
		background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
		border-color: #2563eb;
		color: #2563eb;
		transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg) scale(1.1)' : 'rotate(0deg) scale(1.1)')};
		box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
	}

	svg {
		width: 24px;
		height: 24px;
		stroke-width: 3px;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
	}
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	padding-top: 0;
	animation: fadeIn 0.2s ease;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

interface FeatureCard {
	title: string;
	description: string;
	icon: string;
	path: string;
	color: string;
	features: string[];
}

// Lazy load WorkerTokenModalV8 to avoid circular dependencies
const WorkerTokenModalV8 = lazy(() =>
	import('@/v8/components/WorkerTokenModalV8').then((mod) => ({
		default: mod.WorkerTokenModalV8,
	}))
);

// Wrapper component for lazy-loaded modal
const WorkerTokenModalWrapper: React.FC<{
	isOpen: boolean;
	onClose: () => void;
	onTokenGenerated: () => void;
}> = ({ isOpen, onClose, onTokenGenerated }) => (
	<Suspense fallback={null}>
		<WorkerTokenModalV8 isOpen={isOpen} onClose={onClose} onTokenGenerated={onTokenGenerated} />
	</Suspense>
);

export const MFAHubV8: React.FC = () => {
	const navigate = useNavigate();
	const [isClearingTokens, setIsClearingTokens] = useState(false);
	const authContext = useAuth();
	
	// Collapsible sections state
	const [featuresCollapsed, setFeaturesCollapsed] = useState(false);
	const [infoCollapsed, setInfoCollapsed] = useState(false);
	
	// Worker token state
	const [tokenStatus, setTokenStatus] = useState<TokenStatusInfo>({
		status: 'missing',
		message: 'Checking...',
		isValid: false,
	});
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	
	// Initialize from config immediately (not in useEffect) so silent retrieval works on mount
	const [silentApiRetrieval, setSilentApiRetrieval] = useState(() => {
		try {
			return MFAConfigurationServiceV8.loadConfiguration().workerToken.silentApiRetrieval || false;
		} catch {
			return false;
		}
	});
	const [showTokenAtEnd, setShowTokenAtEnd] = useState(() => {
		try {
			return MFAConfigurationServiceV8.loadConfiguration().workerToken.showTokenAtEnd !== false;
		} catch {
			return true;
		}
	});

	// Scroll to top on page load
	usePageScroll({ pageName: 'MFA Hub V8', force: true });

	// Get API display padding
	const { paddingBottom } = useApiDisplayPadding();

		// Check worker token on mount and when token updates
		useEffect(() => {
			// #region agent log
			// #endregion
			const checkToken = async () => {
				const currentStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				setTokenStatus(currentStatus);
				// #region agent log
				// #endregion

				// If token is missing or expired, use helper to handle silent retrieval
				// Pass Hub page checkbox values to override config (Hub page takes precedence)
				if (!currentStatus.isValid) {
					// #region agent log
					// #endregion
					await handleShowWorkerTokenModal(
						setShowWorkerTokenModal,
						async (status) => setTokenStatus(await status),
						silentApiRetrieval,  // Hub page checkbox value takes precedence
						showTokenAtEnd       // Hub page checkbox value takes precedence
					);
				}
			};

			checkToken();

		// Listen for token updates
		const handleTokenUpdate = async () => {
			const newStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(newStatus);
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		return () => window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
	}, [silentApiRetrieval, showTokenAtEnd]); // Re-run when checkboxes change to trigger silent retrieval

	// Listen for configuration updates
	useEffect(() => {
		const handleConfigUpdate = (event: Event) => {
			const customEvent = event as CustomEvent<{ workerToken?: { silentApiRetrieval?: boolean; showTokenAtEnd?: boolean } }>;
			if (customEvent.detail?.workerToken) {
				if (customEvent.detail.workerToken.silentApiRetrieval !== undefined) {
					setSilentApiRetrieval(customEvent.detail.workerToken.silentApiRetrieval);
				}
				if (customEvent.detail.workerToken.showTokenAtEnd !== undefined) {
					setShowTokenAtEnd(customEvent.detail.workerToken.showTokenAtEnd);
				}
			}
		};

		window.addEventListener('mfaConfigurationUpdated', handleConfigUpdate);
		return () => window.removeEventListener('mfaConfigurationUpdated', handleConfigUpdate);
	}, []);

	// Update configuration when checkboxes change
	// Make checkboxes consistent: if Silent is ON, Show Token must be OFF (and vice versa)
	const handleSilentApiRetrievalChange = async (value: boolean) => {
		console.log('[MFA-HUB-V8] DEBUG - handleSilentApiRetrievalChange called with:', value);
		const config = MFAConfigurationServiceV8.loadConfiguration();
		console.log('[MFA-HUB-V8] DEBUG - Current config before change:', config.workerToken);
		config.workerToken.silentApiRetrieval = value;
		MFAConfigurationServiceV8.saveConfiguration(config);
		setSilentApiRetrieval(value);
		console.log('[MFA-HUB-V8] DEBUG - State set to:', value);
		// Dispatch event to notify other components
		window.dispatchEvent(new CustomEvent('mfaConfigurationUpdated', { detail: { workerToken: config.workerToken } }));
		toastV8.info(`Silent API Token Retrieval set to: ${value}`);
		
		// If enabling silent retrieval and token is missing/expired, attempt silent retrieval now
		if (value) {
			const currentStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			console.log('[MFA-HUB-V8] DEBUG - Current token status:', currentStatus);
			if (!currentStatus.isValid) {
				console.log('[MFA-HUB-V8] Silent API retrieval enabled, attempting to fetch token now...');
				await handleShowWorkerTokenModal(
					setShowWorkerTokenModal,
					async (status) => setTokenStatus(await status),
					value,  // Use new value
					showTokenAtEnd,
					false   // Not forced - respect silent setting
				);
			}
		}
	};

	const handleShowTokenAtEndChange = (value: boolean) => {
		const config = MFAConfigurationServiceV8.loadConfiguration();
		config.workerToken.showTokenAtEnd = value;
		MFAConfigurationServiceV8.saveConfiguration(config);
		setShowTokenAtEnd(value);
		// Dispatch event to notify other components
		window.dispatchEvent(new CustomEvent('mfaConfigurationUpdated', { detail: { workerToken: config.workerToken } }));
		toastV8.info(`Show Token After Generation set to: ${value}`);
	};

	// Clear all tokens (worker and user tokens) and end PingOne session
	const handleClearTokens = async () => {
		if (
			!confirm(
				'Are you sure you want to clear all tokens and end your PingOne session? This will clear both worker tokens and user tokens, and log you out of PingOne.'
			)
		) {
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
				} catch {
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
				{/* Postman Collection Download Section - At Top Like Unified Page */}
				<div
					style={{
						padding: '16px',
						background: '#ffffff',
						borderRadius: '8px',
						border: '1px solid #e2e8f0',
						marginBottom: '24px',
					}}
				>
					<div
						style={{
							display: 'flex',
							gap: '12px',
							flexWrap: 'wrap',
						}}
					>
						<button
							type="button"
							onClick={async () => {
								try {
									// Get environment ID from credentials
									const creds = CredentialsServiceV8.loadCredentials();
									const collection = generateComprehensiveMFAPostmanCollection({
										environmentId: creds?.environmentId,
										username: creds?.username,
									});
									const date = new Date().toISOString().split('T')[0];
									const filename = `pingone-mfa-flows-complete-${date}-collection.json`;
									downloadPostmanCollectionWithEnvironment(collection, filename, 'PingOne MFA Flows Environment');
									toastV8.success('Postman collection and environment downloaded! Import both into Postman to test all MFA flows.');
								} catch (error) {
									console.error('Error generating MFA Postman collection:', error);
									toastV8.error('Failed to generate Postman collection. Please try again.');
								}
							}}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '12px 24px',
								background: '#8b5cf6',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								fontSize: '15px',
								fontWeight: '600',
								cursor: 'pointer',
								boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
								transition: 'all 0.2s ease',
								flex: 1,
								minWidth: '250px',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#7c3aed';
								e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = '#8b5cf6';
								e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)';
							}}
							title="Download comprehensive Postman collection for all MFA device types (SMS, Email, WhatsApp, TOTP, FIDO2, Mobile) grouped by Registration and Authentication"
						>
							<FiPackage size={18} />
							Download All MFA Flows Postman Collection
						</button>
						<button
							type="button"
							onClick={async () => {
								try {
									// Get Unified credentials
									const { CredentialsServiceV8 } = await import('@/v8/services/credentialsServiceV8');
									const { EnvironmentIdServiceV8 } = await import('@/v8/services/environmentIdServiceV8');
									const environmentId = EnvironmentIdServiceV8.getEnvironmentId();
									const flowKey = 'oauth-authz-v8u';
									const config = CredentialsServiceV8.getFlowConfig(flowKey) || {
										flowKey,
										flowType: 'oauth' as const,
										includeClientSecret: true,
										includeScopes: true,
										includeRedirectUri: true,
										includeLogoutUri: false,
									};
									const unifiedCreds = CredentialsServiceV8.loadCredentials(flowKey, config);
									
									// Get MFA credentials
									const creds = CredentialsServiceV8.loadCredentials();
									const { generateCompletePostmanCollection } = await import('@/services/postmanCollectionGeneratorV8');
									const collection = generateCompletePostmanCollection({
										environmentId: environmentId || unifiedCreds?.environmentId || creds?.environmentId,
										clientId: unifiedCreds?.clientId,
										clientSecret: unifiedCreds?.clientSecret,
										username: creds?.username,
									});
									const date = new Date().toISOString().split('T')[0];
									const filename = `pingone-complete-unified-mfa-${date}-collection.json`;
									const { downloadPostmanCollectionWithEnvironment } = await import('@/services/postmanCollectionGeneratorV8');
									downloadPostmanCollectionWithEnvironment(collection, filename, 'PingOne Complete Collection Environment');
									toastV8.success('Complete Postman collection (Unified + MFA) downloaded! Import both files into Postman.');
								} catch (error) {
									console.error('Error generating complete Postman collection:', error);
									toastV8.error('Failed to generate complete Postman collection. Please try again.');
								}
							}}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '12px 24px',
								background: '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								fontSize: '15px',
								fontWeight: '600',
								cursor: 'pointer',
								boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
								transition: 'all 0.2s ease',
								flex: 1,
								minWidth: '250px',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#059669';
								e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = '#10b981';
								e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
							}}
							title="Download complete Postman collection for all Unified OAuth/OIDC flows AND all MFA device types in one collection"
						>
							<FiPackage size={18} />
							Download Complete Collection (Unified + MFA)
						</button>
					</div>
				</div>

				<div className="welcome-section">
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'flex-start',
							marginBottom: '16px',
						}}
					>
						<div style={{ flex: 1 }}>
							<h2>Welcome to MFA Management</h2>
							<p>
								Manage multi-factor authentication devices, view reports, and configure MFA policies
								for your PingOne environment.
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

					{/* Worker Token Status Section - ALWAYS VISIBLE */}
					<div
						style={{
							marginTop: '24px',
							padding: '24px',
							background: '#ffffff',
							borderRadius: '12px',
							border: '2px solid #e5e7eb',
							boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '24px',
								flexWrap: 'wrap',
								width: '100%',
							}}
						>
							{/* New Worker Token Status Display - Wide Mode with Config */}
							<div style={{ width: '100%', flex: '1' }}>
								<WorkerTokenStatusDisplayV8 mode="wide" showRefresh={true} showConfig={true} />
							</div>

							{/* Settings and Controls */}
							<div style={{ flex: 1, minWidth: '300px' }}>
								<h3
									style={{
										fontSize: '18px',
										fontWeight: '700',
										margin: '0 0 20px 0',
										color: '#1f2937',
										borderBottom: '2px solid #e5e7eb',
										paddingBottom: '12px',
									}}
								>
									⚙️ Worker Token Settings
								</h3>

								{/* Checkboxes */}
								<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
									<label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '12px',
											cursor: 'pointer',
											userSelect: 'none',
											padding: '8px',
											borderRadius: '6px',
											transition: 'background-color 0.2s ease',
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.backgroundColor = '#f3f4f6';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.backgroundColor = 'transparent';
										}}
									>
										<input
											type="checkbox"
											checked={silentApiRetrieval}
											onChange={(e) => handleSilentApiRetrievalChange(e.target.checked)}
											style={{
												width: '20px',
												height: '20px',
												cursor: 'pointer',
												accentColor: '#6366f1',
												flexShrink: 0,
											}}
										/>
										<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
											<span style={{ fontSize: '15px', color: '#374151', fontWeight: '500' }}>
												Silent worker token API calls
											</span>
											<span style={{ fontSize: '12px', color: '#6b7280' }}>
												Automatically fetch worker token in the background without showing modals
											</span>
										</div>
									</label>

									<label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '12px',
											cursor: 'pointer',
											userSelect: 'none',
											padding: '8px',
											borderRadius: '6px',
											transition: 'background-color 0.2s ease',
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.backgroundColor = '#f3f4f6';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.backgroundColor = 'transparent';
										}}
									>
										<input
											type="checkbox"
											checked={showTokenAtEnd}
											onChange={(e) => handleShowTokenAtEndChange(e.target.checked)}
											style={{
												width: '20px',
												height: '20px',
												cursor: 'pointer',
												accentColor: '#6366f1',
												flexShrink: 0,
											}}
										/>
										<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
											<span style={{ fontSize: '15px', color: '#374151', fontWeight: '500' }}>
												Show worker token
											</span>
											<span style={{ fontSize: '12px', color: '#6b7280' }}>
												Display the generated worker token in a modal after successful retrieval
											</span>
										</div>
									</label>
								</div>

								{/* Refresh Button */}
								<button
									type="button"
									onClick={async () => {
										// Pass Hub page checkbox values to override config (Hub page takes precedence)
										// forceShowModal=true because user explicitly clicked the button - always show modal
										await handleShowWorkerTokenModal(
											setShowWorkerTokenModal, 
											async (status) => setTokenStatus(await status),
											silentApiRetrieval,  // Hub page checkbox value takes precedence
											showTokenAtEnd,      // Hub page checkbox value takes precedence
											true                  // Force show modal - user clicked button
										);
									}}
									style={{
										marginTop: '16px',
										padding: '8px 16px',
										background: tokenStatus.isValid ? '#10b981' : '#6366f1',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										fontSize: '13px',
										fontWeight: '600',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										gap: '6px',
									}}
								>
									<span>🔑</span>
									<span>Get Worker Token</span>
								</button>
							</div>
						</div>
					</div>
				</div>

				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => setFeaturesCollapsed(!featuresCollapsed)}
						aria-expanded={!featuresCollapsed}
					>
						<CollapsibleTitle>
							<span style={{ fontSize: '20px' }}>🚀</span>
							MFA Features
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={featuresCollapsed}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!featuresCollapsed && (
						<CollapsibleContent>
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
						</CollapsibleContent>
					)}
				</CollapsibleSection>

				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => setInfoCollapsed(!infoCollapsed)}
						aria-expanded={!infoCollapsed}
					>
						<CollapsibleTitle>
							<span style={{ fontSize: '20px' }}>📚</span>
							About PingOne MFA
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={infoCollapsed}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!infoCollapsed && (
						<CollapsibleContent>
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
						</CollapsibleContent>
					)}
				</CollapsibleSection>
			</div>

			<style>{`
				.mfa-hub-v8 {
					max-width: 1400px;
					margin: 0 auto;
					background: #f8f9fa;
					min-height: 100vh;
					overflow-y: auto;
					padding-bottom: ${paddingBottom !== '0' ? paddingBottom : '40px'};
					transition: padding-bottom 0.3s ease;
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

			{/* Worker Token Modal */}
			{showWorkerTokenModal && (
				<WorkerTokenModalWrapper
					isOpen={showWorkerTokenModal}
					onClose={async () => {
						setShowWorkerTokenModal(false);
						const newStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
						setTokenStatus(newStatus);
					}}
					onTokenGenerated={async () => {
						const newStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
						setTokenStatus(newStatus);
					}}
				/>
			)}
		</div>
	);
};

export default MFAHubV8;
