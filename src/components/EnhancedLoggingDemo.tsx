/**
 * @file EnhancedLoggingDemo.tsx
 * @module components
 * @description Demo component showing enhanced logging capabilities
 * @version 1.0.0
 * @since 2026-02-22
 */

import React, { useState } from 'react';
import { enhancedLogger } from '../services/enhancedLoggingService';

const EnhancedLoggingDemo: React.FC = () => {
	const [logs, setLogs] = useState<string[]>([]);

	const handleTestLog = (level: string) => {
		switch (level) {
			case 'error':
				enhancedLogger.error('EnhancedLoggingDemo', 'This is an error message', {
					errorCode: 'DEMO_001',
					context: 'Testing enhanced logging',
				});
				break;
			case 'warn':
				enhancedLogger.warn('EnhancedLoggingDemo', 'This is a warning message', {
					warningCode: 'DEMO_002',
					context: 'Testing enhanced logging',
				});
				break;
			case 'info':
				enhancedLogger.info('EnhancedLoggingDemo', 'This is an info message', {
					infoCode: 'DEMO_003',
					context: 'Testing enhanced logging',
				});
				break;
			case 'debug':
				enhancedLogger.debug('EnhancedLoggingDemo', 'This is a debug message', {
					debugCode: 'DEMO_004',
					context: 'Testing enhanced logging',
				});
				break;
			case 'success':
				enhancedLogger.success(
					'EnhancedLoggingDemo',
					'This is a success message',
					{
						successCode: 'DEMO_005',
						context: 'Testing enhanced logging',
					},
					150
				);
				break;
			case 'flow':
				enhancedLogger.flow(
					'EnhancedLoggingDemo',
					'This is a flow message',
					{
						flowCode: 'DEMO_006',
						context: 'Testing enhanced logging',
					},
					200
				);
				break;
			case 'security':
				enhancedLogger.security('EnhancedLoggingDemo', 'This is a security message', {
					securityCode: 'DEMO_007',
					context: 'Testing enhanced logging',
				});
				break;
			case 'auth':
				enhancedLogger.auth('EnhancedLoggingDemo', 'This is an auth message', {
					authCode: 'DEMO_008',
					context: 'Testing enhanced logging',
				});
				break;
			case 'config':
				enhancedLogger.config('EnhancedLoggingDemo', 'This is a config message', {
					configCode: 'DEMO_009',
					context: 'Testing enhanced logging',
				});
				break;
			case 'api':
				enhancedLogger.api(
					'EnhancedLoggingDemo',
					'This is an API message',
					{
						apiCode: 'DEMO_010',
						context: 'Testing enhanced logging',
					},
					300
				);
				break;
			case 'storage':
				enhancedLogger.storage('EnhancedLoggingDemo', 'This is a storage message', {
					storageCode: 'DEMO_011',
					context: 'Testing enhanced logging',
				});
				break;
			case 'ui':
				enhancedLogger.ui('EnhancedLoggingDemo', 'This is a UI message', {
					uiCode: 'DEMO_012',
					context: 'Testing enhanced logging',
				});
				break;
			case 'discovery':
				enhancedLogger.discovery('EnhancedLoggingDemo', 'This is a discovery message', {
					discoveryCode: 'DEMO_013',
					context: 'Testing enhanced logging',
				});
				break;
		}

		// Add to local display
		const timestamp = new Date().toLocaleTimeString();
		setLogs((prev) => [...prev, `[${timestamp}] ${level.toUpperCase()} logged`]);
	};

	const handleClearLogs = () => {
		enhancedLogger.clearLogs();
		setLogs([]);
	};

	const handleExportLogs = () => {
		const exportedLogs = enhancedLogger.exportLogs();
		const blob = new Blob([exportedLogs], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `enhanced-logs-${new Date().toISOString().split('T')[0]}.log`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleShowStats = () => {
		const stats = enhancedLogger.getStats();
		enhancedLogger.info('EnhancedLoggingDemo', 'Log Statistics', stats);
	};

	const logButtons = [
		{ level: 'error', label: 'Error', color: '#ef4444' },
		{ level: 'warn', label: 'Warning', color: '#f59e0b' },
		{ level: 'info', label: 'Info', color: '#3b82f6' },
		{ level: 'debug', label: 'Debug', color: '#8b5cf6' },
		{ level: 'success', label: 'Success', color: '#10b981' },
		{ level: 'flow', label: 'Flow', color: '#06b6d4' },
		{ level: 'security', label: 'Security', color: '#dc2626' },
		{ level: 'auth', label: 'Auth', color: '#f59e0b' },
		{ level: 'config', label: 'Config', color: '#6b7280' },
		{ level: 'api', label: 'API', color: '#10b981' },
		{ level: 'storage', label: 'Storage', color: '#8b5cf6' },
		{ level: 'ui', label: 'UI', color: '#06b6d4' },
		{ level: 'discovery', label: 'Discovery', color: '#f59e0b' },
	];

	return (
		<div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
			<h2>🎨 Enhanced Logging Demo</h2>
			<p>
				This demo showcases the enhanced logging system with colors, icons, banners, and proper
				formatting. Click the buttons below to generate different types of log entries.
			</p>

			<div style={{ marginBottom: '2rem' }}>
				<h3>📝 Test Different Log Levels</h3>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
						gap: '0.5rem',
					}}
				>
					{logButtons.map(({ level, label, color }) => (
						<button
							key={level}
							onClick={() => handleTestLog(level)}
							style={{
								background: color,
								color: 'white',
								border: 'none',
								padding: '0.5rem 1rem',
								borderRadius: '0.375rem',
								cursor: 'pointer',
								fontSize: '0.875rem',
								fontWeight: '500',
								transition: 'all 0.15s ease-in-out',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.transform = 'translateY(-1px)';
								e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = 'none';
							}}
						>
							{label}
						</button>
					))}
				</div>
			</div>

			<div style={{ marginBottom: '2rem' }}>
				<h3>⚙️ Actions</h3>
				<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
					<button
						onClick={handleShowStats}
						style={{
							background: '#6b7280',
							color: 'white',
							border: 'none',
							padding: '0.5rem 1rem',
							borderRadius: '0.375rem',
							cursor: 'pointer',
							fontSize: '0.875rem',
							fontWeight: '500',
						}}
					>
						📊 Show Stats
					</button>
					<button
						onClick={handleExportLogs}
						style={{
							background: '#10b981',
							color: 'white',
							border: 'none',
							padding: '0.5rem 1rem',
							borderRadius: '0.375rem',
							cursor: 'pointer',
							fontSize: '0.875rem',
							fontWeight: '500',
						}}
					>
						💾 Export Logs
					</button>
					<button
						onClick={handleClearLogs}
						style={{
							background: '#ef4444',
							color: 'white',
							border: 'none',
							padding: '0.5rem 1rem',
							borderRadius: '0.375rem',
							cursor: 'pointer',
							fontSize: '0.875rem',
							fontWeight: '500',
						}}
					>
						🗑️ Clear Logs
					</button>
				</div>
			</div>

			<div style={{ marginBottom: '2rem' }}>
				<h3>📋 Recent Activity</h3>
				<div
					style={{
						background: '#f3f4f6',
						border: '1px solid #d1d5db',
						borderRadius: '0.5rem',
						padding: '1rem',
						maxHeight: '200px',
						overflowY: 'auto',
						fontFamily: 'monospace',
						fontSize: '0.875rem',
					}}
				>
					{logs.length > 0 ? (
						logs.map((log, index) => (
							<div key={index} style={{ marginBottom: '0.25rem' }}>
								{log}
							</div>
						))
					) : (
						<div style={{ color: '#6b7280', fontStyle: 'italic' }}>
							No logs generated yet. Click the buttons above to test logging.
						</div>
					)}
				</div>
			</div>

			<div
				style={{
					background: '#f0fdf4',
					border: '1px solid #bbf7d0',
					borderRadius: '0.5rem',
					padding: '1rem',
				}}
			>
				<h3>🌟 Features</h3>
				<ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#166534' }}>
					<li>Color-coded log levels with ANSI escape codes</li>
					<li>Rich icons and emojis for different log types</li>
					<li>Professional banners and separators</li>
					<li>Entry separation and clear visual hierarchy</li>
					<li>Multiple output formats (console, file, structured)</li>
					<li>Enhanced timestamp formatting</li>
					<li>Metadata and duration tracking</li>
					<li>Stack trace support for errors</li>
				</ul>
			</div>
		</div>
	);
};

export default EnhancedLoggingDemo;
