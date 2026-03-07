// src/v8/flows/__tests__/TokenExchangeFlowV8.test.tsx
// Token Exchange Phase 1B - V8 Flow Component Tests

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { GlobalEnvironmentService } from '../../services/globalEnvironmentService';
import { TokenExchangeConfigServiceV8 } from '../../services/tokenExchangeConfigServiceV8';
import { TokenExchangeServiceV8 } from '../../services/tokenExchangeServiceV8';
import { TokenExchangeFlowV8 } from '../TokenExchangeFlowV8';

// Mock the services
vi.mock('../../services/tokenExchangeServiceV8');
vi.mock('../../services/tokenExchangeConfigServiceV8');
vi.mock('../../services/globalEnvironmentService');
vi.mock('../../utils/toastNotificationsV8');

const mockTokenExchangeService = TokenExchangeServiceV8 as any;
const mockConfigService = TokenExchangeConfigServiceV8 as any;
const mockGlobalEnvironmentService = GlobalEnvironmentService as any;

describe('TokenExchangeFlowV8', () => {
	const mockEnvironmentId = 'test-env-123';
	const mockSubjectToken =
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW52X2lkIjoidGVzdC1lbnYtMTIzIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTksInRlc3RfdG9rZW5fZXhjaGFuZ2UiOiJhY2Nlc3MifQ.mock-signature';

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock GlobalEnvironmentService
		mockGlobalEnvironmentService.getInstance = vi.fn().mockReturnValue({
			getEnvironmentId: () => mockEnvironmentId,
		} as any);

		// Mock TokenExchangeConfigServiceV8
		mockConfigService.isEnabled = vi.fn().mockResolvedValue(true);
		mockConfigService.getAdminConfig = vi.fn().mockResolvedValue({
			enabled: true,
			allowedScopes: ['read', 'write', 'admin'],
			maxTokenLifetime: 3600,
			allowedAudiences: [],
			requireSameEnvironment: true,
			lastUpdated: Date.now(),
			updatedBy: 'admin-user',
		});

		// Mock TokenExchangeServiceV8
		mockTokenExchangeService.exchangeToken = vi.fn().mockResolvedValue({
			access_token: 'new-access-token-mock',
			token_type: 'Bearer',
			expires_in: 3600,
			scope: 'read',
			issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
		});
	});

	it('renders Token Exchange form when admin is enabled', async () => {
		render(<TokenExchangeFlowV8 environmentId={mockEnvironmentId} />);

		// Check that the form renders
		expect(screen.getByText('Token Exchange')).toBeInTheDocument();
		expect(
			screen.getByText('OAuth 2.0 Token Exchange Grant Type - Same Environment Only')
		).toBeInTheDocument();
		expect(screen.getByText('Phase 1 - RFC 8693')).toBeInTheDocument();

		// Check scenario cards
		expect(screen.getByText('Delegation')).toBeInTheDocument();
		expect(screen.getByText('Impersonation')).toBeInTheDocument();
		expect(screen.getByText('Scope Reduction')).toBeInTheDocument();
		expect(screen.getByText('Audience Restriction')).toBeInTheDocument();

		// Check form fields
		expect(screen.getByLabelText('Subject Token *')).toBeInTheDocument();
		expect(screen.getByLabelText('Subject Token Type')).toBeInTheDocument();
		expect(screen.getByLabelText('Requested Token Type')).toBeInTheDocument();
		expect(screen.getByLabelText('Scope (Optional)')).toBeInTheDocument();
		expect(screen.getByLabelText('Actor Token (Optional)')).toBeInTheDocument();

		// Check that exchange button is enabled
		const exchangeButton = screen.getByText('Exchange Token');
		expect(exchangeButton).toBeInTheDocument();
		expect(exchangeButton).not.toBeDisabled();
	});

	it('shows disabled state when admin is not enabled', async () => {
		mockConfigService.isEnabled = vi.fn().mockResolvedValue(false);

		render(<TokenExchangeFlowV8 environmentId={mockEnvironmentId} />);

		// Check that disabled message is shown
		expect(screen.getByText('Token Exchange Disabled')).toBeInTheDocument();
		expect(
			screen.getByText('Token Exchange is not enabled for this environment')
		).toBeInTheDocument();

		// Check that exchange button is disabled
		const exchangeButton = screen.getByText('Exchange Token');
		expect(exchangeButton).toBeDisabled();
	});

	it('successfully exchanges token when form is filled', async () => {
		const mockOnTokenReceived = vi.fn();

		render(
			<TokenExchangeFlowV8
				environmentId={mockEnvironmentId}
				onTokenReceived={mockOnTokenReceived}
			/>
		);

		// Fill in the form
		const subjectTokenInput = screen.getByLabelText('Subject Token *');
		fireEvent.change(subjectTokenInput, { target: { value: mockSubjectToken } });

		const scopeInput = screen.getByLabelText('Scope (Optional)');
		fireEvent.change(scopeInput, { target: { value: 'read write' } });

		// Click exchange button
		const exchangeButton = screen.getByText('Exchange Token');
		fireEvent.click(exchangeButton);

		// Wait for the exchange to complete
		await waitFor(() => {
			expect(mockTokenExchangeService.exchangeToken).toHaveBeenCalledWith(
				{
					subject_token: mockSubjectToken,
					subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
					requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
					scope: 'read write',
				},
				mockEnvironmentId
			);
		});

		// Check that success message is shown
		await waitFor(() => {
			expect(screen.getByText('Token Exchange Successful')).toBeInTheDocument();
		});

		// Check that result is displayed
		expect(screen.getByText(/new-access-token-mock/)).toBeInTheDocument();

		// Check that callback was called
		expect(mockOnTokenReceived).toHaveBeenCalledWith({
			access_token: 'new-access-token-mock',
			token_type: 'Bearer',
			expires_in: 3600,
			scope: 'read',
			issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
		});
	});

	it('handles token exchange errors', async () => {
		const mockOnError = vi.fn();
		const mockError = new Error('Invalid token') as any;
		mockError.type = 'INVALID_TOKEN';
		mockError.message = 'Invalid subject token';

		mockTokenExchangeService.exchangeToken = vi.fn().mockRejectedValue(mockError);

		render(<TokenExchangeFlowV8 environmentId={mockEnvironmentId} onError={mockOnError} />);

		// Fill in the form
		const subjectTokenInput = screen.getByLabelText('Subject Token *');
		fireEvent.change(subjectTokenInput, { target: { value: 'invalid-token' } });

		// Click exchange button
		const exchangeButton = screen.getByText('Exchange Token');
		fireEvent.click(exchangeButton);

		// Wait for error to appear
		await waitFor(() => {
			expect(screen.getByText('Token Exchange Failed')).toBeInTheDocument();
		});

		// Check that error details are shown
		expect(screen.getByText('Error Type: INVALID_TOKEN')).toBeInTheDocument();
		expect(screen.getByText('Invalid subject token')).toBeInTheDocument();

		// Check that callback was called
		expect(mockOnError).toHaveBeenCalledWith(mockError);
	});

	it('validates required fields', async () => {
		render(<TokenExchangeFlowV8 environmentId={mockEnvironmentId} />);

		// Check that exchange button is disabled without subject token
		const exchangeButton = screen.getByText('Exchange Token');
		expect(exchangeButton).toBeDisabled();

		// Fill in subject token
		const subjectTokenInput = screen.getByLabelText('Subject Token *');
		fireEvent.change(subjectTokenInput, { target: { value: mockSubjectToken } });

		// Button should now be enabled
		expect(exchangeButton).not.toBeDisabled();
	});

	it('copies token to clipboard', async () => {
		// Mock clipboard API
		const mockWriteText = vi.fn().mockResolvedValue(undefined);
		Object.assign(navigator, {
			clipboard: {
				writeText: mockWriteText,
			},
		});

		render(<TokenExchangeFlowV8 environmentId={mockEnvironmentId} />);

		// Fill form and exchange
		const subjectTokenInput = screen.getByLabelText('Subject Token *');
		fireEvent.change(subjectTokenInput, { target: { value: mockSubjectToken } });

		const exchangeButton = screen.getByText('Exchange Token');
		fireEvent.click(exchangeButton);

		// Wait for success and click copy buttons
		await waitFor(() => {
			expect(screen.getByText('Copy JSON')).toBeInTheDocument();
			expect(screen.getByText('Copy Access Token')).toBeInTheDocument();
		});

		// Test copy JSON
		fireEvent.click(screen.getByText('Copy JSON'));
		expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('new-access-token-mock'));

		// Test copy access token
		fireEvent.click(screen.getByText('Copy Access Token'));
		expect(mockWriteText).toHaveBeenCalledWith('new-access-token-mock');
	});

	it('clears form correctly', async () => {
		render(<TokenExchangeFlowV8 environmentId={mockEnvironmentId} />);

		// Fill in the form
		const subjectTokenInput = screen.getByLabelText('Subject Token *');
		const scopeInput = screen.getByLabelText('Scope (Optional)');
		const actorTokenInput = screen.getByLabelText('Actor Token (Optional)');

		fireEvent.change(subjectTokenInput, { target: { value: mockSubjectToken } });
		fireEvent.change(scopeInput, { target: { value: 'read write' } });
		fireEvent.change(actorTokenInput, { target: { value: 'actor-token' } });

		// Verify values are set
		expect(subjectTokenInput).toHaveValue(mockSubjectToken);
		expect(scopeInput).toHaveValue('read write');
		expect(actorTokenInput).toHaveValue('actor-token');

		// Click clear button
		const clearButton = screen.getByText('Clear Form');
		fireEvent.click(clearButton);

		// Verify form is cleared
		expect(subjectTokenInput).toHaveValue('');
		expect(scopeInput).toHaveValue('read');
		expect(actorTokenInput).toHaveValue('');
	});

	describe('Validation Insights', () => {
		it('should display validation insights after successful token exchange', async () => {
			// Mock successful token exchange response
			mockTokenExchangeService.exchangeToken.mockResolvedValue({
				access_token: 'new-access-token',
				token_type: 'Bearer',
				expires_in: 3600,
				scope: 'read write',
			});

			render(<TokenExchangeFlowV8 />);

			// Fill the form and submit
			const subjectTokenInput = screen.getByLabelText('Subject Token');
			const subjectTokenTypeSelect = screen.getByLabelText('Subject Token Type');
			const requestedTokenTypeSelect = screen.getByLabelText('Requested Token Type');
			const exchangeButton = screen.getByText('Exchange Token');

			fireEvent.change(subjectTokenInput, { target: { value: mockSubjectToken } });
			fireEvent.change(subjectTokenTypeSelect, { target: { value: 'access_token' } });
			fireEvent.change(requestedTokenTypeSelect, { target: { value: 'access_token' } });

			fireEvent.click(exchangeButton);

			// Wait for completion and validation insights
			await waitFor(() => {
				expect(screen.getByText('🎉 Token Exchange Flow Complete')).toBeInTheDocument();
			});

			// Check for validation insights section
			expect(screen.getByText('Validation Insights:')).toBeInTheDocument();
			expect(screen.getByText('✅ Token exchange completed securely')).toBeInTheDocument();
			expect(screen.getByText('✅ RFC 8693 token exchange standard followed')).toBeInTheDocument();
			expect(screen.getByText('✅ Security delegation properly configured')).toBeInTheDocument();
			expect(screen.getByText('✅ Access token successfully validated')).toBeInTheDocument();
		});

		it('should display achievements after successful token exchange', async () => {
			// Mock successful token exchange response
			mockTokenExchangeService.exchangeToken.mockResolvedValue({
				access_token: 'new-access-token',
				token_type: 'Bearer',
				expires_in: 3600,
				scope: 'read write',
			});

			render(<TokenExchangeFlowV8 />);

			// Fill the form and submit
			const subjectTokenInput = screen.getByLabelText('Subject Token');
			const subjectTokenTypeSelect = screen.getByLabelText('Subject Token Type');
			const requestedTokenTypeSelect = screen.getByLabelText('Requested Token Type');
			const exchangeButton = screen.getByText('Exchange Token');

			fireEvent.change(subjectTokenInput, { target: { value: mockSubjectToken } });
			fireEvent.change(subjectTokenTypeSelect, { target: { value: 'access_token' } });
			fireEvent.change(requestedTokenTypeSelect, { target: { value: 'access_token' } });

			fireEvent.click(exchangeButton);

			// Wait for completion and achievements
			await waitFor(() => {
				expect(screen.getByText('Achievements:')).toBeInTheDocument();
			});

			// Check for achievements
			expect(
				screen.getByText('✅ Token exchange request executed successfully')
			).toBeInTheDocument();
			expect(screen.getByText('✅ access_token token obtained')).toBeInTheDocument();
			expect(screen.getByText('✅ Security delegation completed')).toBeInTheDocument();
			expect(screen.getByText('✅ RFC 8693 token exchange implemented')).toBeInTheDocument();
		});

		it('should display exchange summary after successful token exchange', async () => {
			// Mock successful token exchange response
			mockTokenExchangeService.exchangeToken.mockResolvedValue({
				access_token: 'new-access-token',
				token_type: 'Bearer',
				expires_in: 3600,
				scope: 'read write',
			});

			render(<TokenExchangeFlowV8 />);

			// Fill the form and submit
			const subjectTokenInput = screen.getByLabelText('Subject Token');
			const subjectTokenTypeSelect = screen.getByLabelText('Subject Token Type');
			const requestedTokenTypeSelect = screen.getByLabelText('Requested Token Type');
			const exchangeButton = screen.getByText('Exchange Token');

			fireEvent.change(subjectTokenInput, { target: { value: mockSubjectToken } });
			fireEvent.change(subjectTokenTypeSelect, { target: { value: 'access_token' } });
			fireEvent.change(requestedTokenTypeSelect, { target: { value: 'access_token' } });

			fireEvent.click(exchangeButton);

			// Wait for completion and exchange summary
			await waitFor(() => {
				expect(screen.getByText('Exchange Summary:')).toBeInTheDocument();
			});

			// Check for exchange summary details
			expect(screen.getByText('Subject Token Type: access_token')).toBeInTheDocument();
			expect(screen.getByText('Requested Token Type: access_token')).toBeInTheDocument();
			expect(screen.getByText('Access Token: ✅ Obtained')).toBeInTheDocument();
			expect(screen.getByText('Token Type: Bearer')).toBeInTheDocument();
			expect(screen.getByText('Expires In: 3600 seconds')).toBeInTheDocument();
			expect(screen.getByText('Scope: read write')).toBeInTheDocument();
		});

		it('should handle different token types in validation insights', async () => {
			// Mock successful token exchange response with refresh token
			mockTokenExchangeService.exchangeToken.mockResolvedValue({
				access_token: 'new-access-token',
				refresh_token: 'new-refresh-token',
				token_type: 'Bearer',
				expires_in: 3600,
				scope: 'offline_access',
			});

			render(<TokenExchangeFlowV8 />);

			// Fill the form and submit
			const subjectTokenInput = screen.getByLabelText('Subject Token');
			const subjectTokenTypeSelect = screen.getByLabelText('Subject Token Type');
			const requestedTokenTypeSelect = screen.getByLabelText('Requested Token Type');
			const exchangeButton = screen.getByText('Exchange Token');

			fireEvent.change(subjectTokenInput, { target: { value: mockSubjectToken } });
			fireEvent.change(subjectTokenTypeSelect, { target: { value: 'access_token' } });
			fireEvent.change(requestedTokenTypeSelect, { target: { value: 'refresh_token' } });

			fireEvent.click(exchangeButton);

			// Wait for completion
			await waitFor(() => {
				expect(screen.getByText('🎉 Token Exchange Flow Complete')).toBeInTheDocument();
			});

			// Check for refresh token in achievements
			expect(screen.getByText('✅ refresh_token token obtained')).toBeInTheDocument();
		});

		it('should display RFC 8693 compliance validation', async () => {
			// Mock successful token exchange response
			mockTokenExchangeService.exchangeToken.mockResolvedValue({
				access_token: 'new-access-token',
				token_type: 'Bearer',
				expires_in: 3600,
				scope: 'read write',
			});

			render(<TokenExchangeFlowV8 />);

			// Fill the form with RFC 8693 compliant parameters
			const subjectTokenInput = screen.getByLabelText('Subject Token');
			const subjectTokenTypeSelect = screen.getByLabelText('Subject Token Type');
			const requestedTokenTypeSelect = screen.getByLabelText('Requested Token Type');
			const exchangeButton = screen.getByText('Exchange Token');

			fireEvent.change(subjectTokenInput, { target: { value: mockSubjectToken } });
			fireEvent.change(subjectTokenTypeSelect, { target: { value: 'access_token' } });
			fireEvent.change(requestedTokenTypeSelect, { target: { value: 'access_token' } });

			fireEvent.click(exchangeButton);

			// Wait for completion
			await waitFor(() => {
				expect(
					screen.getByText('✅ RFC 8693 token exchange standard followed')
				).toBeInTheDocument();
			});
		});

		it('should validate security delegation in completion summary', async () => {
			// Mock successful token exchange response
			mockTokenExchangeService.exchangeToken.mockResolvedValue({
				access_token: 'new-access-token',
				token_type: 'Bearer',
				expires_in: 3600,
				scope: 'read write',
			});

			render(<TokenExchangeFlowV8 />);

			// Fill the form and submit
			const subjectTokenInput = screen.getByLabelText('Subject Token');
			const subjectTokenTypeSelect = screen.getByLabelText('Subject Token Type');
			const requestedTokenTypeSelect = screen.getByLabelText('Requested Token Type');
			const exchangeButton = screen.getByText('Exchange Token');

			fireEvent.change(subjectTokenInput, { target: { value: mockSubjectToken } });
			fireEvent.change(subjectTokenTypeSelect, { target: { value: 'access_token' } });
			fireEvent.change(requestedTokenTypeSelect, { target: { value: 'access_token' } });

			fireEvent.click(exchangeButton);

			// Wait for completion
			await waitFor(() => {
				expect(screen.getByText('✅ Security delegation properly configured')).toBeInTheDocument();
			});
		});
	});
});
