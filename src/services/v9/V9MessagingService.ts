// src/services/v9/V9MessagingService.ts
// Modern Messaging Service for V9 flows
// Replaces v4ToastManager with structured, contextual messaging

export type MessageType = 'success' | 'error' | 'warning' | 'info' | 'critical';

export type MessageCategory = 'wait' | 'banner' | 'footer' | 'modal' | 'toast';

export interface V9Message {
	id: string;
	type: MessageType;
	category: MessageCategory;
	title?: string | undefined;
	message: string;
	duration?: number | undefined; // ms, undefined = persistent
	persistent?: boolean;
	blocking?: boolean; // for wait screens
	action?: {
		label: string;
		onClick: () => void;
	};
	metadata?: Record<string, unknown>;
	timestamp: number;
}

export interface V9MessagingConfig {
	enableConsoleLogging?: boolean;
	enableStructuredLogging?: boolean;
	defaultDuration?: number;
	maxMessages?: number;
	enableWaitScreens?: boolean;
	enableBannerMessaging?: boolean;
	enableFooterMessaging?: boolean;
}

export interface V9MessagingState {
	messages: V9Message[];
	waitScreen: V9Message | null;
	bannerMessage: V9Message | null;
	footerMessage: V9Message | null;
}

class V9MessagingService {
	private config: V9MessagingConfig;
	private state: V9MessagingState;
	private listeners: Set<() => void> = new Set();

	constructor(config: V9MessagingConfig = {}) {
		this.config = {
			enableConsoleLogging: true,
			enableStructuredLogging: true,
			defaultDuration: 5000,
			maxMessages: 5,
			enableWaitScreens: true,
			enableBannerMessaging: true,
			enableFooterMessaging: true,
			...config,
		};

		this.state = {
			messages: [],
			waitScreen: null,
			bannerMessage: null,
			footerMessage: null,
		};
	}

	// Subscribe to state changes
	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	// Get current state
	getState(): V9MessagingState {
		return { ...this.state };
	}

	// Notify listeners of state change
	private notifyListeners(): void {
		this.listeners.forEach((listener) => void listener());
	}

