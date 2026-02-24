/**
 * @file DebugLogsPage.tsx
 * @description Debug logs and troubleshooting page for OAuth 2.0 flows
 * @version 9.27.0
 */

import React, { useEffect, useState } from 'react';
import {
	FiActivity,
	FiAlertTriangle,
	FiCheckCircle,
	FiClock,
	FiCopy,
	FiDatabase,
	FiDownload,
	FiEye,
	FiEyeOff,
	FiFilter,
	FiInfo,
	FiRefreshCw,
	FiSearch,
	FiTerminal,
	FiTrash2,
} from 'react-icons/fi';
import styled from 'styled-components';
import BootstrapButton from '@/components/bootstrap/BootstrapButton';
import { PageHeaderTextColors, PageHeaderV8 } from '@/v8/components/shared/PageHeaderV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const _MODULE_TAG = '[🐛 DEBUG-LOGS]';

interface LogEntry {
	id: string;
	timestamp: string;
	level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
	message: string;
	module: string;
	flow?: string;
	user?: string;
	ipAddress?: string;
	userAgent?: string;
	details?: Record<string, unknown>;
}

interface LogFilter {
	level: string;
	module: string;
	search: string;
	timeRange: '1h' | '6h' | '24h' | '7d' | 'all';
}

const Container = styled.div`
	padding: 2rem;
	max-width: 1400px;
	margin: 0 auto;
`;

const Section = styled.div`
	background: white;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin-bottom: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const FilterBar = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 1.5rem;
	flex-wrap: wrap;
	align-items: center;
`;

const SearchInput = styled.input`
	padding: 0.5rem 1rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	flex: 1;
	min-width: 200px;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Select = styled.select`
	padding: 0.5rem 1rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	background: white;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const LogContainer = styled.div`
	background: #1f2937;
	color: #f3f4f6;
	padding: 1.5rem;
	border-radius: 0.5rem;
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow-x: auto;
	max-height: 600px;
	overflow-y: auto;
`;

const LogEntry = styled.div<{ $level: string }>`
	padding: 0.75rem;
	border-bottom: 1px solid #374151;
	
	&:hover {
		background: rgba(59, 130, 246, 0.1);
	}
	
	${({ $level }) => {
		switch ($level) {
			case 'debug':
				return 'border-left: 4px solid #6b7280;';
			case 'info':
				return 'border-left: 4px solid #3b82f6;';
			case 'warn':
				return 'border-left: 4px solid #f59e0b;';
			case 'error':
				return 'border-left: 4px solid #ef4444;';
			case 'fatal':
				return 'border-left: 4px solid #dc2626;';
			default:
				return 'border-left: 4px solid #6b7280;';
		}
	}}
`;

const LogHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.5rem;
`;

const LogTimestamp = styled.span`
	color: #9ca3af;
	font-size: 0.75rem;
`;

const LogLevel = styled.span<{ $level: string }>`
	padding: 0.125rem 0.375rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	margin-right: 0.5rem;
	
	${({ $level }) => {
		switch ($level) {
			case 'debug':
				return 'background: #6b7280; color: white;';
			case 'info':
				return 'background: #3b82f6; color: white;';
			case 'warn':
				return 'background: #f59e0b; color: white;';
			case 'error':
				return 'background: #ef4444; color: white;';
			case 'fatal':
				return 'background: #dc2626; color: white;';
			default:
				return 'background: #6b7280; color: white;';
		}
	}}
`;

const LogMessage = styled.div`
	color: #f3f4f6;
	margin: 0.5rem 0;
`;

const LogDetails = styled.div`
	color: #9ca3af;
	font-size: 0.75rem;
	margin-top: 0.5rem;
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 1rem;
	flex-wrap: wrap;
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin: 1.5rem 0;
`;

const Card = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const CardTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const MetricValue = styled.div`
	font-size: 2rem;
	font-weight: 700;
	color: #1f2937;
	margin: 0.5rem 0;
`;

const MetricLabel = styled.div`
	font-size: 0.875rem;
	color: #6b7280;
