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
import { usePageScroll } from '@/hooks/usePageScroll';
import { useProductionSpinner } from '../../hooks/useProductionSpinner';
import { CommonSpinner } from '../../components/common/CommonSpinner';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
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
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[📊 MFA-REPORTING-FLOW-V8]';
const FLOW_KEY = 'mfa-reporting-v8';

interface Credentials {
	environmentId: string;
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
			username: stored.username || '',
		};
	});

	// Save environment ID globally when it changes
	useEffect(() => {
		if (credentials.environmentId) {
			EnvironmentIdServiceV8.saveEnvironmentId(credentials.environmentId);
			console.log(`${MODULE_TAG} Environment ID saved globally`, {
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
	const [username, setUsername] = useState('');
	const [region, setRegion] = useState<'us' | 'eu' | 'ap' | 'ca' | 'na'>('us');
	const [customDomain, setCustomDomain] = useState('');

	// Check if current report requires username
	const needsUsername = REPORT_CONFIGS[selectedReport]?.requiresUsername || false;
	const isDeviceReport = ['sms', 'email', 'voice', 'totp', 'fido2', 'whatsapp'].includes(
		selectedReport
	);
	const isAsyncReport = REPORT_CONFIGS[selectedReport]?.isAsync;

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
		CredentialsServiceV8.saveCredentials(FLOW_KEY, credentials, {
			flowKey: FLOW_KEY,
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});
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
				toastV8.success('Worker token removed');
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
		if (needsUsername && !username.trim()) {
			toastV8.error('Username is required for this report type');
			return;
		}

		return await reportingSpinner.withSpinner(async () => {
			setIsLoading(true);
			setReports([]);
			setError(null);

			try {
				const config = REPORT_CONFIGS[selectedReport];
				let result: unknown[] = [];
					result = await MFAReportingServiceV8.getUserAuthenticationReports({
						environmentId: credentials.environmentId,
						username: username.trim(),
						region,
						customDomain,
					});
				} else if (selectedReport === 'device-authentications') {
					result = await MFAReportingServiceV8.getDeviceAuthenticationReports({
						environmentId: credentials.environmentId,
						region,
						customDomain,
					});
				}
			} else if (isDeviceReport) {
				// Handle device reports (SMS, Email, Voice, TOTP, FIDO2, WhatsApp)
				const reportResult = await MFAReportingServiceV8.createMFADevicesReport({
					environmentId: credentials.environmentId,
					filter: config.filter || undefined,
					fields: config.fields || [],
					region,
					customDomain,
					deviceType: selectedReport.toUpperCase(), // Convert to device type expected by API
				});
				// Extract entries from the report result
				result = (reportResult as any)._embedded?.entries || [];
			} else {
				// Handle other reports (MFA enabled/disabled users)
				if (selectedReport === 'mfa-enabled') {
					const reportResult = await MFAReportingServiceV8.createMFAEnabledDevicesReport({
						environmentId: credentials.environmentId,
						filter: config.filter || undefined,
						fields: config.fields || [],
						region,
						customDomain,
						mfaEnabled: true,
					});
					// Extract entries from the report result
					result = (reportResult as any)._embedded?.entries || [];
				} else if (selectedReport === 'mfa-disabled') {
					const reportResult = await MFAReportingServiceV8.createMFAEnabledDevicesReport({
						environmentId: credentials.environmentId,
						filter: config.filter || undefined,
						fields: config.fields || [],
						region,
						customDomain,
						mfaEnabled: false,
					});
					// Extract entries from the report result
					result = (reportResult as any)._embedded?.entries || [];
				}
			}

			setReports(result);
			toastV8.success(`Loaded ${result.length} report records`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load reports`, error);
			toastV8.error('Failed to load reports. Please check your credentials and try again.');
		} finally {
			setIsLoading(false);
		}
	}, 'Loading MFA reports...');
	}, [reportingSpinner]
	);

	// Get report title
	const getReportTitle = () => {
		return REPORT_CONFIGS[selectedReport]?.label || 'MFA Report';
	};

	return (
		<>
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
					icon={<FiPackage />}
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
								>
									Username <span style={{ color: '#dc2626' }}>*</span>
								</label>
								<input
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
							>
								Region
							</label>
							<select
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
							>
								Custom Domain (Optional)
							</label>
							<input
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
							>
								Report Type
							</label>
							<select
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
								onClick={loadReports}
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
