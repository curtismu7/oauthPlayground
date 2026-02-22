/**
 * @file MFAConfigurationPageV8.PingUI.tsx
 * @module v8/flows
 * @description Ping UI migrated MFA Configuration Page for managing MFA-specific settings
 * @version 8.0.0
 * @since 2025-01-XX
 *
 * Migrated to Ping UI with MDI icons and CSS variables.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { usePageScroll } from '@/hooks/usePageScroll';
import { CreatePolicyModalV8 } from '@/v8/components/CreatePolicyModalV8';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { MFANavigationV8 } from '@/v8/components/MFANavigationV8';
import { MFAUserDisplayV8 } from '@/v8/components/MFAUserDisplayV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { PINGONE_WORKER_MFA_SCOPE_STRING } from '@/v8/config/constants';
import {
	type MFAConfiguration,
	MFAConfigurationServiceV8,
} from '@/v8/services/mfaConfigurationServiceV8';
import { MFAServiceV8, type MFASettings } from '@/v8/services/mfaServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import WorkerTokenStatusServiceV8 from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 16, ariaLabel, ariaHidden = false, className = '', style }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<i
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			{...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
			{...(ariaHidden ? { 'aria-hidden': 'true' } : {})}
		></i>
	);
};

// MDI Icon mapping function
const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiArrowLeft: 'mdi-arrow-left',
		FiCheck: 'mdi-check',
		FiInfo: 'mdi-information',
		FiRefreshCw: 'mdi-refresh',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

const _MODULE_TAG = '[⚙️ MFA-CONFIG-PAGE-V8-PINGUI]';

const REGION_DOMAINS: Record<'us' | 'eu' | 'ap' | 'ca', string> = {
	us: 'auth.pingone.com',
	eu: 'auth.pingone.eu',
	ap: 'auth.pingone.asia',
	ca: 'auth.pingone.ca',
};

// Styled Components
const PageContainer = styled.div`
	background: var(--ping-surface-primary, white);
	min-height: 100vh;
`;

const Header = styled.div`
	background: linear-gradient(135deg, var(--ping-primary-color, #3b82f6) 0%, var(--ping-primary-hover, #2563eb) 100%);
	color: white;
	padding: var(--ping-spacing-xl, 2rem);
`;

const HeaderContent = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const HeaderTitle = styled.h1`
	font-size: 1.875rem;
	font-weight: 700;
	margin: 0;
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 0.75rem);
`;

const HeaderActions = styled.div`
	display: flex;
	gap: var(--ping-spacing-sm, 0.75rem);
`;

const BackButton = styled.button`
	background: transparent;
	border: 1px solid rgba(255, 255, 255, 0.3);
	color: white;
	padding: var(--ping-spacing-sm, 0.75rem) var(--ping-spacing-md, 1rem);
	border-radius: var(--ping-border-radius-md, 8px);
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-xs, 0.5rem);

	&:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.5);
	}
`;

const RefreshButton = styled.button<{ $loading?: boolean }>`
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.3);
	color: white;
	padding: var(--ping-spacing-sm, 0.75rem) var(--ping-spacing-md, 1rem);
	border-radius: var(--ping-border-radius-md, 8px);
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-xs, 0.5rem);

	&:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.5);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const MainContent = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: var(--ping-spacing-xl, 2rem);
`;

const Section = styled.div`
	background: var(--ping-surface-primary, white);
	border: 1px solid var(--ping-border-default, #e2e8f0);
	border-radius: var(--ping-border-radius-lg, 12px);
	padding: var(--ping-spacing-xl, 2rem);
	margin-bottom: var(--ping-spacing-xl, 2rem);
`;

const SectionHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: var(--ping-spacing-lg, 1.5rem);
	padding-bottom: var(--ping-spacing-md, 1rem);
	border-bottom: 1px solid var(--ping-border-light, #f1f5f9);
`;

const SectionTitle = styled.h2`
	color: var(--ping-text-primary, #1e293b);
	font-size: 1.5rem;
	font-weight: 600;
	margin: 0;
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 0.75rem);
`;

const SectionDescription = styled.p`
	color: var(--ping-text-secondary, #64748b);
	font-size: 1rem;
	line-height: 1.6;
	margin: 0 0 var(--ping-spacing-lg, 1.5rem) 0;
`;

const ConfigGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: var(--ping-spacing-lg, 1.5rem);
`;

const ConfigItem = styled.div`
	background: var(--ping-surface-secondary, #f8fafc);
	border: 1px solid var(--ping-border-default, #e2e8f0);
	border-radius: var(--ping-border-radius-md, 8px);
	padding: var(--ping-spacing-lg, 1.5rem);
`;

const ConfigLabel = styled.div`
	color: var(--ping-text-secondary, #64748b);
	font-size: 0.875rem;
	font-weight: 500;
	margin-bottom: var(--ping-spacing-xs, 0.5rem);
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const ConfigValue = styled.div`
	color: var(--ping-text-primary, #1e293b);
	font-size: 1rem;
	font-weight: 500;
	word-break: break-all;
`;

const ActionButtons = styled.div`
	display: flex;
	gap: var(--ping-spacing-md, 1rem);
	justify-content: flex-end;
	margin-top: var(--ping-spacing-xl, 2rem);
`;

const PrimaryButton = styled.button`
	background: var(--ping-primary-color, #3b82f6);
	color: white;
	border: none;
	padding: var(--ping-spacing-md, 1rem) var(--ping-spacing-xl, 2rem);
	border-radius: var(--ping-border-radius-md, 8px);
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 0.75rem);

	&:hover {
		background: var(--ping-primary-hover, #2563eb);
		transform: translateY(-1px);
	}

	&:disabled {
		background: var(--ping-border-default, #e2e8f0);
		color: var(--ping-text-secondary, #64748b);
		cursor: not-allowed;
		transform: none;
	}
`;

const SecondaryButton = styled.button`
	background: transparent;
	color: var(--ping-text-primary, #1e293b);
	border: 1px solid var(--ping-border-default, #e2e8f0);
	padding: var(--ping-spacing-md, 1rem) var(--ping-spacing-xl, 2rem);
	border-radius: var(--ping-border-radius-md, 8px);
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;

	&:hover {
		background: var(--ping-surface-secondary, #f8fafc);
		border-color: var(--ping-primary-color, #3b82f6);
		color: var(--ping-primary-color, #3b82f6);
	}
`;

const StatusIndicator = styled.div<{ $status: 'connected' | 'disconnected' | 'loading' }>`
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-xs, 0.5rem);
	padding: var(--ping-spacing-xs, 0.5rem) var(--ping-spacing-sm, 0.75rem);
	border-radius: var(--ping-border-radius-sm, 4px);
	font-size: 0.75rem;
	font-weight: 600;
	background: ${({ $status }) => {
		switch ($status) {
			case 'connected':
				return 'var(--ping-success-light, #d1fae5)';
			case 'disconnected':
				return 'var(--ping-error-light, #fef2f2)';
			case 'loading':
				return 'var(--ping-info-light, #eff6ff)';
			default:
				return 'var(--ping-surface-secondary, #f8fafc)';
		}
	}};
	color: ${({ $status }) => {
		switch ($status) {
			case 'connected':
				return 'var(--ping-success-dark, #065f46)';
			case 'disconnected':
				return 'var(--ping-error-dark, #991b1b)';
			case 'loading':
				return 'var(--ping-info-dark, #1e40af)';
			default:
				return 'var(--ping-text-secondary, #64748b)';
		}
	}};
`;

const InfoBox = styled.div`
	background: var(--ping-info-light, #eff6ff);
	border: 1px solid var(--ping-info-color, #3b82f6);
	border-radius: var(--ping-border-radius-md, 8px);
	padding: var(--ping-spacing-md, 1rem);
	margin-bottom: var(--ping-spacing-lg, 1.5rem);
	display: flex;
	align-items: flex-start;
	gap: var(--ping-spacing-sm, 0.75rem);
`;

const InfoText = styled.div`
	color: var(--ping-info-dark, #1e40af);
	font-size: 0.875rem;
	line-height: 1.5;
	flex: 1;
`;

export const MFAConfigurationPageV8PingUI: React.FC = () => {
	const navigate = useNavigate();
	const _location = useLocation();
	const [config, _setConfig] = useState<MFAConfiguration>(() =>
		MFAConfigurationServiceV8.loadConfiguration()
	);
	const [_hasChanges, setHasChanges] = useState(false);
	const [_isSaving, setIsSaving] = useState(false);
	const [_isRefreshingToken, setIsRefreshingToken] = useState(false);

	// PingOne MFA Settings state
	const [pingOneSettings, setPingOneSettings] = useState<MFASettings | null>(null);
	const [showCreatePolicyModal, setShowCreatePolicyModal] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<
		'connected' | 'disconnected' | 'loading'
	>('loading');

	// Initialize page scroll hook
	usePageScroll();

	// Load PingOne MFA settings
	useEffect(() => {
		const loadSettings = async () => {
			try {
				const settings = await MFAServiceV8.getMFASettings();
				setPingOneSettings(settings);
				setConnectionStatus('connected');
			} catch (error) {
				console.error('Failed to load MFA settings:', error);
				setConnectionStatus('disconnected');
			}
		};
		loadSettings();
	}, []);

	// Check worker token status
	useEffect(() => {
		const checkTokenStatus = async () => {
			try {
				const hasToken = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				setConnectionStatus(hasToken.isValid ? 'connected' : 'disconnected');
			} catch (error) {
				console.error('Failed to check worker token status:', error);
				setConnectionStatus('disconnected');
			}
		};
		checkTokenStatus();
	}, []);

	const handleRefreshToken = useCallback(async () => {
		setIsRefreshingToken(true);
		try {
			await workerTokenServiceV8.refreshWorkerToken();
			toastV8.success('Worker token refreshed successfully');
			setConnectionStatus('connected');
		} catch (error) {
			console.error('Failed to refresh worker token:', error);
			toastV8.error('Failed to refresh worker token');
			setConnectionStatus('disconnected');
		} finally {
			setIsRefreshingToken(false);
		}
	}, []);

	const handleSaveConfig = useCallback(async () => {
		setIsSaving(true);
		try {
			await MFAConfigurationServiceV8.saveConfiguration(config);
			toastV8.success('Configuration saved successfully');
			setHasChanges(false);
		} catch (error) {
			console.error('Failed to save configuration:', error);
			toastV8.error('Failed to save configuration');
		} finally {
			setIsSaving(false);
		}
	}, [config]);

	const handleBack = useCallback(() => {
		navigate(-1);
	}, [navigate]);

	const getRegionDomain = (region: string) => {
		return REGION_DOMAINS[region as keyof typeof REGION_DOMAINS] || REGION_DOMAINS.us;
	};

	return (
		<div className="end-user-nano">
			<PageContainer>
				<Header>
					<HeaderContent>
						<HeaderTitle>
							<MDIIcon icon="FiInfo" size={24} ariaLabel="Configuration" />
							MFA Configuration
						</HeaderTitle>
						<HeaderActions>
							<BackButton onClick={handleBack}>
								<MDIIcon icon="FiArrowLeft" size={16} ariaLabel="Back" />
								Back
							</BackButton>
							<RefreshButton onClick={handleRefreshToken} $loading={_isRefreshingToken}>
								<MDIIcon icon="FiRefreshCw" size={16} ariaLabel="Refresh" />
								{_isRefreshingToken ? 'Refreshing...' : 'Refresh Token'}
							</RefreshButton>
						</HeaderActions>
					</HeaderContent>
				</Header>

				<MainContent>
					<MFANavigationV8 />

					<Section>
						<SectionHeader>
							<SectionTitle>Connection Status</SectionTitle>
							<StatusIndicator $status={connectionStatus}>
								{connectionStatus === 'connected' && (
									<MDIIcon icon="FiCheck" size={12} ariaHidden={true} />
								)}
								{connectionStatus === 'disconnected' && (
									<MDIIcon icon="FiInfo" size={12} ariaHidden={true} />
								)}
								{connectionStatus === 'loading' && (
									<MDIIcon icon="FiRefreshCw" size={12} ariaHidden={true} />
								)}
								{connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
							</StatusIndicator>
						</SectionHeader>

						<InfoBox>
							<MDIIcon icon="FiInfo" size={20} ariaLabel="Information" />
							<InfoText>
								<strong>Worker Token Status:</strong>{' '}
								{connectionStatus === 'connected' ? 'Active and valid' : 'Not available or expired'}
								.
								{connectionStatus === 'disconnected' &&
									' Click "Refresh Token" to obtain a new worker token.'}
							</InfoText>
						</InfoBox>

						<ConfigGrid>
							<ConfigItem>
								<ConfigLabel>Environment ID</ConfigLabel>
								<ConfigValue>{config.environmentId || 'Not configured'}</ConfigValue>
							</ConfigItem>
							<ConfigItem>
								<ConfigLabel>Region</ConfigLabel>
								<ConfigValue>
									{config.region
										? `${config.region.toUpperCase()} (${getRegionDomain(config.region)})`
										: 'Not configured'}
								</ConfigValue>
							</ConfigItem>
							<ConfigItem>
								<ConfigLabel>Client ID</ConfigLabel>
								<ConfigValue>{config.clientId || 'Not configured'}</ConfigValue>
							</ConfigItem>
							<ConfigItem>
								<ConfigLabel>Required Scope</ConfigLabel>
								<ConfigValue>{PINGONE_WORKER_MFA_SCOPE_STRING}</ConfigValue>
							</ConfigItem>
						</ConfigGrid>
					</Section>

					{pingOneSettings && (
						<Section>
							<SectionHeader>
								<SectionTitle>PingOne MFA Settings</SectionTitle>
								<MFAInfoButtonV8 />
							</SectionHeader>

							<SectionDescription>
								Current PingOne MFA configuration and available policies.
							</SectionDescription>

							<SuperSimpleApiDisplayV8 title="MFA Settings" data={pingOneSettings} />

							<ActionButtons>
								<SecondaryButton onClick={() => setShowCreatePolicyModal(true)}>
									Create New Policy
								</SecondaryButton>
							</ActionButtons>
						</Section>
					)}

					<Section>
						<SectionHeader>
							<SectionTitle>User Display</SectionTitle>
						</SectionHeader>

						<SectionDescription>
							Current user information and authentication status.
						</SectionDescription>

						<MFAUserDisplayV8 />
					</Section>

					<ActionButtons>
						<PrimaryButton onClick={handleSaveConfig} disabled={_isSaving || !_hasChanges}>
							{_isSaving ? 'Saving...' : 'Save Configuration'}
						</PrimaryButton>
					</ActionButtons>
				</MainContent>

				{showCreatePolicyModal && (
					<CreatePolicyModalV8
						isOpen={showCreatePolicyModal}
						onClose={() => setShowCreatePolicyModal(false)}
					/>
				)}
			</PageContainer>
		</div>
	);
};

export default MFAConfigurationPageV8PingUI;
