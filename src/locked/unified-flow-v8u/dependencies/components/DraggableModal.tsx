// src/components/DraggableModal.tsx
// Reusable draggable and collapsible modal component

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	FiMaximize,
	FiMaximize2,
	FiMinimize,
	FiMinimize2,
	FiMove,
	FiX
} from 'react-icons/fi';
import styled from 'styled-components';

// Styled components
const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  
  @media (max-width: 1024px) {
    padding: 1.5rem;
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.5rem;
  }
`;

const ModalContent = styled.div<{
	$isMinimized: boolean;
	$position: { x: number; y: number };
	$isDragging: boolean;
	$width?: string;
	$maxHeight?: string;
}>`
  width: ${(props) => (props.$isMinimized ? '300px' : props.$width || 'min(800px, calc(100vw - 4rem))')};
  max-height: ${(props) => (props.$isMinimized ? 'auto' : props.$maxHeight || 'calc(100vh - 4rem)')};
  height: ${(props) => (props.$isMinimized ? 'auto' : 'auto')};
  background: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
  padding: ${(props) => (props.$isMinimized ? '0.75rem' : '0')};
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  
  @media (max-width: 1024px) {
    width: min(700px, calc(100vw - 3rem));
    max-height: calc(100vh - 3rem);
  }
  
  @media (max-width: 768px) {
    width: calc(100vw - 2rem);
    max-height: calc(100vh - 2rem);
  }
  
  @media (max-width: 480px) {
    width: calc(100vw - 1rem);
    max-height: calc(100vh - 1rem);
  }
  position: fixed;
  top: ${(props) => props.$position.y}px;
  left: ${(props) => props.$position.x}px;
  cursor: ${(props) => (props.$isDragging ? 'grabbing' : 'default')};
  transition: ${(props) => (props.$isDragging ? 'none' : 'all 0.2s ease')};
  z-index: 1001;
  
  /* Ensure modal stays within viewport */
  max-width: calc(100vw - 2rem);
`;

const ModalHeader = styled.div<{ $isMinimized: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #cbd5e1;
  margin: 0;
  padding: ${(props) => (props.$isMinimized ? '0.75rem' : '1.5rem')};
  border-radius: ${(props) => (props.$isMinimized ? '0.75rem' : '0.75rem 0.75rem 0 0')};
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  
  &:active {
    cursor: grabbing;
  }
  
  @media (max-width: 768px) {
    padding: ${(props) => (props.$isMinimized ? '0.75rem' : '1rem')};
  }
`;

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  padding: 0.25rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f1f5f9;
  }
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ControlButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
  
  &:hover {
    background-color: #f1f5f9;
    color: #334155;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ModalTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
`;

interface DraggableModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	width?: string;
	maxHeight?: string;
	showMinimize?: boolean;
	headerContent?: React.ReactNode;
}

export const DraggableModal: React.FC<DraggableModalProps> = ({
	isOpen,
	onClose,
	title,
	children,
	width,
	maxHeight,
	showMinimize = true,
	headerContent,
}) => {
	const [isMinimized, setIsMinimized] = useState(false);
	const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const modalRef = useRef<HTMLDivElement>(null);

	// Center modal initially and ensure it's visible
	useEffect(() => {
		if (isOpen && modalPosition.x === 0 && modalPosition.y === 0) {
			// Use setTimeout to ensure DOM is fully rendered
			const timer = setTimeout(() => {
				const modalWidth = modalRef.current?.offsetWidth || 900;
				// For tall modals, use a reasonable max height (4rem = 64px)
				const padding = 64;
				const maxModalHeight = Math.min(800, window.innerHeight - padding);
				const centerX = Math.max(20, (window.innerWidth - modalWidth) / 2);
				// Position near top of viewport with some margin, but ensure it's visible
				const centerY = Math.max(20, Math.min(40, (window.innerHeight - maxModalHeight) / 2));
				setModalPosition({ x: centerX, y: centerY });
			}, 0);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [isOpen, modalPosition.x, modalPosition.y]);

	// Reset state when modal closes
	useEffect(() => {
		if (!isOpen) {
			setIsMinimized(false);
			setModalPosition({ x: 0, y: 0 });
			setIsDragging(false);
		}
	}, [isOpen]);

	// Drag and drop functionality
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (isMinimized) return;

			// Only start drag if clicking on the drag handle, not on buttons
			if ((e.target as HTMLElement).closest('button')) return;

			const rect = modalRef.current?.getBoundingClientRect();
			if (rect) {
				setDragOffset({
					x: e.clientX - rect.left,
					y: e.clientY - rect.top,
				});
				setIsDragging(true);
				e.preventDefault();
			}
		},
		[isMinimized]
	);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging || isMinimized) return;

			const newX = e.clientX - dragOffset.x;
			const newY = e.clientY - dragOffset.y;

			// Keep modal within viewport bounds
			const modalWidth = modalRef.current?.offsetWidth || 900;
			const modalHeight = modalRef.current?.offsetHeight || 600;
			const maxX = Math.max(0, window.innerWidth - modalWidth - 20);
			const maxY = Math.max(20, window.innerHeight - modalHeight - 20);

			setModalPosition({
				x: Math.max(20, Math.min(newX, maxX)),
				y: Math.max(20, Math.min(newY, maxY)),
			});
		},
		[isDragging, dragOffset, isMinimized]
	);

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

	// Handle escape key to close modal
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleKeyDown);
		}

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen, onClose]);

	// Prevent body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
		return undefined;
	}, [isOpen]);

	const toggleMinimize = () => {
		setIsMinimized(!isMinimized);
	};

	const handleClose = () => {
		onClose();
		setIsMinimized(false);
		setModalPosition({ x: 0, y: 0 });
	};

	if (!isOpen) return null;

	return (
		<ModalBackdrop role="dialog" aria-modal="true" aria-labelledby="modal-title">
			<ModalContent
				ref={modalRef}
				$isMinimized={isMinimized}
				$position={modalPosition}
				$isDragging={isDragging}
				{...(width && { $width: width })}
				{...(maxHeight && { $maxHeight: maxHeight })}
			>
				<ModalHeader $isMinimized={isMinimized} onMouseDown={handleMouseDown}>
					<DragHandle>
						<FiMove size={16} />
						<div>
							<ModalTitle id="modal-title">{title}</ModalTitle>
							{headerContent && !isMinimized && headerContent}
						</div>
					</DragHandle>
					<HeaderControls>
						{showMinimize && (
							<ControlButton onClick={toggleMinimize} title={isMinimized ? 'Maximize' : 'Minimize'}>
								{isMinimized ? <FiMaximize2 size={16} /> : <FiMinimize2 size={16} />}
							</ControlButton>
						)}
						<ControlButton onClick={handleClose} title="Close">
							<FiX size={16} />
						</ControlButton>
					</HeaderControls>
				</ModalHeader>

				{!isMinimized && (
					<div
						style={{
							flex: '1 1 auto',
							overflowY: 'auto',
							overflowX: 'hidden',
							minHeight: 0,
							maxHeight: 'calc(100vh - 10rem)',
							display: 'flex',
							flexDirection: 'column',
							padding: '1.5rem',
							WebkitOverflowScrolling: 'touch',
							scrollbarWidth: 'thin',
							scrollbarColor: '#cbd5e1 #f1f5f9',
						}}
					>
						{children}
					</div>
				)}
			</ModalContent>
		</ModalBackdrop>
	);
};
