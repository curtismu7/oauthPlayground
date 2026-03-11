/**
 * @file FloatingDebugLogViewer.tsx
 * @module components
 * @description Floating debug log viewer with full functionality
 * @version 1.0.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { type LogFile, LogFileService } from '../services/logFileService';
import { logger } from '../utils/logger';

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

type LogCategory = 'ALL' | 'server' | 'api' | 'frontend' | 'mfa' | 'oauth' | 'other';
type LogSource = 'file';

interface SourceOption {
	value: LogSource;
	label: string;
	icon: string;
}

const FloatingContainer = styled.div<{ width: number; height: number; x: number; y: number }>`
	position: fixed;
	top: ${(props) => props.y}px;
	left: ${(props) => props.x}px;
	width: ${(props) => props.width}px;
	height: ${(props) => props.height}px;
	background: white;
	border: 1px solid var(--ping-border-primary, #d1d5db);
	border-radius: 8px;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
	z-index: 9999;
	display: flex;
	flex-direction: column;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	background: var(--ping-bg-primary, #2563eb);
	color: white;
	border-radius: 8px 8px 0 0;
	cursor: move;
	user-select: none;
`;

const Title = styled.div`
	font-weight: 600;
	font-size: 14px;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const Controls = styled.div`
	display: flex;
	gap: 8px;
`;

const ControlButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
	background: ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return 'var(--ping-bg-primary, #2563eb)';
			case 'danger':
				return 'var(--ping-bg-danger, #dc2626)';
			default:
				return 'transparent';
		}
	}};
	color: ${(props) => (props.$variant ? 'white' : 'white')};
	border: 1px solid ${(props) => (props.$variant ? 'transparent' : 'rgba(255, 255, 255, 0.3)')};
	border-radius: 4px;
	padding: 4px 8px;
	cursor: pointer;
	font-size: 12px;
	transition: all 0.15s ease-in-out;
	display: flex;
	align-items: center;
	gap: 4px;

	&:hover {
		background: ${(props) => {
			switch (props.$variant) {
				case 'primary':
					return 'var(--ping-bg-primary-hover, #1d4ed8)';
				case 'danger':
					return 'var(--ping-bg-danger-hover, #b91c1c)';
				default:
					return 'rgba(255, 255, 255, 0.2)';
			}
		}};
	}
`;

const Content = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

const Toolbar = styled.div`
	display: flex;
	gap: 12px;
	padding: 12px 16px;
	background: #f8f9fa;
	border-bottom: 1px solid var(--ping-border-primary, #d1d5db);
	align-items: center;
	flex-wrap: wrap;
`;

const Select = styled.select`
	padding: 6px 8px;
	border: 1px solid var(--ping-border-primary, #d1d5db);
	border-radius: 4px;
	background: white;
	font-size: 12px;
	min-width: 150px;
`;

const Input = styled.input`
	padding: 6px 8px;
	border: 1px solid var(--ping-border-primary, #d1d5db);
	border-radius: 4px;
	font-size: 12px;
	width: 80px;
`;

const LogContent = styled.div`
	flex: 1;
	padding: 16px;
	overflow-y: auto;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 11px;
	line-height: 1.4;
	background: #1a1a1a;
	color: #f8f8f2;
	white-space: pre-wrap;
	word-break: break-all;
`;

const StatusMessage = styled.div<{ $type: 'loading' | 'error' | 'empty' }>`
	padding: 20px;
	text-align: center;
	color: ${(props) => {
		switch (props.$type) {
			case 'error':
				return 'var(--ping-bg-danger, #dc2626)';
			case 'loading':
				return 'var(--ping-bg-primary, #2563eb)';
			default:
				return 'var(--ping-text-color, #6b7280)';
		}
	}};
	font-size: 14px;
`;

interface FloatingDebugLogViewerProps {
	isOpen: boolean;
	onClose: () => void;
	initialWidth?: number;
	initialHeight?: number;
	initialX?: number;
	initialY?: number;
}

export const FloatingDebugLogViewer: React.FC<FloatingDebugLogViewerProps> = ({
	isOpen,
	onClose,
	initialWidth = 800,
	initialHeight = 600,
	initialX = 100,
	initialY = 100,
}) => {
	const [position, setPosition] = useState({ x: initialX, y: initialY });
	const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
	const [isDragging, setIsDragging] = useState(false);
	const [isMaximized, setIsMaximized] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const dragRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });

	// Log viewer state
	const [availableFiles, setAvailableFiles] = useState<LogFile[]>([]);
	const [selectedFile, setSelectedFile] = useState<string>('');
	const [fileContent, setFileContent] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string>('');
	const [logSource, setLogSource] = useState<LogSource>('file');
	const [selectedCategory, setSelectedCategory] = useState<LogCategory>('ALL');
	const [lineCount, setLineCount] = useState<number>(100);
	const [tailMode, setTailMode] = useState<boolean>(true);

	const navigate = useNavigate();

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
			logger.error('FloatingDebugLogViewer: Failed to load files', err);
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
				case 'file': {
					const logContent = await LogFileService.readLogFile(selectedFile, lineCount, tailMode);
					content = logContent.content;
					break;
				}
				default:
					content = 'Log source not implemented yet';
					break;
			}

			setFileContent(content);
		} catch (err) {
			setError(`Failed to load content: ${err instanceof Error ? err.message : 'Unknown error'}`);
			logger.error('FloatingDebugLogViewer: Failed to load content', err);
		} finally {
			setIsLoading(false);
		}
	}, [selectedFile, logSource, lineCount, tailMode]);

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

			return processed;
		},
		[lineCount, tailMode]
	);

	// Truncate file content to prevent browser crashes
	const truncateFileContent = useCallback((content: string, filename: string) => {
		if (content.length > MAX_STRING_LENGTH) {
			const truncated = content.slice(-MAX_STRING_LENGTH);
			logger.warn(`FloatingDebugLogViewer: File truncated`, {
				filename,
				originalSize: `${(content.length / 1024 / 1024).toFixed(2)} MB`,
				displaySize: `${(MAX_STRING_LENGTH / 1024 / 1024).toFixed(2)} MB`,
			});
			return {
				content: `\n\n=== FILE TRUNCATED ===\nOriginal size: ${(content.length / 1024 / 1024).toFixed(2)} MB\nShowing last ${(MAX_STRING_LENGTH / 1024 / 1024).toFixed(2)} MB\n\n${truncated}`,
				isTruncated: true,
				originalSize: content.length,
			};
		}
		return {
			content,
			isTruncated: false,
			originalSize: content.length,
		};
	}, []);

	// Initialize
	useEffect(() => {
		if (isOpen) {
			loadAvailableFiles();
		}
	}, [isOpen, loadAvailableFiles]);

	// Load content when file changes
	useEffect(() => {
		if (selectedFile && isOpen) {
			loadFileContent();
		}
	}, [selectedFile, logSource, lineCount, tailMode, isOpen, loadFileContent]);

	// Drag handlers
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			setIsDragging(true);
			dragRef.current = {
				startX: e.clientX - position.x,
				startY: e.clientY - position.y,
			};
		},
		[position]
	);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging) return;
			setPosition({
				x: e.clientX - dragRef.current.startX,
				y: e.clientY - dragRef.current.startY,
			});
		},
		[isDragging]
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	useEffect(() => {
		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [isDragging, handleMouseMove, handleMouseUp]);

	// Control handlers
	const toggleMaximize = () => {
		if (isMaximized) {
			setSize({ width: initialWidth, height: initialHeight });
			setPosition({ x: initialX, y: initialY });
		} else {
			setSize({ width: window.innerWidth - 40, height: window.innerHeight - 40 });
			setPosition({ x: 20, y: 20 });
		}
		setIsMaximized(!isMaximized);
	};

	const openPopout = () => {
		navigate('/v9/debug-logs-popout');
	};

	if (!isOpen) return null;

	if (isMinimized) {
		return (
			<FloatingContainer width={200} height={40} x={position.x} y={position.y}>
				<Header onMouseDown={handleMouseDown}>
					<Title>📋 Debug Logs</Title>
					<Controls>
						<ControlButton onClick={() => setIsMinimized(false)} title="Expand">
							<span>📄</span>
						</ControlButton>
					</Controls>
				</Header>
			</FloatingContainer>
		);
	}

	return (
		<FloatingContainer width={size.width} height={size.height} x={position.x} y={position.y}>
			<Header onMouseDown={handleMouseDown}>
				<Title>
					<span>📋</span>
					<span>Debug Log Viewer V9</span>
				</Title>
				<Controls>
					<ControlButton onClick={openPopout} title="Open in new window">
						<span>🔗</span>
					</ControlButton>
					<ControlButton
						onClick={() => setIsMinimized(!isMinimized)}
						title={isMinimized ? 'Expand' : 'Minimize'}
					>
						{isMinimized ? <span>📄</span> : <span>📋</span>}
					</ControlButton>
					<ControlButton onClick={toggleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
						{isMaximized ? '🗗' : '🗖'}
					</ControlButton>
					<ControlButton $variant="danger" onClick={onClose} title="Close">
						<span>❌</span>
					</ControlButton>
				</Controls>
			</Header>

			<Content>
				<Toolbar>
					<Select value={logSource} onChange={(e) => setLogSource(e.target.value as LogSource)}>
						<SourceOptions />
					</Select>

					<Select
						value={selectedFile}
						onChange={(e) => setSelectedFile(e.target.value)}
						disabled={!availableFiles.length}
					>
						<FileOptions files={availableFiles} />
					</Select>

					<Select
						value={selectedCategory}
						onChange={(e) => setSelectedCategory(e.target.value as LogCategory)}
					>
						<CategoryOptions />
					</Select>

					<Input
						type="number"
						value={lineCount}
						onChange={(e) => setLineCount(Math.max(1, parseInt(e.target.value) || 100))}
						placeholder="Lines"
						min="1"
					/>

					<label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
						<input
							type="checkbox"
							checked={tailMode}
							onChange={(e) => setTailMode(e.target.checked)}
						/>
						Tail Mode
					</label>

					<ControlButton $variant="primary" onClick={loadFileContent} disabled={isLoading}>
						<span>🔄</span>
						Refresh
					</ControlButton>
				</Toolbar>

				{isLoading && <StatusMessage $type="loading">Loading logs...</StatusMessage>}
				{error && <StatusMessage $type="error">{error}</StatusMessage>}
				{!isLoading && !error && !fileContent && (
					<StatusMessage $type="empty">No content to display</StatusMessage>
				)}
				{!isLoading && !error && fileContent && (
					<LogContent>{processContent(fileContent)}</LogContent>
				)}
			</Content>
		</FloatingContainer>
	);
};

// Helper components
const SourceOptions = () => (
	<>
		<option value="file">📁 Log Files</option>
	</>
);

const FileOptions: React.FC<{ files: LogFile[] }> = ({ files }) => (
	<>
		{files.map((file) => (
			<option key={file.name} value={file.name}>
				{file.name} ({(file.size / 1024).toFixed(1)} KB)
			</option>
		))}
	</>
);

const CategoryOptions = () => (
	<>
		<option value="ALL">📋 All Categories</option>
		<option value="server">🖥️ Server</option>
		<option value="api">🔌 API</option>
		<option value="frontend">🎨 Frontend</option>
		<option value="mfa">🔐 MFA</option>
		<option value="oauth">🔑 OAuth</option>
		<option value="other">📄 Other</option>
	</>
);
