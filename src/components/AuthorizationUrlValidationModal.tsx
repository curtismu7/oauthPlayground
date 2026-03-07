import { FiAlertTriangle, FiCheckCircle, FiExternalLink, FiX } from '@icons';
import React from 'react';
import styled from 'styled-components';

interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	suggestions: string[];
	parsedUrl: URL | null;
	flowType: string;
	severity: string;
}

interface AuthorizationUrlValidationModalProps {
	isOpen: boolean;
	onClose: () => void;
	validationResult: ValidationResult | null;
	authUrl: string;
	onProceed: () => void;
	onFix: () => void;
}

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
	align-items: center;
	justify-content: center;
	z-index: 1000;
`;

const ModalContent = styled.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	max-width: 600px;
	width: 90%;
	max-height: 80vh;
	overflow-y: auto;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 1.5rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	cursor: pointer;
	padding: 0.25rem;
	border-radius: 0.375rem;
	
	&:hover {
		background: #f3f4f6;
		color: V9_COLORS.TEXT.GRAY_DARK;
	}
`;

const UrlDisplay = styled.div`
	background: #f8f9fa;
	border: 1px solid #e9ecef;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1.5rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	word-break: break-all;
	color: #495057;
`;

const ValidationSummary = styled.div<{ $isValid: boolean }>`
	padding: 1rem;
	border-radius: 0.5rem;
	margin-bottom: 1.5rem;
	background: ${(props) => (props.$isValid ? 'V9_COLORS.BG.SUCCESS' : 'V9_COLORS.BG.ERROR')};
	border: 1px solid ${(props) => (props.$isValid ? '#a7f3d0' : 'V9_COLORS.BG.ERROR_BORDER')};
	color: ${(props) => (props.$isValid ? 'V9_COLORS.PRIMARY.GREEN_DARK' : 'V9_COLORS.PRIMARY.RED_DARK')};
	font-weight: 500;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const IssuesList = styled.div`
	margin-bottom: 1.5rem;
`;

const IssuesTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin-bottom: 0.75rem;
`;

const IssueItem = styled.div<{ $isError: boolean }>`
	padding: 0.75rem;
	border-radius: 0.375rem;
	margin-bottom: 0.5rem;
	background: ${(props) => (props.$isError ? 'V9_COLORS.BG.ERROR' : 'V9_COLORS.BG.WARNING')};
	border-left: 4px solid ${(props) => (props.$isError ? 'V9_COLORS.PRIMARY.RED' : 'V9_COLORS.PRIMARY.YELLOW')};
	color: ${(props) => (props.$isError ? 'V9_COLORS.PRIMARY.RED_DARK' : 'V9_COLORS.PRIMARY.YELLOW_DARK')};
	font-size: 0.875rem;
`;

const ButtonRow = styled.div`
	display: flex;
	gap: 1rem;
	justify-content: flex-end;
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 500;
	font-size: 0.875rem;
	cursor: pointer;
	border: none;
	transition: all 0.2s;
	
	${(props) =>
		props.$variant === 'primary'
			? `
		background: V9_COLORS.PRIMARY.BLUE;
		color: white;
		
		&:hover {
			background: V9_COLORS.PRIMARY.BLUE_DARK;
		}
	`
			: `
		background: #f3f4f6;
		color: V9_COLORS.TEXT.GRAY_DARK;
		
		&:hover {
			background: V9_COLORS.TEXT.GRAY_LIGHTER;
		}
	`}
`;

const AuthorizationUrlValidationModal: React.FC<AuthorizationUrlValidationModalProps> = ({
	isOpen,
	onClose,
	validationResult,
	authUrl,
	onProceed,
	onFix,
}) => {
	if (!isOpen || !validationResult) return null;

	const hasErrors = validationResult.errors.length > 0;
	const hasWarnings = validationResult.warnings.length > 0;

	return (
		<ModalOverlay $isOpen={isOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>
						{hasErrors ? (
							<>
								<FiAlertTriangle style={{ color: 'V9_COLORS.PRIMARY.RED' }} />
								Authorization URL Issues
							</>
						) : (
							<>
								<FiCheckCircle style={{ color: 'V9_COLORS.PRIMARY.GREEN' }} />
								Authorization URL Validation
							</>
						)}
					</ModalTitle>
					<CloseButton onClick={onClose}>
						<FiX />
					</CloseButton>
				</ModalHeader>

				<UrlDisplay>
					<strong>Authorization URL:</strong>
					<br />
					{authUrl}
				</UrlDisplay>

				<ValidationSummary $isValid={validationResult.isValid}>
					{hasErrors ? (
						<>
							<FiAlertTriangle />
							{validationResult.errors.length} error
							{validationResult.errors.length !== 1 ? 's' : ''} found
						</>
					) : hasWarnings ? (
						<>
							<FiAlertTriangle />
							{validationResult.warnings.length} warning
							{validationResult.warnings.length !== 1 ? 's' : ''} found
						</>
					) : (
						<>
							<FiCheckCircle />
							URL validation passed
						</>
					)}
				</ValidationSummary>

				{(hasErrors || hasWarnings) && (
					<IssuesList>
						{hasErrors && (
							<div>
								<IssuesTitle style={{ color: 'V9_COLORS.PRIMARY.RED_DARK' }}>Errors:</IssuesTitle>
								{validationResult.errors.map((error, index) => (
									<IssueItem key={index} $isError={true}>
										{error}
									</IssueItem>
								))}
							</div>
						)}

						{hasWarnings && (
							<div>
								<IssuesTitle style={{ color: 'V9_COLORS.PRIMARY.YELLOW_DARK' }}>
									Warnings:
								</IssuesTitle>
								{validationResult.warnings.map((warning, index) => (
									<IssueItem key={index} $isError={false}>
										{warning}
									</IssueItem>
								))}
							</div>
						)}
					</IssuesList>
				)}

				<ButtonRow>
					<Button $variant="secondary" onClick={onFix}>
						Fix Issues
					</Button>
					<Button $variant="primary" onClick={onProceed}>
						<FiExternalLink style={{ marginRight: '0.5rem' }} />
						Proceed Anyway
					</Button>
				</ButtonRow>
			</ModalContent>
		</ModalOverlay>
	);
};

export default AuthorizationUrlValidationModal;
