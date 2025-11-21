/**
 * @file StepValidationFeedbackV8.test.tsx
 * @module v8/components/__tests__
 * @description Tests for StepValidationFeedbackV8 component
 * @version 8.0.0
 * @since 2024-11-16
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepValidationFeedbackV8 from '../StepValidationFeedbackV8';

describe('StepValidationFeedbackV8', () => {
	describe('Rendering', () => {
		it('should not render when no errors or warnings', () => {
			const { container } = render(<StepValidationFeedbackV8 errors={[]} warnings={[]} />);

			expect(container.querySelector('.step-validation-feedback-v8')).not.toBeInTheDocument();
		});

		it('should render errors section when errors present', () => {
			render(<StepValidationFeedbackV8 errors={['Environment ID is required']} warnings={[]} />);

			expect(screen.getByText(/1 Error/)).toBeInTheDocument();
			expect(screen.getByText('Environment ID is required')).toBeInTheDocument();
		});

		it('should render warnings section when warnings present', () => {
			render(<StepValidationFeedbackV8 errors={[]} warnings={['Using HTTP is insecure']} />);

			expect(screen.getByText(/1 Warning/)).toBeInTheDocument();
			expect(screen.getByText('Using HTTP is insecure')).toBeInTheDocument();
		});

		it('should render both sections when both present', () => {
			render(
				<StepValidationFeedbackV8
					errors={['Environment ID is required']}
					warnings={['Using HTTP is insecure']}
				/>
			);

			expect(screen.getByText(/1 Error/)).toBeInTheDocument();
			expect(screen.getByText(/1 Warning/)).toBeInTheDocument();
		});
	});

	describe('Error Display', () => {
		it('should display single error correctly', () => {
			render(<StepValidationFeedbackV8 errors={['Environment ID is required']} warnings={[]} />);

			expect(screen.getByText(/1 Error/)).toBeInTheDocument();
			expect(screen.getByText('Environment ID is required')).toBeInTheDocument();
		});

		it('should display multiple errors correctly', () => {
			render(
				<StepValidationFeedbackV8
					errors={[
						'Environment ID is required',
						'Client ID is required',
						'Redirect URI is required',
					]}
					warnings={[]}
				/>
			);

			expect(screen.getByText(/3 Errors/)).toBeInTheDocument();
			expect(screen.getByText('Environment ID is required')).toBeInTheDocument();
			expect(screen.getByText('Client ID is required')).toBeInTheDocument();
			expect(screen.getByText('Redirect URI is required')).toBeInTheDocument();
		});

		it('should use plural form for multiple errors', () => {
			render(<StepValidationFeedbackV8 errors={['Error 1', 'Error 2']} warnings={[]} />);

			expect(screen.getByText(/2 Errors/)).toBeInTheDocument();
		});
	});

	describe('Warning Display', () => {
		it('should display single warning correctly', () => {
			render(<StepValidationFeedbackV8 errors={[]} warnings={['Using HTTP is insecure']} />);

			expect(screen.getByText(/1 Warning/)).toBeInTheDocument();
			expect(screen.getByText('Using HTTP is insecure')).toBeInTheDocument();
		});

		it('should display multiple warnings correctly', () => {
			render(
				<StepValidationFeedbackV8
					errors={[]}
					warnings={[
						'Using HTTP is insecure',
						'Wildcard domains not recommended',
						'IP addresses not recommended',
					]}
				/>
			);

			expect(screen.getByText(/3 Warnings/)).toBeInTheDocument();
			expect(screen.getByText('Using HTTP is insecure')).toBeInTheDocument();
			expect(screen.getByText('Wildcard domains not recommended')).toBeInTheDocument();
			expect(screen.getByText('IP addresses not recommended')).toBeInTheDocument();
		});

		it('should use plural form for multiple warnings', () => {
			render(<StepValidationFeedbackV8 errors={[]} warnings={['Warning 1', 'Warning 2']} />);

			expect(screen.getByText(/2 Warnings/)).toBeInTheDocument();
		});
	});

	describe('Collapsible Sections', () => {
		it('should expand errors section by default', () => {
			render(<StepValidationFeedbackV8 errors={['Environment ID is required']} warnings={[]} />);

			expect(screen.getByText('Environment ID is required')).toBeVisible();
		});

		it('should collapse errors section when clicked', async () => {
			const user = userEvent.setup();

			render(<StepValidationFeedbackV8 errors={['Environment ID is required']} warnings={[]} />);

			const header = screen.getByRole('button', { name: /1 Error/i });
			await user.click(header);

			expect(screen.queryByText('Environment ID is required')).not.toBeVisible();
		});

		it('should expand errors section when clicked again', async () => {
			const user = userEvent.setup();

			render(<StepValidationFeedbackV8 errors={['Environment ID is required']} warnings={[]} />);

			const header = screen.getByRole('button', { name: /1 Error/i });
			await user.click(header);
			await user.click(header);

			expect(screen.getByText('Environment ID is required')).toBeVisible();
		});

		it('should expand warnings section by default', () => {
			render(<StepValidationFeedbackV8 errors={[]} warnings={['Using HTTP is insecure']} />);

			expect(screen.getByText('Using HTTP is insecure')).toBeVisible();
		});

		it('should collapse warnings section when clicked', async () => {
			const user = userEvent.setup();

			render(<StepValidationFeedbackV8 errors={[]} warnings={['Using HTTP is insecure']} />);

			const header = screen.getByRole('button', { name: /1 Warning/i });
			await user.click(header);

			expect(screen.queryByText('Using HTTP is insecure')).not.toBeVisible();
		});
	});

	describe('Visibility Control', () => {
		it('should hide errors when showErrors is false', () => {
			const { container } = render(
				<StepValidationFeedbackV8
					errors={['Environment ID is required']}
					warnings={[]}
					showErrors={false}
				/>
			);

			expect(container.querySelector('.errors-section')).not.toBeInTheDocument();
		});

		it('should hide warnings when showWarnings is false', () => {
			const { container } = render(
				<StepValidationFeedbackV8
					errors={[]}
					warnings={['Using HTTP is insecure']}
					showWarnings={false}
				/>
			);

			expect(container.querySelector('.warnings-section')).not.toBeInTheDocument();
		});

		it('should show both when both flags are true', () => {
			const { container } = render(
				<StepValidationFeedbackV8
					errors={['Error']}
					warnings={['Warning']}
					showErrors={true}
					showWarnings={true}
				/>
			);

			expect(container.querySelector('.errors-section')).toBeInTheDocument();
			expect(container.querySelector('.warnings-section')).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA attributes on headers', () => {
			render(<StepValidationFeedbackV8 errors={['Environment ID is required']} warnings={[]} />);

			const header = screen.getByRole('button', { name: /1 Error/i });
			expect(header).toHaveAttribute('aria-expanded');
			expect(header).toHaveAttribute('aria-controls');
		});

		it('should have list role on error list', () => {
			const { container } = render(
				<StepValidationFeedbackV8 errors={['Error 1', 'Error 2']} warnings={[]} />
			);

			const list = container.querySelector('.error-list');
			expect(list).toHaveAttribute('role', 'list');
		});

		it('should have listitem role on error items', () => {
			const { container } = render(
				<StepValidationFeedbackV8 errors={['Error 1', 'Error 2']} warnings={[]} />
			);

			const items = container.querySelectorAll('.error-list li');
			items.forEach((item) => {
				expect(item).toHaveAttribute('role', 'listitem');
			});
		});

		it('should have tooltip role on content', () => {
			const { container } = render(
				<StepValidationFeedbackV8 errors={['Environment ID is required']} warnings={[]} />
			);

			const content = container.querySelector('#errors-content');
			expect(content).toBeInTheDocument();
		});
	});

	describe('Styling', () => {
		it('should accept custom className', () => {
			const { container } = render(
				<StepValidationFeedbackV8 errors={['Error']} warnings={[]} className="custom-class" />
			);

			expect(container.querySelector('.step-validation-feedback-v8')).toHaveClass('custom-class');
		});

		it('should have different styling for errors and warnings', () => {
			const { container } = render(
				<StepValidationFeedbackV8 errors={['Error']} warnings={['Warning']} />
			);

			const errorSection = container.querySelector('.errors-section');
			const warningSection = container.querySelector('.warnings-section');

			expect(errorSection).toHaveClass('errors-section');
			expect(warningSection).toHaveClass('warnings-section');
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty error array', () => {
			const { container } = render(<StepValidationFeedbackV8 errors={[]} warnings={['Warning']} />);

			expect(container.querySelector('.errors-section')).not.toBeInTheDocument();
		});

		it('should handle very long error messages', () => {
			const longError = 'A'.repeat(500);

			render(<StepValidationFeedbackV8 errors={[longError]} warnings={[]} />);

			expect(screen.getByText(longError)).toBeInTheDocument();
		});

		it('should handle special characters in messages', () => {
			render(
				<StepValidationFeedbackV8 errors={['Error with <special> & "characters"']} warnings={[]} />
			);

			expect(screen.getByText(/Error with/)).toBeInTheDocument();
		});
	});
});
