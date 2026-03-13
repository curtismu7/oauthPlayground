import { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';
import {
	ErrorHandlingService,
	ErrorResponse,
	RecoveryOption,
} from '../services/errorHandlingService';
import { createModuleLogger } from '../utils/consoleMigrationHelper';

import { logger } from '../utils/logger';

const _log = createModuleLogger('ErrorBoundary');

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, V9_COLORS.BG.ERROR 0%, V9_COLORS.BG.ERROR 100%);
`;

const ErrorCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 3rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  text-align: center;
`;

const ErrorIcon = styled.div`
  color: V9_COLORS.PRIMARY.RED;
  font-size: 4rem;
  margin-bottom: 1.5rem;
`;

const ErrorTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin: 0 0 1rem 0;
`;

const ErrorMessage = styled.p`
  font-size: 1.125rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  margin: 0 0 2rem 0;
  line-height: 1.6;
`;

const ErrorDetails = styled.details`
  background: #f9fafb;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1.5rem 0;
  text-align: left;
`;

const ErrorSummary = styled.summary`
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  cursor: pointer;
  margin-bottom: 0.5rem;
`;

const ErrorStack = styled.pre`
  background: V9_COLORS.TEXT.GRAY_DARK;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  background: V9_COLORS.PRIMARY.BLUE;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
  
  &:hover {
    background: V9_COLORS.PRIMARY.BLUE_DARK;
  }
  
  &:nth-child(2) {
    background: V9_COLORS.TEXT.GRAY_MEDIUM;
    
    &:hover {
      background: #4b5563;
    }
  }
`;

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	errorResponse: ErrorResponse | null;
	showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			errorResponse: null,
			showDetails: false,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<State> {
		// Create error response using the ErrorHandlingService
		const errorResponse = ErrorHandlingService.handleFlowError(error, {
			flowId: 'error-boundary',
			metadata: {
				componentStack: error.stack,
				userAgent: navigator.userAgent,
				url: window.location.href,
				timestamp: new Date().toISOString(),
			},
		});

		return {
			hasError: true,
			errorResponse,
		};
	}

	override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Log additional error context
		logger.error('[ErrorBoundary] Caught error:', {
			error,
			errorInfo,
			componentStack: errorInfo.componentStack,
		});

		// Call optional onError callback
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}

		// Report to error tracking service with enhanced context
		this.reportError(error, errorInfo);
	}

	private reportError(error: Error, errorInfo: ErrorInfo) {
		// Enhanced error reporting with component stack
		const enhancedError = {
			...error,
			componentStack: errorInfo.componentStack,
			errorBoundary: true,
		};

		// Use ErrorHandlingService to report with additional context
		ErrorHandlingService.handleFlowError(enhancedError, {
			flowId: 'error-boundary',
			metadata: {
				componentStack: errorInfo.componentStack,
				errorBoundary: true,
				errorBoundaryStack: errorInfo.componentStack,
			},
		});
	}

	private handleRecovery = (option: RecoveryOption) => {
		try {
			// Execute the recovery action
			const result = option.action();

			// If it's a promise, handle it
			if (result instanceof Promise) {
				result
					.then(() => {
						this.resetError();
					})
					.catch((recoveryError) => {
						logger.error('[ErrorBoundary] Recovery action failed:', {
							action: option.action,
							recoveryError: recoveryError as Error,
						});
						// Could show additional error message here
					});
			} else {
				// Synchronous action completed
				this.resetError();
			}
		} catch (error) {
			logger.error('[ErrorBoundary] Recovery action threw error:', {
				action: option.action,
				error: error as Error,
			});
			// Could show additional error message here
		}
	};

	private resetError = () => {
		this.setState({
			hasError: false,
			errorResponse: null,
			showDetails: false,
		});
	};

	private toggleDetails = () => {
		this.setState((prevState) => ({
			showDetails: !prevState.showDetails,
		}));
	};

	override render() {
		if (this.state.hasError && this.state.errorResponse) {
			// Use custom fallback if provided
			if (this.props.fallback) {
				return this.props.fallback;
			}

			const { errorResponse } = this.state;

			return (
				<ErrorContainer>
					<ErrorCard>
						<ErrorIcon>
							<span>⚠️</span>
						</ErrorIcon>

						<ErrorTitle>
							{errorResponse.severity === 'critical'
								? 'Critical Error'
								: errorResponse.severity === 'high'
									? 'Error Occurred'
									: 'Something went wrong'}
						</ErrorTitle>

						<ErrorMessage>{errorResponse.userMessage}</ErrorMessage>

						{errorResponse.recoveryOptions.length > 0 && (
							<ActionButtons>
								{errorResponse.recoveryOptions.map((option) => (
									<ActionButton
										key={option.id}
										onClick={() => this.handleRecovery(option)}
										style={{
											background: option.primary ? '#dc2626' : '#6b7280',
											marginRight: '0.5rem',
											marginBottom: '0.5rem',
										}}
									>
										{option.id === 'retry' && <span>🔄</span>}
										{option.id === 'contact-support' && <span>📧</span>}
										{option.id === 'check-connection' && <span>⚙️</span>}
										{option.label}
									</ActionButton>
								))}
							</ActionButtons>
						)}

						<ErrorDetails>
							<ErrorSummary onClick={this.toggleDetails}>
								{this.state.showDetails ? 'Hide' : 'Show'} Technical Details
							</ErrorSummary>

							{this.state.showDetails && (
								<ErrorStack>
									<strong>Error Type:</strong> {errorResponse.type}
									<br />
									<strong>Severity:</strong> {errorResponse.severity}
									<br />
									<strong>Message:</strong> {errorResponse.technicalMessage}
									<br />
									<strong>Correlation ID:</strong> {errorResponse.correlationId}
								</ErrorStack>
							)}
						</ErrorDetails>
					</ErrorCard>
				</ErrorContainer>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
