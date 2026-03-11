/**
 * @file EnhancedFloatingLogViewer.tsx
 * @module components
 * @description Enhanced floating log viewer focused on API learning and debugging
 * @version 1.0.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { type LogFile, LogFileService } from '../services/logFileService';
import { logger } from '../utils/logger';

// Maximum string length to avoid browser crashes (approximately 50MB)
const MAX_STRING_LENGTH = 50 * 1024 * 1024;

interface LogEntry {
	timestamp: string;
	level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
	category: string;
	message: string;
	data?: Record<string, unknown>;
	url: string;
}

type LogCategory = 'ALL' | 'API_CALLS' | 'AUTH_FLOW' | 'ERRORS' | 'DEBUG' | 'SERVER' | 'FRONTEND';

/** Log level for professional level-based coloring and counts */
type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'none';

/** Detect log level from a line (timestamp + level patterns). */
function getLogLevel(line: string): LogLevel {
	const trimmed = line.trim();
	if (/\[ERROR\]|❌|\(ERROR\)|\bERROR\b.*\b(?:error|failed|exception)\b/i.test(trimmed))
		return 'error';
	if (/\[WARN\]|⚠️|\(WARN\)|\bWARN\b/i.test(trimmed)) return 'warn';
	if (/\[INFO\]|ℹ️|\[LOG\]/i.test(trimmed)) return 'info';
	if (/\[DEBUG\]|🔍|\bDEBUG\b/i.test(trimmed)) return 'debug';
	return 'none';
}

/** Count lines by level in content. */
function countByLevel(content: string): {
	total: number;
	error: number;
	warn: number;
	info: number;
	debug: number;
} {
	const lines = content.split('\n').filter((l) => l.length > 0);
	let error = 0,
		warn = 0,
		info = 0,
		debug = 0;
	lines.forEach((line) => {
		const level = getLogLevel(line);
		if (level === 'error') error++;
		else if (level === 'warn') warn++;
		else if (level === 'info') info++;
		else if (level === 'debug') debug++;
	});
	return { total: lines.length, error, warn, info, debug };
}

/** Filter log content by category so the category filter chips actually change what is shown. */
function filterLogContentByCategory(content: string, category: LogCategory): string {
	if (!content || category === 'ALL') return content;
	const lines = content.split('\n');
	const lower = (s: string) => s.toLowerCase();
	const filtered = lines.filter((line) => {
		const l = line;
		const lc = lower(l);
		switch (category) {
			case 'API_CALLS':
				return (
					/API CALL START|API CALL END|REQUEST\/RESPONSE SUMMARY|Endpoint:|Method:|🔧 Method|📍 Endpoint|📋 BACKEND/.test(
						l
					) || /^(GET|POST|PUT|DELETE|PATCH)\s+https?:\/\//i.test(l)
				);
			case 'ERRORS':
				return (
					/ERROR|❌|Failed|status: [45]\d{2}|500|501|502|503|exception|Error:/i.test(l) ||
					/\(ERROR\)|UNKNOWN.*status/i.test(l)
				);
			case 'AUTH_FLOW':
				return (
					/auth|token|Bearer|authorize|oauth|pingone|OAuth|login|signoff|introspect|userinfo/i.test(
						lc
					) || /🔐|authorization_endpoint|token_endpoint/.test(l)
				);
			case 'DEBUG':
				return (
					/DEBUG|🚀|🏁|START:|END:|───|===|📝 Operation|📊 Metadata|📊 Context/.test(l) ||
					/API CALL START|API CALL END/.test(l)
				);
			default:
				return true;
		}
	});
	return filtered.join('\n');
}
type LogSource = 'file' | 'realtime';

interface APICallSummary {
	method: string;
	url: string;
	status: number;
	duration?: number;
	timestamp: string;
	success: boolean;
}

interface LogAnalysis {
	totalCalls: number;
	errorCalls: number;
	successRate: number;
	avgResponseTime?: number;
	mostActiveEndpoint?: string;
	recentErrors: string[];
}

