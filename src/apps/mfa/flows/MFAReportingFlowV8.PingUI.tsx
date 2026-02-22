/**
 * @file MFAReportingFlowV8.PingUI.tsx
 * @module apps/mfa/flows
 * @description MFA Reporting Flow - View MFA usage reports and analytics - Ping UI migrated
 * @version 8.0.0-PingUI
 * @since 2026-02-21
 *
 * Ping UI migration following pingui2.md standards:
 * - Added .end-user-nano namespace wrapper
 * - Replaced React Icons with MDI CSS icons
 * - Applied Ping UI CSS variables and transitions
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions
 *
 * Features:
 * - User authentication reports
 * - Device authentication reports
 * - FIDO2 device reports
 * - Date range filtering
 * - Export capabilities
 */

import React, { useEffect, useState } from 'react';
import { usePageScroll } from '@/hooks/usePageScroll';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { useApiDisplayPadding } from '@/v8/hooks/useApiDisplayPadding';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { MFAReportingServiceV8 } from '@/v8/services/mfaReportingServiceV8';

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 16, ariaLabel, ariaHidden, className = '', style }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<span
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			{...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
			{...(ariaHidden ? { 'aria-hidden': 'true' } : {})}
			role="img"
		></span>
	);
};

// MDI Icon mapping function
const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiPackage: 'mdi-package',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

interface MFAReportData {
	userReports: Array<{
		userId: string;
		username: string;
		email: string;
		lastAuthentication: string;
		authMethod: string;
		deviceCount: number;
		successRate: number;
	}>;
	deviceReports: Array<{
		deviceId: string;
		deviceName: string;
		deviceType: string;
		status: string;
		lastUsed: string;
		usageCount: number;
	}>;
	fido2Reports: Array<{
		deviceId: string;
		deviceName: string;
		credentialId: string;
		createdAt: string;
		lastUsed: string;
		signatureCount: number;
	}>;
	summary: {
		totalUsers: number;
		totalDevices: number;
		totalFIDO2Keys: number;
		activeUsers: number;
		activeDevices: number;
		reportPeriod: string;
	};
}

