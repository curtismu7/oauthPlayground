/**
 * @file DebugLogViewerV8.tsx
 * @module v8/pages
 * @description Debug log viewer for persistent redirect URI logs
 * @version 8.0.0
 */

import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiTrash2, FiDownload, FiEye, FiEyeOff } from 'react-icons/fi';
import { PageHeaderV8, PageHeaderGradients, PageHeaderTextColors } from '@/v8/components/shared/PageHeaderV8';
import { MFARedirectUriServiceV8 } from '@/v8/services/mfaRedirectUriServiceV8';

const MODULE_TAG = '[🔍 DEBUG-LOG-VIEWER-V8]';

interface LogEntry {
	timestamp: string;
	level: 'INFO' | 'WARN' | 'ERROR';
	category: string;
	message: string;
	data?: Record<string, unknown>;
	url: string;
}

type LogCategory = 'ALL' | 'REDIRECT_URI' | 'MIGRATION' | 'VALIDATION' | 'FLOW_MAPPING';

export const DebugLogViewerV8: React.FC = () => {
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [selectedCategory, setSelectedCategory] = useState<LogCategory>('ALL');
	const [autoRefresh, setAutoRefresh] = useState(false);
	const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

	const loadLogs = () => {
		try {
			const stored = localStorage.getItem('mfa_redirect_debug_log');
			if (stored) {
				const parsed = JSON.parse(stored) as LogEntry[];
				setLogs(parsed);
				console.log(`${MODULE_TAG} Loaded ${parsed.length} log entries`);
			} else {
				setLogs([]);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load logs:`, error);
			setLogs([]);
		}
	};

	useEffect(() => {
		loadLogs();
	}, []);

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (autoRefresh) {
			interval = setInterval(loadLogs, 2000);
		}
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [autoRefresh]);

	const clearLogs = () => {
		MFARedirectUriServiceV8.clearDebugLogs();
		setLogs([]);
		console.log(`${MODULE_TAG} Cleared all debug logs`);
	};

	const exportLogs = () => {
		MFARedirectUriServiceV8.exportDebugLogs();
		console.log(`${MODULE_TAG} Exported debug logs`);
	};

	const toggleLogExpansion = (index: number) => {
		const newExpanded = new Set(expandedLogs);
		if (newExpanded.has(index)) {
			newExpanded.delete(index);
		} else {
			newExpanded.add(index);
		}
		setExpandedLogs(newExpanded);
	};

	const filteredLogs = logs.filter(log => {
		if (selectedCategory === 'ALL') return true;
		return log.category === selectedCategory;
	});

	const categories: LogCategory[] = ['ALL', 'REDIRECT_URI', 'MIGRATION', 'VALIDATION', 'FLOW_MAPPING'];

	const getLevelColor = (level: string) => {
		switch (level) {
			case 'ERROR': return '#ef4444';
			case 'WARN': return '#f59e0b';
			case 'INFO': return '#3b82f6';
			default: return '#6b7280';
		}
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case 'REDIRECT_URI': return '#8b5cf6';
			case 'MIGRATION': return '#ec4899';
			case 'VALIDATION': return '#f59e0b';
			case 'FLOW_MAPPING': return '#10b981';
			default: return '#6b7280';
		}
	};

	return (
		<div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
			<PageHeaderV8
				title="Debug Log Viewer"
				subtitle="View persistent debug logs that survive redirects"
				gradient={PageHeaderGradients.unifiedOAuth}
				textColor={PageHeaderTextColors.darkBlue}
			/>

			{/* Controls */}
			<div style={{
				background: 'white',
				borderRadius: '8px',
				padding: '20px',
				marginBottom: '20px',
				boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
			}}>
				<div style={{
					display: 'flex',
					gap: '15px',
					flexWrap: 'wrap',
					alignItems: 'center',
					marginBottom: '15px',
				}}>
					<button
						type="button"
						onClick={loadLogs}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							padding: '10px 16px',
							background: '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
						}}
					>
						<FiRefreshCw size={16} />
						Refresh
					</button>

					<label style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						fontSize: '14px',
						cursor: 'pointer',
					}}>
						<input
							type="checkbox"
							checked={autoRefresh}
							onChange={(e) => setAutoRefresh(e.target.checked)}
							style={{ cursor: 'pointer' }}
						/>
						Auto-refresh (2s)
					</label>

					<button
						type="button"
						onClick={clearLogs}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							padding: '10px 16px',
							background: '#ef4444',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
						}}
					>
						<FiTrash2 size={16} />
						Clear All
					</button>

					<button
						type="button"
						onClick={exportLogs}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							padding: '10px 16px',
							background: '#10b981',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
						}}
					>
						<FiDownload size={16} />
						Export
					</button>

					<div style={{
						marginLeft: 'auto',
						fontSize: '14px',
						color: '#6b7280',
						fontWeight: '600',
					}}>
						{filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
					</div>
				</div>

				{/* Category Filter */}
				<div style={{
					display: 'flex',
					gap: '8px',
					flexWrap: 'wrap',
				}}>
					<span style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginRight: '8px' }}>
						Filter by category:
					</span>
					{categories.map(category => (
						<button
							key={category}
							type="button"
							onClick={() => setSelectedCategory(category)}
							style={{
								padding: '6px 12px',
								background: selectedCategory === category ? getCategoryColor(category) : '#f3f4f6',
								color: selectedCategory === category ? 'white' : '#374151',
								border: 'none',
								borderRadius: '4px',
								fontSize: '13px',
								fontWeight: '600',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
							}}
						>
							{category}
						</button>
					))}
				</div>
			</div>

			{/* Log Entries */}
			<div style={{
				background: 'white',
				borderRadius: '8px',
				padding: '20px',
				boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
			}}>
				{filteredLogs.length === 0 ? (
					<div style={{
						textAlign: 'center',
						padding: '40px',
						color: '#6b7280',
					}}>
						<p style={{ fontSize: '16px', marginBottom: '8px' }}>No debug logs found</p>
						<p style={{ fontSize: '14px' }}>
							Navigate through MFA flows to generate logs
						</p>
					</div>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						{filteredLogs.map((log, index) => {
							const isExpanded = expandedLogs.has(index);
							const hasData = log.data && Object.keys(log.data).length > 0;

							return (
								<div
									key={index}
									style={{
										border: '1px solid #e5e7eb',
										borderRadius: '6px',
										padding: '12px',
										background: '#f9fafb',
									}}
								>
									<div style={{
										display: 'flex',
										alignItems: 'flex-start',
										gap: '12px',
									}}>
										{/* Level Badge */}
										<div style={{
											padding: '4px 8px',
											background: getLevelColor(log.level),
											color: 'white',
											borderRadius: '4px',
											fontSize: '11px',
											fontWeight: '700',
											minWidth: '50px',
											textAlign: 'center',
										}}>
											{log.level}
										</div>

										{/* Category Badge */}
										<div style={{
											padding: '4px 8px',
											background: getCategoryColor(log.category),
											color: 'white',
											borderRadius: '4px',
											fontSize: '11px',
											fontWeight: '600',
											minWidth: '100px',
											textAlign: 'center',
										}}>
											{log.category}
										</div>

										{/* Content */}
										<div style={{ flex: 1 }}>
											<div style={{
												fontSize: '13px',
												color: '#1f2937',
												marginBottom: '4px',
												fontWeight: '500',
											}}>
												{log.message}
											</div>
											<div style={{
												fontSize: '11px',
												color: '#6b7280',
											}}>
												{new Date(log.timestamp).toLocaleString()}
											</div>
											{log.url && (
												<div style={{
													fontSize: '11px',
													color: '#6b7280',
													marginTop: '4px',
													wordBreak: 'break-all',
												}}>
													URL: {log.url}
												</div>
											)}
										</div>

										{/* Expand Button */}
										{hasData && (
											<button
												type="button"
												onClick={() => toggleLogExpansion(index)}
												style={{
													padding: '6px',
													background: 'transparent',
													border: '1px solid #d1d5db',
													borderRadius: '4px',
													cursor: 'pointer',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
												}}
												title={isExpanded ? 'Hide details' : 'Show details'}
											>
												{isExpanded ? <FiEyeOff size={14} /> : <FiEye size={14} />}
											</button>
										)}
									</div>

									{/* Expanded Data */}
									{isExpanded && hasData && (
										<div style={{
											marginTop: '12px',
											padding: '12px',
											background: '#1f2937',
											borderRadius: '4px',
											overflow: 'auto',
										}}>
											<pre style={{
												margin: 0,
												fontSize: '11px',
												color: '#d1d5db',
												fontFamily: 'monospace',
												whiteSpace: 'pre-wrap',
												wordBreak: 'break-word',
											}}>
												{JSON.stringify(log.data, null, 2)}
											</pre>
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Info Box */}
			<div style={{
				marginTop: '20px',
				padding: '16px',
				background: '#eff6ff',
				border: '1px solid #bfdbfe',
				borderRadius: '8px',
				fontSize: '13px',
				color: '#1e40af',
			}}>
				<strong>💡 Tip:</strong> These logs persist across page redirects and refreshes. 
				Check here after OAuth callbacks to see what happened during the redirect flow.
			</div>
		</div>
	);
};
