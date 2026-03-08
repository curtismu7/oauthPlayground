// src/components/CredentialDiagnosticModal.tsx
// Modal to show diagnostic information about credentials being sent


import React from 'react';
import styled from 'styled-components';

interface CredentialDiagnostic {
	field: string;
	value: string;
	maskedValue: string;
	length: number;
	isEmpty: boolean;
	source: string;
}

interface CredentialDiagnosticModalProps {
	isOpen: boolean;
	onClose: () => void;
	onProceed: () => void;
	diagnostics: CredentialDiagnostic[];
	requestDetails: {
		endpoint: string;
		method: string;
	};
}

const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	backdrop-filter: blur(4px);
`;

const Modal = styled.div`
	background: white;
	border-radius: 12px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	max-width: 700px;
	width: 90%;
	max-height: 90vh;
	overflow-y: auto;
	position: relative;
`;

const Header = styled.div`
	padding: 1.5rem;
	border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const Title = styled.h2`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	padding: 0.5rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	display: flex;
	align-items: center;
	transition: color 0.2s;
	
	&:hover {
		color: V9_COLORS.TEXT.GRAY_DARK;
	}
`;

const Content = styled.div`
	padding: 1.5rem;
`;

const Section = styled.div`
	margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
	font-size: 0.875rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.75rem;
`;

const DiagnosticCard = styled.div<{ $hasIssue: boolean }>`
	background: ${(props) => (props.$hasIssue ? 'V9_COLORS.BG.ERROR' : '#f0fdf4')};
	border: 1px solid ${(props) => (props.$hasIssue ? 'V9_COLORS.BG.ERROR_BORDER' : 'V9_COLORS.BG.SUCCESS_BORDER')};
	border-radius: 8px;
	padding: 1rem;
	margin-bottom: 0.75rem;
`;

const DiagnosticHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.5rem;
`;

const FieldName = styled.div`
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const StatusIcon = styled.div<{ $hasIssue: boolean }>`
	color: ${(props) => (props.$hasIssue ? 'V9_COLORS.PRIMARY.RED_DARK' : 'V9_COLORS.PRIMARY.GREEN_DARK')};
	display: flex;
	align-items: center;
`;

const DiagnosticDetails = styled.div`
	display: grid;
	gap: 0.5rem;
	font-size: 0.875rem;
`;

const DetailRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const DetailLabel = styled.span`
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	font-weight: 500;
`;

const DetailValue = styled.code`
	background: white;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-family: 'Courier New', monospace;
	font-size: 0.8rem;
	color: V9_COLORS.TEXT.GRAY_DARK;
`;

const WarningBox = styled.div`
	background: V9_COLORS.BG.WARNING;
	border: 1px solid #fcd34d;
	border-radius: 8px;
	padding: 1rem;
	margin-bottom: 1.5rem;
	display: flex;
	gap: 0.75rem;
`;

const WarningIcon = styled.div`
	color: V9_COLORS.PRIMARY.YELLOW;
	flex-shrink: 0;
`;

const WarningContent = styled.div`
	flex: 1;
`;

const WarningTitle = styled.div`
	font-weight: 600;
	color: V9_COLORS.PRIMARY.YELLOW_DARK;
	margin-bottom: 0.25rem;
`;

const WarningMessage = styled.div`
	color: #78350f;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const RequestInfo = styled.div`
	background: #f9fafb;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 8px;
	padding: 1rem;
	margin-bottom: 1.5rem;
`;

const RequestDetail = styled.div`
	display: flex;
	gap: 0.5rem;
	font-size: 0.875rem;
	margin-bottom: 0.5rem;
	
	&:last-child {
		margin-bottom: 0;
	}
`;

const RequestLabel = styled.span`
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	min-width: 80px;
`;

const RequestValue = styled.span`
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	font-family: 'Courier New', monospace;
`;

const Footer = styled.div`
	padding: 1rem 1.5rem;
	border-top: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
	padding: 0.625rem 1.25rem;
	border-radius: 6px;
	font-weight: 500;
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s;
	border: none;
	
	${(props) => {
		if (props.$variant === 'danger') {
			return `
				background: V9_COLORS.PRIMARY.RED_DARK;
				color: white;
				&:hover {
					background: V9_COLORS.PRIMARY.RED_DARK;
				}
			`;
		}
		if (props.$variant === 'primary') {
			return `
				background: V9_COLORS.PRIMARY.BLUE_DARK;
				color: white;
				&:hover {
					background: V9_COLORS.PRIMARY.BLUE_DARK;
				}
			`;
		}
		return `
			background: #f3f4f6;
			color: V9_COLORS.TEXT.GRAY_DARK;
			&:hover {
				background: V9_COLORS.TEXT.GRAY_LIGHTER;
			}
		`;
	}}
