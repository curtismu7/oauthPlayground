import React, { useState } from 'react';
import styled from 'styled-components';
import { FiAlertCircle, FiChevronDown, FiChevronUp, FiCopy, FiExternalLink } from 'react-icons/fi';
import { PingOneErrorInterpreter, type InterpretedError } from '../utils/pingoneErrorInterpreter';
import { logger } from '../utils/logger';

const ErrorContainer = styled.div<{ $severity: string }>`
  border: 2px solid ${({ $severity }) => {
		switch ($severity) {
			case 'error':
				return '#ef4444';
			case 'warning':
				return '#f59e0b';
			case 'info':
				return '#3b82f6';
			default:
				return '#6b7280';
		}
	}};
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  background: ${({ $severity }) => {
		switch ($severity) {
			case 'error':
				return 'rgba(239, 68, 68, 0.05)';
			case 'warning':
				return 'rgba(245, 158, 11, 0.05)';
			case 'info':
				return 'rgba(59, 130, 246, 0.05)';
			default:
				return 'rgba(107, 114, 128, 0.05)';
		}
	}};
`;

const ErrorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const ErrorIcon = styled.div<{ $severity: string }>`
  font-size: 1.5rem;
  color: ${({ $severity }) => {
		switch ($severity) {
			case 'error':
				return '#ef4444';
			case 'warning':
				return '#f59e0b';
			case 'info':
				return '#3b82f6';
			default:
				return '#6b7280';
		}
	}};
`;

const ErrorTitle = styled.h3<{ $severity: string }>`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ $severity }) => {
		switch ($severity) {
			case 'error':
				return '#ef4444';
			case 'warning':
				return '#f59e0b';
			case 'info':
				return '#3b82f6';
			default:
				return '#6b7280';
		}
	}};
`;

const ErrorMessage = styled.p`
  margin: 0.5rem 0;
  color: #374151;
  line-height: 1.5;
`;

const ErrorSuggestion = styled.div`
  background: #f3f4f6;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin: 0.75rem 0;
  border-left: 4px solid #3b82f6;
`;

const SuggestionLabel = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
`;

const SuggestionText = styled.div`
  color: #4b5563;
  font-size: 0.875rem;
  line-height: 1.4;
`;

const ErrorActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  color: #374151;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

const CopyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #3b82f6;
  border: 1px solid #3b82f6;
  border-radius: 0.25rem;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #2563eb;
  }
`;

const TechnicalDetails = styled.div<{ $isExpanded: boolean }>`
  max-height: ${({ $isExpanded }) => ($isExpanded ? '200px' : '0')};
  overflow: hidden;
  transition: max-height 0.3s ease;
  margin-top: 0.75rem;
`;

const TechnicalContent = styled.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
`;

const CategoryBadge = styled.span<{ $category: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  background: ${({ $category }) => {
		switch ($category) {
			case 'configuration':
				return '#dbeafe';
			case 'authentication':
				return '#fef3c7';
			case 'authorization':
				return '#fecaca';
			case 'network':
				return '#e0e7ff';
			case 'validation':
				return '#d1fae5';
			default:
				return '#f3f4f6';
		}
	}};
  color: ${({ $category }) => {
		switch ($category) {
			case 'configuration':
				return '#1e40af';
			case 'authentication':
				return '#92400e';
			case 'authorization':
				return '#991b1b';
			case 'network':
				return '#3730a3';
			case 'validation':
				return '#065f46';
			default:
				return '#374151';
		}
	}};
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: auto;
`;

interface PingOneErrorDisplayProps {
	error: unknown;
	onRetry?: () => void;
	onDismiss?: () => void;
}

const PingOneErrorDisplay: React.FC<PingOneErrorDisplayProps> = ({ error, onRetry, onDismiss }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [copied, setCopied] = useState(false);

	const interpretedError = PingOneErrorInterpreter.interpret(error);
	const errorIcon = PingOneErrorInterpreter.getErrorIcon(interpretedError.category);

	const handleCopyError = async () => {
		try {
			const errorText = PingOneErrorInterpreter.formatErrorForDisplay(interpretedError);
			await navigator.clipboard.writeText(errorText);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			logger.ui('PingOneErrorDisplay', 'Error details copied to clipboard');
		} catch (err) {
			logger.error('PingOneErrorDisplay', 'Failed to copy error details', err);
		}
	};

	const handleToggleDetails = () => {
		setIsExpanded(!isExpanded);
		logger.ui('PingOneErrorDisplay', `Technical details ${isExpanded ? 'collapsed' : 'expanded'}`);
	};

	return (
		<ErrorContainer $severity={interpretedError.severity}>
			<ErrorHeader>
				<ErrorIcon $severity={interpretedError.severity}>{errorIcon}</ErrorIcon>
				<ErrorTitle $severity={interpretedError.severity}>{interpretedError.title}</ErrorTitle>
				<CategoryBadge $category={interpretedError.category}>
					{interpretedError.category}
				</CategoryBadge>
			</ErrorHeader>

			<ErrorMessage>{interpretedError.message}</ErrorMessage>

			<ErrorSuggestion>
				<SuggestionLabel>💡 Suggestion:</SuggestionLabel>
				<SuggestionText>{interpretedError.suggestion}</SuggestionText>
			</ErrorSuggestion>

			<ErrorActions>
				<ToggleButton onClick={handleToggleDetails}>
					{isExpanded ? <FiChevronUp /> : <FiChevronDown />}
					{isExpanded ? 'Hide' : 'Show'} Technical Details
				</ToggleButton>

				<CopyButton onClick={handleCopyError}>
					<FiCopy />
					{copied ? 'Copied!' : 'Copy Error'}
				</CopyButton>

				{onRetry && (
					<CopyButton onClick={onRetry} style={{ background: '#10b981', borderColor: '#10b981' }}>
						<FiExternalLink />
						Retry
					</CopyButton>
				)}

				{onDismiss && (
					<ToggleButton
						onClick={onDismiss}
						style={{ background: '#ef4444', color: 'white', borderColor: '#ef4444' }}
					>
						Dismiss
					</ToggleButton>
				)}
			</ErrorActions>

			<TechnicalDetails $isExpanded={isExpanded}>
				<TechnicalContent>{interpretedError.technicalDetails}</TechnicalContent>
			</TechnicalDetails>
		</ErrorContainer>
	);
};

export default PingOneErrorDisplay;
