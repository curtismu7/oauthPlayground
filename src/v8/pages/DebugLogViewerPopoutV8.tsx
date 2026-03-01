/**
 * @file DebugLogViewerPopoutV8.tsx
 * @module v8/pages
 * @description Popout version of Debug Log Viewer that can be dragged outside browser window
 * @version 9.9.6
 */

import { FiDatabase, FiDownload, FiEye, FiEyeOff, FiFile, FiRefreshCw, FiTrash2 } from '@icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { type LogFile, LogFileService } from '@/services/logFileService';
// PageHeaderV8 removed - using compact inline header for space efficiency
import { MFARedirectUriServiceV8 } from '@/v8/services/mfaRedirectUriServiceV8';

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

type LogCategory =
	| 'ALL'
	| 'REDIRECT_URI'
	| 'CALLBACK_DEBUG'
	| 'MIGRATION'
	| 'VALIDATION'
	| 'FLOW_MAPPING';
type LogSource = 'localStorage' | 'indexedDB' | 'sqlite' | 'file' | 'callback-debug';

interface SourceOption {
	value: LogSource;
	label: string;
	icon: React.ReactNode;
}

interface IndexedDBTarget {
	label: string;
	dbName: string;
	storeName: string;
}

interface SQLiteTarget {
	label: string;
	endpoint: string;
}

const INDEXED_DB_TARGETS: IndexedDBTarget[] = [
	{
		label: 'Enhanced Credentials (V8)',
		dbName: 'OAuthPlayground_Enhanced',
		storeName: 'enhanced_credentials',
	},
	{ label: 'MFA Redirect Logs', dbName: 'OAuthPlayground_MFA', storeName: 'redirect_logs' },
	{ label: 'Default Logs', dbName: 'OAuthPlayground', storeName: 'logs' },
];

const SQLITE_TARGETS: SQLiteTarget[] = [
	{ label: 'Debug Log Viewer Settings', endpoint: '/api/settings/debug-log-viewer' },
	{ label: 'SQLite Credentials Stats', endpoint: '/api/credentials/sqlite/stats' },
	{ label: 'SQLite Credentials List', endpoint: '/api/credentials/sqlite/list' },
];

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

