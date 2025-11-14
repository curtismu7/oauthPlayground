// src/components/EnhancedFlowInfoCard.tsx - Enhanced flow information card with comprehensive details

import React, { useEffect, useState } from 'react';
import {
	FiChevronDown,
	FiExternalLink,
	FiInfo,
	FiServer,
	FiShield,
	FiUsers,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import { useUISettings } from '../contexts/UISettingsContext';
import { FlowInfoCardData, FlowInfoService } from '../services/FlowInfoService';

const CardContainer = styled.div<{ $colorScheme?: string; $fontSize?: string }>`
	background: ${({ $colorScheme }) => {
		switch ($colorScheme) {
			case 'blue':
				return 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)';
			case 'green':
				return 'linear-gradient(135deg, #10b981 0%, #34d399 100%)';
			case 'purple':
				return 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)';
			case 'orange':
				return 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)';
			case 'red':
				return 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)';
			default:
				return 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)';
		}
	}};
	border-radius: 12px;
	margin-bottom: 2rem;
	box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1);
	overflow: hidden;
	font-size: ${({ $fontSize }) => {
		switch ($fontSize) {
			case 'small':
				return '0.875rem';
			case 'large':
				return '1.125rem';
			default:
				return '1rem';
		}
	}};
`;

const CardHeaderButton = styled.button`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: transparent;
	border: none;
	padding: 1.5rem;
	cursor: pointer;
	transition: background 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
	}
`;

const CardHeaderContent = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`;

const CardHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	background: white;
	color: #3b82f6;
	padding: 0.5rem 1rem;
	border-radius: 20px;
	font-weight: 600;
	font-size: 0.875rem;
`;

const FlowIcon = styled.span`
	font-size: 1.2rem;
`;

const Badge = styled.span<{ $category: string }>`
	background: ${({ $category }) => {
		switch ($category) {
			case 'Standard':
				return '#10b981';
			case 'Experimental':
				return '#f59e0b';
			case 'Deprecated':
				return '#ef4444';
			case 'PingOne':
				return '#8b5cf6';
			default:
				return '#6b7280';
		}
	}};
	color: white;
	padding: 0.25rem 0.5rem;
	border-radius: 12px;
	font-size: 0.75rem;
	font-weight: 600;
	margin-left: 0.5rem;
`;

const ToggleIcon = styled.div<{ $isOpen: boolean }>`
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.2);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	transition: transform 0.2s ease;
	transform: ${({ $isOpen }) => ($isOpen ? 'rotate(0deg)' : 'rotate(-90deg)')};
	flex-shrink: 0;
`;

const CardContent = styled.div<{ $isOpen: boolean }>`
	max-height: ${({ $isOpen }) => ($isOpen ? '2000px' : '0')};
	overflow: hidden;
	transition: max-height 0.3s ease;
	padding: ${({ $isOpen }) => ($isOpen ? '0 1.5rem 1.5rem 1.5rem' : '0 1.5rem')};
`;

const InfoGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 1rem;
	margin-top: 1rem;
`;

const InfoSection = styled.div`
	background: rgba(255, 255, 255, 0.95);
	border-radius: 8px;
	padding: 1rem;
`;

const SectionTitle = styled.div`
	font-weight: 600;
	font-size: 0.75rem;
	text-transform: uppercase;
	color: #3b82f6;
	margin-bottom: 0.5rem;
	letter-spacing: 0.05em;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const SectionContent = styled.div`
	color: #1f2937;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const AdditionalInfoGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 0.75rem;
	margin-top: 1rem;
`;

const AdditionalInfoItem = styled.div`
	background: rgba(255, 255, 255, 0.9);
	border-radius: 6px;
	padding: 0.75rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const AdditionalInfoLabel = styled.span`
	font-size: 0.75rem;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const AdditionalInfoValue = styled.span`
	font-size: 0.875rem;
	color: #1f2937;
	font-weight: 500;
`;

const List = styled.ul`
	margin: 0;
	padding-left: 1.25rem;
`;

const ListItem = styled.li`
	margin-bottom: 0.25rem;
	color: #374151;
`;

const SecurityNote = styled.div<{ $type: 'success' | 'warning' | 'error' | 'info' }>`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
	
	&::before {
		content: ${({ $type }) => {
			switch ($type) {
				case 'success':
					return '"✅"';
				case 'warning':
					return '"⚠️"';
				case 'error':
					return '"❌"';
				case 'info':
					return '"ℹ️"';
				default:
					return '"ℹ️"';
			}
		}};
		flex-shrink: 0;
		font-size: 0.875rem;
	}
`;

const UseCaseItem = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
	
	&::before {
		content: '"✨"';
		flex-shrink: 0;
		font-size: 0.875rem;
	}
`;

const DocumentationLink = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	color: #3b82f6;
	text-decoration: none;
	font-size: 0.875rem;
	
	&:hover {
		text-decoration: underline;
	}
`;

interface EnhancedFlowInfoCardProps {
	flowType: string;
	showAdditionalInfo?: boolean;
	showDocumentation?: boolean;
	showCommonIssues?: boolean;
	showImplementationNotes?: boolean;
}

const EnhancedFlowInfoCard: React.FC<EnhancedFlowInfoCardProps> = ({
	flowType,
	showAdditionalInfo = true,
	showDocumentation = true,
	showCommonIssues = false,
	showImplementationNotes = false,
}) => {
	const { settings } = useUISettings();
	const [isOpen, setIsOpen] = useState(settings.collapsibleDefaultState === 'expanded');
	const [flowInfoCard, setFlowInfoCard] = useState<FlowInfoCardData | null>(null);

	useEffect(() => {
		const cardData = FlowInfoService.generateFlowInfoCard(flowType);
		setFlowInfoCard(cardData);
	}, [flowType]);

	useEffect(() => {
		const handleSettingsChange = (event: CustomEvent) => {
			if (event.detail?.collapsibleDefaultState) {
				setIsOpen(event.detail.collapsibleDefaultState === 'expanded');
			}
		};

		window.addEventListener('uiSettingsChanged', handleSettingsChange as EventListener);
		return () => {
			window.removeEventListener('uiSettingsChanged', handleSettingsChange as EventListener);
		};
	}, []);

	if (!flowInfoCard) {
		return null;
	}

	const getSecurityNoteType = (note: string): 'success' | 'warning' | 'error' | 'info' => {
		if (note.includes('✅')) return 'success';
		if (note.includes('⚠️')) return 'warning';
		if (note.includes('❌')) return 'error';
		return 'info';
	};

	return (
		<CardContainer $colorScheme={settings.colorScheme} $fontSize={settings.fontSize}>
			<CardHeaderButton onClick={() => setIsOpen(!isOpen)}>
				<CardHeaderContent>
					<CardHeader>
						<FlowIcon>{flowInfoCard.header.icon}</FlowIcon>
						{flowInfoCard.header.title}
						{flowInfoCard.header.badge && (
							<Badge $category={flowInfoCard.header.badge}>{flowInfoCard.header.badge}</Badge>
						)}
					</CardHeader>
				</CardHeaderContent>
				<ToggleIcon $isOpen={isOpen}>
					<FiChevronDown size={18} />
				</ToggleIcon>
			</CardHeaderButton>

			<CardContent $isOpen={isOpen}>
				<InfoGrid>
					<InfoSection>
						<SectionTitle>
							<FiZap size={14} />
							Tokens Returned
						</SectionTitle>
						<SectionContent>{flowInfoCard.keyDetails.tokensReturned}</SectionContent>
					</InfoSection>

					<InfoSection>
						<SectionTitle>
							<FiInfo size={14} />
							Purpose
						</SectionTitle>
						<SectionContent>{flowInfoCard.keyDetails.purpose}</SectionContent>
					</InfoSection>

					<InfoSection>
						<SectionTitle>
							<FiExternalLink size={14} />
							Spec Layer
						</SectionTitle>
						<SectionContent>{flowInfoCard.keyDetails.specLayer}</SectionContent>
					</InfoSection>

					<InfoSection>
						<SectionTitle>
							<FiShield size={14} />
							Nonce Requirement
						</SectionTitle>
						<SectionContent>{flowInfoCard.keyDetails.nonceRequirement}</SectionContent>
					</InfoSection>

					<InfoSection style={{ gridColumn: 'span 2' }}>
						<SectionTitle>
							<FiShield size={14} />
							Validation
						</SectionTitle>
						<SectionContent>{flowInfoCard.keyDetails.validation}</SectionContent>
					</InfoSection>

					{flowInfoCard.securityNotes && flowInfoCard.securityNotes.length > 0 && (
						<InfoSection style={{ gridColumn: '1 / -1' }}>
							<SectionTitle>
								<FiShield size={14} />
								Security Notes
							</SectionTitle>
							<SectionContent>
								{flowInfoCard.securityNotes.map((note, index) => (
									<SecurityNote key={index} $type={getSecurityNoteType(note)}>
										{note.replace(/[✅⚠️❌ℹ️]/g, '').trim()}
									</SecurityNote>
								))}
							</SectionContent>
						</InfoSection>
					)}

					{flowInfoCard.useCases && flowInfoCard.useCases.length > 0 && (
						<InfoSection style={{ gridColumn: '1 / -1' }}>
							<SectionTitle>
								<FiUsers size={14} />
								Best Use Cases
							</SectionTitle>
							<SectionContent>
								{flowInfoCard.useCases.map((useCase, index) => (
									<UseCaseItem key={index}>{useCase}</UseCaseItem>
								))}
							</SectionContent>
						</InfoSection>
					)}

					{showAdditionalInfo && flowInfoCard.additionalInfo && (
						<InfoSection style={{ gridColumn: '1 / -1' }}>
							<SectionTitle>
								<FiInfo size={14} />
								Additional Information
							</SectionTitle>
							<AdditionalInfoGrid>
								{flowInfoCard.additionalInfo.complexity && (
									<AdditionalInfoItem>
										<AdditionalInfoLabel>Complexity:</AdditionalInfoLabel>
										<AdditionalInfoValue>
											{flowInfoCard.additionalInfo.complexity}
										</AdditionalInfoValue>
									</AdditionalInfoItem>
								)}
								{flowInfoCard.additionalInfo.securityLevel && (
									<AdditionalInfoItem>
										<AdditionalInfoLabel>Security:</AdditionalInfoLabel>
										<AdditionalInfoValue>
											{flowInfoCard.additionalInfo.securityLevel}
										</AdditionalInfoValue>
									</AdditionalInfoItem>
								)}
								{flowInfoCard.additionalInfo.userInteraction && (
									<AdditionalInfoItem>
										<AdditionalInfoLabel>User Interaction:</AdditionalInfoLabel>
										<AdditionalInfoValue>
											{flowInfoCard.additionalInfo.userInteraction}
										</AdditionalInfoValue>
									</AdditionalInfoItem>
								)}
								{flowInfoCard.additionalInfo.backendRequired !== undefined && (
									<AdditionalInfoItem>
										<AdditionalInfoLabel>Backend Required:</AdditionalInfoLabel>
										<AdditionalInfoValue>
											{flowInfoCard.additionalInfo.backendRequired ? 'Yes' : 'No'}
										</AdditionalInfoValue>
									</AdditionalInfoItem>
								)}
							</AdditionalInfoGrid>
						</InfoSection>
					)}

					{showDocumentation && (
						<InfoSection style={{ gridColumn: '1 / -1' }}>
							<SectionTitle>
								<FiExternalLink size={14} />
								Documentation
							</SectionTitle>
							<SectionContent>
								{FlowInfoService.getDocumentationLinks(flowType).map((link, index) => (
									<div key={index} style={{ marginBottom: '0.5rem' }}>
										<DocumentationLink href={link.url} target="_blank" rel="noopener noreferrer">
											{link.title}
											<FiExternalLink size={12} />
										</DocumentationLink>
									</div>
								))}
							</SectionContent>
						</InfoSection>
					)}

					{showCommonIssues && (
						<InfoSection style={{ gridColumn: '1 / -1' }}>
							<SectionTitle>
								<FiInfo size={14} />
								Common Issues & Solutions
							</SectionTitle>
							<SectionContent>
								{FlowInfoService.getCommonIssues(flowType).map((issue, index) => (
									<div key={index} style={{ marginBottom: '1rem' }}>
										<div style={{ fontWeight: '600', color: '#ef4444', marginBottom: '0.25rem' }}>
											Issue: {issue.issue}
										</div>
										<div style={{ color: '#10b981' }}>Solution: {issue.solution}</div>
									</div>
								))}
							</SectionContent>
						</InfoSection>
					)}

					{showImplementationNotes && (
						<InfoSection style={{ gridColumn: '1 / -1' }}>
							<SectionTitle>
								<FiServer size={14} />
								Implementation Notes
							</SectionTitle>
							<SectionContent>
								<List>
									{FlowInfoService.getImplementationNotes(flowType).map((note, index) => (
										<ListItem key={index}>{note}</ListItem>
									))}
								</List>
							</SectionContent>
						</InfoSection>
					)}
				</InfoGrid>
			</CardContent>
		</CardContainer>
	);
};

export default EnhancedFlowInfoCard;
