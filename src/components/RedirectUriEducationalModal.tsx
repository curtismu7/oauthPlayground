// src/components/RedirectUriEducationalModal.tsx
// Educational Modal Component - Displays redirect and logout URI information with educational context

import React, { useState } from 'react';
import styled from 'styled-components';
import { type FlowUriInfo, redirectUriService } from '../services/redirectUriService';
import { logger } from '../utils/logger';

interface RedirectUriEducationalModalProps {
	flowKey: string;
	isOpen: boolean;
	onClose: () => void;
}

const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 1rem;
`;

const ModalContent = styled.div`
	background: white;
	border-radius: 1rem;
	max-width: 800px;
	max-height: 80vh;
	width: 100%;
	overflow: hidden;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
	padding: 1.5rem;
	border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	background: linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE 0%, V9_COLORS.PRIMARY.BLUE_DARK 100%);
	color: white;
`;

const ModalTitle = styled.h2`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 700;
`;

const ModalBody = styled.div`
	padding: 1.5rem;
	max-height: 60vh;
	overflow-y: auto;
`;

const Section = styled.div`
	margin-bottom: 2rem;
	
	&:last-child {
		margin-bottom: 0;
	}
`;

const SectionTitle = styled.h3`
	margin: 0 0 1rem 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const FlowTypeBadge = styled.span<{ type: string }>`
	background: ${(props) => {
		switch (props.type) {
			case 'OAuth':
				return 'V9_COLORS.PRIMARY.GREEN_DARK';
			case 'OIDC':
				return 'V9_COLORS.PRIMARY.BLUE';
			case 'Hybrid':
				return '#8b5cf6';
			case 'Device Code':
				return 'V9_COLORS.PRIMARY.YELLOW';
			case 'Client Credentials':
				return 'V9_COLORS.PRIMARY.RED';
			default:
				return 'V9_COLORS.TEXT.GRAY_MEDIUM';
		}
	}};
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const UriCard = styled.div`
	background: V9_COLORS.BG.GRAY_LIGHT;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.75rem;
	padding: 1rem;
	margin-bottom: 1rem;

	&:last-child {
		margin-bottom: 0;
	}
`;

const UriHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.75rem;
`;

const UriValue = styled.code`
	background: V9_COLORS.TEXT.GRAY_DARK;
	color: V9_COLORS.PRIMARY.GREEN;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	word-break: break-all;
`;

const UriPurpose = styled.div`
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin-bottom: 0.25rem;
`;

const UriDescription = styled.div`
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	font-size: 0.875rem;
	margin-bottom: 1rem;
`;

const SecuritySection = styled.div`
	margin-bottom: 1rem;
`;

const SecurityTitle = styled.h4`
	margin: 0 0 0.5rem 0;
	font-size: 0.875rem;
	font-weight: 600;
	color: V9_COLORS.PRIMARY.RED_DARK;
	display: flex;
	align-items: center;
	gap: 0.25rem;
`;

const BestPracticesTitle = styled.h4`
	margin: 0 0 0.5rem 0;
	font-size: 0.875rem;
	font-weight: 600;
	color: V9_COLORS.PRIMARY.GREEN_DARK;
	display: flex;
	align-items: center;
	gap: 0.25rem;
`;

const List = styled.ul`
	margin: 0;
	padding-left: 1.5rem;
	color: #4b5563;
	font-size: 0.875rem;
	line-height: 1.5;

	li {
		margin-bottom: 0.25rem;
		
		&:last-child {
			margin-bottom: 0;
		}
	}
`;

const EducationalNotes = styled.div`
	background: V9_COLORS.BG.WARNING;
	border: 1px solid V9_COLORS.PRIMARY.YELLOW_LIGHT;
	border-radius: 0.5rem;
	padding: 1rem;
`;

const EducationalNotesTitle = styled.h4`
	margin: 0 0 0.75rem 0;
	font-size: 1rem;
	font-weight: 600;
	color: V9_COLORS.PRIMARY.YELLOW_DARK;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CloseButton = styled.button`
	background: rgba(255, 255, 255, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.3);
	color: white;
	padding: 0.5rem 1rem;
	border-radius: 0.5rem;
	cursor: pointer;
	font-weight: 600;
	transition: all 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.3);
	}
`;

const Icon = styled.span<{ color?: string }>`
	color: ${(props) => props.color || 'currentColor'};
