/**
 * DragDropProvider - Context provider for drag and drop state management
 * Centralizes all drag and drop logic and state to improve performance and maintainability
 */

import React, { createContext, useContext, useCallback, useState, ReactNode } from 'react';

// Types for drag and drop operations
export interface DragItemData {
	type: 'group' | 'item';
	id: string;
	groupId?: string;
	subGroupId?: string;
}

export interface DragDropContextType {
	draggedItem: DragItemData | null;
	isDragging: boolean;
	dragMode: boolean;
	setDraggedItem: (item: DragItemData | null) => void;
	startDrag: (e: React.DragEvent, type: 'group' | 'item', id: string, groupId?: string, subGroupId?: string) => void;
	endDrag: () => void;
	setDragMode: (enabled: boolean) => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

interface DragDropProviderProps {
	children: ReactNode;
	initialDragMode?: boolean;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({ 
	children, 
	initialDragMode = false 
}) => {
	const [draggedItem, setDraggedItem] = useState<DragItemData | null>(null);
	const [dragMode, setDragMode] = useState(initialDragMode);

	const isDragging = draggedItem !== null;

	const startDrag = useCallback((
		e: React.DragEvent,
		type: 'group' | 'item',
		id: string,
		groupId?: string,
		subGroupId?: string
	) => {
		const dragData: DragItemData = {
			type,
			id,
			...(groupId && { groupId }),
			...(subGroupId && { subGroupId }),
		};

		setDraggedItem(dragData);

		// Set drag data for transfer
		try {
			e.dataTransfer.setData('application/json', JSON.stringify(dragData));
			e.dataTransfer.effectAllowed = dragMode ? 'move' : 'copy';
		} catch (error) {
			console.warn('Failed to set drag data:', error);
		}

		// Add visual feedback
		const target = e.currentTarget as HTMLElement;
		target.style.opacity = '0.5';
	}, [dragMode]);

	const endDrag = useCallback(() => {
		// Clear dragged item
		setDraggedItem(null);

		// Reset visual feedback
		const draggedElements = document.querySelectorAll('[style*="opacity: 0.5"]');
		draggedElements.forEach((element) => {
			(element as HTMLElement).style.opacity = '1';
		});
	}, []);

	const contextValue: DragDropContextType = {
		draggedItem,
		isDragging,
		dragMode,
		setDraggedItem,
		startDrag,
		endDrag,
		setDragMode,
	};

	return (
		<DragDropContext.Provider value={contextValue}>
			{children}
		</DragDropContext.Provider>
	);
};

export const useDragDrop = (): DragDropContextType => {
	const context = useContext(DragDropContext);
	if (context === undefined) {
		throw new Error('useDragDrop must be used within a DragDropProvider');
	}
	return context;
};

// Hook for getting dragged item data from event
export const useDraggedItemData = (e: React.DragEvent): DragItemData | null => {
	try {
		const data = e.dataTransfer.getData('application/json');
		return data ? JSON.parse(data) : null;
	} catch {
		return null;
	}
};

export default DragDropProvider;
