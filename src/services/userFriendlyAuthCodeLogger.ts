/**
 * @file userFriendlyAuthCodeLogger.ts
 * @description User-friendly logging for authorization code flow across all apps
 * @version 1.0.0
 * @since 2026-02-15
 *
 * Provides consistent, user-friendly logging for authorization code flow steps:
 * - Authorization URL generation
 * - Code exchange process
 * - Token fetching and validation
 * - Error handling with user-friendly messages
 */

import { logger } from '../utils/logger';

const MODULE_TAG = '[🔐 AUTH-CODE-FLOW-LOGGER]';

export interface AuthCodeFlowContext {
	app: 'oauth' | 'mfa' | 'protect-portal';
	flowId: string;
	environmentId: string;
	clientId: string;
	redirectUri: string;
}

export interface TokenExchangeContext {
	authCode: string;
	codeVerifier?: string;
	authMethod: string;
	scopes?: string;
}

export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	id_token?: string;
	scope?: string;
}

/**
 * User-friendly authorization code flow logger
 * Provides consistent logging across OAuth, MFA, and Protect Portal apps
 */
class UserFriendlyAuthCodeLoggerImpl {
	private context: AuthCodeFlowContext | null = null;

	/**
	 * Initialize logging context
	 */
	initializeContext(context: AuthCodeFlowContext): void {
		this.context = context;
		logger.info(MODULE_TAG, `🚀 Starting ${context.app.toUpperCase()} Authorization Code Flow`, {
			app: context.app,
			flowId: context.flowId,
			environmentId: context.environmentId,
			clientId: context.clientId,
			redirectUri: context.redirectUri,
		});
	}

	/**
	 * Log authorization URL generation
	 */
	logAuthorizationUrlGeneration(authUrl: string, state: string, codeChallenge: string): void {
		if (!this.context) return;

		logger.info(MODULE_TAG, '🔗 Authorization URL Generated', {
			app: this.context.app,
			flowId: this.context.flowId,
			authUrl: `${authUrl.substring(0, 100)}...`,
			state: state,
			codeChallenge: `${codeChallenge.substring(0, 20)}...`,
			userMessage: '📱 Authorization URL generated - redirecting user to login',
		});

		// User-friendly console message
		console.log(`\n🔗 [${this.context.app.toUpperCase()}] Authorization URL Generated`);
		console.log(`📱 User will be redirected to PingOne for authorization`);
		console.log(`🔑 State: ${state}`);
		console.log(`🔐 PKCE Code Challenge: ${codeChallenge.substring(0, 20)}...`);
		console.log(`🌐 Authorization URL: ${authUrl.substring(0, 100)}...\n`);
	}

	/**
	 * Log authorization code received
	 */
	logAuthorizationCodeReceived(code: string, receivedState: string, expectedState: string): void {
		if (!this.context) return;

		const isValidState = receivedState === expectedState;

		logger.info(MODULE_TAG, '✅ Authorization Code Received', {
			app: this.context.app,
			flowId: this.context.flowId,
			code: `${code.substring(0, 10)}...`,
			receivedState,
			expectedState,
			stateValid: isValidState,
			userMessage: isValidState
				? '🎉 Authorization successful! Exchanging code for tokens...'
				: '⚠️ State mismatch - security check failed',
		});

		// User-friendly console message
		console.log(`\n✅ [${this.context.app.toUpperCase()}] Authorization Code Received`);
		console.log(`🎫 Code: ${code.substring(0, 10)}...`);
		console.log(`🔑 State: ${receivedState} ${isValidState ? '✅' : '❌'}`);
		if (isValidState) {
			console.log(`🔄 Exchanging authorization code for tokens...\n`);
		} else {
			console.log(`⚠️ Security Warning: State mismatch detected!\n`);
		}
	}

