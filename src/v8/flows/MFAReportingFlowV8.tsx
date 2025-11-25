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
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { MFAReportingServiceV8, type ReportParams } from '@/v8/services/mfaReportingServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[📊 MFA-REPORTING-FLOW-V8]';
const FLOW_KEY = 'mfa-reporting-v8';

type ReportType = 'user-auth' | 'device-auth' | 'fido2';

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
	const [selectedReport, setSelectedReport] = useState<ReportType>('user-auth');
	const [reports, setReports] = useState<Array<Record<string, unknown>>>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [dateRange, setDateRange] = useState({
		startDate: '',
		endDate: '',
	});
	const [limit, setLimit] = useState(50);

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
				workerTokenServiceV8.clearToken();
				window.dispatchEvent(new Event('workerTokenUpdated'));
				setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
				toastV8.success('Worker token removed');
			}
		} else {
			setShowWorkerTokenModal(true);
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

		setIsLoading(true);
		try {
			const params: ReportParams = {
				environmentId: credentials.environmentId,
				limit,
			};

			if (dateRange.startDate) params.startDate = dateRange.startDate;
			if (dateRange.endDate) params.endDate = dateRange.endDate;

			let data: Array<Record<string, unknown>> = [];

			switch (selectedReport) {
				case 'user-auth':
					data = await MFAReportingServiceV8.getUserAuthenticationReports(params);
					break;
				case 'device-auth':
					data = await MFAReportingServiceV8.getDeviceAuthenticationReports(params);
					break;
				case 'fido2':
					data = await MFAReportingServiceV8.getFIDO2DeviceReports(params);
					break;
			}

			setReports(data);
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

	const getReportTitle = () => {
		switch (selectedReport) {
			case 'user-auth':
				return 'User Authentication Reports';
			case 'device-auth':
				return 'Device Authentication Reports';
			case 'fido2':
				return 'FIDO2 Device Reports';
		}
	};

	return (
		<div className="mfa-reporting-flow-v8">
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
								onChange={(e) => setSelectedReport(e.target.value as ReportType)}
							>
								<option value="user-auth">User Authentication Reports</option>
								<option value="device-auth">Device Authentication Reports</option>
								<option value="fido2">FIDO2 Device Reports</option>
							</select>
						</div>

						<div className="form-group">
							<label htmlFor="report-limit">Limit</label>
							<input
								id="report-limit"
								type="number"
								value={limit}
								onChange={(e) => setLimit(parseInt(e.target.value) || 50)}
								min="1"
								max="1000"
							/>
						</div>
					</div>

					{selectedReport !== 'fido2' && (
						<div className="date-range-section">
							<h3>Date Range (Optional)</h3>
							<div className="credentials-grid">
								<div className="form-group">
									<label htmlFor="start-date">Start Date</label>
									<input
										id="start-date"
										type="datetime-local"
										value={dateRange.startDate}
										onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
									/>
								</div>
								<div className="form-group">
									<label htmlFor="end-date">End Date</label>
									<input
										id="end-date"
										type="datetime-local"
										value={dateRange.endDate}
										onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
									/>
								</div>
							</div>
						</div>
					)}

					<button
						type="button"
						className="btn btn-primary"
						onClick={loadReports}
						disabled={!credentials.environmentId || !tokenStatus.isValid || isLoading}
						style={{ marginTop: '20px' }}
					>
						{isLoading ? '🔄 Loading...' : 'Load Reports'}
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

			<SuperSimpleApiDisplayV8 />
		</div>
	);
};

export default MFAReportingFlowV8;
