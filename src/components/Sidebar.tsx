import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiMove, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import {
	SIDEBAR_PING_MAX_WIDTH,
	SIDEBAR_PING_MIN_WIDTH,
	SIDEBAR_PING_WIDTH,
	USE_PING_MENU,
} from '../config/sidebarMenuConfig';
import DragDropSidebar from './DragDropSidebar';
import SidebarMenuPing from './SidebarMenuPing';
import SidebarSearch from './SidebarSearch';
import { VersionBadge } from './VersionBadge';
import '../styles/sidebar-ping-theme.css';

// App version from package.json
const APP_VERSION = '9.11.76';

// Sidebar container with resize handle (min/max depend on Ping vs legacy)
const SidebarContainer = styled.div<{
	$width: number;
	$minWidth?: number;
	$maxWidth?: number;
}>`
	position: relative;
	width: ${(props) => props.$width}px;
	min-width: ${(props) => props.$minWidth ?? 300}px;
	max-width: ${(props) => props.$maxWidth ?? 600}px;
	height: 100vh;
	background: white;
	border-right: 1px solid #e5e7eb;
	transition: width 0.2s ease;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	z-index: 100; /* Ensure sidebar is above content */
`;

// Resize handle - more visible and accessible
const ResizeHandle = styled.div`
	position: absolute;
	top: 0;
	right: 0;
	width: 8px; /* Wider for easier grabbing */
	height: 100%;
	cursor: col-resize;
	background: transparent;
	z-index: 110; /* Above sidebar content */
	transition: background 0.2s ease;

	&::after {
		content: '';
		position: absolute;
		top: 0;
		right: 2px;
		width: 2px;
		height: 100%;
		background: #e5e7eb;
		transition: background 0.2s ease;
	}

	&:hover {
		background: rgba(59, 130, 246, 0.1);
		
		&::after {
			background: #3b82f6;
			width: 3px;
		}
	}
	
	&:active {
		background: rgba(59, 130, 246, 0.2);
		
		&::after {
			background: #2563eb;
			width: 4px;
		}
	}
`;

// Header section
const SidebarHeader = styled.div`
	padding: 16px;
	border-bottom: 1px solid #e5e7eb;
	background: #f9fafb;
`;

// Footer section
const SidebarFooter = styled.div`
	padding: 16px;
	border-top: 1px solid #e5e7eb;
	background: #f9fafb;
`;

// Toggle button for drag mode
const DragModeToggle = styled.button<{ $isActive?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	background: ${(props) => (props.$isActive ? '#dbeafe' : 'white')};
	color: ${(props) => (props.$isActive ? '#1e40af' : '#374151')};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: ${(props) => (props.$isActive ? '#bfdbfe' : '#f9fafb')};
		border-color: #9ca3af;
	}

	&:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
`;

// Close button
const CloseButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2.5rem;
	height: 2.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	background: white;
	color: #6b7280;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #f9fafb;
		border-color: #9ca3af;
		color: #374151;
	}

	&:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
`;

// Sidebar props interface
export interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

