import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UseCasesPage from '../UseCasesPage';
import { useCaseThemes } from '../../content/useCases';

function renderPage() {
	return render(
		<MemoryRouter>
			<UseCasesPage />
		</MemoryRouter>,
	);
}

describe('UseCasesPage', () => {
	it('renders every theme title', () => {
		renderPage();
		for (const theme of useCaseThemes) {
			expect(screen.getByText(theme.title)).toBeInTheDocument();
		}
	});

	it('renders a chip for a known use case', () => {
		renderPage();
		expect(
			screen.getByRole('button', { name: /Sign users into a single-page app/i }),
		).toBeInTheDocument();
	});

	it('expands a chip to reveal its scenario and run action', () => {
		renderPage();
		fireEvent.click(
			screen.getByRole('button', { name: /Sign users into a single-page app/i }),
		);
		expect(screen.getByText(/no server to keep a secret/i)).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /Run this flow/i }),
		).toBeInTheDocument();
	});
});
