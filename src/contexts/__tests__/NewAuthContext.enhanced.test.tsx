// src/contexts/__tests__/NewAuthContext.enhanced.test.tsx
// Tests for enhanced NewAuthContext with FlowContextService integration

import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import { act, render } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import FlowContextUtils from '../../services/flowContextUtils';
import { AuthProvider, useAuth } from '../NewAuthContext';

// Mock FlowContextUtils
vi.mock('../../services/flowContextUtils');
const mockFlowContextUtils = FlowContextUtils as Mocked<typeof FlowContextUtils>;

// Mock sessionStorage
const mockSessionStorage = {
	store: {} as Record<string, string>,
	getItem: vi.fn((key: string) => mockSessionStorage.store[key] || null),
	setItem: vi.fn((key: string, value: string) => {
		mockSessionStorage.store[key] = value;
	}),
	removeItem: vi.fn((key: string) => {
		delete mockSessionStorage.store[key];
	}),
	clear: vi.fn(() => {
		mockSessionStorage.store = {};
	}),
};

Object.defineProperty(window, 'sessionStorage', {
	value: mockSessionStorage,
});

// Mock localStorage for credential manager fallback
const mockLocalStorage = {
	store: {} as Record<string, string>,
	getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
	setItem: vi.fn((key: string, value: string) => {
		mockLocalStorage.store[key] = value;
	}),
	removeItem: vi.fn((key: string) => {
		delete mockLocalStorage.store[key];
	}),
	clear: vi.fn(() => {
		mockLocalStorage.store = {};
	}),
};

Object.defineProperty(window, 'localStorage', {
	value: mockLocalStorage,
});

// Mock window.location
Object.defineProperty(window, 'location', {
	value: {
		origin: 'https://localhost:3000',
		href: 'https://localhost:3000',
	},
});

// Test component to access auth context
const TestComponent: React.FC = () => {
	const auth = useAuth();
	return (
		<div>
			<div data-testid="auth-status">
				{auth.isAuthenticated ? 'authenticated' : 'not-authenticated'}
			</div>
			<div data-testid="has-flow-helpers">{auth.initializeFlowContext ? 'yes' : 'no'}</div>
			<button
				type="button"
				data-testid="init-flow"
				onClick={() => auth.initializeFlowContext('test-flow', 1, {})}
			>
				Initialize Flow
			</button>
			<button
				type="button"
				data-testid="complete-flow"
				onClick={() => auth.completeFlow('test-flow')}
			>
				Complete Flow
			</button>
		</div>
	);
};

