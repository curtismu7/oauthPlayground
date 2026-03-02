// src/services/v9/v9OAuthFlowComparisonService.tsx
// V9 Wrapper for OAuthFlowComparisonService - Modern Messaging Compliant

import { OAuthFlowComparisonService } from '../oauthFlowComparisonService';
// Import Modern Messaging (V8) - established migration pattern
import { ToastNotificationsV8 as toastV8 } from '../../v8/utils/toastNotificationsV8';

// V9 Wrapper Service - wraps original with Modern Messaging
const V9OAuthFlowComparisonService = {
	// Wrapper for getComparisonTable with V9 error handling
	getComparisonTable(options: { highlightFlow?: 'jwt' | 'saml'; collapsed?: boolean } = {}) {
		try {
			// Add V9 logging for comparison table usage
			console.log(
				`[V9 FlowComparison] Generating comparison table with highlight: ${options.highlightFlow || 'none'}`
			);

			// Wrap the original service with error handling
			const result = OAuthFlowComparisonService.getComparisonTable(options);

			// Add V9-specific error boundary wrapper
			return <div data-v9-flow-comparison={options.highlightFlow || 'default'}>{result}</div>;
		} catch (error) {
			toastV8.error('Failed to generate flow comparison table');
			console.error('Flow comparison error:', error);

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
		console.log(`[V9 FlowComparison] ${operation}`, details);
	},

	// Add V9 flow validation helper
	validateFlowComparison(highlightFlow?: 'jwt' | 'saml'): boolean {
		try {
			if (highlightFlow && !['jwt', 'saml'].includes(highlightFlow)) {
				toastV8.error('Invalid flow type for comparison');
				return false;
			}

			return true;
		} catch (error) {
			toastV8.error('Flow comparison validation failed');
			console.error('Flow validation error:', error);
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
