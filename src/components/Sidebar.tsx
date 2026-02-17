import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiMove, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import AppVersionBadge from './AppVersionBadge';
import DragDropSidebar from './DragDropSidebar';
import SidebarSearch from './SidebarSearch';
import { VersionBadge } from './VersionBadge';

// App version from package.json
const APP_VERSION = '9.11.76';

// Sidebar container with resize handle
const SidebarContainer = styled.div<{ $width: number }>`
	position: relative;
	width: ${(props) => props.$width}px;
	min-width: 300px;
	max-width: 600px;
	height: 100vh;
	background: white;
	border-right: 1px solid #e5e7eb;
	transition: width 0.2s ease;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

// Resize handle
const ResizeHandle = styled.div`
	position: absolute;
	top: 0;
	right: -2px;
	width: 4px;
	height: 100%;
	cursor: ew-resize;
	background: transparent;
	z-index: 10;

	&:hover {
		background: #3b82f6;
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
	// Sidebar width state
	const [sidebarWidth, setSidebarWidth] = useState(() => {
		const savedWidth = localStorage.getItem('sidebar.width');
		return savedWidth ? parseInt(savedWidth, 10) : 300;
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

	// Save sidebar width to localStorage
	useEffect(() => {
		localStorage.setItem('sidebar.width', sidebarWidth.toString());
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

	// Handle resize move
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isResizingRef.current) return;

			const newWidth = e.clientX;
			if (newWidth >= 300 && newWidth <= 600) {
				setSidebarWidth(newWidth);
			}
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

	return (
		<SidebarContainer $width={sidebarWidth}>
			<ResizeHandle onMouseDown={handleResizeStart} />

			<SidebarHeader>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginBottom: '16px',
					}}
				>
					<h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
						PingOne MasterFlow API
					</h2>
					<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
						<VersionBadge version={APP_VERSION} variant="sidebar" />
						<CloseButton onClick={onClose}>
							<FiX size={20} />
						</CloseButton>
					</div>
				</div>

				{/* Search */}
				<SidebarSearch
					onSearch={handleSearch}
					placeholder="Search flows and pages..."
					activeSearchQuery={searchQuery}
					matchAnywhere={matchAnywhere}
					onMatchAnywhereChange={setMatchAnywhere}
				/>

				{/* Drag Mode Toggle */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '12px' }}>
					<DragModeToggle
						onClick={toggleDragDropMode}
						title={isDragDropMode ? 'Switch to standard menu' : 'Enable drag & drop mode'}
						$isActive={isDragDropMode}
					>
						<FiMove size={14} />
						{isDragDropMode ? 'Drag Mode' : 'Enable Drag'}
					</DragModeToggle>
				</div>
			</SidebarHeader>

			{/* Main Content - DragDropSidebar */}
			<div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
				<DragDropSidebar
					dragMode={isDragDropMode}
					searchQuery={searchQuery}
					matchAnywhere={matchAnywhere}
				/>
			</div>

			<SidebarFooter>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: '0.5rem',
						padding: '0.5rem 0',
					}}
				>
					<div
						style={{
							display: 'flex',
							flexWrap: 'wrap',
							gap: '0.5rem',
							justifyContent: 'center',
						}}
					>
						<AppVersionBadge type="app" />
						<AppVersionBadge type="mfa" />
					</div>
					<div
						style={{
							display: 'flex',
							flexWrap: 'wrap',
							gap: '0.5rem',
							justifyContent: 'center',
						}}
					>
						<AppVersionBadge type="unified" />
						<AppVersionBadge type="protect" />
					</div>
				</div>
			</SidebarFooter>
		</SidebarContainer>
	);
};
export default Sidebar;
