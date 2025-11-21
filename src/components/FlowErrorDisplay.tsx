// src/components/FlowErrorDisplay.tsx
/**
 * Full-Page Error Display Component
 *
 * Displays errors with V5 stepper, error details, and action buttons.
 * Used in callback pages and major error states.
 */

import React from 'react';
import * as Icons from 'react-icons/fi';
import { FiHome, FiRefreshCw, FiSettings, FiXCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import type { ErrorTemplate } from '../constants/errorMessages';
import type { FlowType } from '../services/flowStepDefinitions';
import FlowSequenceDisplay from './FlowSequenceDisplay';
import OAuthErrorHelper from './OAuthErrorHelper';

export interface FlowErrorDisplayProps {
	// Flow context
	flowType: FlowType;
	flowKey: string;
	currentStep: number;

	// Error details
	errorTemplate: ErrorTemplate;
	errorCode?: string;
	errorDescription?: string;
	correlationId?: string;

	// Actions
	onStartOver?: () => void;
	onRetry?: () => void;
	onGoToConfig?: () => void;

	// Additional metadata
	metadata?: Record<string, any>;
}

const PageContainer = styled.div`
	min-height: 100vh;
	background: #f9fafb;
	padding: 2rem 1rem;
`;

const StepperContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto 2rem auto;
`;

const ErrorContainer = styled.div`
	max-width: 800px;
	margin: 0 auto;
`;

const ErrorCard = styled.div`
	background: white;
	border: 2px solid #fee2e2;
	border-radius: 1rem;
	padding: 2.5rem;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

const ErrorHeader = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 1.5rem;
	margin-bottom: 2rem;
`;

const ErrorIconWrapper = styled.div`
	flex-shrink: 0;
	width: 64px;
	height: 64px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #fee2e2;
	border-radius: 50%;
	color: #dc2626;
	font-size: 2rem;
`;

const ErrorContent = styled.div`
	flex: 1;
`;

const ErrorTitle = styled.h1`
	font-size: 1.75rem;
	font-weight: 700;
	color: #dc2626;
	margin: 0 0 0.5rem 0;
`;

const ErrorMessage = styled.p`
	font-size: 1.125rem;
	color: #6b7280;
	margin: 0;
	line-height: 1.6;
`;

const ErrorMetadata = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1.5rem 0;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.875rem;
`;

const MetadataRow = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
	
	&:last-child {
		margin-bottom: 0;
	}
`;

const MetadataLabel = styled.span`
	color: #6b7280;
	font-weight: 600;
	min-width: 140px;
`;

const MetadataValue = styled.span`
	color: #1f2937;
	word-break: break-all;
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 1rem;
	margin-top: 2rem;
	flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'ghost' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.875rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	border: 2px solid;
	
	${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: #3b82f6;
					color: white;
					border-color: #3b82f6;
					
					&:hover {
						background: #2563eb;
						border-color: #2563eb;
						transform: translateY(-2px);
						box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
					}
				`;
			case 'secondary':
				return `
					background: white;
					color: #3b82f6;
					border-color: #3b82f6;
					
					&:hover {
						background: #eff6ff;
						transform: translateY(-2px);
					}
				`;
			default:
				return `
					background: transparent;
					color: #6b7280;
					border-color: #d1d5db;
					
					&:hover {
						background: #f9fafb;
						color: #374151;
						border-color: #9ca3af;
					}
				`;
		}
	}}
	
	&:active {
		transform: translateY(0);
	}
	
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

export const FlowErrorDisplay: React.FC<FlowErrorDisplayProps> = ({
	flowType,
	flowKey,
	currentStep,
	errorTemplate,
	errorCode,
	errorDescription,
	correlationId,
	onStartOver,
	onRetry,
	onGoToConfig,
	metadata,
}) => {
	const navigate = useNavigate();

	// Get icon component
	const IconComponent = (Icons as any)[errorTemplate.icon] || FiXCircle;

	// Default handlers
	const handleStartOver = () => {
		if (onStartOver) {
			onStartOver();
		} else {
			// Default: navigate back to flow
			const flowPath = `/flows/${flowKey}`;
			navigate(flowPath);
		}
	};

	const handleRetry = () => {
		if (onRetry) {
			onRetry();
		} else {
			// Default: reload page
			window.location.reload();
		}
	};

	const handleGoToConfig = () => {
		if (onGoToConfig) {
			onGoToConfig();
		} else {
			// Default: go to configuration page
			navigate('/configuration');
		}
	};

	return (
		<PageContainer>
			<StepperContainer>
				<FlowSequenceDisplay flowType={flowType} />
			</StepperContainer>

			<ErrorContainer>
				<ErrorCard>
					<ErrorHeader>
						<ErrorIconWrapper>
							<IconComponent />
						</ErrorIconWrapper>
						<ErrorContent>
							<ErrorTitle>{errorTemplate.title}</ErrorTitle>
							<ErrorMessage>{errorTemplate.message}</ErrorMessage>
						</ErrorContent>
					</ErrorHeader>

					{(errorCode || errorDescription || correlationId) && (
						<ErrorMetadata>
							{errorCode && (
								<MetadataRow>
									<MetadataLabel>Error Code:</MetadataLabel>
									<MetadataValue>{errorCode}</MetadataValue>
								</MetadataRow>
							)}
							{errorDescription && (
								<MetadataRow>
									<MetadataLabel>Description:</MetadataLabel>
									<MetadataValue>{errorDescription}</MetadataValue>
								</MetadataRow>
							)}
							{correlationId && (
								<MetadataRow>
									<MetadataLabel>Correlation ID:</MetadataLabel>
									<MetadataValue>{correlationId}</MetadataValue>
								</MetadataRow>
							)}
							{metadata &&
								Object.entries(metadata).map(([key, value]) => (
									<MetadataRow key={key}>
										<MetadataLabel>{key}:</MetadataLabel>
										<MetadataValue>{String(value)}</MetadataValue>
									</MetadataRow>
								))}
						</ErrorMetadata>
					)}

					<OAuthErrorHelper
						error={errorCode || errorTemplate.title}
						errorDescription={errorDescription || errorTemplate.message}
						correlationId={correlationId || ''}
						onRetry={handleRetry}
						onGoToConfig={handleGoToConfig}
					/>

					<ActionButtons>
						<ActionButton $variant="primary" onClick={handleStartOver}>
							<FiHome size={18} />
							Start Over
						</ActionButton>

						{onRetry && (
							<ActionButton $variant="secondary" onClick={handleRetry}>
								<FiRefreshCw size={18} />
								Try Again
							</ActionButton>
						)}

						<ActionButton $variant="ghost" onClick={handleGoToConfig}>
							<FiSettings size={18} />
							Configuration
						</ActionButton>
					</ActionButtons>
				</ErrorCard>
			</ErrorContainer>
		</PageContainer>
	);
};

export default FlowErrorDisplay;
