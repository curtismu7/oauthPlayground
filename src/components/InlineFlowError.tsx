// src/components/InlineFlowError.tsx
import React from 'react';
import { FiAlertTriangle, FiInfo, FiSettings } from '@icons';
import styled from 'styled-components';
import { ERROR_MESSAGES, ErrorCategory } from '../constants/errorMessages';
import { OAuthErrorHelper } from './OAuthErrorHelper';

/**
 * Props for the InlineFlowError component
 */
export interface InlineFlowErrorProps {
	/** The error category/type (used to lookup standardized message) */
	errorCategory?: ErrorCategory;
	/** Custom error title (overrides category-based title) */
	title?: string;
	/** Error description/message */
	description?: string;
	/** Additional error details or technical information */
	details?: string;
	/** OAuth error code (from error parameter) */
	oauthError?: string;
	/** OAuth error description (from error_description parameter) */
	oauthErrorDescription?: string;
	/** Correlation ID for debugging */
	correlationId?: string;
	/** Callback for retry action */
	onRetry?: () => void;
	/** Callback for going to configuration */
	onGoToConfig?: () => void;
	/** Whether to show detailed error information */
	showDetails?: boolean;
	/** Severity level for styling */
	severity?: 'error' | 'warning' | 'info';
}

/**
 * InlineFlowError - A compact inline error component for displaying errors within a flow
 *
 * This component is designed for inline error display (e.g., within a step or section)
 * as opposed to full-page error displays. It provides:
 * - Standardized error messaging with actionable suggestions
 * - Optional OAuth error details
 * - Retry and configuration actions
 * - Collapsible technical details
 */
export const InlineFlowError: React.FC<InlineFlowErrorProps> = ({
	errorCategory,
	title,
	description,
	details,
	oauthError,
	oauthErrorDescription,
	correlationId,
	onRetry,
	onGoToConfig,
	showDetails = false,
	severity = 'error',
}) => {
	const [isDetailsExpanded, setIsDetailsExpanded] = React.useState(showDetails);

	// Get standardized error message if category provided
	const errorTemplate = errorCategory ? ERROR_MESSAGES[errorCategory] : null;

	// Use custom or template-based title/description
	const displayTitle = title || errorTemplate?.title || 'An Error Occurred';
	const displayDescription =
		description || errorTemplate?.description || 'Please check your configuration and try again.';
	const suggestions = errorTemplate?.suggestions || [];

	return (
		<ErrorContainer severity={severity}>
			<ErrorHeader>
				<ErrorIcon severity={severity}>
					<FiAlertTriangle size={20} />
				</ErrorIcon>
				<ErrorTitle>{displayTitle}</ErrorTitle>
			</ErrorHeader>

			<ErrorBody>
				<ErrorDescription>{displayDescription}</ErrorDescription>

				{/* Suggestions */}
				{suggestions.length > 0 && (
					<SuggestionsSection>
						<SuggestionsTitle>
							<FiInfo size={14} />
							Suggestions:
						</SuggestionsTitle>
						<SuggestionsList>
							{suggestions.map((suggestion, index) => (
								<SuggestionItem key={index}>{suggestion}</SuggestionItem>
							))}
						</SuggestionsList>
					</SuggestionsSection>
				)}

				{/* OAuth Error Details */}
				{(oauthError || oauthErrorDescription) && (
					<OAuthErrorSection>
						<OAuthErrorHelper
							error={oauthError}
							errorDescription={oauthErrorDescription}
							correlationId={correlationId}
						/>
					</OAuthErrorSection>
				)}

				{/* Technical Details (Collapsible) */}
				{details && (
					<DetailsSection>
						<DetailsToggle onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}>
							<FiSettings size={14} />
							{isDetailsExpanded ? 'Hide' : 'Show'} Technical Details
						</DetailsToggle>
						{isDetailsExpanded && <DetailsContent>{details}</DetailsContent>}
					</DetailsSection>
				)}

				{/* Correlation ID */}
				{correlationId && (
					<CorrelationId>
						Correlation ID: <code>{correlationId}</code>
					</CorrelationId>
				)}
			</ErrorBody>

			{/* Actions */}
			{(onRetry || onGoToConfig) && (
				<ErrorActions>
					{onRetry && (
						<ActionButton onClick={onRetry} variant="primary">
							Retry
						</ActionButton>
					)}
					{onGoToConfig && (
						<ActionButton onClick={onGoToConfig} variant="secondary">
							<FiSettings size={16} />
							Go to Configuration
						</ActionButton>
					)}
				</ErrorActions>
			)}
		</ErrorContainer>
	);
};

// Styled Components

const ErrorContainer = styled.div<{ severity: 'error' | 'warning' | 'info' }>`
  background-color: ${(props) => {
		switch (props.severity) {
			case 'error':
				return '#fef2f2';
			case 'warning':
				return '#fffbeb';
			case 'info':
				return '#eff6ff';
			default:
				return '#fef2f2';
		}
	}};
  border: 1px solid ${(props) => {
		switch (props.severity) {
			case 'error':
				return '#fecaca';
			case 'warning':
				return '#fde68a';
			case 'info':
				return '#bfdbfe';
			default:
				return '#fecaca';
		}
	}};
  border-left: 4px solid ${(props) => {
		switch (props.severity) {
			case 'error':
				return '#dc2626';
			case 'warning':
				return '#f59e0b';
			case 'info':
				return '#3b82f6';
			default:
				return '#dc2626';
		}
	}};
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
`;

const ErrorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const ErrorIcon = styled.div<{ severity: 'error' | 'warning' | 'info' }>`
  color: ${(props) => {
		switch (props.severity) {
			case 'error':
				return '#dc2626';
			case 'warning':
				return '#f59e0b';
			case 'info':
				return '#3b82f6';
			default:
				return '#dc2626';
		}
	}};
  flex-shrink: 0;
`;

const ErrorTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
`;

const ErrorBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ErrorDescription = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.5;
`;

const SuggestionsSection = styled.div`
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 0.375rem;
  padding: 0.75rem;
`;

const SuggestionsTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const SuggestionsList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  font-size: 0.875rem;
  color: #4b5563;
`;

const SuggestionItem = styled.li`
  margin-bottom: 0.25rem;
  line-height: 1.5;

  &:last-child {
    margin-bottom: 0;
  }
`;

const OAuthErrorSection = styled.div`
  margin-top: 0.5rem;
`;

const DetailsSection = styled.div`
  margin-top: 0.5rem;
`;

const DetailsToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  padding: 0;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s;

  &:hover {
    color: #374151;
  }
`;

const DetailsContent = styled.pre`
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  color: #374151;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const CorrelationId = styled.div`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;

  code {
    background-color: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }
`;

const ErrorActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
`;

const ActionButton = styled.button<{ variant: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;

  ${(props) =>
		props.variant === 'primary'
			? `
    background-color: #2563eb;
    color: white;
    border-color: #2563eb;

    &:hover {
      background-color: #1d4ed8;
      border-color: #1d4ed8;
    }
  `
			: `
    background-color: white;
    color: #374151;
    border-color: #d1d5db;

    &:hover {
      background-color: #f9fafb;
      border-color: #9ca3af;
    }
  `}
`;