`;

export const RedirectUriEducationalModal: React.FC<RedirectUriEducationalModalProps> = ({
	flowKey,
	isOpen,
	onClose,
}) => {
	const [flowInfo, setFlowInfo] = useState<FlowUriInfo | null>(null);
	const [loading, setLoading] = useState(true);

	React.useEffect(() => {
		if (isOpen && flowKey) {
			setLoading(true);
			const info = redirectUriService.getFlowUriInfo(flowKey);
			setFlowInfo(info);
			setLoading(false);

			logger.info('RedirectUriEducationalModal', `Loaded URI information for flow: ${flowKey}`);
		}
	}, [isOpen, flowKey]);

	if (!isOpen) {
		return null;
	}

	if (loading) {
		return (
			<ModalOverlay>
				<ModalContent>
					<ModalHeader>
						<ModalTitle>Loading URI Information...</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<div>Loading educational content...</div>
					</ModalBody>
				</ModalContent>
			</ModalOverlay>
		);
	}

	if (!flowInfo) {
		return (
			<ModalOverlay>
				<ModalContent>
					<ModalHeader>
						<ModalTitle>URI Information Not Found</ModalTitle>
						<CloseButton onClick={onClose}>Close</CloseButton>
					</ModalHeader>
					<ModalBody>
						<div>No URI information available for this flow.</div>
					</ModalBody>
				</ModalContent>
			</ModalOverlay>
		);
	}

	return (
		<ModalOverlay onClick={onClose}>
			<ModalContent onClick={(e) => e.stopPropagation()}>
				<ModalHeader>
					<ModalTitle>{flowInfo.flowName} - URI Guide</ModalTitle>
					<CloseButton onClick={onClose}>Close</CloseButton>
				</ModalHeader>
				<ModalBody>
					<Section>
						<SectionTitle>
							Flow Overview
							<FlowTypeBadge type={flowInfo.flowType}>{flowInfo.flowType}</FlowTypeBadge>
						</SectionTitle>
					</Section>

					{flowInfo.redirectUris.length > 0 && (
						<Section>
							<SectionTitle>
								<Icon color="V9_COLORS.PRIMARY.BLUE">🔗</Icon>
								Redirect URIs
							</SectionTitle>
							{flowInfo.redirectUris.map((uri, index) => (
								<UriCard key={`redirect-${index}`}>
									<UriHeader>
										<UriValue>{uri.uri}</UriValue>
									</UriHeader>
									<UriPurpose>{uri.purpose}</UriPurpose>
									<UriDescription>{uri.description}</UriDescription>

									{uri.securityConsiderations.length > 0 && (
										<SecuritySection>
											<SecurityTitle>
												<Icon color="V9_COLORS.PRIMARY.RED_DARK">⚠️</Icon>
												Security Considerations
											</SecurityTitle>
											<List>
												{uri.securityConsiderations.map((consideration, idx) => (
													<li key={idx}>{consideration}</li>
												))}
											</List>
										</SecuritySection>
									)}

									{uri.bestPractices.length > 0 && (
										<SecuritySection>
											<BestPracticesTitle>
												<Icon color="V9_COLORS.PRIMARY.GREEN_DARK">✅</Icon>
												Best Practices
											</BestPracticesTitle>
											<List>
												{uri.bestPractices.map((practice, idx) => (
													<li key={idx}>{practice}</li>
												))}
											</List>
										</SecuritySection>
									)}
								</UriCard>
							))}
						</Section>
					)}

					{flowInfo.logoutUris.length > 0 && (
						<Section>
							<SectionTitle>
								<Icon color="V9_COLORS.PRIMARY.RED">🚪</Icon>
								Logout URIs
							</SectionTitle>
							{flowInfo.logoutUris.map((uri, index) => (
								<UriCard key={`logout-${index}`}>
									<UriHeader>
										<UriValue>{uri.uri}</UriValue>
									</UriHeader>
									<UriPurpose>{uri.purpose}</UriPurpose>
									<UriDescription>{uri.description}</UriDescription>

									{uri.securityConsiderations.length > 0 && (
										<SecuritySection>
											<SecurityTitle>
												<Icon color="V9_COLORS.PRIMARY.RED_DARK">⚠️</Icon>
												Security Considerations
											</SecurityTitle>
											<List>
												{uri.securityConsiderations.map((consideration, idx) => (
													<li key={idx}>{consideration}</li>
												))}
											</List>
										</SecuritySection>
									)}

									{uri.bestPractices.length > 0 && (
										<SecuritySection>
											<BestPracticesTitle>
												<Icon color="V9_COLORS.PRIMARY.GREEN_DARK">✅</Icon>
												Best Practices
											</BestPracticesTitle>
											<List>
												{uri.bestPractices.map((practice, idx) => (
													<li key={idx}>{practice}</li>
												))}
											</List>
										</SecuritySection>
									)}
								</UriCard>
							))}
						</Section>
					)}

					{flowInfo.educationalNotes.length > 0 && (
						<Section>
							<EducationalNotes>
								<EducationalNotesTitle>
									<Icon color="V9_COLORS.PRIMARY.YELLOW_DARK">📚</Icon>
									Educational Notes
								</EducationalNotesTitle>
								<List>
									{flowInfo.educationalNotes.map((note, index) => (
										<li key={index}>{note}</li>
									))}
								</List>
							</EducationalNotes>
						</Section>
					)}
				</ModalBody>
			</ModalContent>
		</ModalOverlay>
	);
};
