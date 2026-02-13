/**
 * @file DebugLogViewerV8.tsx
 * @module v8/pages
 * @description Debug log viewer for persistent redirect URI logs and server log files
 * @version 9.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiRefreshCw, FiTrash2, FiDownload, FiEye, FiEyeOff, FiFile, FiDatabase } from 'react-icons/fi';
import { PageHeaderV8, PageHeaderGradients, PageHeaderTextColors } from '@/v8/components/shared/PageHeaderV8';
import { MFARedirectUriServiceV8 } from '@/v8/services/mfaRedirectUriServiceV8';
import { LogFileService, type LogFile } from '@/services/logFileService';

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
type LogSource = 'localStorage' | 'file';

export const DebugLogViewerV8: React.FC = () => {
	// Source selection
	const [logSource, setLogSource] = useState<LogSource>('file');
	const [availableFiles, setAvailableFiles] = useState<LogFile[]>([]);
	const [selectedFile, setSelectedFile] = useState<string>('server.log');
	const [lineCount, setLineCount] = useState<number>(100);
	
	// Log data
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [fileContent, setFileContent] = useState<string>('');
	const [selectedCategory, setSelectedCategory] = useState<LogCategory>('ALL');
	const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
	
	// Tail mode
	const [tailMode, setTailMode] = useState(false);
	const eventSourceRef = useRef<EventSource | null>(null);
	const logContainerRef = useRef<HTMLDivElement | null>(null);
	
	// Loading states
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load localStorage logs
	const loadLocalStorageLogs = useCallback(() => {
		try {
			const stored = localStorage.getItem('mfa_redirect_debug_log');
			if (stored) {
				const parsed = JSON.parse(stored) as LogEntry[];
				setLogs(parsed);
				setFileContent('');
				console.log(`${MODULE_TAG} Loaded ${parsed.length} localStorage log entries`);
			} else {
				setLogs([]);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load localStorage logs:`, error);
			setLogs([]);
		}
	}, []);

	// Load file-based logs
	const loadFileLogs = useCallback(async () => {
		if (!selectedFile) return;
		
		setIsLoading(true);
		setError(null);
		
		try {
			const result = await LogFileService.readLogFile(selectedFile, lineCount, true);
			setFileContent(result.content);
			setLogs([]);
			console.log(`${MODULE_TAG} Loaded ${result.totalLines} lines from ${selectedFile}`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load log file';
			setError(errorMessage);
			console.error(`${MODULE_TAG} Error loading file:`, err);
		} finally {
			setIsLoading(false);
		}
	}, [selectedFile, lineCount]);

	// Load available log files
	useEffect(() => {
		const loadFiles = async () => {
			try {
				const files = await LogFileService.listLogFiles();
				setAvailableFiles(files);
				console.log(`${MODULE_TAG} Found ${files.length} log files`);
			} catch (err) {
				console.error(`${MODULE_TAG} Failed to list log files:`, err);
			}
		};
		
		loadFiles();
	}, []);

	// Load logs when source or file changes
	useEffect(() => {
		if (logSource === 'localStorage') {
			loadLocalStorageLogs();
		} else {
			void loadFileLogs();
		}
	}, [logSource, selectedFile, lineCount, loadLocalStorageLogs, loadFileLogs]);

	// Setup tail mode
	useEffect(() => {
		if (logSource === 'file' && tailMode && selectedFile) {
			console.log(`${MODULE_TAG} Starting tail mode for ${selectedFile}`);
			
			const eventSource = LogFileService.createTailStream(selectedFile);
			eventSourceRef.current = eventSource;
			
			eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					
					if (data.type === 'connected') {
						console.log(`${MODULE_TAG} Tail stream connected`);
					} else if (data.type === 'update' && data.lines) {
						setFileContent(prev => prev + '\n' + data.lines.join('\n'));
						
						// Auto-scroll to bottom
						if (logContainerRef.current) {
							logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
						}
					} else if (data.type === 'error') {
						console.error(`${MODULE_TAG} Tail stream error:`, data.message);
						setError(data.message);
					}
				} catch (err) {
					console.error(`${MODULE_TAG} Failed to parse tail event:`, err);
				}
			};
			
			eventSource.onerror = () => {
				console.error(`${MODULE_TAG} Tail stream connection error`);
				setTailMode(false);
			};
			
			return () => {
				console.log(`${MODULE_TAG} Closing tail stream`);
				eventSource.close();
				eventSourceRef.current = null;
			};
		}
	}, [logSource, tailMode, selectedFile]);

	const clearLogs = () => {
		if (logSource === 'localStorage') {
			MFARedirectUriServiceV8.clearDebugLogs();
			setLogs([]);
			console.log(`${MODULE_TAG} Cleared localStorage logs`);
		} else {
			setFileContent('');
		}
	};

	const exportLogs = () => {
		if (logSource === 'localStorage') {
			MFARedirectUriServiceV8.exportDebugLogs();
		} else {
			// Export file content
			const blob = new Blob([fileContent], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${selectedFile}-export-${new Date().toISOString().slice(0, 10)}.txt`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
		console.log(`${MODULE_TAG} Exported logs`);
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

	// Group files by category
	const groupedFiles = availableFiles.reduce((acc, file) => {
		if (!acc[file.category]) {
			acc[file.category] = [];
		}
		acc[file.category].push(file);
		return acc;
	}, {} as Record<string, LogFile[]>);

	const categoryLabels: Record<string, string> = {
		server: '📁 Server Logs',
		api: '📊 API Logs',
		frontend: '🎨 Frontend Logs',
		mfa: '📱 MFA Device Logs',
		oauth: '🔗 OAuth Logs',
		other: '📄 Other Logs'
	};

	return (
		<div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
			<PageHeaderV8
				title="Debug Log Viewer"
				subtitle="View persistent debug logs and server log files with live tail"
				gradient={PageHeaderGradients.unifiedOAuth}
				textColor={PageHeaderTextColors.darkBlue}
			/>

			{/* Source Selection */}
			<div style={{
				background: 'white',
				borderRadius: '8px',
				padding: '20px',
				marginBottom: '20px',
				boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
			}}>
				<div style={{ marginBottom: '15px' }}>
					<span style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginRight: '12px' }}>
						Log Source:
					</span>
					<button
						type="button"
						onClick={() => setLogSource('localStorage')}
						style={{
							padding: '8px 16px',
							background: logSource === 'localStorage' ? '#3b82f6' : '#f3f4f6',
							color: logSource === 'localStorage' ? 'white' : '#374151',
							border: 'none',
							borderRadius: '6px 0 0 6px',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
							display: 'inline-flex',
							alignItems: 'center',
							gap: '6px',
						}}
					>
						<FiDatabase size={16} />
						localStorage
					</button>
					<button
						type="button"
						onClick={() => setLogSource('file')}
						style={{
							padding: '8px 16px',
							background: logSource === 'file' ? '#3b82f6' : '#f3f4f6',
							color: logSource === 'file' ? 'white' : '#374151',
							border: 'none',
							borderRadius: '0 6px 6px 0',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
							display: 'inline-flex',
							alignItems: 'center',
							gap: '6px',
						}}
					>
						<FiFile size={16} />
						File
					</button>
				</div>

				{/* File Selection */}
				{logSource === 'file' && (
					<div style={{ marginBottom: '15px' }}>
						<label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
							Select Log File:
						</label>
						<select
							value={selectedFile}
							onChange={(e) => setSelectedFile(e.target.value)}
							style={{
								width: '100%',
								padding: '10px',
								fontSize: '14px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								background: 'white',
								cursor: 'pointer',
							}}
						>
							{Object.entries(groupedFiles).map(([category, files]) => (
								<optgroup key={category} label={categoryLabels[category] || category}>
									{files.map(file => (
										<option key={file.name} value={file.name}>
											{file.name} ({LogFileService.formatFileSize(file.size)})
											{LogFileService.isLargeFile(file.size) && ' ⚠️ Large'}
										</option>
									))}
								</optgroup>
							))}
						</select>
					</div>
				)}

				{/* Line Count Selection */}
				{logSource === 'file' && (
					<div style={{ marginBottom: '15px' }}>
						<label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
							Lines to show:
						</label>
						<div style={{ display: 'flex', gap: '8px' }}>
							{[100, 500, 1000].map(count => (
								<button
									key={count}
									type="button"
									onClick={() => setLineCount(count)}
									style={{
										padding: '8px 16px',
										background: lineCount === count ? '#3b82f6' : '#f3f4f6',
										color: lineCount === count ? 'white' : '#374151',
										border: 'none',
										borderRadius: '6px',
										fontSize: '14px',
										fontWeight: '600',
										cursor: 'pointer',
									}}
								>
									{count}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Controls */}
				<div style={{
					display: 'flex',
					gap: '15px',
					flexWrap: 'wrap',
					alignItems: 'center',
				}}>
					<button
						type="button"
						onClick={() => logSource === 'localStorage' ? loadLocalStorageLogs() : void loadFileLogs()}
						disabled={isLoading}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							padding: '10px 16px',
							background: isLoading ? '#9ca3af' : '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '14px',
							fontWeight: '600',
							cursor: isLoading ? 'not-allowed' : 'pointer',
						}}
					>
						<FiRefreshCw size={16} />
						{isLoading ? 'Loading...' : 'Refresh'}
					</button>

					{logSource === 'file' && (
						<label style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							fontSize: '14px',
							cursor: 'pointer',
						}}>
							<input
								type="checkbox"
								checked={tailMode}
								onChange={(e) => setTailMode(e.target.checked)}
								style={{ cursor: 'pointer' }}
							/>
							Tail Mode (Live - 1s refresh)
						</label>
					)}

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
						Clear
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
						{logSource === 'localStorage' 
							? `${filteredLogs.length} ${filteredLogs.length === 1 ? 'entry' : 'entries'}`
							: `${fileContent.split('\n').length} lines`
						}
					</div>
				</div>

				{/* Category Filter (localStorage only) */}
				{logSource === 'localStorage' && (
					<div style={{
						display: 'flex',
						gap: '8px',
						flexWrap: 'wrap',
						marginTop: '15px',
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
				)}
			</div>

			{/* Error Display */}
			{error && (
				<div style={{
					background: '#fef2f2',
					border: '1px solid #fecaca',
					borderRadius: '8px',
					padding: '16px',
					marginBottom: '20px',
					color: '#991b1b',
					fontSize: '14px',
				}}>
					<strong>Error:</strong> {error}
				</div>
			)}

			{/* Log Content */}
			<div style={{
				background: 'white',
				borderRadius: '8px',
				padding: '20px',
				boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
			}}>
				{logSource === 'localStorage' ? (
					// localStorage logs display
					filteredLogs.length === 0 ? (
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
					)
				) : (
					// File content display
					fileContent ? (
						<div
							ref={logContainerRef}
							style={{
								background: '#1f2937',
								borderRadius: '4px',
								padding: '16px',
								maxHeight: '600px',
								overflow: 'auto',
							}}
						>
							<pre style={{
								margin: 0,
								fontSize: '12px',
								color: '#d1d5db',
								fontFamily: 'monospace',
								whiteSpace: 'pre-wrap',
								wordBreak: 'break-word',
								lineHeight: '1.5',
							}}>
								{fileContent}
							</pre>
						</div>
					) : (
						<div style={{
							textAlign: 'center',
							padding: '40px',
							color: '#6b7280',
						}}>
							<p style={{ fontSize: '16px', marginBottom: '8px' }}>No log content</p>
							<p style={{ fontSize: '14px' }}>
								Select a log file and click Refresh to view its contents
							</p>
						</div>
					)
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
				<strong>💡 Tip:</strong> {logSource === 'localStorage' 
					? 'These logs persist across page redirects and refreshes. Check here after OAuth callbacks to see what happened during the redirect flow.'
					: 'Enable Tail Mode to see new log entries in real-time as they are written to the file. Large files (>100MB) will automatically use streaming.'
				}
			</div>
		</div>
	);
};
