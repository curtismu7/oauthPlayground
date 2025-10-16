// src/components/StepNavigationButtons.tsx

import { FiArrowLeft, FiArrowRight, FiTrash2, FiSkipBack, FiMove, FiMaximize2, FiMinimize2, FiCheckCircle } from 'react-icons/fi';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';

export interface StepNavigationButtonsProps {
	currentStep: number;
	totalSteps: number;
	onPrevious: () => void;
	onReset: () => void;
	onStartOver?: () => void; // Optional: go back to step 0, clear tokens but keep credentials
	onNext: () => void;
	canNavigateNext: boolean;
	isFirstStep: boolean;
	nextButtonText?: string;
	disabledMessage?: string;
	stepRequirements?: string[];
	onCompleteAction?: () => void;
	showCompleteActionButton?: boolean;
}

const StepNavigation = styled.div<{ $position: { x: number; y: number }; $isDragging?: boolean; $compact?: boolean }>`
	position: fixed !important;
	left: ${({ $position }) => $position.x}px !important;
	top: ${({ $position }) => $position.y}px !important;
	background: rgba(255, 255, 255, 0.98) !important;
	backdrop-filter: blur(10px) !important;
	padding: ${({ $compact }) => ($compact ? '0.75rem 1rem' : '1.25rem 2rem')} !important;
	border-radius: ${({ $compact }) => ($compact ? '0.75rem' : '1rem')} !important;
	box-shadow: ${({ $isDragging }) =>
		$isDragging ? '0 12px 40px rgba(0, 0, 0, 0.25)' : '0 8px 32px rgba(0, 0, 0, 0.12)'} !important;
	border: 1px solid rgba(0, 0, 0, 0.08) !important;
	z-index: 1000 !important;
	display: flex !important;
	align-items: center !important;
	gap: ${({ $compact }) => ($compact ? '0.75rem' : '2rem')} !important;
	max-width: 90vw !important;
	visibility: visible !important;
	opacity: 1 !important;
	pointer-events: auto !important;
	user-select: ${({ $isDragging }) => ($isDragging ? 'none' : 'auto')} !important;
	cursor: ${({ $isDragging }) => ($isDragging ? 'grabbing' : 'move')} !important;
	transition: ${({ $isDragging }) => ($isDragging ? 'none' : 'all 0.2s ease')} !important;

	@media (max-width: 768px) {
		bottom: 1rem;
		padding: 1rem 1.5rem;
		gap: 1rem;
	}
`;

const StepIndicator = styled.div<{ $compact?: boolean }>`
	display: ${({ $compact }) => ($compact ? 'none' : 'flex')};
	align-items: center;
	gap: 0.75rem;
	padding-right: 2rem;
	border-right: 2px solid #e5e7eb;

	@media (max-width: 768px) {
		padding-right: 1rem;
	}
`;

const StepDot = styled.div<{ $active: boolean }>`
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: ${({ $active }) => ($active ? '#22c55e' : '#d1d5db')};
	transition: all 0.2s ease;
`;

const DragHandle = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	background: #f3f4f6;
	border-radius: 4px;
	margin-right: 1rem;
	cursor: default;
	color: #6b7280;
	flex-shrink: 0;
	transition: all 0.2s ease;
	pointer-events: none;

	&:hover {
		background: #e5e7eb;
		color: #374151;
		transform: scale(1.05);
	}

	&:active {
		transform: scale(0.95);
	}
`;

const NavigationButtons = styled.div<{ $compact?: boolean }>`
	display: flex;
	gap: ${({ $compact }) => ($compact ? '0.5rem' : '1rem')};