// Main Sidebar component
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
	// Sidebar width state (resizable for both; Ping uses its own min/max)
	const [sidebarWidth, setSidebarWidth] = useState(() => {
		const saved = localStorage.getItem('sidebar.width');
		const parsed = saved ? parseInt(saved, 10) : NaN;
		if (USE_PING_MENU) {
			if (
				Number.isFinite(parsed) &&
				parsed >= SIDEBAR_PING_MIN_WIDTH &&
				parsed <= SIDEBAR_PING_MAX_WIDTH
			)
				return parsed;
			return SIDEBAR_PING_WIDTH;
		}
		return saved && Number.isFinite(parsed) ? parsed : 300;
	});

	// Resizing state
	const [isResizing, setIsResizing] = useState(false);
	const isResizingRef = useRef(false);

	// Search state
	const [searchQuery, setSearchQuery] = useState('');
	const [matchAnywhere, setMatchAnywhere] = useState(false);

	// Drag and drop mode
	const [isDragDropMode, setIsDragDropMode] = useState(() => {
		const saved = localStorage.getItem('sidebar.dragDropMode');
		return saved === 'true';
	});

	// Save sidebar width to localStorage (App/Navbar read from same key)
	useEffect(() => {
		localStorage.setItem('sidebar.width', String(sidebarWidth));
	}, [sidebarWidth]);

	// Handle search
	const handleSearch = useCallback((query: string) => {
		setSearchQuery(query);
	}, []);

	// Toggle drag drop mode
	const toggleDragDropMode = () => {
		const newMode = !isDragDropMode;
		setIsDragDropMode(newMode);
		localStorage.setItem('sidebar.dragDropMode', newMode.toString());
	};

	// Handle resize start
	const handleResizeStart = () => {
		setIsResizing(true);
		isResizingRef.current = true;
	};

	// Handle resize move (clamp to min/max for current menu type)
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isResizingRef.current) return;
			const minW = USE_PING_MENU ? SIDEBAR_PING_MIN_WIDTH : 300;
			const maxW = USE_PING_MENU ? SIDEBAR_PING_MAX_WIDTH : 600;
			const newWidth = Math.min(maxW, Math.max(minW, e.clientX));
			setSidebarWidth(newWidth);
		};

		const handleMouseUp = () => {
			setIsResizing(false);
			isResizingRef.current = false;
		};

		if (isResizing) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		}

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [isResizing]);

	if (!isOpen) return null;

	const width = sidebarWidth;
	const containerClass = USE_PING_MENU ? 'sidebar--ping' : '';
	const minW = USE_PING_MENU ? SIDEBAR_PING_MIN_WIDTH : 300;
	const maxW = USE_PING_MENU ? SIDEBAR_PING_MAX_WIDTH : 600;

	return (
		<SidebarContainer 
			$width={width} 
			$minWidth={minW} 
			$maxWidth={maxW} 
			className={containerClass}
			style={{
				userSelect: isResizing ? 'none' : 'auto',
				transition: isResizing ? 'none' : 'width 0.2s ease'
			}}
		>
			<ResizeHandle 
				onMouseDown={handleResizeStart}
				title="Drag to resize sidebar"
			/>

			<SidebarHeader>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginBottom: USE_PING_MENU ? 0 : '16px',
					}}
				>
					<h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
						PingOne MasterFlow API
					</h2>
					<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
						<VersionBadge version={APP_VERSION} variant="sidebar" />
						<CloseButton onClick={onClose} title="Close sidebar">
							<FiX size={20} />
						</CloseButton>
					</div>
				</div>

				{USE_PING_MENU ? (
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '8px' }}>
						<DragModeToggle
							onClick={toggleDragDropMode}
							title={isDragDropMode ? 'Switch to standard menu' : 'Enable drag & drop to reorder'}
							$isActive={isDragDropMode}
						>
							<FiMove size={14} />
							{isDragDropMode ? 'Drag mode' : 'Reorder'}
						</DragModeToggle>
					</div>
				) : (
					<>
						<SidebarSearch
							onSearch={handleSearch}
							placeholder="Search flows and pages..."
							activeSearchQuery={searchQuery}
							matchAnywhere={matchAnywhere}
							onMatchAnywhereChange={setMatchAnywhere}
						/>
						<div
							style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '12px' }}
						>
							<DragModeToggle
								onClick={toggleDragDropMode}
								title={isDragDropMode ? 'Switch to standard menu' : 'Enable drag & drop mode'}
								$isActive={isDragDropMode}
							>
								<FiMove size={14} />
								{isDragDropMode ? 'Drag Mode' : 'Enable Drag'}
							</DragModeToggle>
						</div>
					</>
				)}
			</SidebarHeader>

			<div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
				{USE_PING_MENU ? (
					<SidebarMenuPing dragMode={isDragDropMode} />
				) : (
					<DragDropSidebar
						dragMode={isDragDropMode}
						searchQuery={searchQuery}
						matchAnywhere={matchAnywhere}
					/>
				)}
			</div>

			{!USE_PING_MENU && <SidebarFooter />}
		</SidebarContainer>
	);
};
export default Sidebar;
