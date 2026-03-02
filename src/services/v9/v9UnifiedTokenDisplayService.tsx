// src/services/v9/v9UnifiedTokenDisplayService.tsx
// V9 Wrapper for UnifiedTokenDisplayService - Modern Messaging Compliant

import { UnifiedTokenDisplayService } from '../unifiedTokenDisplayService';
import { v9MessagingService } from './V9MessagingService';

// TokenResponse interface (copied from original for type safety)
interface TokenResponse {
	access_token?: string;
	id_token?: string;
	refresh_token?: string;
	[key: string]: unknown;
}

// V9 Wrapper Service - wraps original with Modern Messaging
const V9UnifiedTokenDisplayService = {
	// Wrapper for showTokens with V9 error handling
	showTokens(
		tokens: TokenResponse | null,
		flowType: 'oauth' | 'oidc' | 'par' | 'rar' | 'redirectless',
		flowKey: string,
		options?: {
			showCopyButtons?: boolean;
			showDecodeButtons?: boolean;
			className?: string;
		}
	) {
		try {
			// Add V9 logging for token display
			console.log(`[V9 TokenDisplay] Showing tokens for flow: ${flowKey}`);

			// Wrap the original service with error handling
			const result = UnifiedTokenDisplayService.showTokens(tokens, flowType, flowKey, options);

			// Add V9-specific error boundary wrapper
			return <div data-v9-token-display={flowKey}>{result}</div>;
		} catch (error) {
			v9MessagingService.showError('Failed to display tokens');
			console.error('Token display error:', error);

			// Return fallback error display
			return (
				<div
					style={{
						padding: '1rem',
						background: '#fef2f2',
						border: '1px solid #fecaca',
						borderRadius: '0.5rem',
						color: '#dc2626',
					}}
				>
					<div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Token Display Error</div>
					<div style={{ fontSize: '0.875rem' }}>Unable to display tokens. Please try again.</div>
				</div>
			);
		}
	},

	// Add V9-specific logging for token operations
	logTokenOperation(operation: string, flowKey: string, details?: unknown) {
		console.log(`[V9 TokenDisplay] ${operation} for flow: ${flowKey}`, details);
	},

	// Add V9 token validation helper
	validateTokenDisplay(tokens: unknown): boolean {
		try {
			if (!tokens) {
				v9MessagingService.showWarning('No tokens to display');
				return false;
			}

			if (typeof tokens !== 'object') {
				v9MessagingService.showError('Invalid token format');
				return false;
			}

			return true;
		} catch (error) {
			v9MessagingService.showError('Token validation failed');
			console.error('Token validation error:', error);
			return false;
		}
	},
};

export default V9UnifiedTokenDisplayService;