`;

const NavButton = styled.button<{ $variant?: 'primary' | 'success' | 'outline' | 'danger' | 'warning'; $compact?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: ${({ $compact }) => ($compact ? '0.25rem' : '0.5rem')};
	padding: ${({ $compact }) => ($compact ? '0.5rem 0.75rem' : '0.75rem 1.5rem')};
	border-radius: 0.625rem;
	font-size: ${({ $compact }) => ($compact ? '0.8125rem' : '0.9375rem')};
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	border: none;
	color: #ffffff;
	white-space: nowrap;

	${({ $variant }) =>
		$variant === 'primary' &&
		`
		background-color: #22c55e;
		box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
		&:hover:not(:disabled) {
			background-color: #16a34a;
			box-shadow: 0 6px 16px rgba(34, 197, 94, 0.35);
			transform: translateY(-1px);
		}
	`}

	${({ $variant }) =>
		$variant === 'success' &&
		`
		background-color: #16a34a;
		box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
		&:hover:not(:disabled) {
			background-color: #15803d;
			box-shadow: 0 6px 16px rgba(22, 163, 74, 0.35);
			transform: translateY(-1px);
		}
	`}

	${({ $variant }) =>
		$variant === 'outline' &&
		`
		background-color: #f3f4f6;
		color: #374151;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		&:hover:not(:disabled) {
			background-color: #e5e7eb;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		}
	`}

	${({ $variant }) =>
		$variant === 'danger' &&
		`
		background-color: #ef4444;
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
		&:hover:not(:disabled) {
			background-color: #dc2626;
			box-shadow: 0 6px 16px rgba(239, 68, 68, 0.35);
			transform: translateY(-1px);
		}
	`}

	${({ $variant }) =>
		$variant === 'warning' &&
		`
		background-color: #f59e0b;
		box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
		&:hover:not(:disabled) {
			background-color: #d97706;
			box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35);
			transform: translateY(-1px);
		}
	`}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}
`;

const CompactToggle = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	background: #3b82f6;
	border: none;
	border-radius: 0.5rem;
	color: white;
	cursor: pointer;
	transition: all 0.2s ease;
	flex-shrink: 0;
	box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);

	&:hover {
		background: #2563eb;
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
	}

	&:active {
		transform: scale(0.95);
	}

	svg {
		width: 16px;
		height: 16px;
	}
