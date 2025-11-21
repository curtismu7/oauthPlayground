// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/components/FlowErrorBoundary.tsx
// V7.1 Flow Error Boundary - Graceful error handling for OAuth Authorization Code Flow

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FiAlertTriangle, FiChevronLeft, FiHome, FiRefreshCw } from 'react-icons/fi';
import styled from 'styled-components';
import { FLOW_CONSTANTS } from '../constants/flowConstants';
import { UI_CONSTANTS } from '../constants/uiConstants';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
	onRetry?: () => void;
	onReset?: () => void;
	showDetails?: boolean;
	flowName?: string;
}

interface State {
	hasError: boolean;
	error?: Error;
	errorInfo?: ErrorInfo;
	retryCount: number;
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: ${UI_CONSTANTS.SPACING['4XL']};
  text-align: center;
  background: ${UI_CONSTANTS.LAYOUT.MAIN_CARD_BACKGROUND};
  border: ${UI_CONSTANTS.LAYOUT.MAIN_CARD_BORDER};
  border-radius: ${UI_CONSTANTS.LAYOUT.MAIN_CARD_BORDER_RADIUS};
  box-shadow: ${UI_CONSTANTS.LAYOUT.MAIN_CARD_SHADOW};
`;

const ErrorIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin-bottom: ${UI_CONSTANTS.SPACING['2XL']};
  background: ${UI_CONSTANTS.STATUS.ERROR_BACKGROUND};
  border: 2px solid ${UI_CONSTANTS.STATUS.ERROR_BORDER};
  border-radius: 50%;
  color: ${UI_CONSTANTS.STATUS.ERROR_COLOR};
  font-size: 2rem;
`;

const ErrorTitle = styled.h2`
  margin: 0 0 ${UI_CONSTANTS.SPACING.MD} 0;
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES['2XL']};
  font-weight: ${UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.BOLD};
  color: ${UI_CONSTANTS.COLORS.GRAY_900};
`;

const ErrorMessage = styled.p`
  margin: 0 0 ${UI_CONSTANTS.SPACING['2XL']} 0;
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.BASE};
  color: ${UI_CONSTANTS.COLORS.GRAY_600};
  line-height: ${UI_CONSTANTS.TYPOGRAPHY.LINE_HEIGHTS.RELAXED};
  max-width: 500px;
`;

const ErrorDetails = styled.details`
  margin: ${UI_CONSTANTS.SPACING['2XL']} 0;
  padding: ${UI_CONSTANTS.SPACING.LG};
  background: ${UI_CONSTANTS.COLORS.GRAY_50};
  border: 1px solid ${UI_CONSTANTS.COLORS.GRAY_200};
  border-radius: ${UI_CONSTANTS.SECTION.BORDER_RADIUS};
  text-align: left;
  font-family: monospace;
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM};
  color: ${UI_CONSTANTS.COLORS.GRAY_700};
  max-width: 600px;
  width: 100%;
`;

const ErrorSummary = styled.summary`
  font-weight: ${UI_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS.SEMIBOLD};
  color: ${UI_CONSTANTS.COLORS.GRAY_800};
  cursor: pointer;
  margin-bottom: ${UI_CONSTANTS.SPACING.SM};
  
  &:hover {
    color: ${UI_CONSTANTS.COLORS.GRAY_900};
  }
`;

const ErrorStack = styled.pre`
  margin: 0;
  padding: ${UI_CONSTANTS.SPACING.SM};
  background: ${UI_CONSTANTS.COLORS.WHITE};
  border: 1px solid ${UI_CONSTANTS.COLORS.GRAY_200};
  border-radius: ${UI_CONSTANTS.SECTION.BORDER_RADIUS};
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.XS};
  line-height: ${UI_CONSTANTS.TYPOGRAPHY.LINE_HEIGHTS.NORMAL};
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: ${UI_CONSTANTS.SPACING.MD};
  flex-wrap: wrap;
  justify-content: center;
  margin-top: ${UI_CONSTANTS.SPACING['2XL']};
`;

const ErrorButton = styled.button<{ $variant: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: ${UI_CONSTANTS.SPACING.SM};
  padding: ${UI_CONSTANTS.SPACING.MD} ${UI_CONSTANTS.SPACING.LG};
  border: none;
  border-radius: ${UI_CONSTANTS.BUTTON.PRIMARY_BORDER_RADIUS};
  font-size: ${UI_CONSTANTS.BUTTON.PRIMARY_FONT_SIZE};
  font-weight: ${UI_CONSTANTS.BUTTON.PRIMARY_FONT_WEIGHT};
  cursor: pointer;
  transition: all ${UI_CONSTANTS.ANIMATION.DURATION_NORMAL} ${UI_CONSTANTS.ANIMATION.EASING_EASE};
  
  ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
          background: ${UI_CONSTANTS.BUTTON.PRIMARY_BACKGROUND};
          color: ${UI_CONSTANTS.BUTTON.PRIMARY_COLOR};
          box-shadow: ${UI_CONSTANTS.BUTTON.PRIMARY_SHADOW};
          
          &:hover {
            box-shadow: ${UI_CONSTANTS.BUTTON.PRIMARY_HOVER_SHADOW};
            transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_HOVER};
          }
          