describe('Enhanced NewAuthContext', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSessionStorage.clear();
		mockLocalStorage.clear();

		// Setup default mock implementations
		mockFlowContextUtils.handleOAuthCallback.mockReturnValue({
			success: true,
			redirectUrl: '/flows/test-flow',
		});

		mockFlowContextUtils.initializeOAuthFlow.mockReturnValue('test-flow-id');
		mockFlowContextUtils.updateFlowStep.mockReturnValue(true);
		mockFlowContextUtils.completeFlow.mockImplementation(() => {});
		mockFlowContextUtils.getCurrentFlow.mockReturnValue({
			flowType: 'test-flow',
			currentStep: 1,
			returnPath: '/flows/test-flow',
			age: 1000,
		});
		mockFlowContextUtils.emergencyCleanup.mockImplementation(() => {});
	});

	describe('Flow Context Helper Functions', () => {
		it('should provide flow context helper functions', () => {
			const { getByTestId } = render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			expect(getByTestId('has-flow-helpers')).toHaveTextContent('yes');
		});

		it('should initialize flow context', async () => {
			const { getByTestId } = render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await act(async () => {
				getByTestId('init-flow').click();
			});

			expect(mockFlowContextUtils.initializeOAuthFlow).toHaveBeenCalledWith(
				'test-flow',
				1,
				{},
				undefined
			);
		});

		it('should complete flow', async () => {
			const { getByTestId } = render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await act(async () => {
				getByTestId('complete-flow').click();
			});

			expect(mockFlowContextUtils.completeFlow).toHaveBeenCalledWith('test-flow');
		});
	});

	describe('Enhanced Callback Handling', () => {
		// Shared setup for handleCallback tests: provide credentials and a successful token exchange
		const mockTokenResponse = {
			access_token: 'mock-access-token',
			token_type: 'Bearer',
			expires_in: 3600,
		};

		const callbackCredentials = JSON.stringify({
			clientId: 'test-client-id',
			environmentId: 'test-env-123',
			redirectUri: 'https://localhost:3000/authz-callback',
		});

		beforeEach(() => {
			// Provide credentials via flowContext so handleCallback can build the token request
			mockSessionStorage.store['flowContext'] = callbackCredentials;
			// Also store credentials in localStorage for tests that override flowContext
			mockLocalStorage.store['pingone_authz_flow_credentials'] = JSON.stringify({
				clientId: 'test-client-id',
				environmentId: 'test-env-123',
				redirectUri: 'https://localhost:3000/authz-callback',
			});
			// Mock fetch to return a successful token exchange response
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: true,
					json: () => Promise.resolve(mockTokenResponse),
					headers: { entries: () => [] },
					status: 200,
					statusText: 'OK',
				})
			);
		});

		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it('should use FlowContextUtils for callback handling', async () => {
			let authContext: any;

			const TestCallbackComponent: React.FC = () => {
				authContext = useAuth();
				return <div>Test</div>;
			};

			render(
				<AuthProvider>
					<TestCallbackComponent />
				</AuthProvider>
			);

			// Simulate OAuth callback
			const callbackUrl = 'https://localhost:3000/authz-callback?code=test-code&state=test-state';

			await act(async () => {
				const result = await authContext.handleCallback(callbackUrl);
				expect(result.success).toBe(true);
				expect(result.redirectUrl).toBe('/flows/test-flow');
			});

			expect(mockFlowContextUtils.handleOAuthCallback).toHaveBeenCalledWith({
				code: 'test-code',
				state: 'test-state',
				error: null,
				error_description: null,
				session_state: null,
				iss: null,
			});
		});

		it('should handle FlowContextUtils errors gracefully', async () => {
			// Mock FlowContextUtils to throw an error
			mockFlowContextUtils.handleOAuthCallback.mockImplementation(() => {
				throw new Error('FlowContextService error');
			});

			// Mock legacy flow context — include credentials so token exchange can proceed
			mockSessionStorage.store['flowContext'] = JSON.stringify({
				returnPath: '/flows/legacy-flow',
				flowType: 'legacy',
				clientId: 'test-client-id',
				environmentId: 'test-env-123',
				redirectUri: 'https://localhost:3000/authz-callback',
			});

			let authContext: any;

			const TestCallbackComponent: React.FC = () => {
				authContext = useAuth();
				return <div>Test</div>;
			};

			render(
				<AuthProvider>
					<TestCallbackComponent />
				</AuthProvider>
			);

			const callbackUrl = 'https://localhost:3000/authz-callback?code=test-code&state=test-state';

			await act(async () => {
				const result = await authContext.handleCallback(callbackUrl);
				expect(result.success).toBe(true);
				expect(result.redirectUrl).toBe('/flows/legacy-flow');
			});

			// Should have attempted FlowContextUtils first
			expect(mockFlowContextUtils.handleOAuthCallback).toHaveBeenCalled();
		});

		it('should fallback to dashboard for invalid flow context', async () => {
			// Mock FlowContextUtils to throw an error
			mockFlowContextUtils.handleOAuthCallback.mockImplementation(() => {
				throw new Error('FlowContextService error');
			});

			// Mock invalid flow context
			mockSessionStorage.store['flowContext'] = 'invalid-json';

			let authContext: any;

			const TestCallbackComponent: React.FC = () => {
				authContext = useAuth();
				return <div>Test</div>;
			};

			render(
				<AuthProvider>
					<TestCallbackComponent />
				</AuthProvider>
			);

			const callbackUrl = 'https://localhost:3000/authz-callback?code=test-code&state=test-state';

			await act(async () => {
				const result = await authContext.handleCallback(callbackUrl);
				expect(result.success).toBe(true);
				expect(result.redirectUrl).toBe('/dashboard');
			});
		});

		it('should handle OAuth errors in callback', async () => {
			let authContext: any;

			const TestCallbackComponent: React.FC = () => {
				authContext = useAuth();
				return <div>Test</div>;
			};

			render(
				<AuthProvider>
					<TestCallbackComponent />
				</AuthProvider>
			);

			const callbackUrl =
				'https://localhost:3000/authz-callback?error=access_denied&error_description=User%20denied%20access';

			await act(async () => {
				const result = await authContext.handleCallback(callbackUrl);
				expect(result.success).toBe(false);
				expect(result.error).toBe('User denied access');
			});
		});
	});

	describe('Enhanced Logout', () => {
		it('should cleanup flow context during logout', async () => {
			let authContext: any;

			const TestLogoutComponent: React.FC = () => {
				authContext = useAuth();
				return <div>Test</div>;
			};

			render(
				<AuthProvider>
					<TestLogoutComponent />
				</AuthProvider>
			);

			await act(async () => {
				authContext.logout();
			});

			expect(mockFlowContextUtils.emergencyCleanup).toHaveBeenCalled();
		});

		it('should handle flow cleanup errors gracefully', async () => {
			// Mock emergency cleanup to throw an error
			mockFlowContextUtils.emergencyCleanup.mockImplementation(() => {
				throw new Error('Cleanup error');
			});

			let authContext: any;

			const TestLogoutComponent: React.FC = () => {
				authContext = useAuth();
				return <div>Test</div>;
			};

			render(
				<AuthProvider>
					<TestLogoutComponent />
				</AuthProvider>
			);

			// Should not throw error
			await act(async () => {
				expect(() => authContext.logout()).not.toThrow();
			});

			expect(mockFlowContextUtils.emergencyCleanup).toHaveBeenCalled();
		});
	});

	describe('Security Features', () => {
		// Security tests override flowContext but still need credentials + token exchange to proceed
		const mockTokenResponse = {
			access_token: 'mock-access-token',
			token_type: 'Bearer',
			expires_in: 3600,
		};

		beforeEach(() => {
			// Store credentials in localStorage so credential manager fallback works
			// when flowContext is overridden with non-credential content
			mockLocalStorage.store['pingone_authz_flow_credentials'] = JSON.stringify({
				clientId: 'test-client-id',
				environmentId: 'test-env-123',
				redirectUri: 'https://localhost:3000/authz-callback',
			});
			// Mock fetch for token exchange
			vi.stubGlobal(
				'fetch',
				vi.fn().mockResolvedValue({
					ok: true,
					json: () => Promise.resolve(mockTokenResponse),
					headers: { entries: () => [] },
					status: 200,
					statusText: 'OK',
				})
			);
		});

		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it('should reject dangerous flow context content', async () => {
			// Mock FlowContextUtils to throw an error to test fallback
			mockFlowContextUtils.handleOAuthCallback.mockImplementation(() => {
				throw new Error('FlowContextService error');
			});

			// Mock dangerous flow context
			mockSessionStorage.store['flowContext'] = JSON.stringify({
				returnPath: 'javascript:alert("xss")',
				flowType: 'malicious',
			});

			let authContext: any;

			const TestCallbackComponent: React.FC = () => {
				authContext = useAuth();
				return <div>Test</div>;
			};

			render(
				<AuthProvider>
					<TestCallbackComponent />
				</AuthProvider>
			);

			const callbackUrl = 'https://localhost:3000/authz-callback?code=test-code&state=test-state';

			await act(async () => {
				const result = await authContext.handleCallback(callbackUrl);
				expect(result.success).toBe(true);
				expect(result.redirectUrl).toBe('/dashboard'); // Should fallback to safe default
			});
		});

		it('should reject oversized flow context', async () => {
			// Mock FlowContextUtils to throw an error to test fallback
			mockFlowContextUtils.handleOAuthCallback.mockImplementation(() => {
				throw new Error('FlowContextService error');
			});

			// Mock oversized flow context
			const largeContext = {
				returnPath: '/flows/test',
				flowType: 'test',
				largeData: 'x'.repeat(15000), // Large data
			};
			mockSessionStorage.store['flowContext'] = JSON.stringify(largeContext);

			let authContext: any;

			const TestCallbackComponent: React.FC = () => {
				authContext = useAuth();
				return <div>Test</div>;
			};

			render(
				<AuthProvider>
					<TestCallbackComponent />
				</AuthProvider>
			);

			const callbackUrl = 'https://localhost:3000/authz-callback?code=test-code&state=test-state';

			await act(async () => {
				const result = await authContext.handleCallback(callbackUrl);
				expect(result.success).toBe(true);
				expect(result.redirectUrl).toBe('/dashboard'); // Should fallback to safe default
			});
		});
	});
});
