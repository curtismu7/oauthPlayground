// src/components/RARValidationDisplay.tsx
// RAR Validation Display with field-level validation feedback

import React, { useMemo } from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiShield, FiXCircle } from '@icons';
import styled from 'styled-components';
import RARService, { type AuthorizationDetail } from '../services/rarService';

interface RARValidationDisplayProps {
	authorizationDetails: AuthorizationDetail[];
	grantedScopes?: string[];
	className?: string;
	showScopeValidation?: boolean;
}

type ValidationLevel = 'success' | 'warning' | 'error' | 'info';

interface ValidationMessage {
	level: ValidationLevel;
	message: string;
	field?: string;
	detailIndex?: number;
}

const Container = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  overflow: hidden;
`;

const Header = styled.div<{ level: ValidationLevel }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: ${(props) => {
		switch (props.level) {
			case 'success':
				return '#f0fdf4';
			case 'warning':
				return '#fffbeb';
			case 'error':
				return '#fef2f2';
			default:
				return '#eff6ff';
		}
	}};
  border-bottom: 1px solid ${(props) => {
		switch (props.level) {
			case 'success':
				return '#bbf7d0';
			case 'warning':
				return '#fed7aa';
			case 'error':
				return '#fecaca';
			default:
				return '#bfdbfe';
		}
	}};
  color: ${(props) => {
		switch (props.level) {
			case 'success':
				return '#166534';
			case 'warning':
				return '#92400e';
			case 'error':
				return '#991b1b';
			default:
				return '#1e40af';
		}
	}};
`;

const HeaderIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`;

const HeaderText = styled.div`
  flex: 1;
`;

const HeaderTitle = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
`;

const HeaderSubtitle = styled.div`
  font-size: 0.75rem;
  opacity: 0.8;
  margin-top: 0.25rem;
`;

const Content = styled.div`
  padding: 1rem;
`;

const ValidationSection = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ValidationMessage = styled.div<{ level: ValidationLevel }>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  background: ${(props) => {
		switch (props.level) {
			case 'success':
				return '#f0fdf4';
			case 'warning':
				return '#fffbeb';
			case 'error':
				return '#fef2f2';
			default:
				return '#eff6ff';
		}
	}};
  border: 1px solid ${(props) => {
		switch (props.level) {
			case 'success':
				return '#bbf7d0';
			case 'warning':
				return '#fed7aa';
			case 'error':
				return '#fecaca';
			default:
				return '#bfdbfe';
		}
	}};
  color: ${(props) => {
		switch (props.level) {
			case 'success':
				return '#166534';
			case 'warning':
				return '#92400e';
			case 'error':
				return '#991b1b';
			default:
				return '#1e40af';
		}
	}};
`;

const MessageIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-top: 0.125rem;
`;

const MessageText = styled.div`
  flex: 1;
  line-height: 1.4;
`;

const FieldReference = styled.span`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: rgba(0, 0, 0, 0.1);
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-size: 0.75rem;
`;

const SummaryStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
`;

const StatValue = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const _EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-size: 0.875rem;
`;

