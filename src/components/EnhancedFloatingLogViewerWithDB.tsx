/**
 * @file EnhancedFloatingLogViewerWithDB.tsx
 * @description Enhanced floating log viewer with database viewing capabilities
 * @version 1.0.0
 * @since 2026-03-10
 *
 * Extends the EnhancedFloatingLogViewer to include:
 * - SQLite database viewer
 * - IndexedDB browser storage viewer
 * - Tab-based interface for switching between logs and databases
 */

import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { DatabaseViewer } from './DatabaseViewer';
import { EnhancedFloatingLogViewer } from './EnhancedFloatingLogViewer';

const _MODULE_TAG = '[🗄️ LOG-VIEWER-WITH-DB]';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Container = styled.div<{
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
	color: ${(props) => {
		switch (props.$variant) {
			case 'close':
				return '#1e293b';
			default:
				return '#ffffff';
		}
	}};
	border: ${(props) => (props.$variant === 'close' ? 'none' : '1px solid rgba(255, 255, 255, 0.2)')};
	border-radius: 4px;
	padding: 4px 8px;
	font-size: 12px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.15s ease-in-out;

	&:hover {
		background: ${(props) => {
			switch (props.$variant) {
				case 'primary':
					return 'rgba(255, 255, 255, 0.3)';
				case 'success':
					return '#059669';
				case 'danger':
					return '#dc2626';
				case 'close':
					return '#f1f5f9';
				default:
					return 'rgba(255, 255, 255, 0.1)';
			}
		}};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const TabsContainer = styled.div`
	display: flex;
	background: #f8fafc;
	border-bottom: 1px solid #e2e8f0;
`;

const Tab = styled.button<{ $active: boolean }>`
	padding: 10px 16px;
	background: ${(props) => (props.$active ? '#ffffff' : 'transparent')};
	border: none;
	border-bottom: ${(props) => (props.$active ? '2px solid #3b82f6' : '2px solid transparent')};
	color: ${(props) => (props.$active ? '#1f2937' : '#6b7280')};
	font-size: 13px;
	font-weight: ${(props) => (props.$active ? '600' : '400')};
	cursor: pointer;
	transition: all 0.15s ease-in-out;
	display: flex;
	align-items: center;
	gap: 6px;

	&:hover {
		background: ${(props) => (props.$active ? '#ffffff' : '#f1f5f9')};
		color: ${(props) => (props.$active ? '#1f2937' : '#374151')};
	}
`;

const Content = styled.div`
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;
`;

// ============================================================================
// INTERFACES
// ============================================================================

interface EnhancedFloatingLogViewerWithDBProps {
	isOpen: boolean;
	onClose: () => void;
	initialWidth?: number;
	initialHeight?: number;
	initialX?: number;
	initialY?: number;
}

type TabType = 'logs' | 'indexeddb' | 'sqlite';

// ============================================================================
// COMPONENT
// ============================================================================

export const EnhancedFloatingLogViewerWithDB: React.FC<EnhancedFloatingLogViewerWithDBProps> = ({
	isOpen,
	onClose,
	initialWidth = 1000,
	initialHeight = 700,
	initialX = 50,
	initialY = 50,
}) => {
	const [position, setPosition] = useState({ x: initialX, y: initialY });
	const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
	const [isDragging, setIsDragging] = useState(false);
	const [isMaximized, setIsMaximized] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const [activeTab, setActiveTab] = useState<TabType>('logs');
	const dragRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });

	// Handle mouse down for dragging
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (isMaximized || isMinimized) return;

			setIsDragging(true);
			dragRef.current = {
				startX: e.clientX - position.x,
				startY: e.clientY - position.y,
			};
		},
		[position.x, position.y, isMaximized, isMinimized]
	);

	// Handle mouse move for dragging
	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging) return;

			const newX = e.clientX - dragRef.current.startX;
			const newY = e.clientY - dragRef.current.startY;

			// Keep within viewport bounds
			const maxX = window.innerWidth - (isMinimized ? 280 : size.width);
			const maxY = window.innerHeight - (isMinimized ? 40 : size.height);

			setPosition({
				x: Math.max(0, Math.min(newX, maxX)),
				y: Math.max(0, Math.min(newY, maxY)),
			});
		},
		[isDragging, size, isMinimized]
	);

	// Handle mouse up to stop dragging
	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	// Add global mouse event listeners
	React.useEffect(() => {
		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);

			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [isDragging, handleMouseMove, handleMouseUp]);

	// Handle maximize/minimize
	const handleMaximize = useCallback(() => {
		if (isMaximized) {
			setSize({ width: initialWidth, height: initialHeight });
			setPosition({ x: initialX, y: initialY });
		} else {
			setSize({ width: window.innerWidth, height: window.innerHeight });
			setPosition({ x: 0, y: 0 });
		}
		setIsMaximized(!isMaximized);
	}, [isMaximized, initialWidth, initialHeight, initialX, initialY]);

	const handleMinimize = useCallback(() => {
		setIsMinimized(!isMinimized);
	}, [isMinimized]);

	const handleTabChange = useCallback((tab: TabType) => {
		setActiveTab(tab);
	}, []);

	// Don't render if not open
	if (!isOpen) return null;

	return (
		<Container
			width={size.width}
			height={size.height}
			x={position.x}
			y={position.y}
			$isMinimized={isMinimized}
		>
			<Header $isMinimized={isMinimized} onMouseDown={handleMouseDown}>
				<Title $isMinimized={isMinimized}>
					<StatusIndicator $status="active" />
					{isMinimized ? '🗄️ Logs & DB' : '🗄️ Enhanced Log Viewer with Database'}
				</Title>

				{!isMinimized && (
					<Controls>
						<ControlButton onClick={handleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
							{isMaximized ? '🗗' : '🗖'}
						</ControlButton>
						<ControlButton onClick={handleMinimize} title="Minimize">
							🗕
						</ControlButton>
						<ControlButton $variant="close" onClick={onClose} title="Close">
							❌
						</ControlButton>
					</Controls>
				)}
			</Header>

			{!isMinimized && (
				<>
					<TabsContainer>
						<Tab $active={activeTab === 'logs'} onClick={() => handleTabChange('logs')}>
							📄 Logs
						</Tab>
						<Tab $active={activeTab === 'indexeddb'} onClick={() => handleTabChange('indexeddb')}>
							🗄️ IndexedDB
						</Tab>
						<Tab $active={activeTab === 'sqlite'} onClick={() => handleTabChange('sqlite')}>
							💾 SQLite
						</Tab>
					</TabsContainer>

					<Content>
						{activeTab === 'logs' && (
							<EnhancedFloatingLogViewer
								isOpen={true}
								onClose={() => {}} // Don't allow closing individual tab
								initialWidth={size.width}
								initialHeight={size.height - 80} // Account for tabs
								initialX={0}
								initialY={0}
							/>
						)}

						{activeTab === 'indexeddb' && <DatabaseViewer style={{ height: '100%' }} />}

						{activeTab === 'sqlite' && <DatabaseViewer style={{ height: '100%' }} />}
					</Content>
				</>
			)}
		</Container>
	);
};

export default EnhancedFloatingLogViewerWithDB;