const MFAReportingFlowV8PingUI: React.FC = () => {
	const [reportData, setReportData] = useState<MFAReportData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [dateRange, setDateRange] = useState({
		startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		endDate: new Date().toISOString().split('T')[0],
	});
	const [selectedReport, setSelectedReport] = useState<'users' | 'devices' | 'fido2' | 'summary'>(
		'summary'
	);
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	const apiDisplayPadding = useApiDisplayPadding();
	const { scrollToTop } = usePageScroll();

	// Services
	const _mfaReportingService = new MFAReportingServiceV8();
	const credentialsService = new CredentialsServiceV8();
	const environmentIdService = new EnvironmentIdServiceV8();
	const mfaConfigService = new MFAConfigurationServiceV8();

	// Load report data
	useEffect(() => {
		loadReportData();
	}, [loadReportData]);

	const loadReportData = async () => {
		try {
			setIsLoading(true);
			setError(null);

			// Get environment configuration
			const _environmentId = environmentIdService.getEnvironmentId();
			const _credentials = credentialsService.getCredentials();
			const _mfaConfig = mfaConfigService.getConfiguration();

			// Generate mock report data (in real implementation, this would call the reporting API)
			const mockReportData: MFAReportData = {
				userReports: [
					{
						userId: 'user1',
						username: 'john.doe',
						email: 'john.doe@example.com',
						lastAuthentication: '2024-11-19T10:30:00Z',
						authMethod: 'FIDO2',
						deviceCount: 2,
						successRate: 98.5,
					},
					{
						userId: 'user2',
						username: 'jane.smith',
						email: 'jane.smith@example.com',
						lastAuthentication: '2024-11-19T09:15:00Z',
						authMethod: 'Mobile Push',
						deviceCount: 1,
						successRate: 95.2,
					},
				],
				deviceReports: [
					{
						deviceId: 'device1',
						deviceName: 'iPhone 14 Pro',
						deviceType: 'mobile',
						status: 'active',
						lastUsed: '2024-11-19T10:30:00Z',
						usageCount: 145,
					},
					{
						deviceId: 'device2',
						deviceName: 'YubiKey 5',
						deviceType: 'hardware',
						status: 'active',
						lastUsed: '2024-11-18T16:45:00Z',
						usageCount: 89,
					},
				],
				fido2Reports: [
					{
						deviceId: 'fido2_1',
						deviceName: 'Security Key',
						credentialId: 'cred_123456789',
						createdAt: '2024-10-15T08:00:00Z',
						lastUsed: '2024-11-18T16:45:00Z',
						signatureCount: 89,
					},
				],
				summary: {
					totalUsers: 2,
					totalDevices: 2,
					totalFIDO2Keys: 1,
					activeUsers: 2,
					activeDevices: 2,
					reportPeriod: `${dateRange.startDate} to ${dateRange.endDate}`,
				},
			};

			setReportData(mockReportData);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load report data';
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleExportReport = async (format: 'csv' | 'json' | 'pdf') => {
		if (!reportData) return;

		try {
			// In real implementation, this would call the export API
			const exportData = JSON.stringify(reportData, null, 2);
			const blob = new Blob([exportData], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `mfa-report-${dateRange.startDate}-to-${dateRange.endDate}.${format}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to export report';
			setError(errorMessage);
		}
	};

	const handleRefresh = () => {
		loadReportData();
	};

	const renderSummaryCards = () => {
		if (!reportData) return null;

		const cards = [
			{
				title: 'Total Users',
				value: reportData.summary.totalUsers,
				icon: 'FiPackage',
				color: 'var(--ping-primary-color, #3b82f6)',
			},
			{
				title: 'Active Users',
				value: reportData.summary.activeUsers,
				icon: 'FiPackage',
				color: 'var(--ping-success-color, #22c55e)',
			},
			{
				title: 'Total Devices',
				value: reportData.summary.totalDevices,
				icon: 'FiPackage',
				color: 'var(--ping-warning-color, #f59e0b)',
			},
			{
				title: 'FIDO2 Keys',
				value: reportData.summary.totalFIDO2Keys,
				icon: 'FiPackage',
				color: 'var(--ping-info-color, #3b82f6)',
			},
		];

		return (
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
					gap: 'var(--ping-spacing-lg, 1.5rem)',
					marginBottom: 'var(--ping-spacing-xl, 2rem)',
				}}
			>
				{cards.map((card, index) => (
					<div
						key={index}
						style={{
							background: 'var(--ping-surface-primary, #ffffff)',
							border: '1px solid var(--ping-border-color, #e5e7eb)',
							borderRadius: 'var(--ping-border-radius-lg, 12px)',
							padding: 'var(--ping-spacing-lg, 1.5rem)',
							transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.borderColor = card.color;
							e.currentTarget.style.transform = 'translateY(-2px)';
							e.currentTarget.style.boxShadow =
								'var(--ping-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.borderColor = 'var(--ping-border-color, #e5e7eb)';
							e.currentTarget.style.transform = 'translateY(0)';
							e.currentTarget.style.boxShadow = 'none';
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: 'var(--ping-spacing-md, 1rem)',
							}}
						>
							<h3
								style={{
									margin: 0,
									fontSize: '0.875rem',
									fontWeight: 500,
									color: 'var(--ping-text-secondary, #6b7280)',
								}}
							>
								{card.title}
							</h3>
							<MDIIcon
								icon={card.icon}
								size={20}
								ariaLabel={card.title}
								style={{ color: card.color }}
							/>
						</div>
						<div
							style={{
								fontSize: '2rem',
								fontWeight: 700,
								color: card.color,
							}}
						>
							{card.value}
						</div>
					</div>
				))}
			</div>
		);
	};

	const renderReportTable = () => {
		if (!reportData) return null;

		const getTableData = () => {
			switch (selectedReport) {
				case 'users':
					return {
						columns: ['Username', 'Email', 'Last Auth', 'Method', 'Devices', 'Success Rate'],
						data: reportData.userReports.map((user) => [
							user.username,
							user.email,
							new Date(user.lastAuthentication).toLocaleDateString(),
							user.authMethod,
							user.deviceCount.toString(),
							`${user.successRate}%`,
						]),
					};
				case 'devices':
					return {
						columns: ['Device Name', 'Type', 'Status', 'Last Used', 'Usage Count'],
						data: reportData.deviceReports.map((device) => [
							device.deviceName,
							device.deviceType,
							device.status,
							new Date(device.lastUsed).toLocaleDateString(),
							device.usageCount.toString(),
						]),
					};
				case 'fido2':
					return {
						columns: ['Device Name', 'Credential ID', 'Created', 'Last Used', 'Signatures'],
						data: reportData.fido2Reports.map((fido2) => [
							fido2.deviceName,
							`${fido2.credentialId.substring(0, 12)}...`,
							new Date(fido2.createdAt).toLocaleDateString(),
							new Date(fido2.lastUsed).toLocaleDateString(),
							fido2.signatureCount.toString(),
						]),
					};
				default:
					return { columns: [], data: [] };
			}
		};

		const tableData = getTableData();

		if (selectedReport === 'summary') {
			return (
				<div
					style={{
						background: 'var(--ping-surface-primary, #ffffff)',
						border: '1px solid var(--ping-border-color, #e5e7eb)',
						borderRadius: 'var(--ping-border-radius-lg, 12px)',
						padding: 'var(--ping-spacing-xl, 2rem)',
					}}
				>
					<h3
						style={{
							margin: '0 0 var(--ping-spacing-lg, 1.5rem) 0',
							fontSize: '1.25rem',
							fontWeight: 600,
							color: 'var(--ping-text-primary, #1a1a1a)',
						}}
					>
						Report Summary
					</h3>
					<div
						style={{
							background: 'var(--ping-surface-secondary, #f8fafc)',
							border: '1px solid var(--ping-border-color, #e5e7eb)',
							borderRadius: 'var(--ping-border-radius-md, 8px)',
							padding: 'var(--ping-spacing-lg, 1.5rem)',
						}}
					>
						<p
							style={{
								margin: 0,
								fontSize: '1rem',
								color: 'var(--ping-text-primary, #1a1a1a)',
								lineHeight: '1.6',
							}}
						>
							<strong>Report Period:</strong> {reportData.summary.reportPeriod}
							<br />
							<strong>Total Users:</strong> {reportData.summary.totalUsers} (
							{reportData.summary.activeUsers} active)
							<br />
							<strong>Total Devices:</strong> {reportData.summary.totalDevices} (
							{reportData.summary.activeDevices} active)
							<br />
							<strong>FIDO2 Keys:</strong> {reportData.summary.totalFIDO2Keys}
						</p>
					</div>
				</div>
			);
		}

		return (
			<div
				style={{
					background: 'var(--ping-surface-primary, #ffffff)',
					border: '1px solid var(--ping-border-color, #e5e7eb)',
					borderRadius: 'var(--ping-border-radius-lg, 12px)',
					padding: 'var(--ping-spacing-xl, 2rem)',
				}}
			>
				<h3
					style={{
						margin: '0 0 var(--ping-spacing-lg, 1.5rem) 0',
						fontSize: '1.25rem',
						fontWeight: 600,
						color: 'var(--ping-text-primary, #1a1a1a)',
						textTransform: 'capitalize',
					}}
				>
					{selectedReport} Reports
				</h3>

				<div
					style={{
						overflow: 'auto',
						border: '1px solid var(--ping-border-color, #e5e7eb)',
						borderRadius: 'var(--ping-border-radius-md, 8px)',
					}}
				>
					<table
						style={{
							width: '100%',
							borderCollapse: 'collapse',
							minWidth: '600px',
						}}
					>
						<thead>
							<tr
								style={{
									background: 'var(--ping-surface-secondary, #f8fafc)',
									borderBottom: '1px solid var(--ping-border-color, #e5e7eb)',
								}}
							>
								{tableData.columns.map((column, index) => (
									<th
										key={index}
										style={{
											padding: 'var(--ping-spacing-md, 1rem)',
											textAlign: 'left',
											fontSize: '0.875rem',
											fontWeight: 600,
											color: 'var(--ping-text-primary, #1a1a1a)',
											borderRight:
												index < tableData.columns.length - 1
													? '1px solid var(--ping-border-color, #e5e7eb)'
													: 'none',
										}}
									>
										{column}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{tableData.data.map((row, rowIndex) => (
								<tr
									key={rowIndex}
									style={{
										borderBottom: '1px solid var(--ping-border-color, #e5e7eb)',
										transition: 'background-color var(--ping-transition-fast, 0.15s) ease-in-out',
									}}
									onMouseOver={(e) => {
										e.currentTarget.style.backgroundColor =
											'var(--ping-surface-secondary, #f8fafc)';
									}}
									onMouseOut={(e) => {
										e.currentTarget.style.backgroundColor = 'transparent';
									}}
								>
									{row.map((cell, cellIndex) => (
										<td
											key={cellIndex}
											style={{
												padding: 'var(--ping-spacing-md, 1rem)',
												fontSize: '0.875rem',
												color: 'var(--ping-text-primary, #1a1a1a)',
												borderRight:
													cellIndex < row.length - 1
														? '1px solid var(--ping-border-color, #e5e7eb)'
														: 'none',
											}}
										>
											{cell}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		);
	};

	return (
		<div className="end-user-nano">
			<div
				style={{
					minHeight: '100vh',
					background: 'var(--ping-surface-primary, #ffffff)',
					color: 'var(--ping-text-primary, #1a1a1a)',
				}}
			>
				{/* Header */}
				<MFAHeaderV8
					title="MFA Reporting"
					subtitle="View authentication reports and analytics"
					onBack={scrollToTop}
				/>

				{/* Controls */}
				<div
					style={{
						padding: 'var(--ping-spacing-xl, 2rem)',
						paddingBottom: 0,
					}}
				>
					<div
						style={{
							display: 'flex',
							flexWrap: 'wrap',
							alignItems: 'center',
							gap: 'var(--ping-spacing-lg, 1.5rem)',
							marginBottom: 'var(--ping-spacing-xl, 2rem)',
						}}
					>
						{/* Date Range */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 'var(--ping-spacing-md, 1rem)',
							}}
						>
							<label
								style={{
									fontSize: '0.875rem',
									fontWeight: 500,
									color: 'var(--ping-text-secondary, #6b7280)',
								}}
							>
								From:
							</label>
							<input
								type="date"
								value={dateRange.startDate}
								onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
								style={{
									padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem)',
									border: '1px solid var(--ping-border-color, #e5e7eb)',
									borderRadius: 'var(--ping-border-radius-md, 8px)',
									fontSize: '0.875rem',
									color: 'var(--ping-text-primary, #1a1a1a)',
								}}
							/>
							<label
								style={{
									fontSize: '0.875rem',
									fontWeight: 500,
									color: 'var(--ping-text-secondary, #6b7280)',
								}}
							>
								To:
							</label>
							<input
								type="date"
								value={dateRange.endDate}
								onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
								style={{
									padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem)',
									border: '1px solid var(--ping-border-color, #e5e7eb)',
									borderRadius: 'var(--ping-border-radius-md, 8px)',
									fontSize: '0.875rem',
									color: 'var(--ping-text-primary, #1a1a1a)',
								}}
							/>
						</div>

						{/* Report Type Selector */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 'var(--ping-spacing-sm, 0.5rem)',
							}}
						>
							{(['summary', 'users', 'devices', 'fido2'] as const).map((type) => (
								<button
									key={type}
									onClick={() => setSelectedReport(type)}
									style={{
										padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem)',
										background:
											selectedReport === type
												? 'var(--ping-primary-color, #3b82f6)'
												: 'var(--ping-surface-primary, #ffffff)',
										border: '1px solid var(--ping-border-color, #e5e7eb)',
										borderRadius: 'var(--ping-border-radius-md, 8px)',
										color: selectedReport === type ? 'white' : 'var(--ping-text-primary, #1a1a1a)',
										fontSize: '0.875rem',
										fontWeight: 500,
										cursor: 'pointer',
										transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
									}}
									onMouseOver={(e) => {
										if (selectedReport !== type) {
											e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
											e.currentTarget.style.backgroundColor = 'var(--ping-primary-light, #dbeafe)';
										}
									}}
									onMouseOut={(e) => {
										if (selectedReport !== type) {
											e.currentTarget.style.borderColor = 'var(--ping-border-color, #e5e7eb)';
											e.currentTarget.style.backgroundColor =
												'var(--ping-surface-primary, #ffffff)';
										}
									}}
								>
									{type.charAt(0).toUpperCase() + type.slice(1)}
								</button>
							))}
						</div>

						{/* Action Buttons */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 'var(--ping-spacing-sm, 0.5rem)',
								marginLeft: 'auto',
							}}
						>
							<button
								onClick={handleRefresh}
								disabled={isLoading}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 'var(--ping-spacing-xs, 0.25rem)',
									padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem)',
									background: 'var(--ping-surface-primary, #ffffff)',
									border: '1px solid var(--ping-border-color, #e5e7eb)',
									borderRadius: 'var(--ping-border-radius-md, 8px)',
									color: 'var(--ping-text-primary, #1a1a1a)',
									fontSize: '0.875rem',
									cursor: isLoading ? 'not-allowed' : 'pointer',
									transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
								}}
								onMouseOver={(e) => {
									if (!isLoading) {
										e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
										e.currentTarget.style.backgroundColor = 'var(--ping-primary-light, #dbeafe)';
									}
								}}
								onMouseOut={(e) => {
									e.currentTarget.style.borderColor = 'var(--ping-border-color, #e5e7eb)';
									e.currentTarget.style.backgroundColor = 'var(--ping-surface-primary, #ffffff)';
								}}
							>
								<MDIIcon icon="FiPackage" size={16} ariaLabel="Refresh" />
								Refresh
							</button>

							{['csv', 'json', 'pdf'].map((format) => (
								<button
									key={format}
									onClick={() => handleExportReport(format as 'csv' | 'json' | 'pdf')}
									disabled={isLoading || !reportData}
									style={{
										padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem)',
										background: 'var(--ping-primary-color, #3b82f6)',
										border: '1px solid var(--ping-primary-color, #3b82f6)',
										borderRadius: 'var(--ping-border-radius-md, 8px)',
										color: 'white',
										fontSize: '0.875rem',
										fontWeight: 500,
										cursor: isLoading || !reportData ? 'not-allowed' : 'pointer',
										transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
									}}
									onMouseOver={(e) => {
										if (!isLoading && reportData) {
											e.currentTarget.style.backgroundColor = 'var(--ping-primary-dark, #2563eb)';
											e.currentTarget.style.borderColor = 'var(--ping-primary-dark, #2563eb)';
										}
									}}
									onMouseOut={(e) => {
										e.currentTarget.style.backgroundColor = 'var(--ping-primary-color, #3b82f6)';
										e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
									}}
								>
									Export {format.toUpperCase()}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Content */}
				<div
					style={{
						padding: 'var(--ping-spacing-xl, 2rem)',
					}}
				>
					{isLoading && !reportData && (
						<div
							style={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								minHeight: '400px',
							}}
						>
							<div style={{ textAlign: 'center' }}>
								<div
									style={{
										width: '40px',
										height: '40px',
										border: '4px solid var(--ping-border-color, #e5e7eb)',
										borderTop: '4px solid var(--ping-primary-color, #3b82f6)',
										borderRadius: '50%',
										animation: 'spin 1s linear infinite',
										margin: '0 auto var(--ping-spacing-md, 1rem)',
									}}
								></div>
								<p style={{ color: 'var(--ping-text-secondary, #6b7280)' }}>
									Loading report data...
								</p>
							</div>
						</div>
					)}

					{error && (
						<div
							style={{
								background: 'var(--ping-error-light, #fef2f2)',
								border: '1px solid var(--ping-error-color, #ef4444)',
								borderRadius: 'var(--ping-border-radius-lg, 12px)',
								padding: 'var(--ping-spacing-lg, 1.5rem)',
								marginBottom: 'var(--ping-spacing-xl, 2rem)',
								textAlign: 'center',
							}}
						>
							<h3
								style={{
									margin: '0 0 var(--ping-spacing-sm, 0.5rem) 0',
									color: 'var(--ping-error-color, #ef4444)',
									fontSize: '1.125rem',
									fontWeight: 600,
								}}
							>
								Error Loading Report
							</h3>
							<p
								style={{
									margin: '0 0 var(--ping-spacing-md, 1rem) 0',
									color: 'var(--ping-text-secondary, #6b7280)',
								}}
							>
								{error}
							</p>
							<button
								onClick={handleRefresh}
								style={{
									padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-md, 1rem)',
									background: 'var(--ping-error-color, #ef4444)',
									border: '1px solid var(--ping-error-color, #ef4444)',
									borderRadius: 'var(--ping-border-radius-md, 8px)',
									color: 'white',
									fontSize: '0.875rem',
									cursor: 'pointer',
								}}
							>
								Try Again
							</button>
						</div>
					)}

					{reportData && (
						<>
							{renderSummaryCards()}
							{renderReportTable()}
						</>
					)}
				</div>

				{/* Worker Token Modal */}
				{showWorkerTokenModal && (
					<WorkerTokenModalV8
						isOpen={showWorkerTokenModal}
						onClose={() => setShowWorkerTokenModal(false)}
					/>
				)}

				{/* API Display */}
				<SuperSimpleApiDisplayV8
					title="MFA Reporting API"
					description="API endpoints and data structures for MFA reporting"
					apiCalls={[]}
					padding={apiDisplayPadding}
				/>
			</div>
		</div>
	);
};

export default MFAReportingFlowV8PingUI;
