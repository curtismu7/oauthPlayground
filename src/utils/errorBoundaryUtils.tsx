/**
 * Error boundary utilities to handle browser extension and external script errors
 */

import React from 'react';
import { logger } from './logger';

/**
 * Error boundary component to catch and handle external script errors
 */
export class ExternalScriptErrorBoundary extends React.Component<
	{ children: React.ReactNode; fallback?: React.ReactNode },
	{ hasError: boolean; error?: Error }
> {
	constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error) {
		// Check if error is from browser extensions or external scripts
		const isExternalError =
			error.message?.includes('bootstrap-autofill-overlay') ||
			error.message?.includes('WebSocket') ||
			error.message?.includes('Cannot read properties of null') ||
			error.stack?.includes('bootstrap-autofill-overlay') ||
			error.stack?.includes('extension://');

		if (isExternalError) {
			console.warn('External script error caught and suppressed:', error.message);
			return { hasError: false }; // Don't show error for external scripts
		}

		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		const isExternalError =
			error.message?.includes('bootstrap-autofill-overlay') ||
			error.message?.includes('WebSocket') ||
			error.message?.includes('Cannot read properties of null') ||
			error.stack?.includes('bootstrap-autofill-overlay') ||
			error.stack?.includes('extension://');

		if (isExternalError) {
			// Log but don't crash for external script errors
			logger.warn('ExternalScriptErrorBoundary', 'External script error caught', {
				message: error.message,
				stack: error.stack,
				componentStack: errorInfo.componentStack,
			});
		} else {
			// Log application errors normally
			logger.error(
				'ExternalScriptErrorBoundary',
				'Application error',
				{
					message: error.message,
					stack: error.stack,
					componentStack: errorInfo.componentStack,
				},
				error
			);
		}
	}

	render() {
		if (this.state.hasError && this.state.error) {
			return (
				this.props.fallback || (
					<div
						style={{
							padding: '1rem',
							border: '1px solid #ef4444',
							borderRadius: '0.5rem',
							margin: '1rem 0',
						}}
					>
						<h3 style={{ color: '#ef4444', margin: '0 0 0.5rem 0' }}>Something went wrong</h3>
						<p style={{ margin: 0, color: '#6b7280' }}>{this.state.error.message}</p>
					</div>
				)
			);
		}

		return this.props.children;
	}
}

/** Returns true if the message is from a known external source (extension, HMR WebSocket). */
function isExternalErrorMessage(message: string): boolean {
	return (
		message.includes('bootstrap-autofill-overlay') ||
		(message.includes('WebSocket') && message.includes('failed')) ||
		(message.includes('Cannot read properties of null') && message.includes('includes')) ||
		message.includes('autofill_overlay_content_service') ||
		message.includes('AutofillOverlayContentService') ||
		(message.includes('wss://') && message.includes('failed'))
	);
}

/**
 * Utility to suppress known browser extension and HMR WebSocket errors from the console.
 */
export const suppressExternalErrors = () => {
	const originalConsoleError = console.error;
	const originalConsoleWarn = console.warn;

	// Override console.error to filter out known external script errors
	console.error = (...args: unknown[]) => {
		const message = typeof args[0] === 'string' ? args[0] : String(args[0]);
		if (isExternalErrorMessage(message)) {
			return;
		}
		originalConsoleError.apply(console, args);
	};

	// Also filter console.warn so Vite HMR WebSocket "failed" messages are suppressed
	console.warn = (...args: unknown[]) => {
		const message = typeof args[0] === 'string' ? args[0] : String(args[0]);
		if (isExternalErrorMessage(message)) {
			return;
		}
		originalConsoleWarn.apply(console, args);
	};

	// Handle unhandled promise rejections from external scripts (e.g. autofill overlay)
	window.addEventListener('unhandledrejection', (event) => {
		const msg = event.reason?.message != null ? String(event.reason.message) : '';
		if (isExternalErrorMessage(msg)) {
			event.preventDefault();
		}
	});

	// Handle unhandled errors from external scripts
	window.addEventListener('error', (event) => {
		if (event.message && isExternalErrorMessage(event.message)) {
			event.preventDefault();
		}
	});
};

/**
 * Hook to detect and handle browser extension interference
 */
export const useExternalErrorHandling = () => {
	React.useEffect(() => {
		suppressExternalErrors();
	}, []);
};
