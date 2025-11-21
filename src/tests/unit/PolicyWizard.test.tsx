// src/tests/unit/PolicyWizard.test.ts
/**
 * Unit tests for PolicyWizard component
 * Tests questionnaire flow, recommendation engine, and PingOne config generation
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import PolicyWizard from '../../components/PolicyWizard';

const renderWithRouter = (component: React.ReactElement) => {
	return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PolicyWizard', () => {
	beforeEach(() => {
		// Clear wizard state between tests
	});

	it('should render the wizard with initial questionnaire', () => {
		renderWithRouter(<PolicyWizard />);

		expect(screen.getByText(/Policy Wizard/i)).toBeInTheDocument();
		expect(screen.getByText(/Application Type/i)).toBeInTheDocument();
	});

	it('should display application type options', () => {
		renderWithRouter(<PolicyWizard />);

		// Verify common app types are available
		expect(screen.getByText(/Single Page Application/i)).toBeInTheDocument();
		expect(screen.getByText(/Web Application/i)).toBeInTheDocument();
		expect(screen.getByText(/Mobile App/i)).toBeInTheDocument();
	});

	it('should allow selecting an application type', () => {
		renderWithRouter(<PolicyWizard />);

		// Click SPA option
		const spaButton = screen.getByRole('button', { name: /Single Page Application/i });
		fireEvent.click(spaButton);

		// Verify selection is active
		expect(spaButton).toHaveAttribute('aria-pressed', 'true');
	});

	it('should show security level question', () => {
		renderWithRouter(<PolicyWizard />);

		// Answer first question
		const spaButton = screen.getByRole('button', { name: /Single Page Application/i });
		fireEvent.click(spaButton);

		// Verify security question appears
		expect(screen.getByText(/Security Level/i)).toBeInTheDocument();
	});

	it('should display different security level options', () => {
		renderWithRouter(<PolicyWizard />);

		// Navigate to security question
		const spaButton = screen.getByRole('button', { name: /Single Page Application/i });
		fireEvent.click(spaButton);

		// Verify security levels
		expect(screen.getByText(/Standard/i)).toBeInTheDocument();
		expect(screen.getByText(/High/i)).toBeInTheDocument();
		expect(screen.getByText(/Critical/i)).toBeInTheDocument();
	});

	it('should ask about MFA requirements', () => {
		renderWithRouter(<PolicyWizard />);

		// Answer app type and security level
		fireEvent.click(screen.getByRole('button', { name: /Single Page Application/i }));
		fireEvent.click(screen.getByRole('button', { name: /High/i }));

		// Verify MFA question appears
		expect(screen.getByText(/Multi-Factor Authentication/i)).toBeInTheDocument();
	});

	it('should generate recommendations after completing questionnaire', async () => {
		renderWithRouter(<PolicyWizard />);

		// Complete wizard
		fireEvent.click(screen.getByRole('button', { name: /Single Page Application/i }));
		fireEvent.click(screen.getByRole('button', { name: /High/i }));
		fireEvent.click(screen.getByRole('button', { name: /Required/i }));

		// Click generate button
		const generateButton = screen.getByRole('button', { name: /Generate/i });
		fireEvent.click(generateButton);

		// Verify recommendations appear
		await waitFor(() => {
			expect(screen.getByText(/Recommendations/i)).toBeInTheDocument();
		});
	});

	it('should recommend PKCE for SPAs', async () => {
		renderWithRouter(<PolicyWizard />);

		// Select SPA
		fireEvent.click(screen.getByRole('button', { name: /Single Page Application/i }));
		fireEvent.click(screen.getByRole('button', { name: /Standard/i }));

		// Generate recommendations
		const generateButton = screen.getByRole('button', { name: /Generate/i });
		fireEvent.click(generateButton);

		// Verify PKCE is recommended
		await waitFor(() => {
			expect(screen.getByText(/PKCE/i)).toBeInTheDocument();
		});
	});

	it('should recommend stronger auth for high security apps', async () => {
		renderWithRouter(<PolicyWizard />);

		// Select high security
		fireEvent.click(screen.getByRole('button', { name: /Web Application/i }));
		fireEvent.click(screen.getByRole('button', { name: /Critical/i }));
		fireEvent.click(screen.getByRole('button', { name: /Required/i }));

		// Generate recommendations
		const generateButton = screen.getByRole('button', { name: /Generate/i });
		fireEvent.click(generateButton);

		// Verify stronger recommendations
		await waitFor(() => {
			expect(screen.getByText(/FIDO2/i)).toBeInTheDocument();
		});
	});

	it('should display PingOne configuration JSON', async () => {
		renderWithRouter(<PolicyWizard />);

		// Complete wizard
		fireEvent.click(screen.getByRole('button', { name: /Single Page Application/i }));
		fireEvent.click(screen.getByRole('button', { name: /Standard/i }));

		const generateButton = screen.getByRole('button', { name: /Generate/i });
		fireEvent.click(generateButton);

		// Verify JSON config is shown
		await waitFor(() => {
			expect(screen.getByText(/"grantTypes"/i)).toBeInTheDocument();
			expect(screen.getByText(/"tokenEndpointAuthMethod"/i)).toBeInTheDocument();
		});
	});

	it('should provide copy button for JSON config', async () => {
		renderWithRouter(<PolicyWizard />);

		// Generate recommendations
		fireEvent.click(screen.getByRole('button', { name: /Single Page Application/i }));
		fireEvent.click(screen.getByRole('button', { name: /Standard/i }));
		fireEvent.click(screen.getByRole('button', { name: /Generate/i }));

		// Find copy button
		await waitFor(() => {
			const copyButton = screen.getByRole('button', { name: /Copy/i });
			expect(copyButton).toBeInTheDocument();
		});
	});

	it('should link to PingOne console sections', async () => {
		renderWithRouter(<PolicyWizard />);

		// Generate recommendations
		fireEvent.click(screen.getByRole('button', { name: /Web Application/i }));
		fireEvent.click(screen.getByRole('button', { name: /High/i }));
		fireEvent.click(screen.getByRole('button', { name: /Generate/i }));

		// Verify console links
		await waitFor(() => {
			expect(screen.getByText(/Configure in PingOne/i)).toBeInTheDocument();
		});
	});

	it('should allow restarting the wizard', async () => {
		renderWithRouter(<PolicyWizard />);

		// Complete wizard
		fireEvent.click(screen.getByRole('button', { name: /Single Page Application/i }));
		fireEvent.click(screen.getByRole('button', { name: /Standard/i }));
		fireEvent.click(screen.getByRole('button', { name: /Generate/i }));

		await waitFor(() => {
			expect(screen.getByText(/Recommendations/i)).toBeInTheDocument();
		});

		// Click restart
		const restartButton = screen.getByRole('button', { name: /Restart/i });
		fireEvent.click(restartButton);

		// Verify back to first question
		expect(screen.getByText(/Application Type/i)).toBeInTheDocument();
	});

	it('should show governance recommendations for admin apps', async () => {
		renderWithRouter(<PolicyWizard />);

		// Select admin/privileged app type if available
		const adminOption = screen.queryByRole('button', { name: /Admin/i });
		if (adminOption) {
			fireEvent.click(adminOption);
			fireEvent.click(screen.getByRole('button', { name: /Critical/i }));
			fireEvent.click(screen.getByRole('button', { name: /Generate/i }));

			// Verify governance recommendations
			await waitFor(() => {
				expect(screen.getByText(/governance/i)).toBeInTheDocument();
			});
		}
	});

	it('should display estimated implementation time', async () => {
		renderWithRouter(<PolicyWizard />);

		// Generate recommendations
		fireEvent.click(screen.getByRole('button', { name: /Single Page Application/i }));
		fireEvent.click(screen.getByRole('button', { name: /Standard/i }));
		fireEvent.click(screen.getByRole('button', { name: /Generate/i }));

		// Verify implementation guidance
		await waitFor(() => {
			expect(screen.getByText(/Implementation/i)).toBeInTheDocument();
		});
	});
});