const FloatingContainer = styled.div<{
	width: number;
	height: number;
	x: number;
	y: number;
	$isMinimized?: boolean;
}>`
	position: fixed;
	top: ${(props) => props.y}px;
	left: ${(props) => props.x}px;
	width: ${(props) => (props.$isMinimized ? '280px' : `${props.width}px`)};
	height: ${(props) => (props.$isMinimized ? '40px' : `${props.height}px`)};
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: ${(props) => (props.$isMinimized ? '20px' : '8px')};
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
	z-index: 9999;
	display: flex;
	flex-direction: column;
	font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	transition: all 0.15s ease-in-out;
	overflow: hidden;
`;

const Header = styled.div<{ $isMinimized?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: ${(props) => (props.$isMinimized ? '8px 12px' : '10px 14px')};
	background: #1e293b;
	color: #f8fafc;
	border-radius: ${(props) => (props.$isMinimized ? '18px 18px 0 0' : '8px 8px 0 0')};
	cursor: move;
	user-select: none;
`;

const Title = styled.div<{ $isMinimized?: boolean }>`
	font-weight: 600;
	font-size: ${(props) => (props.$isMinimized ? '12px' : '13px')};
	display: flex;
	align-items: center;
	gap: 8px;
	letter-spacing: 0.01em;
`;

const StatusIndicator = styled.div<{ $status: 'active' | 'idle' | 'error' }>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${(props) => {
		switch (props.$status) {
			case 'active':
				return '#10b981';
			case 'error':
				return '#ef4444';
			default:
				return '#f59e0b';
		}
	}};
	animation: ${(props) => (props.$status === 'active' ? 'pulse 2s infinite' : 'none')};

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
`;

const Controls = styled.div`
	display: flex;
	gap: 6px;
`;

const ControlButton = styled.button<{
	$variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'close';
}>`
	background: ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return 'rgba(255, 255, 255, 0.2)';
			case 'success':
				return '#10b981';
			case 'danger':
				return '#ef4444';
			case 'close':
				return '#ffffff';
			default:
				return 'transparent';
		}
	}};
	color: ${(props) => (props.$variant === 'close' ? '#dc2626' : 'white')};
	border: 1px solid ${(props) => (props.$variant === 'close' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)')};
	border-radius: 4px;
	padding: 4px 6px;
	cursor: pointer;
	font-size: 11px;
	transition: all 0.15s ease-in-out;
	display: flex;
	align-items: center;
	gap: 2px;

	&:hover {
		background: ${(props) => (props.$variant === 'close' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)')};
		transform: scale(1.05);
	}
`;

const Content = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

const StatsBar = styled.div`
	display: flex;
	align-items: center;
	gap: 20px;
	padding: 6px 14px;
	background: #f1f5f9;
	border-bottom: 1px solid #e2e8f0;
	font-size: 11px;
	color: #475569;
`;

const StatItem = styled.span<{ $highlight?: boolean; $color?: string }>`
	font-weight: ${(props) => (props.$highlight ? '600' : '500')};
	color: ${(props) => props.$color ?? 'inherit'};
`;

const Toolbar = styled.div`
	display: flex;
	gap: 8px;
	padding: 8px 14px;
	background: #ffffff;
	border-bottom: 1px solid #e2e8f0;
	align-items: center;
	flex-wrap: wrap;
`;

const Select = styled.select`
	padding: 5px 10px;
	border: 1px solid #cbd5e1;
	border-radius: 6px;
	background: #ffffff;
	font-size: 12px;
	min-width: 140px;
	color: #334155;
`;

const FilterChip = styled.button<{ $active?: boolean }>`
	padding: 4px 10px;
	border: 1px solid ${(props) => (props.$active ? '#2563eb' : '#cbd5e1')};
	background: ${(props) => (props.$active ? '#2563eb' : '#ffffff')};
	color: ${(props) => (props.$active ? '#ffffff' : '#475569')};
	border-radius: 6px;
	font-size: 11px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.12s ease;

	&:hover {
		background: ${(props) => (props.$active ? '#1d4ed8' : '#f1f5f9')};
		border-color: ${(props) => (props.$active ? '#1d4ed8' : '#94a3b8')};
	}
`;

const SearchInput = styled.input`
	padding: 5px 10px;
	border: 1px solid #cbd5e1;
	border-radius: 6px;
	font-size: 12px;
	width: 140px;
	color: #334155;
	&::placeholder {
		color: #94a3b8;
	}
`;

const ToolbarBtn = styled.button`
	padding: 5px 12px;
	border: 1px solid #cbd5e1;
	border-radius: 6px;
	background: #ffffff;
	color: #475569;
	font-size: 12px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.12s ease;
	&:hover:not(:disabled) {
		background: #f1f5f9;
		border-color: #94a3b8;
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const LogContent = styled.div`
	flex: 1;
	overflow-y: auto;
	font-family: 'JetBrains Mono', 'SF Mono', 'Monaco', 'Menlo', monospace;
	font-size: 12px;
	line-height: 1.5;
	background: #0f172a;
	color: #e2e8f0;
	white-space: pre;
	word-break: break-all;
`;

const LogTable = styled.div`
	display: flex;
	flex-direction: column;
	min-width: 100%;
`;

const LogLine = styled.div<{ $level: LogLevel }>`
	display: flex;
	align-items: stretch;
	border-left: 3px solid
		${(props) => {
			switch (props.$level) {
				case 'error':
					return '#dc2626';
				case 'warn':
					return '#d97706';
				case 'info':
					return '#2563eb';
				case 'debug':
					return '#6b7280';
				default:
					return 'transparent';
			}
		}};
	background: ${(props) => (props.$level === 'error' ? 'rgba(220, 38, 38, 0.08)' : 'transparent')};
	&:hover {
		background: rgba(248, 250, 252, 0.04);
	}
`;

const LineNum = styled.span`
	display: inline-block;
	min-width: 48px;
	padding: 2px 10px 2px 12px;
	text-align: right;
	color: #64748b;
	font-size: 11px;
	user-select: none;
	flex-shrink: 0;
`;

const LineText = styled.span`
	padding: 2px 12px 2px 8px;
	white-space: pre-wrap;
	word-break: break-all;
`;

const APICallCard = styled.div<{ $success?: boolean }>`
	margin: 4px 0;
	padding: 8px;
	background: ${(props) => (props.$success ? '#10b98120' : '#ef444420')};
	border-left: 3px solid ${(props) => (props.$success ? '#10b981' : '#ef4444')};
	border-radius: 4px;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const APICallHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 4px;
`;

const APIMethod = styled.span<{ $method: string }>`
	padding: 2px 6px;
	border-radius: 3px;
	font-size: 9px;
	font-weight: bold;
	background: ${(props) => {
		switch (props.$method) {
			case 'GET':
				return '#10b981';
			case 'POST':
				return '#3b82f6';
			case 'PUT':
				return '#f59e0b';
			case 'DELETE':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	}};
	color: white;
`;

const APIUrl = styled.div`
	font-size: 10px;
	color: #94a3b8;
	margin-bottom: 2px;
`;

const APIDetails = styled.div`
	font-size: 9px;
	color: #64748b;
	display: flex;
	gap: 12px;
`;

const LearningTip = styled.div`
	padding: 8px 12px;
	background: linear-gradient(135deg, #fef3c7, #fde68a);
	border-left: 3px solid #f59e0b;
	border-radius: 4px;
	margin: 8px 0;
	font-size: 11px;
	color: #92400e;
`;

const StatusMessage = styled.div<{ $type: 'loading' | 'error' | 'empty' }>`
	padding: 20px;
	text-align: center;
	color: ${(props) => {
		switch (props.$type) {
			case 'error':
				return '#ef4444';
			case 'loading':
				return 'var(--ping-bg-primary, #2563eb)';
			default:
				return '#6b7280';
		}
	}};
	font-size: 12px;
`;

interface EnhancedFloatingLogViewerProps {
	isOpen: boolean;
	onClose: () => void;
	initialWidth?: number;
	initialHeight?: number;
	initialX?: number;
	initialY?: number;
}

export const EnhancedFloatingLogViewer: React.FC<EnhancedFloatingLogViewerProps> = ({
	isOpen,
	onClose,
	initialWidth = 900,
	initialHeight = 700,
	initialX = 50,
	initialY = 50,
}) => {
	const [position, setPosition] = useState({ x: initialX, y: initialY });
	const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
	const [isDragging, setIsDragging] = useState(false);
	const [isMaximized, setIsMaximized] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const [isRealtime, setIsRealtime] = useState(false);
	const dragRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });

	// Log viewer state
	const [availableFiles, setAvailableFiles] = useState<LogFile[]>([]);
	const [selectedFile, setSelectedFile] = useState<string>('pingone-api.log');
	const [fileContent, setFileContent] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string>('');
	const [logSource, setLogSource] = useState<LogSource>('file');
	const [selectedCategory, setSelectedCategory] = useState<LogCategory>('ALL');
	const [lineCount, setLineCount] = useState<number>(50);
	const [tailMode, setTailMode] = useState<boolean>(true);
	const [analysis, setAnalysis] = useState<LogAnalysis | null>(null);
	const [apiCalls, setApiCalls] = useState<APICallSummary[]>([]);
	const [searchQuery, setSearchQuery] = useState('');

	// Parse API calls from log content
	const parseAPICalls = useCallback((content: string): APICallSummary[] => {
		const calls: APICallSummary[] = [];
		const lines = content.split('\n');

		lines.forEach((line) => {
			// Look for API call patterns
			const apiCallMatch = line.match(
				/(GET|POST|PUT|DELETE|PATCH)\s+(https?:\/\/[^\s]+).*?(\d{3})/
			);
			if (apiCallMatch) {
				calls.push({
					method: apiCallMatch[1],
					url: apiCallMatch[2],
					status: parseInt(apiCallMatch[3]),
					timestamp: line.substring(0, 23) || new Date().toISOString(),
					success: parseInt(apiCallMatch[3]) < 400,
				});
			}
		});

		return calls.slice(-10); // Show last 10 calls
	}, []);

	// Analyze log content
	const analyzeLogs = useCallback(
		(content: string): LogAnalysis => {
			const lines = content.split('\n');
			const calls = parseAPICalls(content);
			const errors = lines
				.filter((line) => line.includes('ERROR') || line.includes('Failed') || line.includes('500'))
				.slice(-5);

			const successCalls = calls.filter((call) => call.success);
			const totalCalls = calls.length;

			return {
				totalCalls,
				errorCalls: calls.length - successCalls.length,
				successRate: totalCalls > 0 ? (successCalls.length / totalCalls) * 100 : 0,
				mostActiveEndpoint: calls.length > 0 ? calls[0].url : undefined,
				recentErrors: errors,
			};
		},
		[parseAPICalls]
	);

	// Load available files
	const loadAvailableFiles = useCallback(async () => {
		try {
			const files = await LogFileService.listLogFiles();
			setAvailableFiles(files);
			if (files.length > 0 && !selectedFile) {
				const apiFile = files.find((f) => f.name.includes('api')) || files[0];
				setSelectedFile(apiFile.name);
			}
		} catch (err) {
			setError('Failed to load available files');
			logger.error('EnhancedFloatingLogViewer: Failed to load files', err);
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
			const calls = parseAPICalls(content);
			setApiCalls(calls);
			setAnalysis(analyzeLogs(content));
		} catch (err) {
			setError(`Failed to load content: ${err instanceof Error ? err.message : 'Unknown error'}`);
			logger.error('EnhancedFloatingLogViewer: Failed to load content', err);
		} finally {
			setIsLoading(false);
		}
	}, [selectedFile, logSource, lineCount, tailMode, parseAPICalls, analyzeLogs]);

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

	// Realtime updates
	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (isRealtime && isOpen) {
			interval = setInterval(() => {
				loadFileContent();
			}, 2000);
		}
		return () => clearInterval(interval);
	}, [isRealtime, isOpen, loadFileContent]);

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

	const handleCopyLogs = useCallback(() => {
		const content = filterLogContentByCategory(fileContent, selectedCategory) || '';
		if (!content) return;
		navigator.clipboard.writeText(content).then(() => {
			// Optional: show brief toast via modernMessaging if available
		});
	}, [fileContent, selectedCategory]);

	/** Open Enhanced API Debugger in a separate window (outside the main browser tab). */
	const openPopout = () => {
		const w = 1200;
		const h = 800;
		const left = Math.max(0, (window.screen.width - w) / 2);
		const top = Math.max(0, (window.screen.height - h) / 2);
		const features = `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes,noopener,noreferrer`;
		const popup = window.open('/v9/debug-logs-popout', 'enhancedApiDebuggerPopout', features);
		if (popup) popup.focus();
	};

	// Generate learning tips
	const generateLearningTip = (): string => {
		if (!analysis) return '';

		if (analysis.errorCalls > 0) {
			return `🔍 Debug Tip: You have ${analysis.errorCalls} failed API calls. Check the error messages above to understand what went wrong.`;
		}

		if (analysis.totalCalls > 0 && analysis.successRate < 100) {
			return `📊 API Health: ${analysis.successRate.toFixed(1)}% success rate. Consider checking failed requests for patterns.`;
		}

		if (analysis.mostActiveEndpoint) {
			return `🎯 Most Active: ${analysis.mostActiveEndpoint}. This endpoint is being called frequently - monitor for performance.`;
		}

		return '💡 Pro Tip: Use the category filters to focus on specific types of log entries for better debugging.';
	};

	if (!isOpen) return null;

	if (isMinimized) {
		return (
			<FloatingContainer width={280} height={40} x={position.x} y={position.y} $isMinimized>
				<Header $isMinimized onMouseDown={handleMouseDown}>
					<Title $isMinimized>
						<StatusIndicator $status={analysis?.errorCalls > 0 ? 'error' : 'active'} />
						<span>Log Viewer</span>
						{analysis && (
							<span style={{ fontSize: '10px', opacity: 0.8 }}>({analysis.totalCalls} calls)</span>
						)}
					</Title>
					<Controls>
						<ControlButton onClick={() => setIsMinimized(false)} title="Expand">
							📄
						</ControlButton>
					</Controls>
				</Header>
			</FloatingContainer>
		);
	}

	return (
		<FloatingContainer
			width={size.width}
			height={size.height}
			x={position.x}
			y={position.y}
			$isMinimized={isMinimized}
		>
			<Header $isMinimized={isMinimized} onMouseDown={handleMouseDown}>
				<Title>
					<StatusIndicator
						$status={analysis?.errorCalls > 0 ? 'error' : isRealtime ? 'active' : 'idle'}
					/>
					<span>Log Viewer</span>
				</Title>
				<Controls>
					<ControlButton
						onClick={() => setIsRealtime(!isRealtime)}
						$variant={isRealtime ? 'success' : 'secondary'}
						title={isRealtime ? 'Stop realtime' : 'Start realtime'}
					>
						{isRealtime ? '⏸️' : '▶️'}
					</ControlButton>
					<ControlButton onClick={openPopout} title="Open in new window">
						🔗
					</ControlButton>
					<ControlButton
						onClick={() => setIsMinimized(!isMinimized)}
						title={isMinimized ? 'Expand' : 'Minimize'}
					>
						{isMinimized ? '📄' : '📋'}
					</ControlButton>
					<ControlButton onClick={toggleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
						{isMaximized ? '🗗' : '🗖'}
					</ControlButton>
					<ControlButton $variant="close" onClick={onClose} title="Close">
						❌
					</ControlButton>
				</Controls>
			</Header>

			<Content>
				{fileContent && (
					<StatsBar>
						{(() => {
							const counts = countByLevel(
								filterLogContentByCategory(fileContent, selectedCategory)
							);
							return (
								<>
									<StatItem>
										Lines: <strong>{counts.total}</strong>
									</StatItem>
									<StatItem $highlight $color={counts.error > 0 ? '#dc2626' : undefined}>
										Errors: {counts.error}
									</StatItem>
									<StatItem $highlight $color={counts.warn > 0 ? '#d97706' : undefined}>
										Warnings: {counts.warn}
									</StatItem>
									<StatItem>Info: {counts.info}</StatItem>
									<StatItem>Debug: {counts.debug}</StatItem>
									{analysis && analysis.totalCalls > 0 && (
										<StatItem>
											API calls: {analysis.totalCalls} ({analysis.successRate.toFixed(0)}% ok)
										</StatItem>
									)}
								</>
							);
						})()}
					</StatsBar>
				)}

				<Toolbar>
					<Select
						value={selectedFile}
						onChange={(e) => setSelectedFile(e.target.value)}
						disabled={!availableFiles.length}
					>
						<FileOptions files={availableFiles} />
					</Select>
					<Select value={lineCount} onChange={(e) => setLineCount(Number(e.target.value))}>
						<option value={50}>50 lines</option>
						<option value={100}>100 lines</option>
						<option value={200}>200 lines</option>
						<option value={500}>500 lines</option>
					</Select>
					<FilterChip
						$active={selectedCategory === 'ALL'}
						onClick={() => setSelectedCategory('ALL')}
					>
						All
					</FilterChip>
					<FilterChip
						$active={selectedCategory === 'API_CALLS'}
						onClick={() => setSelectedCategory('API_CALLS')}
					>
						API
					</FilterChip>
					<FilterChip
						$active={selectedCategory === 'ERRORS'}
						onClick={() => setSelectedCategory('ERRORS')}
					>
						Errors
					</FilterChip>
					<FilterChip
						$active={selectedCategory === 'AUTH_FLOW'}
						onClick={() => setSelectedCategory('AUTH_FLOW')}
					>
						Auth
					</FilterChip>
					<FilterChip
						$active={selectedCategory === 'DEBUG'}
						onClick={() => setSelectedCategory('DEBUG')}
					>
						Debug
					</FilterChip>
					<SearchInput
						type="text"
						placeholder="Search logs..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					<ToolbarBtn onClick={loadFileContent} disabled={isLoading}>
						Refresh
					</ToolbarBtn>
					<ToolbarBtn onClick={handleCopyLogs} disabled={!fileContent} title="Copy to clipboard">
						Copy
					</ToolbarBtn>
				</Toolbar>

				{isLoading && <StatusMessage $type="loading">Loading logs…</StatusMessage>}
				{error && <StatusMessage $type="error">{error}</StatusMessage>}
				{!isLoading && !error && !fileContent && (
					<StatusMessage $type="empty">
						No log file selected or log source unavailable.
					</StatusMessage>
				)}
				{!isLoading &&
					!error &&
					fileContent &&
					(() => {
						const filtered = filterLogContentByCategory(fileContent, selectedCategory);
						const lines = filtered ? filtered.split('\n') : [];
						const searchLower = searchQuery.trim().toLowerCase();
						const visibleLines = searchLower
							? lines.filter((line) => line.toLowerCase().includes(searchLower))
							: lines;
						if (visibleLines.length === 0) {
							return (
								<LogContent>
									<StatusMessage $type="empty">
										{lines.length === 0
											? `No lines match the "${selectedCategory === 'API_CALLS' ? 'API' : selectedCategory === 'AUTH_FLOW' ? 'Auth' : selectedCategory === 'ERRORS' ? 'Errors' : 'Debug'}" filter.`
											: 'No lines match the search.'}
									</StatusMessage>
								</LogContent>
							);
						}
						return (
							<LogContent>
								<LogTable>
									{visibleLines.map((line, idx) => {
										const level = getLogLevel(line);
										return (
											<LogLine key={idx} $level={level}>
												<LineNum>{idx + 1}</LineNum>
												<LineText>{line || ' '}</LineText>
											</LogLine>
										);
									})}
								</LogTable>
							</LogContent>
						);
					})()}
			</Content>
		</FloatingContainer>
	);
};

// Helper components
const FileOptions: React.FC<{ files: LogFile[] }> = ({ files }) => (
	<>
		{files.map((file) => (
			<option key={file.name} value={file.name}>
				{file.name.includes('api') ? '🔌' : file.name.includes('server') ? '🖥️' : '📄'} {file.name} (
				{(file.size / 1024).toFixed(1)} KB)
			</option>
		))}
	</>
);
