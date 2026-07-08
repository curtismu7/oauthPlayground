/**
 * @file toastNotifications.test.ts
 * @module v8/utils/__tests__
 * @description Tests for V8 Toast Notification Service
 * @version 8.0.0
 * @since 2024-11-16
 */

import { vi } from 'vitest';
import { toast } from '../toastNotifications';

// Mock the modernMessaging service used by toastNotifications
// Use vi.hoisted so mock fns are available before vi.mock factory runs
const { mockShowFooterMessage, mockShowBanner } = vi.hoisted(() => ({
	mockShowFooterMessage: vi.fn(),
	mockShowBanner: vi.fn(),
}));

vi.mock('@/platform/ModernMessagingService', () => ({
	modernMessaging: {
		showFooterMessage: mockShowFooterMessage,
		showBanner: mockShowBanner,
	},
}));

describe('ToastNotifications', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'log').mockImplementation();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('success()', () => {
		it('should show success notification', () => {
			toast.success('Test success message');

			expect(mockShowFooterMessage).toHaveBeenCalledWith({
				type: 'info',
				message: 'Test success message',
				duration: 3000,
			});
		});

		it('should show success notification with custom duration', () => {
			toast.success('Test message', { duration: 5000 });

			expect(mockShowFooterMessage).toHaveBeenCalledWith({
				type: 'info',
				message: 'Test message',
				duration: 5000,
			});
		});

		it('should log success message', () => {
			toast.success('Test message');

			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('[🔔 TOAST-V8]'),
				'Test message'
			);
		});
	});

	describe('error()', () => {
		it('should show error notification', () => {
			toast.error('Test error message');

			expect(mockShowBanner).toHaveBeenCalledWith({
				type: 'error',
				title: 'Error',
				message: 'Test error message',
				dismissible: true,
			});
		});

		it('should log error message', () => {
			toast.error('Test error');

			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('[🔔 TOAST-V8]'),
				'Test error'
			);
		});
	});

	describe('warning()', () => {
		it('should show warning notification', () => {
			toast.warning('Test warning message');

			expect(mockShowBanner).toHaveBeenCalledWith({
				type: 'warning',
				title: 'Warning',
				message: 'Test warning message',
				dismissible: true,
			});
		});

		it('should log warning message', () => {
			toast.warning('Test warning');

			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('[🔔 TOAST-V8]'),
				'Test warning'
			);
		});
	});

	describe('info()', () => {
		it('should show info notification', () => {
			toast.info('Test info message');

			expect(mockShowFooterMessage).toHaveBeenCalledWith({
				type: 'info',
				message: 'Test info message',
				duration: 3000,
			});
		});

		it('should log info message', () => {
			toast.info('Test info');

			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('[🔔 TOAST-V8]'),
				'Test info'
			);
		});
	});

	describe('Specialized Methods', () => {
		describe('copiedToClipboard()', () => {
			it('should show copy success notification', () => {
				toast.copiedToClipboard('Authorization URL');

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Authorization URL copied to clipboard',
					duration: 3000,
				});
			});
		});

		describe('validationError()', () => {
			it('should show validation error with single field', () => {
				toast.validationError(['Client ID']);

				expect(mockShowBanner).toHaveBeenCalledWith({
					type: 'error',
					title: 'Error',
					message: 'Please fill in required fields: Client ID',
					dismissible: true,
				});
			});

			it('should show validation error with multiple fields', () => {
				toast.validationError(['Client ID', 'Redirect URI', 'Scopes']);

				expect(mockShowBanner).toHaveBeenCalledWith({
					type: 'error',
					title: 'Error',
					message: 'Please fill in required fields: Client ID, Redirect URI, Scopes',
					dismissible: true,
				});
			});
		});

		describe('networkError()', () => {
			it('should show network error notification', () => {
				toast.networkError('token exchange');

				expect(mockShowBanner).toHaveBeenCalledWith({
					type: 'error',
					title: 'Error',
					message: 'Network error during token exchange. Please check your connection.',
					dismissible: true,
				});
			});
		});

		describe('stepCompleted()', () => {
			it('should show step completed notification', () => {
				toast.stepCompleted(1);

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Step 1 completed',
					duration: 3000,
				});
			});

			it('should show step completed for different step numbers', () => {
				toast.stepCompleted(3);

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Step 3 completed',
					duration: 3000,
				});
			});
		});

		describe('flowCompleted()', () => {
			it('should show flow completed notification with 8 second duration', () => {
				toast.flowCompleted();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: '🎉 OAuth Flow Complete!',
					duration: 8000,
				});
			});
		});

		describe('processing()', () => {
			it('should show processing notification', () => {
				toast.processing('Exchanging authorization code for tokens');

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Exchanging authorization code for tokens...',
					duration: 3000,
				});
			});
		});

		describe('credentialsSaved()', () => {
			it('should show credentials saved notification', () => {
				toast.credentialsSaved();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Credentials saved successfully',
					duration: 3000,
				});
			});
		});

		describe('credentialsLoaded()', () => {
			it('should show credentials loaded notification', () => {
				toast.credentialsLoaded();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Credentials loaded successfully',
					duration: 3000,
				});
			});
		});

		describe('pkceGenerated()', () => {
			it('should show PKCE generated notification', () => {
				toast.pkceGenerated();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'PKCE parameters generated successfully',
					duration: 3000,
				});
			});
		});

		describe('authUrlGenerated()', () => {
			it('should show auth URL generated notification', () => {
				toast.authUrlGenerated();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Authorization URL generated successfully',
					duration: 3000,
				});
			});
		});

		describe('tokenExchangeSuccess()', () => {
			it('should show token exchange success notification', () => {
				toast.tokenExchangeSuccess();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Tokens exchanged successfully',
					duration: 3000,
				});
			});
		});

		describe('tokenIntrospectionSuccess()', () => {
			it('should show token introspection success notification', () => {
				toast.tokenIntrospectionSuccess();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Token introspection completed successfully',
					duration: 3000,
				});
			});
		});

		describe('userInfoFetched()', () => {
			it('should show user info fetched notification', () => {
				toast.userInfoFetched();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'User information retrieved successfully',
					duration: 3000,
				});
			});
		});

		describe('appDiscoverySuccess()', () => {
			it('should show app discovery success notification', () => {
				toast.appDiscoverySuccess();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Application discovered successfully',
					duration: 3000,
				});
			});
		});

		describe('configurationChecked()', () => {
			it('should show configuration checked notification', () => {
				toast.configurationChecked();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Configuration check completed',
					duration: 3000,
				});
			});
		});

		describe('flowReset()', () => {
			it('should show flow reset notification', () => {
				toast.flowReset();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Flow reset. Tokens cleared, credentials preserved.',
					duration: 3000,
				});
			});
		});

		describe('scopeRequired()', () => {
			it('should show scope required warning', () => {
				toast.scopeRequired('openid');

				expect(mockShowBanner).toHaveBeenCalledWith({
					type: 'warning',
					title: 'Warning',
					message: 'Added required "openid" scope for compliance',
					dismissible: true,
				});
			});
		});

		describe('discoveryEndpointLoaded()', () => {
			it('should show discovery endpoint loaded notification', () => {
				toast.discoveryEndpointLoaded();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Discovery endpoint loaded successfully',
					duration: 3000,
				});
			});
		});

		describe('environmentIdExtracted()', () => {
			it('should show environment ID extracted notification', () => {
				toast.environmentIdExtracted();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Environment ID extracted from discovery',
					duration: 3000,
				});
			});
		});
	});
});
