/**
 * @file FloatingLogViewer.tsx
 * @module components
 * @description Floating pop-out log viewer for real-time monitoring
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
	FiX,
	FiMinimize2,
	FiMaximize2,
	FiRefreshCw,
	FiDownload,
} from 'react-icons/fi';
import styled from 'styled-components';
import { LogFileService, type LogFile } from '../services/logFileService';

// Styled components
const FloatingContainer = styled.div<{ width: number; height: number; x: number; y: number }>`
  position: fixed;
  top: ${props => props.y}px;
  left: ${props => props.x}px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
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

const ControlButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'primary' ? '#3b82f6' : '#f3f4f6'};
  color: ${props => props.variant === 'primary' ? 'white' : '#374151'};
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
    background: ${props => props.variant === 'primary' ? '#2563eb' : '#e5e7eb'};
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
  display: ${props => props.$isMinimized ? 'none' : 'block'};
  border: 1px solid #e5e7eb;
`;

const StatusIndicator = styled.div<{ status: 'connected' | 'disconnected' | 'loading' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'connected': return '#10b981';
      case 'loading': return '#f59e0b';
      case 'disconnected': return '#ef4444';
      default: return '#6b7280';
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
  initialWidth?: number;
  initialHeight?: number;
  initialX?: number;
  initialY?: number;
}

export const FloatingLogViewer: React.FC<FloatingLogViewerProps> = ({
  isOpen,
  onClose,
  initialWidth = 600,
  initialHeight = 400,
  initialX = 100,
  initialY = 100
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

  // Function to add visual separation to log entries
  const addVisualSeparation = (content: string): string => {
    if (!content) return content;
    
    const lines = content.split('\n');
    const processedLines = lines.map((line, index) => {
      // Skip empty lines
      if (!line.trim()) return line;
      
      // Add visual indicators for different log levels
      let prefix = '';
      
      if (line.includes('ERROR') || line.includes('error')) {
        prefix = '🔴 ';
      } else if (line.includes('WARN') || line.includes('warn')) {
        prefix = '🟡 ';
      } else if (line.includes('INFO') || line.includes('info')) {
        prefix = '🔵 ';
      } else if (line.includes('DEBUG') || line.includes('debug')) {
        prefix = '🔍 ';
      } else {
        prefix = '📝 ';
      }
      
      // Add entry separator
      const suffix = index < lines.length - 1 ? '\n---' : '';
      
      return `${prefix}${line}${suffix}`;
    });
    
    return processedLines.join('\n');
  };

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load available files
  const loadFiles = useCallback(async () => {
    try {
      const files = await LogFileService.listLogFiles();
      setAvailableFiles(files);
    } catch (err) {
      console.error('[FloatingLogViewer] Failed to load files:', err);
      setError('Failed to load log files');
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
                setLogContent(prev => prev + data.content);
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

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).closest('.header')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - x, y: e.clientY - y });
    }
  }, [x, y]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && !isMaximized) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - height;
      
      setX(Math.max(0, Math.min(newX, maxX)));
      setY(Math.max(0, Math.min(newY, maxY)));
    }
  }, [isDragging, isMaximized, width, height, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Resize handlers
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    setResizeStart({ width, height, x: e.clientX, y: e.clientY });
  }, [width, height]);

  const handleMouseMoveResize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x));
      const newHeight = Math.max(200, resizeStart.height + (e.clientY - resizeStart.y));
      
      setWidth(newWidth);
      setHeight(newHeight);
    }
  }, [isResizing, resizeStart]);

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

  // Effects
  useEffect(() => {
    if (isOpen) {
      loadFiles();
      loadLogContent();
    }
  }, [isOpen, loadFiles, loadLogContent]);

  useEffect(() => {
    // Stop tail mode when component unmounts or file changes
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Stop tail mode when file changes
    if (isTailMode && eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsTailMode(false);
    }
    loadLogContent();
  }, [selectedFile, loadLogContent]);

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
  }, [isDragging, isResizing, handleMouseMove, handleMouseUpResize]);

  if (!isOpen) return null;

  return (
    <FloatingContainer
      ref={containerRef}
      width={isMaximized ? window.innerWidth - 40 : width}
      height={isMaximized ? window.innerHeight - 40 : (isMinimized ? 40 : height)}
      x={isMaximized ? 20 : x}
      y={isMaximized ? 20 : y}
      onMouseDown={handleMouseDown}
    >
      <Header className="header">
        <Title>
          <StatusIndicator status={isTailMode ? 'connected' : 'disconnected'} />
          Log Viewer
        </Title>
        <Controls>
          <ControlButton
            variant="secondary"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <FiMaximize2 /> : <FiMinimize2 />}
          </ControlButton>
          <ControlButton
            variant="secondary"
            onClick={toggleMaximize}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? '🗗' : '🗖'}
          </ControlButton>
          <ControlButton
            variant="secondary"
            onClick={onClose}
            title="Close"
          >
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
              {availableFiles.map((file) => (
                <option key={file.name} value={file.name}>
                  {file.name} ({(file.size / 1024).toFixed(1)}KB)
                </option>
              ))}
            </Select>
            
            <CheckboxContainer onClick={toggleTailMode} title={isTailMode ? 'Stop tailing - Disable real-time log updates' : 'Start tailing - Enable real-time log updates'}>
              <CheckboxInput
                type="checkbox"
                checked={isTailMode}
                onChange={toggleTailMode}
                disabled={isLoading}
              />
              <CheckboxLabel>Tail Mode</CheckboxLabel>
            </CheckboxContainer>
            
            <ControlButton
              variant="secondary"
              onClick={loadLogContent}
              disabled={isLoading || isTailMode}
              title="Refresh log content from file"
            >
              <FiRefreshCw />
            </ControlButton>
            
            <ControlButton
              variant="secondary"
              onClick={clearLogs}
              title="Clear all log content"
            >
              Clear
            </ControlButton>
            
            <ControlButton
              variant="secondary"
              onClick={downloadLogs}
              disabled={!logContent}
              title="Download log content as file"
            >
              <FiDownload />
            </ControlButton>
          </ControlsPanel>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              padding: '8px',
              marginBottom: '8px',
              color: '#991b1b',
              fontSize: '12px',
            }}>
              Error: {error}
            </div>
          )}

          {isLoading && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#6b7280',
              fontSize: '12px',
            }}>
              Loading...
            </div>
          )}

          <LogContent $isMinimized={isMinimized}>
            {addVisualSeparation(logContent) || 'No log content. Select a file and click Refresh to view logs.'}
          </LogContent>
        </Content>
      )}

      {!isMaximized && !isMinimized && (
        <ResizeHandle onMouseDown={handleResizeMouseDown} />
      )}
    </FloatingContainer>
  );
};
