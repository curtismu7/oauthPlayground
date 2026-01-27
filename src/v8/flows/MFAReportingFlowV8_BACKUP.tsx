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

import React, { useEffect, useState } from 'react';
import { FiPackage } from 'react-icons/fi';
import { ButtonSpinner, LoadingOverlay } from '@/components/ui';
import { usePageScroll } from '@/hooks/usePageScroll';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { useApiDisplayPadding } from '@/v8/hooks/useApiDisplayPadding';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { MFAReportingServiceV8 } from '@/v8/services/mfaReportingServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[📊 MFA-REPORTING-FLOW-V8]';
const FLOW_KEY = 'mfa-reporting-v8';

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
		label: 'MFA-Enabled Users',
		description: 'Users with MFA enabled',
		filter: '(mfaEnabled eq "true")',
		fields: [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'givenName' },
			{ name: 'familyName' },
			{ name: 'mfaEnabled' },
			{ name: 'userCreatedAt' },
		],
		isAsync: true,
	},
	'mfa-disabled': {
		type: 'mfa-disabled',
		label: 'MFA-Disabled Users',
		description: 'Users with MFA disabled',
		filter: '(mfaEnabled eq "false")',
		fields: [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'givenName' },
			{ name: 'familyName' },
			{ name: 'mfaEnabled' },
			{ name: 'userCreatedAt' },
		],
		isAsync: true,
	},
	'all-devices': {
		type: 'all-devices',
		label: 'All MFA Devices',
		description: 'All MFA devices regardless of type',
		fields: [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'deviceId' },
			{ name: 'deviceType' },
			{ name: 'deviceStatus' },
			{ name: 'deviceNickname' },
			{ name: 'phone' },
			{ name: 'email' },
			{ name: 'deviceCreatedAt' },
		],
		isAsync: true,
	},
	'active-devices': {
		type: 'active-devices',
		label: 'Active Devices',
		description: 'All active MFA devices',
		filter: '(deviceStatus eq "ACTIVE")',
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
	'blocked-devices': {
		type: 'blocked-devices',
		label: 'Blocked Devices',
		description: 'All blocked MFA devices',
		filter: '(deviceBlocked eq "true")',
		fields: [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'deviceId' },
			{ name: 'deviceType' },
			{ name: 'deviceStatus' },
			{ name: 'deviceBlocked' },
			{ name: 'blockedAt' },
			{ name: 'deviceNickname' },
		],
	},
	'compromised-devices': {
		type: 'compromised-devices',
		label: 'Compromised Devices',
		description: 'Devices with integrity issues',
		filter: '(deviceIntegrityStateCompromised eq "true")',
		fields: [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'deviceId' },
			{ name: 'deviceType' },
			{ name: 'deviceStatus' },
			{ name: 'deviceIntegrityStateCompromised' },
			{ name: 'deviceIntegrityStateReason' },
			{ name: 'deviceIntegrityStateTimestamp' },
			{ name: 'deviceIntegrityStateAdvice' },
		],
	},
	'user-authentications': {
		type: 'user-authentications',
		label: 'User Authentications',
		description: 'User MFA authentication attempts',
		fields: [
			{ name: 'userId' },
			{ name: 'username' },
			{ name: 'deviceId' },
			{ name: 'deviceType' },
			{ name: 'authenticationStatus' },
			{ name: 'authenticationCreatedAt' },
			{ name: 'lastDeviceTrxTime' },
		],
		isAsync: true,
	},
	'device-authentications': {
		type: 'device-authentications',
		label: 'Device Authentications',
		description: 'MFA device authentication attempts',
		fields: [
			{ name: 'deviceId' },
			{ name: 'deviceType' },
			{ name: 'deviceStatus' },
			{ name: 'authenticationStatus' },
			{ name: 'authenticationCreatedAt' },
			{ name: 'lastDeviceTrxTime' },
		],
		isAsync: true,
	},
};

interface Credentials {
	environmentId: string;
	[key: string]: unknown;
}

