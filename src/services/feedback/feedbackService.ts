/**
 * @file feedbackService.ts
 * @module services/feedback
 * @description Feedback service replacing toast managers
 * @version 9.3.6
 * @since 2026-02-23
 *
 * Provides a unified feedback service that replaces toast notifications
 * with better UX patterns including inline messages, page banners,
 * and snackbars.
 *
 * @example
 * feedbackService.showInlineError('This field is required', 'environmentId');
 * feedbackService.showPageBanner('Connection issues detected', 'warning');
 * feedbackService.showSnackbar('Configuration saved', 'success');
 */

import React from 'react';

// Import the new feedback components
import { InlineMessage, type InlineMessageProps } from '@/components/feedback/InlineMessage';
import { PageBanner } from '@/components/feedback/PageBanner';
import { Snackbar } from '@/components/feedback/Snackbar';

// Types for feedback messages
export type FeedbackType = 'error' | 'warning' | 'info' | 'success';

export interface InlineFeedbackOptions {
	type: FeedbackType;
	message: string;
	title?: string;
	field?: string;
	dismissible?: boolean;
	action?: {
		label: string;
		onClick: () => void;
	};
}

export interface BannerFeedbackOptions {
	type: FeedbackType;
	title: string;
	message?: string;
	dismissible?: boolean;
	persistent?: boolean;
	action?: {
		label: string;
		onClick: () => void;
		disabled?: boolean;
	};
	role?: 'alert' | 'status';
}

export interface SnackbarFeedbackOptions {
	type: 'success' | 'info' | 'warning';
	message: string;
	duration?: number;
	action?: {
		label: string;
		onClick: () => void;
	};
	onDismiss?: () => void;
	manualDismiss?: boolean;
}

// Feedback service class
export class FeedbackService {
	private static instance: FeedbackService;
	private snackbarQueue: Array<{
		id: string;
		options: SnackbarFeedbackOptions;
		element: React.ReactElement;
	}> = [];
	private bannerQueue: Array<{
		id: string;
		options: BannerFeedbackOptions;
		element: React.ReactElement;
	}> = [];

	private constructor() {}

	static getInstance(): FeedbackService {
		if (!FeedbackService.instance) {
			FeedbackService.instance = new FeedbackService();
		}
		return FeedbackService.instance;
	}

	/**
	 * Show inline message for form validation and contextual feedback
	 */
	showInlineMessage(options: InlineFeedbackOptions): React.ReactElement {
		const props: Partial<InlineMessageProps> = {
			type: options.type,
			message: options.message,
		};

		if (options.title) props.title = options.title;
		if (options.field) props.field = options.field;
		if (options.dismissible !== undefined) props.dismissible = options.dismissible;
		if (options.action) props.action = options.action;

		// Build the final props object with only defined properties
		const finalProps: InlineMessageProps = {
			type: props.type!,
			message: props.message!,
			...(props.title && { title: props.title }),
			...(props.field && { field: props.field }),
			...(props.dismissible !== undefined && { dismissible: props.dismissible }),
			...(props.action && { action: props.action }),
		};

		return React.createElement(InlineMessage, finalProps);
	}

	/**
	 * Show inline error message
	 */
	showInlineError(
		message: string,
		field?: string,
		action?: { label: string; onClick: () => void }
	): React.ReactElement {
		const options: InlineFeedbackOptions = {
			type: 'error',
			message,
			dismissible: true,
		};

		if (field !== undefined) options.field = field;
		if (action !== undefined) options.action = action;

		return this.showInlineMessage(options);
	}

	/**
	 * Show inline warning message
	 */
	showInlineWarning(
		message: string,
		field?: string,
		action?: { label: string; onClick: () => void }
	): React.ReactElement {
		const options: InlineFeedbackOptions = {
			type: 'warning',
			message,
			dismissible: true,
		};

		if (field !== undefined) options.field = field;
		if (action !== undefined) options.action = action;

		return this.showInlineMessage(options);
	}

	/**
	 * Show inline success message
	 */
	showInlineSuccess(
		message: string,
		field?: string,
		action?: { label: string; onClick: () => void }
	): React.ReactElement {
		const options: InlineFeedbackOptions = {
			type: 'success',
			message,
			dismissible: true,
		};

		if (field !== undefined) options.field = field;
		if (action !== undefined) options.action = action;

		return this.showInlineMessage(options);
	}

	/**
	 * Show page banner for system-wide messages
	 */
	showPageBanner(options: BannerFeedbackOptions): React.ReactElement {
		const id = `banner-${Date.now()}-${Math.random()}`;

		// Build the final props object with only defined properties
		const finalProps: Record<string, unknown> = {
			type: options.type,
			title: options.title,
		};

		if (options.message !== undefined) finalProps.message = options.message;
		if (options.dismissible !== undefined) finalProps.dismissible = options.dismissible;
		if (options.persistent !== undefined) finalProps.persistent = options.persistent;
		if (options.action !== undefined) finalProps.action = options.action;
		if (options.role !== undefined) finalProps.role = options.role;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const element = React.createElement(PageBanner, finalProps as any);

		// Add to queue for management
		this.bannerQueue.push({ id, options, element });

		return element;
	}

	/**
	 * Show error banner
	 */
	showErrorBanner(
		title: string,
		message?: string,
		action?: { label: string; onClick: () => void }
	): React.ReactElement {
		const options: BannerFeedbackOptions = {
			type: 'error',
			title,
			dismissible: true,
			role: 'alert',
		};

		if (message !== undefined) options.message = message;
		if (action !== undefined) options.action = action;

		return this.showPageBanner(options);
	}

