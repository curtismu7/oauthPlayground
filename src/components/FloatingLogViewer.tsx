/**
 * @file FloatingLogViewer.tsx
 * @module components
 * @description Floating pop-out log viewer for real-time monitoring
 * @version 1.0.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	FiDownload,
	FiExternalLink,
	FiMaximize2,
	FiMinimize2,
	FiRefreshCw,
	FiX,
} from 'react-icons/fi';
import styled from 'styled-components';
import { useServerStatusOptional } from './ServerStatusProvider';
import { type LogFile, LogFileService } from '../services/logFileService';

const BACKEND_DOWN_MESSAGE =
	'Log API not available. Start the backend server (e.g. ./run.sh) to view logs.';

/** Startup log types (same options as run.sh 1–11); always selectable in Debug Log Viewer. */
const STARTUP_LOG_OPTIONS: Array<{ value: string; label: string }> = [
	{ value: 'pingone-api.log', label: 'PingOne API (all calls)' },
	{ value: 'real-api.log', label: 'Real API (direct only)' },
	{ value: 'server.log', label: 'Server log' },
	{ value: 'sms.log', label: 'SMS flow' },
	{ value: 'email.log', label: 'Email flow' },
	{ value: 'whatsapp.log', label: 'WhatsApp flow' },
	{ value: 'voice.log', label: 'Voice flow' },
	{ value: 'fido.log', label: 'FIDO2 flow' },
	{ value: 'backend.log', label: 'Backend log' },
	{ value: 'frontend.log', label: 'Frontend log' },
	{ value: 'startup.log', label: 'Startup log' },
];

// Styled components
const FloatingContainer = styled.div<{ width: number; height: number; x: number; y: number }>`
  position: fixed;
  top: ${(props) => props.y}px;
  left: ${(props) => props.x}px;
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 8px 8px 0 0;
  cursor: move;
  user-select: none;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Controls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ControlButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  background: ${(props) => (props.$variant === 'primary' ? '#3b82f6' : '#f3f4f6')};
  color: ${(props) => (props.$variant === 'primary' ? 'white' : '#374151')};
  border: none;
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.$variant === 'primary' ? '#2563eb' : '#e5e7eb')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ControlsPanel = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const Select = styled.select`
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  background: white;
`;

const LogContent = styled.div<{ $isMinimized: boolean }>`
  flex: 1;
  background: white;
  border-radius: 4px;
  padding: 12px;
  overflow: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  color: #000000;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
  display: ${(props) => (props.$isMinimized ? 'none' : 'block')};
  border: 1px solid #e5e7eb;
`;

const StatusIndicator = styled.div<{ $status: 'connected' | 'disconnected' | 'loading' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => {
		switch (props.$status) {
			case 'connected':
				return '#10b981';
			case 'loading':
				return '#f59e0b';
			case 'disconnected':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	}};
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
`;

const CheckboxInput = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const CheckboxLabel = styled.span`
  font-size: 12px;
  color: #374151;
  user-select: none;
`;

const ResizeHandle = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, #d1d5db 50%);
  border-radius: 0 0 0 8px;
