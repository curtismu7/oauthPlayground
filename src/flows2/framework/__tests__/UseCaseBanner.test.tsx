import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UseCaseBanner } from '../UseCaseBanner';

function renderAt(path: string) {
	return render(
		<MemoryRouter initialEntries={[path]}>
			<UseCaseBanner />
		</MemoryRouter>,
	);
}

describe('UseCaseBanner', () => {
	it('renders nothing with no usecase param', () => {
		const { container } = renderAt('/v2/flows/authorization-code');
		expect(container).toBeEmptyDOMElement();
	});

	it('renders nothing for an unknown usecase id', () => {
		const { container } = renderAt('/v2/flows/authorization-code?usecase=nope');
		expect(container).toBeEmptyDOMElement();
	});

	it('renders the use-case title and a lesson when the id is valid', () => {
		renderAt('/v2/flows/authorization-code?usecase=spa-login');
		expect(
			screen.getByText(/Sign users into a single-page app/i),
		).toBeInTheDocument();
		expect(screen.getByText(/PKCE/i)).toBeInTheDocument();
	});
});
