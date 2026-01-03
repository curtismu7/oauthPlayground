/**
 * @file MFAConfigurationPageV8.tsx
 * @module v8/flows
 * @description MFA Configuration Page for managing MFA-specific settings
 * @version 8.0.0
 * @since 2025-01-XX
 */

import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiCheck, FiDownload, FiInfo, FiRefreshCw, FiUpload } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { MFANavigationV8 } from '@/v8/components/MFANavigationV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { PINGONE_WORKER_MFA_SCOPE_STRING } from '@/v8/config/constants';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import {
	type MFAConfiguration,
	MFAConfigurationServiceV8,
} from '@/v8/services/mfaConfigurationServiceV8';
import { MFAServiceV8, type MFASettings } from '@/v8/services/mfaServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import WorkerTokenStatusServiceV8 from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[⚙️ MFA-CONFIG-PAGE-V8]';

const REGION_DOMAINS: Record<'us' | 'eu' | 'ap' | 'ca', string> = {
	us: 'auth.pingone.com',
	eu: 'auth.pingone.eu',
	ap: 'auth.pingone.asia',
	ca: 'auth.pingone.ca',
};

export const MFAConfigurationPageV8: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [config, setConfig] = useState<MFAConfiguration>(() =>
		MFAConfigurationServiceV8.loadConfiguration()
	);
	const [hasChanges, setHasChanges] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isApiDisplayVisible, setIsApiDisplayVisible] = useState(apiDisplayServiceV8.isVisible());
	const [isRefreshingToken, setIsRefreshingToken] = useState(false);

	// PingOne MFA Settings state
	const [pingOneSettings, setPingOneSettings] = useState<MFASettings | null>(null);
	const [isLoadingPingOneSettings, setIsLoadingPingOneSettings] = useState(false);
	const [isSavingPingOneSettings, setIsSavingPingOneSettings] = useState(false);
	const [hasPingOneSettingsChanges, setHasPingOneSettingsChanges] = useState(false);
	const [environmentId, setEnvironmentId] = useState<string>('');

	// Get return path from location state
	const locationState = location.state as { returnPath?: string; returnState?: unknown } | null;
	const returnPath = locationState?.returnPath;

	// Determine flow type from return path for better button text
	const getFlowLabel = (path: string | undefined): string => {
		if (!path) return 'Device Registration';
		if (path.includes('/sms/')) return 'SMS Device Registration';
		if (path.includes('/email/')) return 'Email Device Registration';
		if (path.includes('/whatsapp/')) return 'WhatsApp Device Registration';
		if (path.includes('/totp/')) return 'TOTP Device Registration';
		if (path.includes('/fido2/')) return 'FIDO2 Device Registration';
		return 'Device Registration';
	};

	// Listen for configuration updates
	useEffect(() => {
		const handleConfigUpdate = (event: CustomEvent) => {
			setConfig(event.detail as MFAConfiguration);
			setHasChanges(false);
		};

		window.addEventListener('mfaConfigurationUpdated', handleConfigUpdate as EventListener);
		return () => {
			window.removeEventListener('mfaConfigurationUpdated', handleConfigUpdate as EventListener);
		};
	}, []);

	// Subscribe to API display visibility changes
	useEffect(() => {
		const unsubscribe = apiDisplayServiceV8.subscribe((visible) => {
			setIsApiDisplayVisible(visible);
		});
		return () => unsubscribe();
	}, []);

	// Define loadPingOneSettings before useEffect that uses it
	const loadPingOneSettings = useCallback(async (envId: string) => {
		setIsLoadingPingOneSettings(true);
		try {
			const settings = await MFAServiceV8.getMFASettings(envId);
			setPingOneSettings(settings);
			setHasPingOneSettingsChanges(false);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load PingOne MFA settings:`, error);
			toastV8.error(
				'Failed to load PingOne MFA settings. Please ensure you have a valid worker token.'
			);
		} finally {
			setIsLoadingPingOneSettings(false);
		}
	}, []);

	// Load environment ID and PingOne MFA Settings
	useEffect(() => {
		const loadEnvironmentAndSettings = async () => {
			try {
				const credentials = await workerTokenServiceV8.loadCredentials();
				if (credentials?.environmentId) {
					setEnvironmentId(credentials.environmentId);
					await loadPingOneSettings(credentials.environmentId);
				}
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to load environment ID:`, error);
			}
		};
		loadEnvironmentAndSettings();
	}, [loadPingOneSettings]);

	const handleSavePingOneSettings = async () => {
		if (!environmentId || !pingOneSettings) return;

		setIsSavingPingOneSettings(true);
		try {
			await MFAServiceV8.updateMFASettings(environmentId, pingOneSettings);
			setHasPingOneSettingsChanges(false);
			toastV8.success('PingOne MFA settings updated successfully');
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save PingOne MFA settings:`, error);
			toastV8.error(
				error instanceof Error ? error.message : 'Failed to update PingOne MFA settings'
			);
		} finally {
			setIsSavingPingOneSettings(false);
		}
	};

	const handleResetPingOneSettings = async () => {
		if (!environmentId) return;

		const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');
		const confirmed = await uiNotificationServiceV8.confirm({
			title: 'Reset PingOne MFA Settings',
			message:
				'Are you sure you want to reset PingOne MFA settings to defaults? This cannot be undone.',
		});

		if (!confirmed) {
			return;
		}

		try {
			await MFAServiceV8.resetMFASettings(environmentId);
			toastV8.success('PingOne MFA settings reset to defaults');
			await loadPingOneSettings(environmentId);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to reset PingOne MFA settings:`, error);
			toastV8.error(
				error instanceof Error ? error.message : 'Failed to reset PingOne MFA settings'
			);
		}
	};

	const handleSave = () => {
		setIsSaving(true);
		try {
			MFAConfigurationServiceV8.saveConfiguration(config);
			setHasChanges(false);
			toastV8.success('MFA configuration saved successfully');
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save configuration`, error);
			toastV8.error('Failed to save configuration');
		} finally {
			setIsSaving(false);
		}
	};

	const handleReset = async () => {
		const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');
		const confirmed = await uiNotificationServiceV8.confirm({
			title: 'Reset Configuration',
			message: 'Are you sure you want to reset all settings to defaults? This cannot be undone.',
		});

		if (confirmed) {
			MFAConfigurationServiceV8.resetToDefaults();
			setConfig(MFAConfigurationServiceV8.loadConfiguration());
			setHasChanges(false);
			toastV8.success('Configuration reset to defaults');
		}
	};

	const handleManualWorkerTokenRefresh = async () => {
		setIsRefreshingToken(true);
		try {
			const credentials = await workerTokenServiceV8.loadCredentials();
			if (!credentials) {
				toastV8.error(
					'Worker token credentials are missing. Open the worker token modal to save them first.'
				);
				setIsRefreshingToken(false);
				return;
			}

			const {
				environmentId,
				clientId,
				clientSecret,
				scopes,
				region = 'us',
				tokenEndpointAuthMethod = 'client_secret_post',
			} = credentials;

			if (!environmentId || !clientId || !clientSecret) {
				toastV8.error('Saved worker token credentials are incomplete. Please re-enter them.');
				setIsRefreshingToken(false);
				return;
			}

			const resolvedScopes = (
				scopes?.length ? scopes : PINGONE_WORKER_MFA_SCOPE_STRING.split(/\s+/)
			).join(' ');
			const domain = REGION_DOMAINS[region] ?? REGION_DOMAINS.us;
			const tokenEndpoint = `https://${domain}/${environmentId}/as/token`;
			const params = new URLSearchParams({
				grant_type: 'client_credentials',
				client_id: clientId,
				scope: resolvedScopes,
			});

			const headers: Record<string, string> = {
				'Content-Type': 'application/x-www-form-urlencoded',
			};

			if (tokenEndpointAuthMethod === 'client_secret_basic') {
				headers.Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
			} else {
				params.set('client_secret', clientSecret);
			}

			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers,
				body: params.toString(),
			});

			if (!response.ok) {
				const errorJson = await response.json().catch(() => null);
				const message =
					errorJson?.error_description ||
					errorJson?.error ||
					response.statusText ||
					'Unknown error refreshing worker token';
				throw new Error(message);
			}

			const data = await response.json();
			const token = data.access_token as string | undefined;
			if (!token) {
				throw new Error('Token endpoint did not return an access token');
			}
			const expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : undefined;

			await workerTokenServiceV8.saveToken(token, expiresAt);
			window.dispatchEvent(new Event('workerTokenUpdated'));

			const status = WorkerTokenStatusServiceV8.checkWorkerTokenStatus(token, expiresAt);
			const timeRemainingLabel = status.minutesRemaining
				? `${status.minutesRemaining} min remaining`
				: status.message;
			toastV8.success(`Worker token refreshed successfully (${timeRemainingLabel}).`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to refresh worker token`, error);
			toastV8.error(error instanceof Error ? error.message : 'Failed to refresh worker token');
		} finally {
			setIsRefreshingToken(false);
		}
	};

	const handleExport = () => {
		try {
			const json = MFAConfigurationServiceV8.exportConfiguration();
			const blob = new Blob([json], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `mfa-config-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			toastV8.success('Configuration exported successfully');
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to export configuration`, error);
			toastV8.error('Failed to export configuration');
		}
	};

	const handleImport = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (event) => {
				try {
					const json = event.target?.result as string;
					if (MFAConfigurationServiceV8.importConfiguration(json)) {
						setConfig(MFAConfigurationServiceV8.loadConfiguration());
						setHasChanges(false);
						toastV8.success('Configuration imported successfully');
					} else {
						toastV8.error('Failed to import configuration. Invalid format.');
					}
				} catch (error) {
					console.error(`${MODULE_TAG} Failed to import configuration`, error);
					toastV8.error('Failed to import configuration');
				}
			};
			reader.readAsText(file);
		};
		input.click();
	};

	const updateConfig = <K extends keyof MFAConfiguration>(key: K, value: MFAConfiguration[K]) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		setHasChanges(true);
	};

	const updateNestedConfig = <
		K extends keyof MFAConfiguration,
		NK extends keyof MFAConfiguration[K],
	>(
		key: K,
		nestedKey: NK,
		value: MFAConfiguration[K][NK]
	) => {
		setConfig((prev) => {
			const currentValue = prev[key] as Record<string, unknown>;
			return {
				...prev,
				[key]: { ...currentValue, [nestedKey]: value },
			};
		});
		setHasChanges(true);
	};

	const handleBack = () => {
		if (returnPath) {
			// Navigate back to the page we came from with its original state
			navigate(returnPath, {
				state: locationState?.returnState,
				replace: false,
			});
		} else {
			// Fallback to browser back if no return path
			navigate(-1);
		}
	};

	return (
		<div
			style={{
				padding: '24px',
				paddingBottom: isApiDisplayVisible ? '450px' : '24px',
				maxWidth: '1200px',
				margin: '0 auto',
				transition: 'padding-bottom 0.3s ease',
			}}
		>
			<MFANavigationV8 currentPage="settings" showBackToMain={true} />

			{/* Back Button */}
			{returnPath && (
				<button
					type="button"
					onClick={handleBack}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						padding: '10px 16px',
						marginBottom: '16px',
						background: 'white',
						color: '#374151',
						border: '1px solid #d1d5db',
						borderRadius: '8px',
						fontSize: '14px',
						fontWeight: '600',
						cursor: 'pointer',
						transition: 'all 0.2s ease',
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = '#f9fafb';
						e.currentTarget.style.borderColor = '#9ca3af';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = 'white';
						e.currentTarget.style.borderColor = '#d1d5db';
					}}
				>
					<FiArrowLeft size={16} />
					<span>Back to {getFlowLabel(returnPath)}</span>
				</button>
			)}

			<SuperSimpleApiDisplayV8 flowFilter="mfa" />

			{/* Header */}
			<div
				style={{
					background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
					borderRadius: '12px',
					padding: '32px',
					marginBottom: '24px',
					boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
				}}
			>
				<h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: 'white' }}>
					MFA Configuration
				</h1>
				<p style={{ margin: 0, fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)' }}>
					Manage MFA-specific settings for authentication flows, device management, and user
					experience
				</p>
			</div>

			{/* Action Buttons */}
			<div
				style={{
					display: 'flex',
					gap: '12px',
					marginBottom: '24px',
					flexWrap: 'wrap',
				}}
			>
				<button
					type="button"
					onClick={handleSave}
					disabled={!hasChanges || isSaving}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						padding: '10px 20px',
						background: hasChanges ? '#10b981' : '#9ca3af',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						fontSize: '14px',
						fontWeight: '600',
						cursor: hasChanges ? 'pointer' : 'not-allowed',
					}}
				>
					<FiCheck size={16} />
					{isSaving ? 'Saving...' : 'Save Changes'}
				</button>

				<button
					type="button"
					onClick={handleManualWorkerTokenRefresh}
					disabled={isRefreshingToken}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						padding: '10px 20px',
						background: '#1f2937',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						fontSize: '14px',
						fontWeight: '600',
						cursor: isRefreshingToken ? 'not-allowed' : 'pointer',
						opacity: isRefreshingToken ? 0.6 : 1,
					}}
				>
					<FiRefreshCw size={16} />
					{isRefreshingToken ? 'Refreshing Token…' : 'Refresh Worker Token'}
				</button>

				<button
					type="button"
					onClick={handleReset}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						padding: '10px 20px',
						background: 'white',
						color: '#dc2626',
						border: '1px solid #dc2626',
						borderRadius: '8px',
						fontSize: '14px',
						fontWeight: '600',
						cursor: 'pointer',
					}}
				>
					<FiRefreshCw size={16} />
					Reset to Defaults
				</button>

				<button
					type="button"
					onClick={handleExport}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						padding: '10px 20px',
						background: 'white',
						color: '#3b82f6',
						border: '1px solid #3b82f6',
						borderRadius: '8px',
						fontSize: '14px',
						fontWeight: '600',
						cursor: 'pointer',
					}}
				>
					<FiDownload size={16} />
					Export
				</button>

				<button
					type="button"
					onClick={handleImport}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						padding: '10px 20px',
						background: 'white',
						color: '#3b82f6',
						border: '1px solid #3b82f6',
						borderRadius: '8px',
						fontSize: '14px',
						fontWeight: '600',
						cursor: 'pointer',
					}}
				>
					<FiUpload size={16} />
					Import
				</button>
			</div>

			{/* Configuration Sections */}
			<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
				{/* PingOne MFA Settings */}
				{environmentId && (
					<ConfigSection
						title="PingOne MFA Settings"
						description="Environment-level MFA settings from PingOne API. These settings apply to all MFA policies in your environment."
					>
						{isLoadingPingOneSettings ? (
							<div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
								Loading PingOne MFA settings...
							</div>
						) : pingOneSettings ? (
							<>
								<div
									style={{
										marginBottom: '20px',
										padding: '12px',
										background: '#eff6ff',
										borderRadius: '8px',
										border: '1px solid #bfdbfe',
									}}
								>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											marginBottom: '8px',
										}}
									>
										<FiInfo size={16} color="#3b82f6" />
										<span style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
											About PingOne MFA Settings
										</span>
									</div>
									<p style={{ margin: 0, fontSize: '13px', color: '#1e40af', lineHeight: '1.5' }}>
										These are environment-level settings that control MFA behavior across all
										policies. For policy-specific settings (like pairing and lockout), configure
										them in Device Authentication Policies.
										<MFAInfoButtonV8 contentKey="mfa.settings" displayMode="tooltip" />
									</p>
								</div>

								{/* Pairing Settings */}
								{pingOneSettings.pairing && (
									<div
										style={{
											marginBottom: '20px',
											paddingBottom: '20px',
											borderBottom: '1px solid #e5e7eb',
										}}
									>
										<h4
											style={{
												margin: '0 0 12px 0',
												fontSize: '16px',
												fontWeight: '600',
												color: '#374151',
											}}
										>
											Pairing Settings
										</h4>
										{pingOneSettings.pairing.maxAllowedDevices !== undefined && (
											<NumberSetting
												label="Max Allowed Devices"
												value={pingOneSettings.pairing.maxAllowedDevices}
												onChange={(value) => {
													setPingOneSettings({
														...pingOneSettings,
														pairing: { ...pingOneSettings.pairing, maxAllowedDevices: value },
													});
													setHasPingOneSettingsChanges(true);
												}}
												min={1}
												max={100}
												description="Maximum number of MFA devices a user can register"
											/>
										)}
										{pingOneSettings.pairing.pairingKeyFormat && (
											<SelectSetting
												label="Pairing Key Format"
												value={pingOneSettings.pairing.pairingKeyFormat}
												onChange={(value) => {
													setPingOneSettings({
														...pingOneSettings,
														pairing: {
															...pingOneSettings.pairing,
															pairingKeyFormat: value as string,
														},
													});
													setHasPingOneSettingsChanges(true);
												}}
												options={[
													{ value: 'NUMERIC', label: 'Numeric (User Code)' },
													{ value: 'QR_CODE', label: 'QR Code' },
													{ value: 'ALPHANUMERIC', label: 'Alphanumeric' },
												]}
												description="Format for device pairing keys"
											/>
										)}
										{pingOneSettings.pairing.pairingKeyLength !== undefined && (
											<NumberSetting
												label="Pairing Key Length"
												value={pingOneSettings.pairing.pairingKeyLength}
												onChange={(value) => {
													setPingOneSettings({
														...pingOneSettings,
														pairing: { ...pingOneSettings.pairing, pairingKeyLength: value },
													});
													setHasPingOneSettingsChanges(true);
												}}
												min={4}
												max={32}
												description="Length of pairing keys"
											/>
										)}
										{pingOneSettings.pairing.pairingTimeoutMinutes !== undefined && (
											<NumberSetting
												label="Pairing Timeout (Minutes)"
												value={pingOneSettings.pairing.pairingTimeoutMinutes}
												onChange={(value) => {
													setPingOneSettings({
														...pingOneSettings,
														pairing: { ...pingOneSettings.pairing, pairingTimeoutMinutes: value },
													});
													setHasPingOneSettingsChanges(true);
												}}
												min={1}
												max={60}
												description="Timeout for device pairing process"
											/>
										)}
									</div>
								)}

								{/* Lockout Settings */}
								{pingOneSettings.lockout && (
									<div
										style={{
											marginBottom: '20px',
											paddingBottom: '20px',
											borderBottom: '1px solid #e5e7eb',
										}}
									>
										<h4
											style={{
												margin: '0 0 12px 0',
												fontSize: '16px',
												fontWeight: '600',
												color: '#374151',
											}}
										>
											Lockout Settings
										</h4>
										{pingOneSettings.lockout.failureCount !== undefined && (
											<NumberSetting
												label="Failure Count"
												value={pingOneSettings.lockout.failureCount}
												onChange={(value) => {
													setPingOneSettings({
														...pingOneSettings,
														lockout: { ...pingOneSettings.lockout, failureCount: value },
													});
													setHasPingOneSettingsChanges(true);
												}}
												min={1}
												max={20}
												description="Number of failed attempts before lockout"
											/>
										)}
										{pingOneSettings.lockout.durationSeconds !== undefined && (
											<NumberSetting
												label="Lockout Duration (Seconds)"
												value={pingOneSettings.lockout.durationSeconds}
												onChange={(value) => {
													setPingOneSettings({
														...pingOneSettings,
														lockout: { ...pingOneSettings.lockout, durationSeconds: value },
													});
													setHasPingOneSettingsChanges(true);
												}}
												min={60}
												max={86400}
												description="Duration of lockout after failed attempts"
											/>
										)}
										{pingOneSettings.lockout.progressiveLockoutEnabled !== undefined && (
											<ToggleSetting
												label="Progressive Lockout"
												value={pingOneSettings.lockout.progressiveLockoutEnabled}
												onChange={(value) => {
													setPingOneSettings({
														...pingOneSettings,
														lockout: {
															...pingOneSettings.lockout,
															progressiveLockoutEnabled: value,
														},
													});
													setHasPingOneSettingsChanges(true);
												}}
												description="Enable progressive lockout (increasing duration with each failure)"
											/>
										)}
									</div>
								)}

								{/* OTP Settings */}
								{pingOneSettings.otp && (
									<div style={{ marginBottom: '20px' }}>
										<h4
											style={{
												margin: '0 0 12px 0',
												fontSize: '16px',
												fontWeight: '600',
												color: '#374151',
											}}
										>
											OTP Settings
										</h4>
										{pingOneSettings.otp.otpLength !== undefined && (
											<NumberSetting
												label="OTP Length"
												value={pingOneSettings.otp.otpLength}
												onChange={(value) => {
													setPingOneSettings({
														...pingOneSettings,
														otp: { ...pingOneSettings.otp, otpLength: value },
													});
													setHasPingOneSettingsChanges(true);
												}}
												min={4}
												max={8}
												description="Length of OTP codes"
											/>
										)}
										{pingOneSettings.otp.otpValiditySeconds !== undefined && (
											<NumberSetting
												label="OTP Validity (Seconds)"
												value={pingOneSettings.otp.otpValiditySeconds}
												onChange={(value) => {
													setPingOneSettings({
														...pingOneSettings,
														otp: { ...pingOneSettings.otp, otpValiditySeconds: value },
													});
													setHasPingOneSettingsChanges(true);
												}}
												min={60}
												max={600}
												description="How long OTP codes remain valid"
											/>
										)}
									</div>
								)}

								{/* Action Buttons */}
								<div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
									<button
										type="button"
										onClick={handleSavePingOneSettings}
										disabled={!hasPingOneSettingsChanges || isSavingPingOneSettings}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											padding: '10px 20px',
											background: hasPingOneSettingsChanges ? '#10b981' : '#9ca3af',
											color: 'white',
											border: 'none',
											borderRadius: '8px',
											fontSize: '14px',
											fontWeight: '600',
											cursor: hasPingOneSettingsChanges ? 'pointer' : 'not-allowed',
										}}
									>
										<FiCheck size={16} />
										{isSavingPingOneSettings ? 'Saving...' : 'Save PingOne Settings'}
									</button>
									<button
										type="button"
										onClick={handleResetPingOneSettings}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											padding: '10px 20px',
											background: 'white',
											color: '#dc2626',
											border: '1px solid #dc2626',
											borderRadius: '8px',
											fontSize: '14px',
											fontWeight: '600',
											cursor: 'pointer',
										}}
									>
										<FiRefreshCw size={16} />
										Reset to Defaults
									</button>
								</div>
							</>
						) : (
							<div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
								No PingOne MFA settings available. Please ensure you have a valid worker token and
								environment ID.
							</div>
						)}
					</ConfigSection>
				)}

				{/* Worker Token Settings */}
				<ConfigSection
					title="Worker Token Settings"
					description="Configure automatic renewal of worker tokens during MFA flows"
				>
					<ToggleSetting
						label="Auto-Renewal"
						value={config.workerToken.autoRenewal}
						onChange={(value) => updateNestedConfig('workerToken', 'autoRenewal', value)}
						description="Automatically renew worker tokens when they expire or are about to expire"
					/>
					<NumberSetting
						label="Renewal Threshold (seconds)"
						value={config.workerToken.renewalThreshold}
						onChange={(value) => updateNestedConfig('workerToken', 'renewalThreshold', value)}
						min={60}
						max={3600}
						description="How many seconds before token expiry to trigger auto-renewal"
					/>
					<NumberSetting
						label="Retry Attempts"
						value={config.workerToken.retryAttempts}
						onChange={(value) => updateNestedConfig('workerToken', 'retryAttempts', value)}
						min={1}
						max={10}
						description="Number of times to retry token renewal if it fails"
					/>
					<NumberSetting
						label="Retry Delay (milliseconds)"
						value={config.workerToken.retryDelay}
						onChange={(value) => updateNestedConfig('workerToken', 'retryDelay', value)}
						min={500}
						max={10000}
						description="Base delay between retry attempts (uses exponential backoff)"
					/>
					<ToggleSetting
						label="Show Token After Generation"
						value={config.workerToken.showTokenAtEnd}
						onChange={(value) => updateNestedConfig('workerToken', 'showTokenAtEnd', value)}
						description="Display the generated worker token at the end of the generation process"
					/>
				</ConfigSection>

				{/* Default Policies */}
				<ConfigSection
					title="Default Policies"
					description="Set default policies for authentication and device registration"
				>
					<ToggleSetting
						label="Auto-Select Default Policies"
						value={config.autoSelectDefaultPolicies}
						onChange={(value) => updateConfig('autoSelectDefaultPolicies', value)}
						description="Automatically select default policies when available"
					/>
				</ConfigSection>

				{/* Device Selection Behavior */}
				<ConfigSection
					title="Device Selection Behavior"
					description="Control how users select devices during authentication"
				>
					<ToggleSetting
						label="Auto-Select First Device"
						value={config.autoSelectFirstDevice}
						onChange={(value) => updateConfig('autoSelectFirstDevice', value)}
						description="Automatically select the first available device when only one device exists"
					/>
					<ToggleSetting
						label="Always Show Device Selection"
						value={config.alwaysShowDeviceSelection}
						onChange={(value) => updateConfig('alwaysShowDeviceSelection', value)}
						description="Always display device selection modal, even when policy suggests auto-selection"
					/>
					<NumberSetting
						label="Device Selection Timeout (seconds)"
						value={config.deviceSelectionTimeout}
						onChange={(value) => updateConfig('deviceSelectionTimeout', value)}
						min={10}
						max={300}
						description="Maximum time to wait for user to select a device"
					/>
				</ConfigSection>

				{/* OTP Settings */}
				<ConfigSection
					title="OTP Settings"
					description="Configure OTP code handling and validation"
				>
					<SelectSetting
						label="OTP Code Length"
						value={config.otpCodeLength}
						onChange={(value) => updateConfig('otpCodeLength', value as 4 | 6 | 8)}
						options={[
							{ value: 4, label: '4 digits' },
							{ value: 6, label: '6 digits' },
							{ value: 8, label: '8 digits' },
						]}
						description="Expected length of OTP codes"
					/>
					<ToggleSetting
						label="OTP Input Auto-Focus"
						value={config.otpInputAutoFocus}
						onChange={(value) => updateConfig('otpInputAutoFocus', value)}
						description="Automatically focus OTP input field when modal opens"
					/>
					<ToggleSetting
						label="OTP Input Auto-Submit"
						value={config.otpInputAutoSubmit}
						onChange={(value) => updateConfig('otpInputAutoSubmit', value)}
						description="Automatically submit OTP when all digits are entered"
					/>
					<NumberSetting
						label="OTP Validation Timeout (seconds)"
						value={config.otpValidationTimeout}
						onChange={(value) => updateConfig('otpValidationTimeout', value)}
						min={60}
						max={1800}
						description="Maximum time to wait for OTP validation"
					/>
					<NumberSetting
						label="OTP Resend Delay (seconds)"
						value={config.otpResendDelay}
						onChange={(value) => updateConfig('otpResendDelay', value)}
						min={10}
						max={300}
						description="Minimum time between OTP resend requests"
					/>
				</ConfigSection>

				{/* FIDO2/WebAuthn Settings */}
				<ConfigSection
					title="FIDO2/WebAuthn Settings"
					description="Configure FIDO2 and WebAuthn authentication settings"
				>
					<SelectSetting
						label="Preferred Authenticator Type"
						value={config.fido2.preferredAuthenticatorType}
						onChange={(value) =>
							updateNestedConfig(
								'fido2',
								'preferredAuthenticatorType',
								value as 'platform' | 'cross-platform' | 'both'
							)
						}
						options={[
							{ value: 'platform', label: 'Platform (Touch ID, Face ID, Windows Hello)' },
							{ value: 'cross-platform', label: 'Cross-Platform (Security Keys)' },
							{ value: 'both', label: 'Both (Let user choose)' },
						]}
						description="Preferred authenticator type for FIDO2 registration"
					/>
					<SelectSetting
						label="User Verification"
						value={config.fido2.userVerification}
						onChange={(value) =>
							updateNestedConfig(
								'fido2',
								'userVerification',
								value as 'discouraged' | 'preferred' | 'required'
							)
						}
						options={[
							{ value: 'discouraged', label: 'Discouraged' },
							{ value: 'preferred', label: 'Preferred' },
							{ value: 'required', label: 'Required' },
						]}
						description="User verification requirement for FIDO2 operations (PIN, biometric)"
					/>
					<SelectSetting
						label="Discoverable Credentials"
						value={config.fido2.discoverableCredentials}
						onChange={(value) =>
							updateNestedConfig(
								'fido2',
								'discoverableCredentials',
								value as 'discouraged' | 'preferred' | 'required'
							)
						}
						options={[
							{ value: 'discouraged', label: 'Discouraged (Server-side storage)' },
							{ value: 'preferred', label: 'Preferred (Client-side storage)' },
							{ value: 'required', label: 'Required (Client-side storage)' },
						]}
						description="Whether to use discoverable (resident) credentials"
					/>
					<SelectSetting
						label="Relying Party ID Type"
						value={config.fido2.relyingPartyIdType}
						onChange={(value) =>
							updateNestedConfig(
								'fido2',
								'relyingPartyIdType',
								value as 'pingone' | 'custom' | 'other'
							)
						}
						options={[
							{ value: 'pingone', label: 'PingOne' },
							{ value: 'custom', label: 'Custom Domain' },
							{ value: 'other', label: 'Other' },
						]}
						description="Type of Relying Party ID to use"
					/>
					{config.fido2.relyingPartyIdType !== 'pingone' && (
						<TextSetting
							label="Relying Party ID"
							value={config.fido2.relyingPartyId}
							onChange={(value) => updateNestedConfig('fido2', 'relyingPartyId', value)}
							description="Relying Party ID for WebAuthn operations (usually your domain)"
						/>
					)}
					<ToggleSetting
						label="FIDO Device Aggregation"
						value={config.fido2.fidoDeviceAggregation}
						onChange={(value) => updateNestedConfig('fido2', 'fidoDeviceAggregation', value)}
						description="Enable FIDO device aggregation"
					/>
					<SelectSetting
						label="Backup Eligibility"
						value={config.fido2.backupEligibility}
						onChange={(value) =>
							updateNestedConfig('fido2', 'backupEligibility', value as 'allow' | 'disallow')
						}
						options={[
							{ value: 'allow', label: 'Allow' },
							{ value: 'disallow', label: 'Disallow' },
						]}
						description="Whether credentials can be backed up"
					/>
					<ToggleSetting
						label="Enforce Backup Eligibility During Authentication"
						value={config.fido2.enforceBackupEligibilityDuringAuth}
						onChange={(value) =>
							updateNestedConfig('fido2', 'enforceBackupEligibilityDuringAuth', value)
						}
						description="Enforce backup eligibility during authentication"
					/>
					<SelectSetting
						label="Attestation Request"
						value={config.fido2.attestationRequest}
						onChange={(value) =>
							updateNestedConfig(
								'fido2',
								'attestationRequest',
								value as 'none' | 'direct' | 'enterprise'
							)
						}
						options={[
							{ value: 'none', label: 'None' },
							{ value: 'direct', label: 'Direct' },
							{ value: 'enterprise', label: 'Enterprise' },
						]}
						description="Type of attestation to request from the authenticator"
					/>
					<ToggleSetting
						label="Include Environment Name"
						value={config.fido2.includeEnvironmentName}
						onChange={(value) => updateNestedConfig('fido2', 'includeEnvironmentName', value)}
						description="Include environment name in display information"
					/>
					<ToggleSetting
						label="Include Organization Name"
						value={config.fido2.includeOrganizationName}
						onChange={(value) => updateNestedConfig('fido2', 'includeOrganizationName', value)}
						description="Include organization name in display information"
					/>
				</ConfigSection>

				{/* Push Notification Settings */}
				<ConfigSection
					title="Push Notification Settings"
					description="Configure push notification handling and polling"
				>
					<NumberSetting
						label="Push Notification Timeout (seconds)"
						value={config.pushNotificationTimeout}
						onChange={(value) => updateConfig('pushNotificationTimeout', value)}
						min={30}
						max={600}
						description="Maximum time to wait for push notification approval"
					/>
					<NumberSetting
						label="Push Polling Interval (seconds)"
						value={config.pushPollingInterval}
						onChange={(value) => updateConfig('pushPollingInterval', value)}
						min={1}
						max={10}
						description="How often to poll for push notification status"
					/>
					<ToggleSetting
						label="Auto-Start Push Polling"
						value={config.autoStartPushPolling}
						onChange={(value) => updateConfig('autoStartPushPolling', value)}
						description="Automatically start polling when push notification is sent"
					/>
					<ToggleSetting
						label="Show Push Notification Instructions"
						value={config.showPushNotificationInstructions}
						onChange={(value) => updateConfig('showPushNotificationInstructions', value)}
						description="Display instructions for approving push notifications"
					/>
				</ConfigSection>

				{/* UI/UX Settings */}
				<ConfigSection title="UI/UX Settings" description="Customize the user interface experience">
					<ToggleSetting
						label="Show Device Icons"
						value={config.ui.showDeviceIcons}
						onChange={(value) => updateNestedConfig('ui', 'showDeviceIcons', value)}
						description="Display icons for different device types"
					/>
					<ToggleSetting
						label="Show Device Status Badges"
						value={config.ui.showDeviceStatusBadges}
						onChange={(value) => updateNestedConfig('ui', 'showDeviceStatusBadges', value)}
						description="Display status badges (ACTIVE, INACTIVE, etc.) on devices"
					/>
					<NumberSetting
						label="Modal Animation Duration (milliseconds)"
						value={config.ui.modalAnimationDuration}
						onChange={(value) => updateNestedConfig('ui', 'modalAnimationDuration', value)}
						min={0}
						max={1000}
						description="Duration of modal open/close animations (0 = instant)"
					/>
					<ToggleSetting
						label="Show Loading Spinners"
						value={config.ui.showLoadingSpinners}
						onChange={(value) => updateNestedConfig('ui', 'showLoadingSpinners', value)}
						description="Display loading spinners during async operations"
					/>
				</ConfigSection>

				{/* Security Settings */}
				<ConfigSection
					title="Security Settings"
					description="Security-related configuration options"
				>
					<ToggleSetting
						label="Require Username for Authentication"
						value={config.security.requireUsernameForAuthentication}
						onChange={(value) =>
							updateNestedConfig('security', 'requireUsernameForAuthentication', value)
						}
						description="Require username input before starting authentication"
					/>
					<ToggleSetting
						label="Allow Usernameless FIDO2"
						value={config.security.allowUsernamelessFido2}
						onChange={(value) => updateNestedConfig('security', 'allowUsernamelessFido2', value)}
						description="Allow FIDO2 authentication without username (passkeys)"
					/>
					<ToggleSetting
						label="Validate Device IDs"
						value={config.security.validateDeviceIds}
						onChange={(value) => updateNestedConfig('security', 'validateDeviceIds', value)}
						description="Validate device IDs before using them in API calls"
					/>
					<ToggleSetting
						label="Sanitize Device Names"
						value={config.security.sanitizeDeviceNames}
						onChange={(value) => updateNestedConfig('security', 'sanitizeDeviceNames', value)}
						description="Sanitize device names to prevent XSS"
					/>
				</ConfigSection>
			</div>
		</div>
	);
};

// Helper Components
interface ConfigSectionProps {
	title: string;
	description: string;
	children: React.ReactNode;
}

const ConfigSection: React.FC<ConfigSectionProps> = ({ title, description, children }) => {
	return (
		<div
			style={{
				background: 'white',
				borderRadius: '12px',
				padding: '24px',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
				border: '1px solid #e5e7eb',
			}}
		>
			<h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
				{title}
			</h2>
			<p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>{description}</p>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>{children}</div>
		</div>
	);
};

interface SettingProps {
	label: string;
	description?: string;
}

interface ToggleSettingProps extends SettingProps {
	value: boolean;
	onChange: (value: boolean) => void;
}

const ToggleSetting: React.FC<ToggleSettingProps> = ({ label, description, value, onChange }) => {
	return (
		<div>
			<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
				<label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', cursor: 'pointer' }}>
					{label}
				</label>
				<button
					type="button"
					onClick={() => onChange(!value)}
					style={{
						width: '44px',
						height: '24px',
						borderRadius: '12px',
						border: 'none',
						background: value ? '#10b981' : '#d1d5db',
						cursor: 'pointer',
						position: 'relative',
						transition: 'background 0.2s ease',
					}}
				>
					<div
						style={{
							position: 'absolute',
							top: '2px',
							left: value ? '22px' : '2px',
							width: '20px',
							height: '20px',
							borderRadius: '50%',
							background: 'white',
							transition: 'left 0.2s ease',
							boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
						}}
					/>
				</button>
			</div>
			{description && (
				<p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{description}</p>
			)}
		</div>
	);
};

interface NumberSettingProps extends SettingProps {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
}

const NumberSetting: React.FC<NumberSettingProps> = ({
	label,
	description,
	value,
	onChange,
	min,
	max,
}) => {
	return (
		<div>
			<label
				style={{
					display: 'block',
					fontSize: '14px',
					fontWeight: '500',
					color: '#374151',
					marginBottom: '8px',
				}}
			>
				{label}
			</label>
			<input
				type="number"
				value={value}
				onChange={(e) => {
					const num = parseInt(e.target.value, 10);
					if (!Number.isNaN(num)) {
						const clamped =
							min !== undefined && max !== undefined ? Math.max(min, Math.min(max, num)) : num;
						onChange(clamped);
					}
				}}
				min={min}
				max={max}
				style={{
					width: '100%',
					padding: '8px 12px',
					border: '1px solid #d1d5db',
					borderRadius: '6px',
					fontSize: '14px',
				}}
			/>
			{description && (
				<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{description}</p>
			)}
		</div>
	);
};

interface SelectSettingProps extends SettingProps {
	value: string | number;
	onChange: (value: string | number) => void;
	options: Array<{ value: string | number; label: string }>;
}

const SelectSetting: React.FC<SelectSettingProps> = ({
	label,
	description,
	value,
	onChange,
	options,
}) => {
	return (
		<div>
			<label
				style={{
					display: 'block',
					fontSize: '14px',
					fontWeight: '500',
					color: '#374151',
					marginBottom: '8px',
				}}
			>
				{label}
			</label>
			<select
				value={value}
				onChange={(e) => {
					const selectedOption = options.find((opt) => String(opt.value) === e.target.value);
					if (selectedOption) {
						onChange(selectedOption.value);
					}
				}}
				style={{
					width: '100%',
					padding: '8px 12px',
					border: '1px solid #d1d5db',
					borderRadius: '6px',
					fontSize: '14px',
					background: 'white',
				}}
			>
				{options.map((option) => (
					<option key={String(option.value)} value={String(option.value)}>
						{option.label}
					</option>
				))}
			</select>
			{description && (
				<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{description}</p>
			)}
		</div>
	);
};

interface TextSettingProps extends SettingProps {
	value: string;
	onChange: (value: string) => void;
}

const TextSetting: React.FC<TextSettingProps> = ({ label, description, value, onChange }) => {
	return (
		<div>
			<label
				style={{
					display: 'block',
					fontSize: '14px',
					fontWeight: '500',
					color: '#374151',
					marginBottom: '8px',
				}}
			>
				{label}
			</label>
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				style={{
					width: '100%',
					padding: '8px 12px',
					border: '1px solid #d1d5db',
					borderRadius: '6px',
					fontSize: '14px',
				}}
			/>
			{description && (
				<p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{description}</p>
			)}
		</div>
	);
};

export default MFAConfigurationPageV8;
