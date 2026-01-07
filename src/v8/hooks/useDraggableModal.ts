// src/v8/hooks/useDraggableModal.ts
// Reusable hook for making modals draggable

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseDraggableModalReturn {
	modalRef: React.RefObject<HTMLDivElement>;
	modalPosition: { x: number; y: number };
	isDragging: boolean;
	handleMouseDown: (e: React.MouseEvent) => void;
	modalStyle: React.CSSProperties;
}

/**
 * Hook to make a modal draggable
 * @param isOpen - Whether the modal is open
 * @param initialCenter - Whether to center the modal initially (default: true)
 */
export function useDraggableModal(isOpen: boolean, initialCenter = true): UseDraggableModalReturn {
	const modalRef = useRef<HTMLDivElement>(null);
	const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	// Center modal initially when it opens
	useEffect(() => {
		if (isOpen && initialCenter && modalPosition.x === 0 && modalPosition.y === 0) {
			const timer = setTimeout(() => {
				const modalWidth = modalRef.current?.offsetWidth || 550;
				const modalHeight = modalRef.current?.offsetHeight || 400;
				const centerX = Math.max(20, (window.innerWidth - modalWidth) / 2);
				const centerY = Math.max(20, (window.innerHeight - modalHeight) / 2);
				setModalPosition({ x: centerX, y: centerY });
			}, 0);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [isOpen, initialCenter, modalPosition.x, modalPosition.y]);

	// Reset position when modal closes
	useEffect(() => {
		if (!isOpen) {
			setModalPosition({ x: 0, y: 0 });
			setIsDragging(false);
		}
	}, [isOpen]);

	// Handle drag start
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		// Don't start drag if clicking on buttons or interactive elements
		if (
			(e.target as HTMLElement).closest('button') ||
			(e.target as HTMLElement).closest('input') ||
			(e.target as HTMLElement).closest('select') ||
			(e.target as HTMLElement).closest('textarea') ||
			(e.target as HTMLElement).closest('a')
		) {
			return;
		}

		const rect = modalRef.current?.getBoundingClientRect();
		if (rect) {
			// Get current modal position (either from state or from getBoundingClientRect if centered)
			let currentX = modalPosition.x;
			let currentY = modalPosition.y;
			
			// If modal is centered (position is 0,0), use current rect position
			if (currentX === 0 && currentY === 0) {
				currentX = rect.left;
				currentY = rect.top;
				// Update position state immediately
				setModalPosition({ x: currentX, y: currentY });
			}
			
			// Calculate drag offset: mouse position relative to modal's current top-left corner
			const offsetX = e.clientX - currentX;
			const offsetY = e.clientY - currentY;
			
			setDragOffset({
				x: offsetX,
				y: offsetY,
			});
			
			setIsDragging(true);
			e.preventDefault();
			e.stopPropagation();
		}
	}, [modalPosition]);

	// Handle drag movement
	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging) return;

			const newX = e.clientX - dragOffset.x;
			const newY = e.clientY - dragOffset.y;

			// Keep modal within viewport bounds
			const modalWidth = modalRef.current?.offsetWidth || 550;
			const modalHeight = modalRef.current?.offsetHeight || 400;
			const maxX = Math.max(0, window.innerWidth - modalWidth - 20);
			const maxY = Math.max(20, window.innerHeight - modalHeight - 20);

			setModalPosition({
				x: Math.max(20, Math.min(newX, maxX)),
				y: Math.max(20, Math.min(newY, maxY)),
			});
		},
		[isDragging, dragOffset]
	);

	// Handle drag end
	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	// Add event listeners for drag functionality
	useEffect(() => {
		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
		return undefined;
	}, [isDragging, handleMouseMove, handleMouseUp]);

	// Calculate modal style with position
	const modalStyle: React.CSSProperties =
		modalPosition.x !== 0 || modalPosition.y !== 0 || isDragging
			? {
					position: 'fixed',
					left: `${modalPosition.x}px`,
					top: `${modalPosition.y}px`,
					margin: 0,
					cursor: isDragging ? 'grabbing' : 'default',
					zIndex: 1001, // Ensure modal stays above overlay
				}
			: {
					cursor: isDragging ? 'grabbing' : 'default',
				};

	return {
		modalRef,
		modalPosition,
		isDragging,
		handleMouseDown,
		modalStyle,
	};
}
