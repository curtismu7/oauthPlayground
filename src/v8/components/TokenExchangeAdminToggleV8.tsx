// src/v8/components/TokenExchangeAdminToggleV8.tsx
// Token Exchange Phase 1 - Admin-only toggle component

import React, { useState, useEffect } from 'react';
import {
	FiToggleLeft,
	FiToggleRight,
	FiSettings,
	FiShield,
	FiAlertCircle,
	FiCheckCircle,
} from 'react-icons/fi';
import styled from 'styled-components';
import { TokenExchangeConfigServiceV8 } from '../services/tokenExchangeConfigServiceV8';
import { GlobalEnvironmentService } from '../services/globalEnvironmentService';
import { toastV8 } from '../utils/toastNotificationsV8';

const MODULE_TAG = '[TokenExchangeAdminToggleV8]';

// V8 Styled Components
const Container = styled.div`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1rem 0;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1rem;
`;

const Title = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ToggleContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const ToggleButton = styled.button<{ $enabled: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border: 1px solid ${({ $enabled }) => ($enabled ? '#10b981' : '#ef4444')};
	border-radius: 9999px;
	background: ${({ $enabled }) => ($enabled ? '#f0fdf4' : '#fef2f2')};
	color: ${({ $enabled }) => ($enabled ? '#166534' : '#dc2626')};
	cursor: pointer;
	transition: all 0.2s ease;
	font-weight: 600;
	font-size: 0.875rem;

	&:hover {
		background: ${({ $enabled }) => ($enabled ? '#dcfce7' : '#fee2e2')};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const StatusIcon = styled.div<{ $enabled: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.25rem;
	height: 1.25rem;
	border-radius: 50%;
	background: ${({ $enabled }) => ($enabled ? '#10b981' : '#ef4444')};
	color: white;
`;

const Description = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0 0 1rem 0;
	line-height: 1.5;
`;

const FeatureList = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0;
`;

const FeatureItem = styled.li`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	padding: 0.5rem 0;
	font-size: 0.875rem;
	color: #4b5563;

	&::before {
		content: '•';
		color: #7c3aed;
		font-weight: bold;
		margin-top: 0.125rem;
	}
`;

const WarningBox = styled.div`
	background: #fef3c7;
	border: 1px solid #fde68a;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-top: 1rem;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`;

const WarningText = styled.p`
	font-size: 0.875rem;
	color: #92400e;
	margin: 0;
	line-height: 1.5;
`;

const LoadingSpinner = styled.div`
	display: inline-block;
	width: 1rem;
	height: 1rem;
	border: 2px solid #e5e7eb;
	border-top: 2px solid #7c3aed;
	border-radius: 50%;
	animation: spin 1s linear infinite;

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
`;

interface TokenExchangeAdminToggleV8Props {
	environmentId?: string;
	onConfigChange?: (enabled: boolean) => void;
}

export const TokenExchangeAdminToggleV8: React.FC<TokenExchangeAdminToggleV8Props> = ({
	environmentId,
	onConfigChange,
}) => {
	const [isEnabled, setIsEnabled] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [currentConfig, setCurrentConfig] = useState<Record<string, unknown> | null>(null);

	// Get current environment ID
	const currentEnvironmentId = environmentId || GlobalEnvironmentService.getInstance().getEnvironmentId() || '';

	// Load current configuration on mount
	useEffect(() => {
		const loadConfiguration = async () => {
			setIsLoading(true);
			try {
				const enabled = await TokenExchangeConfigServiceV8.isEnabled(currentEnvironmentId);
				const config = await TokenExchangeConfigServiceV8.getAdminConfig(currentEnvironmentId);
				
				setIsEnabled(enabled);
				setCurrentConfig(config);
				onConfigChange?.(enabled);
			} catch (error) {
				console.error(`${MODULE_TAG} Error loading configuration:`, error);
				toastV8.error('Failed to load Token Exchange configuration');
			} finally {
				setIsLoading(false);
			}
		};

		loadConfiguration();
	}, [currentEnvironmentId, onConfigChange]);

	// Handle toggle change
	const handleToggleChange = async (newEnabled: boolean) => {
		setIsLoading(true);
		try {
			if (newEnabled) {
				// Enable Token Exchange
				await TokenExchangeConfigServiceV8.enableTokenExchange(
					currentEnvironmentId,
					'admin-user' // TODO: Get actual admin user ID
				);
				toastV8.success('Token Exchange enabled successfully');
			} else {
				// Disable Token Exchange
				await TokenExchangeConfigServiceV8.disableTokenExchange(
					currentEnvironmentId,
					'admin-user' // TODO: Get actual admin user ID
				);
				toastV8.success('Token Exchange disabled successfully');
			}

			setIsEnabled(newEnabled);
			onConfigChange?.(newEnabled);

			// Reload configuration
			const config = await TokenExchangeConfigServiceV8.getAdminConfig(currentEnvironmentId);
			setCurrentConfig(config);

		} catch (error) {
			console.error(`${MODULE_TAG} Error toggling Token Exchange:`, error);
			toastV8.error('Failed to update Token Exchange configuration');
			} finally {
			setIsLoading(false);
		}
	};

	return (
		<Container>
			<Header>
				<Title>
					<FiShield />
					Token Exchange Configuration
				</Title>
				<ToggleContainer>
					<ToggleButton
						$enabled={isEnabled}
						onClick={() => handleToggleChange(!isEnabled)}
						disabled={isLoading}
					>
						<StatusIcon $enabled={isEnabled}>
							{isEnabled ? <FiCheckCircle size={12} /> : <FiAlertCircle size={12} />}
						</StatusIcon>
						{isLoading ? <LoadingSpinner /> : isEnabled ? <FiToggleRight /> : <FiToggleLeft />}
						{isLoading ? 'Updating...' : isEnabled ? 'Enabled' : 'Disabled'}
					</ToggleButton>
				</ToggleContainer>
			</Header>

			<Description>
				Control whether Token Exchange is available in this environment. When enabled, 
				applications can exchange tokens for access to custom resources following RFC 8693.
			</Description>

			{isEnabled ? (
				<>
					<FeatureList>
						<FeatureItem>
							Same-environment token exchange only (Phase 1 restriction)
						</FeatureItem>
						<FeatureItem>
							Supports access token and ID token exchange
						</FeatureItem>
						<FeatureItem>
							Returns access tokens for custom resources
						</FeatureItem>
						<FeatureItem>
							No refresh tokens included in response
						</FeatureItem>
						<FeatureItem>
							Configurable scope restrictions
						</FeatureItem>
						<FeatureItem>
							Admin-controlled enablement
						</FeatureItem>
					</FeatureList>

					{currentConfig && (
						<div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
							<h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
								Current Configuration
							</h4>
							<div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.5 }}>
								<div>Allowed Scopes: {currentConfig.allowedScopes?.join(', ') || 'read, write, admin'}</div>
								<div>Max Token Lifetime: {currentConfig.maxTokenLifetime || 3600} seconds</div>
								<div>Require Same Environment: {currentConfig.requireSameEnvironment ? 'Yes' : 'No'}</div>
								<div>Last Updated: {new Date(currentConfig.lastUpdated).toLocaleString()}</div>
							</div>
						</div>
					)}
				</>
			) : (
				<WarningBox>
					<FiAlertCircle style={{ color: '#d97706', fontSize: '1.25rem', marginTop: '0.125rem' }} />
					<WarningText>
						<strong>Token Exchange is currently disabled.</strong> Applications cannot perform token exchange operations in this environment. Enable this feature to allow token exchange according to RFC 8693 specifications.
					</WarningText>
				</WarningBox>
			)}

			<WarningBox>
				<FiSettings style={{ color: '#d97706', fontSize: '1.25rem', marginTop: '0.125rem' }} />
				<WarningText>
					<strong>Phase 1 Restrictions:</strong> Only same-environment token exchange is supported. Tokens must be issued by the same PingOne environment. Cross-environment and third-party token exchange will be available in future phases.
				</WarningText>
			</WarningBox>
		</Container>
	);
};
