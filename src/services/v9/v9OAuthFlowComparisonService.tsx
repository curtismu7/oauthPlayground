// src/services/v9/v9OAuthFlowComparisonService.tsx
// V9 Wrapper for OAuthFlowComparisonService - Modern Messaging Compliant

import React from 'react';
// Import Modern Messaging (V9) - proper migration to non-toast messaging
import { modernMessaging } from '../../components/v9/V9ModernMessagingComponents';
import { logger } from '../../utils/logger';
import { OAuthFlowComparisonService } from '../oauthFlowComparisonService';

// V9 Wrapper Service - wraps original with Modern Messaging
const V9OAuthFlowComparisonService = {
	// Wrapper for getComparisonTable with V9 error handling
	getComparisonTable(
		options: { highlightFlow?: 'jwt' | 'saml'; collapsed?: boolean } = {}
	): React.ReactElement {
		try {
			// Add V9 logging for comparison table usage
			logger.debug(
				'V9OAuthFlowComparisonService',
				`[V9 FlowComparison] Generating comparison table with highlight: ${options.highlightFlow || 'none'}`
			);

			// Wrap the original service with error handling
			const result = OAuthFlowComparisonService.getComparisonTable(options);

			// Add V9-specific error boundary wrapper
			return <div data-v9-flow-comparison={options.highlightFlow || 'default'}>{result}</div>;
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'Comparison Failed',
				message: 'Failed to generate flow comparison table',
				contactSupport: false,
			});

			// Return fallback error display
			return (
				<div
					style={{
						padding: '1rem',
						background: '#fef2f2',
						border: '1px solid #fecaca',
						borderRadius: '0.5rem',
						color: '#dc2626',
						textAlign: 'center',
					}}
				>
					<div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Flow Comparison Error</div>
					<div style={{ fontSize: '0.875rem' }}>
						Unable to display flow comparison table. Please try again.
					</div>
				</div>
			);
		}
	},

	// Add V9-specific logging for flow comparison operations
	logComparisonOperation(operation: string, details?: unknown) {
		logger.debug('V9OAuthFlowComparisonService', `[V9 FlowComparison] ${operation}`, details);
	},

	// Add V9 flow validation helper
	validateFlowComparison(highlightFlow?: 'jwt' | 'saml'): boolean {
		try {
			if (highlightFlow && !['jwt', 'saml'].includes(highlightFlow)) {
				modernMessaging.showCriticalError({
					title: 'Invalid Flow Type',
					message: 'Invalid flow type for comparison',
					contactSupport: false,
				});
				return false;
			}

			return true;
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'Validation Failed',
				message: 'Flow comparison validation failed',
				contactSupport: false,
			});
			return false;
		}
	},

	// Add V9 helper for creating comparison options
	createComparisonOptions(highlightFlow?: 'jwt' | 'saml', collapsed: boolean = true) {
		return {
			highlightFlow,
			collapsed,
		};
	},
};

export default V9OAuthFlowComparisonService;
