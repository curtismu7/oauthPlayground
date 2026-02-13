/**
 * @file ErrorBoundary.tsx
 * @module v8u/components/common
 * @description Error boundary component for user management app
 * @version 1.0.0
 * @since 2026-02-12
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
	errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: React.ComponentType<{ error?: Error; errorInfo?: ErrorInfo; resetError: () => void }>;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.setState({ error, errorInfo });
	}

	resetError = () => {
		this.setState({ hasError: false, error: undefined, errorInfo: undefined });
	};

	render() {
		if (this.state.hasError) {
			const FallbackComponent = this.props.fallback || DefaultErrorFallback;
			return (
				<FallbackComponent
					error={this.state.error}
					errorInfo={this.state.errorInfo}
					resetError={this.resetError}
				/>
			);
		}

		return this.props.children;
	}
}

function DefaultErrorFallback({
	error,
	errorInfo,
	resetError,
}: {
	error?: Error;
	errorInfo?: ErrorInfo;
	resetError: () => void;
}) {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="text-center p-8">
				<div className="text-6xl mb-4">🚨</div>
				<h1 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h1>
				<p className="text-gray-600 mb-4">{error?.message || 'An unexpected error occurred'}</p>
				{process.env.NODE_ENV === 'development' && errorInfo && (
					<details className="mt-4 text-left">
						<summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
							Error Details
						</summary>
						<pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
							{errorInfo.componentStack}
						</pre>
					</details>
				)}
				<button
					onClick={resetError}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					Try Again
				</button>
			</div>
		</div>
	);
}