export const RARValidationDisplay: React.FC<RARValidationDisplayProps> = ({
	authorizationDetails,
	grantedScopes = [],
	className,
	showScopeValidation = false,
}) => {
	const validation = useMemo(() => {
		const messages: ValidationMessage[] = [];

		// Basic validation
		const basicValidation = RARService.validateAuthorizationDetails(authorizationDetails);

		// Convert basic validation errors to messages
		basicValidation.errors.forEach((error) => {
			const match = error.match(/authorization_details\[(\d+)\]:(.*)/);
			if (match) {
				messages.push({
					level: 'error',
					message: match[2].trim(),
					detailIndex: parseInt(match[1], 10),
				});
			} else {
				messages.push({
					level: 'error',
					message: error,
				});
			}
		});

		// Scope compliance validation
		if (showScopeValidation && grantedScopes.length > 0) {
			const scopeValidation = RARService.validateScopeCompliance(
				authorizationDetails,
				grantedScopes
			);
			scopeValidation.errors.forEach((error) => {
				const match = error.match(/authorization_details\[(\d+)\]:(.*)/);
				if (match) {
					messages.push({
						level: 'warning',
						message: `Scope compliance: ${match[2].trim()}`,
						detailIndex: parseInt(match[1], 10),
					});
				} else {
					messages.push({
						level: 'warning',
						message: `Scope compliance: ${error}`,
					});
				}
			});
		}

		// Add success messages for valid details
		if (basicValidation.valid && authorizationDetails.length > 0) {
			authorizationDetails.forEach((detail, index) => {
				if (detail.type) {
					messages.push({
						level: 'success',
						message: `Authorization detail is properly structured`,
						detailIndex: index,
					});
				}
			});
		}

		// Add informational messages
		if (authorizationDetails.length === 0) {
			messages.push({
				level: 'info',
				message:
					'No authorization details defined. Add at least one authorization detail to proceed.',
			});
		} else {
			const types = [...new Set(authorizationDetails.map((d) => d.type).filter(Boolean))];
			messages.push({
				level: 'info',
				message: `Using ${types.length} authorization detail type(s): ${types.join(', ')}`,
			});
		}

		return {
			isValid: basicValidation.valid,
			messages,
			stats: {
				total: authorizationDetails.length,
				valid: authorizationDetails.filter(
					(_, index) => !messages.some((m) => m.level === 'error' && m.detailIndex === index)
				).length,
				errors: messages.filter((m) => m.level === 'error').length,
				warnings: messages.filter((m) => m.level === 'warning').length,
			},
		};
	}, [authorizationDetails, grantedScopes, showScopeValidation]);

	const getOverallLevel = (): ValidationLevel => {
		if (validation.stats.errors > 0) return 'error';
		if (validation.stats.warnings > 0) return 'warning';
		if (validation.stats.valid > 0) return 'success';
		return 'info';
	};

	const getHeaderIcon = (level: ValidationLevel) => {
		switch (level) {
			case 'success':
				return <FiCheckCircle size={20} />;
			case 'warning':
				return <FiAlertCircle size={20} />;
			case 'error':
				return <FiXCircle size={20} />;
			default:
				return <FiInfo size={20} />;
		}
	};

	const getMessageIcon = (level: ValidationLevel) => {
		switch (level) {
			case 'success':
				return <FiCheckCircle size={14} />;
			case 'warning':
				return <FiAlertCircle size={14} />;
			case 'error':
				return <FiXCircle size={14} />;
			default:
				return <FiInfo size={14} />;
		}
	};

	const getHeaderText = (level: ValidationLevel) => {
		switch (level) {
			case 'success':
				return {
					title: 'Authorization Details Valid',
					subtitle: 'All authorization details are properly structured and ready to use',
				};
			case 'warning':
				return {
					title: 'Validation Warnings',
					subtitle: 'Authorization details have warnings that should be reviewed',
				};
			case 'error':
				return {
					title: 'Validation Errors',
					subtitle: 'Authorization details have errors that must be fixed',
				};
			default:
				return {
					title: 'Authorization Details Status',
					subtitle: 'Review the validation results below',
				};
		}
	};

	const groupedMessages = useMemo(() => {
		const groups: Record<string, ValidationMessage[]> = {
			errors: validation.messages.filter((m) => m.level === 'error'),
			warnings: validation.messages.filter((m) => m.level === 'warning'),
			success: validation.messages.filter((m) => m.level === 'success'),
			info: validation.messages.filter((m) => m.level === 'info'),
		};
		return groups;
	}, [validation.messages]);

	if (authorizationDetails.length === 0) {
		return (
			<Container className={className}>
				<Header level="info">
					<HeaderIcon>{getHeaderIcon('info')}</HeaderIcon>
					<HeaderText>
						<HeaderTitle>No Authorization Details</HeaderTitle>
						<HeaderSubtitle>Add authorization details to see validation results</HeaderSubtitle>
					</HeaderText>
				</Header>
			</Container>
		);
	}

	const overallLevel = getOverallLevel();
	const headerText = getHeaderText(overallLevel);

	return (
		<Container className={className}>
			<Header level={overallLevel}>
				<HeaderIcon>{getHeaderIcon(overallLevel)}</HeaderIcon>
				<HeaderText>
					<HeaderTitle>{headerText.title}</HeaderTitle>
					<HeaderSubtitle>{headerText.subtitle}</HeaderSubtitle>
				</HeaderText>
			</Header>

			<Content>
				<SummaryStats>
					<StatItem>
						<StatValue>{validation.stats.total}</StatValue>
						<StatLabel>Total Details</StatLabel>
					</StatItem>
					<StatItem>
						<StatValue>{validation.stats.valid}</StatValue>
						<StatLabel>Valid</StatLabel>
					</StatItem>
					<StatItem>
						<StatValue>{validation.stats.errors}</StatValue>
						<StatLabel>Errors</StatLabel>
					</StatItem>
					<StatItem>
						<StatValue>{validation.stats.warnings}</StatValue>
						<StatLabel>Warnings</StatLabel>
					</StatItem>
				</SummaryStats>

				{groupedMessages.errors.length > 0 && (
					<ValidationSection>
						<SectionTitle>
							<FiXCircle size={16} />
							Errors ({groupedMessages.errors.length})
						</SectionTitle>
						<MessageList>
							{groupedMessages.errors.map((message, index) => (
								<ValidationMessage key={index} level="error">
									<MessageIcon>{getMessageIcon('error')}</MessageIcon>
									<MessageText>
										{message.detailIndex !== undefined && (
											<FieldReference>Detail {message.detailIndex + 1}</FieldReference>
										)}{' '}
										{message.message}
									</MessageText>
								</ValidationMessage>
							))}
						</MessageList>
					</ValidationSection>
				)}

				{groupedMessages.warnings.length > 0 && (
					<ValidationSection>
						<SectionTitle>
							<FiAlertCircle size={16} />
							Warnings ({groupedMessages.warnings.length})
						</SectionTitle>
						<MessageList>
							{groupedMessages.warnings.map((message, index) => (
								<ValidationMessage key={index} level="warning">
									<MessageIcon>{getMessageIcon('warning')}</MessageIcon>
									<MessageText>
										{message.detailIndex !== undefined && (
											<FieldReference>Detail {message.detailIndex + 1}</FieldReference>
										)}{' '}
										{message.message}
									</MessageText>
								</ValidationMessage>
							))}
						</MessageList>
					</ValidationSection>
				)}

				{showScopeValidation && (
					<ValidationSection>
						<SectionTitle>
							<FiShield size={16} />
							Scope Compliance
						</SectionTitle>
						<MessageList>
							<ValidationMessage level="info">
								<MessageIcon>{getMessageIcon('info')}</MessageIcon>
								<MessageText>
									Granted scopes:{' '}
									{grantedScopes.length > 0 ? grantedScopes.join(' ') : 'None specified'}
								</MessageText>
							</ValidationMessage>
						</MessageList>
					</ValidationSection>
				)}

				{groupedMessages.info.length > 0 && (
					<ValidationSection>
						<SectionTitle>
							<FiInfo size={16} />
							Information
						</SectionTitle>
						<MessageList>
							{groupedMessages.info.map((message, index) => (
								<ValidationMessage key={index} level="info">
									<MessageIcon>{getMessageIcon('info')}</MessageIcon>
									<MessageText>{message.message}</MessageText>
								</ValidationMessage>
							))}
						</MessageList>
					</ValidationSection>
				)}
			</Content>
		</Container>
	);
};

export default RARValidationDisplay;