export const DebugLogViewerPopoutV8: React.FC = () => {
	// Source selection
	const [logSource, setLogSource] = useState<LogSource>('file');
	const [availableFiles, setAvailableFiles] = useState<LogFile[]>([]);
	const [selectedFile, setSelectedFile] = useState<string>('authz-redirects.log');
	const [availableLocalStorageLogs, setAvailableLocalStorageLogs] = useState<string[]>([]);
	const [selectedLocalStorageLog, setSelectedLocalStorageLog] =
		useState<string>('mfa_redirect_debug_log');
	const [selectedIndexedDBTarget, setSelectedIndexedDBTarget] = useState<string>(
		'OAuthPlayground_Enhanced|enhanced_credentials'
	);
	const [selectedSQLiteTarget, setSelectedSQLiteTarget] = useState<string>(
		'/api/settings/debug-log-viewer'
	);
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

	const sourceOptions: SourceOption[] = [
		{ value: 'localStorage', label: 'localStorage', icon: <FiDatabase size={16} /> },
		{ value: 'indexedDB', label: 'IndexedDB', icon: <FiDatabase size={16} /> },
		{ value: 'sqlite', label: 'SQLite', icon: <FiDatabase size={16} /> },
		{ value: 'file', label: 'File', icon: <FiFile size={16} /> },
		{ value: 'callback-debug', label: 'Callback Debug', icon: <FiEye size={16} /> },
	];

	const normalizeToLogEntries = useCallback(
		(payload: unknown, category = 'VALIDATION', sourceUrl = window.location.href): LogEntry[] => {
			const toEntry = (item: unknown): LogEntry => {
				if (typeof item === 'string') {
					return {
						timestamp: new Date().toISOString(),
						level: 'INFO',
						category,
						message: item,
						url: sourceUrl,
					};
				}

				if (item && typeof item === 'object') {
					const record = item as Record<string, unknown>;
					const levelRaw = String(record.level ?? record.severity ?? 'INFO').toUpperCase();
					const level: LogEntry['level'] =
						levelRaw === 'ERROR'
							? 'ERROR'
							: levelRaw === 'WARN' || levelRaw === 'WARNING'
								? 'WARN'
								: 'INFO';

					return {
						timestamp:
							typeof record.timestamp === 'string' ? record.timestamp : new Date().toISOString(),
						level,
						category: typeof record.category === 'string' ? record.category : category,
						message:
							typeof record.message === 'string'
								? record.message
								: `Record loaded from ${category}`,
						data: record,
						url: typeof record.url === 'string' ? record.url : sourceUrl,
					};
				}

				return {
					timestamp: new Date().toISOString(),
					level: 'INFO',
					category,
					message: String(item),
					url: sourceUrl,
				};
			};

			if (Array.isArray(payload)) {
				return payload.map((item) => toEntry(item));
			}

			if (payload && typeof payload === 'object') {
				const record = payload as Record<string, unknown>;

				if (Array.isArray(record.logs)) {
					return record.logs.map((item) => toEntry(item));
				}
				if (Array.isArray(record.entries)) {
					return record.entries.map((item) => toEntry(item));
				}
				if (Array.isArray(record.data)) {
					return record.data.map((item) => toEntry(item));
				}

				return [toEntry(record)];
			}

			return [toEntry(payload)];
		},
		[]
	);

	// Keyboard shortcuts
	const scrollToTop = useCallback(() => {
		if (logContainerRef.current) {
			logContainerRef.current.scrollTop = 0;
		}
	}, []);

	const scrollToBottom = useCallback(() => {
		if (logContainerRef.current) {
			logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
		}
	}, []);

	const refreshLogsShortcut = useCallback(() => {
		if (logSource === 'file') {
			// Trigger file reload by calling the existing load function
			const loadButton = document.querySelector(
				'button[onClick*="loadFileContent"]'
			) as HTMLButtonElement;
			if (loadButton) {
				loadButton.click();
			}
		} else {
			// Trigger localStorage reload
			const loadButton = document.querySelector(
				'button[onClick*="loadLocalStorageLogs"]'
			) as HTMLButtonElement;
			if (loadButton) {
				loadButton.click();
			}
		}
	}, [logSource]);

	const clearLogsShortcut = useCallback(() => {
		// Find and click the existing clear button
		const clearButton = document.querySelector('button[onClick*="clearLogs"]') as HTMLButtonElement;
		if (clearButton) {
			clearButton.click();
		}
	}, []);

	// Handle keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Only handle shortcuts when not typing in input fields
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement ||
				event.target instanceof HTMLSelectElement
			) {
				return;
			}

			// Arrow keys for navigation (no modifier needed)
			switch (event.key) {
				case 'ArrowUp':
				case 'Home':
					event.preventDefault();
					scrollToTop();
					break;
				case 'ArrowDown':
				case 'End':
					event.preventDefault();
					scrollToBottom();
					break;
			}

			// Ctrl/Cmd + key combinations for actions
			if (event.ctrlKey || event.metaKey) {
				switch (event.key) {
					case 'r':
					case 'R':
						event.preventDefault();
						refreshLogsShortcut();
						break;
					case 'Delete':
					case 'Backspace':
						event.preventDefault();
						clearLogsShortcut();
						break;
				}
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [scrollToTop, scrollToBottom, refreshLogsShortcut, clearLogsShortcut]);

	// Generate test localStorage logs for demo purposes
	const generateTestLogs = useCallback(() => {
		const testLogs: LogEntry[] = [
			{
				timestamp: new Date().toISOString(),
				level: 'ERROR',
				category: 'REDIRECT_URI',
				message: 'Failed to validate redirect URI - invalid format',
				url: 'https://localhost:3000/v8/unified-mfa-callback',
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
		];

		localStorage.setItem('mfa_redirect_debug_log', JSON.stringify(testLogs));
		setLogs(testLogs);
		setFileContent('');
	}, []);

	// Load localStorage logs
	const loadLocalStorageLogs = useCallback(() => {
		try {
			const stored = localStorage.getItem(selectedLocalStorageLog);
			if (stored) {
				const parsed = JSON.parse(stored) as unknown;
				setLogs(normalizeToLogEntries(parsed, 'REDIRECT_URI', window.location.href));
				setFileContent('');
			} else {
				// Generate test logs if none exist
				generateTestLogs();
			}
		} catch {
			// Silently handle error
			setLogs([]);
		}
	}, [generateTestLogs, normalizeToLogEntries, selectedLocalStorageLog]);

	const loadIndexedDBLogs = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const [dbName, storeName] = selectedIndexedDBTarget.split('|');
			if (!dbName || !storeName) throw new Error('Invalid IndexedDB target selected');

			const rows = await new Promise<unknown[]>((resolve, reject) => {
				const request = indexedDB.open(dbName);
				request.onerror = () =>
					reject(request.error ?? new Error(`Failed to open IndexedDB: ${dbName}`));
				request.onsuccess = () => {
					try {
						const db = request.result;
						const availableStores = Array.from(db.objectStoreNames);
						if (availableStores.length === 0) {
							console.warn(
								`[IndexedDB] No object stores found in "${dbName}". Database may be empty.`
							);
							db.close();
							resolve([]); // Graceful fallback: empty result instead of hard error
							return;
						}

						const resolvedStoreName = db.objectStoreNames.contains(storeName)
							? storeName
							: availableStores[0];

						if (resolvedStoreName !== storeName) {
							setSelectedIndexedDBTarget(`${dbName}|${resolvedStoreName}`);
						}

						const tx = db.transaction(resolvedStoreName, 'readonly');
						const store = tx.objectStore(resolvedStoreName);
						const getAll = store.getAll();
						getAll.onerror = () =>
							reject(getAll.error ?? new Error('Failed to read IndexedDB records'));
						getAll.onsuccess = () => {
							resolve((getAll.result as unknown[]) ?? []);
							db.close();
						};
					} catch (e) {
						reject(e);
					}
				};
			});

			setLogs(normalizeToLogEntries(rows, 'VALIDATION', `indexeddb://${dbName}/${storeName}`));
			setFileContent('');
		} catch (err) {
			setLogs([]);
			setError(err instanceof Error ? err.message : 'Failed to load IndexedDB logs');
		} finally {
			setIsLoading(false);
		}
	}, [normalizeToLogEntries, selectedIndexedDBTarget]);

	const loadSQLiteLogs = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(selectedSQLiteTarget, {
				headers: { Accept: 'application/json' },
			});
			if (!response.ok) {
				throw new Error(`SQLite endpoint failed (${response.status}): ${response.statusText}`);
			}

			const data = (await response.json()) as unknown;
			setLogs(normalizeToLogEntries(data, 'MIGRATION', selectedSQLiteTarget));
			setFileContent('');
		} catch (err) {
			setLogs([]);
			setError(err instanceof Error ? err.message : 'Failed to load SQLite logs');
		} finally {
			setIsLoading(false);
		}
	}, [normalizeToLogEntries, selectedSQLiteTarget]);

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

	// Load callback debug logs from API
	const loadCallbackDebugLogs = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			// Get today's callback debug log
			const today = new Date().toISOString().split('T')[0];
			const response = await fetch(`/api/logs/callback-debug-${today}.log`);

			if (!response.ok) {
				if (response.status === 404) {
					setError('No callback debug logs found for today. Try triggering an MFA callback first.');
				} else {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}
				return;
			}

			const content = await response.text();

			// Parse each line as JSON and convert to log entries
			const lines = content
				.trim()
				.split('\n')
				.filter((line) => line.trim());
			const logEntries: LogEntry[] = [];

			for (const line of lines) {
				try {
					const parsed = JSON.parse(line);
					const entry: LogEntry = {
						timestamp: parsed.timestamp || new Date().toISOString(),
						level: 'INFO',
						category: 'CALLBACK_DEBUG',
						message: `${parsed.event}: ${parsed.data?.currentPath || 'Unknown path'}`,
						data: parsed,
						url: parsed.url || window.location.href,
					};
					logEntries.push(entry);
				} catch {
					// If line is not valid JSON, add it as a simple log entry
					const entry: LogEntry = {
						timestamp: new Date().toISOString(),
						level: 'WARN',
						category: 'CALLBACK_DEBUG',
						message: `Invalid JSON: ${line.substring(0, 100)}...`,
						data: { rawLine: line },
						url: window.location.href,
					};
					logEntries.push(entry);
				}
			}

			// Sort by timestamp (newest first)
			logEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

			setLogs(logEntries);
			setFileContent(''); // Clear file content since we're using structured logs
			setIsContentTruncated(false);
			setOriginalFileSize(content.length);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to load callback debug logs';
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

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

	useEffect(() => {
		const keys = Object.keys(localStorage).filter((k) => k.toLowerCase().includes('log'));
		if (!keys.includes('mfa_redirect_debug_log')) {
			keys.unshift('mfa_redirect_debug_log');
		}
		setAvailableLocalStorageLogs(keys);
		if (keys.length > 0 && !keys.includes(selectedLocalStorageLog)) {
			setSelectedLocalStorageLog(keys[0]);
		}
	}, [selectedLocalStorageLog]);

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
	}, [selectedFile]);

	// Load logs when source or file changes
	useEffect(() => {
		if (logSource === 'localStorage') {
			loadLocalStorageLogs();
		} else if (logSource === 'indexedDB') {
			void loadIndexedDBLogs();
		} else if (logSource === 'sqlite') {
			void loadSQLiteLogs();
		} else if (logSource === 'callback-debug') {
			void loadCallbackDebugLogs();
		} else {
			void loadFileLogs();
		}
	}, [
		logSource,
		loadLocalStorageLogs,
		loadIndexedDBLogs,
		loadSQLiteLogs,
		loadFileLogs,
		loadCallbackDebugLogs,
	]);

	// Setup tail mode
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

		return undefined;
	}, [logSource, tailMode, selectedFile]);

	const clearLogs = () => {
		if (logSource === 'localStorage') {
			MFARedirectUriServiceV8.clearDebugLogs();
			setLogs([]);
		} else if (logSource === 'file') {
			setFileContent('');
		} else {
			setLogs([]);
		}
	};

	const getTransactionStage = (text: string): 'START' | 'END' => {
		const lower = text.toLowerCase();
		if (
			/(end|complete|completed|success|successful|done|fail|failed|error|finish|finished|closed|stop|stopped|response)/.test(
				lower
			)
		) {
			return 'END';
		}

		return 'START';
	};

	const getIsoTimestampFromLine = (line: string): string | null => {
		const isoMatch = line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/);
		if (isoMatch?.[0]) {
			const parsed = new Date(isoMatch[0]);
			if (!Number.isNaN(parsed.getTime())) {
				return parsed.toISOString();
			}
		}

		return null;
	};

	const buildTransactionMarker = (timestamp: string, description: string, source: string) => {
		const safeTimestamp = new Date(timestamp);
		const markerTime = Number.isNaN(safeTimestamp.getTime())
			? new Date().toLocaleString()
			: safeTimestamp.toLocaleString();
		const stage = getTransactionStage(description);
		const compactDescription =
			description.length > 140 ? `${description.slice(0, 137)}...` : description;
		return `* ${markerTime} | ${stage} | ${source}: ${compactDescription}`;
	};

	const exportLogs = () => {
		if (logSource === 'localStorage') {
			MFARedirectUriServiceV8.exportDebugLogs();
		} else if (logSource === 'file') {
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
		} else {
			const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${logSource}-logs-export-${new Date().toISOString().slice(0, 10)}.json`;
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
				const code = parseInt(part, 10);
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
		<div
			style={{
				padding: '20px',
				maxWidth: '1600px',
				margin: '0 auto',
				minHeight: '100vh',
				height: '100vh',
				background: '#f3f4f6',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<div
				style={{
					background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
					padding: '8px 16px',
					borderRadius: '6px',
					marginBottom: '12px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<div>
					<h1 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'white' }}>
						Debug Log Viewer
					</h1>
					<p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
						Live tail • Popout window
					</p>
				</div>
			</div>

			{/* Compact Keyboard Shortcuts */}
			<div
				style={{
					background: '#f8fafc',
					border: '1px solid #e2e8f0',
					borderRadius: '4px',
					padding: '6px 12px',
					marginBottom: '10px',
					display: 'flex',
					alignItems: 'center',
					gap: '12px',
					fontSize: '11px',
					color: '#64748b',
				}}
			>
				<span style={{ fontWeight: '600', color: '#475569' }}>⌨️</span>
				<span>↑↓: Scroll</span>
				<span>•</span>
				<span>R: Refresh</span>
				<span>•</span>
				<span>Del: Clear</span>
			</div>

			{/* Source Selection */}
			<div
				style={{
					background: 'white',
					borderRadius: '6px',
					padding: '10px 12px',
					marginBottom: '10px',
					border: '1px solid #e2e8f0',
				}}
			>
				<div style={{ marginBottom: '8px' }}>
					<span
						style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginRight: '10px' }}
					>
						Source:
					</span>
					{sourceOptions.map((option, index) => (
						<button
							key={option.value}
							type="button"
							onClick={() => setLogSource(option.value)}
							style={{
								padding: '4px 10px',
								background: logSource === option.value ? '#3b82f6' : '#f3f4f6',
								color: logSource === option.value ? 'white' : '#374151',
								border: 'none',
								borderRadius:
									index === 0
										? '4px 0 0 4px'
										: index === sourceOptions.length - 1
											? '0 4px 4px 0'
											: '0',
								fontSize: '11px',
								fontWeight: '600',
								cursor: 'pointer',
								display: 'inline-flex',
								alignItems: 'center',
								gap: '4px',
							}}
						>
							{option.icon}
							{option.label}
						</button>
					))}
				</div>

				{logSource === 'localStorage' && (
					<div style={{ marginBottom: '8px' }}>
						<label
							style={{
								display: 'block',
								fontSize: '11px',
								fontWeight: '600',
								color: '#374151',
								marginBottom: '4px',
							}}
							htmlFor="localstorage-log-select"
						>
							LocalStorage Key:
						</label>
						<select
							id="localstorage-log-select"
							value={selectedLocalStorageLog}
							onChange={(e) => setSelectedLocalStorageLog(e.target.value)}
							style={{
								width: '100%',
								padding: '6px 8px',
								fontSize: '12px',
								border: '1px solid #d1d5db',
								borderRadius: '4px',
								background: 'white',
							}}
						>
							{availableLocalStorageLogs.map((key) => (
								<option key={key} value={key}>
									{key}
								</option>
							))}
						</select>
					</div>
				)}

				{logSource === 'indexedDB' && (
					<div style={{ marginBottom: '8px' }}>
						<label
							style={{
								display: 'block',
								fontSize: '11px',
								fontWeight: '600',
								color: '#374151',
								marginBottom: '4px',
							}}
							htmlFor="indexeddb-target-select"
						>
							IndexedDB Target:
						</label>
						<select
							id="indexeddb-target-select"
							value={selectedIndexedDBTarget}
							onChange={(e) => setSelectedIndexedDBTarget(e.target.value)}
							style={{
								width: '100%',
								padding: '6px 8px',
								fontSize: '12px',
								border: '1px solid #d1d5db',
								borderRadius: '4px',
								background: 'white',
							}}
						>
							{INDEXED_DB_TARGETS.map((target) => (
								<option
									key={`${target.dbName}|${target.storeName}`}
									value={`${target.dbName}|${target.storeName}`}
								>
									{target.label} ({target.dbName}.{target.storeName})
								</option>
							))}
						</select>
					</div>
				)}

				{logSource === 'sqlite' && (
					<div style={{ marginBottom: '8px' }}>
						<label
							style={{
								display: 'block',
								fontSize: '11px',
								fontWeight: '600',
								color: '#374151',
								marginBottom: '4px',
							}}
							htmlFor="sqlite-target-select"
						>
							SQLite Endpoint:
						</label>
						<select
							id="sqlite-target-select"
							value={selectedSQLiteTarget}
							onChange={(e) => setSelectedSQLiteTarget(e.target.value)}
							style={{
								width: '100%',
								padding: '6px 8px',
								fontSize: '12px',
								border: '1px solid #d1d5db',
								borderRadius: '4px',
								background: 'white',
							}}
						>
							{SQLITE_TARGETS.map((target) => (
								<option key={target.endpoint} value={target.endpoint}>
									{target.label} ({target.endpoint})
								</option>
							))}
						</select>
					</div>
				)}

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
							htmlFor="line-count-select"
						>
							Lines to show:
						</label>
						<div style={{ display: 'flex', gap: '8px' }} id="line-count-select">
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
							logSource === 'localStorage'
								? loadLocalStorageLogs()
								: logSource === 'indexedDB'
									? void loadIndexedDBLogs()
									: logSource === 'sqlite'
										? void loadSQLiteLogs()
										: void loadFileLogs()
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

					<div
						style={{
							marginLeft: 'auto',
							fontSize: '14px',
							color: '#6b7280',
							fontWeight: '600',
						}}
					>
						{logSource !== 'file'
							? `${filteredLogs.length} ${filteredLogs.length === 1 ? 'entry' : 'entries'}`
							: `${fileContent.split('\n').length} lines`}
					</div>
				</div>

				{/* Category Filter (non-file sources) */}
				{logSource !== 'file' && (
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
				ref={logContainerRef}
				style={{
					background: 'white',
					borderRadius: '8px',
					padding: '20px',
					boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
					flex: 1,
					overflowY: 'auto',
					minHeight: 0,
				}}
			>
				{logSource !== 'file' ? (
					// non-file logs display
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
											borderLeft: `4px solid ${getCategoryColor(log.category)}`,
											borderRadius: '6px',
											padding: '12px',
											background: index % 2 === 0 ? '#f9fafb' : '#f3f4f6',
											marginBottom: '8px',
											boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
											position: 'relative',
											overflow: 'hidden',
										}}
									>
										<div
											style={{
												fontSize: '11px',
												color: '#6b7280',
												fontWeight: '600',
												marginBottom: '8px',
												fontFamily: 'monospace',
											}}
										>
											{buildTransactionMarker(log.timestamp, log.message, 'ENTRY')}
										</div>
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
							style={{
								background: '#ffffff',
								borderRadius: '4px',
								padding: '8px',
								maxHeight: '600px',
								border: '1px solid #e5e7eb',
								overflow: 'auto',
							}}
						>
							<div
								style={{
									fontSize: '12px',
									color: '#111827',
									fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
									lineHeight: '1.55',
								}}
							>
								{fileContent.split('\n').map((line, index) => {
									const lineTimestamp = getIsoTimestampFromLine(line) ?? new Date().toISOString();
									const marker = buildTransactionMarker(
										lineTimestamp,
										line || '(empty line)',
										'FILE'
									);

									return (
										<div
											key={index}
											style={{
												padding: '8px 10px',
												borderBottom: '1px solid #e5e7eb',
												borderLeft: '3px solid #d1d5db',
												background: index % 2 === 0 ? '#f9fafb' : '#ffffff',
												whiteSpace: 'pre-wrap',
												wordBreak: 'break-word',
											}}
										>
											<div
												style={{
													fontSize: '11px',
													color: '#6b7280',
													marginBottom: '5px',
													fontWeight: '600',
												}}
											>
												{marker}
											</div>
											{colorizeLogLine(line)}
										</div>
									);
								})}
							</div>
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
					? 'These logs persist across page redirects and refreshes. Use the dropdown to switch between all detected localStorage log keys.'
					: logSource === 'indexedDB'
						? 'Use IndexedDB target dropdown to read records from known databases/stores. Reader normalizes arrays and objects into log entries.'
						: logSource === 'sqlite'
							? 'Use SQLite endpoint dropdown to read JSON responses. Reader handles object/array and common logs/data/entries wrappers.'
							: 'Enable Tail Mode to see new log entries in real-time as they are written to the file. File entries now include clearer per-line separation.'}
			</div>
		</div>
	);
};
