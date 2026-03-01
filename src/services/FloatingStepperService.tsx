/**
 * @file FloatingStepperService.ts
 * @module services
 * @description Reusable floating stepper service for multi-step flows
 * @version 1.0.0
 * @since 2026-02-16
 *
 * This service provides a reusable floating stepper component that can be used
 * across different applications and flows. It combines the best features from the
 * OAuth Authorization Code Flow stepper and makes them configurable.
 */

import {
	FiArrowLeft,
	FiArrowRight,
	FiCheckCircle,
	FiMaximize2,
	FiMinimize2,
	FiMove,
	FiTrash2,
} from '@icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

export interface FloatingStepperStep {
	id: string;
	title: string;
	description?: string;
	completed?: boolean;
	current?: boolean;
}

export interface FloatingStepperConfig {
	steps: FloatingStepperStep[];
	currentStep: number;
	onStepChange?: (stepIndex: number) => void;
	onPrevious?: () => void;
	onNext?: () => void;
	onReset?: () => void;
	onComplete?: () => void;
	showStepIndicator?: boolean;
	showStepNumbers?: boolean;
	compact?: boolean;
	draggable?: boolean;
	position?: { x: number; y: number };
	variant?: 'default' | 'oauth' | 'oidc' | 'mfa';
	theme?: 'light' | 'dark';
}

export interface FloatingStepperProps extends FloatingStepperConfig {
	className?: string;
	style?: React.CSSProperties;
}

// Styled Components
const FloatingStepperContainer = styled.div<{
	$position: { x: number; y: number };
	$isDragging?: boolean;
	$compact?: boolean;
	$variant?: string;
	$theme?: string;
}>`
	position: fixed !important;
	left: ${({ $position }) => $position.x}px !important;
	top: ${({ $position }) => $position.y}px !important;
	background: ${({ $theme }) =>
		$theme === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)'} !important;
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

const StepDot = styled.div<{ $active: boolean; $completed: boolean }>`
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: ${({ $active, $completed }) => {
		if ($completed) return '#22c55e';
		if ($active) return '#3b82f6';
		return '#d1d5db';
	}};
	transition: all 0.2s ease;
`;

const StepInfo = styled.div<{ $compact?: boolean }>`
	display: ${({ $compact }) => ($compact ? 'none' : 'flex')};
	flex-direction: column;
	gap: 0.25rem;
`;

const StepTitle = styled.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
`;

const StepDescription = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
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
	}
`;

const NavigationButtons = styled.div`
	display: flex;
	gap: 0.75rem;
	margin-left: auto;
`;

const NavButton = styled.button<{
	$variant?: 'primary' | 'secondary' | 'danger';
	$disabled?: boolean;
}>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.25rem;
	border: none;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
	transition: all 0.2s ease;
	pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};
	opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

	${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: #3b82f6;
					color: white;
					&:hover:not(:disabled) {
						background: #2563eb;
					}
				`;
			case 'secondary':
				return `
					background: #f3f4f6;
					color: #374151;
					&:hover:not(:disabled) {
						background: #e5e7eb;
					}
				`;
			case 'danger':
				return `
					background: #ef4444;
					color: white;
					&:hover:not(:disabled) {
						background: #dc2626;
					}
				`;
			default:
				return `
					background: #f3f4f6;
					color: #374151;
					&:hover:not(:disabled) {
						background: #e5e7eb;
					}
				`;
		}
	}}
`;

const CompactToggle = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border: none;
	border-radius: 0.375rem;
	background: #f3f4f6;
	color: #6b7280;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #e5e7eb;
		color: #374151;
	}
`;

/**
 * FloatingStepper Component
 *
 * A reusable floating stepper component that can be used across different applications.
 * Features draggable positioning, step indicators, and responsive design.
 */
