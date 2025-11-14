// src/tests/unit/ResponseModeSandbox.test.ts
/**
 * Unit tests for ResponseModeSandbox component
 * Tests response_mode parameter effects, timeline visualization, and token transport
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ResponseModeSandbox from '../../components/ResponseModeSandbox';

const renderWithRouter = (component: React.ReactElement) => {
	return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ResponseModeSandbox', () => {
	beforeEach(() => {
		// Clear any state between tests
	});

	it('should render the sandbox with all response mode options', () => {
		renderWithRouter(<ResponseModeSandbox />);
		
		expect(screen.getByText(/Response Mode Sandbox/i)).toBeInTheDocument();
		expect(screen.getByText(/query/i)).toBeInTheDocument();
		expect(screen.getByText(/fragment/i)).toBeInTheDocument();
		expect(screen.getByText(/form_post/i)).toBeInTheDocument();
	});

	it('should display default response_mode=query', () => {
		renderWithRouter(<ResponseModeSandbox />);
		
		// Verify query mode is selected by default
		const queryButton = screen.getByRole('button', { name: /query/i });
		expect(queryButton).toHaveAttribute('aria-pressed', 'true');
	});

	it('should allow switching between response modes', () => {
		renderWithRouter(<ResponseModeSandbox />);
		
		// Click fragment mode
		const fragmentButton = screen.getByRole('button', { name: /fragment/i });
		fireEvent.click(fragmentButton);
		
		// Verify fragment mode is now active
		expect(fragmentButton).toHaveAttribute('aria-pressed', 'true');
	});

	it('should show transport differences for query mode', () => {
		renderWithRouter(<ResponseModeSandbox />);
		
		// Select query mode
		const queryButton = screen.getByRole('button', { name: /query/i });
		fireEvent.click(queryButton);
		
		// Verify query-specific info is displayed
		expect(screen.getByText(/URL parameters/i)).toBeInTheDocument();
		expect(screen.getByText(/code=/i)).toBeInTheDocument();
	});

	it('should show transport differences for fragment mode', () => {
		renderWithRouter(<ResponseModeSandbox />);
		
		// Select fragment mode
		const fragmentButton = screen.getByRole('button', { name: /fragment/i });
		fireEvent.click(fragmentButton);
		
		// Verify fragment-specific info
		expect(screen.getByText(/#access_token/i)).toBeInTheDocument();
	});

	it('should show transport differences for form_post mode', () => {
		renderWithRouter(<ResponseModeSandbox />);
		
		// Select form_post mode
		const formPostButton = screen.getByRole('button', { name: /form_post/i });
		fireEvent.click(formPostButton);
		
		// Verify form_post-specific info
		expect(screen.getByText(/POST/i)).toBeInTheDocument();
		expect(screen.getByText(/application\/x-www-form-urlencoded/i)).toBeInTheDocument();
	});

	it('should display security implications for each mode', () => {
		renderWithRouter(<ResponseModeSandbox />);
		
		// Select fragment mode (which has security implications)
		const fragmentButton = screen.getByRole('button', { name: /fragment/i });
		fireEvent.click(fragmentButton);
		
		// Verify security warning is shown
		expect(screen.getByText(/Security:/i)).toBeInTheDocument();
	});

	it('should show timeline visualization when simulating flow', async () => {
		renderWithRouter(<ResponseModeSandbox />);
		
		// Click simulate button
		const simulateButton = screen.getByRole('button', { name: /Simulate/i });
		fireEvent.click(simulateButton);
		
		// Wait for timeline to appear
		await waitFor(() => {
			expect(screen.getByText(/Authorization Request/i)).toBeInTheDocument();
		});
	});

	it('should animate flow steps in correct order', async () => {
		renderWithRouter(<ResponseModeSandbox />);
		
		// Start simulation
		const simulateButton = screen.getByRole('button', { name: /Simulate/i });
		fireEvent.click(simulateButton);
		
		// Verify steps appear sequentially
		await waitFor(() => {
			expect(screen.getByText(/User authenticates/i)).toBeInTheDocument();
		});
		
		await waitFor(() => {
			expect(screen.getByText(/Callback/i)).toBeInTheDocument();
		}, { timeout: 5000 });
	});

	it('should highlight active step during simulation', async () => {
		renderWithRouter(<ResponseModeSandbox />);
		
		// Start simulation
		const simulateButton = screen.getByRole('button', { name: /Simulate/i });
		fireEvent.click(simulateButton);
		
		// Verify active step styling (look for highlight class or aria-current)
		await waitFor(() => {
			const activeStep = screen.queryByRole('listitem', { current: true });
			expect(activeStep).toBeInTheDocument();
		});
	});

	it('should show URL examples for query mode', () => {
		renderWithRouter(<ResponseModeSandbox />);
		
		// Select query mode
		const queryButton = screen.getByRole('button', { name: /query/i });
		fireEvent.click(queryButton);
		
		// Verify URL example with query parameters
		expect(screen.getByText(/\?code=/i)).toBeInTheDocument();
		expect(screen.getByText(/&state=/i)).toBeInTheDocument();
	});

	it('should show URL examples for fragment mode', () => {
		renderWithRouter(<ResponseModeSandbox />);
		
		// Select fragment mode
		const fragmentButton = screen.getByRole('button', { name: /fragment/i });
		fireEvent.click(fragmentButton);
		
		// Verify URL example with fragment
		expect(screen.getByText(/#access_token=/i)).toBeInTheDocument();
	});

	it('should display comparison table', () => {
		renderWithRouter(<ResponseModeSandbox />);
		
		// Verify comparison section exists
		expect(screen.getByText(/Comparison/i)).toBeInTheDocument();
		expect(screen.getByRole('table')).toBeInTheDocument();
	});

	it('should show best practice recommendations', () => {
		renderWithRouter(<ResponseModeSandbox />);
		
		// Verify recommendations section
		expect(screen.getByText(/Best Practice/i)).toBeInTheDocument();
	});

	it('should handle pi.flow redirectless mode if included', () => {
		renderWithRouter(<ResponseModeSandbox />);
		
		// Check if pi.flow mode is available
		const piFlowButton = screen.queryByText(/pi\.flow/i);
		if (piFlowButton) {
			fireEvent.click(piFlowButton);
			expect(screen.getByText(/PingOne redirectless/i)).toBeInTheDocument();
		}
	});

	it('should reset simulation on mode change', async () => {
		renderWithRouter(<ResponseModeSandbox />);
		
		// Start simulation
		const simulateButton = screen.getByRole('button', { name: /Simulate/i });
		fireEvent.click(simulateButton);
		
		await waitFor(() => {
			expect(screen.getByText(/Authorization Request/i)).toBeInTheDocument();
		});
		
		// Change mode
		const fragmentButton = screen.getByRole('button', { name: /fragment/i });
		fireEvent.click(fragmentButton);
		
		// Verify simulation resets
		expect(screen.queryByText(/Authorization Request/i)).not.toBeInTheDocument();
	});
});

