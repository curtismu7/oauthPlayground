/**
 * @file lazyLoading.test.ts
 * @module components/__tests__
 * @description Lazy loading component tests
 * @version 9.15.3
 * @since 2026-03-06
 */

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoadingFallback from '../LoadingFallback';

describe('Lazy Loading Components', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('LoadingFallback', () => {
		it('should render default loading state', () => {
			render(<LoadingFallback />);

			expect(screen.getByText('Loading...')).toBeInTheDocument();
			expect(screen.getByText('Please wait while we prepare this component')).toBeInTheDocument();
		});

		it('should render custom message', () => {
			render(<LoadingFallback message="Custom loading message" />);

			expect(screen.getByText('Custom loading message')).toBeInTheDocument();
		});

		it('should render custom subtext', () => {
			render(<LoadingFallback subtext="Custom subtext" />);

			expect(screen.getByText('Custom subtext')).toBeInTheDocument();
		});

		it('should render different sizes', () => {
			const { rerender } = render(<LoadingFallback size="small" />);

			// Should render loading text for all sizes
			expect(screen.getByText('Loading...')).toBeInTheDocument();

			// Medium size (default)
			rerender(<LoadingFallback size="medium" />);
			expect(screen.getByText('Loading...')).toBeInTheDocument();

			// Large size
			rerender(<LoadingFallback size="large" />);
			expect(screen.getByText('Loading...')).toBeInTheDocument();
		});
	});

	describe('Performance Integration', () => {
		it('should track loading performance', async () => {
			const startTime = performance.now();

			render(<LoadingFallback message="Performance test" />);

			const endTime = performance.now();
			const loadTime = endTime - startTime;

			// Component should render quickly (under 100ms)
			expect(loadTime).toBeLessThan(100);

			// Should render the message
			expect(screen.getByText('Performance test')).toBeInTheDocument();
		});
	});

	describe('User Experience', () => {
		it('should provide clear feedback', () => {
			render(
				<LoadingFallback
					message="Loading AI Agent Overview..."
					subtext="This may take a few seconds"
				/>
			);

			expect(screen.getByText('Loading AI Agent Overview...')).toBeInTheDocument();
			expect(screen.getByText('This may take a few seconds')).toBeInTheDocument();
		});

		it('should handle different contexts', () => {
			const contexts = [
				{ message: 'Loading MFA Flow...', subtext: 'Setting up multi-factor authentication' },
				{ message: 'Loading Flow Comparison...', subtext: 'Analyzing flow differences' },
				{ message: 'Loading API Documentation...', subtext: 'Preparing reference materials' },
			];

			contexts.forEach(({ message, subtext }) => {
				const { unmount } = render(<LoadingFallback message={message} subtext={subtext} />);

				expect(screen.getByText(message)).toBeInTheDocument();
				expect(screen.getByText(subtext)).toBeInTheDocument();

				unmount();
			});
		});
	});
});
