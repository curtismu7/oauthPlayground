/**
 * Phase 2 Enhancement Tests
 * Tests for keyboard navigation, mobile optimization, and context menus
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SidebarEnhanced from '../SidebarEnhanced';

// Mock window methods for mobile testing
Object.defineProperty(window, 'innerWidth', {
	writable: true,
	configurable: true,
	value: 1024,
});

Object.defineProperty(navigator, 'vibrate', {
	writable: true,
	configurable: true,
	value: jest.fn(),
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
	writable: true,
	configurable: true,
	value: {
		writeText: jest.fn(),
	},
});

// Mock window.open
Object.defineProperty(window, 'open', {
	writable: true,
	configurable: true,
	value: jest.fn(),
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
	<BrowserRouter>{children}</BrowserRouter>
);

describe('Phase 2: Keyboard Navigation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should navigate menu items with arrow keys', async () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		// Focus on first menu item
		const firstMenuItem = screen.getByText('Unified OAuth & OIDC');
		firstMenuItem.focus();

		// Navigate down with arrow key
		await userEvent.keyboard('{ArrowDown}');

		// Should focus on next item
		expect(screen.getByText('SPIFFE/SPIRE Mock')).toHaveFocus();

		// Navigate up with arrow key
		await userEvent.keyboard('{ArrowUp}');

		// Should focus back on first item
		expect(screen.getByText('Unified OAuth & OIDC')).toHaveFocus();
	});

	it('should activate menu item with Enter key', async () => {
		const mockNavigate = jest.fn();
		jest.mock('react-router-dom', () => ({
			...jest.requireActual('react-router-dom'),
			useNavigate: () => mockNavigate,
		}));

		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const menuItem = screen.getByText('Unified OAuth & OIDC');
		menuItem.focus();

		// Activate with Enter key
		await userEvent.keyboard('{Enter}');

		// Should navigate to the item's path
		expect(mockNavigate).toHaveBeenCalledWith('/v8u/unified');
	});

	it('should activate menu item with Space key', async () => {
		const mockNavigate = jest.fn();
		jest.mock('react-router-dom', () => ({
			...jest.requireActual('react-router-dom'),
			useNavigate: () => mockNavigate,
		}));

		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const menuItem = screen.getByText('Unified OAuth & OIDC');
		menuItem.focus();

		// Activate with Space key
		await userEvent.keyboard('{ }');

		// Should navigate to the item's path
		expect(mockNavigate).toHaveBeenCalledWith('/v8u/unified');
	});

	it('should jump to first item with Home key', async () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		// Focus on a middle item
		const middleItem = screen.getByText('PingOne MFA');
		middleItem.focus();

		// Jump to first item with Home key
		await userEvent.keyboard('{Home}');

		// Should focus on first item
		expect(screen.getByText('Unified OAuth & OIDC')).toHaveFocus();
	});

	it('should jump to last item with End key', async () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		// Focus on first item
		const firstItem = screen.getByText('Unified OAuth & OIDC');
		firstItem.focus();

		// Jump to last item with End key
		await userEvent.keyboard('{End}');

		// Should focus on last item in the section
		expect(screen.getByText('Enhanced State Management (V2)')).toHaveFocus();
	});

	it('should close sidebar with Escape key', async () => {
		const mockOnClose = jest.fn();
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={mockOnClose} />
			</TestWrapper>
		);

		// Press Escape key
		await userEvent.keyboard('{Escape}');

		// Should call onClose
		expect(mockOnClose).toHaveBeenCalled();
	});

	it('should toggle drag mode with Ctrl+B shortcut', async () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		// Press Ctrl+B
		await userEvent.keyboard('{Control>}b{/Control}');

		// Should show drag mode banner
		expect(screen.getByText('🎯 Drag & Drop Mode Active:')).toBeInTheDocument();
	});

	it('should focus search with Ctrl+F shortcut', async () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		// Press Ctrl+F
		await userEvent.keyboard('{Control>}f{/Control}');

		// Should focus search input
		const searchInput = screen.getByPlaceholderText('Search flows and pages...');
		expect(searchInput).toHaveFocus();
	});
});

describe('Phase 2: Mobile Optimization', () => {
	beforeEach(() => {
		// Mock mobile viewport
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 375, // iPhone width
		});
	});

	it('should use mobile layout on small screens', () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		// Should have mobile-specific styling
		const sidebar = document.querySelector('[data-testid="sidebar"]');
		expect(sidebar).toHaveStyle({ width: '100%' });
	});

	it('should handle touch gestures', async () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const menuItem = screen.getByText('Unified OAuth & OIDC');

		// Simulate touch start
		fireEvent.touchStart(menuItem, {
			touches: [{ clientX: 100, clientY: 100 }],
		});

		// Simulate touch end (short tap)
		fireEvent.touchEnd(menuItem, {
			changedTouches: [{ clientX: 100, clientY: 100 }],
		});

		// Should trigger haptic feedback
		expect(navigator.vibrate).toHaveBeenCalledWith(10);
	});

	it('should handle long press for context menu', async () => {
		jest.useFakeTimers();

		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const menuItem = screen.getByText('Unified OAuth & OIDC');

		// Simulate long press
		fireEvent.touchStart(menuItem, {
			touches: [{ clientX: 100, clientY: 100 }],
		});

		// Advance timer by 500ms (long press threshold)
		jest.advanceTimersByTime(500);

		// Should trigger haptic feedback
		expect(navigator.vibrate).toHaveBeenCalledWith(25);

		jest.useRealTimers();
	});

	it('should handle swipe left to close', async () => {
		const mockOnClose = jest.fn();

		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={mockOnClose} />
			</TestWrapper>
		);

		const sidebar = screen.getByRole('complementary');

		// Simulate swipe left gesture
		fireEvent.touchStart(sidebar, {
			touches: [{ clientX: 300, clientY: 100 }],
		});

		fireEvent.touchMove(sidebar, {
			touches: [{ clientX: 100, clientY: 100 }],
		});

		fireEvent.touchEnd(sidebar, {
			changedTouches: [{ clientX: 100, clientY: 100 }],
		});

		// Should close sidebar
		expect(mockOnClose).toHaveBeenCalled();
	});

	it('should have appropriate touch target sizes', () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const menuItem = screen.getByText('Unified OAuth & OIDC');

		// Should have minimum touch target size of 44px
		expect(menuItem).toHaveStyle({ minHeight: '44px' });
	});
});

describe('Phase 2: Context Menus', () => {
	it('should show context menu on right-click', async () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const menuItem = screen.getByText('Unified OAuth & OIDC');

		// Right-click on menu item
		fireEvent.contextMenu(menuItem);

		// Should show context menu
		await waitFor(() => {
			expect(screen.getByText('Add to Favorites')).toBeInTheDocument();
			expect(screen.getByText('Copy Link')).toBeInTheDocument();
			expect(screen.getByText('Open in New Tab')).toBeInTheDocument();
		});
	});

	it('should close context menu on Escape key', async () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const menuItem = screen.getByText('Unified OAuth & OIDC');

		// Show context menu
		fireEvent.contextMenu(menuItem);

		await waitFor(() => {
			expect(screen.getByText('Add to Favorites')).toBeInTheDocument();
		});

		// Press Escape to close
		await userEvent.keyboard('{Escape}');

		// Context menu should be hidden
		expect(screen.queryByText('Add to Favorites')).not.toBeInTheDocument();
	});

	it('should close context menu on click outside', async () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const menuItem = screen.getByText('Unified OAuth & OIDC');

		// Show context menu
		fireEvent.contextMenu(menuItem);

		await waitFor(() => {
			expect(screen.getByText('Add to Favorites')).toBeInTheDocument();
		});

		// Click outside
		fireEvent.mouseDown(document.body);

		// Context menu should be hidden
		expect(screen.queryByText('Add to Favorites')).not.toBeInTheDocument();
	});

	it('should execute context menu actions', async () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const menuItem = screen.getByText('Unified OAuth & OIDC');

		// Show context menu
		fireEvent.contextMenu(menuItem);

		await waitFor(() => {
			expect(screen.getByText('Copy Link')).toBeInTheDocument();
		});

		// Click on "Copy Link"
		const copyLinkButton = screen.getByText('Copy Link');
		fireEvent.click(copyLinkButton);

		// Should copy to clipboard
		expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/v8u/unified');
	});

	it('should show section context menu', async () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const sectionHeader = screen.getByText('Production');

		// Right-click on section header
		fireEvent.contextMenu(sectionHeader);

		// Should show section context menu
		await waitFor(() => {
			expect(screen.getByText('Collapse Section')).toBeInTheDocument();
			expect(screen.getByText('Expand Section')).toBeInTheDocument();
			expect(screen.getByText('Collapse All')).toBeInTheDocument();
			expect(screen.getByText('Expand All')).toBeInTheDocument();
		});
	});
});

describe('Phase 2: Accessibility', () => {
	it('should have proper ARIA labels', () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const menuItem = screen.getByText('Unified OAuth & OIDC');

		// Should have proper ARIA attributes
		expect(menuItem).toHaveAttribute('role', 'menuitem');
		expect(menuItem).toHaveAttribute('aria-label', 'Unified OAuth & OIDC');
		expect(menuItem).toHaveAttribute('tabIndex', '0');
	});

	it('should have proper section ARIA attributes', () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const sectionHeader = screen.getByText('Production');

		// Should have proper ARIA attributes
		expect(sectionHeader).toHaveAttribute('role', 'button');
		expect(sectionHeader).toHaveAttribute('aria-expanded', 'true');
		expect(sectionHeader).toHaveAttribute('aria-label', 'Production section, expanded');
	});

	it('should announce state changes to screen readers', () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const sectionHeader = screen.getByText('Production');

		// Toggle section
		fireEvent.click(sectionHeader);

		// Should update ARIA expanded state
		expect(sectionHeader).toHaveAttribute('aria-expanded', 'false');
		expect(sectionHeader).toHaveAttribute('aria-label', 'Production section, collapsed');
	});

	it('should have visible focus indicators', () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const menuItem = screen.getByText('Unified OAuth & OIDC');

		// Focus the item
		menuItem.focus();

		// Should have visible focus styles
		expect(menuItem).toHaveStyle({
			border: '2px solid #3b82f6',
			boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)',
		});
	});
});

describe('Phase 2: Visual Feedback', () => {
	it('should show hover states', () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const menuItem = screen.getByText('Unified OAuth & OIDC');

		// Hover over item
		fireEvent.mouseEnter(menuItem);

		// Should have hover styles
		expect(menuItem).toHaveStyle({
			background: '#f9fafb',
			transform: 'translateX(2px)',
		});
	});

	it('should show active states', () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const activeItem = screen.getByText('Unified OAuth & OIDC');

		// Should have active styles (based on current route)
		expect(activeItem).toHaveStyle({
			background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
			borderLeft: '3px solid #3b82f6',
			color: '#ffffff',
		});
	});

	it('should show drag mode banner', async () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		// Enable drag mode
		await userEvent.keyboard('{Control>}b{/Control}');

		// Should show drag mode banner
		expect(screen.getByText('🎯 Drag & Drop Mode Active:')).toBeInTheDocument();
		expect(
			screen.getByText('Drag items to reorder • Green zones show drop areas')
		).toBeInTheDocument();
	});
});

describe('Phase 2: Performance', () => {
	it('should render within performance budget', async () => {
		const startTime = performance.now();

		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const endTime = performance.now();
		const renderTime = endTime - startTime;

		// Should render within 16ms (60fps)
		expect(renderTime).toBeLessThan(16);
	});

	it('should handle rapid keyboard navigation', async () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const firstItem = screen.getByText('Unified OAuth & OIDC');
		firstItem.focus();

		// Rapid arrow key navigation
		for (let i = 0; i < 10; i++) {
			await userEvent.keyboard('{ArrowDown}');
			await userEvent.keyboard('{ArrowUp}');
		}

		// Should still be responsive
		expect(firstItem).toHaveFocus();
	});

	it('should handle rapid search input', async () => {
		render(
			<TestWrapper>
				<SidebarEnhanced isOpen={true} onClose={() => {}} />
			</TestWrapper>
		);

		const searchInput = screen.getByPlaceholderText('Search flows and pages...');

		// Rapid typing
		await userEvent.type(searchInput, 'oauth');
		await userEvent.clear(searchInput);
		await userEvent.type(searchInput, 'unified');
		await userEvent.clear(searchInput);
		await userEvent.type(searchInput, 'ping');

		// Should handle rapid input without issues
		expect(searchInput).toHaveValue('ping');
	});
});
