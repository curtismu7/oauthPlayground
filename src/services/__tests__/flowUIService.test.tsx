import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';

import FlowUIService from '../flowUIService';

describe('FlowUIService button components', () => {
	test('Button handles loading state without forwarding invalid DOM attributes', () => {
		const Button = FlowUIService.getButton();
		const { container } = render(
			<Button variant="primary" size="md" loading>
				Loading Button
			</Button>
		);

		const buttonElement = container.querySelector('button');
		expect(buttonElement).toBeTruthy();
		expect(buttonElement?.getAttribute('loading')).toBeNull();
	});

	test('HighlightedActionButton renders with required priority prop', () => {
		const HighlightedActionButton = FlowUIService.getHighlightedActionButton();
		const { getByRole } = render(
			<HighlightedActionButton $priority="primary">
				Call to Action
			</HighlightedActionButton>
		);

		const buttonElement = getByRole('button');
		expect(buttonElement).toBeTruthy();
		expect(buttonElement.textContent).toContain('Call to Action');
	});
});
