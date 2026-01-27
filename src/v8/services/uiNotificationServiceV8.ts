/**
 * @file uiNotificationServiceV8.ts
 * @module v8/services
 * @description Centralized UI notification service - replaces all system modals (alert/confirm/prompt)
 * @version 8.0.0
 * @since 2024-11-23
 *
 * This service provides a unified interface for all user-facing notifications:
 * - Toast messages (non-blocking)
 * - Confirmation dialogs (blocking)
 * - Prompt dialogs (blocking with input)
 * - All notifications are logged for debugging
 *
 * @example
 * // Show toast
 * uiNotificationServiceV8.showSuccess('Operation completed');
 *
 * // Show confirmation
 * const confirmed = await uiNotificationServiceV8.confirm('Delete this item?');
 *
 * // Show prompt
 * const value = await uiNotificationServiceV8.prompt('Enter name:');
 */

import { v4ToastManager } from '@/utils/v4ToastMessages';

const MODULE_TAG = '[🔔 UI-NOTIFICATION-V8]';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
	duration?: number;
	description?: string;
}

export interface ConfirmOptions {
	title?: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	severity?: 'warning' | 'danger' | 'info';
}

export interface PromptOptions {
	title?: string;
	message: string;
	defaultValue?: string;
	placeholder?: string;
	confirmText?: string;
	cancelText?: string;
}

/**
 * Notification log entry for debugging
 */
interface NotificationLog {
	timestamp: Date;
	type: 'toast' | 'confirm' | 'prompt';
	severity: NotificationSeverity | 'confirm' | 'prompt';
	message: string;
	result?: boolean | string | null;
}

/**
 * UINotificationServiceV8
 *
 * Centralized service for all user-facing notifications.
 * Replaces system modals (alert/confirm/prompt) with app-level UI.
 */
class UINotificationServiceV8 {
	private logs: NotificationLog[] = [];
	private maxLogs = 100;
	private confirmCallback: ((options: ConfirmOptions) => Promise<boolean>) | null = null;
	private promptCallback: ((options: PromptOptions) => Promise<string | null>) | null = null;

	/**
	 * Register confirmation dialog handler
	 * This should be called by the ConfirmationModal component on mount
	 */
	registerConfirmHandler(handler: (options: ConfirmOptions) => Promise<boolean>): void {
		this.confirmCallback = handler;
	}

	/**
	 * Register prompt dialog handler
	 * This should be called by the PromptModal component on mount
	 */
	registerPromptHandler(handler: (options: PromptOptions) => Promise<string | null>): void {
		this.promptCallback = handler;
	}

	/**
	 * Show success toast
	 */
	showSuccess(message: string, options?: NotificationOptions): void {
		this.log('toast', 'success', message);
		console.log(`${MODULE_TAG} ✅ Success:`, message);
		v4ToastManager.showSuccess(message, {}, options);
	}

	/**
	 * Show error toast
	 */
	showError(message: string, _options?: NotificationOptions): void {
		this.log('toast', 'error', message);
		console.error(`${MODULE_TAG} ❌ Error:`, message);
		v4ToastManager.showError(message);
	}

	/**
	 * Show warning toast
	 */
	showWarning(message: string, _options?: NotificationOptions): void {
		this.log('toast', 'warning', message);
		console.warn(`${MODULE_TAG} ⚠️ Warning:`, message);
		v4ToastManager.showWarning(message);
	}

	/**
	 * Show info toast
	 */
	showInfo(message: string, _options?: NotificationOptions): void {
		this.log('toast', 'info', message);
		console.log(`${MODULE_TAG} ℹ️ Info:`, message);
		v4ToastManager.showInfo(message);
	}

	/**
	 * Show confirmation dialog
	 * @returns Promise that resolves to true if confirmed, false if cancelled
	 */
	async confirm(options: string | ConfirmOptions): Promise<boolean> {
		const confirmOptions: ConfirmOptions =
			typeof options === 'string' ? { message: options } : options;

		console.log(`${MODULE_TAG} 🤔 Confirm requested:`, confirmOptions.message);

		if (!this.confirmCallback) {
			console.error(`${MODULE_TAG} No confirmation handler registered! Falling back to console.`);
			// Fallback: log to console and return false (safer default)
			console.warn(`${MODULE_TAG} Confirmation needed: ${confirmOptions.message}`);
			return false;
		}

		try {
			const result = await this.confirmCallback(confirmOptions);
			this.log('confirm', 'confirm', confirmOptions.message, result);
			console.log(`${MODULE_TAG} Confirm result:`, result);
			return result;
		} catch (error) {
			console.error(`${MODULE_TAG} Confirmation error:`, error);
			return false;
		}
	}

	/**
	 * Show prompt dialog
	 * @returns Promise that resolves to user input string, or null if cancelled
	 */
	async prompt(options: string | PromptOptions): Promise<string | null> {
		const promptOptions: PromptOptions =
			typeof options === 'string' ? { message: options } : options;

		console.log(`${MODULE_TAG} 📝 Prompt requested:`, promptOptions.message);

		if (!this.promptCallback) {
			console.error(`${MODULE_TAG} No prompt handler registered! Falling back to console.`);
			// Fallback: log to console and return null
			console.warn(`${MODULE_TAG} Prompt needed: ${promptOptions.message}`);
			return null;
		}

		try {
			const result = await this.promptCallback(promptOptions);
			this.log('prompt', 'prompt', promptOptions.message, result);
			console.log(`${MODULE_TAG} Prompt result:`, result ? `"${result}"` : 'cancelled');
			return result;
		} catch (error) {
			console.error(`${MODULE_TAG} Prompt error:`, error);
			return null;
		}
	}

	/**
	 * Log notification for debugging
	 */
	private log(
		type: 'toast' | 'confirm' | 'prompt',
		severity: NotificationSeverity | 'confirm' | 'prompt',
		message: string,
		result?: boolean | string | null
	): void {
		const entry: NotificationLog = {
			timestamp: new Date(),
			type,
			severity,
			message,
			result,
		};

		this.logs.push(entry);

		// Keep only last N logs
		if (this.logs.length > this.maxLogs) {
			this.logs.shift();
		}
	}

	/**
	 * Get notification logs for debugging
	 */
	getLogs(): NotificationLog[] {
		return [...this.logs];
	}

	/**
	 * Clear notification logs
	 */
	clearLogs(): void {
		console.log(`${MODULE_TAG} Clearing notification logs`);
		this.logs = [];
	}

	/**
	 * Export logs as JSON for debugging
	 */
	exportLogs(): string {
		return JSON.stringify(this.logs, null, 2);
	}
}

// Export singleton instance
export const uiNotificationServiceV8 = new UINotificationServiceV8();
export default uiNotificationServiceV8;
