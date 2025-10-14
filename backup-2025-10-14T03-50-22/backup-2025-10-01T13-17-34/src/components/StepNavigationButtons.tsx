// src/components/StepNavigationButtons.tsx
import styled from 'styled-components';
import { FiArrowLeft, FiArrowRight, FiRefreshCw } from 'react-icons/fi';

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

const StepNavigation = styled.div`
	position: fixed;
	bottom: 2rem;
	left: 50%;
	transform: translateX(-50%);
	background: rgba(255, 255, 255, 0.98);
	backdrop-filter: blur(10px);
	padding: 1.25rem 2rem;
	border-radius: 1rem;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
	border: 1px solid rgba(0, 0, 0, 0.08);
	z-index: 1000;
	display: flex;
	align-items: center;
	gap: 2rem;
	max-width: 90vw;

	@media (max-width: 768px) {
		bottom: 1rem;
		padding: 1rem 1.5rem;
		gap: 1rem;
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
