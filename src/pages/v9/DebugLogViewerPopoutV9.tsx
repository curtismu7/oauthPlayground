/**
 * @file DebugLogViewerPopoutV9.tsx
 * @module pages/v9
 * @description V9 Popout version of Debug Log Viewer with Ping UI standardization
 * @version 9.13.4
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BootstrapIcon } from '@/components/v9/BootstrapIcon';
import { type LogFile, LogFileService } from '@/services/logFileService';
import { logger } from '@/utils/logger';

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
	icon: string;
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
		label: 'Enhanced Credentials (V9)',
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

export const DebugLogViewerPopoutV9: React.FC = () => {
	// Source selection
	const [logSource, setLogSource] = useState<LogSource>('file');
	const [availableFiles, setAvailableFiles] = useState<LogFile[]>([]);
	const [selectedFile, setSelectedFile] = useState<string>('authz-redirects.log');
	const [fileContent, setFileContent] = useState<string>('');
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>('');

	// Display options
	const [lineCount, setLineCount] = useState<number>(1000);
	const [tailMode, setTailMode] = useState<boolean>(false);
	const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [selectedCategory, setSelectedCategory] = useState<LogCategory>('ALL');

	// IndexedDB and SQLite options
	const [selectedIndexedDB, setSelectedIndexedDB] = useState<string>(INDEXED_DB_TARGETS[0].dbName);
	const [selectedSQLite, setSelectedSQLite] = useState<string>(SQLITE_TARGETS[0].endpoint);

	const contentRef = useRef<HTMLTextAreaElement>(null);
	const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Source options with Ping UI icons
	const sourceOptions: SourceOption[] = [
		{ value: 'file', label: 'Log Files', icon: 'file-text' },
		{ value: 'localStorage', label: 'Local Storage', icon: 'hdd' },
		{ value: 'indexedDB', label: 'IndexedDB', icon: 'database' },
		{ value: 'sqlite', label: 'SQLite', icon: 'server' },
		{ value: 'callback-debug', label: 'Callback Debug', icon: 'bug' },
	];

	// Load available files
	const loadAvailableFiles = useCallback(async () => {
		try {
			const files = await LogFileService.listLogFiles();
			setAvailableFiles(files);
			if (files.length > 0 && !selectedFile) {
				setSelectedFile(files[0].name);
			}
		} catch (err) {
			setError('Failed to load available files');
			logger.error('DebugLogViewerPopoutV9: Failed to load files', err);
		}
	}, [selectedFile]);

	// Load file content
	const loadFileContent = useCallback(async () => {
		if (!selectedFile) return;

		setIsLoading(true);
		setError('');

		try {
			let content = '';

			switch (logSource) {
				case 'file':
					const logContent = await LogFileService.readLogFile(selectedFile);
					content = logContent.content;
					break;
				default:
					content = 'Log source not implemented yet';
					break;
			}

			const {
				content: processedContent,
				isTruncated,
				originalSize,
			} = truncateFileContent(content, selectedFile);

			setFileContent(processedContent);

			if (isTruncated) {
				logger.warn(`DebugLogViewerPopoutV9: File truncated`, {
					filename: selectedFile,
					originalSize: `${(originalSize / 1024 / 1024).toFixed(2)} MB`,
					displaySize: `${(MAX_STRING_LENGTH / 1024 / 1024).toFixed(2)} MB`,
				});
			}
		} catch (err) {
			setError(`Failed to load content: ${err instanceof Error ? err.message : 'Unknown error'}`);
			logger.error('DebugLogViewerPopoutV9: Failed to load content', err);
		} finally {
			setIsLoading(false);
		}
	}, [selectedFile, logSource, selectedIndexedDB, selectedSQLite]);

	// Process content for display
	const processContent = useCallback(
		(content: string): string => {
			let processed = content;

			// Apply line count limit
			if (lineCount > 0 && !tailMode) {
				const lines = content.split('\n');
				if (lines.length > lineCount) {
					processed = lines.slice(-lineCount).join('\n');
				}
			}

			// Apply tail mode
			if (tailMode && lineCount > 0) {
				const lines = content.split('\n');
				processed = lines.slice(-lineCount).join('\n');
			}

			// Apply search filter
			if (searchTerm) {
				const lines = processed.split('\n');
				const filteredLines = lines.filter((line) =>
					line.toLowerCase().includes(searchTerm.toLowerCase())
				);
				processed = filteredLines.join('\n');
			}

			// Apply category filter
			if (selectedCategory !== 'ALL') {
				const lines = processed.split('\n');
				const filteredLines = lines.filter(
					(line) => line.includes(`[${selectedCategory}]`) || line.includes(selectedCategory)
				);
				processed = filteredLines.join('\n');
			}

			return processed;
		},
		[lineCount, tailMode, searchTerm, selectedCategory]
	);

	// Auto refresh
	useEffect(() => {
		if (autoRefresh) {
			refreshIntervalRef.current = setInterval(() => {
				loadFileContent();
			}, 5000); // Refresh every 5 seconds
		} else {
			if (refreshIntervalRef.current) {
				clearInterval(refreshIntervalRef.current);
				refreshIntervalRef.current = null;
			}
		}

		return () => {
			if (refreshIntervalRef.current) {
				clearInterval(refreshIntervalRef.current);
			}
		};
	}, [autoRefresh, loadFileContent]);

	// Initial load
	useEffect(() => {
		loadAvailableFiles();
	}, [loadAvailableFiles]);

	useEffect(() => {
		loadFileContent();
	}, [loadFileContent]);

	// Handle source change
	const handleSourceChange = (newSource: LogSource) => {
		setLogSource(newSource);
		setError('');
		setFileContent('');
	};

	// Handle refresh
	const handleRefresh = () => {
		loadFileContent();
	};

	// Handle clear
	const handleClear = () => {
		setFileContent('');
		setError('');
	};

	// Handle copy
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(fileContent);
			// Show success feedback (could add toast notification)
		} catch (err) {
			logger.error('DebugLogViewerPopoutV9: Failed to copy content', err);
		}
	};

	return (
		<div
			className="end-user-nano"
			style={{
				height: '100vh',
				display: 'flex',
				flexDirection: 'column',
				background: 'var(--ping-bg-primary, #ffffff)',
				color: 'var(--ping-text-primary, #1a1a1a)',
			}}
		>
			{/* Header */}
			<div
				style={{
					padding: '1rem',
					borderBottom: '1px solid var(--ping-border-light, #e5e7eb)',
					background: 'var(--ping-bg-secondary, #f9fafb)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					flexShrink: 0,
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<BootstrapIcon icon="bug" size={20} />
					<h1
						style={{
							margin: 0,
							fontSize: '1.25rem',
							fontWeight: '600',
							color: 'var(--ping-text-primary, #1a1a1a)',
						}}
					>
						Debug Log Viewer - V9 Popout
					</h1>
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<button
						onClick={handleRefresh}
						disabled={isLoading}
						style={{
							padding: '0.5rem 1rem',
							border: '1px solid var(--ping-border-primary, #d1d5db)',
							borderRadius: '0.375rem',
							background: 'var(--ping-bg-primary, #ffffff)',
							color: 'var(--ping-text-primary, #1a1a1a)',
							cursor: isLoading ? 'not-allowed' : 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '0.25rem',
							fontSize: '0.875rem',
							transition: 'all 0.15s ease-in-out',
						}}
					>
						<BootstrapIcon icon="arrow-clockwise" size={14} />
						Refresh
					</button>
					<button
						onClick={handleCopy}
						disabled={!fileContent}
						style={{
							padding: '0.5rem 1rem',
							border: '1px solid var(--ping-border-primary, #d1d5db)',
							borderRadius: '0.375rem',
							background: 'var(--ping-bg-primary, #ffffff)',
							color: 'var(--ping-text-primary, #1a1a1a)',
							cursor: fileContent ? 'pointer' : 'not-allowed',
							display: 'flex',
							alignItems: 'center',
							gap: '0.25rem',
							fontSize: '0.875rem',
							transition: 'all 0.15s ease-in-out',
						}}
					>
						<BootstrapIcon icon="clipboard" size={14} />
						Copy
					</button>
				</div>
			</div>

			{/* Controls */}
			<div
				style={{
					padding: '1rem',
					borderBottom: '1px solid var(--ping-border-light, #e5e7eb)',
					background: 'var(--ping-bg-secondary, #f9fafb)',
					display: 'flex',
					flexWrap: 'wrap',
					gap: '1rem',
					alignItems: 'center',
					flexShrink: 0,
				}}
			>
				{/* Source Selection */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Source:</label>
					<select
						value={logSource}
						onChange={(e) => handleSourceChange(e.target.value as LogSource)}
						style={{
							padding: '0.375rem 0.5rem',
							border: '1px solid var(--ping-border-primary, #d1d5db)',
							borderRadius: '0.375rem',
							background: 'var(--ping-bg-primary, #ffffff)',
							color: 'var(--ping-text-primary, #1a1a1a)',
							fontSize: '0.875rem',
						}}
					>
						{sourceOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>

				{/* File Selection */}
				{logSource === 'file' && (
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<label style={{ fontSize: '0.875rem', fontWeight: '500' }}>File:</label>
						<select
							value={selectedFile}
							onChange={(e) => setSelectedFile(e.target.value)}
							style={{
								padding: '0.375rem 0.5rem',
								border: '1px solid var(--ping-border-primary, #d1d5db)',
								borderRadius: '0.375rem',
								background: 'var(--ping-bg-primary, #ffffff)',
								color: 'var(--ping-text-primary, #1a1a1a)',
								fontSize: '0.875rem',
							}}
						>
							{availableFiles.map((file) => (
								<option key={file.name} value={file.name}>
									{file.name} ({(file.size / 1024).toFixed(1)} KB)
								</option>
							))}
						</select>
					</div>
				)}

				{/* Search */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<BootstrapIcon icon="search" size={14} />
					<input
						type="text"
						placeholder="Search logs..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						style={{
							padding: '0.375rem 0.5rem',
							border: '1px solid var(--ping-border-primary, #d1d5db)',
							borderRadius: '0.375rem',
							background: 'var(--ping-bg-primary, #ffffff)',
							color: 'var(--ping-text-primary, #1a1a1a)',
							fontSize: '0.875rem',
							width: '200px',
						}}
					/>
				</div>

				{/* Line Count */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Lines:</label>
					<input
						type="number"
						value={lineCount}
						onChange={(e) => setLineCount(Math.max(0, parseInt(e.target.value) || 0))}
						style={{
							padding: '0.375rem 0.5rem',
							border: '1px solid var(--ping-border-primary, #d1d5db)',
							borderRadius: '0.375rem',
							background: 'var(--ping-bg-primary, #ffffff)',
							color: 'var(--ping-text-primary, #1a1a1a)',
							fontSize: '0.875rem',
							width: '80px',
						}}
					/>
				</div>

				{/* Auto Refresh */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<input
						type="checkbox"
						id="autoRefresh"
						checked={autoRefresh}
						onChange={(e) => setAutoRefresh(e.target.checked)}
						style={{ marginRight: '0.25rem' }}
					/>
					<label htmlFor="autoRefresh" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
						Auto Refresh
					</label>
				</div>

				{/* Tail Mode */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
					<input
						type="checkbox"
						id="tailMode"
						checked={tailMode}
						onChange={(e) => setTailMode(e.target.checked)}
						style={{ marginRight: '0.25rem' }}
					/>
					<label htmlFor="tailMode" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
						Tail Mode
					</label>
				</div>
			</div>

			{/* Error Display */}
			{error && (
				<div
					style={{
						padding: '1rem',
						margin: '1rem',
						background: 'var(--ping-bg-error, #fef2f2)',
						border: '1px solid var(--ping-border-error, #fecaca)',
						borderRadius: '0.375rem',
						color: 'var(--ping-text-error, #dc2626)',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
					}}
				>
					<BootstrapIcon icon="exclamation-triangle" size={16} />
					{error}
				</div>
			)}

			{/* Content */}
			<div
				style={{
					flex: 1,
					padding: '1rem',
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				{isLoading ? (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							height: '100%',
							gap: '0.5rem',
							color: 'var(--ping-text-secondary, #6b7280)',
						}}
					>
						<BootstrapIcon
							icon="arrow-clockwise"
							size={20}
							style={{ animation: 'spin 1s linear infinite' }}
						/>
						Loading...
					</div>
				) : (
					<textarea
						ref={contentRef}
						value={processContent(fileContent)}
						readOnly
						style={{
							width: '100%',
							height: '100%',
							padding: '0.75rem',
							border: '1px solid var(--ping-border-primary, #d1d5db)',
							borderRadius: '0.375rem',
							background: 'var(--ping-bg-tertiary, #f3f4f6)',
							color: 'var(--ping-text-primary, #1a1a1a)',
							fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
							fontSize: '0.875rem',
							lineHeight: '1.5',
							resize: 'none',
							outline: 'none',
						}}
						placeholder="Log content will appear here..."
					/>
				)}
			</div>

			{/* Status Bar */}
			<div
				style={{
					padding: '0.5rem 1rem',
					borderTop: '1px solid var(--ping-border-light, #e5e7eb)',
					background: 'var(--ping-bg-secondary, #f9fafb)',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					fontSize: '0.75rem',
					color: 'var(--ping-text-secondary, #6b7280)',
					flexShrink: 0,
				}}
			>
				<div>{fileContent ? `${fileContent.length} characters` : 'No content'}</div>
				<div>
					{autoRefresh && (
						<span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
							<BootstrapIcon
								icon="arrow-clockwise"
								size={12}
								style={{ animation: 'spin 2s linear infinite' }}
							/>
							Auto-refreshing every 5s
						</span>
					)}
				</div>
			</div>

			<style jsx>{`
				@keyframes spin {
					from {
						transform: rotate(0deg);
					}
					to {
						transform: rotate(360deg);
					}
				}
			`}</style>
		</div>
	);
};
