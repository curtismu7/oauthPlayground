/**
 * @file AppDiscoveryModalV8U.tsx
 * @module v8u/components
 * @description Modal for discovering and selecting PingOne applications
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { DiscoveredApp } from '@/v8/components/AppPickerV8';
import {
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';
	AppDiscoveryServiceV8,
	type DiscoveredApplication,
} from '@/v8/services/appDiscoveryServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import {
	type TokenStatusInfo,
	WorkerTokenStatusServiceV8,
} from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔍 APP-DISCOVERY-MODAL-V8U]';

interface AppDiscoveryModalV8UProps {
	isOpen: boolean;
	onClose: () => void;
	environmentId: string;
	onAppSelected: (app: DiscoveredApp) => void;
}

export const AppDiscoveryModalV8U: React.FC<AppDiscoveryModalV8UProps> = ({
	isOpen,
	onClose,
	environmentId,
	onAppSelected,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [apps, setApps] = useState<(DiscoveredApp & { fullApp?: DiscoveredApplication })[]>([]);
	const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [tokenStatus, setTokenStatus] = useState<TokenStatusInfo>({
		status: 'missing',
		message: 'Checking...',
		isValid: false,
		expiresAt: null,
		minutesRemaining: 0,
	});

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

	// Check worker token status and listen for updates
	useEffect(() => {
		const checkStatus = async () => {
			try {
				const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				setTokenStatus(status);
			} catch (error) {
				logger.error(Failed to check token status:`, error);
				setTokenStatus({
					status: 'missing',
					message: 'Failed to check token status',
					isValid: false,
					expiresAt: null,
					minutesRemaining: 0,
				});
			}
		};

		checkStatus();
		window.addEventListener('workerTokenUpdated', checkStatus);

		return () => {
			window.removeEventListener('workerTokenUpdated', checkStatus);
		};
	}, [isOpen]);

	// Memoized handleDiscover to prevent infinite loops
	const handleDiscover = useCallback(async () => {
		logger.debug(Starting application discovery...`);

		// Validate environment ID
		if (!environmentId.trim()) {
			logger.error(Missing environment ID`);
			toastV8.error('Environment ID is required');
			return;
		}

		// Validate worker token status
		if (!tokenStatus.isValid) {
			logger.error(Invalid worker token status:`, tokenStatus);
			toastV8.error(`Worker token issue: ${tokenStatus.message}`);
			return;
		}

		setIsLoading(true);
		setApps([]);

		try {
			logger.debug(Getting worker token from global service...`);

			// Get worker token directly from global service
			const workerToken = await workerTokenServiceV8.getToken();

			// Enhanced debug logging
			logger.debug(Worker token retrieved:`, {
				hasToken: !!workerToken,
				tokenType: typeof workerToken,
				tokenLength: workerToken ? workerToken.length : 0,
				tokenPreview: workerToken ? `${workerToken.substring(0, 20)}...` : 'null',
				environmentId: environmentId,
			});

			if (!workerToken || typeof workerToken !== 'string' || !workerToken.trim()) {
				logger.error(Invalid worker token:`, {
					token: workerToken,
					type: typeof workerToken,
					isString: typeof workerToken === 'string',
					isEmpty: !workerToken?.trim(),
				});
				toastV8.error('Valid worker token required - please generate one first');
				return;
			}

			logger.debug(Calling AppDiscoveryServiceV8.discoverApplications...`);

			const discovered = await AppDiscoveryServiceV8.discoverApplications(
				environmentId.trim(),
				workerToken.trim()
			);

			logger.debug(Discovery result:`, {
				hasData: !!discovered,
				isArray: Array.isArray(discovered),
				length: discovered?.length || 0,
				firstApp: discovered?.[0]?.name || 'none',
			});

			if (discovered && Array.isArray(discovered) && discovered.length > 0) {
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

				logger.debug(Successfully mapped ${mappedApps.length} applications`);
				setApps(mappedApps);
				toastV8.success(`Found ${mappedApps.length} application(s)`);
			} else {
				logger.warn(No applications found`, {
					discovered,
					environmentId,
					tokenValid: tokenStatus.isValid,
				});
				toastV8.warning('No applications found in this environment');
			}
		} catch (error) {
			logger.error(Discovery failed:`, {
				error: error,
				message: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : 'No stack trace',
				environmentId,
				tokenValid: tokenStatus.isValid,
			});

			// Enhanced error messages based on error type
			let errorMessage = 'Failed to discover applications';

			if (error instanceof Error) {
				if (error.message.includes('Failed to fetch')) {
					errorMessage = 'Network error - check connection and try again';
				} else if (error.message.includes('401') || error.message.includes('403')) {
					errorMessage = 'Authentication failed - worker token may be expired';
				} else if (error.message.includes('404')) {
					errorMessage = 'Environment not found - check environment ID';
				} else if (error.message.includes('cors') || error.message.includes('CORS')) {
					errorMessage = 'CORS error - check server configuration';
				} else if (error.message.includes('worker token')) {
					errorMessage = 'Worker token issue - please generate a new one';
				}
			}

			toastV8.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [environmentId, tokenStatus]);

	// Auto-discover on open if token is valid
	useEffect(() => {
		if (isOpen && environmentId.trim() && tokenStatus.isValid && apps.length === 0) {
			handleDiscover();
		}
	}, [isOpen, environmentId, tokenStatus.isValid, apps.length, handleDiscover]);

	const handleSelectApp = (app: DiscoveredApp) => {
		setSelectedAppId(app.id);
	};

	const handleApplyToCredentials = () => {
		if (!selectedAppId) {
			toastV8.error('Please select an application first');
			return;
		}

		const selectedApp = apps.find((app) => app.id === selectedAppId);
		if (!selectedApp) {
			toastV8.error('Selected application not found');
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

		toastV8.success(`Applied settings from ${selectedApp.name}`);
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
			<div
				onClick={onClose}
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
				}}
			>
				{/* Modal */}
				<div
					onClick={(e) => e.stopPropagation()}
					style={{
						background: 'white',
						borderRadius: '12px',
						width: '90%',
						maxWidth: '700px',
						maxHeight: '80vh',
						overflow: 'auto',
						boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
						zIndex: 1001,
					}}
				>
					{/* Header */}
					<div
						style={{
							padding: '20px 24px',
							borderBottom: '1px solid #e5e7eb',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						<h2
							style={{
								margin: 0,
								fontSize: '20px',
								fontWeight: '600',
								color: '#1f2937',
							}}
						>
							📱 Discover Applications
						</h2>
						<button
							onClick={onClose}
							style={{
								background: 'none',
								border: 'none',
								fontSize: '24px',
								cursor: 'pointer',
								color: '#6b7280',
								padding: '4px 8px',
								lineHeight: 1,
							}}
						>
							×
						</button>
					</div>

					{/* Content */}
					<div style={{ padding: '24px' }}>
						{/* Token Status */}
						<div
							style={{
								padding: '12px 16px',
								marginBottom: '20px',
								background:
									tokenStatus.status === 'valid'
										? '#d1fae5'
										: tokenStatus.status === 'expiring-soon'
											? '#fef3c7'
											: '#fee2e2',
								border: `1px solid ${WorkerTokenStatusServiceV8.getStatusColor(tokenStatus.status)}`,
								borderRadius: '8px',
								fontSize: '14px',
								color:
									tokenStatus.status === 'valid'
										? '#065f46'
										: tokenStatus.status === 'expiring-soon'
											? '#92400e'
											: '#991b1b',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
						>
							<span>{WorkerTokenStatusServiceV8.getStatusIcon(tokenStatus.status)}</span>
							<span>{tokenStatus.message}</span>
						</div>

						{/* Environment ID */}
						<div style={{ marginBottom: '20px' }}>
							<label
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '600',
									color: '#1f2937',
									marginBottom: '8px',
								}}
							>
								Environment ID <span style={{ color: '#ef4444' }}>*</span>
							</label>
							<input
								type="text"
								value={environmentId}
								readOnly
								style={{
									width: '100%',
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
									background: '#f9fafb',
									color: '#6b7280',
								}}
							/>
						</div>

						{/* Discover Button */}
						<button
							type="button"
							onClick={handleDiscover}
							disabled={isLoading || !environmentId.trim() || !tokenStatus.isValid}
							style={{
								width: '100%',
								padding: '12px 16px',
								marginBottom: '20px',
								background:
									isLoading || !environmentId.trim() || !tokenStatus.isValid
										? '#9ca3af'
										: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '600',
								cursor:
									isLoading || !environmentId.trim() || !tokenStatus.isValid
										? 'not-allowed'
										: 'pointer',
								transition: 'background 0.2s ease',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '8px',
							}}
						>
							{isLoading && (
								<div
									style={{
										width: '16px',
										height: '16px',
										border: '2px solid #ffffff',
										borderTop: '2px solid transparent',
										borderRadius: '50%',
										animation: 'spin 1s linear infinite',
									}}
								/>
							)}
							{isLoading ? 'Discovering Applications...' : '🔍 Discover Apps'}
						</button>

						{/* Retry Button for Errors */}
						{!isLoading && apps.length === 0 && tokenStatus.isValid && environmentId.trim() && (
							<button
								type="button"
								onClick={handleDiscover}
								style={{
									width: '100%',
									padding: '8px 16px',
									marginBottom: '20px',
									background: '#f59e0b',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '12px',
									fontWeight: '500',
									cursor: 'pointer',
									transition: 'background 0.2s ease',
								}}
								onMouseOver={(e) => {
									e.currentTarget.style.background = '#d97706';
								}}
								onMouseOut={(e) => {
									e.currentTarget.style.background = '#f59e0b';
								}}
							>
								🔄 Retry Discovery
							</button>
						)}

						{/* Search Field */}
						{apps.length > 0 && (
							<div style={{ marginBottom: '16px' }}>
								<label
									style={{
										display: 'block',
										fontSize: '14px',
										fontWeight: '600',
										color: '#1f2937',
										marginBottom: '8px',
									}}
								>
									🔍 Search Applications
								</label>
								<input
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									onClick={(e) => e.stopPropagation()}
									onFocus={(e) => e.stopPropagation()}
									onKeyDown={(e) => e.stopPropagation()}
									placeholder="Search by name, description, or ID..."
									style={{
										width: '100%',
										padding: '10px 12px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										fontSize: '14px',
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
									padding: '40px',
									textAlign: 'center',
									color: '#6b7280',
									fontSize: '14px',
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
											padding: '20px',
											textAlign: 'center',
											color: '#6b7280',
											fontSize: '14px',
											marginBottom: '16px',
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
											borderRadius: '8px',
											maxHeight: '400px',
											overflow: 'auto',
											marginBottom: '16px',
										}}
									>
										{filteredApps.map((app) => (
											<div
												key={app.id}
												onClick={() => handleSelectApp(app)}
												style={{
													padding: '16px',
													borderBottom: '1px solid #e5e7eb',
													cursor: 'pointer',
													background: selectedAppId === app.id ? '#eff6ff' : 'white',
													borderLeft:
														selectedAppId === app.id
															? '4px solid #3b82f6'
															: '4px solid transparent',
													transition: 'background 0.2s ease',
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
														fontSize: '16px',
														color: '#1f2937',
														marginBottom: '6px',
														wordBreak: 'break-word',
														display: 'flex',
														alignItems: 'center',
														gap: '8px',
													}}
												>
													{app.name}
													{selectedAppId === app.id && (
														<span
															style={{
																fontSize: '12px',
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
															fontSize: '14px',
															color: '#6b7280',
															marginBottom: '8px',
															wordBreak: 'break-word',
														}}
													>
														{app.description}
													</div>
												)}
												<div
													style={{
														fontSize: '12px',
														color: '#9ca3af',
														marginBottom: '4px',
														wordBreak: 'break-all',
													}}
												>
													ID: {app.id}
												</div>
												{app.redirectUris && app.redirectUris.length > 0 && (
													<div
														style={{
															fontSize: '12px',
															color: '#6b7280',
															marginTop: '4px',
														}}
													>
														Redirect URIs: {app.redirectUris.length}
													</div>
												)}
											</div>
										))}
									</div>
								)}

								{/* Apply to Credentials Button */}
								{selectedAppId && apps.some((app) => app.id === selectedAppId) && (
									<>
										<div
											style={{
												padding: '12px 16px',
												marginBottom: '12px',
												background: '#fef3c7',
												border: '1px solid #fcd34d',
												borderRadius: '6px',
												fontSize: '13px',
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
												padding: '12px 16px',
												background: '#10b981',
												color: 'white',
												border: 'none',
												borderRadius: '6px',
												fontSize: '14px',
												fontWeight: '600',
												cursor: 'pointer',
												transition: 'background 0.2s ease',
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

						{isLoading && (
							<div
								style={{
									padding: '60px 20px',
									textAlign: 'center',
									color: '#6b7280',
									fontSize: '14px',
								}}
							>
								<div
									style={{
										width: '40px',
										height: '40px',
										border: '4px solid #e5e7eb',
										borderTop: '4px solid #3b82f6',
										borderRadius: '50%',
										animation: 'spin 1s linear infinite',
										margin: '0 auto 20px auto',
									}}
								/>
								<div style={{ fontWeight: '600', marginBottom: '8px' }}>
									Discovering Applications...
								</div>
								<div style={{ fontSize: '12px', color: '#9ca3af' }}>
									Fetching applications from PingOne API
								</div>
							</div>
						)}

						{!isLoading && apps.length === 0 && environmentId.trim() && tokenStatus.isValid && (
							<div
								style={{
									padding: '40px',
									textAlign: 'center',
									color: '#6b7280',
									fontSize: '14px',
								}}
							>
								<div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
								<div style={{ fontWeight: '600', marginBottom: '8px' }}>No Applications Found</div>
								<div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>
									No applications were found in this environment. Check your environment ID and
									permissions.
								</div>
								<div style={{ fontSize: '12px', color: '#6b7280' }}>
									<strong>Troubleshooting tips:</strong>
									<ul style={{ textAlign: 'left', marginTop: '8px', paddingLeft: '20px' }}>
										<li>Verify your environment ID is correct</li>
										<li>Ensure your worker token has the required permissions</li>
										<li>Check if applications exist in this environment</li>
										<li>Try clicking the retry button above</li>
									</ul>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

export default AppDiscoveryModalV8U;