`;

// Mock log data for demonstration
const mockLogs: LogEntry[] = [
	{
		id: '1',
		timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
		level: 'info',
		message: 'OAuth authorization flow started',
		module: 'OAuthAuthorizationCodeFlowV8',
		flow: 'authorization-code',
		user: 'user123',
		ipAddress: '192.168.1.100',
		details: { clientId: 'client-123', scopes: ['openid', 'profile'] },
	},
	{
		id: '2',
		timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
		level: 'debug',
		message: 'Token validation successful',
		module: 'TokenServiceV8',
		flow: 'authorization-code',
		details: { tokenType: 'Bearer', expiresIn: 3600 },
	},
	{
		id: '3',
		timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
		level: 'warn',
		message: 'Token expiration approaching',
		module: 'TokenRefreshService',
		flow: 'authorization-code',
		details: { expiresIn: 300, warningTime: 1800 },
	},
	{
		id: '4',
		timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
		level: 'error',
		message: 'Failed to refresh token',
		module: 'TokenRefreshService',
		flow: 'authorization-code',
		details: { error: 'invalid_grant', errorCode: 'TOKEN_REFRESH_FAILED' },
	},
	{
		id: '5',
		timestamp: new Date().toISOString(),
		level: 'info',
		message: 'User authenticated successfully',
		module: 'AuthenticationService',
		flow: 'authorization-code',
		user: 'user123',
		ipAddress: '192.168.1.100',
		details: { userId: 'user123', authMethod: 'authorization_code' },
	},
];

export const DebugLogsPage: React.FC = () => {
	const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
	const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(mockLogs);
	const [filter, setFilter] = useState<LogFilter>({
		level: 'all',
		module: 'all',
		search: '',
		timeRange: '24h',
	});
	const [showDetails, setShowDetails] = useState(false);
	const [copiedText, setCopiedText] = useState('');

	// Apply filters
	useEffect(() => {
		let filtered = [...logs];

		// Filter by level
		if (filter.level !== 'all') {
			filtered = filtered.filter((log) => log.level === filter.level);
		}

		// Filter by module
		if (filter.module !== 'all') {
			filtered = filtered.filter((log) => log.module.includes(filter.module));
		}

		// Filter by search
		if (filter.search) {
			const searchLower = filter.search.toLowerCase();
			filtered = filtered.filter(
				(log) =>
					log.message.toLowerCase().includes(searchLower) ||
					log.module.toLowerCase().includes(searchLower) ||
					log.flow?.toLowerCase().includes(searchLower) ||
					log.user?.toLowerCase().includes(searchLower)
			);
		}

		// Filter by time range
		const now = Date.now();
		const timeRanges = {
			'1h': 60 * 60 * 1000,
			'6h': 6 * 60 * 60 * 1000,
			'24h': 24 * 60 * 60 * 1000,
			'7d': 7 * 24 * 60 * 60 * 1000,
			all: Infinity,
		};

		if (filter.timeRange !== 'all') {
			const cutoff = now - timeRanges[filter.timeRange as keyof typeof timeRanges];
			filtered = filtered.filter((log) => new Date(log.timestamp).getTime() >= cutoff);
		}

		// Sort by timestamp (newest first)
		filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

		setFilteredLogs(filtered);
	}, [logs, filter]);

	const handleRefresh = () => {
		// Simulate refreshing logs
		const newLog: LogEntry = {
			id: Date.now().toString(),
			timestamp: new Date().toISOString(),
			level: 'info',
			message: 'Logs refreshed successfully',
			module: 'DebugLogsPage',
			details: { logCount: logs.length },
		};
		setLogs([newLog, ...logs]);
		toastV8.success('Logs refreshed');
	};

	const handleExport = () => {
		const logText = filteredLogs
			.map(
				(log) =>
					`[${log.timestamp}] [${log.level.toUpperCase()}] [${log.module}] ${log.message}${log.details ? ` | ${JSON.stringify(log.details)}` : ''}`
			)
			.join('\n');

		const blob = new Blob([logText], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.log`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toastV8.success('Logs exported successfully');
	};

	const handleClear = () => {
		setLogs([]);
		setFilteredLogs([]);
		toastV8.success('Logs cleared');
	};

	const copyToClipboard = (text: string, type: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				setCopiedText(type);
				toastV8.success(`${type} copied to clipboard`);
				setTimeout(() => setCopiedText(''), 2000);
			})
			.catch(() => {
				toastV8.error('Failed to copy to clipboard');
			});
	};

	const getLogStats = () => {
		const stats = {
			total: filteredLogs.length,
			debug: filteredLogs.filter((l) => l.level === 'debug').length,
			info: filteredLogs.filter((l) => l.level === 'info').length,
			warn: filteredLogs.filter((l) => l.level === 'warn').length,
			error: filteredLogs.filter((l) => l.level === 'error').length,
			fatal: filteredLogs.filter((l) => l.level === 'fatal').length,
		};
		return stats;
	};

	const stats = getLogStats();

	return (
		<Container>
			<PageHeaderV8
				title="Debug Logs & Troubleshooting"
				subtitle="Real-time debug logs and troubleshooting tools for OAuth 2.0 flows"
				gradient="#ef4444"
				textColor={PageHeaderTextColors.white}
			/>

			<Section>
				<SectionTitle>
					<FiActivity />
					Log Statistics
				</SectionTitle>

				<Grid>
					<Card>
						<CardTitle>
							<FiDatabase />
							Total Logs
						</CardTitle>
						<MetricValue>{stats.total}</MetricValue>
						<MetricLabel>All log entries</MetricLabel>
					</Card>

					<Card>
						<CardTitle>
							<FiAlertTriangle />
							Warnings
						</CardTitle>
						<MetricValue style={{ color: '#f59e0b' }}>{stats.warn}</MetricValue>
						<MetricLabel>Warning messages</MetricLabel>
					</Card>

					<Card>
						<CardTitle>
							<FiAlertTriangle />
							Errors
						</CardTitle>
						<MetricValue style={{ color: '#ef4444' }}>{stats.error + stats.fatal}</MetricValue>
						<MetricLabel>Error & Fatal messages</MetricLabel>
					</Card>

					<Card>
						<CardTitle>
							<FiInfo />
							Info
						</CardTitle>
						<MetricValue style={{ color: '#3b82f6' }}>{stats.info}</MetricValue>
						<MetricLabel>Information messages</MetricLabel>
					</Card>
				</Grid>
			</Section>

			<Section>
				<SectionTitle>
					<FiFilter />
					Log Filters
				</SectionTitle>

				<FilterBar>
					<SearchInput
						type="text"
						placeholder="Search logs..."
						value={filter.search}
						onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
					/>

					<Select
						value={filter.level}
						onChange={(e) => setFilter((prev) => ({ ...prev, level: e.target.value }))}
					>
						<option value="all">All Levels</option>
						<option value="debug">Debug</option>
						<option value="info">Info</option>
						<option value="warn">Warning</option>
						<option value="error">Error</option>
						<option value="fatal">Fatal</option>
					</Select>

					<Select
						value={filter.module}
						onChange={(e) => setFilter((prev) => ({ ...prev, module: e.target.value }))}
					>
						<option value="all">All Modules</option>
						<option value="OAuthAuthorizationCodeFlowV8">OAuth Auth Code</option>
						<option value="TokenServiceV8">Token Service</option>
						<option value="AuthenticationService">Authentication</option>
						<option value="TokenRefreshService">Token Refresh</option>
					</Select>

					<Select
						value={filter.timeRange}
						onChange={(e) => setFilter((prev) => ({ ...prev, timeRange: e.target.value as any }))}
					>
						<option value="1h">Last Hour</option>
						<option value="6h">Last 6 Hours</option>
						<option value="24h">Last 24 Hours</option>
						<option value="7d">Last 7 Days</option>
						<option value="all">All Time</option>
					</Select>

					<BootstrapButton variant="secondary" onClick={() => setShowDetails(!showDetails)}>
						{showDetails ? <FiEyeOff /> : <FiEye />}
						{showDetails ? 'Hide Details' : 'Show Details'}
					</BootstrapButton>
				</FilterBar>
			</Section>

			<Section>
				<SectionTitle>
					<FiTerminal />
					Log Entries ({filteredLogs.length})
				</SectionTitle>

				<LogContainer>
					{filteredLogs.length === 0 ? (
						<div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
							<FiInfo size={24} style={{ marginBottom: '1rem' }} />
							<div>No logs found matching the current filters</div>
						</div>
					) : (
						filteredLogs.map((log) => (
							<LogEntry key={log.id} $level={log.level}>
								<LogHeader>
									<div>
										<LogTimestamp>{new Date(log.timestamp).toLocaleString()}</LogTimestamp>
										<LogLevel $level={log.level}>{log.level}</LogLevel>
										<span style={{ color: '#60a5fa', marginRight: '0.5rem' }}>{log.module}</span>
										{log.flow && (
											<span style={{ color: '#34d399', marginRight: '0.5rem' }}>{log.flow}</span>
										)}
										{log.user && (
											<span style={{ color: '#fbbf24', marginRight: '0.5rem' }}>@{log.user}</span>
										)}
										{log.ipAddress && (
											<span style={{ color: '#a78bfa', marginRight: '0.5rem' }}>
												{log.ipAddress}
											</span>
										)}
									</div>
									<BootstrapButton
										variant="secondary"
										onClick={() => copyToClipboard(log.message, 'Log Message')}
										style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
									>
										{copiedText === 'Log Message' ? <FiRefreshCw /> : <FiCopy />}
									</BootstrapButton>
								</LogHeader>

								<LogMessage>{log.message}</LogMessage>

								{showDetails && log.details && (
									<LogDetails>Details: {JSON.stringify(log.details, null, 2)}</LogDetails>
								)}
							</LogEntry>
						))
					)}
				</LogContainer>

				<ActionButtons>
					<BootstrapButton variant="primary" onClick={handleRefresh}>
						<FiRefreshCw />
						Refresh
					</BootstrapButton>

					<BootstrapButton variant="primary" onClick={handleExport}>
						<FiDownload />
						Export
					</BootstrapButton>

					<BootstrapButton variant="danger" onClick={handleClear}>
						<FiTrash2 />
						Clear All
					</BootstrapButton>
				</ActionButtons>
			</Section>

			<Section>
				<SectionTitle>
					<FiInfo />
					Debugging Best Practices
				</SectionTitle>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
						gap: '1.5rem',
					}}
				>
					<div
						style={{
							background: '#f0fdf4',
							border: '1px solid #bbf7d0',
							borderRadius: '0.375rem',
							padding: '1rem',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>Log Levels</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534' }}>
							<li>
								<strong>DEBUG:</strong> Detailed development information
							</li>
							<li>
								<strong>INFO:</strong> General information about flow execution
							</li>
							<li>
								<strong>WARN:</strong> Potentially problematic situations
							</li>
							<li>
								<strong>ERROR:</strong> Error conditions that need attention
							</li>
							<li>
								<strong>FATAL:</strong> Critical errors that stop execution
							</li>
						</ul>
					</div>

					<div
						style={{
							background: '#fef3c7',
							border: '1px solid #fcd34d',
							borderRadius: '0.375rem',
							padding: '1rem',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>Troubleshooting Tips</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e' }}>
							<li>Filter by module to isolate specific flow issues</li>
							<li>Check error messages for specific error codes</li>
							<li>Review log timestamps to understand flow sequence</li>
							<li>Use search to find specific error patterns</li>
							<li>Export logs for detailed analysis</li>
						</ul>
					</div>

					<div
						style={{
							background: '#eff6ff',
							border: '1px solid #bfdbfe',
							borderRadius: '0.375rem',
							padding: '1rem',
						}}
					>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>Common Issues</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1e40af' }}>
							<li>
								<strong>Token Errors:</strong> Check credentials and token validity
							</li>
							<li>
								<strong>Network Issues:</strong> Verify API endpoints and connectivity
							</li>
							<li>
								<strong>Configuration:</strong> Review environment settings
							</li>
							<li>
								<strong>Authentication:</strong> Check user credentials and permissions
							</li>
						</ul>
					</div>
				</div>
			</Section>
		</Container>
	);
};

export default DebugLogsPage;