`;

export const StepNavigationButtons = ({
	currentStep,
	totalSteps,
	onPrevious,
	onReset,
	onStartOver,
	onNext,
	canNavigateNext,
	isFirstStep,
	nextButtonText,
	disabledMessage,
	stepRequirements,
	onCompleteAction,
	showCompleteActionButton,
}: StepNavigationButtonsProps) => {
	// Drag state management
	const [position, setPosition] = useState({
		x: window.innerWidth / 2 - 200,
		y: window.innerHeight - 120,
	});
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	// Load compact mode from localStorage on mount - persists across refreshes
	const [isCompact, setIsCompact] = useState(() => {
		try {
			const saved = localStorage.getItem('stepper-compact-mode');
			return saved === 'true';
		} catch (e) {
			console.warn('[StepNavigationButtons] Failed to load compact mode from localStorage:', e);
			return false;
		}
	});
	const stepperRef = useRef<HTMLDivElement>(null);

	// Save compact mode to localStorage whenever it changes
	useEffect(() => {
		try {
			localStorage.setItem('stepper-compact-mode', isCompact.toString());
			console.log('[StepNavigationButtons] Saved compact mode to localStorage:', isCompact);
		} catch (e) {
			console.warn('[StepNavigationButtons] Failed to save compact mode to localStorage:', e);
		}
	}, [isCompact]);

	// Handle drag start
	const handleDragStart = useCallback((e: React.MouseEvent) => {
		if (!stepperRef.current) return;

		const rect = stepperRef.current.getBoundingClientRect();
		setDragOffset({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		});
		setIsDragging(true);
		e.preventDefault();
	}, []);

	// Handle drag move
	const handleDragMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging) return;

			const newX = e.clientX - dragOffset.x;
			const newY = e.clientY - dragOffset.y;

			// Constrain to viewport bounds
			const maxX = window.innerWidth - (stepperRef.current?.offsetWidth || 400);
			const maxY = window.innerHeight - (stepperRef.current?.offsetHeight || 80);

			setPosition({
				x: Math.max(0, Math.min(newX, maxX)),
				y: Math.max(0, Math.min(newY, maxY)),
			});
		},
		[isDragging, dragOffset]
	);

	// Handle drag end
	const handleDragEnd = useCallback(() => {
		setIsDragging(false);
	}, []);

	// Add/remove event listeners for drag
	useEffect(() => {
		if (isDragging) {
			document.addEventListener('mousemove', handleDragMove);
			document.addEventListener('mouseup', handleDragEnd);
			document.body.style.userSelect = 'none';
		} else {
			document.removeEventListener('mousemove', handleDragMove);
			document.removeEventListener('mouseup', handleDragEnd);
			document.body.style.userSelect = '';
		}

		return () => {
			document.removeEventListener('mousemove', handleDragMove);
			document.removeEventListener('mouseup', handleDragEnd);
			document.body.style.userSelect = '';
		};
	}, [isDragging, handleDragMove, handleDragEnd]);

	const activeRequirement = stepRequirements?.[currentStep];
	const nextButtonTitle = !canNavigateNext
		? [disabledMessage || 'Complete the action above to continue', activeRequirement ? `Requirement: ${activeRequirement}` : undefined]
			.filter(Boolean)
			.join(' • ')
		: 'Proceed to next step';

	return (
		<StepNavigation 
			ref={stepperRef} 
			$position={position} 
			$isDragging={isDragging}
			$compact={isCompact}
			onMouseDown={handleDragStart}
		>
			<DragHandle>
				<FiMove size={16} />
			</DragHandle>
			<CompactToggle
				onClick={(e) => {
					e.stopPropagation();
					setIsCompact(!isCompact);
				}}
				title={isCompact ? 'Expand stepper' : 'Compact stepper'}
			>
				{isCompact ? <FiMaximize2 /> : <FiMinimize2 />}
			</CompactToggle>
			<StepIndicator $compact={isCompact}>
				{Array.from({ length: totalSteps }, (_, i) => (
					<StepDot key={i} $active={i <= currentStep} />
				))}
			</StepIndicator>
			<NavigationButtons $compact={isCompact}>
				<NavButton 
					onClick={(e) => {
						e.stopPropagation();
						onPrevious();
					}} 
					$variant="outline" 
					$compact={isCompact}
					disabled={isFirstStep}
				>
					<FiArrowLeft /> {!isCompact && 'Previous'}
				</NavButton>
				{onStartOver && !isFirstStep && (
					<NavButton 
						onClick={(e) => {
							e.stopPropagation();
							onStartOver();
						}} 
						$variant="warning"
						$compact={isCompact}
						title="Go back to Step 1, clear tokens/codes but keep credentials"
					>
						<FiSkipBack /> {!isCompact && 'Start Over'}
					</NavButton>
				)}
				<NavButton 
					onClick={(e) => {
						e.stopPropagation();
						onReset();
					}} 
					$variant="danger"
					$compact={isCompact}
					title="Complete reset: clear everything and expand all sections"
				>
					<FiTrash2 /> {!isCompact && 'Reset Flow'}
				</NavButton>
				{showCompleteActionButton && onCompleteAction && (
					<NavButton
						onClick={(e) => {
							e.stopPropagation();
							onCompleteAction();
						}}
						$variant="primary"
						$compact={isCompact}
						title="Complete the current action"
					>
						{isCompact ? <FiCheckCircle /> : (<><FiCheckCircle /> Complete Action</>)}
					</NavButton>
				)}
				<NavButton
					onClick={(e) => {
						e.stopPropagation();
						onNext();
					}}
					$variant="success"
					$compact={isCompact}
					disabled={!canNavigateNext}
					title={nextButtonTitle}
				>
					{isCompact ? <FiArrowRight /> : (
						<>
							{nextButtonText || (canNavigateNext ? 'Next' : 'Complete above action')} <FiArrowRight />
						</>
					)}
				</NavButton>
			</NavigationButtons>
		</StepNavigation>
	);
};

export default StepNavigationButtons;
