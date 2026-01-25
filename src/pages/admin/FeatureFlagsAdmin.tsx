/**
 * @file FeatureFlagsAdmin.tsx
 * @description Admin UI for managing feature flags
 * @version 9.0.0
 */

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiToggleLeft, FiToggleRight, FiInfo, FiRefreshCw } from 'react-icons/fi';
import { FeatureFlagService, type FeatureFlag } from '@/services/featureFlagService';

const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const Header = styled.div`
	margin-bottom: 2rem;
`;

const Title = styled.h1`
	font-size: 2rem;
	font-weight: 700;
	color: #1e293b;
	margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
	font-size: 1rem;
	color: #64748b;
`;

const FlagCard = styled.div`
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	transition: all 0.2s ease;

	&:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		border-color: #cbd5e1;
	}
`;

const FlagHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1rem;
`;

const FlagName = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1e293b;
	margin: 0;
`;

const FlagDescription = styled.p`
	font-size: 0.875rem;
	color: #64748b;
	margin-bottom: 1rem;
`;

const FlagControls = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	flex-wrap: wrap;
`;

const ToggleButton = styled.button<{ $enabled: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border: 2px solid ${props => props.$enabled ? '#22c55e' : '#94a3b8'};
	border-radius: 0.5rem;
	background: ${props => props.$enabled ? '#22c55e' : '#f1f5f9'};
	color: ${props => props.$enabled ? 'white' : '#475569'};
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	svg {
		font-size: 1.25rem;
	}
`;

const RolloutControl = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const RolloutLabel = styled.label`
	font-size: 0.875rem;
	font-weight: 500;
	color: #475569;
`;

const RolloutInput = styled.input`
	width: 80px;
	padding: 0.5rem;
	border: 1px solid #cbd5e1;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	text-align: center;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const RolloutButton = styled.button`
	padding: 0.5rem 1rem;
	border: 1px solid #cbd5e1;
	border-radius: 0.375rem;
	background: white;
	color: #475569;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #f1f5f9;
		border-color: #94a3b8;
	}
`;

const StatusBadge = styled.span<{ $enabled: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	background: ${props => props.$enabled ? '#dcfce7' : '#f1f5f9'};
	color: ${props => props.$enabled ? '#166534' : '#475569'};
`;

const InfoBox = styled.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 2rem;
	display: flex;
	gap: 0.75rem;
`;

const InfoIcon = styled(FiInfo)`
	flex-shrink: 0;
	font-size: 1.25rem;
	color: #3b82f6;
	margin-top: 0.125rem;
`;

const InfoText = styled.p`
	font-size: 0.875rem;
	color: #1e40af;
	margin: 0;
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 1rem;
	margin-top: 2rem;
`;

const ActionButton = styled.button`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border: 1px solid #cbd5e1;
	border-radius: 0.5rem;
	background: white;
	color: #475569;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #f1f5f9;
		border-color: #94a3b8;
	}

	svg {
		font-size: 1.125rem;
	}
