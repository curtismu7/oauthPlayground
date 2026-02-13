/**
 * @file DebugLogViewerV8.tsx
 * @module v8/pages
 * @description Debug log viewer for persistent redirect URI logs and server log files
 * @version 9.0.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	FiDatabase,
	FiDownload,
	FiExternalLink,
	FiEye,
	FiEyeOff,
	FiFile,
	FiRefreshCw,
	FiTrash2,
} from 'react-icons/fi';
import { type LogFile, LogFileService } from '@/services/logFileService';
import {
	PageHeaderGradients,
	PageHeaderTextColors,
	PageHeaderV8,
} from '@/v8/components/shared/PageHeaderV8';
import { MFARedirectUriServiceV8 } from '@/v8/services/mfaRedirectUriServiceV8';
import { isPopoutWindow, openDebugLogViewerPopout } from '@/v8/utils/debugLogViewerPopoutHelperV8';

// Maximum string length to avoid browser crashes (approximately 50MB)
const MAX_STRING_LENGTH = 50 * 1024 * 1024;

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

// Truncate file content to prevent browser crashes
const truncateFileContent = (
	content: string,
	filename: string
): { content: string; isTruncated: boolean; originalSize: number } => {
	const originalSize = content.length;

	if (content.length <= MAX_STRING_LENGTH) {
		return { content, isTruncated: false, originalSize };
	}

	// Truncate to safe length and add warning
	const truncatedContent = content.substring(0, MAX_STRING_LENGTH);
	const warning =
		`\n\n⚠️ WARNING: File content truncated due to size limit\n` +
		`Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB\n` +
		`Displaying: ${(MAX_STRING_LENGTH / 1024 / 1024).toFixed(2)} MB\n` +
		`File: ${filename}\n` +
		`Use tail mode or reduce line count to see recent content.\n`;

	return {
		content: truncatedContent + warning,
		isTruncated: true,
		originalSize,
	};
};

export const DebugLogViewerV8: React.FC = () => {
	// Source selection
	const [logSource, setLogSource] = useState<LogSource>('file');
	const [availableFiles, setAvailableFiles] = useState<LogFile[]>([]);
	const [selectedFile, setSelectedFile] = useState<string>('authz-redirects.log');
	const [lineCount, setLineCount] = useState<number>(100);

	// Log data
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [fileContent, setFileContent] = useState<string>('');
	const [isContentTruncated, setIsContentTruncated] = useState<boolean>(false);
	const [originalFileSize, setOriginalFileSize] = useState<number>(0);
	const [selectedCategory, setSelectedCategory] = useState<LogCategory>('ALL');
	const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

	// Tail mode
	const [tailMode, setTailMode] = useState(false);
	const eventSourceRef = useRef<EventSource | null>(null);
	const logContainerRef = useRef<HTMLDivElement | null>(null);

	// Loading states
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Generate test localStorage logs for demo purposes
	const generateTestLogs = useCallback(() => {
		const testLogs: LogEntry[] = [
			{
				timestamp: new Date().toISOString(),
				level: 'ERROR',
				category: 'REDIRECT_URI',
				message: 'Failed to validate redirect URI - invalid format',
				url: 'https://localhost:3000/mfa-unified-callback',
				data: { error: 'Invalid URI format', expected: 'https://localhost:3000/*' },
			},
			{
				timestamp: new Date(Date.now() - 60000).toISOString(),
				level: 'WARN',
				category: 'MIGRATION',
				message: 'Deprecated configuration detected',
				url: 'https://localhost:3000/v8/mfa',
				data: { deprecatedField: 'oldConfig', replacement: 'newConfig' },
			},
			{
				timestamp: new Date(Date.now() - 120000).toISOString(),
				level: 'INFO',
				category: 'VALIDATION',
				message: 'Configuration validation completed successfully',
				url: 'https://localhost:3000/v8/flows',
				data: { validations: 5, passed: 5, failed: 0 },
			},
			{
				timestamp: new Date(Date.now() - 180000).toISOString(),
				level: 'ERROR',
				category: 'FLOW_MAPPING',
				message: 'Flow mapping failed - missing required parameter',
				url: 'https://localhost:3000/v8/flows/unified',
				data: { missingParam: 'clientId', flowType: 'authorization_code' },
			},
			{
				timestamp: new Date(Date.now() - 240000).toISOString(),
				level: 'INFO',
				category: 'REDIRECT_URI',
				message: 'Redirect URI validation passed',
				url: 'https://localhost:3000/unified-callback',
				data: { uri: 'https://localhost:3000/unified-callback', valid: true },
			},
		];

		localStorage.setItem('mfa_redirect_debug_log', JSON.stringify(testLogs));
		setLogs(testLogs);
		setFileContent('');
	}, []);

	// Load localStorage logs
	const loadLocalStorageLogs = useCallback(() => {
		try {
			const stored = localStorage.getItem('mfa_redirect_debug_log');
			if (stored) {
				const parsed = JSON.parse(stored) as LogEntry[];
				setLogs(parsed);
				setFileContent('');
			} else {
				// Generate test logs if none exist
				generateTestLogs();
			}
		} catch {
			// Silently handle error
			setLogs([]);
		}
	}, [generateTestLogs]);

	// Load file-based logs
	const loadFileLogs = useCallback(async () => {
		if (!selectedFile) return;

		setIsLoading(true);
		setError(null);

		try {
			const result = await LogFileService.readLogFile(selectedFile, lineCount, true);

			// Truncate content to prevent browser crashes
			const {
				content: safeContent,
				isTruncated,
				originalSize,
			} = truncateFileContent(result.content, selectedFile);

			setFileContent(safeContent);
			setLogs([]);
			setIsContentTruncated(isTruncated);
			setOriginalFileSize(originalSize);

			if (isTruncated) {
				// File was truncated
			} else {
				// File loaded successfully
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load log file';
			setError(errorMessage);
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

				// Load last selected file from localStorage
				const lastSelectedFile = localStorage.getItem('debugLogViewer_lastSelectedFile');
				if (lastSelectedFile && files.some((f) => f.name === lastSelectedFile)) {
					setSelectedFile(lastSelectedFile);
				} else if (files.length > 0) {
					// Default to first available file if saved one doesn't exist
					setSelectedFile(files[0].name);
					// Save the default
					localStorage.setItem('debugLogViewer_lastSelectedFile', files[0].name);
					// Also save to SQLite via API
					try {
						await fetch('/api/settings/debug-log-viewer', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ lastSelectedFile: files[0].name }),
						});
					} catch {
						// Silently fail if SQLite save fails
					}
				}
			} catch {
				// Silently handle error
			}
		};

		loadFiles();
	}, []);

	// Save selected file to localStorage and SQLite when it changes
	useEffect(() => {
		if (selectedFile) {
			localStorage.setItem('debugLogViewer_lastSelectedFile', selectedFile);
			// Also save to SQLite via API
			try {
				fetch('/api/settings/debug-log-viewer', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ lastSelectedFile: selectedFile }),
				});
			} catch {
				// Silently fail if SQLite save fails
			}
		}
		return;
	}, [selectedFile]);

	// Load logs when source or file changes
	useEffect(() => {
		if (logSource === 'localStorage') {
			loadLocalStorageLogs();
		} else {
			void loadFileLogs();
		}
	}, [logSource, loadLocalStorageLogs, loadFileLogs]);

	useEffect(() => {
		if (logSource === 'file' && tailMode && selectedFile) {
			const eventSource = LogFileService.createTailStream(selectedFile);
			eventSourceRef.current = eventSource;

			eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);

					if (data.type === 'connected') {
						// Connected
					} else if (data.type === 'update' && data.lines) {
						setFileContent((prev) => `${prev}\n${data.lines.join('\n')}`);

						// Auto-scroll to bottom
						if (logContainerRef.current) {
							logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
						}
					} else if (data.type === 'error') {
						setError(data.message);
					}
				} catch {
					// Silently handle parse errors
				}
			};

			eventSource.onerror = () => {
				setTailMode(false);
			};

			return () => {
				eventSource.close();
				eventSourceRef.current = null;
			};
		}
		return;
	}, [logSource, tailMode, selectedFile]);

	const clearLogs = () => {
		if (logSource === 'localStorage') {
			MFARedirectUriServiceV8.clearDebugLogs();
			setLogs([]);
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

	const filteredLogs = logs.filter((log) => {
		if (selectedCategory === 'ALL') return true;
		return log.category === selectedCategory;
	});

	const categories: LogCategory[] = [
		'ALL',
		'REDIRECT_URI',
		'MIGRATION',
		'VALIDATION',
		'FLOW_MAPPING',
	];

	const getLevelColor = (level: string) => {
		switch (level) {
			case 'ERROR':
				return '#ef4444';
			case 'WARN':
				return '#f59e0b';
			case 'INFO':
				return '#3b82f6';
			default:
				return '#6b7280';
		}
	};

	// Color scheme for log highlighting
	const LOG_COLORS = {
		// Timestamp
		timestamp: '#6b7280',
		// Log levels
		ERROR: '#ef4444',
		WARN: '#f59e0b',
		INFO: '#3b82f6',
		DEBUG: '#8b5cf6',
		// HTTP methods
		GET: '#10b981',
		POST: '#3b82f6',
		PUT: '#f59e0b',
		DELETE: '#ef4444',
		PATCH: '#8b5cf6',
		// Status codes
		success: '#10b981',
		warning: '#f59e0b',
		error: '#ef4444',
		// Special patterns
		url: '#3b82f6',
		json: '#ec4899',
		number: '#10b981',
		ip: '#8b5cf6',
		module: '#f59e0b',
		badge: '#6366f1',
	};

	// Function to parse and colorize log lines
	const colorizeLogLine = (line: string): React.ReactNode => {
		// Skip empty lines
		if (!line.trim()) return line;

		// Try to parse as JSON first (for authz-redirects.log)
		if (line.startsWith('{') && line.endsWith('}')) {
			try {
				const parsed = JSON.parse(line);
				return (
					<span>
						{parsed.timestamp && (
							<span style={{ color: LOG_COLORS.timestamp }}>
								[{new Date(parsed.timestamp).toLocaleString()}]
							</span>
						)}{' '}
						{parsed.level && (
							<span
								style={{
									color: LOG_COLORS[parsed.level as keyof typeof LOG_COLORS] || LOG_COLORS.INFO,
									fontWeight: 'bold',
								}}
							>
								[{parsed.level}]
							</span>
						)}{' '}
						{parsed.category && (
							<span
								style={{
									color: LOG_COLORS.module,
									fontStyle: 'italic',
								}}
							>
								[{parsed.category}]
							</span>
						)}{' '}
						{parsed.event && <span style={{ color: LOG_COLORS.json }}>Event: {parsed.event}</span>}
						{parsed.startedStep && (
							<span style={{ color: LOG_COLORS.number }}> Started: {parsed.startedStep}</span>
						)}
						{parsed.targetStep && (
							<span style={{ color: LOG_COLORS.number }}> Target: {parsed.targetStep}</span>
						)}
						{parsed.reason && (
							<span style={{ color: LOG_COLORS.warning }}> Reason: {parsed.reason}</span>
						)}
						{parsed.currentUrl && (
							<div>
								<span style={{ color: LOG_COLORS.url }}>Current URL: {parsed.currentUrl}</span>
							</div>
						)}
						{parsed.targetUrl && (
							<div>
								<span style={{ color: LOG_COLORS.url }}>Target URL: {parsed.targetUrl}</span>
							</div>
						)}
						{parsed.sessionId && (
							<span style={{ color: LOG_COLORS.ip }}>
								{' '}
								Session: {parsed.sessionId.slice(0, 8)}...
							</span>
						)}
						{parsed.flowId && (
							<span style={{ color: LOG_COLORS.ip }}> Flow: {parsed.flowId.slice(0, 8)}...</span>
						)}
					</span>
				);
			} catch {
				// Not valid JSON, continue with normal parsing
			}
		}

		// Split line into parts for processing
		const parts = line.split(/\s+/);
		const result: React.ReactNode[] = [];

		// Process each part
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			let styled = false;

			// Timestamp pattern (e.g., 2025-01-13T10:30:45.123Z)
			if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(part)) {
				result.push(
					<span key={i} style={{ color: LOG_COLORS.timestamp }}>
						{part}{' '}
					</span>
				);
				styled = true;
			}
			// Log levels in brackets
			else if (part.startsWith('[') && part.endsWith(']')) {
				const level = part.slice(1, -1).toUpperCase();
				if (['ERROR', 'WARN', 'INFO', 'DEBUG'].includes(level)) {
					result.push(
						<span
							key={i}
							style={{
								color: LOG_COLORS[level as keyof typeof LOG_COLORS] || LOG_COLORS.INFO,
								fontWeight: 'bold',
							}}
						>
							{part}{' '}
						</span>
					);
					styled = true;
				}
			}
			// HTTP methods
			else if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(part)) {
				result.push(
					<span
						key={i}
						style={{
							color: LOG_COLORS[part as keyof typeof LOG_COLORS],
							fontWeight: 'bold',
						}}
					>
						{part}{' '}
					</span>
				);
				styled = true;
			}
			// HTTP status codes
			else if (/^\d{3}$/.test(part)) {
				const code = parseInt(part);
				let color = LOG_COLORS.INFO;
				if (code >= 200 && code < 300) color = LOG_COLORS.success;
				else if (code >= 300 && code < 400) color = LOG_COLORS.warning;
				else if (code >= 400) color = LOG_COLORS.error;

				result.push(
					<span key={i} style={{ color, fontWeight: 'bold' }}>
						{part}{' '}
					</span>
				);
				styled = true;
			}
			// URLs
			else if (part.startsWith('http://') || part.startsWith('https://')) {
				result.push(
					<span key={i} style={{ color: LOG_COLORS.url, textDecoration: 'underline' }}>
						{part}{' '}
					</span>
				);
				styled = true;
			}
			// IP addresses
			else if (/^\d+\.\d+\.\d+\.\d+/.test(part)) {
				result.push(
					<span key={i} style={{ color: LOG_COLORS.ip }}>
						{part}{' '}
					</span>
				);
				styled = true;
			}
			// Module tags (e.g., [🔗 MFA-REDIRECT-SERVICE-V8])
			else if (part.startsWith('[') && part.includes(']') && part.includes('V8')) {
				result.push(
					<span key={i} style={{ color: LOG_COLORS.module, fontStyle: 'italic' }}>
						{part}{' '}
					</span>
				);
				styled = true;
			}
			// JSON-like values
			else if (part.includes('=') && part.includes(':')) {
				result.push(
					<span key={i} style={{ color: LOG_COLORS.json }}>
						{part}{' '}
					</span>
				);
				styled = true;
			}

			if (!styled) {
				result.push(<span key={i}>{part} </span>);
			}
		}

		return result;
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case 'REDIRECT_URI':
				return '#8b5cf6';
			case 'MIGRATION':
				return '#ec4899';
			case 'VALIDATION':
				return '#f59e0b';
			case 'FLOW_MAPPING':
				return '#10b981';
			default:
				return '#6b7280';
		}
	};

	// Group files by category
	const groupedFiles = availableFiles.reduce(
		(acc, file) => {
			if (!acc[file.category]) {
				acc[file.category] = [];
			}
			acc[file.category].push(file);
			return acc;
		},
		{} as Record<string, LogFile[]>
	);

	const categoryLabels: Record<string, string> = {
		server: '📁 Server Logs',
		api: '📊 API Logs',
		frontend: '🎨 Frontend Logs',
		mfa: '📱 MFA Device Logs',
		oauth: '🔗 OAuth Logs',
		other: '📄 Other Logs',
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
			<div
				style={{
					background: 'white',
					borderRadius: '8px',
					padding: '20px',
					marginBottom: '20px',
					boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
				}}
			>
				<div style={{ marginBottom: '15px' }}>
					<span
						style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginRight: '12px' }}
					>
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
						<label
							style={{
								display: 'block',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
								marginBottom: '8px',
							}}
							htmlFor="log-file-select"
						>
							Select Log File:
						</label>
						<select
							id="log-file-select"
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
									{files.map((file) => (
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
						<label
							style={{
								display: 'block',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
								marginBottom: '8px',
							}}
							htmlFor="line-count-buttons"
						>
							Lines to show:
						</label>
						<div style={{ display: 'flex', gap: '8px' }} id="line-count-buttons">
							{[100, 500, 1000].map((count) => (
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
				<div
					style={{
						display: 'flex',
						gap: '15px',
						flexWrap: 'wrap',
						alignItems: 'center',
					}}
				>
					<button
						type="button"
						onClick={() =>
							logSource === 'localStorage' ? loadLocalStorageLogs() : void loadFileLogs()
						}
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
						<label
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								fontSize: '14px',
								cursor: 'pointer',
							}}
						>
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

					{!isPopoutWindow() && (
						<button
							type="button"
							onClick={openDebugLogViewerPopout}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '10px 16px',
								background: '#8b5cf6',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
							}}
							title="Open in new window (stays on top of other apps)"
						>
							<FiExternalLink size={16} />
							Popout
						</button>
					)}

					<div
						style={{
							marginLeft: 'auto',
							fontSize: '14px',
							color: '#6b7280',
							fontWeight: '600',
						}}
					>
						{logSource === 'localStorage'
							? `${filteredLogs.length} ${filteredLogs.length === 1 ? 'entry' : 'entries'}`
							: `${fileContent.split('\n').length} lines`}
					</div>
				</div>

				{/* Category Filter (localStorage only) */}
				{logSource === 'localStorage' && (
					<div
						style={{
							display: 'flex',
							gap: '8px',
							flexWrap: 'wrap',
							marginTop: '15px',
						}}
					>
						<span
							style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginRight: '8px' }}
						>
							Filter by category:
						</span>
						{categories.map((category) => (
							<button
								key={category}
								type="button"
								onClick={() => setSelectedCategory(category)}
								style={{
									padding: '6px 12px',
									background:
										selectedCategory === category ? getCategoryColor(category) : '#f3f4f6',
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
				<div
					style={{
						background: '#fef2f2',
						border: '1px solid #fecaca',
						borderRadius: '8px',
						padding: '16px',
						marginBottom: '20px',
						color: '#991b1b',
						fontSize: '14px',
					}}
				>
					<strong>Error:</strong> {error}
				</div>
			)}

			{/* Log Content */}
			<div
				style={{
					background: 'white',
					borderRadius: '8px',
					padding: '20px',
					boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
				}}
			>
				{logSource === 'localStorage' ? (
					// localStorage logs display
					filteredLogs.length === 0 ? (
						<div
							style={{
								textAlign: 'center',
								padding: '40px',
								color: '#6b7280',
							}}
						>
							<p style={{ fontSize: '16px', marginBottom: '8px' }}>No debug logs found</p>
							<p style={{ fontSize: '14px' }}>Navigate through MFA flows to generate logs</p>
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
											borderTop: `3px solid ${getLevelColor(log.level)}`,
											borderRadius: '6px',
											padding: '12px',
											background: index % 2 === 0 ? '#f9fafb' : '#f3f4f6',
											marginBottom: '8px',
											boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
										}}
									>
										<div
											style={{
												display: 'flex',
												alignItems: 'flex-start',
												gap: '12px',
											}}
										>
											<div
												style={{
													padding: '4px 8px',
													background: getLevelColor(log.level),
													color: 'white',
													borderRadius: '4px',
													fontSize: '11px',
													fontWeight: '700',
													minWidth: '50px',
													textAlign: 'center',
												}}
											>
												{log.level}
											</div>

											<div
												style={{
													padding: '4px 8px',
													background: getCategoryColor(log.category),
													color: 'white',
													borderRadius: '4px',
													fontSize: '11px',
													fontWeight: '600',
													minWidth: '100px',
													textAlign: 'center',
												}}
											>
												{log.category}
											</div>

											<div style={{ flex: 1 }}>
												<div
													style={{
														fontSize: '13px',
														color: '#000000',
														marginBottom: '4px',
														fontWeight: '500',
													}}
												>
													{log.message}
												</div>
												<div
													style={{
														fontSize: '11px',
														color: '#374151',
													}}
												>
													{new Date(log.timestamp).toLocaleString()}
												</div>
												{log.url && (
													<div
														style={{
															fontSize: '11px',
															color: '#374151',
															marginTop: '4px',
															wordBreak: 'break-all',
														}}
													>
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
											<div
												style={{
													marginTop: '12px',
													padding: '12px',
													background: '#1f2937',
													borderRadius: '4px',
													overflow: 'auto',
												}}
											>
												<pre
													style={{
														margin: 0,
														fontSize: '11px',
														color: '#d1d5db',
														fontFamily: 'monospace',
														whiteSpace: 'pre-wrap',
														wordBreak: 'break-word',
													}}
												>
													{JSON.stringify(log.data, null, 2)}
												</pre>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)
				) : // File content display
				fileContent ? (
					<>
						{isContentTruncated && (
							<div
								style={{
									background: '#fef3c7',
									border: '1px solid #f59e0b',
									borderRadius: '4px',
									padding: '12px',
									marginBottom: '16px',
									color: '#92400e',
									fontSize: '13px',
									fontWeight: '500',
								}}
							>
								⚠️ File content truncated due to size limit
								<br />
								Original size: {(originalFileSize / 1024 / 1024).toFixed(2)} MB
								<br />
								Displaying: {(MAX_STRING_LENGTH / 1024 / 1024).toFixed(2)} MB
								<br />
								File: {selectedFile}
								<br />
								Use tail mode or reduce line count to see recent content.
							</div>
						)}
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
							<pre
								style={{
									margin: 0,
									fontSize: '12px',
									color: '#000000',
									fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-word',
									lineHeight: '1.5',
								}}
							>
								{fileContent.split('\n').map((line, index) => (
									<React.Fragment key={index}>
										{colorizeLogLine(line)}
										{'\n'}
									</React.Fragment>
								))}
							</pre>
						</div>
					</>
				) : (
					<div
						style={{
							textAlign: 'center',
							padding: '40px',
							color: '#374151',
						}}
					>
						<p style={{ fontSize: '16px', marginBottom: '8px' }}>No log content</p>
						<p style={{ fontSize: '14px' }}>
							Select a log file and click Refresh to view its contents
						</p>
					</div>
				)}
			</div>

			{/* Info Box */}
			<div
				style={{
					marginTop: '20px',
					padding: '16px',
					background: '#eff6ff',
					border: '1px solid #bfdbfe',
					borderRadius: '8px',
					fontSize: '13px',
					color: '#1e40af',
				}}
			>
				<strong>💡 Tip:</strong>{' '}
				{logSource === 'localStorage'
					? 'These logs persist across page redirects and refreshes. Check here after OAuth callbacks to see what happened during the redirect flow.'
					: 'Enable Tail Mode to see new log entries in real-time as they are written to the file. Large files (>100MB) will automatically use streaming.'}
			</div>
		</div>
	);
};
