/**
 * @file V9ModernMessagingService.ts
 * @module services/v9
 * @description V9 Modern Messaging Service - Non-toast messaging system
 * @version 9.0.0
 * @since 2026-03-02
 *
 * Provides Modern Messaging capabilities for V9 flows:
 * - Wait screens for blocking operations
 * - Banner messaging for persistent context/warnings
 * - Critical errors highlighted in red with clear guidance
 * - Footer messaging for low-noise status updates
 *
 * Replaces all toast-based messaging systems in V9 flows.
 */

import React from 'react';

export interface WaitScreenConfig {
	message: string;
	detail?: string;
	allowCancel?: boolean;
	onCancel?: () => void;
}

export interface BannerConfig {
	type: 'info' | 'warning' | 'error' | 'success';
	title: string;
	message: string;
	dismissible?: boolean;
	onDismiss?: () => void;
	actions?: Array<{
		label: string;
		action: () => void;
		variant?: 'primary' | 'secondary';
	}>;
}

export interface CriticalErrorConfig {
	title: string;
	message: string;
	technicalDetails?: string;
	recoveryActions?: Array<{
		label: string;
		action: () => void;
		instructions?: string;
	}>;
	contactSupport?: boolean;
}

export interface FooterMessageConfig {
	type: 'status' | 'progress' | 'info';
	message: string;
	persistent?: boolean;
	duration?: number; // for non-persistent messages
}

export interface MessageState {
	waitScreen?: WaitScreenConfig | undefined;
	banner?: BannerConfig | undefined;
	criticalError?: CriticalErrorConfig | undefined;
	footerMessage?: FooterMessageConfig | undefined;
}

/**
 * V9 Modern Messaging Service
 *
 * Provides state-based messaging without toast notifications.
 * Components subscribe to message state and render appropriate UI.
 */
class V9ModernMessagingService {
	private static instance: V9ModernMessagingService;
	private listeners: Set<React.Dispatch<React.SetStateAction<MessageState>>> = new Set();
	private messageState: MessageState = {};

	private constructor() {}

	static getInstance(): V9ModernMessagingService {
		if (!V9ModernMessagingService.instance) {
			V9ModernMessagingService.instance = new V9ModernMessagingService();
		}
		return V9ModernMessagingService.instance;
	}

	/**
	 * Subscribe to message state changes
	 * Returns a function to unsubscribe
	 */
	subscribe(setter: React.Dispatch<React.SetStateAction<MessageState>>): () => void {
		this.listeners.add(setter);
		setter(this.messageState);
		return () => this.listeners.delete(setter);
	}

	/**
	 * Notify all listeners of state change
	 */
	private notifyListeners(): void {
		this.listeners.forEach((setter) => {
			setter({ ...this.messageState });
		});
	}

	/**
	 * Show wait screen for blocking operations
	 */
	showWaitScreen(config: WaitScreenConfig): void {
		this.messageState.waitScreen = config;
		this.notifyListeners();
	}

	/**
	 * Hide wait screen
	 */
	hideWaitScreen(): void {
		this.messageState.waitScreen = undefined;
		this.notifyListeners();
	}

	/**
	 * Show banner message
	 */
	showBanner(config: BannerConfig): void {
		this.messageState.banner = config;
		this.notifyListeners();
	}

	/**
	 * Hide banner message
	 */
	hideBanner(): void {
		this.messageState.banner = undefined;
		this.notifyListeners();
	}

	/**
	 * Show critical error
	 */
	showCriticalError(config: CriticalErrorConfig): void {
		this.messageState.criticalError = config;
		this.messageState.waitScreen = undefined; // Clear wait screen on error
		this.notifyListeners();
	}

	/**
	 * Hide critical error
	 */
	hideCriticalError(): void {
		this.messageState.criticalError = undefined;
		this.notifyListeners();
	}

	/**
	 * Show footer message
	 */
	showFooterMessage(config: FooterMessageConfig): void {
		this.messageState.footerMessage = config;
		this.notifyListeners();

		// Auto-hide non-persistent messages after duration
		if (!config.persistent && config.duration) {
			setTimeout(() => {
				if (this.messageState.footerMessage === config) {
					this.hideFooterMessage();
				}
			}, config.duration);
		}
	}

	/**
	 * Hide footer message
	 */
	hideFooterMessage(): void {
		this.messageState.footerMessage = undefined;
		this.notifyListeners();
	}

	/**
	 * Clear all messages
	 */
	clearAll(): void {
		this.messageState = {
			waitScreen: undefined,
			banner: undefined,
			criticalError: undefined,
			footerMessage: undefined,
		};
		this.notifyListeners();
	}

	/**
	 * Get current message state (for testing)
	 */
	getCurrentState(): MessageState {
		return { ...this.messageState };
	}
}

// Export singleton instance
export const modernMessaging = V9ModernMessagingService.getInstance();

// Export class for testing
export { V9ModernMessagingService };

// Export hook for React components
export function useModernMessaging(): [MessageState, typeof modernMessaging] {
	const [messageState, setMessageState] = React.useState<MessageState>({});

	React.useEffect(() => {
		return modernMessaging.subscribe(setMessageState);
	}, []);

	return [messageState, modernMessaging];
}
