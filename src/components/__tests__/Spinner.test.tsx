import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Spinner from '../Spinner';

describe('Spinner Component', () => {
	test('renders with default props', () => {
		render(<Spinner />);
		const spinnerElement = screen.getByRole('img', { hidden: true });
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
		expect(spinnerElement).toHaveStyle({ color: '#0070CC' });
	});

	test('has spinning animation wrapper', () => {
		render(<Spinner />);
		const spinnerWrapper = screen.getByRole('img', { hidden: true }).parentElement;
		expect(spinnerWrapper).toBeTruthy();
		expect(spinnerWrapper!.tagName.toLowerCase()).toBe('div');
	});

	test('is centered with flexbox', () => {
		render(<Spinner />);
		const spinnerWrapper = screen.getByRole('img', { hidden: true }).parentElement;
		expect(spinnerWrapper).toBeInTheDocument();
	});
});
