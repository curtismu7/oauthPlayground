import React, { useState } from 'react';
import styled from 'styled-components';
import { createModuleLogger } from '../utils/consoleMigrationHelper';
import { PingOneErrorInterpreter } from '../utils/pingoneErrorInterpreter';

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
  color: V9_COLORS.TEXT.GRAY_DARK;
  line-height: 1.5;
`;

const ErrorSuggestion = styled.div`
  background: #f3f4f6;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin: 0.75rem 0;
  border-left: 4px solid V9_COLORS.PRIMARY.BLUE;
`;

const SuggestionLabel = styled.div`
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
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
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.25rem;
  color: V9_COLORS.TEXT.GRAY_DARK;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: V9_COLORS.TEXT.GRAY_LIGHTER;
  }
`;

const CopyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: V9_COLORS.PRIMARY.BLUE;
  border: 1px solid V9_COLORS.PRIMARY.BLUE;
  border-radius: 0.25rem;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: V9_COLORS.PRIMARY.BLUE_DARK;
  }
`;

const TechnicalDetails = styled.div<{ $isExpanded: boolean }>`
  max-height: ${({ $isExpanded }) => ($isExpanded ? '200px' : '0')};
  overflow: hidden;
  transition: max-height 0.3s ease;
  margin-top: 0.75rem;
`;

const TechnicalContent = styled.pre`
  background: V9_COLORS.TEXT.GRAY_DARK;
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
				return '#ef4444';
			case 'network':
				return '#e0e7ff';
			case 'validation':
				return '#ecfdf5';
			default:
				return '#f3f4f6';
		}
	}};
  color: ${({ $category }) => {
		switch ($category) {
			case 'configuration':
				return '#2563eb';
			case 'authentication':
				return '#d97706';
			case 'authorization':
				return '#dc2626';
			case 'network':
				return '#3730a3';
			case 'validation':
				return '#059669';
			default:
				return '#1f2937';
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
			log.ui('PingOneErrorDisplay', 'Error details copied to clipboard');
		} catch (err) {
			log.error('PingOneErrorDisplay', 'Failed to copy error details', err);
		}
	};

	const handleToggleDetails = () => {
		setIsExpanded(!isExpanded);
		log.ui('PingOneErrorDisplay', `Technical details ${isExpanded ? 'collapsed' : 'expanded'}`);
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
				<SuggestionLabel> Suggestion:</SuggestionLabel>
				<SuggestionText>{interpretedError.suggestion}</SuggestionText>
			</ErrorSuggestion>

			<ErrorActions>
				<ToggleButton onClick={handleToggleDetails}>
					{isExpanded ? <span>⬆️</span> : <span>⬇️</span>}
					{isExpanded ? 'Hide' : 'Show'} Technical Details
				</ToggleButton>

				<CopyButton onClick={handleCopyError}>
					<span>📋</span>
					{copied ? 'Copied!' : 'Copy Error'}
				</CopyButton>

				{onRetry && (
					<CopyButton
						onClick={onRetry}
						style={{
							background: '#10b981',
							borderColor: '#10b981',
						}}
					>
						<span>🔗</span>
						Retry
					</CopyButton>
				)}

				{onDismiss && (
					<ToggleButton
						onClick={onDismiss}
						style={{
							background: '#ef4444',
							color: 'white',
							borderColor: '#ef4444',
						}}
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
