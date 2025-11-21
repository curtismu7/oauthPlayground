import React, { useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiCheck,
	FiCheckCircle,
	FiGlobe,
	FiRefreshCw,
	FiSearch,
	FiX,
} from 'react-icons/fi';
import styled from 'styled-components';
import { discoveryService, OpenIDConfiguration } from '../services/discoveryService';
import { credentialManager } from '../utils/credentialManager';
import { logger } from '../utils/logger';
import { showFlowError, showFlowSuccess } from './CentralizedSuccessMessage';
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
  color: #111827;
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

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  ${({ variant = 'primary' }) =>
		variant === 'primary'
			? `
    background: #3b82f6;
    color: white;

    &:hover:not(:disabled) {
      background: #2563eb;
    }
  `
			: `
    background: transparent;
    color: #6b7280;
    border: 1px solid #d1d5db;

    &:hover:not(:disabled) {
      background: #f9fafb;
      color: #374151;
    }
  `}

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
  background: #f8fafc;
  border: 1px solid #e2e8f0;
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

const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({ onConfigurationDiscovered, onClose }) => {
	const [environmentId, setEnvironmentId] = useState('');
	const [region, setRegion] = useState('us');
	const [isLoading, setIsLoading] = useState(false);
	const [status, setStatus] = useState<{
		type: 'success' | 'error' | 'info';
		message: string;
	} | null>(null);
	const [discoveredConfig, setDiscoveredConfig] = useState<OpenIDConfiguration | null>(null);
	const [copiedField, setCopiedField] = useState<string | null>(null);

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
						console.log('🔍 [DiscoveryPanel] Fallback getAllCredentials() failed:', error);
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
			showFlowError(
				'❌ Environment ID Required',
				'Please enter your PingOne Environment ID to discover configuration'
			);
			return;
		}

		if (!discoveryService.validateEnvironmentId(environmentId)) {
			setStatus({
				type: 'error',
				message: 'Invalid Environment ID format. Please enter a valid UUID.',
			});
			showFlowError(
				'❌ Invalid Environment ID',
				'Please enter a valid UUID format for your PingOne Environment ID'
			);
			return;
		}

		// Save current preferences before discovering
		credentialManager.saveDiscoveryPreferences({
			environmentId: environmentId.trim(),
			region,
		});

		setIsLoading(true);
		setStatus(null);
		setDiscoveredConfig(null);

		try {
			const result = await discoveryService.discoverConfiguration(environmentId, region);

			if (result.success && result.configuration) {
				setDiscoveredConfig(result.configuration);
				setStatus({
					type: 'success',
					message: `Successfully discovered configuration for environment ${environmentId}`,
				});
				showFlowSuccess(
					'🔍 Configuration Discovered Successfully!',
					`Found ${Object.keys(result.configuration).length} endpoints for environment ${environmentId}`
				);
				logger.success('DiscoveryPanel', 'Configuration discovered successfully', {
					environmentId,
					issuer: result.configuration.issuer,
				});
			} else {
				setStatus({
					type: 'error',
					message: result.error || 'Failed to discover configuration',
				});
				showFlowError(
					'❌ Discovery Failed',
					result.error ||
						'Failed to discover configuration. Please check your Environment ID and try again.'
				);
			}
		} catch (error) {
			setStatus({
				type: 'error',
				message: error instanceof Error ? error.message : 'Discovery failed',
			});
			showFlowError(
				'❌ Discovery Error',
				error instanceof Error
					? error.message
					: 'Discovery failed. Please check your connection and try again.'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleApplyConfiguration = () => {
		if (discoveredConfig) {
			try {
				onConfigurationDiscovered(discoveredConfig, environmentId);
				showFlowSuccess(
					'✅ Configuration Applied Successfully!',
					'Your PingOne endpoints have been automatically configured'
				);
				onClose();
			} catch (error) {
				showFlowError(
					'❌ Failed to Apply Configuration',
					'There was an error applying the discovered configuration. Please try again.'
				);
				logger.error('DiscoveryPanel', 'Failed to apply configuration', error);
			}
		} else {
			showFlowError(
				'❌ No Configuration to Apply',
				'Please discover configuration first before applying it.'
			);
		}
	};

	const handleCopyToClipboard = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			showFlowSuccess(
				`📋 ${field} Copied to Clipboard`,
				`The ${field} endpoint has been copied successfully`
			);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
			showFlowError('❌ Copy Failed', `Failed to copy ${field} to clipboard. Please try again.`);
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
						<Label htmlFor="environmentId">Environment ID</Label>
						<Input
							id="environmentId"
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
						<Label htmlFor="region">Region</Label>
						<Select
							id="region"
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
							<h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>
								Discovered Configuration
							</h3>

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
										onClick={() => handleCopyToClipboard(discoveredConfig.token_endpoint, 'token')}
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
										{copiedField === 'userinfo' ? <FiCheck size={14} /> : <CopyIcon size={14} />}
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

							<div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
								<Button variant="primary" onClick={handleApplyConfiguration}>
									<FiCheckCircle />
									Apply Configuration
								</Button>
								<Button
									variant="secondary"
									onClick={() => {
										setDiscoveredConfig(null);
										showFlowSuccess(
											'🧹 Configuration Cleared',
											'The discovered configuration has been cleared'
										);
									}}
								>
									Clear
								</Button>
								<Button
									variant="secondary"
									onClick={() => {
										showFlowSuccess(
											'👋 Discovery Panel Closed',
											'You can reopen it anytime from the Configuration page'
										);
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