	/**
	 * Show warning banner
	 */
	showWarningBanner(
		title: string,
		message?: string,
		action?: { label: string; onClick: () => void }
	): React.ReactElement {
		const options: BannerFeedbackOptions = {
			type: 'warning',
			title,
			dismissible: true,
			role: 'status',
		};

		if (message !== undefined) options.message = message;
		if (action !== undefined) options.action = action;

		return this.showPageBanner(options);
	}

	/**
	 * Show info banner
	 */
	showInfoBanner(
		title: string,
		message?: string,
		action?: { label: string; onClick: () => void }
	): React.ReactElement {
		const options: BannerFeedbackOptions = {
			type: 'info',
			title,
			dismissible: true,
			role: 'status',
		};

		if (message !== undefined) options.message = message;
		if (action !== undefined) options.action = action;

		return this.showPageBanner(options);
	}

	/**
	 * Show success banner
	 */
	showSuccessBanner(
		title: string,
		message?: string,
		action?: { label: string; onClick: () => void }
	): React.ReactElement {
		const options: BannerFeedbackOptions = {
			type: 'success',
			title,
			dismissible: true,
			role: 'status',
		};

		if (message !== undefined) options.message = message;
		if (action !== undefined) options.action = action;

		return this.showPageBanner(options);
	}

	/**
	 * Show snackbar for brief confirmations
	 */
	showSnackbar(options: SnackbarFeedbackOptions): React.ReactElement {
		const id = `snackbar-${Date.now()}-${Math.random()}`;

		// Build the final props object with only defined properties
		const finalProps: Record<string, unknown> = {
			message: options.message,
			type: options.type,
		};

		if (options.duration !== undefined) finalProps.duration = options.duration;
		if (options.action !== undefined) finalProps.action = options.action;
		if (options.onDismiss !== undefined) finalProps.onDismiss = options.onDismiss;
		if (options.manualDismiss !== undefined) finalProps.manualDismiss = options.manualDismiss;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const element = React.createElement(Snackbar, finalProps as any);

		// Add to queue for management
		this.snackbarQueue.push({ id, options, element });

		return element;
	}

	/**
	 * Show success snackbar
	 */
	showSuccessSnackbar(
		message: string,
		action?: { label: string; onClick: () => void },
		duration?: number
	): React.ReactElement {
		const options: SnackbarFeedbackOptions = {
			type: 'success',
			message,
			duration: duration || 4000,
		};

		if (action !== undefined) options.action = action;

		return this.showSnackbar(options);
	}

	/**
	 * Show info snackbar
	 */
	showInfoSnackbar(
		message: string,
		action?: { label: string; onClick: () => void },
		duration?: number
	): React.ReactElement {
		const options: SnackbarFeedbackOptions = {
			type: 'info',
			message,
			duration: duration || 4000,
		};

		if (action !== undefined) options.action = action;

		return this.showSnackbar(options);
	}

	/**
	 * Show warning snackbar
	 */
	showWarningSnackbar(
		message: string,
		action?: { label: string; onClick: () => void },
		duration?: number
	): React.ReactElement {
		const options: SnackbarFeedbackOptions = {
			type: 'warning',
			message,
			duration: duration || 6000,
		};

		if (action !== undefined) options.action = action;

		return this.showSnackbar(options);
	}

	/**
	 * Get active banners
	 */
	getActiveBanners(): Array<{
		id: string;
		options: BannerFeedbackOptions;
		element: React.ReactElement;
	}> {
		return this.bannerQueue;
	}

	/**
	 * Get active snackbars
	 */
	getActiveSnackbars(): Array<{
		id: string;
		options: SnackbarFeedbackOptions;
		element: React.ReactElement;
	}> {
		return this.snackbarQueue;
	}

	/**
	 * Clear all banners
	 */
	clearBanners(): void {
		this.bannerQueue = [];
	}

	/**
	 * Clear all snackbars
	 */
	clearSnackbars(): void {
		this.snackbarQueue = [];
	}

	/**
	 * Clear all feedback
	 */
	clearAll(): void {
		this.clearBanners();
		this.clearSnackbars();
	}
}

// Export singleton instance
export const feedbackService = FeedbackService.getInstance();

// Export convenience methods for backward compatibility with toast patterns
export const showInlineError = (
	message: string,
	field?: string,
	action?: { label: string; onClick: () => void }
) => feedbackService.showInlineError(message, field, action);

export const showInlineWarning = (
	message: string,
	field?: string,
	action?: { label: string; onClick: () => void }
) => feedbackService.showInlineWarning(message, field, action);

export const showInlineSuccess = (
	message: string,
	field?: string,
	action?: { label: string; onClick: () => void }
) => feedbackService.showInlineSuccess(message, field, action);

export const showErrorBanner = (
	title: string,
	message?: string,
	action?: { label: string; onClick: () => void }
) => feedbackService.showErrorBanner(title, message, action);

export const showWarningBanner = (
	title: string,
	message?: string,
	action?: { label: string; onClick: () => void }
) => feedbackService.showWarningBanner(title, message, action);

export const showInfoBanner = (
	title: string,
	message?: string,
	action?: { label: string; onClick: () => void }
) => feedbackService.showInfoBanner(title, message, action);

export const showSuccessBanner = (
	title: string,
	message?: string,
	action?: { label: string; onClick: () => void }
) => feedbackService.showSuccessBanner(title, message, action);

export const showSuccessSnackbar = (
	message: string,
	action?: { label: string; onClick: () => void }
) => feedbackService.showSuccessSnackbar(message, action);

export const showInfoSnackbar = (
	message: string,
	action?: { label: string; onClick: () => void }
) => feedbackService.showInfoSnackbar(message, action);

export const showWarningSnackbar = (
	message: string,
	action?: { label: string; onClick: () => void }
) => feedbackService.showWarningSnackbar(message, action);

export default feedbackService;
