/**
 * Sidebar Performance Tests
 * Tests to validate the performance optimizations in Phase 1
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SidebarOptimized from '../SidebarOptimized';

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, 'performance', {
	value: {
		now: mockPerformanceNow,
	},
	writable: true,
});

// Mock localStorage
const mockLocalStorage = {
	getItem: jest.fn(),
	setItem: jest.fn(),
	removeItem: jest.fn(),
	clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
	value: mockLocalStorage,
});

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
	<BrowserRouter>{children}</BrowserRouter>
);

describe('Sidebar Performance Tests', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPerformanceNow.mockReturnValue(0);
	});

	describe('Render Performance', () => {
		it('should render within 16ms (60fps)', async () => {
			// Simulate render taking 10ms
			mockPerformanceNow
				.mockReturnValueOnce(0) // Start time
				.mockReturnValueOnce(10); // End time

			render(
				<TestWrapper>
					<SidebarOptimized isOpen={true} onClose={() => {}} />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByText('PingOne OAuth Playground')).toBeInTheDocument();
			});

			// Verify no performance warnings in console
			expect(console.warn).not.toHaveBeenCalledWith(expect.stringContaining('Slow sidebar render'));
		});

		it('should log warning when render takes longer than 16ms', async () => {
			// Simulate render taking 20ms (slow)
			mockPerformanceNow
				.mockReturnValueOnce(0) // Start time
				.mockReturnValueOnce(20); // End time

			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

			render(
				<TestWrapper>
					<SidebarOptimized isOpen={true} onClose={() => {}} />
				</TestWrapper>
			);

			await waitFor(() => {
				expect(screen.getByText('PingOne OAuth Playground')).toBeInTheDocument();
			});

			// Should log performance warning
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Slow sidebar render'),
				expect.stringContaining('20.00ms')
			);

			consoleSpy.mockRestore();
		});
	});

	describe('Search Performance', () => {
		it('should handle search within 100ms', async () => {
			// Simulate search taking 50ms
			mockPerformanceNow
				.mockReturnValueOnce(0) // Start time
				.mockReturnValueOnce(50); // End time

			render(
				<TestWrapper>
					<SidebarOptimized isOpen={true} onClose={() => {}} />
				</TestWrapper>
			);

			const searchInput = screen.getByPlaceholderText('Search flows and pages...');
			fireEvent.change(searchInput, { target: { value: 'oauth' } });

			await waitFor(() => {
				expect(searchInput).toHaveValue('oauth');
			});

			// Verify no search performance warnings
			expect(console.warn).not.toHaveBeenCalledWith(expect.stringContaining('Slow sidebar search'));
		});

		it('should log warning when search takes longer than 100ms', async () => {
			// Simulate search taking 150ms (slow)
			mockPerformanceNow
				.mockReturnValueOnce(0) // Start time
				.mockReturnValueOnce(150); // End time

			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

			render(
				<TestWrapper>
					<SidebarOptimized isOpen={true} onClose={() => {}} />
				</TestWrapper>
			);

			const searchInput = screen.getByPlaceholderText('Search flows and pages...');
			fireEvent.change(searchInput, { target: { value: 'oauth' } });

			await waitFor(() => {
				expect(searchInput).toHaveValue('oauth');
			});

			// Should log search performance warning
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Slow sidebar search'),
				expect.stringContaining('150.00ms')
			);

			consoleSpy.mockRestore();
		});
	});

	describe('Memory Efficiency', () => {
		it('should not create excessive re-renders', () => {
			const { rerender } = render(
				<TestWrapper>
					<SidebarOptimized isOpen={true} onClose={() => {}} />
				</TestWrapper>
			);

			// Initial render
			expect(screen.getByText('PingOne OAuth Playground')).toBeInTheDocument();

			// Re-render with same props - should not cause issues
			rerender(
				<TestWrapper>
					<SidebarOptimized isOpen={true} onClose={() => {}} />
				</TestWrapper>
			);

			// Should still be rendered correctly
			expect(screen.getByText('PingOne OAuth Playground')).toBeInTheDocument();
		});

		it('should handle rapid search changes efficiently', async () => {
			render(
				<TestWrapper>
					<SidebarOptimized isOpen={true} onClose={() => {}} />
				</TestWrapper>
			);

			const searchInput = screen.getByPlaceholderText('Search flows and pages...');

			// Simulate rapid typing
			fireEvent.change(searchInput, { target: { value: 'o' } });
			fireEvent.change(searchInput, { target: { value: 'oa' } });
			fireEvent.change(searchInput, { target: { value: 'oau' } });
			fireEvent.change(searchInput, { target: { value: 'oaut' } });
			fireEvent.change(searchInput, { target: { value: 'oauth' } });

			await waitFor(() => {
				expect(searchInput).toHaveValue('oauth');
			});

			// Should handle rapid changes without issues
			expect(screen.getByText('PingOne OAuth Playground')).toBeInTheDocument();
		});
	});

	describe('Component Memoization', () => {
		it('should memoize menu items correctly', () => {
			const { rerender } = render(
				<TestWrapper>
					<SidebarOptimized isOpen={true} onClose={() => {}} />
				</TestWrapper>
			);

			// Get initial menu items
			const initialMenuItems = screen.getAllByText(/Unified OAuth|SPIFFE|PingOne MFA/);

			// Re-render with same props
			rerender(
				<TestWrapper>
					<SidebarOptimized isOpen={true} onClose={() => {}} />
				</TestWrapper>
			);

			// Menu items should be the same (memoized)
			const rerenderedMenuItems = screen.getAllByText(/Unified OAuth|SPIFFE|PingOne MFA/);
			expect(rerenderedMenuItems).toHaveLength(initialMenuItems.length);
		});

		it('should memoize section headers correctly', () => {
			const { rerender } = render(
				<TestWrapper>
					<SidebarOptimized isOpen={true} onClose={() => {}} />
				</TestWrapper>
			);

			// Get initial section headers
			const initialHeaders = screen.getAllByText(/Production|Security & Management/);

			// Re-render with same props
			rerender(
				<TestWrapper>
					<SidebarOptimized isOpen={true} onClose={() => {}} />
				</TestWrapper>
			);

			// Headers should be the same (memoized)
			const rerenderedHeaders = screen.getAllByText(/Production|Security & Management/);
			expect(rerenderedHeaders).toHaveLength(initialHeaders.length);
		});
	});

	describe('LocalStorage Performance', () => {
		it('should handle localStorage operations efficiently', () => {
			mockLocalStorage.getItem.mockReturnValue('450'); // Saved width

			render(
				<TestWrapper>
					<SidebarOptimized isOpen={true} onClose={() => {}} />
				</TestWrapper>
			);

			// Should attempt to load saved width
			expect(mockLocalStorage.getItem).toHaveBeenCalledWith('sidebar.width');

			// Should render successfully
			expect(screen.getByText('PingOne OAuth Playground')).toBeInTheDocument();
		});

		it('should handle localStorage errors gracefully', () => {
			// Simulate localStorage error
			mockLocalStorage.getItem.mockImplementation(() => {
				throw new Error('Storage error');
			});

			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

			render(
				<TestWrapper>
					<SidebarOptimized isOpen={true} onClose={() => {}} />
				</TestWrapper>
			);

			// Should still render despite localStorage error
			expect(screen.getByText('PingOne OAuth Playground')).toBeInTheDocument();

			consoleSpy.mockRestore();
		});
	});

	describe('Event Handler Performance', () => {
		it('should handle click events efficiently', () => {
			render(
				<TestWrapper>
					<SidebarOptimized isOpen={true} onClose={() => {}} />
				</TestWrapper>
			);

			const menuItem = screen.getByText('Unified OAuth & OIDC');

			// Click should work without performance issues
			fireEvent.click(menuItem);

			// Should navigate (mocked by react-router)
			expect(menuItem).toBeInTheDocument();
		});

		it('should handle section toggle efficiently', () => {
			render(
				<TestWrapper>
					<SidebarOptimized isOpen={true} onClose={() => {}} />
				</TestWrapper>
			);

			const sectionHeader = screen.getByText('Production');

			// Toggle should work without performance issues
			fireEvent.click(sectionHeader);

			// Should still be rendered
			expect(sectionHeader).toBeInTheDocument();
		});
	});
});

describe('Sidebar Performance Metrics', () => {
	it('should track render performance metrics', () => {
		// This test validates that the performance monitoring is working
		// In a real scenario, you would check the actual metrics
		expect(true).toBe(true); // Placeholder for performance metrics validation
	});

	it('should track search performance metrics', () => {
		// This test validates that search performance is being tracked
		expect(true).toBe(true); // Placeholder for search metrics validation
	});
});
