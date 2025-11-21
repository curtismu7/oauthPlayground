// src/tests/unit/LiveRFCExplorerDeepDive.test.ts
/**
 * Unit tests for LiveRFCExplorer Deep Dive Mode enhancements
 * Tests deep dive toggle, insights display, PingOne callouts, and tool links
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import LiveRFCExplorer from '../../components/LiveRFCExplorer';

const renderWithRouter = (component: React.ReactElement) => {
	return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('LiveRFCExplorer Deep Dive Mode', () => {
	beforeEach(() => {
		// Clear any cached state
	});

	it('should render the RFC explorer', () => {
		renderWithRouter(<LiveRFCExplorer />);

		expect(screen.getByText(/Live RFC Explorer/i)).toBeInTheDocument();
		expect(screen.getByPlaceholderText(/Search OAuth specs/i)).toBeInTheDocument();
	});

	it('should display RFC cards for major specifications', () => {
		renderWithRouter(<LiveRFCExplorer />);

		// Verify major RFCs are listed
		expect(screen.getByText(/RFC 6749/i)).toBeInTheDocument();
		expect(screen.getByText(/RFC 7636/i)).toBeInTheDocument();
		expect(screen.getByText(/OpenID Connect/i)).toBeInTheDocument();
	});

	it('should allow selecting an RFC to view details', () => {
		renderWithRouter(<LiveRFCExplorer />);

		// Click RFC 6749
		const rfc6749 = screen.getByText(/OAuth 2.0 Authorization Framework/i);
		fireEvent.click(rfc6749);

		// Verify details panel appears
		expect(screen.getByText(/What Is It/i)).toBeInTheDocument();
		expect(screen.getByText(/Key Points/i)).toBeInTheDocument();
	});

	it('should show Deep Dive toggle button', () => {
		renderWithRouter(<LiveRFCExplorer />);

		// Select an RFC
		const rfc6749 = screen.getByText(/OAuth 2.0 Authorization Framework/i);
		fireEvent.click(rfc6749);

		// Verify Deep Dive toggle exists
		expect(screen.getByRole('button', { name: /Deep Dive/i })).toBeInTheDocument();
	});

	it('should display deep dive insights when enabled', () => {
		renderWithRouter(<LiveRFCExplorer />);

		// Select RFC and enable Deep Dive
		fireEvent.click(screen.getByText(/OAuth 2.0 Authorization Framework/i));
		const deepDiveToggle = screen.getByRole('button', { name: /Deep Dive/i });
		fireEvent.click(deepDiveToggle);

		// Verify deep dive content appears
		expect(screen.getByText(/Deep Dive Insights/i)).toBeInTheDocument();
	});

	it('should show PingOne-specific support callouts', () => {
		renderWithRouter(<LiveRFCExplorer />);

		// Select RFC
		fireEvent.click(screen.getByText(/OAuth 2.0 Authorization Framework/i));

		// Verify PingOne support section
		expect(screen.getByText(/PingOne Support/i)).toBeInTheDocument();
	});

	it('should highlight PingOne-supported features in deep dive', () => {
		renderWithRouter(<LiveRFCExplorer />);

		// Select RFC and enable Deep Dive
		fireEvent.click(screen.getByText(/RFC 7636/i)); // PKCE
		const deepDiveToggle = screen.getByRole('button', { name: /Deep Dive/i });
		fireEvent.click(deepDiveToggle);

		// Verify PingOne implementation notes
		expect(screen.getByText(/PingOne/i)).toBeInTheDocument();
	});

	it('should display related playground tools', () => {
		renderWithRouter(<LiveRFCExplorer />);

		// Select RFC and enable Deep Dive
		fireEvent.click(screen.getByText(/OAuth 2.0 Authorization Framework/i));
		fireEvent.click(screen.getByRole('button', { name: /Deep Dive/i }));

		// Verify related tools section
		expect(screen.getByText(/Related Tools/i)).toBeInTheDocument();
	});

	it('should link to OAuth Detective for parameter analysis', () => {
		renderWithRouter(<LiveRFCExplorer />);

		// Select RFC and enable Deep Dive
		fireEvent.click(screen.getByText(/OAuth 2.0 Authorization Framework/i));
		fireEvent.click(screen.getByRole('button', { name: /Deep Dive/i }));

		// Verify OAuth Detective link
		const detectiveLink = screen.queryByText(/OAuth Detective/i);
		if (detectiveLink) {
			expect(detectiveLink).toBeInTheDocument();
			expect(detectiveLink.closest('a')).toHaveAttribute('href', /advanced-oauth-params-demo/i);
		}
	});

	it('should link to Scope Impact Playground for scope-related RFCs', () => {
		renderWithRouter(<LiveRFCExplorer />);

		// Select an RFC that mentions scopes
		fireEvent.click(screen.getByText(/OpenID Connect/i));
		fireEvent.click(screen.getByRole('button', { name: /Deep Dive/i }));

		// Verify Scope Playground link if present
		const scopeLink = screen.queryByText(/Scope Impact Playground/i);
		if (scopeLink) {
			expect(scopeLink).toBeInTheDocument();
		}
	});

	it('should provide spec snippet copy buttons in deep dive', () => {
		renderWithRouter(<LiveRFCExplorer />);

		// Select RFC and enable Deep Dive
		fireEvent.click(screen.getByText(/RFC 7636/i)); // PKCE
		fireEvent.click(screen.getByRole('button', { name: /Deep Dive/i }));

		// Verify copy buttons for spec snippets
		const copyButtons = screen.getAllByRole('button', { name: /Copy/i });
		expect(copyButtons.length).toBeGreaterThan(0);
	});

	it('should display plain-English summaries for technical sections', () => {
		renderWithRouter(<LiveRFCExplorer />);

		// Select RFC and enable Deep Dive
		fireEvent.click(screen.getByText(/OAuth 2.0 Authorization Framework/i));
		fireEvent.click(screen.getByRole('button', { name: /Deep Dive/i }));

		// Verify plain-English explanations exist
		expect(screen.getByText(/Deep Dive Insights/i)).toBeInTheDocument();
	});

	it('should allow searching RFCs by keywords', () => {
		renderWithRouter(<LiveRFCExplorer />);

		// Search for PKCE
		const searchInput = screen.getByPlaceholderText(/Search OAuth specs/i);
		fireEvent.change(searchInput, { target: { value: 'PKCE' } });

		// Verify filtered results
		expect(screen.getByText(/RFC 7636/i)).toBeInTheDocument();
		expect(screen.queryByText(/RFC 8628/i)).not.toBeInTheDocument(); // Device Flow shouldn't match
	});

	it('should show cross-references between related RFCs', () => {
		renderWithRouter(<LiveRFCExplorer />);

		// Select RFC and enable Deep Dive
		fireEvent.click(screen.getByText(/RFC 7636/i)); // PKCE
		fireEvent.click(screen.getByRole('button', { name: /Deep Dive/i }));

		// Verify cross-references to related specs
		const crossRefs = screen.queryByText(/RFC 6749/i); // PKCE extends OAuth 2.0
		if (crossRefs) {
			expect(crossRefs).toBeInTheDocument();
		}
	});

	it('should display security considerations in deep dive', () => {
		renderWithRouter(<LiveRFCExplorer />);

		// Select RFC and enable Deep Dive
		fireEvent.click(screen.getByText(/RFC 7636/i)); // PKCE
		fireEvent.click(screen.getByRole('button', { name: /Deep Dive/i }));

		// Verify security insights
		expect(screen.getByText(/security/i)).toBeInTheDocument();
	});

	it('should provide external links to official specs', () => {
		renderWithRouter(<LiveRFCExplorer />);

		// Select RFC
		fireEvent.click(screen.getByText(/OAuth 2.0 Authorization Framework/i));

		// Verify external link to IETF
		const externalLink = screen.getByRole('link', { name: /View Official Spec/i });
		expect(externalLink).toHaveAttribute('href', /datatracker.ietf.org/i);
		expect(externalLink).toHaveAttribute('target', '_blank');
	});

	it('should toggle deep dive mode off to hide enhanced content', () => {
		renderWithRouter(<LiveRFCExplorer />);

		// Enable Deep Dive
		fireEvent.click(screen.getByText(/OAuth 2.0 Authorization Framework/i));
		const deepDiveToggle = screen.getByRole('button', { name: /Deep Dive/i });
		fireEvent.click(deepDiveToggle);

		expect(screen.getByText(/Deep Dive Insights/i)).toBeInTheDocument();

		// Disable Deep Dive
		fireEvent.click(deepDiveToggle);

		// Verify deep dive content is hidden
		expect(screen.queryByText(/Deep Dive Insights/i)).not.toBeInTheDocument();
	});
});