export const MFAReportingFlowV8: React.FC = () => {
	console.log(`${MODULE_TAG} Initializing reporting flow`);

	// Scroll to top on page load
	usePageScroll({ pageName: 'MFA Reporting V8', force: true });

	const [credentials, setCredentials] = useState<Credentials>(() => {
		const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
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

		console.log(`${MODULE_TAG} Loading credentials`, {
			flowSpecificEnvId: stored.environmentId,
			globalEnvId,
			usingEnvId: environmentId,
		});

		return {
			environmentId,
		};
	});

	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [tokenStatus, setTokenStatus] = useState(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
	);

	// Worker Token Settings - Load from config service
	const [silentApiRetrieval, setSilentApiRetrieval] = useState(() => {
		try {
			return MFAConfigurationServiceV8.loadConfiguration().workerToken.silentApiRetrieval || false;
		} catch {
			return false;
		}
	});
	const [showTokenAtEnd, setShowTokenAtEnd] = useState(() => {
		try {
			return MFAConfigurationServiceV8.loadConfiguration().workerToken.showTokenAtEnd || true;
		} catch {
			return true;
		}
	});

	// Listen for config updates
	useEffect(() => {
		const handleConfigUpdate = (event: CustomEvent) => {
			if (event.detail?.workerToken) {
				setSilentApiRetrieval(event.detail.workerToken.silentApiRetrieval || false);
				setShowTokenAtEnd(event.detail.workerToken.showTokenAtEnd !== false);
			}
		};
		window.addEventListener('mfaConfigurationUpdated', handleConfigUpdate as EventListener);
		return () => {
			window.removeEventListener('mfaConfigurationUpdated', handleConfigUpdate as EventListener);
		};
	}, []);

	const [selectedReport, setSelectedReport] = useState<ReportType>('sms');
	const [username, setUsername] = useState<string>(''); // For device-based reports
	const [reports, setReports] = useState<Array<Record<string, unknown>>>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [reportId, setReportId] = useState<string | null>(null); // For MFA-enabled devices report polling
	const [isPolling, setIsPolling] = useState(false);

	// Helper variables
	const needsUsername = [
		'sms', 'email', 'voice', 'totp', 'fido2', 'whatsapp'
	].includes(selectedReport);
	const isAsyncReport = REPORT_CONFIGS[selectedReport]?.isAsync;
	
	// Get API display padding
	const { paddingBottom } = useApiDisplayPadding();

	// Check token status periodically
	useEffect(() => {
		const checkStatus = () => {
			const status = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
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

	// Clear API calls on mount
	useEffect(() => {
		apiCallTrackerService.clearApiCalls();
	}, []);

	// Save credentials when they change
	useEffect(() => {
		CredentialsServiceV8.saveCredentials(FLOW_KEY, credentials);

		// Save environment ID globally so it's shared across all flows
		if (credentials.environmentId) {
			EnvironmentIdServiceV8.saveEnvironmentId(credentials.environmentId);
			console.log(`${MODULE_TAG} Environment ID saved globally`, {
				environmentId: credentials.environmentId,
			});
		}
	}, [credentials]);

	const handleManageWorkerToken = async () => {
		if (tokenStatus.isValid) {
			const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');
			const confirmed = await uiNotificationServiceV8.confirm({
				title: 'Remove Worker Token',
				message: 'Worker token is currently stored.\n\nDo you want to remove it?',
				confirmText: 'Remove',
				cancelText: 'Cancel',
				severity: 'warning',
			});
			if (confirmed) {
				// #region agent log
				// #endregion
				await workerTokenServiceV8.clearToken();
				// #region agent log
				// #endregion
				window.dispatchEvent(new Event('workerTokenUpdated'));
				const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				// #region agent log
				// #endregion
				setTokenStatus(newStatus);
				toastV8.success('Worker token removed');
			}
		} else {
			// Use helper to check silentApiRetrieval before showing modal
			const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
			// #region agent log
			// #endregion
			await handleShowWorkerTokenModal(setShowWorkerTokenModal, setTokenStatus, silentApiRetrieval, showTokenAtEnd);
		}
	};

	const handleWorkerTokenGenerated = () => {
		window.dispatchEvent(new Event('workerTokenUpdated'));
		setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
		toastV8.success('Worker token generated and saved!');
	};

	const loadReports = async () => {
		if (!credentials.environmentId?.trim()) {
			toastV8.error('Environment ID is required');
			return;
		}
		if (!tokenStatus.isValid) {
			toastV8.error('Worker token is required');
			return;
		}

		// For user-based reports, username is required
		if (
			(selectedReport === 'fido2' || selectedReport === 'email' || selectedReport === 'totp' ||
			selectedReport === 'sms' || selectedReport === 'voice' || selectedReport === 'whatsapp') &&
			!username.trim()
		) {
			toastV8.error('Username is required for device-based reports');
			return;
		}

		setIsLoading(true);
		try {
			const reportConfig = REPORT_CONFIGS[selectedReport];
			let data: Array<Record<string, unknown>> = [];

			// Build filter with username if required
			let filter = reportConfig.filter;
			if (username.trim() && reportConfig.filter) {
				filter = `(${reportConfig.filter}) and (username eq "${username.trim()}")`;
			} else if (username.trim()) {
				filter = `(username eq "${username.trim()}")`;
			}

			console.log(`${MODULE_TAG} Loading ${reportConfig.label} report`, {
				selectedReport,
				filter,
				isAsync: reportConfig.isAsync,
			});

			if (reportConfig.isAsync) {
				// Create async report for large datasets
				const asyncReport = await MFAReportingServiceV8.createAsyncDataExploration({
					environmentId: credentials.environmentId,
					fields: reportConfig.fields,
					filter: filter,
					region: credentials.region as 'us' | 'eu' | 'ap' | 'ca' | 'na' | undefined,
					customDomain: credentials.customDomain as string | undefined,
				});

				if (asyncReport.id) {
					// Start polling for results
					setReportId(asyncReport.id);
					setIsPolling(true);
					toastV8.info('Report generation started. Polling for results...');

					// Poll for completion
					const completedReport = await MFAReportingServiceV8.pollAsyncDataExploration(
						{
							environmentId: credentials.environmentId,
							dataExplorationId: asyncReport.id,
							region: credentials.region as 'us' | 'eu' | 'ap' | 'ca' | 'na' | undefined,
							customDomain: credentials.customDomain as string | undefined,
						},
						30, // 30 attempts
						2000 // 2 second intervals
					);

					// Get download links if available
					if (completedReport._links?.csv || completedReport._links?.json) {
						data = [
							{
								reportId: completedReport.id,
								status: completedReport.status,
								csvDownload: completedReport._links.csv?.href,
								jsonDownload: completedReport._links.json?.href,
								password: completedReport.password,
								createdAt: completedReport.createdAt,
								updatedAt: completedReport.updatedAt,
							},
						];
					} else if (completedReport._embedded?.entries) {
						data = completedReport._embedded.entries;
					}

					setIsPolling(false);
					toastV8.success('Report generated successfully!');
				}
			} else {
				// Create synchronous report for small datasets
				const report = await MFAReportingServiceV8.createDataExploration({
					environmentId: credentials.environmentId,
					fields: reportConfig.fields,
					filter: filter,
					region: credentials.region as 'us' | 'eu' | 'ap' | 'ca' | 'na' | undefined,
					customDomain: credentials.customDomain as string | undefined,
				});

				if (report._embedded?.entries) {
					data = report._embedded.entries;
				} else if (report.id) {
					// Need to fetch entries
					const entries = await MFAReportingServiceV8.getDataExplorationEntries({
						environmentId: credentials.environmentId,
						dataExplorationId: report.id,
						region: credentials.region as 'us' | 'eu' | 'ap' | 'ca' | 'na' | undefined,
						customDomain: credentials.customDomain as string | undefined,
					});
					data = entries._embedded?.entries || [];
				}

				toastV8.success(`${reportConfig.label} report loaded successfully!`);
			}

			setReports(data);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load reports';
			console.error(`${MODULE_TAG} Failed to load reports:`, error);
			toastV8.error(`Failed to load reports: ${errorMessage}`);
		} finally {
			setIsLoading(false);
		}
	};

	// Poll report results (for async reports)
	const pollReportResults = async () => {
		if (!reportId || !credentials.environmentId) return;

		try {
			const status = await MFAReportingServiceV8.getDataExplorationStatus({
				environmentId: credentials.environmentId,
				dataExplorationId: reportId,
				region: credentials.region as 'us' | 'eu' | 'ap' | 'ca' | 'na' | undefined,
				customDomain: credentials.customDomain as string | undefined,
			});

			if (status.status === 'SUCCESS') {
				const data = [
					{
						reportId: status.id,
						status: status.status,
						csvDownload: status._links?.csv?.href,
						jsonDownload: status._links?.json?.href,
						password: status.password,
						createdAt: status.createdAt,
						updatedAt: status.updatedAt,
					},
				];
				setReports(data);
				setIsPolling(false);
				toastV8.success('Report completed successfully!');
			} else if (status.status === 'FAILED') {
				setIsPolling(false);
				toastV8.error('Report generation failed');
			}
			// Continue polling if IN_PROGRESS
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to poll report results:`, error);
			toastV8.error('Failed to get report status');
		}
	};

	// Export report data to JSON
	const exportToJSON = () => {
		if (reports.length === 0) {
			toastV8.error('No data to export');
			return;
		}

		const dataStr = JSON.stringify(reports, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `mfa-report-${selectedReport}-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		toastV8.success('Report exported successfully!');
	};

	// Download report file (for async reports)
	const downloadReportFile = (format: 'csv' | 'json') => {
		if (reports.length === 0 || !reports[0].reportId) {
			toastV8.error('No report file available for download');
			return;
		}

		const report = reports[0] as any;
		const downloadUrl = format === 'csv' ? report.csvDownload : report.jsonDownload;
		
		if (!downloadUrl) {
			toastV8.error(`${format.toUpperCase()} download link not available`);
			return;
		}

		// Create download link
		const link = document.createElement('a');
		link.href = downloadUrl;
		link.download = `mfa-report-${selectedReport}-${new Date().toISOString().split('T')[0]}.${format}`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		toastV8.success(`${format.toUpperCase()} report downloaded successfully!`);
	};

	// Get report title
	const getReportTitle = () => {
		return REPORT_CONFIGS[selectedReport]?.label || 'MFA Report';
	};

	return (
		<>
			<div
				className="mfa-reporting-flow-v8"
				style={{
					paddingBottom: paddingBottom !== '0' ? paddingBottom : '0',
					transition: 'padding-bottom 0.3s ease',
					minHeight: '100vh',
				}}
			>
			<MFAHeaderV8
				title="MFA Reporting"
				description="View MFA usage reports and analytics"
				versionTag="V8"
				currentPage="reporting"
				showRestartFlow={false}
				showBackToMain={true}
				headerColor="purple"
			/>

			<div className="flow-container">
				{/* Setup Section */}
				<div className="setup-section">
					<h2>Configuration</h2>

					{/* Worker Token Status */}
					<div style={{ marginBottom: '20px' }}>
						<div
							style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}
						>
							<button
								type="button"
								onClick={handleManageWorkerToken}
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
								<span>{tokenStatus.isValid ? 'Manage Token' : 'Add Token'}</span>
							</button>

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
						
						{/* Worker Token Settings Checkboxes */}
						<div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
							<label
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '12px',
									cursor: 'pointer',
									userSelect: 'none',
									padding: '8px',
									borderRadius: '6px',
									transition: 'background-color 0.2s ease',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = '#f3f4f6';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = 'transparent';
								}}
							>
								<input
									type="checkbox"
									checked={silentApiRetrieval}
									onChange={async (e) => {
										const newValue = e.target.checked;
										setSilentApiRetrieval(newValue);
										// Update config service immediately (no cache)
										const config = MFAConfigurationServiceV8.loadConfiguration();
										config.workerToken.silentApiRetrieval = newValue;
										MFAConfigurationServiceV8.saveConfiguration(config);
										// Dispatch event to notify other components
										window.dispatchEvent(new CustomEvent('mfaConfigurationUpdated', { detail: { workerToken: config.workerToken } }));
										toastV8.info(`Silent API Token Retrieval set to: ${newValue}`);
										
										// If enabling silent retrieval and token is missing/expired, attempt silent retrieval now
										if (newValue) {
											const currentStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
											if (!currentStatus.isValid) {
												console.log('[MFA-REPORTING-FLOW-V8] Silent API retrieval enabled, attempting to fetch token now...');
												const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
												await handleShowWorkerTokenModal(
													setShowWorkerTokenModal,
													setTokenStatus,
													newValue,  // Use new value
													showTokenAtEnd,
													false      // Not forced - respect silent setting
												);
											}
										}
									}}
									style={{
										width: '20px',
										height: '20px',
										cursor: 'pointer',
										accentColor: '#6366f1',
										flexShrink: 0,
									}}
								/>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
									<span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
										Silent API Token Retrieval
									</span>
									<span style={{ fontSize: '12px', color: '#6b7280' }}>
										Automatically fetch worker token in the background without showing modals
									</span>
								</div>
							</label>

							<label
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '12px',
									cursor: 'pointer',
									userSelect: 'none',
									padding: '8px',
									borderRadius: '6px',
									transition: 'background-color 0.2s ease',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = '#f3f4f6';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = 'transparent';
								}}
							>
								<input
									type="checkbox"
									checked={showTokenAtEnd}
									onChange={async (e) => {
										const newValue = e.target.checked;
										setShowTokenAtEnd(newValue);
										// Update config service immediately (no cache)
										const config = MFAConfigurationServiceV8.loadConfiguration();
										config.workerToken.showTokenAtEnd = newValue;
										MFAConfigurationServiceV8.saveConfiguration(config);
										// Dispatch event to notify other components
										window.dispatchEvent(new CustomEvent('mfaConfigurationUpdated', { detail: { workerToken: config.workerToken } }));
										toastV8.info(`Show Token After Generation set to: ${newValue}`);
									}}
									style={{
										width: '20px',
										height: '20px',
										cursor: 'pointer',
										accentColor: '#6366f1',
										flexShrink: 0,
									}}
								/>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
									<span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
										Show Token After Generation
									</span>
									<span style={{ fontSize: '12px', color: '#6b7280' }}>
										Display the generated worker token in a modal after successful retrieval
									</span>
								</div>
							</label>
						</div>
					</div>

					<div className="credentials-grid">
						<div className="form-group">
							<label htmlFor="report-env-id">
								Environment ID <span className="required">*</span>
							</label>
							<input
								id="report-env-id"
								type="text"
								value={credentials.environmentId}
								onChange={(e) => setCredentials({ ...credentials, environmentId: e.target.value })}
								placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
							/>
						</div>

						<div className="form-group">
							<label htmlFor="report-type">
								Report Type <span className="required">*</span>
							</label>
							<select
								id="report-type"
								value={selectedReport}
								onChange={(e) => {
									setSelectedReport(e.target.value as ReportType);
									setReportId(null); // Clear reportId when changing report type
									setReports([]); // Clear reports
								}}
							>
								<optgroup label="Device Reports">
									<option value="sms">SMS Devices</option>
									<option value="email">Email Devices</option>
									<option value="voice">Voice Devices</option>
									<option value="totp">TOTP Devices</option>
									<option value="fido2">FIDO2/WebAuthn Devices</option>
									<option value="whatsapp">WhatsApp Devices</option>
								</optgroup>
								<optgroup label="User Reports">
									<option value="mfa-enabled">MFA-Enabled Users</option>
									<option value="mfa-disabled">MFA-Disabled Users</option>
								</optgroup>
								<optgroup label="Comprehensive Reports">
									<option value="all-devices">All MFA Devices</option>
									<option value="active-devices">Active Devices</option>
									<option value="blocked-devices">Blocked Devices</option>
									<option value="compromised-devices">Compromised Devices</option>
								</optgroup>
								<optgroup label="Authentication Reports">
									<option value="user-authentications">User Authentications</option>
									<option value="device-authentications">Device Authentications</option>
								</optgroup>
							</select>
						</div>

						{needsUsername && (
							<div className="form-group">
								<label htmlFor="report-username">
									Username <span className="required">*</span>
								</label>
								<input
									id="report-username"
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									placeholder="Enter username"
								/>
								<small style={{ color: '#6b7280', fontSize: '11px', marginTop: '4px' }}>
									Required for device-based reports
								</small>
							</div>
						)}
					</div>

					{isAsyncReport && reportId && (
						<div
							style={{
								marginTop: '16px',
								padding: '12px',
								background: '#f3f4f6',
								borderRadius: '6px',
							}}
						>
							<p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>
								<strong>Report ID:</strong> {reportId}
							</p>
							<button
								type="button"
								onClick={pollReportResults}
								disabled={isPolling}
								style={{
									padding: '8px 16px',
									background: '#8b5cf6',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '14px',
									fontWeight: '500',
									cursor: isPolling ? 'not-allowed' : 'pointer',
									opacity: isPolling ? 0.6 : 1,
									marginRight: '8px',
								}}
							>
								{isPolling ? '🔄 Polling...' : '🔄 Poll Report Results'}
							</button>
						</div>
					)}

					<ButtonSpinner
						loading={isLoading}
						onClick={loadReports}
						disabled={
							!credentials.environmentId ||
							!tokenStatus.isValid ||
							(needsUsername && !username.trim())
						}
						spinnerSize={16}
						spinnerPosition="center"
						loadingText="Loading..."
						className="btn btn-primary"
						style={{ marginTop: '20px' }}
					>
						{isLoading
							? ''
							: isAsyncReport
								? '📊 Create Report'
								: '📊 Load Reports'}
					</ButtonSpinner>
				</div>

				{/* Reports Section */}
				{isLoading ? (
					<div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
						<SmallSpinner />
						<p>Loading reports...</p>
					</div>
				) : reports.length > 0 ? (
					<div className="reports-section">
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: '20px',
							}}
						>
							<h2>{getReportTitle()}</h2>
							<div style={{ display: 'flex', gap: '8px' }}>
								{reports[0]?.reportId ? (
									<>
										{reports[0]?.csvDownload && (
											<button
												onClick={() => downloadReportFile('csv')}
												style={{
													padding: '10px 20px',
													background: '#10b981',
													color: 'white',
													border: 'none',
													borderRadius: '6px',
													fontSize: '14px',
													fontWeight: '500',
													cursor: 'pointer',
												}}
											>
												📥 Download CSV
											</button>
										)}
										{reports[0]?.jsonDownload && (
											<button
												onClick={() => downloadReportFile('json')}
												style={{
													padding: '10px 20px',
													background: '#3b82f6',
													color: 'white',
													border: 'none',
													borderRadius: '6px',
													fontSize: '14px',
													fontWeight: '500',
													cursor: 'pointer',
												}}
											>
												📥 Download JSON
											</button>
										)}
										{reports[0]?.password && (
											<div
												style={{
													padding: '8px 12px',
													background: '#fef3c7',
													border: '1px solid #f59e0b',
													borderRadius: '4px',
													fontSize: '12px',
													color: '#92400e',
												}}
											>
												🔐 Zip Password: {reports[0].password}
											</div>
										)}
									</>
								) : (
									<button
										onClick={exportToJSON}
										style={{
											padding: '10px 20px',
											background: '#8b5cf6',
											color: 'white',
											border: 'none',
											borderRadius: '6px',
											fontSize: '14px',
											fontWeight: '500',
											cursor: 'pointer',
										}}
									>
										📥 Export JSON
									</button>
								)}
							</div>
						</div>

						<div className="report-stats">
							<div className="stat-card">
								<span className="stat-value">{reports.length}</span>
								<span className="stat-label">Total Records</span>
							</div>
							{reports[0]?.reportId && (
								<div className="stat-card">
									<span className="stat-value">📁</span>
									<span className="stat-label">File Report</span>
								</div>
							)}
						</div>

						{reports[0]?.reportId ? (
							<div
								style={{
									padding: '20px',
									background: '#f8fafc',
									border: '1px solid #e2e8f0',
									borderRadius: '8px',
									marginBottom: '20px',
								}}
							>
								<h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Report Information</h3>
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
									<div>
										<strong>Report ID:</strong> {reports[0].reportId}
									</div>
									<div>
										<strong>Status:</strong> {reports[0].status}
									</div>
									<div>
										<strong>Created:</strong> {new Date(reports[0].createdAt).toLocaleString()}
									</div>
									{reports[0].updatedAt && (
										<div>
											<strong>Updated:</strong> {new Date(reports[0].updatedAt).toLocaleString()}
										</div>
									)}
								</div>
							</div>
						) : (
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
					</div>
				)}

			<WorkerTokenModalV8
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
				onTokenGenerated={handleWorkerTokenGenerated}
				environmentId={credentials.environmentId}
			/>

			<style type="text/css">{`
				.mfa-reporting-flow-v8 {
					max-width: 1200px;
					margin: 0 auto;
					background: #f8f9fa;
					min-height: 100vh;
					overflow-y: auto;
					padding-bottom: 100px;
				}

				.flow-container {
					padding: 20px;
				}

				.setup-section, .reports-section {
					background: white;
					border: 1px solid #ddd;
					border-radius: 8px;
					padding: 20px;
					margin-bottom: 20px;
				}

				.setup-section h2, .reports-section h2 {
					font-size: 20px;
					font-weight: 600;
					margin: 0 0 20px 0;
					color: #1f2937;
				}

				.date-range-section {
					margin-top: 20px;
					padding-top: 20px;
					border-top: 1px solid #e5e7eb;
				}

				.date-range-section h3 {
					font-size: 16px;
					font-weight: 600;
					margin: 0 0 16px 0;
					color: #1f2937;
				}

				.credentials-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
					gap: 16px;
				}

				.form-group {
					display: flex;
					flex-direction: column;
					gap: 6px;
				}

				.form-group label {
					font-size: 13px;
					font-weight: 500;
					color: #374151;
				}

				.required {
					color: #ef4444;
				}

				.form-group input, .form-group select {
					padding: 10px 12px;
					border: 1px solid #d1d5db;
					border-radius: 6px;
					fontSize: 14px;
					color: #1f2937;
					background: white;
				}

				.form-group input:focus, .form-group select:focus {
					outline: none;
					border-color: #8b5cf6;
					box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
				}

				.btn {
					padding: 12px 24px;
					border: none;
					border-radius: 6px;
					font-size: 14px;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;
				}

				.btn-primary {
					background: #8b5cf6;
					color: white;
				}

				.btn-primary:hover {
					background: #7c3aed;
				}

				.btn-primary:disabled {
					background: #d1d5db;
					cursor: not-allowed;
				}

				.report-stats {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
					gap: 16px;
					margin-bottom: 20px;
				}

				.stat-card {
					background: #f9fafb;
					border: 1px solid #e5e7eb;
					border-radius: 8px;
					padding: 20px;
					text-align: center;
				}

				.stat-value {
					display: block;
					font-size: 32px;
					font-weight: 700;
					color: #8b5cf6;
					margin-bottom: 8px;
				}

				.stat-label {
					display: block;
					font-size: 13px;
					color: #6b7280;
					font-weight: 500;
				}
			`}</style>

			<SuperSimpleApiDisplayV8 flowFilter="mfa" />
			</div>
		</>
	);
};

export default MFAReportingFlowV8;
