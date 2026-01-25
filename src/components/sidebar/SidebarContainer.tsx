/**
 * SidebarContainer - Main wrapper component for the sidebar
 * Handles overall layout, responsive behavior, and coordination between sub-components
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar as ProSidebar } from 'react-pro-sidebar';
import styled from 'styled-components';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import SidebarHeader from './SidebarHeader';
import SidebarSearch from './SidebarSearch';
import SidebarMenu from './SidebarMenu';
import { DragDropProvider } from './DragDropProvider';
import type { SidebarProps } from '../Sidebar';

const SidebarContainerWrapper = styled.div<{ $isOpen: boolean; $width: number }>`
	position: fixed;
	top: 0;
	left: 0;
	height: 100vh;
	width: ${(props) => (props.$isOpen ? props.$width : 0)}px;
	background: white;
	box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
	z-index: 1000;
	transition: width 0.3s ease;
	overflow: hidden;
`;

const ResizeHandle = styled.div`
	position: absolute;
	top: 0;
	right: 0;
	width: 4px;
	height: 100%;
	background: #e5e7eb;
	cursor: col-resize;
	transition: background 0.2s ease;

	&:hover {
		background: #3b82f6;
	}
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background: rgba(0, 0, 0, 0.5);
	z-index: 999;
	opacity: ${(props) => (props.$isOpen ? 1 : 0)};
	visibility: ${(props) => (props.$isOpen ? 'visible' : 'hidden')};
	transition: opacity 0.3s ease, visibility 0.3s ease;
`;

interface SidebarContainerProps extends SidebarProps {
	initialWidth?: number;
	minWidth?: number;
	maxWidth?: number;
}

const SidebarContainer: React.FC<SidebarContainerProps> = ({
	isOpen,
	onClose,
	initialWidth = 450,
	minWidth = 300,
	maxWidth = 600,
}) => {
	const [sidebarWidth, setSidebarWidth] = useState(() => {
		// Load saved width from localStorage
		try {
			const saved = localStorage.getItem('sidebar.width');
			const parsed = saved ? parseInt(saved, 10) : NaN;
			if (Number.isFinite(parsed) && parsed >= minWidth && parsed <= maxWidth) {
				return parsed;
			}
		} catch {
			// Ignore errors
		}
		return initialWidth;
	});

	const [isDragDropMode, setIsDragDropMode] = useState(() => {
		// Load drag mode state from localStorage
		try {
			const saved = localStorage.getItem('sidebar.dragDropMode');
			return saved === 'true';
		} catch {
			return false;
		}
	});

	const [searchQuery, setSearchQuery] = useState('');
	const [matchAnywhere, setMatchAnywhere] = useState(false);

	const isResizing = useRef(false);

	// Handle search
	const handleSearch = useCallback((query: string) => {
		setSearchQuery(query);
	}, []);

	// Handle drag mode toggle
	const toggleDragDropMode = useCallback(() => {
		const newMode = !isDragDropMode;
		setIsDragDropMode(newMode);
		
		// Save to localStorage
		try {
			localStorage.setItem('sidebar.dragDropMode', newMode.toString());
		} catch {
			// Ignore errors
		}

		// Show toast notification
		if (newMode) {
			v4ToastManager.showSuccess(
				'Drag & Drop Mode Enabled',
				{
					description: 'You can now drag menu items between sections and reorder sections!',
				},
				{ duration: 3000 }
			);
		} else {
			v4ToastManager.showSuccess(
				'Standard View Mode',
				{
					description: 'Your customizations are preserved but drag handles are hidden.',
				},
				{ duration: 3000 }
			);
		}
	}, [isDragDropMode]);

	// Handle mouse events for resizing
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		isResizing.current = true;
		e.preventDefault();
	}, []);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isResizing.current) return;

			const newWidth = e.clientX;
			if (newWidth >= minWidth && newWidth <= maxWidth) {
				setSidebarWidth(newWidth);
			}
		};

		const handleMouseUp = () => {
			if (isResizing.current) {
				isResizing.current = false;
				try {
					localStorage.setItem('sidebar.width', String(sidebarWidth));
				} catch {
					// Ignore errors
				}
			}
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [sidebarWidth, minWidth, maxWidth]);

	// Handle overlay click
	const handleOverlayClick = useCallback(() => {
		onClose();
	}, [onClose]);

	return (
		<>
			<Overlay $isOpen={isOpen} onClick={handleOverlayClick} />
			<SidebarContainerWrapper $isOpen={isOpen} $width={sidebarWidth}>
				<ResizeHandle onMouseDown={handleMouseDown} />
				<ProSidebar width={`${sidebarWidth}px`}>
					<DragDropProvider>
						<SidebarHeader
							isOpen={isOpen}
							onClose={onClose}
							isDragDropMode={isDragDropMode}
							onToggleDragMode={toggleDragDropMode}
						/>
						<SidebarSearch
							onSearch={handleSearch}
							activeSearchQuery={searchQuery}
							matchAnywhere={matchAnywhere}
							onMatchAnywhereChange={setMatchAnywhere}
						/>
						<SidebarMenu
							dragMode={isDragDropMode}
							searchQuery={searchQuery}
							matchAnywhere={matchAnywhere}
							sidebarWidth={sidebarWidth}
						/>
					</DragDropProvider>
				</ProSidebar>
			</SidebarContainerWrapper>
		</>
	);
};

export default SidebarContainer;
