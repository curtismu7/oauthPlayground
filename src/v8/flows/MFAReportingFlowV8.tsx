/**
 * @file MFAReportingFlowV8.tsx
 * @module v8/flows
 * @description MFA Reporting Flow - View MFA usage reports and analytics
 * @version 8.0.0
 * @since 2024-11-19
 *
 * Features:
 * - User authentication reports
 * - Device authentication reports
 * - FIDO2 device reports
 * - Date range filtering
 * - Export capabilities
 *
 * @example
 * <MFAReportingFlowV8 />
 */

import { FiPackage } from '@icons';
import React, { useEffect, useState } from 'react';
import { usePageScroll } from '@/hooks/usePageScroll';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { WorkerTokenExpiryBannerV8 } from '@/v8/components/WorkerTokenExpiryBannerV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { useApiDisplayPadding } from '@/v8/hooks/useApiDisplayPadding';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { MFAReportingServiceV8 } from '@/v8/services/mfaReportingServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import {
	type TokenStatusInfo,
	WorkerTokenStatusServiceV8,
} from '@/v8/services/workerTokenStatusServiceV8';
import { CommonSpinner } from '../../components/common/CommonSpinner';
import { ButtonSpinner } from '../../components/ui/ButtonSpinner';
import { useProductionSpinner } from '../../hooks/useProductionSpinner';

import { logger } from '../../utils/logger';

const MODULE_TAG = '[📊 MFA-REPORTING-FLOW-V8]';
const FLOW_KEY = 'mfa-reporting-v8';

interface Credentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	username: string;
	[key: string]: unknown;
}

type ReportType =
	| 'sms'
	| 'email'
	| 'voice'
	| 'totp'
	| 'fido2'
	| 'whatsapp'
	| 'mfa-enabled'
	| 'mfa-disabled'
	| 'all-devices'
	| 'active-devices'
	| 'blocked-devices'
	| 'compromised-devices'
	| 'user-authentications'
	| 'device-authentications';

interface ReportConfig {
	type: ReportType;
	label: string;
	description: string;
	filter?: string;
	fields?: Array<{ name: string }>;
	requiresUsername?: boolean;
	isAsync?: boolean;
}

