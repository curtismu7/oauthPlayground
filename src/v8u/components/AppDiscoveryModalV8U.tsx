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
	AppDiscoveryServiceV8,
	type DiscoveredApplication,
} from '@/v8/services/appDiscoveryServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
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
	const [tokenStatus, setTokenStatus] = useState(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync()
	);

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

	// Check token status
	useEffect(() => {
		if (!isOpen) return;

		const checkStatus = () => {
			const status = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
			setTokenStatus(status);
		};

		checkStatus();
		window.addEventListener('workerTokenUpdated', checkStatus);

		return () => {
			window.removeEventListener('workerTokenUpdated', checkStatus);
		};
	}, [isOpen]);

	// Memoized handleDiscover to prevent infinite loops
	const handleDiscover = useCallback(async () => {
		if (!environmentId.trim()) {
			toastV8.error('Please enter an Environment ID first');
			return;
		}

		if (!tokenStatus.isValid) {
			toastV8.error(tokenStatus.message);
			return;
		}

		setIsLoading(true);
		setApps([]);
		try {
			// Get worker token directly from global service
			const workerToken = await workerTokenServiceV8.getToken();

			// Debug logging
			console.log(`${MODULE_TAG} Worker token retrieved from global service:`, {
				token: workerToken ? `${workerToken.substring(0, 20)}...` : 'null',
				type: typeof workerToken,
				hasValue: !!workerToken,
			});

			if (!workerToken || typeof workerToken !== 'string') {
				console.error(`${MODULE_TAG} Invalid worker token:`, {
					token: workerToken,
					type: typeof workerToken,
				});
				toastV8.error('Worker token required - please generate one first');
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
				toastV8.success(`Found ${mappedApps.length} application(s)`);
			} else {
				toastV8.error('No applications found in this environment');
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Discovery error`, error);
			toastV8.error('Failed to discover applications - check worker token');
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
							}}
						>
							{isLoading ? '🔄 Discovering...' : '🔍 Discover Apps'}
						</button>

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

						{!isLoading && apps.length === 0 && environmentId.trim() && tokenStatus.isValid && (
							<div
								style={{
									padding: '40px',
									textAlign: 'center',
									color: '#6b7280',
									fontSize: '14px',
								}}
							>
								No applications found. Make sure you have a valid Environment ID and worker token.
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

export default AppDiscoveryModalV8U;
