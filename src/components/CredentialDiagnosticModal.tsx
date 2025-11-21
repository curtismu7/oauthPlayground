// src/components/CredentialDiagnosticModal.tsx
// Modal to show diagnostic information about credentials being sent

import React from 'react';
import { FiAlertTriangle, FiCheckCircle, FiX } from 'react-icons/fi';
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
	border-bottom: 1px solid #e5e7eb;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const Title = styled.h2`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: #111827;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	padding: 0.5rem;
	color: #6b7280;
	display: flex;
	align-items: center;
	transition: color 0.2s;
	
	&:hover {
		color: #111827;
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
	color: #374151;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.75rem;
`;

const DiagnosticCard = styled.div<{ $hasIssue: boolean }>`
	background: ${(props) => (props.$hasIssue ? '#fef2f2' : '#f0fdf4')};
	border: 1px solid ${(props) => (props.$hasIssue ? '#fecaca' : '#bbf7d0')};
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
	color: #111827;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const StatusIcon = styled.div<{ $hasIssue: boolean }>`
	color: ${(props) => (props.$hasIssue ? '#dc2626' : '#16a34a')};
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
	color: #6b7280;
	font-weight: 500;
`;

const DetailValue = styled.code`
	background: white;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-family: 'Courier New', monospace;
	font-size: 0.8rem;
	color: #111827;
`;

const WarningBox = styled.div`
	background: #fffbeb;
	border: 1px solid #fcd34d;
	border-radius: 8px;
	padding: 1rem;
	margin-bottom: 1.5rem;
	display: flex;
	gap: 0.75rem;
`;

const WarningIcon = styled.div`
	color: #f59e0b;
	flex-shrink: 0;
`;

const WarningContent = styled.div`
	flex: 1;
`;

const WarningTitle = styled.div`
	font-weight: 600;
	color: #92400e;
	margin-bottom: 0.25rem;
`;

const WarningMessage = styled.div`
	color: #78350f;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const RequestInfo = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
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
	color: #374151;
	min-width: 80px;
`;

const RequestValue = styled.span`
	color: #6b7280;
	font-family: 'Courier New', monospace;
`;

const Footer = styled.div`
	padding: 1rem 1.5rem;
	border-top: 1px solid #e5e7eb;
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
				background: #dc2626;
				color: white;
				&:hover {
					background: #b91c1c;
				}
			`;
		}
		if (props.$variant === 'primary') {
			return `
				background: #2563eb;
				color: white;
				&:hover {
					background: #1d4ed8;
				}
			`;
		}
		return `
			background: #f3f4f6;
			color: #374151;
			&:hover {
				background: #e5e7eb;
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
						<FiAlertTriangle size={24} color="#f59e0b" />
						Credential Diagnostic Report
					</Title>
					<CloseButton onClick={onClose}>
						<FiX size={24} />
					</CloseButton>
				</Header>

				<Content>
					{hasIssues && (
						<WarningBox>
							<WarningIcon>
								<FiAlertTriangle size={20} />
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
											<FiAlertTriangle size={20} />
										) : (
											<FiCheckCircle size={20} />
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
												color: diagnostic.isEmpty ? '#dc2626' : '#16a34a',
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
								<FiAlertTriangle size={20} />
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
