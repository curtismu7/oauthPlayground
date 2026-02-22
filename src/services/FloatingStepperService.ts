/**
 * @file FloatingStepperService.ts
 * @module services
 * @description A reusable floating stepper service for multi-step flows
 * @version 1.0.0
 * @since 2026-02-16
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

// Types
export interface FloatingStepperStep {
	id: string;
	title: string;
	description?: string;
	completed?: boolean;
}

export interface FloatingStepperProps {
	steps: FloatingStepperStep[];
	currentStep: number;
	onStepChange?: (stepIndex: number) => void;
	onPrevious?: () => void;
	onNext?: () => void;
	onComplete?: () => void;
	onReset?: () => void;
	variant?: 'oauth' | 'oidc' | 'mfa' | 'default';
	theme?: 'light' | 'dark';
	draggable?: boolean;
	showStepNumbers?: boolean;
	showStepIndicator?: boolean;
	className?: string;
	style?: React.CSSProperties;
	position?: { x: number; y: number };
}

// Styled Components
const _FloatingStepperContainer = styled.div<{
	position: { x: number; y: number };
	isDragging: boolean;
	compact: boolean;
	variant: string;
	theme: string;
}>`
	position: fixed;
	top: ${({ position }) => position.y}px;
	left: ${({ position }) => position.x}px;
	z-index: 1000;
	background: ${({ theme }) => (theme === 'dark' ? '#2d3748' : '#ffffff')};
	border-radius: 12px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(255, 255, 255, 0.2);
	padding: ${({ compact }) => (compact ? '12px' : '16px')};
	min-width: ${({ compact }) => (compact ? '200px' : '300px')};
	max-width: 400px;
	cursor: ${({ isDragging }) => (isDragging ? 'grabbing' : 'grab')};
	transition: transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
	}

	${({ variant }) => {
		switch (variant) {
			case 'oauth':
				return css`
					border-color: rgba(59, 130, 246, 0.3);
					&::before {
						content: '';
						position: absolute;
						top: 0;
						left: 0;
						right: 0;
						height: 3px;
						background: linear-gradient(90deg, #3b82f6, #1d4ed8);
						border-radius: 12px 12px 0 0;
					}
				`;
			case 'oidc':
				return css`
					border-color: rgba(16, 185, 129, 0.3);
					&::before {
						content: '';
						position: absolute;
						top: 0;
						left: 0;
						right: 0;
						height: 3px;
						background: linear-gradient(90deg, #10b981, #059669);
						border-radius: 12px 12px 0 0;
					}
				`;
			case 'mfa':
				return css`
					border-color: rgba(245, 158, 11, 0.3);
					&::before {
						content: '';
						position: absolute;
						top: 0;
						left: 0;
						right: 0;
						height: 3px;
						background: linear-gradient(90deg, #f59e0b, #d97706);
						border-radius: 12px 12px 0 0;
					}
				`;
			default:
				return css`
					border-color: rgba(107, 114, 128, 0.3);
				`;
		}
	}}
`;

const _DragHandle = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px;
	margin: -8px;
	color: ${({ theme }) => (theme === 'dark' ? '#a0aec0' : '#6b7280')};
	cursor: grab;

	&:hover {
		color: ${({ theme }) => (theme === 'dark' ? '#e2e8f0' : '#374151')};
	}
`;

const _StepIndicator = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
`;

const _StepDot = styled.div<{ active: boolean; completed: boolean }>`
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: ${({ active, completed, theme }) => {
		if (active) return theme === 'dark' ? '#3b82f6' : '#2563eb';
		if (completed) return theme === 'dark' ? '#10b981' : '#059669';
		return theme === 'dark' ? '#4b5563' : '#d1d5db';
	}};
	transition: all 0.3s ease;
`;

const _StepInfo = styled.div<{ compact: boolean }>`
	display: flex;
	flex-direction: column;
	gap: 4px;
	flex: 1;
	margin-left: 12px;
`;

const _StepTitle = styled.div<{ theme: string }>`
	font-size: 14px;
	font-weight: 600;
	color: ${({ theme }) => (theme === 'dark' ? '#f3f4f6' : '#1f2937')};
`;

const _StepDescription = styled.div<{ theme: string }>`
	font-size: 12px;
	color: ${({ theme }) => (theme === 'dark' ? '#9ca3af' : '#6b7280')};
	line-height: 1.4;
`;

// Main Component
export const FloatingStepper: React.FC<FloatingStepperProps> = ({
	steps,
	currentStep,
	onStepChange,
	onPrevious,
	onNext,
	onComplete,
	onReset,
	variant = 'default',
	theme = 'light',
	draggable = true,
	showStepNumbers = true,
	showStepIndicator = true,
	className = '',
	style = {},
	position = { x: 20, y: 20 },
}) => {
	let [isDragging, setIsDragging] = useState(false);
	const [currentPosition, setCurrentPosition] = useState(position);
	const [isCompact, setIsCompact] = useState(false);
	const dragRef = useRef<HTMLDivElement>(null);
	const dragStartRef = useRef({ x: 0, y: 0 });

	const isFirstStep = currentStep === 0;
	const isLastStep = currentStep === steps.length - 1;
	const canNavigateNext = currentStep < steps.length - 1;

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (!draggable) return;

			setIsDragging(true);
			dragStartRef.current = {
				x: e.clientX - currentPosition.x,
				y: e.clientY - currentPosition.y,
			};
		},
		[draggable, currentPosition]
	);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging) return;

			const newX = e.clientX - dragStartRef.current.x;
			const newY = e.clientY - dragStartRef.current.y;

			// Keep within viewport bounds
			const boundedX = Math.max(0, Math.min(newX, window.innerWidth - 300));
			const boundedY = Math.max(0, Math.min(newY, window.innerHeight - 150));

			setCurrentPosition({ x: boundedX, y: boundedY });
		},
		[isDragging]
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

	const _handlePrevious = useCallback(() => {
		if (onPrevious && !isFirstStep) {
			onPrevious();
		}
	}, [onPrevious, isFirstStep]);

	const _handleNext = useCallback(() => {
		if (onNext && canNavigateNext) {
			onNext();
		} else if (onComplete && isLastStep) {
			onComplete();
		}
	}, [onNext, onComplete, canNavigateNext, isLastStep]);

	const _handleReset = useCallback(() => {
		if (onReset) {
			onReset();
		}
	}, [onReset]);

	const _toggleCompact = useCallback(() => {
		setIsCompact((prev) => !prev);
	}, []);

	return (
		<FloatingStepperContainer
			ref={dragRef}
	position = { currentPosition };
	isDragging = { isDragging };
	compact = { isCompact };
	variant = { variant };
	theme = { theme };
	onMouseDown = { handleMouseDown };
	className = { className };
	style={style}
		>
			{draggable && (
				<_DragHandle _theme={theme}>
					<_FiMove _size={16} />
				</_DragHandle>
	)
};

{
	showStepIndicator && !isCompact && (
				<StepIndicator>
					{steps.slice(0, 3).map((step, index) => (
						<_StepDot
							_key={step.id}
							_active={index === currentStep}
							_completed={step.completed || index < currentStep}
						/>
					)
	)
}
{
	steps.length > 3 && <span>
	...</span>
}
<StepDot
						active={steps.length - 1 === currentStep}
completed={steps[steps.length - 1]?.completed || steps.length - 1 < currentStep}
					/>
				</StepIndicator>
)}

			<StepInfo compact=
{
	isCompact;
}
>
				<StepTitle theme=
{
	theme;
}
>
{
	showStepNumbers && `${currentStep + 1}/${steps.length} `;
}
{
	steps[currentStep]?.title;
}
</StepTitle>
{
	steps[currentStep]?.description && !isCompact && (
					<StepDescription theme={theme}>
						{steps[currentStep].description}
					</StepDescription>
				)
}
</StepInfo>
		</FloatingStepperContainer>
)
}

// Service class for advanced usage
export class FloatingStepperService {
	private static instance: FloatingStepperService;
	private steppers: Map<string, FloatingStepperProps> = new Map();

	static getInstance(): FloatingStepperService {
		if (!FloatingStepperService.instance) {
			FloatingStepperService.instance = new FloatingStepperService();
		}
		return FloatingStepperService.instance;
	}

	registerStepper(id: string, props: FloatingStepperProps): void {
		this.steppers.set(id, props);
	}

	unregisterStepper(id: string): void {
		this.steppers.delete(id);
	}

	getStepper(id: string): FloatingStepperProps | undefined {
		return this.steppers.get(id);
	}

	getAllSteppers(): Map<string, FloatingStepperProps> {
		return new Map(this.steppers);
	}

	updateStepper(id: string, updates: Partial<FloatingStepperProps>): void {
		const stepper = this.steppers.get(id);
		if (stepper) {
			this.steppers.set(id, { ...stepper, ...updates });
		}
	}

	// Utility methods
	static createOAuthSteps(): FloatingStepperStep[] {
		return [
			{ id: 'config', title: 'Configuration', description: 'Configure OAuth settings' },
			{ id: 'auth', title: 'Authorization', description: 'Get authorization code' },
			{ id: 'token', title: 'Token Exchange', description: 'Exchange code for tokens' },
			{ id: 'introspect', title: 'Introspection', description: 'Validate tokens' },
		];
	}

	static createMFASteps(): FloatingStepperStep[] {
		return [
			{ id: 'credentials', title: 'Credentials', description: 'Enter credentials' },
			{ id: 'mfa', title: 'MFA Challenge', description: 'Complete MFA verification' },
			{ id: 'success', title: 'Success', description: 'Authentication complete' },
		];
	}

	static createOIDCSteps(): FloatingStepperStep[] {
		return [
			{ id: 'discover', title: 'Discovery', description: 'Discover OpenID configuration' },
			{ id: 'auth', title: 'Authentication', description: 'Authenticate with OpenID' },
			{ id: 'token', title: 'Token', description: 'Get ID and access tokens' },
			{ id: 'userinfo', title: 'User Info', description: 'Retrieve user information' },
		];
	}
}

export default FloatingStepperService;