const REPORT_CONFIGS: Record<ReportType, ReportConfig> = {
	sms: {
		type: 'sms',
		label: 'SMS Devices',
		description: 'All SMS devices',
		filter: '(deviceType eq "SMS")',
		fields: [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'deviceId' },
			{ name: 'deviceType' },
			{ name: 'deviceStatus' },
			{ name: 'phone' },
			{ name: 'deviceNickname' },
			{ name: 'deviceCreatedAt' },
		],
	},
	email: {
		type: 'email',
		label: 'Email Devices',
		description: 'All email devices',
		filter: '(deviceType eq "EMAIL")',
		fields: [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'deviceId' },
			{ name: 'deviceType' },
			{ name: 'deviceStatus' },
			{ name: 'email' },
			{ name: 'deviceNickname' },
			{ name: 'deviceCreatedAt' },
		],
	},
	voice: {
		type: 'voice',
		label: 'Voice Devices',
		description: 'All voice devices',
		filter: '(deviceType eq "VOICE")',
		fields: [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'deviceId' },
			{ name: 'deviceType' },
			{ name: 'deviceStatus' },
			{ name: 'phone' },
			{ name: 'deviceNickname' },
			{ name: 'deviceCreatedAt' },
		],
	},
	totp: {
		type: 'totp',
		label: 'TOTP Devices',
		description: 'All TOTP authenticator devices',
		filter: '(deviceType eq "TOTP")',
		fields: [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'deviceId' },
			{ name: 'deviceType' },
			{ name: 'deviceStatus' },
			{ name: 'deviceNickname' },
			{ name: 'deviceCreatedAt' },
		],
	},
	fido2: {
		type: 'fido2',
		label: 'FIDO2 Devices',
		description: 'All FIDO2/WebAuthn devices',
		filter: '(deviceType eq "FIDO2")',
		fields: [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'deviceId' },
			{ name: 'deviceType' },
			{ name: 'deviceStatus' },
			{ name: 'deviceNickname' },
			{ name: 'fidoBackupEligibility' },
			{ name: 'fidoBackupState' },
			{ name: 'fidoUserVerification' },
			{ name: 'deviceName' },
			{ name: 'manufacturer' },
			{ name: 'modelName' },
			{ name: 'deviceCreatedAt' },
		],
	},
	whatsapp: {
		type: 'whatsapp',
		label: 'WhatsApp Devices',
		description: 'All WhatsApp devices',
		filter: '(deviceType eq "WHATSAPP")',
		fields: [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'deviceId' },
			{ name: 'deviceType' },
			{ name: 'deviceStatus' },
			{ name: 'phone' },
			{ name: 'deviceNickname' },
			{ name: 'deviceCreatedAt' },
		],
	},
	'mfa-enabled': {
		type: 'mfa-enabled',
		label: 'MFA Enabled Users',
		description: 'Users with MFA enabled',
		requiresUsername: true,
		isAsync: true,
	},
	'mfa-disabled': {
		type: 'mfa-disabled',
		label: 'MFA Disabled Users',
		description: 'Users without MFA',
		requiresUsername: true,
		isAsync: true,
	},
	'all-devices': {
		type: 'all-devices',
		label: 'All Devices',
		description: 'All MFA devices',
		fields: [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'deviceId' },
			{ name: 'deviceType' },
			{ name: 'deviceStatus' },
			{ name: 'deviceCreatedAt' },
		],
	},
	'active-devices': {
		type: 'active-devices',
		label: 'Active Devices',
		description: 'Active MFA devices',
		filter: '(deviceStatus eq "ACTIVE")',
		fields: [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'deviceId' },
			{ name: 'deviceType' },
			{ name: 'deviceStatus' },
			{ name: 'deviceCreatedAt' },
		],
	},
	'blocked-devices': {
		type: 'blocked-devices',
		label: 'Blocked Devices',
		description: 'Blocked MFA devices',
		filter: '(deviceStatus eq "BLOCKED")',
		fields: [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'deviceId' },
			{ name: 'deviceType' },
			{ name: 'deviceStatus' },
			{ name: 'deviceCreatedAt' },
		],
	},
	'compromised-devices': {
		type: 'compromised-devices',
		label: 'Compromised Devices',
		description: 'Compromised MFA devices',
		filter: '(deviceStatus eq "COMPROMISED")',
		fields: [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'deviceId' },
			{ name: 'deviceType' },
			{ name: 'deviceStatus' },
			{ name: 'deviceCreatedAt' },
		],
	},
	'user-authentications': {
		type: 'user-authentications',
		label: 'User Authentications',
		description: 'User authentication events',
		requiresUsername: true,
		isAsync: true,
	},
	'device-authentications': {
		type: 'device-authentications',
		label: 'Device Authentications',
		description: 'Device authentication events',
		isAsync: true,
	},
};

/**
 * MFA Reporting Flow component
 */