          &:active {
            transform: ${UI_CONSTANTS.ANIMATION.TRANSFORM_SCALE_ACTIVE};
          }
        `;
			case 'secondary':
				return `
          background: ${UI_CONSTANTS.BUTTON.SECONDARY_BACKGROUND};
          color: ${UI_CONSTANTS.BUTTON.SECONDARY_COLOR};
          border: ${UI_CONSTANTS.BUTTON.SECONDARY_BORDER};
          
          &:hover {
            background: ${UI_CONSTANTS.BUTTON.SECONDARY_HOVER_BACKGROUND};
          }
        `;
			case 'danger':
				return `
          background: ${UI_CONSTANTS.STATUS.ERROR_COLOR};
          color: ${UI_CONSTANTS.COLORS.WHITE};
          
          &:hover {
            background: ${UI_CONSTANTS.COLORS.GRAY_700};
          }
        `;
			default:
				return '';
		}
	}}
`;

const RetryCounter = styled.div`
  margin-top: ${UI_CONSTANTS.SPACING.LG};
  padding: ${UI_CONSTANTS.SPACING.SM} ${UI_CONSTANTS.SPACING.MD};
  background: ${UI_CONSTANTS.STATUS.WARNING_BACKGROUND};
  border: 1px solid ${UI_CONSTANTS.STATUS.WARNING_BORDER};
  border-radius: ${UI_CONSTANTS.SECTION.BORDER_RADIUS};
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM};
  color: ${UI_CONSTANTS.STATUS.WARNING_COLOR};
`;

export class FlowErrorBoundary extends Component<Props, State> {
	private retryTimeoutId: NodeJS.Timeout | null = null;

	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			retryCount: 0,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<State> {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('Flow Error Boundary caught an error:', error, errorInfo);

		this.setState({
			error,
			errorInfo,
		});

		// Call the onError callback if provided
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}

		// Log error to external service (if available)
		this.logErrorToService(error, errorInfo);
	}

	componentWillUnmount() {
		if (this.retryTimeoutId) {
			clearTimeout(this.retryTimeoutId);
		}
	}

	private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
		// In a real application, you would send this to an error tracking service
		// like Sentry, LogRocket, or Bugsnag
		const errorData = {
			message: error.message,
			stack: error.stack,
			componentStack: errorInfo.componentStack,
			flowName: this.props.flowName || 'OAuth Authorization Code Flow V7.1',
			timestamp: new Date().toISOString(),
			userAgent: navigator.userAgent,
			url: window.location.href,
		};

		console.error('Error logged:', errorData);

