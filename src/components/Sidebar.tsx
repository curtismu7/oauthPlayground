import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
	SIDEBAR_PING_MAX_WIDTH,
	SIDEBAR_PING_MIN_WIDTH,
	SIDEBAR_PING_WIDTH,
	USE_PING_MENU,
} from '../config/sidebarMenuConfig';
import { useComponentTracker } from '../utils/componentTracker';
import DragDropSidebar from './DragDropSidebar';
import SidebarMenuPing from './SidebarMenuPing';
import SidebarSearch from './SidebarSearch';
import { VersionBadge } from './VersionBadge';
import '../styles/sidebar-ping-theme.css';
import '../styles/sidebar-ping-admin-theme.css';

// 'classic' = original theme, 'admin' = PingOne console style
const SIDEBAR_THEME_KEY = 'sidebar.theme';
type SidebarTheme = 'classic' | 'admin';
function getSavedTheme(): SidebarTheme {
	const v = localStorage.getItem(SIDEBAR_THEME_KEY) as SidebarTheme | null;
	return v === 'classic' || v === 'admin' ? v : 'admin';
}

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
	border-right: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	transition: width 0.2s ease;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	/* App chrome; EnhancedFloatingLogViewer (10100) opens above when open */
	z-index: 10050;
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
	z-index: 10051; /* Above sidebar content, keep within chrome stack */
	transition: background 0.2s ease;

	&::after {
		content: '';
		position: absolute;
		top: 0;
		right: 2px;
		width: 2px;
		height: 100%;
		background: V9_COLORS.TEXT.GRAY_LIGHTER;
		transition: background 0.2s ease;
	}

	&:hover {
		background: rgba(59, 130, 246, 0.1);

		&::after {
			background: V9_COLORS.PRIMARY.BLUE;
			width: 3px;
		}
	}

	&:active {
		background: rgba(59, 130, 246, 0.2);

		&::after {
			background: V9_COLORS.PRIMARY.BLUE_DARK;
			width: 4px;
		}
	}
`;

// Header section
const SidebarHeader = styled.div`
	padding: 16px;
	border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	background: #f9fafb;
`;

// Footer section
const SidebarFooter = styled.div`
	padding: 16px;
	border-top: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	background: #f9fafb;
