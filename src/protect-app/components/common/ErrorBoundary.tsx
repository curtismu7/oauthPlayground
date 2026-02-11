import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error?: Error;
	errorInfo?: ErrorInfo;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors in child components and displays a fallback UI.
 * Prevents the entire application from crashing due to component errors.
 */
export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		// Update state so the next render will show the fallback UI
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Log the error to console
		console.error('Error Boundary caught an error:', error, errorInfo);

		// Call custom error handler if provided
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}

		// Update state with error info
		this.setState({
			error,
			errorInfo,
		});
	}

	render() {
		if (this.state.hasError) {
			// Custom fallback UI
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// Default fallback UI
			return (
				<div className="min-h-screen bg-gray-50 flex items-center justify-center">
					<div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
						<div className="text-6xl mb-4">💥</div>
						<h1 className="text-2xl font-bold text-red-600 mb-4">
							Something went wrong
						</h1>
						<p className="text-gray-600 mb-6">
							We're sorry, but something unexpected happened. The error has been logged
							and our team will look into it.
						</p>

						{/* Error details in development */}
						{process.env.NODE_ENV === 'development' && this.state.error && (
							<details className="mb-6 text-left">
								<summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
									Error Details (Development Only)
								</summary>
								<div className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-40">
									<p className="font-mono mb-2">
										<strong>Error:</strong> {this.state.error.message}
									</p>
									<p className="font-mono mb-2">
										<strong>Stack:</strong>
									</p>
									<pre className="whitespace-pre-wrap text-xs">
										{this.state.error.stack}
									</pre>
									{this.state.errorInfo && (
										<>
											<p className="font-mono mb-2 mt-4">
												<strong>Component Stack:</strong>
											</p>
											<pre className="whitespace-pre-wrap text-xs">
												{this.state.errorInfo.componentStack}
											</pre>
										</>
									)}
								</div>
							</details>
						)}

						<div className="space-y-3">
							<button
								type="button"
								onClick={() => window.location.reload()}
								className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								Reload Page
							</button>
							<button
								type="button"
								onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
								className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
							>
								Try Again
							</button>
						</div>

						<p className="text-xs text-gray-500 mt-6">
							If this problem persists, please contact your system administrator.
						</p>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
