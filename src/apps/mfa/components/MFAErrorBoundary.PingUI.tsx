/**
 * @file MFAErrorBoundary.PingUI.tsx
 * @module v8/components
 * @description Ping UI migration of Error boundary component for graceful error handling in MFA flows
 * @version 9.1.0-PingUI
 *
 * Ping UI migration following pingui2.md standards:
 * - Added .end-user-nano namespace wrapper
 * - Replaced React Icons with MDI CSS icons
 * - Applied Ping UI CSS variables and transitions
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions
 */

import { Component, ErrorInfo, ReactNode } from 'react';

// MDI Icon Mapping for React Icons → MDI CSS
const getMDIIconClass = (fiIcon: string): string => {
	const iconMap: Record<string, string> = {
		FiAlertTriangle: 'mdi-alert',
		FiHome: 'mdi-home',
		FiRefreshCw: 'mdi-refresh',
	};
	return iconMap[fiIcon] || 'mdi-help-circle';
};

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 16, ariaLabel, ariaHidden = false, className = '', style }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<i
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
		></i>
	);
};

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

export class MFAErrorBoundaryPingUI extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('[MFA-ERROR-BOUNDARY-PINGUI] Caught error:', error, errorInfo);
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

			// PING UI MIGRATION: Added .end-user-nano wrapper as required by pingui2.md
			return (
				<div className="end-user-nano">
					<div
						style={{
							minHeight: '100vh',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							background: 'var(--ping-secondary-color, #f8f9fa)',
							padding: 'var(--ping-spacing-lg, 1.5rem)',
						}}
					>
						<div
							style={{
								maxWidth: '600px',
								background: 'var(--ping-secondary-color, #f8f9fa)',
								borderRadius: 'var(--ping-border-radius-lg, 0.5rem)',
								padding: 'var(--ping-spacing-xl, 2rem)',
								boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
								textAlign: 'center',
								border: `1px solid var(--ping-border-color, #dee2e6)`,
							}}
						>
							{/* PING UI MIGRATION: Replaced FiAlertTriangle with MDI icon */}
							<MDIIcon
								icon="FiAlertTriangle"
								size={64}
								ariaLabel="Error occurred"
								style={{
									marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
									color: 'var(--ping-error-color, #dc3545)',
								}}
							/>
							<h1
								style={{
									fontSize: '24px',
									fontWeight: '700',
									color: 'var(--ping-text-color, #1a1a1a)',
									marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
								}}
							>
								Something went wrong
							</h1>
							<p
								style={{
									fontSize: '16px',
									color: 'var(--ping-text-color, #1a1a1a)',
									marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
									lineHeight: '1.6',
								}}
							>
								We encountered an unexpected error in the MFA flow. Don't worry, your data is safe.
							</p>

							{process.env.NODE_ENV === 'development' && this.state.error && (
								<details
									style={{
										marginBottom: 'var(--ping-spacing-lg, 1.5rem)',
										padding: 'var(--ping-spacing-md, 1rem)',
										background: 'rgba(220, 53, 69, 0.1)',
										borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
										textAlign: 'left',
										border: `1px solid var(--ping-error-color, #dc3545)`,
									}}
								>
									<summary
										style={{
											cursor: 'pointer',
											fontWeight: '600',
											color: 'var(--ping-error-color, #dc3545)',
											transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
										}}
									>
										Error Details (Dev Only)
									</summary>
									<pre
										style={{
											marginTop: 'var(--ping-spacing-sm, 0.5rem)',
											fontSize: '12px',
											color: 'var(--ping-error-color, #dc3545)',
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

							<div
								style={{
									display: 'flex',
									gap: 'var(--ping-spacing-sm, 0.5rem)',
									justifyContent: 'center',
								}}
							>
								<button
									type="button"
									onClick={this.handleReset}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 'var(--ping-spacing-xs, 0.25rem)',
										padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-lg, 1.5rem)',
										background: 'var(--ping-primary-color, #0066cc)',
										color: 'white',
										border: 'none',
										borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
										fontSize: '16px',
										fontWeight: '600',
										cursor: 'pointer',
										transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
									}}
									aria-label="Try again"
								>
									{/* PING UI MIGRATION: Replaced FiRefreshCw with MDI icon */}
									<MDIIcon icon="FiRefreshCw" size={18} ariaLabel="Refresh" />
									Try Again
								</button>
								<button
									type="button"
									onClick={this.handleGoHome}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 'var(--ping-spacing-xs, 0.25rem)',
										padding: 'var(--ping-spacing-sm, 0.5rem) var(--ping-spacing-lg, 1.5rem)',
										background: 'var(--ping-secondary-color, #f8f9fa)',
										color: 'var(--ping-text-color, #1a1a1a)',
										border: `1px solid var(--ping-border-color, #dee2e6)`,
										borderRadius: 'var(--ping-border-radius-md, 0.375rem)',
										fontSize: '16px',
										fontWeight: '600',
										cursor: 'pointer',
										transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
									}}
									aria-label="Go to MFA hub"
								>
									{/* PING UI MIGRATION: Replaced FiHome with MDI icon */}
									<MDIIcon icon="FiHome" size={18} ariaLabel="Home" />
									Go to MFA Hub
								</button>
							</div>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default MFAErrorBoundaryPingUI;
