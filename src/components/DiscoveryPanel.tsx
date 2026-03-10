import { FiRefreshCw } from '../icons';
import type React from 'react';
import { useEffect, useId, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { discoveryService, type OpenIDConfiguration } from '../services/discoveryService';
import { RegionSelect } from './RegionSelect';
import { loadEnvironmentId } from '../services/environmentIdService';
import { UnifiedTokenStorageService } from '../services/unifiedTokenStorageService';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';
import { credentialManager } from '../utils/credentialManager';
import { logger } from '../utils/logger';
import CopyIcon from './CopyIcon';

interface DiscoveryPanelProps {
	onConfigurationDiscovered: (config: OpenIDConfiguration, environmentId: string) => void;
	onClose: () => void;
}

const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 1rem;
`;

const Panel = styled.div`
	background: white;
	border-radius: 0.75rem;
	box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
	width: 100%;
	max-width: 800px;
	max-height: 90vh;
	overflow-y: auto;
`;

const Header = styled.div`
	padding: 1.5rem 1.5rem 1rem;
	border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const Title = styled.h2`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: var(--color-text-primary, V9_COLORS.TEXT.GRAY_DARK);
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	padding: 0.5rem;
	border-radius: 0.375rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	transition: all 0.2s;

	&:hover {
		background: #f3f4f6;
		color: V9_COLORS.TEXT.GRAY_DARK;
	}
`;

const Content = styled.div`
	padding: 1.5rem;
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: V9_COLORS.TEXT.GRAY_DARK;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: V9_COLORS.PRIMARY.BLUE;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&:disabled {
		background: #f9fafb;
		color: V9_COLORS.TEXT.GRAY_MEDIUM;
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	background: white;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: V9_COLORS.PRIMARY.BLUE;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary'; size?: 'small' | 'normal' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	border-radius: 0.375rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	border: none;

	${({ variant = 'primary', size = 'normal' }) => `
    ${
			size === 'small'
				? `
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    `
				: `
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
    `
		}

    ${
			variant === 'primary'
				? `
      background: V9_COLORS.PRIMARY.BLUE;
      color: white;

      &:hover:not(:disabled) {
        background: V9_COLORS.PRIMARY.BLUE_DARK;
        transform: translateY(-1px);
      }
    `
				: `
      background: #f3f4f6;
      color: V9_COLORS.TEXT.GRAY_DARK;
      border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;

      &:hover:not(:disabled) {
        background: V9_COLORS.TEXT.GRAY_LIGHTER;
      }
    `
		}
  `}

	&:active {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const StatusMessage = styled.div<{ type: 'success' | 'error' | 'info' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 1rem;
	border-radius: 0.5rem;
	margin-bottom: 1rem;
	font-size: 0.875rem;

	${({ type }) => {
		switch (type) {
			case 'success':
				return `
          background: #f0fdf4;
          border: 1px solid V9_COLORS.BG.SUCCESS_BORDER;
          color: V9_COLORS.PRIMARY.GREEN;
        `;
			case 'error':
				return `
          background: V9_COLORS.BG.ERROR;
          border: 1px solid V9_COLORS.BG.ERROR_BORDER;
          color: V9_COLORS.PRIMARY.RED_DARK;
        `;
			case 'info':
				return `
          background: V9_COLORS.BG.GRAY_LIGHT;
          border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
          color: V9_COLORS.PRIMARY.BLUE_DARK;
        `;
		}
	}}
`;

const ConfigurationDisplay = styled.div`
	background: #f3f4f6;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-top: 1rem;
`;

const ConfigItem = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.5rem 0;
	border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;

	&:last-child {
		border-bottom: none;
	}
`;

const ConfigLabel = styled.span`
	font-weight: 500;
	color: V9_COLORS.TEXT.GRAY_DARK;
	font-size: 0.875rem;
`;

const ConfigValue = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	max-width: 60%;
	word-break: break-all;
`;

const CopyButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	padding: 0.25rem;
	border-radius: 0.25rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	transition: all 0.2s;

	&:hover {
		background: #f3f4f6;
		color: V9_COLORS.TEXT.GRAY_DARK;
	}
`;

const JsonDisplay = styled.pre`
	background: #1e293b;
	color: V9_COLORS.TEXT.GRAY_LIGHTER;
	padding: 1rem;
	border-radius: 0.5rem;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	line-height: 1.5;
	margin: 0;
	max-height: 400px;
	overflow-y: auto;

	/* JSON syntax highlighting */
	.hljs-string {
		color: #a3d977;
	}

	.hljs-number {
		color: #f39c12;
	}

	.hljs-boolean {
		color: #f39c12;
	}

	.hljs-null {
		color: #f39c12;
	}

	.hljs-key {
		color: V9_COLORS.PRIMARY.BLUE_LIGHT;
	}
`;

const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({ onConfigurationDiscovered, onClose }) => {
	const regionSelectId = useId();
	const environmentInputId = useId();

	const [environmentId, setEnvironmentId] = useState('');
	const [region, setRegion] = useState('us');
	const [isLoading, setIsLoading] = useState(false);
	const [status, setStatus] = useState<{
		type: 'success' | 'error' | 'info';
		message: string;
	} | null>(null);
	const [discoveredConfig, setDiscoveredConfig] = useState<OpenIDConfiguration | null>(null);
	const [rawJsonResponse, setRawJsonResponse] = useState<string | null>(null);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<'formatted' | 'json'>('formatted');

	// Load stored discovery preferences when component mounts (IndexedDB, SQLite, unified storage, localStorage)
	useEffect(() => {
		const loadPreferences = async () => {
			try {
				// 1. IndexedDB + SQLite (environmentIdService — dual-storage canonical source)
				const fromEnvService = await loadEnvironmentId();
				if (fromEnvService) {
					setEnvironmentId(fromEnvService);
					logger.info('DiscoveryPanel', 'Pre-populated Environment ID from IndexedDB/SQLite', {
						environmentId: fromEnvService,
					});
					return;
				}

				// 2. Unified storage OAuth credentials (IndexedDB)
				const storage = UnifiedTokenStorageService.getInstance();
				const oauthCreds = await storage.getOAuthCredentials();
				if (oauthCreds?.environmentId) {
					setEnvironmentId(String(oauthCreds.environmentId));
					logger.info('DiscoveryPanel', 'Pre-populated Environment ID from unified storage', {
						environmentId: oauthCreds.environmentId,
					});
					return;
				}

				// 3. Worker token credentials
				const workerCreds = await unifiedWorkerTokenService.loadCredentials();
				if (workerCreds?.environmentId) {
					setEnvironmentId(workerCreds.environmentId);
					logger.info('DiscoveryPanel', 'Pre-populated Environment ID from worker token', {
						environmentId: workerCreds.environmentId,
					});
					return;
				}

				// 4. credentialManager (config/authz flow credentials in localStorage)
				const configCreds = credentialManager.loadConfigCredentials();
				if (configCreds?.environmentId) {
					setEnvironmentId(configCreds.environmentId);
					if (configCreds.redirectUri) {
						// Region can be inferred from config if needed
					}
					logger.info('DiscoveryPanel', 'Pre-populated Environment ID from credentialManager', {
						environmentId: configCreds.environmentId,
					});
					return;
				}

				const authzCreds = credentialManager.loadAuthzFlowCredentials();
				if (authzCreds?.environmentId) {
					setEnvironmentId(authzCreds.environmentId);
					logger.info('DiscoveryPanel', 'Pre-populated Environment ID from authz credentials', {
						environmentId: authzCreds.environmentId,
					});
					return;
				}

				// 5. Legacy: localStorage discovery preferences
				try {
					const stored = localStorage.getItem('pingone_discovery_preferences');
					if (stored) {
						const prefs = JSON.parse(stored);
						if (prefs.environmentId) {
							setEnvironmentId(prefs.environmentId);
							if (prefs.region) {
								setRegion(prefs.region);
							}
							logger.info('DiscoveryPanel', 'Pre-populated from legacy discovery preferences', {
								environmentId: prefs.environmentId,
								region: prefs.region,
							});
						}
					}
				} catch (error) {
					logger.warn(
						'DiscoveryPanel',
						'Failed to load legacy discovery preferences',
						undefined,
						error
					);
				}
			} catch (error) {
				logger.error('DiscoveryPanel', 'Failed to load stored discovery preferences', error);
			}
		};

		loadPreferences();
	}, []);

	// Update environment ID when worker token is updated
	useEffect(() => {
		const handleTokenUpdate = async () => {
			try {
				const credentials = await unifiedWorkerTokenService.loadCredentials();
				if (credentials?.environmentId && !environmentId.trim()) {
					setEnvironmentId(credentials.environmentId);
					logger.info('DiscoveryPanel', 'Auto-populated Environment ID from worker token update', {
						environmentId: credentials.environmentId,
					});
				}
			} catch (error) {
				logger.error('DiscoveryPanel', 'Failed to update environment ID from worker token:', error);
			}
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		return () => {
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
		};
	}, [environmentId]);

	// Save preferences when Environment ID or Region changes
	const handleEnvironmentIdChange = (value: string) => {
		setEnvironmentId(value);
		// Save preferences when user types
		if (value.trim()) {
			credentialManager.saveDiscoveryPreferences({ environmentId: value });
		}
	};

	const handleRegionChange = (value: string) => {
		setRegion(value);
		// Save preferences when user changes region
		credentialManager.saveDiscoveryPreferences({ region: value });
	};

	const handleDiscover = async () => {
		if (!environmentId.trim()) {
			setStatus({ type: 'error', message: 'Please enter an Environment ID' });
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please enter a valid PingOne Environment ID to discover endpoints',
				dismissible: true,
			});
			return;
		}

		if (!discoveryService.validateEnvironmentId(environmentId)) {
			setStatus({
				type: 'error',
				message: 'Invalid Environment ID format. Please enter a valid UUID.',
			});
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message:
					'Environment ID must be a valid UUID format (e.g., 12345678-1234-1234-1234-123456789abc)',
				dismissible: true,
			});
			return;
		}

		// Save discovery preferences
		credentialManager.saveDiscoveryPreferences({
			environmentId,
			region,
		});

		setIsLoading(true);
		setStatus(null);
		try {
			const result = await discoveryService.discoverConfiguration(environmentId, region);

			if (result.success && result.configuration) {
				setDiscoveredConfig(result.configuration);
				// Store the raw JSON response for display
				setRawJsonResponse(JSON.stringify(result.configuration, null, 2));
				setStatus({
					type: 'success',
					message:
						'Configuration discovered successfully. Switch between Formatted and JSON views to see the response.',
				});
				modernMessaging.showFooterMessage({
					type: 'status',
					message: 'saveConfigurationSuccess',
					duration: 4000,
				});
				logger.success('DiscoveryPanel', 'Configuration discovered successfully', {
					environmentId,
					issuer: result.configuration.issuer,
				});
			} else {
				setStatus({
					type: 'error',
					message: result.error || 'Failed to discover configuration',
				});
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'networkError',
					dismissible: true,
				});
			}
		} catch (error) {
			logger.error(
				'DiscoveryPanel',
				' [DiscoveryPanel] Discovery failed:',
				undefined,
				error as Error
			);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'networkError',
				dismissible: true,
			});
			setStatus({
				type: 'error',
				message:
					'Failed to discover configuration. Please verify your Environment ID and try again.',
			});
		}
	};

	const handleApplyConfiguration = () => {
		if (discoveredConfig) {
			try {
				onConfigurationDiscovered(discoveredConfig, environmentId);

				// Clear the discovered config and reset view mode before closing
				setDiscoveredConfig(null);
				setRawJsonResponse(null);
				setViewMode('formatted');

				modernMessaging.showFooterMessage({
					type: 'status',
					message: 'saveConfigurationSuccess',
					duration: 4000,
				});
				onClose();
			} catch (error) {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'stepError',
					dismissible: true,
				});
				logger.error('DiscoveryPanel', 'Failed to apply configuration', error);
			}
		} else {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'stepError',
				dismissible: true,
			});
		}
	};

	const handleCopyToClipboard = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			modernMessaging.showFooterMessage({
				type: 'status',
				message: `${field} copied to clipboard`,
				duration: 4000,
			});
			setTimeout(() => setCopiedField(null), 2000);
		} catch (error) {
			logger.error('DiscoveryPanel', 'Failed to copy:', undefined, error as Error);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: `Failed to copy ${field}`,
				dismissible: true,
			});
		}
	};

	return (
		<Overlay onClick={onClose}>
			<Panel onClick={(e) => e.stopPropagation()}>
				<Header>
					<Title>
						<span>🌐</span>
						PingOne Discovery
					</Title>
					<CloseButton onClick={onClose}>
						<span>❌</span>
					</CloseButton>
				</Header>

				<Content>
					<p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>
						Discover PingOne OpenID Connect configuration automatically. This will populate your
						configuration with the correct endpoints and settings.
					</p>

					<FormGroup>
						<Label htmlFor={environmentInputId}>Environment ID</Label>
						<Input
							id={environmentInputId}
							type="text"
							value={environmentId}
							onChange={(e) => handleEnvironmentIdChange(e.target.value)}
							placeholder="Enter your PingOne Environment ID (UUID format)"
							disabled={isLoading}
						/>
						<small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
							Or paste a PingOne URL to auto-extract the Environment ID
						</small>
					</FormGroup>

					<FormGroup>
						<Label htmlFor={regionSelectId}>Region</Label>
						<RegionSelect
							id={regionSelectId}
							as={Select}
							value={region}
							onChange={handleRegionChange}
							disabled={isLoading}
							variant="compact"
						/>
					</FormGroup>

					<div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
						<Button
							variant="primary"
							onClick={handleDiscover}
							disabled={isLoading || !environmentId.trim()}
						>
							{isLoading ? <FiRefreshCw className="animate-spin" /> : <span>🔍</span>}
							{isLoading ? 'Discovering...' : 'Discover Configuration'}
						</Button>
					</div>

					{status && (
						<StatusMessage type={status.type}>
							{status.type === 'success' && <span>✅</span>}
							{status.type === 'error' && <span>⚠️</span>}
							{status.type === 'info' && <span>⚙️</span>}
							{status.message}
						</StatusMessage>
					)}

					{discoveredConfig && (
						<ConfigurationDisplay>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: '1rem',
								}}
							>
								<h3
									style={{
										margin: '0',
										fontSize: '1rem',
										fontWeight: '600',
									}}
								>
									Discovered Configuration
								</h3>
								<div style={{ display: 'flex', gap: '0.5rem' }}>
									<Button
										variant={viewMode === 'formatted' ? 'primary' : 'secondary'}
										size="small"
										onClick={() => setViewMode('formatted')}
									>
										<span style={{ fontSize: '14px' }}>👁️</span>
										Formatted
									</Button>
									<Button
										variant={viewMode === 'json' ? 'primary' : 'secondary'}
										size="small"
										onClick={() => setViewMode('json')}
									>
										<i className="bi bi-question-circle" style={{ fontSize: '14px' }}></i>
										JSON
									</Button>
								</div>
							</div>

							{viewMode === 'formatted' ? (
								<>
									<ConfigItem>
										<ConfigLabel>Issuer</ConfigLabel>
										<ConfigValue>
											{discoveredConfig.issuer}
											<CopyButton
												onClick={() => handleCopyToClipboard(discoveredConfig.issuer, 'issuer')}
												title="Copy Issuer"
											>
												{copiedField === 'issuer' ? (
													<span style={{ fontSize: '14px' }}>✅</span>
												) : (
													<CopyIcon size={14} />
												)}
											</CopyButton>
										</ConfigValue>
									</ConfigItem>

									<ConfigItem>
										<ConfigLabel>Authorization Endpoint</ConfigLabel>
										<ConfigValue>
											{discoveredConfig.authorization_endpoint}
											<CopyButton
												onClick={() =>
													handleCopyToClipboard(discoveredConfig.authorization_endpoint, 'auth')
												}
												title="Copy Authorization Endpoint"
											>
												{copiedField === 'auth' ? (
													<span style={{ fontSize: '14px' }}>✅</span>
												) : (
													<CopyIcon size={14} />
												)}
											</CopyButton>
										</ConfigValue>
									</ConfigItem>

									<ConfigItem>
										<ConfigLabel>Token Endpoint</ConfigLabel>
										<ConfigValue>
											{discoveredConfig.token_endpoint}
											<CopyButton
												onClick={() =>
													handleCopyToClipboard(discoveredConfig.token_endpoint, 'token')
												}
												title="Copy Token Endpoint"
											>
												{copiedField === 'token' ? (
													<span style={{ fontSize: '14px' }}>✅</span>
												) : (
													<CopyIcon size={14} />
												)}
											</CopyButton>
										</ConfigValue>
									</ConfigItem>

									<ConfigItem>
										<ConfigLabel>UserInfo Endpoint</ConfigLabel>
										<ConfigValue>
											{discoveredConfig.userinfo_endpoint}
											<CopyButton
												onClick={() =>
													handleCopyToClipboard(discoveredConfig.userinfo_endpoint, 'userinfo')
												}
												title="Copy UserInfo Endpoint"
											>
												{copiedField === 'userinfo' ? (
													<span style={{ fontSize: '14px' }}>✅</span>
												) : (
													<CopyIcon size={14} />
												)}
											</CopyButton>
										</ConfigValue>
									</ConfigItem>

									<ConfigItem>
										<ConfigLabel>JWKS URI</ConfigLabel>
										<ConfigValue>
											{discoveredConfig.jwks_uri}
											<CopyButton
												onClick={() => handleCopyToClipboard(discoveredConfig.jwks_uri, 'jwks')}
												title="Copy JWKS URI"
											>
												{copiedField === 'jwks' ? (
													<span style={{ fontSize: '14px' }}>✅</span>
												) : (
													<CopyIcon size={14} />
												)}
											</CopyButton>
										</ConfigValue>
									</ConfigItem>
								</>
							) : (
								<div style={{ marginTop: '1rem' }}>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											marginBottom: '0.5rem',
										}}
									>
										<strong>Raw JSON Response</strong>
										<Button
											variant="secondary"
											size="small"
											onClick={() =>
												rawJsonResponse && handleCopyToClipboard(rawJsonResponse, 'json')
											}
										>
											<CopyIcon size={14} />
											Copy JSON
										</Button>
									</div>
									<JsonDisplay>{rawJsonResponse}</JsonDisplay>
								</div>
							)}

							<div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
								<Button variant="primary" onClick={handleApplyConfiguration}>
									<span>✅</span>
									Apply Configuration
								</Button>
								{discoveredConfig ? (
									<Button
										variant="secondary"
										onClick={() => {
											setDiscoveredConfig(null);
											setRawJsonResponse(null);
											setViewMode('formatted');
											modernMessaging.showFooterMessage({
												type: 'status',
												message: 'saveConfigurationSuccess',
												duration: 4000,
											});
										}}
									>
										<span>🔄</span>
										Clear Configuration
									</Button>
								) : null}
								<Button
									variant="secondary"
									onClick={() => {
										modernMessaging.showFooterMessage({
											type: 'status',
											message: 'saveConfigurationSuccess',
											duration: 4000,
										});
										onClose();
									}}
								>
									<span>❌</span>
									Close
								</Button>
							</div>
						</ConfigurationDisplay>
					)}
				</Content>
			</Panel>
		</Overlay>
	);
};

export default DiscoveryPanel;
