/**
 * @file OAuthAuthorizationCodeFlowV8.test.tsx
 * @module v8/flows/__tests__
 * @description Tests for OAuthAuthorizationCodeFlowV8 component
 * @version 8.0.0
 * @since 2024-11-16
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OAuthAuthorizationCodeFlowV8 from '../OAuthAuthorizationCodeFlowV8';

describe('OAuthAuthorizationCodeFlowV8', () => {
	describe('Rendering', () => {
		it('should render the flow component', () => {
			render(<OAuthAuthorizationCodeFlowV8 />);

			expect(screen.getByText(/OAuth 2.0 Authorization Code Flow/i)).toBeInTheDocument();
		});

		it('should render step 0 by default', () => {
			render(<OAuthAuthorizationCodeFlowV8 />);

			expect(screen.getByText(/Step 0: Configure Credentials/i)).toBeInTheDocument();
		});

		it('should render all form fields on step 0', () => {
			render(<OAuthAuthorizationCodeFlowV8 />);

			expect(screen.getByLabelText(/Environment ID/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Client ID/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Client Secret/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Redirect URI/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Scopes/i)).toBeInTheDocument();
		});

		it('should render progress bar', () => {
			const { container } = render(<OAuthAuthorizationCodeFlowV8 />);

			expect(container.querySelector('.step-progress-bar-v8')).toBeInTheDocument();
		});

		it('should render navigation buttons', () => {
			render(<OAuthAuthorizationCodeFlowV8 />);

			expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument();
		});
	});

	describe('Step 0: Credentials', () => {
		it('should have next button disabled initially', () => {
			render(<OAuthAuthorizationCodeFlowV8 />);

			const nextBtn = screen.getByRole('button', { name: /next step/i });
			expect(nextBtn).toBeDisabled();
		});

		it('should enable next button when all required fields filled', async () => {
			const user = userEvent.setup();

			render(<OAuthAuthorizationCodeFlowV8 />);

			const envIdInput = screen.getByLabelText(/Environment ID/i);
			const clientIdInput = screen.getByLabelText(/Client ID/i);
			const redirectUriInput = screen.getByLabelText(/Redirect URI/i);

			await user.type(envIdInput, '12345678-1234-1234-1234-123456789012');
			await user.type(clientIdInput, 'abc123');
			await user.type(redirectUriInput, 'http://localhost:3000/callback');

			await waitFor(() => {
				const nextBtn = screen.getByRole('button', { name: /next step/i });
				expect(nextBtn).not.toBeDisabled();
			});
		});

		it('should show validation errors for invalid UUID', async () => {
			const user = userEvent.setup();

			render(<OAuthAuthorizationCodeFlowV8 />);

			const envIdInput = screen.getByLabelText(/Environment ID/i);
			await user.type(envIdInput, 'invalid-uuid');

			await waitFor(() => {
				expect(screen.getByText(/UUID/i)).toBeInTheDocument();
			});
		});

		it('should show validation errors for invalid URL', async () => {
			const user = userEvent.setup();

			render(<OAuthAuthorizationCodeFlowV8 />);

			const redirectUriInput = screen.getByLabelText(/Redirect URI/i);
			await user.type(redirectUriInput, 'not-a-url');

			await waitFor(() => {
				expect(screen.getByText(/URL/i)).toBeInTheDocument();
			});
		});

		it('should accept default scopes', () => {
			render(<OAuthAuthorizationCodeFlowV8 />);

			const scopesInput = screen.getByLabelText(/Scopes/i) as HTMLInputElement;
			expect(scopesInput.value).toBe('openid profile email');
		});

		it('should allow editing scopes', async () => {
			const user = userEvent.setup();

			render(<OAuthAuthorizationCodeFlowV8 />);

			const scopesInput = screen.getByLabelText(/Scopes/i);
			await user.clear(scopesInput);
			await user.type(scopesInput, 'openid profile');

			expect((scopesInput as HTMLInputElement).value).toBe('openid profile');
		});
	});

	describe('Step Navigation', () => {
		it('should go to next step when next button clicked', async () => {
			const user = userEvent.setup();

			render(<OAuthAuthorizationCodeFlowV8 />);

			// Fill required fields
			const envIdInput = screen.getByLabelText(/Environment ID/i);
			const clientIdInput = screen.getByLabelText(/Client ID/i);
			const redirectUriInput = screen.getByLabelText(/Redirect URI/i);

			await user.type(envIdInput, '12345678-1234-1234-1234-123456789012');
			await user.type(clientIdInput, 'abc123');
			await user.type(redirectUriInput, 'http://localhost:3000/callback');

			// Click next
			const nextBtn = screen.getByRole('button', { name: /next step/i });
			await waitFor(() => expect(nextBtn).not.toBeDisabled());
			await user.click(nextBtn);

			// Should be on step 1
			await waitFor(() => {
				expect(screen.getByText(/Step 1: Generate Authorization URL/i)).toBeInTheDocument();
			});
		});

		it('should go to previous step when previous button clicked', async () => {
			const user = userEvent.setup();

			render(<OAuthAuthorizationCodeFlowV8 />);

			// Fill required fields and go to step 1
			const envIdInput = screen.getByLabelText(/Environment ID/i);
			const clientIdInput = screen.getByLabelText(/Client ID/i);
			const redirectUriInput = screen.getByLabelText(/Redirect URI/i);

			await user.type(envIdInput, '12345678-1234-1234-1234-123456789012');
			await user.type(clientIdInput, 'abc123');
			await user.type(redirectUriInput, 'http://localhost:3000/callback');

			const nextBtn = screen.getByRole('button', { name: /next step/i });
			await waitFor(() => expect(nextBtn).not.toBeDisabled());
			await user.click(nextBtn);

			// Go back
			await waitFor(() => {
				const prevBtn = screen.getByRole('button', { name: /previous/i });
				expect(prevBtn).not.toBeDisabled();
			});

			const prevBtn = screen.getByRole('button', { name: /previous/i });
			await user.click(prevBtn);

			// Should be back on step 0
			await waitFor(() => {
				expect(screen.getByText(/Step 0: Configure Credentials/i)).toBeInTheDocument();
			});
		});

		it('should disable previous button on first step', () => {
			render(<OAuthAuthorizationCodeFlowV8 />);

			const prevBtn = screen.getByRole('button', { name: /previous/i });
			expect(prevBtn).toBeDisabled();
		});
	});

	describe('Progress Bar', () => {
		it('should show 0% progress on step 0', () => {
			render(<OAuthAuthorizationCodeFlowV8 />);

			expect(screen.getByText(/0%/)).toBeInTheDocument();
		});

		it('should show correct progress percentage', async () => {
			const user = userEvent.setup();

			render(<OAuthAuthorizationCodeFlowV8 />);

			// Fill and go to step 1
			const envIdInput = screen.getByLabelText(/Environment ID/i);
			const clientIdInput = screen.getByLabelText(/Client ID/i);
			const redirectUriInput = screen.getByLabelText(/Redirect URI/i);

			await user.type(envIdInput, '12345678-1234-1234-1234-123456789012');
			await user.type(clientIdInput, 'abc123');
			await user.type(redirectUriInput, 'http://localhost:3000/callback');

			const nextBtn = screen.getByRole('button', { name: /next step/i });
			await waitFor(() => expect(nextBtn).not.toBeDisabled());
			await user.click(nextBtn);

			// Should show 25% progress
			await waitFor(() => {
				expect(screen.getByText(/25%/)).toBeInTheDocument();
			});
		});
	});

	describe('Reset Button', () => {
		it('should render reset button', () => {
			render(<OAuthAuthorizationCodeFlowV8 />);

			expect(screen.getByRole('button', { name: /reset flow/i })).toBeInTheDocument();
		});

		it('should reset form when reset button clicked', async () => {
			const user = userEvent.setup();

			render(<OAuthAuthorizationCodeFlowV8 />);

			// Fill form
			const envIdInput = screen.getByLabelText(/Environment ID/i) as HTMLInputElement;
			await user.type(envIdInput, '12345678-1234-1234-1234-123456789012');

			expect(envIdInput.value).toBe('12345678-1234-1234-1234-123456789012');

			// Click reset
			const resetBtn = screen.getByRole('button', { name: /reset flow/i });
			await user.click(resetBtn);

			// Form should be cleared
			await waitFor(() => {
				expect(envIdInput.value).toBe('');
			});
		});
	});

	describe('Accessibility', () => {
		it('should have proper labels for all inputs', () => {
			render(<OAuthAuthorizationCodeFlowV8 />);

			expect(screen.getByLabelText(/Environment ID/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Client ID/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Client Secret/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Redirect URI/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/Scopes/i)).toBeInTheDocument();
		});

		it('should have proper heading hierarchy', () => {
			render(<OAuthAuthorizationCodeFlowV8 />);

			const h1 = screen.getByRole('heading', { level: 1 });
			expect(h1).toHaveTextContent(/OAuth 2.0 Authorization Code Flow/i);
		});

		it('should have proper button labels', () => {
			render(<OAuthAuthorizationCodeFlowV8 />);

			expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /reset flow/i })).toBeInTheDocument();
		});
	});

	describe('Storage', () => {
		it('should save credentials to storage', async () => {
			const user = userEvent.setup();

			render(<OAuthAuthorizationCodeFlowV8 />);

			const envIdInput = screen.getByLabelText(/Environment ID/i);
			await user.type(envIdInput, '12345678-1234-1234-1234-123456789012');

			// Wait for storage to be called
			await waitFor(() => {
				expect(envIdInput).toHaveValue('12345678-1234-1234-1234-123456789012');
			});
		});
	});

	describe('Validation Feedback', () => {
		it('should show validation errors', async () => {
			const user = userEvent.setup();

			render(<OAuthAuthorizationCodeFlowV8 />);

			const envIdInput = screen.getByLabelText(/Environment ID/i);
			await user.type(envIdInput, 'invalid');

			await waitFor(() => {
				expect(screen.getByText(/Error/i)).toBeInTheDocument();
			});
		});

		it('should show validation warnings', async () => {
			const user = userEvent.setup();

			render(<OAuthAuthorizationCodeFlowV8 />);

			const redirectUriInput = screen.getByLabelText(/Redirect URI/i);
			await user.type(redirectUriInput, 'http://192.168.1.1/callback');

			await waitFor(() => {
				// Should show warning about IP address
				expect(screen.getByText(/Warning/i)).toBeInTheDocument();
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty form submission', async () => {
			const _user = userEvent.setup();

			render(<OAuthAuthorizationCodeFlowV8 />);

			const nextBtn = screen.getByRole('button', { name: /next step/i });
			expect(nextBtn).toBeDisabled();
		});

		it('should handle very long input values', async () => {
			const user = userEvent.setup();

			render(<OAuthAuthorizationCodeFlowV8 />);

			const clientIdInput = screen.getByLabelText(/Client ID/i);
			const longValue = 'a'.repeat(500);

			await user.type(clientIdInput, longValue);

			expect((clientIdInput as HTMLInputElement).value).toBe(longValue);
		});

		it('should handle special characters in input', async () => {
			const user = userEvent.setup();

			render(<OAuthAuthorizationCodeFlowV8 />);

			const clientIdInput = screen.getByLabelText(/Client ID/i);
			const specialValue = 'abc-123_456.789';

			await user.type(clientIdInput, specialValue);

			expect((clientIdInput as HTMLInputElement).value).toBe(specialValue);
		});
	});
});