export const FloatingStepper: React.FC<FloatingStepperProps> = ({
	steps,
	currentStep,
	onStepChange,
	onPrevious,
	onNext,
	onReset,
	onComplete,
	showStepIndicator = true,
	showStepNumbers = false,
	compact = false,
	draggable = true,
	position = { x: 20, y: 20 },
	variant = 'default',
	theme = 'light',
	className,
	style,
}) => {
	const [isDragging, setIsDragging] = useState(false);
	const [isCompact, setIsCompact] = useState(compact);
	const [currentPosition, setCurrentPosition] = useState(position);
	const dragRef = useRef<HTMLDivElement>(null);
	const dragOffset = useRef({ x: 0, y: 0 });

	const totalSteps = steps.length;
	const isFirstStep = currentStep === 0;
	const isLastStep = currentStep === totalSteps - 1;
	const canNavigateNext = currentStep < totalSteps - 1;

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (!draggable) return;

			const rect = dragRef.current?.getBoundingClientRect();
			if (!rect) return;

			dragOffset.current = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};

			setIsDragging(true);
		},
		[draggable]
	);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging || !draggable) return;

			const newPosition = {
				x: e.clientX - dragOffset.current.x,
				y: e.clientY - dragOffset.current.y,
			};

			// Keep within viewport bounds
			const maxX = window.innerWidth - 200; // Approximate width
			const maxY = window.innerHeight - 100; // Approximate height

			setCurrentPosition({
				x: Math.max(0, Math.min(newPosition.x, maxX)),
				y: Math.max(0, Math.min(newPosition.y, maxY)),
			});
		},
		[isDragging, draggable]
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	useEffect(() => {
		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [isDragging, handleMouseMove, handleMouseUp]);

	const _handleStepClick = useCallback(
		(stepIndex: number) => {
			if (onStepChange) {
				onStepChange(stepIndex);
			}
		},
		[onStepChange]
	);

	const handlePrevious = useCallback(() => {
		if (onPrevious && !isFirstStep) {
			onPrevious();
		}
	}, [onPrevious, isFirstStep]);

	const handleNext = useCallback(() => {
		if (onNext && canNavigateNext) {
			onNext();
		} else if (onComplete && isLastStep) {
			onComplete();
		}
	}, [onNext, onComplete, canNavigateNext, isLastStep]);

	const handleReset = useCallback(() => {
		if (onReset) {
			onReset();
		}
	}, [onReset]);

	const toggleCompact = useCallback(() => {
		setIsCompact((prev) => !prev);
	}, []);

	return (
		<FloatingStepperContainer
			ref={dragRef}
			$position={currentPosition}
			$isDragging={isDragging}
			$compact={isCompact}
			$variant={variant}
			$theme={theme}
			onMouseDown={handleMouseDown}
			className={className}
			style={style}
		>
			{draggable && (
				<DragHandle>
					<FiMove size={16} />
				</DragHandle>
			)}

			{showStepIndicator && !isCompact && (
				<StepIndicator>
					{steps.slice(0, 3).map((step, index) => (
						<StepDot
							key={step.id}
							$active={index === currentStep}
							$completed={step.completed || index < currentStep}
						/>
					))}
					{totalSteps > 3 && <span>...</span>}
					<StepDot
						$active={totalSteps - 1 === currentStep}
						$completed={steps[totalSteps - 1]?.completed || totalSteps - 1 < currentStep}
					/>
					<StepInfo $compact={isCompact}>
						<StepTitle>
							{showStepNumbers && `${currentStep + 1}/${totalSteps}`}
							{steps[currentStep]?.title}
						</StepTitle>
						{steps[currentStep]?.description && (
							<StepDescription>{steps[currentStep].description}</StepDescription>
						)}
					</StepInfo>
				</StepIndicator>
			)}

			<NavigationButtons>
				{!isCompact && onReset && (
					<NavButton $variant="danger" onClick={handleReset} title="Reset flow">
						<FiTrash2 size={16} />
						Reset
					</NavButton>
				)}

				<NavButton
					$variant="secondary"
					onClick={handlePrevious}
					$disabled={isFirstStep}
					title="Previous step"
				>
					<FiArrowLeft size={16} />
					Previous
				</NavButton>

				<NavButton
					$variant="primary"
					onClick={handleNext}
					$disabled={!canNavigateNext && !isLastStep}
					title={isLastStep ? 'Complete flow' : 'Next step'}
				>
					{isLastStep ? <FiCheckCircle size={16} /> : <FiArrowRight size={16} />}
					{isLastStep ? 'Complete' : 'Next'}
				</NavButton>

				{draggable && (
					<CompactToggle
						onClick={toggleCompact}
						title={isCompact ? 'Expand stepper' : 'Compact stepper'}
					>
						{isCompact ? <FiMaximize2 size={16} /> : <FiMinimize2 size={16} />}
					</CompactToggle>
				)}
			</NavigationButtons>
		</FloatingStepperContainer>
	);
};

/**
 * FloatingStepperService
 *
 * Service class for managing floating stepper instances and configurations.
 */
export class FloatingStepperService {
	/**
	 * Default configuration for OAuth flows
	 */
	getOAuthConfig(steps: FloatingStepperStep[]): Partial<FloatingStepperConfig> {
		return {
			steps,
			variant: 'oauth',
			theme: 'light',
			showStepIndicator: true,
			showStepNumbers: true,
			draggable: true,
			position: { x: 20, y: 20 },
		};
	}

	/**
	 * Default configuration for MFA flows
	 */
	getMFAConfig(steps: FloatingStepperStep[]): Partial<FloatingStepperConfig> {
		return {
			steps,
			variant: 'mfa',
			theme: 'light',
			showStepIndicator: true,
			showStepNumbers: true,
			draggable: true,
			position: { x: 20, y: 20 },
		};
	}

	/**
	 * Default configuration for OIDC flows
	 */
	getOIDCConfig(steps: FloatingStepperStep[]): Partial<FloatingStepperConfig> {
		return {
			steps,
			variant: 'oidc',
			theme: 'light',
			showStepIndicator: true,
			showStepNumbers: true,
			draggable: true,
			position: { x: 20, y: 20 },
		};
	}

	/**
	 * Create a compact stepper configuration
	 */
	getCompactConfig(steps: FloatingStepperStep[]): Partial<FloatingStepperConfig> {
		return {
			steps,
			compact: true,
			showStepIndicator: false,
			showStepNumbers: true,
			draggable: true,
			position: { x: 20, y: 20 },
		};
	}

	/**
	 * Get default position based on screen size
	 */
	getDefaultPosition(): { x: number; y: number } {
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;

		// Position in bottom-right corner by default
		return {
			x: screenWidth - 300,
			y: screenHeight - 150,
		};
	}
}

export default FloatingStepper;
