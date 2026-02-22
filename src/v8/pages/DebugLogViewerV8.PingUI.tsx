/**
 * @file DebugLogViewerV8.PingUI.tsx
 * @module v8/pages
 * @description PingOne UI version of Debug log viewer for persistent redirect URI logs and server log files
 * @version 9.0.0-PingUI
 *
 * PingOne UI migration following pingui2.md standards:
 * - Added .end-user-nano namespace wrapper
 * - Replaced React Icons with MDI CSS icons
 * - Applied Ping UI CSS variables and transitions
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { type LogFile, LogFileService } from '@/services/logFileService';
import {
	PageHeaderGradients,
	PageHeaderTextColors,
	PageHeaderV8,
} from '@/v8/components/shared/PageHeaderV8';
import { MFARedirectUriServiceV8 } from '@/v8/services/mfaRedirectUriServiceV8';
import { isPopoutWindow, openDebugLogViewerPopout } from '@/v8/utils/debugLogViewerPopoutHelperV8';

// PingOne UI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	style?: React.CSSProperties;
	title?: string;
}> = ({ icon, size = 24, className = '', style, title }) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: size, ...style }}
			title={title}
		/>
	);
};

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

// PingOne UI Styled Components (using inline styles with CSS variables)
const getContainerStyle = () => ({
	padding: 'var(--pingone-spacing-lg, 2rem)',
	maxWidth: 'var(--pingone-container-max-width, 1400px)',
	margin: '0 auto',
	background: 'var(--pingone-surface-background)',
	minHeight: '100vh',
});

const getControlSectionStyle = () => ({
	background: 'var(--pingone-surface-card)',
	borderRadius: 'var(--pingone-border-radius-lg, 0.75rem)',
	padding: 'var(--pingone-spacing-lg, 1.5rem)',
	marginBottom: 'var(--pingone-spacing-lg, 1.5rem)',
	border: '1px solid var(--pingone-border-primary)',
	boxShadow: 'var(--pingone-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1)',
});

const getControlsRowStyle = () => ({
	display: 'flex',
	gap: 'var(--pingone-spacing-md, 1rem)',
	alignItems: 'center',
	flexWrap: 'wrap',
	marginBottom: 'var(--pingone-spacing-md, 1rem)',
});

const getSelectStyle = () => ({
	padding: 'var(--pingone-spacing-sm, 0.5rem) var(--pingone-spacing-md, 1rem)',
	border: '1px solid var(--pingone-border-primary)',
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	background: 'var(--pingone-surface-primary)',
	color: 'var(--pingone-text-primary)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	minWidth: '200px',
	cursor: 'pointer',
	transition: 'all 0.15s ease-in-out',
	'&:hover': {
		borderColor: 'var(--pingone-brand-primary)',
	},
	'&:focus': {
		outline: '2px solid var(--pingone-brand-primary)',
		outlineOffset: '2px',
	},
});

const getButtonStyle = (variant: 'primary' | 'secondary' = 'primary', disabled = false) => ({
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--pingone-spacing-sm, 0.5rem)',
	padding: 'var(--pingone-spacing-sm, 0.625rem) var(--pingone-spacing-md, 1rem)',
	background: disabled
		? 'var(--pingone-surface-tertiary)'
		: variant === 'primary'
			? 'var(--pingone-brand-primary)'
			: 'var(--pingone-surface-secondary)',
	color: disabled
		? 'var(--pingone-text-tertiary)'
		: variant === 'primary'
			? 'var(--pingone-text-inverse)'
			: 'var(--pingone-text-primary)',
	border: variant === 'secondary' ? '1px solid var(--pingone-border-primary)' : 'none',
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
	cursor: disabled ? 'not-allowed' : 'pointer',
	transition: 'all 0.15s ease-in-out',
	'&:hover': !disabled
		? {
				background:
					variant === 'primary'
						? 'var(--pingone-brand-primary-dark)'
						: 'var(--pingone-surface-tertiary)',
				transform: 'translateY(-1px)',
				boxShadow: 'var(--pingone-shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1))',
			}
		: {},
});

const getLogContentStyle = () => ({
	background: 'var(--pingone-surface-card)',
	borderRadius: 'var(--pingone-border-radius-lg, 0.75rem)',
	border: '1px solid var(--pingone-border-primary)',
	overflow: 'hidden',
});

const getLogHeaderStyle = () => ({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	padding: 'var(--pingone-spacing-md, 1rem)',
	background: 'var(--pingone-surface-secondary)',
	borderBottom: '1px solid var(--pingone-border-primary)',
});

const getLogTitleStyle = () => ({
	color: 'var(--pingone-text-primary)',
	fontWeight: 'var(--pingone-font-weight-semibold, 600)',
	fontSize: 'var(--pingone-font-size-md, 1rem)',
});

const getLogActionsStyle = () => ({
	display: 'flex',
	gap: 'var(--pingone-spacing-sm, 0.5rem)',
});

const getLogBodyStyle = () => ({
	maxHeight: '600px',
	border: 'none',
	overflow: 'auto',
});

const getLogLineStyle = (index: number) => ({
	padding: 'var(--pingone-spacing-sm, 0.5rem) var(--pingone-spacing-md, 1rem)',
	borderBottom: '1px solid var(--pingone-border-primary)',
	borderLeft: '3px solid var(--pingone-border-secondary)',
	background:
		index % 2 === 0 ? 'var(--pingone-surface-tertiary)' : 'var(--pingone-surface-primary)',
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
	transition: 'background-color 0.15s ease-in-out',
	'&:hover': {
		background: 'var(--pingone-surface-secondary)',
	},
});

const getLogTimestampStyle = () => ({
	fontSize: 'var(--pingone-font-size-xs, 0.75rem)',
	color: 'var(--pingone-text-tertiary)',
	marginBottom: 'var(--pingone-spacing-xs, 0.25rem)',
	fontWeight: 'var(--pingone-font-weight-medium, 500)',
});

const getLogTextStyle = () => ({
	fontSize: 'var(--pingone-font-size-xs, 0.75rem)',
	color: 'var(--pingone-text-primary)',
	fontFamily: 'var(--pingone-font-family-mono, "Monaco", "Menlo", "Ubuntu Mono", monospace)',
	lineHeight: '1.55',
});

const getEmptyStateStyle = () => ({
	textAlign: 'center',
	padding: 'var(--pingone-spacing-xl, 2.5rem)',
	color: 'var(--pingone-text-secondary)',
});

const getInfoBoxStyle = () => ({
	marginTop: 'var(--pingone-spacing-lg, 1.5rem)',
	padding: 'var(--pingone-spacing-md, 1rem)',
	background: 'var(--pingone-surface-info)',
	border: '1px solid var(--pingone-border-info)',
	borderRadius: 'var(--pingone-border-radius-md, 0.375rem)',
	fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
	color: 'var(--pingone-text-info)',
});

const DebugLogViewerV8PingUI: React.FC = () => {
	// State management
	const [logSource, setLogSource] = useState<LogSource>('localStorage');
	const [logFiles, setLogFiles] = useState<LogFile[]>([]);
	const [selectedFile, setSelectedFile] = useState<LogFile | null>(null);
	const [fileContent, setFileContent] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);
	const [tailMode, setTailMode] = useState(false);
	const [indexedDBTarget, setIndexedDBTarget] = useState<IndexedDBTarget>(INDEXED_DB_TARGETS[0]);
	const [sqliteTarget, setSqliteTarget] = useState<SQLiteTarget>(SQLITE_TARGETS[0]);
	const [showContent, setShowContent] = useState(true);

	// Refs
	const tailIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const contentRef = useRef<HTMLDivElement>(null);

	// Source options with MDI icons
	const sourceOptions: SourceOption[] = [
		{
			value: 'localStorage',
			label: 'Local Storage Logs',
			icon: <MDIIcon icon="database" size={16} />,
		},
		{
			value: 'indexedDB',
			label: 'IndexedDB Logs',
			icon: <MDIIcon icon="database-outline" size={16} />,
		},
		{
			value: 'sqlite',
			label: 'SQLite API',
			icon: <MDIIcon icon="server" size={16} />,
		},
		{
			value: 'file',
			label: 'Server Log Files',
			icon: <MDIIcon icon="file-document" size={16} />,
		},
		{
			value: 'callback-debug',
			label: 'Callback Debug',
			icon: <MDIIcon icon="bug" size={16} />,
		},
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
			`File: ${filename}`;

		return { content: truncatedContent + warning, isTruncated: true, originalSize };
	};

	// Load log files based on source
	const loadLogFiles = useCallback(async () => {
		try {
			setIsLoading(true);
			let files: LogFile[] = [];

			switch (logSource) {
				case 'localStorage':
					files = await LogFileService.getLocalStorageLogFiles();
					break;
				case 'indexedDB':
					files = await LogFileService.getIndexedDBLogFiles(
						indexedDBTarget.dbName,
						indexedDBTarget.storeName
					);
					break;
				case 'sqlite':
					files = await LogFileService.getSQLiteLogFiles(sqliteTarget.endpoint);
					break;
				case 'file':
					files = await LogFileService.getServerLogFiles();
					break;
				case 'callback-debug':
					files = await LogFileService.getCallbackDebugLogs();
					break;
			}

			setLogFiles(files);
			if (files.length > 0 && !selectedFile) {
				setSelectedFile(files[0]);
			}
		} catch (error) {
			console.error('Failed to load log files:', error);
		} finally {
			setIsLoading(false);
		}
	}, [logSource, indexedDBTarget, sqliteTarget, selectedFile]);

	// Load file content
	const loadFileContent = useCallback(
		async (file: LogFile) => {
			try {
				setIsLoading(true);
				const content = await LogFileService.getFileContent(file);
				const { content: processedContent } = truncateFileContent(content, file.name);
				setFileContent(processedContent);
			} catch (error) {
				console.error('Failed to load file content:', error);
				setFileContent('Error loading file content');
			} finally {
				setIsLoading(false);
			}
		},
		[truncateFileContent]
	);

	// Load localStorage logs
	const loadLocalStorageLogs = useCallback(async () => {
		try {
			setIsLoading(true);
			const logs = await MFARedirectUriServiceV8.getPersistentLogs();
			const content = logs.map((log) => JSON.stringify(log, null, 2)).join('\n\n');
			setFileContent(content);
		} catch (error) {
			console.error('Failed to load localStorage logs:', error);
			setFileContent('Error loading localStorage logs');
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Load IndexedDB logs
	const loadIndexedDBLogs = useCallback(async () => {
		try {
			setIsLoading(true);
			const logs = await LogFileService.getIndexedDBContent(
				indexedDBTarget.dbName,
				indexedDBTarget.storeName
			);
			const content = logs.map((log) => JSON.stringify(log, null, 2)).join('\n\n');
			setFileContent(content);
		} catch (error) {
			console.error('Failed to load IndexedDB logs:', error);
			setFileContent('Error loading IndexedDB logs');
		} finally {
			setIsLoading(false);
		}
	}, [indexedDBTarget]);

	// Load SQLite logs
	const loadSQLiteLogs = useCallback(async () => {
		try {
			setIsLoading(true);
			const content = await LogFileService.getSQLiteContent(sqliteTarget.endpoint);
			setFileContent(JSON.stringify(content, null, 2));
		} catch (error) {
			console.error('Failed to load SQLite logs:', error);
			setFileContent('Error loading SQLite logs');
		} finally {
			setIsLoading(false);
		}
	}, [sqliteTarget]);

	// Load file logs
	const loadFileLogs = useCallback(async () => {
		if (selectedFile) {
			await loadFileContent(selectedFile);
		}
	}, [selectedFile, loadFileContent]);

	// Tail mode functionality
	const startTailMode = useCallback(() => {
		if (tailIntervalRef.current) {
			clearInterval(tailIntervalRef.current);
		}

		tailIntervalRef.current = setInterval(() => {
			if (selectedFile) {
				loadFileContent(selectedFile);
			}
		}, 1000);
	}, [selectedFile, loadFileContent]);

	const stopTailMode = useCallback(() => {
		if (tailIntervalRef.current) {
			clearInterval(tailIntervalRef.current);
			tailIntervalRef.current = null;
		}
	}, []);

	// Effects
	useEffect(() => {
		loadLogFiles();
	}, [loadLogFiles]);

	useEffect(() => {
		if (selectedFile && logSource === 'file') {
			loadFileContent(selectedFile);
		}
	}, [selectedFile, logSource, loadFileContent]);

	useEffect(() => {
		if (tailMode && logSource === 'file') {
			startTailMode();
		} else {
			stopTailMode();
		}

		return () => {
			stopTailMode();
		};
	}, [tailMode, logSource, startTailMode, stopTailMode]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopTailMode();
		};
	}, [stopTailMode]);

	// Helper functions
	const getIsoTimestampFromLine = (line: string): string | null => {
		const timestampRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
		const match = line.match(timestampRegex);
		return match ? match[0] : null;
	};

	const buildTransactionMarker = (timestamp: string, content: string, source: string): string => {
		const date = new Date(timestamp);
		return `[${date.toLocaleTimeString()}] [${source}] ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`;
	};

	const colorizeLogLine = (line: string): React.ReactNode => {
		const parts = line.split(' ');
		const result: React.ReactNode[] = [];

		// Process each part with color coding
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			let styled = false;

			// Timestamp pattern
			if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(part)) {
				result.push(
					<span key={i} style={{ color: 'var(--pingone-text-tertiary)', fontWeight: '500' }}>
						{part}{' '}
					</span>
				);
				styled = true;
			}
			// Log levels in brackets
			else if (part.startsWith('[') && part.endsWith(']')) {
				const level = part.slice(1, -1).toUpperCase();
				let color = 'var(--pingone-text-primary)';
				if (level === 'ERROR') color = 'var(--pingone-text-error)';
				else if (level === 'WARN') color = 'var(--pingone-text-warning)';
				else if (level === 'INFO') color = 'var(--pingone-text-success)';

				result.push(
					<span key={i} style={{ color, fontWeight: '600' }}>
						{part}{' '}
					</span>
				);
				styled = true;
			}
			// HTTP methods
			else if (/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/.test(part)) {
				result.push(
					<span key={i} style={{ color: 'var(--pingone-brand-primary)', fontWeight: '600' }}>
						{part}{' '}
					</span>
				);
				styled = true;
			}
			// HTTP status codes
			else if (/^\d{3}$/.test(part)) {
				const code = parseInt(part, 10);
				let color = 'var(--pingone-text-primary)';
				if (code >= 200 && code < 300) color = 'var(--pingone-text-success)';
				else if (code >= 300 && code < 400) color = 'var(--pingone-text-warning)';
				else if (code >= 400) color = 'var(--pingone-text-error)';

				result.push(
					<span key={i} style={{ color, fontWeight: '500' }}>
						{part}{' '}
					</span>
				);
				styled = true;
			}
			// URLs
			else if (part.startsWith('http://') || part.startsWith('https://')) {
				result.push(
					<a
						key={i}
						href={part}
						target="_blank"
						rel="noopener noreferrer"
						style={{
							color: 'var(--pingone-brand-primary)',
							textDecoration: 'underline',
						}}
					>
						{part}{' '}
					</a>
				);
				styled = true;
			}

			if (!styled) {
				result.push(<span key={i}>{part} </span>);
			}
		}

		return <>{result}</>;
	};

	const downloadFile = useCallback(() => {
		if (selectedFile && fileContent) {
			const blob = new Blob([fileContent], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = selectedFile.name;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
	}, [selectedFile, fileContent]);

	const clearLogs = useCallback(async () => {
		if (logSource === 'localStorage') {
			await MFARedirectUriServiceV8.clearPersistentLogs();
			setFileContent('');
		} else if (selectedFile) {
			await LogFileService.deleteFile(selectedFile);
			await loadLogFiles();
			setFileContent('');
		}
	}, [logSource, selectedFile, loadLogFiles]);

	return (
		<div className="end-user-nano">
			<div style={getContainerStyle()}>
				{/* Header */}
				<PageHeaderV8
					title="Debug Log Viewer"
					subtitle="View and analyze logs from various sources"
					gradient={PageHeaderGradients.unifiedOAuth}
					textColor={PageHeaderTextColors.dark}
					actions={
						<div style={getLogActionsStyle()}>
							<button
								style={getButtonStyle('secondary')}
								onClick={() => setShowContent(!showContent)}
								title={showContent ? 'Hide content' : 'Show content'}
							>
								<MDIIcon icon={showContent ? 'eye-off' : 'eye'} size={16} />
								{showContent ? 'Hide' : 'Show'}
							</button>
							{!isPopoutWindow() && (
								<button
									style={getButtonStyle('secondary')}
									onClick={openDebugLogViewerPopout}
									title="Open in popout window"
								>
									<MDIIcon icon="open-in-new" size={16} />
									Popout
								</button>
							)}
						</div>
					}
				/>

				{/* Control Section */}
				<div style={getControlSectionStyle()}>
					<div style={getControlsRowStyle()}>
						{/* Source Selection */}
						<select
							value={logSource}
							onChange={(e) => setLogSource(e.target.value as LogSource)}
							style={getSelectStyle()}
						>
							{sourceOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>

						{/* IndexedDB Target Selection */}
						{logSource === 'indexedDB' && (
							<select
								value={indexedDBTarget.dbName}
								onChange={(e) => {
									const target = INDEXED_DB_TARGETS.find((t) => t.dbName === e.target.value);
									if (target) setIndexedDBTarget(target);
								}}
								style={getSelectStyle()}
							>
								{INDEXED_DB_TARGETS.map((target) => (
									<option key={target.dbName} value={target.dbName}>
										{target.label}
									</option>
								))}
							</select>
						)}

						{/* SQLite Target Selection */}
						{logSource === 'sqlite' && (
							<select
								value={sqliteTarget.endpoint}
								onChange={(e) => {
									const target = SQLITE_TARGETS.find((t) => t.endpoint === e.target.value);
									if (target) setSqliteTarget(target);
								}}
								style={getSelectStyle()}
							>
								{SQLITE_TARGETS.map((target) => (
									<option key={target.endpoint} value={target.endpoint}>
										{target.label}
									</option>
								))}
							</select>
						)}

						{/* File Selection */}
						{logSource === 'file' && logFiles.length > 0 && (
							<select
								value={selectedFile?.id || ''}
								onChange={(e) => {
									const file = logFiles.find((f) => f.id === e.target.value);
									if (file) setSelectedFile(file);
								}}
								style={getSelectStyle()}
							>
								{logFiles.map((file) => (
									<option key={file.id} value={file.id}>
										{file.name} ({(file.size / 1024).toFixed(2)} KB)
									</option>
								))}
							</select>
						)}

						{/* Refresh Button */}
						<button
							style={getButtonStyle('primary', isLoading)}
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
						>
							<MDIIcon icon="refresh" size={16} />
							{isLoading ? 'Loading...' : 'Refresh'}
						</button>

						{/* Tail Mode Checkbox */}
						{logSource === 'file' && (
							<label
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 'var(--pingone-spacing-sm, 0.5rem)',
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
					</div>

					{/* File Actions */}
					{selectedFile && (
						<div style={getControlsRowStyle()}>
							<button
								style={getButtonStyle('secondary')}
								onClick={downloadFile}
								disabled={!fileContent}
							>
								<MDIIcon icon="download" size={16} />
								Download
							</button>
							<button
								style={getButtonStyle('secondary', isLoading)}
								onClick={clearLogs}
								disabled={isLoading}
							>
								<MDIIcon icon="trash-can" size={16} />
								Clear
							</button>
						</div>
					)}
				</div>

				{/* Log Content */}
				{showContent && (
					<div style={getLogContentStyle()}>
						{fileContent ? (
							<>
								<div style={getLogHeaderStyle()}>
									<div style={getLogTitleStyle()}>
										{selectedFile ? selectedFile.name : 'Log Content'}
									</div>
									<div style={getLogActionsStyle()}>
										{tailMode && (
											<span
												style={{
													color: 'var(--pingone-text-success)',
													fontSize: 'var(--pingone-font-size-sm, 0.875rem)',
												}}
											>
												● Live
											</span>
										)}
									</div>
								</div>
								<div style={getLogBodyStyle()} ref={contentRef}>
									<div style={getLogTextStyle()}>
										{fileContent.split('\n').map((line, index) => {
											const lineTimestamp =
												getIsoTimestampFromLine(line) ?? new Date().toISOString();
											const marker = buildTransactionMarker(
												lineTimestamp,
												line || '(empty line)',
												'FILE'
											);

											return (
												<div key={index} style={getLogLineStyle(index)}>
													<div style={getLogTimestampStyle()}>{marker}</div>
													{colorizeLogLine(line)}
												</div>
											);
										})}
									</div>
								</div>
							</>
						) : (
							<div style={getEmptyStateStyle()}>
								<p
									style={{
										fontSize: 'var(--pingone-font-size-md, 1rem)',
										marginBottom: 'var(--pingone-spacing-sm, 0.5rem)',
									}}
								>
									No log content
								</p>
								<p style={{ fontSize: 'var(--pingone-font-size-sm, 0.875rem)' }}>
									Select a log file and click Refresh to view its contents
								</p>
							</div>
						)}
					</div>
				)}

				{/* Info Box */}
				<div style={getInfoBoxStyle()}>
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
		</div>
	);
};

export default DebugLogViewerV8PingUI;
