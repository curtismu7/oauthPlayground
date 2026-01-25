/**
 * ContextMenuProvider - Right-click context menus for sidebar items
 * Phase 2: User Experience Enhancement
 * 
 * Provides context menu functionality:
 * - Right-click context menus
 * - Keyboard shortcuts for context actions
 * - Customizable menu items
 * - Positioning logic
 */

import React, { createContext, useContext, useCallback, useRef, useState, ReactNode } from 'react';
import styled from 'styled-components';

// Types for context menus
export interface ContextMenuItem {
	id: string;
	label: string;
	icon?: React.ReactNode;
	shortcut?: string;
	disabled?: boolean;
	separator?: boolean;
	onClick: () => void;
}

export interface ContextMenuState {
	visible: boolean;
	x: number;
	y: number;
	items: ContextMenuItem[];
	targetId?: string;
}

export interface ContextMenuContextType {
	showContextMenu: (x: number, y: number, items: ContextMenuItem[], targetId?: string) => void;
	hideContextMenu: () => void;
	contextMenuState: ContextMenuState;
}

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

// Styled components
const ContextMenuOverlay = styled.div<{ $visible: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 9999;
	background: transparent;
	display: ${(props) => (props.$visible ? 'block' : 'none')};
`;

const ContextMenuContainer = styled.div<{ $x: number; $y: number }>`
	position: fixed;
	left: ${(props) => props.$x}px;
	top: ${(props) => props.$y}px;
	z-index: 10000;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	padding: 0.5rem 0;
	min-width: 200px;
	max-width: 300px;
	overflow: hidden;
`;

const ContextMenuItemStyled = styled.button<{ $disabled?: boolean }>`
	width: 100%;
	padding: 0.5rem 1rem;
	border: none;
	background: transparent;
	color: ${(props) => (props.$disabled ? '#9ca3af' : '#374151')};
	font-size: 0.875rem;
	font-weight: 500;
	text-align: left;
	cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background: #f3f4f6;
		color: #1f2937;
	}

	&:active:not(:disabled) {
		background: #e5e7eb;
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
`;

const ContextMenuSeparator = styled.div`
	height: 1px;
	background: #e5e7eb;
	margin: 0.25rem 0;
`;

const ContextMenuShortcut = styled.span`
	margin-left: auto;
	color: #9ca3af;
	font-size: 0.75rem;
	font-weight: 400;
`;

interface ContextMenuProviderProps {
	children: ReactNode;
}

export const ContextMenuProvider: React.FC<ContextMenuProviderProps> = ({ children }) => {
	const [contextMenuState, setContextMenuState] = useState<ContextMenuState>({
		visible: false,
		x: 0,
		y: 0,
		items: [],
	});

	const containerRef = useRef<HTMLDivElement>(null);

	// Show context menu
	const showContextMenu = useCallback((
		x: number,
		y: number,
		items: ContextMenuItem[],
		targetId?: string
	) => {
		setContextMenuState({
			visible: true,
			x,
			y,
			items,
			targetId,
		});
	}, []);

	// Hide context menu
	const hideContextMenu = useCallback(() => {
		setContextMenuState((prev) => ({ ...prev, visible: false }));
	}, []);

	// Handle click outside to close context menu
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				hideContextMenu();
			}
		};

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				hideContextMenu();
			}
		};

		if (contextMenuState.visible) {
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('keydown', handleEscape);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		};
	}, [contextMenuState.visible, hideContextMenu]);

	// Adjust position if menu goes off-screen
	useEffect(() => {
		if (contextMenuState.visible && containerRef.current) {
			const menu = containerRef.current;
			const rect = menu.getBoundingClientRect();
			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;

			let adjustedX = contextMenuState.x;
			let adjustedY = contextMenuState.y;

			// Adjust horizontal position
			if (rect.right > windowWidth) {
				adjustedX = windowWidth - rect.width - 10;
			}

			// Adjust vertical position
			if (rect.bottom > windowHeight) {
				adjustedY = windowHeight - rect.height - 10;
			}

			// Update position if adjustments were needed
			if (adjustedX !== contextMenuState.x || adjustedY !== contextMenuState.y) {
				setContextMenuState((prev) => ({
					...prev,
					x: adjustedX,
					y: adjustedY,
				}));
			}
		}
	}, [contextMenuState.visible, contextMenuState.x, contextMenuState.y]);

	const contextValue: ContextMenuContextType = {
		showContextMenu,
		hideContextMenu,
		contextMenuState,
	};

	return (
		<ContextMenuContext.Provider value={contextValue}>
			{children}
			<ContextMenuOverlay $visible={contextMenuState.visible} onClick={hideContextMenu}>
				{contextMenuState.visible && (
					<ContextMenuContainer ref={containerRef} $x={contextMenuState.x} $y={contextMenuState.y}>
						{contextMenuState.items.map((item, index) => {
							if (item.separator) {
								return <ContextMenuSeparator key={`separator-${index}`} />;
							}

							return (
								<ContextMenuItemStyled
									key={item.id}
									$disabled={item.disabled}
									onClick={() => {
										if (!item.disabled) {
											item.onClick();
											hideContextMenu();
										}
									}}
									disabled={item.disabled}
								>
									{item.icon}
									<span>{item.label}</span>
									{item.shortcut && (
										<ContextMenuShortcut>{item.shortcut}</ContextMenuShortcut>
									)}
								</ContextMenuItemStyled>
							);
						})}
					</ContextMenuContainer>
				)}
			</ContextMenuOverlay>
		</ContextMenuContext.Provider>
	);
};

export const useContextMenu = (): ContextMenuContextType => {
	const context = useContext(ContextMenuContext);
	if (context === undefined) {
		throw new Error('useContextMenu must be used within a ContextMenuProvider');
	}
	return context;
};

// Hook for context menu with predefined actions
export const useSidebarContextMenu = () => {
	const { showContextMenu } = useContextMenu();

	const showItemContextMenu = useCallback((
		e: React.MouseEvent,
		itemId: string,
		itemLabel: string,
		itemPath: string,
		onFavorite?: (id: string) => void,
		onCopy?: (path: string) => void,
		onOpenInNewTab?: (path: string) => void
	) => {
		e.preventDefault();
		e.stopPropagation();

		const items: ContextMenuItem[] = [
			{
				id: 'favorite',
				label: 'Add to Favorites',
				onClick: () => onFavorite?.(itemId),
			},
			{
				id: 'copy',
				label: 'Copy Link',
				shortcut: 'Ctrl+C',
				onClick: () => onCopy?.(itemPath),
			},
			{
				id: 'open-new-tab',
				label: 'Open in New Tab',
				shortcut: 'Ctrl+T',
				onClick: () => onOpenInNewTab?.(itemPath),
			},
			{
				id: 'separator1',
				label: '',
				onClick: () => {},
				separator: true,
			},
			{
				id: 'properties',
				label: 'Properties',
				onClick: () => {
					console.log('Properties for:', itemLabel);
				},
			},
		];

		showContextMenu(e.clientX, e.clientY, items, itemId);
	}, [showContextMenu]);

	const showSectionContextMenu = useCallback((
		e: React.MouseEvent,
		sectionId: string,
		sectionLabel: string,
		onCollapse?: (id: string) => void,
		onExpand?: (id: string) => void,
		onCollapseAll?: () => void,
		onExpandAll?: () => void
	) => {
		e.preventDefault();
		e.stopPropagation();

		const items: ContextMenuItem[] = [
			{
				id: 'collapse',
				label: 'Collapse Section',
				onClick: () => onCollapse?.(sectionId),
			},
			{
				id: 'expand',
				label: 'Expand Section',
				onClick: () => onExpand?.(sectionId),
			},
			{
				id: 'separator1',
				label: '',
				onClick: () => {},
				separator: true,
			},
			{
				id: 'collapse-all',
				label: 'Collapse All',
				onClick: () => onCollapseAll?.(),
			},
			{
				id: 'expand-all',
				label: 'Expand All',
				onClick: () => onExpandAll?.(),
			},
		];

		showContextMenu(e.clientX, e.clientY, items, sectionId);
	}, [showContextMenu]);

	return {
		showItemContextMenu,
		showSectionContextMenu,
	};
};

export default ContextMenuProvider;