	/**
	 * Log token exchange start
	 */
	logTokenExchangeStart(exchangeContext: TokenExchangeContext): void {
		if (!this.context) return;

		logger.info(MODULE_TAG, '🔄 Starting Token Exchange', {
			app: this.context.app,
			flowId: this.context.flowId,
			authCode: `${exchangeContext.authCode.substring(0, 10)}...`,
			hasCodeVerifier: !!exchangeContext.codeVerifier,
			authMethod: exchangeContext.authMethod,
			scopes: exchangeContext.scopes,
			userMessage: '🔄 Exchanging authorization code for access tokens...',
		});

		// User-friendly console message
		console.log(`\n🔄 [${this.context.app.toUpperCase()}] Token Exchange Started`);
		console.log(`🎫 Authorization Code: ${exchangeContext.authCode.substring(0, 10)}...`);
		console.log(`🔐 PKCE Verifier: ${exchangeContext.codeVerifier ? '✅ Present' : '❌ Missing'}`);
		console.log(`🔑 Auth Method: ${exchangeContext.authMethod}`);
		console.log(`📋 Scopes: ${exchangeContext.scopes || 'default'}`);
		console.log(`🌐 Token Endpoint: /api/token-exchange\n`);
	}

	/**
	 * Log token exchange request details
	 */
	logTokenExchangeRequest(requestBody: Record<string, unknown>): void {
		if (!this.context) return;

		const sanitizedBody = { ...requestBody };
		// Redact sensitive information for console display
		if (sanitizedBody.code) sanitizedBody.code = '***REDACTED***';
		if (sanitizedBody.code_verifier) sanitizedBody.code_verifier = '***REDACTED***';
		if (sanitizedBody.client_secret) sanitizedBody.client_secret = '***REDACTED***';
		if (sanitizedBody.client_assertion) sanitizedBody.client_assertion = '***REDACTED***';

		logger.debug(MODULE_TAG, '📤 Token Exchange Request', {
			app: this.context.app,
			flowId: this.context.flowId,
			requestBody: sanitizedBody,
		});

		// User-friendly console message
		console.log(`📤 [${this.context.app.toUpperCase()}] Token Exchange Request`);
		console.log(`🔑 Grant Type: ${requestBody.grant_type}`);
		console.log(`🆔 Client ID: ${requestBody.client_id}`);
		console.log(`🌐 Redirect URI: ${requestBody.redirect_uri}`);
		console.log(`🔐 Auth Method: ${requestBody.client_auth_method}`);
		console.log(`📋 Scopes: ${requestBody.scope || 'default'}`);
	}

	/**
	 * Log token exchange success
	 */
	logTokenExchangeSuccess(tokenResponse: TokenResponse): void {
		if (!this.context) return;

		const tokenInfo = {
			hasAccessToken: !!tokenResponse.access_token,
			hasRefreshToken: !!tokenResponse.refresh_token,
			hasIdToken: !!tokenResponse.id_token,
			tokenType: tokenResponse.token_type,
			expiresIn: tokenResponse.expires_in,
			scope: tokenResponse.scope,
		};

		logger.info(MODULE_TAG, '🎉 Token Exchange Successful', {
			app: this.context.app,
			flowId: this.context.flowId,
			...tokenInfo,
			userMessage: '🎉 Tokens received successfully! Ready to make API calls.',
		});

		// User-friendly console message
		console.log(`\n🎉 [${this.context.app.toUpperCase()}] Token Exchange Successful!`);
		console.log(`🔑 Access Token: ${tokenResponse.access_token.substring(0, 20)}...`);
		console.log(
			`🔄 Refresh Token: ${tokenResponse.refresh_token ? '✅ Present' : '❌ Not provided'}`
		);
		console.log(`🆔 ID Token: ${tokenResponse.id_token ? '✅ Present' : '❌ Not provided'}`);
		console.log(`⏰ Expires In: ${tokenResponse.expires_in} seconds`);
		console.log(`🔑 Token Type: ${tokenResponse.token_type}`);
		console.log(`📋 Scope: ${tokenResponse.scope || 'default'}`);
		console.log(`✅ Ready to make authenticated API calls!\n`);
	}

