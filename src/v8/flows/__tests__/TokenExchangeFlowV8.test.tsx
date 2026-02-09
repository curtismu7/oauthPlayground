// src/v8/flows/__tests__/TokenExchangeFlowV8.test.tsx
// Token Exchange Phase 1B - V8 Flow Component Tests

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TokenExchangeFlowV8 } from '../TokenExchangeFlowV8';
import { TokenExchangeServiceV8 } from '../../services/tokenExchangeServiceV8';
import { TokenExchangeConfigServiceV8 } from '../../services/tokenExchangeConfigServiceV8';
import { GlobalEnvironmentService } from '../../services/globalEnvironmentService';

// Mock the services
jest.mock('../../services/tokenExchangeServiceV8');
jest.mock('../../services/tokenExchangeConfigServiceV8');
jest.mock('../../services/globalEnvironmentService');
jest.mock('../../utils/toastNotificationsV8');

const mockTokenExchangeService = TokenExchangeServiceV8 as jest.Mocked<typeof TokenExchangeServiceV8>;
const mockConfigService = TokenExchangeConfigServiceV8 as jest.Mocked<typeof TokenExchangeConfigServiceV8>;
const mockGlobalEnvironmentService = GlobalEnvironmentService as jest.Mocked<typeof GlobalEnvironmentService>;

describe('TokenExchangeFlowV8', () => {
	const mockEnvironmentId = 'test-env-123';
	const mockSubjectToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW52X2lkIjoidGVzdC1lbnYtMTIzIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTksInRlc3RfdG9rZW5fZXhjaGFuZ2UiOiJhY2Nlc3MifQ.mock-signature';

	beforeEach(() => {
		jest.clearAllMocks();
		
		// Mock GlobalEnvironmentService
		mockGlobalEnvironmentService.getInstance = jest.fn().mockReturnValue({
			getEnvironmentId: () => mockEnvironmentId,
		} as any);

		// Mock TokenExchangeConfigServiceV8
		mockConfigService.isEnabled = jest.fn().mockResolvedValue(true);
		mockConfigService.getAdminConfig = jest.fn().mockResolvedValue({
			enabled: true,
			allowedScopes: ['read', 'write', 'admin'],
			maxTokenLifetime: 3600,
			allowedAudiences: [],
			requireSameEnvironment: true,
			lastUpdated: Date.now(),
			updatedBy: 'admin-user',
		});

		// Mock TokenExchangeServiceV8
		mockTokenExchangeService.exchangeToken = jest.fn().mockResolvedValue({
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
		expect(screen.getByText('OAuth 2.0 Token Exchange Grant Type - Same Environment Only')).toBeInTheDocument();
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
		mockConfigService.isEnabled = jest.fn().mockResolvedValue(false);

		render(<TokenExchangeFlowV8 environmentId={mockEnvironmentId} />);

		// Check that disabled message is shown
		expect(screen.getByText('Token Exchange Disabled')).toBeInTheDocument();
		expect(screen.getByText('Token Exchange is not enabled for this environment')).toBeInTheDocument();

		// Check that exchange button is disabled
		const exchangeButton = screen.getByText('Exchange Token');
		expect(exchangeButton).toBeDisabled();
	});

	it('successfully exchanges token when form is filled', async () => {
		const mockOnTokenReceived = jest.fn();

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
		const mockOnError = jest.fn();
		const mockError = new Error('Invalid token') as any;
		mockError.type = 'INVALID_TOKEN';
		mockError.message = 'Invalid subject token';

		mockTokenExchangeService.exchangeToken = jest.fn().mockRejectedValue(mockError);

		render(
			<TokenExchangeFlowV8
				environmentId={mockEnvironmentId}
				onError={mockOnError}
			/>
		);

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
		const mockWriteText = jest.fn().mockResolvedValue(undefined);
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
		expect(mockWriteText).toHaveBeenCalledWith(
			expect.stringContaining('new-access-token-mock')
		);

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
});