`;

interface FloatingLogViewerProps {
	isOpen: boolean;
	onClose: () => void;
	onPopOut?: () => void;
	standaloneMode?: boolean;
	initialWidth?: number;
	initialHeight?: number;
	initialX?: number;
	initialY?: number;
}

export const FloatingLogViewer: React.FC<FloatingLogViewerProps> = ({
	isOpen,
	onClose,
	onPopOut,
	standaloneMode = false,
	initialWidth = 600,
	initialHeight = 400,
	initialX = 100,
	initialY = 100,
}) => {
	// State
	const [width, setWidth] = useState(initialWidth);
	const [height, setHeight] = useState(initialHeight);
	const [x, setX] = useState(initialX);
	const [y, setY] = useState(initialY);
	const [isMinimized, setIsMinimized] = useState(false);
	const [isMaximized, setIsMaximized] = useState(false);
	const [availableFiles, setAvailableFiles] = useState<LogFile[]>([]);
	const [selectedFile, setSelectedFile] = useState<string>('pingone-api.log');
	const [logContent, setLogContent] = useState<string>('');
	const [isTailMode, setIsTailMode] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });

	// Render log entries with per-level color highlights and visual separation
	const renderLogEntries = (content: string): React.ReactNode => {
		if (!content) return content;

		const lines = content.split('\n');

		return lines.map((line, index) => {
			if (!line.trim()) {
				return <div key={`empty-${index}`} style={{ height: '4px' }} />;
			}

			let prefix = '📝';
			let textColor = '#1f2937';
			let background = '#f9fafb';
			let borderLeft = '#d1d5db';

			if (line.includes('ERROR') || line.includes('error')) {
				prefix = '🔴';
				textColor = '#991b1b';
				background = '#fef2f2';
				borderLeft = '#ef4444';
			} else if (line.includes('WARN') || line.includes('warn')) {
				prefix = '🟡';
				textColor = '#92400e';
				background = '#fffbeb';
				borderLeft = '#f59e0b';
			} else if (line.includes('INFO') || line.includes('info')) {
				prefix = '🔵';
				textColor = '#1e3a8a';
				background = '#eff6ff';
				borderLeft = '#3b82f6';
			} else if (line.includes('DEBUG') || line.includes('debug')) {
				prefix = '🔍';
				textColor = '#0f766e';
				background = '#f0fdfa';
				borderLeft = '#14b8a6';
			}

			return (
				<div key={`line-${index}`}>
					<div
						style={{
							color: textColor,
							background,
							borderLeft: `4px solid ${borderLeft}`,
							padding: '4px 8px',
							borderRadius: '4px',
							whiteSpace: 'pre-wrap',
						}}
					>
						{`${prefix} ${line}`}
					</div>
					{index < lines.length - 1 && (
						<div
							style={{
								borderBottom: '1px dashed #d1d5db',
								margin: '4px 0',
							}}
						/>
					)}
				</div>
			);
		});
	};

	// Refs
	const containerRef = useRef<HTMLDivElement>(null);
	const eventSourceRef = useRef<EventSource | null>(null);

	const { isOnline } = useServerStatusOptional();

	// Load available files
	const loadFiles = useCallback(async () => {
		try {
			const files = await LogFileService.listLogFiles();
			setAvailableFiles(files);
		} catch (err) {
			const msg = err instanceof Error ? err.message : '';
			if (!msg.includes('Log API not available')) {
				console.error('[FloatingLogViewer] Failed to load files:', err);
			}
			setError(msg || 'Failed to load log files');
		}
	}, []);

	// Load log content
	const loadLogContent = useCallback(async () => {
		if (!selectedFile) return;

		setIsLoading(true);
		setError(null);

		try {
			const result = await LogFileService.readLogFile(selectedFile, 100, true);
			setLogContent(result.content);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load log file';
			setError(errorMessage);
			setLogContent('');
		} finally {
			setIsLoading(false);
		}
	}, [selectedFile]);

	// Toggle tail mode
	const toggleTailMode = useCallback(() => {
		if (isTailMode) {
			// Stop tail mode
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
				eventSourceRef.current = null;
			}
			setIsTailMode(false);
		} else {
			// Start tail mode
			if (selectedFile) {
				try {
					const eventSource = LogFileService.createTailStream(selectedFile);
					eventSourceRef.current = eventSource;

					eventSource.onmessage = (event) => {
						try {
							const data = JSON.parse(event.data);
							if (data.type === 'log') {
								setLogContent((prev) => prev + data.content);
							}
						} catch (error) {
							console.error('[FloatingLogViewer] Failed to parse tail data:', error);
						}
					};

					eventSource.onerror = () => {
						console.error('[FloatingLogViewer] Tail stream error');
						setIsTailMode(false);
						eventSourceRef.current = null;
					};

					setIsTailMode(true);
				} catch (error) {
					console.error('[FloatingLogViewer] Failed to start tail mode:', error);
					setError('Failed to start tail mode');
				}
			}
		}
	}, [isTailMode, selectedFile]);

	// Clear logs
	const clearLogs = useCallback(() => {
		setLogContent('');
	}, []);

	// Download logs
	const downloadLogs = useCallback(() => {
		if (!logContent) return;

		const blob = new Blob([logContent], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${selectedFile}-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [logContent, selectedFile]);

	const handlePopOut = useCallback(() => {
		if (onPopOut) {
			onPopOut();
			return;
		}

		// Open the debug log viewer popout
		const popup = window.open(
			`${window.location.origin}/v8/debug-logs-popout`,
			'debug-log-viewer-popout',
			'popup=yes,width=1400,height=900,left=80,top=60,resizable=yes,scrollbars=yes'
		);

		if (!popup) {
			setError('Popup blocked by browser. Allow popups for this site to open detached log viewer.');
			return;
		}

		onClose();
	}, [onPopOut, onClose]);

	// Drag handlers
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === containerRef.current || (e.target as HTMLElement).closest('.header')) {
				setIsDragging(true);
				setDragStart({ x: e.clientX - x, y: e.clientY - y });
			}
		},
		[x, y]
	);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (isDragging && !isMaximized) {
				const newX = e.clientX - dragStart.x;
				const newY = e.clientY - dragStart.y;

				// Keep within viewport bounds
				const maxX = window.innerWidth - width;
				const maxY = window.innerHeight - height;

				setX(Math.max(0, Math.min(newX, maxX)));
				setY(Math.max(0, Math.min(newY, maxY)));
			}
		},
		[isDragging, isMaximized, width, height, dragStart]
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	// Resize handlers
	const handleResizeMouseDown = useCallback(
		(e: React.MouseEvent) => {
			setIsResizing(true);
			setResizeStart({ width, height, x: e.clientX, y: e.clientY });
		},
		[width, height]
	);

	const handleMouseMoveResize = useCallback(
		(e: MouseEvent) => {
			if (isResizing) {
				const newWidth = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x));
				const newHeight = Math.max(200, resizeStart.height + (e.clientY - resizeStart.y));

				setWidth(newWidth);
				setHeight(newHeight);
			}
		},
		[isResizing, resizeStart]
	);

	const handleMouseUpResize = useCallback(() => {
		setIsResizing(false);
	}, []);

	// Toggle maximize
	const toggleMaximize = useCallback(() => {
		if (isMaximized) {
			// Restore previous size
			setWidth(initialWidth);
			setHeight(initialHeight);
			setX(initialX);
			setY(initialY);
			setIsMaximized(false);
		} else {
			// Maximize to viewport
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;
			setWidth(viewportWidth - 40);
			setHeight(viewportHeight - 40);
			setX(20);
			setY(20);
			setIsMaximized(true);
		}
	}, [isMaximized, initialWidth, initialHeight, initialX, initialY]);

	// Effects: when panel opens, load only if backend is up (avoids 404 in console).
	// In standalone (popout) mode we have no ServerStatusProvider so isOnline is always true;
	// skip auto-load there to avoid 404s — user can click Refresh to load.
	useEffect(() => {
		if (!isOpen) return;
		if (standaloneMode) {
			setError(null);
			setLogContent('');
			return;
		}
		if (!isOnline) {
			setAvailableFiles([]);
			setError(BACKEND_DOWN_MESSAGE);
			setLogContent('');
			return;
		}
		setError(null);
		loadFiles();
		loadLogContent();
	}, [isOpen, isOnline, standaloneMode, loadFiles, loadLogContent]);

	useEffect(() => {
		// Stop tail mode when component unmounts or file changes
		return () => {
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
				eventSourceRef.current = null;
			}
		};
	}, []);

	// Stop tail mode when file changes
	const stopTailMode = useCallback(() => {
		if (isTailMode && eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
			setIsTailMode(false);
		}
	}, [isTailMode]);

	// Stop tail mode and load content when file changes (only if backend is up; skip auto in standalone)
	useEffect(() => {
		stopTailMode();
		if (standaloneMode) return;
		if (isOnline) {
			loadLogContent();
		}
	}, [stopTailMode, loadLogContent, isOnline, selectedFile, standaloneMode]);

	// Global mouse event listeners
	useEffect(() => {
		const handleGlobalMouseMove = (e: MouseEvent) => {
			handleMouseMove(e);
			handleMouseMoveResize(e);
		};

		const handleGlobalMouseUp = () => {
			handleMouseUp();
			handleMouseUpResize();
		};

		if (isDragging || isResizing) {
			document.addEventListener('mousemove', handleGlobalMouseMove);
			document.addEventListener('mouseup', handleGlobalMouseUp);

			return () => {
				document.removeEventListener('mousemove', handleGlobalMouseMove);
				document.removeEventListener('mouseup', handleGlobalMouseUp);
			};
		}
	}, [
		isDragging,
		isResizing,
		handleMouseMove,
		handleMouseUp,
		handleMouseMoveResize,
		handleMouseUpResize,
	]);

	if (!isOpen) return null;

	return (
		<FloatingContainer
			ref={containerRef}
			width={isMaximized ? window.innerWidth - 40 : width}
			height={isMaximized ? window.innerHeight - 40 : isMinimized ? 40 : height}
			x={isMaximized ? 20 : x}
			y={isMaximized ? 20 : y}
			onMouseDown={handleMouseDown}
		>
			<Header className="header">
				<Title>
					<StatusIndicator $status={isTailMode ? 'connected' : 'disconnected'} />
					Debug Log Viewer
				</Title>
				<Controls>
					{!standaloneMode && (
						<ControlButton
							$variant="secondary"
							onClick={handlePopOut}
							title="Popout window - Open Debug Log Viewer in separate window"
						>
							<FiExternalLink />
							<span style={{ marginLeft: 4, fontSize: 12 }}>Popout window</span>
						</ControlButton>
					)}
					<ControlButton
						$variant="secondary"
						onClick={() => setIsMinimized(!isMinimized)}
						title={isMinimized ? 'Expand' : 'Minimize'}
					>
						{isMinimized ? <FiMaximize2 /> : <FiMinimize2 />}
					</ControlButton>
					<ControlButton
						$variant="secondary"
						onClick={toggleMaximize}
						title={isMaximized ? 'Restore' : 'Maximize'}
					>
						{isMaximized ? '🗗' : '🗖'}
					</ControlButton>
					<ControlButton $variant="secondary" onClick={onClose} title="Close">
						<FiX />
					</ControlButton>
				</Controls>
			</Header>

			{!isMinimized && (
				<Content>
					<ControlsPanel>
						<Select
							value={selectedFile}
							onChange={(e) => setSelectedFile(e.target.value)}
							disabled={isLoading || isTailMode}
						>
							{STARTUP_LOG_OPTIONS.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
							{availableFiles
								.filter((file) => !STARTUP_LOG_OPTIONS.some((s) => s.value === file.name))
								.map((file) => (
									<option key={file.name} value={file.name}>
										{file.name} ({(file.size / 1024).toFixed(1)}KB)
									</option>
								))}
						</Select>

						<CheckboxContainer
							onClick={toggleTailMode}
							title={
								isTailMode
									? 'Stop tailing - Disable real-time log updates'
									: 'Live tail - Enable real-time log updates'
							}
						>
							<CheckboxInput
								type="checkbox"
								checked={isTailMode}
								onChange={toggleTailMode}
								disabled={isLoading}
							/>
							<CheckboxLabel>Live tail</CheckboxLabel>
						</CheckboxContainer>

						<ControlButton
							$variant="secondary"
							onClick={loadLogContent}
							disabled={isLoading || isTailMode}
							title="Refresh log content from file"
						>
							<FiRefreshCw />
						</ControlButton>

						<ControlButton $variant="secondary" onClick={clearLogs} title="Clear all log content">
							Clear
						</ControlButton>

						<ControlButton
							$variant="secondary"
							onClick={downloadLogs}
							disabled={!logContent}
							title="Download log content as file"
						>
							<FiDownload />
						</ControlButton>
					</ControlsPanel>

					{error && (
						<div
							style={{
								background: '#fef2f2',
								border: '1px solid #fecaca',
								borderRadius: '4px',
								padding: '8px',
								marginBottom: '8px',
								color: '#991b1b',
								fontSize: '12px',
							}}
						>
							Error: {error}
						</div>
					)}

					{isLoading && (
						<div
							style={{
								textAlign: 'center',
								padding: '20px',
								color: '#6b7280',
								fontSize: '12px',
							}}
						>
							Loading...
						</div>
					)}

					<LogContent $isMinimized={isMinimized}>
						{logContent
							? renderLogEntries(logContent)
							: 'No log content. Select a file and click Refresh to view logs.'}
					</LogContent>
				</Content>
			)}

			{!isMaximized && !isMinimized && <ResizeHandle onMouseDown={handleResizeMouseDown} />}
		</FloatingContainer>
	);
};
