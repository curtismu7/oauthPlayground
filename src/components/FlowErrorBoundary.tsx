// src/components/FlowErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { FlowErrorService } from '../services/flowErrorService';
import { FlowType } from '../services/flowStepDefinitions';

/**
 * Props for FlowErrorBoundary
 */
interface FlowErrorBoundaryProps {
	/** Child components to wrap */
	children: ReactNode;
	/** Flow type for error context */
	flowType: FlowType;
	/** Flow-specific key */
	flowKey: string;
	/** Current step in the flow */
	currentStep?: number;
	/** Callback when an error is caught */
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
	/** Callback to retry/reset the flow */
	onReset?: () => void;
	/** Fallback UI (if provided, overrides default error display) */
	fallback?: ReactNode;
}

/**
 * State for FlowErrorBoundary
 */
interface FlowErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
	correlationId: string | null;
}

/**
 * FlowErrorBoundary - React Error Boundary for OAuth/OIDC flows
 *
 * This component catches React errors within flows and displays them
 * using the standardized error handling service. It provides:
 * - Automatic error catching and logging
 * - Standardized error display
 * - Flow context preservation
 * - Reset/retry functionality
 *
 * Usage:
 * ```tsx
 * <FlowErrorBoundary
 *   flowType="authorization-code"
 *   flowKey="oauth-authorization-code-v6"
 *   currentStep={currentStep}
 *   onReset={handleStartOver}
 * >
 *   <YourFlowComponent />
 * </FlowErrorBoundary>
 * ```
 */
export class FlowErrorBoundary extends Component<FlowErrorBoundaryProps, FlowErrorBoundaryState> {
	constructor(props: FlowErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
			correlationId: null,
		};
	}

	/**
	 * Static method called when an error is thrown
	 */
	static getDerivedStateFromError(error: Error): Partial<FlowErrorBoundaryState> {
		// Update state so the next render will show the fallback UI
		return {
			hasError: true,
			error,
			correlationId: FlowErrorService.generateCorrelationId(),
		};
	}

	/**
	 * Called when an error is caught
	 */
	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		const { onError, flowType, flowKey, currentStep } = this.props;
		const { correlationId } = this.state;

		// Update state with error info
		this.setState({ errorInfo });

		// Log the error using FlowErrorService
		FlowErrorService.logError({
			flowType,
			flowKey,
			currentStep,
			error,
			correlationId: correlationId || undefined,
			details: errorInfo.componentStack,
		});

		// Call custom error handler if provided
		if (onError) {
			onError(error, errorInfo);
		}
	}

	/**
	 * Reset the error boundary
	 */
	handleReset = (): void => {
		const { onReset } = this.props;

		// Reset state
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
			correlationId: null,
		});

		// Call custom reset handler if provided
		if (onReset) {
			onReset();
		}
	};

	render(): ReactNode {
		const { hasError, error, errorInfo, correlationId } = this.state;
		const { children, fallback, flowType, flowKey, currentStep } = this.props;

		// If there's an error, display error UI
		if (hasError && error) {
			// Use custom fallback if provided
			if (fallback) {
				return fallback;
			}

			// Otherwise, use standardized error display
			return FlowErrorService.getFullPageError({
				flowType,
				flowKey,
				currentStep,
				errorCategory: 'GENERIC_ERROR',
				title: 'An Unexpected Error Occurred',
				description: error.message,
				details: errorInfo?.componentStack,
				error,
				correlationId: correlationId || undefined,
				onRetry: this.handleReset,
				onStartOver: this.handleReset,
			});
		}

		// No error, render children normally
		return children;
	}
}
