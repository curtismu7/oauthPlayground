import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Spinner from '../Spinner';

describe('Spinner Component', () => {
	test('renders with default props', () => {
		render(<Spinner />);

		const spinnerElement = screen.getByRole('img', { hidden: true }); // FiLoader renders as an img/svg
		expect(spinnerElement).toBeInTheDocument();
	});

	test('applies custom size', () => {
		render(<Spinner size={32} />);

		const spinnerElement = screen.getByRole('img', { hidden: true });
		expect(spinnerElement).toHaveStyle({ fontSize: '32px' });
	});

	test('applies default size when not specified', () => {
		render(<Spinner />);

		const spinnerElement = screen.getByRole('img', { hidden: true });
		expect(spinnerElement).toHaveStyle({ fontSize: '16px' });
	});

	test('applies custom color', () => {
		render(<Spinner color="#ff0000" />);

		const spinnerElement = screen.getByRole('img', { hidden: true });
		expect(spinnerElement).toHaveStyle({ color: '#ff0000' });
	});

	test('uses default color when not specified', () => {
		render(<Spinner />);

		const spinnerElement = screen.getByRole('img', { hidden: true });
		expect(spinnerElement).toHaveStyle({ color: '#0070CC' }); // Default theme color
	});

	test('has spinning animation', () => {
		render(<Spinner />);

		const spinnerWrapper = screen.getByRole('img', { hidden: true }).parentElement;
		expect(spinnerWrapper).toHaveStyle({
			animation: expect.stringContaining('spin'),
		});
	});

	test('is centered with flexbox', () => {
		render(<Spinner />);

		const spinnerWrapper = screen.getByRole('img', { hidden: true }).parentElement;
		expect(spinnerWrapper).toHaveStyle({
			display: 'inline-flex',
			alignItems: 'center',
			justifyContent: 'center',
		});
	});
});
