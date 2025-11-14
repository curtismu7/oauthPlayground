import type React from 'react';
import { useEffect, useId, useState } from 'react';
import {
	FiAlertCircle,
	FiCheck,
	FiCheckCircle,
	FiCode,
	FiEye,
	FiGlobe,
	FiRefreshCw,
	FiSearch,
	FiSettings,
	FiX,
} from 'react-icons/fi';
import styled from 'styled-components';
import { discoveryService, type OpenIDConfiguration } from '../services/discoveryService';
import { credentialManager } from '../utils/credentialManager';
import { logger } from '../utils/logger';
import { v4ToastManager } from '../utils/v4ToastMessages';
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
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary, #111827);
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
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #374151;
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
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background: #f9fafb;
    color: #6b7280;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
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
      background: #3b82f6;
      color: white;

      &:hover:not(:disabled) {
        background: #2563eb;
        transform: translateY(-1px);
      }
    `
				: `
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;

      &:hover:not(:disabled) {
        background: #e5e7eb;
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
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
			case 'error':
				return `
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        `;
			case 'info':
				return `
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
        `;
		}
	}}
`;

const ConfigurationDisplay = styled.div`
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
`;

const ConfigItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;

  &:last-child {
    border-bottom: none;
  }
`;

const ConfigLabel = styled.span`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`;

const ConfigValue = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  color: #6b7280;
  max-width: 60%;
  word-break: break-all;
`;

const CopyButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	padding: 0.25rem;
	border-radius: 0.25rem;
	color: #6b7280;
	transition: all 0.2s;

	&:hover {
		background: #f3f4f6;
		color: #374151;
	}
`;

const JsonDisplay = styled.pre`
	background: #1e293b;
	color: #e2e8f0;
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
		color: #60a5fa;
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

	// Load stored discovery preferences when component mounts
	useEffect(() => {
		try {
			// Load discovery preferences (Environment ID and Region)
			const preferences = credentialManager.loadDiscoveryPreferences();

			if (preferences.environmentId) {
				setEnvironmentId(preferences.environmentId);
				logger.info('DiscoveryPanel', 'Pre-populated Environment ID from discovery preferences', {
					environmentId: preferences.environmentId,
				});
			} else {
				// Fallback: Try to load from existing credentials
				const configCreds = credentialManager.loadConfigCredentials();
				const authzCreds = credentialManager.loadAuthzFlowCredentials();

				let allCredentials = configCreds;
				if (!allCredentials.environmentId && !allCredentials.clientId) {
					allCredentials = authzCreds;
				}

				if (!allCredentials.environmentId && !allCredentials.clientId) {
					try {
						const oldCredentials = credentialManager.getAllCredentials();
						if (oldCredentials.environmentId) {
							allCredentials = oldCredentials;
						}
					} catch (error) {
						console.log(' [DiscoveryPanel] Fallback getAllCredentials() failed:', error);
					}
				}

				if (allCredentials.environmentId) {
					setEnvironmentId(allCredentials.environmentId);
					logger.info('DiscoveryPanel', 'Pre-populated Environment ID from stored credentials', {
						environmentId: allCredentials.environmentId,
					});
				}
			}

			// Set the region from preferences
			setRegion(preferences.region);
			logger.info('DiscoveryPanel', 'Pre-populated Region from discovery preferences', {
				region: preferences.region,
			});
		} catch (error) {
			logger.error('DiscoveryPanel', 'Failed to load stored discovery preferences', error);
		}
	}, []);

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
			v4ToastManager.showError('Please enter a valid PingOne Environment ID to discover endpoints');
			return;
		}

		if (!discoveryService.validateEnvironmentId(environmentId)) {
			setStatus({
				type: 'error',
				message: 'Invalid Environment ID format. Please enter a valid UUID.',
			});
			v4ToastManager.showError(
				'Environment ID must be a valid UUID format (e.g., 12345678-1234-1234-1234-123456789abc)'
			);
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
				v4ToastManager.showSuccess('saveConfigurationSuccess');
				logger.success('DiscoveryPanel', 'Configuration discovered successfully', {
					environmentId,
					issuer: result.configuration.issuer,
				});
			} else {
				setStatus({
					type: 'error',
					message: result.error || 'Failed to discover configuration',
				});
				v4ToastManager.showError('networkError');
			}
		} catch (error) {
			console.error(' [DiscoveryPanel] Discovery failed:', error);
			v4ToastManager.showError('networkError');
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

				v4ToastManager.showSuccess('saveConfigurationSuccess');
				onClose();
			} catch (error) {
				v4ToastManager.showError('stepError');
				logger.error('DiscoveryPanel', 'Failed to apply configuration', error);
			}
		} else {
			v4ToastManager.showError('stepError');
		}
	};

	const handleCopyToClipboard = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			v4ToastManager.showCopySuccess(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
			v4ToastManager.showCopyError(field);
		}
	};

	return (
		<Overlay onClick={onClose}>
			<Panel onClick={(e) => e.stopPropagation()}>
				<Header>
					<Title>
						<FiGlobe />
						PingOne Discovery
					</Title>
					<CloseButton onClick={onClose}>
						<FiX />
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
						<Select
							id={regionSelectId}
							value={region}
							onChange={(e) => handleRegionChange(e.target.value)}
							disabled={isLoading}
						>
							<option value="us">United States (us)</option>
							<option value="eu">Europe (eu)</option>
							<option value="ca">Canada (ca)</option>
							<option value="ap">Asia Pacific (ap)</option>
						</Select>
					</FormGroup>

					<div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
						<Button
							variant="primary"
							onClick={handleDiscover}
							disabled={isLoading || !environmentId.trim()}
						>
							{isLoading ? <FiRefreshCw className="animate-spin" /> : <FiSearch />}
							{isLoading ? 'Discovering...' : 'Discover Configuration'}
						</Button>
					</div>

					{status && (
						<StatusMessage type={status.type}>
							{status.type === 'success' && <FiCheckCircle />}
							{status.type === 'error' && <FiAlertCircle />}
							{status.type === 'info' && <FiSettings />}
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
										<FiEye size={14} />
										Formatted
									</Button>
									<Button
										variant={viewMode === 'json' ? 'primary' : 'secondary'}
										size="small"
										onClick={() => setViewMode('json')}
									>
										<FiCode size={14} />
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
												{copiedField === 'issuer' ? <FiCheck size={14} /> : <CopyIcon size={14} />}
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
												{copiedField === 'auth' ? <FiCheck size={14} /> : <CopyIcon size={14} />}
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
												{copiedField === 'token' ? <FiCheck size={14} /> : <CopyIcon size={14} />}
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
													<FiCheck size={14} />
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
												{copiedField === 'jwks' ? <FiCheck size={14} /> : <CopyIcon size={14} />}
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
									<FiCheckCircle />
									Apply Configuration
								</Button>
								{discoveredConfig ? (
									<Button
										variant="secondary"
										onClick={() => {
											setDiscoveredConfig(null);
											setRawJsonResponse(null);
											setViewMode('formatted');
											v4ToastManager.showSuccess('saveConfigurationSuccess');
										}}
									>
										<FiRefreshCw />
										Clear Configuration
									</Button>
								) : null}
								<Button
									variant="secondary"
									onClick={() => {
										v4ToastManager.showSuccess('saveConfigurationSuccess');
										onClose();
									}}
								>
									<FiX />
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