`;

export const CredentialDiagnosticModal: React.FC<CredentialDiagnosticModalProps> = ({
	isOpen,
	onClose,
	onProceed,
	diagnostics,
	requestDetails,
}) => {
	if (!isOpen) return null;

	const hasIssues = diagnostics.some((d) => d.isEmpty);

	return (
		<Overlay onClick={onClose}>
			<Modal onClick={(e) => e.stopPropagation()}>
				<Header>
					<Title>
						<span style={{ fontSize: 24, color: 'V9_COLORS.PRIMARY.YELLOW' }}>⚠️</span>
						Credential Diagnostic Report
					</Title>
					<CloseButton onClick={onClose}>
						<span style={{ fontSize: '24px' }}>❌</span>
					</CloseButton>
				</Header>

				<Content>
					{hasIssues && (
						<WarningBox>
							<WarningIcon>
								<span style={{ fontSize: '20px' }}>⚠️</span>
							</WarningIcon>
							<WarningContent>
								<WarningTitle>⚠️ Empty Credentials Detected</WarningTitle>
								<WarningMessage>
									One or more required credentials are empty. This will likely cause authentication
									to fail. Please review the details below to identify which values are missing.
								</WarningMessage>
							</WarningContent>
						</WarningBox>
					)}

					<Section>
						<SectionTitle>Request Information</SectionTitle>
						<RequestInfo>
							<RequestDetail>
								<RequestLabel>Endpoint:</RequestLabel>
								<RequestValue>{requestDetails.endpoint}</RequestValue>
							</RequestDetail>
							<RequestDetail>
								<RequestLabel>Method:</RequestLabel>
								<RequestValue>{requestDetails.method}</RequestValue>
							</RequestDetail>
						</RequestInfo>
					</Section>

					<Section>
						<SectionTitle>Credential Details</SectionTitle>
						{diagnostics.map((diagnostic, index) => (
							<DiagnosticCard key={index} $hasIssue={diagnostic.isEmpty}>
								<DiagnosticHeader>
									<FieldName>{diagnostic.field}</FieldName>
									<StatusIcon $hasIssue={diagnostic.isEmpty}>
										{diagnostic.isEmpty ? (
											<span style={{ fontSize: '20px' }}>⚠️</span>
										) : (
											<span style={{ fontSize: '20px' }}>✅</span>
										)}
									</StatusIcon>
								</DiagnosticHeader>
								<DiagnosticDetails>
									<DetailRow>
										<DetailLabel>Value:</DetailLabel>
										<DetailValue>
											{diagnostic.isEmpty ? '(empty)' : diagnostic.maskedValue}
										</DetailValue>
									</DetailRow>
									<DetailRow>
										<DetailLabel>Length:</DetailLabel>
										<DetailValue>{diagnostic.length} characters</DetailValue>
									</DetailRow>
									<DetailRow>
										<DetailLabel>Source:</DetailLabel>
										<DetailValue>{diagnostic.source}</DetailValue>
									</DetailRow>
									<DetailRow>
										<DetailLabel>Status:</DetailLabel>
										<DetailValue
											style={{
												color: diagnostic.isEmpty
													? 'V9_COLORS.PRIMARY.RED_DARK'
													: 'V9_COLORS.PRIMARY.GREEN_DARK',
												fontWeight: 'bold',
											}}
										>
											{diagnostic.isEmpty ? '❌ EMPTY' : '✅ OK'}
										</DetailValue>
									</DetailRow>
								</DiagnosticDetails>
							</DiagnosticCard>
						))}
					</Section>

					{hasIssues && (
						<WarningBox>
							<WarningIcon>
								<span style={{ fontSize: '20px' }}>⚠️</span>
							</WarningIcon>
							<WarningContent>
								<WarningTitle>Recommended Actions:</WarningTitle>
								<WarningMessage>
									<ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0 }}>
										<li>Check that all fields on the form are filled in correctly</li>
										<li>Try clearing localStorage and re-entering credentials</li>
										<li>Verify credentials are not being overwritten by saved config</li>
										<li>Check browser console for additional error messages</li>
									</ul>
								</WarningMessage>
							</WarningContent>
						</WarningBox>
					)}
				</Content>

				<Footer>
					<Button $variant="secondary" onClick={onClose}>
						Cancel
					</Button>
					{hasIssues ? (
						<Button $variant="danger" onClick={onProceed}>
							Send Anyway (Will Likely Fail)
						</Button>
					) : (
						<Button $variant="primary" onClick={onProceed}>
							Looks Good, Proceed
						</Button>
					)}
				</Footer>
			</Modal>
		</Overlay>
	);
};
