/**
 * @file EnhancedFloatingLogViewer.tsx
 * @module components
 * @description Enhanced floating log viewer focused on API learning and debugging
 * @version 1.0.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
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
	background: white;
	border: 2px solid var(--ping-bg-primary, #2563eb);
	border-radius: ${(props) => (props.$isMinimized ? '20px' : '12px')};
	box-shadow: 0 10px 30px rgba(37, 99, 235, 0.2);
	z-index: 9999;
	display: flex;
	flex-direction: column;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	transition: all 0.15s ease-in-out;
`;

const Header = styled.div<{ $isMinimized?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: ${(props) => (props.$isMinimized ? '8px 12px' : '12px 16px')};
	background: linear-gradient(
		135deg,
		var(--ping-bg-primary, #2563eb),
		var(--ping-bg-primary-hover, #1d4ed8)
	);
	color: white;
	border-radius: ${(props) => (props.$isMinimized ? '18px 18px 0 0' : '10px 10px 0 0')};
	cursor: move;
	user-select: none;
`;

const Title = styled.div<{ $isMinimized?: boolean }>`
	font-weight: 600;
	font-size: ${(props) => (props.$isMinimized ? '12px' : '14px')};
	display: flex;
	align-items: center;
	gap: 8px;
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

const ControlButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
	background: ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return 'rgba(255, 255, 255, 0.2)';
			case 'success':
				return '#10b981';
			case 'danger':
				return '#ef4444';
			default:
				return 'transparent';
		}
	}};
	color: white;
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 4px;
	padding: 4px 6px;
	cursor: pointer;
	font-size: 11px;
	transition: all 0.15s ease-in-out;
	display: flex;
	align-items: center;
	gap: 2px;

	&:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(1.05);
	}
`;

const Content = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

const QuickStats = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 8px;
	padding: 12px 16px;
	background: linear-gradient(135deg, #f8fafc, #e2e8f0);
	border-bottom: 1px solid var(--ping-border-primary, #d1d5db);
`;

const StatCard = styled.div`
	text-align: center;
	padding: 8px;
	background: white;
	border-radius: 6px;
	border: 1px solid #e5e7eb;
`;

const StatValue = styled.div<{ $color?: string }>`
	font-size: 18px;
	font-weight: bold;
	color: ${(props) => props.$color || 'var(--ping-text-color, #1a1a1a)'};
`;

const StatLabel = styled.div`
	font-size: 10px;
	color: #6b7280;
	margin-top: 2px;
`;

const Toolbar = styled.div`
	display: flex;
	gap: 8px;
	padding: 8px 16px;
	background: #f8f9fa;
	border-bottom: 1px solid var(--ping-border-primary, #d1d5db);
	align-items: center;
	flex-wrap: wrap;
`;

const Select = styled.select`
	padding: 4px 8px;
	border: 1px solid var(--ping-border-primary, #d1d5db);
	border-radius: 4px;
	background: white;
	font-size: 11px;
	min-width: 120px;
`;

const FilterChip = styled.button<{ $active?: boolean }>`
	padding: 3px 8px;
	border: 1px solid ${(props) => (props.$active ? 'var(--ping-bg-primary, #2563eb)' : '#d1d5db')};
	background: ${(props) => (props.$active ? 'var(--ping-bg-primary, #2563eb)' : 'white')};
	color: ${(props) => (props.$active ? 'white' : '#374151')};
	border-radius: 12px;
	font-size: 10px;
	cursor: pointer;
	transition: all 0.15s ease-in-out;

	&:hover {
		background: ${(props) => (props.$active ? 'var(--ping-bg-primary-hover, #1d4ed8)' : '#f3f4f6')};
	}
`;

const LogContent = styled.div`
	flex: 1;
	padding: 12px;
	overflow-y: auto;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 10px;
	line-height: 1.4;
	background: #0f172a;
	color: #e2e8f0;
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
	const [selectedCategory, setSelectedCategory] = useState<LogCategory>('API_CALLS');
	const [lineCount, setLineCount] = useState<number>(50);
	const [tailMode, setTailMode] = useState<boolean>(true);
	const [analysis, setAnalysis] = useState<LogAnalysis | null>(null);
	const [apiCalls, setApiCalls] = useState<APICallSummary[]>([]);

	const navigate = useNavigate();

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
				case 'file':
					const logContent = await LogFileService.readLogFile(selectedFile, lineCount, tailMode);
					content = logContent.content;
					break;
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

	const openPopout = () => {
		navigate('/v9/debug-logs-popout');
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
						<span>🔍 API Debugger</span>
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
					<span>🔍 Enhanced API Debugger</span>
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
					<ControlButton $variant="danger" onClick={onClose} title="Close">
						❌
					</ControlButton>
				</Controls>
			</Header>

			<Content>
				{analysis && (
					<QuickStats>
						<StatCard>
							<StatValue $color={analysis.errorCalls > 0 ? '#ef4444' : '#10b981'}>
								{analysis.totalCalls}
							</StatValue>
							<StatLabel>Total API Calls</StatLabel>
						</StatCard>
						<StatCard>
							<StatValue $color={analysis.successRate < 90 ? '#f59e0b' : '#10b981'}>
								{analysis.successRate.toFixed(1)}%
							</StatValue>
							<StatLabel>Success Rate</StatLabel>
						</StatCard>
						<StatCard>
							<StatValue $color={analysis.errorCalls > 0 ? '#ef4444' : '#6b7280'}>
								{analysis.errorCalls}
							</StatValue>
							<StatLabel>Failed Calls</StatLabel>
						</StatCard>
					</QuickStats>
				)}

				<Toolbar>
					<Select
						value={selectedFile}
						onChange={(e) => setSelectedFile(e.target.value)}
						disabled={!availableFiles.length}
					>
						<FileOptions files={availableFiles} />
					</Select>

					<FilterChip
						$active={selectedCategory === 'API_CALLS'}
						onClick={() => setSelectedCategory('API_CALLS')}
					>
						🔌 API Calls
					</FilterChip>
					<FilterChip
						$active={selectedCategory === 'ERRORS'}
						onClick={() => setSelectedCategory('ERRORS')}
					>
						❌ Errors
					</FilterChip>
					<FilterChip
						$active={selectedCategory === 'AUTH_FLOW'}
						onClick={() => setSelectedCategory('AUTH_FLOW')}
					>
						🔐 Auth Flow
					</FilterChip>
					<FilterChip
						$active={selectedCategory === 'DEBUG'}
						onClick={() => setSelectedCategory('DEBUG')}
					>
						🐛 Debug
					</FilterChip>

					<ControlButton $variant="primary" onClick={loadFileContent} disabled={isLoading}>
						🔄 Refresh
					</ControlButton>
				</Toolbar>

				{generateLearningTip() && <LearningTip>{generateLearningTip()}</LearningTip>}

				{isLoading && <StatusMessage $type="loading">Loading API logs...</StatusMessage>}
				{error && <StatusMessage $type="error">{error}</StatusMessage>}
				{!isLoading && !error && !fileContent && (
					<StatusMessage $type="empty">No API activity to display</StatusMessage>
				)}
				{!isLoading && !error && fileContent && (
					<LogContent>
						{selectedCategory === 'API_CALLS' && apiCalls.length > 0
							? apiCalls.map((call, index) => (
									<APICallCard key={index} $success={call.success}>
										<APICallHeader>
											<APIMethod $method={call.method}>{call.method}</APIMethod>
											<span
												style={{ fontSize: '9px', color: call.success ? '#10b981' : '#ef4444' }}
											>
												{call.status}
											</span>
										</APICallHeader>
										<APIUrl>{call.url}</APIUrl>
										<APIDetails>
											<span>🕒 {call.timestamp}</span>
											{call.duration && <span>⏱️ {call.duration}ms</span>}
										</APIDetails>
									</APICallCard>
								))
							: fileContent}
					</LogContent>
				)}
			</Content>
		</FloatingContainer>
	);
};

// Helper components
const FileOptions: React.FC<{ files: LogFile[] }> = ({ files }) => (
	<>
		{files.map((file) => (
			<option key={file.name} value={file.name}>
				{file.name.includes('api') ? '🔌' : file.name.includes('server') ? '🖥️' : '📄'} {file.name}{' '}
				({(file.size / 1024).toFixed(1)} KB)
			</option>
		))}
	</>
);
