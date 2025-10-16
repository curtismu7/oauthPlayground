// src/components/StepNavigationButtons.tsx

import { FiArrowLeft, FiArrowRight, FiRefreshCw, FiMove } from 'react-icons/fi';
import styled from 'styled-components';

export interface StepNavigationButtonsProps {
	currentStep: number;
	totalSteps: number;
	onPrevious: () => void;
	onReset: () => void;
	onNext: () => void;
	canNavigateNext: boolean;
	isFirstStep: boolean;
	nextButtonText?: string;
	disabledMessage?: string;
}

const StepNavigation = styled.div<{ $position: { x: number; y: number } }><{ x: number; y: number }>`
	position: fixed !important;
        cursor: move !important;
        left: ${({ $position }) => $position.x}px !important;
        top: ${({ $position }) => $position.y}px !important;
	bottom: 2rem !important;
	left: 50% !important;
	transform: translateX(-50%) !important;
	background: rgba(255, 255, 255, 0.98) !important;
	backdrop-filter: blur(10px) !important;
	padding: 1.25rem 2rem !important;
	border-radius: 1rem !important;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
	border: 1px solid rgba(0, 0, 0, 0.08) !important;
	z-index: 1000 !important;
	display: flex !important;
	align-items: center !important;
	gap: 2rem !important;
	max-width: 90vw !important;
	visibility: visible !important;
	opacity: 1 !important;
	pointer-events: auto !important;
	user-select: auto !important;

	@media (max-width: 768px) {
		bottom: 1rem;
		padding: 1rem 1.5rem;
		gap: 1rem;
	}
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
        cursor: move;
        color: #6b7280;
        flex-shrink: 0;

        const StepIndicator = styled.div`:hover {
                background: #e5e7eb;
        }
`;

const StepIndicator = styled.div`
	display: flex;
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

const NavigationButtons = styled.div`
	display: flex;
	gap: 1rem;
`;

const NavButton = styled.button<{ $variant?: 'primary' | 'success' | 'outline' | 'danger' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.625rem;
	font-size: 0.9375rem;
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

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}
`;

export const StepNavigationButtons = ({
	currentStep,
	totalSteps,
	onPrevious,
	onReset,
	onNext,
	canNavigateNext,
	isFirstStep,
	nextButtonText,
	disabledMessage,
}: StepNavigationButtonsProps) => {
	return (
		<StepNavigation>
			<StepIndicator>
				{Array.from({ length: totalSteps }, (_, i) => (
					<StepDot key={i} $active={i <= currentStep} />
				))}
			</StepIndicator>
			<NavigationButtons>
				<NavButton onClick={onPrevious} $variant="outline" disabled={isFirstStep}>
					<FiArrowLeft /> Previous
				</NavButton>
				<NavButton onClick={onReset} $variant="danger">
					<FiRefreshCw /> Reset Flow
				</NavButton>
				<NavButton
					onClick={onNext}
					$variant="success"
					disabled={!canNavigateNext}
					title={
						!canNavigateNext
							? disabledMessage || 'Complete the action above to continue'
							: 'Proceed to next step'
					}
				>
					{nextButtonText || (canNavigateNext ? 'Next' : 'Complete above action')} <FiArrowRight />
				</NavButton>
			</NavigationButtons>
		</StepNavigation>
	);
};

export default StepNavigationButtons;
