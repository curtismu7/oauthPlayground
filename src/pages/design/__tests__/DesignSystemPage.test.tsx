import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DesignSystemPage from '../DesignSystemPage';

describe('DesignSystemPage', () => {
	it('renders the style-guide title and a token swatch label', () => {
		render(
			<MemoryRouter>
				<DesignSystemPage />
			</MemoryRouter>,
		);
		expect(screen.getByRole('heading', { level: 1, name: /Design System/i })).toBeInTheDocument();
		expect(screen.getByText('accent')).toBeInTheDocument();
	});

	it('renders primitive examples (a Pill and an Action)', () => {
		render(
			<MemoryRouter>
				<DesignSystemPage />
			</MemoryRouter>,
		);
		expect(screen.getByRole('button', { name: /Active pill/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Action button/i })).toBeInTheDocument();
	});
});
