
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/NewAuthContext';
import { PingOneErrorInterpreter } from '../utils/pingoneErrorInterpreter';

const ErrorContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 500px;
  background: white;
  border: 2px solid V9_COLORS.PRIMARY.RED;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 1rem;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const ErrorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const ErrorIcon = styled.div`
  color: V9_COLORS.PRIMARY.RED;
  font-size: 1.5rem;
  margin-right: 0.5rem;
`;

const ErrorTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: V9_COLORS.PRIMARY.RED;
  flex: 1;
`;

const DismissButton = styled.button`
  background: none;
  border: none;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #f3f4f6;
    color: V9_COLORS.TEXT.GRAY_DARK;
  }
`;

const ErrorMessage = styled.p`
  margin: 0;
  color: V9_COLORS.TEXT.GRAY_DARK;
  line-height: 1.5;
  font-size: 0.875rem;
`;

const ErrorSuggestion = styled.div`
  background: V9_COLORS.BG.ERROR;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin: 0.75rem 0 0 0;
  border-left: 4px solid V9_COLORS.PRIMARY.RED;
`;

const SuggestionLabel = styled.div`
  font-weight: 600;
  color: V9_COLORS.PRIMARY.RED_DARK;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
`;

const SuggestionText = styled.div`
  color: #7f1d1d;
  font-size: 0.75rem;
  line-height: 1.4;
`;

const GlobalErrorDisplay: React.FC = () => {
	const { error, dismissError } = useAuth();

	// Handle ESC key to close error
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && error) {
				dismissError();
			}
		};

		if (error) {
			document.addEventListener('keydown', handleEscape);
			return () => document.removeEventListener('keydown', handleEscape);
		}
	}, [error, dismissError]);

	if (!error) {
		return null;
	}

	// Try to interpret the error using PingOne error interpreter
	let interpretedError;
	try {
		interpretedError = PingOneErrorInterpreter.interpret({
			error: 'token_exchange_failed',
			error_description: error,
			details: { originalError: error },
		});
	} catch {
		// Fallback if interpretation fails
		interpretedError = {
			title: 'Authentication Error',
			message: error,
			suggestion: 'Please check your configuration and try again.',
			severity: 'error',
			category: 'authentication',
		};
	}

	return (
		<ErrorContainer>
			<ErrorHeader>
				<ErrorIcon>
					<span>⚠️</span>
				</ErrorIcon>
				<ErrorTitle>{interpretedError.title}</ErrorTitle>
				<DismissButton onClick={dismissError} title="Dismiss error">
					<span>❌</span>
				</DismissButton>
			</ErrorHeader>

			<ErrorMessage>{interpretedError.message}</ErrorMessage>

			{interpretedError.suggestion && (
				<ErrorSuggestion>
					<SuggestionLabel> Suggestion:</SuggestionLabel>
					<SuggestionText>{interpretedError.suggestion}</SuggestionText>
				</ErrorSuggestion>
			)}
		</ErrorContainer>
	);
};

export default GlobalErrorDisplay;
