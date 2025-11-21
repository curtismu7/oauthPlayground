/**
 * @file StepActionButtonsV8.test.tsx
 * @module v8/components/__tests__
 * @description Tests for StepActionButtonsV8 component
 * @version 8.0.0
 * @since 2024-11-16
 */

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepActionButtonsV8 from '../StepActionButtonsV8';

describe('StepActionButtonsV8', () => {
	const mockOnPrevious = jest.fn();
	const mockOnNext = jest.fn();
	const mockOnFinal = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Button States', () => {
		it('should disable previous button on first step', () => {
			render(
				<StepActionButtonsV8
					currentStep={0}
					totalSteps={4}
					isNextDisabled={false}
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
				/>
			);

			const previousBtn = screen.getByRole('button', { name: /previous/i });
			expect(previousBtn).toBeDisabled();
		});

		it('should enable previous button after first step', () => {
			render(
				<StepActionButtonsV8
					currentStep={1}
					totalSteps={4}
					isNextDisabled={false}
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
				/>
			);

			const previousBtn = screen.getByRole('button', { name: /previous/i });
			expect(previousBtn).not.toBeDisabled();
		});

		it('should disable next button when validation fails', () => {
			render(
				<StepActionButtonsV8
					currentStep={0}
					totalSteps={4}
					isNextDisabled={true}
					nextDisabledReason="Missing required fields"
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
				/>
			);

			const nextBtn = screen.getByRole('button', { name: /next step/i });
			expect(nextBtn).toBeDisabled();
		});

		it('should enable next button when validation passes', () => {
			render(
				<StepActionButtonsV8
					currentStep={0}
					totalSteps={4}
					isNextDisabled={false}
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
				/>
			);

			const nextBtn = screen.getByRole('button', { name: /next step/i });
			expect(nextBtn).not.toBeDisabled();
		});
	});

	describe('Button Clicks', () => {
		it('should call onPrevious when previous button clicked', async () => {
			const user = userEvent.setup();

			render(
				<StepActionButtonsV8
					currentStep={1}
					totalSteps={4}
					isNextDisabled={false}
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
				/>
			);

			const previousBtn = screen.getByRole('button', { name: /previous/i });
			await user.click(previousBtn);

			expect(mockOnPrevious).toHaveBeenCalledTimes(1);
		});

		it('should call onNext when next button clicked', async () => {
			const user = userEvent.setup();

			render(
				<StepActionButtonsV8
					currentStep={0}
					totalSteps={4}
					isNextDisabled={false}
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
				/>
			);

			const nextBtn = screen.getByRole('button', { name: /next step/i });
			await user.click(nextBtn);

			expect(mockOnNext).toHaveBeenCalledTimes(1);
		});

		it('should not call onNext when disabled and clicked', async () => {
			const user = userEvent.setup();

			render(
				<StepActionButtonsV8
					currentStep={0}
					totalSteps={4}
					isNextDisabled={true}
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
				/>
			);

			const nextBtn = screen.getByRole('button', { name: /next step/i });
			await user.click(nextBtn);

			expect(mockOnNext).not.toHaveBeenCalled();
		});

		it('should call onFinal on last step', async () => {
			const user = userEvent.setup();

			render(
				<StepActionButtonsV8
					currentStep={3}
					totalSteps={4}
					isNextDisabled={false}
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
					onFinal={mockOnFinal}
				/>
			);

			const finalBtn = screen.getByRole('button', { name: /start new flow/i });
			await user.click(finalBtn);

			expect(mockOnFinal).toHaveBeenCalledTimes(1);
		});
	});

	describe('Tooltip', () => {
		it('should show tooltip when next button disabled and hovered', async () => {
			const user = userEvent.setup();

			render(
				<StepActionButtonsV8
					currentStep={0}
					totalSteps={4}
					isNextDisabled={true}
					nextDisabledReason="Environment ID is required"
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
				/>
			);

			const nextBtn = screen.getByRole('button', { name: /next step/i });
			await user.hover(nextBtn);

			expect(screen.getByText('Environment ID is required')).toBeInTheDocument();
		});

		it('should hide tooltip when mouse leaves', async () => {
			const user = userEvent.setup();

			render(
				<StepActionButtonsV8
					currentStep={0}
					totalSteps={4}
					isNextDisabled={true}
					nextDisabledReason="Environment ID is required"
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
				/>
			);

			const nextBtn = screen.getByRole('button', { name: /next step/i });
			await user.hover(nextBtn);
			expect(screen.getByText('Environment ID is required')).toBeInTheDocument();

			await user.unhover(nextBtn);
			expect(screen.queryByText('Environment ID is required')).not.toBeInTheDocument();
		});

		it('should not show tooltip when next button enabled', () => {
			render(
				<StepActionButtonsV8
					currentStep={0}
					totalSteps={4}
					isNextDisabled={false}
					nextDisabledReason="Environment ID is required"
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
				/>
			);

			expect(screen.queryByText('Environment ID is required')).not.toBeInTheDocument();
		});
	});

	describe('Keyboard Navigation', () => {
		it('should go to previous step with arrow left', async () => {
			const _user = userEvent.setup();

			const { container } = render(
				<StepActionButtonsV8
					currentStep={1}
					totalSteps={4}
					isNextDisabled={false}
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
				/>
			);

			const wrapper = container.querySelector('.step-action-buttons-v8');
			fireEvent.keyDown(wrapper!, { key: 'ArrowLeft' });

			expect(mockOnPrevious).toHaveBeenCalled();
		});

		it('should go to next step with arrow right', async () => {
			const _user = userEvent.setup();

			const { container } = render(
				<StepActionButtonsV8
					currentStep={0}
					totalSteps={4}
					isNextDisabled={false}
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
				/>
			);

			const wrapper = container.querySelector('.step-action-buttons-v8');
			fireEvent.keyDown(wrapper!, { key: 'ArrowRight' });

			expect(mockOnNext).toHaveBeenCalled();
		});

		it('should not go to previous with arrow left on first step', () => {
			const { container } = render(
				<StepActionButtonsV8
					currentStep={0}
					totalSteps={4}
					isNextDisabled={false}
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
				/>
			);

			const wrapper = container.querySelector('.step-action-buttons-v8');
			fireEvent.keyDown(wrapper!, { key: 'ArrowLeft' });

			expect(mockOnPrevious).not.toHaveBeenCalled();
		});

		it('should not go to next with arrow right when disabled', () => {
			const { container } = render(
				<StepActionButtonsV8
					currentStep={0}
					totalSteps={4}
					isNextDisabled={true}
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
				/>
			);

			const wrapper = container.querySelector('.step-action-buttons-v8');
			fireEvent.keyDown(wrapper!, { key: 'ArrowRight' });

			expect(mockOnNext).not.toHaveBeenCalled();
		});
	});

	describe('Custom Labels', () => {
		it('should use custom next label', () => {
			render(
				<StepActionButtonsV8
					currentStep={0}
					totalSteps={4}
					isNextDisabled={false}
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
					nextLabel="Continue"
				/>
			);

			expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
		});

		it('should use custom final label', () => {
			render(
				<StepActionButtonsV8
					currentStep={3}
					totalSteps={4}
					isNextDisabled={false}
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
					finalLabel="Complete"
				/>
			);

			expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA attributes', () => {
			render(
				<StepActionButtonsV8
					currentStep={0}
					totalSteps={4}
					isNextDisabled={true}
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
				/>
			);

			const nextBtn = screen.getByRole('button', { name: /next step/i });
			expect(nextBtn).toHaveAttribute('aria-disabled', 'true');
		});

		it('should have group role', () => {
			const { container } = render(
				<StepActionButtonsV8
					currentStep={0}
					totalSteps={4}
					isNextDisabled={false}
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
				/>
			);

			expect(container.querySelector('[role="group"]')).toBeInTheDocument();
		});
	});

	describe('Styling', () => {
		it('should accept custom className', () => {
			const { container } = render(
				<StepActionButtonsV8
					currentStep={0}
					totalSteps={4}
					isNextDisabled={false}
					onPrevious={mockOnPrevious}
					onNext={mockOnNext}
					className="custom-class"
				/>
			);

			expect(container.querySelector('.step-action-buttons-v8')).toHaveClass('custom-class');
		});
	});
});
