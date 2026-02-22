/**
 * @file MFAErrorBoundary.tsx
 * @module v8/components
 * @description Error boundary component for graceful error handling in MFA flows
 * @version 9.1.0
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { FiAlertTriangle, FiHome, FiRefreshCw } from 'react-icons/fi';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

interface WindowWithAnalytics extends Window {
	analytics?: {
		track: (event: string, properties: Record<string, unknown>) => void;
	};
}

export class MFAErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('[MFA-ERROR-BOUNDARY] Caught error:', error, errorInfo);
		this.props.onError?.(error, errorInfo);

		// Send to analytics/monitoring if available
		if (typeof window !== 'undefined') {
			const win = window as WindowWithAnalytics;
			win.analytics?.track('MFA Flow Error', {
				error: error.message,
				stack: error.stack,
				componentStack: errorInfo.componentStack,
			});
		}
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	handleGoHome = () => {
		window.location.href = '/v8/mfa-config';
	};

	override render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div
					style={{
						minHeight: '100vh',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						background: '#f9fafb',
						padding: '20px',
					}}
				>
					<div
						style={{
							maxWidth: '600px',
							background: 'white',
							borderRadius: '12px',
							padding: '40px',
							boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
							textAlign: 'center',
						}}
					>
						<FiAlertTriangle size={64} color="#ef4444" style={{ marginBottom: '20px' }} />
						<h1
							style={{
								fontSize: '24px',
								fontWeight: '700',
								color: '#111827',
								marginBottom: '12px',
							}}
						>
							Something went wrong
						</h1>
						<p
							style={{
								fontSize: '16px',
								color: '#6b7280',
								marginBottom: '24px',
								lineHeight: '1.6',
							}}
						>
							We encountered an unexpected error in the MFA flow. Don't worry, your data is safe.
						</p>

						{process.env.NODE_ENV === 'development' && this.state.error && (
							<details
								style={{
									marginBottom: '24px',
									padding: '16px',
									background: '#fef2f2',
									borderRadius: '8px',
									textAlign: 'left',
								}}
							>
								<summary style={{ cursor: 'pointer', fontWeight: '600', color: '#dc2626' }}>
									Error Details (Dev Only)
								</summary>
								<pre
									style={{
										marginTop: '12px',
										fontSize: '12px',
										color: '#991b1b',
										overflow: 'auto',
										maxHeight: '200px',
									}}
								>
									{this.state.error.message}
									{'\n\n'}
									{this.state.error.stack}
								</pre>
							</details>
						)}

						<div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
							<button
								type="button"
								onClick={this.handleReset}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									padding: '12px 24px',
									background: '#3b82f6',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '16px',
									fontWeight: '600',
									cursor: 'pointer',
								}}
							>
								<FiRefreshCw size={18} />
								Try Again
							</button>
							<button
								type="button"
								onClick={this.handleGoHome}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									padding: '12px 24px',
									background: 'white',
									color: '#374151',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '16px',
									fontWeight: '600',
									cursor: 'pointer',
								}}
							>
								<FiHome size={18} />
								Go to MFA Hub
							</button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