`;

export const FeatureFlagsAdmin: React.FC = () => {
	const [flags, setFlags] = useState<Record<FeatureFlag, boolean>>({} as Record<FeatureFlag, boolean>);
	const [rolloutPercentages, setRolloutPercentages] = useState<Record<FeatureFlag, number>>({
		USE_NEW_CREDENTIALS_REPO: 0,
		USE_NEW_OIDC_CORE: 0,
	});

	const loadFlags = () => {
		const allFlags = FeatureFlagService.getAllFlags();
		setFlags(allFlags);

		// Load rollout percentages from config
		const credRepoConfig = FeatureFlagService.getFlagConfig('USE_NEW_CREDENTIALS_REPO');
		const oidcCoreConfig = FeatureFlagService.getFlagConfig('USE_NEW_OIDC_CORE');

		setRolloutPercentages({
			USE_NEW_CREDENTIALS_REPO: credRepoConfig.rolloutPercentage ?? 0,
			USE_NEW_OIDC_CORE: oidcCoreConfig.rolloutPercentage ?? 0,
		});
	};

	useEffect(() => {
		loadFlags();
	}, []);

	const handleToggle = (flag: FeatureFlag) => {
		if (flags[flag]) {
			FeatureFlagService.disable(flag);
		} else {
			FeatureFlagService.enable(flag);
		}
		loadFlags();
	};

	const handleRolloutChange = (flag: FeatureFlag, value: string) => {
		const percentage = parseInt(value, 10);
		if (!Number.isNaN(percentage) && percentage >= 0 && percentage <= 100) {
			setRolloutPercentages(prev => ({ ...prev, [flag]: percentage }));
		}
	};

	const handleSetRollout = (flag: FeatureFlag) => {
		const percentage = rolloutPercentages[flag];
		FeatureFlagService.setRolloutPercentage(flag, percentage);
		loadFlags();
	};

	const handleClearAll = () => {
		if (window.confirm('Are you sure you want to clear all feature flags? This will reset to default behavior.')) {
			FeatureFlagService.clearAllFlags();
			loadFlags();
		}
	};

	const flagConfigs: Array<{ flag: FeatureFlag; title: string; description: string }> = [
		{
			flag: 'USE_NEW_CREDENTIALS_REPO',
			title: 'New Credentials Repository',
			description: 'Use the new CredentialsRepository service that consolidates 4 legacy services. Includes automatic migration from old storage keys and event listener support.',
		},
		{
			flag: 'USE_NEW_OIDC_CORE',
			title: 'New OIDC Core Services',
			description: 'Use the new StateManager, NonceManager, and PkceManager services for enhanced security compliance (CSRF protection, replay protection, RFC 7636 PKCE).',
		},
	];

	return (
		<Container>
			<Header>
				<Title>Feature Flags Administration</Title>
				<Subtitle>
					Control gradual rollout of Phase 1-2 services (Version 9.0.0)
				</Subtitle>
			</Header>

			<InfoBox>
				<InfoIcon />
				<InfoText>
					<strong>Important:</strong> Feature flags control which services are used in the application.
					Changes take effect immediately and persist across browser sessions. Use rollout percentages
					for gradual deployment (10% → 25% → 50% → 100%).
				</InfoText>
			</InfoBox>

			{flagConfigs.map(({ flag, title, description }) => {
				const config = FeatureFlagService.getFlagConfig(flag);
				const isEnabled = flags[flag] ?? false;

				return (
					<FlagCard key={flag}>
						<FlagHeader>
							<div>
								<FlagName>{title}</FlagName>
								<StatusBadge $enabled={isEnabled}>
									{isEnabled ? '✓ Enabled' : '○ Disabled'}
								</StatusBadge>
							</div>
						</FlagHeader>

						<FlagDescription>{description}</FlagDescription>

						<FlagControls>
							<ToggleButton
								$enabled={isEnabled}
								onClick={() => handleToggle(flag)}
							>
								{isEnabled ? <FiToggleRight /> : <FiToggleLeft />}
								{isEnabled ? 'Disable' : 'Enable'}
							</ToggleButton>

							<RolloutControl>
								<RolloutLabel>Rollout %:</RolloutLabel>
								<RolloutInput
									type="number"
									min="0"
									max="100"
									value={rolloutPercentages[flag]}
									onChange={(e) => handleRolloutChange(flag, e.target.value)}
								/>
								<RolloutButton onClick={() => handleSetRollout(flag)}>
									Set Rollout
								</RolloutButton>
							</RolloutControl>
						</FlagControls>

						{config.rolloutPercentage !== undefined && config.rolloutPercentage > 0 && (
							<InfoText style={{ marginTop: '0.75rem', fontSize: '0.75rem' }}>
								Current rollout: {config.rolloutPercentage}% of users
							</InfoText>
						)}
					</FlagCard>
				);
			})}

			<ActionButtons>
				<ActionButton onClick={loadFlags}>
					<FiRefreshCw />
					Refresh Status
				</ActionButton>
				<ActionButton onClick={handleClearAll}>
					Clear All Flags
				</ActionButton>
			</ActionButtons>
		</Container>
	);
};

export default FeatureFlagsAdmin;
