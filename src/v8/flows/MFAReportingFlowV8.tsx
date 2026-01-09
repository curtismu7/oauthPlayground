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

type ReportType = 'sms' | 'mfa-enabled' | 'fido2' | 'email' | 'totp';

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
	const needsUsername =
		selectedReport === 'fido2' || selectedReport === 'email' || selectedReport === 'totp';
	const isMfaEnabledReport = selectedReport === 'mfa-enabled';
	
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
				fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MFAReportingFlowV8.tsx:172',message:'User confirmed token removal, calling clearToken',data:{tokenStatusBefore:tokenStatus.isValid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
				// #endregion
				await workerTokenServiceV8.clearToken();
				// #region agent log
				fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MFAReportingFlowV8.tsx:175',message:'clearToken completed, checking status',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
				// #endregion
				window.dispatchEvent(new Event('workerTokenUpdated'));
				const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				// #region agent log
				fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MFAReportingFlowV8.tsx:179',message:'Status checked after clearToken',data:{isValid:newStatus.isValid,status:newStatus.status,message:newStatus.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
				// #endregion
				setTokenStatus(newStatus);
				toastV8.success('Worker token removed');
			}
		} else {
			// Use helper to check silentApiRetrieval before showing modal
			const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MFAReportingFlowV8.tsx:179',message:'Calling handleShowWorkerTokenModal',data:{silentApiRetrieval,showTokenAtEnd},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
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

		// For device-based reports (FIDO2, Email, TOTP), username is required
		if (
			(selectedReport === 'fido2' || selectedReport === 'email' || selectedReport === 'totp') &&
			!username.trim()
		) {
			toastV8.error('Username is required for device-based reports');
			return;
		}

		setIsLoading(true);
		try {
			let data: Array<Record<string, unknown>> = [];

			switch (selectedReport) {
				case 'sms': {
					// Official Reporting API: Create SMS devices report
					const reportResult = await MFAReportingServiceV8.createSMSDevicesReport({
						environmentId: credentials.environmentId,
						filter: '(deviceType eq "SMS")',
						region: credentials.region as 'us' | 'eu' | 'ap' | 'ca' | 'na' | undefined,
						customDomain: credentials.customDomain as string | undefined,
					});

					// Check if report has entries directly or needs to be fetched
					if (reportResult._embedded?.entries) {
						data = reportResult._embedded.entries as Array<Record<string, unknown>>;
					} else if (reportResult.id) {
						// Need to fetch report results
						const reportData = await MFAReportingServiceV8.getReportResults({
							environmentId: credentials.environmentId,
							reportId: reportResult.id as string,
						});
						data = (reportData._embedded?.entries || []) as Array<Record<string, unknown>>;
					}
					break;
				}
				case 'mfa-enabled': {
					// Official Reporting API: Create MFA-enabled devices report (file-based)
					const reportResult = await MFAReportingServiceV8.createMFAEnabledDevicesReport({
						environmentId: credentials.environmentId,
					});

					// Store reportId for polling
					if (reportResult.id) {
						setReportId(reportResult.id as string);
						toastV8.info('Report created. Use "Poll Report Results" button to retrieve results.');
						setReports([]); // Clear previous reports
						return;
					}
					break;
				}
				case 'fido2': {
					// Device filtering: Get all devices filtered by FIDO2 type
					data = await MFAReportingServiceV8.getDevicesByType(
						{
							environmentId: credentials.environmentId,
							username: username.trim(),
						},
						'FIDO2'
					);
					break;
				}
				case 'email': {
					// Device filtering: Get all devices filtered by EMAIL type
					data = await MFAReportingServiceV8.getDevicesByType(
						{
							environmentId: credentials.environmentId,
							username: username.trim(),
						},
						'EMAIL'
					);
					break;
				}
				case 'totp': {
					// Device filtering: Get all devices filtered by TOTP type
					data = await MFAReportingServiceV8.getDevicesByType(
						{
							environmentId: credentials.environmentId,
							username: username.trim(),
						},
						'TOTP'
					);
					break;
				}
			}

			setReports(data);
			setReportId(null); // Clear reportId for non-polling reports
			toastV8.success(`Loaded ${data.length} reports`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load reports`, error);
			toastV8.error(
				`Failed to load reports: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setIsLoading(false);
		}
	};

	const pollReportResults = async () => {
		if (!reportId) {
			toastV8.error('No report ID available. Please create a report first.');
			return;
		}

		setIsPolling(true);
		try {
			// Poll for report results
			const reportData = await MFAReportingServiceV8.pollReportResults(
				{
					environmentId: credentials.environmentId,
					reportId,
				},
				10, // maxAttempts
				2000 // pollInterval (2 seconds)
			);

			// Extract entries from report data
			const entries = (reportData._embedded?.entries || []) as Array<Record<string, unknown>>;
			setReports(entries);
			toastV8.success(`Retrieved ${entries.length} report entries`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to poll report results`, error);
			toastV8.error(
				`Failed to poll report: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setIsPolling(false);
		}
	};

	const exportToJSON = () => {
		const dataStr = JSON.stringify(reports, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `mfa-${selectedReport}-report-${new Date().toISOString()}.json`;
		link.click();
		URL.revokeObjectURL(url);
		toastV8.success('Report exported to JSON');
	};

	const getReportTitle = (): string => {
		switch (selectedReport) {
			case 'sms':
				return 'SMS Devices Report';
			case 'mfa-enabled':
				return 'MFA-Enabled Devices Report';
			case 'fido2':
				return 'FIDO2 Devices Report';
			case 'email':
				return 'Email Devices Report';
			case 'totp':
				return 'TOTP Devices Report';
			default:
				return 'MFA Report';
		}
	};

	return (
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
								<option value="sms">SMS Devices Report (Official Reporting API)</option>
								<option value="mfa-enabled">
									MFA-Enabled Devices Report (Official Reporting API)
								</option>
								<option value="fido2">FIDO2 Devices Report (Device Filtering)</option>
								<option value="email">Email Devices Report (Device Filtering)</option>
								<option value="totp">TOTP Devices Report (Device Filtering)</option>
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

					{isMfaEnabledReport && reportId && (
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
								}}
							>
								{isPolling ? '🔄 Polling...' : '🔄 Poll Report Results'}
							</button>
						</div>
					)}

					<button
						type="button"
						className="btn btn-primary"
						onClick={loadReports}
						disabled={
							!credentials.environmentId ||
							!tokenStatus.isValid ||
							isLoading ||
							(needsUsername && !username.trim())
						}
						style={{ marginTop: '20px' }}
					>
						{isLoading
							? '🔄 Loading...'
							: isMfaEnabledReport
								? '📊 Create Report'
								: '📊 Load Reports'}
					</button>
				</div>

				{/* Reports Section */}
				{reports.length > 0 && (
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
							<button
								onClick={exportToJSON}
								style={{
									padding: '10px 20px',
									background: '#8b5cf6',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '14px',
									fontWeight: '600',
									cursor: 'pointer',
								}}
							>
								📥 Export JSON
							</button>
						</div>

						<div className="report-stats">
							<div className="stat-card">
								<span className="stat-value">{reports.length}</span>
								<span className="stat-label">Total Records</span>
							</div>
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
				)}
			</div>

			<WorkerTokenModalV8
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
				onTokenGenerated={handleWorkerTokenGenerated}
				environmentId={credentials.environmentId}
			/>

			<style>{`
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
	);
};

export default MFAReportingFlowV8;
