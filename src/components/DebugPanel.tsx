import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiTerminal, FiX, FiDownload, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';
import { logger } from '../utils/logger';

const DebugPanelContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${({ $isOpen }) => $isOpen ? '300px' : '40px'};
  background: #1a1a1a;
  border-top: 2px solid #333;
  transition: height 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

const DebugHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: #2d2d2d;
  border-bottom: 1px solid #444;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: #333;
  }
`;

const DebugTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  font-weight: 600;
  font-size: 0.875rem;
`;

const DebugControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DebugButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #444;
  border: 1px solid #555;
  border-radius: 0.25rem;
  color: #fff;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #555;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DebugContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #e0e0e0;
  background: #1a1a1a;
`;

const LogEntryContainer = styled.div<{ $level: string }>`
  margin-bottom: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border-left: 3px solid ${({ $level }) => {
    switch ($level) {
      case 'ERROR': return '#ef4444';
      case 'WARN': return '#f59e0b';
      case 'INFO': return '#3b82f6';
      case 'DEBUG': return '#10b981';
      case 'TRACE': return '#8b5cf6';
      default: return '#6b7280';
    }
  }};
  background: ${({ $level }) => {
    switch ($level) {
      case 'ERROR': return 'rgba(239, 68, 68, 0.1)';
      case 'WARN': return 'rgba(245, 158, 11, 0.1)';
      case 'INFO': return 'rgba(59, 130, 246, 0.1)';
      case 'DEBUG': return 'rgba(16, 185, 129, 0.1)';
      case 'TRACE': return 'rgba(139, 92, 246, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  }};
`;

const LogTimestamp = styled.span`
  color: #9ca3af;
  margin-right: 0.5rem;
`;

const LogLevel = styled.span<{ $level: string }>`
  font-weight: bold;
  margin-right: 0.5rem;
  color: ${({ $level }) => {
    switch ($level) {
      case 'ERROR': return '#ef4444';
      case 'WARN': return '#f59e0b';
      case 'INFO': return '#3b82f6';
      case 'DEBUG': return '#10b981';
      case 'TRACE': return '#8b5cf6';
      default: return '#6b7280';
    }
  }};
`;

const LogComponent = styled.span`
  color: #60a5fa;
  margin-right: 0.5rem;
`;

const LogMessage = styled.span`
  color: #e0e0e0;
`;

const LogData = styled.pre`
  margin: 0.25rem 0 0 0;
  padding: 0.25rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.25rem;
  font-size: 0.7rem;
  color: #9ca3af;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
  font-style: italic;
`;

interface LogEntry {
  timestamp: string;
  level: string;
  component: string;
  message: string;
  data?: unknown;
  error?: Error;
}

const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    // Get initial logs
    const initialLogs = logger.getLogHistory();
    setLogs(initialLogs);

    // Set up interval to check for new logs
    const interval = setInterval(() => {
      const newLogs = logger.getLogHistory();
      setLogs(newLogs);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClear = () => {
    logger.clearHistory();
    setLogs([]);
  };

  const handleExport = () => {
    const logData = logger.exportLogs();
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oauth-playground-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatData = (data: unknown): string => {
    if (data === null || data === undefined) return '';
    if (typeof data === 'string') return data;
    return JSON.stringify(data, null, 2);
  };

  return (
    <DebugPanelContainer $isOpen={isOpen}>
      <DebugHeader onClick={handleToggle}>
        <DebugTitle>
          <FiTerminal />
          Debug Console ({logs.length} logs)
        </DebugTitle>
        <DebugControls onClick={(e) => e.stopPropagation()}>
          <DebugButton
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
          >
            {autoScroll ? <FiEyeOff /> : <FiEye />}
            {autoScroll ? 'Auto' : 'Manual'}
          </DebugButton>
          <DebugButton onClick={handleClear} title="Clear logs">
            <FiTrash2 />
            Clear
          </DebugButton>
          <DebugButton onClick={handleExport} title="Export logs">
            <FiDownload />
            Export
          </DebugButton>
          <DebugButton onClick={handleToggle} title="Toggle panel">
            <FiX />
          </DebugButton>
        </DebugControls>
      </DebugHeader>
      
      {isOpen && (
        <DebugContent>
          {logs.length === 0 ? (
            <EmptyState>No logs available</EmptyState>
          ) : (
            logs.map((log, index) => (
              <LogEntryContainer key={index} $level={log.level}>
                <LogTimestamp>{formatTimestamp(log.timestamp)}</LogTimestamp>
                <LogLevel $level={log.level}>{log.level}</LogLevel>
                <LogComponent>[{log.component}]</LogComponent>
                <LogMessage>{log.message}</LogMessage>
                {log.data ? (
                  <LogData>{formatData(log.data)}</LogData>
                ) : null}
                {log.error && (
                  <LogData>Error: {log.error.message}</LogData>
                )}
              </LogEntryContainer>
            ))
          )}
        </DebugContent>
      )}
    </DebugPanelContainer>
  );
};

export default DebugPanel;


