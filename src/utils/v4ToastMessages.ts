// src/utils/v4ToastMessages.ts - Enhanced Toast Messaging for V4 Flows

import { ButtonToastScenarios } from '../types/v4FlowTemplate';
import { showGlobalError, showGlobalSuccess, showGlobalWarning } from '../hooks/useNotifications';

// Default toast messages for V4 flows
export const V4_TOAST_MESSAGES: ButtonToastScenarios = {
	// Save Configuration Button
	saveConfigurationStart: "Saving configuration...",
	saveConfigurationSuccess: "Configuration saved successfully",
	saveConfigurationError: "Failed to save configuration: {error}",
	saveConfigurationValidationError: "Please fill in required fields: {fields}",
	
	// PKCE Buttons
	pkceGenerated: "PKCE parameters generated successfully",
	pkceGenerationError: "Failed to generate PKCE parameters",
	pkceVerifierCopied: "Code verifier copied to clipboard",
	pkceChallengeCopied: "Code challenge copied to clipboard",
	
	// Authorization URL Buttons
	authUrlGenerated: "Authorization URL generated successfully",
	authUrlGenerationError: "Failed to generate authorization URL: {error}",
	authUrlCopied: "Authorization URL copied to clipboard",
	authUrlOpened: "Authorization flow started in new window",
	
	// Token Exchange Button
	tokenExchangeStart: "Exchanging authorization code for tokens...",
	tokenExchangeSuccess: "Tokens exchanged successfully",
	tokenExchangeError: "Token exchange failed: {error}",
	authCodeCopied: "Authorization code copied to clipboard",
	
	// User Info
	userInfoFetched: "User information retrieved successfully",
	userInfoError: "Failed to fetch user information: {error}",
	
	// Navigation Buttons
	stepCompleted: "Step {step} completed",
	stepError: "Please complete required fields before proceeding",
	flowCompleted: "🎉 OAuth Flow Complete!",
	
	// Quiz Buttons
	quizCorrect: "✅ Correct answer!",
	quizIncorrect: "❌ Incorrect. Try again!",
	
	// Scope Selection
	scopeUpdated: "Scopes updated",
	scopeRequired: "OpenID scope is required",
	
	// Copy Functionality
	copySuccess: "{item} copied to clipboard",
	copyError: "Failed to copy {item}",
	
	// Network/Server Errors
	networkError: "Network error. Please check your connection.",
	serverError: "Server error. Please try again later.",
	timeoutError: "Request timed out. Please try again."
};

export class V4ToastManager {
	private messages: ButtonToastScenarios;

	constructor(messages: ButtonToastScenarios = V4_TOAST_MESSAGES) {
		this.messages = messages;
	}

	/**
	 * Show success toast with message interpolation
	 */
	showSuccess(key: keyof ButtonToastScenarios, variables: Record<string, string> = {}): void {
		const message = this.interpolateMessage(this.messages[key], variables);
		showGlobalSuccess(message);
	}

	/**
	 * Show error toast with message interpolation
	 */
	showError(key: keyof ButtonToastScenarios, variables: Record<string, string> = {}): void {
		const message = this.interpolateMessage(this.messages[key], variables);
		showGlobalError(message);
	}

	/**
	 * Show warning toast with message interpolation
	 */
	showWarning(key: keyof ButtonToastScenarios, variables: Record<string, string> = {}): void {
		const message = this.interpolateMessage(this.messages[key], variables);
		showGlobalWarning(message);
	}

	/**
	 * Show save configuration start
	 */
	showSaveStart(): void {
		this.showWarning('saveConfigurationStart');
	}

	/**
	 * Show save configuration success
	 */
	showSaveSuccess(): void {
		this.showSuccess('saveConfigurationSuccess');
	}

	/**
	 * Show save configuration error
	 */
	showSaveError(error: string): void {
		this.showError('saveConfigurationError', { error });
	}

	/**
	 * Show save configuration validation error
	 */
	showSaveValidationError(fields: string[]): void {
		this.showError('saveConfigurationValidationError', { fields: fields.join(', ') });
	}