	/**
	 * Log token exchange error
	 */
	logTokenExchangeError(error: Error, statusCode?: number): void {
		if (!this.context) return;

		const errorInfo = {
			app: this.context.app,
			flowId: this.context.flowId,
			error: error.message,
			statusCode,
			userMessage: this.getUserFriendlyErrorMessage(error, statusCode),
		};

		logger.error(MODULE_TAG, '❌ Token Exchange Failed', errorInfo);

		// User-friendly console message
		console.log(`\n❌ [${this.context.app.toUpperCase()}] Token Exchange Failed`);
		console.log(`🚨 Error: ${error.message}`);
		if (statusCode) console.log(`📊 Status Code: ${statusCode}`);
		console.log(`💡 ${this.getUserFriendlyErrorMessage(error, statusCode)}\n`);
	}

	/**
	 * Get user-friendly error message
	 */
	private getUserFriendlyErrorMessage(error: Error, statusCode?: number): string {
		const message = error.message.toLowerCase();

		if (message.includes('invalid_grant')) {
			if (message.includes('expired') || message.includes('invalid')) {
				return 'Authorization code expired or already used. Please restart the authorization flow.';
			}
			return 'Invalid authorization code. Please check the authorization URL and try again.';
		}

		if (message.includes('invalid_redirect_uri')) {
			return 'Redirect URI mismatch. Ensure the redirect URI in PingOne exactly matches your application configuration.';
		}

		if (message.includes('invalid_client')) {
			return 'Client authentication failed. Please check your client ID and client secret.';
		}

		if (message.includes('unauthorized_client')) {
			return 'Client not authorized. Please ensure your application is registered in PingOne.';
		}

		if (statusCode === 429) {
			return 'Too many requests. Please wait a moment and try again.';
		}

		if (statusCode === 500) {
			return 'Server error. Please try again in a few moments.';
		}

		return 'Token exchange failed. Please check your configuration and try again.';
	}

	/**
	 * Log PKCE generation
	 */
	logPKCEGeneration(codeVerifier: string, codeChallenge: string): void {
		if (!this.context) return;

		logger.info(MODULE_TAG, '🔐 PKCE Generated', {
			app: this.context.app,
			flowId: this.context.flowId,
			codeVerifier: `${codeVerifier.substring(0, 20)}...`,
			codeChallenge: `${codeChallenge.substring(0, 20)}...`,
			userMessage: '🔐 PKCE parameters generated for enhanced security.',
		});

		// User-friendly console message
		console.log(`🔐 [${this.context.app.toUpperCase()}] PKCE Security Generated`);
		console.log(`🔑 Code Verifier: ${codeVerifier.substring(0, 20)}...`);
		console.log(`🔒 Code Challenge: ${codeChallenge.substring(0, 20)}...`);
		console.log(`🛡️ Enhanced security enabled with PKCE\n`);
	}

	/**
	 * Log flow completion
	 */
	logFlowCompletion(tokenCount: number): void {
		if (!this.context) return;

		logger.info(MODULE_TAG, '✅ Authorization Code Flow Completed', {
			app: this.context.app,
			flowId: this.context.flowId,
			tokensReceived: tokenCount,
			userMessage: '✅ Authorization code flow completed successfully!',
		});

		// User-friendly console message
		console.log(`\n✅ [${this.context.app.toUpperCase()}] Authorization Code Flow Completed`);
		console.log(`🎫 ${tokenCount} tokens received and stored`);
		console.log(`🔐 Flow ID: ${this.context.flowId}`);
		console.log(`🌐 Environment: ${this.context.environmentId}`);
		console.log(`✅ Ready for authenticated API access!\n`);
	}

	/**
	 * Clean up context
	 */
	cleanup(): void {
		this.context = null;
	}
}

// Export singleton instance
export const UserFriendlyAuthCodeLogger = new UserFriendlyAuthCodeLoggerImpl();
export default UserFriendlyAuthCodeLogger;
