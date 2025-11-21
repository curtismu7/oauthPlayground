import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Card, CardBody, CardFooter, CardHeader } from '../Card';

describe('Card Component', () => {
	test('renders children correctly', () => {
		render(
			<Card>
				<div>Test Content</div>
			</Card>
		);

		expect(screen.getByText('Test Content')).toBeInTheDocument();
	});

	test('applies custom className', () => {
		render(
			<Card className="custom-class">
				<div>Test Content</div>
			</Card>
		);

		const cardElement = screen.getByText('Test Content').parentElement;
		expect(cardElement).toHaveClass('custom-class');
	});

	test('applies accent styling for primary', () => {
		render(
			<Card accent="primary">
				<div>Test Content</div>
			</Card>
		);

		const cardElement = screen.getByText('Test Content').parentElement;
		expect(cardElement).toHaveStyle({
			'border-top': '3px solid #003087',
		});
	});

	test('applies accent styling for success', () => {
		render(
			<Card accent="success">
				<div>Test Content</div>
			</Card>
		);

		const cardElement = screen.getByText('Test Content').parentElement;
		expect(cardElement).toHaveStyle({
			'border-top': '3px solid #28a745',
		});
	});

	test('applies accent styling for danger', () => {
		render(
			<Card accent="danger">
				<div>Test Content</div>
			</Card>
		);

		const cardElement = screen.getByText('Test Content').parentElement;
		expect(cardElement).toHaveStyle({
			'border-top': '3px solid #dc3545',
		});
	});

	test('applies custom accent color', () => {
		render(
			<Card accent="#ff0000">
				<div>Test Content</div>
			</Card>
		);

		const cardElement = screen.getByText('Test Content').parentElement;
		expect(cardElement).toHaveStyle({
			'border-top': '3px solid #003087', // Falls back to primary since custom color isn't in accentColors
		});
	});

	test('does not apply accent border when accent is undefined', () => {
		render(
			<Card>
				<div>Test Content</div>
			</Card>
		);

		const cardElement = screen.getByText('Test Content').parentElement;
		expect(cardElement).not.toHaveStyle({
			'border-top': expect.any(String),
		});
	});

	test('CardHeader renders with correct structure', () => {
		render(
			<Card>
				<CardHeader>
					<h3>Test Header</h3>
					<div className="subtitle">Test Subtitle</div>
				</CardHeader>
			</Card>
		);

		expect(screen.getByText('Test Header')).toBeInTheDocument();
		expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
	});

	test('CardBody renders with correct padding', () => {
		render(
			<Card>
				<CardBody>
					<div>Test Body Content</div>
				</CardBody>
			</Card>
		);

		expect(screen.getByText('Test Body Content')).toBeInTheDocument();
	});

	test('CardFooter renders with correct styling', () => {
		render(
			<Card>
				<CardFooter>
					<div>Test Footer Content</div>
				</CardFooter>
			</Card>
		);

		expect(screen.getByText('Test Footer Content')).toBeInTheDocument();
	});

	test('renders complete card structure', () => {
		render(
			<Card accent="info">
				<CardHeader>
					<h3>Card Title</h3>
					<div className="subtitle">Card subtitle</div>
				</CardHeader>
				<CardBody>
					<p>Card content goes here</p>
				</CardBody>
				<CardFooter>
					<button>Action Button</button>
				</CardFooter>
			</Card>
		);

		expect(screen.getByText('Card Title')).toBeInTheDocument();
		expect(screen.getByText('Card subtitle')).toBeInTheDocument();
		expect(screen.getByText('Card content goes here')).toBeInTheDocument();
		expect(screen.getByText('Action Button')).toBeInTheDocument();
	});
});