	/**
	 * Show PKCE generation success
	 */
	showPKCEGenerated(): void {
		this.showSuccess('pkceGenerated');
	}

	/**
	 * Show PKCE generation error
	 */
	showPKCEError(error: string): void {
		this.showError('pkceGenerationError', { error });
	}

	/**
	 * Show PKCE verifier copied
	 */
	showPKCEVerifierCopied(): void {
		this.showSuccess('pkceVerifierCopied');
	}

	/**
	 * Show PKCE challenge copied
	 */
	showPKCEChallengeCopied(): void {
		this.showSuccess('pkceChallengeCopied');
	}

	/**
	 * Show authorization URL generated
	 */
	showAuthUrlGenerated(): void {
		this.showSuccess('authUrlGenerated');
	}

	/**
	 * Show authorization URL generation error
	 */
	showAuthUrlError(error: string): void {
		this.showError('authUrlGenerationError', { error });
	}

	/**
	 * Show authorization URL copied
	 */
	showAuthUrlCopied(): void {
		this.showSuccess('authUrlCopied');
	}

	/**
	 * Show authorization URL opened
	 */
	showAuthUrlOpened(): void {
		this.showSuccess('authUrlOpened');
	}

	/**
	 * Show token exchange start
	 */
	showTokenExchangeStart(): void {
		this.showWarning('tokenExchangeStart');
	}

	/**
	 * Show token exchange success
	 */
	showTokenExchangeSuccess(): void {
		this.showSuccess('tokenExchangeSuccess');
	}

	/**
	 * Show token exchange error
	 */
	showTokenExchangeError(error: string): void {
		this.showError('tokenExchangeError', { error });
	}

	/**
	 * Show authorization code copied
	 */
	showAuthCodeCopied(): void {
		this.showSuccess('authCodeCopied');
	}

	/**
	 * Show user info fetched
	 */
	showUserInfoFetched(): void {
		this.showSuccess('userInfoFetched');
	}

	/**
	 * Show user info error
	 */
	showUserInfoError(error: string): void {
		this.showError('userInfoError', { error });
	}

	/**
	 * Show step completed
	 */
	showStepCompleted(step: number): void {
		this.showSuccess('stepCompleted', { step: step.toString() });
	}

	/**
	 * Show step error
	 */
	showStepError(): void {
		this.showError('stepError');
	}

	/**
	 * Show flow completed
	 */
	showFlowCompleted(): void {
		this.showSuccess('flowCompleted');
	}

	/**
	 * Show quiz correct answer
	 */
	showQuizCorrect(): void {
		this.showSuccess('quizCorrect');
	}

	/**
	 * Show quiz incorrect answer
	 */
	showQuizIncorrect(): void {
		this.showWarning('quizIncorrect');
	}

	/**
	 * Show scope updated
	 */
	showScopeUpdated(): void {
		this.showSuccess('scopeUpdated');
	}

	/**
	 * Show scope required
	 */
	showScopeRequired(): void {
		this.showWarning('scopeRequired');
	}

	/**
	 * Show copy success
	 */
	showCopySuccess(item: string): void {
		this.showSuccess('copySuccess', { item });
	}

	/**
	 * Show copy error
	 */
	showCopyError(item: string): void {
		this.showError('copyError', { item });
	}

	/**
	 * Show network error
	 */
	showNetworkError(): void {
		this.showError('networkError');
	}

	/**
	 * Show server error
	 */
	showServerError(): void {
		this.showError('serverError');
	}

	/**
	 * Show timeout error
	 */
	showTimeoutError(): void {
		this.showError('timeoutError');
	}

	/**
	 * Interpolate message with variables
	 */
	private interpolateMessage(message: string, variables: Record<string, string>): string {
		return message.replace(/\{(\w+)\}/g, (match, key) => {
			return variables[key] || match;
		});
	}

	/**
	 * Update messages for custom flow types
	 */
	updateMessages(newMessages: Partial<ButtonToastScenarios>): void {
		this.messages = { ...this.messages, ...newMessages };
	}
}

// Create default instance
export const v4ToastManager = new V4ToastManager();
