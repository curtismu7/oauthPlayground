/**
 * @file LogViewer.tsx
 * @module components
 * @description Log viewer component for debugging and monitoring
 * @version 1.0.0
 * @since 2025-01-27
 */

import React, { useEffect, useState } from 'react';
import {
	FiDownload,
	FiRefreshCw,
	FiTrash,
	FiTrash2
} from 'react-icons/fi';
import styled from 'styled-components';
import { LogEntry, LogLevel, logger } from '@/services/loggingService';

const Container = styled.div`
	background: #1a1a1a;
	color: #e0e0e0;
	border-radius: 8px;
	padding: 16px;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 12px;
	max-height: 600px;
	overflow-y: auto;
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
	padding-bottom: 12px;
	border-bottom: 1px solid #333;
`;

const Controls = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
`;

const Button = styled.button`
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 6px 12px;
	background: #333;
	color: #fff;
	border: 1px solid #555;
	border-radius: 4px;
	cursor: pointer;
	font-size: 11px;
	transition: background 0.2s;

	&:hover {
		background: #444;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const Select = styled.select`
	background: #333;
	color: #fff;
	border: 1px solid #555;
	border-radius: 4px;
	padding: 4px 8px;
	font-size: 11px;
`;

const Input = styled.input`
	background: #333;
	color: #fff;
	border: 1px solid #555;
	border-radius: 4px;
	padding: 4px 8px;
	font-size: 11px;
	width: 200px;
`;

const LogEntry = styled.div<{ level: LogLevel }>`
	padding: 4px 8px;
	border-radius: 2px;
	margin-bottom: 2px;
	border-left: 3px solid ${(props) => {
		switch (props.level) {
			case LogLevel.ERROR:
				return '#ff4444';
			case LogLevel.WARN:
				return '#ffaa00';
			case LogLevel.INFO:
				return '#4444ff';
			case LogLevel.DEBUG:
				return '#888888';
			default:
				return '#666666';
		}
	}};
	background: ${(props) => {
		switch (props.level) {
			case LogLevel.ERROR:
				return 'rgba(255, 68, 68, 0.1)';
			case LogLevel.WARN:
				return 'rgba(255, 170, 0, 0.1)';
			case LogLevel.INFO:
				return 'rgba(68, 68, 255, 0.1)';
			case LogLevel.DEBUG:
				return 'rgba(136, 136, 136, 0.1)';
			default:
				return 'rgba(102, 102, 102, 0.1)';
		}
	}};
`;

const Timestamp = styled.span`
	color: #888;
	margin-right: 8px;
`;

const Level = styled.span<{ level: LogLevel }>`
	font-weight: bold;
	margin-right: 8px;
	color: ${(props) => {
		switch (props.level) {
			case LogLevel.ERROR:
				return '#ff4444';
			case LogLevel.WARN:
				return '#ffaa00';
			case LogLevel.INFO:
				return '#4444ff';
			case LogLevel.DEBUG:
				return '#888888';
			default:
				return '#666666';
		}
	}};
`;

const Module = styled.span`
	color: #aaa;
	margin-right: 8px;
`;

const Message = styled.span`
	color: #e0e0e0;
`;

const Data = styled.pre`
	margin-top: 4px;
	padding: 8px;
	background: rgba(0, 0, 0, 0.3);
	border-radius: 4px;
	font-size: 11px;
	color: #ccc;
	overflow-x: auto;
`;

interface LogViewerProps {
	visible?: boolean;
	onClose?: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ visible = true, onClose }) => {
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
	const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
	const [searchTerm, setSearchTerm] = useState('');
	const [autoRefresh, setAutoRefresh] = useState(false);

	// Load logs on mount and when auto-refresh is enabled
	useEffect(() => {
		loadLogs();

		let interval: NodeJS.Timeout;
		if (autoRefresh) {
			interval = setInterval(loadLogs, 1000);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [autoRefresh, loadLogs]);

	// Filter logs when level or search changes
	useEffect(() => {
		let filtered = logs;

		// Filter by level
		if (selectedLevel !== 'all') {
			filtered = filtered.filter((log) => log.level === selectedLevel);
		}

		// Filter by search term
		if (searchTerm) {
			filtered = filtered.filter(
				(log) =>
					log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
					log.module.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		setFilteredLogs(filtered);
	}, [logs, selectedLevel, searchTerm]);

	const loadLogs = () => {
		setLogs(logger.getLogs());
	};

	const handleExport = () => {
		logger.exportLogs();
	};

	const handleClear = () => {
		logger.clearLogs();
		setLogs([]);
		setFilteredLogs([]);
	};

	const formatTimestamp = (timestamp: string) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString();
	};

	if (!visible) return null;

	return (
		<Container>
			<Header>
				<div>
					<h3 style={{ margin: 0, color: '#fff' }}>Log Viewer</h3>
					<span style={{ fontSize: '11px', color: '#888' }}>
						{filteredLogs.length} / {logs.length} entries
					</span>
				</div>
				<Controls>
					<Select
						value={selectedLevel}
						onChange={(e) => setSelectedLevel(e.target.value as LogLevel | 'all')}
					>
						<option value="all">All Levels</option>
						<option value={LogLevel.ERROR}>Error</option>
						<option value={LogLevel.WARN}>Warning</option>
						<option value={LogLevel.INFO}>Info</option>
						<option value={LogLevel.DEBUG}>Debug</option>
					</Select>

					<Input
						type="text"
						placeholder="Search logs..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>

					<Button
						onClick={() => setAutoRefresh(!autoRefresh)}
						style={{ background: autoRefresh ? '#4444ff' : '#333' }}
					>
						<FiRefreshCw size={12} />
						Auto
					</Button>

					<Button onClick={loadLogs}>
						<FiRefreshCw size={12} />
						Refresh
					</Button>

					<Button onClick={handleExport}>
						<FiDownload size={12} />
						Export
					</Button>

					<Button onClick={handleClear}>
						<FiTrash2 size={12} />
						Clear
					</Button>

					{onClose && <Button onClick={onClose}>Close</Button>}
				</Controls>
			</Header>

			<div>
				{filteredLogs.map((log, index) => (
					<LogEntry key={index} level={log.level}>
						<Timestamp>{formatTimestamp(log.timestamp)}</Timestamp>
						<Level level={log.level}>{LogLevel[log.level]}</Level>
						<Module>[{log.module}]</Module>
						<Message>{log.message}</Message>
						{log.data && <Data>{JSON.stringify(log.data, null, 2)}</Data>}
					</LogEntry>
				))}
			</div>
		</Container>
	);
};
