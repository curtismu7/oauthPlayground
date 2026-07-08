/**
 * @file toastNotificationsV8.test.ts
 * @module v8/utils/__tests__
 * @description Tests for V8 Toast Notification Service
 * @version 8.0.0
 * @since 2024-11-16
 */

import { vi } from 'vitest';
import { toastV8 } from '../toastNotificationsV8';

// Mock the modernMessaging service used by toastNotificationsV8
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

describe('ToastNotificationsV8', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'log').mockImplementation();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('success()', () => {
		it('should show success notification', () => {
			toastV8.success('Test success message');

			expect(mockShowFooterMessage).toHaveBeenCalledWith({
				type: 'info',
				message: 'Test success message',
				duration: 3000,
			});
		});

		it('should show success notification with custom duration', () => {
			toastV8.success('Test message', { duration: 5000 });

			expect(mockShowFooterMessage).toHaveBeenCalledWith({
				type: 'info',
				message: 'Test message',
				duration: 5000,
			});
		});

		it('should log success message', () => {
			toastV8.success('Test message');

			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('[🔔 TOAST-V8]'),
				'Test message'
			);
		});
	});

	describe('error()', () => {
		it('should show error notification', () => {
			toastV8.error('Test error message');

			expect(mockShowBanner).toHaveBeenCalledWith({
				type: 'error',
				title: 'Error',
				message: 'Test error message',
				dismissible: true,
			});
		});

		it('should log error message', () => {
			toastV8.error('Test error');

			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('[🔔 TOAST-V8]'),
				'Test error'
			);
		});
	});

	describe('warning()', () => {
		it('should show warning notification', () => {
			toastV8.warning('Test warning message');

			expect(mockShowBanner).toHaveBeenCalledWith({
				type: 'warning',
				title: 'Warning',
				message: 'Test warning message',
				dismissible: true,
			});
		});

		it('should log warning message', () => {
			toastV8.warning('Test warning');

			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('[🔔 TOAST-V8]'),
				'Test warning'
			);
		});
	});

	describe('info()', () => {
		it('should show info notification', () => {
			toastV8.info('Test info message');

			expect(mockShowFooterMessage).toHaveBeenCalledWith({
				type: 'info',
				message: 'Test info message',
				duration: 3000,
			});
		});

		it('should log info message', () => {
			toastV8.info('Test info');

			expect(console.log).toHaveBeenCalledWith(
				expect.stringContaining('[🔔 TOAST-V8]'),
				'Test info'
			);
		});
	});

	describe('Specialized Methods', () => {
		describe('copiedToClipboard()', () => {
			it('should show copy success notification', () => {
				toastV8.copiedToClipboard('Authorization URL');

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Authorization URL copied to clipboard',
					duration: 3000,
				});
			});
		});

		describe('validationError()', () => {
			it('should show validation error with single field', () => {
				toastV8.validationError(['Client ID']);

				expect(mockShowBanner).toHaveBeenCalledWith({
					type: 'error',
					title: 'Error',
					message: 'Please fill in required fields: Client ID',
					dismissible: true,
				});
			});

			it('should show validation error with multiple fields', () => {
				toastV8.validationError(['Client ID', 'Redirect URI', 'Scopes']);

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
				toastV8.networkError('token exchange');

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
				toastV8.stepCompleted(1);

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Step 1 completed',
					duration: 3000,
				});
			});

			it('should show step completed for different step numbers', () => {
				toastV8.stepCompleted(3);

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Step 3 completed',
					duration: 3000,
				});
			});
		});

		describe('flowCompleted()', () => {
			it('should show flow completed notification with 8 second duration', () => {
				toastV8.flowCompleted();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: '🎉 OAuth Flow Complete!',
					duration: 8000,
				});
			});
		});

		describe('processing()', () => {
			it('should show processing notification', () => {
				toastV8.processing('Exchanging authorization code for tokens');

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Exchanging authorization code for tokens...',
					duration: 3000,
				});
			});
		});

		describe('credentialsSaved()', () => {
			it('should show credentials saved notification', () => {
				toastV8.credentialsSaved();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Credentials saved successfully',
					duration: 3000,
				});
			});
		});

		describe('credentialsLoaded()', () => {
			it('should show credentials loaded notification', () => {
				toastV8.credentialsLoaded();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Credentials loaded successfully',
					duration: 3000,
				});
			});
		});

		describe('pkceGenerated()', () => {
			it('should show PKCE generated notification', () => {
				toastV8.pkceGenerated();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'PKCE parameters generated successfully',
					duration: 3000,
				});
			});
		});

		describe('authUrlGenerated()', () => {
			it('should show auth URL generated notification', () => {
				toastV8.authUrlGenerated();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Authorization URL generated successfully',
					duration: 3000,
				});
			});
		});

		describe('tokenExchangeSuccess()', () => {
			it('should show token exchange success notification', () => {
				toastV8.tokenExchangeSuccess();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Tokens exchanged successfully',
					duration: 3000,
				});
			});
		});

		describe('tokenIntrospectionSuccess()', () => {
			it('should show token introspection success notification', () => {
				toastV8.tokenIntrospectionSuccess();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Token introspection completed successfully',
					duration: 3000,
				});
			});
		});

		describe('userInfoFetched()', () => {
			it('should show user info fetched notification', () => {
				toastV8.userInfoFetched();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'User information retrieved successfully',
					duration: 3000,
				});
			});
		});

		describe('appDiscoverySuccess()', () => {
			it('should show app discovery success notification', () => {
				toastV8.appDiscoverySuccess();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Application discovered successfully',
					duration: 3000,
				});
			});
		});

		describe('configurationChecked()', () => {
			it('should show configuration checked notification', () => {
				toastV8.configurationChecked();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Configuration check completed',
					duration: 3000,
				});
			});
		});

		describe('flowReset()', () => {
			it('should show flow reset notification', () => {
				toastV8.flowReset();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Flow reset. Tokens cleared, credentials preserved.',
					duration: 3000,
				});
			});
		});

		describe('scopeRequired()', () => {
			it('should show scope required warning', () => {
				toastV8.scopeRequired('openid');

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
				toastV8.discoveryEndpointLoaded();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Discovery endpoint loaded successfully',
					duration: 3000,
				});
			});
		});

		describe('environmentIdExtracted()', () => {
			it('should show environment ID extracted notification', () => {
				toastV8.environmentIdExtracted();

				expect(mockShowFooterMessage).toHaveBeenCalledWith({
					type: 'info',
					message: 'Environment ID extracted from discovery',
					duration: 3000,
				});
			});
		});
	});
});
