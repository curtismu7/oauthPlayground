/**
 * @file MFAErrorBoundary.tsx
 * @module apps/mfa/components/shared
 * @description MFA Error Boundary Component - Handles errors in MFA flows
 * @version 8.0.0
 * @since 2026-02-20
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
// Import error handler
import {
	ErrorSeverity,
	MFAError,
	MFAErrorHandler,
} from '@/apps/mfa/services/shared/mfaErrorHandler';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';

interface MFAErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
	flowType?: 'registration' | 'authentication';
	onErrorReset?: () => void;
}

interface MFAErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
	errorId: string | null;
	retryCount: number;
	isRecovering: boolean;
}

/**
 * MFA Error Boundary Component
 * Catches errors in MFA flows and provides recovery options
 */
export class MFAErrorBoundary extends Component<MFAErrorBoundaryProps, MFAErrorBoundaryState> {
	constructor(props: MFAErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
			errorId: null,
			retryCount: 0,
			isRecovering: false,
		};
	}

	static getDerivedStateFromError(error: Error): MFAErrorState {
		return {
			hasError: true,
			error,
			errorInfo: {
				componentStack: error.stack,
				message: error.message,
			},
			errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			retryCount: 0,
			isRecovering: false,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		super.componentDidCatch(error, errorInfo);

		// Create error context
		const context = {
			flowType: this.props.flowType || 'registration',
			currentStep: 0, // We don't have step info here, so default to 0
			stepName: 'Unknown',
			timestamp: Date.now(),
			userId: undefined,
			environmentId: undefined,
			deviceType: undefined,
		};

		// Handle error with MFA error handler
		const mfaError = MFAErrorHandler.handleError(error, context);

		// Update state with error info
		this.setState({
			hasError: true,
			error,
			errorInfo,
			errorId: mfaError.context.timestamp.toString(),
			retryCount: 0,
			isRecovering: false,
		});

		// Call error callback if provided
		this.props.onError?.(mfaError, errorInfo);
	}

	handleRetry = async (): Promise<void> => {
		const { error, errorId } = this.state;
		if (!error || !errorId) return;

		this.setState({ isRecovering: true });

		try {
			// Attempt recovery
			const recoveryActions = MFAErrorHandler.getRecoveryActions(error);
			const retryAction = recoveryActions.find((action) => action.label === 'Retry');

			if (retryAction?.available) {
				await retryAction.action();
				this.setState({
					hasError: false,
					error: null,
					errorInfo: null,
					errorId: null,
					isRecovering: false,
				});
			}
		} catch (retryError) {
			console.error('Retry failed:', retryError);
			this.setState({ isRecovering: false });
		}
	};

	handleRestart = async (): Promise<void> => {
		const { error } = this.state;
		if (!error) return;

		this.setState({ isRecovering: true });

		try {
			const recoveryActions = MFAErrorHandler.getRecoveryActions(error);
			const restartAction = recoveryActions.find((action) => action.label === 'Restart Flow');

			if (restartAction?.available) {
				await restartAction.action();
				this.setState({
					hasError: false,
					error: null,
					errorInfo: null,
					errorId: null,
					isRecovering: false,
				});
			}
		} catch (restartError) {
			console.error('Restart failed:', restartError);
			this.setState({ isRecovering: false });
		}
	};

	handleManualIntervention = (): void => {
		const { error } = this.state;
		if (!error) return;

		// Show detailed error information
		const recoveryActions = MFAErrorHandler.getRecoveryActions(error);
		const manualAction = recoveryActions.find((action) => action.label === 'Get Help');

		if (manualAction?.available) {
			manualAction.action();
		}
	};

	render(): ReactNode {
		if (this.state.hasError) {
			const { error, errorInfo, errorId, retryCount, isRecovering } = this.state;
			const { flowType = 'registration' } = this.props;

			// Determine error severity for styling
			const severity = error instanceof MFAError ? error.severity : ErrorSeverity.MEDIUM;
			const isHighSeverity = severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL;

			return (
				<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
					<div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 p-6">
						{/* Error Icon */}
						<div className="flex items-center justify-center mb-4">
							<div
								className={`w-16 h-16 rounded-full flex items-center justify-center ${
									isHighSeverity ? 'bg-red-100' : 'bg-yellow-100'
								}`}
							>
								<FiAlertTriangle
									className={`text-2xl ${isHighSeverity ? 'text-red-600' : 'text-yellow-600'}`}
								/>
							</div>
						</div>

						{/* Error Title */}
						<div className="text-center mb-4">
							<h2 className="text-xl font-semibold text-gray-900 mb-2">
								{isHighSeverity ? 'Critical Error' : 'Error Occurred'}
							</h2>
							<p className="text-sm text-gray-600">
								{flowType === 'registration' ? 'Registration' : 'Authentication'} flow encountered
								an issue
							</p>
						</div>

						{/* Error Details */}
						<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
							<div className="text-sm text-gray-700 mb-2">
								<strong>Error Details:</strong>
							</div>
							<div className="text-xs text-gray-600 font-mono break-all">{error?.message}</div>
							{errorInfo?.componentStack && (
								<details className="mt-2">
									<summary className="text-xs text-gray-500 cursor-pointer">
										Technical Details
									</summary>
									<pre className="text-xs text-gray-500 mt-2 overflow-x-auto">
										{errorInfo.componentStack}
									</pre>
								</details>
							)}
							<div className="mt-2 text-xs text-gray-500">Error ID: {errorId}</div>
							{retryCount > 0 && (
								<div className="mt-2 text-xs text-gray-500">Retry attempts: {retryCount}</div>
							)}
						</div>

						{/* User-friendly Message */}
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
							<div className="text-sm text-blue-800">
								<div className="flex">
									<FiAlertTriangle className="text-blue-600 mr-2 mt-0.5" />
									<div>
										<p className="font-medium">What happened?</p>
										<p className="text-xs mt-1">
											{MFAErrorHandler.createUserFriendlyMessage(error as MFAError)}
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Recovery Actions */}
						<div className="flex flex-col space-y-2">
							{isRecovering ? (
								<div className="flex items-center justify-center p-3 bg-gray-100 rounded-lg">
									<ButtonSpinner />
									<span className="ml-2 text-sm text-gray-600">Attempting recovery...</span>
								</div>
							) : (
								MFAErrorHandler.getRecoveryActions(error as MFAError).map((action, index) => (
									<button
										key={index}
										onClick={() => {
											if (action.available) {
												action.action();
											}
										}}
										disabled={!action.available || isRecovering}
										className={`w-full px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
											action.available && !isRecovering
												? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
												: 'bg-gray-300 text-gray-500 cursor-not-allowed'
										}`}
									>
										{isRecovering ? <ButtonSpinner /> : action.label}
									</button>
								))
							)}
						</div>

						{/* Fallback UI */}
						{this.props.fallback && (
							<div className="mt-4 pt-4 border-t border-gray-200">
								<div className="text-center">
									<p className="text-sm text-gray-600">Or you can return to the previous page</p>
									<button
										type="button"
										onClick={() => window.history.back()}
										className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
									>
										Go Back
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

/**
 * Error Recovery Component
 * Provides recovery options for MFA errors
 */
export const MFAErrorRecovery: React.FC<{
	error: MFAError;
	onRecovery?: () => void;
}> = ({ error, onRecovery }) => {
	const recoveryActions = MFAErrorHandler.getRecoveryActions(error);

	return (
		<div className="space-y-3">
			{recoveryActions.map((action, index) => (
				<button
					key={index}
					onClick={() => {
						if (action.available && action.action) {
							action.action();
							onRecovery?.();
						}
					}}
					disabled={!action.available}
					className={`w-full px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
						action.available
							? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
							: 'bg-gray-300 text-gray-500 cursor-not-allowed'
					}`}
				>
					{action.label}
				</button>
			))}
		</div>
	);
};

/**
 * Error Display Component
 * Shows error details and context
 */
export const MFAErrorDisplay: React.FC<{
	error: MFAError;
	showTechnicalDetails?: boolean;
}> = ({ error, showTechnicalDetails = false }) => {
	const severity = error.severity;
	const isHighSeverity = severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL;

	return (
		<div
			className={`rounded-lg p-4 ${
				isHighSeverity ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
			}`}
		>
			<div className="flex items-start">
				<div
					className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-3 ${
						isHighSeverity ? 'bg-red-100' : 'bg-yellow-100'
					}`}
				>
					{isHighSeverity ? (
						<FiAlertTriangle className="text-red-600" />
					) : (
						<FiAlertTriangle className="text-yellow-600" />
					)}
				</div>
				<div className="flex-1 min-w-0">
					<h4
						className={`text-sm font-medium ${isHighSeverity ? 'text-red-800' : 'text-yellow-800'}`}
					>
						{isHighSeverity ? 'Critical Error' : 'Error'}
					</h4>
					<p className="text-sm text-gray-700 mt-1">
						{MFAErrorHandler.createUserFriendlyMessage(error)}
					</p>
				</div>
			</div>

			{showTechnicalDetails && (
				<details className="mt-3">
					<summary className="text-xs text-gray-500 cursor-pointer">Technical Details</summary>
					<div className="mt-2 text-xs text-gray-600 font-mono bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto">
						<div className="space-y-1">
							<div>
								<strong>Error:</strong> {error.message}
							</div>
							<div>
								<strong>Flow:</strong> {error.context.flowType}
							</div>
							<div>
								<strong>Step:</strong> {error.context.stepName}
							</div>
							<div>
								<strong>Severity:</strong> {error.severity}
							</div>
							<div>
								<strong>Strategy:</strong> {error.recoveryOptions.strategy}
							</div>
							<div>
								<strong>Timestamp:</strong> {new Date(error.context.timestamp).toISOString()}
							</div>
							{error.originalError && (
								<div>
									<strong>Original Error:</strong> {error.originalError.message}
								</div>
							)}
						</div>
					</div>
				</details>
			)}
		</div>
	);
};

/**
 * Error Recovery Actions Component
 * Provides actionable recovery options
 */
export const MFAErrorRecoveryActions: React.FC<{
	error: MFAError;
	onAction?: (action: string) => void;
}> = ({ error, onAction }) => {
	const recoveryActions = MFAErrorHandler.getRecoveryActions(error);

	return (
		<div className="space-y-2">
			{recoveryActions.map((action, index) => (
				<button
					key={index}
					onClick={() => {
						if (action.available && action.action) {
							action.action();
							onAction?.(action.label);
						}
					}}
					disabled={!action.available}
					className={`w-full px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
						action.available
							? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
							: 'bg-gray-300 text-gray-500 cursor-not-allowed'
					}`}
				>
					{action.label}
				</button>
			))}
		</div>
	);
};

export default MFAErrorBoundary;
