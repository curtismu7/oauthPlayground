/**
 * @file toastNotificationsV8.test.ts
 * @module v8/utils/__tests__
 * @description Tests for V8 Toast Notification Service
 * @version 8.0.0
 * @since 2024-11-16
 */

import { v4ToastManager } from '@/utils/v4ToastMessages';
import { toastV8 } from '../toastNotificationsV8';

// Mock the v4ToastManager
jest.mock('@/utils/v4ToastMessages', () => ({
	v4ToastManager: {
		showSuccess: jest.fn(),
		showError: jest.fn(),
		showWarning: jest.fn(),
		showInfo: jest.fn(),
	},
}));

describe('ToastNotificationsV8', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, 'log').mockImplementation();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('success()', () => {
		it('should show success notification', () => {
			toastV8.success('Test success message');

			expect(v4ToastManager.showSuccess).toHaveBeenCalledWith(
				'Test success message',
				{},
				undefined
			);
		});

		it('should show success notification with custom duration', () => {
			toastV8.success('Test message', { duration: 5000 });

			expect(v4ToastManager.showSuccess).toHaveBeenCalledWith(
				'Test message',
				{},
				{ duration: 5000 }
			);
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

			expect(v4ToastManager.showError).toHaveBeenCalledWith('Test error message');
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

			expect(v4ToastManager.showWarning).toHaveBeenCalledWith('Test warning message');
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

			expect(v4ToastManager.showInfo).toHaveBeenCalledWith('Test info message');
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

				expect(v4ToastManager.showSuccess).toHaveBeenCalledWith(
					'Authorization URL copied to clipboard',
					{},
					undefined
				);
			});
		});

		describe('validationError()', () => {
			it('should show validation error with single field', () => {
				toastV8.validationError(['Client ID']);

				expect(v4ToastManager.showError).toHaveBeenCalledWith(
					'Please fill in required fields: Client ID'
				);
			});

			it('should show validation error with multiple fields', () => {
				toastV8.validationError(['Client ID', 'Redirect URI', 'Scopes']);

				expect(v4ToastManager.showError).toHaveBeenCalledWith(
					'Please fill in required fields: Client ID, Redirect URI, Scopes'
				);
			});
		});

		describe('networkError()', () => {
			it('should show network error notification', () => {
				toastV8.networkError('token exchange');

				expect(v4ToastManager.showError).toHaveBeenCalledWith(
					'Network error during token exchange. Please check your connection.'
				);
			});
		});

		describe('stepCompleted()', () => {
			it('should show step completed notification', () => {
				toastV8.stepCompleted(1);

				expect(v4ToastManager.showSuccess).toHaveBeenCalledWith('Step 1 completed', {}, undefined);
			});

			it('should show step completed for different step numbers', () => {
				toastV8.stepCompleted(3);

				expect(v4ToastManager.showSuccess).toHaveBeenCalledWith('Step 3 completed', {}, undefined);
			});
		});

		describe('flowCompleted()', () => {
			it('should show flow completed notification with 8 second duration', () => {
				toastV8.flowCompleted();

				expect(v4ToastManager.showSuccess).toHaveBeenCalledWith(
					'🎉 OAuth Flow Complete!',
					{},
					{ duration: 8000 }
				);
			});
		});

		describe('processing()', () => {
			it('should show processing notification', () => {
				toastV8.processing('Exchanging authorization code for tokens');

				expect(v4ToastManager.showInfo).toHaveBeenCalledWith(
					'Exchanging authorization code for tokens...'
				);
			});
		});

		describe('credentialsSaved()', () => {
			it('should show credentials saved notification', () => {
				toastV8.credentialsSaved();

				expect(v4ToastManager.showSuccess).toHaveBeenCalledWith(
					'Credentials saved successfully',
					{},
					undefined
				);
			});
		});

		describe('credentialsLoaded()', () => {
			it('should show credentials loaded notification', () => {
				toastV8.credentialsLoaded();

				expect(v4ToastManager.showSuccess).toHaveBeenCalledWith(
					'Credentials loaded successfully',
					{},
					undefined
				);
			});
		});

		describe('pkceGenerated()', () => {
			it('should show PKCE generated notification', () => {
				toastV8.pkceGenerated();

				expect(v4ToastManager.showSuccess).toHaveBeenCalledWith(
					'PKCE parameters generated successfully',
					{},
					undefined
				);
			});
		});

		describe('authUrlGenerated()', () => {
			it('should show auth URL generated notification', () => {
				toastV8.authUrlGenerated();

				expect(v4ToastManager.showSuccess).toHaveBeenCalledWith(
					'Authorization URL generated successfully',
					{},
					undefined
				);
			});
		});

		describe('tokenExchangeSuccess()', () => {
			it('should show token exchange success notification', () => {
				toastV8.tokenExchangeSuccess();

				expect(v4ToastManager.showSuccess).toHaveBeenCalledWith(
					'Tokens exchanged successfully',
					{},
					undefined
				);
			});
		});

		describe('tokenIntrospectionSuccess()', () => {
			it('should show token introspection success notification', () => {
				toastV8.tokenIntrospectionSuccess();

				expect(v4ToastManager.showSuccess).toHaveBeenCalledWith(
					'Token introspection completed successfully',
					{},
					undefined
				);
			});
		});

		describe('userInfoFetched()', () => {
			it('should show user info fetched notification', () => {
				toastV8.userInfoFetched();

				expect(v4ToastManager.showSuccess).toHaveBeenCalledWith(
					'User information retrieved successfully',
					{},
					undefined
				);
			});
		});

		describe('appDiscoverySuccess()', () => {
			it('should show app discovery success notification', () => {
				toastV8.appDiscoverySuccess();

				expect(v4ToastManager.showSuccess).toHaveBeenCalledWith(
					'Application discovered successfully',
					{},
					undefined
				);
			});
		});

		describe('configurationChecked()', () => {
			it('should show configuration checked notification', () => {
				toastV8.configurationChecked();

				expect(v4ToastManager.showSuccess).toHaveBeenCalledWith(
					'Configuration check completed',
					{},
					undefined
				);
			});
		});

		describe('flowReset()', () => {
			it('should show flow reset notification', () => {
				toastV8.flowReset();

				expect(v4ToastManager.showSuccess).toHaveBeenCalledWith(
					'Flow reset. Tokens cleared, credentials preserved.',
					{},
					undefined
				);
			});
		});

		describe('scopeRequired()', () => {
			it('should show scope required warning', () => {
				toastV8.scopeRequired('openid');

				expect(v4ToastManager.showWarning).toHaveBeenCalledWith(
					'Added required "openid" scope for compliance'
				);
			});
		});

		describe('discoveryEndpointLoaded()', () => {
			it('should show discovery endpoint loaded notification', () => {
				toastV8.discoveryEndpointLoaded();

				expect(v4ToastManager.showSuccess).toHaveBeenCalledWith(
					'Discovery endpoint loaded successfully',
					{},
					undefined
				);
			});
		});

		describe('environmentIdExtracted()', () => {
			it('should show environment ID extracted notification', () => {
				toastV8.environmentIdExtracted();

				expect(v4ToastManager.showSuccess).toHaveBeenCalledWith(
					'Environment ID extracted from discovery',
					{},
					undefined
				);
			});
		});
	});
});
