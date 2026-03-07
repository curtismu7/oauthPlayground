/**
 * @file AppDiscoveryModalV8U.tsx
 * @module v8u/components
 * @description Modal for discovering and selecting PingOne applications
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useGlobalWorkerToken } from '@/hooks/useGlobalWorkerToken';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import type { DiscoveredApp } from '@/v8/components/AppPickerV8';
import {
	AppDiscoveryServiceV8,
	type DiscoveredApplication,
} from '@/v8/services/appDiscoveryServiceV8';
import { logger } from '../../utils/logger';

const MODULE_TAG = '[🔍 APP-DISCOVERY-MODAL-V8U]';

interface AppDiscoveryModalV8UProps {
	isOpen: boolean;
	onClose: () => void;
	environmentId: string;
	onAppSelected: (app: DiscoveredApp) => void;
	flowType?: string;
	specVersion?: string;
}

export const AppDiscoveryModalV8U: React.FC<AppDiscoveryModalV8UProps> = ({
	isOpen,
	onClose,
	environmentId,
	onAppSelected,
	flowType,
	specVersion,
}) => {
	// Use unified global worker token hook for token management
	const globalTokenStatus = useGlobalWorkerToken();
	const workerToken = globalTokenStatus.token || '';
	const hasWorkerToken = globalTokenStatus.isValid;

	const [isLoading, setIsLoading] = useState(false);
	const [apps, setApps] = useState<(DiscoveredApp & { fullApp?: DiscoveredApplication })[]>([]);
	const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');

	// Lock body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			// Save current overflow value
			const originalOverflow = document.body.style.overflow;
			// Lock scroll
			document.body.style.overflow = 'hidden';

			// Restore on cleanup
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	}, [isOpen]);

	// Check token status when modal opens
	useEffect(() => {
		if (isOpen) {
			// Token status is now managed by unified service
		}
	}, [isOpen]);

	// Memoized handleDiscover to prevent infinite loops
	const handleDiscover = useCallback(async () => {
		if (!environmentId.trim()) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please enter an Environment ID first',
				dismissible: true,
			});
			return;
		}

		if (!globalTokenStatus.isValid) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: globalTokenStatus.message,
				dismissible: true,
			});
			return;
		}

		setIsLoading(true);
		setApps([]);
		try {
			// Worker token is now managed by unified service
			if (!hasWorkerToken) {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'Worker token required - please generate one first',
					dismissible: true,
				});
				return;
			}

			// Use worker token from unified service
			console.log(`${MODULE_TAG} Worker token retrieved from unified service:`, {
				token: workerToken ? `${workerToken.substring(0, 20)}...` : 'null',
				type: typeof workerToken,
				hasValue: !!workerToken,
			});

			if (!workerToken || typeof workerToken !== 'string') {
				logger.error('AppDiscoveryModalV8U', `Invalid worker token:`, {
					token: workerToken,
					type: typeof workerToken,
				});
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'Worker token required - please generate one first',
					dismissible: true,
				});
				setIsLoading(false);
				return;
			}

			const discovered = await AppDiscoveryServiceV8.discoverApplications(
				environmentId,
				workerToken
			);
			if (discovered && discovered.length > 0) {
				// Map to DiscoveredApp format, but keep full app data for applying config
				const mappedApps: (DiscoveredApp & { fullApp?: DiscoveredApplication })[] = discovered.map(
					(app: DiscoveredApplication) => ({
						id: app.id,
						name: app.name,
						...(app.description && { description: app.description }),
						enabled: app.enabled,
						redirectUris: app.redirectUris || [],
						logoutUris: [],
						fullApp: app, // Store full app data for applying config
					})
				);
				setApps(mappedApps);
				modernMessaging.showFooterMessage({
					type: 'info',
					message: `Found ${mappedApps.length} application(s)`,
					duration: 3000,
				});
			} else {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'No applications found in this environment',
					dismissible: true,
				});
			}
		} catch (error) {
			logger.error('AppDiscoveryModalV8U', `Discovery error`, undefined, error);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to discover applications - check worker token',
				dismissible: true,
			});
		} finally {
			setIsLoading(false);
		}
	}, [environmentId, globalTokenStatus, hasWorkerToken, workerToken]);

	// Auto-discover on open if token is valid
	useEffect(() => {
		if (isOpen && environmentId.trim() && globalTokenStatus.isValid && apps.length === 0) {
			handleDiscover();
		}
	}, [isOpen, environmentId, globalTokenStatus.isValid, apps.length, handleDiscover]);

	const handleSelectApp = (app: DiscoveredApp) => {
		setSelectedAppId(app.id);
	};

	const handleApplyToCredentials = () => {
		if (!selectedAppId) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please select an application first',
				dismissible: true,
			});
			return;
		}

		const selectedApp = apps.find((app) => app.id === selectedAppId);
		if (!selectedApp) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Selected application not found',
				dismissible: true,
			});
			return;
		}

		// If we have full app data, use AppDiscoveryServiceV8.getAppConfig() to get proper config
		// Otherwise just use the basic DiscoveredApp data
		if (selectedApp.fullApp) {
			const appConfig = AppDiscoveryServiceV8.getAppConfig(selectedApp.fullApp);
			// Create enhanced app object with config data (excluding redirectUri as user mentioned)
			const enhancedApp: DiscoveredApp = {
				id: selectedApp.id,
				name: selectedApp.name,
				...(selectedApp.description && { description: selectedApp.description }),
				...(selectedApp.enabled !== undefined && { enabled: selectedApp.enabled }),
				redirectUris: [], // Don't apply redirect URIs - app dictates this
				logoutUris: selectedApp.logoutUris || [],
			};
			// Add config fields that make sense to apply (using type assertion for additional properties)
			if (appConfig.tokenEndpointAuthMethod) {
				(enhancedApp as unknown as { tokenEndpointAuthMethod?: string }).tokenEndpointAuthMethod =
					appConfig.tokenEndpointAuthMethod;
			}
			if (appConfig.usePkce !== undefined) {
				(enhancedApp as unknown as { usePkce?: boolean }).usePkce = appConfig.usePkce;
			}
			if (appConfig.scopes) {
				(enhancedApp as unknown as { scopes?: string[] }).scopes = appConfig.scopes;
			}
			// Add refreshTokenDuration if available (indicates app supports refresh tokens)
			if (appConfig.refreshTokenDuration) {
				(enhancedApp as unknown as { refreshTokenDuration?: number }).refreshTokenDuration =
					appConfig.refreshTokenDuration;
			}
			onAppSelected(enhancedApp);
		} else {
			// Fallback to basic app data
			onAppSelected(selectedApp);
		}

		modernMessaging.showFooterMessage({
			type: 'info',
			message: `Applied settings from ${selectedApp.name}`,
			duration: 3000,
		});
		onClose();
	};

	// Filter apps based on search query
	const filteredApps = apps.filter((app) => {
		if (!searchQuery.trim()) return true;
		const query = searchQuery.toLowerCase();
		return (
			app.name.toLowerCase().includes(query) ||
			app.id.toLowerCase().includes(query) ||
			app.description?.toLowerCase().includes(query)
		);
	});

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<button
				type="button"
				aria-label="Close app discovery modal"
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						onClose();
					}
				}}
				tabIndex={-1}
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0, 0, 0, 0.5)',
					zIndex: 1000,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					border: 'none',
					margin: 0,
					padding: 0,
					cursor: 'pointer',
				}}
			>
				{/* Modal */}
				<div
					role="dialog"
					aria-modal="true"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => {
						if (e.key === 'Escape') {
							onClose();
						}
					}}
					style={{
						background: 'white',
						borderRadius: '10px',
						width: '90%',
						maxWidth: '640px',
						maxHeight: '85vh',
						overflow: 'auto',
						boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
						zIndex: 1001,
					}}
				>
					{/* Header */}
					<div
						style={{
							padding: '11px 16px',
							borderBottom: '1px solid #e5e7eb',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						<h2
							style={{
								margin: 0,
								fontSize: '16px',
								fontWeight: '600',
								color: '#1f2937',
							}}
						>
							📱 Discover Applications
						</h2>
						<button
							onClick={onClose}
							type="button"
							style={{
								background: 'none',
								border: 'none',
								fontSize: '20px',
								cursor: 'pointer',
								color: '#6b7280',
								padding: '2px 6px',
								lineHeight: 1,
							}}
						>
							×
						</button>
					</div>

					{/* Content */}
					<div style={{ padding: '12px 16px' }}>
						{/* Flow Type Display */}
						{(flowType || specVersion) && (
							<div
								style={{
									padding: '9px 14px',
									marginBottom: '10px',
									background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
									borderRadius: '6px',
									textAlign: 'center',
								}}
							>
								<div
									style={{
										fontSize: '12px',
										fontWeight: '700',
										color: 'white',
										marginBottom: '2px',
										textTransform: 'uppercase',
										letterSpacing: '0.5px',
									}}
								>
									{specVersion === 'oidc' && 'OpenID Connect (OIDC)'}
									{specVersion === 'oauth2.0' && 'OAuth 2.0'}
									{specVersion === 'oauth2.1' && 'OAuth 2.1'}
									{!specVersion && 'OAuth Flow'}
								</div>
								<div
									style={{
										fontSize: '12px',
										color: 'rgba(255, 255, 255, 0.9)',
										fontWeight: '500',
									}}
								>
									{flowType === 'oauth-authz' && 'Authorization Code Flow'}
									{flowType === 'implicit' && 'Implicit Flow'}
									{flowType === 'hybrid' && 'Hybrid Flow'}
									{flowType === 'client-credentials' && 'Client Credentials Flow'}
									{flowType === 'device-code' && 'Device Code Flow'}
									{flowType === 'ropc' && 'Resource Owner Password Credentials Flow'}
									{!flowType && 'Select an application that matches your flow type'}
								</div>
							</div>
						)}

						{/* Token Status */}
						<div
							style={{
								padding: '7px 12px',
								marginBottom: '10px',
								background: globalTokenStatus.isLoading
									? '#f3f4f6'
									: globalTokenStatus.isValid
										? '#d1fae5'
										: '#fee2e2',
								border: `1px solid ${globalTokenStatus.isLoading ? '#d1d5db' : globalTokenStatus.isValid ? '#6ee7b7' : '#fca5a5'}`,
								borderRadius: '6px',
								fontSize: '12px',
								color: globalTokenStatus.isLoading
									? '#6b7280'
									: globalTokenStatus.isValid
										? '#065f46'
										: '#991b1b',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
						>
							<span>
								{globalTokenStatus.isLoading ? '⏳' : globalTokenStatus.isValid ? '✅' : '⚠️'}
							</span>
							<span>{globalTokenStatus.message}</span>
						</div>

						{/* Environment ID */}
						<div style={{ marginBottom: '10px' }}>
							<label
								htmlFor="environment-id-input"
								style={{
									display: 'block',
									fontSize: '12px',
									fontWeight: '600',
									color: '#374151',
									marginBottom: '4px',
								}}
							>
								Environment ID <span style={{ color: '#ef4444' }}>*</span>
							</label>
							<input
								id="environment-id-input"
								type="text"
								value={environmentId}
								readOnly
								style={{
									width: '100%',
									padding: '7px 10px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '13px',
									background: '#f9fafb',
									color: '#6b7280',
								}}
							/>
						</div>

						{/* Discover Button */}
						<button
							type="button"
							onClick={handleDiscover}
							disabled={isLoading || !environmentId.trim() || !globalTokenStatus.isValid}
							style={{
								width: '100%',
								padding: '9px 14px',
								marginBottom: '10px',
								background:
									isLoading || !environmentId.trim() || !globalTokenStatus.isValid
										? '#9ca3af'
										: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '13px',
								fontWeight: '600',
								cursor:
									isLoading || !environmentId.trim() || !globalTokenStatus.isValid
										? 'not-allowed'
										: 'pointer',
								transition: 'background 0.2s ease',
							}}
						>
							{isLoading ? '🔄 Discovering...' : '🔍 Discover Apps'}
						</button>

						{/* Search Field */}
						{apps.length > 0 && (
							<div style={{ marginBottom: '8px' }}>
								<input
									id="search-apps-input"
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									onClick={(e) => e.stopPropagation()}
									onFocus={(e) => e.stopPropagation()}
									onKeyDown={(e) => e.stopPropagation()}
									placeholder="Search by name, description, or ID..."
									style={{
										width: '100%',
										padding: '7px 10px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										fontSize: '13px',
										background: 'white',
										color: '#1f2937',
									}}
								/>
							</div>
						)}

						{/* App List */}
						{isLoading && (
							<div
								style={{
									padding: '20px',
									textAlign: 'center',
									color: '#6b7280',
									fontSize: '13px',
								}}
							>
								🔄 Discovering applications...
							</div>
						)}

						{!isLoading && apps.length > 0 && (
							<>
								{filteredApps.length === 0 && searchQuery.trim() && (
									<div
										style={{
											padding: '10px',
											textAlign: 'center',
											color: '#6b7280',
											fontSize: '13px',
											marginBottom: '8px',
											background: '#f9fafb',
											borderRadius: '6px',
											border: '1px solid #e5e7eb',
										}}
									>
										No applications match "{searchQuery}"
									</div>
								)}
								{filteredApps.length > 0 && (
									<div
										style={{
											border: '1px solid #e5e7eb',
											borderRadius: '6px',
											maxHeight: '300px',
											overflow: 'auto',
											marginBottom: '10px',
										}}
									>
										{filteredApps.map((app) => (
											<button
												key={app.id}
												type="button"
												onClick={() => handleSelectApp(app)}
												onKeyDown={(e) => {
													if (e.key === 'Enter' || e.key === ' ') {
														e.preventDefault();
														handleSelectApp(app);
													}
												}}
												style={{
													padding: '8px 12px',
													borderBottom: '1px solid #e5e7eb',
													cursor: 'pointer',
													borderLeft:
														selectedAppId === app.id
															? '3px solid #3b82f6'
															: '3px solid transparent',
													transition: 'background 0.2s ease',
													border: 'none',
													background: selectedAppId === app.id ? '#eff6ff' : 'white',
													textAlign: 'left',
													width: '100%',
												}}
												onMouseEnter={(e) => {
													if (selectedAppId !== app.id) {
														e.currentTarget.style.background = '#f9fafb';
													}
												}}
												onMouseLeave={(e) => {
													if (selectedAppId !== app.id) {
														e.currentTarget.style.background = 'white';
													}
												}}
											>
												<div
													style={{
														fontWeight: '600',
														fontSize: '13px',
														color: '#1f2937',
														marginBottom: '2px',
														wordBreak: 'break-word',
														display: 'flex',
														alignItems: 'center',
														gap: '5px',
													}}
												>
													{app.name}
													{selectedAppId === app.id && (
														<span
															style={{
																fontSize: '11px',
																color: '#3b82f6',
																fontWeight: '500',
															}}
														>
															✓ Selected
														</span>
													)}
												</div>
												{app.description && (
													<div
														style={{
															fontSize: '11px',
															color: '#6b7280',
															marginBottom: '2px',
															wordBreak: 'break-word',
														}}
													>
														{app.description}
													</div>
												)}
												<div
													style={{
														fontSize: '11px',
														color: '#9ca3af',
														marginBottom: '2px',
														wordBreak: 'break-all',
													}}
												>
													ID: {app.id}
												</div>
												{app.redirectUris && app.redirectUris.length > 0 && (
													<div
														style={{
															fontSize: '11px',
															color: '#6b7280',
															marginTop: '2px',
														}}
													>
														Redirect URIs: {app.redirectUris.length}
													</div>
												)}
											</button>
										))}
									</div>
								)}

								{/* Apply to Credentials Button */}
								{selectedAppId && apps.some((app) => app.id === selectedAppId) && (
									<>
										<div
											style={{
												padding: '7px 10px',
												marginBottom: '8px',
												background: '#fef3c7',
												border: '1px solid #fcd34d',
												borderRadius: '6px',
												fontSize: '12px',
												color: '#92400e',
											}}
										>
											<strong>⚠️ Note:</strong> Client Secret cannot be applied automatically for
											security reasons. You will need to copy it manually from the PingOne Console.
										</div>
										<button
											type="button"
											onClick={handleApplyToCredentials}
											style={{
												width: '100%',
												padding: '9px 14px',
												background: '#10b981',
												color: 'white',
												border: 'none',
												borderRadius: '6px',
												fontSize: '13px',
												fontWeight: '600',
												cursor: 'pointer',
												transition: 'background  0.15s ease',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background = '#059669';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = '#10b981';
											}}
										>
											✅ Apply to Credentials
										</button>
									</>
								)}
							</>
						)}

						{!isLoading &&
							apps.length === 0 &&
							environmentId.trim() &&
							globalTokenStatus.isValid && (
								<div
									style={{
										padding: '20px',
										textAlign: 'center',
										color: '#6b7280',
										fontSize: '13px',
									}}
								>
									No applications found. Make sure you have a valid Environment ID and worker token.
								</div>
							)}
					</div>
				</div>
			</button>
		</>
	);
};

export default AppDiscoveryModalV8U;
