// src/pages/flows/__tests__/MockMcpAgentFlowPage.test.tsx
// Component tests for Mock MCP Agent Flow page: steps 1–3 and reset.

import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import MockMcpAgentFlowPage from '../MockMcpAgentFlowPage';

function renderPage() {
	return render(
		<BrowserRouter>
			<MockMcpAgentFlowPage />
		</BrowserRouter>
	);
}

describe('MockMcpAgentFlowPage', () => {
	beforeEach(() => {
		window.scrollTo = vi.fn();
	});

	it('renders flow title, steps, and Secure AI Agent Authentication section', () => {
		renderPage();
		expect(screen.getByText('Secure AI Agent Authentication')).toBeInTheDocument();
		expect(screen.getByText(/Step 1 — Get initial token/)).toBeInTheDocument();
		expect(screen.getByText(/Step 2 — Token exchange/)).toBeInTheDocument();
		expect(screen.getByText(/Step 3 — List users/)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Send mock_get_token/ })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Send mock_token_exchange/ })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Send mock_list_users/ })).toBeInTheDocument();
		expect(screen.getByTitle('Reset flow')).toBeInTheDocument();
	});

	it('Step 1: Get token shows success result with access_token', () => {
		renderPage();
		fireEvent.click(screen.getByRole('button', { name: /Send mock_get_token/ }));
		expect(screen.getByText(/✓ MCP tool: mock_get_token/)).toBeInTheDocument();
		expect(screen.getByText(/access_token/)).toBeInTheDocument();
		expect(screen.getByText(/mock_wt_/)).toBeInTheDocument();
	});

	it('Step 2 and Step 3 disabled until Step 1 is run', () => {
		renderPage();
		const step2 = screen.getByRole('button', { name: /Send mock_token_exchange/ });
		const step3 = screen.getByRole('button', { name: /Send mock_list_users/ });
		expect(step2).toBeDisabled();
		expect(step3).toBeDisabled();
		fireEvent.click(screen.getByRole('button', { name: /Send mock_get_token/ }));
		expect(step2).not.toBeDisabled();
		expect(step3).not.toBeDisabled();
	});

	it('full flow: Step 1 → Step 2 → Step 3 shows token exchange then list users result', () => {
		renderPage();
		fireEvent.click(screen.getByRole('button', { name: /Send mock_get_token/ }));
		expect(screen.getByText(/✓ MCP tool: mock_get_token/)).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: /Send mock_token_exchange/ }));
		expect(screen.getByText(/✓ MCP tool: mock_token_exchange/)).toBeInTheDocument();
		expect(screen.getByText(/mock_te_/)).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: /Send mock_list_users/ }));
		expect(screen.getByText(/✓ MCP tool: mock_list_users/)).toBeInTheDocument();
		expect(screen.getByText(/Alice/)).toBeInTheDocument();
		expect(screen.getByText(/Bob/)).toBeInTheDocument();
	});

	it('Reset flow clears result and hides tool result section', () => {
		renderPage();
		fireEvent.click(screen.getByRole('button', { name: /Send mock_get_token/ }));
		expect(screen.getByText(/✓ MCP tool: mock_get_token/)).toBeInTheDocument();

		fireEvent.click(screen.getByTitle('Reset flow'));
		expect(screen.queryByText(/✓ MCP tool: mock_get_token/)).not.toBeInTheDocument();
	});

	it('links to MCP Documentation', () => {
		renderPage();
		const link = screen.getByRole('link', { name: /MCP Documentation/ });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', '/documentation/mcp');
	});
});