`;

// Toggle button for drag mode
const DragModeToggle = styled.button<{ $isActive?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.375rem;
	background: ${(props) => (props.$isActive ? '#dbeafe' : 'white')};
	color: ${(props) => (props.$isActive ? '#2563eb' : '#1f2937')};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: ${(props) => (props.$isActive ? '#e5e7eb' : '#f9fafb')};
		border-color: V9_COLORS.TEXT.GRAY_LIGHT;
	}

	&:focus {
		outline: 2px solid V9_COLORS.PRIMARY.BLUE;
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
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.375rem;
	background: white;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #f9fafb;
		border-color: V9_COLORS.TEXT.GRAY_LIGHT;
		color: V9_COLORS.TEXT.GRAY_DARK;
	}

	&:focus {
		outline: 2px solid V9_COLORS.PRIMARY.BLUE;
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
	useComponentTracker('Sidebar', 2);
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

	// Sidebar visual theme
	const [sidebarTheme, setSidebarTheme] = useState<SidebarTheme>(getSavedTheme);
	const toggleTheme = () => {
		const next: SidebarTheme = sidebarTheme === 'admin' ? 'classic' : 'admin';
		localStorage.setItem(SIDEBAR_THEME_KEY, next);
		setSidebarTheme(next);
	};

	// Drag and drop mode
	const [isDragDropMode, setIsDragDropMode] = useState(() => {
		const saved = localStorage.getItem('sidebar.dragDropMode');
		return saved === 'true';
	});

	// Save sidebar width to localStorage and notify App (same-tab custom event)
	useEffect(() => {
		localStorage.setItem('sidebar.width', String(sidebarWidth));
		window.dispatchEvent(new CustomEvent('sidebar-width-changed'));
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
	const isAdmin = USE_PING_MENU && sidebarTheme === 'admin';
	const containerClass = USE_PING_MENU
		? isAdmin
			? 'sidebar--ping sidebar--ping-admin'
			: 'sidebar--ping'
		: '';
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
				transition: isResizing ? 'none' : 'width 0.2s ease',
				background: isAdmin ? '#1e293b' : undefined,
			}}
		>
			<ResizeHandle onMouseDown={handleResizeStart} title="Drag to resize sidebar" />

			{isAdmin ? (
				/* ── PingOne console-style header ── */
				<>
					<div className="sidebar-ping-admin__header">
						<div className="sidebar-ping-admin__logo">
							<div
								className="sidebar-ping-admin__logo-icon"
								aria-hidden
								style={{
									background: 'white',
									borderRadius: 3,
									width: 22,
									height: 22,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0,
								}}
							>
								<svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
									<rect width="14" height="14" rx="2" fill="#1b2a3b" />
									<circle cx="7" cy="7" r="3.5" fill="white" />
								</svg>
							</div>
							<span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
								MasterFlow API
							</span>
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
							<button
								type="button"
								onClick={toggleTheme}
								title="Switch to classic theme"
								className="sidebar-ping-admin__close-btn"
								style={{ padding: 4 }}
							>
								<svg
									aria-hidden="true"
									width="22"
									height="22"
									viewBox="0 0 24 24"
									fill="none"
									stroke="#f59e0b"
									strokeWidth="2"
								>
									<circle cx="12" cy="12" r="5" />
									<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
								</svg>
							</button>
							<CloseButton
								onClick={onClose}
								title="Close sidebar"
								style={{
									background: 'transparent',
									border: 'none',
									color: '#7a93ab',
									width: 28,
									height: 28,
								}}
							>
								<svg
									aria-hidden="true"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M18 6L6 18M6 6l12 12" />
								</svg>
							</CloseButton>
						</div>
					</div>
					<div className="sidebar-ping-admin__controls">
						<SidebarSearch
							onSearch={handleSearch}
							placeholder="Search flows and pages..."
							activeSearchQuery={searchQuery}
						/>
						<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<button
								type="button"
								className={`sidebar-ping-admin__reorder-btn${isDragDropMode ? ' sidebar-ping-admin__reorder-btn--active' : ''}`}
								onClick={toggleDragDropMode}
								title={isDragDropMode ? 'Exit reorder mode' : 'Reorder menu items'}
							>
								<svg
									aria-hidden="true"
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M3 12h18M3 6h18M3 18h18" />
								</svg>
								{isDragDropMode ? 'Done' : 'Reorder'}
							</button>
						</div>
					</div>
				</>
			) : (
				/* ── Original / classic header ── */
				<SidebarHeader>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: USE_PING_MENU ? 0 : '16px',
						}}
					>
						<h2
							style={{
								margin: 0,
								fontSize: '1.25rem',
								fontWeight: 'bold',
								color: '#1f2937',
							}}
						>
							PingOne MasterFlow API
						</h2>
						<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
							<VersionBadge version={APP_VERSION} variant="sidebar" />
							{USE_PING_MENU && (
								<button
									type="button"
									onClick={toggleTheme}
									title="Switch to PingOne console theme"
									style={{
										background: 'none',
										border: '1px solid #e5e7eb',
										borderRadius: 4,
										padding: '3px 8px',
										fontSize: '0.7rem',
										cursor: 'pointer',
										color: '#6b7280',
									}}
								>
									🎨 Theme
								</button>
							)}
							<CloseButton onClick={onClose} title="Close sidebar">
								<span style={{ fontSize: '20px' }}>❌</span>
							</CloseButton>
						</div>
					</div>

					{USE_PING_MENU ? (
						<>
							<SidebarSearch
								onSearch={handleSearch}
								placeholder="Search flows and pages..."
								activeSearchQuery={searchQuery}
							/>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '8px' }}
							>
								<DragModeToggle
									onClick={toggleDragDropMode}
									title={
										isDragDropMode ? 'Switch to standard menu' : 'Enable drag & drop to reorder'
									}
									$isActive={isDragDropMode}
								>
									<i className="bi bi-question-circle" style={{ fontSize: '14px' }}></i>
									{isDragDropMode ? 'Drag mode' : 'Reorder'}
								</DragModeToggle>
							</div>
						</>
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
									<i className="bi bi-question-circle" style={{ fontSize: '14px' }}></i>
									{isDragDropMode ? 'Drag Mode' : 'Enable Drag'}
								</DragModeToggle>
							</div>
						</>
					)}
				</SidebarHeader>
			)}

			<div
				style={{
					flex: 1,
					minHeight: 0,
					overflow: 'auto',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				{USE_PING_MENU ? (
					<SidebarMenuPing dragMode={isDragDropMode} searchQuery={searchQuery} />
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
