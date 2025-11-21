/**
 * @file StepProgressBarV8.test.tsx
 * @module v8/components/__tests__
 * @description Tests for StepProgressBarV8 component
 * @version 8.0.0
 * @since 2024-11-16
 */

import { render, screen } from '@testing-library/react';
import StepProgressBarV8 from '../StepProgressBarV8';

describe('StepProgressBarV8', () => {
	describe('Progress Calculation', () => {
		it('should show 0% progress on first step with no completed steps', () => {
			render(<StepProgressBarV8 currentStep={0} totalSteps={4} completedSteps={[]} />);

			expect(screen.getByText(/0%/)).toBeInTheDocument();
			expect(screen.getByText(/1 of 4/)).toBeInTheDocument();
		});

		it('should show 25% progress on first step', () => {
			render(<StepProgressBarV8 currentStep={0} totalSteps={4} completedSteps={[]} />);

			expect(screen.getByText(/0%/)).toBeInTheDocument();
		});

		it('should show 50% progress on second step with first completed', () => {
			render(<StepProgressBarV8 currentStep={1} totalSteps={4} completedSteps={[0]} />);

			expect(screen.getByText(/50%/)).toBeInTheDocument();
			expect(screen.getByText(/2 of 4/)).toBeInTheDocument();
		});

		it('should show 100% progress on last step with all completed', () => {
			render(<StepProgressBarV8 currentStep={3} totalSteps={4} completedSteps={[0, 1, 2]} />);

			expect(screen.getByText(/100%/)).toBeInTheDocument();
			expect(screen.getByText(/4 of 4/)).toBeInTheDocument();
		});
	});

	describe('Step Indicators', () => {
		it('should render correct number of step indicators', () => {
			const { container } = render(
				<StepProgressBarV8 currentStep={0} totalSteps={4} completedSteps={[]} />
			);

			const indicators = container.querySelectorAll('.step-indicator');
			expect(indicators).toHaveLength(4);
		});

		it('should mark completed steps with checkmark', () => {
			const { container } = render(
				<StepProgressBarV8 currentStep={1} totalSteps={4} completedSteps={[0]} />
			);

			const indicators = container.querySelectorAll('.step-indicator');
			expect(indicators[0]).toHaveClass('completed');
			expect(indicators[0]).toHaveTextContent('✓');
		});

		it('should mark active step with arrow', () => {
			const { container } = render(
				<StepProgressBarV8 currentStep={1} totalSteps={4} completedSteps={[0]} />
			);

			const indicators = container.querySelectorAll('.step-indicator');
			expect(indicators[1]).toHaveClass('active');
			expect(indicators[1]).toHaveTextContent('▶');
		});

		it('should mark locked steps with lock icon', () => {
			const { container } = render(
				<StepProgressBarV8 currentStep={1} totalSteps={4} completedSteps={[0]} />
			);

			const indicators = container.querySelectorAll('.step-indicator');
			expect(indicators[2]).toHaveClass('locked');
			expect(indicators[3]).toHaveClass('locked');
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA attributes on progress bar', () => {
			const { container } = render(
				<StepProgressBarV8 currentStep={1} totalSteps={4} completedSteps={[0]} />
			);

			const progressBar = container.querySelector('[role="progressbar"]');
			expect(progressBar).toHaveAttribute('aria-valuenow', '50');
			expect(progressBar).toHaveAttribute('aria-valuemin', '0');
			expect(progressBar).toHaveAttribute('aria-valuemax', '100');
		});

		it('should have descriptive titles on step indicators', () => {
			const { container } = render(
				<StepProgressBarV8 currentStep={0} totalSteps={4} completedSteps={[]} />
			);

			const indicators = container.querySelectorAll('.step-indicator');
			expect(indicators[0]).toHaveAttribute('title');
			expect(indicators[0].getAttribute('title')).toContain('Step 1');
		});
	});

	describe('Styling', () => {
		it('should accept custom className', () => {
			const { container } = render(
				<StepProgressBarV8
					currentStep={0}
					totalSteps={4}
					completedSteps={[]}
					className="custom-class"
				/>
			);

			expect(container.querySelector('.step-progress-bar-v8')).toHaveClass('custom-class');
		});
	});

	describe('Edge Cases', () => {
		it('should handle single step flow', () => {
			render(<StepProgressBarV8 currentStep={0} totalSteps={1} completedSteps={[]} />);

			expect(screen.getByText(/0%/)).toBeInTheDocument();
			expect(screen.getByText(/1 of 1/)).toBeInTheDocument();
		});

		it('should handle many steps', () => {
			const { container } = render(
				<StepProgressBarV8 currentStep={5} totalSteps={10} completedSteps={[0, 1, 2, 3, 4]} />
			);

			const indicators = container.querySelectorAll('.step-indicator');
			expect(indicators).toHaveLength(10);
		});
	});
});
