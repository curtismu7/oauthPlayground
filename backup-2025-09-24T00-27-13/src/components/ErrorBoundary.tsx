import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
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
  color: #ef4444;
  font-size: 4rem;
  margin-bottom: 1.5rem;
`;

const ErrorTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
`;

const ErrorMessage = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.6;
`;

const ErrorDetails = styled.details`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1.5rem 0;
  text-align: left;
`;

const ErrorSummary = styled.summary`
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  margin-bottom: 0.5rem;
`;

const ErrorStack = styled.pre`
  background: #1f2937;
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
  background: #3b82f6;
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
    background: #2563eb;
  }
  
  &:nth-child(2) {
    background: #6b7280;
    
    &:hover {
      background: #4b5563;
    }
  }
`;

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
			errorInfo: null,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo);
		this.setState({
			error,
			errorInfo,
		});
	}

	handleReload = () => {
		window.location.reload();
	};

	handleGoHome = () => {
		window.location.href = '/dashboard';
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<ErrorContainer>
					<ErrorCard>
						<ErrorIcon>
							<FiAlertTriangle />
						</ErrorIcon>
						<ErrorTitle>Something went wrong</ErrorTitle>
						<ErrorMessage>
							An unexpected error occurred. This might be due to a server connectivity issue or a
							problem with the application.
						</ErrorMessage>

						<ErrorDetails>
							<ErrorSummary>Error Details</ErrorSummary>
							<div>
								<p>
									<strong>Error:</strong> {this.state.error?.message}
								</p>
								{this.state.errorInfo && (
									<ErrorStack>
										{this.state.error?.stack}
										{'\n\nComponent Stack:'}
										{this.state.errorInfo.componentStack}
									</ErrorStack>
								)}
							</div>
						</ErrorDetails>

						<ActionButtons>
							<ActionButton onClick={this.handleReload}>
								<FiRefreshCw />
								Reload Page
							</ActionButton>
							<ActionButton onClick={this.handleGoHome}>
								<FiHome />
								Go to Dashboard
							</ActionButton>
						</ActionButtons>
					</ErrorCard>
				</ErrorContainer>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