export const MFAReportingFlowV8: React.FC = () => {
	// Scroll to top on page load
	usePageScroll({ pageName: 'MFA Reporting V8', force: true });

	const [credentials, setCredentials] = useState<Credentials>({
		environmentId: '',
		clientId: '',
		username: '',
	});

	// Load credentials on mount
	useEffect(() => {
		const loadCredentials = async () => {
			try {
				const stored = await CredentialsServiceV8.loadCredentials(FLOW_KEY, {
					flowKey: FLOW_KEY,
					flowType: 'oidc',
					includeClientSecret: false,
					includeRedirectUri: false,
					includeLogoutUri: false,
					includeScopes: false,
				});

				// Get global environment ID if not in flow-specific storage
				const globalEnvId = EnvironmentIdServiceV8.getEnvironmentId();
				const environmentId = stored.environmentId || globalEnvId || '';

				logger.info(`${MODULE_TAG} Loading credentials`, {
					flowSpecificEnvId: stored.environmentId,
					globalEnvId,
					usingEnvId: environmentId,
				});

				setCredentials({
					...credentials,
					environmentId,
					username: stored.username || '',
				});
			} catch (error) {
				logger.error(`${MODULE_TAG} Failed to load credentials`, error);
			}
		};

		loadCredentials();
	}, [credentials]);

	// Save environment ID globally when it changes
	useEffect(() => {
		if (credentials.environmentId) {
			EnvironmentIdServiceV8.saveEnvironmentId(credentials.environmentId);
			logger.info(`${MODULE_TAG} Environment ID saved globally`, {
				environmentId: credentials.environmentId,
			});
		}
	}, [credentials.environmentId]);

	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [tokenStatus, setTokenStatus] = useState<TokenStatusInfo>(
		WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync()
	);

	// Worker Token Settings - Load from config service
	const [silentApiRetrieval, _setSilentApiRetrieval] = useState(() => {
		try {
			return MFAConfigurationServiceV8.loadConfiguration().workerToken.silentApiRetrieval || false;
		} catch {
			return false;
		}
	});
	const [showTokenAtEnd, _setShowTokenAtEnd] = useState(() => {
		try {
			return MFAConfigurationServiceV8.loadConfiguration().workerToken.showTokenAtEnd || false;
		} catch {
			return false;
		}
	});

	// Spinner hooks for async operations
	const reportingSpinner = useProductionSpinner('mfa-reporting');
	const workerTokenSpinner = useProductionSpinner('mfa-worker-token');

	// Report state
	const [selectedReport, setSelectedReport] = useState<ReportType>('all-devices');
	const [reports, setReports] = useState<unknown[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [_error, setError] = useState<string | null>(null);
	const [username, setUsername] = useState('');
	const [region, setRegion] = useState<'us' | 'eu' | 'ap' | 'ca' | 'na'>('us');
	const [customDomain, setCustomDomain] = useState('');

	// Check if current report requires username
	const needsUsername = REPORT_CONFIGS[selectedReport]?.requiresUsername || false;
	const isDeviceReport = ['sms', 'email', 'voice', 'totp', 'fido2', 'whatsapp'].includes(
		selectedReport
	);
	const _isAsyncReport = REPORT_CONFIGS[selectedReport]?.isAsync;

	// Get API display padding
	const { paddingBottom } = useApiDisplayPadding();

	// Check token status periodically
	useEffect(() => {
		const checkStatus = () => {
			const status = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
			setTokenStatus(status);
		};

		const interval = setInterval(checkStatus, 30000);
		const handleStorageChange = () => checkStatus();
		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('workerTokenUpdated', handleStorageChange);

		return () => {
			clearInterval(interval);
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('workerTokenUpdated', handleStorageChange);
		};
	}, []);

	// Save credentials when they change
	useEffect(() => {
		CredentialsServiceV8.saveCredentials(FLOW_KEY, credentials);
	}, [credentials]);

	const handleManageWorkerToken = async () => {
		if (tokenStatus.isValid) {
			const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');
			const confirmed = await uiNotificationServiceV8.confirm({
				title: 'Remove Worker Token',
				message:
					'Are you sure you want to remove the worker token? This will affect all MFA reporting functionality.',
				confirmText: 'Remove',
				cancelText: 'Cancel',
				severity: 'warning',
			});
			if (confirmed) {
				await workerTokenServiceV8.clearToken();
				window.dispatchEvent(new Event('workerTokenUpdated'));
				const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
				setTokenStatus(newStatus);
				modernMessaging.showFooterMessage({
					type: 'info',
					message: 'Worker token removed',
					duration: 3000,
				});
			}
		} else {
			const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
			await handleShowWorkerTokenModal(
				setShowWorkerTokenModal,
				setTokenStatus,
				silentApiRetrieval,
				showTokenAtEnd,
				true // Force show modal - user clicked button
			);
		}
	};

	const handleWorkerTokenGenerated = () => {
		window.dispatchEvent(new Event('workerTokenUpdated'));
		setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync());
		modernMessaging.showFooterMessage({
			type: 'info',
			message: 'Worker token generated and saved!',
			duration: 3000,
		});
	};

	const _loadReports = async () => {
		if (!credentials.environmentId?.trim()) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Environment ID is required',
				dismissible: true,
			});
			return;
		}
		if (!tokenStatus.isValid) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Worker token is required',
				dismissible: true,
			});
			return;
		}
		if (needsUsername && !username.trim()) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Username is required for this report type',
				dismissible: true,
			});
			return;
		}

		return await reportingSpinner.withSpinner(async () => {
			setIsLoading(true);
			setReports([]);
			setError(null);

			try {
				const config = REPORT_CONFIGS[selectedReport];
				let result: unknown[] = [];

				if (selectedReport === 'user-authentications') {
					// biome-ignore lint/suspicious/noExplicitAny: Report params require any type
					const params: any = {
						environmentId: credentials.environmentId,
						region,
						customDomain,
					};
					if (username.trim()) {
						params.filter = `username eq "${username.trim()}"`;
					}
					result = await MFAReportingServiceV8.getUserAuthenticationReports(params);
				} else if (selectedReport === 'device-authentications') {
					result = await MFAReportingServiceV8.getDeviceAuthenticationReports({
						environmentId: credentials.environmentId,
						region,
						customDomain,
					});
				} else if (isDeviceReport) {
					// Handle device reports (SMS, Email, Voice, TOTP, FIDO2, WhatsApp)
					// biome-ignore lint/suspicious/noExplicitAny: Device params require any type
					const deviceParams: any = {
						environmentId: credentials.environmentId,
						fields: config.fields || [],
						region,
						customDomain,
						deviceType: selectedReport.toUpperCase(), // Convert to device type expected by API
					};
					if (config.filter) {
						deviceParams.filter = config.filter;
					}
					const reportResult = await MFAReportingServiceV8.createMFADevicesReport(deviceParams);
					// Extract entries from the report result
					// biome-ignore lint/suspicious/noExplicitAny: Report result requires any type
					result = (reportResult as any)._embedded?.entries || [];
				} else {
					// Handle other reports (MFA enabled/disabled users)
					if (selectedReport === 'mfa-enabled') {
						// biome-ignore lint/suspicious/noExplicitAny: MFA params require any type
						const mfaParams: any = {
							environmentId: credentials.environmentId,
							fields: config.fields || [],
							region,
							customDomain,
						};
						if (config.filter) {
							mfaParams.filter = config.filter;
						}
						const reportResult =
							await MFAReportingServiceV8.createMFAEnabledDevicesReport(mfaParams);
						// Extract entries from the report result
						// biome-ignore lint/suspicious/noExplicitAny: Report result requires any type
						result = (reportResult as any)._embedded?.entries || [];
					} else if (selectedReport === 'mfa-disabled') {
						// biome-ignore lint/suspicious/noExplicitAny: MFA params require any type
						const mfaParams: any = {
							environmentId: credentials.environmentId,
							fields: config.fields || [],
							region,
							customDomain,
						};
						if (config.filter) {
							mfaParams.filter = config.filter;
						}
						const reportResult =
							await MFAReportingServiceV8.createMFAEnabledDevicesReport(mfaParams);
						// Extract entries from the report result
						// biome-ignore lint/suspicious/noExplicitAny: Report result requires any type
						result = (reportResult as any)._embedded?.entries || [];
					}
				}

				setReports(result);
				modernMessaging.showFooterMessage({
					type: 'info',
					message: `Loaded ${result.length} report records`,
					duration: 3000,
				});
			} catch (error) {
				logger.error(`${MODULE_TAG} Failed to load reports`, error);
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'Failed to load reports. Please check your credentials and try again.',
					dismissible: true,
				});
			} finally {
				setIsLoading(false);
			}
		});
	};

	// Get report title
	const getReportTitle = () => {
		return REPORT_CONFIGS[selectedReport]?.label || 'MFA Report';
	};

	return (
		<>
			<WorkerTokenExpiryBannerV8
				onFixToken={() => setShowWorkerTokenModal(true)}
				marginBottom="24px"
			/>
			{/* Modal Spinners for MFA Reporting Operations */}
			{reportingSpinner.isLoading && (
				<CommonSpinner
					message={reportingSpinner.spinnerState.message || 'Loading MFA reports...'}
					theme="blue"
					variant="modal"
					allowDismiss={false}
				/>
			)}
			{workerTokenSpinner.isLoading && (
				<CommonSpinner
					message={workerTokenSpinner.spinnerState.message || 'Managing worker token...'}
					theme="green"
					variant="modal"
					allowDismiss={false}
				/>
			)}

			<div
				className="mfa-reporting-flow-v8"
				style={{
					maxWidth: '1200px',
					margin: '0 auto',
					padding: '20px',
					paddingBottom: `${paddingBottom}px`,
				}}
			>
				<MFAHeaderV8
					title="MFA Reporting"
					description="Generate and view MFA usage reports and analytics"
				/>

				{/* Credentials Section */}
				<div
					style={{
						background: 'white',
						borderRadius: '8px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Configuration</h3>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
							gap: '16px',
							marginBottom: '16px',
						}}
					>
						<div>
							<label
								htmlFor="environment-id-input"
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '600',
									color: '#374151',
									marginBottom: '6px',
								}}
							>
								Environment ID <span style={{ color: '#dc2626' }}>*</span>
							</label>
							<input
								id="environment-id-input"
								type="text"
								value={credentials.environmentId}
								onChange={(e) =>
									setCredentials({ ...credentials, environmentId: e.target.value.trim() })
								}
								placeholder="Enter Environment ID"
								style={{
									width: '100%',
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
								}}
							/>
						</div>

						{needsUsername && (
							<div>
								<label
									style={{
										display: 'block',
										fontSize: '14px',
										fontWeight: '600',
										color: '#374151',
										marginBottom: '6px',
									}}
									htmlFor="username"
								>
									Username <span style={{ color: '#dc2626' }}>*</span>
								</label>
								<input
									id="username"
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value.trim())}
									placeholder="Enter username"
									style={{
										width: '100%',
										padding: '10px 12px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										fontSize: '14px',
									}}
								/>
							</div>
						)}

						<div>
							<label
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '600',
									color: '#374151',
									marginBottom: '6px',
								}}
								htmlFor="region"
							>
								Region
							</label>
							<select
								id="region"
								value={region}
								onChange={(e) => setRegion(e.target.value as typeof region)}
								style={{
									width: '100%',
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
									background: 'white',
								}}
							>
								<option value="us">US (North America)</option>
								<option value="eu">EU (Europe)</option>
								<option value="ap">AP (Asia Pacific)</option>
								<option value="ca">CA (Canada)</option>
								<option value="na">NA (North America)</option>
							</select>
						</div>

						<div>
							<label
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '600',
									color: '#374151',
									marginBottom: '6px',
								}}
								htmlFor="custom-domain"
							>
								Custom Domain (Optional)
							</label>
							<input
								id="custom-domain"
								type="text"
								value={customDomain}
								onChange={(e) => setCustomDomain(e.target.value.trim())}
								placeholder="custom.pingone.com"
								style={{
									width: '100%',
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
								}}
							/>
						</div>
					</div>

					{/* Worker Token Section */}
					<div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
						<ButtonSpinner
							loading={false}
							onClick={handleManageWorkerToken}
							spinnerSize={14}
							spinnerPosition="left"
							style={{
								padding: '10px 16px',
								background: tokenStatus.isValid ? '#10b981' : '#ef4444',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
						>
							<span>🔑</span>
							{tokenStatus.isValid ? 'Manage Token' : 'Add Token'}
						</ButtonSpinner>

						<div
							style={{
								flex: 1,
								padding: '10px 12px',
								background: tokenStatus.isValid
									? tokenStatus.status === 'expiring-soon'
										? '#fef3c7'
										: '#d1fae5'
									: '#fee2e2',
								border: `1px solid ${WorkerTokenStatusServiceV8.getStatusColor(tokenStatus.status)}`,
								borderRadius: '4px',
								fontSize: '12px',
								fontWeight: '500',
								color: tokenStatus.isValid
									? tokenStatus.status === 'expiring-soon'
										? '#92400e'
										: '#065f46'
									: '#991b1b',
							}}
						>
							<span>{WorkerTokenStatusServiceV8.getStatusIcon(tokenStatus.status)}</span>
							<span style={{ marginLeft: '6px' }}>{tokenStatus.message}</span>
						</div>
					</div>
				</div>

				{/* Report Selection */}
				<div
					style={{
						background: 'white',
						borderRadius: '8px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Report Selection</h3>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
							gap: '16px',
						}}
					>
						<div>
							<label
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '600',
									color: '#374151',
									marginBottom: '6px',
								}}
								htmlFor="report-type"
							>
								Report Type
							</label>
							<select
								id="report-type"
								value={selectedReport}
								onChange={(e) => setSelectedReport(e.target.value as ReportType)}
								style={{
									width: '100%',
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
									background: 'white',
								}}
							>
								{Object.entries(REPORT_CONFIGS).map(([key, config]) => (
									<option key={key} value={key}>
										{config.label} - {config.description}
									</option>
								))}
							</select>
						</div>

						<div style={{ display: 'flex', alignItems: 'flex-end' }}>
							<ButtonSpinner
								loading={isLoading}
								onClick={_loadReports}
								disabled={
									!credentials.environmentId ||
									!tokenStatus.isValid ||
									(needsUsername && !username.trim())
								}
								spinnerSize={16}
								spinnerPosition="left"
								loadingText="Loading..."
								style={{
									padding: '10px 20px',
									background: '#3b82f6',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '14px',
									fontWeight: '600',
									cursor: 'pointer',
									opacity:
										!credentials.environmentId ||
										!tokenStatus.isValid ||
										(needsUsername && !username.trim())
											? 0.5
											: 1,
								}}
							>
								{isLoading ? '' : 'Generate Report'}
							</ButtonSpinner>
						</div>
					</div>

					{needsUsername && (
						<div
							style={{
								marginTop: '12px',
								padding: '12px',
								background: '#fef3c7',
								borderRadius: '6px',
								fontSize: '12px',
								color: '#92400e',
							}}
						>
							<strong>Note:</strong> This report type requires a username to filter results for a
							specific user.
						</div>
					)}
				</div>

				{/* Report Results */}
				{reports.length > 0 ? (
					<div
						style={{
							background: 'white',
							borderRadius: '8px',
							padding: '24px',
							marginBottom: '24px',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						}}
					>
						<h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>{getReportTitle()}</h3>

						<div style={{ marginBottom: '16px' }}>
							<strong>Total Records:</strong> {reports.length}
						</div>

						<div className="reports-table">
							<pre
								style={{
									background: '#1f2937',
									color: '#e5e7eb',
									padding: '20px',
									borderRadius: '8px',
									overflow: 'auto',
									maxHeight: '600px',
									fontSize: '12px',
									fontFamily: 'monospace',
								}}
							>
								{JSON.stringify(reports, null, 2)}
							</pre>
						</div>
					</div>
				) : (
					<div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
						<FiPackage style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }} />
						<p>No reports available</p>
						<p style={{ fontSize: '14px', marginTop: '8px' }}>
							Configure your credentials and generate a report to see results here.
						</p>
					</div>
				)}

				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={() => setShowWorkerTokenModal(false)}
					onTokenGenerated={handleWorkerTokenGenerated}
					environmentId={credentials.environmentId}
				/>
			</div>

			<SuperSimpleApiDisplayV8 flowFilter="mfa" />
		</>
	);
};

export default MFAReportingFlowV8;