	// Generate unique message ID
	private generateId(): string {
		return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	// Add message to queue
	private addMessage(message: Omit<V9Message, 'id' | 'timestamp'>): V9Message {
		const fullMessage: V9Message = {
			...message,
			id: this.generateId(),
			timestamp: Date.now(),
		};

		// Add to messages queue (for non-category messages)
		if (!message.category || message.category === 'toast') {
			this.state.messages = [...this.state.messages, fullMessage];

			// Limit message count
			if (this.state.messages.length > (this.config.maxMessages || 5)) {
				this.state.messages = this.state.messages.slice(-this.config.maxMessages!);
			}
		}

		// Set category-specific messages
		switch (message.category) {
			case 'wait':
				if (this.config.enableWaitScreens) {
					this.state.waitScreen = fullMessage;
				}
				break;
			case 'banner':
				if (this.config.enableBannerMessaging) {
					this.state.bannerMessage = fullMessage;
				}
				break;
			case 'footer':
				if (this.config.enableFooterMessaging) {
					this.state.footerMessage = fullMessage;
				}
				break;
		}

		// Log message
		this.logMessage(fullMessage);

		// Notify listeners
		this.notifyListeners();

		// Auto-remove non-persistent messages
		if (fullMessage.duration && fullMessage.duration > 0) {
			setTimeout(() => {
				this.removeMessage(fullMessage.id);
			}, fullMessage.duration);
		}

		return fullMessage;
	}

	// Log message to console and structured logging
	private logMessage(message: V9Message): void {
		if (this.config.enableConsoleLogging) {
			const logMethod = this.getLogMethod(message.type);
			logMethod(`[${message.type.toUpperCase()}] ${message.title || ''}: ${message.message}`);
		}

		if (this.config.enableStructuredLogging) {
			// TODO: Integrate with structured logging service
			console.log('STRUCTURED_LOG:', {
				type: 'messaging',
				level: message.type,
				category: message.category,
				title: message.title,
				message: message.message,
				timestamp: message.timestamp,
				metadata: message.metadata,
			});
		}
	}

	// Get console log method based on message type
	private getLogMethod(type: MessageType): (...args: unknown[]) => void {
		switch (type) {
			case 'critical':
			case 'error':
				return console.error;
			case 'warning':
				return console.warn;
			case 'info':
				return console.info;
			default:
				return console.log;
		}
	}

	// Remove message by ID
	removeMessage(id: string): boolean {
		const removed = this.state.messages.some((msg) => msg.id === id);

		this.state.messages = this.state.messages.filter((msg) => msg.id !== id);

		// Clear category-specific messages if they match
		if (this.state.waitScreen?.id === id) {
			this.state.waitScreen = null;
		}
		if (this.state.bannerMessage?.id === id) {
			this.state.bannerMessage = null;
		}
		if (this.state.footerMessage?.id === id) {
			this.state.footerMessage = null;
		}

		if (removed) {
			this.notifyListeners();
		}

		return removed;
	}

	// Clear all messages
	clearMessages(): void {
		this.state.messages = [];
		this.state.waitScreen = null;
		this.state.bannerMessage = null;
		this.state.footerMessage = null;
		this.notifyListeners();
	}

	// Success message
	showSuccess(message: string, title?: string, options?: Partial<V9Message>): V9Message {
		return this.addMessage({
			type: 'success',
			category: 'toast',
			message,
			title,
			duration: this.config.defaultDuration,
			...options,
		});
	}

	// Error message
	showError(message: string, title?: string, options?: Partial<V9Message>): V9Message {
		return this.addMessage({
			type: 'error',
			category: 'toast',
			message,
			title,
			duration: this.config.defaultDuration,
			...options,
		});
	}

	// Warning message
	showWarning(message: string, title?: string, options?: Partial<V9Message>): V9Message {
		return this.addMessage({
			type: 'warning',
			category: 'toast',
			message,
			title,
			duration: this.config.defaultDuration,
			...options,
		});
	}

	// Info message
	showInfo(message: string, title?: string, options?: Partial<V9Message>): V9Message {
		return this.addMessage({
			type: 'info',
			category: 'toast',
			message,
			title,
			duration: this.config.defaultDuration,
			...options,
		});
	}

	// Critical error message
	showCritical(message: string, title?: string, options?: Partial<V9Message>): V9Message {
		return this.addMessage({
			type: 'critical',
			category: 'banner',
			message,
			title,
			persistent: true,
			...options,
		});
	}

	// Wait screen (blocking operation)
	showWaitScreen(message: string, title?: string, options?: Partial<V9Message>): V9Message {
		return this.addMessage({
			type: 'info',
			category: 'wait',
			message,
			title,
			blocking: true,
			persistent: true,
			...options,
		});
	}

	// Hide wait screen
	hideWaitScreen(): void {
		if (this.state.waitScreen) {
			this.removeMessage(this.state.waitScreen.id);
		}
	}

	// Banner message (persistent context)
	showBanner(
		message: string,
		title?: string,
		type: MessageType = 'info',
		options?: Partial<V9Message>
	): V9Message {
		return this.addMessage({
			type,
			category: 'banner',
			message,
			title,
			persistent: true,
			...options,
		});
	}

	// Hide banner
	hideBanner(): void {
		if (this.state.bannerMessage) {
			this.removeMessage(this.state.bannerMessage.id);
		}
	}

	// Footer message (status updates)
	showFooter(message: string, title?: string, options?: Partial<V9Message>): V9Message {
		return this.addMessage({
			type: 'info',
			category: 'footer',
			message,
			title,
			duration: this.config.defaultDuration,
			...options,
		});
	}

	// Hide footer
	hideFooter(): void {
		if (this.state.footerMessage) {
			this.removeMessage(this.state.footerMessage.id);
		}
	}

	// Modal message
	showModal(
		message: string,
		title?: string,
		type: MessageType = 'info',
		options?: Partial<V9Message>
	): V9Message {
		return this.addMessage({
			type,
			category: 'modal',
			message,
			title,
			persistent: true,
			...options,
		});
	}

	// Convert runtime error to user message
	handleError(error: Error | string, context?: string): V9Message {
		const errorMessage = error instanceof Error ? error.message : error;
		const title = context ? `Error in ${context}` : 'Error';

		return this.showError(errorMessage, title, {
			metadata: {
				originalError: error,
				context,
				timestamp: Date.now(),
			},
		});
	}

	// Convert runtime warning to user message
	handleWarning(warning: string | Error, context?: string): V9Message {
		const warningMessage = warning instanceof Error ? warning.message : warning;
		const title = context ? `Warning in ${context}` : 'Warning';

		return this.showWarning(warningMessage, title, {
			metadata: {
				originalWarning: warning,
				context,
				timestamp: Date.now(),
			},
		});
	}
}

// Singleton instance
export const v9MessagingService = new V9MessagingService();
