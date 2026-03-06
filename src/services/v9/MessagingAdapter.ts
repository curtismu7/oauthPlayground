/**
 * @file MessagingAdapter.ts
 * @module services/v9
 * @description Messaging Adapter for Cross-Version Compatibility
 * @version 9.0.0
 * @since 2026-03-06
 *
 * Provides unified messaging interface that works across V7, V8, and V9 components.
 * Automatically detects the appropriate messaging system and provides consistent API.
 */

import { logger } from '../../utils/logger';
import { modernMessaging } from './V9ModernMessagingService';

/**
 * Message types supported across all versions
 */
export type MessageType = 'success' | 'error' | 'warning' | 'info';

/**
 * Message configuration for cross-version compatibility
 */
export interface MessageConfig {
	type: MessageType;
	title?: string;
	message: string;
	duration?: number; // For toast/auto-dismiss messages
	dismissible?: boolean; // For banners
	persistent?: boolean; // For footer messages
	recoveryActions?: Array<{
		label: string;
		action: () => void;
		instructions?: string;
	}>;
}

/**
 * Messaging adapter interface
 */
export interface IMessagingAdapter {
	success: (message: string, config?: Partial<MessageConfig>) => void;
	error: (message: string, config?: Partial<MessageConfig>) => void;
	warning: (message: string, config?: Partial<MessageConfig>) => void;
	info: (message: string, config?: Partial<MessageConfig>) => void;
	clear: () => void;
}

/**
 * V8 Toast Adapter
 * Provides V8 toast functionality with unified interface
 */
class V8ToastAdapter implements IMessagingAdapter {
	success(message: string, _config?: Partial<MessageConfig>): void {
		modernMessaging.showFooterMessage({ type: 'info', message: message, duration: 3000 });
	}

	error(message: string, _config?: Partial<MessageConfig>): void {
		modernMessaging.showBanner({
			type: 'error',
			title: 'Error',
			message: message,
			dismissible: true,
		});
	}

	warning(message: string, _config?: Partial<MessageConfig>): void {
		modernMessaging.showBanner({
			type: 'warning',
			title: 'Warning',
			message: message,
			dismissible: true,
		});
	}

	info(message: string, _config?: Partial<MessageConfig>): void {
		modernMessaging.showFooterMessage({ type: 'info', message: message, duration: 3000 });
	}

	clear(): void {
		// V8 toast doesn't have a clear method, messages auto-dismiss
		logger.info('MessagingAdapter', '[MessagingAdapter] V8 toast messages auto-dismiss');
	}
}

/**
 * V9 Modern Messaging Adapter
 * Provides V9 modern messaging functionality with unified interface
 */
class V9ModernMessagingAdapter implements IMessagingAdapter {
	success(message: string, config?: Partial<MessageConfig>): void {
		if (config?.recoveryActions || config?.dismissible === true) {
			// Use banner for important success messages
			modernMessaging.showBanner({
				type: 'success',
				title: config?.title || 'Success',
				message,
				dismissible: config?.dismissible ?? true,
				actions:
					config?.recoveryActions?.map((action) => ({
						label: action.label,
						action: action.action,
						variant: 'primary' as const,
					})) || [],
			});
		} else {
			// Use footer message for simple success updates
			modernMessaging.showFooterMessage({
				type: 'info',
				message: config?.title ? `${config.title}: ${message}` : message,
				duration: config?.duration ?? 3000,
				persistent: config?.persistent ?? false,
			});
		}
	}

	error(message: string, config?: Partial<MessageConfig>): void {
		if (config?.recoveryActions) {
			// Use critical error for errors with recovery actions
			modernMessaging.showCriticalError({
				title: config?.title || 'Error',
				message,
				technicalDetails: config?.title ? '' : message,
				recoveryActions: config?.recoveryActions,
				contactSupport: !config?.recoveryActions?.length,
			});
		} else {
			// Use banner for simple errors
			modernMessaging.showBanner({
				type: 'error',
				title: config?.title || 'Error',
				message,
				dismissible: config?.dismissible ?? true,
			});
		}
	}

	warning(message: string, config?: Partial<MessageConfig>): void {
		modernMessaging.showBanner({
			type: 'warning',
			title: config?.title || 'Warning',
			message,
			dismissible: config?.dismissible ?? true,
			actions:
				config?.recoveryActions?.map((action) => ({
					label: action.label,
					action: action.action,
					variant: 'secondary' as const,
				})) || [],
		});
	}

	info(message: string, config?: Partial<MessageConfig>): void {
		if (config?.persistent || config?.duration) {
			// Use footer message for info messages
			modernMessaging.showFooterMessage({
				type: 'info',
				message: config?.title ? `${config.title}: ${message}` : message,
				duration: config?.duration ?? 3000,
				persistent: config?.persistent ?? false,
			});
		} else {
			// Use banner for persistent info messages
			modernMessaging.showBanner({
				type: 'info',
				title: config?.title || 'Information',
				message,
				dismissible: config?.dismissible ?? true,
			});
		}
	}

	clear(): void {
		modernMessaging.clearAll();
	}
}

/**
 * Auto-detect messaging adapter based on environment
 */