		// Example: Send to error tracking service
		// errorTrackingService.captureException(error, { extra: errorData });
	};

	private handleRetry = () => {
		const { retryCount } = this.state;
		const newRetryCount = retryCount + 1;

		this.setState({
			hasError: false,
			error: undefined,
			errorInfo: undefined,
			retryCount: newRetryCount,
		});

		// Call the onRetry callback if provided
		if (this.props.onRetry) {
			this.props.onRetry();
		}

		// Auto-retry with exponential backoff (max 3 retries)
		if (newRetryCount < 3) {
			const delay = 2 ** newRetryCount * 1000; // 1s, 2s, 4s
			this.retryTimeoutId = setTimeout(() => {
				this.setState({ hasError: false });
			}, delay);
		}
	};

	private handleReset = () => {
		this.setState({
			hasError: false,
			error: undefined,
			errorInfo: undefined,
			retryCount: 0,
		});

		// Call the onReset callback if provided
		if (this.props.onReset) {
			this.props.onReset();
		}
	};

	private handleReload = () => {
		window.location.reload();
	};

	private handleGoHome = () => {
		window.location.href = '/';
	};

	private handleGoBack = () => {
		window.history.back();
	};

	render() {
		if (this.state.hasError) {
			// Use custom fallback if provided
			if (this.props.fallback) {
				return this.props.fallback;
			}

			const { error, errorInfo, retryCount } = this.state;
			const { showDetails = true, flowName = 'OAuth Authorization Code Flow' } = this.props;

			return (
				<ErrorContainer>
					<ErrorIcon>
						<FiAlertTriangle />
					</ErrorIcon>

					<ErrorTitle>Something went wrong in {flowName}</ErrorTitle>

					<ErrorMessage>
						An unexpected error occurred while processing the OAuth flow. This might be due to a
						network issue, invalid configuration, or a temporary problem.
					</ErrorMessage>

					{showDetails && error && (
						<ErrorDetails>
							<ErrorSummary>Error Details</ErrorSummary>
							<div>
								<strong>Error:</strong> {error.message}
							</div>
							{error.stack && (
								<div style={{ marginTop: UI_CONSTANTS.SPACING.SM }}>
									<strong>Stack Trace:</strong>
									<ErrorStack>{error.stack}</ErrorStack>
								</div>
							)}
							{errorInfo?.componentStack && (
								<div style={{ marginTop: UI_CONSTANTS.SPACING.SM }}>
									<strong>Component Stack:</strong>
									<ErrorStack>{errorInfo.componentStack}</ErrorStack>
								</div>
							)}
						</ErrorDetails>
					)}

					<ButtonContainer>
						<ErrorButton $variant="primary" onClick={this.handleRetry} disabled={retryCount >= 3}>
							<FiRefreshCw />
							{retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
						</ErrorButton>

						<ErrorButton $variant="secondary" onClick={this.handleReset}>
							<FiRefreshCw />
							Reset Flow
						</ErrorButton>

						<ErrorButton $variant="secondary" onClick={this.handleGoBack}>
							<FiChevronLeft />
							Go Back
						</ErrorButton>

						<ErrorButton $variant="secondary" onClick={this.handleGoHome}>
							<FiHome />
							Go Home
						</ErrorButton>

						<ErrorButton $variant="danger" onClick={this.handleReload}>
							<FiRefreshCw />
							Reload Page
						</ErrorButton>
					</ButtonContainer>

					{retryCount > 0 && <RetryCounter>Retry attempt: {retryCount} of 3</RetryCounter>}
				</ErrorContainer>
			);
		}

		return this.props.children;
	}
}

// Higher-order component for easier usage
export const withFlowErrorBoundary = <P extends object>(
	Component: React.ComponentType<P>,
	errorBoundaryProps?: Omit<Props, 'children'>
) => {
	const WrappedComponent = (props: P) => (
		<FlowErrorBoundary {...errorBoundaryProps}>
			<Component {...props} />
		</FlowErrorBoundary>
	);

	WrappedComponent.displayName = `withFlowErrorBoundary(${Component.displayName || Component.name})`;

	return WrappedComponent;
};

// Hook for error boundary context (if needed)
export const useFlowErrorBoundary = () => {
	const [error, setError] = React.useState<Error | null>(null);

	const resetError = React.useCallback(() => {
		setError(null);
	}, []);

	const captureError = React.useCallback((error: Error) => {
		setError(error);
	}, []);

	React.useEffect(() => {
		if (error) {
			throw error;
		}
	}, [error]);

	return { captureError, resetError };
};

export default FlowErrorBoundary;
