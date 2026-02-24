/**
 * Migration Helpers for Toast to Feedback System Transition
 *
 * This file provides utilities to help migrate from v4ToastManager
 * to the new feedback system components.
 */

import { feedbackService } from '../services/feedback/feedbackService';
import { v4ToastManager } from './v4ToastMessages';

// Feature flag for gradual migration
const USE_NEW_MESSAGING_SYSTEM = import.meta.env.VITE_ENABLE_NEW_MESSAGING === 'true';

export type MessageContext = 'page' | 'inline' | 'snackbar' | 'auto';

export interface MessageOptions {
	context?: MessageContext;
	field?: string;
	duration?: number;
	persistent?: boolean;
	dismissible?: boolean;
	title?: string;
}

/**
 * Migration helper that automatically chooses the appropriate feedback component
 * based on context and message characteristics
 */
export const showMessage = {
	/**
	 * Show success message with automatic component selection
	 */
	success: (message: string, options: MessageOptions = {}) => {
		if (!USE_NEW_MESSAGING_SYSTEM) {
			return v4ToastManager.showSuccess(message);
		}

		const context = options.context || determineContext(message, options);

		switch (context) {
			case 'page':
				return feedbackService.showPageBanner({
					type: 'success',
					title: options.title || 'Success',
					message,
					dismissible: options.dismissible !== false,
					persistent: options.persistent || false,
				});

			case 'inline':
				return feedbackService.showInlineSuccess(message, options.field);

			case 'snackbar':
			default:
				return feedbackService.showSnackbar({
					type: 'success',
					message,
					duration: options.duration || 4000,
				});
		}
	},

	/**
	 * Show error message with automatic component selection
	 */
	error: (message: string, options: MessageOptions = {}) => {
		if (!USE_NEW_MESSAGING_SYSTEM) {
			return v4ToastManager.showError(message);
		}

		const context = options.context || determineContext(message, options);

		switch (context) {
			case 'page':
				return feedbackService.showPageBanner({
					type: 'error',
					title: options.title || 'Error',
					message,
					dismissible: options.dismissible !== false,
					persistent: options.persistent || false,
				});

			case 'inline':
				return feedbackService.showInlineError(message, options.field);

			case 'snackbar':
			default:
				return feedbackService.showSnackbar({
					type: 'warning',
					message,
					duration: options.duration || 6000,
				});
		}
	},

	/**
	 * Show info message with automatic component selection
	 */
	info: (message: string, options: MessageOptions = {}) => {
		if (!USE_NEW_MESSAGING_SYSTEM) {
			return v4ToastManager.showInfo(message);
		}

		const context = options.context || determineContext(message, options);

		switch (context) {
			case 'page':
				return feedbackService.showPageBanner({
					type: 'info',
					title: options.title || 'Information',
					message,
					dismissible: options.dismissible !== false,
					persistent: options.persistent || false,
				});

			case 'inline':
				// Note: showInlineInfo doesn't exist, so we use showInlineWarning for inline info
				return feedbackService.showInlineWarning(message, options.field);

			case 'snackbar':
			default:
				return feedbackService.showSnackbar({
					type: 'info',
					message,
					duration: options.duration || 4000,
				});
		}
	},

	/**
	 * Show warning message with automatic component selection
	 */
	warning: (message: string, options: MessageOptions = {}) => {
		if (!USE_NEW_MESSAGING_SYSTEM) {
			return v4ToastManager.showInfo(message); // Fallback to info for warnings
		}

		const context = options.context || determineContext(message, options);

		switch (context) {
			case 'page':
				return feedbackService.showPageBanner({
					type: 'warning',
					title: options.title || 'Warning',
					message,
					dismissible: options.dismissible !== false,
					persistent: options.persistent || false,
				});

			case 'inline':
				return feedbackService.showInlineWarning(message, options.field);

			case 'snackbar':
			default:
				return feedbackService.showSnackbar({
					type: 'warning',
					message,
					duration: options.duration || 6000,
				});
		}
	},
};

/**
 * Determine the best context for a message based on its characteristics
 */
function determineContext(message: string, options: MessageOptions): MessageContext {
	// Explicit context takes precedence
	if (options.context) {
		return options.context;
	}

	// Field-specific messages should be inline
	if (options.field) {
		return 'inline';
	}

	// Long messages or important announcements should be page banners
	if (message.length > 100 || options.persistent || options.title) {
		return 'page';
	}

	// Default to snackbar for short, temporary messages
	return 'snackbar';
}

/**
 * Specific migration helpers for common patterns
 */
export const migrateToast = {
	/**
	 * Migrate authentication success messages
	 */
	authSuccess: (message: string = 'Authentication successful') => {
		return showMessage.success(message, {
			context: 'page',
			title: 'Authentication Successful',
			duration: 5000,
		});
	},

	/**
	 * Migrate authentication error messages
	 */
	authError: (message: string) => {
		return showMessage.error(message, {
			context: 'page',
			title: 'Authentication Failed',
			persistent: true,
		});
	},

	/**
	 * Migrate form validation errors
	 */
	validationError: (message: string, field: string) => {
		return showMessage.error(message, {
			context: 'inline',
			field,
		});
	},

	/**
	 * Migrate save success messages
	 */
	saveSuccess: (message: string = 'Changes saved successfully') => {
		return showMessage.success(message, {
			context: 'snackbar',
			duration: 3000,
		});
	},

	/**
	 * Migrate copy to clipboard messages
	 */
	copySuccess: (item: string) => {
		return showMessage.success(`${item} copied to clipboard`, {
			context: 'snackbar',
			duration: 2000,
		});
	},

	/**
	 * Migrate operation failed messages
	 */
	operationFailed: (operation: string) => {
		return showMessage.error(`Failed to ${operation}`, {
			context: 'snackbar',
			duration: 5000,
		});
	},
};

/**
 * Batch migration utility for replacing multiple toast calls
 */
export const createToastMigrator = (componentName: string) => {
	const migrated = new Set<string>();

	return {
		/**
		 * Log migration for tracking purposes
		 */
		logMigration: (oldMethod: string, newMethod: string) => {
			const key = `${componentName}:${oldMethod}`;
			if (!migrated.has(key)) {
				console.log(`🔄 [MIGRATION] ${componentName}: ${oldMethod} → ${newMethod}`);
				migrated.add(key);
			}
		},

		/**
		 * Get migration statistics
		 */
		getStats: () => ({
			component: componentName,
			migratedCalls: migrated.size,
			totalCalls: migrated.size,
		}),
	};
};

/**
 * Environment variable helper
 */
export const isMigrationEnabled = () => {
	return USE_NEW_MESSAGING_SYSTEM;
};

/**
 * Development helper to preview both systems
 */
export const previewBothSystems = (
	message: string,
	type: 'success' | 'error' | 'info' = 'success'
) => {
	if (import.meta.env.DEV) {
		// Show old system first
		if (type === 'success') {
			v4ToastManager.showSuccess(message);
		} else if (type === 'error') {
			v4ToastManager.showError(message);
		} else {
			v4ToastManager.showInfo(message);
		}

		// Show new system after a delay
		setTimeout(() => {
			showMessage[type](message, {
				context: 'snackbar',
				duration: 3000,
			});
		}, 1000);
	}
};