function getMessagingAdapter(): IMessagingAdapter {
	// Check if V9 modern messaging is available
	try {
		// Test if modern messaging is available
		const testState = modernMessaging.getCurrentState();
		if (testState !== undefined) {
			logger.info('MessagingAdapter', '[MessagingAdapter] Using V9 Modern Messaging');
			return new V9ModernMessagingAdapter();
		}
	} catch (_err) {
		logger.info(
			'MessagingAdapter',
			'[MessagingAdapter] V9 Modern Messaging not available, falling back to V8 Toast'
		);
	}

	// Check if V8 toast is available
	try {
		if (typeof toastV8 === 'object' && (toastV8 as any).success) {
			logger.info('MessagingAdapter', '[MessagingAdapter] Using V8 Toast');
			return new V8ToastAdapter();
		}
	} catch (_err) {
		logger.info('MessagingAdapter', '[MessagingAdapter] V8 Toast not available');
	}

	// Fallback to console (shouldn't happen in production)
	logger.info(
		'MessagingAdapter',
		'[MessagingAdapter] No messaging system available, using console fallback'
	);
	return new ConsoleMessagingAdapter();
}

/**
 * Console fallback adapter (for development/testing)
 */
class ConsoleMessagingAdapter implements IMessagingAdapter {
	success(message: string, config?: Partial<MessageConfig>): void {
		logger.info(
			'MessagingAdapter',
			`✅ [SUCCESS] ${config?.title ? `${config.title}: ` : ''}${message}`
		);
	}

	error(message: string, config?: Partial<MessageConfig>): void {
		logger.info(
			'MessagingAdapter',
			`❌ [ERROR] ${config?.title ? `${config.title}: ` : ''}${message}`
		);
	}

	warning(message: string, config?: Partial<MessageConfig>): void {
		logger.info(
			'MessagingAdapter',
			`⚠️ [WARNING] ${config?.title ? `${config.title}: ` : ''}${message}`
		);
	}

	info(message: string, config?: Partial<MessageConfig>): void {
		logger.info(
			'MessagingAdapter',
			`ℹ️ [INFO] ${config?.title ? `${config.title}: ` : ''}${message}`
		);
	}

	clear(): void {
		logger.info('MessagingAdapter', '[MessagingAdapter] Console messages cleared');
	}
}

/**
 * Default messaging adapter instance
 */
export const messagingAdapter = getMessagingAdapter();

/**
 * Messaging adapter factory for explicit version selection
 */
export class MessagingAdapterFactory {
	static getV8Adapter(): IMessagingAdapter {
		return new V8ToastAdapter();
	}

	static getV9Adapter(): IMessagingAdapter {
		return new V9ModernMessagingAdapter();
	}

	static getConsoleAdapter(): IMessagingAdapter {
		return new ConsoleMessagingAdapter();
	}

	static getAutoAdapter(): IMessagingAdapter {
		return getMessagingAdapter();
	}
}

/**
 * React hook for using messaging adapter
 */
export function useMessagingAdapter(): IMessagingAdapter {
	return messagingAdapter;
}

/**
 * Higher-order component for messaging compatibility
 */
export function withMessagingAdapter<P extends object>(
	ComponentType: React.ComponentType<P & { messaging: IMessagingAdapter }>
): React.ComponentType<P> {
	return function WrappedComponent(props: P) {
		const messaging = useMessagingAdapter();
		return React.createElement(ComponentType, {
			...(props as P & { messaging: IMessagingAdapter }),
			messaging,
		});
	};
}

/**
 * Common messaging patterns
 */
export const MessagingPatterns = {
	/**
	 * Show success message with optional recovery action
	 */
	showSuccess: (message: string, config?: Partial<MessageConfig>) => {
		messagingAdapter.success(message, config);
	},

	/**
	 * Show error message with retry action
	 */
	showErrorWithRetry: (
		message: string,
		retryAction: () => void,
		config?: Partial<MessageConfig>
	) => {
		messagingAdapter.error(message, {
			...config,
			recoveryActions: [
				{
					label: 'Retry',
					action: retryAction,
					instructions: 'Click to retry the operation',
				},
			],
		});
	},

	/**
	 * Show validation warning
	 */
	showValidationWarning: (errors: string[], config?: Partial<MessageConfig>) => {
		messagingAdapter.warning(`Please fix: ${errors.join(', ')}`, {
			title: 'Validation Required',
			...config,
		});
	},

	/**
	 * Show status update
	 */
	showStatusUpdate: (status: string, config?: Partial<MessageConfig>) => {
		messagingAdapter.info(status, {
			duration: 3000,
			...config,
		});
	},

	/**
	 * Show operation progress
	 */
	showOperationProgress: (operation: string, allowCancel = false) => {
		if (messagingAdapter instanceof V9ModernMessagingAdapter) {
			modernMessaging.showWaitScreen({
				message: operation,
				allowCancel,
			});
		} else {
			messagingAdapter.info(operation);
		}
	},

	/**
	 * Hide operation progress
	 */
	hideOperationProgress: () => {
		if (messagingAdapter instanceof V9ModernMessagingAdapter) {
			modernMessaging.hideWaitScreen();
		}
	},

	/**
	 * Clear all messages
	 */
	clearAll: () => {
		messagingAdapter.clear();
	},
};

/**
 * Export default adapter
 */
export default messagingAdapter;
