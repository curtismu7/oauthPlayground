/**
 * @file V7MPages.test.tsx
 * @module v7/pages/__tests__
 * @description Tests for V7M page components — verifies V9CredentialStorageService
 * and CompactAppPickerV8U wiring for all 5 flow pages.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Mock CompactAppPickerV8U ─────────────────────────────────────────────────
vi.mock('../../../v8u/components/CompactAppPickerV8U', () => ({
	CompactAppPickerV8U: ({ onAppSelected }: { onAppSelected: (app: { id: string; name: string }) => void }) => (
		<button
			type="button"
			data-testid="mock-app-picker"
			onClick={() => onAppSelected({ id: 'test-client-id', name: 'Test App' })}
		>
			Select App
		</button>
	),
}));

// ─── Mock V9CredentialStorageService ─────────────────────────────────────────
const { mockLoadSync, mockSave } = vi.hoisted(() => ({
	mockLoadSync: vi.fn().mockReturnValue({ clientId: '' }),
	mockSave: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../services/v9/V9CredentialStorageService', () => ({
	V9CredentialStorageService: {
		loadSync: mockLoadSync,
		save: mockSave,
	},
}));

// ─── Mock V7M services (they use sessionStorage which is limited in jsdom) ────
vi.mock('../../../services/v7m/V7MStateStore', () => ({
	V7MStateStore: {
		clearAll: vi.fn(),
		storeAuthorizationCode: vi.fn().mockReturnValue('mock-auth-code'),
		getAuthorizationCode: vi.fn().mockReturnValue(null),
		redeemAuthorizationCode: vi.fn().mockReturnValue(null),
		storeToken: vi.fn(),
		getToken: vi.fn().mockReturnValue(null),
		storeDeviceCode: vi.fn().mockReturnValue({ device_code: 'dev-code', user_code: 'USER-CODE', verification_uri: '/activate', expires_in: 300, interval: 5 }),
		getDeviceCode: vi.fn().mockReturnValue(null),
		approveDeviceCode: vi.fn().mockReturnValue(null),
		cleanupExpired: vi.fn(),
	},
}));

vi.mock('../../../services/v7m/V7MTokenService', () => ({
	tokenExchangeClientCredentials: vi.fn().mockReturnValue({ access_token: 'mock-at', token_type: 'Bearer', expires_in: 3600, scope: 'read write' }),
	tokenExchangeAuthorizationCode: vi.fn().mockReturnValue({ access_token: 'mock-at', token_type: 'Bearer', expires_in: 900 }),
	tokenExchangePassword: vi.fn().mockReturnValue({ access_token: 'mock-at', token_type: 'Bearer', expires_in: 3600 }),
	tokenExchangeDeviceCode: vi.fn().mockReturnValue({ access_token: 'mock-at', token_type: 'Bearer', expires_in: 3600 }),
}));

vi.mock('../../../services/v7m/V7MAuthorizeService', () => ({
	authorizeIssueCode: vi.fn().mockReturnValue({ code: 'mock-code', state: 'test-state' }),
}));

vi.mock('../../../services/v7m/V7MUserInfoService', () => ({
	getUserInfoFromAccessToken: vi.fn().mockReturnValue({ sub: 'user-123', email: 'test@example.com' }),
}));

vi.mock('../../../services/v7m/V7MIntrospectionService', () => ({
	introspectToken: vi.fn().mockReturnValue({ active: true, client_id: 'v7m-client', scope: 'read write' }),
}));

vi.mock('../../../services/v7m/core/V7MPKCEGenerationService', () => ({
	V7MPKCEGenerationService: {
		generateCodeVerifier: vi.fn().mockReturnValue('mock-verifier'),
		generateCodeChallenge: vi.fn().mockResolvedValue({ codeChallenge: 'mock-challenge', codeChallengeMethod: 'S256' }),
	},
}));

vi.mock('../../../v8u/services/pkceStorageServiceV8U', () => ({
	PKCEStorageServiceV8U: {
		savePKCECodes: vi.fn(),
		loadPKCECodes: vi.fn().mockReturnValue(null),
	},
}));

vi.mock('../../../components/ColoredUrlDisplay', () => ({
	default: ({ url }: { url: string }) => <span data-testid="colored-url">{url}</span>,
}));

// ─── Import pages after mocks ─────────────────────────────────────────────────
import { V7MClientCredentials } from '../V7MClientCredentials';
import { V7MROPC } from '../V7MROPC';
import { V7MOAuthAuthCode } from '../V7MOAuthAuthCode';
import { V7MDeviceAuthorization } from '../V7MDeviceAuthorization';
import { V7MImplicitFlow } from '../V7MImplicitFlow';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('V7M Page Components — V9 Wiring', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockLoadSync.mockReturnValue({ clientId: '' });
	});

	// ── V7MClientCredentials ───────────────────────────────────────────────

	describe('V7MClientCredentials', () => {
		it('renders without crashing', () => {
			render(<V7MClientCredentials />);
			expect(screen.getByText(/V7M Client Credentials/i)).toBeInTheDocument();
		});

		it('renders CompactAppPickerV8U', () => {
			render(<V7MClientCredentials />);
			expect(screen.getByTestId('mock-app-picker')).toBeInTheDocument();
		});

		it('calls loadSync on mount with correct key', () => {
			render(<V7MClientCredentials />);
			expect(mockLoadSync).toHaveBeenCalledWith('v7m-client-credentials');
		});

		it('loads saved clientId on mount', () => {
			mockLoadSync.mockReturnValue({ clientId: 'saved-client-id' });
			render(<V7MClientCredentials />);
			const clientIdInput = screen.getAllByDisplayValue('saved-client-id')[0];
			expect(clientIdInput).toBeInTheDocument();
		});

		it('updates clientId and calls save when app selected', async () => {
			render(<V7MClientCredentials />);
			fireEvent.click(screen.getByTestId('mock-app-picker'));
			await waitFor(() => {
				expect(mockSave).toHaveBeenCalledWith('v7m-client-credentials', { clientId: 'test-client-id' });
			});
			expect(screen.getAllByDisplayValue('test-client-id')[0]).toBeInTheDocument();
		});

		it('renders Request Access Token button', () => {
			render(<V7MClientCredentials />);
			expect(screen.getByRole('button', { name: /Request Access Token/i })).toBeInTheDocument();
		});
	});

	// ── V7MROPC ────────────────────────────────────────────────────────────

	describe('V7MROPC', () => {
		it('renders without crashing (OAuth variant)', () => {
			render(<V7MROPC oidc={false} title="V7M ROPC" />);
			expect(screen.getByText(/V7M ROPC/i)).toBeInTheDocument();
		});

		it('renders without crashing (OIDC variant)', () => {
			render(<V7MROPC oidc={true} title="V7M OIDC ROPC" />);
			expect(screen.getByText(/V7M OIDC ROPC/i)).toBeInTheDocument();
		});

		it('renders CompactAppPickerV8U', () => {
			render(<V7MROPC oidc={false} title="V7M ROPC" />);
			expect(screen.getByTestId('mock-app-picker')).toBeInTheDocument();
		});

		it('calls loadSync on mount with correct key', () => {
			render(<V7MROPC oidc={false} title="V7M ROPC" />);
			expect(mockLoadSync).toHaveBeenCalledWith('v7m-ropc');
		});

		it('updates clientId and saves when app selected', async () => {
			render(<V7MROPC oidc={false} title="V7M ROPC" />);
			fireEvent.click(screen.getByTestId('mock-app-picker'));
			await waitFor(() => {
				expect(mockSave).toHaveBeenCalledWith('v7m-ropc', { clientId: 'test-client-id' });
			});
		});
	});

	// ── V7MOAuthAuthCode ───────────────────────────────────────────────────

	describe('V7MOAuthAuthCode', () => {
		it('renders without crashing (OAuth variant)', () => {
			render(<V7MOAuthAuthCode oidc={false} title="V7M Auth Code" />);
			expect(screen.getByText(/V7M Auth Code/i)).toBeInTheDocument();
		});

		it('renders without crashing (OIDC variant)', () => {
			render(<V7MOAuthAuthCode oidc={true} title="V7M OIDC Auth Code" />);
			expect(screen.getByText(/V7M OIDC Auth Code/i)).toBeInTheDocument();
		});

		it('renders CompactAppPickerV8U', () => {
			render(<V7MOAuthAuthCode oidc={false} title="V7M Auth Code" />);
			expect(screen.getByTestId('mock-app-picker')).toBeInTheDocument();
		});

		it('calls loadSync on mount with correct key', () => {
			render(<V7MOAuthAuthCode oidc={false} title="V7M Auth Code" />);
			expect(mockLoadSync).toHaveBeenCalledWith('v7m-auth-code');
		});

		it('saves clientId when app selected', async () => {
			render(<V7MOAuthAuthCode oidc={false} title="V7M Auth Code" />);
			fireEvent.click(screen.getByTestId('mock-app-picker'));
			await waitFor(() => {
				expect(mockSave).toHaveBeenCalledWith('v7m-auth-code', { clientId: 'test-client-id' });
			});
		});
	});

	// ── V7MDeviceAuthorization ─────────────────────────────────────────────

	describe('V7MDeviceAuthorization', () => {
		it('renders without crashing', () => {
			render(<V7MDeviceAuthorization />);
			expect(screen.getByText(/V7M Device Authorization/i)).toBeInTheDocument();
		});

		it('renders CompactAppPickerV8U', () => {
			render(<V7MDeviceAuthorization />);
			expect(screen.getByTestId('mock-app-picker')).toBeInTheDocument();
		});

		it('calls loadSync on mount with correct key', () => {
			render(<V7MDeviceAuthorization />);
			expect(mockLoadSync).toHaveBeenCalledWith('v7m-device-authorization');
		});

		it('saves clientId when app selected', async () => {
			render(<V7MDeviceAuthorization />);
			fireEvent.click(screen.getByTestId('mock-app-picker'));
			await waitFor(() => {
				expect(mockSave).toHaveBeenCalledWith('v7m-device-authorization', { clientId: 'test-client-id' });
			});
		});
	});

	// ── V7MImplicitFlow ────────────────────────────────────────────────────

	describe('V7MImplicitFlow', () => {
		it('renders without crashing (OAuth variant)', () => {
			render(<V7MImplicitFlow oidc={false} title="V7M Implicit" />);
			expect(screen.getByText(/V7M Implicit/i)).toBeInTheDocument();
		});

		it('renders without crashing (OIDC variant)', () => {
			render(<V7MImplicitFlow oidc={true} title="V7M OIDC Implicit" />);
			expect(screen.getByText(/V7M OIDC Implicit/i)).toBeInTheDocument();
		});

		it('renders CompactAppPickerV8U', () => {
			render(<V7MImplicitFlow oidc={false} title="V7M Implicit" />);
			expect(screen.getByTestId('mock-app-picker')).toBeInTheDocument();
		});

		it('calls loadSync on mount with correct key', () => {
			render(<V7MImplicitFlow oidc={false} title="V7M Implicit" />);
			expect(mockLoadSync).toHaveBeenCalledWith('v7m-implicit');
		});

		it('saves clientId when app selected', async () => {
			render(<V7MImplicitFlow oidc={false} title="V7M Implicit" />);
			fireEvent.click(screen.getByTestId('mock-app-picker'));
			await waitFor(() => {
				expect(mockSave).toHaveBeenCalledWith('v7m-implicit', { clientId: 'test-client-id' });
			});
		});
	});
});
